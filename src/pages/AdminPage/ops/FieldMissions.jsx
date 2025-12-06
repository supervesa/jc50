import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const FieldMissions = ({ missions }) => {
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionTag, setNewMissionTag] = useState('');

  const createMission = async (e) => {
    e.preventDefault();
    if (!newMissionTitle) return;
    await supabase.from('missions').insert({
      title: newMissionTitle,
      target_tag: newMissionTag, 
      xp_reward: 100
    });
    setNewMissionTitle(''); 
    setNewMissionTag('');
  };

  const generateMissionsFromRoles = async () => {
    if (!confirm("Luodaanko tehtävät kaikille jaetuille rooleille?")) return;
    
    try {
      // Hae roolit, jotka on jaettu vieraille (ei null)
      const { data: chars } = await supabase.from('characters').select('role').not('assigned_guest_id', 'is', null);
      const uniqueRoles = [...new Set(chars.map(c => c.role).filter(r => r && r.length > 2))];

      // Hae olemassa olevat
      const { data: existing } = await supabase.from('missions').select('target_tag');
      const existingTags = existing.map(m => m.target_tag);

      const newMissions = uniqueRoles
        .filter(role => !existingTags.includes(role))
        .map(role => ({
          title: `Etsi ${role}`,
          description: `Etsi henkilö, jonka rooli on ${role}`,
          target_tag: role,
          xp_reward: 150,
          is_active: true
        }));

      if (newMissions.length > 0) {
        await supabase.from('missions').insert(newMissions);
        alert(`Luotu ${newMissions.length} tehtävää!`);
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
      
      <button 
        onClick={generateMissionsFromRoles} 
        className="btn-create" 
        style={{background: '#6f42c1', marginBottom: '20px', border: '1px solid #8e5ce5'}}
      >
        🤖 AUTO-GENEROI ROOLEISTA
      </button>

      <form onSubmit={createMission}>
        <div className="form-group">
          <input value={newMissionTitle} onChange={e => setNewMissionTitle(e.target.value)} placeholder="Tehtävä: Etsi Lääkäri..." className="input-field"/>
        </div>
        <div className="form-group">
          <input value={newMissionTag} onChange={e => setNewMissionTag(e.target.value)} placeholder="Avainsana: Lääkäri" className="input-field"/>
        </div>
        <button type="submit" className="btn-create">JULKAISE</button>
      </form>

      <div className="mission-list" style={{marginTop:'20px'}}>
        {missions.map(m => (
          <div key={m.id} className="mission-row">
            <span>{m.title}</span>
            <button onClick={() => deleteMission(m.id)} style={{color:'red', background:'none', border:'none', cursor:'pointer'}}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldMissions;