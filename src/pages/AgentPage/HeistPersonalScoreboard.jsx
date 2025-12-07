import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; 
import { useHeistData } from '../../components/leader/useHeistData'; 
import { Zap, Target, ArrowLeft, Trophy, Diamond, Wine, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import History from './components/History';
import './AgentPage.css'; 

const HeistPersonalScoreboard = () => {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({ avatar: null, name: '' });
  const [historyOpen, setHistoryOpen] = useState(false); // Haitarin tila
  
  const { myStats, loading } = useHeistData(guestId);

  useEffect(() => {
    if (!guestId) return;

    const fetchProfile = async () => {
      const { data: charData } = await supabase
        .from('characters')
        .select('avatar_url, name')
        .eq('assigned_guest_id', guestId)
        .single();

      const { data: guestData } = await supabase
        .from('guests')
        .select('name')
        .eq('id', guestId)
        .single();

      if (charData) {
        setProfile({
          avatar: charData.avatar_url,
          name: charData.name || guestData?.name
        });
      } else if (guestData) {
        setProfile({
          avatar: null,
          name: guestData.name
        });
      }
    };

    fetchProfile();
  }, [guestId]);

  const goBack = () => navigate(-1);
  const toggleHistory = () => setHistoryOpen(!historyOpen);

  if (loading) {
    return (
      <div className="ps-container ps-loading-container">
        <div className="ps-loading-text">LADATAAN PROFIILIA...</div>
      </div>
    );
  }

  if (!myStats) {
    return (
      <div className="ps-container ps-error-container">
        <div className="ps-error-text">VIRHE: TIETOJA EI LÖYTYNYT</div>
        <button className="ps-back-btn" onClick={goBack}>PALAA TAKAISIN</button>
      </div>
    );
  }

  const isLeader = myStats.rank === 1;
  const rankColor = isLeader ? '#ffd700' : '#fff';
  const displayAvatar = profile.avatar || myStats.avatar;
  const displayName = profile.name || myStats.charName || 'Agentti';

  return (
    <div className="ps-container">
      
      {/* 1. HEADER */}
      <div className="ps-header">
        <button className="ps-back-btn" onClick={goBack}>
          <ArrowLeft size={18} /> Takaisin
        </button>
        <div className="ps-header-meta">SECURE FILE: {myStats.agentCode}</div>
      </div>

      {/* 2. HERO: AVATAR JA SIJOITUS */}
      <div className="ps-hero">
        
        {/* AVATAR WRAPPER */}
        <div className="ps-avatar-wrapper">
          <div className={`ps-avatar-frame ${isLeader ? 'leader' : ''}`}>
            {displayAvatar ? (
              <img src={displayAvatar} alt="Profiili" className="ps-avatar-img" />
            ) : (
              <div className="ps-avatar-placeholder">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          
          {/* LIEKKI-INDIKAATTORI */}
          {myStats.isHot && (
            <div className="ps-flame-badge">
              <Zap size={18} color="#00ff41" fill="#00ff41"/>
            </div>
          )}
        </div>

        <div className="ps-rank-label">SIJOITUKSESI</div>
        <div className="ps-rank-huge" style={{ color: rankColor }}>
          #{myStats.rank}
        </div>
        <div className="ps-agent-name">
          {displayName}
        </div>
      </div>

      {/* 3. XP KORTTI */}
      <div className="ps-card">
        <div className="ps-card-title"><Trophy size={14} /> Kokonaispisteet</div>
        <div className="ps-xp-val">{myStats.xp} XP</div>
        <div style={{ fontSize: '14px', color: '#aaa' }}>
          Jatka tehtävien suorittamista noustaksesi arvoasteikossa!
        </div>
        <div className="ps-progress-bg">
          <div className="ps-progress-fill" style={{ width: '60%' }}></div>
        </div>
      </div>

      {/* 4. SEURAAVA KOHDE */}
      {!isLeader && (
        <div className="ps-card target">
          <div className="ps-card-title" style={{ color: '#ff8800' }}>
            <Target size={14} /> Seuraava kohde
          </div>
          <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '5px' }}>
            Ohita tämä agentti noustaksesi sijalle #{myStats.rank - 1}:
          </div>
          <div className="ps-target-name">
            {myStats.nextName}
          </div>
          <div className="ps-target-gap">
            Olet vain {myStats.nextGap} XP perässä!
          </div>
        </div>
      )}

      {/* JOHTAJA */}
      {isLeader && (
        <div className="ps-card" style={{ borderColor: '#ffd700', background: '#1a1a00' }}>
          <div className="ps-card-title" style={{ color: '#ffd700' }}>
            <Trophy size={14} /> JOHTAJAN PAIKKA
          </div>
          <div style={{ fontSize: '1.1rem', color: '#fff' }}>
            Olet kärjessä! Pidä varasi, muut jahtaavat sinua.
          </div>
        </div>
      )}

      {/* 5. SAAVUTUKSET */}
      {(myStats.found_secret_bar || myStats.completed_secret_mission) && (
        <div className="ps-card">
          <div className="ps-card-title"><Diamond size={14} /> Erikoismerkit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myStats.found_secret_bar && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#333', padding: '8px', borderRadius: '50%' }}>
                  <Wine size={20} color="#ffd700" />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#ffd700' }}>Speakeasy Löydetty</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Salakapakka on tuttu paikka.</div>
                </div>
              </div>
            )}
            {myStats.completed_secret_mission && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#333', padding: '8px', borderRadius: '50%' }}>
                  <Diamond size={20} color="#00aaff" />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#00aaff' }}>Salainen Operaatio</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Erityistehtävä suoritettu.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- UUSI OSIO: HISTORIA ACCORDION --- */}
      <div className="ps-accordion">
        <button className="ps-accordion-header" onClick={toggleHistory}>
          <div className="ps-accordion-title">
            <Clock size={18} color="#aaa" />
            <span>Suoritusloki</span>
          </div>
          {historyOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        {historyOpen && (
          <div className="ps-accordion-content">
            <History guestId={guestId} />
          </div>
        )}
      </div>

      {/* 6. POISTUMISNAPPI */}
      <button className="ps-big-button" onClick={goBack}>
        PALAA TEHTÄVIIN
      </button>

    </div>
  );
};

export default HeistPersonalScoreboard;