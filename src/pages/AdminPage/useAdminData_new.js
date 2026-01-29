import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

export const useAdminData = () => {
  const [loading, setLoading] = useState(true);
  
  // --- TILAT (Säilytetty alkuperäiset) ---
  const [polls, setPolls] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [guests, setGuests] = useState([]);
  const [missions, setMissions] = useState([]); 
  const [activeFlash, setActiveFlash] = useState(null);
  const [flashCount, setFlashCount] = useState(0);
  const [characters, setCharacters] = useState([]);
  const [liveState, setLiveState] = useState({ mode: 'FEED', broadcast_message: '' });

  // --- REFS (UUSI: Estää turhat renderöinnit/kaiut) ---
  const liveStateRef = useRef(liveState);
  const activeFlashRef = useRef(activeFlash);

  // Pidetään refit ajan tasalla
  useEffect(() => { liveStateRef.current = liveState; }, [liveState]);
  useEffect(() => { activeFlashRef.current = activeFlash; }, [activeFlash]);

  // --- 1. DATA HAKU (OPTIMOITU & PILKOTTU) ---

  // A. Perusdata (Haetaan harvoin / alussa)
  const fetchStaticData = useCallback(async () => {
    const [p, g, c, m] = await Promise.all([
      supabase.from('polls').select('*').order('created_at', { ascending: false }),
      supabase.from('guests').select('id, name').order('name'),
      supabase.from('characters').select('*').order('name'),
      supabase.from('missions').select('*').order('created_at', { ascending: false })
    ]);

    if (p.data) setPolls(p.data);
    if (g.data) setGuests(g.data);
    if (c.data) setCharacters(c.data);
    
    // Alkuperäinen virheenkäsittely logiikka säilytetty
    if (m.error) console.warn("Missions table error:", m.error.message);
    setMissions(m.data || []);
  }, []);

  // B. Live-tila ja Aktiivinen Flash (Haetaan tilan muuttuessa)
  const fetchLiveState = useCallback(async () => {
    const { data: sData } = await supabase.from('live_state').select('*').eq('id', 1).maybeSingle();
    const { data: fData } = await supabase.from('flash_missions').select('*').eq('status', 'active').maybeSingle();
    
    if (sData) setLiveState(sData);
    
    if (fData) {
      setActiveFlash(fData);
    } else {
      setActiveFlash(null);
      setFlashCount(0);
    }
  }, []);

  // C. Laskurit (Haetaan SQL-näkymistä -> NOPEA)
  const fetchCounts = useCallback(async () => {
    // 1. Äänet View'stä
    const { data: votesData } = await supabase.from('view_poll_results').select('*');
    const counts = {};
    if (votesData) {
      votesData.forEach(row => {
        if (!counts[row.poll_id]) counts[row.poll_id] = {};
        counts[row.poll_id][row.option_index] = row.vote_count;
      });
    }
    setVoteCounts(counts);

    // 2. Flash View'stä
    const { data: flashData } = await supabase.from('view_flash_counts').select('*');
    if (activeFlashRef.current) {
        const currentCount = flashData?.find(r => r.flash_id === activeFlashRef.current.id)?.response_count || 0;
        setFlashCount(currentCount);
    } else {
        setFlashCount(0);
    }
  }, []);

  // --- 2. INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchStaticData(), fetchLiveState(), fetchCounts()]);
      } catch (e) {
        console.error("Critical Admin data error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchStaticData, fetchLiveState, fetchCounts]);

  // --- 3. REALTIME SUBSCRIPTIONS (OPTIMOITU) ---
  useEffect(() => {
    const channels = supabase.channel('admin_optimized_sub')
      
      // 1. LIVE STATE (KAIUN ESTO)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_state' }, (payload) => {
        const incoming = payload.new;
        const current = liveStateRef.current;
        // Jos data on sama kuin meillä jo on (optimistisen päivityksen takia), ei tehdä mitään.
        if (current && incoming.mode === current.mode && incoming.broadcast_message === current.broadcast_message) return; 
        setLiveState(incoming);
      })

      // 2. POLLS (Päivitetään lista heti kun status muuttuu - "Play"-nappi reagoi)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, (payload) => {
         if (payload.eventType === 'INSERT') {
            setPolls(prev => [payload.new, ...prev]);
         } else if (payload.eventType === 'UPDATE') {
            setPolls(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
         } else {
            fetchStaticData(); // DELETE tai muu
         }
      })

      // 3. FLASH STATE
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_missions' }, () => {
         fetchLiveState(); 
      })

      // 4. LASKURIT (Kuunnellaan INSERT-tapahtumia ja haetaan kevyet View-datat)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_votes' }, () => fetchCounts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flash_responses' }, () => fetchCounts())

      // 5. MUUT STAATTISET (Harvinaiset muutokset)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => fetchStaticData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, () => fetchStaticData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, () => fetchStaticData())

      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, [fetchStaticData, fetchLiveState, fetchCounts]);


  // --- 4. ACTIONS (OPTIMOITU: Optimistic Updates) ---

  const setLiveMode = async (mode) => {
    // Optimistinen päivitys
    setLiveState(prev => ({ ...prev, mode }));
    await supabase.from('live_state').upsert({ id: 1, mode });
  };

  const setBroadcast = async (message) => {
    // Optimistinen päivitys
    setLiveState(prev => ({ ...prev, broadcast_message: message }));
    await supabase.from('live_state').upsert({ id: 1, broadcast_message: message });
  };

  const togglePollStatus = async (pollId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    // Optimistinen päivitys listaan
    setPolls(prev => prev.map(p => p.id === pollId ? { ...p, status: newStatus } : p));
    await supabase.from('polls').update({ status: newStatus }).eq('id', pollId);
  };

  const startFlash = async (type, title, xp) => {
    // Lopetetaan vanhat
    await supabase.from('flash_missions').update({ status: 'ended', end_time: new Date() }).eq('status', 'active');
    
    // Luodaan uusi
    const { data } = await supabase.from('flash_missions').insert({ type, title, xp_reward: xp, status: 'active' }).select().single();
    if (data) {
        setActiveFlash(data);
        setFlashCount(0);
    }
  };

  const stopFlash = async () => {
    if (activeFlash) {
        // Optimistinen nollaus
        const oldId = activeFlash.id;
        setActiveFlash(null);
        setFlashCount(0);
        await supabase.from('flash_missions').update({ status: 'ended', end_time: new Date() }).eq('id', oldId);
    } else {
        // Fallback alkuperäiseen logiikkaan varmuuden vuoksi
        await supabase.from('flash_missions').update({ status: 'ended', end_time: new Date() }).eq('status', 'active');
    }
  };

  const clearChat = async () => { 
    if (!confirm("Tyhjennetäänkö chat?")) return;
    await supabase.from('chat_messages').delete().neq('id', 0); 
    alert("Chat tyhjennetty."); // Alkuperäinen alert säilytetty
  };

  return {
    loading,
    polls, voteCounts,
    guests, characters, missions,
    activeFlash, flashCount,
    liveState,
    setLiveMode, setBroadcast,
    startFlash, stopFlash,
    clearChat,
    togglePollStatus // Lisätty helper UI:ta varten
  };
};