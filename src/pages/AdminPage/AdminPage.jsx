import React, { useState } from 'react';
import './AdminPage.css';
import { useAdminData } from './useAdminData';

import AdminPolls from './AdminPolls';
import AdminOps from './AdminOps';
import AdminGuests from './AdminGuests';
import AdminLiveWallControl from './AdminLiveWallControl';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('LIVEWALL');
  
  const { 
    loading, 
    polls, 
    voteCounts, 
    guests, 
    characters, 
    missions,
    activeFlash, 
    flashCount, 
    startFlash, 
    stopFlash, 
    liveState, 
    setLiveMode, 
    setBroadcast,
    clearChat 
  } = useAdminData();

  if (loading) return <div className="admin-container" style={{padding:'20px'}}>Ladataan Mission Control...</div>;

  return (
   <div id="admin-page" className="admin-container">
      
      {/* 1. KIINTEÄ YLÄOSA (Header & Tabs) */}
      {/* Nämä pysyvät aina näkyvissä ruudun yläreunassa */}
      <div style={{ background: '#111', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <h1>MISSION CONTROL</h1>

        <div className="admin-tabs" style={{ marginBottom: 0 }}>
          <button className={activeTab === 'LIVEWALL' ? 'active' : ''} onClick={() => setActiveTab('LIVEWALL')}>📺 LIVEWALL</button>
          <button className={activeTab === 'POLLS' ? 'active' : ''} onClick={() => setActiveTab('POLLS')}>📊 POLLS</button>
          <button className={activeTab === 'OPS' ? 'active' : ''} onClick={() => setActiveTab('OPS')}>⚡ OPS</button>
          <button className={activeTab === 'GUESTS' ? 'active' : ''} onClick={() => setActiveTab('GUESTS')}>👥 GUESTS</button>
        </div>
      </div>

      {/* 2. RULLAAVA SISÄLTÖALUE (TÄMÄ PUUTTUI) */}
      {/* Kaikki vaihtuva sisältö laitetaan tähän diviin, joka osaa scrollata */}
      <div className="admin-content-scrollable">
        
        {activeTab === 'LIVEWALL' && (
          <AdminLiveWallControl 
            liveState={liveState || { mode: 'FEED' }} 
            setLiveMode={setLiveMode} 
            setBroadcast={setBroadcast} 
          />
        )}

        {activeTab === 'POLLS' && (
          <AdminPolls polls={polls} voteCounts={voteCounts} />
        )}
        
        {activeTab === 'OPS' && (
          <AdminOps 
            activeFlash={activeFlash} 
            flashCount={flashCount} 
            startFlash={startFlash} 
            stopFlash={stopFlash}
            missions={missions || []}
            guests={guests}           
            characters={characters}
          />
        )}
        
        {activeTab === 'GUESTS' && (
          <AdminGuests characters={characters} guests={guests} />
        )}

        {/* Panic Button listan hännillä */}
        <div className="panic-section" style={{ marginTop: '50px' }}>
          <button className="btn-panic" onClick={clearChat}>☢ TYHJENNÄ CHAT ☢</button>
        </div>

      </div>
    </div>
  );
};

export default AdminPage;