import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

export const useAdminData = () => {
  const [loading, setLoading] = useState(true);
  
  // State
  const [polls, setPolls] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [guests, setGuests] = useState([]);
  const [missions, setMissions] = useState([]);
  const [activeFlash, setActiveFlash] = useState(null);
  const [flashCount, setFlashCount] = useState(0);
  const [characters, setCharacters] = useState([]);

  // Apufunktio Flash-laskurille
  const fetchFlashCount = useCallback(async (flashId) => {
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
      
      // 2. Game Data
      const { data: guestsData } = await supabase.from('guests').select('id, name').order('name');
      const { data: charsData } = await supabase.from('characters').select('*').order('name');
      
      // 3. Missions
      const { data: missionData } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
      const { data: flashData } = await supabase.from('flash_missions').select('*').eq('status', 'active').maybeSingle();

      // Päivitetään tilat
      if (pollsData) setPolls(pollsData);
      if (guestsData) setGuests(guestsData);
      if (charsData) setCharacters(charsData);
      if (missionData) setMissions(missionData);
      
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
      console.error("Admin data error:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchFlashCount]);

  // Realtime
  useEffect(() => {
    fetchData();

    const subs = [
      supabase.channel('adm_polls').on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, fetchData).subscribe(),
      supabase.channel('adm_votes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_votes' }, fetchData).subscribe(),
      supabase.channel('adm_flash').on('postgres_changes', { event: '*', schema: 'public', table: 'flash_missions' }, fetchData).subscribe(),
      supabase.channel('adm_guests').on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchData).subscribe(),
      supabase.channel('adm_chars').on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, fetchData).subscribe(),
      supabase.channel('adm_missions').on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, fetchData).subscribe(),
      
      supabase.channel('adm_flash_resp').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flash_responses' }, () => {
        if(activeFlash) fetchFlashCount(activeFlash.id);
      }).subscribe()
    ];

    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [fetchData, activeFlash, fetchFlashCount]);

  // Chat toiminto
  const clearChat = async () => { 
    if (!confirm("Tyhjennetäänkö chat?")) return;
    const { error } = await supabase.from('chat_messages').delete().lt('created_at', new Date().toISOString()); 
    if (error) alert("Virhe: " + error.message);
    else alert("Chat tyhjennetty.");
  };

  // Palautetaan kaikki mitä UI tarvitsee
  return {
    loading,
    polls,
    voteCounts,
    guests,
    characters,
    missions,
    activeFlash,
    flashCount,
    clearChat
  };
};