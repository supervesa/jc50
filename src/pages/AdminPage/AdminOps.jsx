import React from 'react';
// Tuodaan komponentit ops-alikansiosta
import VettingQueue from './ops/VettingQueue';
import FlashMissions from './ops/FlashMissions';
import FieldMissions from './ops/FieldMissions';
import ManualXP from './ops/ManualXP';
import AdminVault from './ops/AdminVault'; 

// Tuodaan AdminScoring samasta kansiosta missä AdminOps on
import AdminScoring from './AdminScoring'; 

const AdminOps = ({ 
  activeFlash, 
  flashCount, 
  missions = [], 
  guests, 
  characters,
  startFlash, 
  stopFlash   
}) => {
  return (
    <>
      {/* 0. PISTEYTYKSEN HALLINTA */}
      <AdminScoring />

      {/* 1. Hyväksyntäjono */}
      <VettingQueue />

      {/* 2. Flash-tehtävät */}
      <FlashMissions 
        activeFlash={activeFlash} 
        flashCount={flashCount} 
      />

      {/* 3. Etsintäkuulutukset */}
      <FieldMissions missions={missions} />

      {/* 4. Manuaaliset pisteet */}
      <ManualXP guests={guests} characters={characters} />

      {/* 5. Salakapakka */}
      <AdminVault />
    </>
  );
};

export default AdminOps;