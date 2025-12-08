import React from 'react';
import { useHeistData } from '../../../components/leader/useHeistData'; // Varmista polku!
import { Trophy, Target, ArrowRight, MapPin, MessageCircle } from 'lucide-react';
import DashboardPoll from './DashboardPoll'; 
import '../AgentPage.css';

// KORJAUS TEHTY TÄHÄN RIVIIN (hasVoted lisätty, onVote korjattu pieneksi):
const AgentDashboard = ({ identity, nextMission, isVaultActive, activePoll, onNavigate, onOpenScoreboard, hasVoted, onVote }) => {
  
  // Haetaan livetilasto (Sijoitus, XP, Seuraava kohde)
  const { myStats, loading } = useHeistData(identity.id);

  const isLeader = myStats?.rank === 1;
  const rankColor = isLeader ? '#ffd700' : '#fff';
  const score = loading ? '...' : myStats?.xp || 0;
  const rank = loading ? '-' : `#${myStats?.rank || '-'}`;

  return (
    <div className="dashboard-container">
      
      {/* 1. HERO KORTTI (Sijoitus & Seuraava kohde) */}
      <div className="dash-card hero-card" onClick={onOpenScoreboard}>
        <div className="hero-top">
          <div className="hero-avatar-area">
             <div className="hero-avatar">
              {identity.avatar ? (
                <img src={identity.avatar} alt="Avatar" />
              ) : (
                <div className="hero-avatar-placeholder">{identity.realName?.charAt(0)}</div>
              )}
             </div>
             {myStats?.isHot && <div className="hero-flame">🔥</div>}
          </div>
          
          <div className="hero-info">
            <div className="hero-rank" style={{ color: rankColor }}>{rank}</div>
            <div className="hero-xp">{score} XP</div>
          </div>
        </div>

        {/* SEURAAVA KOHDE (Gamification) */}
        {!loading && !isLeader && myStats?.nextName && (
          <div className="hero-target-section">
            <div className="target-label"><Target size={14} /> SEURAAVA KOHDE</div>
            <div className="target-row">
              <span className="target-name">{myStats.nextName}</span>
              <span className="target-gap">-{myStats.nextGap} XP</span>
            </div>
          </div>
        )}

        {isLeader && (
          <div className="hero-target-section leader">
            <Trophy size={14} color="gold" /> OLET JOHDOSSA!
          </div>
        )}

        <div className="hero-footer">
          Klikkaa nähdäksesi koko tilaston <ArrowRight size={12} />
        </div>
      </div>

      {/* 2. UUSI: LIVE POLL */}
      {/* Nyt hasVoted ja onVote löytyvät, joten tämä ei kaada sovellusta */}
      {activePoll && (
        <DashboardPoll 
          poll={activePoll} 
          hasVoted={hasVoted} 
          onVote={onVote} 
        />
      )}

      {/* 3. STICKY MISSION (Pysyvä tehtäväkortti) */}
      <div className="section-title">NYKYINEN TEHTÄVÄ</div>
      
      {nextMission ? (
        <div className="dash-card sticky-mission" onClick={() => onNavigate('MISSIONS')}>
          <div className="sticky-header">
            <MapPin size={16} color="#b8860b" />
            <span>{nextMission.title}</span>
          </div>
          <div className="sticky-reward">{nextMission.xp_reward} XP</div>
          <p className="sticky-desc">Klikkaa suorittaaksesi tehtävän...</p>
          <button className="btn-sticky-action">SUORITA NYT ➜</button>
        </div>
      ) : (
        <div className="dash-card all-done">
          <div style={{fontSize:'2rem'}}>🎉</div>
          <div>Kaikki tehtävät suoritettu!</div>
          <div style={{fontSize:'0.8rem', color:'#888'}}>Odota uusia toimeksiantoja.</div>
        </div>
      )}

      {/* 4. ALERTS & SHORTCUTS */}
      <div className="dash-grid">
        
        {/* Tehtävät-pikavalinta */}
        <div className="dash-stat" onClick={() => onNavigate('MISSIONS')}>
           <span className="stat-label">TEHTÄVÄLISTA</span>
           <span className="stat-value">AVAA ➜</span>
        </div>

        {/* HOLVI */}
        <div 
          className={`dash-stat vault ${isVaultActive ? 'open' : 'closed'}`}
          onClick={() => onNavigate('VAULT')}
        >
           {isVaultActive ? '🔓 HOLVI AUKI' : '🔒 HOLVI KIINNI'}
        </div>
      </div>

      {/* 5. CHAT NAVIGAATIO */}
      <button className="btn-big-chat" onClick={() => onNavigate('CHAT')}>
        <MessageCircle size={20} /> AVAA SALAINEN CHAT
      </button>

    </div>
  );
};

export default AgentDashboard;