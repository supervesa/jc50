import React from 'react';
import { BarChart2, CheckCircle } from 'lucide-react';
import '../AgentPage.css';

const DashboardPoll = ({ poll, hasVoted, onVote }) => {
  if (!poll) return null;

  // TILA: Olet jo äänestänyt -> Näytä vain kuittaus
  if (hasVoted) {
    return (
      <div className="dash-card poll-voted-card">
        <div className="poll-voted-content">
          <CheckCircle size={24} color="#00ff41" />
          <div>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>ÄÄNI VASTAANOTETTU</div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>Seuraa tuloksia screeniltä.</div>
          </div>
        </div>
      </div>
    );
  }

  // TILA: Äänestys käynnissä -> Näytä napit
  return (
    <div className="dash-card poll-active-card">
      <div className="poll-header">
        <div className="live-indicator">
          <div className="blink-dot"></div> LIVE
        </div>
        <div className="poll-title">ÄÄNESTYS KÄYNNISSÄ</div>
      </div>

      <h3 className="poll-question">{poll.question}</h3>

      <div className="poll-options-grid">
        {poll.options.map((option, index) => (
          <button 
            key={index} 
            className="btn-poll-option"
            onClick={() => onVote(index)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardPoll;