import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function CharacterCasting({ guests, characters, onUpdate }) {
  const [filterMode, setFilterMode] = useState('ALL'); 

  // --- TOIMINNOT ---
  const assignCharacter = async (guestId, charId, isSpouse = false) => {
    if (!charId) return;
    try {
      const { error } = await supabase
        .from('characters')
        .update({ 
          assigned_guest_id: guestId, 
          status: 'varattu', 
          is_spouse_character: isSpouse // Tässä tallennetaan tieto: onko se jaettu avecille vai ei
        })
        .eq('id', charId);

      if (error) throw error;
      onUpdate();
    } catch (err) {
      alert("Virhe: " + err.message);
    }
  };

  const unassignCharacter = async (charId) => {
    if(!window.confirm("Vapautetaanko rooli?")) return;
    try {
      await supabase
        .from('characters')
        .update({ assigned_guest_id: null, status: 'vapaa', is_spouse_character: false })
        .eq('id', charId);
      onUpdate();
    } catch (err) { alert(err.message); }
  };

  // Suodatus vieraille
  const filteredGuests = guests.filter(g => {
    if (filterMode === 'MISSING') {
      const missingMain = !g.mainCharacter;
      const missingSpouse = g.brings_spouse && !g.spouseCharacter;
      return missingMain || missingSpouse;
    }
    return true;
  });

  // --- MUUTOS: KAIKKI VAPAAT HAHMOT ---
  // Ei enää tiukkaa erottelua. Kaikki vapaat ovat tarjolla kaikille.
  const availableChars = characters.filter(c => c.status === 'vapaa');

  // Apufunktio: Luodaan hahmon nimi listaan (esim. "Agentti X (Avec-rooli)")
  const getOptionLabel = (char) => {
    let label = `${char.name} (${char.role})`;
    if (char.is_spouse_character) {
      label += " -- [Avec-rooli]"; // Visuaalinen vinkki, ei esto
    }
    return label;
  };

  return (
    <div>
      <div className="jc-toolbar" style={{display:'flex', gap:'1rem', marginBottom:'2rem', alignItems:'center'}}>
        <h3 className="jc-h2" style={{margin:0, fontSize:'1.5rem'}}>Roolitus</h3>
        <div style={{marginLeft:'auto', display:'flex', gap:'0.5rem'}}>
          <button onClick={()=>setFilterMode('ALL')} className={`jc-filter-btn ${filterMode==='ALL'?'active':''}`}>Kaikki</button>
          <button onClick={()=>setFilterMode('MISSING')} className={`jc-filter-btn ${filterMode==='MISSING'?'active':''}`}>Puuttuvat roolit</button>
        </div>
      </div>

      <div className="jc-grid">
        {filteredGuests.map(guest => (
          <div key={guest.id} className="jc-col-4">
            <div className="jc-card small" style={{height:'100%', border: (!guest.mainCharacter || (guest.brings_spouse && !guest.spouseCharacter)) ? '1px solid var(--plasma-gold)' : '1px solid rgba(255,255,255,0.1)'}}>
              
              <h3 style={{color:'var(--turquoise)', margin:'0 0 1rem 0'}}>{guest.name}</h3>

              {/* PÄÄVIERAAN ROOLI */}
              <div style={{marginBottom:'1rem'}}>
                <span className="small" style={{display:'block', color:'var(--muted)', marginBottom:'0.2rem'}}>PÄÄROOLI</span>
                {guest.mainCharacter ? (
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(0,231,255,0.1)', padding:'0.5rem', borderRadius:'4px'}}>
                    <div>
                      <strong>{guest.mainCharacter.name}</strong>
                      <div className="small">{guest.mainCharacter.role}</div>
                    </div>
                    <button onClick={() => unassignCharacter(guest.mainCharacter.id)} style={{color:'red', background:'none', border:'none', cursor:'pointer'}}>×</button>
                  </div>
                ) : (
                  <select 
                    className="jc-select"
                    onChange={(e) => assignCharacter(guest.id, e.target.value, false)}
                    defaultValue=""
                  >
                    <option value="" disabled>Valitse päärooli...</option>
                    {/* Näytetään KAIKKI vapaat hahmot */}
                    {availableChars.map(c => (
                      <option key={c.id} value={c.id}>
                        {getOptionLabel(c)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* AVEC ROOLI */}
              {guest.brings_spouse && (
                <div style={{borderTop:'1px dashed rgba(255,255,255,0.2)', paddingTop:'1rem'}}>
                  <span className="small" style={{display:'block', color:'var(--magenta)', marginBottom:'0.2rem'}}>AVEC ({guest.spouse_name})</span>
                  {guest.spouseCharacter ? (
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,0,229,0.1)', padding:'0.5rem', borderRadius:'4px'}}>
                      <div>
                        <strong>{guest.spouseCharacter.name}</strong>
                        <div className="small">{guest.spouseCharacter.role}</div>
                      </div>
                      <button onClick={() => unassignCharacter(guest.spouseCharacter.id)} style={{color:'red', background:'none', border:'none', cursor:'pointer'}}>×</button>
                    </div>
                  ) : (
                    <select 
                      className="jc-select"
                      style={{borderColor: 'rgba(255,0,229,0.4)'}}
                      onChange={(e) => assignCharacter(guest.id, e.target.value, true)}
                      defaultValue=""
                    >
                      <option value="" disabled>Valitse avec-rooli...</option>
                      {/* Näytetään KAIKKI vapaat hahmot tässäkin */}
                      {availableChars.map(c => (
                        <option key={c.id} value={c.id}>
                          {getOptionLabel(c)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CharacterCasting;