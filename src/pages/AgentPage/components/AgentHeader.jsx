import React from 'react';

const AgentHeader = ({ identity, myScore, myRank }) => {
  if (!identity) return null;

  return (
    <div className="ap-header">
      <div className="ap-avatar">
        {identity.avatar ? (
          <img src={identity.avatar} alt="" />
        ) : (
          <div className="ap-initial">{identity.realName?.charAt(0)}</div>
        )}
      </div>
      
      <div className="ap-info">
        <div className="ap-label">AGENTTI: {identity.realName?.toUpperCase()}</div>
        <h1 className="ap-name">{identity.charName || identity.realName}</h1>
        <div className="ap-stats">
          <span className="xp-badge">{myScore} XP</span>
          <span className="rank-badge">{myRank}</span>
        </div>
      </div>
      
      <div className="ap-secret-code">
        <div className="code-label">ID CODE</div>
        <div className="code-val">{identity.agentCode || '---'}</div>
      </div>
    </div>
  );
};

export default AgentHeader;