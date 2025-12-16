import React, { useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import GameMap from './map/GameMap';
import { resolveAgentVisibility } from './logic/rules';

const ScotlandYardGame = () => {
  // Emme enää välitä propsia, koska hook hoitaa sen itse
  const { 
    gameId, myPlayerId, players, currentTurnIndex, message, 
    createGame, joinExistingGame, movePlayer 
  } = useGameEngine(); 

  const [inputName, setInputName] = useState('');

  // --- LOBBY VIEW (Jos peliä ei ole valittu) ---
  if (!gameId) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        background: '#f4f4f4', 
        zIndex: 9999, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <h1 style={{ color: '#333' }}>Scotland Yard: Juhla Edition</h1>
        
        <input 
          value={inputName} 
          onChange={e => setInputName(e.target.value)} 
          placeholder="Nimimerkkisi" 
          style={{ 
            padding: 15, 
            margin: 20, 
            fontSize: 16, 
            borderRadius: 5, 
            border: '1px solid #ccc' 
          }} 
        />
        
        <div>
          <button 
            onClick={() => createGame(inputName)} 
            style={{ 
              padding: 15, 
              margin: 5, 
              background: 'black', 
              color: 'white', 
              border: 'none', 
              borderRadius: 5, 
              cursor: 'pointer' 
            }}>
            Luo Peli (Agentti)
          </button>
          
          <button 
            onClick={() => joinExistingGame(inputName)} 
            style={{ 
              padding: 15, 
              margin: 5, 
              background: 'blue', 
              color: 'white', 
              border: 'none', 
              borderRadius: 5, 
              cursor: 'pointer' 
            }}>
            Liity (Etsivä)
          </button>
        </div>
      </div>
    );
  }

  // --- GAME VIEW ---
  const me = players.find(p => p.id === myPlayerId);
  const currentTurnPlayer = players.length > 0 
    ? players[currentTurnIndex % players.length] 
    : null;
  
  // Suodata näkyvyys: Agentti näkyy etsiville vain jos on paljastunut
  // (Tällä hetkellä agentti on piilossa etsiviltä, koska last_seen_node on tyhjä)
  const visiblePlayers = players.map(p => 
    resolveAgentVisibility(p, me?.role === 'detective')
  ).filter(p => p.current_node);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      background: '#f4f4f4', 
      zIndex: 9999, 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      
      {/* HUD - Yläpalkki */}
      <div style={{ padding: 15, background: '#333', color: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>ID: {gameId.slice(0,4)}</span>
          <span style={{ fontWeight: 'bold' }}>
            {me?.name} <small>({me?.role})</small>
          </span>
        </div>
        
        <div style={{ textAlign: 'center', fontSize: 20, margin: '10px 0', color: '#ffd700', fontWeight: 'bold' }}>
          Vuoro: {currentTurnPlayer ? currentTurnPlayer.name : '...'}
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          color: message.startsWith('❌') ? '#ff6b6b' : '#51cf66',
          minHeight: 20,
          fontSize: 14
        }}>
          {message}
        </div>
      </div>

      {/* MAP - Kartta-alue */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <GameMap 
          players={visiblePlayers} 
          onMove={movePlayer} 
               myPlayerId={myPlayerId} // <--- LISÄÄ TÄMÄ
        />
      </div>
    </div>
  );
};

export default ScotlandYardGame;