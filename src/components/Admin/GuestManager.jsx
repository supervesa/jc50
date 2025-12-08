import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import DeleteGuestButton from './DeleteGuestButton';
import CreateGuestModal from '../../pages/AdminPage/CreateGuestModal';
import './AdminPage.css'; 

// --- APUKOMPONENTIT ---

const StatusBadge = ({ type, active, tooltip }) => {
  if (!active) return null;
  
  const styles = {
    CHAR: { icon: '🎭', color: 'var(--turquoise)' },
    SPLIT: { icon: '🔗', color: 'var(--magenta)' },
    SPOUSE: { icon: '👥', color: 'var(--plasma-gold)' }, 
    ERROR: { icon: '⚠️', color: '#ff4444' } 
  };

  const s = styles[type] || styles.ERROR;

  return (
    <span 
      className="jc-badge" 
      title={tooltip || type}
      style={{ 
        borderColor: s.color, 
        color: s.color,
        marginLeft: '4px'
      }}
    >
      {s.icon}
    </span>
  );
};

// --- PÄÄKOMPONENTTI ---

const GuestManager = ({ guests, characters, splits, onUpdate }) => {
  const [selectedGuest, setSelectedGuest] = useState(null); 
  const [showCreateModal, setShowCreateModal] = useState(false); // UUSI: Modaalin tila
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- DATAN RIKASTUS ---
  const enrichedGuests = useMemo(() => {
    return guests.map(g => {
      // Hahmot
      const myChars = characters.filter(c => c.assigned_guest_id === g.id);
      
      // Linkitykset (Split)
      const asParent = splits.find(s => s.parent_guest_id === g.id);
      const asChild = splits.find(s => s.child_guest_id === g.id);
      
      // Linkitetyn vieraan (Child) tiedot
      let linkedGuest = null;
      if (asParent) linkedGuest = guests.find(c => c.id === asParent.child_guest_id);
      if (asChild) linkedGuest = guests.find(p => p.id === asChild.parent_guest_id);

      // Status
      const hasSpouse = g.brings_spouse;
      const isSplit = !!asParent || !!asChild;
      const hasProblem = hasSpouse && !isSplit; 

      // Haetaan sähköposti guest_splits -taulusta (jos parent)
      const splitEmail = asParent ? asParent.email : null; 

      return {
        ...g,
        myChars,
        asParent,
        asChild,
        isSplit,
        hasProblem,
        // UI-dataa varten
        linkedGuestId: linkedGuest?.id || null,
        linkedName: linkedGuest?.name || "Tuntematon",
        linkedHasChar: linkedGuest ? characters.some(c => c.assigned_guest_id === linkedGuest.id) : false,
        splitEmail, 
        parentName: asChild ? linkedGuest?.name : null,
        childName: asParent ? linkedGuest?.name : null,
        spouseName: g.spouse_name 
      };
    });
  }, [guests, characters, splits]);

  // --- SUODATUS ---
  const filteredList = enrichedGuests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- TOIMINNOT ---

  const shareLink = async (guestId, guestName) => {
    const link = `${window.location.origin}/lippu/${guestId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Lippu: ${guestName}`, url: link });
      } catch (err) { console.log('Jako peruttiin'); }
    } else {
      navigator.clipboard.writeText(link);
      alert('Linkki kopioitu leikepöydälle!');
    }
  };

  const handleDeleteSuccess = () => {
    setSelectedGuest(null);
    onUpdate(); 
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    onUpdate(); // Päivittää listan heti lisäyksen jälkeen
  };

  const handleUpdate = async (id, updates) => {
    try {
      const changes = Object.keys(updates).map(key => {
        const oldVal = selectedGuest[key] || '(tyhjä)';
        const newVal = updates[key];
        return `${key}: '${oldVal}' -> '${newVal}'`;
      }).join(', ');

      await supabase.from('system_logs').insert({
        event_type: 'GUEST_UPDATE',
        target_id: id,
        description: `Admin muokkasi vierasta (${selectedGuest.name}). Muutokset: ${changes}`,
        snapshot_data: updates
      });

      const { error } = await supabase.from('guests').update(updates).eq('id', id);
      if (error) throw error;
      
      onUpdate();
      setSelectedGuest(prev => ({ ...prev, ...updates }));
      console.log("Päivitys OK");
    } catch (err) {
      alert("Virhe päivityksessä: " + err.message);
    }
  };

  const handleSplitUpdate = async (parentId, updates) => {
    try {
      const oldEmail = selectedGuest.splitEmail || '(tyhjä)';
      await supabase.from('system_logs').insert({
        event_type: 'SPLIT_UPDATE',
        target_id: parentId,
        description: `Admin muokkasi linkitetyn avecin sähköpostia (splits): '${oldEmail}' -> '${updates.email}'`,
        snapshot_data: updates
      });

      const { error } = await supabase
        .from('guest_splits')
        .update(updates)
        .eq('parent_guest_id', parentId);

      if (error) throw error;
      
      onUpdate();
      setSelectedGuest(prev => ({ ...prev, splitEmail: updates.email }));
      alert("Linkityksen tiedot päivitetty.");
    } catch (err) {
      alert("Virhe split-tietojen päivityksessä: " + err.message);
    }
  };

  // --- RENDERÖINTI ---

  return (
    <div className="guest-manager-container">
      
      {/* 1. MASTER VIEW (LISTA) */}
      {!selectedGuest && (
        <div className="jc-wrapper">
          <h2 className="jc-h2">Vieraslista</h2>
          
          {/* TOOLBAR: Haku + Lisää-nappi */}
          <div className="jc-toolbar" style={{display:'flex', gap:'10px', marginBottom:'2rem', alignItems:'center'}}>
            <div className="jc-form" style={{flex:1, marginBottom:0}}>
              <input 
                type="text" 
                placeholder="🔍 Etsi nimellä tai sähköpostilla..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="jc-input-custom"
                style={{marginBottom:0}}
              />
            </div>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="jc-cta primary"
              style={{padding:'0.8rem 1.5rem', whiteSpace:'nowrap'}}
            >
              + Lisää
            </button>
          </div>

          <div className="manager-list">
            {filteredList.map(g => (
              <div 
                key={g.id} 
                className="jc-card guest-list-card" 
                onClick={() => setSelectedGuest(g)}
              >
                <div className="item-main">
                  <div className="item-name">{g.name}</div>
                  <div className="item-sub">
                    {g.asParent ? <span style={{color:'var(--magenta)'}}>Linkki: {g.linkedName}</span> : 
                     (g.asChild ? <span style={{color:'var(--turquoise)'}}>Kutsuja: {g.linkedName}</span> : g.email)}
                  </div>
                </div>
                
                <div className="item-icons">
                  <StatusBadge type="CHAR" active={g.myChars.length > 0} tooltip="Hahmo valittu" />
                  <StatusBadge type="SPLIT" active={g.isSplit} tooltip="Linkitetty" />
                  <StatusBadge type="SPOUSE" active={g.hasProblem} tooltip="Avec ilmoitettu (ei linkkiä)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. DETAIL VIEW (INSPECTOR) */}
      {selectedGuest && (
        <div className="manager-detail-view">
          
          {/* HEADER */}
          <div className="detail-header">
            <button onClick={() => setSelectedGuest(null)} className="btn-back">
               ‹ Takaisin
            </button>
            <div style={{fontWeight:'bold', color:'var(--cream)'}}>{selectedGuest.name}</div>
          </div>

          {/* CONTENT */}
          <div className="detail-content">
            <div className="detail-content-inner">
            
              {/* INFOLAATIKKO */}
              <div className="jc-card" style={{marginBottom:'1.5rem', borderColor:'var(--turquoise)'}}>
                <h3 className="jc-h2" style={{fontSize:'1.2rem', marginBottom:'1rem'}}>Lippu & Info</h3>
                <div className="id-box">ID: {selectedGuest.id}</div>
                <button onClick={() => shareLink(selectedGuest.id, selectedGuest.name)} className="jc-cta primary" style={{width:'100%'}}>
                  📩 Jaa Lippulinkki
                </button>
              </div>

              {/* PÄÄVIERAS LOMAKE */}
              <div className="jc-card" style={{marginBottom:'1.5rem'}}>
                <h3 className="jc-h2" style={{fontSize:'1.2rem'}}>Päävieras</h3>
                
                <div className="jc-form" style={{maxWidth:'100%'}}>
                  <div className="jc-field">
                    <label>Nimi</label>
                    <input 
                      type="text" 
                      defaultValue={selectedGuest.name}
                      onBlur={(e) => {
                        if(e.target.value !== selectedGuest.name) handleUpdate(selectedGuest.id, {name: e.target.value});
                      }}
                      className="jc-input-custom" 
                    />
                  </div>
                  <div className="jc-field">
                    <label>Sähköposti (Guests)</label>
                    <input 
                      type="email" 
                      defaultValue={selectedGuest.email}
                      onBlur={(e) => {
                        if(e.target.value !== selectedGuest.email) handleUpdate(selectedGuest.id, {email: e.target.value});
                      }}
                      className="jc-input-custom" 
                    />
                  </div>
                  <div className="jc-field">
                    <label>Erityisruokavaliot</label>
                    <textarea 
                      defaultValue={selectedGuest.dietary_restrictions}
                      onBlur={(e) => {
                        if(e.target.value !== selectedGuest.dietary_restrictions) handleUpdate(selectedGuest.id, {dietary_restrictions: e.target.value});
                      }}
                      className="jc-input-custom"
                      rows="2"
                    />
                  </div>
                </div>
              </div>

              {/* TILA 1: Split tehty (Linkitetty Avec) */}
              {selectedGuest.asParent && (
                <div className="jc-card" style={{marginBottom:'1.5rem', borderColor:'var(--magenta)', background:'rgba(255, 0, 229, 0.05)'}}>
                  <h3 className="jc-h2" style={{fontSize:'1.2rem', color:'var(--magenta)'}}>Linkitetty Avec</h3>
                  
                  <div style={{marginBottom:'1rem'}}>
                    <div className="lead" style={{fontSize:'1.1rem', margin:0, fontWeight:'bold'}}>
                      {selectedGuest.linkedName}
                    </div>
                    <div className="small" style={{color: selectedGuest.linkedHasChar ? 'var(--lime)' : '#ffaa00'}}>
                      {selectedGuest.linkedHasChar ? "✅ Hahmo valittu" : "⚠️ Ei hahmoa"}
                    </div>
                  </div>

                  <div className="jc-form" style={{maxWidth:'100%'}}>
                    <div className="jc-field">
                      <label style={{color:'var(--magenta)'}}>Avecin Sähköposti (Splits)</label>
                      <input 
                        type="email"
                        defaultValue={selectedGuest.splitEmail || ""}
                        placeholder="Lisää sähköposti..."
                        onBlur={(e) => {
                           if (e.target.value !== selectedGuest.splitEmail) {
                              handleSplitUpdate(selectedGuest.id, { email: e.target.value });
                           }
                        }}
                        className="jc-input-custom"
                        style={{borderColor: 'rgba(255, 0, 229, 0.3)'}}
                      />
                      <div className="jc-help">Päivittää linkitystaulun tiedot.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TILA 2: Split tehty (Tämä on lapsivieras) */}
              {selectedGuest.asChild && (
                <div className="jc-card" style={{marginBottom:'1.5rem', borderColor:'var(--turquoise)'}}>
                  <h3 className="jc-h2" style={{fontSize:'1.2rem', color:'var(--turquoise)'}}>Kutsuja (Päävieras)</h3>
                  <div className="lead" style={{fontSize:'1rem', margin:0}}>
                     {selectedGuest.linkedName}
                  </div>
                  <p className="small">Olet tämän vieraan avec. Muokkaa tietoja päävieraan kortista.</p>
                </div>
              )}

              {/* TILA 3: Ei splittiä, mutta avec ilmoitettu (Declared) */}
              {selectedGuest.hasProblem && (
                <div className="jc-card" style={{marginBottom:'1.5rem', border:'1px dashed var(--muted)'}}>
                  <h3 className="jc-h2" style={{fontSize:'1.2rem', color:'var(--muted)'}}>Ilmoitettu Avec</h3>
                  <div className="lead" style={{fontSize:'1.1rem', margin:'0 0 0.5rem 0', color: 'var(--cream)'}}>
                    {selectedGuest.spouseName || "Nimetön"}
                  </div>
                  <p className="small">
                    Vieras on ilmoittanut tuovansa puolison, mutta häntä ei ole vielä eriytetty (split) omaksi vieraaksi.
                  </p>
                </div>
              )}

              {/* DANGER ZONE */}
              <div className="jc-card" style={{borderColor:'#500', background:'rgba(50,0,0,0.3)'}}>
                <h3 style={{color:'#ff4444', marginTop:0, fontSize:'1rem'}}>Vaara-alue</h3>
                <DeleteGuestButton 
                  guest={selectedGuest} 
                  onSuccess={handleDeleteSuccess}
                  className="jc-cta ghost"
                  style={{width:'100%', borderColor:'#ff4444', color:'#ff4444'}}
                />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. CREATE MODAL */}
      {showCreateModal && (
        <CreateGuestModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

    </div>
  );
};

export default GuestManager;