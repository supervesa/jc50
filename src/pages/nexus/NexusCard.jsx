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

  return (
    <div 
      className={`nexus-card-stack ${isLocked ? 'is-locked' : ''}`} 
      onClick={() => onClick(character.id)}
    >
      {/* BADGE (Jos on suhde) */}
      {badgeLabel && (
        <div className={`relation-tag-corner ${relationType}`}>
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
          <img src={character.avatar_url} alt={name} className="avatar-stack" />
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