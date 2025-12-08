import React, { useState, useRef, useEffect } from 'react';
// TÄMÄ POLKU ON KRIITTINEN:
// ../../ vie kansiosta TicketPage -> pages -> src. Sieltä -> lib -> supabaseClient
import { supabase } from '../../lib/supabaseClient'; 
import { 
  Camera, Trash2, Type, Smile, Frame, X, Send, 
  CheckCircle, ArrowLeft, Move 
} from 'lucide-react';

// Varmista, että tämä CSS-tiedosto on kansiossa src/pages/TicketPage/
// Jos se on kansiossa src/pages/, vaihda riviksi: import '../TicketPage.css';
import './TicketPage.css'; 

// --- DATA ---
const FRAMES = [
  { id: 'none', name: 'Ei kehystä', color: '#444', draw: null },
  { 
    id: 'neon-pink', name: 'Neon', color: '#FF00E5',
    draw: (ctx, w, h) => {
      ctx.lineWidth = 40; ctx.strokeStyle = '#FF00E5'; ctx.strokeRect(0,0,w,h);
      ctx.lineWidth = 10; ctx.strokeStyle = '#FFF'; ctx.strokeRect(20,20,w-40,h-40);
    }
  },
  { 
    id: 'top-secret', name: 'Secret', color: '#00ff41',
    draw: (ctx, w, h) => {
      ctx.lineWidth = 50; ctx.strokeStyle = '#000'; ctx.strokeRect(0,0,w,h);
      ctx.lineWidth = 4; ctx.strokeStyle = '#00ff41'; ctx.strokeRect(25,25,w-50,h-50);
      ctx.font = 'bold 80px Courier New'; ctx.fillStyle = '#00ff41'; ctx.textAlign = 'center';
      ctx.fillText('TOP SECRET', w/2, 100);
    }
  },
  { 
    id: 'vip-gold', name: 'VIP', color: '#D4AF37',
    draw: (ctx, w, h) => {
      ctx.lineWidth = 60; ctx.strokeStyle = '#D4AF37'; ctx.strokeRect(0,0,w,h);
      ctx.font = 'bold 60px sans-serif'; ctx.fillStyle = '#D4AF37'; ctx.textAlign = 'right';
      ctx.fillText('VIP', w-50, h-50);
    }
  }
];

const STICKERS = ["🕶️", "🎩", "💋", "🍸", "💃", "🕺", "🕵️", "🔥", "🎉", "⭐", "🦄", "🌈"];

function PhotoFeed() {
  const [selectedImage, setSelectedImage] = useState(null); 
  const [activeFrameId, setActiveFrameId] = useState('none');
  const [activeTool, setActiveTool] = useState('frames'); 
  
  const [bgPan, setBgPan] = useState({ x: 0, y: 0 }); 
  const [overlays, setOverlays] = useState([]); 
  const [dragTarget, setDragTarget] = useState(null); 
  
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [toolInputText, setToolInputText] = useState('');
  const [photoMessage, setPhotoMessage] = useState(''); 

  const [processedBlob, setProcessedBlob] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); 
  
  // Tila käyttäjän tunnistamiselle
  const [identityName, setIdentityName] = useState('');
  const [identityId, setIdentityId] = useState(null);

  const canvasRef = useRef(null);
  const imgRef = useRef(null); 

  // --- 1. TUNNISTA KÄYTTÄJÄ URL:STA ---
  useEffect(() => {
    const identifyUser = async () => {
      const urlPath = window.location.pathname;
      const uuidMatch = urlPath.match(/([0-9a-fA-F-]{36})/); // Etsii UUID:n
      
      if (uuidMatch) {
        const guestId = uuidMatch[0];
        setIdentityId(guestId);
        
        const { data, error } = await supabase
          .from('characters')
          .select('name')
          .eq('assigned_guest_id', guestId)
          .single();

        if (data && data.name) {
          setIdentityName(data.name);
          localStorage.setItem('jc_username', data.name);
        }
      }
    };
    identifyUser();
  }, []);

  // --- KUVA LAITTEELTA ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          imgRef.current = img;
          setBgPan({ x: 0, y: 0 });
          setOverlays([]); 
          setActiveFrameId('none');
          setPhotoMessage('');
          setSelectedImage(ev.target.result);
          setShowSuccess(false);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // --- CANVAS PIIRTO ---
  const drawCanvas = () => {
    if (!imgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    
    const size = 1080; 
    canvas.width = size;
    canvas.height = size;

    let renderW, renderH, offsetX, offsetY;
    const aspect = img.width / img.height;
    if (aspect > 1) {
      renderH = size; renderW = size * aspect;
      offsetX = -(renderW - size) / 2 + bgPan.x;
      offsetY = 0 + bgPan.y;
    } else {
      renderW = size; renderH = size / aspect;
      offsetX = 0 + bgPan.x;
      offsetY = -(renderH - size) / 2 + bgPan.y;
    }
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    overlays.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);
      if (dragTarget === item.id) {
        ctx.shadowColor = "rgba(0, 231, 255, 0.8)";
        ctx.shadowBlur = 15;
      }
      if (item.type === 'sticker') {
        ctx.font = '150px serif';
        ctx.fillText(item.content, 0, 0);
      } else if (item.type === 'text') {
        ctx.font = 'bold 80px Impact, sans-serif';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000';
        ctx.strokeText(item.content, 0, 0);
        ctx.fillStyle = '#FFF';
        ctx.fillText(item.content, 0, 0);
      }
      ctx.restore();
    });

    const frame = FRAMES.find(f => f.id === activeFrameId);
    if (frame && frame.draw) frame.draw(ctx, size, size);

    canvas.toBlob((blob) => setProcessedBlob(blob), 'image/jpeg', 0.85);
  };

  useEffect(() => { drawCanvas(); }, [selectedImage, activeFrameId, bgPan, overlays, dragTarget]);

  // --- MUOKKAUS ---
  const addOverlay = (type, content) => {
    if (!content) return;
    const newId = Date.now();
    setOverlays([...overlays, { id: newId, type, content, x: 540, y: 540 }]);
    setDragTarget(newId);
    if (type === 'text') setToolInputText('');
  };

  const removeSelectedOverlay = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (dragTarget && dragTarget !== 'bg') {
      setOverlays(prev => prev.filter(o => o.id !== dragTarget));
      setDragTarget(null);
    }
  };

  // --- RAAHAUS ---
  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = 1080 / rect.width;
    return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
  };

  const startDrag = (cx, cy) => {
    isDragging.current = true;
    lastPos.current = getCanvasCoords(cx, cy);
    let hitId = null;
    for (let i = overlays.length - 1; i >= 0; i--) {
      const item = overlays[i];
      const dx = lastPos.current.x - item.x;
      const dy = lastPos.current.y - item.y;
      if (Math.sqrt(dx*dx + dy*dy) < 130) { hitId = item.id; break; }
    }
    setDragTarget(hitId || 'bg');
  };

  const moveDrag = (cx, cy) => {
    if (!isDragging.current) return;
    const pos = getCanvasCoords(cx, cy);
    const dx = pos.x - lastPos.current.x;
    const dy = pos.y - lastPos.current.y;
    
    if (dragTarget === 'bg') {
      setBgPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (dragTarget) {
      setOverlays(prev => prev.map(item => item.id === dragTarget ? { ...item, x: item.x + dx, y: item.y + dy } : item));
    }
    lastPos.current = pos;
  };

  const handleStart = (e) => { const pt = e.touches ? e.touches[0] : e; startDrag(pt.clientX, pt.clientY); };
  const handleMove = (e) => { 
    if(isDragging.current) { e.preventDefault(); const pt = e.touches ? e.touches[0] : e; moveDrag(pt.clientX, pt.clientY); }
  };
  const endDrag = () => { isDragging.current = false; };

  // --- LÄHETYS ---
  const handlePost = async () => {
    if (!processedBlob) return;
    setUploading(true);

    try {
      const fileName = `${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('party-photos')
        .upload(fileName, processedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('party-photos')
        .getPublicUrl(fileName);

      // Määritä lähettäjän nimi
      let senderName = identityName || localStorage.getItem('jc_username') || 'Tuntematon';

      const { error: dbError } = await supabase
        .from('live_posts')
        .insert({
          image_url: publicUrl,
          message: photoMessage || '',
          sender_name: senderName,
          guest_id: identityId, // TÄRKEÄ: Tallennetaan linkitys jos löytyy
          status: 'approved',
          hot_count: 0
        });

      if (dbError) throw dbError;

      setShowSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Lähetys epäonnistui!");
    } finally {
      setUploading(false);
    }
  };

  const closeStudio = () => { setSelectedImage(null); setShowSuccess(false); setPhotoMessage(''); };

  if (selectedImage) {
    return (
      <div className="studio-overlay">
        <div className="studio-header">
          <button onClick={closeStudio} className="btn-ghost"><X size={24} /> Peruuta</button>
          <span className="studio-title">Muokkaa</span>
          <button onClick={handlePost} className="btn-primary" disabled={uploading || showSuccess}>
            {uploading ? '...' : <><Send size={18} /> Lähetä</>}
          </button>
        </div>

        {showSuccess ? (
           <div className="success-view">
             <CheckCircle className="success-icon" />
             <h2>Lähetetty! 🚀</h2>
             {identityName && <p style={{color: '#00ff41'}}>Lähettäjä: {identityName}</p>}
             
             <button onClick={closeStudio} className="btn-ghost" style={{border: '1px solid #444', borderRadius: '20px', marginTop: '20px'}}>
               <ArrowLeft size={18} /> Uusi kuva
             </button>
           </div>
        ) : (
          <>
            <div className="studio-workspace"
              onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={endDrag} onMouseLeave={endDrag}
              onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={endDrag}
            >
               <div className="canvas-wrapper">
                 <canvas ref={canvasRef} className="studio-canvas" />
                 <button 
                    className={`delete-hint-overlay ${dragTarget && dragTarget !== 'bg' ? 'visible' : ''}`}
                    onClick={(e) => removeSelectedOverlay(e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{ pointerEvents: dragTarget && dragTarget !== 'bg' ? 'auto' : 'none' }}
                 >
                    <Trash2 size={20} /> <span>Poista</span>
                 </button>
               </div>
            </div>

            <div className="studio-controls">
                <div className="caption-area">
                  <input type="text" className="caption-input" placeholder="Viesti seinälle..." 
                    value={photoMessage} onChange={(e) => setPhotoMessage(e.target.value)} />
                </div>
                <div className="tool-tabs">
                  <button onClick={() => setActiveTool('frames')} className={`tab-btn ${activeTool === 'frames' ? 'active' : ''}`}><Frame /> Kehykset</button>
                  <button onClick={() => setActiveTool('stickers')} className={`tab-btn ${activeTool === 'stickers' ? 'active' : ''}`}><Smile /> Tarrat</button>
                  <button onClick={() => setActiveTool('text')} className={`tab-btn ${activeTool === 'text' ? 'active' : ''}`}><Type /> Teksti</button>
                </div>
                <div className="tool-panel">
                  {activeTool === 'frames' && (
                    <div className="horizontal-scroll">
                      {FRAMES.map(frame => (
                        <div key={frame.id} className={`frame-item ${activeFrameId === frame.id ? 'selected' : ''}`}
                          onClick={() => setActiveFrameId(frame.id)} style={{ borderTop: `4px solid ${frame.color}` }}>{frame.name}</div>
                      ))}
                    </div>
                  )}
                  {activeTool === 'stickers' && (
                    <div className="horizontal-scroll">
                      {STICKERS.map(s => <button key={s} className="sticker-item" onClick={() => addOverlay('sticker', s)}>{s}</button>)}
                    </div>
                  )}
                  {activeTool === 'text' && (
                    <div className="text-tool-row">
                      <input type="text" className="text-input-modern" placeholder="Teksti..." value={toolInputText} onChange={(e) => setToolInputText(e.target.value)} />
                      <button className="btn-add-text" onClick={() => addOverlay('text', toolInputText || 'TEXT')}><Move size={20} color="black" /></button>
                    </div>
                  )}
                </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="upload-card">
        <h2 style={{margin:'0 0 10px 0', fontSize:'1.5rem'}}>
            {identityName ? `Moi, ${identityName}! 📸` : '📸 Juhlafeed'}
        </h2>
        
        <label className="upload-btn-label">
          <Camera size={24} /> OTA KUVA
          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
        </label>
        
        {/* URL:iin lisätään nykyinen ID jos se on tiedossa */}
        <div style={{marginTop: '20px'}}>
            <a href={identityId ? `/wall/${identityId}` : '/wall'} style={{color: '#00e7ff', textDecoration: 'none', fontWeight: 'bold'}}>
                🍿 Katso seinää &rarr;
            </a>
        </div>
      </div>
    </div>
  );
}

export default PhotoFeed;