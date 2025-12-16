import React, { useState } from 'react'; // Lisätty useState
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useHeistData } from '../../components/leader/useHeistData'; 
import { Diamond, Wine, Zap, Trophy, X } from 'lucide-react'; // Lisätty X-ikoni

const AgentHeader = ({ identity }) => {
  // Tila modaalille
  const [showIdModal, setShowIdModal] = useState(false);

  const searchId = identity?.id || identity?.guest_id; 
  const { myStats, loading } = useHeistData(searchId);

  if (!identity) return null;

  const score = loading ? '...' : (myStats ? myStats.xp : 0);
  const rank = loading ? '-' : (myStats ? `#${myStats.rank}` : '-');
  const hasBar = myStats?.found_secret_bar;
  const hasSecret = myStats?.completed_secret_mission;
  const isHot = myStats?.isHot;
  const agentCode = identity.agentCode || '---';

  // --- KELLUVA TROPHY (PIILOSSA) ---
  const FloatingTrophy = () => (
    <Link 
      to={`/personal-stats?id=${searchId}`}
      style={{
        position: 'fixed', top: '12px', right: '12px', zIndex: 99999999,
        width: '56px', height: '56px', borderRadius: '50%',  alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(0, 0, 0, 0.8))',
        border: '2px solid #ffd700', color: '#ffd700',
        boxShadow: '0 0 15px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255,215,0,0.1)',
        backdropFilter: 'blur(5px)', textDecoration: 'none',
        transform: 'translateZ(0)', cursor: 'pointer', pointerEvents: 'auto',
        display: 'none'
      }}
    >
      <Trophy size={28} strokeWidth={1.5} />
    </Link>
  );

  // --- UUSI: ISO ID-MODAALI ---
  const IdModal = () => (
    createPortal(
      <div 
        onClick={() => setShowIdModal(false)} // Sulje klikkaamalla taustaa
        style={{
          position: 'fixed', inset: 0, zIndex: 999999999,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div 
          onClick={(e) => e.stopPropagation()} // Estä sulkeutuminen jos klikkaa boksia
          style={{
            background: '#2a2a2a', // Tumman harmaa pohja
            border: '2px solid #444',
            borderRadius: '20px', // Pyöristetyt reunat
            padding: '30px',
            maxWidth: '90%',
            width: '400px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            position: 'relative'
          }}
        >
          {/* Sulje-nappi */}
          <button 
            onClick={() => setShowIdModal(false)}
            style={{
              position: 'absolute', top: '15px', right: '15px',
              background: 'transparent', border: 'none', color: '#888',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>

          <h3 style={{ 
            color: '#aaa', margin: '0 0 20px 0', fontSize: '14px', 
            letterSpacing: '2px', textTransform: 'uppercase' 
          }}>
            Sinun Agentti ID
          </h3>

          {/* Numerot laatikoissa */}
          <div style={{ 
            display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' 
          }}>
            {agentCode.toString().split('').map((char, index) => (
              <div key={index} style={{
                width: '50px', height: '65px',
                background: '#111',
                border: '2px solid #555',
                borderRadius: '12px', // Pienempi pyöristys numeroille
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: 'bold', color: '#fff',
                fontFamily: 'monospace',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
              }}>
                {char}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '25px', fontSize: '12px', color: '#666' }}>
            Näytä tämä kysyttäessä.
          </div>
        </div>
      </div>,
      document.body
    )
  );

  return (
    <div style={{
      /* PÄÄLAATIKKO */
      display: 'grid',
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
      
      {/* 1. VASEN LAITA: XP & MERKIT */}
      <div style={{ justifySelf: 'start' }}>
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '6px',
          padding: '4px 8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
        }}>
          <span style={{ color: '#00ff41', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5px' }}>
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
      
      {/* 2. KESKIOSA: AVATAR JA NIMI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* AVATAR */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '58px', height: '58px', borderRadius: '50%', overflow: 'hidden', 
            border: '2px solid #555', backgroundColor: '#000',
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
          
          {isHot && (
            <div style={{ 
              position: 'absolute', bottom: -2, right: -2, background: '#000', 
              borderRadius: '50%', border: '1px solid #00ff41', zIndex: 10,
              width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0           
            }}>
              <Zap size={12} color="#00ff41" fill="#00ff41"/>
            </div>
          )}
        </div>

        {/* NIMI */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
          <div style={{ 
            fontSize: '15px', fontWeight: 'bold', color: '#fff', 
            textTransform: 'uppercase', lineHeight: '1.1', maxWidth: '140px',
            whiteSpace: 'normal'
          }}>
            {identity.charName || identity.realName}
          </div>
        </div>
      </div>
      
      {/* 3. OIKEA LAITA: KLIKATTAVA ID */}
      <div 
        onClick={() => setShowIdModal(true)} // KLIKKAUS AVAA MODAALIN
        style={{ 
          justifySelf: 'end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          cursor: 'pointer', // Osoitin muuttuu sormeksi
          padding: '5px'     // Hieman osumapinta-alaa
        }}
      >
        <span style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>AGENT ID</span>
        <div style={{ 
          fontSize: '16px', color: '#ccc', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px',
          textShadow: '0 0 5px rgba(255,255,255,0.1)',
          borderBottom: '1px dotted #555' // Visuaalinen vihje että on klikattava
        }}>
           {agentCode}
        </div>
      </div>
      
      {/* MODAALIT JA PORTALIT */}
      {showIdModal && <IdModal />}
      {createPortal(<FloatingTrophy />, document.body)}

    </div>
  );
};

export default AgentHeader;