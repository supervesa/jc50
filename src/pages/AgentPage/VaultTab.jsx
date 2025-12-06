import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

const VaultTab = ({ guestId, isGameActive }) => {
  const [clues, setClues] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [errorAnim, setErrorAnim] = useState(false);
  const [loading, setLoading] = useState(true);

  // ALUSTUS
  useEffect(() => {
    const init = async () => {
      const { data: access } = await supabase
        .from('vault_access')
        .select('id')
        .eq('guest_id', guestId)
        .maybeSingle();
      
      if (access) setUnlocked(true);

      const { data: cluesData } = await supabase.from('vault_clues').select('*');
      if (cluesData) setClues(cluesData);
      setLoading(false);
    };

    if (isGameActive || unlocked) init();
    else setLoading(false);
  }, [guestId, isGameActive]);

  // VALITSE VIHJE
  const myClue = useMemo(() => {
    if (clues.length === 0) return null;
    let hash = 0;
    for (let i = 0; i < guestId.length; i++) hash = guestId.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % clues.length;
    return clues[index];
  }, [clues, guestId]);

  // AVAA
  const handleUnlock = async () => {
    if (!myClue) return;
    if (inputCode.trim().toUpperCase() === myClue.code.toUpperCase()) {
      await supabase.from('vault_access').insert({ guest_id: guestId });
      setUnlocked(true);
      if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100]);
    } else {
      setErrorAnim(true);
      setTimeout(() => setErrorAnim(false), 500);
      setInputCode('');
    }
  };

  if (loading) return <div className="ap-loading">YHDISTETÄÄN MAINAINKIIN...</div>;

  // --- TILA A: LUKITTU (Ei vielä käynnistetty) ---
  if (!isGameActive && !unlocked) {
    return (
      <div className="vault-container locked-mode">
        <div className="vault-glitch-icon">🔒</div>
        <h2 className="blink-text">ACCESS DENIED</h2>
     <div className="vault-terminal-text">
  {'>'} SYSTEM LOCKED<br/>
  {'>'} WAITING FOR ADMIN PROTOCOL...<br/>
  {'>'} _
</div>
      </div>
    );
  }

  // --- TILA B: AVATTU (Voitto) ---
  if (unlocked) {
    return (
      <div className="vault-container unlocked-mode">
        <div className="vault-success-badge">✅ ACCESS GRANTED</div>
        
        <div className="secret-content">
          <h3 className="neon-text">SALAKAPAKKA LÖYDETTY</h3>
          
          <p>Seuraa näitä ohjeita tarkasti:</p>
          
          <div className="secret-location-box">
            <strong>SIJAINTI:</strong><br/>
            Kirjastohuoneen kirjahyllyn takana.
          </div>

          <div className="secret-code-display">
            <span className="small">OVIKOODI:</span><br/>
            7 - 4 - 2 - 1
          </div>
          
          <p className="whisper">"Tämä viesti tuhoutuu... ei koskaan. Mutta pidä se omana tietonasi."</p>
        </div>
      </div>
    );
  }

  // --- TILA C: PELI KÄYNNISSÄ (Etsivä) ---
  return (
    <div className="vault-container active-mode">
      <div className="vault-header">
        <span className="status-indicator">● LIVE</span>
        <h2>TURVAJÄRJESTELMÄ</h2>
      </div>

      <div className="clue-terminal">
        <div className="terminal-header">ENCRYPTED MESSAGE_</div>
        <div className="terminal-body">
          {myClue ? `"${myClue.question}"` : 'Ladataan datapaketteja...'}
        </div>
      </div>

      <div className={`code-input-area ${errorAnim ? 'shake' : ''}`}>
        <label>SYÖTÄ PURKUKOODI:</label>
        <input 
          type="text" 
          placeholder="_ _ _ _" 
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          className="vault-input"
          autoComplete="off"
        />
        <button onClick={handleUnlock} className="vault-btn">MURRA SUOJAUS</button>
      </div>
    </div>
  );
};

export default VaultTab;