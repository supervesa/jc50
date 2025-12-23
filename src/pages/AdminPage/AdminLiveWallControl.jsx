import React, { useState } from 'react';
import PhotoModerator from './PhotoModerator'; 

const AdminLiveWallControl = ({ liveState, setLiveMode, setBroadcast }) => {
  const [msg, setMsg] = useState('');

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setBroadcast(msg);
    setMsg('');
  };

  const clearBroadcast = () => setBroadcast('');

  return (
    <div className="admin-section">
      <h2 className="jc-h2">📺 LIVEWALL MODE</h2>
      
      {/* 1. MOODIN VALINTA */}
      <div className="mode-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <button 
          onClick={() => setLiveMode('FEED')}
          style={{
            padding: '25px', 
            fontSize: '1.1rem', 
            fontWeight: 'bold',
            background: liveState.mode === 'FEED' ? '#00ff41' : '#222',
            color: liveState.mode === 'FEED' ? '#000' : '#888',
            border: liveState.mode === 'FEED' ? '2px solid #fff' : '1px solid #444',
            cursor: 'pointer',
            borderRadius: '8px'
          }}
        >
          🖼️ FEED
        </button>
        <button 
          onClick={() => setLiveMode('STATS')}
          style={{
            padding: '25px', 
            fontSize: '1.1rem', 
            fontWeight: 'bold',
            background: liveState.mode === 'STATS' ? '#ff00ff' : '#222',
            color: liveState.mode === 'STATS' ? '#fff' : '#888',
            border: liveState.mode === 'STATS' ? '2px solid #fff' : '1px solid #444',
            cursor: 'pointer',
            borderRadius: '8px'
          }}
        >
          📊 STATS
        </button>
        <button 
          onClick={() => setLiveMode('BLACKOUT')}
          style={{
            padding: '25px', 
            fontSize: '1.1rem', 
            fontWeight: 'bold',
            background: liveState.mode === 'BLACKOUT' ? 'red' : '#222',
            color: '#fff',
            border: liveState.mode === 'BLACKOUT' ? '2px solid #fff' : '1px solid #444',
            cursor: 'pointer',
            borderRadius: '8px'
          }}
        >
          ⬛ BLACKOUT
        </button>
      </div>

      <hr style={{ borderColor: '#333', margin: '30px 0' }} />

      {/* 2. BROADCAST VIESTI */}
      <h2 className="jc-h2">📢 BROADCAST MESSAGE (TICKER)</h2>
      
      {liveState.broadcast_message && (
        <div style={{
          background: 'rgba(0, 255, 255, 0.1)', 
          border: '1px solid var(--turquoise, cyan)', 
          padding: '15px', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '8px',
          gap: '10px',        // Lisätty väli elementtien väliin
          flexWrap: 'wrap'    // SALLII RIVITYKSEN MOBIILISSA
        }}>
          <div style={{ flex: '1 1 auto', minWidth: '200px' }}> {/* Joustava leveys */}
            <span style={{ color: '#888', fontSize: '0.9rem', display: 'block' }}>NYT NÄYTÖLLÄ:</span>
            <strong style={{ fontSize: '1.2rem', color: '#fff', wordBreak: 'break-word' }}> {/* Rivitys pitkälle sanalle */}
              "{liveState.broadcast_message}"
            </strong>
          </div>
          <button 
            onClick={clearBroadcast} 
            style={{
              background: '#ff3333', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '4px',
              flexShrink: 0,      // Estää nappia kutistumasta kasaan
              whiteSpace: 'nowrap' // Estää tekstin katkeamisen napin sisällä
            }}
          >
            POISTA X
          </button>
        </div>
      )}

      <form onSubmit={handleBroadcast} style={{ display: 'flex', gap: '15px', width: '100%', marginBottom: '40px' }}>
        <input 
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          placeholder="KIRJOITA VIESTI TÄHÄN (esim. Bussi lähtee!)..." 
          style={{
            flex: '1',
            width: 'auto',
            padding: '15px 20px',
            fontSize: '1.1rem',
            background: '#111',
            border: '2px solid #444',
            color: '#fff',
            borderRadius: '6px'
          }}
        />
        <button 
          type="submit" 
          className="btn-create"
          style={{
            flex: '0 0 auto',
            width: 'auto',
            minWidth: '120px',
            padding: '0 30px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            background: 'var(--magenta)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          LÄHETÄ 📢
        </button>
      </form>

      {/* 3. KUVAMODEROINTI */}
      <div style={{borderTop: '1px solid #444', paddingTop: '20px'}}>
        <PhotoModerator />
      </div>

    </div>
  );
};

export default AdminLiveWallControl;