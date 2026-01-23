import React from 'react';
import { Link, useParams } from 'react-router-dom'; // Lisätty useParams
import { Share2, Users, ChevronRight } from 'lucide-react';
import { useGameConfig } from '../../hooks/useGameConfig'; 

const NexusTeaser = ({ characterName }) => {
  // Haetaan ID suoraan URL:stä (sama 'id' kuin TicketPagella)
  const { id } = useParams();

  const { 
    phaseValue, 
    isTester, 
    loading 
  } = useGameConfig(id);

  // Varmistetaan näkyvyys
  const isVisible = !loading && (phaseValue >= 1 || isTester);

  if (!isVisible) return null;

  return (
    <div className="jc-card mt-2" style={{ padding: '1.2rem', position: 'relative' }}>
      <div className="jc-hud-corners"></div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ background: 'rgba(0,231,255,0.1)', padding: '10px', borderRadius: '10px' }}>
          <Share2 className="neon-text-cyan" size={24} />
        </div>
        <div>
          <h3 className="jc-h2" style={{ fontSize: '1.1rem', margin: 0 }}>NEXUS VERKOSTO</h3>
          <p className="small" style={{ margin: 0 }}>
            {characterName}, katso kuka muu on jo täällä.
          </p>
        </div>
      </div>

      {/* Käytetään nyt varmasti oikeaa 'id' muuttujaa */}
      <Link 
        to={`/nexus/${id}`} 
        className="jc-cta primary" 
        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
      >
        <Users size={16} /> Avaa Nexus <ChevronRight size={14} />
      </Link>
    </div>
  );
};

export default NexusTeaser;