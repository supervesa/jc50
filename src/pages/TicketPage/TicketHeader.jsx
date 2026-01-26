import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, IdCard, Camera, ScanLine, ShieldCheck, Images } from 'lucide-react';
import './TicketPage.css';

// TUODAAN HOOKIT
import { useGameConfig } from '../../hooks/useGameConfig'; 
import { useSentinel } from '../../hooks/useSentinel';

function TicketHeader({ id, activeTab, setActiveTab }) {
  const wallLink = id ? `/wall/${id}` : '/wall';

  // SENTINEL ALUSTUS
  const { trackInteraction } = useSentinel(id, 'TICKET');

  // 1. Haetaan konfiguraatio
  const { 
    phaseValue, 
    isTester, 
    loading 
  } = useGameConfig(id);

  // 2. PÄIVITETTY LOGIIKKA
  
  // A. Agentti-nappi: Näkyy HYPE_WEEK (1) tai SHOWTIME (2) vaiheissa, tai testaajilla.
  // Tyyli: Plasma Gold (#D4AF37)
  const showAgentButton = !loading && (phaseValue >= 1 || isTester);
  
  // B. Live Wall -nappi: Näkyy kun ollaan vielä alussa (0) eikä olla testaajia.
  // Tyyli: Terävä Neon Magenta (#FF00E5)
  const showLiveWallButton = !loading && phaseValue === 0 && !isTester;

  return (
    <header className="ticket-header-container">
      
      {/* Yläpalkki: Status & ID & Wall-linkki */}
      <div className="ticket-top-bar">
        <div className="status-badge" style={{ color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)' }}>
          <ShieldCheck size={14} /> ACCESS GRANTED
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link 
            to={wallLink} 
            className="header-wall-link" 
            title="Avaa Juhlafeed"
            onClick={() => trackInteraction('TOP_WALL_LINK_CLICK', 'Quick Glance')}
          >
            <Images size={16} /> <span style={{ letterSpacing: '1px' }}>LIVE WALL</span>
          </Link>
        </div>
      </div>

      <h2 className="jc-h2 ticket-main-title" style={{ textAlign: 'center' }}>DIGITAALINEN LIPPU</h2>
      
      {/* --- PÄÄPAINIKE (HERO ACTION) --- */}

      {showAgentButton && (
        /* VAIHTOEHTO A: AGENTTI-KOMMUNIKAATTORI (Kulta/Plasma) */
        <div className="agent-hero-container">
          <Link 
            to={`/agent?id=${id}`} 
            className="agent-hero-btn agent-active" 
            style={{ borderColor: 'rgba(212,175,55,0.4)' }}
            onClick={() => trackInteraction('AGENT_COMMUNICATOR_OPEN', 'Deep Immersion')}
          >
            <div className="agent-icon-box" style={{ color: '#D4AF37', borderColor: '#D4AF37' }}>
              <Smartphone size={32} />
              <div className="ping-ring" style={{ borderColor: '#D4AF37' }}></div>
            </div>
            <div className="agent-text-box">
              <span className="agent-label" style={{ color: '#D4AF37' }}>YHTEYS MUODOSTETTU</span>
              <span className="agent-action">AVAA KOMMUNIKAATTORI</span>
            </div>
            <ScanLine className="scan-icon" size={20} style={{ color: '#D4AF37' }} />
          </Link>
        </div>
      )}

      {showLiveWallButton && (
        /* VAIHTOEHTO B: VALOKUVASEINÄ / LIVE WALL (Neon Magenta) */
        <div className="agent-hero-container">
          <Link 
            to={wallLink} 
            className="agent-hero-btn wall-active" 
            style={{ 
              borderColor: 'rgba(255, 0, 229, 0.5)', 
              background: 'rgba(255, 0, 229, 0.03)',
              boxShadow: '0 0 30px rgba(255, 0, 229, 0.15)'
            }}
            onClick={() => trackInteraction('HERO_LIVE_WALL_OPEN', 'Quick Glance')}
          >
            <div className="agent-icon-box" style={{ color: '#FF00E5', borderColor: '#FF00E5' }}>
              <Images size={32} />
              <div className="ping-ring" style={{ borderColor: '#FF00E5' }}></div>
            </div>
            <div className="agent-text-box">
              <span className="agent-label" style={{ color: '#FF00E5', fontWeight: '800' }}>VALOKUVASEINÄ</span>
              <span className="agent-action" style={{ color: '#EAFBFF' }}>AVAA LIVE WALL</span>
            </div>
            <div className="scan-icon" style={{ color: '#FF00E5' }}>
               <Camera size={20} />
            </div>
          </Link>
        </div>
      )}

      {/* --- NAVIGAATIO: Segmented Control --- */}
      <div className="ticket-nav-wrapper">
        <div className="ticket-nav-pill" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button 
            onClick={() => {
              setActiveTab('IDENTITY');
              trackInteraction('TAB_CHANGE_IDENTITY', 'Quick Glance');
            }}
            className={`nav-segment ${activeTab === 'IDENTITY' ? 'active' : ''}`}
          >
            <IdCard size={18} />
            <span>Identiteetti</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveTab('PHOTO');
              trackInteraction('TAB_CHANGE_PHOTO', 'Quick Glance');
            }}
            className={`nav-segment ${activeTab === 'PHOTO' ? 'active' : ''}`}
          >
            <Camera size={18} />
            <span>Kymppikuva</span>
          </button>
          
          <div className={`nav-slider ${activeTab === 'PHOTO' ? 'right' : 'left'}`}></div>
        </div>
      </div>

    </header>
  );
}

export default TicketHeader;