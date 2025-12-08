import React from 'react';
import { Camera, User, MapPin, Loader2, Sparkles, ScanFace } from 'lucide-react';
import './TicketPage.css';

function CharacterCard({ char, onUploadAvatar, uploading }) {
  // Määritellään väriteema roolin mukaan
  const isSpouse = char.is_spouse_character;
  const themeColor = isSpouse ? 'var(--magenta)' : 'var(--turquoise)';

  return (
    <section 
      className={`jc-card medium mb-2 char-card ${isSpouse ? 'spouse-variant' : 'main-variant'}`}
      style={{
        position: 'relative',
        overflow: 'visible', // Sallii latausnapin mennä hieman reunan yli tarvittaessa
        marginTop: '2rem' // Tilaa avatarille, joka nousee hieman kortista ulos
      }}
    >
      {/* --- AVATAR ALUE (Hero) --- */}
      <div className="char-visual">
        <div 
          className="char-avatar" 
          style={{ 
            backgroundImage: char.avatar_url ? `url(${char.avatar_url})` : 'none',
            borderColor: themeColor
          }}
        >
          {/* Jos kuvaa ei ole, näytetään placeholder-ikoni */}
          {!char.avatar_url && (
            <div style={{
              width:'100%', height:'100%', 
              display:'flex', alignItems:'center', justifyContent:'center', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.5))'
            }}>
              <User size={48} color="rgba(255,255,255,0.2)" />
            </div>
          )}
        </div>
        
        {/* Latausnappi (Floating Action Button) */}
        <label 
          className="avatar-upload-btn"
          style={{ backgroundColor: themeColor }}
        >
          {uploading ? (
            <Loader2 size={18} className="spin" color="#000" />
          ) : (
            <Camera size={18} color="#000" />
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={(e) => onUploadAvatar(e, char.id)} 
            disabled={uploading} 
          />
        </label>
      </div>

      {/* --- TIETOALUE --- */}
      <div className="char-content" style={{ marginTop: '0.5rem' }}>
        
        {/* Nimi & Rooli */}
        <h1 className="jc-h1 char-name" style={{ fontSize: '2.2rem', marginBottom: '0.2rem' }}>
          {char.name}
        </h1>
        
        <div 
          className="char-role-badge" 
          style={{ 
            borderColor: themeColor, 
            color: themeColor,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={12} />
          {char.role}
        </div>

        {/* Kuvaus */}
        <div className="char-desc-box" style={{ marginTop: '1.5rem' }}>
          <p className="char-backstory">"{char.backstory}"</p>
          
          {/* Tehtävä (käytetään joko secret_mission tai mission) */}
          {(char.secret_mission || char.mission) && (
            <div className="char-mission-box">
              <span className="small char-mission-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color={themeColor} /> 
                TEHTÄVÄ:
              </span>
              <p className="char-mission-text">
                {char.secret_mission || char.mission}
              </p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

export default CharacterCard;