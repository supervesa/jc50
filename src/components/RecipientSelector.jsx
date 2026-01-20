import React from 'react';
import { Trophy, Wine, Zap, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export default function RecipientSelector({ 
  recipients, // Tämä on nyt EmailFilterin valmiiksi suodattama lista
  selectedIds, 
  setSelectedIds 
}) {
  
  const toggleAll = () => {
    if (selectedIds.size === recipients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recipients.map(r => r.id)));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}.${d.getMonth() + 1}. klo ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="jc-card fade-in" style={{ marginTop: '1rem', overflow: 'hidden' }}>
      <div style={{ 
        padding: '1rem 1.5rem', 
        background: 'rgba(0,0,0,0.2)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <div className="small" style={{ color: 'var(--turquoise)' }}>
          VALITTUNA: <strong>{selectedIds.size}</strong> / {recipients.length} VASTAANOTTAJAA
        </div>
        <button onClick={toggleAll} className="jc-btn small outline">
          {selectedIds.size === recipients.length ? 'Poista valinnat' : 'Valitse kaikki suodatetut'}
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <th style={{ padding: '15px' }}>Valitse</th>
              <th>Agentti / Hahmo</th>
              <th>Yhteystiedot</th>
              <th>Operaation tila</th>
              <th>Viimeisin viesti</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map(r => (
              <tr key={r.id} className="table-row-hover" style={{ 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: selectedIds.has(r.id) ? 'rgba(0, 231, 255, 0.03)' : 'transparent',
                transition: 'var(--fast)'
              }}>
                <td style={{ padding: '15px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(r.id)} 
                    onChange={() => {
                      const n = new Set(selectedIds);
                      if (n.has(r.id)) n.delete(r.id); else n.add(r.id);
                      setSelectedIds(n);
                    }} 
                  />
                </td>
                
                {/* HAHMO JA AVATAR */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '35px', height: '35px', borderRadius: '50%', 
                      border: '1px solid var(--turquoise)', overflow: 'hidden',
                      background: '#111' 
                    }}>
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#333' }}>?</div>
                      )}
                    </div>
                    <div>
                      <div style={{ color: 'var(--turquoise)', fontWeight: 'bold', fontSize: '0.9rem' }}>{r.characterName}</div>
                      <div className="small" style={{ color: 'var(--cream)', opacity: 0.7 }}>{r.guestName}</div>
                    </div>
                  </div>
                </td>

                {/* EMAIL JA TYYPPI */}
                <td>
                  <div style={{ fontSize: '0.85rem' }}>{r.email || <span style={{color:'red'}}>Puuttuu</span>}</div>
                  <div className="small" style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                    {r.isSplit ? 'AVEC (SPLIT)' : r.isShadow ? 'AVEC (PERII OSOITTEEN)' : 'PÄÄVIERAS'}
                  </div>
                </td>

                {/* LEADERBOARD STATS */}
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span title={`XP: ${r.xp}`} style={{ color: r.xp > 0 ? 'var(--lime)' : '#444' }}><Zap size={14} /></span>
                    <span title="Salatehtävä" style={{ color: r.missionDone ? 'var(--magenta)' : '#444' }}><Trophy size={14} /></span>
                    <span title="Salakapakka" style={{ color: r.foundBar ? 'var(--turquoise)' : '#444' }}><Wine size={14} /></span>
                  </div>
                  <div className="small" style={{ fontSize: '0.6rem', marginTop: '2px' }}>{r.xp} XP</div>
                </td>

                {/* LOKI-TIEDOT */}
                <td style={{ fontSize: '0.75rem' }}>
                  {r.sentStatus !== 'unsent' ? (
                    <div>
                      <div style={{ color: 'var(--lime)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                         {r.lastLogTemplate || 'Viesti lähetetty'}
                      </div>
                      <div style={{ color: '#666' }}>{formatDate(r.lastLogDate)}</div>
                    </div>
                  ) : (
                    <span style={{ color: '#444' }}>- Ei historiaa -</span>
                  )}
                </td>

                {/* STATUS BADGE */}
                <td>
                  {r.sentStatus === 'sent' && <span className="jc-badge" style={{ borderColor: 'var(--lime)', color: 'var(--lime)' }}>LÄHETETTY</span>}
                  {r.sentStatus === 'failed' && <span className="jc-badge" style={{ borderColor: 'red', color: 'red' }}>VIRHE</span>}
                  {r.sentStatus === 'unsent' && <span className="jc-badge" style={{ borderColor: 'var(--muted)', color: 'var(--muted)' }}>VALMIS</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}