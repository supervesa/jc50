import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import { Flame, MessageCircle, ArrowLeft, ArrowUp } from 'lucide-react';
import './PhotoWall.css';
import PhotoViewOverlay from './PhotoViewOverlay';

const PhotoWall = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async () => {
    // Haetaan kuvat live_posts-taulusta
    // SUODATUS: Ei poistettuja, ja pitää olla visible
    const { data, error } = await supabase
      .from('live_posts')
      .select(`
        *,
        comments (count)
      `)
      .eq('status', 'approved') // Vain hyväksytyt
      .eq('is_deleted', false)  // UUSI: Ei poistettuja
      .eq('is_visible', true)   // UUSI: Vain näkyvät
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Virhe haettaessa kuvia:', error);
    } else {
      const formattedData = data.map(post => ({
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
    
    // Polling: Päivitetään seinä 10s välein
    const interval = setInterval(fetchPhotos, 10000);

    // REALTIME LISTENER: Kuuntelee muutoksia (esim. admin piilottaa kuvan)
    const channel = supabase
      .channel('public:live_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_posts' }, (payload) => {
        // Jos tulee uusi kuva tai päivitys (esim. piilotus), haetaan lista uusiksi
        console.log('Muutos havaittu:', payload);
        fetchPhotos();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchPhotos();
    
    // Polling: Päivitetään seinä 10s välein
    const interval = setInterval(fetchPhotos, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="photo-wall" className="wall-container">
      
      {/* --- UUSI STICKY HEADER --- */}
      <div className="wall-sticky-header">
        {/* Takaisin-nappi (vie edelliseen näkymään / upload-sivulle) */}
        <button 
          className="nav-btn" 
          onClick={() => window.history.back()}
          aria-label="Takaisin"
        >
          <ArrowLeft size={24} />
        </button>
        
        {/* Otsikot keskellä */}
        <div className="header-titles">
          <h1 className="jc-h1">Juhlafeed</h1>
          <p>Jaa parhaat palat!</p>
        </div>

        {/* Ylös-nappi */}
        <button 
          className="nav-btn" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Sivun alkuun"
        >
          <ArrowUp size={24} />
        </button>
      </div>

      {/* --- SISÄLTÖ --- */}
      {loading ? (
        <div style={{textAlign:'center', marginTop: 100, color: '#666', fontStyle: 'italic'}}>
          Ladataan muistoja...
        </div>
      ) : (
        <div className="polaroid-grid">
          {photos.map((photo, index) => {
            // Arvotaan pieni kääntö elävyyden vuoksi
            const rotation = index % 2 === 0 ? '-1.5deg' : '1.5deg';

            return (
              <div 
                key={photo.id} 
                className="polaroid-item"
                style={{ transform: `rotate(${rotation})` }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img 
                   src={photo.url} 
                   alt="Postaus" 
                   className="polaroid-img" 
                   loading="lazy" 
                />
                
                <div className="polaroid-caption">
                  {photo.caption || '#juhlat'}
                </div>

                <div className="polaroid-badges">
                  {(photo.hot_count || 0) > 0 && (
                    <div className="badge hot">
                      <Flame size={12} fill="#fff" /> {photo.hot_count}
                    </div>
                  )}
                  {(photo.comment_count || 0) > 0 && (
                    <div className="badge comments">
                      <MessageCircle size={12} /> {photo.comment_count}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- OVERLAY (MODAL) --- */}
      {selectedPhoto && (
        <PhotoViewOverlay 
          photo={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </div>
  );
};

export default PhotoWall;