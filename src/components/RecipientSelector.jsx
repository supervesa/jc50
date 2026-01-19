import React from 'react';

export default function RecipientSelector({ 
  recipients, 
  selectedIds, 
  setSelectedIds, 
  showOnlyAssigned, 
  setShowOnlyAssigned 
}) {
  // Suodatetaan: Jos showOnlyAssigned on päällä, jätetään vain ne, joilla on guestName
  const filtered = recipients.filter(r => showOnlyAssigned ? (r.guestName && r.guestName !== 'Ei nimeä') : true);

  const toggleAll = () => {
    // MUUTOS: Valitaan kaikki suodatetut, ei välitetä isAllowed-kentästä
    const allInView = filtered; 
    
    if (selectedIds.size === allInView.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allInView.map(r => r.id)));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}.${d.getMonth() + 1}. klo ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="jc-card fade-in">
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ color: 'var(--cream)', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input 
            type="checkbox" 
            checked={showOnlyAssigned} 
            onChange={e => setShowOnlyAssigned(e.target.checked)} 
          /> Piilota tyhjät hahmot (vain varatut)
        </label>
        <button onClick={toggleAll} className="jc-btn small outline">Valitse kaikki</button>
      </div>

      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--muted)', fontSize: '0.8rem', borderBottom: '1px solid #333' }}>
            <th style={{ padding: '10px' }}>VALITSE</th>
            <th>HAHMO / VIERAS</th>
            <th>OSOITE</th>
            <th>VIIMEISIN LÄHETYS</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id} style={{ 
              opacity: 1, // MUUTOS: Aina täysi näkyvyys
              borderBottom: '1px solid #222',
              background: r.lastLog?.status === 'sent' ? 'rgba(0, 255, 0, 0.02)' : 'transparent'
            }}>
              <td style={{ padding: '10px' }}>
                {/* MUUTOS: Checkbox on aina näkyvissä, poistettu isAllowed-tarkistus */}
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
              <td>
                <strong style={{ color: 'var(--turquoise)' }}>{r.characterName}</strong>
                <br/>
                <small style={{ color: 'var(--cream)' }}>{r.guestName}</small>
              </td>
              <td style={{ fontSize: '0.85rem' }}>{r.email || 'Puuttuu'}</td>
              <td style={{ fontSize: '0.75rem' }}>
                {r.lastLog ? (
                  <div>
                    <span style={{ color: 'var(--lime)' }}>{r.lastLog.template_name}</span>
                    <br/>
                    <span style={{ color: '#666' }}>{formatDate(r.lastLog.sent_at)}</span>
                  </div>
                ) : (
                  <span style={{ color: '#444' }}>- Ei lähetetty -</span>
                )}
              </td>
              <td style={{ fontSize: '0.7rem' }}>
                {/* MUUTOS: Näytetään aina status, ei "TESTITILA" tekstiä */}
                {r.lastLog?.status === 'sent' ? '✅ LÄHETETTY' : '📩 VALMIS'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}