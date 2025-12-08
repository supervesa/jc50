import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Trash2, 
  Type, 
  Smile, 
  Frame, 
  X, 
  Send, 
  Share2, 
  CheckCircle,
  ArrowLeft,
  Move
} from 'lucide-react';
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

function PhotoFeed({ myPhotos, photoMessage, setPhotoMessage, onUpload, onDelete, uploading }) {
  // --- STATE ---
  const [selectedImage, setSelectedImage] = useState(null); 
  const [activeFrameId, setActiveFrameId] = useState('none');
  const [activeTool, setActiveTool] = useState('frames'); // 'frames' | 'stickers' | 'text'
  
  // Elementit kankaalla
  const [bgPan, setBgPan] = useState({ x: 0, y: 0 }); 
  const [overlays, setOverlays] = useState([]); 
  
  // Raahaus
  const [dragTarget, setDragTarget] = useState(null); 
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Työkalun input
  const [toolInputText, setToolInputText] = useState('');

  // Prosessointi
  const [processedBlob, setProcessedBlob] = useState(null); 
  const [showSuccess, setShowSuccess] = useState(false); 
  
  const canvasRef = useRef(null);
  const imgRef = useRef(null); 

  // --- KUVAN LATAUS ---
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
          setActiveTool('frames');
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

    // A) TAUSTA
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

    // B) TARRAT & TEKSTIT
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

    // C) KEHYS
    const frame = FRAMES.find(f => f.id === activeFrameId);
    if (frame && frame.draw) {
      frame.draw(ctx, size, size);
    }

    canvas.toBlob((blob) => setProcessedBlob(blob), 'image/jpeg', 0.9);
  };

  useEffect(() => { drawCanvas(); }, [selectedImage, activeFrameId, bgPan, overlays, dragTarget]);

  // --- LOGIIKKA: LISÄYS & POISTO ---
  
  const addOverlay = (type, content) => {
    if (!content) return; // Estä tyhjät
    const newId = Date.now();
    // Asetetaan keskelle
    const newItem = { id: newId, type, content, x: 540, y: 540 }; 
    setOverlays([...overlays, newItem]);
    setDragTarget(newId);
    if (type === 'text') setToolInputText('');
  };

  // TÄMÄ ON KORJATTU POISTOFUNKTIO
  const removeSelectedOverlay = (e) => {
    // Pysäytetään tapahtuman leviäminen, jotta "dragStart" ei käynnisty
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (dragTarget && dragTarget !== 'bg') {
      const newOverlays = overlays.filter(o => o.id !== dragTarget);
      setOverlays(newOverlays);
      setDragTarget(null);
    }
  };

  // --- RAAHAUS (DRAG) ---
  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = 1080 / rect.width;
    return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
  };

  const startDrag = (cx, cy) => {
    isDragging.current = true;
    lastPos.current = getCanvasCoords(cx, cy);
    const { x, y } = lastPos.current;
    
    // Tarkistetaan osutaanko johonkin elementtiin
    let hitId = null;
    // Käydään läpi käänteisessä järjestyksessä (päällimmäinen ensin)
    for (let i = overlays.length - 1; i >= 0; i--) {
      const item = overlays[i];
      const dx = x - item.x;
      const dy = y - item.y;
      if (Math.sqrt(dx*dx + dy*dy) < 150) { // Kasvatettu osuma-aluetta hieman
        hitId = item.id; 
        break; 
      }
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

  const endDrag = () => { isDragging.current = false; };
  
  // Wrapperit hiiri/kosketustapahtumille
  const handleStart = (e) => { 
    // Ei estetä defaulttia heti, jotta inputit toimii, mutta kankaalla estetään
    // e.preventDefault(); 
    const pt = e.touches ? e.touches[0] : e; 
    startDrag(pt.clientX, pt.clientY); 
  };
  const handleMove = (e) => { 
    if(isDragging.current) {
      e.preventDefault(); // Estä sivun scrollaus raahauksen aikana
      const pt = e.touches ? e.touches[0] : e; 
      moveDrag(pt.clientX, pt.clientY); 
    }
  };

  // --- LÄHETYS ---
  const handlePost = async () => {
    if (!processedBlob) return;
    const file = new File([processedBlob], "studio.jpg", { type: "image/jpeg" });
    const fakeEvent = { target: { files: [file] } };
    await onUpload(fakeEvent);
    setShowSuccess(true);
  };

  const handleShare = async () => {
    if (!processedBlob) return;
    const file = new File([processedBlob], "juhla.jpg", { type: "image/jpeg" });
    if (navigator.share) { try { await navigator.share({ files: [file] }); } catch(e){} } 
    else { alert("Paina kuvaa pitkään tallentaaksesi."); }
  };

  const closeStudio = () => { setSelectedImage(null); setShowSuccess(false); setPhotoMessage(''); };

  // --- RENDER ---
  if (selectedImage) {
    return (
      <div className="studio-overlay">
        
        {/* YLÄPALKKI */}
        <div className="studio-header">
          <button onClick={closeStudio} className="btn-ghost">
            <X size={24} /> Peruuta
          </button>
          <span className="studio-title">Muokkaa</span>
          <button 
            onClick={handlePost} 
            className="btn-primary" 
            disabled={uploading || showSuccess}
          >
            {uploading ? '...' : <><Send size={18} /> Lähetä</>}
          </button>
        </div>

        {/* EDITORIALUE */}
        {showSuccess ? (
           <div className="success-view">
             <CheckCircle className="success-icon" />
             <h2>Lähetetty!</h2>
             <div className="success-actions">
                <button onClick={closeStudio} className="btn-ghost" style={{border: '1px solid #444', borderRadius: '20px'}}>
                  <ArrowLeft size={18} /> Palaa
                </button>
                <button onClick={handleShare} className="btn-primary">
                  <Share2 size={18} /> Jaa
                </button>
             </div>
           </div>
        ) : (
          <>
            <div 
              className="studio-workspace"
              // Tapahtumat kytketty tähän wrapperiin
              onMouseDown={handleStart} 
              onMouseMove={handleMove} 
              onMouseUp={endDrag} 
              onMouseLeave={endDrag}
              onTouchStart={handleStart} 
              onTouchMove={handleMove} 
              onTouchEnd={endDrag}
            >
               <div className="canvas-wrapper">
                 <canvas ref={canvasRef} className="studio-canvas" />
                 
                 {/* POISTA-NAPPI (Nyt oikein sijoitettu) */}
                 <button 
                    className={`delete-hint-overlay ${dragTarget && dragTarget !== 'bg' ? 'visible' : ''}`}
                    onClick={removeSelectedOverlay}
                    // TÄRKEÄ: Estä raahauksen käynnistyminen napista
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{ 
                      pointerEvents: dragTarget && dragTarget !== 'bg' ? 'auto' : 'none', 
                      cursor: 'pointer' 
                    }}
                 >
                    <Trash2 size={20} />
                    <span>Poista valittu</span>
                 </button>
               </div>
            </div>

            {/* TYÖKALUT */}
            <div className="studio-controls">
                
                {/* Viestikenttä seinälle */}
                <div className="caption-area">
                  <input 
                    type="text" 
                    className="caption-input" 
                    placeholder="Kirjoita viesti seinälle (valinnainen)..." 
                    value={photoMessage} 
                    onChange={(e) => setPhotoMessage(e.target.value)}
                  />
                </div>

                {/* Tabit */}
                <div className="tool-tabs">
                  <button onClick={() => setActiveTool('frames')} className={`tab-btn ${activeTool === 'frames' ? 'active' : ''}`}>
                    <Frame /> Kehykset
                  </button>
                  <button onClick={() => setActiveTool('stickers')} className={`tab-btn ${activeTool === 'stickers' ? 'active' : ''}`}>
                    <Smile /> Tarrat
                  </button>
                  <button onClick={() => setActiveTool('text')} className={`tab-btn ${activeTool === 'text' ? 'active' : ''}`}>
                    <Type /> Teksti
                  </button>
                </div>

                {/* Paneeli */}
                <div className="tool-panel">
                  
                  {activeTool === 'frames' && (
                    <div className="horizontal-scroll">
                      {FRAMES.map(frame => (
                        <div 
                          key={frame.id}
                          className={`frame-item ${activeFrameId === frame.id ? 'selected' : ''}`}
                          onClick={() => setActiveFrameId(frame.id)}
                          style={{ borderTop: `4px solid ${frame.color}` }}
                        >
                          {frame.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTool === 'stickers' && (
                    <div className="horizontal-scroll">
                      {STICKERS.map(sticker => (
                        <button key={sticker} className="sticker-item" onClick={() => addOverlay('sticker', sticker)}>
                          {sticker}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeTool === 'text' && (
                    <div className="text-tool-row">
                      <input 
                        type="text" 
                        className="text-input-modern" 
                        placeholder="Teksti kuvaan..." 
                        value={toolInputText}
                        onChange={(e) => setToolInputText(e.target.value)}
                      />
                      <button 
                        className="btn-add-text" 
                        onClick={() => addOverlay('text', toolInputText || 'TEXT')}
                      >
                        <Move size={20} color="black" />
                      </button>
                    </div>
                  )}

                </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- PERUSNÄKYMÄ (FEED) ---
  return (
    <div className="feed-container">
      <div className="upload-card">
        <h2 style={{margin:'0 0 10px 0', fontSize:'1.5rem'}}>📸 Juhlafeed</h2>
        <p style={{color:'#aaa', marginBottom:'20px'}}>Jaa tunnelmat screeneille!</p>

        <label className={`upload-btn-label ${uploading ? 'disabled' : ''}`}>
          {uploading ? 'Käsitellään...' : <><Camera size={24} /> OTA KUVA</>}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
            disabled={uploading} 
          />
        </label>
      </div>

      <div style={{marginBottom: '15px', color: '#666', fontSize:'0.9rem', textTransform:'uppercase'}}>
        Minun otokseni ({myPhotos.length})
      </div>
      
      <div className="photo-grid">
        {myPhotos.map(photo => (
          <div key={photo.id} className="photo-card">
            <img src={photo.image_url} alt="Post" />
            <div className="photo-actions">
              <span className="photo-msg">{photo.message}</span>
              <button onClick={() => onDelete(photo.id)} className="btn-icon-small">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PhotoFeed;