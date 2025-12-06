import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './AdminPage.css';

// Tuodaan uudet komponentit
import AdminPolls from './AdminPolls';
import AdminOps from './AdminOps';
import AdminGuests from './AdminGuests';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('POLLS');
  const [loading, setLoading] = useState(true);
  
  // SHARED DATA STATE
  const [polls, setPolls] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [guests, setGuests] = useState([]);
  const [missions, setMissions] = useState([]);
  const [activeFlash, setActiveFlash] = useState(null);
  const [flashCount, setFlashCount] = useState(0);

  // --- DATAHAKU ---
  const fetchData = async () => {
    // Polls
    const { data: pollsData } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
    const { data: votesData } = await supabase.from('poll_votes').select('poll_id, option_index').limit(2000);
    
    // Game Data
    const { data: guestsData } = await supabase.from('guests').select('id, name').order('name');
    const { data: missionData } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
    const { data: flashData } = await supabase.from('flash_missions').select('*').eq('status', 'active').maybeSingle();

    if (pollsData) setPolls(pollsData);
    if (guestsData) setGuests(guestsData);
    if (missionData) setMissions(missionData);
    if (flashData) {
      setActiveFlash(flashData);
      fetchFlashCount(flashData.id);
    } else {
      // TÄMÄ PUUTTUI: Jos aktiivista tehtävää ei löydy, nollaa tila!
      setActiveFlash(null);
      setFlashCount(0);
    }

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

  const fetchFlashCount = async (flashId) => {
    const { count } = await supabase.from('flash_responses').select('*', { count: 'exact', head: true }).eq('flash_id', flashId);
    setFlashCount(count || 0);
  };

  useEffect(() => {
    fetchData();

   // REALTIME (Kuunnellaan kaikkea täällä ja päivitetään tilaa)
    const subs = [
      supabase.channel('adm_polls').on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, fetchData).subscribe(),
      supabase.channel('adm_votes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_votes' }, fetchData).subscribe(),
      supabase.channel('adm_flash').on('postgres_changes', { event: '*', schema: 'public', table: 'flash_missions' }, fetchData).subscribe(),
      
      // --- LISÄÄ TÄMÄ RIVI ---
      supabase.channel('adm_guests').on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchData).subscribe(),
      // -----------------------

      supabase.channel('adm_flash_resp').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flash_responses' }, () => {
        if(activeFlash) fetchFlashCount(activeFlash.id);
      }).subscribe(),
      supabase.channel('adm_missions').on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, fetchData).subscribe()
    ];

    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [activeFlash]);

  const clearChat = async () => { if (confirm("Tyhjennetäänkö chat?")) await supabase.from('chat_messages').delete().neq('id', '0000'); };

  if (loading) return <div className="admin-container">Ladataan...</div>;

  return (
    <div className="admin-container">
      <h1>MISSION CONTROL</h1>

      {/* TABS */}
      <div className="admin-tabs">
        <button className={activeTab === 'POLLS' ? 'active' : ''} onClick={() => setActiveTab('POLLS')}>📊 POLLS</button>
        <button className={activeTab === 'OPS' ? 'active' : ''} onClick={() => setActiveTab('OPS')}>🕵️ OPS</button>
        <button className={activeTab === 'GUESTS' ? 'active' : ''} onClick={() => setActiveTab('GUESTS')}>👥 GUESTS</button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'POLLS' && <AdminPolls polls={polls} voteCounts={voteCounts} />}
      
      {activeTab === 'OPS' && (
        <AdminOps 
          activeFlash={activeFlash} 
          flashCount={flashCount} 
          missions={missions} 
          guests={guests} 
        />
      )}
      
      {activeTab === 'GUESTS' && <AdminGuests guests={guests} />}

      <div className="panic-section">
        <button className="btn-panic" onClick={clearChat}>☢ TYHJENNÄ CHAT ☢</button>
      </div>
    </div>
  );
};

export default AdminPage;