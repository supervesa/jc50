import React, { useState } from 'react';
import { Smartphone, Share2, Copy, CheckCircle } from 'lucide-react';

const AvecSplitCard = ({ guest, myCharacters, onActivateSpouse }) => {
  const spouseCharacter = myCharacters.find(c => c.is_spouse_character);
  
  const [spouseEmail, setSpouseEmail] = useState('');
  const [createdLink, setCreatedLink] = useState(null);
  const [loading, setLoading] = useState(false);

  // Jos ei ole avecia tai hahmo on jo siirretty, ei näytetä mitään tai näytetään kuittaus
  if (!guest.brings_spouse && !spouseCharacter) return null;

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
          text: `Hei ${guest.spouse_name}! Tässä on lippusi JukkaClubiin:`,
          url: createdLink,
        });
      } catch (error) {
        console.log('Jako peruttiin', error);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="jc-card medium mb-2" style={{ borderLeft: '4px solid #FF00E5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <Smartphone color="#FF00E5" size={24} />
        <h3 className="jc-h2" style={{ margin: 0 }}>Seuralaisen aktivointi</h3>
      </div>

      {createdLink ? (
        <div className="avec-success-box" style={{ background: 'rgba(0,255,0,0.05)', padding: '15px', borderRadius: '10px' }}>
          <h4 style={{ color: '#00ff41', marginTop: 0 }}><CheckCircle size={18} /> PROFIILI LUOTU!</h4>
          <p className="small">Anna tämä linkki seuralaisellesi nyt:</p>
          <input 
            type="text" 
            value={createdLink} 
            readOnly 
            className="avec-link-input"
            style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '5px' }}
          />
          <div className="avec-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={handleNativeShare} className="jc-cta primary" style={{ flex: 1, fontSize: '0.8rem' }}>
              <Share2 size={16} /> JAA
            </button>
            <button onClick={copyToClipboard} className="jc-cta ghost" style={{ flex: 1, fontSize: '0.8rem' }}>
              <Copy size={16} /> KOPIOI
            </button>
          </div>
        </div>
      ) : spouseCharacter ? (
        <div className="avec-activation-box">
          <p className="small" style={{ color: '#ccc', marginBottom: '20px' }}>
            Hallussasi on hahmo <strong>{spouseCharacter.name}</strong>, joka on varattu seuralaisellesi. 
            Aktivoi hänelle oma lippu tästä, jotta hän saa hahmon omaan puhelimeensa.
          </p>
          
          <div className="jc-field">
            <label className="small">Seuralaisen sähköposti</label>
            <input 
              type="email" 
              placeholder="teppo@mail.com" 
              value={spouseEmail}
              onChange={(e) => setSpouseEmail(e.target.value)}
              className="jc-input"
              style={{ width: '100%', marginBottom: '15px' }}
            />
          </div>

          <button 
            onClick={handleActivate} 
            disabled={loading}
            className="jc-cta primary"
            style={{ width: '100%' }}
          >
            {loading ? 'KÄSITELLÄÄN...' : 'AKTIVOI SEURALAISEN LIPPU'}
          </button>
        </div>
      ) : (
        <div className="avec-activated-text" style={{ opacity: 0.6, fontSize: '0.9rem' }}>
          <em>Seuralaisesi profiili on jo aktivoitu ja siirretty.</em>
        </div>
      )}
    </div>
  );
};

export default AvecSplitCard;