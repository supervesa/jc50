import React from 'react';
import { X, FileText, Info, User } from 'lucide-react'; // Lisätty User

const NexusModal = ({ character, onClose, contextText }) => {
  if (!character) return null;

  return (
    <div className="jc-modal-overlay" onClick={onClose}>
      <div className="jc-card nexus-modal-content" onClick={e => e.stopPropagation()}>
        <button className="nexus-modal-close" onClick={onClose}><X size={24} /></button>

        <div className="nexus-modal-header">
          <div className="nexus-modal-avatar-wrapper">
            {character.avatar_url ? (
              <img 
                src={character.avatar_url} 
                alt={character.name} 
                className="nexus-modal-avatar" 
              />
            ) : (
              <div style={{
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '50%'
              }}>
                <User size={60} color="rgba(255,255,255,0.5)" />
              </div>
            )}
          </div>
          <h2 className="jc-h2">{character.character_name || character.name}</h2>
          <span className="subject-label">SUBJECT DOSSIER</span>
        </div>

        <div className="nexus-modal-body">
          {contextText && (
            <div className="nexus-relation-box dossier-box">
              <div className="nexus-relation-header">
                <Info size={18} className="neon-text-cyan" />
                <span>Havainnot suhteesta</span>
              </div>
              <p className="nexus-context-text">{contextText}</p>
            </div>
          )}

          <div className="nexus-story-section">
            <h4 className="dossier-title"><FileText size={14} /> TAUSTATIEDOT</h4>
            <p className="dossier-text">{character.backstory}</p>
          </div>
        </div>

        <button className="jc-cta ghost" onClick={onClose} style={{ width: '100%' }}>Sulje raportti</button>
      </div>
    </div>
  );
};

export default NexusModal;