import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './AgentPage.css';

// Komponentit
import AgentHeader from './components/AgentHeader';
import AgentChat from './components/AgentChat';
import AgentMissions from './components/AgentMissions';
import VaultTab from './VaultTab';     
import RewardOverlay from './RewardOverlay'; 

const AgentPage = () => {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');

  // UI STATE
  const [activeTab, setActiveTab] = useState('CHAT'); 
  const [loading, setLoading] = useState(true);
  const [rewardData, setRewardData] = useState(null); 
  
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
  const [personalMissionStatus, setPersonalMissionStatus] = useState('none');
  const [isVaultActive, setIsVaultActive] = useState(false);

  const calculateRank = (points) => {
    if (points >= 2000) return '00-AGENTTI';
    if (points >= 1000) return 'MESTARIVAKOOJA';
    if (points >= 500) return 'KENTTÄAGENTTI';
    if (points >= 100) return 'TIEDUSTELIJA';
    return 'HARJOITTELIJA';
  };

  // --- DATAHAKU ---
  useEffect(() => {
    if (!guestId) { setLoading(false); return; }

    const init = async () => {
      // 1. Sanakirja
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

      // 2. Identiteetti
      const { data: myGuest } = await supabase.from('guests').select('name').eq('id', guestId).single();
      const { data: myChars } = await supabase.from('characters').select('*').eq('assigned_guest_id', guestId);
      const { data: scoreData } = await supabase.from('leaderboard').select('total_score').eq('guest_id', guestId).single();
      
      setMyScore(scoreData?.total_score || 0);
      setMyRank(calculateRank(scoreData?.total_score || 0));

      if (myChars && myChars.length > 0) {
        setIdentity({
          charName: myChars.map(c => c.name).join(' & '),
          realName: myGuest?.name,
          role: myChars[0].role,
          avatar: myChars[0].avatar_url,
          isCharacter: true,
          agentCode: myChars[0].agent_code,
          secretMission: myChars[0].secret_mission 
        });
      } else {
        setIdentity({ charName: null, realName: myGuest?.name || 'Tuntematon', role: 'Vieras', avatar: null, isCharacter: false, agentCode: 'N/A' });
      }

      // 3. Status checks
      const { data: pLog } = await supabase.from('mission_log').select('approval_status').eq('guest_id', guestId).eq('mission_id', 'personal-objective').maybeSingle();
      if (pLog) setPersonalMissionStatus(pLog.approval_status);

      const { data: history } = await supabase.from('chat_messages').select('*, guests(name)').order('created_at', { ascending: true });
      if (history) setChatHistory(history);

      const { data: poll } = await supabase.from('polls').select('*').eq('status', 'active').maybeSingle();
      if (poll) { setActivePoll(poll); checkIfVoted(poll.id); }

      const { data: missionData } = await supabase.from('missions').select('*').eq('is_active', true);
      if (missionData) setMissions(missionData);

      const { data: myLogs } = await supabase.from('mission_log').select('mission_id').eq('guest_id', guestId).neq('approval_status', 'rejected');
      if (myLogs) setCompletedMissionIds(myLogs.map(l => l.mission_id));

      const { data: flash } = await supabase.from('flash_missions').select('*').eq('status', 'active').maybeSingle();
      if (flash) { setActiveFlash(flash); checkFlashResponse(flash.id); }

      const { data: settings } = await supabase.from('game_settings').select('value').eq('key', 'speakeasy_active').maybeSingle();
      if (settings) setIsVaultActive(settings.value);

      setLoading(false);
    };

    init();

    // REALTIME SUBSCRIPTIONS
    const subs = [
      supabase.channel('ag_chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const { data: sender } = await supabase.from('guests').select('name').eq('id', payload.new.guest_id).single();
        setChatHistory(prev => [...prev, { ...payload.new, guests: { name: sender?.name || 'Unknown' } }]);
      }).subscribe(),
      supabase.channel('ag_poll').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'polls' }, (payload) => {
        if (payload.new.status === 'active') { setActivePoll(payload.new); setHasVoted(false); } else { setActivePoll(null); }
      }).subscribe(),
      supabase.channel('ag_flash').on('postgres_changes', { event: '*', schema: 'public', table: 'flash_missions' }, (payload) => {
        if (payload.new.status === 'active') { setActiveFlash(payload.new); setFlashResponseSent(false); } 
        else { setActiveFlash(null); }
      }).subscribe(),
      supabase.channel('ag_settings').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_settings' }, (payload) => {
        if (payload.new.key === 'speakeasy_active') setIsVaultActive(payload.new.value);
      }).subscribe(),
      
      // SCORE & MISSION STATUS
      supabase.channel('ag_score').on('postgres_changes', { event: '*', schema: 'public', table: 'mission_log', filter: `guest_id=eq.${guestId}` }, (payload) => {
        if (payload.eventType === 'UPDATE') {
           if (payload.new.mission_id === 'personal-objective') {
             setPersonalMissionStatus(payload.new.approval_status);
             if (payload.new.approval_status === 'approved') {
               setRewardData({ xp: payload.new.xp_earned, reason: 'Salainen tehtävä hyväksytty!' });
               setMyScore(prev => prev + payload.new.xp_earned);
             }
             if (payload.new.approval_status === 'rejected') alert("Päämaja hylkäsi raporttisi. Yritä uudelleen.");
           } 
           else if (payload.new.approval_status === 'rejected') {
             setCompletedMissionIds(prev => prev.filter(id => id !== payload.new.mission_id));
             alert("Tehtäväsuoritus hylättiin! Voit yrittää uudelleen.");
           }
           else if (payload.new.approval_status === 'approved') {
             const xpDiff = payload.new.xp_earned - payload.old.xp_earned;
             if (xpDiff > 0) {
                setMyScore(prev => prev + xpDiff);
                setRewardData({ xp: xpDiff, reason: 'Suoritus vahvistettu!' });
             }
           }
           return;
        }
        if (payload.eventType === 'INSERT') {
          if (payload.new.approval_status === 'approved') {
            setMyScore(prev => prev + payload.new.xp_earned);
            setRewardData({ xp: payload.new.xp_earned, reason: payload.new.custom_reason || 'Tehtävä suoritettu' });
          }
          if (payload.new.mission_id && payload.new.mission_id !== 'personal-objective') {
            setCompletedMissionIds(prev => [...prev, payload.new.mission_id]);
          }
        }
      }).subscribe()
    ];

    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [guestId]);

  // HANDLERS
  const checkIfVoted = async (pollId) => { const { data } = await supabase.from('poll_votes').select('id').eq('poll_id', pollId).eq('guest_id', guestId).maybeSingle(); if (data) setHasVoted(true); };
  const handleVote = async (index) => { if (!activePoll || hasVoted) return; setHasVoted(true); await supabase.from('poll_votes').insert({ poll_id: activePoll.id, guest_id: guestId, option_index: index }); };
  const handleSend = async (msg) => { const { error } = await supabase.from('chat_messages').insert({ guest_id: guestId, message: msg.trim() }); return !error; };
  const checkFlashResponse = async (flashId) => { const { data } = await supabase.from('flash_responses').select('id').eq('flash_id', flashId).eq('guest_id', guestId).maybeSingle(); if (data) setFlashResponseSent(true); };
  
  const handleFlashAction = async () => {
    if (!activeFlash || flashResponseSent) return;
    setFlashResponseSent(true);
    await supabase.from('flash_responses').insert({ flash_id: activeFlash.id, guest_id: guestId });
    await supabase.from('mission_log').insert({ guest_id: guestId, xp_earned: activeFlash.xp_reward, custom_reason: `Flash: ${activeFlash.title}`, approval_status: 'approved' });
  };

  const submitPersonalReport = async (reportText, imageUrl) => {
    let proofString = reportText || "Ei tekstiraporttia.";
    if (imageUrl) proofString += ` | [KATSO KUVA]`;

    const { error } = await supabase.from('mission_log').insert({
      guest_id: guestId,
      mission_id: 'personal-objective', 
      xp_earned: 0,
      approval_status: 'pending',
      proof_data: JSON.stringify({ text: reportText, image: imageUrl })
    });

    if (error) {
      alert("Virhe lähetyksessä (olet ehkä jo lähettänyt raportin).");
    } else {
      setPersonalMissionStatus('pending');
      alert("Raportti lähetetty päämajaan! Pisteet kirjataan hyväksynnän jälkeen.");
    }
  };

  const submitCode = async (mission, code) => {
    if (code.length !== 4) { alert("Syötä 4-numeroinen koodi."); return false; }
    
    const { data: targetChar } = await supabase.from('characters').select('*').eq('agent_code', code).maybeSingle();
    
    if (!targetChar) { alert("Virheellinen agenttikoodi."); return false; }
    if (targetChar.assigned_guest_id === guestId) { alert("Et voi etsiä itseäsi!"); return false; }

    if (mission.target_tag) {
      const tag = mission.target_tag.toLowerCase();
      const role = (targetChar.role || '').toLowerCase();
      const name = (targetChar.name || '').toLowerCase();
      const story = (targetChar.backstory || '').toLowerCase();
      const isMatch = role.includes(tag) || name.includes(tag) || story.includes(tag);

      if (!isMatch) { 
        alert(`VÄÄRÄ KOHDE! Tehtävä vaatii: "${mission.target_tag}"`); 
        return false; 
      }
    }

    const { error } = await supabase.from('mission_log').insert({
      guest_id: guestId,
      mission_id: mission.id,
      xp_earned: mission.xp_reward,
      approval_status: 'approved',
      custom_reason: `Kohde löydetty: ${targetChar.name}` 
    });

    if (error) { alert("Virhe tai tehtävä jo suoritettu!"); return false; } 
    return true; 
  };

  if (loading) return <div className="ap-loading">LADATAAN...</div>;
  if (!guestId || !identity) return <div className="ap-error">VIRHEELLINEN ID</div>;

  return (
    <div className="ap-container">
      
      <AgentHeader identity={identity} myScore={myScore} myRank={myRank} />

      <div className="ap-tabs">
        <button className={activeTab === 'CHAT' ? 'active' : ''} onClick={() => setActiveTab('CHAT')}>💬 CHAT</button>
        <button className={activeTab === 'MISSIONS' ? 'active' : ''} onClick={() => setActiveTab('MISSIONS')}>🕵️ TEHTÄVÄT</button>
        <button className={activeTab === 'VAULT' ? 'active' : ''} onClick={() => setActiveTab('VAULT')}>
           {isVaultActive ? '🔓 HOLVI' : '🔒 HOLVI'}
        </button>
      </div>

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

      {rewardData && <RewardOverlay data={rewardData} onClose={() => setRewardData(null)} />}

      <div className="ap-content">
        
        {activeTab === 'CHAT' && (
          <AgentChat 
            guestId={guestId}
            chatHistory={chatHistory}
            characterMap={characterMap}
            activePoll={activePoll}
            hasVoted={hasVoted}
            onVote={handleVote}
            onSend={handleSend}
          />
        )}

        {activeTab === 'MISSIONS' && (
          <AgentMissions 
            missions={missions}
            completedIds={completedMissionIds}
            guestId={guestId}
            onMissionComplete={(id) => setCompletedMissionIds(prev => [...prev, id])}
            submitCode={submitCode}
            
            // KORJAUS: `guestId` on nyt vain kerran
            secretMission={identity.secretMission}
            personalMissionStatus={personalMissionStatus}
            onPersonalReport={submitPersonalReport}
          />
        )}

        {activeTab === 'VAULT' && (
          <VaultTab guestId={guestId} isGameActive={isVaultActive} />
        )}

      </div>
    </div>
  );
};

export default AgentPage;