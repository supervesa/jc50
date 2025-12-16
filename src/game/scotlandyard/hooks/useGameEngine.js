import { useState, useEffect } from 'react';
// Varmista polku!
import { supabase } from '../../../lib/supabaseClient'; 
import CONFIG from '../logic/game-config.json';
import { canMove } from '../logic/rules';

export const useGameEngine = () => {
  const [gameId, setGameId] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('lobby');
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [message, setMessage] = useState('');

  // --- APUFUNKTIOT ---
  const fetchGameState = async (id) => {
    const { data: game } = await supabase.from('SY_games').select('*').eq('id', id).single();
    
    // Haetaan pelaajat järjestyksessä
    const { data: ps } = await supabase
      .from('SY_players')
      .select('*')
      .eq('game_id', id)
      .order('turn_order', { ascending: true });
    
    if (game) {
      setGameStatus(game.status);
      setCurrentTurnIndex(game.current_turn_index);
    }
    if (ps) setPlayers(ps);
  };

  // --- ACTIONS ---
  const createGame = async (playerName) => {
    if (!playerName) return alert("Nimi puuttuu!");
    
    const { data: game, error } = await supabase
      .from('SY_games')
      .insert([{ status: 'waiting' }])
      .select()
      .single();
    
    if (error) {
      console.error("Virhe pelin luonnissa:", error);
      return;
    }

    if (game) {
      // Pelin luoja on aina nolla (0)
      await joinGame(game.id, 'agent', playerName, 0);
    }
  };

  const joinExistingGame = async (playerName) => {
    if (!playerName) return alert("Nimi puuttuu!");
    
    // 1. Etsi peli
    const { data: games } = await supabase
      .from('SY_games')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (games && games.length > 0) {
      const targetGameId = games[0].id;

      // 2. KORJATTU LASKENTA: Hae olemassa olevat pelaajat (vain IDt) ja laske montako niitä on
      const { data: existingPlayers, error: countError } = await supabase
        .from('SY_players')
        .select('id') // Haetaan vain ID keveyden vuoksi
        .eq('game_id', targetGameId);

      if (countError) {
        console.error("Virhe pelaajien laskennassa:", countError);
        return;
      }
      
      // Jos lista on tyhjä, pituus on 0. Jos kaksi pelaajaa, pituus on 2. 
      // Seuraava vuoronumero on siis suoraan listan pituus.
      const nextTurnOrder = existingPlayers ? existingPlayers.length : 0;

      await joinGame(targetGameId, 'detective', playerName, nextTurnOrder);
    } else {
      alert('Ei pelejä saatavilla.');
    }
  };

  const joinGame = async (gId, role, name, fixedTurnOrder) => {
    console.log("Liitytään peliin numerolla:", fixedTurnOrder); // Debug

    const { data: p, error } = await supabase
      .from('SY_players')
      .insert([{
        game_id: gId, 
        name, 
        role, 
        current_node: 'eteinen',
        color: role === 'agent' ? 'black' : 'blue',
        turn_order: fixedTurnOrder // Käytetään laskettua numeroa
      }])
      .select()
      .single();

    if (error) {
      console.error("Virhe liittymisessä (INSERT):", error);
      alert("Liittyminen epäonnistui. Katso konsoli.");
      return;
    }

    if (p) {
      setGameId(gId);
      setMyPlayerId(p.id);
      setTimeout(() => fetchGameState(gId), 100);
    }
  };

  const movePlayer = async (targetNodeId) => {
    if (!players || players.length === 0) return;
    if (!myPlayerId) return;

    const me = players.find(p => p.id === myPlayerId);
    
    const turnPlayer = players.length > 0 
      ? players[currentTurnIndex % players.length] 
      : null;

    if (!me || !turnPlayer) {
      console.warn("Pelaajatietoja puuttuu.");
      return;
    }

    if (me.id !== turnPlayer.id) {
      setMessage(`❌ Ei sinun vuorosi! (${turnPlayer.name})`);
      return;
    }

    if (!canMove(me.current_node, targetNodeId)) {
      setMessage(`❌ Et pääse sinne suoraan.`);
      return;
    }

    try {
      await supabase.from('SY_players').update({ current_node: targetNodeId }).eq('id', me.id);
      await supabase.from('SY_games').update({ current_turn_index: currentTurnIndex + 1 }).eq('id', gameId);
      
      await supabase.from('SY_moves').insert({ 
        game_id: gameId, 
        player_id: me.id, 
        from_node: me.current_node, 
        to_node: targetNodeId 
      });
      
      setMessage(`✅ Liikuit: ${targetNodeId}`);
    } catch (err) {
      console.error("Virhe siirrossa:", err);
      setMessage("Virhe tallennuksessa.");
    }
  };

  // --- REALTIME ---
  useEffect(() => {
    if (!gameId) return;

    const channel = supabase.channel('sy_engine')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'SY_players', filter: `game_id=eq.${gameId}` }, 
        () => fetchGameState(gameId)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'SY_games', filter: `id=eq.${gameId}` }, 
        () => fetchGameState(gameId)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId]);

  return {
    gameId,
    myPlayerId,
    players,
    gameStatus,
    currentTurnIndex,
    message,
    createGame,
    joinExistingGame,
    movePlayer
  };
};