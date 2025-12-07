import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeistData } from './useHeistData'; // Tämä on se uusi moottori
import { ArrowLeft, Zap, Target, Diamond, Wine, Clock, Flame, ChevronDown } from 'lucide-react';
import './HeistLeaderboard.css';

// --- PIENI EFEKTI-KOMPONENTTI ---
const HackerText = ({ text }) => {
  const [disp, setDisp] = React.useState(text);
  React.useEffect(() => {
    let i = 0; const chars = "X#9!$";
    const int = setInterval(() => {
      setDisp(text.split("").map((c, idx) => idx < i ? c : chars[Math.floor(Math.random()*5)]).join(""));
      if(i>=text.length) clearInterval(int); i+=1/3;
    }, 50);
    return () => clearInterval(int);
  }, [text]);
  return <span>{disp}</span>;
};

// --- PÄÄKOMPONENTTI ---
const HeistLeaderboard = () => {
  const navigate = useNavigate();
  // Kutsutaan moottoria ilman ID:tä, koska tämä on yleinen näyttö
  const { agents, topTarget, chasers, active30Min, activeEvening, loading } = useHeistData();
  const [showAll, setShowAll] = useState(false);

  if (loading) return <div className="loading-scan">CONNECTING TO SATELLITE...</div>;
  if (!agents || agents.length === 0) return <div className="loading-scan">NO SIGNAL</div>;

  return (
    <div className="heist-dashboard">
      <button onClick={() => navigate(-1)} className="back-btn">
        <ArrowLeft size={16}/> BACK TO BASE
      </button>

      {/* --- OSA 1: LIVE ACTIVITY (WIDGETIT) --- */}
      <div className="activity-section">
        {/* 30 MIN */}
        <div className="activity-card flash">
          <div className="act-header"><Clock size={14}/> LIVE (30 MIN)</div>
          {active30Min.length > 0 ? active30Min.map((a,i)=>(
            <div key={i} className="act-row">
              <span className="act-rank">#{i+1}</span>
              <span className="act-name">{a.name}</span>
              <span className="act-xp">+{a.score}</span>
            </div>
          )) : <div className="no-act">- Hiljaista -</div>}
        </div>
        
        {/* ILTA */}
        <div className="activity-card">
          <div className="act-header"><Flame size={14}/> TOP GUNS (ILTA)</div>
          {activeEvening.length > 0 ? activeEvening.map((a,i)=>(
            <div key={i} className="act-row">
              <span className="act-rank">#{i+1}</span>
              <span className="act-name">{a.name}</span>
              <span className="act-xp">+{a.score}</span>
            </div>
          )) : <div className="no-act">- Hiljaista -</div>}
        </div>
      </div>

      {/* --- OSA 2: TARGET & CHASERS --- */}
      {topTarget && (
        <div className="top-tier-section">
          {/* CURRENT TARGET */}
          <div className="target-banner">
            <div className="tb-label">CURRENT TARGET // RANK 01</div>
            <div className="tb-content">
              <div className="tb-name">
                <Target size={20} className="icon-target"/> 
                <HackerText text={topTarget.name || 'UNKNOWN'}/>
              </div>
              <div className="tb-xp">{topTarget.xp} XP</div>
            </div>
            <div className="tb-badges">
              {topTarget.found_secret_bar && <span className="badge gold">🍸 BAR</span>}
              {topTarget.completed_secret_mission && <span className="badge blue">💎 OP</span>}
            </div>
          </div>

          {/* NISKAAN HUOHOTTAJAT */}
          <div className="chasers-grid">
            {chasers.map((a,i)=>(
              <div key={a.id} className="chaser-box">
                <div className="chaser-rank">0{i+2}</div>
                <div className="chaser-name">{a.name}</div>
                <div className="chaser-gap red">-{topTarget.xp - a.xp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- OSA 3: SCOREBOARD --- */}
      <div className="scoreboard-section">
        <div className="section-title">/// GLOBAL INTEL ///</div>
        <table className="scoreboard-table">
          <thead>
            <tr>
              <th style={{width: '30px'}}>#</th>
              <th>AGENT</th>
              <th className="text-right" style={{width: '60px'}}>XP</th>
            </tr>
          </thead>
          <tbody>
            {(showAll ? agents : agents.slice(0, 10)).map((a, i) => (
              <tr key={a.id} className={i<3?'top-row':''}>
                <td className="rank-col">{i+1}</td>
                <td className="name-col">
                  {a.name}
                  <div className="mini-badges">
                    {a.found_secret_bar && <Wine size={10} className="gold"/>}
                    {a.completed_secret_mission && <Diamond size={10} className="blue"/>}
                  </div>
                </td>
                <td className="xp-col">{a.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {agents.length > 10 && (
          <button className="show-more-btn" onClick={()=>setShowAll(!showAll)}>
            {showAll ? 'PIILOTA LOPUT' : `NÄYTÄ KAIKKI (${agents.length})`} <ChevronDown size={14}/>
          </button>
        )}
      </div>
    </div>
  );
};

export default HeistLeaderboard;