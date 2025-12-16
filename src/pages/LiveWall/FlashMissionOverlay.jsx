import React from 'react';
import './FlashMission.css'; // Luo CSS alla

const FlashMissionOverlay = ({ mission }) => {
  if (!mission) return null;
  const { type, title, xp_reward } = mission;
  
  return (
    <div className={`jc-flash-overlay type-${type}`}>
      <div className="jc-flash-content">
        <div className="jc-flash-alert">⚠ INTERRUPT SIGNAL ⚠</div>
        <h1 className="jc-flash-title">{title}</h1>
        <div className="jc-flash-reward">REWARD: <span className="neon-text">{xp_reward} XP</span></div>
        <div className="jc-flash-icon">
           {type === 'mob' && '💃'}
           {type === 'race' && '🏁'}
           {type === 'photo' && '📸'}
        </div>
      </div>
    </div>
  );
};
export default FlashMissionOverlay;