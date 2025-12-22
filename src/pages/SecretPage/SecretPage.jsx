import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Lock, Unlock, LogOut } from 'lucide-react'; // Lisätty ikonit

// Komponentit
import GuestList from '../../components/Admin/GuestList';
import CharacterFactory from '../../components/Admin/CharacterFactory';
import RelationManager from '../../components/Admin/RelationManager';
import CharacterCasting from '../../components/Admin/CharacterCasting'; 
import GuestManager from '../../components/Admin/GuestManager';
import MessageCenter from '../../components/MessageCenter';

function SecretPage() {
  // --- AUTH STATE (UUSI) ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // --- DATA STATE ---
  const [activeTab, setActiveTab] = useState('GUESTS'); 
  const [loading, setLoading] = useState(true);
  
  const [guests, setGuests] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [splits, setSplits] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // --- 1. TARKISTA KIRJAUTUMINEN (UUSI) ---
  useEffect(() => {
    const token = localStorage.getItem('jc_admin_token');
    if (token === 'valid') {
      setIsAuthenticated(true);
      refreshData(); // Ladataan data heti jos kirjautunut
    } else {
      setLoading(false); // Lopetetaan lataus jotta login-ruutu näkyy
    }
  }, []);

  // --- LOGIN LOGIIKKA (UUSI) ---
  const handleLogin = (e) => {
    e.preventDefault();
    // Haetaan oikea salasana ympäristömuuttujasta (VITE_ prefix on pakollinen)
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (passwordInput === correctPassword) {
      localStorage.setItem('jc_admin_token', 'valid');
      setIsAuthenticated(true);
      setLoginError(false);
      setLoading(true);
      refreshData();
    } else {
      setLoginError(true);
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jc_admin_token');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // --- DATAHAKU ---
  const refreshData = async () => {
    try {
      const { data: gData } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
      const { data: cData } = await supabase.from('characters').select('*').order('name');
      const { data: rData } = await supabase.from('character_relationships').select('*');
      const { data: sData } = await supabase.from('guest_splits').select('*');
      const { data: fData } = await supabase.from('character_feedback').select('*');

      if (cData) setCharacters(cData);
      if (rData) setRelationships(rData);
      if (sData) setSplits(sData);
      if (fData) setFeedbacks(fData);

      if (gData && cData) {
        const merged = gData.map(g => {
          const myChars = cData.filter(c => c.assigned_guest_id === g.id);
          return { 
            ...g, 
            mainCharacter: myChars.find(c => !c.is_spouse_character) || null,
            spouseCharacter: myChars.find(c => c.is_spouse_character) || null
          };
        });
        setGuests(merged);
      }

    } catch (err) {
      console.error("Datanhaku epäonnistui:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- REALTIME KUUNTELU ---
  useEffect(() => {
    if (!isAuthenticated) return; // Ei kuunnella jos ei kirjautunut

    const channel = supabase.channel('secret_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guest_splits' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_relationships' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_feedback' }, refreshData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]); // Riippuvuus: käynnistyy vasta kun auth on ok

  // --- NÄKYMÄ 1: LOGIN SCREEN (JOS EI KIRJAUTUNUT) ---
  if (!isAuthenticated) {
    return (
      <div className="jc-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="jc-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px' }}>
          <Lock size={48} color="var(--magenta)" style={{ marginBottom: '20px' }} />
          <h2 className="jc-h2" style={{ marginBottom: '10px' }}>Admin Access</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>Tämä osio on vain pelinjohdolle.</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              className="jc-input" 
              placeholder="Syötä salasana..." 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ marginBottom: '20px', textAlign: 'center', borderColor: loginError ? 'red' : '' }}
              autoFocus
            />
            {loginError && <p style={{ color: 'red', marginBottom: '15px' }}>Väärä salasana</p>}
            
            <button type="submit" className="jc-btn primary" style={{ width: '100%' }}>
              <Unlock size={18} style={{ marginRight: '8px' }} /> Avaa ovet
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- NÄKYMÄ 2: ADMIN PANEL (JOS KIRJAUTUNUT) ---
  return (
    <div className="jc-wrapper">
      <header style={{textAlign:'center', marginBottom:'2rem', position: 'relative'}}>
        <h1 className="jc-h1">Game Master</h1>
        
        {/* LOGOUT JA REFRESH NAPIT YLÄKULMASSA */}
        <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: '10px' }}>
          <button onClick={refreshData} className="jc-btn small outline" title="Päivitä">↻</button>
          <button onClick={handleLogout} className="jc-btn small outline" style={{borderColor: 'var(--magenta)', color: 'var(--magenta)'}} title="Kirjaudu ulos">
            <LogOut size={16} />
          </button>
        </div>

        <div style={{display:'flex', justifyContent:'center', gap:'1rem', margin:'2rem 0', flexWrap:'wrap'}}>
          <button onClick={()=>setActiveTab('GUESTS')} className={`jc-cta ${activeTab==='GUESTS'?'primary':'ghost'}`}>Vieraslista</button>
          <button onClick={()=>setActiveTab('CASTING')} className={`jc-cta ${activeTab==='CASTING'?'primary':'ghost'}`}>Roolitus</button>
          <button onClick={()=>setActiveTab('CHARS')} className={`jc-cta ${activeTab==='CHARS'?'primary':'ghost'}`}>Hahmot</button>
          <button onClick={()=>setActiveTab('RELATIONS')} className={`jc-cta ${activeTab==='RELATIONS'?'primary':'ghost'}`}>Relaatiot</button>
          <button onClick={()=>setActiveTab('MANAGER')} className={`jc-cta ${activeTab==='MANAGER'?'primary':'ghost'}`}>Hallinta</button>
          <button onClick={()=>setActiveTab('EMAIL')} className={`jc-cta ${activeTab==='EMAIL'?'primary':'ghost'}`}>Viestit</button>
        </div>
      </header>

      {loading && <div style={{textAlign:'center'}}>Ladataan dataa...</div>}

      {!loading && (
        <>
          {activeTab === 'GUESTS' && (
            <GuestList 
              guests={guests} 
              characters={characters} 
              splits={splits}
              feedbacks={feedbacks}
              onUpdate={refreshData} 
            />
          )}
          
          {activeTab === 'CASTING' && (
            <CharacterCasting 
              guests={guests} 
              characters={characters} 
              splits={splits}
              onUpdate={refreshData} 
            />
          )}
          
          {activeTab === 'CHARS' && (
            <CharacterFactory 
              characters={characters} 
              guests={guests}
              onUpdate={refreshData} 
            />
          )}
          
          {activeTab === 'RELATIONS' && (
            <RelationManager 
              characters={characters} 
              relationships={relationships} 
              onUpdate={refreshData} 
            />
          )}

          {activeTab === 'MANAGER' && (
            <GuestManager 
              guests={guests} 
              characters={characters} 
              splits={splits} 
              feedbacks={feedbacks}
              onUpdate={refreshData} 
            />
          )}

          {activeTab === 'EMAIL' && (
             <MessageCenter />
          )}
        </>
      )}
    </div>
  );
}

export default SecretPage;