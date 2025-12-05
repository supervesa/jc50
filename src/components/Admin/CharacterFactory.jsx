import React, { useState, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

function CharacterFactory({ characters, onUpdate }) {
  // Alustetaan tila selkeästi (booleanit falseksi, stringit tyhjiksi)
  const [formData, setFormData] = useState({ 
    name: '', 
    role: '', 
    backstory: '', 
    secret_mission: '', 
    is_spouse_character: false 
  });
  
  const [editingId, setEditingId] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); 
  const fileInputRef = useRef(null);

  // --- LOMAKETOIMINNOT ---
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // PÄIVITYS
        const { error } = await supabase
          .from('characters')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        alert("Hahmo päivitetty!");
      } else {
        // LUONTI
        const { error } = await supabase.from('characters').insert([formData]);
        if (error) throw error;
        alert("Hahmo luotu!");
      }
      resetForm();
      onUpdate();
    } catch (err) {
      alert("Virhe: " + err.message);
    }
  };

  const handleEdit = (char) => {
    setFormData({
      name: char.name,
      role: char.role,
      backstory: char.backstory || '',
      secret_mission: char.secret_mission || '',
      // Varmistetaan että arvo on boolean (true/false) eikä null
      is_spouse_character: !!char.is_spouse_character 
    });
    setEditingId(char.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, isAssigned) => {
    if (isAssigned) {
      alert("VAROITUS: Tätä hahmoa ei voi poistaa, koska se on jaettu vieraalle. Vapauta hahmo ensin Roolitus-välilehdellä.");
      return;
    }
    if (!window.confirm("Haluatko varmasti poistaa tämän hahmon lopullisesti?")) return;

    try {
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
      onUpdate();
    } catch (err) { alert(err.message); }
  };

  const handleClone = async (char) => {
    try {
      const clone = {
        name: `${char.name} (Kopio)`,
        role: char.role,
        backstory: char.backstory,
        secret_mission: char.secret_mission,
        is_spouse_character: char.is_spouse_character,
        status: 'vapaa'
      };
      const { error } = await supabase.from('characters').insert([clone]);
      if (error) throw error;
      onUpdate();
    } catch (err) { alert(err.message); }
  };

  const resetForm = () => {
    setFormData({ name: '', role: '', backstory: '', secret_mission: '', is_spouse_character: false });
    setEditingId(null);
  };

  // --- CSV TOIMINNOT ---

  const downloadTemplate = () => {
    const header = "name,role,backstory,secret_mission,is_avec\n";
    const example1 = '"Agentti X","Vakooja","Salainen menneisyys...","Etsi koodi.",\n';
    const example2 = '"Agentin Apuri","Kuski","Ajaa pakoautoa.","Odota autossa.","kyllä"';
    const blob = new Blob([header + example1 + example2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "hahmo_pohja_v2.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      processCSV(evt.target.result);
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const processCSV = async (csvText) => {
    try {
      const rows = csvText.split(/\r?\n/);
      const newCharacters = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;

        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

        if (values.length >= 2) {
          const isAvecInput = values[4] ? values[4].toLowerCase() : '';
          const isSpouse = ['kyllä', 'yes', 'true', '1'].includes(isAvecInput);

          newCharacters.push({
            name: values[0],
            role: values[1],
            backstory: values[2] || '',
            secret_mission: values[3] || '',
            is_spouse_character: isSpouse,
            status: 'vapaa'
          });
        }
      }

      if (newCharacters.length === 0) return alert("Ei löydetty validia dataa.");

      if (window.confirm(`Löydettiin ${newCharacters.length} hahmoa. \n(Niistä ${newCharacters.filter(c => c.is_spouse_character).length} on avec-rooleja). \n\nLisätäänkö ne tietokantaan?`)) {
        const { error } = await supabase.from('characters').insert(newCharacters);
        if (error) throw error;
        alert("Massalisäys onnistui!");
        onUpdate();
      }

    } catch (err) {
      alert("Virhe CSV:n käsittelyssä: " + err.message);
    }
  };

  // --- SUODATUS ---
  const filteredChars = useMemo(() => {
    return characters.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.role && c.role.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesFilter = true;
      if (filterStatus === 'FREE') matchesFilter = c.status === 'vapaa';
      if (filterStatus === 'TAKEN') matchesFilter = c.status === 'varattu';

      return matchesSearch && matchesFilter;
    });
  }, [characters, searchTerm, filterStatus]);

  // --- RENDERÖINTI ---
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* LOMAKE */}
        <div className="jc-card medium" style={{ border: editingId ? '2px solid var(--plasma-gold)' : '2px solid var(--turquoise)' }}>
          <h3 className="jc-h2" style={{ fontSize: '1.5rem', marginTop: 0 }}>
            {editingId ? 'Muokkaa Hahmoa' : 'Luo Uusi Hahmo'}
          </h3>
          <form onSubmit={handleSubmit} className="jc-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="jc-field">
                <label>Nimi</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Esim. Agentti X" />
              </div>
              <div className="jc-field">
                <label>Rooli</label>
                <input type="text" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required placeholder="Esim. Vakooja" />
              </div>
            </div>
            
            <div className="jc-field">
              <label>Taustatarina</label>
              <textarea rows="2" value={formData.backstory} onChange={e => setFormData({ ...formData, backstory: e.target.value })} placeholder="Hahmon historia..." />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'center' }}>
              <div className="jc-field">
                <label>Salainen Tehtävä</label>
                <input type="text" value={formData.secret_mission} onChange={e => setFormData({ ...formData, secret_mission: e.target.value })} placeholder="Tehtävä illalle..." />
              </div>
              
              {/* KORJATTU AVEC-VALINTA */}
              <div className="jc-field">
                <label className="jc-check" style={{cursor:'pointer', marginTop:'1.5rem'}}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_spouse_character} 
                    onChange={e => setFormData({...formData, is_spouse_character: e.target.checked})} 
                  />
                  <span className="box"></span> Tämä on Avec-rooli
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="jc-cta primary" style={{ flex: 1 }}>
                {editingId ? 'Päivitä Tiedot' : 'Tallenna Tietokantaan'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="jc-cta ghost">Peruuta</button>
              )}
            </div>
          </form>
        </div>

        {/* CSV TYÖKALUT */}
        <div className="jc-card small" style={{ height: 'fit-content' }}>
          <h4 style={{ color: 'var(--magenta)', marginTop: 0 }}>Massatyökalut</h4>
          <p className="small">Tuo hahmoja CSV-tiedostosta. (Sarake 5: "kyllä" = Avec-rooli).</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button onClick={downloadTemplate} className="jc-filter-btn" style={{textAlign:'center'}}>📄 Lataa CSV-pohja</button>
            <label className="jc-cta ghost" style={{ textAlign: 'center', cursor: 'pointer' }}>
              📤 Tuo CSV-tiedosto
              <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />
          <div className="small" style={{ opacity: 0.7 }}>
            <strong>Tilastot:</strong><br/>
            Vapaita: {characters.filter(c => c.status === 'vapaa').length}<br/>
            Avec-rooleja: {characters.filter(c => c.is_spouse_character).length}<br/>
            Yhteensä: {characters.length}
          </div>
        </div>
      </div>

      {/* --- HAHMOLISTA --- */}
      <div className="jc-toolbar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="jc-h2" style={{ margin: 0, fontSize: '1.5rem' }}>Hahmoarkisto</h3>
        <input 
          type="text" placeholder="Etsi hahmoa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
          className="jc-search-input" style={{ marginLeft: 'auto', padding: '0.6rem', borderRadius: '6px', border: '1px solid #444', background: 'rgba(0,0,0,0.5)', color: '#fff', width: '250px' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setFilterStatus('ALL')} className={`jc-filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}>Kaikki</button>
          <button onClick={() => setFilterStatus('FREE')} className={`jc-filter-btn ${filterStatus === 'FREE' ? 'active' : ''}`}>Vapaat 🟢</button>
          <button onClick={() => setFilterStatus('TAKEN')} className={`jc-filter-btn ${filterStatus === 'TAKEN' ? 'active' : ''}`}>Varatut 🔴</button>
        </div>
      </div>

      <div className="jc-grid">
        {filteredChars.map(char => {
          const isTaken = char.status === 'varattu';
          const isAvec = char.is_spouse_character;
          
          return (
            <div key={char.id} className="jc-col-4">
              <div 
                className="jc-card small" 
                style={{ 
                  height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
                  border: isTaken ? '1px solid rgba(255, 100, 100, 0.3)' : (isAvec ? '1px solid var(--magenta)' : '1px solid var(--turquoise)')
                }}
              >
                <div style={{
                  position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: '50%',
                  background: isTaken ? 'red' : '#00ff96', boxShadow: isTaken ? '0 0 5px red' : '0 0 5px #00ff96'
                }}></div>

                {isAvec && <span className="small" style={{color:'var(--magenta)', fontWeight:'bold', letterSpacing:'0.1em'}}>AVEC-ROOLI</span>}

                <h3 style={{ margin: '0.2rem 0 0.5rem 0', color: '#fff' }}>{char.name}</h3>
                <div style={{ color: isAvec ? 'var(--magenta)' : 'var(--turquoise)', fontWeight: 'bold', marginBottom: '0.5rem' }}>{char.role}</div>
                
                <p className="small" style={{ opacity: 0.7, flex: 1 }}>
                  {char.backstory ? char.backstory.slice(0, 80) + '...' : '- Ei taustatarinaa -'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem', marginTop: '1rem' }}>
                  <button onClick={() => handleEdit(char)} title="Muokkaa" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✏️</button>
                  <button onClick={() => handleClone(char)} title="Kloonaa" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>👯</button>
                  <button onClick={() => handleDelete(char.id, isTaken)} title="Poista" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: isTaken ? 0.3 : 1 }}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredChars.length === 0 && <p style={{ opacity: 0.5, gridColumn: 'span 12', textAlign: 'center' }}>Ei hahmoja.</p>}
      </div>
    </div>
  );
}

export default CharacterFactory;