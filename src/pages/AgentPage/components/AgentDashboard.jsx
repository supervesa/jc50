// tiedosto: src/pages/AgentPage/components/AgentDashboard.jsx

import React from 'react';
import { useHeistData } from '../../../components/leader/useHeistData'; 
import { 
  Trophy, 
  Target, 
  MapPin, 
  MessageCircle, 
  Flame, 
  User, 
  List, 
  Lock, 
  Unlock,
  ChevronRight 
} from 'lucide-react';
import DashboardPoll from './DashboardPoll'; 
import '../AgentPage.css';

const AgentDashboard = ({ 
  identity, 
  nextMission, 
  isVaultActive, 
  activePoll, 
  onNavigate, 
  onOpenPersonal, 
  onOpenLeaderboard, 
  hasVoted, 
  onVote 
}) => {
  
  const { myStats, loading } = useHeistData(identity.id);

  const isLeader = myStats?.rank === 1;
  const rankColor = isLeader ? '#ffd700' : '#fff';
  const score = loading ? '...' : myStats?.xp || 0;
  const rank = loading ? '-' : `#${myStats?.rank || '-'}`;

  return (
    <div className="dashboard-container" style={{ paddingBottom: '120px', minHeight: '100dvh' }}>
      
      {/* HUD-PALKKI (Komentosilta) */}
      <div className="compact-hud" style={{
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(to right, #1a1a1a, #252525)',
        borderBottom: '2px solid #333',
        padding: '12px 15px',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
      }}>
        
        {/* VASEN: IDENTITEETTI */}
        <div onClick={onOpenPersonal} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            <img src={identity.avatar || '/placeholder-avatar.png'} alt="Av" style={{ 
              width: '50px', height: '50px', borderRadius: '50%', border: `2px solid ${rankColor}`, objectFit: 'cover' 
            }} />
            {myStats?.isHot && <Flame size={14} style={{ position: 'absolute', bottom: -2, right: -2, color: '#ff4500' }} fill="#ff4500" />}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '1px' }}>AGENTTI</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: rankColor }}>RANK {rank}</div>
          </div>
        </div>

        {/* KESKI: STATUS */}
        <div onClick={onOpenPersonal} style={{ flex: 1, padding: '0 15px', borderLeft: '1px solid #333', marginLeft: '15px', cursor: 'pointer' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'gold' }}>{score} XP</div>
          {!loading && !isLeader && myStats?.nextName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#aaa' }}>
              <Target size={12} /> <span>{myStats.nextName}</span> <span style={{ color: '#ff4444' }}>(-{myStats.nextGap})</span>
            </div>
          )}
          {isLeader && <div style={{ fontSize: '0.75rem', color: 'gold' }}>👑 JOHDOSSA</div>}
        </div>

        {/* OIKEA: LEADERBOARD */}
        <div onClick={onOpenLeaderboard} style={{ 
          cursor: 'pointer', background: '#333', padding: '10px', borderRadius: '10px', border: '1px solid #444' 
        }}>
          <Trophy size={24} color="gold" />
        </div>
      </div>

      {activePoll && <div style={{ margin: '0 15px 20px 15px' }}><DashboardPoll poll={activePoll} hasVoted={hasVoted} onVote={onVote} /></div>}

      {/* AKTIIVINEN TEHTÄVÄ (Ei enää otsikkoa) */}
      {nextMission ? (
        <div className="dash-card sticky-mission" onClick={() => onNavigate('MISSIONS')} style={{ margin: '0 15px 25px 15px', borderLeft: '4px solid gold' }}>
          <div className="sticky-header" style={{ marginBottom: '10px' }}>
            <MapPin size={20} color="gold" />
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{nextMission.title}</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'gold', marginBottom: '5px' }}>{nextMission.xp_reward} XP</div>
          <p style={{ fontSize: '0.9rem', color: '#ccc', margin: '0 0 15px 0' }}>Kohde: <span className="tag-highlight">{nextMission.target_tag || 'TIEDUSTELE'}</span></p>
          <button className="btn-sticky-action" style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}>SUORITA TEHTÄVÄ ➜</button>
        </div>
      ) : (
        <div className="dash-card all-done" style={{ margin: '0 15px 25px 15px' }}>
          <h3>KAIKKI TEHTÄVÄT VALMIINA! 🎉</h3>
          <p>Pysy kuulolla uusista käskyistä.</p>
        </div>
      )}

      {/* PIKAVALINNAT */}
      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 15px', marginBottom: '20px' }}>
        <div className="dash-stat" onClick={() => onNavigate('MISSIONS')} style={{ background: '#222', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid #333' }}>
           <List size={20} color="#00ff41" style={{ marginBottom: '5px' }} />
           <div style={{ fontSize: '0.7rem', color: '#888' }}>TEHTÄVÄLISTA</div>
        </div>
        <div className={`dash-stat vault ${isVaultActive ? 'open' : 'closed'}`} onClick={() => onNavigate('VAULT')} style={{ background: '#222', padding: '15px', borderRadius: '12px', textAlign: 'center', border: isVaultActive ? '1px solid #00ff41' : '1px solid #333' }}>
           {isVaultActive ? <Unlock size={20} color="#00ff41" /> : <Lock size={20} color="#666" />}
           <div style={{ fontSize: '0.7rem', color: isVaultActive ? '#00ff41' : '#666' }}>{isVaultActive ? 'HOLVI AUKI' : 'HOLVI KIINNI'}</div>
        </div>
      </div>

      <div style={{ padding: '0 15px' }}>
        <button className="btn-big-chat" onClick={() => onNavigate('CHAT')} style={{ width: '100%', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <MessageCircle size={20} /> AVAA SALAINEN CHAT
        </button>
      </div>
    </div>
  );
};

export default AgentDashboard;