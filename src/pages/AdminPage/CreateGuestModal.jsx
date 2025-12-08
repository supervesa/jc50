import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const CreateGuestModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    spouse_name: '',
    dietary_restrictions: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Logiikka: Jos avecin nimi on annettu, brings_spouse on true
    const hasSpouse = formData.spouse_name && formData.spouse_name.trim().length > 0;

    const newGuest = {
      name: formData.name,
      email: formData.email,
      spouse_name: hasSpouse ? formData.spouse_name : null,
      brings_spouse: hasSpouse,
      dietary_restrictions: formData.dietary_restrictions
    };

    try {
      // 1. Insert Guests-tauluun
      const { data, error } = await supabase
        .from('guests')
        .insert([newGuest])
        .select();

      if (error) throw error;

      const createdGuest = data[0];

      // 2. Lokitetaan tapahtuma
      await supabase.from('system_logs').insert({
        event_type: 'GUEST_CREATE',
        target_id: createdGuest.id,
        description: `Admin loi uuden vieraan: ${createdGuest.name} (Avec: ${hasSpouse ? 'Kyllä' : 'Ei'})`,
        snapshot_data: createdGuest
      });

      // 3. Valmis
      alert("Vieras lisätty onnistuneesti!");
      onSuccess(); // Sulkee modaalin ja päivittää listan
      
    } catch (err) {
      alert("Virhe lisäyksessä: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="jc-card modal-card" onClick={e => e.stopPropagation()}>
        
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
          <h2 className="jc-h2" style={{margin:0, fontSize:'1.5rem'}}>Lisää Vieras</h2>
          <button onClick={onClose} className="btn-back" style={{fontSize:'1.5rem'}}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="jc-form" style={{maxWidth:'100%'}}>
          
          <div className="jc-field">
            <label>Nimi *</label>
            <input 
              required
              type="text" 
              name="name"
              placeholder="Etu- ja sukunimi"
              value={formData.name}
              onChange={handleChange}
              className="jc-input-custom" 
            />
          </div>

          <div className="jc-field">
            <label>Sähköposti *</label>
            <input 
              required
              type="email" 
              name="email"
              placeholder="osoite@esimerkki.fi"
              value={formData.email}
              onChange={handleChange}
              className="jc-input-custom" 
            />
          </div>

          <div className="jc-field">
            <label style={{color:'var(--plasma-gold)'}}>Avecin nimi (Valinnainen)</label>
            <input 
              type="text" 
              name="spouse_name"
              placeholder="Jätä tyhjäksi jos ei avecia"
              value={formData.spouse_name}
              onChange={handleChange}
              className="jc-input-custom"
              style={{borderColor: formData.spouse_name ? 'var(--plasma-gold)' : ''}}
            />
            {formData.spouse_name && (
              <div className="small" style={{color:'var(--plasma-gold)', marginTop:'5px'}}>
                 ✅ Merkitään automaattisesti "Tuo puolison"
              </div>
            )}
          </div>

          <div className="jc-field">
            <label>Erityisruokavaliot</label>
            <textarea 
              name="dietary_restrictions"
              placeholder="Allergiat, gluteeniton, jne..."
              value={formData.dietary_restrictions}
              onChange={handleChange}
              className="jc-input-custom"
              rows="3"
            />
          </div>

          <div style={{display:'flex', gap:'10px', marginTop:'1rem'}}>
            <button 
              type="button" 
              onClick={onClose} 
              className="jc-cta ghost"
              style={{flex:1}}
            >
              Peruuta
            </button>
            <button 
              type="submit" 
              className="jc-cta primary"
              style={{flex:2}}
              disabled={loading}
            >
              {loading ? "Tallennetaan..." : "💾 Tallenna Vieras"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateGuestModal;