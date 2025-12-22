import React from 'react';
import { Trash2, Share2, Download } from 'lucide-react';

export function PhotoHistory({ photos, loading, onDelete, onShare, onDownload }) {
  if (!photos) return null;

  return (
    <div className="my-photos-section">
      <h3 className="section-title">Omat kuvat ({photos.length})</h3>
      
      {loading ? (
         <p>Ladataan...</p>
      ) : photos.length === 0 ? (
         <p className="empty-state">Ei vielä kuvia. Ota ensimmäinen!</p>
      ) : (
        <div className="photo-grid">
          {photos.map(photo => (
            <div key={photo.id} className="photo-card">
               <div className="photo-thumb-wrapper">
                  <img src={photo.image_url} alt="My shot" className="photo-thumb" />
               </div>
               <div className="photo-meta">
                  {photo.message && <div className="photo-msg">"{photo.message}"</div>}
                  <div className="photo-actions">
                     <button onClick={() => onShare(photo)} className="action-icon-btn" title="Jaa">
                        <Share2 size={18} />
                     </button>
                     <button onClick={() => onDownload(photo.image_url)} className="action-icon-btn" title="Tallenna">
                        <Download size={18} />
                     </button>
                     <button onClick={() => onDelete(photo.id)} className="action-icon-btn danger" title="Poista">
                        <Trash2 size={18} />
                     </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}