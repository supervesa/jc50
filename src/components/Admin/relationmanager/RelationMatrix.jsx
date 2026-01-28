import React, { useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import StoryForge from './StoryForge'; // UUSI: Importoitu komponentti

// --- TYYLIT ---
const styles = {
  container: {
    display: 'flex',
    height: '80vh',
    background: '#1a1a1a',
    color: '#eee',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #333',
    fontFamily: 'sans-serif'
  },
  leftPanel: {
    width: '300px',
    flexShrink: 0,
    borderRight: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    background: '#111'
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a1a',
    overflowY: 'auto'
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto'
  },
  charItem: (degree, isActive) => ({
    padding: '12px',
    borderBottom: '1px solid #222',
    cursor: 'pointer',
    background: isActive ? '#2a3b55' : 'transparent',
    borderLeft: isActive 
      ? '4px solid #00d4ff' 
      : `4px solid ${getScoreColor(degree)}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }),
  section: {
    padding: '20px',
    borderBottom: '1px solid #333',
    background: '#222',
    marginBottom: '1px',
    display: 'flex',          // UUSI: Flex headeria varten
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  suggestionBox: {
    background: 'rgba(0, 212, 255, 0.05)',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  tierBox: {
    marginBottom: '10px',
    padding: '10px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '4px'
  },
  btn: (variant = 'primary') => ({
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: variant === 'primary' ? '#00d4ff' : (variant === 'story' ? '#9933cc' : '#444'),
    color: variant === 'primary' ? '#000' : '#fff',
    marginLeft: '10px',
    opacity: variant === 'disabled' ? 0.5 : 1
  }),
  input: {
    width: '100%',
    padding: '8px',
    background: '#111',
    border: '1px solid #444',
    color: '#fff',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  badge: (color) => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    background: color,
    color: '#000',
    marginRight: '5px'
  }),
  miniSelect: (type) => {
    let bg = '#555';
    let color = '#fff';
    if (type === 'friend') { bg = '#00cc66'; color = '#000'; } 
    if (type === 'relative') { bg = '#9933cc'; } 
    if (type === 'spouse') { bg = '#ff69b4'; color = '#000'; } 
    if (type === 'business') { bg = '#3366cc'; } 
    if (type === 'neighbor') { bg = '#ffbb00'; color = '#000'; } 
    if (type === 'enemy') { bg = '#ff4444'; } 

    return {
      background: bg,
      color: color,
      border: 'none',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      padding: '2px 4px',
      cursor: 'pointer',
      marginRight: '10px',
      textTransform: 'uppercase'
    };
  }
};

const getScoreColor = (degree) => {
  if (degree === 0) return '#ff4444'; // CRITICAL
  if (degree < 3) return '#ffbb00';   // WARNING
  return '#00cc66';                   // OK
};

export default function RelationMatrix({ characters, relationships, splits, onUpdate }) {
  // --- STATE ---
  const [activeCharId, setActiveCharId] = useState(null);
  const [showStoryForge, setShowStoryForge] = useState(false); // UUSI: Tila Tarinapajalle
  
  // Manuaalinen batch-valinta
  const [manualTargets, setManualTargets] = useState([]);
  const [targetFilter, setTargetFilter] = useState('');
  
  // Ehdotusmoottorin valinnat (Set of IDs)
  const [suggestionTargets, setSuggestionTargets] = useState(new Set());
  
  // Tilamuuttuja käyttäjän muuttamille tyypeille ehdotuslistassa
  const [typeOverrides, setTypeOverrides] = useState({});

  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Lomake (Manuaalinen)
  const [form, setForm] = useState({
    type: 'friend',
    mode: 'simple',
    description: '',
    context1to2: '',
    context2to1: ''
  });

  // --- 1. DATA ENGINE (MEMOIZED) ---
  const graphData = useMemo(() => {
    const degrees = {};
    const adjList = {}; 

    // Suodatetaan vain ASSIGNED hahmot
    const assignedChars = characters.filter(c => 
      c.status === 'assigned' || 
      c.is_assigned === true || 
      c.assigned_guest_id 
    );

    assignedChars.forEach(c => {
      degrees[c.id] = 0;
      adjList[c.id] = new Set();
    });

    relationships.forEach(r => {
      // Laske vain jos hahmo on assigned-listalla
      if (degrees[r.char1_id] !== undefined) degrees[r.char1_id]++;
      if (degrees[r.char2_id] !== undefined) degrees[r.char2_id]++;
      
      if (adjList[r.char1_id]) adjList[r.char1_id].add(r.char2_id);
      if (adjList[r.char2_id]) adjList[r.char2_id].add(r.char1_id);
    });

    // Järjestä prioriteetin mukaan
    const sortedChars = [...assignedChars].sort((a, b) => {
      const degA = degrees[a.id] || 0;
      const degB = degrees[b.id] || 0;
      return degA - degB;
    });

    return { degrees, adjList, sortedChars, assignedChars };
  }, [characters, relationships]);

  // --- 2. INFERENCE ENGINE (TIER LOGIC) ---
  const inferenceData = useMemo(() => {
    if (!activeCharId) return null;

    const char = characters.find(c => c.id === activeCharId);
    if (!char) return null;

    // A. Etsi "Ankkuri" (Partner)
    let partnerId = null;
    let anchorType = null; // 'romantic' | 'platonic'

    const spouseRel = relationships.find(r => 
      (r.char1_id === activeCharId || r.char2_id === activeCharId) && 
      ['spouse', 'lover', 'avec'].includes(r.relation_type)
    );

    if (spouseRel) {
      partnerId = spouseRel.char1_id === activeCharId ? spouseRel.char2_id : spouseRel.char1_id;
      anchorType = spouseRel.relation_type === 'avec' ? 'platonic' : 'romantic';
    }

    // B. Laske ehdotukset (Tiers)
    const suggestions = { tier1: [], tier2: [], tier3: [] };
    let strategy = '';

    const myConnections = graphData.adjList[activeCharId] || new Set();

    if (partnerId) {
      // STRATEGIA: PEILAA PUOLISO (Mirror)
      const partnerName = characters.find(c=>c.id===partnerId)?.name || 'Kumppani';
      strategy = `Peilataan kumppanin (${partnerName}) verkostoa`;
      
      relationships.forEach(r => {
        const p1 = r.char1_id === partnerId;
        const p2 = r.char2_id === partnerId;
        
        if (p1 || p2) {
          const targetId = p1 ? r.char2_id : r.char1_id;
          if (targetId === activeCharId) return; // Ei itseään
          if (myConnections.has(targetId)) return; // Tuntee jo

          const targetChar = characters.find(c => c.id === targetId);
          if (!targetChar) return;

          // Luokittele Tieriin
          const type = r.relation_type;
          
          if (['relative', 'spouse', 'avec'].includes(type)) {
            suggestions.tier1.push({ 
              id: targetId, 
              name: targetChar.name, 
              role: targetChar.role,
              reason: `Kumppanisi sukulainen/pari (${type})`,
              suggestedType: anchorType === 'romantic' ? 'relative' : 'friend' 
            });
          } else if (['friend', 'neighbor'].includes(type)) {
            suggestions.tier2.push({ 
              id: targetId, 
              name: targetChar.name, 
              role: targetChar.role,
              reason: `Kumppanisi ${type}`,
              suggestedType: type 
            });
          } else {
            suggestions.tier3.push({ 
              id: targetId, 
              name: targetChar.name, 
              role: targetChar.role,
              reason: `Kumppanisi ${type}`,
              suggestedType: 'business'
            });
          }
        }
      });

    } else {
      // STRATEGIA: YHTEISET TUTUT (Triangulation)
      strategy = 'Etsitään yhteisiä tuttuja (Mutual Friends)';
      
      const candidates = {};
      const myFriends = Array.from(myConnections);

      myFriends.forEach(friendId => {
        const friendConnections = graphData.adjList[friendId] || new Set();
        friendConnections.forEach(candidateId => {
          if (candidateId !== activeCharId && !myConnections.has(candidateId)) {
            candidates[candidateId] = (candidates[candidateId] || 0) + 1;
          }
        });
      });

      // Lajittele osumien mukaan
      Object.entries(candidates).forEach(([id, score]) => {
        const targetChar = characters.find(c => c.id === id);
        if (!targetChar) return;

        if (score >= 2) {
          suggestions.tier1.push({
            id, name: targetChar.name, role: targetChar.role,
            reason: `${score} yhteistä ystävää`,
            suggestedType: 'friend'
          });
        } else {
          suggestions.tier2.push({
            id, name: targetChar.name, role: targetChar.role,
            reason: `1 yhteinen ystävä`,
            suggestedType: 'friend'
          });
        }
      });
    }

    return { char, partnerId, suggestions, strategy };
  }, [activeCharId, characters, relationships, graphData]);


  // --- 3. TOIMINNOT ---

  const handleSelectChar = (id) => {
    setActiveCharId(id);
    setShowStoryForge(false); // Resetoi näkymä kun hahmo vaihtuu
    setManualTargets([]);
    setSuggestionTargets(new Set()); 
    setTypeOverrides({}); 
    setFeedback(null);
    setForm({ ...form, description: '', context1to2: '', context2to1: '' });
  };

  const toggleManualTarget = (id) => {
    setManualTargets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSuggestionTarget = (id) => {
    const next = new Set(suggestionTargets);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSuggestionTargets(next);
  };

  const toggleAllTier = (tierItems) => {
    const next = new Set(suggestionTargets);
    const allSelected = tierItems.every(item => next.has(item.id));
    
    tierItems.forEach(item => {
      if (allSelected) next.delete(item.id);
      else next.add(item.id);
    });
    setSuggestionTargets(next);
  };

  const handleTypeOverride = (id, newType) => {
    setTypeOverrides(prev => ({
      ...prev,
      [id]: newType
    }));
    if (!suggestionTargets.has(id)) {
      toggleSuggestionTarget(id);
    }
  };

  const getSmartDescription = (targetItem, partnerName) => {
    const finalType = typeOverrides[targetItem.id] || targetItem.suggestedType;
    if (inferenceData && inferenceData.partnerId) {
      const pName = partnerName || 'kumppanini';
      switch (finalType) {
        case 'relative': return `${pName} suku on minunkin perhettäni.`;
        case 'spouse': return `Elämänkumppanini.`; 
        case 'neighbor': return `Asumme samalla seudulla, tuttu ${pName} kautta.`;
        case 'friend': return `Vietämme usein aikaa yhdessä pariskuntina.`;
        case 'business': return `Tuttu ${pName} liikeverkostoista.`;
        default: return `${pName} kautta tullut tuttu.`;
      }
    } 
    else {
      if (targetItem.reason && targetItem.reason.includes('yhteistä')) {
        return "Liikumme samoissa piireissä ja meillä on paljon yhteisiä ystäviä.";
      }
      return "Vanha tuttu vuosien varrelta.";
    }
  };

  const saveRelations = async (targets, overrideType = null, defaultDesc = '') => {
    if (targets.length === 0) return;
    
    try {
      for (const target of targets) {
        const targetId = typeof target === 'string' ? target : target.id;
        
        const relType = overrideType || 
                        (target.id && typeOverrides[target.id]) || 
                        (target.suggestedType) || 
                        form.type;
                        
        const baseDesc = defaultDesc || form.description;
        const newCtx1 = form.mode === 'simple' ? baseDesc : form.context1to2;
        const newCtx2 = form.mode === 'simple' ? baseDesc : form.context2to1;

        const existing = relationships.find(r => 
          (r.char1_id === activeCharId && r.char2_id === targetId) ||
          (r.char1_id === targetId && r.char2_id === activeCharId)
        );

        if (existing) {
          const isForward = existing.char1_id === activeCharId;
          const mergedDesc = appendText(existing.description, baseDesc);
          const mergedCtx1 = isForward 
            ? appendText(existing.context_1_to_2, newCtx1)
            : appendText(existing.context_1_to_2, newCtx2);
          const mergedCtx2 = isForward
            ? appendText(existing.context_2_to_1, newCtx2)
            : appendText(existing.context_2_to_1, newCtx1);

          await supabase.from('character_relationships').update({
            relation_type: relType,
            description: mergedDesc,
            context_1_to_2: mergedCtx1,
            context_2_to_1: mergedCtx2
          }).eq('id', existing.id);
        } else {
          await supabase.from('character_relationships').insert({
            char1_id: activeCharId,
            char2_id: targetId,
            relation_type: relType,
            description: baseDesc,
            context_1_to_2: newCtx1,
            context_2_to_1: newCtx2,
            is_essential: false
          });
        }
      }
    } catch (err) {
      throw err;
    }
  };

  const executeManualBatch = async () => {
    setProcessing(true);
    try {
      await saveRelations(manualTargets);
      setFeedback({ type: 'success', msg: `Tallennettu ${manualTargets.length} yhteyttä!` });
      setManualTargets([]);
      onUpdate(); 
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Virhe: ' + err.message });
    } finally {
      setProcessing(false);
    }
  };

  const executeSuggestionBatch = () => {
    const allSuggestions = [
      ...inferenceData.suggestions.tier1,
      ...inferenceData.suggestions.tier2,
      ...inferenceData.suggestions.tier3
    ];
    const selectedObjects = allSuggestions.filter(s => suggestionTargets.has(s.id));
    
    if (selectedObjects.length === 0) return;

    setProcessing(true);
    const partnerName = inferenceData.partnerId 
      ? characters.find(c => c.id === inferenceData.partnerId)?.name?.split(' ')[0] 
      : '';

    const promises = selectedObjects.map(target => {
      const description = form.description || getSmartDescription(target, partnerName);
      return saveRelations([target], null, description);
    });

    Promise.all(promises)
      .then(() => {
        setFeedback({ type: 'success', msg: `Luotu ${selectedObjects.length} yksilöllistä tarinaa!` });
        setSuggestionTargets(new Set());
        setTypeOverrides({}); 
        setForm(prev => ({ ...prev, description: '' })); 
        onUpdate();
      })
      .catch(err => {
        console.error(err);
        setFeedback({ type: 'error', msg: 'Virhe tallennuksessa.' });
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  const appendText = (oldTxt, newTxt) => {
    if (!newTxt) return oldTxt;
    if (!oldTxt) return newTxt;
    if (oldTxt.includes(newTxt)) return oldTxt; 
    return `${oldTxt} | ${newTxt}`;
  };

  // --- RENDERÖINTI ---

  return (
    <div style={styles.container}>
      
      {/* --- VASEN PALKKI --- */}
      <div style={styles.leftPanel}>
        <div style={styles.section}>
          <h3 style={{ margin: 0, color: '#fff' }}>Hahmot ({graphData.assignedChars.length})</h3>
          <small style={{ color: '#888' }}>Vain 'assigned'. Järjestetty puutteiden mukaan.</small>
        </div>
        <div style={styles.scrollArea}>
          {graphData.sortedChars.map(char => {
            const degree = graphData.degrees[char.id] || 0;
            return (
              <div 
                key={char.id} 
                style={styles.charItem(degree, activeCharId === char.id)}
                onClick={() => handleSelectChar(char.id)}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{char.name || 'Tuntematon'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{char.role}</div>
                </div>
                <strong style={{ color: getScoreColor(degree) }}>{degree}</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- OIKEA PALKKI --- */}
      <div style={styles.rightPanel}>
        {!inferenceData ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>
            <h2>Valitse hahmo aloittaaksesi</h2>
          </div>
        ) : (
          <>
            {/* HEADER & TOOL TOGGLE */}
            <div style={styles.section}>
              <div>
                <h2 style={{ margin: '0', color: '#00d4ff' }}>{inferenceData.char.name}</h2>
                <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.9rem' }}>{inferenceData.char.backstory?.substring(0, 100)}...</div>
              </div>
              <button 
                style={styles.btn(showStoryForge ? 'primary' : 'story')}
                onClick={() => setShowStoryForge(!showStoryForge)}
              >
                {showStoryForge ? '🔙 Palaa Matrixiin' : '🎭 Avaa Tarinapaja'}
              </button>
            </div>

            {/* CONDITIONAL CONTENT: STORYFORGE OR MATRIX */}
            {showStoryForge ? (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <StoryForge 
                  characters={characters} 
                  relationships={relationships} 
                  onUpdate={onUpdate}
                />
              </div>
            ) : (
              <>
                {/* 1. EHDOTUSMOOTTORI (SMART SUGGESTIONS) */}
                <div style={{ padding: '20px', borderBottom: '1px solid #333' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>💡 Älykäs ehdotus: {inferenceData.strategy}</h4>
                  
                  <div style={styles.suggestionBox}>
                    {['tier1', 'tier2', 'tier3'].map(tier => {
                      const items = inferenceData.suggestions[tier];
                      if (items.length === 0) return null;

                      let title = '';
                      if (tier === 'tier1') { title = "🟢 TIER 1: Lähipiiri (Suositellaan)"; }
                      if (tier === 'tier2') { title = "🟡 TIER 2: Mahdolliset tutut"; }
                      if (tier === 'tier3') { title = "⚪ TIER 3: Kontekstisidonnaiset"; }

                      return (
                        <div key={tier} style={styles.tierBox}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <strong style={{ color: '#fff' }}>{title}</strong>
                            <button 
                              onClick={() => toggleAllTier(items)}
                              style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              Valitse kaikki
                            </button>
                          </div>
                          {items.map(item => {
                            const currentType = typeOverrides[item.id] || item.suggestedType;
                            return (
                              <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                                <input 
                                  type="checkbox" 
                                  checked={suggestionTargets.has(item.id)}
                                  onChange={() => toggleSuggestionTarget(item.id)}
                                  style={{ marginRight: '10px' }}
                                />
                                <span style={{ flex: 1 }}>{item.name} <span style={{ color: '#888' }}>({item.role})</span></span>
                                <span style={{ fontSize: '0.8rem', color: '#aaa', marginRight: '10px' }}>{item.reason}</span>
                                
                                <select 
                                  value={currentType}
                                  onChange={(e) => handleTypeOverride(item.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={styles.miniSelect(currentType)}
                                >
                                  <option value="friend">Friend</option>
                                  <option value="relative">Relative</option>
                                  <option value="neighbor">Neighbor</option>
                                  <option value="business">Business</option>
                                  <option value="spouse">Spouse</option>
                                  <option value="enemy">Enemy</option>
                                  <option value="avec">Avec</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {inferenceData.suggestions.tier1.length === 0 && inferenceData.suggestions.tier2.length === 0 && (
                      <div style={{ color: '#888' }}>Ei automaattisia ehdotuksia löytynyt tällä strategialla.</div>
                    )}

                    <div style={{ marginTop: '10px' }}>
                      <button 
                        style={styles.btn(suggestionTargets.size > 0 ? 'primary' : 'disabled')}
                        onClick={executeSuggestionBatch}
                        disabled={suggestionTargets.size === 0 || processing}
                      >
                        Linkitä valitut ({suggestionTargets.size})
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. MANUAALINEN TYÖKALU */}
                <div style={styles.section}>
                  <h4 style={{ marginTop: 0 }}>Manuaalinen haku & linkitys</h4>
                  <input 
                    style={styles.input} 
                    placeholder="Etsi nimellä tai roolilla..."
                    value={targetFilter}
                    onChange={e => setTargetFilter(e.target.value)}
                  />
                  
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #333', marginBottom: '10px', display: targetFilter ? 'block' : 'none' }}>
                    {graphData.assignedChars
                      .filter(c => c.id !== activeCharId)
                      .filter(c => c.name?.toLowerCase().includes(targetFilter.toLowerCase()) || c.role?.toLowerCase().includes(targetFilter.toLowerCase()))
                      .map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => toggleManualTarget(c.id)}
                          style={{ 
                            padding: '8px', 
                            cursor: 'pointer', 
                            background: manualTargets.includes(c.id) ? '#00d4ff' : '#222',
                            color: manualTargets.includes(c.id) ? '#000' : '#eee',
                            borderBottom: '1px solid #333'
                          }}
                        >
                          {c.name} ({c.role})
                        </div>
                      ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <select style={styles.input} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option value="friend">Friend</option>
                      <option value="spouse">Spouse</option>
                      <option value="neighbor">Neighbor</option>
                      <option value="business">Business</option>
                      <option value="enemy">Enemy</option>
                      <option value="relative">Relative</option>
                      <option value="avec">Avec (Platonic)</option>
                    </select>
                    <button 
                      style={styles.btn(manualTargets.length > 0 ? 'primary' : 'disabled')}
                      onClick={executeManualBatch}
                      disabled={manualTargets.length === 0 || processing}
                    >
                      Linkitä manuaalisesti ({manualTargets.length})
                    </button>
                  </div>
                  <textarea 
                    style={{ ...styles.input, height: '60px' }}
                    placeholder="Kirjoita kuvaus tai jätä tyhjäksi..."
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                  />
                  {feedback && <div style={{ color: feedback.type==='success'?'#00cc66':'red', marginTop: '5px' }}>{feedback.msg}</div>}
                </div>

                {/* 3. NYKYISET YHTEYDET */}
                <div style={{ padding: '20px', background: '#111', flex: 1 }}>
                  <h4 style={{ marginTop: 0 }}>Nykyinen verkosto</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                    {Object.values(relationships
                      .filter(r => r.char1_id === activeCharId || r.char2_id === activeCharId)
                      .reduce((acc, r) => {
                        const otherId = r.char1_id === activeCharId ? r.char2_id : r.char1_id;
                        if (!acc[otherId]) acc[otherId] = [];
                        acc[otherId].push(r);
                        return acc;
                      }, {}))
                      .map(relGroup => {
                        const primaryRel = relGroup[0]; 
                        const otherId = primaryRel.char1_id === activeCharId ? primaryRel.char2_id : primaryRel.char1_id;
                        const otherChar = characters.find(c => c.id === otherId);
                        
                        const types = [...new Set(relGroup.map(r => r.relation_type))].join(' + ').toUpperCase();
                        const descriptions = relGroup.map(r => r.description).filter(Boolean).join(' | ');
                        const isEnemy = types.includes('ENEMY');
                        const isRomantic = types.includes('SPOUSE') || types.includes('LOVER');

                        return (
                          <div key={otherId} style={{ 
                            background: '#222', 
                            padding: '12px', 
                            borderRadius: '4px', 
                            borderLeft: isEnemy ? '4px solid red' : (isRomantic ? '4px solid #ff69b4' : '4px solid #444')
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{otherChar?.name || 'Unknown'}</div>
                            <span style={styles.badge(isEnemy ? 'red' : '#ccc')}>{types}</span>
                            <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '5px', fontStyle: 'italic' }}>
                              "{descriptions || 'Ei kuvausta'}"
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}