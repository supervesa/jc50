import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

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
  // Seurataan mikä vaihe on päällä
  const [globalPhase, setGlobalPhase] = useState(null);

  // Haetaan ja kuunnellaan vaihetta
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
    if(!window.confirm(`⚠️ Olet vaihtamassa maailman tilaksi: ${newPhase}.\n\nOletko varma?`)) return;
    
    // Optimistinen päivitys
    setGlobalPhase(newPhase);

    const { error } = await supabase
      .from('app_config')
      .update({ value: { phase: newPhase } })
      .eq('key', 'game_state');

    if (error) {
      alert("Virhe tilan vaihdossa: " + error.message);
    }
  };

  const getBtnStyle = (phaseName, activeColor) => {
    const isActive = globalPhase === phaseName;
    return {
      background: isActive ? activeColor : '#1a1a1a',
      border: isActive ? `2px solid ${activeColor}` : '1px solid #333',
      color: isActive ? '#000' : '#888',
      fontWeight: isActive ? 'bold' : 'normal',
      padding: '15px 10px',
      cursor: 'pointer',
      flex: 1,
      minWidth: '140px',
      opacity: isActive ? 1 : 0.8,
      transition: 'all 0.2s ease',
      borderRadius: '4px'
    };
  };

  return (
    <div className="admin-ops-container">
      
      {/* 0. KOLMEN AALLON JULKAISU (PHASE CONTROL) */}
      <div className="admin-panel" style={{borderColor: globalPhase === 'SHOWTIME' ? '#00ff00' : '#555', marginBottom: '20px'}}>
        <h3 style={{marginTop: 0, color: '#fff'}}>🌍 MAAILMAN TILA (PHASE CONTROL)</h3>
        <p style={{fontSize: '0.8rem', color: '#aaa', marginBottom: '15px'}}>
           Nykyinen tila: <strong style={{color:'white', fontSize:'1rem'}}>{globalPhase || 'Ladataan...'}</strong>
        </p>
        
        <div style={{display:'flex', gap:'10px', flexWrap: 'wrap'}}>
          {/* VAIHE 0 */}
          <button 
            style={getBtnStyle('EARLY_ACCESS', '#ccc')} 
            onClick={() => updateGlobalPhase('EARLY_ACCESS')}
          >
            ⚪ 1. EARLY ACCESS<br/>
            <span style={{fontSize:'0.7em'}}>Lippu & Kuvat auki</span>
          </button>

          {/* VAIHE 1 */}
          <button 
            style={getBtnStyle('HYPE_WEEK', '#ffd700')} 
            onClick={() => updateGlobalPhase('HYPE_WEEK')}
          >
            🟡 2. HYPE WEEK<br/>
            <span style={{fontSize:'0.7em'}}>Chat auki</span>
          </button>

          {/* VAIHE 2 */}
          <button 
            style={getBtnStyle('SHOWTIME', '#00ff00')} 
            onClick={() => updateGlobalPhase('SHOWTIME')}
          >
            🟢 3. SHOWTIME<br/>
            <span style={{fontSize:'0.7em'}}>PELI KÄYNNISSÄ</span>
          </button>

          {/* VAIHE 3 */}
          <button 
            style={getBtnStyle('ENDING', '#ff4444')} 
            onClick={() => updateGlobalPhase('ENDING')}
          >
            🏁 4. ENDING<br/>
            <span style={{fontSize:'0.7em'}}>Peli ohi</span>
          </button>
        </div>
      </div>

      <AdminScoring />
      <VettingQueue />
      
      <FlashMissions 
        activeFlash={activeFlash} 
        flashCount={flashCount} 
        startFlash={startFlash}
        stopFlash={stopFlash}
      />

      <FieldMissions missions={missions} />
      <ManualXP guests={guests} characters={characters} />
      <AdminVault />
    </div>
  );
};

export default AdminOps;