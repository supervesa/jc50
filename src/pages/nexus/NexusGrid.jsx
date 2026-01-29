import React, { useState } from 'react';
import NexusCard from './NexusCard';

const NexusGrid = ({ neighbors, groupedOthers, onCardClick, onDossierClick, focalCharName }) => {
  const [activeBubbleId, setActiveBubbleId] = useState(null);

  const handleCardInteraction = (targetId) => {
    if (activeBubbleId === targetId) {
      setActiveBubbleId(null);
      onCardClick(targetId);
    } else {
      setActiveBubbleId(targetId);
    }
  };

  const handleBackgroundClick = () => {
    if (activeBubbleId !== null) {
      setActiveBubbleId(null);
    }
  };

  return (
    <div 
      className="nexus-grid-container" 
      onClick={handleBackgroundClick} 
      style={{ minHeight: '80vh' }} 
    >
      {/* 1. SUORA VERKOSTO (Ajatuskuplat käytössä) */}
      {neighbors && neighbors.length > 0 && (
        <section className="nexus-section">
          <h2 className="nexus-section-title">SUORA VERKOSTO</h2>
          <div className="nexus-main-grid">
            {neighbors.map(char => (
              <NexusCard 
                key={char.id} 
                character={char} 
                relationType={char.relationType} 
                contextText={char.contextText}
                // Kupla-logiikka päällä vain tässä osiossa
                isActive={activeBubbleId === char.id}
                isDimmed={activeBubbleId !== null && activeBubbleId !== char.id}
                viewerName={focalCharName}
                onClick={handleCardInteraction} 
                onDossierClick={onDossierClick} 
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. MUUT JUHLIJAT (Vain suora linkki, ei ajatuksia) */}
      {groupedOthers && groupedOthers.length > 0 && (
        <section className="nexus-section">
          <h2 className="nexus-section-title">MUUT JUHLIJAT</h2>
          <div className="nexus-main-grid dense">
            {groupedOthers.map((group, idx) => (
              group.type === 'couple' ? (
                <div key={`couple-${idx}`} className="nexus-group-island couple">
                  {group.members.map(char => (
                    <NexusCard 
                      key={char.id} 
                      character={char} 
                      relationType={char.relationType || null}
                      // MUUTOS: Aina false, jotta kupla ei aukea
                      isActive={false} 
                      // MUUTOS: Himmennetään jos ylhäällä on joku auki
                      isDimmed={activeBubbleId !== null} 
                      viewerName={focalCharName}
                      // MUUTOS: Suora navigointi ilman väliaskelta
                      onClick={onCardClick} 
                      onDossierClick={onDossierClick} 
                    />
                  ))}
                </div>
              ) : (
                <NexusCard 
                  key={group.members[0].id} 
                  character={group.members[0]} 
                  relationType={group.members[0].relationType || null}
                  // MUUTOS: Aina false
                  isActive={false}
                  // MUUTOS: Himmennetään jos ylhäällä on joku auki
                  isDimmed={activeBubbleId !== null}
                  viewerName={focalCharName}
                  // MUUTOS: Suora navigointi
                  onClick={onCardClick} 
                  onDossierClick={onDossierClick} 
                />
              )
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default NexusGrid;