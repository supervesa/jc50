import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './TicketPage.css';

// Komponentit
import TicketHeader from './TicketHeader';
import CharacterCard from './CharacterCard';
import GuestInfo from './GuestInfo';
import PhotoFeed from './PhotoFeed';
import CharacterAcceptance from './CharacterAcceptance';
import IntroOverlay from '../../components/IntroOverlay'; 
import AvecSplitCard from './components/AvecSplitCard'; // UUSI EROTETTU KOMPONENTTI
import NexusTeaser from './NexusTeaser';

// Hookit
import { useGameConfig } from '../AgentPage/hooks/useGameConfig'; 
import { useSentinel } from '../../hooks/useSentinel';

function TicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // SENTINEL AKTIVOINTI
  useSentinel(id, 'TICKET');

  // --- TILAT ---
  const [guest, setGuest] = useState(null);
  const [myCharacters, setMyCharacters] = useState([]); 
  const [myPhotos, setMyPhotos] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploading, setUploading] = useState(false); 
  
  const [activeTab, setActiveTab] = useState('IDENTITY'); 
  const [photoMessage, setPhotoMessage] = useState(''); 

  const [showIntro, setShowIntro] = useState(true);

  // HAETAAN MAAILMAN TILA
  const { phaseValue } = useGameConfig(id);

 // --- 1. DATAHAKU & LEIMAUS ---
const fetchData = async () => {
  if (!id || id.length < 20) {
    setErrorMsg("Linkki virheellinen.");
    setLoading(false);
    return;
  }
  setLoading(true);
  setErrorMsg(null);

  try {
    // --- MUUTOS ALKAA ---
    // Tallennetaan ID ja TYYPPI heti, jotta PWA-asennus muistaa missä ollaan.
    localStorage.setItem('jc_ticket_id', id);
    localStorage.setItem('last_visited_id', id); 
    
    localStorage.setItem('last_visited_type', 'ticket'); // <--- SIIRRETTY TÄNNE (OIKEA PAIKKA)
    // --- MUUTOS LOPPU ---

    const { data: guestData, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', id)
      .single();

    if (guestError || !guestData) throw guestError;
    
    setGuest(guestData);

    // Haetaan hahmot
    const { data: charData, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('assigned_guest_id', id);

    if (!charError && charData) {
      setMyCharacters(charData);
      if (charData.length > 0) {
        localStorage.setItem('jc_username', charData[0].name);
      }
    }

    fetchMyPhotos(id);

  } catch (err) {
    console.error("Lippuvirhe:", err);
    setErrorMsg("Lippua ei löytynyt.");
    
    // --- SIIVOUS ---
    // Jos ID olikin väärä, poistetaan kaikki jäljet
    localStorage.removeItem('jc_ticket_id');
    localStorage.removeItem('jc_username');
    localStorage.removeItem('last_visited_id'); 
    localStorage.removeItem('last_visited_type'); // <--- POISTETAAN TYYPPIKIN JOS VIRHE
  } finally {
    setLoading(false);
  }
};

  const fetchMyPhotos = async (guestId) => {
    const { data } = await supabase
      .from('live_posts')
      .select('*')
      .eq('guest_id', guestId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (data) setMyPhotos(data);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // --- HERKKÄ SPLIT TOIMINTO (EI MUUTETTU) ---
  const handleActivateSpouse = async (spouseEmail) => {
    if (!guest || !guest.spouse_name) return;

    const spouseChar = myCharacters.find(c => c.is_spouse_character);
    if (!spouseChar) throw new Error("Avecin hahmoa ei löydy.");

    const { data: newGuest, error: createError } = await supabase
      .from('guests')
      .insert({
        name: guest.spouse_name,
        email: spouseEmail || null,
        brings_spouse: false,
        dietary_restrictions: guest.dietary_restrictions
      })
      .select()
      .single();

    if (createError) throw createError;

    const { error: moveError } = await supabase
      .from('characters')
      .update({ assigned_guest_id: newGuest.id })
      .eq('id', spouseChar.id);

    if (moveError) throw moveError;

    await supabase.from('guest_splits').insert({
        parent_guest_id: guest.id,
        child_guest_id: newGuest.id,
        transferred_character_id: spouseChar.id,
        original_spouse_name: guest.spouse_name
    });
    
    await supabase.from('system_logs').insert({
        event_type: 'GUEST_SPLIT',
        target_id: guest.id,
        description: `Vieras ${guest.name} aktivoi avecin ${guest.spouse_name}`,
        snapshot_data: { parent_name: guest.name, child_name: newGuest.name, character_moved: spouseChar.name }
    });

    setMyCharacters(prev => prev.filter(c => c.id !== spouseChar.id));
    return newGuest.id;
  };

  // --- MUUT TOIMINNOT ---
  const uploadAvatar = async (event, charId) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileName = `${charId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('characters').update({ avatar_url: publicUrl }).eq('id', charId);
      if (updateError) throw updateError;
      alert("Profiilikuva päivitetty!");
      fetchData(); 
    } catch (error) {
      alert("Virhe: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    await supabase.from('live_posts').update({ is_deleted: true }).eq('id', photoId);
    fetchMyPhotos(guest.id);
  };

  if (showIntro) {
    return <IntroOverlay mode="ticket" onComplete={() => setShowIntro(false)} />;
  }

  if (loading) return <div className="ticket-wrapper ticket-loading">Ladataan...</div>;
  if (errorMsg) return <div className="ticket-wrapper ticket-error">{errorMsg}</div>;

  return (
    <div id="ticket-page" className="jc-wrapper ticket-wrapper">
      
      <TicketHeader 
        id={id} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {activeTab === 'IDENTITY' && (
        <>
          {/* 1. HAHMOKORTIT */}
          {myCharacters.length === 0 ? (
            <section className="jc-card medium mb-2 ticket-loading" style={{ opacity: 0.7 }}>
              <div style={{ fontSize: '3rem' }}>🎭</div>
              <h3>Hahmoa ei vielä roolitettu</h3>
              <p>Sentinel analysoi profiiliasi...</p>
            </section>
          ) : (
            myCharacters.map(char => (
              <CharacterCard 
                key={char.id} 
                char={char} 
                onUploadAvatar={uploadAvatar} 
                uploading={uploading} 
              />
              
            ))
          )}
          {/* --- NEXUS TEASER TÄHÄN --- */}
          {/* Näytetään vain jos hahmo on jo olemassa */}
          {myCharacters.length > 0 && (
            <NexusTeaser 
              ticketId={id} 
              characterName={myCharacters[0].character_name} 
            />
          )}
          

          {/* 2. AVECIN EROTUS (Nostettu hahmojen alle) */}
          {guest && (
            <AvecSplitCard 
              guest={guest} 
              myCharacters={myCharacters} 
              onActivateSpouse={handleActivateSpouse} 
            />
          )}

          {/* 3. HAHMON HYVÄKSYNTÄ */}
          {myCharacters.length > 0 && (
            <CharacterAcceptance 
               guestId={id} 
               characterCount={myCharacters.length} 
            />
          )}

          {/* 4. OMAT TIEDOT (Viimeisenä) */}
          <GuestInfo 
            guest={guest}
            onSave={() => alert("Ota yhteys järjestäjään muutoksissa.")}
          />
        </>
      )}

      {activeTab === 'PHOTO' && (
        <PhotoFeed 
          identityId={id}
          identityName={guest?.name}
          phaseValue={phaseValue} 
        />
      )}

    </div>
  );
}

export default TicketPage;