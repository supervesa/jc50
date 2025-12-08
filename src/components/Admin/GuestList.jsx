import React, { useState, useMemo } from 'react';
import './AdminPage.css'; // Käytetään samoja tyylejä

function GuestList({ guests, splits = [], characters = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [viewMode, setViewMode] = useState('GRID'); 

  // --- DATAN RIKASTAMINEN (ENRICHMENT) ---
  // Yhdistetään vieraisiin tieto hahmoista ja split-kytköksistä
  const enrichedGuests = useMemo(() => {
    return guests.map(g => {
      // 1. Hahmot
      const myChars = characters.filter(c => c.assigned_guest_id === g.id);
      const mainCharacter = myChars.find(c => !c.is_spouse_character) || myChars[0];
      const spouseCharacter = myChars.find(c => c.is_spouse_character && c.id !== mainCharacter?.id);

      // 2. Onko tämä vieras "lapsi" (splitattu)?
      const splitAsChild = splits.find(s => s.child_guest_id === g.id);
      const parentName = splitAsChild 
        ? guests.find(p => p.id === splitAsChild.parent_guest_id)?.name 
        : null;

      // 3. Onko tällä vieraalla "lapsia" (splitannut avecin)?
      const splitAsParent = splits.find(s => s.parent_guest_id === g.id);
      const childName = splitAsParent 
        ? guests.find(c => c.id === splitAsParent.child_guest_id)?.name 
        : null;

      return { 
        ...g, 
        mainCharacter, 
        spouseCharacter,
        isChild: !!splitAsChild, 
        parentName,
        isParent: !!splitAsParent,
        childName,
        childId: splitAsParent?.child_guest_id
      };
    });
  }, [guests, splits, characters]);

  // --- LASKURI ---
  const stats = useMemo(() => {
    const realGuests = guests.length; // Tietokannan rivit
    let ghostAvecs = 0;

    guests.forEach(g => {
      // Jos tuo puolison, mutta EI OLE splitannut (eli puoliso ei ole vielä omana rivinään)
      // Niin silloin lasketaan +1 haamu.
      // Jos on splitannut, puoliso on jo mukana 'realGuests' luvussa.
      const isSplit = splits.some(s => s.parent_guest_id === g.id);
      if (g.brings_spouse && !isSplit) {
        ghostAvecs++;
      }
    });

    return { total: realGuests + ghostAvecs, real: realGuests, ghosts: ghostAvecs };
  }, [guests, splits]);

  // --- SUODATUS ---
  const filteredGuests = useMemo(() => {
    return enrichedGuests.filter(guest => {
      const matchesSearch = 
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterType === 'NO_CHAR') matchesFilter = !guest.mainCharacter;
      if (filterType === 'AVEC') matchesFilter = guest.brings_spouse || guest.isChild; 
      if (filterType === 'DIET') matchesFilter = guest.dietary_restrictions;

      return matchesSearch && matchesFilter;
    });
  }, [enrichedGuests, searchTerm, filterType]);

  // --- CSV ---
  const downloadCSV = () => {
    if (enrichedGuests.length === 0) return;
    const headers = ["Nimi,Sähköposti,Status,Avec/Linkki,Allergiat,Hahmo,Rooli"];
    
    const rows = enrichedGuests.map(g => {
      const safeDiet = g.dietary_restrictions ? `"${g.dietary_restrictions.replace(/"/g, '""')}"` : "-";
      let status = "Vieras";
      let linkInfo = "-";

      if (g.isChild) {
        status = `Avec (Kutsuja: ${g.parentName})`;
      } else if (g.brings_spouse) {
        if (g.isParent) {
          status = "Vieras + Avec (Eriytetty)";
          linkInfo = `Avec: ${g.childName}`;
        } else {
          status = "Vieras + Avec (Yhdessä)";
          linkInfo = `Avec: ${g.spouse_name}`;
        }
      }

      const charName = g.mainCharacter ? `"${g.mainCharacter.name}"` : "-";
      const charRole = g.mainCharacter ? `"${g.mainCharacter.role}"` : "-";
      
      return [
        `"${g.name}"`, g.email, status, linkInfo, safeDiet, charName, charRole
      ].join(",");
    });
    
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `jc_lista.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allDiets = guests.filter(g => g.dietary_restrictions).map(g => g.dietary_restrictions);

  return (
    <div>
      {/* STATS */}
      <div className="jc-card medium mb-2 guest-stats-row">
        <div className="stat-box">
          <div className="stat-label text-turquoise">KORTIT (DB)</div>
          <div className="stat-value">{stats.real}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label text-magenta">LINKITTÖMÄT AVECIT</div>
          <div className="stat-value">{stats.ghosts}</div>
        </div>
        <div className="stat-box stat-divider">
          <div className="stat-label text-gold">YHTEENSÄ (PÄÄLUKU)</div>
          <div className="stat-value text-gold">{stats.total}</div>
        </div>
      </div>

      {/* CATERING */}
      {allDiets.length > 0 && (
        <div className="jc-card small mb-2 catering-wrapper">
          <h3 className="small text-gold" style={{ margin: 0 }}>⚠️ CATERING:</h3>
          <div className="diet-tags-row">
            {allDiets.map((diet, i) => <span key={i} className="diet-tag">{diet}</span>)}
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
              <div className="jc-card small" style={{height:'100%'}}>
                <div className="guest-card-content">
                  
                  {/* LAPSI-INDIKAATTORI */}
                  {guest.isChild && (
                    <div style={{fontSize:'0.75rem', color:'var(--magenta)', marginBottom:'5px', textTransform:'uppercase', fontWeight:'bold'}}>
                      ↳ Kutsunut: {guest.parentName}
                    </div>
                  )}

                  <h3 className="text-turquoise" style={{margin:0}}>{guest.name}</h3>
                  <p className="guest-card-email">{guest.email}</p>
                  
                  {/* AVEC TIEDOT */}
                  {guest.brings_spouse && (
                    <div className={`spouse-info-box ${guest.isParent ? 'split' : 'linked'}`}>
                      {guest.isParent ? (
                        <>
                          <span className="small text-magenta">AVEC ERIYTETTY:</span> <strong>{guest.childName}</strong>
                          <span className="split-badge">✔ Löytyy omana korttinaan</span>
                        </>
                      ) : (
                        <>
                          <span className="small text-magenta">+ AVEC:</span> <strong>{guest.spouse_name}</strong>
                        </>
                      )}
                    </div>
                  )}

                  <div className="guest-roles-section">
                    {guest.mainCharacter ? (
                      <div className="role-row">
                        <span className="small text-turquoise">ROOLI:</span> <strong>{guest.mainCharacter.name}</strong>
                      </div>
                    ) : <span className="small" style={{opacity:0.5}}>Ei pääroolia</span>}
                    
                    {/* Näytä "Matin" kortissa avec-hahmo VAIN jos se on vielä Matilla */}
                    {guest.spouseCharacter && (
                      <div className="role-row" style={{marginTop:'0.5rem'}}>
                        <span className="small text-magenta">AVEC ROOLI:</span> <strong>{guest.spouseCharacter.name}</strong>
                      </div>
                    )}
                  </div>

                  <div className="guest-link-row">
                    <a href={`/lippu/${guest.id}`} target="_blank" rel="noreferrer" style={{color:'inherit', textDecoration:'underline'}}>
                      Linkki: /lippu/{guest.id}
                    </a>
                  </div>
                  
                  {guest.dietary_restrictions && <div className="guest-alert-row">⚠️ {guest.dietary_restrictions}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW (Vastaava logiikka) */}
      {viewMode === 'TABLE' && (
        <div className="jc-table-container">
          <table className="jc-table">
            <thead><tr><th>Nimi</th><th>Sähköposti</th><th>Hahmo</th><th>Avec</th><th>Linkki</th><th>Allergiat</th></tr></thead>
            <tbody>
              {filteredGuests.map(g => (
                <tr key={g.id}>
                  <td>
                    {g.isChild && <span style={{color:'var(--magenta)'}}>↳ </span>}
                    {g.name}
                  </td>
                  <td>{g.email}</td>
                  <td>{g.mainCharacter ? g.mainCharacter.name : '-'}</td>
                  <td>
                    {g.brings_spouse ? (
                      g.isParent 
                        ? <span style={{color:'#888'}}>{g.childName} (Eriytetty)</span>
                        : g.spouse_name
                    ) : '-'}
                  </td>
                  <td><a href={`/lippu/${g.id}`} target="_blank" rel="noreferrer">Avaa</a></td>
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