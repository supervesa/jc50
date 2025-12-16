import CONFIG from './game-config.json';

// Tarkistaa onko siirto laillinen kahden solmun välillä
export const canMove = (fromNodeId, toNodeId) => {
  if (!fromNodeId || !toNodeId) return false;

  return CONFIG.edges.some(edge => 
    (edge[0] === fromNodeId && edge[1] === toNodeId) ||
    (edge[1] === fromNodeId && edge[0] === toNodeId)
  );
};

// Laskee offsetin jos huoneessa on ruuhkaa
export const getRoomOffset = (playersInRoom, playerId) => {
  if (playersInRoom.length <= 1) return { x: 0, y: 0 };

  const index = playersInRoom.findIndex(p => p.id === playerId);
  const spacing = 60; 
  const totalWidth = (playersInRoom.length - 1) * spacing;
  const startX = -totalWidth / 2;

  return { x: startX + (index * spacing), y: 0 };
};

// Agentin näkyvyyslogiikka
export const resolveAgentVisibility = (agentPlayer, isDetective) => {
  if (agentPlayer.role !== 'agent') return agentPlayer; // Etsivät näkyvät aina
  
  if (isDetective) {
    // Etsivä näkee agentin vain 'last_seen_node' sijainnissa
    return { ...agentPlayer, current_node: agentPlayer.last_seen_node };
  }
  
  // Agentti näkee itsensä
  return agentPlayer;
};