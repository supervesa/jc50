import React, { useState } from 'react';
import InfoCard from '../../components/InfoCard/InfoCard.jsx';
import HotelModal from '../../components/HotelModal/HotelModal.jsx';
import Countdown from '../../components/Countdown/Countdown.jsx'; // Tuodaan laskuri

function InfoSection() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <section className="jc-grid mb-2">
        
        {/* --- KORTTI 1: AIKA & LASKURI --- */}
        <div className="jc-col-4">
          <div className="jc-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* HUD-kulmat koristeeksi */}
            <div className="jc-hud-corners"></div>
            
            <h2 className="jc-h2">Milloin?</h2>
            <p>Lauantaina 31.1.2026<br />Klo 17:00 alkaen</p>
            
            {/* Laskuri komponentti */}
            <div style={{ marginTop: 'auto', paddingBottom: '0.5rem' }}>
              <Countdown />
            </div>
          </div>
        </div>
        
        {/* --- KORTTI 2: SIJAINTI & HOTELLI-IKONI --- */}
        <div className="jc-col-4">
          <div className="jc-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="jc-hud-corners"></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 className="jc-h2">Missä?</h2>
              
              {/* Neon-avain ikoni */}
              <svg className="jc-icon-glow" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--turquoise)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>

            <p>
              Etelätie 3, 50190 Mikkeli<br />
              (Salainen Klubi)
            </p>

            <div style={{ marginTop: 'auto' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>Tarvitsetko yösijaa?</p>
              <span 
                className="text-link" 
                onClick={() => setShowModal(true)}
                role="button"
                tabIndex={0}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Katso hotellit &rarr;
              </span>
            </div>
          </div>
        </div>
        
        {/* --- KORTTI 3: PUKUKOODI & RUSETTI-IKONI --- */}
        <div className="jc-col-4">
          <div className="jc-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="jc-hud-corners"></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 className="jc-h2">Pukukoodi?</h2>
              
              {/* Neon-rusetti ikoni */}
              <svg className="jc-icon-glow" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--magenta)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 11c.733.91 1.25 1.583 2 2 1.333.742 4 2 4 2s-1.5-5.5-2.5-7.5c-.2-.4.5-1.5-.5-2-1.25-.625-2.5-1-3.5-1-.889 0-1.806.417-2.5 2C11.5 5.5 10 9 10 9l6 2z"/>
                <path d="M8 11c-.733.91-1.25 1.583-2 2-1.333.742-4 2-4 2s1.5-5.5 2.5-7.5c.2-.4-.5-1.5.5-2 1.25-.625 2.5-1 3.5-1 .889 0 1.806.417 2.5 2 1.5 1 3 4.5 3 4.5l-6 2z"/>
                <circle cx="12" cy="10" r="2" fill="var(--plasma-gold)" stroke="none" />
              </svg>
            </div>

            <p>
              <strong style={{ color: 'var(--magenta)' }}>Neon Gatsby</strong><br />
              1920-luku kohtaa Cyberpunkin.
            </p>
            <p className="small">
              Smokki, hapsut, paljetit – mutta neonväreissä tai LED-asusteilla.
            </p>
          </div>
        </div>

      </section>

      {showModal && (
        <HotelModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

export default InfoSection;