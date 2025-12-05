import React, { useState, useMemo } from 'react';

function GuestList({ guests }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [viewMode, setViewMode] = useState('GRID'); 

  // --- CSV ---
  const downloadCSV = () => {
    if (guests.length === 0) return;
    const headers = ["Nimi,Sähköposti,Avec,Avecin Nimi,Allergiat,Hahmo,Rooli,Avecin Hahmo,Avecin Rooli,Ilmoittautunut"];
    const rows = guests.map(g => {
      const safeDiet = g.dietary_restrictions ? `"${g.dietary_restrictions.replace(/"/g, '""')}"` : "-";
      const safeSpouse = g.spouse_name ? `"${g.spouse_name}"` : "-";
      const charName = g.mainCharacter ? `"${g.mainCharacter.name}"` : "-";
      const charRole = g.mainCharacter ? `"${g.mainCharacter.role}"` : "-";
      const spCharName = g.spouseCharacter ? `"${g.spouseCharacter.name}"` : "-";
      const spCharRole = g.spouseCharacter ? `"${g.spouseCharacter.role}"` : "-";
      
      return [
        `"${g.name}"`, g.email, g.brings_spouse ? "Kyllä" : "Ei", safeSpouse, safeDiet,
        charName, charRole, spCharName, spCharRole,
        new Date(g.created_at).toLocaleDateString('fi-FI')
      ].join(",");
    });
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `jc50_lista.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SUODATUS ---
  const allDiets = guests.filter(g => g.dietary_restrictions).map(g => g.dietary_restrictions);

  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = 
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterType === 'NO_CHAR') matchesFilter = !guest.mainCharacter || (guest.brings_spouse && !guest.spouseCharacter);
      if (filterType === 'AVEC') matchesFilter = guest.brings_spouse;
      if (filterType === 'DIET') matchesFilter = guest.dietary_restrictions;

      return matchesSearch && matchesFilter;
    });
  }, [guests, searchTerm, filterType]);

  const mainGuests = guests.length;
  const spouses = guests.filter(g => g.brings_spouse).length;
  const totalHeadcount = mainGuests + spouses;

  return (
    <div>
      {/* STATS */}
      <div className="jc-card medium mb-2" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems:'center' }}>
        <div><div className="small" style={{ color: 'var(--turquoise)' }}>VIERAAT</div><div style={{ fontSize: '2rem', fontWeight: '800' }}>{mainGuests}</div></div>
        <div><div className="small" style={{ color: 'var(--magenta)' }}>AVECIT</div><div style={{ fontSize: '2rem', fontWeight: '800' }}>{spouses}</div></div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '2rem' }}>
          <div className="small" style={{ color: 'var(--plasma-gold)' }}>YHTEENSÄ</div><div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--plasma-gold)' }}>{totalHeadcount}</div>
        </div>
      </div>

      {/* CATERING */}
      {allDiets.length > 0 && (
        <div className="jc-card small mb-2" style={{ borderColor: 'var(--plasma-gold)', background: 'rgba(255, 165, 0, 0.05)', textAlign:'left' }}>
          <h3 className="small" style={{ color: 'var(--plasma-gold)', margin: 0 }}>⚠️ CATERING:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {allDiets.map((diet, i) => <span key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{diet}</span>)}
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="jc-toolbar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={downloadCSV} className="jc-filter-btn">📥 Lataa CSV</button>
        <input type="text" placeholder="Etsi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="jc-search-input" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setFilterType('ALL')} className={`jc-filter-btn ${filterType === 'ALL' ? 'active' : ''}`}>Kaikki</button>
          <button onClick={() => setFilterType('AVEC')} className={`jc-filter-btn ${filterType === 'AVEC' ? 'active' : ''}`}>Avec</button>
          <button onClick={() => setFilterType('DIET')} className={`jc-filter-btn ${filterType === 'DIET' ? 'active' : ''}`}>Allergiat</button>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setViewMode('GRID')} className={`jc-view-btn ${viewMode === 'GRID' ? 'active' : ''}`}>Grid</button>
          <button onClick={() => setViewMode('TABLE')} className={`jc-view-btn ${viewMode === 'TABLE' ? 'active' : ''}`}>List</button>
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'GRID' && (
        <div className="jc-grid">
          {filteredGuests.map(guest => (
            <div key={guest.id} className="jc-col-4">
              <div className="jc-card small" style={{height:'100%', display:'flex', flexDirection:'column'}}>
                <h3 style={{color:'var(--turquoise)', margin:0}}>{guest.name}</h3>
                <p className="small" style={{opacity:0.7, margin:'0 0 1rem 0'}}>{guest.email}</p>
                {guest.brings_spouse && <div style={{ padding: '0.5rem', background: 'rgba(255,0,229,0.1)', borderRadius: '4px', marginBottom:'1rem' }}><span className="small" style={{ color: 'var(--magenta)' }}>+ AVEC:</span> <strong>{guest.spouse_name}</strong></div>}

                {/* VAIN TIETOJA, EI MUOKKAUSTA */}
                <div style={{marginTop:'auto', paddingTop:'0.5rem', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                  {guest.mainCharacter ? (
                    <div><span className="small" style={{color:'var(--turquoise)'}}>ROOLI:</span> <strong>{guest.mainCharacter.name}</strong></div>
                  ) : <span className="small" style={{opacity:0.5}}>Ei pääroolia</span>}
                  
                  {guest.spouseCharacter && (
                    <div style={{marginTop:'0.5rem'}}><span className="small" style={{color:'var(--magenta)'}}>AVEC:</span> <strong>{guest.spouseCharacter.name}</strong></div>
                  )}
                </div>

                <div style={{marginTop:'1rem', fontSize:'0.7rem', opacity:0.5, wordBreak:'break-all'}}><a href={`/lippu/${guest.id}`} target="_blank" rel="noreferrer" style={{color:'inherit', textDecoration:'underline'}}>Linkki: /lippu/{guest.id}</a></div>
                {guest.dietary_restrictions && <div style={{ marginTop: '1rem', color: 'var(--plasma-gold)', fontSize: '0.85rem' }}>⚠️ {guest.dietary_restrictions}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="jc-table-container">
          <table className="jc-table">
            <thead><tr><th>Nimi</th><th>Sähköposti</th><th>Hahmo</th><th>Avec</th><th>Avec Hahmo</th><th>Allergiat</th></tr></thead>
            <tbody>
              {filteredGuests.map(g => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>{g.email}</td>
                  <td>{g.mainCharacter ? `${g.mainCharacter.name}` : '-'}</td>
                  <td>{g.brings_spouse ? g.spouse_name : '-'}</td>
                  <td>{g.spouseCharacter ? `${g.spouseCharacter.name}` : '-'}</td>
                  <td>{g.dietary_restrictions || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GuestList;