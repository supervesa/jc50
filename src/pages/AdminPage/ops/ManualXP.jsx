import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const ManualXP = ({ guests }) => {
  const [bonusPoints, setBonusPoints] = useState(100);
  const [bonusReason, setBonusReason] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState('');

  const giveBonusXP = async () => {
    if (!selectedGuestId || !bonusReason) return;
    await supabase.from('mission_log').insert({
      guest_id: selectedGuestId,
      custom_reason: bonusReason,
      xp_earned: bonusPoints,
      approval_status: 'approved' // Hyväksytään heti
    });
    alert(`Pisteet lähetetty!`);
    setBonusReason('');
  };

  return (
    <div className="admin-panel">
      <h2>🏆 JAA BONUSPISTEITÄ</h2>
      <div className="form-group">
        <select className="input-field" value={selectedGuestId} onChange={e => setSelectedGuestId(e.target.value)}>
          <option value="">Valitse vieras...</option>
          {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <input value={bonusReason} onChange={e => setBonusReason(e.target.value)} placeholder="Syy: Upea tanssi..." className="input-field"/>
      </div>
      <div className="form-group">
        <input type="number" value={bonusPoints} onChange={e => setBonusPoints(e.target.value)} className="input-field"/>
      </div>
      <button onClick={giveBonusXP} className="btn-create" style={{background: 'gold', color: 'black'}}>LÄHETÄ</button>
    </div>
  );
};

export default ManualXP;