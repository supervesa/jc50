import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const FlashMissions = ({ activeFlash, flashCount }) => {
  const [xpConfig, setXpConfig] = useState(null);

  // Haetaan keskitetyt pisteytyssäännöt
  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase
        .from('game_rules')
        .select('value')
        .eq('rule_key', 'xp_config')
        .single();
      if (data) setXpConfig(data.value);
    };
    fetchRules();
  }, []);
  
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
          {/* Käytetään dynaamisia XP-arvoja tietokannasta tai oletuksia */}
          <button 
            className="btn-flash mob" 
            onClick={() => startFlash('mob', 'KAIKKI TANSSILATTIALLE!', xpConfig?.flash_mob || 100)}
          >
            💃 MOB ({xpConfig?.flash_mob || 100} XP)
          </button>
          
          <button 
            className="btn-flash race" 
            onClick={() => startFlash('race', 'NOPEUSKISA!', xpConfig?.flash_race || 500)}
          >
            🏁 RACE ({xpConfig?.flash_race || 500} XP)
          </button>
          
          <button 
            className="btn-flash photo" 
            onClick={() => startFlash('photo', 'OTA YHTEISSELFIE NYT!', xpConfig?.flash_photo || 200)}
          >
            📸 FOTO ({xpConfig?.flash_photo || 200} XP)
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashMissions;