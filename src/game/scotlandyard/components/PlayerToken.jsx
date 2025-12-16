import React from 'react';

const PlayerToken = ({ x, y, role }) => {
  const color = role === 'agent' ? '#000' : '#007bff'; // Musta tai sininen
  
  return (
    <g transform={`translate(${x}, ${y})`} style={{ transition: 'all 0.5s ease' }}>
      <circle r="60" fill={color} stroke="white" strokeWidth="10" />
      {/* Tähän voi lisätä nimikirjaimet tai ikonin */}
    </g>
  );
};

export default PlayerToken;