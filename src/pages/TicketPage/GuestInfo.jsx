import React from 'react';
import { User, Utensils } from 'lucide-react';

const GuestInfo = ({ guest, onSave }) => {
  return (
    <div className="jc-card medium">
      <h3 className="jc-h2">Omat Tiedot</h3>
      
      <div className="guest-info-section" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>
          <User size={14} /> NIMI
        </div>
        <div className="guest-value" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{guest.name}</div>
      </div>

      <div className="guest-info-section" style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>
          <Utensils size={14} /> ERITYISRUOKAVALIOT
        </div>
        <div className={`guest-value ${!guest.dietary_restrictions ? 'italic' : ''}`} style={{ color: guest.dietary_restrictions ? '#fff' : '#555' }}>
          {guest.dietary_restrictions || 'Ei ilmoitettuja rajoituksia'}
        </div>
      </div>

      <div className="edit-link-container" style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
        <button onClick={onSave} className="small" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline' }}>
          Muuta tietoja (ota yhteys järjestäjään)
        </button>
      </div>
    </div>
  );
};

export default GuestInfo;