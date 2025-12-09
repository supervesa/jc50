import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AgentChat = ({ 
  guestId, 
  chatHistory, 
  characterMap, 
  activePoll, 
  hasVoted, 
  onVote, 
  onSend 
}) => {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const chatEndRef = useRef(null);

  // Aikamuotoilu
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const timeStr = date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    return isToday ? timeStr : `${date.toLocaleDateString('fi-FI', { weekday: 'short' })} ${timeStr}`; 
  };

  // Scrollaa alas kun viestejä tulee
  useEffect(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [chatHistory, activePoll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('sending');
    const success = await onSend(message); // Kutsutaan parentin funktiota
    if (success) {
      setMessage('');
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 1000);
    } else {
      setStatus('error');
    }
  };

  return (
    <>
      {/* POLL SECTION (Jos aktiivinen) */}
      {activePoll && (
        <div className="ap-poll-section">
          <div className="ap-poll-badge">⚠ TEHTÄVÄ</div>
          <h2 className="ap-poll-question">{activePoll.question}</h2>
          {hasVoted ? (
            <div className="ap-voted-msg">VASTAUS TALLENNETTU</div>
          ) : (
            <div className="ap-poll-options">
              {activePoll.options.map((opt, i) => (
                <button key={i} className="ap-poll-btn" onClick={() => onVote(i)}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHAT STREAM */}
      <div className="ap-chat-stream">
        <div className="ap-chat-intro">-- SALATTU YHTEYS --</div>
        
        {chatHistory.map((msg) => {
          const isMe = msg.guest_id === guestId;
          const charData = characterMap[msg.guest_id] || {};
          const charName = charData.name;
          const avatarUrl = charData.avatar;
          
          const realName = msg.guests?.name || 'Tuntematon';
          let displayName = realName;
          if (charName) displayName = `${charName} (${realName})`;

          const initial = displayName.charAt(0).toUpperCase();

          return (
            <div key={msg.id} className={`chat-row ${isMe ? 'row-me' : 'row-other'}`}>
              
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

      {/* INPUT */}
      <div className="ap-input-area">
        <form className="ap-form" onSubmit={handleSubmit}>
          <input 
            className="ap-chat-input" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Viestisi..." 
          />
          <button type="submit" className={`ap-send-btn ${status}`}>
            {status === 'idle' ? '➤' : '...'}
          </button>
        </form>
      </div>
    </>
  );
};

export default AgentChat;