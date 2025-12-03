import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

function SecretPage() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [viewMode, setViewMode] = useState('GRID'); 

  // --- DATAHAKU ---
  const fetchGuests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(data);
    } catch (err) {
      console.error('Virhe:', err);
      setError('Tietokantayhteys epäonnistui.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // --- CSV LATAUS (EXCEL EXPORT) ---
  const downloadCSV = () => {
    if (guests.length === 0) {
      alert("Ei ladattavaa dataa.");
      return;
    }

    // 1. Luodaan otsikkorivi
    const headers = ["Nimi,Sähköposti,Avec,Avecin Nimi,Allergiat,Ilmoittautunut"];

    // 2. Muutetaan data CSV-riveiksi
    const rows = guests.map(g => {
      // Käsitellään pilkut tekstin seassa (esim. allergiat) laittamalla lainausmerkit
      const safeDiet = g.dietary_restrictions ? `"${g.dietary_restrictions.replace(/"/g, '""')}"` : "-";
      const safeSpouse = g.spouse_name ? `"${g.spouse_name}"` : "-";
      
      return [
        `"${g.name}"`,
        g.email,
        g.brings_spouse ? "Kyllä" : "Ei",
        safeSpouse,
        safeDiet,
        new Date(g.created_at).toLocaleDateString('fi-FI')
      ].join(",");
    });

    // 3. Yhdistetään kaikki (lisätään BOM \uFEFF jotta Excel ymmärtää Ä ja Ö kirjaimet)
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");

    // 4. Luodaan latauslinkki ja klikataan sitä
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `jc50_vieraslista_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SUODATUSLOGIIKKA ---
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = 
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guest.spouse_name && guest.spouse_name.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesFilter = true;
      if (filterType === 'AVEC') matchesFilter = guest.brings_spouse;
      if (filterType === 'DIET') matchesFilter = guest.dietary_restrictions && guest.dietary_restrictions.length > 0;

      return matchesSearch && matchesFilter;
    });
  }, [guests, searchTerm, filterType]);

  const mainGuests = guests.length;
  const spouses = guests.filter(g => g.brings_spouse).length;
  const totalHeadcount = mainGuests + spouses;
  
  const allDiets = guests
    .filter(g => g.dietary_restrictions)
    .map(g => g.dietary_restrictions);

  return (
    <div className="jc-wrapper">
      
      {/* --- DASHBOARD HEADER --- */}
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 className="jc-h1" style={{ fontSize: '3rem' }}>Dashboard</h1>
        
        <div className="jc-card medium" style={{ display: 'inline-flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div>
            <div className="small" style={{ color: 'var(--turquoise)' }}>JÄSENET</div>
            <div style={{ fontSize: '2rem', fontWeight: '800' }}>{mainGuests}</div>
          </div>
          <div>
            <div className="small" style={{ color: 'var(--magenta)' }}>AVECIT</div>
            <div style={{ fontSize: '2rem', fontWeight: '800' }}>{spouses}</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '2rem' }}>
            <div className="small" style={{ color: 'var(--plasma-gold)' }}>YHTEENSÄ</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--plasma-gold)' }}>{totalHeadcount}</div>
          </div>
        </div>
      </header>

      {/* --- CATERING INFO --- */}
      {allDiets.length > 0 && (
        <div className="jc-card small mb-2" style={{ borderColor: 'var(--plasma-gold)', background: 'rgba(255, 165, 0, 0.05)' }}>
          <h3 className="small" style={{ color: 'var(--plasma-gold)', margin: 0 }}>⚠️ CATERING HUOMIOITAVAA:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {allDiets.map((diet, i) => (
              <span key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                {diet}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* --- TYÖKALUPALKKI --- */}
      <div className="jc-toolbar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
        
        {/* CSV LATAUSNAPPI (UUSI) */}
        <button 
          onClick={downloadCSV} 
          className="jc-filter-btn"
          style={{ borderColor: 'var(--plasma-gold)', color: 'var(--plasma-gold)', fontWeight: 'bold' }}
        >
          📥 Lataa CSV
        </button>

        <input 
          type="text" 
          placeholder="Etsi nimellä..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="jc-search-input"
          style={{ flex: 1, minWidth: '200px', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
        />

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setFilterType('ALL')} className={`jc-filter-btn ${filterType === 'ALL' ? 'active' : ''}`}>Kaikki</button>
          <button onClick={() => setFilterType('AVEC')} className={`jc-filter-btn ${filterType === 'AVEC' ? 'active' : ''}`}>Vain Avec</button>
          <button onClick={() => setFilterType('DIET')} className={`jc-filter-btn ${filterType === 'DIET' ? 'active' : ''}`}>Allergiat</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <button onClick={() => setViewMode('GRID')} className={`jc-view-btn ${viewMode === 'GRID' ? 'active' : ''}`}>Grid</button>
          <button onClick={() => setViewMode('TABLE')} className={`jc-view-btn ${viewMode === 'TABLE' ? 'active' : ''}`}>List</button>
        </div>
      </div>

      {/* --- LISTAUS --- */}
      {!loading && !error && (
        <>
          <p className="small" style={{ marginBottom: '1rem' }}>Löytyi {filteredGuests.length} vierasta</p>

          {viewMode === 'GRID' ? (
            <div className="jc-grid">
              {filteredGuests.map((guest) => (
                <div key={guest.id} className="jc-col-4">
                  <div className="jc-card small" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    
                    <h3 style={{ margin: 0, color: 'var(--turquoise)', paddingRight: '20px' }}>{guest.name}</h3>
                    <p className="small" style={{ opacity: 0.7 }}>{guest.email}</p>
                    
                    {guest.brings_spouse && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,0,229,0.1)', borderRadius: '4px' }}>
                        <span className="small" style={{ color: 'var(--magenta)' }}>+ {guest.spouse_name}</span>
                      </div>
                    )}

                    {guest.dietary_restrictions && (
                      <div style={{ marginTop: 'auto', paddingTop: '1rem', color: 'var(--plasma-gold)', fontSize: '0.85rem' }}>
                        ⚠️ {guest.dietary_restrictions}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="jc-table-container">
              <table className="jc-table">
                <thead>
                  <tr>
                    <th>Nimi</th>
                    <th>Sähköposti</th>
                    <th>Avec</th>
                    <th>Allergiat</th>
                    <th>Ilmoittautunut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td style={{ color: 'var(--turquoise)', fontWeight: 'bold' }}>{guest.name}</td>
                      <td>{guest.email}</td>
                      <td>
                        {guest.brings_spouse ? (
                          <span style={{ color: 'var(--magenta)' }}>+ {guest.spouse_name}</span>
                        ) : (
                          <span style={{ opacity: 0.3 }}>-</span>
                        )}
                      </td>
                      <td>
                        {guest.dietary_restrictions ? (
                          <span style={{ color: 'var(--plasma-gold)' }}>{guest.dietary_restrictions}</span>
                        ) : (
                          <span style={{ opacity: 0.3 }}>-</span>
                        )}
                      </td>
                      <td className="small">{new Date(guest.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SecretPage;