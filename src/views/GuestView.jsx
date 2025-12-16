import React from 'react';
import Anthero from '../components/anthero';
import GuestInfo from '../components/ui/GuestInfo';

const GuestView = () => {
  return (
    <div className="view guest-view">
      <Anthero isSpeaking={false} text="Tervetuloa juhliin!" />
      <GuestInfo />
    </div>
  );
};
export default GuestView;
