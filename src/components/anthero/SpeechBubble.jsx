import React from 'react';
import './Anthero.css';

const SpeechBubble = ({ text, isVisible }) => {
  if (!isVisible || !text) return null;

  return (
    <div className="anthero-bubble-container">
      <div className="anthero-bubble">
        {text}
      </div>
    </div>
  );
};

export default SpeechBubble;
