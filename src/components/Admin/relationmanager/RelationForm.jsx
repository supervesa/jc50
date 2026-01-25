import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const RelationForm = ({ characters, editingRelation, onCancel, onSave }) => {
  
  const initialFormState = {
    char1_id: '',
    char2_id: '',
    relation_type: 'friend',
    description: '', // Yleinen kuvaus
    context_1_to_2: '', // Mitä Char 1 ajattelee Char 2:sta
    context_2_to_1: '', // Mitä Char 2 ajattelee Char 1:stä
    is_essential: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  // Jos muokkaustila, täytä lomake
  useEffect(() => {
    if (editingRelation) {
      setFormData({
        char1_id: editingRelation.char1_id,
        char2_id: editingRelation.char2_id,
        relation_type: editingRelation.relation_type || 'friend',
        description: editingRelation.description || '',
        context_1_to_2: editingRelation.context_1_to_2 || '',
        context_2_to_1: editingRelation.context_2_to_1 || '',
        is_essential: editingRelation.is_essential || false
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingRelation]);

  // Apufunktio nimien näyttämiseen dynaamisissa labeleissa
  const getName = (id) => characters.find(c => c.id === id)?.name || 'Hahmo';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.char1_id === formData.char2_id) return alert("Hahmo ei voi olla suhteessa itsensä kanssa.");
    if (!formData.char1_id || !formData.char2_id) return alert("Valitse molemmat hahmot.");

    setLoading(true);
    try {
      if (editingRelation) {
        // UPDATE
        const { error } = await supabase
          .from('character_relationships')
          .update(formData)
          .eq('id', editingRelation.id);
        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase
          .from('character_relationships')
          .insert([formData]);
        if (error) throw error;
      }
      onSave(); // Kutsu parentin callbackia
    } catch (err) {
      alert("Virhe tallennuksessa: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    background: '#111',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '6px',
    marginBottom: '15px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    color: '#aaa',
    fontSize: '0.9rem'
  };

  return (
    <div className="jc-card" style={{ background: '#1a1a20', padding: '20px', maxWidth: '800px' }}>
      <h3 className="jc-h3" style={{ marginBottom: '20px', color: 'var(--turquoise)' }}>
        {editingRelation ? 'Muokkaa Relaatiota' : 'Luo Uusi Relaatio'}
      </h3>

      <form onSubmit={handleSubmit}>
        
        {/* --- HAHMOT (Lukitaan muokkauksessa sekaannusten välttämiseksi, tai voi pitää auki) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={labelStyle}>Hahmo 1 (Aloittaja)</label>
            <select 
              style={inputStyle} 
              value={formData.char1_id} 
              onChange={e => setFormData({...formData, char1_id: e.target.value})}
              disabled={!!editingRelation} // Estä ID-vaihto muokkauksessa jos halutaan pitää simppelinä
            >
              <option value="">Valitse...</option>
              {characters.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Hahmo 2 (Kohde)</label>
            <select 
              style={inputStyle} 
              value={formData.char2_id} 
              onChange={e => setFormData({...formData, char2_id: e.target.value})}
              disabled={!!editingRelation}
            >
              <option value="">Valitse...</option>
              {characters.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- PERUSTIEDOT --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', alignItems: 'center' }}>
          <div>
            <label style={labelStyle}>Suhteen Tyyppi</label>
            <select 
              style={inputStyle} 
              value={formData.relation_type} 
              onChange={e => setFormData({...formData, relation_type: e.target.value})}
            >
               <option value="friend">Ystävä</option>
               <option value="spouse">Puoliso</option>
               <option value="relative">Sukulainen</option>
               <option value="enemy">Vihollinen</option>
               <option value="business">Bisnes</option>
               <option value="lover">Rakastaja</option>
               <option value="neighbor">Naapuri</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_essential} 
                  onChange={e => setFormData({...formData, is_essential: e.target.checked})}
                  style={{ width: '20px', height: '20px' }}
                />
                <span>Tärkeä / Keskeinen juoni? (is_essential)</span>
             </label>
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
           <label style={labelStyle}>Yleinen Kuvaus / Otsikko (Description)</label>
           <input 
             type="text" 
             style={inputStyle}
             value={formData.description}
             onChange={e => setFormData({...formData, description: e.target.value})}
             placeholder="Lyhyt otsikko suhteelle..."
           />
        </div>

        {/* --- KONTEKSTIT (UUDET KENTÄT) --- */}
        <div style={{ background: '#252530', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #444' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#ddd', fontSize: '1rem' }}>Syvempi Konteksti</h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{...labelStyle, color: 'var(--turquoise)'}}>
              Mitä <strong>{formData.char1_id ? getName(formData.char1_id) : 'Hahmo 1'}</strong> ajattelee toisesta? (Context 1 to 2)
            </label>
            <textarea 
              style={{...inputStyle, minHeight: '80px', marginBottom: 0}}
              value={formData.context_1_to_2}
              onChange={e => setFormData({...formData, context_1_to_2: e.target.value})}
              placeholder="Kirjoita hahmon 1 näkökulma..."
            />
          </div>

          <div>
            <label style={{...labelStyle, color: 'var(--magenta)'}}>
              Mitä <strong>{formData.char2_id ? getName(formData.char2_id) : 'Hahmo 2'}</strong> ajattelee toisesta? (Context 2 to 1)
            </label>
            <textarea 
              style={{...inputStyle, minHeight: '80px', marginBottom: 0}}
              value={formData.context_2_to_1}
              onChange={e => setFormData({...formData, context_2_to_1: e.target.value})}
              placeholder="Kirjoita hahmon 2 näkökulma..."
            />
          </div>
        </div>

        {/* --- BUTTONS --- */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            className="jc-btn" 
            style={{ flex: 1, padding: '12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
          >
            {loading ? 'Tallennetaan...' : 'TALLENNA'}
          </button>
          
          <button 
            type="button" 
            onClick={onCancel}
            className="jc-btn" 
            style={{ flex: 1, padding: '12px', background: '#555', color: '#fff', border: 'none', borderRadius: '6px' }}
          >
            PERUUTA
          </button>
        </div>

      </form>
    </div>
  );
};

export default RelationForm;