import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './AdminPage.css';

const AdminPage = () => {
  const [polls, setPolls] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState('');

  // 1. LATAA DATA
  const fetchData = async () => {
    const { data: pollsData } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: votesData } = await supabase
      .from('poll_votes')
      .select('poll_id, option_index')
      .limit(2000);

    if (pollsData) setPolls(pollsData);
    
    if (votesData) {
      const counts = {};
      votesData.forEach(vote => {
        if (!counts[vote.poll_id]) counts[vote.poll_id] = {};
        const idx = vote.option_index;
        counts[vote.poll_id][idx] = (counts[vote.poll_id][idx] || 0) + 1;
      });
      setVoteCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const pollSub = supabase.channel('admin_polls').on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, fetchData).subscribe();
    const voteSub = supabase.channel('admin_votes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_votes' }, 
      (payload) => {
        const { poll_id, option_index } = payload.new;
        setVoteCounts(prev => {
          const p = { ...(prev[poll_id] || {}) };
          p[option_index] = (p[option_index] || 0) + 1;
          return { ...prev, [poll_id]: p };
        });
      }
    ).subscribe();

    return () => { supabase.removeChannel(pollSub); supabase.removeChannel(voteSub); };
  }, []);

  // --- UUSI TOIMINTO: POISTA KYSELY ---
  const deletePoll = async (id) => {
    if (!window.confirm("Haluatko varmasti poistaa tämän kyselyn ja kaikki sen äänet?")) return;

    // 1. Poistetaan ensin äänet (jotta ei tule database-virhettä)
    await supabase.from('poll_votes').delete().eq('poll_id', id);

    // 2. Poistetaan itse kysely
    const { error } = await supabase.from('polls').delete().eq('id', id);
    
    if (error) alert("Virhe poistossa: " + error.message);
    // Lista päivittyy automaattisesti Realtime-kuuntelijan ansiosta
  };
  // ------------------------------------

  const createPoll = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newOptions.trim()) return;
    const optionsArray = newOptions.split(',').map(o => o.trim()).filter(o => o);
    if (optionsArray.length < 2) { alert("Anna vähintään 2 vaihtoehtoa"); return; }
    
    const { error } = await supabase.from('polls').insert({ question: newQuestion, options: optionsArray, status: 'closed' });
    if (!error) { setNewQuestion(''); setNewOptions(''); }
  };

  const setStatus = async (id, status) => {
    if (status === 'active') await supabase.from('polls').update({ status: 'closed' }).neq('id', id);
    await supabase.from('polls').update({ status }).eq('id', id);
  };

  const clearChat = async () => {
    if (window.confirm("Tyhjennetäänkö chat?")) await supabase.from('chat_messages').delete().neq('id', '0000');
  };

  const activePoll = polls.find(p => p.status === 'active');
  const pastPolls = polls.filter(p => p.status !== 'active');

  const ResultBars = ({ poll }) => {
    const counts = voteCounts[poll.id] || {};
    const total = Object.values(counts).reduce((a,b)=>a+b,0);
    
    return (
      <div className="admin-results">
        {poll.options.map((opt, idx) => {
          const count = counts[idx] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const isLeader = count > 0 && count === Math.max(...Object.values(counts));
          
          return (
            <div key={idx} className="admin-result-row">
              <div className="result-label">
                <span className={isLeader ? 'leader-text' : ''}>{opt}</span>
                <span className="result-count">{count} ääntä</span>
              </div>
              <div className="result-bar-bg">
                <div className="result-bar-fill" style={{ width: `${pct}%`, background: isLeader ? '#00ff41' : '#666' }}></div>
              </div>
            </div>
          );
        })}
        <div className="poll-total">Yhteensä: {total} ääntä</div>
      </div>
    );
  };

  if (loading) return <div className="admin-container">Ladataan...</div>;

  return (
    <div className="admin-container">
      <h1>DJ MISSION CONTROL</h1>

      <div className="admin-panel new-poll">
        <h2>➕ LUO UUSI</h2>
        <form onSubmit={createPoll}>
          <div className="form-group">
            <label>Kysymys</label>
            <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Esim. Mikä biisi?" className="input-field"/>
          </div>
          <div className="form-group">
            <label>Vaihtoehdot (pilkulla erotettuna)</label>
            <input value={newOptions} onChange={e => setNewOptions(e.target.value)} placeholder="Esim. Sandstorm, Cha Cha Cha" className="input-field"/>
          </div>
          <button type="submit" className="btn-create">TALLENNA JÄRJESTELMÄÄN</button>
        </form>
      </div>

      {activePoll && (
        <div className="admin-section live-section">
          <h2 className="live-title">🔴 LIVE NYT (Seinällä)</h2>
          <div className="poll-card active-card-large">
            <div className="poll-header">
              <h3>{activePoll.question}</h3>
              <button className="btn-stop-large" onClick={() => setStatus(activePoll.id, 'closed')}>⏹ LOPETA</button>
            </div>
            <ResultBars poll={activePoll} />
          </div>
        </div>
      )}

      <div className="admin-section history-section">
        <h2>🗄 HISTORIA / ODOTTAVAT</h2>
        <div className="history-list">
          {pastPolls.length === 0 && <p className="empty-text">Ei äänestyksiä.</p>}
          
          {pastPolls.map((poll) => (
            <div key={poll.id} className="poll-card history-card">
              <div className="poll-info">
                <div className="history-header">
                  <h3>{poll.question}</h3>
                  <div className="history-actions">
                    <button className="btn-start-small" onClick={() => setStatus(poll.id, 'active')}>▶ PLAY</button>
                    {/* --- POISTA-NAPPI --- */}
                    <button className="btn-delete-small" onClick={() => deletePoll(poll.id)}>🗑</button>
                  </div>
                </div>
                <ResultBars poll={poll} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panic-section">
        <button className="btn-panic" onClick={clearChat}>☢ CLEAR CHAT ☢</button>
      </div>
    </div>
  );
};

export default AdminPage;