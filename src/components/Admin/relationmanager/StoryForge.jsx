import React, { useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// --- TYYLIT ---
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '85vh',
    background: '#151515', 
    color: '#eee',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #333',
    fontFamily: 'sans-serif'
  },
  header: {
    padding: '20px',
    background: '#111',
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  column: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column'
  },
  card: {
    background: '#222',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '15px',
    marginBottom: '10px'
  },
  reviewCard: {
    background: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  btn: (variant = 'primary') => ({
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: variant === 'primary' ? '#9933cc' : (variant === 'success' ? '#00cc66' : '#444'),
    color: '#fff',
    marginTop: '10px',
    width: '100%',
    opacity: variant === 'disabled' ? 0.5 : 1
  }),
  input: {
    width: '100%',
    padding: '10px',
    background: '#111',
    border: '1px solid #444',
    color: '#fff',
    borderRadius: '4px',
    marginBottom: '10px',
    fontFamily: 'monospace'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#aaa',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  badge: (type) => {
    let color = '#888';
    if (type === 'friend') color = '#00cc66';
    if (type === 'enemy') color = '#ff4444';
    if (type === 'spouse') color = '#ff69b4';
    if (type === 'relative') color = '#9933cc';
    
    return {
      background: color,
      color: '#000',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.7rem',
      fontWeight: 'bold',
      marginLeft: '8px',
      textTransform: 'uppercase'
    };
  }
};

export default function StoryForge({ characters, relationships, onUpdate }) {
  // --- STATE ---
  const [activeCharId, setActiveCharId] = useState(null);
  const [selectedRelIds, setSelectedRelIds] = useState(new Set()); 
  const [importJson, setImportJson] = useState('');
  
  // Staged Updates: Data joka on tullut AI:lta mutta ei vielä tallennettu
  const [stagedUpdates, setStagedUpdates] = useState([]); 
  
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // --- 1. DATA VALMISTELU ---
  const activeChar = characters.find(c => c.id === activeCharId);
  
  const connectedTargets = useMemo(() => {
    if (!activeCharId) return [];

    const relevantRels = relationships.filter(r => 
      r.char1_id === activeCharId || r.char2_id === activeCharId
    );

    const targets = relevantRels.map(r => {
      const isForward = r.char1_id === activeCharId;
      const targetId = isForward ? r.char2_id : r.char1_id;
      const targetChar = characters.find(c => c.id === targetId);

      // TARKISTUS: Onko tällä jo sisältöä? (Ratkaisee peilikuva-ongelman)
      // Jos on kuvaus TAI kontekstitekstejä, se lasketaan valmiiksi.
      const hasContent = (r.description && r.description.length > 2) || 
                         (r.context_1_to_2 && r.context_1_to_2.length > 2) ||
                         (r.context_2_to_1 && r.context_2_to_1.length > 2);

      return {
        relId: r.id,
        targetId: targetId,
        targetName: targetChar?.name || 'Unknown',
        targetRole: targetChar?.role || 'Unknown',
        targetBackstory: targetChar?.backstory || '',
        type: r.relation_type,
        currentDesc: r.description,
        hasContent: hasContent // Uusi lippu
      };
    });

    // LAJITTELU: Tekemättömät (false) ensin, Valmiit (true) pohjalle
    return targets.sort((a, b) => {
      if (a.hasContent === b.hasContent) return 0;
      return a.hasContent ? 1 : -1;
    });

  }, [activeCharId, relationships, characters]);


  // --- TOIMINNOT ---

  const toggleSelection = (relId) => {
    const next = new Set(selectedRelIds);
    if (next.has(relId)) next.delete(relId);
    else next.add(relId);
    setSelectedRelIds(next);
  };

  const selectAll = () => {
    // Älykäs valinta: Jos on tekemättömiä, valitse ensin vain ne.
    const incompleteIds = connectedTargets.filter(t => !t.hasContent).map(t => t.relId);
    
    if (incompleteIds.length > 0 && selectedRelIds.size < incompleteIds.length) {
      // Valitse kaikki tekemättömät
      setSelectedRelIds(new Set(incompleteIds));
    } else if (selectedRelIds.size > 0) {
      // Jos jotain on valittu (tai kaikki tekemättömät valittu), tyhjennä
      setSelectedRelIds(new Set());
    } else {
      // Jos mikään ei valittu ja kaikki on tehty, valitse kaikki
      setSelectedRelIds(new Set(connectedTargets.map(t => t.relId)));
    }
  };

  // --- AI PROMPT LOGIC ---
  const copyPrompt = () => {
    const targetsToProcess = connectedTargets.filter(t => selectedRelIds.has(t.relId));
    
    if (!activeChar || targetsToProcess.length === 0) return;

    const prompt = `
Olet käsikirjoittaja immersiiviseen teatteriin. Tehtäväsi on syventää hahmojen välisiä suhteita.

PÄÄHENKILÖ:
Nimi: ${activeChar.name}
Rooli: ${activeChar.role}
Luonne: "${activeChar.backstory?.substring(0, 200)}..."

VASTANÄYTTELIJÄT (Luo tarina näihin olemassa oleviin suhteisiin):
${targetsToProcess.map(t => `
- ID: ${t.relId}
- Nimi: ${t.targetName} (${t.targetRole})
- Suhde: ${t.type.toUpperCase()}
- Luonne: "${t.targetBackstory?.substring(0, 150)}..."
`).join('')}

TEHTÄVÄ:
Kirjoita JSON-lista. Koska suhde on kaksisuuntainen, kirjoita molemmat näkökulmat nyt kerralla, jotta tarina on yhtenäinen.

FORMAT (JSON ONLY):
[
  {
    "rel_id": "KOPION_TÄMÄ_ID_LISTASTA",
    "description": "Tiivis kuvaus tilanteesta (3. persoona)",
    "context_me_to_them": "Mitä ${activeChar.name.split(' ')[0]} ajattelee vastapuolesta (1. persoona)",
    "context_them_to_me": "Mitä vastapuoli ajattelee päähenkilöstä (1. persoona)"
  }
]
`;
    navigator.clipboard.writeText(prompt);
    setFeedback({ type: 'success', msg: `Kopioitu prompt ${targetsToProcess.length} hahmolle!` });
  };

  // --- IMPORT & PARSE ---
  const processImport = () => {
    try {
      const cleanJson = importJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      if (!Array.isArray(data)) throw new Error("Ei ole lista (Array)");

      const updates = data.map(item => {
        const original = connectedTargets.find(t => t.relId === item.rel_id);
        return {
          relId: item.rel_id,
          targetName: original?.targetName || 'Unknown',
          type: original?.type || 'Unknown',
          description: item.description,
          ctx1: item.context_me_to_them, 
          ctx2: item.context_them_to_me  
        };
      });

      setStagedUpdates(updates);
      setImportJson(''); 
      setFeedback(null);
      
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Virhe JSON:ssa: ' + err.message });
    }
  };

  // --- SAVE TO DB ---
  const saveAllStaged = async () => {
    setProcessing(true);
    try {
      for (const update of stagedUpdates) {
        const rel = relationships.find(r => r.id === update.relId);
        if (!rel) continue;

        const isForward = rel.char1_id === activeCharId;
        const finalCtx1 = isForward ? update.ctx1 : update.ctx2; 
        const finalCtx2 = isForward ? update.ctx2 : update.ctx1; 

        await supabase.from('character_relationships').update({
          description: update.description,
          context_1_to_2: finalCtx1,
          context_2_to_1: finalCtx2
        }).eq('id', update.relId);
      }

      setFeedback({ type: 'success', msg: `Tallennettu ${stagedUpdates.length} tarinaa!` });
      setStagedUpdates([]); 
      setSelectedRelIds(new Set());
      onUpdate(); 

    } catch (err) {
      setFeedback({ type: 'error', msg: 'Tallennusvirhe: ' + err.message });
    } finally {
      setProcessing(false);
    }
  };

  const removeStaged = (relId) => {
    setStagedUpdates(prev => prev.filter(u => u.relId !== relId));
  };

  const updateStagedField = (relId, field, value) => {
    setStagedUpdates(prev => prev.map(u => {
      if (u.relId === relId) return { ...u, [field]: value };
      return u;
    }));
  };

  // --- RENDER ---
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0, color: '#9933cc' }}>🔮 StoryForge: Tarinapaja</h2>
        <div>
          <select 
            style={{ padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            onChange={(e) => { setActiveCharId(e.target.value); setSelectedRelIds(new Set()); setStagedUpdates([]); }}
            value={activeCharId || ''}
          >
            <option value="">-- Valitse Päähenkilö --</option>
            {characters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!activeCharId ? (
        <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>Valitse hahmo yläkulmasta aloittaaksesi.</div>
      ) : (
        <div style={styles.mainContent}>
          
          {/* KOLUMNI 1: VALINTA & PROMPT */}
          <div style={{ ...styles.column, borderRight: '1px solid #333', maxWidth: '350px' }}>
            <h4 style={{ marginTop: 0 }}>1. Valitse kohteet ({connectedTargets.length})</h4>
            
            <button 
              onClick={selectAll}
              style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', cursor: 'pointer', marginBottom: '10px', width: '100%' }}
            >
              Valitse tekemättömät / Kaikki
            </button>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
              {connectedTargets.map(t => {
                // Himmennä jos valmis
                const opacity = t.hasContent ? 0.5 : 1; 
                const bg = selectedRelIds.has(t.relId) ? '#2a1a3a' : '#1a1a1a';

                return (
                  <div 
                    key={t.relId} 
                    onClick={() => toggleSelection(t.relId)}
                    style={{ 
                      padding: '8px', 
                      cursor: 'pointer', 
                      background: bg,
                      border: selectedRelIds.has(t.relId) ? '1px solid #9933cc' : '1px solid #333',
                      marginBottom: '5px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: opacity
                    }}
                  >
                    <input type="checkbox" checked={selectedRelIds.has(t.relId)} readOnly style={{ marginRight: '10px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {t.targetName} 
                        {t.hasContent && <span title="Tämä tarina on jo tehty"> ✅</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{t.targetRole}</div>
                    </div>
                    <span style={styles.badge(t.type)}>{t.type}</span>
                  </div>
                );
              })}
            </div>

            <h4 style={{ marginTop: 0 }}>2. Generoi & Tuo</h4>
            <button 
              style={styles.btn('primary')} 
              onClick={copyPrompt}
              disabled={selectedRelIds.size === 0}
            >
              📋 Kopioi Prompt ({selectedRelIds.size})
            </button>
            
            <textarea 
              style={{ ...styles.input, height: '100px', marginTop: '10px', fontSize: '0.8rem' }}
              placeholder='Liitä tekoälyn JSON tähän...'
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
            />
            
            <button 
              style={styles.btn(importJson ? 'success' : 'disabled')} 
              onClick={processImport}
              disabled={!importJson}
            >
              📥 Prosessoi JSON
            </button>
            
            {feedback && <div style={{ marginTop: '10px', color: feedback.type === 'success' ? '#00cc66' : 'red' }}>{feedback.msg}</div>}
          </div>

          {/* KOLUMNI 2: ESIKATSELU & TALLENNUS */}
          <div style={{ ...styles.column, background: '#111', flex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>3. Esikatselu & Hyväksyntä</h3>
              {stagedUpdates.length > 0 && (
                <button 
                  style={{ ...styles.btn('success'), width: 'auto', marginTop: 0 }}
                  onClick={saveAllStaged}
                  disabled={processing}
                >
                  💾 Tallenna kaikki ({stagedUpdates.length})
                </button>
              )}
            </div>

            {stagedUpdates.length === 0 ? (
              <div style={{ color: '#555', textAlign: 'center', marginTop: '50px' }}>
                Ei prosessoituja tarinoita. Kopioi prompt, pyydä AI:lta vastaus ja liitä se vasemmalle.
              </div>
            ) : (
              <div>
                {stagedUpdates.map(update => (
                  <div key={update.relId} style={styles.reviewCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                      <strong style={{ color: '#9933cc', fontSize: '1.1rem' }}>{update.targetName}</strong>
                      <span style={styles.badge(update.type)}>{update.type}</span>
                      <button onClick={() => removeStaged(update.relId)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>❌ Poista</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={styles.label}>Neutraali Kuvaus</label>
                        <textarea 
                          style={{ ...styles.input, height: '60px' }} 
                          value={update.description}
                          onChange={(e) => updateStagedField(update.relId, 'description', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label style={styles.label}>{activeChar.name.split(' ')[0]} sanoo:</label>
                        <textarea 
                          style={{ ...styles.input, height: '80px', color: '#aaffaa' }} 
                          value={update.ctx1}
                          onChange={(e) => updateStagedField(update.relId, 'ctx1', e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={styles.label}>{update.targetName.split(' ')[0]} sanoo:</label>
                        <textarea 
                          style={{ ...styles.input, height: '80px', color: '#aaaaff' }} 
                          value={update.ctx2}
                          onChange={(e) => updateStagedField(update.relId, 'ctx2', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}