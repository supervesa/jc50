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
    missions,       // <--- TÄMÄ OLI AIEMMIN, MUTTA Sitä EI VÄLITETTY ETEENPÄIN
    activeFlash, 
    flashCount, 
    startFlash, 
    stopFlash, 
    liveState, 
    setLiveMode, 
    setBroadcast,
    clearChat 
  } = useAdminData();

  if (loading) return <div className="admin-container">Ladataan Mission Control...</div>;

  return (
    <div className="admin-container">
      <h1>MISSION CONTROL</h1>

      <div className="admin-tabs">
        <button className={activeTab === 'LIVEWALL' ? 'active' : ''} onClick={() => setActiveTab('LIVEWALL')}>📺 LIVEWALL</button>
        <button className={activeTab === 'POLLS' ? 'active' : ''} onClick={() => setActiveTab('POLLS')}>📊 POLLS</button>
        <button className={activeTab === 'OPS' ? 'active' : ''} onClick={() => setActiveTab('OPS')}>⚡ OPS</button>
        <button className={activeTab === 'GUESTS' ? 'active' : ''} onClick={() => setActiveTab('GUESTS')}>👥 GUESTS</button>
      </div>

      {activeTab === 'LIVEWALL' && (
        <AdminLiveWallControl 
          liveState={liveState || { mode: 'FEED' }} // Estä kaatuminen jos null
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
          missions={missions || []} // <--- KORJAUS: Välitetään missions, ja varmistetaan ettei se ole null
          guests={guests}           // Välitetään myös nämä jos AdminOps tarvitsee
          characters={characters}
        />
      )}
      
      {activeTab === 'GUESTS' && (
        <AdminGuests characters={characters} guests={guests} />
      )}

      <div className="panic-section">
        <button className="btn-panic" onClick={clearChat}>☢ TYHJENNÄ CHAT ☢</button>
      </div>
    </div>
  );
};

export default AdminPage;