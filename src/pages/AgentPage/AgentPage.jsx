// tiedosto: src/pages/AgentPage/AgentPage.jsx

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AgentPage.css';

// HOOKS
import { useAgentData } from './hooks/useAgentData';

// COMPONENTS
import AgentHeader from './AgentHeader'; 
import AgentDashboard from './components/AgentDashboard';
import FlashMissionOverlay from './components/FlashMissionOverlay';
import AgentChat from './components/AgentChat';
import AgentMissions from './components/AgentMissions';
import VaultTab from './VaultTab';     
import RewardOverlay from './RewardOverlay'; 

// MODAALIT
import HeistPersonalScoreboard from './HeistPersonalScoreboard';
import HeistLeaderboard from '../../components/leader/HeistLeaderboard'; // Kytketty nyt oikeaan tiedostoon

import { Home, MessageSquare, Briefcase, Lock, Unlock } from 'lucide-react';

const AgentPage = () => {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState('HOME');
  const [showPersonalScoreboard, setShowPersonalScoreboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const {
    loading, 
    identity, 
    characterMap, 
    chatHistory, 
    visibleMissions, 
    completedMissionIds, 
    setCompletedMissionIds,
    activePoll, 
    hasVoted, 
    activeFlash, 
    flashResponseSent, 
    setFlashResponseSent,
    personalMissionStatus, 
    isVaultActive, 
    rewardData, 
    setRewardData,
    nextMission, 
    handleVote, 
    handleSendChat, 
    submitPersonalReport, 
    submitCode,
  } = useAgentData(guestId);

  if (loading) return <div className="ap-loading">LADATAAN...</div>;
  if (!guestId || !identity) return <div className="ap-error">VIRHEELLINEN ID</div>;

  return (
    <div className="ap-container">
      <div style={{ position: 'relative', zIndex: 50 }}>
        <AgentHeader 
          identity={identity} 
          onOpenScoreboard={() => setShowPersonalScoreboard(true)}
        />
      </div>

      {/* OVERLAYT */}
      {activeFlash && !flashResponseSent && (
        <FlashMissionOverlay 
          activeFlash={activeFlash} 
          guestId={guestId}
          onComplete={() => setFlashResponseSent(true)} 
        />
      )}

      {rewardData && (
        <RewardOverlay data={rewardData} onClose={() => setRewardData(null)} />
      )}

      {/* MODAALI: Omat tilastot */}
      {showPersonalScoreboard && (
        <HeistPersonalScoreboard 
          guestId={guestId} 
          onClose={() => setShowPersonalScoreboard(false)} 
        />
      )}

      {/* MODAALI: Globaali Leaderboard (Kytketty nyt oikein) */}
      {showLeaderboard && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
           <HeistLeaderboard onClose={() => setShowLeaderboard(false)} />
        </div>
      )}

{/* 3. NAVIGAATIO (Palautettu metallinen tyyli) */}
      <div className="ap-tabs">
        <button className={activeTab === 'HOME' ? 'active' : ''} onClick={() => setActiveTab('HOME')}>
          <Home size={18} /> <span>KOTI</span>
        </button>

        <button className={activeTab === 'CHAT' ? 'active' : ''} onClick={() => setActiveTab('CHAT')}>
          <MessageSquare size={18} /> <span>CHAT</span>
        </button>

        <button className={activeTab === 'MISSIONS' ? 'active' : ''} onClick={() => setActiveTab('MISSIONS')}>
          <Briefcase size={18} /> <span>TEHTÄVÄT</span>
        </button>

        <button className={activeTab === 'VAULT' ? 'active' : ''} onClick={() => setActiveTab('VAULT')}>
          {isVaultActive ? <Unlock size={18} /> : <Lock size={18} />} 
          <span>{isVaultActive ? 'AUKI' : 'HOLVI'}</span>
        </button>
      </div>

      <div className="ap-content">
        {activeTab === 'HOME' && (
          <AgentDashboard 
            identity={identity}
            nextMission={nextMission}
            isVaultActive={isVaultActive}
            activePoll={activePoll}
            onNavigate={setActiveTab}
            onOpenPersonal={() => setShowPersonalScoreboard(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            hasVoted={hasVoted}
            onVote={handleVote}
          />
        )}

        {activeTab === 'CHAT' && (
          <AgentChat 
            guestId={guestId}
            chatHistory={chatHistory}
            characterMap={characterMap}
            activePoll={activePoll}
            hasVoted={hasVoted}
            onVote={handleVote}
            onSend={handleSendChat}
          />
        )}

        {activeTab === 'MISSIONS' && (
          <AgentMissions 
            missions={visibleMissions} 
            completedIds={completedMissionIds} 
            guestId={guestId}
            onMissionComplete={(id) => setCompletedMissionIds(prev => [...prev, id])}
            submitCode={submitCode}
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