import React from 'react';
import Anthero from '../components/anthero';

const OnboardingView = () => {
  return (
    <div className="view onboarding-view">
      <h1>Testaa äänet</h1>
      <Anthero isSpeaking={false} text="Kuuluuko ääneni?" />
      <button>Testaa</button>
    </div>
  );
};
export default OnboardingView;
