import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

function RegistrationForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    spouse_name: '',
    dietary_restrictions: '',
  });
  const [bringsSpouse, setBringsSpouse] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null); // Tietokantavirheet
  const [validationErrors, setValidationErrors] = useState({}); // Lomakevirheet

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Nollataan kyseisen kentän virhe heti kun käyttäjä alkaa korjata sitä
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Validointilogiikka
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Nimi
    if (!formData.name.trim()) {
      errors.name = "Nimi on pakollinen tieto.";
      isValid = false;
    }

    // Sähköposti (yksinkertainen tarkistus: sisältää @ ja .)
    if (!formData.email.trim()) {
      errors.email = "Sähköposti on pakollinen tieto.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Tarkista sähköpostiosoitteen muoto.";
      isValid = false;
    }

    // Avecin nimi (vain jos valittu)
    if (bringsSpouse && !formData.spouse_name.trim()) {
      errors.spouse_name = "Avecin nimi puuttuu.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // 1. Tarkistetaan tiedot
    if (!validateForm()) {
      // Jos virheitä, pysäytetään lähetys ja näytetään virheet UI:ssa
      return;
    }

    setIsLoading(true);

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
      setSubmitError(
        'Hups! Jokin meni pieleen tallennuksessa. Tarkista internetyhteys ja yritä uudelleen.'
      );
      setIsLoading(false);
    } else {
      setIsLoading(false);
      onSuccess();
    }
  };

  return (
    // noValidate estää selaimen omat virhekuplat, käytämme omia tyylejä
    <form onSubmit={handleSubmit} className="jc-form" noValidate>
      
      {/* --- NIMI --- */}
      <div className="jc-field">
        <label htmlFor="name">Nimesi *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Etunimi Sukunimi"
          // Punainen reuna jos virhe
          style={{ borderColor: validationErrors.name ? '#ff6b6b' : '' }}
        />
        {/* Virheilmoitus */}
        {validationErrors.name && (
          <span className="jc-error" style={{ fontSize: '0.85rem' }}>
            {validationErrors.name}
          </span>
        )}
      </div>

      {/* --- SÄHKÖPOSTI --- */}
      <div className="jc-field">
        <label htmlFor="email">Sähköposti *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="matti.meikalainen@posti.fi"
          style={{ borderColor: validationErrors.email ? '#ff6b6b' : '' }}
        />
        {validationErrors.email && (
          <span className="jc-error" style={{ fontSize: '0.85rem' }}>
            {validationErrors.email}
          </span>
        )}
      </div>

      {/* --- AVEC-VALINTA --- */}
      <div className="jc-field" style={{ margin: '1.5rem 0' }}>
        <label 
          htmlFor="bringsSpouse" 
          className="jc-check"
        >
          <input
            type="checkbox"
            id="bringsSpouse"
            name="bringsSpouse"
            checked={bringsSpouse}
            onChange={(e) => {
              setBringsSpouse(e.target.checked);
              // Jos poistetaan valinta, poistetaan myös mahdollinen virheilmoitus
              if (!e.target.checked) {
                setValidationErrors(prev => ({ ...prev, spouse_name: null }));
              }
            }}
          />
          <span className="box"></span>
          <span style={{ 
            color: bringsSpouse ? 'var(--turquoise)' : 'inherit',
            fontWeight: bringsSpouse ? 'bold' : 'normal' 
          }}>
            Ilmoitan itseni lisäksi toisen henkilön
          </span>
        </label>
      </div>

      {/* --- AVECIN NIMI (Ehdollinen) --- */}
      {bringsSpouse && (
        <div className="jc-field" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <label htmlFor="spouse_name" style={{ color: 'var(--turquoise)' }}>
            Hänen nimensä *
          </label>
          <input
            type="text"
            id="spouse_name"
            name="spouse_name"
            value={formData.spouse_name}
            onChange={handleChange}
            placeholder="Etunimi Sukunimi"
            style={{ 
              borderColor: validationErrors.spouse_name ? '#ff6b6b' : 'var(--turquoise)' 
            }}
          />
          {validationErrors.spouse_name && (
            <span className="jc-error" style={{ fontSize: '0.85rem' }}>
              {validationErrors.spouse_name}
            </span>
          )}
        </div>
      )}

      {/* --- ERITYISRUOKAVALIOT --- */}
      <div className="jc-field">
        <label htmlFor="dietary_restrictions">
          Erityisruokavaliot ja allergiat
        </label>
        <textarea
          id="dietary_restrictions"
          name="dietary_restrictions"
          value={formData.dietary_restrictions}
          onChange={handleChange}
          placeholder="Esim. Laktoositon, Gluteeniton..."
        />
      </div>

      {/* --- YLEINEN VIRHE (TIETOKANTA) --- */}
      {submitError && (
        <div className="jc-error" style={{ marginBottom: '1rem' }}>
          {submitError}
        </div>
      )}

      {/* --- LÄHETYSNAPPI --- */}
      <button 
        type="submit" 
        className="jc-cta primary" 
        style={{ width: '100%', marginTop: '1rem' }}
        disabled={isLoading}
      >
        {isLoading ? 'Lähetetään...' : 'Vahvista paikkasi'}
      </button>
    </form>
  );
}

export default RegistrationForm;