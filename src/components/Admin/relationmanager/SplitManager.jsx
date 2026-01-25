import React from 'react';
import { supabase } from '../../../lib/supabaseClient';

const SplitManager = ({ splits, characters, onUpdate }) => {

  const getCharNameByGuestId = (guestId) => characters.find(c => c.assigned_guest_id === guestId)?.name || 'Tuntematon (ID)';

  const toggleSplitGroup = async (split) => {
    try {
      // is_grouped default on TRUE (null = true).
      // Jos nykyinen !== false (eli true tai null), uusi on FALSE.
      const currentVal = split.is_grouped !== false; 
      const newVal = !currentVal;

      const { error } = await supabase
        .from('guest_splits')
        .update({ is_grouped: newVal })
        .eq('id', split.id);

      if (error) throw error;
      onUpdate();
    } catch(err) { alert("Virhe päivityksessä: " + err.message); }
  };

  return (
    <div>
      <div style={{ background: '#222', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #aaa' }}>
        <h4 style={{ margin: 0, color: '#fff' }}>Viralliset Avec-tiedot</h4>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#aaa' }}>
          Tämä data tulee suoraan lipunmyynnistä. Voit ainoastaan määrittää, näkyvätkö he Nexuksessa "pariskuntana" (yhdessä laatikossa) vai erillisinä.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {splits.map(split => {
          const isGrouped = split.is_grouped !== false; // True by default
          
          return (
            <div key={split.id} style={{ 
              background: '#15151a', 
              padding: '15px', 
              borderRadius: '6px', 
              display: 'flex', 
              flexDirection: 'column', // Mobiili ensin: pystysuunta
              gap: '10px',
              border: '1px solid #333'
            }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                 <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{getCharNameByGuestId(split.parent_guest_id)}</strong>
                 <span style={{ color: '#555' }}>&</span>
                 <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{getCharNameByGuestId(split.child_guest_id)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                 <span style={{ fontSize: '0.8rem', color: '#666' }}>Alkuperäinen: {split.original_spouse_name}</span>
                 
                 <button 
                    onClick={() => toggleSplitGroup(split)}
                    style={{
                      padding: '8px 15px',
                      borderRadius: '20px',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      background: isGrouped ? 'var(--magenta)' : '#333',
                      color: isGrouped ? '#000' : '#888',
                      boxShadow: isGrouped ? '0 0 10px var(--magenta)' : 'none',
                      transition: 'all 0.3s'
                    }}
                 >
                    {isGrouped ? 'YHDESSÄ (BOX)' : 'ERILLÄÄN'}
                 </button>
              </div>
            </div>
          );
        })}
        {splits.length === 0 && <div style={{ color: '#666', padding: '20px' }}>Ei split-tietoja.</div>}
      </div>
    </div>
  );
};

export default SplitManager;