import React, { useState, useMemo } from 'react';
import { 
  Search, Download, Grid, List, 
  Database, UserPlus, Users, 
  Trophy, Link as LinkIcon, AlertCircle, 
  CheckCircle, HelpCircle // Lisätty ikoni kysymyksille
} from 'lucide-react';
import './AdminPage.css'; 

function GuestList({ guests, splits = [], characters = [], feedbacks = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [viewMode, setViewMode] = useState('GRID'); 

  // --- DATAN RIKASTAMINEN ---
  const enrichedGuests = useMemo(() => {
    return guests.map(g => {
      // 1. Hahmot
      const myChars = characters.filter(c => c.assigned_guest_id === g.id);
      const mainCharacter = myChars.find(c => !c.is_spouse_character) || myChars[0];
      const spouseCharacter = myChars.find(c => c.is_spouse_character && c.id !== mainCharacter?.id);

      // 2. Splitit
      const splitAsChild = splits.find(s => s.child_guest_id === g.id);
      const parentName = splitAsChild 
        ? guests.find(p => p.id === splitAsChild.parent_guest_id)?.name 
        : null;

      const splitAsParent = splits.find(s => s.parent_guest_id === g.id);
      const childName = splitAsParent 
        ? guests.find(c => c.id === splitAsParent.child_guest_id)?.name 
        : null;

      // 3. Hyväksyntä ja Status (KORJATTU LOGIIKKA)
      // Haetaan kaikki tälle vieraalle kuuluvat palauterivit
      const myFeedbacks = feedbacks.filter(f => f.guest_id === g.id);
      
      // Onko JOKIN riveistä 'accepted'? (Korjaa ongelman, jossa vanha 'resolved' piilotti hyväksynnän)
      const isAccepted = myFeedbacks.some(f => f.status === 'accepted');
      
      // Onko vireillä oleva kysymys? (Jos ei ole hyväksytty, mutta on pending)
      const hasPendingQuestion = !isAccepted && myFeedbacks.some(f => f.status === 'pending_feedback');

      return { 
        ...g, 
        mainCharacter, 
        spouseCharacter,
        isChild: !!splitAsChild, 
        parentName,
        isParent: !!splitAsParent,
        childName,
        childId: splitAsParent?.child_guest_id,
        isAccepted,        // Tosi, jos yksikin hyväksyntä löytyy
        hasPendingQuestion // Tosi, jos ei hyväksytty mutta kysymys auki
      };
    });
  }, [guests, splits, characters, feedbacks]); 

  // --- LASKURI (HUD STATS) ---
  const stats = useMemo(() => {
    const realGuests = guests.length; 
    let ghostAvecs = 0;
    let acceptedCount = 0;

    guests.forEach(g => {
      const isSplit = splits.some(s => s.parent_guest_id === g.id);
      if (g.brings_spouse && !isSplit) {
        ghostAvecs++;
      }
    });
    
    acceptedCount = enrichedGuests.filter(g => g.isAccepted).length;

    return { total: realGuests + ghostAvecs, real: realGuests, ghosts: ghostAvecs, accepted: acceptedCount };
  }, [guests, splits, enrichedGuests]);

  // --- SUODATUS ---
  const filteredGuests = useMemo(() => {
    return enrichedGuests.filter(guest => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = 
        guest.name.toLowerCase().includes(s) ||
        (guest.email && guest.email.toLowerCase().includes(s));
      
      let matchesFilter = true;
      if (filterType === 'NO_CHAR') matchesFilter = !guest.mainCharacter;
      if (filterType === 'AVEC') matchesFilter = guest.brings_spouse || guest.isChild; 
      if (filterType === 'DIET') matchesFilter = guest.dietary_restrictions && guest.dietary_restrictions.length > 0;
      if (filterType === 'ACCEPTED') matchesFilter = guest.isAccepted;
      if (filterType === 'PENDING') matchesFilter = guest.hasPendingQuestion; // Uusi suodatin kysymyksille

      return matchesSearch && matchesFilter;
    });
  }, [enrichedGuests, searchTerm, filterType]);

  // --- CSV LATAUS ---
  const downloadCSV = () => {
    if (enrichedGuests.length === 0) return;
    const headers = ["Nimi,Sähköposti,Status,Avec/Linkki,Allergiat,Hahmo,Rooli,Hyväksytty,Kysymys"];
    
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
      const acceptedStr = g.isAccepted ? "Kyllä" : "Ei";
      const pendingStr = g.hasPendingQuestion ? "Kyllä" : "-";
      
      return [
        `"${g.name}"`, g.email, status, linkInfo, safeDiet, charName, charRole, acceptedStr, pendingStr
      ].join(",");
    });
    
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `jc_lista_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CATERING YHTEENVETO (UUSI LOGIIKKA) ---
  const cateringStats = useMemo(() => {
    const counts = {};
    guests.forEach(g => {
      if (!g.dietary_restrictions) return;
      // Pilkotaan pilkulla, poistetaan tyhjät välit
      const diets = g.dietary_restrictions.split(',').map(d => d.trim()).filter(Boolean);
      
      diets.forEach(diet => {
        counts[diet] = (counts[diet] || 0) + 1;
      });
    });
    
    // Muutetaan arrayksi ja järjestetään yleisimmästä harvinaisimpaan
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [guests]);

  return (
    <div>
      {/* 1. HUD STATS ROW (PÄIVITETTY LAYOUT) */}
      <div 
        className="jc-card guest-stats-row" 
        style={{ 
          display: 'grid', 
          // Neljä saraketta isolla, pienemmällä joustaa (minimi 200px)
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '20px' 
        }}
      >
        
        <div className="stat-box turquoise">
          <div className="stat-label">
            <Database size={16} /> Kortit (DB)
          </div>
          <div className="stat-value">{stats.real}</div>
        </div>

        <div className="stat-box magenta">
          <div className="stat-label">
            <UserPlus size={16} /> Linkittömät Avecit
          </div>
          <div className="stat-value">{stats.ghosts}</div>
        </div>

        <div className="stat-box gold">
          <div className="stat-label">
            <Users size={16} /> Yhteensä (Pääluku)
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="stat-box" style={{borderColor: 'var(--lime)', color: 'var(--lime)'}}>
          <div className="stat-label" style={{color: 'var(--lime)'}}>
            <CheckCircle size={16} /> Hyväksynyt
          </div>
          <div className="stat-value">{stats.accepted}</div>
        </div>

      </div>

      {/* 2. CATERING ALERT (PÄIVITETTY: Ei tuplia) */}
      {cateringStats.length > 0 && (
        <div className="jc-card small mb-2" style={{borderColor:'#ffaa00', background:'rgba(255, 170, 0, 0.05)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'0.5rem'}}>
            <AlertCircle size={16} color="#ffaa00"/>
            <h4 className="small text-gold" style={{ margin: 0 }}>CATERING HUOMIOT</h4>
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
            {cateringStats.map(([diet, count], i) => (
              <span key={i} className="jc-badge" style={{borderColor:'#ffaa00', color:'#ffaa00', fontSize:'0.75rem'}}>
                {diet} <strong>({count})</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. TOOLBAR */}
      <div className="jc-toolbar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
        
        {/* Haku */}
        <div className="jc-form" style={{flex:1, marginBottom:0, position:'relative', minWidth:'200px'}}>
           <Search size={18} style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--muted)'}} />
           <input 
             type="text" 
             placeholder="Etsi listalta..." 
             value={searchTerm} 
             onChange={(e) => setSearchTerm(e.target.value)} 
             className="jc-input-custom" 
             style={{marginBottom:0, paddingLeft:'40px'}} 
            />
        </div>

        {/* Suodattimet */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setFilterType('ALL')} className={`jc-cta ${filterType === 'ALL' ? 'primary' : 'ghost'}`} style={{padding:'0.5rem 1rem', fontSize:'0.9rem'}}>Kaikki</button>
          <button onClick={() => setFilterType('AVEC')} className={`jc-cta ${filterType === 'AVEC' ? 'primary' : 'ghost'}`} style={{padding:'0.5rem 1rem', fontSize:'0.9rem'}}>Avecit</button>
          <button onClick={() => setFilterType('DIET')} className={`jc-cta ${filterType === 'DIET' ? 'primary' : 'ghost'}`} style={{padding:'0.5rem 1rem', fontSize:'0.9rem'}}>Allergiat</button>
          <button onClick={() => setFilterType('ACCEPTED')} className={`jc-cta ${filterType === 'ACCEPTED' ? 'primary' : 'ghost'}`} style={{padding:'0.5rem 1rem', fontSize:'0.9rem'}}>Hyväksyneet</button>
          <button onClick={() => setFilterType('PENDING')} className={`jc-cta ${filterType === 'PENDING' ? 'primary' : 'ghost'}`} style={{padding:'0.5rem 1rem', fontSize:'0.9rem'}}>Kysymykset</button>
        </div>

        {/* Näkymävalinta & Lataus */}
        <div style={{ display:'flex', gap:'0.5rem', marginLeft:'auto' }}>
           <button onClick={downloadCSV} className="jc-cta ghost" title="Lataa CSV" style={{padding:'0.5rem'}}>
             <Download size={20} />
           </button>
           <div style={{width:'1px', background:'rgba(255,255,255,0.2)', margin:'0 5px'}}></div>
           <button onClick={() => setViewMode('GRID')} className={`jc-cta ${viewMode === 'GRID' ? 'primary' : 'ghost'}`} style={{padding:'0.5rem'}}>
             <Grid size={20} />
           </button>
           <button onClick={() => setViewMode('TABLE')} className={`jc-cta ${viewMode === 'TABLE' ? 'primary' : 'ghost'}`} style={{padding:'0.5rem'}}>
             <List size={20} />
           </button>
        </div>
      </div>

      {/* 4. GRID VIEW */}
      {viewMode === 'GRID' && (
        <div className="jc-grid">
          {filteredGuests.map(guest => (
            <div key={guest.id} className="jc-col-4" style={{minWidth:'300px'}}>
              <div className="jc-card small" style={{height:'100%', position:'relative', overflow:'hidden'}}>
                
                {/* Lapsi-indikaattori */}
                {guest.isChild && (
                  <div style={{position:'absolute', left:0, top:0, bottom:0, width:'4px', background:'var(--turquoise)'}}></div>
                )}
                {guest.isParent && (
                  <div style={{position:'absolute', left:0, top:0, bottom:0, width:'4px', background:'var(--magenta)'}}></div>
                )}

                <div style={{paddingLeft: (guest.isChild || guest.isParent) ? '10px' : '0'}}>
                  
                  {/* Header */}
                  <div style={{marginBottom:'10px'}}>
                    {guest.isChild && (
                       <div className="small text-turquoise" style={{marginBottom:'2px', display:'flex', alignItems:'center', gap:'5px'}}>
                         <LinkIcon size={12}/> Kutsunut: {guest.parentName}
                       </div>
                    )}
                    
                    <h3 style={{margin:0, color:'var(--cream)', fontSize:'1.1rem', display:'flex', alignItems:'center', gap:'8px', flexWrap: 'wrap'}}>
                      {guest.name}
                      {/* APPRO-BADGE */}
                      {guest.isAccepted && (
                        <span style={{
                          fontSize: '0.6rem', 
                          background: 'rgba(0,255,65,0.1)', 
                          color: '#00ff41', 
                          border: '1px solid #00ff41',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Appro.
                        </span>
                      )}
                      {/* PENDING QUESTION BADGE */}
                      {guest.hasPendingQuestion && (
                        <span style={{
                          fontSize: '0.6rem', 
                          background: 'rgba(255,165,0,0.1)', 
                          color: 'orange', 
                          border: '1px solid orange',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <HelpCircle size={10} /> Kysymys
                        </span>
                      )}
                    </h3>

                    <div className="small" style={{opacity:0.6}}>{guest.email}</div>
                  </div>
                  
                  {/* Avec Info */}
                  {guest.brings_spouse && (
                    <div style={{background:'rgba(255,255,255,0.05)', padding:'8px', borderRadius:'6px', marginBottom:'10px'}}>
                      {guest.isParent ? (
                        <div style={{display:'flex', alignItems:'center', gap:'6px', color:'var(--magenta)'}}>
                           <LinkIcon size={14} /> 
                           <span className="small">Linkki: <strong>{guest.childName}</strong></span>
                        </div>
                      ) : (
                        <div style={{display:'flex', alignItems:'center', gap:'6px', color:'var(--plasma-gold)'}}>
                           <UserPlus size={14} /> 
                           <span className="small">Ilmoitettu: <strong>{guest.spouse_name}</strong></span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Roolit */}
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    {guest.mainCharacter ? (
                      <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                        <Trophy size={14} color="var(--turquoise)"/> 
                        <span className="small">Rooli: 
                          <a 
                            href={`/agent?id=${guest.mainCharacter.id}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{color:'var(--turquoise)', fontWeight:'bold', textDecoration:'underline', marginLeft:'4px'}}
                          >
                            {guest.mainCharacter.name}
                          </a>
                        </span>
                      </div>
                    ) : (
                      <span className="small" style={{opacity:0.3}}>Ei roolia</span>
                    )}
                    
                    {/* Avecin rooli */}
                    {guest.spouseCharacter && (
                      <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                        <Trophy size={14} color="var(--plasma-gold)"/> 
                        <span className="small">Avec Rooli: 
                          <a 
                            href={`/agent?id=${guest.spouseCharacter.id}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{color:'var(--plasma-gold)', fontWeight:'bold', textDecoration:'underline', marginLeft:'4px'}}
                          >
                            {guest.spouseCharacter.name}
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Allergiat */}
                  {guest.dietary_restrictions && (
                    <div style={{marginTop:'10px', paddingTop:'10px', borderTop:'1px solid rgba(255,255,255,0.1)', color:'#ffaa00', fontSize:'0.85rem', display:'flex', gap:'5px'}}>
                      <AlertCircle size={14} /> {guest.dietary_restrictions}
                    </div>
                  )}

                  {/* Vieraan oma linkki */}
                  <div style={{marginTop:'10px'}}>
                    <a href={`/lippu/${guest.id}`} target="_blank" rel="noreferrer" className="small" style={{color:'var(--turquoise)', display:'flex', alignItems:'center', gap:'4px'}}>
                      <LinkIcon size={12}/> Avaa Lippulinkki
                    </a>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', color:'var(--cream)'}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)', textAlign:'left'}}>
                <th style={{padding:'10px'}}>Nimi</th>
                <th style={{padding:'10px'}}>Status</th>
                <th style={{padding:'10px'}}>Hahmo</th>
                <th style={{padding:'10px'}}>Avec / Linkki</th>
                <th style={{padding:'10px'}}>Allergiat</th>
                <th style={{padding:'10px'}}>Linkki</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map(g => (
                <tr key={g.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <td style={{padding:'10px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      {g.name}
                      {/* APPRO-BADGE LISTASSA */}
                      {g.isAccepted && (
                        <span style={{
                          fontSize: '0.6rem', 
                          background: 'rgba(0,255,65,0.1)', 
                          color: '#00ff41', 
                          border: '1px solid #00ff41',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          Appro.
                        </span>
                      )}
                      {g.hasPendingQuestion && (
                        <span style={{
                          fontSize: '0.6rem', 
                          background: 'rgba(255,165,0,0.1)', 
                          color: 'orange', 
                          border: '1px solid orange',
                          padding: '2px 4px',
                          borderRadius: '4px',
                        }}>
                          ?
                        </span>
                      )}
                    </div>
                    <div className="small" style={{opacity:0.5}}>{g.email}</div>
                  </td>
                  <td style={{padding:'10px'}}>
                    {g.isChild && <span className="jc-badge" style={{borderColor:'var(--turquoise)', color:'var(--turquoise)'}}>Avec</span>}
                    {g.isParent && <span className="jc-badge" style={{borderColor:'var(--magenta)', color:'var(--magenta)'}}>Kutsuja</span>}
                    {!g.isChild && !g.isParent && <span style={{opacity:0.5}}>Vieras</span>}
                  </td>
                  <td style={{padding:'10px'}}>
                    {g.mainCharacter ? (
                      <a href={`/agent?id=${g.mainCharacter.id}`} target="_blank" rel="noreferrer" style={{color:'var(--turquoise)', textDecoration:'underline'}}>
                        {g.mainCharacter.name}
                      </a>
                    ) : '-'}
                  </td>
                  <td style={{padding:'10px'}}>
                    {g.brings_spouse ? (
                      g.isParent 
                        ? <span style={{color:'var(--magenta)'}}>{g.childName} (Link)</span>
                        : <span style={{color:'var(--plasma-gold)'}}>{g.spouse_name} (Ilm.)</span>
                    ) : '-'}
                  </td>
                  <td style={{padding:'10px', color: g.dietary_restrictions ? '#ffaa00' : 'inherit'}}>
                    {g.dietary_restrictions || '-'}
                  </td>
                  <td style={{padding:'10px'}}>
                    <a href={`/lippu/${g.id}`} target="_blank" rel="noreferrer" style={{color:'var(--turquoise)'}}>
                      <LinkIcon size={16} />
                    </a>
                  </td>
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