import React, { useState } from 'react';
import './AdminPage.css';
import { useAdminData } from './useAdminData'; // Tuodaan uusi hook

// Komponentit
import AdminPolls from './AdminPolls';
import AdminOps from './AdminOps';
import AdminGuests from './AdminGuests';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('POLLS');
  
  // Puretaan kaikki data ja toiminnot custom hookista
  const { 
    loading, 
    polls, 
    voteCounts, 
    guests, 
    characters, 
    missions, 
    activeFlash, 
    flashCount, 
    clearChat 
  } = useAdminData();

  if (loading) return <div className="admin-container">Ladataan Mission Control...</div>;

  return (
    <div className="admin-container">
      <h1>MISSION CONTROL</h1>

      {/* TABS */}
      <div className="admin-tabs">
        <button className={activeTab === 'POLLS' ? 'active' : ''} onClick={() => setActiveTab('POLLS')}>📊 POLLS</button>
        <button className={activeTab === 'OPS' ? 'active' : ''} onClick={() => setActiveTab('OPS')}>🕵️ OPS</button>
        <button className={activeTab === 'GUESTS' ? 'active' : ''} onClick={() => setActiveTab('GUESTS')}>👥 HAHMOT</button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'POLLS' && (
        <AdminPolls polls={polls} voteCounts={voteCounts} />
      )}
      
      {activeTab === 'OPS' && (
        <AdminOps 
          activeFlash={activeFlash} 
          flashCount={flashCount} 
          missions={missions} 
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