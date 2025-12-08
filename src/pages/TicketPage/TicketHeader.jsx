import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, IdCard, Camera, ScanLine, ShieldCheck } from 'lucide-react';
import './TicketPage.css';

function TicketHeader({ id, activeTab, setActiveTab }) {
  return (
    <header className="ticket-header-container">
      
      {/* Yläpalkki: Status & ID */}
      <div className="ticket-top-bar">
        <div className="status-badge">
          <ShieldCheck size={14} /> ACCESS GRANTED
        </div>
        <div className="ticket-id-display">
          ID: {id ? id.slice(0, 8).toUpperCase() : '........'}
        </div>
      </div>

      <h2 className="jc-h2 ticket-main-title">DIGITAALINEN LIPPU</h2>
      
      {/* HERO ACTION: Agentti-nappi */}
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