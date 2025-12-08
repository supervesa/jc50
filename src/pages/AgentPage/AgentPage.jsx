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

const AgentPage = () => {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');
  
  // UI State (Nämä kuuluvat sivulle, eivät hookiin)
  const [activeTab, setActiveTab] = useState('HOME'); // Oletusnäkymä on nyt Dashboard
  const [showScoreboard, setShowScoreboard] = useState(false);

  // Käytetään custom hookia datan hakuun.
  // Tämä pitää itse komponentin koodin siistinä.
  const {
    loading, 
    identity, 
    characterMap, 
    chatHistory, 
    missions, 
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
    nextMission, // <--- UUSI: Seuraava suositeltu tehtävä
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
        <button className={activeTab === 'HOME' ? 'active' : ''} onClick={() => setActiveTab('HOME')}>🏠 KOTI</button>
        <button className={activeTab === 'CHAT' ? 'active' : ''} onClick={() => setActiveTab('CHAT')}>💬 CHAT</button>
        <button className={activeTab === 'MISSIONS' ? 'active' : ''} onClick={() => setActiveTab('MISSIONS')}>🕵️ TEHTÄVÄT</button>
        <button className={activeTab === 'VAULT' ? 'active' : ''} onClick={() => setActiveTab('VAULT')}>
           {isVaultActive ? '🔓 HOLVI' : '🔒 HOLVI'}
        </button>
      </div>

      {/* 4. PÄÄSISÄLTÖ */}
      <div className="ap-content">
        
        {/* TAB: KOTI (Dashboard) */}
        {activeTab === 'HOME' && (
          <AgentDashboard 
            identity={identity}
            nextMission={nextMission}     // Välitetään seuraava tehtävä
            isVaultActive={isVaultActive}
            activePoll={activePoll}
            onNavigate={setActiveTab}     // Mahdollistaa hyppäämisen muihin tabeihin
            onOpenScoreboard={() => setShowScoreboard(true)} // Hero-kortin klikkaus
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
            missions={missions}
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