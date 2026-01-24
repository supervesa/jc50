import React from 'react';
import { User, BookOpen } from 'lucide-react';

const NexusCard = ({ character, onClick, onDossierClick, relationType }) => {
  const name = character.character_name || character.name || "Tuntematon";

  const getBadgeLabel = (type) => {
    const labels = {
      'spouse': 'PUOLISO',
      'avec': 'AVEC',
      'friend': 'YSTÄVÄ',
      'neighbor': 'NAAPURI',
      'relative': 'SERKKU',
      'business': 'BUSINESS'
    };
    return labels[type] || null;
  };

  const badgeLabel = getBadgeLabel(relationType);

  return (
    <div className="nexus-card-stack" onClick={() => onClick(character.id)}>
      {badgeLabel && (
        <div className={`relation-tag-corner ${relationType}`}>
          {badgeLabel}
        </div>
      )}
      <div className="card-avatar-top">
        {character.avatar_url ? (
          <img src={character.avatar_url} alt={name} className="avatar-stack" />
        ) : (
          <div className="avatar-stack-placeholder"><User size={20} /></div>
        )}
      </div>
      <div className="card-info-stack">
        <span className="card-name-small">{name}</span>
      </div>
      <button className="card-action-icon" onClick={(e) => { e.stopPropagation(); onDossierClick(character); }}>
        <BookOpen size={12} />
      </button>
    </div>
  );
};

export default NexusCard;