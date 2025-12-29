import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // KORJAUS 1: Import lisätty

// Tuodaan komponentit ops-alikansiosta
import VettingQueue from './ops/VettingQueue';
import FlashMissions from './ops/FlashMissions';
import FieldMissions from './ops/FieldMissions';
import ManualXP from './ops/ManualXP';
import AdminVault from './ops/AdminVault'; 
import AdminScoring from './AdminScoring'; 

const AdminOps = ({ 
  activeFlash, 
  flashCount, 
  missions = [], 
  guests, 
  characters,
  startFlash, 
  stopFlash   
}) => {
  // KORJAUS 2: Seurataan mikä vaihe on päällä, jotta napit voidaan värittää
  const [globalPhase, setGlobalPhase] = useState(null);

  // Haetaan ja kuunnellaan vaihetta (Phase)
  useEffect(() => {
    const fetchPhase = async () => {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'game_state')
        .single();
      
      if (data?.value?.phase) {
        setGlobalPhase(data.value.phase);
      }
    };

    fetchPhase();

    // Kuunnellaan muutoksia reaaliajassa (jos toinen admin vaihtaa tilaa)
    const sub = supabase.channel('ops_phase_listener')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_config' }, (payload) => {
        if (payload.new.key === 'game_state') {
          setGlobalPhase(payload.new.value.phase);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const updateGlobalPhase = async (newPhase) => {
    // Varmistus ettei tilaa vaihdeta vahingossa
    if(!window.confirm(`⚠️ VAROITUS: Olet vaihtamassa maailman tilaksi: ${newPhase}.\n\nOletko varma?`)) return;
    
    // Päivitetään heti paikallisesti (nopeampi tuntuma)
    setGlobalPhase(newPhase);

    const { error } = await supabase
      .from('app_config')
      .update({ value: { phase: newPhase } })
      .eq('key', 'game_state');

    if (error) {
      alert("Virhe tilan vaihdossa: " + error.message);
    }
  };

  // Apufunktio napin tyylille
  const getBtnStyle = (phaseName, activeColor) => {
    const isActive = globalPhase === phaseName;
    return {
      background: isActive ? activeColor : '#222',
      border: isActive ? `2px solid ${activeColor}` : '1px solid #444',
      color: isActive ? '#000' : '#888',
      fontWeight: isActive ? 'bold' : 'normal',
      padding: '15px 10px',
      cursor: 'pointer',
      flex: 1,
      opacity: isActive ? 1 : 0.7,
      transition: 'all 0.2s ease'
    };
  };

  return (
    <div className="admin-ops-container">
      
      {/* 0. DEFCON / PHASE CONTROL */}
      <div className="admin-panel" style={{borderColor: globalPhase === 'LIVE' ? '#00ff00' : '#555', marginBottom: '20px'}}>
        <h3 style={{marginTop: 0, color: '#fff'}}>🌍 MAAILMAN TILA (PHASE CONTROL)</h3>
        <p style={{fontSize: '0.8rem', color: '#aaa', marginBottom: '10px'}}>
           Määrittää mitä vieraat näkevät puhelimissaan. Nykyinen tila: <strong style={{color:'white'}}>{globalPhase || 'Ladataan...'}</strong>
        </p>
        
        <div style={{display:'flex', gap:'10px', flexWrap: 'wrap'}}>
          <button 
            style={getBtnStyle('TICKET_ONLY', '#ccc')} 
            onClick={() => updateGlobalPhase('TICKET_ONLY')}
          >
            ⚪ 1. TICKET ONLY<br/>
            <span style={{fontSize:'0.7em'}}>Vain lippu näkyy</span>
          </button>

          <button 
            style={getBtnStyle('LOBBY', '#ffd700')} 
            onClick={() => updateGlobalPhase('LOBBY')}
          >
            🟡 2. LOBBY<br/>
            <span style={{fontSize:'0.7em'}}>Info & Hahmot auki</span>
          </button>

          <button 
            style={getBtnStyle('LIVE', '#00ff00')} 
            onClick={() => updateGlobalPhase('LIVE')}
          >
            🟢 3. LIVE (GAME ON)<br/>
            <span style={{fontSize:'0.7em'}}>Tehtävät & Wall auki</span>
          </button>

          <button 
            style={getBtnStyle('ENDING', '#ff4444')} 
            onClick={() => updateGlobalPhase('ENDING')}
          >
            🏁 4. ENDING<br/>
            <span style={{fontSize:'0.7em'}}>Peli ohi / Kiitos</span>
          </button>
        </div>
      </div>

      {/* 1. PISTEYTYKSEN HALLINTA */}
      <AdminScoring />

      {/* 2. Hyväksyntäjono (Myyrät & Milestonet) */}
      <VettingQueue />

      {/* 3. Flash-tehtävät */}
      {/* KORJAUS 3: Välitetään funktiot eteenpäin propsina */}
      <FlashMissions 
        activeFlash={activeFlash} 
        flashCount={flashCount} 
        startFlash={startFlash}
        stopFlash={stopFlash}
      />

      {/* 4. Etsintäkuulutukset */}
      <FieldMissions missions={missions} />

      {/* 5. Manuaaliset pisteet */}
      <ManualXP guests={guests} characters={characters} />

      {/* 6. Salakapakka */}
      <AdminVault />
    </div>
  );
};

export default AdminOps;