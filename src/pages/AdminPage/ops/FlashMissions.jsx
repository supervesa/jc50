import React from 'react';
import { supabase } from '../../../lib/supabaseClient';

const FlashMissions = ({ activeFlash, flashCount }) => {
  
  const startFlash = async (type, title, xp) => {
    // Lopeta edellinen jos on
    if (activeFlash) {
       await supabase.from('flash_missions').update({ status: 'ended', end_time: new Date().toISOString() }).eq('id', activeFlash.id);
    }
    
    await supabase.from('flash_missions').insert({ 
      type, title, xp_reward: xp, status: 'active' 
    });
  };

  const stopFlash = async () => {
    if (!activeFlash) return;
    await supabase.from('flash_missions').update({ 
      status: 'ended', 
      end_time: new Date().toISOString() 
    }).eq('id', activeFlash.id);
  };

  return (
    <div className="admin-section">
      <h2>⚡ FLASH MISSIONS (DJ TOOLS)</h2>
      
      {activeFlash ? (
        <div className="flash-active-card">
          <h3 className="blink">⚠️ LIVE: {activeFlash.title}</h3>
          <div className="flash-stats">SUORITNUITTA: {flashCount}</div>
          <button className="btn-stop-large" onClick={stopFlash}>⏹ PÄÄTÄ TEHTÄVÄ</button>
        </div>
      ) : (
        <div className="flash-buttons">
          <button className="btn-flash mob" onClick={() => startFlash('mob', 'KAIKKI TANSSILATTIALLE!', 100)}>
            💃 MOB
          </button>
          <button className="btn-flash race" onClick={() => startFlash('race', 'NOPEUSKISA!', 500)}>
            🏁 RACE
          </button>
          <button className="btn-flash photo" onClick={() => startFlash('photo', 'OTA YHTEISSELFIE NYT!', 200)}>
            📸 FOTO
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashMissions;