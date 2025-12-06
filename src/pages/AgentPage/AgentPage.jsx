import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './AgentPage.css';

// Komponentit
import AgentHeader from './AgentHeader';
import AgentChat from './AgentChat';
import AgentMissions from './AgentMissions';
import RewardOverlay from './RewardOverlay'; // <--- UUSI

const AgentPage = () => {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');

  // UI STATE
  const [activeTab, setActiveTab] = useState('CHAT'); 
  const [loading, setLoading] = useState(true);
  
  // REWARD STATE (UUSI)
  const [rewardData, setRewardData] = useState(null); // { xp: 500, reason: 'Hyvä tanssi' }

  // DATA STATE
  const [identity, setIdentity] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState('Harjoittelija');
  const [characterMap, setCharacterMap] = useState({});
  const [chatHistory, setChatHistory] = useState([]); 

  // GAME STATE
  const [activePoll, setActivePoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [missions, setMissions] = useState([]);
  const [completedMissionIds, setCompletedMissionIds] = useState([]); 
  const [activeFlash, setActiveFlash] = useState(null);
  const [flashResponseSent, setFlashResponseSent] = useState(false);

  // --- APU: RANK ---
  const calculateRank = (points) => {
    if (points >= 2000) return '00-AGENTTI';
    if (points >= 1000) return 'MESTARIVAKOOJA';
    if (points >= 500) return 'KENTTÄAGENTTI';
    if (points >= 100) return 'TIEDUSTELIJA';
    return 'HARJOITTELIJA';
  };

  // --- 1. DATAHAKU JA REALTIME ---
  useEffect(() => {
    if (!guestId) { setLoading(false); return; }

    const init = async () => {
      // (Sama alustuskoodi kuin aiemmin, ei muutoksia tässä lohkossa...)
      // ...
      const { data: allChars } = await supabase.from('characters').select('assigned_guest_id, name, avatar_url');
      const charMap = {};
      if (allChars) allChars.forEach(c => {
        if (c.assigned_guest_id) {
           if(charMap[c.assigned_guest_id]) {
             charMap[c.assigned_guest_id].name += ` & ${c.name}`;
             if(!charMap[c.assigned_guest_id].avatar) charMap[c.assigned_guest_id].avatar = c.avatar_url;
           } else {
             charMap[c.assigned_guest_id] = { name: c.name, avatar: c.avatar_url };
           }
        }
      });
      setCharacterMap(charMap);

      const { data: myGuest } = await supabase.from('guests').select('name').eq('id', guestId).single();
      const { data: myChars } = await supabase.from('characters').select('*').eq('assigned_guest_id', guestId);
      const { data: scoreData } = await supabase.from('leaderboard').select('total_score').eq('guest_id', guestId).single();
      
      const score = scoreData?.total_score || 0;
      setMyScore(score);
      setMyRank(calculateRank(score));

      if (myChars && myChars.length > 0) {
        setIdentity({
          charName: myChars.map(c => c.name).join(' & '),
          realName: myGuest?.name,
          role: myChars[0].role,
          avatar: myChars[0].avatar_url,
          isCharacter: true,
          agentCode: myChars[0].agent_code 
        });
      } else {
        setIdentity({ charName: null, realName: myGuest?.name || 'Tuntematon', role: 'Vieras', avatar: null, isCharacter: false, agentCode: 'N/A' });
      }

      const { data: history } = await supabase.from('chat_messages').select('*, guests(name)').order('created_at', { ascending: true });
      if (history) setChatHistory(history);

      const { data: poll } = await supabase.from('polls').select('*').eq('status', 'active').maybeSingle();
      if (poll) { setActivePoll(poll); checkIfVoted(poll.id); }

      const { data: missionData } = await supabase.from('missions').select('*').eq('is_active', true);
      if (missionData) setMissions(missionData);

      const { data: myLogs } = await supabase.from('mission_log').select('mission_id').eq('guest_id', guestId);
      if (myLogs) setCompletedMissionIds(myLogs.map(l => l.mission_id));

      const { data: flash } = await supabase.from('flash_missions').select('*').eq('status', 'active').maybeSingle();
      if (flash) { setActiveFlash(flash); checkFlashResponse(flash.id); }

      setLoading(false);
    };

    init();

    // --- REALTIME SUBSCRIPTIONS ---
    const chatSub = supabase
      .channel('ag_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const { data: sender } = await supabase.from('guests').select('name').eq('id', payload.new.guest_id).single();
        setChatHistory(prev => [...prev, { ...payload.new, guests: { name: sender?.name || 'Unknown' } }]);
      })
      .subscribe();
      
    const pollSub = supabase
      .channel('ag_poll')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'polls' }, (payload) => {
        if (payload.new.status === 'active') { setActivePoll(payload.new); setHasVoted(false); } else { setActivePoll(null); }
      })
      .subscribe();

    const flashSub = supabase
      .channel('ag_flash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_missions' }, (payload) => {
        if (payload.new.status === 'active') { setActiveFlash(payload.new); setFlashResponseSent(false); } 
        else { setActiveFlash(null); }
      })
      .subscribe();

    // --- TÄSSÄ OLI ONGELMA: PISTEIDEN KUUNTELU ---
    const scoreSub = supabase
      .channel('ag_score')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mission_log' }, 
        (payload) => {
          console.log("Uusi logi-merkintä saapui:", payload.new);

          // TARKISTUS: Kuuluuko tämä piste minulle?
          if (payload.new.guest_id === guestId) {
            
            // 1. Päivitä pisteet (Optimistinen päivitys)
            setMyScore(prev => {
              const newScore = prev + payload.new.xp_earned;
              setMyRank(calculateRank(newScore));
              return newScore;
            });
            
            // 2. Päivitä tehtävälista suoritetuksi
            if (payload.new.mission_id) {
              setCompletedMissionIds(prev => [...prev, payload.new.mission_id]);
            }

            // 3. NÄYTÄ PALKINTORUUTU!
            setRewardData({
              xp: payload.new.xp_earned,
              // Jos on custom_reason (Admin bonus), käytä sitä. Muuten geneerinen.
              reason: payload.new.custom_reason || 'Tehtävä suoritettu'
            });
          }
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(chatSub); 
      supabase.removeChannel(pollSub);
      supabase.removeChannel(flashSub);
      supabase.removeChannel(scoreSub);
    };

    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [guestId]);

  // --- HANDLERS ---
  const checkIfVoted = async (pollId) => { 
    const { data } = await supabase.from('poll_votes').select('id').eq('poll_id', pollId).eq('guest_id', guestId).maybeSingle(); 
    if (data) setHasVoted(true); 
  };
  const handleVote = async (index) => { if (!activePoll || hasVoted) return; setHasVoted(true); await supabase.from('poll_votes').insert({ poll_id: activePoll.id, guest_id: guestId, option_index: index }); };
  const handleSend = async (msg) => { const { error } = await supabase.from('chat_messages').insert({ guest_id: guestId, message: msg.trim() }); return !error; };

  const checkFlashResponse = async (flashId) => { const { data } = await supabase.from('flash_responses').select('id').eq('flash_id', flashId).eq('guest_id', guestId).maybeSingle(); if (data) setFlashResponseSent(true); };
  
  const handleFlashAction = async () => {
    if (!activeFlash || flashResponseSent) return;
    setFlashResponseSent(true);
    await supabase.from('flash_responses').insert({ flash_id: activeFlash.id, guest_id: guestId });
    // Flashin pisteet tulevat Realtime-kanavan kautta takaisin ja laukaisevat RewardOverlayn
    await supabase.from('mission_log').insert({ guest_id: guestId, xp_earned: activeFlash.xp_reward, custom_reason: `Flash: ${activeFlash.title}` });
  };


  if (loading) return <div className="ap-loading">LADATAAN...</div>;
  if (!guestId || !identity) return <div className="ap-error">VIRHEELLINEN ID</div>;

  return (
    <div className="ap-container">
      <AgentHeader identity={identity} myScore={myScore} myRank={myRank} />

      <div className="ap-tabs">
        <button className={activeTab === 'CHAT' ? 'active' : ''} onClick={() => setActiveTab('CHAT')}>💬 CHAT</button>
        <button className={activeTab === 'MISSIONS' ? 'active' : ''} onClick={() => setActiveTab('MISSIONS')}>🕵️ TEHTÄVÄT</button>
      </div>

      {/* FLASH OVERLAY */}
      {activeFlash && !flashResponseSent && (
        <div className="ap-flash-overlay">
          <div className="flash-content">
            <h2 className="blink">⚠️ HÄLYTYS ⚠️</h2>
            <h3>{activeFlash.title}</h3>
            <p>Palkkio: {activeFlash.xp_reward} XP</p>
            {activeFlash.type === 'mob' && <button className="flash-btn-action" onClick={handleFlashAction}>✋ OLEN PAIKALLA!</button>}
            {activeFlash.type === 'race' && <div className="flash-instruct">JUOKSE DJ:N LUOKSE!</div>}
            {activeFlash.type === 'photo' && <div className="flash-instruct">OTA KUVA (Vaihda välilehteä)!</div>}
          </div>
        </div>
      )}

      {/* --- UUSI: REWARD OVERLAY --- */}
      {rewardData && (
        <RewardOverlay 
          data={rewardData} 
          onClose={() => setRewardData(null)} 
        />
      )}

      {/* TAB CONTENT */}
      <div className="ap-content">
        {activeTab === 'CHAT' && (
          <AgentChat 
            guestId={guestId} chatHistory={chatHistory} characterMap={characterMap} activePoll={activePoll} hasVoted={hasVoted} onVote={handleVote} onSend={handleSend}
          />
        )}

        {activeTab === 'MISSIONS' && (
          <AgentMissions 
            missions={missions} completedIds={completedMissionIds} guestId={guestId} onMissionComplete={(id) => setCompletedMissionIds(prev => [...prev, id])}
          />
        )}
      </div>
    </div>
  );
};

export default AgentPage;