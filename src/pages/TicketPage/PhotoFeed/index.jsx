import React, { useState, useEffect } from 'react';
// Polku korjattu kansiorakenteen muutoksen vuoksi
import { supabase } from '../../../lib/supabaseClient'; 
import { Camera, Image as ImageIcon } from 'lucide-react';
import '../TicketPage.css'; 

import { PhotoStudio } from './PhotoStudio';
import { PhotoHistory } from './PhotoHistory';
import { useGameConfig } from '../../AgentPage/hooks/useGameConfig'; // Korjattu polku

function PhotoFeed() {
  // --- STATES ---
  const [selectedImage, setSelectedImage] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Identity & History
  const [identityName, setIdentityName] = useState('');
  const [identityId, setIdentityId] = useState(null);
  const [myPhotos, setMyPhotos] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- UUSI: HAETAAN PELIN TILA ---
  // Tämä rivi korjaa ReferenceError: Can't find variable: phaseValue -virheen
  const { phaseValue } = useGameConfig(identityId);

  // --- 1. TUNNISTA KÄYTTÄJÄ ---
  useEffect(() => {
    const identifyUser = async () => {
      const urlPath = window.location.pathname;
      const uuidMatch = urlPath.match(/([0-9a-fA-F-]{36})/);
      
      let currentGuestId = null;

      if (uuidMatch) {
        currentGuestId = uuidMatch[0];
        setIdentityId(currentGuestId);
        
        const { data } = await supabase
          .from('characters')
          .select('name')
          .eq('assigned_guest_id', currentGuestId)
          .single();

        if (data && data.name) {
          setIdentityName(data.name);
          localStorage.setItem('jc_username', data.name);
        }
      }

      // Jos käyttäjä tunnistettiin, haetaan hänen kuvansa
      if (currentGuestId) {
        fetchUserHistory(currentGuestId);
      }
    };
    identifyUser();
  }, []);

  // --- API TOIMINNOT ---
  const fetchUserHistory = async (guestId) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('live_posts')
      .select('*')
      .eq('guest_id', guestId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    if (data) setMyPhotos(data);
    setLoadingHistory(false);
  };

  const handlePost = async (blob, message) => {
    if (!blob) return;
    setUploading(true);

    try {
      const fileName = `${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('party-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('party-photos')
        .getPublicUrl(fileName);

      let senderName = identityName || localStorage.getItem('jc_username') || 'Tuntematon';

      const { error: dbError } = await supabase
        .from('live_posts')
        .insert({
          image_url: publicUrl,
          message: message || '',
          sender_name: senderName,
          guest_id: identityId, 
          status: 'approved',
          hot_count: 0,
          is_deleted: false
        });

      if (dbError) throw dbError;

      setShowSuccess(true);
      if(identityId) fetchUserHistory(identityId); 

    } catch (error) {
      console.error(error);
      alert("Lähetys epäonnistui!");
    } finally {
      setUploading(false);
    }
  };

  // --- FILE HANDLING ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        // Kun kuva on luettu, nollataan edellinen success-tila ja avataan studio
        setShowSuccess(false);
        setSelectedImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const closeStudio = () => {
    setSelectedImage(null);
    setShowSuccess(false);
  };

  // --- ACTIONS (DELETE, SHARE, DOWNLOAD) ---
  const handleSoftDelete = async (photoId) => {
    // 1. Optimistic Update: Poistetaan kuva näkyvistä heti ilman varmistusta
    setMyPhotos(prev => prev.filter(p => p.id !== photoId));

    // 2. Hiljainen päivitys tietokantaan
    const { error } = await supabase
      .from('live_posts')
      .update({ is_deleted: true })
      .eq('id', photoId);

    if (error) {
      console.error("Virhe poistettaessa (tausta):", error);
      // Jos tuli virhe, haetaan lista uudelleen varmuuden vuoksi
      if(identityId) fetchUserHistory(identityId);
    }
    // Ei alert-ilmoituksia tai confirmaatioita
  };

  const handleShare = async (photo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Party Photo',
          text: photo.message || 'Katso tätä kuvaa!',
          url: photo.image_url
        });
      } catch (err) {
        console.log('Jako peruttiin', err);
      }
    } else {
      navigator.clipboard.writeText(photo.image_url);
      alert("Linkki kopioitu leikepöydälle!");
    }
  };

  const handleDownload = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `party-photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      window.open(imageUrl, '_blank');
    }
  };

  // --- RENDER ---

  // Jos kuva on valittu, näytetään Studio
  if (selectedImage) {
    return (
      <PhotoStudio
        imageSrc={selectedImage}
        identityName={identityName}
        onCancel={closeStudio}
        onSend={handlePost}
        uploading={uploading}
        uploadSuccess={showSuccess}
        phaseValue={phaseValue} // Kytketään Sentinel-logiikka
      />
    );
  }

  // Muuten näytetään Feed ja Napit
  return (
   <div id="photo-feed" className="feed-container">
      <div className="upload-card">
        <h2 style={{margin:'0 0 10px 0', fontSize:'1.5rem'}}>
            {identityName ? `Moi, ${identityName}! 📸` : '📸 Juhlafeed'}
        </h2>
        
        <div className="action-buttons-row">
          <label className="upload-btn-label primary">
            <Camera size={24} /> 
            <span>Ota kuva</span>
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>

          <label className="upload-btn-label secondary">
            <ImageIcon size={24} /> 
            <span>Kirjasto</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
        </div>
        
        <div style={{marginTop: '15px', marginBottom: '15px'}}>
            <a href={identityId ? `/wall/${identityId}` : '/wall'} className="wall-link">
                🍿 Katso valokuvaseinää &rarr;
            </a>
        </div>
      </div>

      {identityId && (
        <PhotoHistory 
          photos={myPhotos}
          loading={loadingHistory}
          onDelete={handleSoftDelete}
          onShare={handleShare}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}

export default PhotoFeed;