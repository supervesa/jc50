import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Komponentit
import GuestList from '../../components/Admin/GuestList';
import CharacterFactory from '../../components/Admin/CharacterFactory';
import RelationManager from '../../components/Admin/RelationManager';
import CharacterCasting from '../../components/Admin/CharacterCasting'; 
import GuestManager from '../../components/Admin/GuestManager';
// KORJAUS: Oikea polku on kaksi tasoa ylös (../../) komponenttikansioon
import EmailComposer from '../../components/EmailComposer';

function SecretPage() {
  const [activeTab, setActiveTab] = useState('GUESTS'); 
  const [loading, setLoading] = useState(true);
  
  // DATA STATE
  const [guests, setGuests] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [splits, setSplits] = useState([]);

  // --- DATAHAKU ---
  const refreshData = async () => {
    // setLoading(true); // Kommentoin pois, jotta realtime ei välkytä latausruutua
    try {
      // Haetaan kaikki tarvittavat taulut
      const { data: gData } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
      const { data: cData } = await supabase.from('characters').select('*').order('name');
      const { data: rData } = await supabase.from('character_relationships').select('*');
      const { data: sData } = await supabase.from('guest_splits').select('*');

      // Päivitetään tilat
      if (cData) setCharacters(cData);
      if (rData) setRelationships(rData);
      if (sData) setSplits(sData);

      // Yhdistetään vieraisiin hahmot valmiiksi
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
    refreshData(); // Ensimmäinen haku

    const channel = supabase.channel('secret_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guest_splits' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_relationships' }, refreshData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="jc-wrapper">
      <header style={{textAlign:'center', marginBottom:'2rem'}}>
        <h1 className="jc-h1">Game Master</h1>
        <div style={{display:'flex', justifyContent:'center', gap:'1rem', margin:'2rem 0', flexWrap:'wrap'}}>
          <button onClick={()=>setActiveTab('GUESTS')} className={`jc-cta ${activeTab==='GUESTS'?'primary':'ghost'}`}>Vieraslista</button>
          <button onClick={()=>setActiveTab('CASTING')} className={`jc-cta ${activeTab==='CASTING'?'primary':'ghost'}`}>Roolitus</button>
          <button onClick={()=>setActiveTab('CHARS')} className={`jc-cta ${activeTab==='CHARS'?'primary':'ghost'}`}>Hahmot</button>
          <button onClick={()=>setActiveTab('RELATIONS')} className={`jc-cta ${activeTab==='RELATIONS'?'primary':'ghost'}`}>Relaatiot</button>
          <button onClick={()=>setActiveTab('MANAGER')} className={`jc-cta ${activeTab==='MANAGER'?'primary':'ghost'}`}>Hallinta</button>
          {/* UUSI NAPPI: Viestit */}
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
              onUpdate={refreshData} 
            />
          )}

          {/* UUSI TAB: Viestien lähetys */}
          {activeTab === 'EMAIL' && (
            <EmailComposer />
          )}
        </>
      )}
    </div>
  );
}

export default SecretPage;