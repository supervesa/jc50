import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AdminSocial = ({ characters }) => {
  // --- TILA ---
  const [timeWindow, setTimeWindow] = useState('60'); // '15', '30', '60', 'all'
  const [socialData, setSocialData] = useState({ posts: [], chats: [] });
  const [loadingSocial, setLoadingSocial] = useState(false);
  
  // ERITYTETYT VALINNAT (Set)
  const [selectedChatIds, setSelectedChatIds] = useState(new Set());
  const [selectedPostIds, setSelectedPostIds] = useState(new Set());
  const [selectedHotIds, setSelectedHotIds] = useState(new Set());

  // HISTORIA: Ketkä on jo palkittu tässä aikaikkunassa (Set)
  const [rewardedHistory, setRewardedHistory] = useState({
    chat: new Set(),
    post: new Set(),
    hot: new Set()
  });
  
  // Avatar-tilat
  const [avatarCandidates, setAvatarCandidates] = useState([]);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  
  // Hinnasto
  const [xpConfig, setXpConfig] = useState(null);

  // --- 1. HAE SÄÄNNÖT ---
  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase
        .from('game_rules')
        .select('value')
        .eq('rule_key', 'xp_config')
        .single();
      
      if (data) setXpConfig(data.value);
    };
    fetchRules();
  }, []);

  // --- 2. HAE DATA (CHAT, KUVAT + HISTORIA) ---
  const fetchSocialStats = async () => {
    setLoadingSocial(true);
    
    let timeLimit = null;
    if (timeWindow !== 'all') {
      const minutes = parseInt(timeWindow);
      timeLimit = new Date(Date.now() - minutes * 60000).toISOString();
    }

    // A) Kyselyt: Data
    let postQuery = supabase.from('live_posts').select('*').eq('status', 'approved');
    let chatQuery = supabase.from('chat_messages').select('guest_id, created_at');
    
    // B) Kysely: Historia (Ketkä on jo palkittu tässä ajassa?)
    let logQuery = supabase.from('mission_log').select('guest_id, custom_reason');

    if (timeLimit) {
      postQuery = postQuery.gt('created_at', timeLimit);
      chatQuery = chatQuery.gt('created_at', timeLimit);
      logQuery = logQuery.gt('created_at', timeLimit);
    }

    const [postsRes, chatsRes, logsRes] = await Promise.all([postQuery, chatQuery, logQuery]);

    setSocialData({
      posts: postsRes.data || [],
      chats: chatsRes.data || []
    });

    // Prosessoi historia: Erotellaan syyn perusteella kuka on saanut mitäkin
    const history = { chat: new Set(), post: new Set(), hot: new Set() };
    if (logsRes.data) {
      logsRes.data.forEach(log => {
        const r = log.custom_reason || '';
        if (r.includes('Keskustelija') || r.includes('Chat')) history.chat.add(log.guest_id);
        if (r.includes('Kuvaaja') || r.includes('Paparazzi')) history.post.add(log.guest_id);
        if (r.includes('Sometykki') || r.includes('Hot') || r.includes('Trendsetter')) history.hot.add(log.guest_id);
      });
    }
    setRewardedHistory(history);
    
    setLoadingSocial(false);
    // Tyhjennetään valinnat kun aika muuttuu
    setSelectedChatIds(new Set());
    setSelectedPostIds(new Set());
    setSelectedHotIds(new Set());
  };

  useEffect(() => { fetchSocialStats(); }, [timeWindow]);

  // --- 3. AVATAR KAMPANJA ---
  const checkAvatarCampaign = async () => {
    if (!characters || characters.length === 0) return;
    setLoadingAvatar(true);
    
    const { data: logs } = await supabase
      .from('mission_log')
      .select('guest_id')
      .ilike('custom_reason', '%Profiilikuva-bonus%');
    
    const rewardedIds = new Set(logs?.map(l => l.guest_id) || []);
    
    const candidates = characters.filter(c => {
      const hasPlayer = c.assigned_guest_id !== null;
      const hasAvatar = c.avatar_url && c.avatar_url.length > 5;
      const alreadyRewarded = rewardedIds.has(c.assigned_guest_id);
      return hasPlayer && hasAvatar && !alreadyRewarded;
    });

    setAvatarCandidates(candidates);
    setLoadingAvatar(false);
  };

  useEffect(() => { checkAvatarCampaign(); }, [characters]);

  const rewardAvatars = async () => {
    if (avatarCandidates.length === 0) return;
    const rewardAmount = xpConfig?.avatar_bonus || 150; 
    
    if (!confirm(`Palkitaan ${avatarCandidates.length} agenttia profiilikuvasta (${rewardAmount} XP)?`)) return;

    setLoadingAvatar(true);
    const updates = avatarCandidates.map(c => ({
      guest_id: c.assigned_guest_id,
      xp_earned: rewardAmount,
      custom_reason: '📸 Profiilikuva-bonus',
      approval_status: 'approved',
      mission_id: null
    }));

    await supabase.from('mission_log').insert(updates);
    alert('Palkinnot jaettu!');
    setAvatarCandidates([]); 
    setLoadingAvatar(false);
  };

  // --- 4. DATA PROSESSOINTI (MEMO) ---
  const stats = useMemo(() => {
    const map = {};

    const getName = (gid) => {
      const char = characters?.find(c => c.assigned_guest_id === gid);
      return char ? char.name : 'Tuntematon';
    };

    const initEntry = (gid, name) => {
      if (!map[gid]) {
        map[gid] = { 
          id: gid, 
          name: name, 
          msgCount: 0, 
          postCount: 0, 
          hotSum: 0, 
          bestImg: null, 
          maxHot: -1 
        };
      }
    };

    // Chatit
    socialData.chats.forEach(c => {
      if (!c.guest_id) return;
      initEntry(c.guest_id, getName(c.guest_id));
      map[c.guest_id].msgCount += 1;
    });

    // Kuvat
    socialData.posts.forEach(p => {
      if (!p.guest_id) return;
      initEntry(p.guest_id, p.sender_name || getName(p.guest_id));
      const entry = map[p.guest_id];
      entry.postCount += 1;
      entry.hotSum += (p.hot_count || 0);
      if ((p.hot_count || 0) > entry.maxHot) {
        entry.maxHot = p.hot_count || 0;
        entry.bestImg = p.image_url;
      }
    });

    const arr = Object.values(map);

    return { 
      byChat: [...arr].filter(i => i.msgCount > 0).sort((a, b) => b.msgCount - a.msgCount),
      byPost: [...arr].filter(i => i.postCount > 0).sort((a, b) => b.postCount - a.postCount),
      byHot: [...arr].filter(i => i.hotSum > 0).sort((a, b) => b.hotSum - a.hotSum) 
    };
  }, [socialData, characters]);

  // --- 5. TOIMINNOT ---

  // Yleinen valintafunktio
  const toggleSelect = (id, setFunc, currentSet) => {
    const newSet = new Set(currentSet);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setFunc(newSet);
  };

  // ✨ MAGIC BUTTON: Valitse Top 3 (jotka eivät ole saaneet palkintoa)
  const autoSelectTop = (listData, historySet, setFunc) => {
    // 1. Suodata pois ne, jotka on jo palkittu tässä kategoriassa
    const candidates = listData.filter(user => !historySet.has(user.id));
    
    // 2. Ota Top 3
    const top3 = candidates.slice(0, 3).map(u => u.id);
    
    // 3. Aseta valinnat
    setFunc(new Set(top3));
  };

  // Palkitsemisfunktio
  const giveBonus = async (category, amount, defaultReason, selectedSet, setFunc) => {
    if (selectedSet.size === 0) return;
    
    const reason = prompt(
      `Annetaan ${amount} XP valituille (${selectedSet.size} kpl).\nMuokkaa syytä tarvittaessa:`, 
      defaultReason
    );
    if (!reason) return;

    const updates = Array.from(selectedSet).map(gid => ({
      guest_id: gid,
      xp_earned: amount,
      custom_reason: reason,
      approval_status: 'approved',
      mission_id: null
    }));

    const { error } = await supabase.from('mission_log').insert(updates);
    
    if (error) {
      alert('Virhe: ' + error.message);
    } else {
      alert('Pisteet annettu!');
      setFunc(new Set()); // Tyhjennä vain tämä kategoria
      fetchSocialStats(); // Päivitä historia, jotta heitä ei valita heti uudestaan
    }
  };

  return (
    <div className="social-admin-wrapper">
      
      {/* AVATAR KAMPANJA */}
      <div className="avatar-campaign-box">
        <div className="ac-info">
          <h3>📸 PROFILOINTI (Bonus)</h3>
          <p>{avatarCandidates.length > 0 
              ? `Löytyi ${avatarCandidates.length} palkitsematonta kuvaa!` 
              : "Kaikki kuvalliset on palkittu."}
          </p>
        </div>
        <button 
          className="btn-avatar-reward" 
          disabled={avatarCandidates.length === 0 || loadingAvatar}
          onClick={rewardAvatars}
        >
          {loadingAvatar ? '...' : `🚀 PALKITSE (${avatarCandidates.length * (xpConfig?.avatar_bonus || 150)} XP)`}
        </button>
      </div>

      {/* STATS AREA */}
      <div className="social-stats-box">
        <div className="social-header">
          <h3>📊 SOME-KOMENTOKESKUS</h3>
          <div className="time-selector">
            {['15', '30', '60', 'all'].map(t => (
              <button key={t} className={timeWindow === t ? 'active' : ''} onClick={() => setTimeWindow(t)}>
                {t === 'all' ? 'KOKO ILTA' : `${t} min`}
              </button>
            ))}
          </div>
        </div>

        <div className="stats-grid three-col">
          
          {/* --- COL 1: CHAT --- */}
          <div className="stat-col">
            <div className="col-header-row">
              <h4>💬 KESKUSTELIJAT</h4>
              <button className="btn-magic" onClick={() => autoSelectTop(stats.byChat, rewardedHistory.chat, setSelectedChatIds)}>
                ✨ Top 3
              </button>
            </div>
            
            {stats.byChat.map(user => {
              const isDone = rewardedHistory.chat.has(user.id);
              return (
                <div key={'chat' + user.id} className={`stat-row ${selectedChatIds.has(user.id) ? 'selected' : ''} ${isDone ? 'dimmed' : ''}`} 
                     onClick={() => !isDone && toggleSelect(user.id, setSelectedChatIds, selectedChatIds)}>
                  <input type="checkbox" checked={selectedChatIds.has(user.id)} disabled={isDone} readOnly />
                  <div className="stat-info">
                    <span className="name">{user.name} {isDone && '✅'}</span>
                    <span className="score">{user.msgCount} viestiä</span>
                  </div>
                </div>
              );
            })}
            
            {stats.byChat.length > 0 && (
              <button className="btn-mini-reward" 
                disabled={selectedChatIds.size === 0}
                onClick={() => giveBonus('chat', xpConfig?.social_active || 10, '💬 Aktiivinen keskustelija', selectedChatIds, setSelectedChatIds)}>
                Palkitse ({selectedChatIds.size})
              </button>
            )}
          </div>

          {/* --- COL 2: PAPARAZZI --- */}
          <div className="stat-col">
            <div className="col-header-row">
              <h4>📸 PAPARAZZIT</h4>
              <button className="btn-magic" onClick={() => autoSelectTop(stats.byPost, rewardedHistory.post, setSelectedPostIds)}>
                ✨ Top 3
              </button>
            </div>

            {stats.byPost.map(user => {
              const isDone = rewardedHistory.post.has(user.id);
              return (
                <div key={'post' + user.id} className={`stat-row ${selectedPostIds.has(user.id) ? 'selected' : ''} ${isDone ? 'dimmed' : ''}`}
                     onClick={() => !isDone && toggleSelect(user.id, setSelectedPostIds, selectedPostIds)}>
                  <input type="checkbox" checked={selectedPostIds.has(user.id)} disabled={isDone} readOnly />
                  <div className="stat-info">
                    <span className="name">{user.name} {isDone && '✅'}</span>
                    <span className="score">{user.postCount} kuvaa</span>
                  </div>
                </div>
              );
            })}
            
            {stats.byPost.length > 0 && (
              <button className="btn-mini-reward" 
                disabled={selectedPostIds.size === 0}
                onClick={() => giveBonus('post', xpConfig?.social_active || 10, '📸 Aktiivinen kuvaaja', selectedPostIds, setSelectedPostIds)}>
                Palkitse ({selectedPostIds.size})
              </button>
            )}
          </div>

          {/* --- COL 3: TRENDSETTERS --- */}
          <div className="stat-col">
            <div className="col-header-row">
              <h4>🔥 TRENDSETTERS</h4>
              <button className="btn-magic" onClick={() => autoSelectTop(stats.byHot, rewardedHistory.hot, setSelectedHotIds)}>
                ✨ Top 3
              </button>
            </div>

            {stats.byHot.map(user => {
              const isDone = rewardedHistory.hot.has(user.id);
              return (
                <div key={'hot' + user.id} className={`stat-row ${selectedHotIds.has(user.id) ? 'selected' : ''} ${isDone ? 'dimmed' : ''}`}
                     onClick={() => !isDone && toggleSelect(user.id, setSelectedHotIds, selectedHotIds)}>
                  <input type="checkbox" checked={selectedHotIds.has(user.id)} disabled={isDone} readOnly />
                  {user.bestImg && <img src={user.bestImg} alt="best" className="mini-thumb" />}
                  <div className="stat-info">
                    <span className="name">{user.name} {isDone && '✅'}</span>
                    <span className="score">🔥 {user.hotSum}</span>
                  </div>
                </div>
              );
            })}

            {stats.byHot.length > 0 && (
              <button className="btn-mini-reward" 
                disabled={selectedHotIds.size === 0}
                onClick={() => giveBonus('hot', xpConfig?.social_hot || 25, '🔥 Sometykki (Hot Content)', selectedHotIds, setSelectedHotIds)}>
                Palkitse ({selectedHotIds.size})
              </button>
            )}
          </div>

        </div>
      </div>
      
      <style jsx>{`
        .col-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .btn-magic {
          background: linear-gradient(135deg, #6e8efb, #a777e3);
          border: none;
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
          font-size: 11px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .btn-magic:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .dimmed {
          opacity: 0.5;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default AdminSocial;