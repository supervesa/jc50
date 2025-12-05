import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

function TicketPage() {
  const { id } = useParams();
  
  // --- TILAT ---
  const [guest, setGuest] = useState(null);
  const [myCharacters, setMyCharacters] = useState([]); 
  const [myPhotos, setMyPhotos] = useState([]); // Omat live-kuvat
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploading, setUploading] = useState(false); // Latausindikaattori
  
  // Käyttöliittymä
  const [activeTab, setActiveTab] = useState('IDENTITY'); // 'IDENTITY' tai 'PHOTO'
  const [isEditing, setIsEditing] = useState(false);
  
  // Lomaketilat
  const [formData, setFormData] = useState({ name: '', dietary_restrictions: '', brings_spouse: false, spouse_name: '' });
  const [photoMessage, setPhotoMessage] = useState(''); // Viesti live-kuvaan

  // --- 1. DATAHAKU (Lippu ja Hahmot) ---
  const fetchData = async () => {
    if (!id || id.length < 20) {
      setErrorMsg("Linkki virheellinen.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      // A. Hae vieras
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('id', id)
        .single();

      if (guestError) throw guestError;
      setGuest(guestData);
      
      setFormData({
        name: guestData.name,
        dietary_restrictions: guestData.dietary_restrictions || '',
        brings_spouse: guestData.brings_spouse,
        spouse_name: guestData.spouse_name || ''
      });

      // B. Hae hahmot (assigned_guest_id)
      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('*')
        .eq('assigned_guest_id', id);

      if (!charError && charData) {
        // Haetaan kullekin hahmolle suhteet
        const charsWithRelations = await Promise.all(charData.map(async (char) => {
           const { data: relData } = await supabase
             .from('character_relationships')
             .select('*')
             .or(`char1_id.eq.${char.id},char2_id.eq.${char.id}`);
           
           let relations = [];
           if (relData && relData.length > 0) {
             const { data: allChars } = await supabase.from('characters').select('id, name');
             relations = relData.map(r => {
               const otherId = (r.char1_id === char.id) ? r.char2_id : r.char1_id;
               const otherName = allChars.find(c => c.id === otherId)?.name || 'Tuntematon';
               return { id: r.id, who: otherName, desc: r.description };
             });
           }
           return { ...char, relations };
        }));
        setMyCharacters(charsWithRelations);
      }

      // C. Hae omat kuvat (Live-seinälle lähetetyt)
      fetchMyPhotos(id);

    } catch (err) {
      console.error(err);
      setErrorMsg("Lippua ei löytynyt.");
    } finally {
      setLoading(false);
    }
  };

  // Erillinen haku kuville (kutsutaan myös latauksen jälkeen)
  const fetchMyPhotos = async (guestId) => {
    const { data } = await supabase
      .from('live_posts')
      .select('*')
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false });
    if (data) setMyPhotos(data);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // --- 2. TOIMINNOT: PROFIILIKUVA (AVATAR) ---
  const uploadAvatar = async (event, charId) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${charId}-${Date.now()}.${fileExt}`; // Uniikki nimi
      const filePath = `${fileName}`;

      // 1. Lataa Storageen ('avatars' bucket)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Hae julkinen URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // 3. Päivitä characters-taulu
      const { error: updateError } = await supabase
        .from('characters')
        .update({ avatar_url: publicUrl })
        .eq('id', charId);

      if (updateError) throw updateError;

      alert("Profiilikuva päivitetty!");
      fetchData(); // Lataa tiedot uudelleen (jotta kuva näkyy)

    } catch (error) {
      alert("Virhe kuvan latauksessa: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 3. TOIMINNOT: KYMPPIKUVA (LIVE WALL) ---
  const uploadPartyPhoto = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${guest.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Lataa Storageen ('party-photos' bucket)
      const { error: uploadError } = await supabase.storage
        .from('party-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Hae julkinen URL
      const { data: { publicUrl } } = supabase.storage.from('party-photos').getPublicUrl(filePath);

      // 3. Lisää rivi live_posts -tauluun
      const { error: dbError } = await supabase
        .from('live_posts')
        .insert({
          guest_id: guest.id,
          sender_name: guest.name,
          image_url: publicUrl,
          message: photoMessage
        });

      if (dbError) throw dbError;

      alert("Kuva lähetetty seinälle!");
      setPhotoMessage(''); // Tyhjennä viesti
      fetchMyPhotos(guest.id); // Päivitä galleria

    } catch (error) {
      alert("Virhe lähetyksessä: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Kuvan poisto
  const deletePhoto = async (photoId) => {
    if(!window.confirm("Haluatko varmasti poistaa tämän kuvan?")) return;
    await supabase.from('live_posts').delete().eq('id', photoId);
    fetchMyPhotos(guest.id);
  };

  // --- 4. TALLENNA OMAT TIEDOT ---
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({
          name: formData.name,
          dietary_restrictions: formData.dietary_restrictions,
          brings_spouse: formData.brings_spouse,
          spouse_name: formData.brings_spouse ? formData.spouse_name : null
        })
        .eq('id', id);

      if (error) throw error;
      setGuest({ ...guest, ...formData });
      setIsEditing(false);
      alert("Tiedot päivitetty!");
    } catch (err) {
      alert("Virhe: " + err.message);
    }
  };

  if (loading) return <div className="jc-wrapper" style={{textAlign:'center', marginTop:'4rem'}}>Ladataan...</div>;
  if (errorMsg) return <div className="jc-wrapper" style={{textAlign:'center', marginTop:'4rem'}}>{errorMsg}</div>;

  return (
    <div className="jc-wrapper">
      
      {/* HEADER & TABS */}
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="jc-h2">DIGITAALINEN LIPPU</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button 
            onClick={() => setActiveTab('IDENTITY')}
            className={`jc-filter-btn ${activeTab === 'IDENTITY' ? 'active' : ''}`}
            style={{ fontSize: '1rem', padding: '0.6rem 1.5rem' }}
          >
            🆔 Identiteetti
          </button>
          <button 
            onClick={() => setActiveTab('PHOTO')}
            className={`jc-filter-btn ${activeTab === 'PHOTO' ? 'active' : ''}`}
            style={{ fontSize: '1rem', padding: '0.6rem 1.5rem' }}
          >
            📸 Kymppikuva
          </button>
        </div>
      </header>

      {/* --- TAB 1: IDENTITEETTI --- */}
      {activeTab === 'IDENTITY' && (
        <>
          {/* HAHMOT */}
          {myCharacters.length === 0 ? (
            <section className="jc-card medium mb-2" style={{ textAlign: 'center', opacity: 0.7 }}>
              <div style={{ fontSize: '3rem' }}>🔒</div>
              <h3>Identiteettiä luodaan...</h3>
              <p>Palaa myöhemmin katsomaan hahmosi tiedot.</p>
            </section>
          ) : (
            myCharacters.map(char => (
              <section key={char.id} className="jc-card medium mb-2" style={{ textAlign: 'center', position:'relative', overflow:'hidden', border: char.is_spouse_character ? '1px solid var(--magenta)' : '1px solid var(--turquoise)' }}>
                <div style={{ animation: 'fadeIn 1s ease' }}>
                  
                  {/* PROFIILIKUVA-ALUE */}
                  <div style={{ marginBottom: '1rem', position: 'relative', display: 'inline-block' }}>
                    <div style={{ 
                      width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', 
                      border: '3px solid #fff', boxShadow: '0 0 15px rgba(255,255,255,0.3)', margin: '0 auto',
                      backgroundImage: `url(${char.avatar_url || 'https://via.placeholder.com/150?text=?'})`,
                      backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#333'
                    }}></div>
                    
                    {/* Latausnappi */}
                    <label style={{ 
                      position: 'absolute', bottom: 0, right: -10, background: 'var(--turquoise)', 
                      color: '#000', padding: '4px 8px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' 
                    }}>
                      {uploading ? '...' : '📷 Kuva'}
                      <input type="file" accept="image/*" style={{display:'none'}} onChange={(e) => uploadAvatar(e, char.id)} disabled={uploading} />
                    </label>
                  </div>

                  <h1 className="jc-h1" style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{char.name}</h1>
                  <h3 style={{ color: char.is_spouse_character ? 'var(--magenta)' : 'var(--turquoise)', marginBottom: '1.5rem' }}>{char.role}</h3>
                  
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px' }}>
                    <p style={{ fontStyle: 'italic', opacity: 0.9 }}>"{char.backstory}"</p>
                    {char.secret_mission && (
                      <div style={{ marginTop: '1.5rem', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
                        <span className="small" style={{ color: 'var(--magenta)' }}>SALAINEN TEHTÄVÄ:</span>
                        <p style={{ fontWeight: 'bold' }}>{char.secret_mission}</p>
                      </div>
                    )}
                    {char.relations && char.relations.length > 0 && (
                      <div style={{ marginTop: '1.5rem', textAlign:'left', background:'rgba(0,0,0,0.2)', padding:'1rem', borderRadius:'8px' }}>
                        <span className="small" style={{ color: 'var(--turquoise)', display:'block', marginBottom:'0.5rem' }}>TUNNETUT YHTEYDET:</span>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize:'0.9rem' }}>
                          {char.relations.map(rel => (
                            <li key={rel.id} style={{marginBottom:'0.4rem'}}>
                              <strong style={{color:'#fff'}}>{rel.who}:</strong> <span style={{opacity:0.8}}>{rel.desc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))
          )}

          {/* OMAT TIEDOT */}
          <section className="jc-card small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--turquoise)' }}>Omat tiedot</h3>
              <button onClick={() => setIsEditing(!isEditing)} className="jc-cta ghost" style={{ fontSize: '0.8rem', padding: '0.4rem' }}>
                {isEditing ? 'Peruuta' : 'Muokkaa'}
              </button>
            </div>

            {isEditing ? (
              <div className="jc-form">
                <div className="jc-field"><label>Nimi</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="jc-field"><label className="jc-check"><input type="checkbox" checked={formData.brings_spouse} onChange={e => setFormData({...formData, brings_spouse: e.target.checked})} /><span className="box"></span> Saavun puolison kanssa</label></div>
                {formData.brings_spouse && <div className="jc-field"><label>Puolison nimi</label><input type="text" value={formData.spouse_name} onChange={e => setFormData({...formData, spouse_name: e.target.value})} /></div>}
                <div className="jc-field"><label>Erityisruokavaliot</label><textarea value={formData.dietary_restrictions} onChange={e => setFormData({...formData, dietary_restrictions: e.target.value})} /></div>
                <button onClick={handleSave} className="jc-cta primary" style={{width:'100%', marginTop:'1rem'}}>Tallenna</button>
              </div>
            ) : (
              <div style={{ lineHeight: '1.6' }}>
                <p><strong>Nimi:</strong> {guest.name}</p>
                <p><strong>Sähköposti:</strong> {guest.email}</p>
                <p><strong>Avec:</strong> {guest.brings_spouse ? `Kyllä (${guest.spouse_name})` : 'Ei'}</p>
                <p><strong>Allergiat:</strong> {guest.dietary_restrictions || '-'}</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* --- TAB 2: KYMPPIKUVA (PHOTO BOOTH) --- */}
      {activeTab === 'PHOTO' && (
        <div>
          <section className="jc-card medium mb-2">
            <h3 className="jc-h2" style={{ textAlign: 'center', color: 'var(--plasma-gold)' }}>Juhlafeed</h3>
            <p className="small" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Ota kuva ja lähetä se suoraan juhlien screenille!</p>
            
            <div className="jc-form">
              <div className="jc-field">
                <textarea 
                  rows="2" 
                  placeholder="Kirjoita tervehdys..." 
                  value={photoMessage}
                  onChange={(e) => setPhotoMessage(e.target.value)}
                  className="jc-input"
                />
              </div>
              
              <label className={`jc-cta primary ${uploading ? 'disabled' : ''}`} style={{ textAlign: 'center', display: 'block', cursor: 'pointer', padding:'1rem' }}>
                {uploading ? 'Lähetetään...' : '📸 Ota Kuva / Valitse'}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" // Avaa kameran mobiilissa
                  style={{ display: 'none' }} 
                  onChange={uploadPartyPhoto}
                  disabled={uploading}
                />
              </label>
            </div>
          </section>

          {/* OMAT KUVAT */}
          <h4 style={{ color: 'var(--muted)', marginTop: '2rem', marginBottom:'1rem' }}>MINUN OTOKSENI ({myPhotos.length})</h4>
          <div className="jc-grid">
            {myPhotos.map(photo => (
              <div key={photo.id} className="jc-col-6" style={{ position: 'relative' }}>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', background: '#000' }}>
                  <img src={photo.image_url} alt="Post" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '0.5rem' }}>
                    <p className="small" style={{ margin: 0, fontStyle: 'italic', fontSize:'0.8rem' }}>
                      "{photo.message || 'Ei viestiä'}"
                    </p>
                    <button 
                      onClick={() => deletePhoto(photo.id)}
                      style={{ marginTop: '0.5rem', color: 'red', background: 'none', border: 'none', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Poista
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {myPhotos.length === 0 && <p className="small" style={{opacity:0.5}}>Et ole vielä lähettänyt kuvia.</p>}
          </div>
        </div>
      )}

    </div>
  );
}

export default TicketPage;