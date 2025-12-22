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
    missions,       // Haetaan missiot datasta
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
   <div id="admin-page" className="admin-container">
      <h1>MISSION CONTROL</h1>

      <div className="admin-tabs">
        <button className={activeTab === 'LIVEWALL' ? 'active' : ''} onClick={() => setActiveTab('LIVEWALL')}>📺 LIVEWALL</button>
        <button className={activeTab === 'POLLS' ? 'active' : ''} onClick={() => setActiveTab('POLLS')}>📊 POLLS</button>
        <button className={activeTab === 'OPS' ? 'active' : ''} onClick={() => setActiveTab('OPS')}>⚡ OPS</button>
        <button className={activeTab === 'GUESTS' ? 'active' : ''} onClick={() => setActiveTab('GUESTS')}>👥 GUESTS</button>
      </div>

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
          missions={missions || []} // Välitetään missiot AdminOpsille
          guests={guests}           
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