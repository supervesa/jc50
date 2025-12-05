import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ControlDeck from './VisualMap/ControlDeck';
import NetworkGraph from './VisualMap/NetworkGraph';
import InfoSidecar from './VisualMap/InfoSidecar';

function RelationManager({ characters, relationships, onUpdate }) {
  // --- TILAT (VISUAALINEN) ---
  const [activeView, setActiveView] = useState('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // UUSI: Zoom state (1 = 100%)
  const [zoom, setZoom] = useState(1); 

  // --- TILAT (MANUAALINEN TYÖKALU) ---
  const [newRel, setNewRel] = useState({ char1_id: '', char2_id: '', description: '' });

  // ... (getCharName -funktio ennallaan) ...
  const getCharName = (id) => characters.find(c => c.id === id)?.name || 'Tuntematon';

  // ... (graphData -logiikka ennallaan) ...
  const graphData = useMemo(() => {
    // ... kopioi tämä edellisestä vastauksesta (graphData logiikka) ...
    // ... lyhennetty tässä tilan säästämiseksi ...
    // Varmista että tässä on se korjattu "Vain Assigned" -suodatus!
    const activeNodes = characters.filter(c => c.assigned_guest_id);
    const activeIds = new Set(activeNodes.map(c => c.id));
    let links = [];
    
    relationships.forEach(rel => {
      if (activeIds.has(rel.char1_id) && activeIds.has(rel.char2_id)) {
        links.push({ source: rel.char1_id, target: rel.char2_id, label: rel.description, type: 'manual', id: rel.id });
      }
    });

    const guestMap = {};
    activeNodes.forEach(c => {
      if (!guestMap[c.assigned_guest_id]) guestMap[c.assigned_guest_id] = [];
      guestMap[c.assigned_guest_id].push(c);
    });
    Object.values(guestMap).forEach(pair => {
      if (pair.length === 2) links.push({ source: pair[0].id, target: pair[1].id, label: 'Avec', type: 'auto' });
    });

    let filteredLinks = links;
    let filteredNodes = activeNodes.map(c => ({ ...c }));

    if (activeView === 'LOVE') filteredLinks = links.filter(l => l.label.toLowerCase().match(/rakas|vaimo|mies|avec|pari/));
    else if (activeView === 'WAR') filteredLinks = links.filter(l => l.label.toLowerCase().match(/viha|vihollinen|velka/));
    else if (activeView === 'LONELY') {
      const linkedIds = new Set();
      links.forEach(l => { linkedIds.add(l.source); linkedIds.add(l.target); });
      filteredNodes = filteredNodes.filter(n => !linkedIds.has(n.id));
      filteredLinks = [];
    }

    if (activeView !== 'ALL' && activeView !== 'LONELY') {
       const nodesInLinks = new Set();
       filteredLinks.forEach(l => { nodesInLinks.add(l.source); nodesInLinks.add(l.target); });
       filteredNodes = filteredNodes.filter(n => nodesInLinks.has(n.id));
    }

    return { nodes: filteredNodes, links: filteredLinks };
  }, [characters, relationships, activeView]);

  // ... (selectedCharacter logiikka ennallaan) ...
  const selectedCharacter = useMemo(() => {
    if (!selectedNodeId) return null;
    const char = characters.find(c => c.id === selectedNodeId);
    if (!char) return null;
    const myLinks = [];
    relationships.forEach(rel => {
      if (rel.char1_id === char.id) myLinks.push({ label: rel.description, targetName: getCharName(rel.char2_id) });
      if (rel.char2_id === char.id) myLinks.push({ label: `(Liittyy: ${rel.description})`, targetName: getCharName(rel.char1_id) });
    });
    return { ...char, links: myLinks };
  }, [selectedNodeId, characters, relationships]);

  // ... (createRelationship ja deleteRelationship funktiot ennallaan) ...
  const createRelationship = async (e) => {
    e.preventDefault();
    if (newRel.char1_id === newRel.char2_id) return alert("Ei voi luoda suhdetta itsensä kanssa.");
    try {
      const { error } = await supabase.from('character_relationships').insert([newRel]);
      if (error) throw error;
      alert("Suhde luotu!");
      setNewRel({ ...newRel, description: '' });
      onUpdate(); 
    } catch (err) { alert("Virhe: " + err.message); }
  };

  const deleteRelationship = async (id) => {
    if(!window.confirm("Poistetaanko tämä suhde?")) return;
    try { await supabase.from('character_relationships').delete().eq('id', id); onUpdate(); } 
    catch(err) { alert(err.message); }
  };

  return (
    <div>
      {/* --- OSA 1: VISUAALINEN KARTTA --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', height: '600px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', background: '#050508', marginBottom: '3rem' }}>
        <ControlDeck activeView={activeView} onSelectView={setActiveView} />
        
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          
          <NetworkGraph 
            nodes={graphData.nodes} 
            links={graphData.links} 
            selectedNodeId={selectedNodeId}
            onSelectNode={(node) => setSelectedNodeId(node.id)}
            zoomLevel={zoom} // UUSI PROP
          />

          {/* ZOOM SLIDER (KELLUVA) */}
          <div className="jc-zoom-controls">
            <span className="small" style={{color:'var(--turquoise)'}}>ZOOM</span>
            <input 
              type="range" 
              min="0.5" max="3" step="0.1" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="jc-slider"
            />
            <span className="small" style={{width:'30px'}}>{Math.round(zoom * 100)}%</span>
          </div>

          <InfoSidecar character={selectedCharacter} onClose={() => setSelectedNodeId(null)} />
        </div>
      </div>

      <h3 className="jc-h2" style={{borderBottom:'1px solid var(--turquoise)', paddingBottom:'0.5rem', marginBottom:'1.5rem'}}>Hallintatyökalut</h3>

      {/* ... (Manuaalinen työkalu & Lista säilyvät ennallaan) ... */}
      <div className="jc-card medium mb-2">
        <h3 className="jc-h2" style={{fontSize:'1.5rem', marginTop:0}}>Luo uusi yhteys</h3>
        <form onSubmit={createRelationship} className="jc-form">
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
            <div className="jc-field">
              <label>Hahmo 1 (Kuka)</label>
              <select className="jc-select" value={newRel.char1_id} onChange={e => setNewRel({...newRel, char1_id: e.target.value})} required>
                <option value="">Valitse...</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="jc-field">
              <label>Hahmo 2 (Kenet tuntee)</label>
              <select className="jc-select" value={newRel.char2_id} onChange={e => setNewRel({...newRel, char2_id: e.target.value})} required>
                <option value="">Valitse...</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="jc-field">
            <label>Suhde (Kuvaus)</label>
            <input type="text" className="jc-input" placeholder="Esim. Entinen rakastaja, Velallinen..." value={newRel.description} onChange={e => setNewRel({...newRel, description: e.target.value})} required />
          </div>
          <button type="submit" className="jc-cta primary mt-2">Luo Yhteys</button>
        </form>
      </div>

      <div className="jc-grid">
        {relationships.map(rel => (
          <div key={rel.id} className="jc-col-12">
            <div className="jc-card small" style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.4)', padding:'0.8rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap'}}>
                <strong style={{color:'var(--turquoise)'}}>{getCharName(rel.char1_id)}</strong>
                <span style={{opacity:0.5}}>➜</span>
                <strong style={{color:'var(--magenta)'}}>{getCharName(rel.char2_id)}</strong>
                <span style={{margin:'0 1rem', borderLeft:'1px solid #555', paddingLeft:'1rem', fontStyle:'italic'}}>{rel.description}</span>
              </div>
              <button onClick={() => deleteRelationship(rel.id)} style={{color:'#ff6b6b', background:'none', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'1.2rem'}}>×</button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default RelationManager;