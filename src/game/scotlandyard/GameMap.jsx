import React, { useState } from 'react';
import styles from '../styles.module.css';
import CONFIG from '../logic/game-config.json';
import { getRoomOffset } from '../logic/rules';
import PlayerToken from '../components/PlayerToken';
import MapBackground from './MapBackground';

const GameMap = ({ players, onMove }) => {
  // Manuaalinen kerrosvalinta
  const [activeFloor, setActiveFloor] = useState(1);

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
           
           // NÄKYVYYSFILTTERI:
           // 1. Jos huone kuuluu molempiin kerroksiin (esim. portaikko), näytä aina.
           // 2. Muuten näytä vain jos kerros täsmää.
           if (nodeConfig.floor !== 'both' && nodeConfig.floor !== activeFloor) {
             return null;
           }

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