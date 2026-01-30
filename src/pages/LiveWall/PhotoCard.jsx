import React from 'react';
import './PhotoCard.css';

const PhotoCard = ({ post }) => {
  if (!post) return null;

  // Datan normalisointi
  let avatars = [];
  let displayName = post.displayName || "Unknown";

  if (post.authors && post.authors.length > 0) {
    avatars = post.authors.map(a => a.image).filter(Boolean);
    displayName = post.authors.map(a => a.name).join(' & ');
  } else {
    avatars = post.avatarUrls || (post.avatarUrl ? [post.avatarUrl] : []);
  }
  
  const isDouble = avatars.length >= 2;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="jc-photo-card active">
      {/* Metallikehys lasin päälle */}
      <div className="jc-metalStroke"></div>

      {/* KUVAN SÄILIÖ */}
      <div className="jc-card-image-wrapper">
        <img 
          src={post.image_url} 
          alt="" 
          className="jc-photo-img" 
          onError={(e) => e.target.style.display='none'}
        />
      </div>

      {/* FOOTER: TIEDOT (Nyt lasinen ja läpinäkyvä) */}
      <div className="jc-card-footer">
        
        {/* AVATAR (Iso ja hehkuva) */}
        <div className="jc-footer-avatar">
          {isDouble ? (
            <div className="jc-double-avatar-clean">
              <img src={avatars[1]} className="jc-av-back" alt="" />
              <img src={avatars[0]} className="jc-av-front" alt="" />
            </div>
          ) : avatars.length === 1 ? (
            <img src={avatars[0]} className="jc-avatar-clean" alt="" />
          ) : (
            <div className="jc-avatar-initial-clean">{initial}</div>
          )}
        </div>

        {/* TEKSTIT (Neon-tyylit) */}
        <div className="jc-footer-info">
          <h2 className="jc-footer-name">{displayName}</h2>
          {post.message && (
            <p className="jc-footer-message">
              {post.message}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default PhotoCard;