import React from 'react';
// Varmista että polut ovat oikein suhteessa tähän tiedostoon
import VettingQueue from './ops/VettingQueue';
import FlashMissions from './ops/FlashMissions';
import FieldMissions from './ops/FieldMissions';
import ManualXP from './ops/ManualXP';
import AdminVault from './ops/AdminVault'; 

const AdminOps = ({ 
  activeFlash, 
  flashCount, 
  missions = [], // Lisätty oletusarvo [] kaatumisen estämiseksi
  guests, 
  characters,
  startFlash, // <--- UUSI: Funktio tehtävän aloittamiseen
  stopFlash   // <--- UUSI: Funktio tehtävän lopettamiseen
}) => {
  return (
    <>
      {/* 1. Hyväksyntäjono (Hakee datansa itse) */}
      <VettingQueue />

      {/* 2. Flash-tehtävät (Nyt mukana kontrollit start/stop) */}
      <FlashMissions 
        activeFlash={activeFlash} 
        flashCount={flashCount} 
        startFlash={startFlash} // Välitetään eteenpäin
        stopFlash={stopFlash}   // Välitetään eteenpäin
      />

      {/* 3. Etsintäkuulutukset (Saa datan propseina) */}
      <FieldMissions missions={missions} />

      {/* 4. Manuaaliset pisteet (Saa vieraslistan propseina) */}
      <ManualXP guests={guests} characters={characters} />

      {/* 5. Salakapakka (Hakee datansa itse) */}
      <AdminVault />
    </>
  );
};

export default AdminOps;