import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Send, Flame } from 'lucide-react';
import './PhotoViewOverlay.css'; // Tuodaan uusi eroteltu CSS-tiedosto

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
      const urlPath = window.location.pathname;
      const uuidMatch = urlPath.match(/([0-9a-fA-F-]{36})/); 
      
      if (uuidMatch) {
        const guestId = uuidMatch[0];
        
        const { data, error } = await supabase
          .from('characters')
          .select('name')
          .eq('assigned_guest_id', guestId);

        if (data && data.length > 0) {
          const combinedName = data.map(c => c.name).join(' & ');
          setIdentityName(combinedName);
          setManualName(combinedName);
          localStorage.setItem('jc_username', combinedName);
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

    const optimistic = { ...commentPayload, id: Date.now().toString(), created_at: new Date().toISOString() };
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

  const getPlaceholderText = () => {
    if (!identityName) return "Kommentoi...";
    if (identityName.length > 20) return "Kirjoita kommentti...";
    return `Kommentoi hahmona ${identityName}...`;
  };

  return (
    <div className="overlay-backdrop">
      {/* Header sulkunappia varten */}
      <div className="overlay-header">
        <button onClick={onClose} className="btn-close" aria-label="Sulje">
          <X size={24} />
        </button>
      </div>

      <div className="overlay-content">
        {/* Kuva ja Hype-nappi */}
        <div className="overlay-image-wrapper">
          <img src={photo.image_url || photo.url} alt="Full view" className="overlay-img" />
          
          <button className="hype-fab" onClick={handleHype}>
            <Flame 
              className={`flame-icon ${isHypeAnimating ? 'anim-pop' : ''}`} 
              size={24} 
              fill={hypeCount > 0 ? "#ff4500" : "none"} 
              color={hypeCount > 0 ? "#ff4500" : "#333"}
            />
            <span className="hype-count">{hypeCount}</span>
          </button>
        </div>

        {/* Kommentit */}
        <div className="comments-section">
          {photo.caption && (
            <div className="overlay-main-caption" style={{marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px'}}>
               <p style={{fontFamily: 'Gochi Hand, cursive', fontSize: '1.2rem'}}>{photo.caption}</p>
            </div>
          )}

          {comments.length === 0 ? (
            <p style={{opacity: 0.5, textAlign: 'center', marginTop: '20px', fontStyle: 'italic'}}>
              Ei vielä kommentteja.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-author">
                  {c.author_name}
                </div>
                <div className="comment-text">{c.content}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Syöttöpalkki */}
      <div className="comment-input-bar">
        {!identityName && (
           <input 
             type="text" 
             placeholder="Nimi" 
             className="comment-input" 
             style={{flex: '0 0 80px', padding: '12px 10px'}}
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