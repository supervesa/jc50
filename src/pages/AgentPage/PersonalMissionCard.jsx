import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Tarvitaan lataukseen

const PersonalMissionCard = ({ missionDescription, status, onReport, guestId }) => {
  const [reportText, setReportText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!reportText.trim() && !selectedFile) {
      return alert("Kirjoita raportti tai liitä kuva.");
    }

    setUploading(true);
    let publicUrl = null;

    try {
      // 1. Jos kuva valittu, ladataan se ensin
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `mission-proof/${guestId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('party-photos') // Käytetään samaa bucketia kuin live-seinä
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('party-photos').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      // 2. Lähetetään raportti (teksti + mahdollinen kuva-url)
      onReport(reportText, publicUrl);
      
      // Reset
      setSelectedFile(null);
      setReportText('');

    } catch (error) {
      alert("Virhe latauksessa: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`mission-card personal-objective ${status}`}>
      
      <div className="mission-header" style={{ alignItems: 'center' }}>
        <div className="mission-badge" style={{ background: 'gold', color: 'black', border: '1px solid #b8860b' }}>
          {status === 'approved' ? 'MISSION ACCOMPLISHED' : 'TOP SECRET CLEARANCE'}
        </div>
        <div className="mission-xp" style={{ color: 'gold', border: '1px solid gold' }}>500 XP</div>
      </div>

      <div className="mission-title" style={{ color: 'gold', fontSize: '1.2rem', marginBottom: '10px' }}>
        HENKILÖKOHTAINEN TEHTÄVÄ
      </div>

      <div className="mission-desc-box" style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '15px', border: '1px dashed gold', borderRadius: '4px', marginBottom: '15px' }}>
        <p style={{ fontStyle: 'italic', fontSize: '1.1rem', color: '#fff', margin: 0 }}>
          "{missionDescription}"
        </p>
      </div>

      {/* TILAT */}
      
      {/* TILA 1: ODOTTAA HYVÄKSYNTÄÄ */}
      {(status === 'pending' || status === 'submitted') && (
        <div className="status-box pending">
          <span className="spin">⏳</span> ODOTTAA PÄÄMAJAN VAHVISTUSTA...
        </div>
      )}

      {/* TILA 2: HYVÄKSYTTY */}
      {status === 'approved' && (
        <div className="status-box success">
          ✔ SUORITUS HYVÄKSYTTY. PISTEET MYÖNNETTY.
        </div>
      )}

      {/* TILA 3: TEKEMÄTTÄ TAI HYLÄTTY (Lomake näkyy) */}
      {/* KORJAUS: Lisätty 'rejected' tähän ehtoon */}
      {(status === 'none' || !status || status === 'rejected') && (
        <div className="mission-action">
          
          {/* Jos hylätty, näytetään varoitus */}
          {status === 'rejected' && (
            <div style={{ color: '#ff4444', marginBottom: '10px', border: '1px solid #ff4444', padding: '10px', fontSize: '0.9rem', background: 'rgba(255,0,0,0.1)' }}>
              ❌ SUORITUS HYLÄTTY. Yritä uudelleen paremmilla todisteilla.
            </div>
          )}

          {!isExpanded ? (
            <button 
              onClick={() => setIsExpanded(true)}
              className="btn-reveal"
              style={{ width: '100%', background: 'gold', color: 'black', fontWeight: 'bold', padding: '12px', border: 'none', cursor: 'pointer' }}
            >
              {status === 'rejected' ? 'YRITÄ UUDELLEEN' : 'ILMOITA SUORITETUKSI'}
            </button>
          ) : (
            <div className="report-form" style={{ animation: 'slideDown 0.3s' }}>
              <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>Kirjoita lyhyt raportti (miten onnistui?):</p>
              
              <textarea 
                rows="3" 
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Miten suoritit tehtävän?"
                style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: '1px solid gold', borderRadius: '4px', marginBottom: '10px', fontFamily: 'inherit' }}
              />

              {/* KUVALATAUS */}
              <div style={{marginBottom: '10px'}}>
                <label style={{display:'inline-flex', alignItems:'center', gap:'10px', cursor:'pointer', border:'1px dashed #666', padding:'8px', borderRadius:'4px', width:'100%'}}>
                  <span style={{fontSize:'1.5rem'}}>📸</span>
                  <span style={{fontSize:'0.9rem', color:'#ccc'}}>
                    {selectedFile ? `Valittu: ${selectedFile.name}` : 'Liitä todistuskuva (valinnainen)'}
                  </span>
                  <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleFileSelect} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleSubmit}
                  disabled={uploading}
                  style={{ flex: 1, background: uploading ? '#555' : 'gold', color: 'black', border: 'none', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {uploading ? 'LÄHETETÄÄN...' : 'LÄHETÄ RAPORTTI'}
                </button>
                <button 
                  onClick={() => setIsExpanded(false)}
                  disabled={uploading}
                  style={{ background: 'transparent', color: '#aaa', border: '1px solid #555', padding: '10px', cursor: 'pointer' }}
                >
                  Peruuta
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PersonalMissionCard;