import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const AdminVault = () => {
  const [isActive, setIsActive] = useState(false);
  const [clues, setClues] = useState([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  
  // Lomake
  const [newQuestion, setNewQuestion] = useState('');
  const [newCode, setNewCode] = useState('');

  // 1. LATAA DATA
  const fetchData = async () => {
    // Asetus (On/Off)
    const { data: settings } = await supabase.from('game_settings').select('value').eq('key', 'speakeasy_active').single();
    if (settings) setIsActive(settings.value);

    // Vihjeet
    const { data: cluesData } = await supabase.from('vault_clues').select('*').order('created_at', { ascending: false });
    if (cluesData) setClues(cluesData);

    // Onnistuneet
    const { count } = await supabase.from('vault_access').select('*', { count: 'exact', head: true });
    setUnlockedCount(count || 0);
  };

  useEffect(() => {
    fetchData();
    // Kuunnellaan muutoksia (jos toinen admin säätää)
    const sub = supabase.channel('admin_vault')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vault_clues' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_settings' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vault_access' }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // 2. TOIMINNOT
  const toggleGame = async () => {
    const newState = !isActive;
    await supabase.from('game_settings').update({ value: newState }).eq('key', 'speakeasy_active');
    setIsActive(newState);
  };

  const addClue = async (e) => {
    e.preventDefault();
    if (!newQuestion || !newCode) return;
    await supabase.from('vault_clues').insert({ question: newQuestion, code: newCode.trim().toUpperCase() });
    setNewQuestion(''); setNewCode('');
  };

  const deleteClue = async (id) => {
    if (!confirm("Poistetaanko vihje?")) return;
    await supabase.from('vault_clues').delete().eq('id', id);
  };

  return (
    <div className="admin-section" style={{ borderTop: '2px solid gold', paddingTop: '20px', marginTop: '40px' }}>
      <h2 style={{ color: 'gold' }}>🔐 OPERATION SPEAKEASY</h2>
      
      {/* STATUS KYTKIN */}
      <div style={{ background: '#222', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: isActive ? '2px solid #00ff41' : '1px solid #555' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: isActive ? '#00ff41' : '#aaa' }}>
              STATUS: {isActive ? 'ACTIVE (Ovet auki)' : 'LOCKED (Piilotettu)'}
            </h3>
            <p className="small" style={{ margin: '5px 0 0 0' }}>
              Sisäänpäässeitä agentteja: <strong style={{color:'gold', fontSize:'1.2rem'}}>{unlockedCount}</strong>
            </p>
          </div>
          <button 
            onClick={toggleGame}
            style={{ 
              background: isActive ? '#333' : '#00ff41', 
              color: isActive ? '#fff' : '#000', 
              border: 'none', padding: '15px 30px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' 
            }}
          >
            {isActive ? 'SULJE PELI' : 'AKTIVOI PELI'}
          </button>
        </div>
      </div>

      {/* VIHJEIDEN HALLINTA */}
      <div className="admin-panel">
        <h3>Lisää vihje pankkiin</h3>
        <p className="small" style={{color:'#888', marginBottom:'15px'}}>Järjestelmä arpoo jokaiselle vieraalle 2 kysymystä tästä listasta.</p>
        
        <form onSubmit={addClue} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Kysymys / Vihje</label>
            <input 
              className="input-field" 
              placeholder="Esim. Mikä vuosi lukee aulataulussa?" 
              value={newQuestion} 
              onChange={e => setNewQuestion(e.target.value)} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Vastaus (Koodi)</label>
            <input 
              className="input-field" 
              placeholder="1952" 
              value={newCode} 
              onChange={e => setNewCode(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn-create" style={{ width: 'auto', marginBottom: '15px' }}>LISÄÄ</button>
        </form>

        <div className="mission-list">
          {clues.map(clue => (
            <div key={clue.id} className="mission-row" style={{ borderColor: 'gold' }}>
              <div style={{display:'flex', flexDirection:'column'}}>
                <span style={{fontWeight:'bold', color:'#fff'}}>{clue.question}</span>
                <span style={{fontSize:'0.8rem', color:'gold'}}>Vastaus: {clue.code}</span>
              </div>
              <button onClick={() => deleteClue(clue.id)} className="btn-delete-small">🗑</button>
            </div>
          ))}
          {clues.length === 0 && <p className="empty-text">Ei vihjeitä. Lisää vähintään 2!</p>}
        </div>
      </div>

    </div>
  );
};

export default AdminVault;