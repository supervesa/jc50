import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const VettingQueue = () => {
  const [pendingLogs, setPendingLogs] = useState([]);

  // Hae jono
  const fetchPending = async () => {
    // KORJAUS: Poistettu "missions(title)" hausta, koska FK-linkki on poistettu
    // Hae vain rivit ja vieraan nimi.
    const { data, error } = await supabase
      .from('mission_log')
      .select('*, guests(name)')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Virhe haettaessa jonoa:", error);
    } else {
      setPendingLogs(data);
    }
  };

  // Realtime kuuntelu
  useEffect(() => {
    fetchPending();
    const sub = supabase.channel('admin_vetting')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_log' }, fetchPending)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // Hyväksy / Hylkää
  const handleAction = async (log, status) => {
    let updates = { approval_status: status };
    
    // Jos hyväksytään henkilökohtainen tehtävä (jolla oli 0 XP), annetaan 500 XP
    if (status === 'approved' && log.xp_earned === 0) {
       updates.xp_earned = 500; 
    }

    await supabase.from('mission_log').update(updates).eq('id', log.id);
    // fetchPending hoitaa päivityksen (Realtime hoitaa)
  };

  if (pendingLogs.length === 0) return null;

  return (
    <div className="admin-panel mb-4" style={{borderColor: 'gold'}}>
      <h2 style={{color:'gold', borderBottomColor:'gold'}}>🚨 HYVÄKSYNTÄJONO ({pendingLogs.length})</h2>
      <div className="mission-list">
        {pendingLogs.map(log => {
          
          // Päätellään otsikko ilman tietokantaliitosta
          const missionTitle = log.mission_id === 'personal-objective' 
            ? 'HENKILÖKOHTAINEN TEHTÄVÄ' 
            : 'MUU TEHTÄVÄ';

          // Parsitaan todiste (JSON tai teksti)
          let proofText = "";
          let proofImage = null;
          try {
            const parsed = JSON.parse(log.proof_data);
            proofText = parsed.text;
            proofImage = parsed.image;
          } catch (e) {
            proofText = log.proof_data;
          }

          return (
            <div key={log.id} className="poll-card history-card" style={{borderColor:'#555'}}>
              <div className="poll-info">
                <h3 style={{color:'gold'}}>AGENTTI: {log.guests?.name || 'Tuntematon'}</h3>
                <p style={{color:'var(--turquoise)'}}>
                  TEHTÄVÄ: {missionTitle}
                </p>
                
                {/* TODISTEET */}
                <div style={{background:'#333', padding:'10px', marginTop:'5px', borderRadius:'4px'}}>
                   <p className="small" style={{color:'#fff', fontStyle:'italic', margin:0}}>
                     "{proofText || 'Ei tekstiä'}"
                   </p>
                   {proofImage && (
                     <a href={proofImage} target="_blank" rel="noreferrer">
                       <img src={proofImage} alt="Todiste" style={{marginTop:'10px', maxWidth:'100%', maxHeight:'200px', borderRadius:'4px', border:'1px solid #555'}} />
                     </a>
                   )}
                </div>
              </div>

              <div className="poll-controls" style={{display:'flex', gap:'10px', flexDirection:'column'}}>
                <button 
                  className="btn-start" 
                  style={{fontSize:'0.9rem', padding:'10px'}}
                  onClick={() => handleAction(log, 'approved')}
                >
                  ✔ HYVÄKSY
                </button>
                <button 
                  className="btn-stop" 
                  style={{fontSize:'0.9rem', padding:'10px', background:'#333', color:'#ff4444', border:'1px solid #ff4444'}}
                  onClick={() => handleAction(log, 'rejected')}
                >
                  ✖ HYLKÄÄ
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VettingQueue;