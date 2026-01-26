import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // LISÄTTY URL-PARAMETRIEN TUKEMISEKSI
import { supabase } from '../lib/supabaseClient'; 
import { Flame, MessageCircle, ArrowLeft, ArrowUp } from 'lucide-react';
import './PhotoWall.css';
import PhotoViewOverlay from './PhotoViewOverlay';

// SENTINEL
import { useSentinel } from '../hooks/useSentinel';

const PhotoWall = () => {
  // 1. HAETAAN guestId (Täsmää App.jsx reittiin :guestId)
  const { guestId: urlId } = useParams(); 
  
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. PRIORISOINTI: URL-ID on vahvin totuus, localStorage on varalla
  const activeGuestId = urlId || localStorage.getItem('jc_ticket_id');
  
  // 3. SENTINEL: Käynnistetään seuranta tunnistetulle vieraalle
  const { trackInteraction } = useSentinel(activeGuestId, 'PHOTO_WALL');

  // --- LAUSEGENERAATTORI ---
  const getStoryPhrase = (id, isPlural) => {
    const phrases = [
      isPlural ? "Tämän hetken ikuistivat" : "Tämän hetken ikuisti",
      isPlural ? "Tämän jaon tarjosivat" : "Tämän jaon tarjosi",
      isPlural ? "Tämän palasen juhlaa tallensivat" : "Tämän palasen juhlaa tallensi",
      isPlural ? "Linssin takana häärivät" : "Linssin takana hääri",
      isPlural ? "Muistoksi meille poimivat" : "Muistoksi meille poimi",
      isPlural ? "Juhlahumun vangitsivat" : "Juhlahumun vangitsi",
      isPlural ? "Tämän tunnelman nappasivat" : "Tämän tunnelman nappasi",
      isPlural ? "Vilinän keskeltä tallensivat" : "Vilinän keskeltä tallensi",
      isPlural ? "Tämän muiston jakoivat" : "Tämän muiston jakoi",
      isPlural ? "Hetken pysäyttivät" : "Hetken pysäytti"
    ];
    const index = Math.abs(id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % phrases.length;
    return phrases[index];
  };

  const enrichPosts = async (posts) => {
    const enriched = await Promise.all(posts.map(async (post) => {
      if (!post.guest_id) {
        return { 
          ...post, 
          guestNames: 'Anonyymi', 
          characterNames: 'Vieras', 
          authors: [{ name: 'Vieras', image: null }],
          storyPhrase: getStoryPhrase(post.id, false)
        };
      }
      try {
        const { data: characters } = await supabase
          .from('characters')
          .select('name, role, avatar_url')
          .eq('assigned_guest_id', post.guest_id);

        const { data: guestData } = await supabase
          .from('guests')
          .select('name')
          .eq('id', post.guest_id)
          .single();

        const realName = guestData?.name || 'Vieras';
        const isPlural = characters && characters.length > 1;

        if (characters && characters.length > 0) {
          const authors = characters.map(c => ({ name: c.name, image: c.avatar_url, role: c.role }));
          const combinedCharacterNames = characters.map(c => c.name).join(' & ');
          
          return { 
            ...post, 
            guestNames: realName, 
            characterNames: combinedCharacterNames, 
            authors: authors,
            storyPhrase: getStoryPhrase(post.id, isPlural)
          };
        }
        
        return { 
          ...post, 
          guestNames: realName, 
          characterNames: realName, 
          authors: [{ name: realName, image: null }],
          storyPhrase: getStoryPhrase(post.id, false)
        };
      } catch (err) {
        console.error("Enrich error:", err);
        return post;
      }
    }));
    return enriched;
  };

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('live_posts')
      .select(`
        *,
        comments (count)
      `)
      .eq('status', 'approved')
      .eq('is_deleted', false)
      .eq('is_visible', true)
      .eq('type', 'photo') 
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Virhe haettaessa kuvia:', error);
    } else {
      const enrichedData = await enrichPosts(data);
      const formattedData = enrichedData.map(post => ({
        ...post,
        url: post.image_url, 
        caption: post.message,
        comment_count: post.comments ? post.comments[0]?.count : 0
      }));
      setPhotos(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
    const interval = setInterval(fetchPhotos, 10000);
    const channel = supabase
      .channel('public:live_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_posts' }, (payload) => {
        fetchPhotos();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div id="photo-wall" className="wall-container">
      <div className="wall-sticky-header">
        <button className="nav-btn" onClick={() => window.history.back()} aria-label="Takaisin">
          <ArrowLeft size={24} />
        </button>
        <div className="header-titles">
          <h1 className="jc-h1">Kymppiseinä</h1>
          <p>Jaa parhaat palat!</p>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:'center', marginTop: 100, color: '#666', fontStyle: 'italic'}}>
          Ladataan muistoja...
        </div>
      ) : (
        <div className="polaroid-grid">
          {photos.map((photo, index) => {
            const rotation = index % 2 === 0 ? '-1.5deg' : '1.5deg';
            return (
              <div 
                key={photo.id} 
                className="polaroid-item"
                style={{ transform: `rotate(${rotation})` }}
                onClick={() => {
                  setSelectedPhoto(photo);
                  trackInteraction('PHOTO_POLAROID_CLICK', 'Operative Briefing');
                }}
              >
                <div className="photo-by-badge">
                  <div className="avatar-stack">
                    {photo.authors?.map((auth, i) => (
                      <div key={i} className="mini-avatar">
                        {auth.image ? (
                          <img src={auth.image} alt={auth.name} />
                        ) : (
                          <div className="avatar-placeholder">{auth.name.charAt(0)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="guest-real-name">by {photo.guestNames}</span>
                </div>

                <img src={photo.url} alt="Postaus" className="polaroid-img" loading="lazy" />
                
                <div className="polaroid-caption">
                  {photo.caption && <div className="main-message">{photo.caption}</div>}
                  <div className="story-credit">
                    <span className="phrase-part">{photo.storyPhrase}</span>
                    <span className="character-name-highlight">{photo.characterNames}</span>
                  </div>
                </div>

                <div className="polaroid-badges">
                  {(photo.hot_count || 0) > 0 && (
                    <div className="badge hot"><Flame size={12} fill="#fff" /> {photo.hot_count}</div>
                  )}
                  {(photo.comment_count || 0) > 0 && (
                    <div className="badge comments"><MessageCircle size={12} /> {photo.comment_count}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPhoto && (
        <PhotoViewOverlay photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
};

export default PhotoWall;