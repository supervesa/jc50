import React from 'react';
import NexusCard from './NexusCard';
import NexusLines from './NexusLines';

const NexusGrid = ({ focalCharacter, neighbors, others, onCardClick, loading }) => {
  if (loading) return <div className="nexus-loading center mt-2">Ladataan verkostoa...</div>;

  return (
    <div className="nexus-grid-container">
      {focalCharacter && (
        <section className="nexus-section focal-section">
          <div className="nexus-focal-wrapper">
            <NexusCard character={focalCharacter} isFocal={true} onClick={onCardClick} />
          </div>
        </section>
      )}

      {focalCharacter && neighbors.length > 0 && (
        <NexusLines focalId={focalCharacter.id} neighbors={neighbors} />
      )}

      {neighbors.length > 0 && (
        <section className="nexus-section connections-section">
          <h2 className="nexus-section-title">Lähipiirisi</h2>
          <div className="nexus-grid">
            {neighbors.map(char => (
              <NexusCard key={char.id} character={char} onClick={onCardClick} />
            ))}
          </div>
        </section>
      )}

      <section className="nexus-section others-section">
        <h2 className="nexus-section-title">Muut juhlijat</h2>
        <div className="nexus-grid">
          {others.map(char => (
            <NexusCard key={char.id} character={char} onClick={onCardClick} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default NexusGrid;