import React from 'react';
// CSS on tuotu parentissa (LiveWall.js), mutta tämä on varalta ok
import './PhotoCard.css'; // <--- MUUTA TÄMÄ


function PhotoCard({ post }) {
  if (!post) return null;

  // --- 1. DATAN NORMALISOINTI ---
  
  // Yritetään käyttää uutta 'authors' arrayta (LiveWall.js:stä)
  // Jos sitä ei ole, fallbäckätään vanhaan avatarUrls-tyyliin.
  let avatars = [];
  let displayName = post.displayName || "Unknown";

  if (post.authors && post.authors.length > 0) {
    // Uusi tapa: authors array
    avatars = post.authors.map(a => a.image).filter(Boolean);
    // Rakennetaan nimi uudestaan varmuuden vuoksi, tai käytetään propseista tullutta
    displayName = post.authors.map(a => a.name).join(' & ');
  } else {
    // Vanha tapa: suora lista urleja
    avatars = post.avatarUrls || (post.avatarUrl ? [post.avatarUrl] : []);
  }

  // Nimikirjain fallbackia varten
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  // Tarkistetaan onko tupla-avatar tilanne
  const isDouble = avatars.length >= 2;

  return (
    <div className="jc-photo-card active">
      
      {/* --- KERROS 1: KEHYS & KUVA --- */}
      <div className="jc-photo-frame">
        <div className="jc-scanlines"></div>
        {post.image_url ? (
          <img 
            src={post.image_url} 
            alt="Live feed" 
            className="jc-photo-img"
            onError={(e) => e.target.style.display = 'none'}
          />
        ) : (
          <div style={{
            width:'100%', height:'100%', 
            display:'flex', alignItems:'center', justifyContent:'center', 
            background:'#111', color:'#555', fontSize:'1.5rem'
          }}>
            NO SIGNAL
          </div>
        )}
      </div>

      {/* --- KERROS 2: AVATAR PALLO (ORB) --- */}
      <div className="jc-avatar-orb">
        {isDouble ? (
          // KAKSI KIRJOITTAJAA
          <div className="jc-double-avatar">
            <img 
              src={avatars[1]} 
              className="jc-avatar-back" 
              alt="" 
              onError={(e) => e.target.style.display='none'}
            />
            <img 
              src={avatars[0]} 
              className="jc-avatar-front" 
              alt="" 
              onError={(e) => e.target.style.display='none'}
            />
          </div>
        ) : avatars.length === 1 ? (
          // YKSI KIRJOITTAJA
          <img 
            src={avatars[0]} 
            className="jc-avatar-single" 
            alt="Avatar" 
            onError={(e) => e.target.style.display='none'}
          />
        ) : (
          // EI KUVAA (KIRJAIN)
          <div style={{
            width:'100%', height:'100%', 
            display:'flex', alignItems:'center', justifyContent:'center', 
            fontSize:'2.5rem', fontWeight:'bold', 
            background:'#222', color:'var(--turquoise)'
          }}>
            {initial}
          </div>
        )}
      </div>

      {/* --- KERROS 3: NIMILAATTA (Ei titteleitä) --- */}
      <div className="jc-chrome-badge">
        {/* Poistettu jc-badge-role kokonaan */}
        <h2 className="jc-badge-name">{displayName}</h2>
      </div>

      {/* --- VIESTI --- */}
      {post.message && (
        <div className="jc-live-message">
          "{post.message}"
        </div>
      )}

    </div>
  );
}

export default PhotoCard;