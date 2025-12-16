import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

// --- KOMPONENTIT ---
import ElectricWave from './ElectricWave';
import PhotoCard from './PhotoCard'; 
import TimelineStrip from './Timeline'; // Uusi aikajana-komponentti
import ConstellationHistory from './ConstellationHistory'; // <--- UUSI
import Kaleidoscope from '../../components/WebGLBackground/Kaleidoscope';
import ChatOverlay from './ChatOverlay';
import PollTakeover from './PollTakeover';
import StatsTakeoverLogic from './components/StatsTakeover/StatsTakeoverLogic'; 

// --- TYYLIT ---
import './LiveWall.css';       // Sivun asettelu

function LiveWall() {
  // --- TILA (STATE) ---
  const [queue, setQueue] = useState([]);       
  const [currentPost, setCurrentPost] = useState(null); 
  const [history, setHistory] = useState([]);   
  
  // Stats-tila ja data
  const [allCharacters, setAllCharacters] = useState([]); 
  const [showStats, setShowStats] = useState(false); 

  // Referenssit ajastimille ja animaatiolle
  const timerRef = useRef(null);
  const isTransitioning = useRef(false);

  // --- 1. PIKANÄPPÄIN 'S' (STATS) ---
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Estetään, jos ollaan kirjoittamassa input-kenttään
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key.toLowerCase() === 's') {
        console.log("S-painettu: Vaihdetaan Stats-tilaa");
        setShowStats(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // --- 2. HAE KAIKKI HAHMOT (Leaderboardia & Avatareja varten) ---
  useEffect(() => {
    const fetchAllCharacters = async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, avatar_url, xp, role');
      
      if (data) {
        setAllCharacters(data);
      } else if (error) {
        console.error("Virhe hahmojen haussa:", error);
      }
    };
    fetchAllCharacters();
  }, []);

  // --- 3. DATAN RIKASTAMINEN (ENRICH POSTS) ---
  // Hakee postausten kirjoittajien tiedot (Avatarit, Nimet)
  const enrichPosts = async (posts) => {
    const enriched = await Promise.all(posts.map(async (post) => {
      // Jos ei guest_id:tä (anonyymi upload)
      if (!post.guest_id) {
        return { 
          ...post, 
          displayName: 'Anonyymi', 
          authors: [{ name: 'Vieras', image: null }]
        };
      }

      try {
        // Haetaan hahmot, jotka on kytketty tähän vieraaseen (guest_id)
        const { data: characters } = await supabase
          .from('characters')
          .select('name, role, avatar_url')
          .eq('assigned_guest_id', post.guest_id);

        if (characters && characters.length > 0) {
          // Luodaan authors-array uutta PhotoCardia varten
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

        // Fallback: Jos hahmoa ei löydy, haetaan vieraan nimi
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
        console.error("Virhe postauksen rikastamisessa:", err);
        return post;
      }
    }));
    return enriched;
  };

  // --- 4. ALUSTUS (INITIAL FETCH) ---
  useEffect(() => {
    const fetchInitial = async () => {
      // Haetaan enemmän kuvia (20), jotta aikajana näyttää heti täydeltä
      const { data } = await supabase
        .from('live_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const enriched = await enrichPosts(data);
        setCurrentPost(enriched[0]);
        // Otetaan talteen 12 kuvaa historiaan aikajanaa varten
        setHistory(enriched.slice(1, 13)); 
      }
    };
    fetchInitial();
  }, []);

  // --- 5. REALTIME SUBSCRIPTION ---
  useEffect(() => {
    const channel = supabase.channel('live-wall')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'live_posts' }, 
        async (payload) => {
          console.log("Uusi kuva saapui:", payload.new);
          const [enrichedPost] = await enrichPosts([payload.new]);
          
          setQueue((prev) => {
            // Estetään duplikaatit
            if (prev.some(p => p.id === enrichedPost.id)) return prev;
            return [...prev, enrichedPost];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- 6. KARUSELLI-LOOPPI ---
  useEffect(() => {
    // Jos Stats on päällä, pysäytetään kuvien vaihtuminen
    if (showStats) return;

    const nextSlide = () => {
      if (isTransitioning.current) return;

      let nextPost = null;
      let isFromQueue = false;

      // 1. Prioriteetti: Jono (uudet kuvat)
      if (queue.length > 0) {
        nextPost = queue[0];
        isFromQueue = true;
      } 
      // 2. Prioriteetti: Historia (vanhat kuvat satunnaisesti)
      else if (history.length > 0) {
        const candidates = history.filter(h => h.id !== currentPost?.id);
        if (candidates.length > 0) {
          nextPost = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }

      if (nextPost) {
        isTransitioning.current = true;

        // Päivitetään historia ja nykyinen kuva
        if (currentPost) {
          setHistory(prev => {
            // Lisätään nykyinen kuva historian alkuun
            const cleanPrev = prev.filter(p => p.id !== nextPost.id && p.id !== currentPost.id);
            // Pidetään lista 12 kuvan mittaisena Timelinea varten
            return [currentPost, ...cleanPrev].slice(0, 12);
          });
        }

        if (isFromQueue) {
          setQueue(prev => prev.slice(1));
        }

        setCurrentPost(nextPost);

        // Animaation kesto
        setTimeout(() => { isTransitioning.current = false; }, 1000); 
      }
    };

    // Jos jonossa on tavaraa, vaihdetaan nopeammin (5s), muuten hitaammin (10s)
    const intervalTime = queue.length > 0 ? 5000 : 10000;
    
    timerRef.current = setInterval(nextSlide, intervalTime);

    return () => clearInterval(timerRef.current);
  }, [queue, history, currentPost, showStats]);

  // --- RENDERÖINTI ---
  return (
    <div className="jc-live-wall">
      
      {/* 1. TAUSTAKERROS */}
      <div className="jc-gl-background" style={{ zIndex: 0 }}>
        <Kaleidoscope />
      </div>
      
      {/* Visuaalinen efekti */}
      <ElectricWave />
      
      {/* 2. OVERLAYS (Chat & Poll) */}
      <div style={{ position: 'relative', zIndex: 60 }}>
        <ChatOverlay />
      </div>
      <PollTakeover />

      {/* 3. STATS TAKEOVER (Punainen Overlay) */}
      {/* Tämä on kaiken päällä (z-index korkea CSS:ssä) */}
      <StatsTakeoverLogic 
        isActive={showStats} 
        characters={allCharacters} 
      />

      {/* 4. LOGO */}
      <div className="jc-live-logo">
        <h1 className="jc-h1">JC 50</h1>
        <span className="neon">LIVE FEED</span>
      </div>

      {/* 5. PÄÄKUVA (Active Card) */}
      <div 
        className="jc-stage-center" 
        style={{ 
          opacity: showStats ? 0 : 1, 
          transition: 'opacity 0.5s ease-in-out', 
          pointerEvents: showStats ? 'none' : 'auto',
          zIndex: 10 
        }}
      >
        {currentPost && (
          <PhotoCard 
            key={currentPost.id} 
            post={currentPost} 
          />
        )}
      </div>

  {/* --- NEON CONSTELLATIONS (HISTORIA) --- */}
{/* Korvaa TimelineStripin tällä */}
<div 
  style={{ 
    opacity: showStats ? 0 : 1, 
    transition: 'opacity 0.5s ease-in-out' 
  }}
>
  <ConstellationHistory history={history} />
</div>

      {/* 7. DEV CONTROL BUTTON (Piilotettu/Huomaamaton) */}
      <button 
        onClick={() => setShowStats(!showStats)} 
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          zIndex: 999999, 
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.5)', 
          padding: '5px 10px', 
          cursor: 'pointer', 
          borderRadius: '5px',
          fontFamily: 'sans-serif',
          fontSize: '0.8rem'
        }}
      >
        {showStats ? 'Close Intel' : 'Intel'}
      </button>

    </div>
  );
}

export default LiveWall;