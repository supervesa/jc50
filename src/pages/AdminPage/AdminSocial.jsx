import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AdminSocial = ({ characters }) => {
  // --- TILAT ---
  const [timeWindow, setTimeWindow] = useState('60'); // '15', '30', '60', 'all'
  const [posts, setPosts] = useState([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  
  // Batch -valinnat (Some)
  const [selectedSocialIds, setSelectedSocialIds] = useState(new Set());
  
  // Avatar -tila
  const [avatarCandidates, setAvatarCandidates] = useState([]);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  // --- 1. AVATAR LOGIIKKA (KAMPANJA) ---
  const checkAvatarCampaign = async () => {
    // Jos hahmoja ei ole ladattu, ei tehdä mitään
    if (!characters || characters.length === 0) return;

    setLoadingAvatar(true);
    
    // 1. Haetaan ne, jotka on jo palkittu tästä (ettei palkita tuplana)
    const { data: logs, error } = await supabase
      .from('mission_log')
      .select('guest_id')
      .ilike('custom_reason', '%Profiilikuva-bonus%');
    
    if (error) {
      console.error("Virhe avatar-tarkistuksessa:", error);
      setLoadingAvatar(false);
      return;
    }

    const rewardedIds = new Set(logs.map(l => l.guest_id));

    // 2. Etsitään hahmot characters-taulusta
    const candidates = characters.filter(c => {
      // Onko hahmolla pelaaja?
      const hasPlayer = c.assigned_guest_id !== null;
      
      // Onko avatar asetettu? (Ei null, ja pituus > 0)
      const hasAvatar = c.avatar_url && c.avatar_url.length > 5;
      
      // Onko jo palkittu?
      const alreadyRewarded = rewardedIds.has(c.assigned_guest_id);

      return hasPlayer && hasAvatar && !alreadyRewarded;
    });

    setAvatarCandidates(candidates);
    setLoadingAvatar(false);
  };

  const rewardAvatars = async () => {
    if (avatarCandidates.length === 0) return;
    if (!confirm(`Palkitaan ${avatarCandidates.length} agenttia profiilikuvasta (50 XP)?`)) return;

    setLoadingAvatar(true);
    
    const updates = avatarCandidates.map(c => ({
      guest_id: c.assigned_guest_id,
      xp_earned: 50,
      custom_reason: '📸 Profiilikuva-bonus',
      approval_status: 'approved',
      mission_id: null
    }));

    const { error } = await supabase.from('mission_log').insert(updates);
    
    if (error) {
      alert('Virhe: ' + error.message);
    } else {
      alert('Palkinnot jaettu!');
      setAvatarCandidates([]); // Tyhjennetään lista onnistumisen jälkeen
    }
    setLoadingAvatar(false);
  };

  // --- 2. SOCIAL LOGIIKKA (ACTIVITY FEED) ---
  const fetchSocialStats = async () => {
    setLoadingSocial(true);
    let query = supabase
      .from('live_posts')
      .select('guest_id, sender_name, hot_count, image_url, created_at')
      .eq('status', 'approved');

    // Aikarajaus
    if (timeWindow !== 'all') {
      const minutes = parseInt(timeWindow);
      const timeLimit = new Date(Date.now() - minutes * 60000).toISOString();
      query = query.gt('created_at', timeLimit);
    }

    const { data, error } = await query;
    if (error) console.error("Social stats error:", error);
    if (data) setPosts(data);
    
    setLoadingSocial(false);
    setSelectedSocialIds(new Set()); // Nollaa valinnat kun aika muuttuu
  };

  // Käynnistetään haut
  useEffect(() => {
    checkAvatarCampaign();
  }, [characters]); // Aina kun hahmot päivittyvät, tarkistetaan avatarit

  useEffect(() => {
    fetchSocialStats();
  }, [timeWindow]);


  // --- 3. DATAN JALOSTUS (AGGREGOINTI) ---
  const stats = useMemo(() => {
    const map = {};

    posts.forEach(p => {
      if (!p.guest_id) return;
      
      if (!map[p.guest_id]) {
        map[p.guest_id] = { 
          id: p.guest_id, 
          name: p.sender_name || 'Tuntematon', 
          count: 0, 
          hotSum: 0, 
          bestImg: null, 
          maxHot: -1 
        };
      }
      
      const entry = map[p.guest_id];
      entry.count += 1;
      entry.hotSum += (p.hot_count || 0);
      
      if ((p.hot_count || 0) > entry.maxHot) {
        entry.maxHot = p.hot_count || 0;
        entry.bestImg = p.image_url;
      }
    });

    const arr = Object.values(map);
    // Luodaan kaksi listaa
    const byCount = [...arr].sort((a, b) => b.count - a.count).slice(0, 5); // Top 5
    const byHot = [...arr].sort((a, b) => b.hotSum - a.hotSum).slice(0, 5); // Top 5

    return { byCount, byHot };
  }, [posts]);

  // --- 4. TOIMINNOT ---
  const toggleSocialSelect = (id) => {
    const newSet = new Set(selectedSocialIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSocialIds(newSet);
  };

  const giveSocialBonus = async (xp, reasonBase) => {
    if (selectedSocialIds.size === 0) return;
    const reason = prompt(`Annetaan ${xp} XP valituille (${selectedSocialIds.size} kpl).\nSyy:`, reasonBase);
    if (!reason) return;

    const updates = Array.from(selectedSocialIds).map(gid => ({
      guest_id: gid,
      xp_earned: xp,
      custom_reason: reason,
      approval_status: 'approved',
      mission_id: null
    }));

    await supabase.from('mission_log').insert(updates);
    alert('Pisteet annettu!');
    setSelectedSocialIds(new Set());
  };


  // --- RENDERÖINTI ---
  return (
    <div className="social-admin-wrapper">
      
      {/* OSION 1: AVATAR KAMPANJA */}
      <div className="avatar-campaign-box">
        <div className="ac-info">
          <h3>📸 PROFILOINTI</h3>
          <p>{avatarCandidates.length > 0 
              ? `Löytyi ${avatarCandidates.length} uutta kuvaa!` 
              : "Kaikki kuvalliset on palkittu."}
          </p>
        </div>
        <button 
          className="btn-avatar-reward" 
          disabled={avatarCandidates.length === 0 || loadingAvatar}
          onClick={rewardAvatars}
        >
          {loadingAvatar ? '...' : `🚀 PALKITSE (${avatarCandidates.length * 50} XP)`}
        </button>
      </div>

      {/* OSION 2: SOMETYKKI */}
      <div className="social-stats-box">
        <div className="social-header">
          <h3>📊 SOME-AKTIVITEETTI</h3>
          <div className="time-selector">
            {['15', '30', '60', 'all'].map(t => (
              <button 
                key={t} 
                className={timeWindow === t ? 'active' : ''} 
                onClick={() => setTimeWindow(t)}
              >
                {t === 'all' ? 'KOKO ILTA' : `${t} min`}
              </button>
            ))}
          </div>
        </div>

        <div className="stats-grid">
          
          {/* VASEN: MÄÄRÄ (PAPARAZZI) */}
          <div className="stat-col">
            <h4>📢 PAPARAZZIT (Määrä)</h4>
            {stats.byCount.length === 0 && <div className="empty">Hiljaista...</div>}
            {stats.byCount.map(user => (
              <div key={'c' + user.id} className={`stat-row ${selectedSocialIds.has(user.id) ? 'selected' : ''}`} onClick={() => toggleSocialSelect(user.id)}>
                <input type="checkbox" checked={selectedSocialIds.has(user.id)} readOnly />
                <div className="stat-info">
                  <span className="name">{user.name}</span>
                  <span className="score">{user.count} kuvaa</span>
                </div>
              </div>
            ))}
             {stats.byCount.length > 0 && (
              <button className="btn-mini-reward" onClick={() => giveSocialBonus(10, '📸 Aktiivinen kuvaaja')}>
                Palkitse valitut (+10)
              </button>
            )}
          </div>

          {/* OIKEA: LAATU (INFLUENCER) */}
          <div className="stat-col">
            <h4>🔥 TRENDSETTERS (Liekit)</h4>
            {stats.byHot.length === 0 && <div className="empty">Ei liekkejä...</div>}
            {stats.byHot.map(user => (
              <div key={'h' + user.id} className={`stat-row ${selectedSocialIds.has(user.id) ? 'selected' : ''}`} onClick={() => toggleSocialSelect(user.id)}>
                <input type="checkbox" checked={selectedSocialIds.has(user.id)} readOnly />
                {user.bestImg && <img src={user.bestImg} alt="best" className="mini-thumb" />}
                <div className="stat-info">
                  <span className="name">{user.name}</span>
                  <span className="score">🔥 {user.hotSum}</span>
                </div>
              </div>
            ))}
            {stats.byHot.length > 0 && (
              <button className="btn-mini-reward" onClick={() => giveSocialBonus(25, '🔥 Sometykki (Hot Content)')}>
                Palkitse valitut (+25)
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default AdminSocial;