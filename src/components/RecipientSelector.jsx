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
    if (selectedIds.size === filtered.filter(r => r.isAllowed).length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.filter(r => r.isAllowed).map(r => r.id)));
    }
  };

  return (
    <div className="jc-card fade-in">
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ color: 'var(--cream)', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input 
            type="checkbox" 
            checked={showOnlyAssigned} 
            onChange={e => setShowOnlyAssigned(e.target.checked)} 
          /> Poista käyttämättömät hahmot (vain varatut)
        </label>
        <button onClick={toggleAll} className="jc-btn small outline">Valitse kaikki sallitut</button>
      </div>

      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--muted)', fontSize: '0.8rem', borderBottom: '1px solid #333' }}>
            <th style={{ padding: '10px' }}>VALITSE</th>
            <th>HAHMO / VIERAS</th>
            <th>OSOITE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id} style={{ opacity: r.isAllowed ? 1 : 0.3, borderBottom: '1px solid #222' }}>
              <td style={{ padding: '10px' }}>
                {r.isAllowed ? (
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(r.id)} 
                    onChange={() => {
                      const n = new Set(selectedIds);
                      if (n.has(r.id)) n.delete(r.id); else n.add(r.id);
                      setSelectedIds(n);
                    }} 
                  />
                ) : '🚫'}
              </td>
              <td><strong>{r.characterName}</strong><br/><small>{r.guestName}</small></td>
              <td>{r.email || 'Puuttuu'}</td>
              <td style={{ fontSize: '0.7rem' }}>{r.isAllowed ? '✅ SALLITTU' : '🔒 TESTITILA'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}