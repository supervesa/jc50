import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminSocial from './AdminSocial';

const AdminGuests = ({ characters, guests }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [scores, setScores] = useState({});
  const [logs, setLogs] = useState([]);
  
  // UUSI: Tila vieraskohtaisille oikeuksille (Sidecar data)
  const [accessControlMap, setAccessControlMap] = useState({});
  
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!characters) return <div className="admin-container">Ladataan hahmoja...</div>;

  // --- 1. LUODAAN NIMI-HAKUKARTTA ---
  const guestMap = useMemo(() => {
    if (!guests) return {};
    return guests.reduce((acc, g) => {
      acc[g.id] = g.name;
      return acc;
    }, {});
  }, [guests]);

  // --- 2. DATAHAKU ---
  const fetchData = async () => {
    // A. Pisteet
    const { data: scoreData } = await supabase.from('leaderboard').select('assigned_guest_id, xp');
    if (scoreData) {
      const sMap = {};
      scoreData.forEach(row => { if (row.assigned_guest_id) sMap[row.assigned_guest_id] = row.xp; });
      setScores(sMap);
    }

    // B. Logit
    const { data: logData } = await supabase.from('mission_log').select('*').order('created_at', { ascending: false }).limit(200);
    if (logData) setLogs(logData);

    // C. UUSI: Access Control (Sidecar table)
    const { data: accessData } = await supabase.from('guest_access_control').select('*');
    if (accessData) {
      const aMap = {};
      accessData.forEach(row => {
        aMap[row.guest_id] = row; // { role: 'tester', is_banned: true, ... }
      });
      setAccessControlMap(aMap);
    }
  };

  useEffect(() => {
    fetchData();

    // Kuunnellaan pisteitä
    const scoreChannel = supabase.channel('admin_chars_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_log' }, () => setTimeout(fetchData, 500))
      .subscribe();

    // Kuunnellaan oikeusmuutoksia (Access Control)
    const accessChannel = supabase.channel('admin_access_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guest_access_control' }, () => setTimeout(fetchData, 500))
      .subscribe();

    return () => {
      supabase.removeChannel(scoreChannel);
      supabase.removeChannel(accessChannel);
    };
  }, []);

  // --- 3. LOGIIKKA ---
  const displayedCharacters = useMemo(() => {
    return characters.filter(c => {
      if (showUnassigned) return true;
      return c.assigned_guest_id !== null;
    });
  }, [characters, showUnassigned]);

  const toggleExpand = (charId) => {
    setExpandedId(expandedId === charId ? null : charId);
    setPoints(0); setReason('');
  };

  const applyPreset = (xp, text) => { setPoints(xp); setReason(text); };

  const sendPoints = async (guestId) => {
    if (!guestId) return alert("Virhe: Ei pelaajaa.");
    if (!reason) return alert("Syy vaaditaan!");
    setLoading(true);
    const { error } = await supabase.from('mission_log').insert({
      guest_id: guestId, xp_earned: points, custom_reason: reason, approval_status: 'approved', mission_id: null
    });
    if (error) alert(error.message);
    else { setPoints(0); setReason(''); }
    setLoading(false);
  };

  const revertTransaction = async (logEntry) => {
    const originalReason = logEntry.custom_reason || 'Ei syytä';
    const correctionReason = prompt(`KUMOTAAN: "${originalReason}"\n\nKirjoita syy:`);
    if (!correctionReason) return;
    setLoading(true);
    await supabase.from('mission_log').insert({
      guest_id: logEntry.guest_id, xp_earned: -1 * logEntry.xp_earned,
      custom_reason: `❌ KORJAUS: ${originalReason} [SYY: ${correctionReason}]`, approval_status: 'approved', mission_id: null
    });
    setLoading(false);
  };

  // --- UUSI: ACCESS CONTROL LOGIIKKA ---
  // Kirjoittaa suoraan guest_access_control -tauluun (UPSERT)
  const toggleTester = async (guestId, currentRole) => {
    const newRole = currentRole === 'tester' ? 'guest' : 'tester';
    
    // Upsert: Luo rivi jos ei ole, päivitä jos on
    const { error } = await supabase
      .from('guest_access_control')
      .upsert({ 
        guest_id: guestId, 
        role: newRole 
      });
      
    if (error) alert("Virhe roolin vaihdossa: " + error.message);
  };

  const toggleBan = async (guestId, currentBanStatus) => {
    const { error } = await supabase
      .from('guest_access_control')
      .upsert({ 
        guest_id: guestId, 
        is_banned: !currentBanStatus 
      });

    if (error) alert("Virhe bannauksessa: " + error.message);
  };

  // --- 4. RENDERÖINTI ---
  return (
    <div className="char-admin-container">
      
      <AdminSocial characters={characters} guestMap={guestMap} />
      <hr className="section-divider" />
      
      <div className="admin-header-row">
        <h2>🎭 HAHMOT & PISTEET & OIKEUDET</h2>
        <label className="toggle-label">
          <input type="checkbox" checked={showUnassigned} onChange={(e) => setShowUnassigned(e.target.checked)} />
          Näytä myös ilman pelaajaa
        </label>
      </div>

      <div className="char-list">
        {displayedCharacters.map(char => {
          const guestId = char.assigned_guest_id;
          const hasPlayer = Boolean(guestId);
          const isOpen = expandedId === char.id;
          const currentXp = (hasPlayer && scores[guestId]) ? scores[guestId] : 0;
          
          const realName = guestMap[guestId] || 'Tuntematon';

          // HAETAAN OIKEUDET KARTASTA (UUSI)
          const accessInfo = hasPlayer ? (accessControlMap[guestId] || {}) : {};
          const isTester = accessInfo.role === 'tester' || accessInfo.role === 'admin';
          const isBanned = accessInfo.is_banned === true;

          return (
            <div key={char.id} className={`char-card ${isOpen ? 'open' : ''} ${!hasPlayer ? 'disabled' : ''} ${isBanned ? 'banned-card' : ''}`}>
              <div className="char-header" onClick={() => hasPlayer && toggleExpand(char.id)}>
                <div className="char-info">
                  <span className="char-name">
                    {char.name} 
                    {hasPlayer && <span style={{color: '#888', fontWeight: 'normal', fontSize: '0.9em', marginLeft: '6px'}}>
                      ({realName})
                    </span>}
                  </span>
                  
                  {/* STATUS IKONIT */}
                  <span style={{ marginLeft: '10px' }}>
                    {isTester && <span title="Beta Tester" style={{ marginRight: '5px' }}>👑</span>}
                    {isBanned && <span title="BANNED">🚫</span>}
                  </span>

                  {!hasPlayer && <span className="tag-warning">Ei pelaajaa</span>}
                </div>
                {hasPlayer && <div className="char-score">⭐ {currentXp}</div>}
              </div>

              {isOpen && hasPlayer && (
                <div className="char-body">
                  
                  {/* UUSI: SIDECAR CONTROL PANEL */}
                  <div style={{ 
                      background: '#1a1a1a', 
                      padding: '15px', 
                      marginBottom: '15px', 
                      borderRadius: '5px',
                      border: '1px solid #333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                  }}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <span style={{color:'#666', fontSize:'0.8rem', fontWeight:'bold'}}>ACCESS LEVEL:</span>
                        <button 
                        onClick={() => toggleTester(guestId, accessInfo.role)}
                        style={{
                            background: isTester ? 'gold' : '#333',
                            color: isTester ? 'black' : 'white',
                            border: 'none',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                        }}
                        >
                        {isTester ? '👑 BETA TESTAAJA (ON)' : '👑 TEE TESTAAJAKSI'}
                        </button>
                    </div>

                    <button 
                      onClick={() => toggleBan(guestId, isBanned)}
                      style={{
                        background: isBanned ? 'red' : '#333',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}
                    >
                      {isBanned ? '🚫 BANNED (ON)' : '🚫 BANNAA KÄYTTÄJÄ'}
                    </button>
                  </div>

                  {/* PISTEET JA LOGIT */}
                  <div className="action-presets">
                    <button className="btn-preset pos" onClick={() => applyPreset(5, '🕵️ Löysi vihjeen')}>+5 Vihje</button>
                    <button className="btn-preset pos" onClick={() => applyPreset(10, '🧩 Ratkaisi tehtävän')}>+10 Tehtävä</button>
                    <button className="btn-preset pos" onClick={() => applyPreset(25, '🥇 MVP Suoritus')}>+25 MVP</button>
                    <button className="btn-preset neg" onClick={() => applyPreset(-5, '⚠️ Varoitus')}>-5 Varoitus</button>
                  </div>

                  <div className="action-input">
                    <input type="number" placeholder="XP" value={points} onChange={e => setPoints(Number(e.target.value))} className={points > 0 ? 'pos-val' : points < 0 ? 'neg-val' : ''} />
                    <input type="text" placeholder="Syy..." value={reason} onChange={e => setReason(e.target.value)} />
                    <button className="btn-submit" onClick={() => sendPoints(guestId)} disabled={loading}>{loading ? '...' : 'LÄHETÄ'}</button>
                  </div>

                  <div className="char-history">
                    <table className="history-table">
                       <tbody>
                         {logs.filter(l => l.guest_id === guestId).slice(0, 5).map(log => (
                           <tr key={log.id}>
                             <td className="td-time">{new Date(log.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                             <td className="td-reason">{log.custom_reason}</td>
                             <td className={`td-xp ${log.xp_earned > 0 ? 'pos' : 'neg'}`}>{log.xp_earned}</td>
                             <td className="td-action"><button className="btn-undo" onClick={() => revertTransaction(log)}>↩️</button></td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default AdminGuests;