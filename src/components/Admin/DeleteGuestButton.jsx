import React from 'react';
import { supabase } from '../../lib/supabaseClient';

const DeleteGuestButton = ({ guest, onSuccess, className, style }) => {

  const handleDelete = async () => {
    // VAIHE 1: Perusvarmistus
    let warning = `Haluatko varmasti poistaa vieraan: ${guest.name}?`;
    
    if (guest.myChars && guest.myChars.length > 0) {
      warning += `\n\nHahmot (${guest.myChars.map(c => c.name).join(', ')}) vapautuvat takaisin peliin.`;
    }

    if (!window.confirm(warning)) return;

    // VAIHE 2: Avecin käsittely (Vain jos guest on Parent)
    let deleteChildAlso = false;
    
    if (guest.asParent) {
      const childName = guest.childName || "Avec";
      // Confirm: OK = True, Cancel = False
      deleteChildAlso = window.confirm(
        `Tämä vieras on linkitetty aveciin: ${childName}.\n\n` +
        `Paina OK, jos haluat poistaa MYÖS avecin (${childName}) ja vapauttaa hänen hahmonsa.\n` +
        `Paina Peruuta (Cancel), jos haluat poistaa VAIN päävieraan (avec jää ilman linkkiä).`
      );
    }

    try {
      // A. Lokitetaan aie
      await supabase.from('system_logs').insert({
        event_type: 'GUEST_DELETE',
        target_id: guest.id,
        description: `Admin poisti vieraan: ${guest.name}. Avec poistettu: ${deleteChildAlso ? 'KYLLÄ' : 'EI'}`,
        snapshot_data: guest
      });

      // B. Poistetaan linkitykset (Splits) ENNEN vieraan poistoa
      // Tämä estää Foreign Key -virheet
      const { error: splitError } = await supabase
        .from('guest_splits')
        .delete()
        .or(`parent_guest_id.eq.${guest.id},child_guest_id.eq.${guest.id}`);
      
      if (splitError) throw new Error("Linkityksen poisto epäonnistui: " + splitError.message);

      // C. Vapautetaan Päävieraan hahmot
      const { error: mainCharError } = await supabase
        .from('characters')
        .update({ assigned_guest_id: null })
        .eq('assigned_guest_id', guest.id);
        
      if (mainCharError) throw new Error("Hahmojen vapautus epäonnistui: " + mainCharError.message);

      // D. Jos käyttäjä valitsi myös avecin poiston
      if (deleteChildAlso && guest.asParent) {
        const childId = guest.asParent.child_guest_id;

        // 1. Vapauta Avecin hahmot
        const { error: childCharError } = await supabase
          .from('characters')
          .update({ assigned_guest_id: null })
          .eq('assigned_guest_id', childId);
        if (childCharError) throw new Error("Avecin hahmojen vapautus epäonnistui.");

        // 2. Poista Avec
        const { error: childError } = await supabase.from('guests').delete().eq('id', childId);
        if (childError) throw new Error("Avecin poisto epäonnistui: " + childError.message);
      }

      // E. Lopuksi poistetaan itse valittu vieras
      const { error } = await supabase.from('guests').delete().eq('id', guest.id);
      if (error) throw error;

      // Valmis -> Kutsu callbackia (päivittää listan)
      alert(deleteChildAlso ? "Sekä päävieras että avec poistettu." : "Vieras poistettu.");
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error(err);
      alert("Virhe poistossa: " + err.message);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      className={className} 
      style={style}
    >
      🗑️ POISTA VIERAS
    </button>
  );
};

export default DeleteGuestButton;