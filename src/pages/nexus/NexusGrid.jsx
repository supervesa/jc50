import React from 'react';
import NexusCard from './NexusCard';

const NexusGrid = ({ neighbors, groupedOthers, onCardClick, onDossierClick }) => {
  return (
    <div className="nexus-grid-container">
      {/* 1. LÄHIPIIRI */}
      {neighbors && neighbors.length > 0 && (
        <section className="nexus-section">
          <h2 className="nexus-section-title">SUORA VERKOSTO</h2>
          <div className="nexus-main-grid">
            {neighbors.map(char => (
              <NexusCard 
                key={char.id} 
                character={char} 
                relationType={char.relationType} 
                onClick={onCardClick} 
                onDossierClick={onDossierClick} 
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. MUUT JUHLIJAT */}
      {groupedOthers && groupedOthers.length > 0 && (
        <section className="nexus-section">
          <h2 className="nexus-section-title">MUUT JUHLIJAT</h2>
          <div className="nexus-main-grid dense">
            {groupedOthers.map((group, idx) => (
              // Jos on pariskunta, tehdään harmaa laatikko (paitsi mobiilissa css hoitaa sen)
              group.type === 'couple' ? (
                <div key={`couple-${idx}`} className="nexus-group-island couple">
                  {group.members.map(char => (
                    <NexusCard 
                      key={char.id} 
                      character={char} 
                      onClick={onCardClick} 
                      onDossierClick={onDossierClick} 
                    />
                  ))}
                </div>
              ) : (
                // Jos on yksittäinen
                <NexusCard 
                  key={group.members[0].id} 
                  character={group.members[0]} 
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