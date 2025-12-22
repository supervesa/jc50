import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const FieldMissions = ({ missions }) => {
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionTag, setNewMissionTag] = useState('');
  
  // UUSI TILA: Hallitsee listan näkyvyyttä
  const [isListOpen, setIsListOpen] = useState(false);
  
  // UUSI TILA: Tallentaa dynaamiset säännöt
  const [xpConfig, setXpConfig] = useState(null);

  // Haetaan säännöt komponentin latautuessa
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

  const createMission = async (e) => {
    e.preventDefault();
    if (!newMissionTitle) return;
    
    // Käytetään dynaamista arvoa 'find_role' tai oletusta 100
    const reward = xpConfig?.find_role || 100;

    await supabase.from('missions').insert({
      title: newMissionTitle,
      target_tag: newMissionTag, 
      xp_reward: reward
    });
    setNewMissionTitle(''); 
    setNewMissionTag('');
  };

  const generateMissionsFromRoles = async () => {
    if (!confirm("Luodaanko tehtävät kaikille jaetuille rooleille?")) return;
    
    try {
      const { data: chars } = await supabase.from('characters').select('role').not('assigned_guest_id', 'is', null);
      const uniqueRoles = [...new Set(chars.map(c => c.role).filter(r => r && r.length > 2))];

      const { data: existing } = await supabase.from('missions').select('target_tag');
      const existingTags = existing.map(m => m.target_tag);

      // Käytetään dynaamista arvoa 'find_role' tai oletusta 150
      const reward = xpConfig?.find_role || 150;

      const newMissions = uniqueRoles
        .filter(role => !existingTags.includes(role))
        .map(role => ({
          title: `Etsi ${role}`,
          description: `Etsi henkilö, jonka rooli on ${role}`,
          target_tag: role,
          xp_reward: reward,
          is_active: true
        }));

      if (newMissions.length > 0) {
        await supabase.from('missions').insert(newMissions);
        alert(`Luotu ${newMissions.length} tehtävää (arvo: ${reward} XP/kpl)!`);
      } else {
        alert("Ei uusia rooleja.");
      }
    } catch(err) { alert(err.message); }
  };

  const deleteMission = async (id) => {
    if(!confirm("Poistetaanko?")) return;
    await supabase.from('mission_log').delete().eq('mission_id', id);
    await supabase.from('missions').delete().eq('id', id);
  };

  return (
    <div className="admin-panel">
      <h2>🕵️ LUO ETŠINTÄKUULUTUS</h2>
      
      {/* AUTOMAATIO NAPPI */}
      <button 
        onClick={generateMissionsFromRoles} 
        className="btn-create" 
        style={{background: '#6f42c1', marginBottom: '20px', border: '1px solid #8e5ce5'}}
      >
        🤖 AUTO-GENEROI ROOLEISTA
      </button>

      {/* LOMAKE */}
      <form onSubmit={createMission}>
        <div className="form-group">
          <input value={newMissionTitle} onChange={e => setNewMissionTitle(e.target.value)} placeholder="Tehtävä: Etsi Lääkäri..." className="input-field"/>
        </div>
        <div className="form-group">
          <input value={newMissionTag} onChange={e => setNewMissionTag(e.target.value)} placeholder="Avainsana: Lääkäri" className="input-field"/>
        </div>
        <button type="submit" className="btn-create">JULKAISE</button>
      </form>

      {/* --- AKKORDI LISTALLE --- */}
      <div style={{marginTop: '30px', borderTop: '2px solid #333', paddingTop: '10px'}}>
        
        {/* KLIKATTAVA OTSJAKE */}
        <div 
          onClick={() => setIsListOpen(!isListOpen)}
          style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '10px',
            background: '#252525',
            borderRadius: '6px'
          }}
        >
          <h3 style={{margin: 0, fontSize: '1rem', color: '#ccc'}}>
            📜 AKTIIVISET TEHTÄVÄT ({missions.length})
          </h3>
          <span style={{fontSize: '1.2rem'}}>{isListOpen ? '🔼' : '🔽'}</span>
        </div>

        {/* PIILOTETTAVA LISTA */}
        {isListOpen && (
          <div className="mission-list" style={{marginTop:'10px', maxHeight: '500px', overflowY: 'auto'}}>
            {missions.length === 0 && <p style={{color:'#666', fontStyle:'italic', padding:'10px'}}>Ei tehtäviä.</p>}
            
            {missions.map(m => (
              <div key={m.id} className="mission-row" style={{display:'flex', justifyContent:'space-between', padding:'8px', borderBottom:'1px solid #333'}}>
                <span>{m.title}</span>
                <button onClick={() => deleteMission(m.id)} style={{color:'#e74c3c', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem'}}>🗑</button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default FieldMissions;