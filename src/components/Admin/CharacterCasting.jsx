import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function CharacterCasting({ guests, characters, splits = [], onUpdate }) {
  const [filterMode, setFilterMode] = useState('ALL'); 

  // --- TOIMINNOT ---
  const assignCharacter = async (guestId, charId, isSpouse = false) => {
    if (!charId) return;
    try {
      const { error } = await supabase
        .from('characters')
        .update({ assigned_guest_id: guestId, status: 'varattu', is_spouse_character: isSpouse })
        .eq('id', charId);
      if (error) throw error;
      onUpdate();
    } catch (err) { alert("Virhe: " + err.message); }
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

  // --- HELPERS ---
  const availableChars = characters.filter(c => c.status === 'vapaa');
  
  const getOptionLabel = (char) => {
    let label = `${char.name} (${char.role})`;
    if (char.is_spouse_character) label += " -- [Avec-rooli]";
    return label;
  };

  // --- SUODATUS ---
  const filteredGuests = guests.filter(g => {
    const myChars = characters.filter(c => c.assigned_guest_id === g.id);
    const hasMain = myChars.length > 0; // Jos on edes yksi hahmo, on yleensä ok
    
    // Tarkistetaan onko splitattu (vanhempi)
    const isParentSplit = splits.some(s => s.parent_guest_id === g.id);

    if (filterMode === 'MISSING') {
      if (!hasMain) return true; // Päärooli puuttuu
      // Jos tuo puolison, EIKÄ ole splitattu, ja puuttuu avec-rooli -> Näytä
      if (g.brings_spouse && !isParentSplit) {
        const hasSpouseChar = myChars.some(c => c.is_spouse_character);
        if (!hasSpouseChar) return true;
      }
      return false;
    }
    return true;
  });

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
        {filteredGuests.map(guest => {
          
          const myChars = characters.filter(c => c.assigned_guest_id === guest.id);
          
          // Määritellään päärooli. Jos vieras ei tuo puolisoa (tai on splitattu lapsi), mikä tahansa rooli kelpaa.
          let mainChar = myChars.find(c => !c.is_spouse_character);
          if (!guest.brings_spouse && !mainChar && myChars.length > 0) {
             mainChar = myChars[0];
          }

          // Avec-rooli (vain jos tuo puolison eikä ole splitattu)
          const spouseChar = myChars.find(c => c.is_spouse_character && c.id !== mainChar?.id);

          // Onko tämä vieras splitannut avecinsa?
          const splitRecord = splits.find(s => s.parent_guest_id === guest.id);
          const splitChildName = splitRecord ? guests.find(c => c.id === splitRecord.child_guest_id)?.name : "Avec";

          // Onko tämä vieras itse splitattu (lapsi)?
          const isChild = splits.some(s => s.child_guest_id === guest.id);

          // Pitäisikö reunuksen olla punainen?
          const missingMain = !mainChar;
          const missingSpouse = guest.brings_spouse && !spouseChar && !splitRecord;
          const borderColor = (missingMain || missingSpouse) ? '1px solid var(--plasma-gold)' : '1px solid rgba(255,255,255,0.1)';

          return (
            <div key={guest.id} className="jc-col-4">
              <div className="jc-card small" style={{height:'100%', border: borderColor}}>
                
                <h3 style={{color:'var(--turquoise)', margin:'0 0 1rem 0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  {guest.name}
                  {isChild && <span style={{fontSize:'0.6em', background:'#333', border:'1px solid #555', padding:'2px 6px', borderRadius:'4px', color:'#aaa'}}>AVEC</span>}
                </h3>

                {/* PÄÄROOLI */}
                <div style={{marginBottom:'1rem'}}>
                  <span className="small" style={{display:'block', color:'var(--muted)', marginBottom:'0.2rem'}}>PÄÄROOLI</span>
                  {mainChar ? (
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(0,231,255,0.1)', padding:'0.5rem', borderRadius:'4px'}}>
                      <div style={{overflow:'hidden', textOverflow:'ellipsis'}}>
                        <strong>{mainChar.name}</strong>
                        <div className="small">{mainChar.role}</div>
                      </div>
                      <button onClick={() => unassignCharacter(mainChar.id)} style={{color:'red', background:'none', border:'none', cursor:'pointer'}}>×</button>
                    </div>
                  ) : (
                    <select 
                      className="jc-select"
                      onChange={(e) => assignCharacter(guest.id, e.target.value, false)}
                      defaultValue=""
                      style={{width:'100%'}}
                    >
                      <option value="" disabled>Valitse päärooli...</option>
                      {availableChars.map(c => (
                        <option key={c.id} value={c.id}>{getOptionLabel(c)}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* AVEC ROOLI (Vain jos bings_spouse) */}
                {guest.brings_spouse && (
                  <div style={{borderTop:'1px dashed rgba(255,255,255,0.2)', paddingTop:'1rem'}}>
                    <span className="small" style={{display:'block', color:'var(--magenta)', marginBottom:'0.2rem'}}>AVEC ({guest.spouse_name})</span>
                    
                    {spouseChar ? (
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,0,229,0.1)', padding:'0.5rem', borderRadius:'4px'}}>
                        <div>
                          <strong>{spouseChar.name}</strong>
                          <div className="small">{spouseChar.role}</div>
                        </div>
                        <button onClick={() => unassignCharacter(spouseChar.id)} style={{color:'red', background:'none', border:'none', cursor:'pointer'}}>×</button>
                      </div>
                    ) : splitRecord ? (
                      // JOS SPLITTATTU -> NÄYTÄ TIETO
                      <div style={{padding:'0.5rem', background:'#222', borderRadius:'4px', fontSize:'0.85rem', color:'#888', border:'1px dashed #555'}}>
                        <span style={{color:'#00ff41'}}>✔ Eriytetty omaksi vieraaksi</span><br/>
                        <span className="small">Katso kortti: <strong>{splitChildName}</strong></span>
                      </div>
                    ) : (
                      // JOS EI VIELÄ SPLITTATTU -> NÄYTÄ VALIKKO
                      <select 
                        className="jc-select"
                        style={{borderColor: 'rgba(255,0,229,0.4)', width:'100%'}}
                        onChange={(e) => assignCharacter(guest.id, e.target.value, true)}
                        defaultValue=""
                      >
                        <option value="" disabled>Valitse avec-rooli...</option>
                        {availableChars.map(c => (
                          <option key={c.id} value={c.id}>{getOptionLabel(c)}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CharacterCasting;