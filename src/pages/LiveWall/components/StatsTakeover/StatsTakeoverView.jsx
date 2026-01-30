import React from 'react';
import './StatsTakeover.css';
import { Trophy, Flame, Sword, Eye, Lock } from 'lucide-react';

const StatsTakeoverView = ({ 
  active, 
  screenIndex,
  totalLoot, 
  heatLevel, 
  agents, 
  intelStats,
  characters = [] // <--- 1. Lisätty characters oletusarvolla
}) => {
  if (!active) return null;

  // --- DATAN VARMISTUS ---
  const safeLoot = (typeof totalLoot === 'number' && !isNaN(totalLoot)) ? totalLoot : 0;
  
  const heatMap = { 'CRITICAL': 'KRIITTINEN', 'MEDIUM': 'KOHONNUT', 'LOW': 'RAUHALLINEN' };
  const safeHeat = heatMap[heatLevel] || 'RAUHALLINEN';
  const isCritical = heatLevel === 'CRITICAL';
  const heatColor = isCritical ? '#ff0000' : (heatLevel === 'MEDIUM' ? '#ffd700' : '#00ff41');

  const safeAgents = Array.isArray(agents) ? agents : [];
  
  const safeIntel = intelStats || {};
  const rivals = safeIntel.rivalsPair || null;
  const risingStars = Array.isArray(safeIntel.risingStars) ? safeIntel.risingStars : [];
  const vaultProg = (typeof safeIntel.vaultProgress === 'number') ? safeIntel.vaultProgress : 0;
  const secretCount = (typeof safeIntel.secretFoundCount === 'number') ? safeIntel.secretFoundCount : 0;
  const activeCount = safeIntel.activeAgentCount || 0;

  const SCREEN_TITLES = [
    "STRATEGINEN TILANNE",
    "ETSITYIMMÄT",
    "TIEDUSTELURAPORTTI"
  ];

  // --- KUVAN VIRHEENKÄSITTELY ---
  const handleImgError = (e) => {
    e.target.style.display = 'none'; // Piilota rikkinäinen kuva
    // Etsitään seuraava elementti (fallback-char) ja varmistetaan että se näkyy
    const fallback = e.target.nextElementSibling;
    if (fallback) fallback.style.display = 'flex';
  };

  // --- 2. KORJATTU AVATARIEN HAKU ---
  const getAvatarSrc = (agent) => {
    if (!agent) return null;
    
    // Estetään dummy-datan latausyritykset
    if (agent.id && agent.id.length < 5) return null;

    // A) Jos avatar tulee suoraan agentin mukana (esim. jos back-end tekee joinin)
    if (agent.avatar_url) return agent.avatar_url;

    // B) Jos ei, etsitään se characters-listasta ID:n perusteella
    if (characters && characters.length > 0) {
      // Oletetaan että agent.id vastaa characters-taulukon id:tä
      const foundChar = characters.find(c => c.id === agent.id);
      if (foundChar && foundChar.avatar_url) {
        return foundChar.avatar_url;
      }
    }

    return null; 
  };

  return (
    <div className="st-overlay">
      
      {/* 1. YLÄPALKKI */}
      <div className="st-top-banner">
        <div className="st-live-indicator">
            <div className="st-live-dot"></div>
            LIVE
        </div>
        <div className="st-main-title">
            <h1>{SCREEN_TITLES[screenIndex]}</h1>
        </div>
        <div className="st-clock">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>

      {/* 2. PÄÄSISÄLTÖ */}
      <div className="st-main-content">
        
       {/* === SIVU 0: STRATEGIC OVERVIEW === */}
        {screenIndex === 0 && (
          <div className="st-grid-screen-0 fadeIn">
            
            {/* VASEN: NETWORK TRAFFIC */}
            <div className="st-col-left">
               <div className="st-stat-box" style={{borderLeftColor: heatColor}}>
                  <div className="st-label-xl">VERKKOLIIKENNE</div>
                  <div className={`st-viz-container ${isCritical ? 'viz-critical' : heatLevel === 'MEDIUM' ? 'viz-medium' : ''}`}>
                      {[...Array(8)].map((_, i) => (
                          <div key={i} className="st-viz-bar" style={{
                              height: `${Math.random() * 60 + 20}%`,
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: `${0.8 + Math.random() * 0.5}s`
                          }}></div>
                      ))}
                  </div>
                  <div className="st-sub-text" style={{color: heatColor, marginTop:'10px'}}>
                      STATUS: {safeHeat}
                  </div>
               </div>

               <div className="st-stat-box" style={{borderLeftColor: '#00E7FF'}}>
                  <div className="st-label-xl">AKTIIVISET AGENTIT</div>
                  <div className="st-big-number" style={{color:'#00E7FF'}}>{activeCount}</div>
                  <div className="st-sub-text" style={{color:'#00E7FF'}}>YHTEYDESSÄ (1h)</div>
               </div>
            </div>

          {/* KESKI: HEIST REACTOR (Animoitu) */}
            <div className="st-col-center">
                <div className="st-loot-circle">
                    {/* === RENKAAT OVAT TÄSSÄ === */}
                    <div className="st-reactor-ring ring-outer"></div>
                    <div className="st-reactor-ring ring-mid"></div>
                    <div className="st-reactor-ring ring-inner"></div>
                    
                    {/* Sisältö pysyy päällä */}
                    <div className="st-loot-content">
                        <div className="st-label-center">KOKONAISPOTTI AGENTEILLA</div>
                        <div className="st-loot-number">{safeLoot.toLocaleString('fi-FI')} XP</div>
                        <div className="st-loot-verified">VARMISTETTU</div>
                    </div>
                </div>
            </div>
            {/* OIKEA: KINGPIN (Uusi järjestys) */}
            <div className="st-col-right">
                <div className="st-label-xl" style={{color:'var(--plasma-gold)', textAlign:'center', width:'100%'}}>KOHDE LUKITTU</div>
                {safeAgents[0] && (
                    <div className="st-kingpin-card">
                        
                        {/* 1. Kyltti on nyt ylhäällä omassa rauhassa */}
                        <div className="st-target-label">NYKYINEN JOHTAJA</div>
                        
                        {/* 2. Kuva tulee vasta sen jälkeen */}
                        <div className="st-kingpin-avatar">
                            <img 
                                src={getAvatarSrc(safeAgents[0])} 
                                alt={safeAgents[0].name}
                                onError={handleImgError}
                            />
                        </div>

                        {/* 3. Tiedot */}
                        <div className="st-kingpin-name">{safeAgents[0].name}</div>
                        <div className="st-kingpin-xp">{safeAgents[0].xp} XP</div>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* === SIVU 1: MOST WANTED === */}
        {screenIndex === 1 && (
          <div className="st-grid-screen-1 fadeIn">
            
            {/* VASEN: LEADERBOARD */}
            <div className="st-panel st-leaders-panel">
                <div className="st-panel-header"><Trophy /> KÄRKIAGENTIT</div>
                <div className="st-leaders-list">
                    {/* TOP 8 täyttää 1080p-ruudun pystytilan paremmin kuin 5 */}
                    {safeAgents.slice(0, 8).map((agent, i) => (
                    <div key={agent?.id || i} className={`st-leader-row rank-${i+1}`}>
                        <div className="st-rank">#{i+1}</div>
                        <div className="st-leader-avatar-small">
                            <img 
                              src={getAvatarSrc(agent)} 
                              alt="" 
                              onError={handleImgError}
                            />
                            <div className="st-fallback-char-small">{agent.name ? agent.name.charAt(0) : '?'}</div>
                        </div>
                        <div className="st-leader-details">
                            <div className="st-leader-name">{agent?.name}</div>
                            <div className="st-leader-xp">{agent?.xp} XP</div>
                        </div>
                    </div>
                    ))}
                </div>
            </div>

            {/* OIKEA: RIVALS */}
            <div className="st-panel st-rivals-panel">
                <div className="st-panel-header"><Sword /> KIREÄ TAISTELU (TOP 10)</div>
                {rivals ? (
                    <div className="st-rivals-arena">
                        <div className="st-rival-card">
                            <div className="st-rival-avatar">
                                <img src={getAvatarSrc(rivals.leader)} alt="" onError={handleImgError} />
                                <div className="st-fallback-char">{rivals.leader.name ? rivals.leader.name.charAt(0) : '?'}</div>
                            </div>
                            <div className="st-rival-name">{rivals.leader?.name}</div>
                            <div className="st-rival-xp">{rivals.leader?.xp} XP</div>
                        </div>

                        <div className="st-vs-badge">
                            VS 
                            <div className="st-gap-info">ERO {rivals.gap} XP</div>
                        </div>

                        <div className="st-rival-card">
                            <div className="st-rival-avatar">
                                <img src={getAvatarSrc(rivals.chaser)} alt="" onError={handleImgError} />
                                <div className="st-fallback-char">{rivals.chaser.name ? rivals.chaser.name.charAt(0) : '?'}</div>
                            </div>
                            <div className="st-rival-name">{rivals.chaser?.name}</div>
                            <div className="st-rival-xp">{rivals.chaser?.xp} XP</div>
                        </div>
                    </div>
                ) : (
                    <div className="st-placeholder">Kärkiasemat vakiintuneet. Ei tiukkoja taisteluita.</div>
                )}
            </div>
          </div>
        )}

        {/* === SIVU 2: INTEL === */}
        {screenIndex === 2 && (
          <div className="st-grid-screen-2 fadeIn">
             <div className="st-vault-section">
                <div className="st-panel-header"><Lock /> HOLVIN TILA</div>
                <div className="st-vault-display">
                    <div className="st-vault-status">
                        {vaultProg >= 100 ? 'MURRETTU / AUKI' : 'PURKU KÄYNNISSÄ...'}
                    </div>
                    <div className="st-vault-bar-bg">
                        <div className="st-vault-bar-fill" style={{width: `${vaultProg}%`}}></div>
                    </div>
                    <div className="st-vault-percent">{vaultProg}%</div>
                </div>
             </div>

             <div className="st-bottom-split">
                <div className="st-panel">
                    <div className="st-panel-header"><Eye /> SALAKAPAKKA</div>
                    <div className="st-intel-box">
                        <div className="st-intel-big-num">{secretCount}</div>
                        <div className="st-intel-label-small">AGENTTIA LÖYTÄNYT</div>
                    </div>
                </div>

                <div className="st-panel">
                    <div className="st-panel-header"><Flame /> NOUSIJAT (30min)</div>
                    <div className="st-rising-list">
                        {risingStars.map((star, i) => (
                        <div key={i} className="st-rising-row">
                            <div className="st-rising-name">{star.name}</div>
                            <div className="st-rising-gain">+{star.gainedXp} XP</div>
                        </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StatsTakeoverView;