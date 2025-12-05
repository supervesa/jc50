import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './PollTakeover.css';

const PollTakeover = () => {
  const [activePoll, setActivePoll] = useState(null);
  const [votes, setVotes] = useState({}); // { 0: 15, 1: 8, 2: 4 }
  const [totalVotes, setTotalVotes] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Ääniefekti (jos haluat käyttää)
  // const alarmAudio = useRef(new Audio('/sounds/alarm.mp3'));

// 1. KUUNNELLAAN ONKO ÄÄNESTYS KÄYNNISSÄ
  useEffect(() => {
    // Tarkistetaan alussa
    const checkActive = async () => {
      const { data } = await supabase
        .from('polls')
        .select('*')
        .eq('status', 'active')
        .maybeSingle(); // <--- MUUTOS: single() -> maybeSingle()
      
      if (data) activatePoll(data);
    };
    checkActive();

    // Kuunnellaan muutoksia
    const pollSub = supabase
      .channel('public:polls_takeover')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'polls' }, 
        (payload) => {
          if (payload.new.status === 'active') {
            activatePoll(payload.new);
          } else {
            setIsVisible(false); // Piilota jos suljetaan
            setTimeout(() => setActivePoll(null), 1000); // Odota animaatio
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(pollSub);
  }, []);

  // 2. KUN ÄÄNESTYS ALKAA
  const activatePoll = async (pollData) => {
    setActivePoll(pollData);
    setIsVisible(true);
    
    // Hae nykyiset äänet
    const { data: voteData } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', pollData.id);

    // Laske äänet
    const initialVotes = {};
    let total = 0;
    voteData.forEach(v => {
      initialVotes[v.option_index] = (initialVotes[v.option_index] || 0) + 1;
      total++;
    });
    setVotes(initialVotes);
    setTotalVotes(total);

    // SOITA ÄÄNI (Varmista että tiedosto on olemassa public/sounds kansiossa)
    // alarmAudio.current.play().catch(e => console.log("Audio play failed", e));
  };

  // 3. KUUNNELLAAN UUSIA ÄÄNIÄ REAALIAJASSA
  useEffect(() => {
    if (!activePoll) return;

    const voteSub = supabase
      .channel(`public:votes:${activePoll.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_votes' }, 
        (payload) => {
          // Kun uusi ääni tulee
          const optionIndex = payload.new.option_index;
          setVotes(prev => ({
            ...prev,
            [optionIndex]: (prev[optionIndex] || 0) + 1
          }));
          setTotalVotes(prev => prev + 1);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(voteSub);
  }, [activePoll]);

  if (!activePoll || !isVisible) return null;

  return (
    <div className="jc-poll-overlay">
      <div className="jc-poll-alert-stripe">
        <span>⚠ PRIORITY SIGNAL RECEIVED ⚠</span>
        <span>⚠ VOTE REQUIRED ⚠</span>
        <span>⚠ PRIORITY SIGNAL RECEIVED ⚠</span>
        <span>⚠ VOTE REQUIRED ⚠</span>
      </div>

      <div className="jc-poll-container">
        <h1 className="jc-poll-question">{activePoll.question}</h1>
        
        <div className="jc-poll-options">
          {activePoll.options.map((opt, index) => {
            const voteCount = votes[index] || 0;
            // Lasketaan prosentit palkkia varten
            const percent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            
            return (
              <div key={index} className="jc-poll-row">
                <div className="jc-poll-label">
                  <span className="jc-opt-name">{opt}</span>
                  <span className="jc-opt-count">{voteCount}</span>
                </div>
                <div className="jc-poll-bar-bg">
                  <div 
                    className="jc-poll-bar-fill" 
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="jc-poll-instructions">
          AVAA AGENTTI-KOMMUNIKAATTORI JA VAIKUTA NYT
        </div>
      </div>
    </div>
  );
};

export default PollTakeover;