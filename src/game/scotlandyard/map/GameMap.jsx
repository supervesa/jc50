import React, { useState, useEffect } from 'react';
import styles from '../styles.module.css';
import CONFIG from '../logic/game-config.json';
import { getRoomOffset } from '../logic/rules';
import PlayerToken from '../components/PlayerToken';
import MapBackground from './MapBackground';

const GameMap = ({ players, myPlayerId, onMove }) => {
  // Oletuksena näytetään 1. kerros
  const [activeFloor, setActiveFloor] = useState(1);

  // --- UUSI OMINAISUUS: SEURAA PELAAJAA (Auto-switch Floor) ---
  useEffect(() => {
    // 1. Etsi oma pelaaja listasta
    const me = players.find(p => p.id === myPlayerId);
    
    if (me && me.current_node) {
      // 2. Katso missä kerroksessa pelaajan nykyinen huone on
      const floorOfRoom = CONFIG.nodes[me.current_node]?.floor;
      
      // 3. Jos kerros löytyy ja se on eri kuin nykyinen näkymä -> Vaihda
      if (floorOfRoom && floorOfRoom !== activeFloor) {
        setActiveFloor(floorOfRoom);
      }
    }
  }, [players, myPlayerId]); // Aja tämä aina kun pelaajat (sijainnit) päivittyvät

  // -----------------------------------------------------------

  return (
    <div className={styles.mapContainer} style={{ position: 'relative' }}>
      
      {/* KERROSVALITSIN NAPIT */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <button 
          onClick={() => setActiveFloor(1)}
          style={{ 
            padding: 10, 
            background: activeFloor===1 ? '#333' : 'white', 
            color: activeFloor===1 ? 'white' : 'black', 
            border: '2px solid #333',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
          1. Kerros
        </button>
        <button 
          onClick={() => setActiveFloor(2)}
          style={{ 
            padding: 10, 
            background: activeFloor===2 ? '#333' : 'white', 
            color: activeFloor===2 ? 'white' : 'black', 
            border: '2px solid #333', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
          2. Kerros
        </button>
      </div>

      <svg 
        viewBox="0 0 3508 2481" 
        className={styles.gameSvg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <MapBackground activeFloor={activeFloor} onRoomClick={onMove} />

        {players.map(p => {
           const nodeName = p.current_node;
           const nodeConfig = CONFIG.nodes[nodeName];
           
           if (!nodeConfig) return null;
           
           // NÄKYVYYS: Näytä jos kerros täsmää TAI jos ollaan portaissa
           const isStaircase = nodeName.includes('portaikko');
           if (!isStaircase && nodeConfig.floor !== activeFloor) return null;

           const offset = getRoomOffset(players.filter(pl => pl.current_node === nodeName), p.id);
           
           return (
             <PlayerToken 
               key={p.id}
               x={nodeConfig.x + offset.x}
               y={nodeConfig.y + offset.y}
               role={p.role}
             />
           );
        })}
      </svg>
    </div>
  );
};

export default GameMap;