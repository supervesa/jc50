import React from 'react';
import './Anthero.css';

const AntheroFace = ({ isSpeaking }) => {
  return (
    <g transform="translate(0, 10)">
      {/* --- SILMÄT --- */}
      <g className="anthero-eyes">
        <ellipse cx="75" cy="90" rx="8" ry="12" fill="#333" />
        <ellipse cx="125" cy="90" rx="8" ry="12" fill="#333" />
      </g>

      {/* --- SUU --- */}
      {isSpeaking ? (
        // Puhuva suu (CSS-animaatio hoitaa liikkeen)
        <ellipse 
          className="anthero-mouth-speaking"
          cx="100" 
          cy="120" 
          rx="10" 
          ry="8" 
          fill="#333"
        />
      ) : (
        // Hymy (Idle)
        <path 
          d="M85 120 Q100 135 115 120" 
          stroke="#333" 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round"
        />
      )}
      
      {/* Kevyt viiksivarjo */}
      <path d="M90 110 L110 110" stroke="#333" strokeWidth="1" opacity="0.2" />
    </g>
  );
};

export default AntheroFace;
