import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import PersonalMissionCard from '../PersonalMissionCard'; 

const MissionCard = ({ mission, submitCode }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Lähetetään päivitetty mission-objekti (jossa uusi XP) eteenpäin
    const success = await submitCode(mission, code);
    if (success) setCode('');
    setLoading(false);
  };

  // Määritetään luokka: onko suora relaatio (related) vai verkosto (network)
  const cardClass = `mission-card active ${
    mission.tier === 1 ? 'related' : 
    mission.tier === 2 ? 'network-related' : ''
  }`;

  return (
    <div className={cardClass}>
      
      {/* NÄYTETÄÄN RELAATIO-BADGE, VERKOSTO TAI WANTED */}
      <div className="mission-badge">
        {mission.relationBadge || 'WANTED'}
      </div>

      <div className="mission-header">
        <div className="mission-title">{mission.title}</div>
        {/* Näyttää nyt dynaamisen pistemäärän */}
        <div className="mission-xp">{mission.xp_reward} XP</div>
      </div>
      <div className="mission-action">
        <p className="mission-desc">Kohde: <span className="tag-highlight">{mission.target_tag || 'Määrittelemätön'}</span></p>
        
        {/* NÄYTETÄÄN RELAATIO-KUVAUS VIHJEENÄ JOS OLEMASSA */}
        {mission.relationDesc && (
          <p className="mission-hint" style={{ 
            fontStyle: 'italic', 
            margin: '8px 0', 
            opacity: 0.9, 
            fontSize: '0.9em',
            color: mission.tier === 2 ? '#a0cfff' : 'inherit' // Verkostovihjeelle pieni korostus
          }}>
            {mission.tier === 2 && '🔗 '} {/* Linkki-ikoni verkostolle */}
            {mission.relationDesc}
          </p>
        )}

        <div className="code-input-row">
          <input type="number" placeholder="ID-KOODI" value={code} onChange={(e) => setCode(e.target.value)} disabled={loading}/>
          <button onClick={handleSubmit} disabled={loading}>{loading ? '...' : 'TARKISTA'}</button>
        </div>
      </div>
    </div>
  );
};

const AgentMissions = ({ 
  missions, 
  completedIds, 
  guestId, 
  submitCode, 
  secretMission, 
  personalMissionStatus, 
  onPersonalReport,
  onRefresh // LISÄTTY: Toiminto listan päivittämiseen
}) => {
  
  // Tila dynaamiselle XP-arvolle (Hahmon löytäminen)
  const [findRoleXp, setFindRoleXp] = useState(null);

  // Haetaan pisteytyssäännöt
  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase
        .from('game_rules')
        .select('value')
        .eq('rule_key', 'xp_config')
        .single();
      
      // Jos "find_role" on asetettu adminissa, käytetään sitä
      if (data && data.value && data.value.find_role) {
        setFindRoleXp(data.value.find_role);
      }
    };
    fetchRules();
  }, []);

  return (
    <div className="ap-mission-list">
      {secretMission && (
        <PersonalMissionCard 
          missionDescription={secretMission}
          status={personalMissionStatus}
          onReport={onPersonalReport}
          guestId={guestId}
        />
      )}

      {/* OTSIKKORIVI JA PÄIVITYSPAINIKE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div className="mission-intro"><p>ETSINTÄKUULUTUKSET</p></div>
        <button 
          onClick={onRefresh} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}
          title="Päivitä etsintäkuulutukset"
        >
          🔄
        </button>
      </div>

      {missions.map(m => {
        // LOGIIKKA: Jos meillä on dynaaminen 'find_role' arvo, ylikirjoitetaan tehtävän XP.
        // Muuten käytetään alkuperäistä.
        const activeMission = findRoleXp 
          ? { ...m, xp_reward: findRoleXp } 
          : m;

        return (
          <MissionCard 
            key={m.id} 
            mission={activeMission} 
            submitCode={submitCode} 
          />
        );
      })}
      
      {missions.length === 0 && !secretMission && (
        <div className="no-missions"><h3>KAIKKI SUORITETTU!</h3></div>
      )}
    </div>
  );
};

export default AgentMissions;