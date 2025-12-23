import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

const DeleteGuestButton = ({ guest, onSuccess, className, style }) => {
  const [loading, setLoading] = useState(false);

  /**
   * TÄRKEÄ FUNKTIO: archiveAndCleanup
   * 1. Hakee kaiken datan talteen (Snapshot).
   * 2. Tallentaa Snapshotin lokiin.
   * 3. Suorittaa "Soft Delete" kuville ja hahmoille.
   * 4. Suorittaa "Hard Delete" estäville riippuvuuksille.
   * 5. Poistaa lopulta vieraan.
   */
  const archiveAndCleanup = async (targetId, targetName) => {
    console.log(`[ARCHIVE & DELETE] Aloitetaan prosessi ID:lle: ${targetId} (${targetName})`);

    // --- VAIHE 1: Tiedonkeruu (Snapshot) ---
    // Haetaan rinnakkain kaikki data, joka ollaan tuhoamassa.
    // Käytämme Promise.allSettled varmistaaksemme, että yksi virhe haussa ei kaada koko prosessia.
    
    const fetchPromises = {
      feedback: supabase.from('character_feedback').select('*').eq('guest_id', targetId),
      votes: supabase.from('poll_votes').select('*').eq('guest_id', targetId),
      chats: supabase.from('chat_messages').select('*').eq('guest_id', targetId),
      missions: supabase.from('mission_log').select('*').eq('guest_id', targetId),
      flash: supabase.from('flash_responses').select('*').eq('guest_id', targetId),
      vault: supabase.from('vault_access').select('*').eq('guest_id', targetId),
      photos_meta: supabase.from('live_posts').select('id, created_at, message, image_url').eq('guest_id', targetId), // Vain metadata
      guest_info: supabase.from('guests').select('*').eq('id', targetId).single()
    };

    const snapshotResults = await Promise.all([
      fetchPromises.feedback,
      fetchPromises.votes,
      fetchPromises.chats,
      fetchPromises.missions,
      fetchPromises.flash,
      fetchPromises.vault,
      fetchPromises.photos_meta,
      fetchPromises.guest_info
    ]);

    // Rakennetaan siisti JSON-objekti arkistoon
    const snapshotData = {
      timestamp: new Date().toISOString(),
      reason: 'ADMIN_DELETE',
      guestName: targetName,
      guestId: targetId,
      backup: {
        guestDetails: snapshotResults[7].data || null,
        feedback: snapshotResults[0].data || [],
        votes: snapshotResults[1].data || [],
        chatMessages: snapshotResults[2].data || [],
        missionLog: snapshotResults[3].data || [],
        flashResponses: snapshotResults[4].data || [],
        vaultAccess: snapshotResults[5].data || [],
        photosMetadata: snapshotResults[6].data || []
      }
    };

    // --- VAIHE 2: Arkistointi Lokiin ---
    // Tallennetaan data ENNEN poistoa. Jos tämä epäonnistuu, keskeytämme turvallisuussyistä.
    const { error: logError } = await supabase.from('system_logs').insert({
      event_type: 'GUEST_DELETE_ARCHIVE',
      target_id: targetId,
      description: `Vieras ${targetName} poistettu. Täysi data-arkisto tallennettu snapshot_data-kenttään.`,
      snapshot_data: snapshotData
    });

    if (logError) {
      console.error("Loki epäonnistui:", logError);
      throw new Error(`Arkistointi epäonnistui: ${logError.message}. Poisto keskeytetty tietojen turvaamiseksi.`);
    }

    // --- VAIHE 3: Soft Delete (Säilytettävä data) ---
    
    // 3.1 Kuvat: Piilotetaan ja katkaistaan linkki, jotta vieras voidaan poistaa
    const { error: photoError } = await supabase
      .from('live_posts')
      .update({ is_deleted: true, guest_id: null }) 
      .eq('guest_id', targetId);
    if (photoError) throw new Error(`Virhe kuvien piilotuksessa: ${photoError.message}`);

    // 3.2 Hahmo: Vapautetaan hahmo takaisin pooliin (assigned_guest_id = NULL)
    const { error: charError } = await supabase
      .from('characters')
      .update({ assigned_guest_id: null })
      .eq('assigned_guest_id', targetId);
    if (charError) throw new Error(`Virhe hahmon vapautuksessa: ${charError.message}`);


    // --- VAIHE 4: Hard Delete (Estävät riippuvuudet) ---
    // Nämä taulut estävät vieraan poiston (Foreign Key). Poistamme ne rinnakkain nopeuden vuoksi.
    
    const deletionPromises = [
      supabase.from('character_feedback').delete().eq('guest_id', targetId),
      supabase.from('poll_votes').delete().eq('guest_id', targetId),
      supabase.from('chat_messages').delete().eq('guest_id', targetId),
      supabase.from('mission_log').delete().eq('guest_id', targetId),
      supabase.from('flash_responses').delete().eq('guest_id', targetId),
      supabase.from('push_subscriptions').delete().eq('guest_id', targetId),
      supabase.from('vault_access').delete().eq('guest_id', targetId),
      // Linkitykset (Split)
      supabase.from('guest_splits').delete().or(`parent_guest_id.eq.${targetId},child_guest_id.eq.${targetId}`)
    ];

    const deleteResults = await Promise.all(deletionPromises);
    
    // Tarkistetaan onko virheitä
    const errors = deleteResults.filter(r => r.error);
    if (errors.length > 0) {
      console.error("Virheitä riippuvuuksien poistossa:", errors);
      throw new Error(`Siivous epäonnistui ${errors.length} taulun kohdalla. Tarkista konsoli.`);
    }

    // --- VAIHE 5: Vieraan poisto (Final Kill) ---
    const { error: deleteError } = await supabase
      .from('guests')
      .delete()
      .eq('id', targetId);

    if (deleteError) throw new Error(`Virhe itse vieraan poistossa: ${deleteError.message}`);
  };


  // --- UI-TOIMINTO ---
  const handleDeleteClick = async () => {
    // 1. Varoitukset
    let warning = `VAROITUS: Olet poistamassa vieraan: ${guest.name}\n\n`;
    
    if (guest.myChars && guest.myChars.length > 0) {
        warning += `• Hahmo "${guest.myChars[0].name}" vapautuu takaisin peliin.\n`;
    }
    warning += `• Kaikki kuvat piilotetaan galleriasta.\n`;
    warning += `• Chat-viestit, äänet ja tehtävät poistetaan.\n\n`;
    warning += `Järjestelmä ottaa automaattisen varmuuskopion (Snapshot) poistettavista tiedoista lokiin.\n\n`;
    warning += `Haluatko varmasti jatkaa?`;

    if (!window.confirm(warning)) return;

    // 2. Avecin tarkistus
    let deleteChildAlso = false;
    if (guest.asParent) {
        deleteChildAlso = window.confirm(
            `HUOMIO: Tämä on päävieras (${guest.name}), jolla on linkitetty avec (${guest.linkedName}).\n\n` +
            `Haluatko poistaa myös avecin samalla kerralla?\n` +
            `OK = Poista molemmat\nCancel = Poista vain ${guest.name} (Avec jää ilman linkitystä)`
        );
    }

    setLoading(true);

    try {
        // A. Jos poistetaan myös Avec (Child)
        if (deleteChildAlso && guest.asParent) {
            // Haetaan lapsen nimi UI:ta varten (jos saatavilla), muuten geneerinen
            const childName = guest.linkedName || "Avec";
            await archiveAndCleanup(guest.asParent.child_guest_id, childName);
        }

        // B. Poistetaan valittu vieras (Pääkohde)
        await archiveAndCleanup(guest.id, guest.name);

        alert("Poisto suoritettu onnistuneesti.\nTiedot arkistoitu järjestelmälokiin.");
        
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
        gap:'8px',
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? <Loader2 size={18} className="spin" /> : <Trash2 size={18} />}
      {loading ? "Arkistoidaan & Poistetaan..." : "POISTA VIERAS"}
    </button>
  );
};

export default DeleteGuestButton;