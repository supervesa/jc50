import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Eye, EyeOff, Trash2, AlertTriangle, 
  Layers, Eraser, User, Clock, ShieldAlert, RefreshCw, CheckCircle 
} from 'lucide-react';

// DEBUG TILA POIS PÄÄLTÄ
const DEBUG_MODE = false;

const PhotoModerator = () => {
  // --- TILAT ---
  const [timeFilter, setTimeFilter] = useState(60); 
  const [activeTab, setActiveTab] = useState('LIVE'); 
  const [rawPosts, setRawPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. DATAN HAKU ---
  useEffect(() => {
    fetchPosts();

    const channel = supabase.channel('admin-photo-mod')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [timeFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('live_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (timeFilter) {
      const cutoff = new Date(Date.now() - timeFilter * 60000).toISOString();
      query = query.gte('created_at', cutoff);
    }

    const { data, error } = await query;
    if (!error && data) {
      setRawPosts(data);
    }
    setLoading(false);
  };

  // --- 2. JÄRJESTELY JA FILTTERÖINTI ---
  const filteredList = useMemo(() => {
    const sortByPriority = (a, b) => {
      // Priorisoidaan liputetut (Toxic/Flood) kärkeen
      if (a.flag_type && !b.flag_type) return -1;
      if (!a.flag_type && b.flag_type) return 1;
      // Muuten uusin ensin
      return new Date(b.created_at) - new Date(a.created_at);
    };

    let list = [];

    switch (activeTab) {
      case 'ALERTS': 
        // KORJAUS: Näytetään vain ne, jotka EIVÄT ole vielä näkyvissä (eli vaativat hyväksyntää)
        list = rawPosts.filter(p => !p.is_deleted && !p.is_visible && p.flag_type);
        break;
      case 'LIVE': 
        // Normaalisti näkyvät (mukaan lukien hyväksytyt tehtävät/flashit)
        list = rawPosts.filter(p => p.is_visible && !p.is_deleted);
        break;
      case 'HIDDEN': 
        // Piilotetut ilman lippua (tai manuaalisesti piilotetut, joissa lippu poistettu)
        // Jos haluat nähdä myös liputetut mutta piilotetut täällä, poista tuo !p.flag_type ehto.
        // Mutta pidetään selkeyden vuoksi erillään.
        list = rawPosts.filter(p => !p.is_visible && !p.is_deleted && !p.flag_type);
        break;
      case 'DELETED': 
        list = rawPosts.filter(p => p.is_deleted);
        break;
      default: 
        list = rawPosts;
    }

    return list.sort(sortByPriority);
  }, [rawPosts, activeTab]);

  // KORJAUS: Lasketaan hälytykseksi vain ne, jotka ovat piilossa
  const alertCount = rawPosts.filter(p => !p.is_deleted && !p.is_visible && p.flag_type).length;

  // --- 3. TOIMINNOT ---

  // A. ÄLYKÄS NÄKYVYYS
  const toggleVisibility = async (post) => {
    const newVisible = !post.is_visible;
    let updates = { is_visible: newVisible };

    // LOGIIKKA: Jos ollaan julkaisemassa (newVisible === true) 
    // JA nykyinen viesti on tyhjä (sensuroitu) 
    // JA meillä on tallessa alkuperäinen viesti...
    if (newVisible && !post.message && post.original_message) {
       updates.message = post.original_message;
       updates.original_message = null; 
       updates.flag_type = null;        
    }

    // Jos vapautetaan Flood-kuva, poistetaan lippu, jotta se ei jää kummittelemaan
    if (newVisible && post.flag_type === 'flood') {
       updates.flag_type = null; 
    }
    
    // HUOM: Flash ja Mission -lippuja EI poisteta automaattisesti, 
    // jotta ne näkyvät violetilla "LIVE"-listalla. 
    // Mutta ne katoavat ALERTS-listalta, koska is_visible muuttuu trueksi.

    // Optimistinen päivitys UI:hin
    setRawPosts(prev => prev.map(p => p.id === post.id ? { ...p, ...updates } : p));

    // Tietokantaan
    await supabase.from('live_posts').update(updates).eq('id', post.id);
  };

  // B. TOXIC TEKSTIN PALAUTUS
  const restoreText = async (post) => {
    if (!confirm("Haluatko varmasti palauttaa alkuperäisen tekstin näkyviin?")) return;

    const updates = {
      message: post.original_message,
      original_message: null,
      flag_type: null,
      is_visible: true 
    };

    setRawPosts(prev => prev.map(p => p.id === post.id ? { ...p, ...updates } : p));
    await supabase.from('live_posts').update(updates).eq('id', post.id);
  };

  // C. SOFT DELETE
  const softDelete = async (postId) => {
    setRawPosts(prev => prev.map(p => p.id === postId ? { ...p, is_deleted: true } : p));
    await supabase.from('live_posts').update({ is_deleted: true, is_visible: false }).eq('id', postId);
  };

  // D. TEKSTIN POISTO
  const clearCaption = async (postId) => {
    const newVal = ''; 
    setRawPosts(prev => prev.map(p => p.id === postId ? { ...p, message: newVal } : p));
    await supabase.from('live_posts').update({ message: newVal }).eq('id', postId);
  };

  // E. PALAUTUS ROSKAKORISTA
  const restorePost = async (postId) => {
    setRawPosts(prev => prev.map(p => p.id === postId ? { ...p, is_deleted: false, is_visible: false } : p));
    await supabase.from('live_posts').update({ is_deleted: false }).eq('id', postId);
  };

  // F. BATCH ACTION: HYVÄKSY KAIKKI FLOODIT
  const approveAllFloods = async () => {
    const floodPosts = filteredList.filter(p => p.flag_type === 'flood');
    if (floodPosts.length === 0) return;
    if (!confirm(`Haluatko julkaista kaikki ${floodPosts.length} flood-kuvaa kerralla?`)) return;

    const ids = floodPosts.map(p => p.id);
    setRawPosts(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_visible: true, flag_type: null } : p));

    await supabase.from('live_posts')
      .update({ is_visible: true, flag_type: null })
      .in('id', ids);
  };

  const hideAllFromGuest = async (guestId, guestName) => {
    if (!confirm(`Piilota KAIKKI käyttäjältä ${guestName}?`)) return;
    setRawPosts(prev => prev.map(p => p.guest_id === guestId ? { ...p, is_visible: false } : p));
    await supabase.from('live_posts').update({ is_visible: false }).eq('guest_id', guestId);
  };

  // --- RENDERÖINTI ---

  return (
    <div className="photo-moderator-container" style={{ marginTop: '40px', padding: '20px', background: '#111', borderTop:'2px solid #333' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <ShieldAlert size={28} color="var(--magenta)" />
        <h2 style={{ margin: 0, color: 'white' }}>PHOTO MODERATION DECK</h2>
      </div>

      {/* --- KONTROLLIPALKKI --- */}
      <div className="pm-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', background: '#222', padding: '15px', borderRadius: '8px' }}>
        
        {/* AIKASUODATIN */}
        <div style={{ display: 'flex', gap: '5px' }}>
          <TimeBtn val={15} current={timeFilter} set={setTimeFilter} label="15 min" />
          <TimeBtn val={60} current={timeFilter} set={setTimeFilter} label="1 h" />
          <TimeBtn val={null} current={timeFilter} set={setTimeFilter} label="Kaikki" />
        </div>

        <div style={{ width: '1px', background: '#444' }}></div>

        {/* TABIT */}
        <div style={{ display: 'flex', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
          <TabBtn id="ALERTS" active={activeTab} set={setActiveTab} color="#ff3333" icon={<AlertTriangle size={16}/>}>
             HÄLYTYKSET {alertCount > 0 && <span style={{background:'#ff3333', color:'white', padding:'2px 6px', borderRadius:'10px', fontSize:'0.7rem'}}>{alertCount}</span>}
          </TabBtn>
          <TabBtn id="LIVE" active={activeTab} set={setActiveTab} color="#00ff41" icon={<Eye size={16}/>}>
             LIVE
          </TabBtn>
          <TabBtn id="HIDDEN" active={activeTab} set={setActiveTab} color="#ffaa00" icon={<EyeOff size={16}/>}>
             PIILOTETTU
          </TabBtn>
          <TabBtn id="DELETED" active={activeTab} set={setActiveTab} color="#666" icon={<Trash2 size={16}/>}>
             ROSKAKORI
          </TabBtn>
        </div>
      </div>

      {/* --- BATCH ACTIONS (Vain Alerts-tabilla) --- */}
      {activeTab === 'ALERTS' && filteredList.some(p => p.flag_type === 'flood') && (
        <div style={{marginBottom: '20px', padding: '10px', background: 'rgba(0, 231, 255, 0.1)', border: '1px solid #00e7ff', borderRadius: '6px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span style={{color:'#00e7ff', fontWeight:'bold', fontSize:'0.9rem'}}>🌊 Karanteenissa on Flood-kuvia. Tarkista yksitellen tai hyväksy kaikki.</span>
          <button 
            onClick={approveAllFloods}
            style={{background:'#002a33', color:'#00e7ff', border:'1px solid #00e7ff', padding:'6px 12px', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:'6px'}}
          >
            <CheckCircle size={16}/> Hyväksy kaikki Floodit
          </button>
        </div>
      )}

      {/* --- GRID --- */}
      {loading ? (
        <div style={{ padding: '20px', color: '#888' }}>Ladataan kuvavirtaa...</div>
      ) : filteredList.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666', border: '2px dashed #444', borderRadius: '8px' }}>
          Ei kuvia tässä näkymässä.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {filteredList.map(post => {
            const isToxic = post.flag_type === 'toxic';
            const isFlood = post.flag_type === 'flood';
            // KORJAUS: Näytetään myös flash ja mission -badget
            const isFlash = post.flag_type === 'flash';
            const isMission = post.flag_type === 'mission_proof';

            return (
              <div 
                key={post.id} 
                style={{
                  background: '#222', 
                  border: isToxic ? '2px solid #ff3333' : isFlood ? '2px solid #00e7ff' : (isMission || isFlash) ? '2px solid #9b59b6' : '1px solid #333',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  opacity: post.is_visible ? 1 : 0.6
                }}
              >
                
                {/* VAROITUS-BADGET */}
                <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 10 }}>
                  {isToxic && (
                    <span style={{ background: '#ff3333', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={14}/> TEKSTI SENSUROITU
                    </span>
                  )}
                  {isFlood && (
                    <span style={{ background: '#00e7ff', color: '#000', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={14}/> FLOOD (AUTO-HIDE)
                    </span>
                  )}
                  {isFlash && (
                    <span style={{ background: '#e67e22', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                       ⚡ FLASH SUORITUS
                    </span>
                  )}
                  {isMission && (
                    <span style={{ background: '#9b59b6', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldAlert size={14}/> SALAINEN TEHTÄVÄ
                    </span>
                  )}
                </div>

                {/* KUVA & INFO */}
                <div style={{ display: 'flex', height: '140px' }}>
                  <div style={{ width: '120px', flexShrink: 0, background: '#000' }}>
                    <img src={post.image_url} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    
                    <div style={{ fontSize: '0.8rem', color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <User size={12} /> {post.sender_name || 'Anonyymi'}
                    </div>

                    {/* TEKSTI ALUE */}
                    <div style={{ flex: 1, overflowY: 'auto', margin: '5px 0' }}>
                      {/* Jos Toxic, näytetään alkuperäinen himmeällä */}
                      {isToxic && post.original_message ? (
                        <div>
                          <div style={{fontSize:'0.75rem', color:'#ff5555', fontWeight:'bold'}}>ALKUPERÄINEN:</div>
                          <div style={{fontSize:'0.9rem', color:'#888', fontStyle:'italic'}}>"{post.original_message}"</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.95rem', color: '#fff' }}>"{post.message}"</div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#555' }}>
                      {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>

                {/* TOIMINTANAPIT */}
                <div style={{ display: 'flex', borderTop: '1px solid #333' }}>
                  
                  {/* A. TOXIC PALAUTUS (Näytetään jos toxic) */}
                  {isToxic && activeTab !== 'DELETED' ? (
                     <button
                        onClick={() => restoreText(post)}
                        style={{ flex: 1, padding: '10px', background: '#2a1111', border: 'none', borderRight: '1px solid #333', cursor: 'pointer', color: '#ff5555', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: 5 }}
                        title="Hyväksy alkuperäinen teksti"
                     >
                        <RefreshCw size={18} /> Palauta teksti
                     </button>
                  ) : (
                    /* B. NORMAALI NÄKYVYYS / FLOOD VAPAUTUS */
                    activeTab !== 'DELETED' && (
                      <button 
                        onClick={() => toggleVisibility(post)}
                        style={{ flex: 1, padding: '10px', background: post.is_visible ? '#222' : (isFlood ? '#002a33' : '#2a2a2a'), border: 'none', borderRight: '1px solid #333', cursor: 'pointer', color: post.is_visible ? '#00ff41' : (isFlood ? '#00e7ff' : '#ffaa00'), fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: 5 }}
                      >
                        {post.is_visible ? <><Eye size={18}/> Piilota</> : (isFlood ? <><CheckCircle size={18}/> Julkaise</> : <><EyeOff size={18}/> Näytä</>)}
                      </button>
                    )
                  )}

                  {/* C. TEKSTIN POISTO (Jos ei ole jo tyhjä) */}
                  {post.message && !isToxic && activeTab !== 'DELETED' && (
                    <button 
                      onClick={() => clearCaption(post.id)}
                      style={{ width: '40px', background: '#222', border: 'none', borderRight: '1px solid #333', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Poista teksti manuaalisesti"
                    >
                      <Eraser size={18} />
                    </button>
                  )}

                  {/* D. POISTA / PALAUTA */}
                  {activeTab === 'DELETED' ? (
                    <button 
                      onClick={() => restorePost(post.id)}
                      style={{ flex: 1, padding: '10px', background: '#222', border: 'none', cursor: 'pointer', color: '#fff' }}
                    >
                      ♻️ Palauta
                    </button>
                  ) : (
                    <button 
                      onClick={() => softDelete(post.id)}
                      style={{ width: '50px', background: '#2a1111', border: 'none', cursor: 'pointer', color: '#ff3333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Siirrä roskakoriin"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                
                {/* FLOODIN MASSAPIILOTUS */}
                {isFlood && activeTab !== 'DELETED' && (
                   <div style={{borderTop:'1px solid #333', padding:'5px', background:'#00111a'}}>
                      <button onClick={() => hideAllFromGuest(post.guest_id, post.sender_name)} style={{width:'100%', background:'transparent', border:'none', color:'#00e7ff', fontSize:'0.7rem', cursor:'pointer'}}>
                         Piilota kaikki tältä käyttäjältä
                      </button>
                   </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- UI HELPERS ---
const TimeBtn = ({ val, current, set, label }) => (
  <button onClick={() => set(val)} style={{ padding: '8px 16px', background: current === val ? '#fff' : 'transparent', color: current === val ? '#000' : '#888', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
    <Clock size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} /> {label}
  </button>
);

const TabBtn = ({ id, active, set, label, color, icon, children }) => (
  <button onClick={() => set(id)} style={{ padding: '10px', background: active === id ? color : 'transparent', color: active === id ? '#000' : color, border: `1px solid ${color}`, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
    {icon} {children}
  </button>
);

export default PhotoModerator;