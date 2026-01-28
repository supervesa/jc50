import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const FieldMissions = ({ missions }) => {
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionTag, setNewMissionTag] = useState('');
  
  // TILA: Hallitsee listan näkyvyyttä
  const [isListOpen, setIsListOpen] = useState(false);
  
  // TILA: Tallentaa dynaamiset säännöt
  const [xpConfig, setXpConfig] = useState(null);

  // TILA: Testauksen apuvälineet (Hakusana ja Koodit)
  const [searchTerm, setSearchTerm] = useState('');
  const [agentCodes, setAgentCodes] = useState({});

  // Haetaan säännöt ja agenttikoodit komponentin latautuessa
  useEffect(() => {
    const fetchData = async () => {
      // 1. Haetaan XP säännöt
      const { data: ruleData } = await supabase
        .from('game_rules')
        .select('value')
        .eq('rule_key', 'xp_config')
        .single();
      if (ruleData) setXpConfig(ruleData.value);

      // 2. Haetaan Agentti-koodit "lunttilapuksi" testausta varten
      const { data: charData } = await supabase
        .from('characters')
        .select('role, agent_code')
        .not('role', 'is', null);
      
      if (charData) {
        // Muutetaan array objektiksi muotoon: { "Lääkäri": "1234", "Pappi": "5678" }
        const codeMap = {};
        charData.forEach(c => {
          if (c.role) codeMap[c.role] = c.agent_code;
        });
        setAgentCodes(codeMap);
      }
    };
    fetchData();
  }, []);

  const createMission = async (e) => {
    e.preventDefault();
    if (!newMissionTitle) return;
    
    // Käytetään dynaamista arvoa 'find_role' tai oletusta 100
    const reward = xpConfig?.find_role || 100;

    await supabase.from('missions').insert({
      title: newMissionTitle,
      target_tag: newMissionTag, 
      xp_reward: reward
    });
    setNewMissionTitle(''); 
    setNewMissionTag('');
    // Huom: Parent-komponentin pitäisi päivittää missions-lista, tai sivu pitää ladata uudelleen
  };

  // --- LOGIIKKA: SYNKRONOINTI (PÄIVITETTY ID-KORJAUKSELLA) ---
  const syncMissionsWithRoles = async () => {
    if (!confirm("Tämä toiminto synkronoi tehtävät:\n\n1. Luo puuttuvat tehtävät.\n2. PÄIVITTÄÄ olemassa oleviin puuttuvat ID:t.\n3. POISTAA vanhentuneet.\n\nJatketaanko?")) return;
    
    try {
      // 1. Haetaan kaikki varatut hahmot (rooli + vieraan ID)
      const { data: chars } = await supabase
        .from('characters')
        .select('role, assigned_guest_id')
        .not('assigned_guest_id', 'is', null)
        .not('role', 'is', null);
        
      // Mapataan rooli -> vieraan ID
      const uniqueCharMap = new Map();
      if (chars) {
        chars.forEach(c => {
          if (c.role && c.role.length > 2 && !uniqueCharMap.has(c.role)) {
              uniqueCharMap.set(c.role, c.assigned_guest_id);
          }
        });
      }
      
      const activeRoles = Array.from(uniqueCharMap.keys());

      // 2. Haetaan nykyiset tehtävät tietokannasta
      const { data: existingMissions } = await supabase
        .from('missions')
        .select('id, target_tag, target_guest_id'); // Haetaan myös nykyinen ID tarkistusta varten

      const existingTags = existingMissions ? existingMissions.map(m => m.target_tag) : [];

      const reward = xpConfig?.find_role || 150;

      // 3A. LUOTAVAT (Uudet roolit)
      const missionsToCreate = activeRoles
        .filter(role => !existingTags.includes(role))
        .map(role => ({
          title: `Etsi ${role}`,
          description: `Etsi henkilö, jonka rooli on ${role}`,
          target_tag: role,
          target_guest_id: uniqueCharMap.get(role),
          xp_reward: reward,
          is_active: true
        }));

      // 3B. PÄIVITETTÄVÄT (Tehtävä on, mutta ID puuttuu tai on väärä)
      const missionsToUpdate = [];
      if (existingMissions) {
        existingMissions.forEach(m => {
          // Jos tehtävän rooli on yhä aktiivinen...
          if (activeRoles.includes(m.target_tag)) {
            const correctId = uniqueCharMap.get(m.target_tag);
            // ...mutta ID on väärä tai puuttuu -> Lisätään päivityslistalle
            if (m.target_guest_id !== correctId) {
              missionsToUpdate.push({ id: m.id, target_guest_id: correctId });
            }
          }
        });
      }

      // 3C. POISTETTAVAT (Vanhentuneet roolit)
      const missionsToDelete = existingMissions
        ? existingMissions.filter(m => !activeRoles.includes(m.target_tag)).map(m => m.id)
        : [];

      // --- SUORITUS ---
      let message = '';

      // A) Insert
      if (missionsToCreate.length > 0) {
        const { error } = await supabase.from('missions').insert(missionsToCreate);
        if (error) throw error;
        message += `✅ Luotu ${missionsToCreate.length} uutta tehtävää.\n`;
      }

      // B) Update (Korjataan ID:t)
      if (missionsToUpdate.length > 0) {
        // Supabasessa ei ole mass updatea arraylla helppoa, tehdään loopissa (turvallinen näille määrille)
        for (const updateItem of missionsToUpdate) {
          await supabase
            .from('missions')
            .update({ target_guest_id: updateItem.target_guest_id })
            .eq('id', updateItem.id);
        }
        message += `🔧 Päivitetty ${missionsToUpdate.length} tehtävän puuttuvat ID:t.\n`;
      }

      // C) Delete
      if (missionsToDelete.length > 0) {
        await supabase.from('mission_log').delete().in('mission_id', missionsToDelete);
        const { error } = await supabase.from('missions').delete().in('id', missionsToDelete);
        if (error) throw error;
        message += `🗑️ Poistettu ${missionsToDelete.length} vanhentunutta.\n`;
      }

      if (!message) message = "✨ Kaikki on jo ajan tasalla!";
      
      alert(message);
      window.location.reload(); 

    } catch(err) { 
      console.error(err);
      alert(`Virhe: ${err.message}`); 
    }
  };

  const deleteMission = async (id) => {
    if(!confirm("Poistetaanko?")) return;
    await supabase.from('mission_log').delete().eq('mission_id', id);
    await supabase.from('missions').delete().eq('id', id);
  };

  const filteredMissions = missions.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.target_tag && m.target_tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-panel">
      <h2>🕵️ LUO ETŠINTÄKUULUTUS</h2>
      
      <button 
        onClick={syncMissionsWithRoles} 
        className="btn-create" 
        style={{background: '#d35400', marginBottom: '20px', border: '1px solid #e67e22'}}
      >
        🔄 SYNKRONOI ROOLIT & TEHTÄVÄT
      </button>

      <form onSubmit={createMission}>
        <div className="form-group">
          <input value={newMissionTitle} onChange={e => setNewMissionTitle(e.target.value)} placeholder="Tehtävä: Etsi Lääkäri..." className="input-field"/>
        </div>
        <div className="form-group">
          <input value={newMissionTag} onChange={e => setNewMissionTag(e.target.value)} placeholder="Avainsana: Lääkäri" className="input-field"/>
        </div>
        <button type="submit" className="btn-create">JULKAISE</button>
      </form>

      <div style={{marginTop: '30px', borderTop: '2px solid #333', paddingTop: '10px'}}>
        <div 
          onClick={() => setIsListOpen(!isListOpen)}
          style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '10px',
            background: '#252525',
            borderRadius: '6px'
          }}
        >
          <h3 style={{margin: 0, fontSize: '1rem', color: '#ccc'}}>
            📜 AKTIIVISET TEHTÄVÄT ({filteredMissions.length} / {missions.length})
          </h3>
          <span style={{fontSize: '1.2rem'}}>{isListOpen ? '🔼' : '🔽'}</span>
        </div>

        {isListOpen && (
          <div className="mission-list" style={{marginTop:'10px', maxHeight: '500px', overflowY: 'auto'}}>
            <input 
              type="text" 
              placeholder="🔍 Etsi tehtävää..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                background: '#111',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px'
              }}
            />

            {filteredMissions.length === 0 && <p style={{color:'#666', fontStyle:'italic', padding:'10px'}}>Ei tehtäviä.</p>}
            
            {filteredMissions.map(m => {
              const code = agentCodes[m.target_tag];
              return (
                <div key={m.id} className="mission-row" style={{display:'flex', justifyContent:'space-between', alignItems: 'center', padding:'8px', borderBottom:'1px solid #333'}}>
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <span>{m.title}</span>
                    {/* Näytetään myös, jos ID on tallentunut oikein */}
                    <div style={{display:'flex', gap:'10px'}}>
                        {code ? (
                        <span style={{fontSize: '0.8rem', color: '#f39c12', marginTop: '2px'}}>
                            🆔 Koodi: <strong>{code}</strong>
                        </span>
                        ) : null}
                        {m.target_guest_id && (
                            <span style={{fontSize: '0.7rem', color: '#27ae60', marginTop: '3px'}}>
                                ✅ Linkitetty
                            </span>
                        )}
                    </div>
                  </div>
                  <button onClick={() => deleteMission(m.id)} style={{color:'#e74c3c', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem'}}>🗑</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldMissions;