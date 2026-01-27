import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import '../AgentPage.css'; 

const FlashMissionOverlay = ({ activeFlash, guestId, onComplete }) => {
  const [flashFile, setFlashFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFlashAction = async () => {
    if (!activeFlash) return;

    if (activeFlash.type === 'photo' && !flashFile) {
      alert("Ota ensin kuva!");
      return;
    }

    setUploading(true);
    let publicUrl = null;

    try {
      // 1. KUVAN LATAUS
      if (activeFlash.type === 'photo' && flashFile) {
        const fileExt = flashFile.name.split('.').pop();
        const fileName = `${guestId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('party-photos')
          .upload(fileName, flashFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('party-photos').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      // 2. TALLENNETAAN VASTAUS
      const responseData = { 
        flash_id: activeFlash.id, 
        guest_id: guestId,
        image_url: publicUrl 
      };
      
      if (!publicUrl) delete responseData.image_url;

      await supabase.from('flash_responses').insert(responseData);

      // 3. TALLENNETAAN XP JA LOGI
      await supabase.from('mission_log').insert({ 
        guest_id: guestId, 
        xp_earned: activeFlash.xp_reward, 
        proof_data: publicUrl ? JSON.stringify({ image: publicUrl }) : null,
        custom_reason: `Flash: ${activeFlash.title}`, 
        approval_status: 'approved' 
      });

      // 4. (UUSI) LISÄTÄÄN LIVEWALLILLE (Jos on kuva)
      if (publicUrl) {
        
        // A. Haetaan nopeasti hahmon nimi, jotta seinällä lukee esim. "AGENTTI RAAKEL" eikä "Flash Agent"
        const { data: charData } = await supabase
          .from('characters')
          .select('name')
          .eq('assigned_guest_id', guestId)
          .maybeSingle();

        const sender = charData?.name || 'Salainen Agentti';

        // B. Lähetetään LiveWallille
        await supabase.from('live_posts').insert({
          guest_id: guestId,
          sender_name: sender, 
          image_url: publicUrl,
          message: `FLASH: ${activeFlash.title}`, 
          is_visible: true, 
          status: 'approved',
          is_deleted: false,
          flag_type: 'flash',
          type: 'mission' // <--- TÄRKEÄ: Tämä ohjaa kuvan LiveWallin karuselliin, mutta pitää sen poissa PhotoWallista
        });
      }

      if (onComplete) onComplete();

    } catch (error) {
      console.error('Flash action error:', error);
      alert("Virhe lähetyksessä: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ap-flash-overlay">
      <div className="flash-content">
        <h2 className="blink">⚠️ HÄLYTYS ⚠️</h2>
        <h3>{activeFlash.title}</h3>
        <p>Palkkio: {activeFlash.xp_reward} XP</p>
        
        {activeFlash.type === 'race' && (
          <div className="flash-instruct">🏃 JUOKSE DJ:N LUOKSE!</div>
        )}

        {activeFlash.type === 'photo' && (
          <div className="flash-photo-section">
            {!flashFile ? (
              <label className="btn-camera">
                <span style={{fontSize: '2rem'}}>📸</span><br/>
                <span className="camera-text">NAPSAUTA KUVA TÄSTÄ</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  style={{display:'none'}} 
                  onChange={(e) => {
                    if(e.target.files && e.target.files.length > 0) {
                      setFlashFile(e.target.files[0]);
                    }
                  }} 
                />
              </label>
            ) : (
              <div className="photo-preview-box">
                 <div className="success-text">✔ KUVA VALMIINA</div>
                 <button 
                   onClick={() => setFlashFile(null)}
                   className="btn-retake"
                 >
                   ❌ Ota uusi kuva
                 </button>
              </div>
            )}
          </div>
        )}
        
        <button 
          className="flash-btn-action" 
          onClick={handleFlashAction}
          disabled={uploading || (activeFlash.type === 'photo' && !flashFile)}
          style={{
            opacity: (activeFlash.type === 'photo' && !flashFile) ? 0.5 : 1,
            background: uploading ? '#555' : 'red'
          }}
        >
          {uploading ? 'LÄHETETÄÄN...' : 
           activeFlash.type === 'mob' ? '✋ OLEN PAIKALLA!' : 
           activeFlash.type === 'race' ? '🏁 MAALISSA!' : 
           activeFlash.type === 'photo' ? '📤 LÄHETÄ & KUITTAA' :
           '✅ KUITTAA TEHTYKSI'}
        </button>
      </div>
    </div>
  );
};

export default FlashMissionOverlay;