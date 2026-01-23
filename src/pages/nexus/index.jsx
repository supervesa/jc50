import React, { useState } from 'react';
import { useNexusLogic } from './useNexusLogic'; // NIMETTY TUONTI
import NexusGrid from './NexusGrid';           // DEFAULT TUONTI
import NexusModal from './NexusModal';         // DEFAULT TUONTI
import './nexus.css';

const NexusPage = () => {
  const { focalCharacter, neighbors, others, loading, error, setFocusId } = useNexusLogic();
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleSwitchFocus = (id) => {
    setFocusId(id);
    setSelectedCharacter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) return <div className="jc-wrapper mt-2">Virhe haettaessa verkostoa: {error}</div>;

  return (
    <div className="nexus-page-wrapper jc-wrapper">
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="jc-h1">NEXUS</h1>
      </header>

      <NexusGrid 
        focalCharacter={focalCharacter}
        neighbors={neighbors}
        others={others}
        onCardClick={setSelectedCharacter}
        loading={loading}
      />

      {selectedCharacter && (
        <NexusModal 
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onFocusSwitch={handleSwitchFocus}
          isCurrentUser={focalCharacter && selectedCharacter.id === focalCharacter.id}
        />
      )}
    </div>
  );
};

export default NexusPage;