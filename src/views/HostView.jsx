import React from 'react';
import Anthero from '../components/anthero';
import HostControls from '../components/ui/HostControls';
import { useWebSpeech } from '../hooks/useWebSpeech';

const HostView = () => {
  const { speak, isSpeaking } = useWebSpeech();
  
  return (
    <div className="view host-view">
      <h1>Host Mode</h1>
      <Anthero isSpeaking={isSpeaking} text={isSpeaking ? "Puhun..." : "Odotan..."} />
      <HostControls onSpeak={speak} />
    </div>
  );
};
export default HostView;
