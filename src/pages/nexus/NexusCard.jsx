import React from 'react';
import { User, Heart, Home, Zap, Users, HelpCircle } from 'lucide-react';

const RELATION_CONFIG = {
  avec: { Icon: Heart, color: '#ff4d4d' },
  neighbor: { Icon: Home, color: '#4dabff' },
  rival: { Icon: Zap, color: '#ffcc00' },
  friend: { Icon: Users, color: '#4dff88' },
  mystery: { Icon: HelpCircle, color: '#a6a6a6' },
};

const NexusCard = ({ character, isFocal, onClick }) => {
  // Poimitaan molemmat nimivaihtoehdot
  const { id, character_name, name, avatar_url, relationType } = character;
  
  const config = RELATION_CONFIG[relationType] || { Icon: null, color: 'transparent' };
  const RelationIcon = config.Icon;
  
  // Käytetään sitä kumpaa löytyy (character_name tai name)
  const displayName = character_name || name || "Nimetön hahmo";

  return (
    <div 
      className={`nexus-card ${isFocal ? 'focal' : ''}`}
      onClick={() => onClick(character)}
      data-character-id={id}
    >
      {!isFocal && RelationIcon && (
        <div className="nexus-badge" style={{ backgroundColor: config.color }}>
          <RelationIcon size={14} color="white" strokeWidth={3} />
        </div>
      )}

      <div className="nexus-avatar-container">
        {avatar_url ? (
          <img src={avatar_url} alt={displayName} className="nexus-avatar" />
        ) : (
          <div className="nexus-avatar-placeholder"><User size={32} color="#555" /></div>
        )}
      </div>

      <div className="nexus-info">
        <h3 className="nexus-name" style={{ fontWeight: 'bold', color: '#fff' }}>
          {displayName}
        </h3>
      </div>

      {isFocal && (
        <div className="focal-tag">
          <User size={10} />
          <span>SINÄ</span>
        </div>
      )}
    </div>
  );
};

export default NexusCard;