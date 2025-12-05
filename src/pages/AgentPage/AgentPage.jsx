import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './AgentPage.css';

const AgentPage = () => {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');

  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // CHAT
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [status, setStatus] = useState('idle');
  const chatEndRef = useRef(null);
  
  // POLL
  const [activePoll, setActivePoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  // SANAKIRJA: guestId -> Hahmon nimi
  const [characterMap, setCharacterMap] = useState({});

  useEffect(() => {
    if (!guestId) { setLoading(false); return; }

    const init = async () => {
      // 1. HAE KAIKKI HAHMOT (Luodaan sanakirja)
      // Näin tiedämme chatissa kuka on kuka ilman jatkuvia hakuja
      const { data: allChars } = await supabase.from('characters').select('assigned_guest_id, name');
      const charMap = {};
      if (allChars) {
        allChars.forEach(c => {
          // Jos on avec (useampi nimi), otetaan talteen
          if (charMap[c.assigned_guest_id]) {
            charMap[c.assigned_guest_id] += ` & ${c.name}`;
          } else {
            charMap[c.assigned_guest_id] = c.name;
          }
        });
      }
      setCharacterMap(charMap);

      // 2. HAE OMA IDENTITEETTI
      const { data: myChars } = await supabase
        .from('characters')
        .select('*')
        .eq('assigned_guest_id', guestId);

      // Hae myös oma oikea nimi
      const { data: myGuest } = await supabase.from('guests').select('name').eq('id', guestId).single();

      if (myChars && myChars.length > 0) {
        setIdentity({
          charName: myChars.map(c => c.name).join(' & '),
          realName: myGuest?.name,
          role: myChars[0].role,
          avatar: myChars[0].avatar_url,
          isCharacter: true
        });
      } else {
        setIdentity({ 
          charName: null, 
          realName: myGuest?.name || 'Tuntematon', 
          role: 'Vieras', 
          avatar: null,
          isCharacter: false 
        });
      }

      // 3. HAE HISTORIA (Nyt haetaan guests(name) myös)
      const { data: history } = await supabase
        .from('chat_messages')
        .select('*, guests(name)') 
        .order('created_at', { ascending: true });

      if (history) setChatHistory(history);

      // 4. CHECK POLL
      const { data: poll } = await supabase.from('polls').select('*').eq('status', 'active').maybeSingle();
      if (poll) {
        setActivePoll(poll);
        checkIfVoted(poll.id);
      }

      setLoading(false);
    };

    init();

    // REALTIME
    const chatSub = supabase
      .channel('agent_chat_v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, 
        async (payload) => {
          const { data: sender } = await supabase.from('guests').select('name').eq('id', payload.new.guest_id).single();
          const newMsg = { ...payload.new, guests: { name: sender?.name || 'Unknown' } };
          setChatHistory(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    const pollSub = supabase
      .channel('agent_polls_v2')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'polls' }, 
        (payload) => {
          if (payload.new.status === 'active') {
            setActivePoll(payload.new);
            setHasVoted(false);
          } else {
            setActivePoll(null);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(chatSub); supabase.removeChannel(pollSub); };
  }, [guestId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activePoll]);

  const checkIfVoted = async (pollId) => {
    const { data } = await supabase.from('poll_votes').select('id').eq('poll_id', pollId).eq('guest_id', guestId).maybeSingle();
    if (data) setHasVoted(true);
  };

  const handleVote = async (index) => {
    if (!activePoll || hasVoted) return;
    setHasVoted(true);
    await supabase.from('poll_votes').insert({ poll_id: activePoll.id, guest_id: guestId, option_index: index });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('sending');
    const { error } = await supabase.from('chat_messages').insert({ guest_id: guestId, message: message.trim() });
    if (!error) { setMessage(''); setStatus('sent'); setTimeout(() => setStatus('idle'), 1000); }
    else setStatus('error');
  };

  if (loading) return <div className="ap-loading">LADATAAN TIETOJA...</div>;
  if (!guestId || !identity) return <div className="ap-error">VIRHEELLINEN LINKKI</div>;

  return (
    <div className={`ap-container ${activePoll ? 'alert-mode' : ''}`}>
      
      {/* HEADER: Nyt näyttää molemmat nimet */}
      <div className="ap-header">
        <div className="ap-avatar">
          {identity.avatar ? <img src={identity.avatar} alt="" /> : <div className="ap-initial">{identity.realName.charAt(0)}</div>}
        </div>
        <div className="ap-info">
          <div className="ap-label">AGENTTI: {identity.realName}</div>
          <h1 className="ap-name">{identity.charName || identity.realName}</h1>
          {identity.charName && <div className="ap-role">{identity.role}</div>}
        </div>
      </div>

      {activePoll && (
        <div className="ap-poll-section">
          <div className="ap-poll-badge">⚠ TEHTÄVÄ</div>
          <h2 className="ap-poll-question">{activePoll.question}</h2>
          {hasVoted ? <div className="ap-voted-msg">VASTAUS TALLENNETTU</div> : 
            <div className="ap-poll-options">
              {activePoll.options.map((opt, i) => <button key={i} className="ap-poll-btn" onClick={() => handleVote(i)}>{opt}</button>)}
            </div>
          }
        </div>
      )}

      {/* CHAT STREAM */}
      <div className="ap-chat-stream">
        <div className="ap-chat-intro">-- SALATTU YHTEYS --</div>
        
        {chatHistory.map((msg) => {
          const isMe = msg.guest_id === guestId;
          
          // Selvitä nimen näyttäminen:
          // 1. Onko hahmonimeä? (characterMap)
          // 2. Jos on, näytä: "Hahmo (Oikea nimi)"
          // 3. Jos ei, näytä: "Oikea nimi"
          const charName = characterMap[msg.guest_id];
          const realName = msg.guests?.name;
          
          let displayName = realName;
          if (charName) {
            displayName = `${charName} (${realName})`;
          }

          return (
            <div key={msg.id} className={`chat-row ${isMe ? 'row-me' : 'row-other'}`}>
              <div className="chat-bubble">
                <div className="chat-sender">{isMe ? 'MINÄ' : displayName}</div>
                <div className="chat-text">{msg.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="ap-input-area">
        <form className="ap-form" onSubmit={handleSend}>
          <input className="ap-chat-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Viestisi..." />
          <button type="submit" className={`ap-send-btn ${status}`}>{status === 'idle' ? '➤' : '...'}</button>
        </form>
      </div>

    </div>
  );
};

export default AgentPage;