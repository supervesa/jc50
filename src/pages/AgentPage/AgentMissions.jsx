import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

// --- ALIKOMPONENTTI: YKSITTÄINEN TEHTÄVÄKORTTI ---
// Tällä on oma tila (inputCode), joten se ei sekoitu muihin
const MissionCard = ({ mission, guestId, onComplete }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submitCode = async () => {
    if (code.length !== 4) { alert("Syötä 4-numeroinen koodi."); return; }
    setLoading(true);
    
    // 1. Hae koodia vastaava hahmo
    const { data: targetChar } = await supabase
      .from('characters')
      .select('*')
      .eq('agent_code', code)
      .maybeSingle();
    
    if (!targetChar) { 
      alert("Virheellinen agenttikoodi."); 
      setLoading(false);
      return; 
    }

    if (targetChar.assigned_guest_id === guestId) { 
      alert("Et voi etsiä itseäsi!"); 
      setLoading(false);
      return; 
    }

    // 2. VALIDOINTI: Onko oikea tyyppi? (Role vs Target Tag)
    if (mission.target_tag) {
      const tag = mission.target_tag.toLowerCase();
      const role = (targetChar.role || '').toLowerCase();
      const name = (targetChar.name || '').toLowerCase();
      const story = (targetChar.backstory || '').toLowerCase();

      const isMatch = role.includes(tag) || name.includes(tag) || story.includes(tag);

      if (!isMatch) {
        alert(`VÄÄRÄ KOHDE!\n\nLöysit henkilön: ${targetChar.name} (${targetChar.role})\n\nMutta tehtävä vaatii: "${mission.target_tag}"`);
        setLoading(false);
        return;
      }
    }

    // 3. Tallenna suoritus
    const { error } = await supabase.from('mission_log').insert({
      guest_id: guestId,
      mission_id: mission.id,
      xp_earned: mission.xp_reward,
      custom_reason: `Kohde löydetty: ${targetChar.name}` 
    });

    if (error) { 
      alert("Virhe tai tehtävä jo suoritettu."); 
    } else { 
      setCode(''); // Tyhjennä kenttä
      onComplete(mission.id); // Ilmoita ylöspäin että valmis
    }
    setLoading(false);
  };

  return (
    <div className="mission-card active">
      <div className="mission-badge">WANTED</div>
      
      <div className="mission-header">
        <div className="mission-title">{mission.title}</div>
        <div className="mission-xp">{mission.xp_reward} XP</div>
      </div>
      
      <div className="mission-action">
        <p className="mission-desc">
          Kohde: <span className="tag-highlight">{mission.target_tag || 'Määrittelemätön'}</span>
        </p>
        <div className="code-input-row">
          <input 
            type="number" 
            placeholder="ID-KOODI" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
          />
          <button onClick={submitCode} disabled={loading}>
            {loading ? '...' : 'TARKISTA'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- PÄÄKOMPONENTTI ---
const AgentMissions = ({ missions, completedIds, guestId, onMissionComplete }) => {
  
  // --- DETERMINISTINEN SEKOITUS (Personal Deck) ---
  const visibleMissions = useMemo(() => {
    // 1. Poista jo tehdyt
    const todoMissions = missions.filter(m => !completedIds.includes(m.id));

    if (todoMissions.length === 0) return [];

    // 2. Hash-funktio sekoitukseen
    const stringHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    };

    // 3. Sekoita vieraan ID:n perusteella
    const shuffled = [...todoMissions].sort((a, b) => {
      const hashA = stringHash(guestId + a.id);
      const hashB = stringHash(guestId + b.id);
      return hashA - hashB;
    });

    // 4. Näytä TOP 3
    return shuffled.slice(0, 3);

  }, [missions, completedIds, guestId]);

  return (
    <div className="ap-mission-list">
      <div className="mission-intro">
        <p>AKTIIVISET TEHTÄVÄT (3 kpl kerrallaan)</p>
        <p style={{fontSize:'0.7rem', opacity:0.6}}>Suorita tehtävä saadaksesi uuden tilalle.</p>
      </div>

      {/* KÄYTETÄÄN NYT ERILLISTÄ KOMPONENTTIA JOKAISELLE KORTILLE */}
      {visibleMissions.map(m => (
        <MissionCard 
          key={m.id} 
          mission={m} 
          guestId={guestId} 
          onComplete={onMissionComplete} 
        />
      ))}
      
      {visibleMissions.length === 0 && (
        <div className="no-missions">
          <h3>KAIKKI TEHTÄVÄT SUORITETTU!</h3>
          <p>Olet mestariagentti. Odota uusia ohjeita päämajasta.</p>
        </div>
      )}
    </div>
  );
};

export default AgentMissions;