import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // Korjattu polku (3 tasoa ylös)

const FlashMissions = ({ activeFlash, flashCount }) => {
  // Oletusarvot, jos kanta ei vastaa
  const [xpConfig, setXpConfig] = useState({
    flash_mob: 100,
    flash_race: 500,
    flash_photo: 200
  });
  
  // Race-valikon tilat
  const [setupMode, setSetupMode] = useState(null); 
  const [customTitle, setCustomTitle] = useState('');
  
  // Race XP -tila (DJ voi muuttaa tätä lennosta)
  const [raceXp, setRaceXp] = useState(500);

  const RACE_PRESETS = [
    "TUO KRAVATTI! 👔",
    "ETSI LUSIKKA! 🥄",
    "TUO WC-PAPERIA! 🧻",
    "PUNAINEN VAATE! 🔴",
    "HIGH FIVE DJ:LLE! ✋",
    "HALAA PÄIVÄNSANKARIA! ❤️",
    "TUO LASI VETTÄ! 💧",
    "ILMAKITARA SOIMAAN! 🎸"
  ];

  // 1. HAETAAN SÄÄNNÖT JA PÄIVITETÄÄN RACE XP OLETUS
  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase
        .from('game_rules')
        .select('value')
        .eq('rule_key', 'xp_config')
        .single();
      
      if (data && data.value) {
        setXpConfig(data.value);
        // TÄMÄ TEKEE PISTEISTÄ DYNAAMISET: 
        // Asetetaan raceXp-kentän oletusarvoksi tietokannasta haettu arvo
        if (data.value.flash_race) {
          setRaceXp(data.value.flash_race);
        }
      }
    };
    fetchRules();
  }, []);
  
  // Käynnistyslogiikka
  const startFlash = async (type, title, xp) => {
    // Suljetaan vanhat
    await supabase.from('flash_missions')
      .update({ status: 'ended', end_time: new Date().toISOString() })
      .eq('status', 'active');
    
    const finalTitle = title || (type === 'race' ? "NOPEUSKISA!" : "SALAINEN TEHTÄVÄ");

    await supabase.from('flash_missions').insert({ 
      type, 
      title: finalTitle, 
      xp_reward: xp, 
      status: 'active' 
    });

    setSetupMode(null);
    setCustomTitle('');
  };

  const stopFlash = async () => {
    await supabase.from('flash_missions')
      .update({ status: 'ended', end_time: new Date().toISOString() })
      .eq('status', 'active');
  };

  return (
    <div className="admin-section">
      <h2 style={{color: setupMode === 'RACE' ? 'yellow' : 'inherit'}}>
        ⚡ FLASH MISSIONS (DJ TOOLS)
      </h2>
      
      {activeFlash ? (
        // --- STOP TILA ---
        <div className="flash-active-card">
          <h3 className="blink">⚠️ LIVE: {activeFlash.title}</h3>
          <div className="flash-stats">SUORITTANEITA: {flashCount}</div>
          <div style={{margin:'10px 0', color:'yellow', fontWeight:'bold'}}>
            PALKINTO: {activeFlash.xp_reward} XP
          </div>
          <button className="btn-stop-large" onClick={stopFlash}>
            ⏹ PÄÄTÄ TEHTÄVÄ (STOP ALL)
          </button>
        </div>
      ) : (
        // --- START TILA ---
        <>
          {setupMode === 'RACE' ? (
            // --- RACE MENU ---
            <div className="race-setup-panel" style={{background:'#222', padding:'15px', borderRadius:'8px', border:'2px solid yellow', marginBottom:'20px'}}>
              <h3 style={{color:'yellow', marginTop:0, textTransform:'uppercase'}}>🏁 Race Commander</h3>
              
              {/* XP SÄÄTÖ (Hakee oletuksen kannasta, mutta on muokattavissa) */}
              <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px', background:'#333', padding:'10px', borderRadius:'4px'}}>
                <span style={{color:'#fff', fontWeight:'bold'}}>🏆 VOITTOPOTTI:</span>
                <input 
                  type="number" 
                  value={raceXp}
                  onChange={(e) => setRaceXp(Number(e.target.value))}
                  style={{width:'100px', padding:'8px', fontSize:'1.2rem', fontWeight:'bold', textAlign:'center', background:'#000', color:'yellow', border:'1px solid yellow', borderRadius:'4px'}}
                />
                <span style={{color:'yellow', fontWeight:'bold'}}>XP</span>
              </div>

              {/* PRESETIT (Käyttävät nyt raceXp-tilaa) */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
                {RACE_PRESETS.map((preset, i) => (
                  <button 
                    key={i}
                    onClick={() => startFlash('race', preset, raceXp)}
                    style={{
                      padding:'15px', background:'#333', color:'#fff', 
                      border:'1px solid #555', fontWeight:'bold', cursor:'pointer', 
                      borderRadius:'4px', fontSize:'0.9rem', textAlign:'left'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* CUSTOM INPUT (Käyttää nyt raceXp-tilaa) */}
              <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                <input 
                  type="text" 
                  placeholder="KIRJOITA OMA TEHTÄVÄ..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  style={{flex:1, padding:'12px', fontSize:'1.1rem', background:'#000', color:'#fff', border:'1px solid #555', borderRadius:'4px'}}
                />
                <button 
                  onClick={() => startFlash('race', customTitle, raceXp)}
                  disabled={!customTitle.trim()}
                  style={{
                    padding:'0 25px', background: customTitle.trim() ? 'yellow' : '#555', 
                    color:'#000', fontWeight:'bold', border:'none', borderRadius:'4px', 
                    cursor: customTitle.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  GO! 🚀
                </button>
              </div>

              <button 
                onClick={() => setSetupMode(null)}
                style={{width:'100%', padding:'10px', background:'transparent', border:'1px solid #666', color:'#aaa', cursor:'pointer', borderRadius:'4px'}}
              >
                PERUUTA
              </button>
            </div>
          ) : (
            // --- PÄÄVALIKKO ---
            <div className="flash-buttons">
              <button 
                className="btn-flash mob" 
                onClick={() => startFlash('mob', 'KAIKKI TANSSILATTIALLE!', xpConfig.flash_mob)}
              >
                💃 MOB ({xpConfig.flash_mob} XP)
              </button>
              
              <button 
                className="btn-flash race" 
                onClick={() => setSetupMode('RACE')}
              >
                🏁 RACE MENU...
              </button>
              
              <button 
                className="btn-flash photo" 
                onClick={() => startFlash('photo', 'OTA YHTEISSELFIE NYT!', xpConfig.flash_photo)}
              >
                📸 FOTO ({xpConfig.flash_photo} XP)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FlashMissions;