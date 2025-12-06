import React from 'react';
// Varmista että polut ovat oikein suhteessa tähän tiedostoon
import VettingQueue from './ops/VettingQueue';
import FlashMissions from './ops/FlashMissions';
import FieldMissions from './ops/FieldMissions';
import ManualXP from './ops/ManualXP';
import AdminVault from './ops/AdminVault'; 

const AdminOps = ({ activeFlash, flashCount, missions, guests }) => {
  return (
    <>
      {/* 1. Hyväksyntäjono (Hakee datansa itse) */}
      <VettingQueue />

      {/* 2. Flash-tehtävät (Saa datan propseina ylhäältä) */}
      <FlashMissions activeFlash={activeFlash} flashCount={flashCount} />

      {/* 3. Etsintäkuulutukset (Saa datan propseina) */}
      <FieldMissions missions={missions} />

      {/* 4. Manuaaliset pisteet (Saa vieraslistan propseina) */}
      <ManualXP guests={guests} />

      {/* 5. Salakapakka (Hakee datansa itse) */}
      <AdminVault />
    </>
  );
};

export default AdminOps;