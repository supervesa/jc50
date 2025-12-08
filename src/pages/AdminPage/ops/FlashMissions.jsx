import React from 'react';
import { supabase } from '../../../lib/supabaseClient';

const FlashMissions = ({ activeFlash, flashCount }) => {
  
  const startFlash = async (type, title, xp) => {
    // 1. VAROTOIMI: Suljetaan ensin KAIKKI vanhat aktiiviset tehtävät (poistaa haamut)
    await supabase.from('flash_missions')
      .update({ status: 'ended', end_time: new Date().toISOString() })
      .eq('status', 'active');
    
    // 2. Luodaan uusi
    await supabase.from('flash_missions').insert({ 
      type, title, xp_reward: xp, status: 'active' 
    });
  };

  const stopFlash = async () => {
    // Suljetaan kaikki aktiiviset, ei vain yhtä ID:tä
    await supabase.from('flash_missions')
      .update({ status: 'ended', end_time: new Date().toISOString() })
      .eq('status', 'active');
  };

  return (
    <div className="admin-section">
      <h2>⚡ FLASH MISSIONS (DJ TOOLS)</h2>
      
      {activeFlash ? (
        <div className="flash-active-card">
          <h3 className="blink">⚠️ LIVE: {activeFlash.title}</h3>
          <div className="flash-stats">SUORITTANEITA: {flashCount}</div>
          <button className="btn-stop-large" onClick={stopFlash}>⏹ PÄÄTÄ TEHTÄVÄ (STOP ALL)</button>
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