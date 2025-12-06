import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './TicketPage.css'; // Tyylit

// Komponentit
import TicketHeader from './TicketHeader';
import CharacterCard from './CharacterCard';
import GuestInfo from './GuestInfo';
import PhotoFeed from './PhotoFeed';

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
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', dietary_restrictions: '', brings_spouse: false, spouse_name: '' });
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
      
      setFormData({
        name: guestData.name,
        dietary_restrictions: guestData.dietary_restrictions || '',
        brings_spouse: guestData.brings_spouse,
        spouse_name: guestData.spouse_name || ''
      });

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

  // --- TOIMINNOT ---
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
      const fileName = `${guest.id}-${Date.now()}.${file.name.split('.').pop()}`;

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

  const handleSaveGuestInfo = async () => {
    try {
      const { error } = await supabase.from('guests').update({
          name: formData.name,
          dietary_restrictions: formData.dietary_restrictions,
          brings_spouse: formData.brings_spouse,
          spouse_name: formData.brings_spouse ? formData.spouse_name : null
        }).eq('id', id);

      if (error) throw error;
      setGuest({ ...guest, ...formData });
      setIsEditing(false);
      alert("Tiedot päivitetty!");
    } catch (err) {
      alert("Virhe: " + err.message);
    }
  };

  if (loading) return <div className="ticket-wrapper ticket-loading">Ladataan...</div>;
  if (errorMsg) return <div className="ticket-wrapper ticket-error">{errorMsg}</div>;

  return (
    <div className="jc-wrapper ticket-wrapper">
      
      <TicketHeader 
        id={id} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {activeTab === 'IDENTITY' && (
        <>
          {myCharacters.length === 0 ? (
            <section className="jc-card medium mb-2 ticket-loading" style={{ opacity: 0.7 }}>
              <div style={{ fontSize: '3rem' }}>🔒</div>
              <h3>Identiteettiä luodaan...</h3>
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

          <GuestInfo 
            guest={guest}
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            onSave={handleSaveGuestInfo}
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