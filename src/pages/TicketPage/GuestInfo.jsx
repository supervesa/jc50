import React, { useState } from 'react';

const GuestInfo = ({ guest, myCharacters, onSave, onActivateSpouse }) => {
  // Etsitään, onko tällä vieraalla hallussaan hahmoa, joka kuuluu puolisolle
  const spouseCharacter = myCharacters.find(c => c.is_spouse_character);
  
  // Tila Avecin luonnille
  const [spouseEmail, setSpouseEmail] = useState('');
  const [createdLink, setCreatedLink] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!window.confirm(`Luodaanko profiili nimelle "${guest.spouse_name}"?`)) return;
    
    setLoading(true);
    try {
      const newGuestId = await onActivateSpouse(spouseEmail);
      const link = `${window.location.origin}/lippu/${newGuestId}`;
      setCreatedLink(link);
    } catch (err) {
      alert("Virhe: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdLink);
    alert("Linkki kopioitu leikepöydälle!");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Agentti-lippu',
          text: `Hei ${guest.spouse_name}! Tässä on lippusi ja hahmosi JukkaClubin peliin:`,
          url: createdLink,
        });
      } catch (error) {
        console.log('Jako peruttiin tai epäonnistui', error);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="jc-card medium">
      <h3 className="jc-h2">Omat Tiedot</h3>
      
      {/* --- OMAT TIEDOT --- */}
      <div className="guest-info-section">
        <label className="guest-label">Nimi</label>
        <div className="guest-value">{guest.name}</div>
      </div>

      <div className="guest-info-section">
        <label className="guest-label">Erityisruokavaliot</label>
        <div className={`guest-value ${!guest.dietary_restrictions ? 'italic' : ''}`}>
          {guest.dietary_restrictions || '- Ei erityisruokavalioita -'}
        </div>
      </div>

      {/* --- AVEC OSIO --- */}
      {guest.brings_spouse && (
        <div className="avec-section">
          <h4 className="avec-header">Avec / Puoliso</h4>
          
          <div className="guest-info-section">
            <label className="guest-label">Avecin nimi</label>
            <div className="guest-value">{guest.spouse_name}</div>
          </div>

          {/* TILANNE 1: LINKKI ON JUURI LUOTU */}
          {createdLink ? (
            <div className="avec-success-box">
              <h4 className="avec-success-title">🎉 PROFIILI LUOTU!</h4>
              <p className="small">
                Tämä on Avecisi oma lippu. <strong>Anna tämä linkki hänelle nyt</strong>.
              </p>
              
              <input 
                type="text" 
                value={createdLink} 
                readOnly 
                className="avec-link-input"
              />
              
              <div className="avec-actions">
                <button onClick={handleNativeShare} className="btn-share">
                  <span>📤</span> JAA LINKKI
                </button>
                <button onClick={copyToClipboard} className="btn-copy">
                  KOPIOI
                </button>
              </div>

              {spouseEmail && (
                <div className="avec-mail-link">
                  <a 
                    href={`mailto:${spouseEmail}?subject=Kutsu Agentti-peliin&body=Hei ${guest.spouse_name}!%0D%0A%0D%0ATässä on henkilökohtainen linkkisi juhlien peliin:%0D%0A${createdLink}%0D%0A%0D%0ATervetuloa mukaan!`}
                  >
                    📧 Lähetä linkki sähköpostitse
                  </a>
                </div>
              )}
            </div>
          ) : (
            // TILANNE 2: AVECIN HAHMO ON VIELÄ TÄSSÄ -> NÄYTÄ AKTIVOINTI
            spouseCharacter ? (
              <div className="avec-activation-box">
                <h4 className="avec-activation-title">🚀 Aktivoi Avecin Agentti</h4>
                <p className="small" style={{ color: '#ccc', marginBottom: '15px' }}>
                  Hänelle on varattu hahmo <strong>{spouseCharacter.name}</strong>. 
                  Luo hänelle oma lippu, jotta hän pääsee peliin mukaan omalla puhelimellaan.
                </p>

                <div className="avec-input-group">
                  <label className="guest-label">Avecin sähköposti (valinnainen)</label>
                  <input 
                    type="email" 
                    placeholder="esim. teppo@mail.com" 
                    value={spouseEmail}
                    onChange={(e) => setSpouseEmail(e.target.value)}
                    className="avec-input"
                  />
                  <div className="avec-hint">Käytetään vain 'mailto'-linkin luomiseen.</div>
                </div>

                <button 
                  onClick={handleActivate} 
                  disabled={loading}
                  className="btn-activate"
                >
                  {loading ? 'LUODAAN...' : 'LUO AVEC-LIPPU JA SIIRRÄ HAHMO'}
                </button>
              </div>
            ) : (
              // TILANNE 3: AVECIN HAHMO ON JO SIIRRETTY
              <div className="avec-activated-text">
                <em>Avecin profiili on eriytetty ja aktivoitu.</em>
              </div>
            )
          )}
        </div>
      )}

      {/* MUOKKAUSLINKKI */}
      <div className="edit-link-container">
        <button onClick={onSave} className="btn-edit-link">
          Muokkaa tietojani (ota yhteys adminiin)
        </button>
      </div>

    </div>
  );
};

export default GuestInfo;