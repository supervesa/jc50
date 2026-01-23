import React from 'react';
import { X, Target, Info, Heart, Home, Zap, Users, HelpCircle } from 'lucide-react';

const ICONS = { avec: Heart, neighbor: Home, rival: Zap, friend: Users, mystery: HelpCircle };

const NexusModal = ({ character, onClose, onFocusSwitch, isCurrentUser }) => {
  if (!character) return null;

  const { character_name, name, backstory, avatar_url, relationType, context, id } = character;
  const RelationIcon = ICONS[relationType] || Info;
  const displayName = character_name || name || "Nimetön hahmo";

  return (
    <div className="jc-modal-overlay" onClick={onClose}>
      <div className="jc-card nexus-modal-content" onClick={e => e.stopPropagation()}>
        <button className="nexus-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="nexus-modal-header">
          <div className="nexus-modal-avatar-wrapper">
            <img 
              src={avatar_url || "/api/placeholder/150/150"} 
              alt={displayName} 
              className="nexus-modal-avatar"
            />
          </div>
          <h2 className="jc-h2">{displayName}</h2>
        </div>

        <div className="nexus-modal-body">
          {/* Näytetään relaatioteksti vain, jos se on olemassa ja kyseessä ei ole käyttäjä itse */}
          {!isCurrentUser && context && (
            <div className="nexus-relation-box">
              <div className="nexus-relation-header">
                <RelationIcon size={18} className="neon-text-cyan" />
                <span>Yhteys sinuun</span>
              </div>
              <p className="nexus-context-text" style={{ color: '#ffffff', opacity: 1 }}>
                {context}
              </p>
            </div>
          )}

          <div className="nexus-story-section">
            <h4 className="small" style={{ color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Hahmon tarina
            </h4>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' }}>
              {backstory}
            </p>
          </div>
        </div>

        <div className="nexus-modal-footer">
          {!isCurrentUser && (
            <button 
              className="jc-cta primary" 
              onClick={() => onFocusSwitch(id)}
              style={{ width: '100%', display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}
            >
              <Target size={18} />
              Tutki verkostoa
            </button>
          )}
          <button className="jc-cta ghost" onClick={onClose} style={{ width: '100%' }}>
            Sulje
          </button>
        </div>
      </div>
    </div>
  );
};

export default NexusModal;