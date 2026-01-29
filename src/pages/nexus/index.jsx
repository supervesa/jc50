import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useNexusLogic } from './useNexusLogic';
import NexusGrid from './NexusGrid';
import NexusModal from './NexusModal';
import { RotateCcw, BookOpen, Lock } from 'lucide-react';
import './nexus.css';

// SENTINEL
import { useSentinel } from '../../hooks/useSentinel';

const NexusPage = () => {
  const { ticketId } = useParams();
  const topRef = useRef(null);
  const { focalChar, isPublic, isTester, neighbors, groupedOthers, loading, error, currentFocusId, setCurrentFocusId, originalCharId } = useNexusLogic(ticketId);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // SENTINEL ALUSTUS
  const { trackInteraction } = useSentinel(ticketId, 'NEXUS');

  useEffect(() => {
    if (currentFocusId && !loading) topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentFocusId, loading]);

  if (loading) return <div className="jc-wrapper mt-5 text-center neon-text-cyan">ALUSTETAAN NEURAALILINKKIÄ...</div>;
  if (error) return <div className="jc-wrapper mt-5 text-center neon-text-magenta">HUOMIO: {error}</div>;

  const canSeeMap = isPublic || isTester;

  return (
    <div className="nexus-page-wrapper jc-wrapper" ref={topRef}>
      <header className="nexus-header">
        <h1 className="jc-h1">NEXUS</h1>
        {currentFocusId !== originalCharId && (
          <button 
            className="nexus-reset-btn" 
            onClick={() => {
              setCurrentFocusId(originalCharId);
              trackInteraction('NEXUS_RESET_VIEW', 'Quick Glance');
            }}
          >
            <RotateCcw size={14} /> PALAA OMAAN NÄKYMÄÄN
          </button>
        )}
      </header>

      {focalChar && (
        <div className={`nexus-dossier-hero ${focalChar.isLocked ? 'is-locked-hero' : ''}`}>
          <div className={`status-badge ${!focalChar.isLocked ? 'public' : 'private'}`}>
            {!focalChar.isLocked ? '● JULKINEN' : '● SALATTU'}
          </div>
          <div className="dossier-entry single-focal">
            <div className="dossier-header-mini">
              <img src={focalChar.avatar_url || "/api/placeholder/100/100"} alt="avatar" className="dossier-img" />
              <div className="dossier-meta">
                <h3>{focalChar.character_name || focalChar.name}</h3>
                <p className="status-note">
                  {focalChar.isLocked ? "Yhteys muodostetaan. Tiedot salattu." : "Yhteys vahvistettu."}
                </p>
                {!focalChar.isLocked && (
                   <button 
                    className="dossier-pill-btn" 
                    onClick={() => {
                      setSelectedCharacter(focalChar);
                      trackInteraction('NEXUS_READ_STORY_FOCAL', 'Operative Briefing');
                    }}
                  >
                     <BookOpen size={10} /> LUE TARINA
                   </button>
                )}
              </div>
            </div>
            <p className="dossier-teaser">
              {focalChar.isLocked 
                ? "Tämän hahmon neuraalidata on vielä rajoitettua tai odottaa vahvistusta." 
                : (focalChar.backstory?.split(/[.!?]/).slice(0, 2).join('. ') + '...')}
            </p>
          </div>
        </div>
      )}

      {canSeeMap ? (
        <NexusGrid 
          neighbors={neighbors} 
          groupedOthers={groupedOthers} 
          // UUSI PROP: Välitetään kertojan nimi (focalChar) gridille ja korteille
          focalCharName={focalChar ? (focalChar.character_name || focalChar.name).split(' ')[0] : 'Tuntematon'}
          onCardClick={(id) => {
            setCurrentFocusId(id);
            trackInteraction('NEXUS_NEIGHBOR_CLICK', 'Operative Briefing');
          }} 
          onDossierClick={(char) => {
            setSelectedCharacter(char);
            trackInteraction('NEXUS_READ_STORY_GRID', 'Operative Briefing');
          }} 
        />
      ) : (
        <div className="nexus-locked-overlay">
          <div className="locked-content">
            <Lock size={40} className="mb-3" />
            <h2>VERKOSTO ON LUKITTU</h2>
            <p>Lataa profiili-kuva lippusivulla ja hyväksy hahmosi nähdäksesi verkoston.</p>
          </div>
        </div>
      )}

      {selectedCharacter && <NexusModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />}
    </div>
  );
};

export default NexusPage;