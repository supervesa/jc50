import React from 'react';
import './PhotoCard.css'; // Luo tämä CSS alla olevalla koodilla

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
      <div className="jc-photo-frame">
        <div className="jc-scanlines"></div>
        <img src={post.image_url} alt="" className="jc-photo-img" onError={(e) => e.target.style.display='none'}/>
      </div>

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

      <div className="jc-chrome-badge">
        <h2 className="jc-badge-name">{displayName}</h2>
      </div>
      
      {post.message && <div className="jc-live-message">"{post.message}"</div>}
    </div>
  );
};
export default PhotoCard;