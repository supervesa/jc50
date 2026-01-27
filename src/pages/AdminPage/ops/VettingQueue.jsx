import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const VettingQueue = () => {
  const [pendingLogs, setPendingLogs] = useState([]);

  // Hae jono
  const fetchPending = async () => {
    const { data, error } = await supabase
      .from('mission_log')
      .select('*, guests(name)')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Virhe haettaessa jonoa:", error);
    } else {
      setPendingLogs(data);
    }
  };

  // Realtime kuuntelu
  useEffect(() => {
    fetchPending();
    const sub = supabase.channel('admin_vetting')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_log' }, fetchPending)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // Hyväksy / Hylkää
  const handleAction = async (log, status) => {
    try {
      if (status === 'rejected') {
        await supabase.from('mission_log').update({ approval_status: 'rejected' }).eq('id', log.id);
        return;
      }

      // 1. Haetaan säännöt
      const { data: rulesData } = await supabase
        .from('game_rules')
        .select('value')
        .eq('rule_key', 'xp_config')
        .single();
      
      const xpConfig = rulesData?.value;
      let updates = { approval_status: 'approved' };
      
      // 2. XP Laskenta
      let finalXP = 0;
      let missionNameForWall = "";

      if (log.mission_id === 'personal-objective') {
        finalXP = xpConfig?.personal_objective || 500; 
        missionNameForWall = "SALAINEN TEHTÄVÄ";
      } else if (log.mission_id && (log.xp_earned === 0 || !log.xp_earned)) {
        finalXP = xpConfig?.find_role || 50;
        missionNameForWall = "ETSINTÄKUULUTUS";
      } else {
        finalXP = log.xp_earned;
        missionNameForWall = "TEHTÄVÄ";
      }

      updates.xp_earned = finalXP;

      // 3. Päivitetään mission_log hyväksytyksi
      await supabase.from('mission_log').update(updates).eq('id', log.id);

      // --- KORJATTU LOGIIKKA ALKAA TÄSTÄ ---

      // A. Haetaan Hahmon Nimi (Character Name)
      // Tämä varmistaa, että seinällä lukee hahmon nimi (esim. "Raakel"), eikä vieraan oma nimi.
      const { data: charData } = await supabase
        .from('characters')
        .select('name')
        .eq('assigned_guest_id', log.guest_id)
        .maybeSingle();

      // Jos hahmo löytyy, käytetään sen nimeä. Jos ei, käytetään vieraan oikeaa nimeä varalla.
      const agentName = charData?.name || log.guests?.name || 'Tuntematon Agentti';

      // B. Tarkistetaan onko kuvatodistetta
      let proofImage = null;
      try {
        const parsed = JSON.parse(log.proof_data);
        proofImage = parsed.image; 
      } catch (e) {
        proofImage = null;
      }

      // C. Määritetään tyyppi: 
      // Jos on kuva -> 'mission' (LiveWall Carousel, PhotoWall hylkää)
      // Jos ei kuvaa -> 'announcement' (LiveWall Ticker, PhotoWall hylkää)
      const postType = proofImage ? 'mission' : 'announcement';

      // D. Lähetetään LiveWallille
      await supabase.from('live_posts').insert({
        guest_id: log.guest_id,
        sender_name: "HQ / MISSION CONTROL",
        // Viesti käyttää nyt hahmon nimeä isolla kirjoitettuna
        message: `🚨 AGENTTI ${agentName.toUpperCase()} SUORITTI: ${missionNameForWall}! (+${finalXP} XP)`,
        status: 'approved',
        type: postType,        
        image_url: proofImage, 
        is_visible: true,
        is_deleted: false
      });

      // --- KORJATTU LOGIIKKA PÄÄTTYY TÄHÄN ---

      // 4. Milestone-tarkistus (Vain roolien etsintätehtäville)
      if (log.mission_id && log.mission_id !== 'personal-objective' && xpConfig?.milestones) {
        
        // Lasketaan agentin kaikki hyväksytyt etsintätehtävät
        const { count } = await supabase
          .from('mission_log')
          .select('*', { count: 'exact', head: true })
          .eq('guest_id', log.guest_id)
          .eq('approval_status', 'approved')
          .not('mission_id', 'is', null)
          .neq('mission_id', 'personal-objective');

        // Tarkistetaan, täyttyykö jokin milestone-raja
        const milestone = xpConfig.milestones.find(m => m.count === count);

        if (milestone) {
          // Tarkistetaan duplikaatit
          const { data: existingBonus } = await supabase
            .from('mission_log')
            .select('id')
            .eq('guest_id', log.guest_id)
            .ilike('custom_reason', `%${milestone.label}%`)
            .single();

          if (!existingBonus) {
            const bonusXP = milestone.bonus;
            
            // Myönnetään milestone-bonus
            await supabase.from('mission_log').insert({
              guest_id: log.guest_id,
              xp_earned: bonusXP,
              custom_reason: `🏆 Milestone: ${milestone.label}! (${milestone.count} agenttia löydetty)`,
              approval_status: 'approved',
              mission_id: null 
            });

            // Milestone-ilmoitus myös seinälle (Käytetään tässäkin hahmon nimeä)
            await supabase.from('live_posts').insert({
              guest_id: log.guest_id,
              sender_name: "HQ / MISSION CONTROL",
              content: `🎖️ AGENTTI ${agentName.toUpperCase()} SAAVUTTI TASON: ${milestone.label}! (+${bonusXP} XP)`,
              status: 'approved',
              type: 'announcement'
            });
          }
        }
      }
    } catch (err) {
      console.error("Virhe hyväksynnässä:", err);
    }
  };

  if (pendingLogs.length === 0) return null;

  return (
    <div className="admin-panel mb-4" style={{borderColor: 'gold'}}>
      <h2 style={{color:'gold', borderBottomColor:'gold'}}>🚨 HYVÄKSYNTÄJONO ({pendingLogs.length})</h2>
      <div className="mission-list">
        {pendingLogs.map(log => {
          const missionTitle = log.mission_id === 'personal-objective' 
            ? 'SALAINEN TEHTÄVÄ' 
            : 'ETSINTÄKUULUTUS';

          let proofText = "";
          let proofImage = null;
          try {
            const parsed = JSON.parse(log.proof_data);
            proofText = parsed.text;
            proofImage = parsed.image;
          } catch (e) {
            proofText = log.proof_data;
          }

          return (
            <div key={log.id} className="poll-card history-card" style={{borderColor:'#555'}}>
              <div className="poll-info">
                {/* Admin näkee edelleen vieraan oikean nimen tässä kortissa tunnistamisen helpottamiseksi */}
                <h3 style={{color:'gold'}}>AGENTTI: {log.guests?.name || 'Tuntematon'}</h3>
                <p style={{color:'var(--turquoise)'}}>
                  TEHTÄVÄ: {missionTitle}
                </p>
                
                <div style={{background:'#333', padding:'10px', marginTop:'5px', borderRadius:'4px'}}>
                   <p className="small" style={{color:'#fff', fontStyle:'italic', margin:0}}>
                     "{proofText || 'Ei tekstiä'}"
                   </p>
                   {proofImage && (
                     <a href={proofImage} target="_blank" rel="noreferrer">
                       <img src={proofImage} alt="Todiste" style={{marginTop:'10px', maxWidth:'100%', maxHeight:'200px', borderRadius:'4px', border:'1px solid #555'}} />
                     </a>
                   )}
                </div>
              </div>

              <div className="poll-controls" style={{display:'flex', gap:'10px', flexDirection:'column'}}>
                <button 
                  className="btn-start" 
                  style={{fontSize:'0.9rem', padding:'10px'}}
                  onClick={() => handleAction(log, 'approved')}
                >
                  ✔ HYVÄKSY
                </button>
                <button 
                  className="btn-stop" 
                  style={{fontSize:'0.9rem', padding:'10px', background:'#333', color:'#ff4444', border:'1px solid #ff4444'}}
                  onClick={() => handleAction(log, 'rejected')}
                >
                  ✖ HYLKÄÄ
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VettingQueue;