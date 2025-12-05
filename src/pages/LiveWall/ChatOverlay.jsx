import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './ChatOverlay.css'; 

const ChatOverlay = () => {
  const [messages, setMessages] = useState([]);

  // Apufunktio: Hae hahmon tiedot ID:n perusteella
  const fetchCharacter = async (guestId) => {
    // 1. Kokeillaan löytää hahmo
    const { data: characters } = await supabase
      .from('characters')
      .select('name, role, avatar_url')
      .eq('assigned_guest_id', guestId);

    if (characters && characters.length > 0) {
      // Jos on useita (Avec), näytetään nimet yhdistettynä, mutta vain yksi kuva
      const combinedNames = characters.map(c => c.name).join(' & ');
      const roles = [...new Set(characters.map(c => c.role))].join(' / ');
      const avatar = characters[0].avatar_url; 
      
      return { name: combinedNames, role: roles, avatar: avatar };
    }
    
    // 2. Fallback: Vieraan oikea nimi
    const { data: guest } = await supabase
      .from('guests')
      .select('name')
      .eq('id', guestId)
      .single();

    return { 
      name: guest?.name || 'Tuntematon Agentti', 
      role: 'Vieras', 
      avatar: null 
    };
  };

  useEffect(() => {
    // Kuunnellaan uusia viestejä
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const newMsg = payload.new;
          
          // Haetaan kuka puhuu
          const charInfo = await fetchCharacter(newMsg.guest_id);

          const fullMessage = {
            id: newMsg.id,
            text: newMsg.message,
            charName: charInfo.name,
            charRole: charInfo.role,
            avatar: charInfo.avatar
          };

          // Lisätään viesti näkyviin
          setMessages((prev) => [...prev, fullMessage]);
          
          // Poistetaan viesti 15 sekunnin kuluttua
          setTimeout(() => {
            setMessages((prev) => prev.filter(m => m.id !== newMsg.id));
          }, 15000);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="jc-chat-container">
      {messages.map((msg) => (
        <div key={msg.id} className="jc-chat-bubble">
          
          {/* Avatar / Nimikirjain */}
          <div className="jc-chat-avatar">
            {msg.avatar ? (
              <img src={msg.avatar} alt="Avatar" />
            ) : (
              <div className="jc-chat-initial">{msg.charName.charAt(0)}</div>
            )}
          </div>

          {/* Tekstisisältö */}
          <div className="jc-chat-content">
            <div className="jc-chat-header">
              <span className="jc-chat-name">{msg.charName}</span>
              <span className="jc-chat-role"> // {msg.charRole}</span>
            </div>
            <div className="jc-chat-message">
              {msg.text}
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default ChatOverlay;