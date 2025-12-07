import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ElectricWave from './ElectricWave';
import PhotoCard from './PhotoCard';
import Kaleidoscope from '../../components/WebGLBackground/Kaleidoscope';
import ChatOverlay from './ChatOverlay';
import PollTakeover from './PollTakeover';
// Varmista polku!
import StatsTakeoverLogic from './components/StatsTakeover/StatsTakeoverLogic'; 
import './LiveWall.css';

function LiveWall() {
  const [queue, setQueue] = useState([]);       
  const [currentPost, setCurrentPost] = useState(null); 
  const [history, setHistory] = useState([]);   
  
  // TILA: Ohjaa näkyykö tilastot vai ei
  const [showStats, setShowStats] = useState(false); 

  const timerRef = useRef(null);
  const isTransitioning = useRef(false);

  // --- PIKANÄPPÄIN 'S' (Pidetään varalta) ---
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

  // --- ENRICH POSTS ---
  const enrichPosts = async (posts) => {
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

          return {
            ...post,
            displayName: combinedNames,
            displayRole: combinedRoles,
            avatarUrls: avatarUrls
          };
        }

        const { data: guestData } = await supabase
          .from('guests')
          .select('name')
          .eq('id', post.guest_id)
          .single();

        return {
          ...post,
          displayName: guestData?.name || 'Vieras',
          displayRole: 'Vieras',
          avatarUrls: []
        };

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
    console.log("Live-yhteys käynnistyy...");
    
    const channel = supabase
      .channel('live-wall')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_posts' },
        async (payload) => {
          console.log('📸 Uusi kuva saapui:', payload.new);
          const [enrichedPost] = await enrichPosts([payload.new]);
          
          setQueue((prev) => {
            if (prev.some(p => p.id === enrichedPost.id)) return prev;
            return [...prev, enrichedPost];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('🟢 Live-yhteys auki!');
        if (status === 'CHANNEL_ERROR') console.error('🔴 Live-yhteys virhe!');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- LOOP ---
  useEffect(() => {
    // Pysäytetään karuselli jos Stats-ruutu on päällä
    if (showStats) return;

    const nextSlide = () => {
      if (isTransitioning.current) return;

      let nextPost = null;
      let isFromQueue = false;

      if (queue.length > 0) {
        nextPost = queue[0];
        isFromQueue = true;
      } 
      else if (history.length > 0) {
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

        if (isFromQueue) {
          setQueue(prev => prev.slice(1));
        }

        setCurrentPost(nextPost);

        setTimeout(() => {
          isTransitioning.current = false;
        }, 1000); 
      }
    };

    const intervalTime = queue.length > 0 ? 5000 : 10000;
    timerRef.current = setInterval(nextSlide, intervalTime);

    return () => clearInterval(timerRef.current);
  }, [queue, history, currentPost, showStats]);

  return (
    <div className="jc-live-wall">
      
      {/* 1. TAUSTA */}
      <div className="jc-gl-background">
         <Kaleidoscope /> 
      </div>

      {/* 2. SÄHKÖKÄYRÄ */}
      <ElectricWave />

      {/* 3. OVERLAYS */}
      <ChatOverlay />
      <PollTakeover />

      {/* 4. STATS TAKEOVER */}
      {/* Renderöidään aina, mutta komponentti itse päättää onko visible */}
      <StatsTakeoverLogic isActive={showStats} />

      {/* 5. LOGO */}
      <div className="jc-live-logo">
        <h1>JC 50</h1>
        <span>LIVE FEED</span>
      </div>

      {/* 6. PÄÄKUVA (Piilotetaan kun statsit päällä) */}
      <div 
        className="jc-stage-center" 
        style={{ 
          opacity: showStats ? 0 : 1, 
          transition: 'opacity 0.5s ease-in-out',
          pointerEvents: showStats ? 'none' : 'auto'
        }}
      >
        {currentPost && (
           <PhotoCard key={currentPost.id} post={currentPost} isActive={true} />
        )}
      </div>

      {/* 7. HISTORIA (Piilotetaan kun statsit päällä) */}
      <div 
        className="jc-stage-history" 
        style={{ 
          opacity: showStats ? 0 : 1, 
          transition: 'opacity 0.5s ease-in-out' 
        }}
      >
        {!showStats && history.slice(0, 3).map((post, i) => (
          <div key={post.id} className={`jc-history-card pos-${i}`}>
            <img 
              src={post.image_url} 
              alt="" 
              onError={(e) => e.target.style.display = 'none'} 
            />
          </div>
        ))}
      </div>

      {/* --- DEV BUTTON (POISTA TUOTANNOSTA) --- */}
      <button
        onClick={() => setShowStats(!showStats)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 999999, /* Varmasti päällimmäisenä */
          background: showStats ? 'red' : 'green',
          color: 'white',
          border: '2px solid white',
          padding: '10px 20px',
          fontWeight: 'bold',
          cursor: 'pointer',
          borderRadius: '5px',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}
      >
        {showStats ? 'CLOSE STATS' : 'SHOW STATS (DEV)'}
      </button>
      
    </div>
  );
}

export default LiveWall;