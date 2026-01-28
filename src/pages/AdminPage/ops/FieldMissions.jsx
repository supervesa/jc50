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

  // --- LOGIIKKA: SYNKRONOINTI ---
  const syncMissionsWithRoles = async () => {
    if (!confirm("Tämä toiminto synkronoi tehtävät nykyisiin rooleihin:\n\n1. Luo tehtävät UUSILLE rooleille.\n2. POISTAA tehtävät vanhoilta rooleilta, joita ei enää ole.\n\nJatketaanko?")) return;
    
    try {
      // 1. Haetaan kaikki uniikit roolit aktiivisilta hahmoilta
      const { data: chars } = await supabase
        .from('characters')
        .select('role')
        .not('assigned_guest_id', 'is', null); // Vain varatut hahmot
        
      // Siistitään roolit ja poistetaan duplikaatit
      const activeRoles = [...new Set(chars.map(c => c.role).filter(r => r && r.length > 2))];

      // 2. Haetaan nykyiset tehtävät tietokannasta
      const { data: existingMissions } = await supabase
        .from('missions')
        .select('id, target_tag');

      const existingTags = existingMissions.map(m => m.target_tag);

      // 3. Määritellään lisättävät ja poistettavat
      const reward = xpConfig?.find_role || 150;
      
      // Uudet = löytyy hahmoilta, mutta ei tehtävistä
      const missionsToCreate = activeRoles
        .filter(role => !existingTags.includes(role))
        .map(role => ({
          title: `Etsi ${role}`,
          description: `Etsi henkilö, jonka rooli on ${role}`,
          target_tag: role,
          xp_reward: reward,
          is_active: true
        }));

      // Poistettavat = löytyy tehtävistä, mutta ei enää hahmoilta
      const missionsToDelete = existingMissions
        .filter(m => !activeRoles.includes(m.target_tag))
        .map(m => m.id);

      // --- SUORITUS ---
      let message = '';

      // A) Luodaan uudet
      if (missionsToCreate.length > 0) {
        const { error: insertError } = await supabase.from('missions').insert(missionsToCreate);
        if (insertError) throw insertError;
        message += `✅ Luotu ${missionsToCreate.length} uutta tehtävää.\n`;
      } else {
        message += `✅ Ei uusia rooleja lisättäväksi.\n`;
      }

      // B) Poistetaan vanhat
      if (missionsToDelete.length > 0) {
        // Poistetaan ensin lokimerkinnät (foreign key constraint)
        await supabase.from('mission_log').delete().in('mission_id', missionsToDelete);
        
        // Sitten itse tehtävät
        const { error: deleteError } = await supabase.from('missions').delete().in('id', missionsToDelete);
        if (deleteError) throw deleteError;
        message += `🗑️ Poistettu ${missionsToDelete.length} vanhentunutta tehtävää.`;
      } else {
        message += `✨ Ei vanhentuneita tehtäviä poistettavaksi.`;
      }

      alert(message);
      
      // Ladataan sivu uudelleen jotta lista päivittyy heti
      window.location.reload(); 

    } catch(err) { 
      console.error(err);
      alert(`Virhe synkronoinnissa: ${err.message}`); 
    }
  };

  const deleteMission = async (id) => {
    if(!confirm("Poistetaanko?")) return;
    await supabase.from('mission_log').delete().eq('mission_id', id);
    await supabase.from('missions').delete().eq('id', id);
  };

  // Suodatetaan tehtävät hakusanan perusteella
  const filteredMissions = missions.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.target_tag && m.target_tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-panel">
      <h2>🕵️ LUO ETŠINTÄKUULUTUS</h2>
      
      {/* SYNKRONOINTI NAPPI */}
      <button 
        onClick={syncMissionsWithRoles} 
        className="btn-create" 
        style={{background: '#d35400', marginBottom: '20px', border: '1px solid #e67e22'}}
      >
        🔄 SYNKRONOI ROOLIT & TEHTÄVÄT
      </button>

      {/* LOMAKE */}
      <form onSubmit={createMission}>
        <div className="form-group">
          <input value={newMissionTitle} onChange={e => setNewMissionTitle(e.target.value)} placeholder="Tehtävä: Etsi Lääkäri..." className="input-field"/>
        </div>
        <div className="form-group">
          <input value={newMissionTag} onChange={e => setNewMissionTag(e.target.value)} placeholder="Avainsana: Lääkäri" className="input-field"/>
        </div>
        <button type="submit" className="btn-create">JULKAISE</button>
      </form>

      {/* --- AKKORDI LISTALLE --- */}
      <div style={{marginTop: '30px', borderTop: '2px solid #333', paddingTop: '10px'}}>
        
        {/* KLIKATTAVA OTSJAKE */}
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

        {/* PIILOTETTAVA LISTA */}
        {isListOpen && (
          <div className="mission-list" style={{marginTop:'10px', maxHeight: '500px', overflowY: 'auto'}}>
            
            {/* HAKUKENTTÄ */}
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
              // Haetaan koodi roolin perusteella
              const code = agentCodes[m.target_tag];
              
              return (
                <div key={m.id} className="mission-row" style={{display:'flex', justifyContent:'space-between', alignItems: 'center', padding:'8px', borderBottom:'1px solid #333'}}>
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <span>{m.title}</span>
                    {/* NÄYTETÄÄN AGENTTI-KOODI JOS LÖYTYY */}
                    {code ? (
                      <span style={{fontSize: '0.8rem', color: '#f39c12', marginTop: '2px'}}>
                        🆔 Koodi: <strong>{code}</strong>
                      </span>
                    ) : (
                      <span style={{fontSize: '0.8rem', color: '#555', marginTop: '2px'}}>
                        ⚠️ Ei aktiivista koodia
                      </span>
                    )}
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