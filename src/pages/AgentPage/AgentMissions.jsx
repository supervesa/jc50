import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import PersonalMissionCard from './PersonalMissionCard'; // <--- TUO UUSI KOMPONENTTI

// --- YKSITTÄINEN WANTED-KORTTI (Pysyy samana) ---
const MissionCard = ({ mission, guestId, onComplete }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submitCode = async () => {
    if (code.length !== 4) { alert("Syötä 4-numeroinen koodi."); return; }
    setLoading(true);
    
    // 1. Tarkista koodi
    const { data: targetChar } = await supabase.from('characters').select('*').eq('agent_code', code).maybeSingle();
    
    if (!targetChar) { alert("Virheellinen agenttikoodi."); setLoading(false); return; }
    if (targetChar.assigned_guest_id === guestId) { alert("Et voi etsiä itseäsi!"); setLoading(false); return; }

    // 2. Roolitarkistus
    if (mission.target_tag) {
      const tag = mission.target_tag.toLowerCase();
      const role = (targetChar.role || '').toLowerCase();
      const name = (targetChar.name || '').toLowerCase();
      const story = (targetChar.backstory || '').toLowerCase();
      if (!(role.includes(tag) || name.includes(tag) || story.includes(tag))) {
        alert(`VÄÄRÄ KOHDE!\nLöysit: ${targetChar.name} (${targetChar.role})`);
        setLoading(false);
        return;
      }
    }

    // 3. TALLENNA SUORITUS (Heti hyväksytty!)
    const { error } = await supabase.from('mission_log').insert({
      guest_id: guestId,
      mission_id: mission.id,
      xp_earned: mission.xp_reward,
      approval_status: 'approved',
      custom_reason: `Kohde löydetty: ${targetChar.name}` 
    });

    if (error) { alert("Virhe tai olet jo suorittanut tämän."); } 
    else { 
      setCode('');
      onMissionComplete(mission.id);
    }
    setLoading(false);
  };

  return (
    <div className="mission-card active">
      <div className="mission-badge">WANTED</div>
      <div className="mission-header">
        <div className="mission-title">{mission.title}</div>
        <div className="mission-xp">{mission.xp_reward} XP</div>
      </div>
      <div className="mission-action">
        <p className="mission-desc">Kohde: <span className="tag-highlight">{mission.target_tag || 'Määrittelemätön'}</span></p>
        <div className="code-input-row">
          <input type="number" placeholder="ID-KOODI" value={code} onChange={(e) => setCode(e.target.value)} disabled={loading}/>
          <button onClick={submitCode} disabled={loading}>{loading ? '...' : 'TARKISTA'}</button>
        </div>
      </div>
    </div>
  );
};

// --- PÄÄKOMPONENTTI ---
const AgentMissions = ({ missions, completedIds, guestId, onMissionComplete, secretMission, personalMissionStatus, onPersonalReport }) => {
  
  // Sekoituslogiikka
  const visibleMissions = useMemo(() => {
    const todoMissions = missions.filter(m => !completedIds.includes(m.id));
    if (todoMissions.length === 0) return [];
    
    const stringHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      return hash;
    };
    const shuffled = [...todoMissions].sort((a, b) => stringHash(guestId + a.id) - stringHash(guestId + b.id));
    return shuffled.slice(0, 3);
  }, [missions, completedIds, guestId]);

  return (
    <div className="ap-mission-list">
      
      {/* 1. OMA SALAINEN TEHTÄVÄ (Uusi komponentti) */}
   {/* 1. OMA SALAINEN TEHTÄVÄ */}
      {secretMission && (
        <PersonalMissionCard 
          missionDescription={secretMission}
          status={personalMissionStatus}
          onReport={onPersonalReport}
          guestId={guestId} // <--- TÄMÄ LISÄTTIIN
        />
      )}

      {/* 2. ETSINTÄKUULUTUKSET */}
      <div className="mission-intro">
        <p>ETSINTÄKUULUTUKSET (Palkkio heti)</p>
      </div>

      {visibleMissions.map(m => (
        <MissionCard key={m.id} mission={m} guestId={guestId} onComplete={onMissionComplete} />
      ))}
      
      {visibleMissions.length === 0 && !secretMission && (
        <div className="no-missions"><h3>KAIKKI SUORITETTU!</h3></div>
      )}
    </div>
  );
};

export default AgentMissions;