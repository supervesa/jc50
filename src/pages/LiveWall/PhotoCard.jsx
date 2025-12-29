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

  // Retro-aikaleiman luonti (YY MM DD)
  const getRetroDate = (dateString) => {
    if (!dateString) return "'99 01 01";
    const d = new Date(dateString);
    const yy = d.getFullYear().toString().slice(-2);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `'${yy} ${mm} ${dd}`;
  };

  return (
    <div className="jc-photo-card active">
      <div className="jc-photo-frame">
        {/* SCANLINES (Hienovarainen TV-efekti) */}
        <div className="jc-scanlines"></div>
        
        <img src={post.image_url} alt="" className="jc-photo-img" onError={(e) => e.target.style.display='none'}/>
        
        {/* ORANSSI PÄIVÄMÄÄRÄLEIMA (Oikea alakulma) */}
        <div className="jc-retro-timestamp">
          {getRetroDate(post.created_at)}
        </div>

        {/* VIESTI (DYMO-TEIPPI) - Nyt kuvan sisällä */}
        {post.message && (
          <div className="jc-tape-message">
            <span className="tape-text">{post.message}</span>
          </div>
        )}
      </div>

      {/* AVATAR (Vasen alakulma, hieman kuvan päällä) */}
      <div className="jc-avatar-orb">
        {isDouble ? (
          <div className="jc-double-avatar">
            <img src={avatars[1]} className="jc-avatar-back" alt="" />
            <img src={avatars[0]} className="jc-avatar-front" alt="" />
          </div>
        ) : avatars.length === 1 ? (
          <img src={avatars[0]} className="jc-avatar-single" alt="" />
        ) : (
          <div className="jc-avatar-initial">{initial}</div>
        )}
      </div>

      {/* NIMI-BADGE (Oikea alakulma, hieman kuvan päällä) */}
      <div className="jc-chrome-badge">
        <h2 className="jc-badge-name">{displayName}</h2>
      </div>
    </div>
  );
};

export default PhotoCard;