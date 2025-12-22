import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './TicketPage.css';

// Komponentit
import TicketHeader from './TicketHeader';
import CharacterCard from './CharacterCard';
import GuestInfo from './GuestInfo';
import PhotoFeed from './PhotoFeed';
import CharacterAcceptance from './CharacterAcceptance';

function TicketPage() {
  const { id } = useParams();
  
  // --- TILAT ---
  const [guest, setGuest] = useState(null);
  const [myCharacters, setMyCharacters] = useState([]); 
  const [myPhotos, setMyPhotos] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploading, setUploading] = useState(false); 
  
  const [activeTab, setActiveTab] = useState('IDENTITY'); 
  const [photoMessage, setPhotoMessage] = useState(''); 

  // --- 1. DATAHAKU ---
  const fetchData = async () => {
    if (!id || id.length < 20) {
      setErrorMsg("Linkki virheellinen.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('id', id)
        .single();

      if (guestError) throw guestError;
      setGuest(guestData);

      // Haetaan hahmot
      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('*')
        .eq('assigned_guest_id', id);

      if (!charError && charData) {
        setMyCharacters(charData);
      }

      fetchMyPhotos(id);

    } catch (err) {
      console.error(err);
      setErrorMsg("Lippua ei löytynyt.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPhotos = async (guestId) => {
    const { data } = await supabase
      .from('live_posts')
      .select('*')
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false });
    if (data) setMyPhotos(data);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // --- SPLIT TOIMINTO (LAAJENNETTU: Linkitys + Loki) ---
  const handleActivateSpouse = async (spouseEmail) => {
    if (!guest || !guest.spouse_name) return;

    // 1. Etsi Avecin hahmo
    const spouseChar = myCharacters.find(c => c.is_spouse_character);
    if (!spouseChar) throw new Error("Avecin hahmoa ei löydy tai se on jo siirretty.");

    // 2. Luo uusi vieras
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

    // 3. Siirrä hahmo
    const { error: moveError } = await supabase
      .from('characters')
      .update({ assigned_guest_id: newGuest.id })
      .eq('id', spouseChar.id);

    if (moveError) throw moveError;

    // --- UUSI VAIHE 4: LUO LINKITYS (GUEST_SPLITS) ---
    const { error: splitError } = await supabase
      .from('guest_splits')
      .insert({
        parent_guest_id: guest.id,        // Matti
        child_guest_id: newGuest.id,      // Teppo
        transferred_character_id: spouseChar.id, // Reino
        original_spouse_name: guest.spouse_name
      });
    
    if (splitError) console.error("Virhe linkityksen luonnissa:", splitError);

    // --- UUSI VAIHE 5: KIRJAA LOKI (SYSTEM_LOGS) ---
    const { error: logError } = await supabase
      .from('system_logs')
      .insert({
        event_type: 'GUEST_SPLIT',
        target_id: guest.id,
        description: `Vieras ${guest.name} aktivoi avecin ${guest.spouse_name} (Uusi ID: ${newGuest.id})`,
        snapshot_data: { 
          parent_name: guest.name,
          child_name: newGuest.name,
          character_moved: spouseChar.name 
        }
      });

    if (logError) console.error("Virhe lokituksessa:", logError);

    // 6. Päivitä paikallinen tila
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

  const uploadPartyPhoto = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileName = `${guest.id}-${Date.now()}.${file.name.split('.').pop()}`; // Kuvat juureen

      const { error: uploadError } = await supabase.storage.from('party-photos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('party-photos').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('live_posts').insert({
          guest_id: guest.id,
          sender_name: guest.name,
          image_url: publicUrl,
          message: photoMessage
        });
      if (dbError) throw dbError;

      alert("Kuva lähetetty seinälle!");
      setPhotoMessage(''); 
      fetchMyPhotos(guest.id); 

    } catch (error) {
      alert("Virhe: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    if(!window.confirm("Poistetaanko kuva?")) return;
    await supabase.from('live_posts').delete().eq('id', photoId);
    fetchMyPhotos(guest.id);
  };

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
          {myCharacters.length === 0 ? (
            <section className="jc-card medium mb-2 ticket-loading" style={{ opacity: 0.7 }}>
              <div style={{ fontSize: '3rem' }}>🎭</div>
              <h3>Hahmoa ei vielä roolitettu</h3>
              <p>Odota hetki, Admin tekee taikojaan...</p>
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
          {/* --- UUSI KOMPONENTTI TÄSSÄ --- */}
          {/* Näytetään vain jos hahmoja on löytynyt */}
          {myCharacters.length > 0 && (
            <CharacterAcceptance 
               guestId={id} 
               characterCount={myCharacters.length} 
            />
          )}

          <GuestInfo 
            guest={guest}
            myCharacters={myCharacters} // VÄLITETÄÄN HAHMOT
            onActivateSpouse={handleActivateSpouse} // VÄLITETÄÄN FUNKTIO
            onSave={() => alert("Ota yhteys järjestäjään muutoksissa.")}
          />
        </>
      )}

      {activeTab === 'PHOTO' && (
        <PhotoFeed 
          myPhotos={myPhotos}
          photoMessage={photoMessage}
          setPhotoMessage={setPhotoMessage}
          onUpload={uploadPartyPhoto}
          onDelete={deletePhoto}
          uploading={uploading}
        />
      )}

    </div>
  );
}

export default TicketPage;