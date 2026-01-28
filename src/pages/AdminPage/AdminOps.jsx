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
  // --- TILAT ---
  const [globalPhase, setGlobalPhase] = useState(null);
  
  // Tab-navigaatio: 'game' | 'admin' | 'vetting'
  const [activeTab, setActiveTab] = useState('game');
  
  // Hyväksyntäjonon pituus (tieto tarvitaan tabin piilottamiseen/näyttämiseen)
  const [pendingCount, setPendingCount] = useState(0);

  // --- EFFECT 1: JONON SEURANTA (VETTING WATCHER) ---
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('mission_log')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');
      
      if (!error) {
        setPendingCount(count || 0);
      }
    };

    // Haetaan heti alussa
    fetchPendingCount();

    // Kuunnellaan muutoksia mission_log -taulussa
    const sub = supabase.channel('ops_vetting_counter')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_log' }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  // --- EFFECT 2: AUTOMAATTINEN TABIN VAIHTO ---
  // Jos jono tyhjenee ja olemme vetting-tabilla, palataan peli-tabille
  useEffect(() => {
    if (pendingCount === 0 && activeTab === 'vetting') {
      setActiveTab('game');
    }
  }, [pendingCount, activeTab]);

  // --- EFFECT 3: MAAILMAN TILA (PHASE) ---
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

  // --- TOIMINNOT ---

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

  const getPhaseBtnStyle = (phaseName, activeColor) => {
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

  const getTabStyle = (tabName) => {
    const isActive = activeTab === tabName;
    
    // Erikoistyyli Vetting-tabille
    if (tabName === 'vetting') {
      return {
        padding: '12px 24px',
        cursor: 'pointer',
        background: isActive ? '#ff4444' : '#330000',
        color: isActive ? '#fff' : '#ffaaaa',
        border: 'none',
        borderBottom: isActive ? '4px solid #fff' : 'none',
        fontWeight: 'bold',
        fontSize: '1rem',
        animation: isActive ? 'none' : 'pulse 2s infinite' // Lisätään pieni huomioefekti CSS:llä jos halutaan
      };
    }

    // Perustyyli muille
    return {
      padding: '12px 24px',
      cursor: 'pointer',
      background: isActive ? '#333' : 'transparent',
      color: isActive ? '#fff' : '#888',
      border: 'none',
      borderBottom: isActive ? '4px solid #00d2ff' : 'none',
      fontWeight: isActive ? 'bold' : 'normal',
      fontSize: '1rem'
    };
  };

  return (
    <div className="admin-ops-container">
      
      {/* --- YLÄNAVIGAATIO (TABS) --- */}
      <div style={{
        display: 'flex', 
        borderBottom: '1px solid #333', 
        marginBottom: '20px', 
        gap: '10px',
        background: '#111',
        padding: '0 10px'
      }}>
        
        <button 
          onClick={() => setActiveTab('game')} 
          style={getTabStyle('game')}
        >
          🎮 PELI
        </button>
        
        <button 
          onClick={() => setActiveTab('admin')} 
          style={getTabStyle('admin')}
        >
          ⚙️ HALLINTA
        </button>

        {/* Näytetään JONO-tabi vain jos on jonoa */}
        {pendingCount > 0 && (
          <button 
            onClick={() => setActiveTab('vetting')} 
            style={getTabStyle('vetting')}
          >
            🚨 JONO ({pendingCount})
          </button>
        )}
      </div>

      {/* --- TAB 1: PELIN OPERAATIOT --- */}
      {activeTab === 'game' && (
        <div className="tab-content fade-in">
          <FlashMissions 
            activeFlash={activeFlash} 
            flashCount={flashCount} 
            startFlash={startFlash}
            stopFlash={stopFlash}
          />
          
          <FieldMissions missions={missions} />
          
          <ManualXP guests={guests} characters={characters} />
        </div>
      )}

      {/* --- TAB 2: HALLINTO & ASETUKSET --- */}
      {activeTab === 'admin' && (
        <div className="tab-content fade-in">
          
          {/* 1. MAAILMAN TILA (PHASE CONTROL) */}
          <div className="admin-panel" style={{borderColor: globalPhase === 'SHOWTIME' ? '#00ff00' : '#555', marginBottom: '20px'}}>
            <h3 style={{marginTop: 0, color: '#fff'}}>🌍 MAAILMAN TILA (PHASE CONTROL)</h3>
            <p style={{fontSize: '0.8rem', color: '#aaa', marginBottom: '15px'}}>
               Nykyinen tila: <strong style={{color:'white', fontSize:'1rem'}}>{globalPhase || 'Ladataan...'}</strong>
            </p>
            
            <div style={{display:'flex', gap:'10px', flexWrap: 'wrap'}}>
              <button 
                style={getPhaseBtnStyle('EARLY_ACCESS', '#ccc')} 
                onClick={() => updateGlobalPhase('EARLY_ACCESS')}
              >
                ⚪ 1. EARLY ACCESS<br/>
                <span style={{fontSize:'0.7em'}}>Lippu & Kuvat auki</span>
              </button>

              <button 
                style={getPhaseBtnStyle('HYPE_WEEK', '#ffd700')} 
                onClick={() => updateGlobalPhase('HYPE_WEEK')}
              >
                🟡 2. HYPE WEEK<br/>
                <span style={{fontSize:'0.7em'}}>Chat auki</span>
              </button>

              <button 
                style={getPhaseBtnStyle('SHOWTIME', '#00ff00')} 
                onClick={() => updateGlobalPhase('SHOWTIME')}
              >
                🟢 3. SHOWTIME<br/>
                <span style={{fontSize:'0.7em'}}>PELI KÄYNNISSÄ</span>
              </button>

              <button 
                style={getPhaseBtnStyle('ENDING', '#ff4444')} 
                onClick={() => updateGlobalPhase('ENDING')}
              >
                🏁 4. ENDING<br/>
                <span style={{fontSize:'0.7em'}}>Peli ohi</span>
              </button>
            </div>
          </div>

          {/* 2. PISTEYTYS & ARKISTO */}
          <AdminScoring />
          <AdminVault />
        </div>
      )}

      {/* --- TAB 3: HYVÄKSYNTÄJONO --- */}
      {activeTab === 'vetting' && (
        <div className="tab-content fade-in">
           {/* Näytetään VettingQueue vain tällä tabilla */}
           <VettingQueue />
        </div>
      )}

    </div>
  );
};

export default AdminOps;