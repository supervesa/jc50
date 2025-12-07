import React, { useEffect } from 'react';

const RewardOverlay = ({ data, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="ap-reward-overlay">
      <div className="reward-content">
        <div className="reward-icon">🏆</div>
        <h2>PALKITTU!</h2>
        <div className="reward-xp">+{data.xp} XP</div>
        <p className="reward-reason">{data.reason}</p>
      </div>
    </div>
  );
};

export default RewardOverlay;