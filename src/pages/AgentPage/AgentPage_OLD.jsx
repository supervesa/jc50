import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './AgentPage.css';

const AgentPage = () => {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');

  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [status, setStatus] = useState('idle');
  const chatEndRef = useRef(null);
  
  const [activePoll, setActivePoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  // MUUTOS: Sanakirja tallentaa nyt objektin { name, avatar }
  const [characterMap, setCharacterMap] = useState({});

  // ... (formatTime funktio pysyy samana) ...
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const timeStr = date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    return isToday ? timeStr : `${date.toLocaleDateString('fi-FI', { weekday: 'short' })} ${timeStr}`; 
  };

  useEffect(() => {
    if (!guestId) { setLoading(false); return; }

    const init = async () => {
      // 1. HAE KAIKKI HAHMOT + AVATARIT
      const { data: allChars } = await supabase.from('characters').select('assigned_guest_id, name, avatar_url');
      
      const charMap = {};
      if (allChars) {
        allChars.forEach(c => {
          if (c.assigned_guest_id) {
            // Jos ID löytyy jo, lisätään nimi perään, mutta pidetään eka avatar (yksinkertaisuuden vuoksi)
            if (charMap[c.assigned_guest_id]) {
              charMap[c.assigned_guest_id].name += ` & ${c.name}`;
              // Jos aiemmalla ei ollut avataria mutta tällä on, päivitetään se
              if (!charMap[c.assigned_guest_id].avatar && c.avatar_url) {
                charMap[c.assigned_guest_id].avatar = c.avatar_url;
              }
            } else {
              charMap[c.assigned_guest_id] = {
                name: c.name,
                avatar: c.avatar_url
              };
            }
          }
        });
      }
      setCharacterMap(charMap);

      // ... (Identiteetin haku pysyy samana) ...
      const { data: myChars } = await supabase.from('characters').select('*').eq('assigned_guest_id', guestId);
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
        setIdentity({ charName: null, realName: myGuest?.name || 'Tuntematon', role: 'Vieras', avatar: null, isCharacter: false });
      }

      // ... (Historia ja Poll pysyy samana) ...
      const { data: history } = await supabase.from('chat_messages').select('*, guests(name)').order('created_at', { ascending: true });
      if (history) setChatHistory(history);

      const { data: poll } = await supabase.from('polls').select('*').eq('status', 'active').maybeSingle();
      if (poll) { setActivePoll(poll); checkIfVoted(poll.id); }

      setLoading(false);
    };

    init();

    // ... (Realtime subscriptionit pysyvät samoina) ...
    const chatSub = supabase.channel('agent_chat_v3').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, 
      async (payload) => {
        const { data: sender } = await supabase.from('guests').select('name').eq('id', payload.new.guest_id).single();
        const newMsg = { ...payload.new, guests: { name: sender?.name || 'Unknown' } };
        setChatHistory(prev => [...prev, newMsg]);
      }
    ).subscribe();

    const pollSub = supabase.channel('agent_polls_v3').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'polls' }, 
      (payload) => {
        if (payload.new.status === 'active') { setActivePoll(payload.new); setHasVoted(false); } 
        else { setActivePoll(null); }
      }
    ).subscribe();

    return () => { supabase.removeChannel(chatSub); supabase.removeChannel(pollSub); };
  }, [guestId]);

  useEffect(() => { setTimeout(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100); }, [chatHistory, activePoll]);

  // ... (handlerit pysyvät samoina) ...
  const checkIfVoted = async (pollId) => { const { data } = await supabase.from('poll_votes').select('id').eq('poll_id', pollId).eq('guest_id', guestId).maybeSingle(); if (data) setHasVoted(true); };
  const handleVote = async (index) => { if (!activePoll || hasVoted) return; setHasVoted(true); await supabase.from('poll_votes').insert({ poll_id: activePoll.id, guest_id: guestId, option_index: index }); };
  const handleSend = async (e) => { e.preventDefault(); if (!message.trim()) return; setStatus('sending'); const { error } = await supabase.from('chat_messages').insert({ guest_id: guestId, message: message.trim() }); if (!error) { setMessage(''); setStatus('sent'); setTimeout(() => setStatus('idle'), 1000); } else setStatus('error'); };

  if (loading) return <div className="ap-loading">LADATAAN...</div>;
  if (!guestId || !identity) return <div className="ap-error">VIRHEELLINEN ID</div>;

  return (
    <div className="ap-container">
      {/* HEADER */}
      <div className="ap-header">
        <div className="ap-avatar">
          {identity.avatar ? <img src={identity.avatar} alt="" /> : <div className="ap-initial">{identity.realName.charAt(0)}</div>}
        </div>
        <div className="ap-info">
          <div className="ap-label">AGENTTI: {identity.realName.toUpperCase()}</div>
          <h1 className="ap-name">{identity.charName || identity.realName}</h1>
        </div>
      </div>

      {activePoll && (
        <div className="ap-poll-section">
          <div className="ap-poll-badge">⚠ TEHTÄVÄ</div>
          <h2 className="ap-poll-question">{activePoll.question}</h2>
          {hasVoted ? <div className="ap-voted-msg">VASTAUS TALLENNETTU</div> : 
            <div className="ap-poll-options">{activePoll.options.map((opt, i) => <button key={i} className="ap-poll-btn" onClick={() => handleVote(i)}>{opt}</button>)}</div>
          }
        </div>
      )}

      {/* CHAT STREAM */}
      <div className="ap-chat-stream">
        <div className="ap-chat-intro">-- SALATTU YHTEYS --</div>
        
        {chatHistory.map((msg) => {
          const isMe = msg.guest_id === guestId;
          
          // Haetaan tiedot sanakirjasta
          const charData = characterMap[msg.guest_id] || {};
          const charName = charData.name;
          const avatarUrl = charData.avatar;
          
          const realName = msg.guests?.name || 'Tuntematon';
          
          let displayName = realName;
          if (charName) displayName = `${charName} (${realName})`;

          // Hahmon alkukirjain fallbackiksi
          const initial = displayName.charAt(0).toUpperCase();

          return (
            <div key={msg.id} className={`chat-row ${isMe ? 'row-me' : 'row-other'}`}>
              
              {/* --- MUUTOS: AVATAR VAIN MUILLE (Vasemmalle) --- */}
              {!isMe && (
                <div className="chat-avatar-thumb">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" />
                  ) : (
                    <div className="chat-avatar-initial">{initial}</div>
                  )}
                </div>
              )}

              <div className="chat-bubble">
                <div className="chat-header-row">
                   <span className="chat-sender">{isMe ? 'MINÄ' : displayName}</span>
                   <span className="chat-time">{formatTime(msg.created_at)}</span>
                </div>
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