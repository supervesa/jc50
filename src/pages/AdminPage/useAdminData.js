import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

export const useAdminData = () => {
  const [loading, setLoading] = useState(true);
  
  // ALUSTUS: Kaikki tilat alustetaan tyhjiksi, jotta UI ei kaadu 'undefined' virheisiin
  const [polls, setPolls] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [guests, setGuests] = useState([]);
  const [missions, setMissions] = useState([]); 
  const [activeFlash, setActiveFlash] = useState(null);
  const [flashCount, setFlashCount] = useState(0);
  const [characters, setCharacters] = useState([]);
  const [liveState, setLiveState] = useState({ mode: 'FEED', broadcast_message: '' });

  // Apufunktio Flash-laskurille
  const fetchFlashCount = useCallback(async (flashId) => {
    if (!flashId) return;
    const { count } = await supabase
      .from('flash_responses')
      .select('*', { count: 'exact', head: true })
      .eq('flash_id', flashId);
    setFlashCount(count || 0);
  }, []);

  // Pääasiallinen datahaku
  const fetchData = useCallback(async () => {
    try {
      // 1. Polls & Votes
      const { data: pollsData } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
      const { data: votesData } = await supabase.from('poll_votes').select('poll_id, option_index').limit(2000);
      
      // 2. Game Data (Guests & Characters)
      const { data: guestsData } = await supabase.from('guests').select('id, name').order('name');
      const { data: charsData } = await supabase.from('characters').select('*').order('name');
      
      // 3. Missions (Varovainen haku: jos taulua ei ole, ei kaaduta)
      const { data: missionData, error: missionError } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
      if (missionError) {
        console.warn("Missions table missing or error, defaulting to empty.", missionError.message);
      }

      // 4. Active Flash Mission
      const { data: flashData } = await supabase.from('flash_missions').select('*').eq('status', 'active').maybeSingle();

      // 5. Live State
      const { data: sData } = await supabase.from('live_state').select('*').eq('id', 1).maybeSingle();

      // --- STATE UPDATES ---
      if (pollsData) setPolls(pollsData);
      if (guestsData) setGuests(guestsData);
      if (charsData) setCharacters(charsData);
      
      // Varmistetaan että missions on aina array
      setMissions(missionData || []);
      
      if (sData) setLiveState(sData);
      
      if (flashData) {
        setActiveFlash(flashData);
        fetchFlashCount(flashData.id);
      } else {
        setActiveFlash(null);
        setFlashCount(0);
      }

      if (votesData) {
        const counts = {};
        votesData.forEach(vote => {
          if (!counts[vote.poll_id]) counts[vote.poll_id] = {};
          const idx = vote.option_index;
          counts[vote.poll_id][idx] = (counts[vote.poll_id][idx] || 0) + 1;
        });
        setVoteCounts(counts);
      }

    } catch (error) {
      console.error("Critical Admin data error:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchFlashCount]);

  // Realtime Subscriptions
  useEffect(() => {
    fetchData();

    // Kuunnellaan kaikkia tarvittavia tauluja
    const channels = [
      supabase.channel('adm_polls').on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, fetchData),
      supabase.channel('adm_votes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_votes' }, fetchData),
      supabase.channel('adm_flash').on('postgres_changes', { event: '*', schema: 'public', table: 'flash_missions' }, fetchData),
      supabase.channel('adm_guests').on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchData),
      supabase.channel('adm_chars').on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, fetchData),
      supabase.channel('adm_state').on('postgres_changes', { event: '*', schema: 'public', table: 'live_state' }, fetchData),
      // Missions-taulun kuuntelu (jos olemassa)
      supabase.channel('adm_missions').on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, fetchData),
      
      supabase.channel('adm_flash_resp').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flash_responses' }, () => {
        if(activeFlash) fetchFlashCount(activeFlash.id);
      })
    ];

    channels.forEach(ch => ch.subscribe());

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [fetchData, activeFlash, fetchFlashCount]);

  // --- ACTIONS ---

  const setLiveMode = async (mode) => {
    await supabase.from('live_state').upsert({ id: 1, mode });
    setLiveState(prev => ({ ...prev, mode }));
  };

  const setBroadcast = async (message) => {
    await supabase.from('live_state').upsert({ id: 1, broadcast_message: message });
    setLiveState(prev => ({ ...prev, broadcast_message: message }));
  };

  const startFlash = async (type, title, xp) => {
    await supabase.from('flash_missions').update({ status: 'ended', end_time: new Date() }).eq('status', 'active');
    const { data } = await supabase.from('flash_missions').insert({ type, title, xp_reward: xp, status: 'active' }).select().single();
    setActiveFlash(data);
  };

  const stopFlash = async () => {
    await supabase.from('flash_missions').update({ status: 'ended', end_time: new Date() }).eq('status', 'active');
    setActiveFlash(null);
  };

  const clearChat = async () => { 
    if (!confirm("Tyhjennetäänkö chat?")) return;
    await supabase.from('chat_messages').delete().neq('id', 0); 
    alert("Chat tyhjennetty.");
  };

  // Palautus
  return {
    loading,
    polls, voteCounts,
    guests, characters, missions,
    activeFlash, flashCount,
    liveState,
    setLiveMode, setBroadcast,
    startFlash, stopFlash,
    clearChat
  };
};