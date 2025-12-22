import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const ManualXP = ({ guests = [], characters = [] }) => {
  const [bonusPoints, setBonusPoints] = useState(100);
  const [bonusReason, setBonusReason] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [xpConfig, setXpConfig] = useState(null);

  // Haetaan oletuspisteytys konfiguraatiosta
  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase
        .from('game_rules')
        .select('value')
        .eq('rule_key', 'xp_config')
        .single();
      if (data && data.value) {
        setXpConfig(data.value);
        // Voit asettaa oletusarvoksi esim. 100 tai muun määritellyn arvon
        setBonusPoints(data.value.manual_default || 100);
      }
    };
    fetchRules();
  }, []);

  // Luodaan lista dropdownia varten
  const dropdownOptions = useMemo(() => {
    if (!guests || guests.length === 0) return [];

    const guestMap = guests.reduce((acc, g) => { 
      acc[g.id] = g.name; 
      return acc; 
    }, {});

    const mappedChars = characters
      .filter(c => c.assigned_guest_id && guestMap[c.assigned_guest_id])
      .map(c => ({
        uniqueKey: c.id,
        value: c.assigned_guest_id,
        label: `🎭 ${c.name} (${guestMap[c.assigned_guest_id]})`
      }));

    if (mappedChars.length === 0) {
      return guests.map(g => ({
        uniqueKey: g.id,
        value: g.id,
        label: `👤 ${g.name}`
      }));
    }

    return mappedChars.sort((a, b) => a.label.localeCompare(b.label));
  }, [guests, characters]);

  const giveBonusXP = async () => {
    if (!selectedGuestId) return alert("Valitse henkilö listasta!");
    if (!bonusReason) return alert("Kirjoita syy!");
    
    const { error } = await supabase.from('mission_log').insert({
      guest_id: selectedGuestId,
      custom_reason: bonusReason,
      xp_earned: bonusPoints,
      approval_status: 'approved',
      mission_id: null
    });

    if (error) {
      alert("Virhe: " + error.message);
    } else {
      alert(`Pisteet lähetetty!`);
      setBonusReason('');
    }
  };

  return (
    <div className="admin-panel" style={{marginTop: '20px', padding: '15px', background: '#222', border: '1px solid #444', borderRadius: '8px'}}>
      <h2 style={{color: 'gold', marginTop: 0}}>🏆 JAA BONUSPISTEITÄ</h2>
      
      <div className="form-group" style={{marginBottom: '10px'}}>
        <label style={{display:'block', marginBottom:'5px', color:'#aaa'}}>Kohde:</label>
        <select 
          className="input-field" 
          value={selectedGuestId} 
          onChange={e => setSelectedGuestId(e.target.value)}
          style={{width: '100%', padding: '10px', fontSize: '1rem'}}
        >
          <option value="">-- Valitse listasta ({dropdownOptions.length}) --</option>
          {dropdownOptions.map(opt => (
            <option key={opt.uniqueKey} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{marginBottom: '10px'}}>
        <input 
          value={bonusReason} 
          onChange={e => setBonusReason(e.target.value)} 
          placeholder="Syy: Esim. Upea tanssiesitys..." 
          className="input-field"
          style={{width: '100%', padding: '10px'}}
        />
      </div>
      
      <div className="form-group" style={{marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px'}}>
        <input 
          type="number" 
          value={bonusPoints} 
          onChange={e => setBonusPoints(parseInt(e.target.value) || 0)} 
          className="input-field"
          style={{width: '100px', padding: '10px'}}
        />
        <span style={{color: '#ccc'}}>XP</span>
      </div>

      <button onClick={giveBonusXP} className="btn-create" style={{background: 'gold', color: 'black', fontWeight: 'bold', width: '100%', padding: '12px', border: 'none', cursor: 'pointer'}}>
        LÄHETÄ PISTEET
      </button>
    </div>
  );
};

export default ManualXP;