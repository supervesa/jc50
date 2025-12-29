import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, IdCard, Camera, ScanLine, ShieldCheck, Images } from 'lucide-react';
import './TicketPage.css';

// 1. Tuodaan uusi hook pelitilan tarkistusta varten
import { useGameConfig } from '../../hooks/useGameConfig'; 

function TicketHeader({ id, activeTab, setActiveTab }) {
  // Varmistetaan että ID on olemassa linkkiä varten, muuten estetään 'undefined' urlissa
  const wallLink = id ? `/wall/${id}` : '/wall';

  // 2. Haetaan konfiguraatio ja oikeudet
  // phaseValue: 0=TicketOnly, 1=Lobby, 2=Live
  // isTester: true jos admin on antanut beta-oikeudet
  const { phaseValue, isTester, loading } = useGameConfig(id);

  // 3. Logiikka napin näyttämiselle
  // Näytä jos: Ei lataa JA (Peli on LIVE (>=2) TAI Käyttäjä on testaaja)
  const showAgentButton = !loading && (phaseValue >= 2 || isTester);
  
  // Tunnistetaan Lobby-tila (Info auki, mutta peli kiinni) teaseria varten
  const isLobbyMode = !loading && phaseValue === 1 && !isTester;

  return (
    <header className="ticket-header-container">
      
      {/* Yläpalkki: Status & ID & Wall-linkki */}
      <div className="ticket-top-bar">
        <div className="status-badge">
          <ShieldCheck size={14} /> ACCESS GRANTED
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* LINKKI SEINÄLLE */}
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
              <span className="agent-label">TEHTÄVÄT & VIESTIT</span>
              <span className="agent-action">AVAA SALAINEN KOMMUNIKAATTORI</span>
            </div>
            <ScanLine className="scan-icon" size={20} />
          </Link>
        </div>
      ) : isLobbyMode ? (
        // LOBBY-TILAN TEASER (Näytetään kun hahmot on julkaistu, mutta peli ei ole vielä käynnissä)
        <div className="agent-hero-container" style={{opacity: 0.7, pointerEvents: 'none'}}>
          <div className="agent-hero-btn" style={{background: '#222', borderColor: '#444'}}>
             <div className="agent-icon-box">
               <Smartphone size={32} color="#666" />
             </div>
             <div className="agent-text-box">
               <span className="agent-label" style={{color: '#888'}}>JÄRJESTELMÄ ALUSTAA...</span>
               <span className="agent-action" style={{color: '#666'}}>ODOTA YHTEYDEN MUODOSTUSTA</span>
             </div>
          </div>
        </div>
      ) : (
        // TICKET ONLY -TILA (Ei näytetä mitään tai pelkkä tyhjä tila)
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
          
          {/* Liukuva tausta-animaatio css:llä */}
          <div className={`nav-slider ${activeTab === 'PHOTO' ? 'right' : 'left'}`}></div>
        </div>
      </div>

    </header>
  );
}

export default TicketHeader;