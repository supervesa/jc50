import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useHeistData } from '../../components/leader/useHeistData'; 
import { Diamond, Wine, Zap, Trophy } from 'lucide-react';

const AgentHeader = ({ identity }) => {
  const searchId = identity?.id || identity?.guest_id; 
  const { myStats, loading } = useHeistData(searchId);

  if (!identity) return null;

  // Datan valmistelu
  const score = loading ? '...' : (myStats ? myStats.xp : 0);
  const rank = loading ? '-' : (myStats ? `#${myStats.rank}` : '-');
  const hasBar = myStats?.found_secret_bar;
  const hasSecret = myStats?.completed_secret_mission;
  const isHot = myStats?.isHot;

  // --- KELLUVA PYÖREÄ TROPHY-NAPPI (PORTAL) ---
  // TÄMÄ ON SE TOIMIVA OSA - EI KOSKETA TÄHÄN
  const FloatingTrophy = () => (
    <Link 
      to={`/personal-stats?id=${searchId}`}
      style={{
        position: 'fixed',
        top: '12px',         
        right: '12px',       
        zIndex: 99999999,
        
        width: '56px',
        height: '56px',
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(0, 0, 0, 0.8))',
        border: '2px solid #ffd700',
        color: '#ffd700',
        boxShadow: '0 0 15px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255,215,0,0.1)',
        backdropFilter: 'blur(5px)',
        textDecoration: 'none',
        transform: 'translateZ(0)', 
        cursor: 'pointer',
        pointerEvents: 'auto',
        display: 'none'
      }}
    >
      <Trophy size={28} strokeWidth={1.5} />
    </Link>
  );

  return (
    <div style={{
      /* PÄÄLAATIKKO: Grid-asettelu 3 osaan */
      display: 'grid',
      // Grid: Vasen (1 osa) - Keski (Automaattinen leveys) - Oikea (1 osa)
      gridTemplateColumns: '1fr auto 1fr', 
      alignItems: 'center',
      
      backgroundColor: '#111',
      borderBottom: '1px solid #333',
      padding: '10px 10px',
      width: '100%',
      minHeight: '85px', 
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 50,
      fontFamily: "'Courier New', monospace",
    }}>
      
      {/* 1. VASEN LAITA: XP & MERKIT (Oma laatikko) */}
      <div style={{ justifySelf: 'start' }}>
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '6px',
          padding: '4px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
        }}>
          <span style={{ 
            color: '#00ff41', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5px' 
          }}>
            {score} XP
          </span>
          <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
            {hasBar 
              ? <Wine size={12} color="gold" style={{ filter: 'drop-shadow(0 0 3px gold)' }} />
              : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px dashed #333' }} /> 
            }
            {hasSecret 
              ? <Diamond size={12} color="cyan" style={{ filter: 'drop-shadow(0 0 3px cyan)' }} />
              : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px dashed #333' }} />
            }
          </div>
          <span style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
            {rank}
          </span>
        </div>
      </div>
      
      {/* 2. KESKIOSA: AVATAR VIREKKÄIN NIMEN KANSSA */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', // Pystysuunnassa keskelle
        gap: '12px',          // Väli kuvan ja tekstin välillä
      }}>
        
        {/* AVATAR */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '58px', height: '58px', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            border: '2px solid #555', 
            backgroundColor: '#000',
            boxShadow: '0 0 10px rgba(0,0,0,0.8)'
          }}>
            {identity.avatar ? (
              <img src={identity.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f0', fontSize: '26px' }}>
                {identity.realName?.charAt(0)}
              </div>
            )}
          </div>
          
          {/* KORJATTU LIEKKI-INDIKAATTORI (Täydellinen ympyrä) */}
          {isHot && (
            <div style={{ 
              position: 'absolute', 
              bottom: -2, 
              right: -2, 
              background: '#000', 
              borderRadius: '50%', 
              border: '1px solid #00ff41', 
              zIndex: 10,
              
              // NÄMÄ RIVIT TEKEVÄT SIITÄ TÄYDELLISEN YMPYRÄN:
              width: '18px',       // Kiinteä leveys
              height: '18px',      // Kiinteä korkeus (sama kuin leveys)
              display: 'flex',     // Flexbox käyttöön
              alignItems: 'center', // Keskitä pystysuunnassa
              justifyContent: 'center', // Keskitä vaakasuunnassa
              padding: 0           // Poistetaan padding, flex hoitaa keskityksen
            }}>
              <Zap size={12} color="#00ff41" fill="#00ff41"/>
            </div>
          )}
        </div>

        {/* TEKSTIT (Nimi ja ID) Oikealla puolella */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
          
          {/* Nimi */}
          <div style={{ 
            fontSize: '15px', fontWeight: 'bold', color: '#fff', 
            textTransform: 'uppercase', lineHeight: '1.1', maxWidth: '140px',
            whiteSpace: 'normal', marginBottom: '4px'
          }}>
            {identity.charName || identity.realName}
          </div>
          
          {/* ID */}
          <div style={{ 
            fontSize: '10px', color: '#888', fontFamily: 'monospace',
            background: '#1a1a1a', padding: '2px 4px', borderRadius: '4px',
            border: '1px solid #333', alignSelf: 'flex-start'
          }}>
            ID: <span style={{ color: '#ccc', fontWeight: 'bold' }}>{identity.agentCode || '---'}</span>
          </div>
        </div>

      </div>
      
      {/* 3. OIKEA LAITA: Tyhjä tila napin alla */}
      <div style={{ width: '50px' }}></div>
      
      {/* RENDERÖIDÄÄN SE TOIMIVA NAPPI */}
      {createPortal(<FloatingTrophy />, document.body)}

    </div>
  );
};

export default AgentHeader;