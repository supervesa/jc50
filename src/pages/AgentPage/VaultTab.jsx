import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

const VaultTab = ({ guestId, isGameActive }) => {
  const [clues, setClues] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [errorAnim, setErrorAnim] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // UUSI: Tila agentin nimelle
  const [agentName, setAgentName] = useState('Agentti'); 

  // ALUSTUS
  useEffect(() => {
    const init = async () => {
      // 1. Tarkista onko jo avattu
      const { data: access } = await supabase
        .from('vault_access')
        .select('id')
        .eq('guest_id', guestId)
        .maybeSingle();
      
      if (access) setUnlocked(true);

      // 2. Hae vihjeet
      const { data: cluesData } = await supabase.from('vault_clues').select('*');
      if (cluesData) setClues(cluesData);

      // 3. UUSI: Hae agentin nimi characters-taulusta
      const { data: charData } = await supabase
        .from('characters')
        .select('name')
        .eq('assigned_guest_id', guestId)
        .maybeSingle();
      
      if (charData && charData.name) {
        setAgentName(charData.name);
      } else {
        // Jos hahmoa ei löydy, kokeillaan hakea vieraan nimi tai pidetään oletus
        const { data: guestData } = await supabase.from('guests').select('name').eq('id', guestId).maybeSingle();
        if (guestData) setAgentName(guestData.name);
      }

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
      // 1. Tallenna avaus (Access)
      await supabase.from('vault_access').insert({ guest_id: guestId });
      
      // 2. Tallenna palkinto (XP)
      await supabase.from('mission_log').insert({
        guest_id: guestId,
        xp_earned: 100,
        custom_reason: '🔐 Salakapakka murrettu',
        approval_status: 'approved',
        mission_id: null
      });

      // 3. UUSI: Tallenna ilmoitus Tickeriin (live_posts)
      // Ticker näyttää tämän kaikille juhlijoille
      const announcementMsg = `${agentName} mursi salakapan suojauksen! (+100 XP)`;
      
      await supabase.from('live_posts').insert({
        guest_id: guestId,
        type: 'announcement',  // Tärkeä: Ticker lukee vain tätä tyyppiä
        is_visible: true,
        message: announcementMsg,
        image_url: null
      });

      // 4. Päivitä UI
      setUnlocked(true);
      if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100]);
    } else {
      setErrorAnim(true);
      setTimeout(() => setErrorAnim(false), 500);
      setInputCode('');
    }
  };

  if (loading) return <div className="ap-loading">YHDISTETÄÄN MAINLINKIIN...</div>;

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
            Allashuoneen peräpääty. Siellä on salaperäinen luukku...
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