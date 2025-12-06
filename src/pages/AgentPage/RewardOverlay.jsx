import React, { useEffect } from 'react';

const RewardOverlay = ({ data, onClose }) => {
  useEffect(() => {
    // Sulkeutuu automaattisesti 4 sekunnin kuluttua
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="ap-reward-overlay">
      <div className="reward-content">
        <div className="reward-icon">🏆</div>
        <h2>PALKITSU!</h2>
        <div className="reward-xp">+{data.xp} XP</div>
        <p className="reward-reason">{data.reason}</p>
      </div>
    </div>
  );
};

export default RewardOverlay;