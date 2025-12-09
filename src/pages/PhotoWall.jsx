import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Käytetään keskitettyä clientia!
import { Flame, MessageCircle } from 'lucide-react';
import './PhotoWall.css';
import PhotoViewOverlay from './PhotoViewOverlay';

const PhotoWall = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async () => {
    // Haetaan kuvat live_posts-taulusta
    // Liitetään mukaan kommenttien määrä (comments-taulusta)
    const { data, error } = await supabase
      .from('live_posts')
      .select(`
        *,
        comments (count)
      `)
      .eq('status', 'approved') // Halutessasi näytä vain hyväksytyt
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Virhe haettaessa kuvia:', error);
    } else {
      const formattedData = data.map(post => ({
        ...post,
        url: post.image_url, 
        caption: post.message,
        // Supabase palauttaa countin taulukkona, otetaan eka arvo
        comment_count: post.comments ? post.comments[0]?.count : 0
      }));
      setPhotos(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
    
    // Polling: Päivitetään seinä 10s välein, jotta uudet kuvat ilmestyvät
    // (Live-tilaus on masonry-gridissä joskus levoton, joten polling on rauhallisempi)
    const interval = setInterval(fetchPhotos, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
  <div id="photo-wall" className="wall-container">
      <div className="wall-header">
        <h1 className="wall-title">Juhlafeed 📸</h1>
        <p style={{opacity: 0.6, fontSize: '0.9rem'}}>Jaa parhaat palat!</p>
      </div>

      {loading ? (
        <div style={{textAlign:'center', marginTop: 50, color: '#666'}}>Ladataan muistoja...</div>
      ) : (
        <div className="polaroid-grid">
          {photos.map((photo, index) => {
            // Arvotaan pieni kääntö: parilliset vasemmalle, parittomat oikealle
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
                
                {/* Viesti (Caption) */}
                <div className="polaroid-caption">
                  {photo.caption || '#juhlat'}
                </div>

                {/* Indikaattorit (Badges) */}
                <div className="polaroid-badges">
                  {(photo.hot_count || 0) > 0 && (
                    <div className="badge hot">
                      <Flame size={10} fill="#fff" /> {photo.hot_count}
                    </div>
                  )}
                  {(photo.comment_count || 0) > 0 && (
                    <div className="badge comments">
                      <MessageCircle size={10} /> {photo.comment_count}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OVERLAY (MODAL) */}
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