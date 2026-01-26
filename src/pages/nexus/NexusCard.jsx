import React from 'react';
import { User, BookOpen, Lock } from 'lucide-react';

const NexusCard = ({ character, onClick, onDossierClick, relationType }) => {
  // Tarkistetaan nimi molemmista mahdollisista kentistä
  const name = character.character_name || character.name || "Tuntematon";
  const isLocked = character.isLocked;

  const getBadgeLabel = (type) => {
    const labels = {
      'spouse': 'PUOLISO',
      'avec': 'SEURALAINEN',
      'friend': 'YSTÄVÄ',
      'neighbor': 'NAAPURI',
      'relative': 'SUKULAINEN',
      'business': 'LIIKETUTTAVA',
      'enemy':'KILPAILIJAT',
      'lover': 'RAKASTAJA'
    };
    return labels[type] || null;
  };

  const badgeLabel = getBadgeLabel(relationType);

  // --- TYYLIT ---
  // Määritellään täysin eristetyt tyylit, jotta emme käytä konflikteja aiheuttavia luokkanimiä.

  // 1. AVATAR STYLE (Korvaa 'avatar-stack' luokan)
  const safeAvatarStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    aspectRatio: '1/1',
    border: '2px solid rgba(255,255,255,0.1)',
    marginBottom: '12px',
    display: 'block',
    // Lukitun tilan efektit
    filter: isLocked ? 'grayscale(1) brightness(0.5)' : 'none',
    opacity: isLocked ? 0.6 : 1,
    transition: 'filter 0.3s ease'
  };

  // 2. BADGE STYLE (Korvaa 'relation-tag-corner' luokan)
  const isSpecialRelation = ['spouse', 'avec'].includes(relationType);
  const badgeColor = isSpecialRelation ? '#ff00e5' : 'inherit';
  const badgeBorder = isSpecialRelation 
    ? '1px solid rgba(255, 0, 229, 0.4)' 
    : '1px solid rgba(255, 255, 255, 0.1)';

  const safeBadgeStyle = {
    position: 'absolute',
    top: '6px',
    right: '6px',
    fontSize: '0.48rem',
    fontWeight: '900',
    padding: '2px 4px',
    borderRadius: '3px',
    letterSpacing: '0.05em',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 5,
    textTransform: 'uppercase',
    pointerEvents: 'none',
    color: badgeColor,
    border: badgeBorder
  };

  return (
    <div 
      className={`nexus-card-stack ${isLocked ? 'is-locked' : ''}`} 
      onClick={() => onClick(character.id)}
    >
      {/* BADGE (Jos on suhde) */}
      {/* HUOM: Ei enää classNamea, joka viittaisi badgeen */}
      {badgeLabel && (
        <div style={safeBadgeStyle}>
          {badgeLabel}
        </div>
      )}

      {/* LUKKO-IKONI (Vain jos lukittu) */}
      {isLocked && (
        <div className="lock-corner-icon">
          <Lock size={12} />
        </div>
      )}

      {/* AVATAR */}
      <div className="card-avatar-top">
        {character.avatar_url ? (
          /* HUOM: Ei enää className="avatar-stack" */
          <img 
            src={character.avatar_url} 
            alt={name} 
            style={safeAvatarStyle} 
          />
        ) : (
          <div className="avatar-stack-placeholder"><User size={20} /></div>
        )}
      </div>

      {/* NIMI */}
      <div className="card-info-stack">
        <span className="card-name-small">{name}</span>
      </div>

      {/* ACTION NAPPI (Vain jos EI ole lukittu) */}
      {!isLocked && (
        <button className="card-action-icon" onClick={(e) => { e.stopPropagation(); onDossierClick(character); }}>
          <BookOpen size={12} />
        </button>
      )}
    </div>
  );
};

export default NexusCard;