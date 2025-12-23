// tiedosto: src/pages/AgentPage/AgentPage.jsx

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AgentPage.css';

// HOOKS (Logiikka ja tietokantahaut)
import { useAgentData } from './hooks/useAgentData';

// COMPONENTS
import AgentHeader from './AgentHeader'; 
import AgentDashboard from './components/AgentDashboard';
import FlashMissionOverlay from './components/FlashMissionOverlay';
import AgentChat from './components/AgentChat';
import AgentMissions from './components/AgentMissions';
import VaultTab from './VaultTab';     
import RewardOverlay from './RewardOverlay'; 
import HeistPersonalScoreboard from './HeistPersonalScoreboard';
import { Home, MessageSquare, Briefcase, Lock, Unlock } from 'lucide-react';

const AgentPage = () => {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');
  
  // UI State (Nämä kuuluvat sivulle, eivät hookiin)
  const [activeTab, setActiveTab] = useState('HOME'); // Oletusnäkymä on nyt Dashboard
  const [showScoreboard, setShowScoreboard] = useState(false);

  // Käytetään custom hookia datan hakuun.
  const {
    loading, 
    identity, 
    characterMap, 
    chatHistory, 
    missions, 
    visibleMissions, // <-- HAETAAN VALMIIKSI JÄRJESTETTY LISTA
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
    // Actions
    handleVote, 
    handleSendChat, 
    submitPersonalReport, 
    submitCode,
  } = useAgentData(guestId);

  // Lataus- ja virhetilat
  if (loading) return <div className="ap-loading">LADATAAN...</div>;
  if (!guestId || !identity) return <div className="ap-error">VIRHEELLINEN ID</div>;

  return (
    <div className="ap-container">
      
      {/* 1. HEADER (Näkyy aina ylhäällä) */}
      <AgentHeader 
        identity={identity} 
        onOpenScoreboard={() => setShowScoreboard(true)}
      />

      {/* 2. GLOBAALIT OVERLAYT (Voivat peittää muun sisällön) */}
      
      {/* Flash-tehtävä (Hälytys) */}
      {activeFlash && !flashResponseSent && (
        <FlashMissionOverlay 
          activeFlash={activeFlash} 
          guestId={guestId}
          onComplete={() => setFlashResponseSent(true)} 
        />
      )}

      {/* Palkinto-ilmoitus (XP sadetta) */}
      {rewardData && (
        <RewardOverlay 
          data={rewardData} 
          onClose={() => setRewardData(null)} 
        />
      )}

      {/* Scoreboard (Koko ruudun tilasto) */}
      {showScoreboard && (
        <HeistPersonalScoreboard 
          guestId={guestId} 
          onClose={() => setShowScoreboard(false)} 
        />
      )}

   {/* 3. NAVIGAATIO TABIT */}
      <div className="ap-tabs">
        <button 
          className={activeTab === 'HOME' ? 'active' : ''} 
          onClick={() => setActiveTab('HOME')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
        >
          <Home size={20} />
          <span>KOTI</span>
        </button>

        <button 
          className={activeTab === 'CHAT' ? 'active' : ''} 
          onClick={() => setActiveTab('CHAT')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
        >
          <MessageSquare size={20} />
          <span>CHAT</span>
        </button>

        <button 
          className={activeTab === 'MISSIONS' ? 'active' : ''} 
          onClick={() => setActiveTab('MISSIONS')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
        >
          <Briefcase size={20} />
          <span>TEHTÄVÄT</span>
        </button>

        <button 
          className={activeTab === 'VAULT' ? 'active' : ''} 
          onClick={() => setActiveTab('VAULT')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
        >
          {isVaultActive ? <Unlock size={20} /> : <Lock size={20} />}
          <span>{isVaultActive ? 'AUKI' : 'HOLVI'}</span>
        </button>
      </div>

      {/* 4. PÄÄSISÄLTÖ */}
      <div className="ap-content">
        
        {/* TAB: KOTI (Dashboard) */}
        {activeTab === 'HOME' && (
          <AgentDashboard 
            identity={identity}
            nextMission={nextMission}
            isVaultActive={isVaultActive}
            activePoll={activePoll}
            onNavigate={setActiveTab}
            onOpenScoreboard={() => setShowScoreboard(true)}
            hasVoted={hasVoted}
            onVote={handleVote}
          />
        )}

        {/* TAB: CHAT */}
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

        {/* TAB: TEHTÄVÄT */}
        {activeTab === 'MISSIONS' && (
          <AgentMissions 
            missions={visibleMissions} // <-- VÄLITETÄÄN SEKOITETTU LISTA
            completedIds={completedMissionIds} 
            guestId={guestId}
            onMissionComplete={(id) => setCompletedMissionIds(prev => [...prev, id])}
            submitCode={submitCode}
            secretMission={identity.secretMission}
            personalMissionStatus={personalMissionStatus}
            onPersonalReport={submitPersonalReport}
          />
        )}

        {/* TAB: HOLVI */}
        {activeTab === 'VAULT' && (
          <VaultTab guestId={guestId} isGameActive={isVaultActive} />
        )}

      </div>
    </div>
  );
};

export default AgentPage;