import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import DeleteGuestButton from './DeleteGuestButton';
import CreateGuestModal from './CreateGuestModal';
import './AdminPage.css';
// Tuodaan Lucide-ikonit (lisäsin muutaman toiminnallisen ikonin kuten Trash2 ja Share2)
import { 
  Zap, Target, ArrowLeft, Trophy, Diamond, Wine, Clock, 
  Share2, Plus, Search, AlertCircle 
} from 'lucide-react';

// --- APUKOMPONENTIT ---

const StatusBadge = ({ type, active, tooltip }) => {
  if (!active) return null;
  
  // Määritellään ikonit ja värit
  const styles = {
    CHAR:   { icon: <Trophy size={16} />, color: 'var(--turquoise)' },
    SPLIT:  { icon: <Zap size={16} />,    color: 'var(--magenta)' },
    SPOUSE: { icon: <Wine size={16} />,   color: 'var(--plasma-gold)' }, 
    ERROR:  { icon: <Clock size={16} />,  color: '#ffaa00' } // "Odottaa" on parempi kuin error
  };

  const s = styles[type] || styles.ERROR;

  return (
    <span 
      className="jc-badge" 
      title={tooltip || type}
      style={{ 
        borderColor: s.color, 
        color: s.color,
        marginLeft: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        background: 'rgba(0,0,0,0.2)'
      }}
    >
      {s.icon}
    </span>
  );
};

// --- PÄÄKOMPONENTTI ---

const GuestManager = ({ guests, characters, splits, onUpdate }) => {
  const [selectedGuest, setSelectedGuest] = useState(null); 
  const [showCreateModal, setShowCreateModal] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- DATAN RIKASTUS (Pysyy samana) ---
  const enrichedGuests = useMemo(() => {
    return guests.map(g => {
      const myChars = characters.filter(c => c.assigned_guest_id === g.id);
      const asParent = splits.find(s => s.parent_guest_id === g.id);
      const asChild = splits.find(s => s.child_guest_id === g.id);
      
      let linkedGuest = null;
      if (asParent) linkedGuest = guests.find(c => c.id === asParent.child_guest_id);
      if (asChild) linkedGuest = guests.find(p => p.id === asChild.parent_guest_id);

      const hasSpouse = g.brings_spouse;
      const isSplit = !!asParent || !!asChild;
      const hasProblem = hasSpouse && !isSplit; 

      const splitEmail = asParent ? asParent.email : null; 

      return {
        ...g,
        myChars,
        asParent,
        asChild,
        isSplit,
        hasProblem,
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
    onUpdate(); 
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
          <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem'}}>
            <Target size={28} color="var(--magenta)" />
            <h2 className="jc-h2" style={{margin:0}}>Vieraslista</h2>
          </div>
          
          {/* TOOLBAR */}
          <div className="jc-toolbar" style={{display:'flex', gap:'10px', marginBottom:'2rem', alignItems:'center'}}>
            <div className="jc-form" style={{flex:1, marginBottom:0, position:'relative'}}>
              {/* Hakukuvake inputin sisällä */}
              <Search size={18} style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--muted)'}} />
              <input 
                type="text" 
                placeholder="Etsi nimellä tai sähköpostilla..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="jc-input-custom"
                style={{marginBottom:0, paddingLeft:'40px'}}
              />
            </div>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="jc-cta primary"
              style={{padding:'0.8rem 1.2rem', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'8px'}}
            >
              <Plus size={18} /> Lisää
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
                    {g.asParent ? (
                      <span style={{color:'var(--magenta)', display:'flex', alignItems:'center', gap:'4px'}}>
                        <Zap size={12} /> Linkki: {g.linkedName}
                      </span>
                    ) : (g.asChild ? (
                      <span style={{color:'var(--turquoise)', display:'flex', alignItems:'center', gap:'4px'}}>
                        <Diamond size={12} /> Kutsuja: {g.linkedName}
                      </span>
                    ) : g.email)}
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
               <ArrowLeft size={20} /> Takaisin
            </button>
            <div style={{fontWeight:'bold', color:'var(--cream)', display:'flex', alignItems:'center', gap:'10px'}}>
              <Diamond size={16} color="var(--turquoise)" />
              {selectedGuest.name}
            </div>
          </div>

          {/* CONTENT */}
          <div className="detail-content">
            <div className="detail-content-inner">
            
              {/* INFOLAATIKKO */}
              <div className="jc-card" style={{marginBottom:'1.5rem', borderColor:'var(--turquoise)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                  <h3 className="jc-h2" style={{fontSize:'1.2rem', margin:0}}>Lippu & Info</h3>
                  <Zap size={20} color="var(--turquoise)" />
                </div>
                
                <div className="id-box">ID: {selectedGuest.id}</div>
                <button 
                  onClick={() => shareLink(selectedGuest.id, selectedGuest.name)} 
                  className="jc-cta primary" 
                  style={{width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}
                >
                  <Share2 size={18} /> Jaa Lippulinkki
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
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'0.5rem'}}>
                    <Zap size={20} color="var(--magenta)" />
                    <h3 className="jc-h2" style={{fontSize:'1.2rem', color:'var(--magenta)', margin:0}}>Linkitetty Avec</h3>
                  </div>
                  
                  <div style={{marginBottom:'1rem', paddingLeft:'30px'}}>
                    <div className="lead" style={{fontSize:'1.1rem', margin:0, fontWeight:'bold'}}>
                      {selectedGuest.linkedName}
                    </div>
                    <div className="small" style={{color: selectedGuest.linkedHasChar ? 'var(--lime)' : '#ffaa00', display:'flex', alignItems:'center', gap:'5px'}}>
                      {selectedGuest.linkedHasChar ? <Trophy size={14}/> : <AlertCircle size={14}/>}
                      {selectedGuest.linkedHasChar ? "Hahmo valittu" : "Ei hahmoa"}
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
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                     <Diamond size={20} color="var(--turquoise)" />
                     <h3 className="jc-h2" style={{fontSize:'1.2rem', color:'var(--turquoise)', margin:0}}>Kutsuja (Päävieras)</h3>
                  </div>
                  <div className="lead" style={{fontSize:'1rem', margin:'10px 0 0 30px'}}>
                     {selectedGuest.linkedName}
                  </div>
                  <p className="small" style={{marginLeft:'30px'}}>Olet tämän vieraan avec. Muokkaa tietoja päävieraan kortista.</p>
                </div>
              )}

              {/* TILA 3: Ei splittiä, mutta avec ilmoitettu (Declared) */}
              {selectedGuest.hasProblem && (
                <div className="jc-card" style={{marginBottom:'1.5rem', border:'1px dashed var(--muted)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Wine size={20} color="var(--plasma-gold)" />
                    <h3 className="jc-h2" style={{fontSize:'1.2rem', color:'var(--muted)', margin:0}}>Ilmoitettu Avec</h3>
                  </div>
                  
                  <div className="lead" style={{fontSize:'1.1rem', margin:'10px 0 0.5rem 30px', color: 'var(--cream)'}}>
                    {selectedGuest.spouseName || "Nimetön"}
                  </div>
                  
                  <p className="small" style={{marginLeft:'30px', display:'flex', alignItems:'center', gap:'6px'}}>
                    <Clock size={14} /> Vieras on ilmoittanut tuovansa puolison, mutta häntä ei ole vielä eriytetty.
                  </p>
                </div>
              )}

              {/* DANGER ZONE */}
              <div className="jc-card" style={{borderColor:'#500', background:'rgba(50,0,0,0.3)'}}>
                <h3 style={{color:'#ff4444', marginTop:0, fontSize:'1rem', display:'flex', alignItems:'center', gap:'8px'}}>
                  Vaara-alue
                </h3>
                <DeleteGuestButton 
                  guest={selectedGuest} 
                  onSuccess={handleDeleteSuccess}
                  className="jc-cta ghost"
                  style={{width:'100%', borderColor:'#ff4444', color:'#ff4444', display:'flex', justifyContent:'center', gap:'10px'}}
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