import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

// --- KOMPONENTIT ---
import ElectricWave from './ElectricWave';
import PhotoCard from './PhotoCard'; 
import ConstellationHistory from './ConstellationHistory'; 
import Kaleidoscope from '../../components/WebGLBackground/Kaleidoscope';
import ChatOverlay from './ChatOverlay';
import PollTakeover from './PollTakeover';
import StatsTakeoverLogic from './components/StatsTakeover/StatsTakeoverLogic'; 
import FlashMissionOverlay from './FlashMissionOverlay'; 
import IntelTicker from './components/IntelTicker';

import './LiveWall.css';

// Optimoidaan komponentit
const MemoizedKaleidoscope = React.memo(Kaleidoscope);
const MemoizedElectricWave = React.memo(ElectricWave);
const MemoizedChatOverlay = React.memo(ChatOverlay);

function LiveWall() {
  const [queue, setQueue] = useState([]);       
  const [currentPost, setCurrentPost] = useState(null); 
  const [history, setHistory] = useState([]);   
  
  const [allCharacters, setAllCharacters] = useState([]); 
  const charactersRef = useRef([]); 
  const guestsRef = useRef([]);

  const [liveState, setLiveState] = useState({ 
    mode: 'FEED', 
    broadcast_message: '',
    history_window_minutes: 240 
  });
  const [activeFlash, setActiveFlash] = useState(null);

  const timerRef = useRef(null);
  const isTransitioning = useRef(false);

  // --- OPTIMOINTI: NOPEA RIKASTUS ---
  const enrichPostLocal = useCallback((post) => {
    if (!post.guest_id) {
      return { ...post, displayName: 'Anonyymi', authors: [{ name: 'Vieras', image: null }] };
    }

    try {
      const character = charactersRef.current.find(c => c.assigned_guest_id === post.guest_id);
      
      if (character) {
        return { 
          ...post, 
          displayName: character.name, 
          authors: [{ name: character.name, image: character.avatar_url, role: character.role }] 
        };
      }

      const guest = guestsRef.current.find(g => g.id === post.guest_id);
      const guestName = guest?.name || 'Vieras';
      
      return { 
        ...post, 
        displayName: guestName, 
        authors: [{ name: guestName, image: null }] 
      };

    } catch (err) {
      console.error("Local enrich error:", err);
      return post;
    }
  }, []);

  // --- 1. STAATTISEN DATAN ALUSTUS ---
  useEffect(() => {
    const fetchStaticData = async () => {
      const [charsRes, guestsRes, stateRes] = await Promise.all([
        supabase.from('characters').select('id, name, avatar_url, xp, role, assigned_guest_id'),
        supabase.from('guests').select('id, name'),
        supabase.from('live_state').select('*').eq('id', 1).maybeSingle()
      ]);

      if (charsRes.data) {
        setAllCharacters(charsRes.data);
        charactersRef.current = charsRes.data;
      }
      if (guestsRes.data) {
        guestsRef.current = guestsRes.data;
      }
      if (stateRes.data) {
        setLiveState(stateRes.data);
      }
      
      const { data: flash } = await supabase.from('flash_missions').select('*').eq('status', 'active').maybeSingle();
      if (flash) setActiveFlash(flash);
    };

    fetchStaticData();
  }, []);

  // --- 2. REAKTIIVINEN KUVIEN HAKU (KORJATTU) ---
  useEffect(() => {
    const fetchPosts = async () => {
      // KORJAUS: Odotetaan, että hahmot (allCharacters) on ladattu, ennen kuin haetaan kuvia.
      // Muuten enrichPostLocal ei löydä nimeä ja palauttaa "Vieras".
      if (!liveState || allCharacters.length === 0) return;

      const activeWindow = liveState.history_window_minutes !== undefined ? liveState.history_window_minutes : 240;
      let fetchedPosts = [];

      // SKENAARIO A: "ALL MODE" (0)
      if (activeWindow === 0) {
        const { data: allIds } = await supabase
          .from('live_posts')
          .select('id, created_at')
          .eq('is_deleted', false)
          .eq('is_visible', true)
          .neq('type', 'announcement')
          .order('created_at', { ascending: false });

        if (allIds && allIds.length > 0) {
            const newest5 = allIds.slice(0, 5);
            const rest = allIds.slice(5);
            const shuffledRest = rest.sort(() => 0.5 - Math.random()).slice(0, 25);
            const selectedIds = [...newest5, ...shuffledRest].map(item => item.id);

            const { data: fullData } = await supabase
                .from('live_posts')
                .select('*')
                .in('id', selectedIds)
                .order('created_at', { ascending: false }); 
            
            fetchedPosts = fullData || [];
        }

      } else {
        // SKENAARIO B: NORMAALI AIKARAJA
        const cutoffTime = new Date(Date.now() - activeWindow * 60000).toISOString();
        
        const { data } = await supabase
          .from('live_posts')
          .select('*')
          .eq('is_deleted', false)
          .eq('is_visible', true)
          .neq('type', 'announcement') 
          .gte('created_at', cutoffTime)
          .order('created_at', { ascending: false })
          .limit(60); 
        
        fetchedPosts = data || [];
      }

      // FALLBACK
      if (fetchedPosts.length === 0) {
         const { data: fallback } = await supabase
            .from('live_posts')
            .select('*')
            .eq('is_deleted', false)
            .eq('is_visible', true)
            .neq('type', 'announcement') 
            .order('created_at', { ascending: false })
            .limit(5);
         fetchedPosts = fallback || [];
      }

      if (fetchedPosts.length > 0) {
        const enriched = fetchedPosts.map(p => enrichPostLocal(p));
        setCurrentPost(prev => prev ? prev : enriched[0]);
        setHistory(enriched.slice(1)); 
      }
    };

    fetchPosts();

    // Lisätty 'allCharacters' riippuvuudeksi, jotta haku tapahtuu vasta kun hahmot on ladattu
  }, [liveState.history_window_minutes, allCharacters, enrichPostLocal]);

  // --- 3. SUBSCRIPTIONS ---
  useEffect(() => {
    const postSub = supabase.channel('lw-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_posts' }, async (payload) => {
        
        if (payload.new && payload.new.type === 'announcement') return;

        // INSERT
        if (payload.eventType === 'INSERT') {
           if (!payload.new.is_deleted && payload.new.is_visible) {
              const enriched = enrichPostLocal(payload.new);
              setQueue(prev => {
                if (prev.some(p => p.id === enriched.id)) return prev;
                const newQueue = [...prev, enriched];
                return newQueue.length > 15 ? newQueue.slice(-15) : newQueue; 
              });
           }
        }

        // UPDATE
        if (payload.eventType === 'UPDATE') {
          const shouldRemove = payload.new.is_deleted === true || payload.new.is_visible === false;
          const shouldAdd = !payload.new.is_deleted && payload.new.is_visible;

          if (shouldRemove) {
            setQueue(prev => prev.filter(p => p.id !== payload.new.id));
            setHistory(prev => prev.filter(p => p.id !== payload.new.id));
            setCurrentPost(prev => (prev && prev.id === payload.new.id) ? null : prev);
          } 
          
          if (shouldAdd) {
             const enriched = enrichPostLocal(payload.new);
             setQueue(prev => {
                const exists = prev.some(p => p.id === enriched.id);
                if (exists) return prev.map(p => p.id === enriched.id ? enriched : p);
                return [...prev, enriched]; 
             });
          }
        }
      }).subscribe();

    const stateSub = supabase.channel('lw-state')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_state', filter: 'id=eq.1' }, (payload) => {
        setLiveState(payload.new);
      }).subscribe();

    const flashSub = supabase.channel('lw-flash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_missions' }, (payload) => {
        if (payload.new.status === 'active') setActiveFlash(payload.new);
        else setActiveFlash(null);
      }).subscribe();

    return () => { 
      supabase.removeChannel(postSub); 
      supabase.removeChannel(stateSub); 
      supabase.removeChannel(flashSub); 
    };
  }, [enrichPostLocal]);

  // --- 4. SIIVOUS ---
  useEffect(() => {
    if (!liveState.history_window_minutes || liveState.history_window_minutes <= 0) return;

    const cleanupInterval = setInterval(() => {
        const windowMinutes = liveState.history_window_minutes;
        const cutoffMs = Date.now() - (windowMinutes * 60000);

        setHistory(prevHistory => {
            if (prevHistory.length <= 5) return prevHistory;

            const filtered = prevHistory.filter((post, index) => {
                const postTime = new Date(post.created_at).getTime();
                const isFresh = postTime > cutoffMs;
                return isFresh || index < 5; 
            });

            if (filtered.length !== prevHistory.length) {
                return filtered;
            }
            return prevHistory;
        });

    }, 30000);

    return () => clearInterval(cleanupInterval);
  }, [liveState.history_window_minutes]);

  // --- 5. KARUSELLI ---
  useEffect(() => {
    if (liveState.mode !== 'FEED' || activeFlash) return;

    const nextSlide = () => {
      if (isTransitioning.current) return;
      let nextPost = null;
      let isFromQueue = false;

      // 1. Jono
      if (queue.length > 0) {
        nextPost = queue[0];
        isFromQueue = true;
      } else if (history.length > 0) {
        // 2. Historia
        const candidates = history.filter(h => h.id !== currentPost?.id);
        if (candidates.length > 0) nextPost = candidates[Math.floor(Math.random() * candidates.length)];
      }

      if (nextPost) {
        isTransitioning.current = true;
        if (currentPost) {
          setHistory(prev => {
            const cleanPrev = prev.filter(p => p.id !== nextPost.id && p.id !== currentPost.id);
            const maxHistory = liveState.history_window_minutes === 0 ? 30 : 60;
            return [currentPost, ...cleanPrev].slice(0, maxHistory); 
          });
        }
        if (isFromQueue) {
          setQueue(prev => prev.slice(1));
        }
        setCurrentPost(nextPost);
        setTimeout(() => {
           isTransitioning.current = false;
        }, 1000); 
      }
    };

    const intervalTime = queue.length > 2 ? 5000 : 12000;
    
    timerRef.current = setInterval(nextSlide, intervalTime);
    return () => clearInterval(timerRef.current);
  }, [queue, history, currentPost, liveState, activeFlash]);

  return (
    <div className="jc-live-wall">
      <div className="jc-gl-background" style={{ zIndex: 0 }}>
        <MemoizedKaleidoscope />
      </div>
      
      <div style={{ pointerEvents: 'none', zIndex: 1 }}>
        <MemoizedElectricWave />
      </div>
      
      <div style={{
        opacity: (liveState.mode === 'FEED' && !activeFlash) ? 1 : 0, 
        transition: 'opacity 0.5s', 
        pointerEvents: 'none',
        zIndex: 10
      }}>
         <ConstellationHistory history={history.slice(0, 15)} /> 
         <div className="jc-stage-center">
            {currentPost && <PhotoCard key={currentPost.id} post={currentPost} />}
         </div>
      </div>

      <div className="jc-live-logo"><span>LIVE FEED</span></div>

      <div style={{position:'relative', zIndex:60}}>
        <MemoizedChatOverlay />
      </div>

      <StatsTakeoverLogic isActive={liveState.mode === 'STATS'} characters={allCharacters} />
      <PollTakeover />
      
      {liveState.broadcast_message && (
        <div className="jc-broadcast-ticker">
           <div className="jc-broadcast-text">{liveState.broadcast_message}</div>
        </div>
      )}

      <IntelTicker />
      <FlashMissionOverlay mission={activeFlash} />

      {liveState.mode === 'BLACKOUT' && (
        <div className="jc-layer-blackout">
           <div className="jc-live-logo" style={{position:'static', transform:'scale(1.5)'}}><h1>JC 50</h1><span>PAUSED</span></div>
        </div>
      )}
    </div>
  );
}

export default LiveWall;