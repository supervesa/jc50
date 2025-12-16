import React, { useEffect, useState, useRef } from 'react';
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

// --- TYYLIT ---
import './LiveWall.css';

function LiveWall() {
  // --- TILA (STATE) ---
  const [queue, setQueue] = useState([]);       
  const [currentPost, setCurrentPost] = useState(null); 
  const [history, setHistory] = useState([]);   
  const [allCharacters, setAllCharacters] = useState([]); 
  
  // OHJAUSTILAT
  const [liveState, setLiveState] = useState({ mode: 'FEED', broadcast_message: '' });
  const [activeFlash, setActiveFlash] = useState(null);

  const timerRef = useRef(null);
  const isTransitioning = useRef(false);

  // --- APUFUNKTIO: ENRICH POSTS ---
  // Tämä funktio hakee nimet ja avatarit. On tärkeää että tämä on tässä.
  const enrichPosts = async (posts) => {
    const enriched = await Promise.all(posts.map(async (post) => {
      // 1. Jos ei guest_id:tä (anonyymi)
      if (!post.guest_id) {
        return { 
          ...post, 
          displayName: 'Anonyymi', 
          authors: [{ name: 'Vieras', image: null }]
        };
      }

      try {
        // 2. Haetaan hahmot
        const { data: characters } = await supabase
          .from('characters')
          .select('name, role, avatar_url')
          .eq('assigned_guest_id', post.guest_id);

        if (characters && characters.length > 0) {
          const authors = characters.map(c => ({
            name: c.name,
            image: c.avatar_url,
            role: c.role
          }));
          const combinedNames = characters.map(c => c.name).join(' & ');

          return { 
            ...post, 
            displayName: combinedNames, 
            authors: authors 
          };
        }

        // 3. Fallback: Guests-taulu
        const { data: guestData } = await supabase
            .from('guests')
            .select('name')
            .eq('id', post.guest_id)
            .single();

        return { 
            ...post, 
            displayName: guestData?.name || 'Vieras', 
            authors: [{ name: guestData?.name || 'Vieras', image: null }] 
        };

      } catch (err) {
        console.error("Enrich error:", err);
        return post;
      }
    }));
    return enriched;
  };

  // --- 1. ALUSTUS ---
  useEffect(() => {
    const fetchInitialData = async () => {
      // Hahmot
      const { data: chars } = await supabase.from('characters').select('id, name, avatar_url, xp, role');
      if (chars) setAllCharacters(chars);

      // Kuvat (Historiaan 20 kuvaa)
      const { data: posts } = await supabase.from('live_posts').select('*').order('created_at', { ascending: false }).limit(20);
      if (posts && posts.length > 0) {
        const enriched = await enrichPosts(posts);
        setCurrentPost(enriched[0]);
        setHistory(enriched.slice(1, 16)); 
      }

      // Live State
      const { data: state } = await supabase.from('live_state').select('*').eq('id', 1).maybeSingle();
      if (state) setLiveState(state);

      // Flash Mission
      const { data: flash } = await supabase.from('flash_missions').select('*').eq('status', 'active').maybeSingle();
      if (flash) setActiveFlash(flash);
    };
    fetchInitialData();
  }, []);

  // --- 2. SUBSCRIPTIONS ---
  useEffect(() => {
    // A. Kuvat
    const postSub = supabase.channel('lw-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_posts' }, async (payload) => {
        const [enriched] = await enrichPosts([payload.new]);
        setQueue(prev => prev.some(p => p.id === enriched.id) ? prev : [...prev, enriched]);
      }).subscribe();

    // B. Live State
    const stateSub = supabase.channel('lw-state')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_state', filter: 'id=eq.1' }, (payload) => {
        setLiveState(payload.new);
      }).subscribe();

    // C. Flash Missions
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
  }, []);

  // --- 3. KARUSELLI ---
  useEffect(() => {
    if (liveState.mode !== 'FEED' || activeFlash) return;

    const nextSlide = () => {
      if (isTransitioning.current) return;
      let nextPost = null;
      let isFromQueue = false;

      if (queue.length > 0) {
        nextPost = queue[0];
        isFromQueue = true;
      } else if (history.length > 0) {
        const candidates = history.filter(h => h.id !== currentPost?.id);
        if (candidates.length > 0) nextPost = candidates[Math.floor(Math.random() * candidates.length)];
      }

      if (nextPost) {
        isTransitioning.current = true;
        if (currentPost) {
          setHistory(prev => {
            const cleanPrev = prev.filter(p => p.id !== nextPost.id && p.id !== currentPost.id);
            return [currentPost, ...cleanPrev].slice(0, 15);
          });
        }
        if (isFromQueue) setQueue(prev => prev.slice(1));
        setCurrentPost(nextPost);
        setTimeout(() => isTransitioning.current = false, 1000); 
      }
    };
    const interval = queue.length > 0 ? 5000 : 10000;
    timerRef.current = setInterval(nextSlide, interval);
    return () => clearInterval(timerRef.current);
  }, [queue, history, currentPost, liveState, activeFlash]);

  // --- RENDERÖINTI ---
  return (
    <div className="jc-live-wall">
      <div className="jc-gl-background" style={{ zIndex: 0 }}><Kaleidoscope /></div>
      <ElectricWave />
      
      {/* 1. FEED + KAAOS (Vain FEED-tilassa) */}
      <div style={{opacity: (liveState.mode === 'FEED' && !activeFlash) ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: 'none'}}>
         <ConstellationHistory history={history} />
         <div className="jc-stage-center">
            {currentPost && <PhotoCard post={currentPost} />}
         </div>
      </div>

      <div className="jc-live-logo"><h1>JC 50</h1><span>LIVE FEED</span></div>

      {/* 2. CHAT */}
      <div style={{position:'relative', zIndex:60}}><ChatOverlay /></div>

      {/* 3. OVERLAYS */}
      <StatsTakeoverLogic isActive={liveState.mode === 'STATS'} characters={allCharacters} />
      <PollTakeover />
      
      {liveState.broadcast_message && (
        <div className="jc-broadcast-ticker">
           <div className="jc-broadcast-text">{liveState.broadcast_message}</div>
        </div>
      )}

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