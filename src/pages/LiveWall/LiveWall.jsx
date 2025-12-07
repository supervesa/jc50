import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ElectricWave from './ElectricWave';
import PhotoCard from './PhotoCard';
import Kaleidoscope from '../../components/WebGLBackground/Kaleidoscope';
import ChatOverlay from './ChatOverlay';
import PollTakeover from './PollTakeover';
import StatsTakeoverLogic from './components/StatsTakeover/StatsTakeoverLogic'; 
import './LiveWall.css';

function LiveWall() {
  const [queue, setQueue] = useState([]);       
  const [currentPost, setCurrentPost] = useState(null); 
  const [history, setHistory] = useState([]);   
  
  // UUSI: Tila kaikille hahmoille (avatar-hakua varten)
  const [allCharacters, setAllCharacters] = useState([]); 

  const [showStats, setShowStats] = useState(false); 

  const timerRef = useRef(null);
  const isTransitioning = useRef(false);

  // --- PIKANÄPPÄIN 'S' ---
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === 's') {
        console.log("S-painettu, vaihdetaan stats tilaa");
        setShowStats(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // --- UUSI: HAE KAIKKI HAHMOT (AVATARIEN TAKIA) ---
  useEffect(() => {
    const fetchAllCharacters = async () => {
      // Haetaan vain tarvittavat kentät keveyden vuoksi
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, avatar_url');
      
      if (data) {
        setAllCharacters(data);
      } else if (error) {
        console.error("Virhe hahmojen haussa:", error);
      }
    };
    fetchAllCharacters();
  }, []);

  // --- ENRICH POSTS (Tämä pysyy samana) ---
  const enrichPosts = async (posts) => {
    // ... (tämä koodi pysyy ennallaan) ...
    const enriched = await Promise.all(posts.map(async (post) => {
      if (!post.guest_id) {
        return { ...post, displayName: 'Anonyymi', displayRole: 'Vieras', avatarUrls: [] };
      }
      try {
        const { data: characters } = await supabase
          .from('characters')
          .select('name, role, avatar_url')
          .eq('assigned_guest_id', post.guest_id);

        if (characters && characters.length > 0) {
          const combinedNames = characters.map(c => c.name).join(' & ');
          const uniqueRoles = [...new Set(characters.map(c => c.role))];
          const combinedRoles = uniqueRoles.join(' / ');
          const avatarUrls = characters.map(c => c.avatar_url).filter(url => url);
          return { ...post, displayName: combinedNames, displayRole: combinedRoles, avatarUrls: avatarUrls };
        }
        const { data: guestData } = await supabase.from('guests').select('name').eq('id', post.guest_id).single();
        return { ...post, displayName: guestData?.name || 'Vieras', displayRole: 'Vieras', avatarUrls: [] };
      } catch (err) {
        console.error("Virhe:", err);
        return post;
      }
    }));
    return enriched;
  };

  // --- ALUSTUS ---
  useEffect(() => {
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('live_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const enriched = await enrichPosts(data);
        setCurrentPost(enriched[0]);
        setHistory(enriched.slice(1, 6)); 
      }
    };
    fetchInitial();
  }, []);

  // --- REALTIME ---
  useEffect(() => {
    // ... (tämä koodi pysyy ennallaan) ...
    const channel = supabase.channel('live-wall')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_posts' }, async (payload) => {
          const [enrichedPost] = await enrichPosts([payload.new]);
          setQueue((prev) => {
            if (prev.some(p => p.id === enrichedPost.id)) return prev;
            return [...prev, enrichedPost];
          });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- LOOP ---
  useEffect(() => {
    if (showStats) return;
    // ... (karuselli-logiikka pysyy ennallaan) ...
    const nextSlide = () => {
      if (isTransitioning.current) return;
      let nextPost = null;
      let isFromQueue = false;
      if (queue.length > 0) {
        nextPost = queue[0];
        isFromQueue = true;
      } else if (history.length > 0) {
        const candidates = history.filter(h => h.id !== currentPost?.id);
        if (candidates.length > 0) {
          nextPost = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }
      if (nextPost) {
        isTransitioning.current = true;
        if (currentPost) {
          setHistory(prev => {
            const cleanPrev = prev.filter(p => p.id !== nextPost.id && p.id !== currentPost.id);
            return [currentPost, ...cleanPrev].slice(0, 10);
          });
        }
        if (isFromQueue) setQueue(prev => prev.slice(1));
        setCurrentPost(nextPost);
        setTimeout(() => isTransitioning.current = false, 1000); 
      }
    };
    const intervalTime = queue.length > 0 ? 5000 : 10000;
    timerRef.current = setInterval(nextSlide, intervalTime);
    return () => clearInterval(timerRef.current);
  }, [queue, history, currentPost, showStats]);

  return (
    <div className="jc-live-wall">
      <div className="jc-gl-background"><Kaleidoscope /></div>
      <ElectricWave />
      <ChatOverlay />
      <PollTakeover />

      {/* 4. STATS TAKEOVER */}
      {/* UUSI: Välitetään characters-lista propseina */}
      <StatsTakeoverLogic 
        isActive={showStats} 
        characters={allCharacters} 
      />

      <div className="jc-live-logo">
        <h1>JC 50</h1><span>LIVE FEED</span>
      </div>

      <div className="jc-stage-center" style={{ opacity: showStats ? 0 : 1, transition: 'opacity 0.5s ease-in-out', pointerEvents: showStats ? 'none' : 'auto' }}>
        {currentPost && <PhotoCard key={currentPost.id} post={currentPost} isActive={true} />}
      </div>

      <div className="jc-stage-history" style={{ opacity: showStats ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}>
        {!showStats && history.slice(0, 3).map((post, i) => (
          <div key={post.id} className={`jc-history-card pos-${i}`}>
            <img src={post.image_url} alt="" onError={(e) => e.target.style.display = 'none'} />
          </div>
        ))}
      </div>

      <button onClick={() => setShowStats(!showStats)} style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999999, background: showStats ? 'red' : 'green', color: 'white', padding: '10px 20px', cursor: 'pointer', borderRadius: '5px' }}>
        {showStats ? 'CLOSE STATS' : 'SHOW STATS (DEV)'}
      </button>
    </div>
  );
}

export default LiveWall;