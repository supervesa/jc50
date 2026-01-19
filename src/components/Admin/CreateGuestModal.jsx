import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, X, UserPlus } from 'lucide-react';

const CreateGuestModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    spouse_name: '',
    dietary_restrictions: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // KORJAUS: Pakotetaan hasSpouse totuusarvoksi (true/false) Boolean-funktiolla
    // Aiemmin tämä palautti "" (tyhjä merkkijono), mikä rikkoi tietokannan boolean-kentän.
    const hasSpouse = Boolean(formData.spouse_name && formData.spouse_name.trim().length > 0);
    
    try {
        const { data, error } = await supabase.from('guests').insert([{
            name: formData.name,
            email: formData.email,
            spouse_name: hasSpouse ? formData.spouse_name : null,
            brings_spouse: hasSpouse,
            dietary_restrictions: formData.dietary_restrictions
        }]).select();
        
        if(error) throw error;
        
        // Tallennetaan loki
        await supabase.from('system_logs').insert({
            event_type: 'GUEST_CREATE',
            target_id: data[0].id,
            description: `Admin loi vieraan: ${data[0].name}`,
            snapshot_data: data[0]
        });

        onSuccess();
    } catch (err) { 
        console.error("Virhe tallennuksessa:", err);
        alert(err.message); 
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="jc-card modal-card" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <UserPlus size={24} color="var(--turquoise)" />
             <h2 className="jc-h2" style={{margin:0, fontSize:'1.5rem'}}>Lisää Vieras</h2>
          </div>
          <button onClick={onClose} className="btn-back" style={{background:'none', border:'none', color:'var(--muted)', cursor:'pointer'}}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="jc-form" style={{maxWidth:'100%'}}>
          
          <div className="jc-field">
            <label>Nimi *</label>
            <input required type="text" name="name" placeholder="Etu- ja sukunimi" value={formData.name} onChange={handleChange} className="jc-input" />
          </div>

          <div className="jc-field">
            <label>Sähköposti *</label>
            <input required type="email" name="email" placeholder="osoite@esimerkki.fi" value={formData.email} onChange={handleChange} className="jc-input" />
          </div>

          <div className="jc-field">
            <label style={{color: formData.spouse_name ? 'var(--plasma-gold)' : ''}}>Avecin nimi (Valinnainen)</label>
            <input 
              type="text" 
              name="spouse_name" 
              placeholder="Jätä tyhjäksi jos ei avecia" 
              value={formData.spouse_name} 
              onChange={handleChange} 
              className="jc-input"
              style={{borderColor: formData.spouse_name ? 'var(--plasma-gold)' : ''}}
            />
          </div>

          <div className="jc-field">
            <label>Erityisruokavaliot</label>
            <textarea name="dietary_restrictions" value={formData.dietary_restrictions} onChange={handleChange} className="jc-input" rows="3" />
          </div>

          <div style={{display:'flex', gap:'10px', marginTop:'1rem'}}>
            <button type="button" onClick={onClose} className="jc-btn outline" style={{flex:1}}>Peruuta</button>
            <button type="submit" className="jc-btn primary" style={{flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}} disabled={loading}>
              <Save size={18} /> {loading ? "Tallennetaan..." : "Tallenna"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateGuestModal;