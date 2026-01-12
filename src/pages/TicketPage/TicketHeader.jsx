import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, IdCard, Camera, ScanLine, ShieldCheck, Images } from 'lucide-react';
import './TicketPage.css';

// TUODAAN HOOK
import { useGameConfig } from '../../hooks/useGameConfig'; 

function TicketHeader({ id, activeTab, setActiveTab }) {
  const wallLink = id ? `/wall/${id}` : '/wall';

  // 1. KORJATTU DESTRUKTUROINTI: Haetaan kaikki tarvittavat muuttujat hookista
  const { 
    phaseValue, 
    isTester, 
    loading 
  } = useGameConfig(id);

  // 2. PÄIVITETTY LOGIIKKA:
  // showAgentButton: Nappi näkyy heti kun vaihe on HYPE_WEEK (>=1) tai jos käyttäjä on testaaja.
  const showAgentButton = !loading && (phaseValue >= 1 || isTester);
  
  // isEarlyAccess: Näytetään teaser ("Alustetaan") vain kun vaihe on 0 (EARLY_ACCESS / TICKET_ONLY).
  const isEarlyAccess = !loading && phaseValue === 0 && !isTester;

  return (
    <header className="ticket-header-container">
      
      {/* Yläpalkki: Status & ID & Wall-linkki */}
      <div className="ticket-top-bar">
        <div className="status-badge">
          <ShieldCheck size={14} /> ACCESS GRANTED
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to={wallLink} className="header-wall-link" title="Avaa Juhlafeed">
            <Images size={16} /> <span>LIVE WALL</span>
          </Link>
        </div>
      </div>

      <h2 className="jc-h2 ticket-main-title">DIGITAALINEN LIPPU</h2>
      
      {/* HERO ACTION: Agentti-nappi (EHDOLINEN RENDERÖINTI) */}
      {showAgentButton ? (
        <div className="agent-hero-container">
          <Link to={`/agent?id=${id}`} className="agent-hero-btn">
            <div className="agent-icon-box">
              <Smartphone size={32} />
              <div className="ping-ring"></div>
            </div>
            <div className="agent-text-box">
              <span className="agent-label">YHTEYS MUODOSTETTU</span>
              <span className="agent-action">AVAA SALAINEN KOMMUNIKAATTORI</span>
            </div>
            <ScanLine className="scan-icon" size={20} />
          </Link>
        </div>
      ) : isEarlyAccess ? (
        /* VAIHE 0 (EARLY ACCESS) TEASER - Näytetään ennen kuin kommunikaattori aktivoituu */
        <div className="agent-hero-container" style={{opacity: 0.7}}>
          <div className="agent-hero-btn" style={{background: '#1a1a1a', borderColor: '#333', cursor: 'default'}}>
             <div className="agent-icon-box">
               <Smartphone size={32} color="#555" />
             </div>
             <div className="agent-text-box">
               <span className="agent-label" style={{color: '#666'}}>JÄRJESTELMÄ ALUSTAA...</span>
               <span className="agent-action" style={{color: '#888'}}>ODOTA YHTEYDEN MUODOSTUSTA</span>
             </div>
          </div>
        </div>
      ) : (
        /* Ei näytetä mitään jos vaihe on määrittelemätön tai loading */
        null
      )}

      {/* NAVIGAATIO: Segmented Control */}
      <div className="ticket-nav-wrapper">
        <div className="ticket-nav-pill">
          <button 
            onClick={() => setActiveTab('IDENTITY')}
            className={`nav-segment ${activeTab === 'IDENTITY' ? 'active' : ''}`}
          >
            <IdCard size={18} />
            <span>Identiteetti</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('PHOTO')}
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