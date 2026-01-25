import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const RelationList = ({ relationships, characters, onEdit, onDelete }) => {
  const [filter, setFilter] = useState('');

  const getCharName = (id) => characters.find(c => c.id === id)?.name || 'Tuntematon';

  // Suodatetaan lista
  const filteredList = relationships.filter(rel => {
    const n1 = getCharName(rel.char1_id).toLowerCase();
    const n2 = getCharName(rel.char2_id).toLowerCase();
    const search = filter.toLowerCase();
    return n1.includes(search) || n2.includes(search) || rel.description?.toLowerCase().includes(search);
  });

  const handleDelete = async (id) => {
    if(!window.confirm("Haluatko varmasti poistaa tämän suhteen?")) return;
    try {
      const { error } = await supabase.from('character_relationships').delete().eq('id', id);
      if (error) throw error;
      onDelete(); // Päivitä lista
    } catch(err) { alert(err.message); }
  };

  return (
    <div>
      {/* --- SUODATUS --- */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Etsi nimellä tai kuvauksella..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff' }}
        />
      </div>

      {/* --- LISTA (GRID/CARD) --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredList.map(rel => {
          const isEnemy = rel.relation_type === 'enemy';
          const isSpouse = rel.relation_type === 'spouse';
          const borderColor = isEnemy ? '#ff6b6b' : (isSpouse ? 'var(--magenta)' : 'var(--turquoise)');

          return (
            <div key={rel.id} style={{ 
              background: '#1a1a20', 
              borderLeft: `5px solid ${borderColor}`, 
              borderRadius: '4px',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative'
            }}>
              
              {/* HEADER: Hahmot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.1rem' }}>
                  <strong style={{ color: '#fff' }}>{getCharName(rel.char1_id)}</strong>
                  <span style={{ margin: '0 10px', color: '#666' }}>➜</span>
                  <strong style={{ color: '#fff' }}>{getCharName(rel.char2_id)}</strong>
                </div>
                
                {rel.is_essential && (
                  <span style={{ background: '#ffd700', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    TÄRKEÄ
                  </span>
                )}
              </div>

              {/* TYYPPI & KUVAUS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                 <span style={{ 
                   textTransform: 'uppercase', 
                   fontSize: '0.8rem', 
                   color: borderColor, 
                   border: `1px solid ${borderColor}`, 
                   padding: '2px 8px', 
                   borderRadius: '4px' 
                 }}>
                   {rel.relation_type}
                 </span>
                 <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.9rem' }}>
                   {rel.description || '- Ei kuvausta -'}
                 </span>
              </div>

              {/* CONTEXT PREVIEW (Jos on) */}
              {(rel.context_1_to_2 || rel.context_2_to_1) && (
                <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '5px', borderTop: '1px solid #333', paddingTop: '5px' }}>
                   {rel.context_1_to_2 && <div style={{ marginBottom: '2px' }}>📝 {getCharName(rel.char1_id)}: "{rel.context_1_to_2.substring(0, 60)}..."</div>}
                   {rel.context_2_to_1 && <div>📝 {getCharName(rel.char2_id)}: "{rel.context_2_to_1.substring(0, 60)}..."</div>}
                </div>
              )}

              {/* TOIMINNOT */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                 <button 
                   onClick={() => onEdit(rel)}
                   style={{ flex: 1, padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                 >
                   MUOKKAA
                 </button>
                 <button 
                   onClick={() => handleDelete(rel.id)}
                   style={{ flex: 1, padding: '8px', background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '4px', cursor: 'pointer' }}
                 >
                   POISTA
                 </button>
              </div>

            </div>
          );
        })}
        
        {filteredList.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Ei hakutuloksia.</div>}
      </div>
    </div>
  );
};

export default RelationList;