import React from 'react';
import { Link } from 'react-router-dom';
import './TicketPage.css'; // Varmista polku

function TicketHeader({ id, activeTab, setActiveTab }) {
  return (
    <header className="ticket-header">
      <h2 className="jc-h2">DIGITAALINEN LIPPU</h2>
      
      <div className="agent-link-container">
        <Link to={`/agent?id=${id}`} className="jc-cta agent-btn">
          🕵️ AVAA SALAINEN KOMMUNIKAATTORI
        </Link>
      </div>

      <div className="ticket-tabs">
        <button 
          onClick={() => setActiveTab('IDENTITY')}
          className={`jc-filter-btn ticket-tab-btn ${activeTab === 'IDENTITY' ? 'active' : ''}`}
        >
          🆔 Identiteetti
        </button>
        <button 
          onClick={() => setActiveTab('PHOTO')}
          className={`jc-filter-btn ticket-tab-btn ${activeTab === 'PHOTO' ? 'active' : ''}`}
        >
          📸 Kymppikuva
        </button>
      </div>
    </header>
  );
}

export default TicketHeader;