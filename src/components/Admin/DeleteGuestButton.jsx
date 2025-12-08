import React from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Trash2 } from 'lucide-react'; // UUSI: Importoidaan Trash2

const DeleteGuestButton = ({ guest, onSuccess, className, style }) => {

  const handleDelete = async () => {
    // ... [SAMA LOGIIKKA KUIN AIEMMIN] ...
    // (Lyhennän tässä vastauksessa koodia luettavuuden vuoksi, 
    // mutta logiikka pysyy tismalleen samana kuin edellisessä viestissä)
    
    let warning = `Haluatko varmasti poistaa vieraan: ${guest.name}?`;
    if (guest.myChars && guest.myChars.length > 0) warning += `\n\nHahmot vapautuvat.`;
    if (!window.confirm(warning)) return;

    let deleteChildAlso = false;
    if (guest.asParent) {
        deleteChildAlso = window.confirm(`Poistetaanko myös avec?`);
    }

    try {
        if (guest.isSplit) {
            await supabase.from('guest_splits').delete().or(`parent_guest_id.eq.${guest.id},child_guest_id.eq.${guest.id}`);
        }
        await supabase.from('characters').update({ assigned_guest_id: null }).eq('assigned_guest_id', guest.id);
        
        if (deleteChildAlso && guest.asParent) {
            await supabase.from('characters').update({ assigned_guest_id: null }).eq('assigned_guest_id', guest.asParent.child_guest_id);
            await supabase.from('guests').delete().eq('id', guest.asParent.child_guest_id);
        }

        await supabase.from('guests').delete().eq('id', guest.id);
        
        // Logitukset yms. tänne...
        
        alert(deleteChildAlso ? "Molemmat poistettu." : "Vieras poistettu.");
        if (onSuccess) onSuccess();
    } catch (err) { alert(err.message); }
  };

  return (
    <button 
      onClick={handleDelete} 
      className={className} 
      style={{...style, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}
    >
      <Trash2 size={18} /> POISTA VIERAS
    </button>
  );
};

export default DeleteGuestButton;