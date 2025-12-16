import React from 'react';

const HostControls = ({ onSpeak }) => {
  return (
    <div className="host-controls">
      <h2>Ohjauspaneeli</h2>
      {/* TODO: Napit eri repliikeille */}
      <button onClick={() => onSpeak("Tervetuloa")}>Tervetuloa</button>
    </div>
  );
};
export default HostControls;
