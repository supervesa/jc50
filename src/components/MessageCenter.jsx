import React, { useState } from 'react';
// Sisarukset samassa kansiossa (src/components/)
import FeedbackInbox from './FeedbackInbox'; 
import EmailComposer from './EmailComposer'; 

const MessageCenter = () => {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'compose'
  const [replyRecipient, setReplyRecipient] = useState(null);

  // Kun Inboxissa painetaan "Vastaa"
  const handleQuickReply = (guest) => {
    console.log("Vastataan vieraalle:", guest);
    setReplyRecipient(guest); // Asetetaan kohde
    setActiveTab('compose');  // Vaihdetaan tabi
  };

  return (
    <div className="message-center-wrapper" style={{ width: '100%' }}>
      
      {/* TABS */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
        <button 
          className={`jc-btn ${activeTab === 'inbox' ? 'primary' : 'outline'}`}
          onClick={() => setActiveTab('inbox')}
        >
          📥 Viestikeskus (Inbox)
        </button>
        <button 
          className={`jc-btn ${activeTab === 'compose' ? 'primary' : 'outline'}`}
          onClick={() => setActiveTab('compose')}
        >
          📤 Lähetä sähköpostia
        </button>
      </div>

      {/* ACTIVE VIEW */}
      {activeTab === 'inbox' && (
        <FeedbackInbox onReply={handleQuickReply} />
      )}

      {activeTab === 'compose' && (
        <EmailComposer initialRecipient={replyRecipient} />
      )}
    </div>
  );
};

export default MessageCenter;