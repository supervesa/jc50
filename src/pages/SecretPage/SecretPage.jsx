import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import GuestList from '../../components/Admin/GuestList';
import CharacterFactory from '../../components/Admin/CharacterFactory';
import RelationManager from '../../components/Admin/RelationManager';
import CharacterCasting from '../../components/Admin/CharacterCasting'; // UUSI IMPORT

function SecretPage() {
  const [activeTab, setActiveTab] = useState('GUESTS'); 
  const [loading, setLoading] = useState(true);
  
  // Data
  const [guests, setGuests] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);

  // Datan päivitys
  const refreshData = async () => {
    setLoading(true);
    try {
      const { data: gData } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
      const { data: cData } = await supabase.from('characters').select('*').order('name');
      const { data: rData } = await supabase.from('character_relationships').select('*');

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
        setCharacters(cData);
      }
      if (rData) setRelationships(rData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  return (
    <div className="jc-wrapper">
      <header style={{textAlign:'center', marginBottom:'2rem'}}>
        <h1 className="jc-h1">Game Master</h1>
        <div style={{display:'flex', justifyContent:'center', gap:'1rem', margin:'2rem 0', flexWrap:'wrap'}}>
          <button onClick={()=>setActiveTab('GUESTS')} className={`jc-cta ${activeTab==='GUESTS'?'primary':'ghost'}`}>Vieraslista</button>
          <button onClick={()=>setActiveTab('CASTING')} className={`jc-cta ${activeTab==='CASTING'?'primary':'ghost'}`}>Roolitus</button>
          <button onClick={()=>setActiveTab('CHARS')} className={`jc-cta ${activeTab==='CHARS'?'primary':'ghost'}`}>Hahmot</button>
          <button onClick={()=>setActiveTab('RELATIONS')} className={`jc-cta ${activeTab==='RELATIONS'?'primary':'ghost'}`}>Relaatiot</button>
        </div>
      </header>

      {loading && <div style={{textAlign:'center'}}>Ladataan...</div>}

      {!loading && (
        <>
          {activeTab === 'GUESTS' && <GuestList guests={guests} characters={characters} onUpdate={refreshData} />}
          {activeTab === 'CASTING' && <CharacterCasting guests={guests} characters={characters} onUpdate={refreshData} />}
          {/* LISÄTTY: characters={characters} */}
{activeTab === 'CHARS' && <CharacterFactory characters={characters} onUpdate={refreshData} />}
          {activeTab === 'RELATIONS' && <RelationManager characters={characters} relationships={relationships} onUpdate={refreshData} />}
        </>
      )}
    </div>
  );
}

export default SecretPage;