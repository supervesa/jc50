import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AdminOps = ({ activeFlash, flashCount, missions, guests }) => {
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionTag, setNewMissionTag] = useState('');
  const [bonusPoints, setBonusPoints] = useState(100);
  const [bonusReason, setBonusReason] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState('');

  // FLASH ACTIONS
  const startFlash = async (type, title, xp) => {
    if (activeFlash) await stopFlash();
    await supabase.from('flash_missions').insert({ type, title, xp_reward: xp, status: 'active' });
  };

// Korvaa vanha stopFlash tällä:
  const stopFlash = async () => {
    if (!activeFlash) return;
    
    // 1. Päivitetään tila tietokantaan
    const { error } = await supabase
      .from('flash_missions')
      .update({ 
        status: 'ended', 
        end_time: new Date().toISOString() // Varmistetaan oikea aikamuoto
      })
      .eq('id', activeFlash.id);

    // 2. Jos tuli virhe, kerro siitä
    if (error) {
      alert("Virhe tehtävän päättämisessä: " + error.message);
      console.error(error);
    } 
    // Onnistui -> Komponentti päivittyy itsestään Realtime-kuuntelijan kautta
  };
  // MISSION ACTIONS
  const createMission = async (e) => {
    e.preventDefault();
    if (!newMissionTitle) return;
    await supabase.from('missions').insert({ title: newMissionTitle, target_tag: newMissionTag, xp_reward: 100 });
    setNewMissionTitle(''); setNewMissionTag('');
  };

  const deleteMission = async (id) => {
    if(!confirm("Poistetaanko tehtävä?")) return;
    await supabase.from('mission_log').delete().eq('mission_id', id);
    await supabase.from('missions').delete().eq('id', id);
  };

  // --- UUSI: GENEROI TEHTÄVÄT VAIN AKTIIVISISTA ROOLEISTA ---
  const generateMissionsFromRoles = async () => {
    if (!confirm("Tämä luo etsintäkuulutukset vain niille rooleille, jotka on jaettu vieraille. Jatketaanko?")) return;

    try {
      // 1. Hae vain ne roolit, jotka on jaettu (assigned_guest_id ei ole null)
      // Tämä estää "mahdottomien tehtävien" luomisen.
      const { data: chars, error: charError } = await supabase
        .from('characters')
        .select('role')
        .not('assigned_guest_id', 'is', null); // <--- TÄMÄ ON KORJAUS

      if (charError) throw charError;
      
      // 2. Siivoa lista (uniikit roolit, poista tyhjät)
      const uniqueRoles = [...new Set(chars.map(c => c.role).filter(r => r && r.length > 2))];

      if (uniqueRoles.length === 0) {
        alert("Ei jaettuja rooleja. Jaa hahmoja vieraille ensin Roolitus-välilehdellä.");
        return;
      }

      // 3. Hae jo olemassa olevat tehtävät (ettei tule tuplia)
      const { data: existingMissions, error: missionError } = await supabase
        .from('missions')
        .select('target_tag');

      if (missionError) throw missionError;

      const existingTags = existingMissions.map(m => m.target_tag);

      // 4. Suodata vain uudet (luodaan tehtävä vain jos sellaista ei vielä ole)
      const newMissions = uniqueRoles
        .filter(role => !existingTags.includes(role))
        .map(role => ({
          title: `Etsi ${role}`,
          description: `Etsi henkilö, jonka rooli on ${role}, ja kysy hänen koodinsa.`,
          target_tag: role,
          xp_reward: 150,
          is_active: true
        }));

      if (newMissions.length === 0) {
        alert("Kaikille aktiivisille rooleille on jo luotu tehtävät.");
        return;
      }

      // 5. Tallenna kantaan
      const { error } = await supabase.from('missions').insert(newMissions);
      if (error) throw error;

      alert(`Luotiin ${newMissions.length} uutta tehtävää aktiivisille rooleille!`);

    } catch (err) {
      alert("Virhe: " + err.message);
    }
  };

  // BONUS ACTIONS
  const giveBonusXP = async () => {
    if (!selectedGuestId || !bonusReason) return;
    await supabase.from('mission_log').insert({ guest_id: selectedGuestId, custom_reason: bonusReason, xp_earned: bonusPoints });
    alert(`Pisteet lähetetty!`);
    setBonusReason('');
  };

  return (
    <>
      {/* FLASH MISSIONS */}
      <div className="admin-section">
        <h2>⚡ FLASH MISSIONS (DJ TOOLS)</h2>
        
        {activeFlash ? (
          <div className="flash-active-card">
            <h3 className="blink">⚠️ LIVE: {activeFlash.title}</h3>
            <div className="flash-stats">OSALLISTUJIA: {flashCount}</div>
            <button className="btn-stop-large" onClick={stopFlash}>⏹ PÄÄTÄ TEHTÄVÄ</button>
          </div>
        ) : (
          <div className="flash-buttons">
            <button className="btn-flash mob" onClick={() => startFlash('mob', 'KAIKKI TANSSILATTIALLE!', 100)}>
              💃 TANSSILATTIA (MOB)
            </button>
            <button className="btn-flash race" onClick={() => startFlash('race', 'ENSOIMMÄINEN JOKA TUO SERVETIN!', 500)}>
              🏁 RACE: SERVETTI
            </button>
            <button className="btn-flash photo" onClick={() => startFlash('photo', 'OTA YHTEISSELFIE NYT!', 200)}>
              📸 PHOTO OP
            </button>
          </div>
        )}
      </div>

      {/* FIELD MISSIONS */}
      <div className="admin-panel">
        <h2>🕵️ LUO ETŠINTÄKUULUTUS</h2>
        {/* UUSI NAPPI TÄHÄN */}
        <button 
          onClick={generateMissionsFromRoles} 
          className="btn-create" 
          style={{background: '#6f42c1', marginBottom: '20px'}}
        >
          🤖 AUTO-GENEROI ROOLEISTA
        </button>
        <p className="small-text">Vieraat etsivät henkilöä, jolla on tämä ominaisuus.</p>
        <form onSubmit={createMission}>
          <div className="form-group">
            <input value={newMissionTitle} onChange={e => setNewMissionTitle(e.target.value)} placeholder="Tehtävä: Etsi Lääkäri..." className="input-field"/>
          </div>
          <div className="form-group">
            <input value={newMissionTag} onChange={e => setNewMissionTag(e.target.value)} placeholder="Avainsana (valinnainen): Lääkäri" className="input-field"/>
          </div>
          <button type="submit" className="btn-create">JULKAISE TEHTÄVÄ</button>
        </form>

        <div className="mission-list">
          {missions.map(m => (
            <div key={m.id} className="mission-row">
              <span>{m.title}</span>
              <button onClick={() => deleteMission(m.id)}>🗑</button>
            </div>
          ))}
        </div>
      </div>

      {/* MANUAL XP */}
      <div className="admin-panel">
        <h2>🏆 JAA BONUSPISTEITÄ</h2>
        <div className="form-group">
          <select className="input-field" value={selectedGuestId} onChange={e => setSelectedGuestId(e.target.value)}>
            <option value="">Valitse vieras...</option>
            {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <input value={bonusReason} onChange={e => setBonusReason(e.target.value)} placeholder="Syy: Upea tanssi..." className="input-field"/>
        </div>
        <button onClick={giveBonusXP} className="btn-create" style={{background: 'gold', color: 'black'}}>LÄHETÄ +{bonusPoints} XP</button>
      </div>
    </>
  );
};

export default AdminOps;