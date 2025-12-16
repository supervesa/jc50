import React, { useState } from 'react';

const AdminLiveWallControl = ({ liveState, setLiveMode, setBroadcast }) => {
  const [msg, setMsg] = useState('');

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!msg.trim()) return; // Estä tyhjät viestit
    setBroadcast(msg);
    setMsg(''); // Tyhjennä kenttä lähetyksen jälkeen
  };

  const clearBroadcast = () => setBroadcast('');

  return (
    <div className="admin-section">
      <h2>📺 LIVEWALL MODE</h2>
      
      {/* MODE BUTTONS */}
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
            cursor: 'pointer'
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
            cursor: 'pointer'
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
            cursor: 'pointer'
          }}
        >
          ⬛ BLACKOUT
        </button>
      </div>

      <hr style={{ borderColor: '#333', margin: '20px 0' }} />

      <h2>📢 BROADCAST MESSAGE (TICKER)</h2>
      
      {/* ACTIVE MESSAGE DISPLAY */}
      {liveState.broadcast_message && (
        <div style={{
          background: 'rgba(0, 255, 255, 0.1)', 
          border: '1px solid var(--turquoise, cyan)', 
          padding: '15px', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '8px'
        }}>
          <div>
            <span style={{ color: '#888', fontSize: '0.9rem', display: 'block' }}>NYT NÄYTÖLLÄ:</span>
            <strong style={{ fontSize: '1.2rem', color: '#fff' }}>"{liveState.broadcast_message}"</strong>
          </div>
          <button 
            onClick={clearBroadcast} 
            style={{
              background: '#ff3333', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '4px'
            }}
          >
            POISTA X
          </button>
        </div>
      )}

      {/* INPUT FORM - KORJATTU TYYLIT */}
         <form onSubmit={handleBroadcast} style={{ display: 'flex', gap: '15px', width: '100%' }}>
        <input 
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          placeholder="KIRJOITA VIESTI TÄHÄN (esim. Bussi lähtee!)..." 
          style={{
            flex: '1',       // TÄMÄ ON TÄRKEÄ: Ottaa kaiken vapaan tilan (kasvaa)
            width: 'auto',   // Varmistetaan ettei leveys rajoita
            padding: '15px 20px',
            fontSize: '1.2rem',
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
            // YLIKIRJOITETAAN GLOBAALIT TYYLIT:
            flex: '0 0 auto', // Älä kasva, älä kutistu, ole automaattinen
            width: 'auto',    // TÄRKEÄ: Kumoaa "width: 100%" asetuksen
            minWidth: '150px',
            padding: '0 30px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
        >
          LÄHETÄ 📢
        </button>
      </form>
    </div>
  );
};

export default AdminLiveWallControl;