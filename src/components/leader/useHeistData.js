import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
import { DUMMY_AGENTS, ENABLE_DUMMY_MODE } from './dummyData';

export const useHeistData = (myGuestId = null) => {
  const [agents, setAgents] = useState([]);
  const [recentMissions, setRecentMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // 1. Haetaan oikea data
      const { data: leaderData, error } = await supabase.from('leaderboard').select('*');
      
      if (error) {
        console.error("Supabase leaderboard error:", error);
        // Älä kaada sovellusta, jatka tyhjällä tai dummylla
      }

      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: missionData } = await supabase
        .from('mission_log')
        .select('guest_id, xp_earned, created_at')
        .gt('created_at', sixHoursAgo);

      // 2. Yhdistetään Dummy-data jos kytkin on päällä
      let combinedAgents = leaderData || [];
      let combinedMissions = missionData || [];

      if (ENABLE_DUMMY_MODE) {
        combinedAgents = [...combinedAgents, ...DUMMY_AGENTS];
        // Luodaan dummylle feikki-tehtävät laskentaa varten
        const dummyMissions = DUMMY_AGENTS.map(a => ({
          guest_id: a.id,
          xp_earned: Math.floor(a.xp / 10),
          created_at: a.last_active_at
        }));
        combinedMissions = [...combinedMissions, ...dummyMissions];
      }

      // Poistetaan duplikaatit ID:n perusteella
      const uniqueAgents = Array.from(new Map(combinedAgents.map(item => [item.id, item])).values());
      
      // Järjestetään pisteiden mukaan
      const sorted = uniqueAgents.sort((a, b) => b.xp - a.xp);
      
      setAgents(sorted);
      setRecentMissions(combinedMissions);
    } catch (err) {
      console.error("Data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- APUFUNKTIOT ---
  const getTopActive = (minutes) => {
    const timeLimit = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const relevant = recentMissions.filter(m => m.created_at > timeLimit);
    
    const scores = {};
    relevant.forEach(m => scores[m.guest_id] = (scores[m.guest_id] || 0) + m.xp_earned);

    return Object.entries(scores)
      .map(([id, score]) => {
        const agent = agents.find(a => a.id === id || a.assigned_guest_id === id);
        return { name: agent ? agent.name : 'Unknown', score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  // --- STATSIT ---
  const topTarget = agents[0];
  const chasers = agents.slice(1, 4);
  const active30Min = getTopActive(30);
  const activeEvening = getTopActive(360);

  // --- HENKILÖKOHTAINEN DATA ---
  let myStats = null;
  if (myGuestId && agents.length > 0) {
    // Etsitään oma indeksi listalta
    const myRankIndex = agents.findIndex(a => a.id === myGuestId || a.assigned_guest_id === myGuestId);
    
    if (myRankIndex !== -1) {
      const me = agents[myRankIndex];
      const prevAgent = agents[myRankIndex - 1]; // Kuka on edellä?
      
      // Lasketaan "Heat" - onko aktiivinen viimeisen 15 min aikana?
      const lastActive = me.last_active_at ? new Date(me.last_active_at) : new Date(0);
      const isHot = (new Date() - lastActive) < 15 * 60 * 1000;

      myStats = {
        rank: myRankIndex + 1,
        xp: me.xp,
        found_secret_bar: me.found_secret_bar,
        completed_secret_mission: me.completed_secret_mission,
        targetGap: topTarget ? topTarget.xp - me.xp : 0,
        nextGap: prevAgent ? prevAgent.xp - me.xp : 0,
        nextName: prevAgent ? prevAgent.name : 'KÄRKI',
        isHot: isHot
   };
    }
  }

  // --- LIVE WALL GLOBAL STATS (SINUN KOODISI + LISÄYKSET) ---
  
  // 1. Total Loot
  const totalLoot = (agents || []).reduce((sum, agent) => sum + (Number(agent.xp) || 0), 0);

  // 2. Global Heat
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const recentCount = recentMissions.filter(m => m.created_at > fiveMinsAgo).length;
  let globalHeat = 'LOW'; 
  if (recentCount > 10) globalHeat = 'CRITICAL'; 
  else if (recentCount > 3) globalHeat = 'MEDIUM'; 

  // 3. Ticker (Suomennettu)
  const tickerEvents = recentMissions
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5) 
    .map(m => {
      const agent = agents.find(a => a.id === m.guest_id || a.assigned_guest_id === m.guest_id);
      return {
        id: m.guest_id + m.created_at,
        agentName: agent ? agent.name : 'Tuntematon Agentti',
        xp: m.xp_earned,
        reason: m.custom_reason || 'Tehtävä suoritettu',
        time: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
    });

  // 4. Salakapakka & Holvi
  const secretFoundCount = agents.filter(a => a.found_secret_bar).length;
  const vaultProgress = Math.min(100, Math.round((totalLoot / 150000) * 100)); 

  // --- 5. RIVALS (KIREÄ TAISTELU) ---
  let rivalsPair = null;
  let minGap = Infinity;
  const top10 = agents.slice(0, 10);
  
  if (top10.length >= 2) {
    for (let i = 0; i < top10.length - 1; i++) {
      const gap = top10[i].xp - top10[i+1].xp;
      if (gap < minGap) {
        minGap = gap;
        rivalsPair = {
          leader: top10[i],
          chaser: top10[i+1],
          gap: gap
        };
      }
    }
  }

  // --- 6. RISING STARS (NOUSIJAT 30 MIN) ---
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const recentLogs = recentMissions.filter(m => m.created_at > thirtyMinsAgo);
  
  const risingMap = {};
  recentLogs.forEach(log => {
    risingMap[log.guest_id] = (risingMap[log.guest_id] || 0) + log.xp_earned;
  });

  const risingStars = Object.entries(risingMap)
    .map(([id, xp]) => {
      const agent = agents.find(a => a.id === id || a.assigned_guest_id === id);
      return {
        name: agent ? agent.name : 'Unknown',
        avatar: agent ? agent.avatar_url : null,
        gainedXp: xp
      };
    })
    .sort((a, b) => b.gainedXp - a.gainedXp)
    .slice(0, 3); 

  // --- 7. ACTIVE AGENTS (LAST 1h) - UUSI LISÄYS ---
  // Tätä tarvitaan Sivu 1:n oikeaan laitaan "Aktiiviset Agentit"
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  // Kerätään uniikit guest_id:t viimeisen tunnin logeista
  const activeUniqueIds = new Set(
    recentMissions
      .filter(m => m.created_at > oneHourAgo)
      .map(m => m.guest_id)
  );
  const activeAgentCount = activeUniqueIds.size;


  return { 
    agents, 
    topTarget, 
    chasers, 
    loading, 
    myStats,
    totalLoot,
    globalHeat,
    tickerEvents,
    intelStats: {
      activeAgentCount, // <--- UUSI KENTTÄ
      secretFoundCount,
      vaultProgress,
      rivalsPair,   
      risingStars   
    }
  };
};