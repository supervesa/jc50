import React from 'react';
import './TicketPage.css';

function CharacterCard({ char, onUploadAvatar, uploading }) {
  // Määritellään dynaaminen taustakuva inline-objektina
  const avatarStyle = {
    backgroundImage: char.avatar_url 
      ? `url(${char.avatar_url})` 
      : 'linear-gradient(135deg, #333, #666)'
  };

  return (
    <section className={`jc-card medium mb-2 char-card ${char.is_spouse_character ? 'spouse' : 'regular'}`}>
      <div>
        <div className="char-avatar-wrapper">
          <div className="char-avatar" style={avatarStyle}></div>
          
          <label className="char-upload-label">
            {uploading ? '...' : '📷 Kuva'}
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={(e) => onUploadAvatar(e, char.id)} 
              disabled={uploading} 
            />
          </label>
        </div>

        <h1 className="jc-h1 char-name">{char.name}</h1>
        <h3 className={`char-role ${char.is_spouse_character ? 'spouse' : 'regular'}`}>
          {char.role}
        </h3>

        <div className="char-desc-box">
          <p className="char-backstory">"{char.backstory}"</p>
          {char.secret_mission && (
            <div className="char-mission-box">
              <span className="small char-mission-label">SALAINEN TEHTÄVÄ:</span>
              <p className="char-mission-text">{char.secret_mission}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CharacterCard;