import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
// 1. Poistetaan CSS-moduulien tuonti
// import styles from './RegistrationForm.module.css';

function RegistrationForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    spouse_name: '',
    dietary_restrictions: '',
  });
  const [bringsSpouse, setBringsSpouse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const dataToSubmit = {
      name: formData.name,
      email: formData.email,
      brings_spouse: bringsSpouse,
      spouse_name: bringsSpouse ? formData.spouse_name : null,
      dietary_restrictions: formData.dietary_restrictions || null,
    };

    const { error } = await supabase.from('guests').insert(dataToSubmit);

    if (error) {
      console.error('Virhe Supabaseen lähetyksessä:', error);
      setError(
        'Hups! Jokin meni pieleen ilmoittautumisessa. Yritä hetken päästä uudelleen.'
      );
      setIsLoading(false);
    } else {
      setIsLoading(false);
      onSuccess();
    }
  };

  return (
    // 2. Otetaan käyttöön .jc-form
    <form onSubmit={handleSubmit} className="jc-form">
      {/* Nimi */}
      {/* 3. Vaihdetaan .formGroup -> .jc-field */}
      <div className="jc-field">
        <label htmlFor="name">Nimesi</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      {/* Sähköposti */}
      <div className="jc-field">
        <label htmlFor="email">Sähköposti</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

   {/* --- TYYLIKÄS JA HILLITTY AVEC-VALINTA --- */}
      <div 
        className="jc-field" 
        style={{ 
          marginTop: '1.5rem',
          marginBottom: '1rem',
          // Poistetaan laatikkomaisuus, annetaan vain tilaa
          padding: '0.5rem 0'
        }}
      >
        <label 
          htmlFor="bringsSpouse" 
          className="jc-check"
          style={{ 
            fontSize: '1rem', 
            fontWeight: '500',
            // Väri on himmeä jos ei valittu, ja kirkas turkoosi jos valittu
            color: bringsSpouse ? 'var(--turquoise)' : 'rgba(255, 255, 255, 0.7)',
            transition: 'color 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <input
            type="checkbox"
            id="bringsSpouse"
            name="bringsSpouse"
            checked={bringsSpouse}
            onChange={(e) => setBringsSpouse(e.target.checked)}
          />
          
          {/* Valintaruutu: pidetään se tyylikkäänä */}
          <span className="box" style={{ 
            marginRight: '12px',
            // Jos valittu, laatikko hohtaa
            boxShadow: bringsSpouse ? '0 0 10px var(--turquoise)' : 'none',
            borderColor: bringsSpouse ? 'var(--turquoise)' : 'rgba(255,255,255,0.3)'
          }}></span>
          
          Ilmoitan itseni lisäksi toisen henkilön
        </label>
      </div>

      {/* Ehdollisesti näytettävä puolison nimi */}
      {/* Tämä tulee nätisti esiin animaatiolla */}
      {bringsSpouse && (
        <div className="jc-field" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <label htmlFor="spouse_name" style={{ color: 'var(--turquoise)', fontSize: '0.9rem' }}>
            Hänen nimensä
          </label>
          <input
            type="text"
            id="spouse_name"
            name="spouse_name"
            value={formData.spouse_name}
            onChange={handleChange}
            required
            placeholder="Etunimi Sukunimi"
            // Reuna on turkoosi korostaakseen yhteyttä yllä olevaan valintaan
            style={{ borderColor: 'var(--turquoise)' }}
          />
        </div>
      )}

      {/* Erityisruokavaliot */}
      <div className="jc-field">
        <label htmlFor="dietary_restrictions">
          Erityisruokavaliot ja allergiat
        </label>
        <textarea
          id="dietary_restrictions"
          name="dietary_restrictions"
          value={formData.dietary_restrictions}
          onChange={handleChange}
          rows="3"
        />
      </div>

      {/* Virheilmoitus (jos on) */}
      {/* 5. Vaihdetaan .errorText -> .jc-error */}
      {error && <p className="jc-error">{error}</p>}

      {/* Lähetysnappi */}
      {/* 6. Vaihdetaan .submitButton -> .jc-cta.primary */}
      <button type="submit" className="jc-cta primary mt-2" disabled={isLoading}>
        {isLoading ? 'Lähetetään...' : 'Vahvista paikkasi'}
      </button>
    </form>
  );
}

export default RegistrationForm;