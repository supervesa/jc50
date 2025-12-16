import { useState, useEffect } from 'react';

export const useWebSpeech = () => {
  // TODO: Toteuta Web Speech API logiikka tähän
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text) => {
    console.log("Speaking:", text);
    setIsSpeaking(true);
    // Mock finish
    setTimeout(() => setIsSpeaking(false), 2000);
  };

  const cancel = () => {
    console.log("Cancelled speech");
    setIsSpeaking(false);
  };

  return { speak, cancel, isSpeaking };
};
