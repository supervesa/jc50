import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Send, Flame } from 'lucide-react';

const PhotoViewOverlay = ({ photo, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [hypeCount, setHypeCount] = useState(photo.hot_count || 0);
  const [isHypeAnimating, setIsHypeAnimating] = useState(false);
  
  // Tila käyttäjän tunnistamiselle
  const [identityName, setIdentityName] = useState('');
  const [manualName, setManualName] = useState(localStorage.getItem('jc_username') || '');

  // 1. Hae käyttäjän henkilöllisyys URL:n perusteella
  useEffect(() => {
    const identifyUser = async () => {
      // Etsitään UUID url-osoitteesta
      const urlPath = window.location.pathname;
      const uuidMatch = urlPath.match(/([0-9a-fA-F-]{36})/); 
      
      if (uuidMatch) {
        const guestId = uuidMatch[0];
        
        // KORJAUS TÄSSÄ:
        // Poistettu .single(), jotta haku tukee useampaa hahmoa samalla ID:llä (avec-parit)
        const { data, error } = await supabase
          .from('characters')
          .select('name')
          .eq('assigned_guest_id', guestId);

        if (data && data.length > 0) {
          // Jos hahmoja on useita, yhdistetään nimet "Matti & Maija"
          // Jos vain yksi, map ja join toimivat silti oikein ("Matti")
          const combinedName = data.map(c => c.name).join(' & ');

          setIdentityName(combinedName);
          setManualName(combinedName); // Pidetään manuaalikenttä synkassa
          localStorage.setItem('jc_username', combinedName);
        }
      }
    };
    identifyUser();
  }, [window.location.pathname]); // Tärkeä: ajaa uudelleen jos hahmo vaihtuu URLissa

  // 2. Hae kommentit
  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', photo.id) 
        .order('created_at', { ascending: true });
      
      if (data) setComments(data);
    };
    fetchComments();
  }, [photo.id]);

  // 3. Lähetä kommentti
  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    let finalName = identityName || manualName;
    if (!finalName) finalName = 'Tuntematon';

    if (!identityName && manualName) {
      localStorage.setItem('jc_username', manualName);
    }

    const commentPayload = {
      post_id: photo.id,
      content: newComment,
      author_name: finalName
    };

    // Optimistinen päivitys
    const optimistic = { ...commentPayload, id: Date.now().toString() };
    setComments([...comments, optimistic]);
    setNewComment('');

    const { error } = await supabase.from('comments').insert(commentPayload);
    if (error) console.error("Kommentin lähetysvirhe:", error);
  };

  // 4. Hype
  const handleHype = async () => {
    setIsHypeAnimating(true);
    setTimeout(() => setIsHypeAnimating(false), 300);
    setHypeCount(prev => prev + 1);
    const { error } = await supabase.rpc('increment_hotness', { row_id: photo.id });
    if (error) console.error("Hype virhe:", error);
  };

  // --- APU: Placeholder-teksti ---
  const getPlaceholderText = () => {
    if (!identityName) return "Kommentoi...";
    // Jos nimi on pitkä (esim. pari), käytä lyhyttä tekstiä
    if (identityName.length > 20) return "Kirjoita kommentti...";
    return `Kommentoi hahmona ${identityName}...`;
  };

  return (
    <div className="overlay-backdrop">
      <div className="overlay-header">
        <button onClick={onClose} className="btn-close"><X size={24} /></button>
      </div>

      <div className="overlay-content">
        <div className="overlay-image-wrapper">
          <img src={photo.image_url} alt="Full" className="overlay-img" />
          
          <button className="hype-fab" onClick={handleHype}>
            <Flame 
              className={`flame-icon ${isHypeAnimating ? 'anim-pop' : ''}`} 
              size={32} 
              fill={hypeCount > 0 ? "#ff4500" : "none"} 
              color={hypeCount > 0 ? "#ff4500" : "#333"}
            />
            <span className="hype-count">{hypeCount}</span>
          </button>
        </div>

        <div className="comments-section">
          {comments.length === 0 && (
            <p style={{opacity: 0.5, textAlign: 'center', marginTop: '20px', fontStyle: 'italic'}}>
              Ei kommentteja. Ole ensimmäinen!
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-author" style={{ color: c.author_name === identityName ? '#00ff41' : '#00e7ff' }}>
                {c.author_name}
              </div>
              <div className="comment-text">{c.content}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="comment-input-bar">
        {/* Näytetään nimikenttä VAIN jos identiteettiä EI löytynyt URL:sta */}
        {!identityName && (
           <input 
             type="text" 
             placeholder="Nimi" 
             className="comment-input" 
             style={{flex: '0 0 70px'}}
             value={manualName}
             onChange={e => setManualName(e.target.value)}
           />
        )}
        
        <input 
          type="text" 
          placeholder={getPlaceholderText()} 
          className="comment-input"
          style={{flex: 1}}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
        />
        <button className="btn-send" onClick={handleSendComment}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default PhotoViewOverlay;