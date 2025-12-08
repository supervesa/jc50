import React, { useState } from 'react';
import PersonalMissionCard from '../PersonalMissionCard'; 

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
  missions, // Tämä on nyt valmiiksi hookissa sekoitettu "visibleMissions"
  completedIds, 
  guestId, 
  submitCode, secretMission, personalMissionStatus, onPersonalReport 
}) => {
  
  // LOGIIKKA POISTETTU TÄÄLTÄ: Ei enää useMemo tai shuffling.
  // Komponentti on nyt "tyhmä" ja näyttää vain sen mitä propsina tulee.

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

      {missions.map(m => (
        <MissionCard key={m.id} mission={m} submitCode={submitCode} />
      ))}
      
      {missions.length === 0 && !secretMission && (
        <div className="no-missions"><h3>KAIKKI SUORITETTU!</h3></div>
      )}
    </div>
  );
};

export default AgentMissions;