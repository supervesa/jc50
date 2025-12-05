import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ElectricWave from './ElectricWave';
import PhotoCard from './PhotoCard';
import Kaleidoscope from '../../components/WebGLBackground/Kaleidoscope';
import ChatOverlay from './ChatOverlay';
import PollTakeover from './PollTakeover';
import './LiveWall.css';

function LiveWall() {
  const [queue, setQueue] = useState([]);       
  const [currentPost, setCurrentPost] = useState(null); 
  const [history, setHistory] = useState([]);   
  
  const timerRef = useRef(null);
  const isTransitioning = useRef(false);

  // --- ENRICH POSTS: HAE NIMET JA KAIKKI AVATARET ---
  const enrichPosts = async (posts) => {
    const enriched = await Promise.all(posts.map(async (post) => {
      if (!post.guest_id) {
        return { ...post, displayName: 'Anonyymi', displayRole: 'Vieras', avatarUrls: [] };
      }

      try {
        // Haetaan kaikki hahmot tälle guest_id:lle
        const { data: characters } = await supabase
          .from('characters')
          .select('name, role, avatar_url')
          .eq('assigned_guest_id', post.guest_id);

        if (characters && characters.length > 0) {
          
          // Nimet & Roolit kuten aiemmin
          const combinedNames = characters.map(c => c.name).join(' & ');
          const uniqueRoles = [...new Set(characters.map(c => c.role))];
          const combinedRoles = uniqueRoles.join(' / ');

          // TÄMÄ ON UUTTA: Kerätään kaikki toimivat URL:t listaan
          const avatarUrls = characters
            .map(c => c.avatar_url)
            .filter(url => url); // Poistaa tyhjät/nullit

          return {
            ...post,
            displayName: combinedNames,
            displayRole: combinedRoles,
            avatarUrls: avatarUrls // Palautetaan lista!
          };
        }

        // Fallback: Vieraan oikea nimi
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

  // --- 2. ALUSTUS ---
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
        // Varmistetaan ettei nykyinen mene heti tuplana historiaan
        setHistory(enriched.slice(1, 6)); 
      }
    };

    fetchInitial();
  }, []);

  // --- 3. REALTIME (LIVE-VIRTA) ---
  useEffect(() => {
    console.log("Live-yhteys käynnistyy...");
    
    const channel = supabase
      .channel('live-wall')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_posts' },
        async (payload) => {
          console.log('📸 Uusi kuva saapui:', payload.new);
          
          // Rikastetaan tiedot heti
          const [enrichedPost] = await enrichPosts([payload.new]);
          
          // Lisätään jonoon (estä duplikaatit)
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

  // --- 4. LOOP (KARUSELLI) ---
  useEffect(() => {
    const nextSlide = () => {
      if (isTransitioning.current) return;

      let nextPost = null;
      let isFromQueue = false;

      // A. Otetaan jonosta
      if (queue.length > 0) {
        nextPost = queue[0];
        isFromQueue = true;
      } 
      // B. Kierrätetään historiaa
      else if (history.length > 0) {
        const candidates = history.filter(h => h.id !== currentPost?.id);
        if (candidates.length > 0) {
          nextPost = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }

      if (nextPost) {
        isTransitioning.current = true;
        
        // Päivitetään historia
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
  }, [queue, history, currentPost]);

  return (
    <div className="jc-live-wall">
      
      {/* 1. TAUSTA (Kaleidoscope) */}
      <div className="jc-gl-background">
         <Kaleidoscope /> 
      </div>

      {/* 2. SÄHKÖKÄYRÄ */}
      <ElectricWave />
{/* UUSI CHAT TÄHÄN */}
      <ChatOverlay />
      <PollTakeover />
      {/* 3. LOGO */}
      <div className="jc-live-logo">
        <h1>JC 50</h1>
        <span>LIVE FEED</span>
      </div>

      {/* 4. PÄÄKUVA (KESKELLÄ) */}
      <div className="jc-stage-center">
        {currentPost && <PhotoCard key={currentPost.id} post={currentPost} isActive={true} />}
      </div>

      {/* 5. HISTORIA (ALHAALLA) */}
      <div className="jc-stage-history">
        {history.slice(0, 3).map((post, i) => (
          <div key={post.id} className={`jc-history-card pos-${i}`}>
            <img 
              src={post.image_url} 
              alt="" 
              onError={(e) => e.target.style.display = 'none'} 
            />
          </div>
        ))}
      </div>
      
    </div>
  );
}

export default LiveWall;