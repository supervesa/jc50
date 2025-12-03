import React from 'react';

function HotelModal({ onClose }) {
  // Estetään sulkeutuminen, jos klikataan kortin sisälle
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    // Tumma tausta (overlay), joka peittää muun sivun
    <div className="jc-modal-overlay" onClick={onClose}>
      
      {/* Itse modaali-ikkuna */}
      <div className="jc-card medium" style={{ maxWidth: '500px', width: '90%' }} onClick={handleContentClick}>
        <h2 className="jc-h2">Majoitus Mikkelissä</h2>
        <p>Tässä suosituksia lähellä olevista hotelleista:</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          
          <a href="https://www.scandichotels.fi/hotellit/suomi/mikkeli/scandic-mikkeli" target="_blank" rel="noopener noreferrer" className="jc-cta ghost">
            Scandic Mikkeli
          </a>
          
          <a href="https://www.sokoshotels.fi/hotellit/mikkeli/original-sokos-hotel-vaakuna" target="_blank" rel="noopener noreferrer" className="jc-cta ghost">
            Sokos Hotel Vaakuna
          </a>
              <a href="https://huoneistohotellimarja.fi" target="_blank" rel="noopener noreferrer" className="jc-cta ghost">
            Hotelli ja Hostelli Marja
          </a>
          
          <a href="https://uusikuu.fi" target="_blank" rel="noopener noreferrer" className="jc-cta ghost">
            Hotelli Uusikuu
          </a>

        </div>

        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <button onClick={onClose} className="small" style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Sulje ikkuna
          </button>
        </div>
      </div>
    </div>
  );
}

export default HotelModal;