import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './PollTakeover.css';

const PollTakeover = () => {
  const [activePoll, setActivePoll] = useState(null);
  const [votes, setVotes] = useState({}); 
  const [totalVotes, setTotalVotes] = useState(0);

  // 1. KÄYNNISTYS JA KUUNTELU
  useEffect(() => {
    
    // A. Hae nykyinen tilanne heti alussa
    const fetchInitialState = async () => {
      const { data } = await supabase
        .from('polls')
        .select('*')
        .eq('status', 'active')
        .maybeSingle(); // Käytä maybeSingle, jotta ei tule 406-virhettä jos tyhjä

      // Asetetaan vain jos löytyy aktiivinen. Jos ei löydy, pidetään null.
      if (data) {
        initPoll(data);
      }
    };

    fetchInitialState();

    // B. Kuuntele muutoksia (TÄMÄ ON PÄÄPOMO)
    const pollSub = supabase
      .channel('public:polls_takeover')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'polls' }, 
        (payload) => {
          console.log("POLL UPDATE:", payload.new); // Debuggaus

          if (payload.new.status === 'active') {
            // Jos status muuttuu aktiiviseksi, näytä heti!
            initPoll(payload.new);
          } else {
            // Jos status on jotain muuta (closed/archive), piilota.
            setActivePoll(null);
            setVotes({});
            setTotalVotes(0);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(pollSub);
  }, []);

  // 2. KUN POLL AKTIVOITUU, HAE SEN ÄÄNET
  const initPoll = async (pollData) => {
    setActivePoll(pollData);

    // Haetaan heti olemassa olevat äänet tälle kyselylle
    const { data: voteData } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', pollData.id);

    if (voteData) {
      const initialVotes = {};
      let total = 0;
      voteData.forEach(v => {
        initialVotes[v.option_index] = (initialVotes[v.option_index] || 0) + 1;
        total++;
      });
      setVotes(initialVotes);
      setTotalVotes(total);
    }
  };

  // 3. KUUNNELLAAN ÄÄNIÄ REAALIAJASSA
  useEffect(() => {
    if (!activePoll) return;

    const voteSub = supabase
      .channel(`public:votes:${activePoll.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_votes' }, 
        (payload) => {
          // Varmistetaan että ääni kuuluu tähän kyselyyn
          if (payload.new.poll_id !== activePoll.id) return;

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

  // JOS EI AKTIIVISTA, EI NÄYTETÄ MITÄÄN
  if (!activePoll) return null;

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