import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Trash2, Loader2 } from 'lucide-react';

const DeleteGuestButton = ({ guest, onSuccess, className, style }) => {
  const [loading, setLoading] = useState(false);

  /**
   * archiveAndCleanup
   * Suorittaa yhden vieraan poiston, arkistoinnin ja hahmon vapautuksen.
   */
  const archiveAndCleanup = async (targetId, targetName) => {
    console.log(`[ARCHIVE & DELETE] Aloitetaan: ${targetId} (${targetName})`);

    // --- 1. TIEDONKERUU (Snapshot arkistoon) ---
    const fetchPromises = {
      feedback: supabase.from('character_feedback').select('*').eq('guest_id', targetId),
      votes: supabase.from('poll_votes').select('*').eq('guest_id', targetId),
      chats: supabase.from('chat_messages').select('*').eq('guest_id', targetId),
      missions: supabase.from('mission_log').select('*').eq('guest_id', targetId),
      flash: supabase.from('flash_responses').select('*').eq('guest_id', targetId),
      vault: supabase.from('vault_access').select('*').eq('guest_id', targetId),
      photos_meta: supabase.from('live_posts').select('id, created_at, message, image_url').eq('guest_id', targetId),
      guest_info: supabase.from('guests').select('*').eq('id', targetId).single()
    };

    const results = await Promise.all([
      fetchPromises.feedback, fetchPromises.votes, fetchPromises.chats,
      fetchPromises.missions, fetchPromises.flash, fetchPromises.vault,
      fetchPromises.photos_meta, fetchPromises.guest_info
    ]);

    const snapshotData = {
      timestamp: new Date().toISOString(),
      reason: 'ADMIN_DELETE',
      guestName: targetName,
      guestId: targetId,
      backup: {
        guestDetails: results[7].data || null,
        feedback: results[0].data || [],
        votes: results[1].data || [],
        chatMessages: results[2].data || [],
        missionLog: results[3].data || [],
        flashResponses: results[4].data || [],
        vaultAccess: results[5].data || [],
        photosMetadata: results[6].data || []
      }
    };

    // --- 2. ARKISTOINTI JÄRJESTELMÄLOKIIN ---
    const { error: logError } = await supabase.from('system_logs').insert({
      event_type: 'GUEST_DELETE_ARCHIVE',
      target_id: targetId,
      description: `Vieras ${targetName} poistettu. Hahmo vapautettu ja data arkistoitu.`,
      snapshot_data: snapshotData
    });

    if (logError) throw new Error(`Arkistointi epäonnistui: ${logError.message}`);

    // --- 3. HAHMON VAPAUTUS (KORJATTU) ---
    // Asetetaan ID tyhjäksi, is_assigned falseksi JA status 'vapaa'
    const { error: charError } = await supabase
      .from('characters')
      .update({ 
        assigned_guest_id: null, 
        is_assigned: false,
        status: 'vapaa' 
      })
      .eq('assigned_guest_id', targetId);

    if (charError) console.error("Hahmon vapautus epäonnistui:", charError);

    // --- 4. RIIPPUVUUKSIEN POISTO (Hard Delete) ---
    const deletionPromises = [
      supabase.from('character_feedback').delete().eq('guest_id', targetId),
      supabase.from('poll_votes').delete().eq('guest_id', targetId),
      supabase.from('chat_messages').delete().eq('guest_id', targetId),
      supabase.from('mission_log').delete().eq('guest_id', targetId),
      supabase.from('flash_responses').delete().eq('guest_id', targetId),
      supabase.from('push_subscriptions').delete().eq('guest_id', targetId),
      supabase.from('vault_access').delete().eq('guest_id', targetId),
      supabase.from('guest_splits').delete().or(`parent_guest_id.eq.${targetId},child_guest_id.eq.${targetId}`)
    ];

    await Promise.all(deletionPromises);

    // 4.1 Kuvien linkityksen katkaisu (Soft delete metadataan)
    await supabase.from('live_posts').update({ guest_id: null, is_deleted: true }).eq('guest_id', targetId);

    // --- 5. VIERAAN POISTO ---
    const { error: deleteError } = await supabase.from('guests').delete().eq('id', targetId);
    if (deleteError) throw new Error(`Vieraan poisto epäonnistui: ${deleteError.message}`);
  };

  /**
   * UI-Logiikka
   */
  const handleDeleteClick = async () => {
    let warning = `VAROITUS: Olet poistamassa vieraan: ${guest.name}\n\n`;
    warning += `• Hahmo vapautuu takaisin muiden valittavaksi.\n`;
    warning += `• Kaikki viestit ja tehtävät poistetaan.\n`;
    warning += `• Järjestelmä tekee automaattisen arkiston lokiin.\n\n`;
    warning += `Haluatko varmasti jatkaa?`;

    if (!window.confirm(warning)) return;

    // TARKISTUS: Avec-poisto (isParent, childId ja childName tulevat GuestListin datasta)
    let deleteAvecToo = false;
    if (guest.isParent && guest.childId) {
      deleteAvecToo = window.confirm(
        `Vieraalla on linkitetty avec: ${guest.childName}.\n\nPoistetaanko myös avec samalla kerralla?`
      );
    }

    setLoading(true);

    try {
      // 1. Jos haluttiin poistaa avec, tehdään se ensin
      if (deleteAvecToo && guest.childId) {
        await archiveAndCleanup(guest.childId, guest.childName);
      }

      // 2. Poistetaan päävieras
      await archiveAndCleanup(guest.id, guest.name);

      alert("Poisto suoritettu onnistuneesti.\nHahmo on nyt vapaa ja tiedot on arkistoitu.");
      
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("Critical Delete Error:", err);
      alert("VIRHE POISTOSSA:\n" + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDeleteClick} 
      className={className} 
      disabled={loading}
      style={{
        ...style, 
        display:'flex', 
        alignItems:'center', 
        justifyContent:'center', 
        gap:'8px'
      }}
    >
      {loading ? <Loader2 size={18} className="spin" /> : <Trash2 size={18} />}
      {loading ? "Arkistoidaan..." : "POISTA VIERAS"}
    </button>
  );
};

export default DeleteGuestButton;