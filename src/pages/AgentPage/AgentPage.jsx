import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AgentPage.css';

// HOOKS
import { useAgentData } from './hooks/useAgentData';
import { useGameConfig } from '../../hooks/useGameConfig'; // UUSI HOOK

// COMPONENTS
import AgentHeader from './AgentHeader'; 
import AgentDashboard from './components/AgentDashboard';
import FlashMissionOverlay from './components/FlashMissionOverlay';
import AgentChat from './components/AgentChat';
import AgentMissions from './components/AgentMissions';
import VaultTab from './VaultTab';     
import RewardOverlay from './RewardOverlay'; 
import IntroOverlay from '../../components/IntroOverlay'; // LISÄTTY INTRO

// MODAALIT
import HeistPersonalScoreboard from './HeistPersonalScoreboard';
import HeistLeaderboard from '../../components/leader/HeistLeaderboard'; 

import { Home, MessageSquare, Briefcase, Lock, Unlock } from 'lucide-react';

const AgentPage = () => {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState('HOME');
  const [showPersonalScoreboard, setShowPersonalScoreboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // LISÄTTY: Intron tilanhallinta
  const [showIntro, setShowIntro] = useState(true);
  // --- UUSI LISÄYS: PWA MUISTI ---
  // Kun sivu latautuu, kerrotaan selaimelle, että ollaan Agentissa.
  // Näin ensi kerralla appi aukeaa suoraan tänne.
  useEffect(() => {
    if (guestId) {
      localStorage.setItem('last_visited_id', guestId);
      localStorage.setItem('last_visited_type', 'agent'); // Tärkeä: kertoo tyypin
    }
  }, [guestId]);
  // ------------------------------

  // 1. HAE PELIVAIHE
  const { chatOpen, missionsOpen, loading: configLoading } = useGameConfig(guestId);

  const {
    loading: dataLoading, 
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

  // 2. SISÄLLÖN VARTIJA (Content Guard)
  // Jos käyttäjä on välilehdellä, joka ei ole auki, palauta kotiin
  useEffect(() => {
    if (activeTab === 'MISSIONS' && !missionsOpen) setActiveTab('HOME');
    if (activeTab === 'VAULT' && !missionsOpen) setActiveTab('HOME');
    if (activeTab === 'CHAT' && !chatOpen) setActiveTab('HOME');
  }, [activeTab, missionsOpen, chatOpen]);

  // LISÄTTY: Näytetään intro ensin (kestää vähintään 1.6s)
  if (showIntro) {
    return <IntroOverlay mode="agent" onComplete={() => setShowIntro(false)} />;
  }

  if (dataLoading || configLoading) return <div className="ap-loading">LADATAAN...</div>;
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
  {/* LISÄTTY && missionsOpen TÄHÄN ALLE: */}
      {activeFlash && !flashResponseSent && missionsOpen && (
        <FlashMissionOverlay 
          activeFlash={activeFlash} 
          guestId={guestId}
          onComplete={() => setFlashResponseSent(true)} 
        />
      )}

      {rewardData && (
        <RewardOverlay data={rewardData} onClose={() => setRewardData(null)} />
      )}

      {showPersonalScoreboard && (
        <HeistPersonalScoreboard 
          guestId={guestId} 
          onClose={() => setShowPersonalScoreboard(false)} 
        />
      )}

      {showLeaderboard && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
           <HeistLeaderboard onClose={() => setShowLeaderboard(false)} />
        </div>
      )}

      {/* 3. NAVIGAATIO: EHDOLINEN RENDERÖINTI */}
      <div className="ap-tabs">
        <button className={activeTab === 'HOME' ? 'active' : ''} onClick={() => setActiveTab('HOME')}>
          <Home size={18} /> <span>KOTI</span>
        </button>

        {chatOpen && (
          <button className={activeTab === 'CHAT' ? 'active' : ''} onClick={() => setActiveTab('CHAT')}>
            <MessageSquare size={18} /> <span>CHAT</span>
          </button>
        )}

        {missionsOpen && (
          <>
            <button className={activeTab === 'MISSIONS' ? 'active' : ''} onClick={() => setActiveTab('MISSIONS')}>
              <Briefcase size={18} /> <span>TEHTÄVÄT</span>
            </button>

            <button className={activeTab === 'VAULT' ? 'active' : ''} onClick={() => setActiveTab('VAULT')}>
              {isVaultActive ? <Unlock size={18} /> : <Lock size={18} />} 
              <span>{isVaultActive ? 'AUKI' : 'HOLVI'}</span>
            </button>
          </>
        )}
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
            // Välitetään tieto dashboardille, jotta se osaa piilottaa "Seuraava tehtävä" -boksin Hype-viikolla
            missionsOpen={missionsOpen} 
          />
        )}

        {chatOpen && activeTab === 'CHAT' && (
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

        {missionsOpen && activeTab === 'MISSIONS' && (
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

        {missionsOpen && activeTab === 'VAULT' && (
          <VaultTab guestId={guestId} isGameActive={isVaultActive} />
        )}
      </div>
    </div>
  );
};

export default AgentPage;