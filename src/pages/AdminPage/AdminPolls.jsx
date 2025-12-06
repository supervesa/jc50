import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AdminPolls = ({ polls, voteCounts }) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState('');

  // --- ACTIONS ---
  const createPoll = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newOptions.trim()) return;
    const optionsArray = newOptions.split(',').map(o => o.trim()).filter(o => o);
    await supabase.from('polls').insert({ question: newQuestion, options: optionsArray, status: 'closed' });
    setNewQuestion(''); setNewOptions('');
  };

  const setPollStatus = async (id, status) => {
    if (status === 'active') await supabase.from('polls').update({ status: 'closed' }).neq('id', id);
    await supabase.from('polls').update({ status }).eq('id', id);
  };

  const deletePoll = async (id) => {
    if (!confirm("Poistetaanko?")) return;
    await supabase.from('poll_votes').delete().eq('poll_id', id);
    await supabase.from('polls').delete().eq('id', id);
  };

  // UI HELPERS
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
          return (
            <div key={idx} className="admin-result-row">
              <div className="result-label"><span>{opt}</span><span>{count}</span></div>
              <div className="result-bar-bg"><div className="result-bar-fill" style={{ width: `${pct}%`, background: '#00ff41' }}></div></div>
            </div>
          );
        })}
        <div className="poll-total">Yhteensä: {total}</div>
      </div>
    );
  };

  return (
    <>
      <div className="admin-panel new-poll">
        <h2>➕ LUO UUSI ÄÄNESTYS</h2>
        <form onSubmit={createPoll}>
          <div className="form-group"><input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Kysymys..." className="input-field"/></div>
          <div className="form-group"><input value={newOptions} onChange={e => setNewOptions(e.target.value)} placeholder="Vaihtoehdot..." className="input-field"/></div>
          <button type="submit" className="btn-create">TALLENNA</button>
        </form>
      </div>

      {activePoll && (
        <div className="admin-section live-section">
          <h2 className="live-title">🔴 LIVE POLL</h2>
          <div className="poll-card active-card-large">
            <div className="poll-header"><h3>{activePoll.question}</h3><button className="btn-stop-large" onClick={() => setPollStatus(activePoll.id, 'closed')}>⏹ LOPETA</button></div>
            <ResultBars poll={activePoll} />
          </div>
        </div>
      )}

      <div className="admin-section">
        <h2>HISTORIA</h2>
        <div className="history-list">
          {pastPolls.map((poll) => (
            <div key={poll.id} className="poll-card history-card">
              <div className="poll-info">
                <div className="history-header">
                  <h3>{poll.question}</h3>
                  <div className="history-actions">
                    <button className="btn-start-small" onClick={() => setPollStatus(poll.id, 'active')}>▶</button>
                    <button className="btn-delete-small" onClick={() => deletePoll(poll.id)}>🗑</button>
                  </div>
                </div>
                <ResultBars poll={poll} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminPolls;