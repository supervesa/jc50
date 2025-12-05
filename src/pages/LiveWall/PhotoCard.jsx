import React from 'react';
import './LiveWall.css';

function PhotoCard({ post, isActive }) {
  if (!post) return null;

  // Fallback nimikirjain
  const initial = post.displayName ? post.displayName.charAt(0) : '?';
  
  // Varmistetaan että meillä on aina lista, vaikka vanha data tulisi läpi
  const avatars = post.avatarUrls || (post.avatarUrl ? [post.avatarUrl] : []);

  return (
    <div className={`jc-photo-card ${isActive ? 'active' : 'history'}`}>
      
      {/* 1. KUVA */}
      <div className="jc-photo-frame">
        <div className="jc-scanlines"></div>
        {post.image_url ? (
          <img src={post.image_url} alt="Live feed" className="jc-photo-img" />
        ) : (
          <div className="jc-no-image">Ei kuvaa</div>
        )}
        <div className="jc-photo-overlay"></div>
      </div>

      {/* 2. TEKSTIT */}
      <div className="jc-chrome-badge">
        <div className="jc-badge-content">
          <span className="jc-badge-role">{post.displayRole}</span>
          <h2 className="jc-badge-name">{post.displayName}</h2>
        </div>
      </div>

      {/* 3. AVATAR (Limittäinen logiikka) */}
      <div className="jc-avatar-orb">
        
        {avatars.length > 1 ? (
          // --- KAKSI AVATARIA ---
          <div className="jc-double-avatar">
            {/* Taempi kuva (vasen ylä) */}
            <img 
              src={avatars[0]} 
              className="jc-avatar-back" 
              onError={(e) => e.target.style.display='none'}
              alt="" 
            />
            {/* Etummainen kuva (oikea ala) */}
            <img 
              src={avatars[1]} 
              className="jc-avatar-front" 
              onError={(e) => e.target.style.display='none'} 
              alt=""
            />
          </div>
        ) : avatars.length === 1 ? (
          // --- YKSI AVATAR ---
          <img 
            src={avatars[0]} 
            alt="Avatar" 
            className="jc-avatar-single"
            onError={(e) => e.target.style.display='none'} 
          />
        ) : (
          // --- EI KUVAA (KIRJAIN) ---
          <div className="jc-avatar-initial">
            {initial}
          </div>
        )}

      </div>

      {/* VIESTI */}
      {post.message && (
        <div className="jc-live-message">
          "{post.message}"
        </div>
      )}

    </div>
  );
}

export default PhotoCard;