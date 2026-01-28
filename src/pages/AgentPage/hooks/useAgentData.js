import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// Apufunktio: Hash stringille (Pysyvä satunnaistaminen)
const stringHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return hash;
};

// --- UUSI APUFUNKTIO RELAATIOILLE ---
const getBadgeLabel = (type) => {
  const labels = {
    'spouse': 'PUOLISO',
    'avec': 'SEURALAINEN',
    'friend': 'YSTÄVÄ',
    'neighbor': 'NAAPURI',
    'relative': 'SUKULAINEN',
    'business': 'LIIKETUTTAVA',
    'enemy': 'KILPAILIJA',
    'lover': 'RAKASTAJA'
  };
  return labels[type] || null;
};

export const useAgentData = (guestId) => {
  const [loading, setLoading] = useState(true);
  
  // DATA STATE
  const [identity, setIdentity] = useState(null);
  const [characterMap, setCharacterMap] = useState({});
  const [chatHistory, setChatHistory] = useState([]); 
  const [missions, setMissions] = useState([]);
  const [completedMissionIds, setCompletedMissionIds] = useState([]); 
  const [relationships, setRelationships] = useState([]); // LISÄTTY
  
  // GAME STATE
  const [activePoll, setActivePoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [activeFlash, setActiveFlash] = useState(null);
  const [flashResponseSent, setFlashResponseSent] = useState(false);
  const [personalMissionStatus, setPersonalMissionStatus] = useState('none');
  const [isVaultActive, setIsVaultActive] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [shuffleSalt, setShuffleSalt] = useState(0); // LISÄTTY

  // --- 1. ERILLINEN SALAMATARKISTUS (KERROS 1 & 2 KÄYTTÄVÄT TÄTÄ) ---
  const checkFlashStatus = useCallback(async () => {
    if (!guestId) return;

    const { data: flash } = await supabase
      .from('flash_missions')
      .select('*')
      .eq('status', 'active')
      .maybeSingle();

    if (flash) {
      setActiveFlash(flash);
      const { data: response } = await supabase
        .from('flash_responses')
        .select('id')
        .eq('flash_id', flash.id)
        .eq('guest_id', guestId)
        .maybeSingle();
      
      setFlashResponseSent(!!response);
    } else {
      setActiveFlash(null);
    }
  }, [guestId]);

  // --- 2. HERÄTYSLIIKE (KERROS 2: WINDOW FOCUS REVALIDATION) ---
  useEffect(() => {
    const handleRevalidation = () => {
      if (document.visibilityState === 'visible') {
        checkFlashStatus();
      }
    };

    window.addEventListener('focus', handleRevalidation);
    document.addEventListener('visibilitychange', handleRevalidation);

    return () => {
      window.removeEventListener('focus', handleRevalidation);
      document.removeEventListener('visibilitychange', handleRevalidation);
    };
  }, [checkFlashStatus]);

  // --- 3. NORMAALI ALUSTUS ---
  useEffect(() => {
    if (!guestId) { setLoading(false); return; }

    const init = async () => {
      // 1. Sanakirja (Päivitetty hakemaan myös ID relaatioita varten)
      const { data: allChars } = await supabase.from('characters').select('id, assigned_guest_id, name, avatar_url');
      const charMap = {};
      if (allChars) allChars.forEach(c => {
        if (c.assigned_guest_id) {
           if(charMap[c.assigned_guest_id]) {
             charMap[c.assigned_guest_id].name += ` & ${c.name}`;
             if(!charMap[c.assigned_guest_id].avatar) charMap[c.assigned_guest_id].avatar = c.avatar_url;
           } else {
             // Tallennetaan myös char_id relaatiovertailua varten
             charMap[c.assigned_guest_id] = { char_id: c.id, name: c.name, avatar: c.avatar_url };
           }
        }
      });
      setCharacterMap(charMap);

      // 2. Identiteetti
      const { data: myGuest } = await supabase.from('guests').select('name').eq('id', guestId).single();
      const { data: myChars } = await supabase.from('characters').select('*').eq('assigned_guest_id', guestId);

      if (myChars && myChars.length > 0) {
        const myCharId = myChars[0].id;
        setIdentity({
          id: guestId,
          charId: myCharId, // LISÄTTY
          charName: myChars.map(c => c.name).join(' & '),
          realName: myGuest?.name,
          role: myChars[0].role,
          avatar: myChars[0].avatar_url,
          isCharacter: true,
          agentCode: myChars[0].agent_code,
          secretMission: myChars[0].secret_mission 
        });

        // --- MUUTOS: Haetaan KAIKKI relaatiot verkostoanalyysia varten ---
        const { data: rels } = await supabase
          .from('character_relationships')
          .select('*');
        if (rels) setRelationships(rels);
        // ----------------------------------

      } else {
        setIdentity({ 
          id: guestId,
          charId: null,
          charName: null, 
          realName: myGuest?.name || 'Tuntematon', 
          role: 'Vieras', 
          avatar: null, 
          isCharacter: false, 
          agentCode: 'N/A' 
        });
      }

      // 3. Status checks
      const { data: pLog } = await supabase.from('mission_log').select('approval_status').eq('guest_id', guestId).eq('mission_id', 'personal-objective').maybeSingle();
      if (pLog) setPersonalMissionStatus(pLog.approval_status);

      const { data: history } = await supabase.from('chat_messages').select('*, guests(name)').order('created_at', { ascending: true });
      if (history) setChatHistory(history);

      const { data: poll } = await supabase.from('polls').select('*').eq('status', 'active').maybeSingle();
      if (poll) { 
        setActivePoll(poll); 
        const { data: vote } = await supabase.from('poll_votes').select('id').eq('poll_id', poll.id).eq('guest_id', guestId).maybeSingle();
        if (vote) setHasVoted(true);
      }

      const { data: missionData } = await supabase.from('missions').select('*').eq('is_active', true);
      if (missionData) setMissions(missionData);

      const { data: myLogs } = await supabase.from('mission_log').select('mission_id').eq('guest_id', guestId).neq('approval_status', 'rejected');
      if (myLogs) setCompletedMissionIds(myLogs.map(l => l.mission_id));

      const { data: settings } = await supabase.from('game_settings').select('value').eq('key', 'speakeasy_active').maybeSingle();
      if (settings) setIsVaultActive(settings.value);

      await checkFlashStatus();
      setLoading(false);
    };

    init();

    // REALTIME SUBSCRIPTIONS
    const subs = [
      supabase.channel('ag_chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const { data: sender } = await supabase.from('guests').select('name').eq('id', payload.new.guest_id).single();
        setChatHistory(prev => [...prev, { ...payload.new, guests: { name: sender?.name || 'Unknown' } }]);
      }).subscribe(),
      
      supabase.channel('ag_poll').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'polls' }, (payload) => {
        if (payload.new.status === 'active') { setActivePoll(payload.new); setHasVoted(false); } else { setActivePoll(null); }
      }).subscribe(),
      
      supabase.channel('ag_flash').on('postgres_changes', { event: '*', schema: 'public', table: 'flash_missions' }, (payload) => {
         checkFlashStatus();
      }).subscribe(),
      
      supabase.channel('ag_settings').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_settings' }, (payload) => {
        if (payload.new.key === 'speakeasy_active') setIsVaultActive(payload.new.value);
      }).subscribe(),
      
      supabase.channel('ag_score').on('postgres_changes', { event: '*', schema: 'public', table: 'mission_log', filter: `guest_id=eq.${guestId}` }, (payload) => {
        if (payload.eventType === 'UPDATE') {
           if (payload.new.mission_id === 'personal-objective') {
             setPersonalMissionStatus(payload.new.approval_status);
             if (payload.new.approval_status === 'approved') setRewardData({ xp: payload.new.xp_earned, reason: 'Salainen tehtävä hyväksytty!' });
             if (payload.new.approval_status === 'rejected') alert("Päämaja hylkäsi raporttisi. Yritä uudelleen.");
           } 
           else if (payload.new.approval_status === 'rejected') {
             setCompletedMissionIds(prev => prev.filter(id => id !== payload.new.mission_id));
             alert("Tehtäväsuoritus hylättiin! Voit yrittää uudelleen.");
           }
           else if (payload.new.approval_status === 'approved') {
             const xpDiff = payload.new.xp_earned - payload.old.xp_earned;
             if (xpDiff > 0) setRewardData({ xp: xpDiff, reason: 'Suoritus vahvistettu!' });
           }
        }
        if (payload.eventType === 'INSERT') {
          if (payload.new.approval_status === 'approved' && payload.new.xp_earned > 0) {
            setRewardData({ xp: payload.new.xp_earned, reason: payload.new.custom_reason || 'Tehtävä suoritettu' });
          }
          if (payload.new.mission_id && payload.new.mission_id !== 'personal-objective') {
            setCompletedMissionIds(prev => [...prev, payload.new.mission_id]);
          }
        }
      }).subscribe()
    ];

    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [guestId, checkFlashStatus]);

  // ACTIONS
  const handleVote = async (index) => { 
    if (!activePoll || hasVoted) return; 
    setHasVoted(true); 
    await supabase.from('poll_votes').insert({ poll_id: activePoll.id, guest_id: guestId, option_index: index }); 
  };
  
  const handleSendChat = async (msg) => { 
    const { error } = await supabase.from('chat_messages').insert({ guest_id: guestId, message: msg.trim() }); 
    return !error; 
  };

  const submitPersonalReport = async (reportText, imageUrl) => {
    try {
      const { data: existingLog } = await supabase
        .from('mission_log')
        .select('id')
        .eq('guest_id', guestId)
        .eq('mission_id', 'personal-objective')
        .maybeSingle();

      const proofPayload = JSON.stringify({ text: reportText, image: imageUrl });

      if (existingLog) {
        await supabase.from('mission_log').update({
            approval_status: 'pending',
            proof_data: proofPayload,
            created_at: new Date().toISOString()
          }).eq('id', existingLog.id);
      } else {
        await supabase.from('mission_log').insert({
            guest_id: guestId,
            mission_id: 'personal-objective',
            xp_earned: 0,
            approval_status: 'pending',
            proof_data: proofPayload
          });
      }

      if (reportText || imageUrl) {
        const sender = identity?.charName || identity?.realName || 'Salainen Agentti';
        
        await supabase.from('live_posts').insert({
          guest_id: guestId,
          sender_name: sender,
          message: `🕵️ SALAINEN RAPORTTI: ${reportText || '(Vain kuva)'}`,
          image_url: imageUrl,
          is_visible: false,           
          status: 'pending',           
          flag_type: 'mission_proof',
          is_deleted: false
        });
      }

      setPersonalMissionStatus('pending');
      alert("Raportti lähetetty päämajaan!");
    } catch (error) {
      console.error("Raportointivirhe:", error);
      alert("Virhe lähetyksessä. Yritä uudelleen.");
    }
  };

  const submitCode = async (mission, code) => {
    if (code.length !== 4) { alert("Syötä 4-numeroinen koodi."); return false; }
    
    const { data: targetChar } = await supabase.from('characters').select('*').eq('agent_code', code).maybeSingle();
    
    if (!targetChar) { alert("Virheellinen agenttikoodi."); return false; }
    if (targetChar.assigned_guest_id === guestId) { alert("Et voi etsiä itseäsi!"); return false; }

    if (mission.target_tag) {
      const tag = mission.target_tag.toLowerCase();
      const role = (targetChar.role || '').toLowerCase();
      const name = (targetChar.name || '').toLowerCase();
      const story = (targetChar.backstory || '').toLowerCase();
      const isMatch = role.includes(tag) || name.includes(tag) || story.includes(tag);

      if (!isMatch) { 
        alert(`VÄÄRÄ KOHDE! Tehtävä vaatii: "${mission.target_tag}"`); 
        return false; 
      }
    }

    const { error } = await supabase.from('mission_log').insert({
      guest_id: guestId,
      mission_id: mission.id,
      xp_earned: mission.xp_reward,
      approval_status: 'approved',
      custom_reason: `Kohde löydetty: ${targetChar.name}` 
    });

    if (error) { alert("Virhe tai tehtävä jo suoritettu!"); return false; } 
    return true; 
  };

  // --- 4. SOCIAL GRAPH & DYNAMIC DECK LOGIIKKA (UUSI) ---
  const visibleMissions = useMemo(() => {
    if (!missions.length) return [];
    
    const myCharId = identity?.charId;
    // Apukartta ID -> Nimi (verkoston näyttämistä varten)
    // Luodaan characterMapista käänteinen haku tai etsitään suoraan
    const getNameById = (id) => {
      const entry = Object.values(characterMap).find(v => v.char_id === id);
      return entry ? entry.name : 'Tuntematon';
    };

    // 1. Identifioidaan omat suorat kontaktit (Taso 1 ID:t)
    const myDirectIds = new Set();
    if (myCharId && relationships.length > 0) {
      relationships.forEach(r => {
        if (r.char1_id === myCharId) myDirectIds.add(r.char2_id);
        if (r.char2_id === myCharId) myDirectIds.add(r.char1_id);
      });
    }

  const todoMissions = missions.filter(m => 
      !completedMissionIds.includes(m.id) && 
      m.target_guest_id !== guestId // <--- TÄMÄ ESTÄÄ OMAN HAHMON NÄKYMISEN
    );

    // 2. Rikastetaan tehtävät datalla: Taso 1 (Suora), Taso 2 (Verkosto), Taso 3 (Random)
    const enriched = todoMissions.map(m => {
      let relationBadge = null;
      let relationDesc = null;
      let tier = 3; // Oletus: Random

      if (myCharId && m.target_guest_id && characterMap[m.target_guest_id]) {
        const targetCharId = characterMap[m.target_guest_id].char_id;
        
        // --- TASO 1: SUORA SUHDE ---
        const directRel = relationships.find(r => 
          (r.char1_id === myCharId && r.char2_id === targetCharId) || 
          (r.char2_id === myCharId && r.char1_id === targetCharId)
        );

        if (directRel) {
          tier = 1;
          relationBadge = getBadgeLabel(directRel.relation_type);
          relationDesc = directRel.description || null;
        } else {
          // --- TASO 2: VERKOSTO (Kaverin kaveri) ---
          // Etsitään, onko joku MINUN suorista kontakteistani yhteydessä KOHTEESEEN
          const networkRel = relationships.find(r => {
            const isConnectedToTarget = (r.char1_id === targetCharId || r.char2_id === targetCharId);
            if (!isConnectedToTarget) return false;

            // Jos yhteys löytyi, tarkistetaan onko toinen osapuoli minun kaverini
            const otherParty = (r.char1_id === targetCharId) ? r.char2_id : r.char1_id;
            return myDirectIds.has(otherParty);
          });

          if (networkRel) {
            tier = 2;
            const mutualFriendId = (networkRel.char1_id === targetCharId) ? networkRel.char2_id : networkRel.char1_id;
            const mutualFriendName = getNameById(mutualFriendId);
            const relLabel = getBadgeLabel(networkRel.relation_type);
            
            relationBadge = "VERKOSTO";
            relationDesc = `${mutualFriendName} tuntee hänet. (Suhde: ${relLabel})`;
          }
        }
      }

      return { ...m, tier, relationBadge, relationDesc };
    });

    // 3. Jaetaan pinot
    const tier1 = enriched.filter(m => m.tier === 1); // Suorat
    const tier2 = enriched.filter(m => m.tier === 2); // Verkosto
    const tier3 = enriched.filter(m => m.tier === 3); // Randomit

    // 4. "Dynaaminen pakka" -valintalogiikka (Slot System)
    const selection = [];

    // SLOT 1: Ensisijaisesti Taso 1. Kierrätetään suolalla.
    if (tier1.length > 0) {
      selection.push(tier1[shuffleSalt % tier1.length]);
    } else if (tier2.length > 0) {
      // Jos ei suoria, otetaan verkosto
      selection.push(tier2[shuffleSalt % tier2.length]);
    } else {
      // Jos ei verkostoakaan, random
      selection.push(tier3[shuffleHash(0, tier3.length)]); 
    }

    // SLOT 2: Ensisijaisesti Taso 2. Kierrätetään eri vaiheessa.
    if (tier2.length > 0) {
      // Varmistetaan ettei tule tuplaa, jos Slot 1 otti jo sieltä
      const index = (shuffleSalt + 1) % tier2.length;
      const candidate = tier2[index];
      if (!selection.includes(candidate)) selection.push(candidate);
      else if (tier3.length > 0) selection.push(tier3[shuffleHash(1, tier3.length)]);
    } else if (tier1.length > 1) {
      // Jos ei verkostoa, mutta on toinen suora suhde
      const index = (shuffleSalt + 1) % tier1.length;
      const candidate = tier1[index];
      if (!selection.includes(candidate)) selection.push(candidate);
      else if (tier3.length > 0) selection.push(tier3[shuffleHash(1, tier3.length)]);
    } else if (tier3.length > 0) {
      const candidate = tier3[shuffleHash(1, tier3.length)];
      if (!selection.includes(candidate)) selection.push(candidate);
    }

    // SLOT 3: Aina Random (Taso 3), jotta pakka elää ja vaihtuu.
    // Etsitään random, jota ei ole vielä valittu
    const availableRandoms = tier3.filter(m => !selection.includes(m));
    if (availableRandoms.length > 0) {
      // Käytetään suolaa sekoittamaan randomit joka kerta
      const index = stringHash(guestId + shuffleSalt) % availableRandoms.length; 
      // Varmistetaan positiivinen indeksi
      const safeIndex = Math.abs(index);
      selection.push(availableRandoms[safeIndex]);
    } else {
      // Jos randomit loppu, täytetään mistä vain
      const leftovers = enriched.filter(m => !selection.includes(m));
      if (leftovers.length > 0) selection.push(leftovers[0]);
    }

    // Apufunktio random-indeksille
    function shuffleHash(seed, max) {
      if (max === 0) return 0;
      return Math.abs(stringHash(guestId + seed + shuffleSalt)) % max;
    }

    return selection.slice(0, 3); // Palautetaan max 3
  }, [missions, completedMissionIds, guestId, identity, relationships, characterMap, shuffleSalt]);

  const refreshMissions = () => setShuffleSalt(prev => prev + 1);
  const nextMission = visibleMissions.length > 0 ? visibleMissions[0] : null;

  return {
    loading,
    identity,
    characterMap,
    chatHistory,
    missions, 
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
    refreshMissions // LISÄTTY
  };
};