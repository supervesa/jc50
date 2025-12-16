import React, { useState, useEffect } from 'react';
import { useHeistData } from '../../../../components/leader/useHeistData'; 
import StatsTakeoverView from './StatsTakeoverView';
import './StatsTakeover.css'; // <--- MUUTA TÄMÄ

// 1. Lisätty 'characters' propseihin
const StatsTakeoverLogic = ({ isActive, characters }) => {
  const { 
    agents, 
    totalLoot, 
    globalHeat, 
    tickerEvents,
    intelStats 
  } = useHeistData();

  // Tila: 0=Strategic, 1=Most Wanted, 2=Intel
  const [screenIndex, setScreenIndex] = useState(0);

  // Karuselli
  useEffect(() => {
    if (!isActive) {
      setScreenIndex(0); // Nollaa kun suljetaan
      return;
    }

    const interval = setInterval(() => {
      setScreenIndex(prev => (prev + 1) % 3); // Pyörii 0 -> 1 -> 2 -> 0
    }, 12000); // 12 sekuntia per sivu

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <StatsTakeoverView 
      active={isActive}
      screenIndex={screenIndex}
      totalLoot={totalLoot}
      heatLevel={globalHeat}
      agents={agents} 
      tickerEvents={tickerEvents}
      intelStats={intelStats} 
      characters={characters} // 2. Välitetään data näkymälle
    />
  );
};

export default StatsTakeoverLogic;