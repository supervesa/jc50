import { useState } from 'react';

export const useAntheroState = () => {
  // TODO: Tilakone (idle, speaking, listening)
  const [mood, setMood] = useState('idle');
  return { mood, setMood };
};
