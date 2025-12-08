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
      // Etsitään UUID url-osoitteesta (esim. /lippu/UUID)
      const urlPath = window.location.pathname;
      const uuidMatch = urlPath.match(/([0-9a-fA-F-]{36})/); // Etsii UUID-muotoisen pätkän
      
      if (uuidMatch) {
        const guestId = uuidMatch[0];
        
        // Haetaan hahmon nimi characters-taulusta
        const { data, error } = await supabase
          .from('characters')
          .select('name')
          .eq('assigned_guest_id', guestId)
          .single();

        if (data && data.name) {
          setIdentityName(data.name);
          // Tallennetaan myös localstorageen varalta
          localStorage.setItem('jc_username', data.name);
        }
      }
    };
    identifyUser();
  }, []);

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

    // Jos identiteetti löytyi URL:sta, käytä sitä. Muuten käytä manuaalista/tallennettua.
    let finalName = identityName || manualName;
    if (!finalName) finalName = 'Tuntematon';

    // Jos käytettiin manuaalista nimeä, tallennetaan se
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

    // Lähetys kantaan
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
          placeholder={identityName ? `Kommentoi hahmona ${identityName}...` : "Kommentoi..."} 
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