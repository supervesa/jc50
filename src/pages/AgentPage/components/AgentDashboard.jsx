import React from 'react';
import { useHeistData } from '../../../components/leader/useHeistData'; 
import { Trophy, Target, ArrowRight, MapPin, MessageCircle } from 'lucide-react';
import DashboardPoll from './DashboardPoll'; 
import '../AgentPage.css';

const AgentDashboard = ({ identity, nextMission, isVaultActive, activePoll, onNavigate, onOpenScoreboard, hasVoted, onVote }) => {
  
  // Haetaan livetilasto
  const { myStats, loading } = useHeistData(identity.id);

  const isLeader = myStats?.rank === 1;
  const rankColor = isLeader ? '#ffd700' : '#fff';
  const score = loading ? '...' : myStats?.xp || 0;
  const rank = loading ? '-' : `#${myStats?.rank || '-'}`;

  return (
    <div 
      className="dashboard-container" 
      // KORJAUS 1: 100dvh ja safe-area varmistavat, ettei mikään jää Androidin palkkien alle
      style={{ 
        paddingBottom: 'calc(140px + env(safe-area-inset-bottom))', 
        minHeight: '100dvh' 
      }}
    >
      
      {/* 1. HERO KORTTI */}
      <div className="dash-card hero-card" onClick={onOpenScoreboard}>
        <div className="hero-top">
          <div className="hero-avatar-area">
             <div className="hero-avatar">
              {identity.avatar ? (
                // KORJAUS 2: pointerEvents: 'none' estää selainta avaamasta kuvaa "katselutilaan"
                <img src={identity.avatar} alt="Avatar" style={{ pointerEvents: 'none' }} />
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

        {/* SEURAAVA KOHDE */}
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

      {/* 2. LIVE POLL */}
      {activePoll && (
        <DashboardPoll 
          poll={activePoll} 
          hasVoted={hasVoted} 
          onVote={onVote} 
        />
      )}

      {/* 3. NYKYINEN TEHTÄVÄ */}
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
        <div className="dash-stat" onClick={() => onNavigate('MISSIONS')}>
           <span className="stat-label">TEHTÄVÄLISTA</span>
           <span className="stat-value">AVAA ➜</span>
        </div>

        <div 
          className={`dash-stat vault ${isVaultActive ? 'open' : 'closed'}`}
          onClick={() => onNavigate('VAULT')}
        >
           {isVaultActive ? '🔓 HOLVI AUKI' : '🔒 HOLVI KIINNI'}
        </div>
      </div>

      {/* 5. CHAT NAVIGAATIO */}
      <button 
        className="btn-big-chat" 
        onClick={() => onNavigate('CHAT')}
        style={{ marginBottom: '20px' }}
      >
        <MessageCircle size={20} /> AVAA SALAINEN CHAT
      </button>

      {/* 6. TURVA-ALUE (Spacer) */}
      <div style={{ height: '40px' }}></div>

    </div>
  );
};

export default AgentDashboard;