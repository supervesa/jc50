import React from 'react';

const AntheroBody = () => {
  return (
    <g id="anthero-body">
      {/* Tähden varjo/hohto */}
      <path 
        d="M100 10 L125 70 L190 70 L140 110 L160 170 L100 130 L40 170 L60 110 L10 70 L75 70 Z" 
        fill="none" 
        stroke="#FFA500" 
        strokeWidth="8" 
        opacity="0.3"
        filter="blur(4px)"
      />
      
      {/* Itse tähti */}
      <path 
        d="M100 10 L125 70 L190 70 L140 110 L160 170 L100 130 L40 170 L60 110 L10 70 L75 70 Z" 
        fill="#FFD700" 
        stroke="#FFA500" 
        strokeWidth="3" 
        strokeLinejoin="round"
      />
    </g>
  );
};

export default AntheroBody;
