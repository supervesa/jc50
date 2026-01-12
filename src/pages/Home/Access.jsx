import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ShieldCheck } from 'lucide-react';

const Access = ({ username, ticketId, phase, phaseValue }) => {
  const navigate = useNavigate();

  return (
    <div className="access-view-container" style={{ paddingTop: '60px' }}>
      {/* VIP HERO - Ei introa, suoraan asiaan */}
      <section className="access-hero" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 className="jc-h2" style={{ opacity: 0.8 }}>Tervetuloa takaisin</h2>
        <h1 className="jc-h1 neon-text-cyan" style={{ fontSize: '4rem', marginBottom: '20px' }}>
          {username.toUpperCase()}
        </h1>
        
        <button 
          className="btn-neon-main pulse-cyan" 
          onClick={() => navigate(`/lippu/${ticketId}`)}
          style={{ padding: '20px 50px', fontSize: '1.3rem' }}
        >
          <UserCheck size={24} style={{ marginRight: '12px' }} /> ASTU SISÄÄN
        </button>
      </section>

      {/* SENTINEL DASHBOARD - Aina näkyvissä tunnistetuille */}
      <section className="jc-card medium mb-4" style={{ border: '1px solid #00ff41', background: 'rgba(0, 20, 0, 0.4)' }}>
        <div className="sentinel-terminal">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <ShieldCheck color="#00ff41" size={20} />
            <h3 style={{ color: '#00ff41', fontFamily: 'monospace', margin: 0 }}>[ SENTINEL_ACCESS_GRANTED ]</h3>
          </div>
          
          <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#008f11', lineHeight: '1.6' }}>
            <p>&gt; STATUS: Henkilöllisyys vahvistettu</p>
            <p>&gt; CURRENT_PHASE: {phase}</p>
            <p>&gt; ENCRYPTION: Active</p>
            <p>&gt; TARGET_NODE: {ticketId.substring(0, 8)}... (Ticket Active)</p>
            <p style={{ animation: 'blink 1.5s infinite', marginTop: '10px', color: '#00ff41' }}>
              &gt; {phaseValue >= 1 ? 'SENTINEL_OVERRIDE_ACTIVE' : 'READY_FOR_DISPATCH'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Access;