import React, { useState } from 'react';
import { Trash2, Share2, Download, X } from 'lucide-react';

export function PhotoHistory({ photos, loading, onDelete, onShare, onDownload }) {
  const [viewPhoto, setViewPhoto] = useState(null);

  if (!photos || (!loading && photos.length === 0)) return null;

  // Lisätään vain tämä suodatus: haetaan vain rivit, joiden tyyppi on 'photo'
  const onlyPhotos = photos.filter(photo => photo.type === 'photo');

  // Jos kuvia ei ole suodatuksen jälkeen, ei näytetä mitään
  if (onlyPhotos.length === 0) return null;

  return (
    <div className="my-photos-section" style={{ 
      marginTop: '10px', 
      maxWidth: '600px', // Estää ruudukkoa leviämästä liikaa desktopissa
      margin: '0 auto'   // Keskittää osion
    }}>
      
      <div className="photo-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '4px',
        justifyContent: 'center' // Keskittää sarakkeet
      }}>
        {onlyPhotos.map(photo => (
          <div key={photo.id} style={{
            position: 'relative',
            aspectRatio: '1 / 1',
            background: '#111',
            borderRadius: '2px',
            overflow: 'hidden',
            cursor: 'pointer'
          }}>
             {/* Kuvan klikkaus avaa modaalin */}
             <img 
               src={photo.image_url} 
               alt="Intel" 
               onClick={() => setViewPhoto(photo)}
               style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
             />
             
             {/* Pikatoiminnot kuvan päällä */}
             <div style={{
               position: 'absolute',
               bottom: 0,
               left: 0,
               right: 0,
               background: 'rgba(0,0,0,0.6)',
               display: 'flex',
               justifyContent: 'space-around',
               padding: '4px 0',
               backdropFilter: 'blur(2px)'
             }}>
                <button onClick={(e) => { e.stopPropagation(); onShare(photo); }} style={{ background:'none', border:'none' }}>
                   <Share2 size={14} color="#00ff41" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDownload(photo.image_url); }} style={{ background:'none', border:'none' }}>
                   <Download size={14} color="#fff" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }} style={{ background:'none', border:'none' }}>
                   <Trash2 size={14} color="#ff4444" />
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* --- KEVYT MODAALI (LIGHTBOX) --- */}
      {viewPhoto && (
        <div 
          onClick={() => setViewPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <button 
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff' }}
            onClick={() => setViewPhoto(null)}
          >
            <X size={32} />
          </button>
          
          <img 
            src={viewPhoto.image_url} 
            alt="Full view" 
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', boxShadow: '0 0 30px rgba(0,0,0,1)' }} 
          />
          
          {viewPhoto.message && (
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '20px',
              right: '20px',
              textAlign: 'center',
              color: 'gold',
              fontStyle: 'italic',
              textShadow: '2px 2px 4px #000'
            }}>
              "{viewPhoto.message}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}