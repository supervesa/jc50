import React, { useState, useMemo } from 'react';
import PersonalMissionCard from '../PersonalMissionCard'; // TARKISTA POLKU TARVITTAESSA

const MissionCard = ({ mission, submitCode }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = await submitCode(mission, code);
    if (success) setCode('');
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
          <button onClick={handleSubmit} disabled={loading}>{loading ? '...' : 'TARKISTA'}</button>
        </div>
      </div>
    </div>
  );
};

const AgentMissions = ({ 
  missions, completedIds, guestId, 
  submitCode, secretMission, personalMissionStatus, onPersonalReport 
}) => {
  
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
      {secretMission && (
        <PersonalMissionCard 
          missionDescription={secretMission}
          status={personalMissionStatus}
          onReport={onPersonalReport}
          guestId={guestId}
        />
      )}

      <div className="mission-intro"><p>ETSINTÄKUULUTUKSET</p></div>

      {visibleMissions.map(m => (
        <MissionCard key={m.id} mission={m} submitCode={submitCode} />
      ))}
      
      {visibleMissions.length === 0 && !secretMission && (
        <div className="no-missions"><h3>KAIKKI SUORITETTU!</h3></div>
      )}
    </div>
  );
};

export default AgentMissions;