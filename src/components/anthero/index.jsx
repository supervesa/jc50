import React from 'react';
import AntheroBody from './AntheroBody';
import AntheroFace from './AntheroFace';
import SpeechBubble from './SpeechBubble';
import './Anthero.css';

const Anthero = ({ isSpeaking = false, text = "" }) => {
  return (
    <div className="anthero-wrapper">
      {/* Puhekupla */}
      <SpeechBubble text={text} isVisible={!!text} />

      {/* SVG Hahmo */}
      <svg 
        width="200" 
        height="200" 
        viewBox="0 0 200 200" 
        className="anthero-float"
      >
        <AntheroBody />
        <AntheroFace isSpeaking={isSpeaking} />
      </svg>
    </div>
  );
};

export default Anthero;
