import React, { useState, useRef, useEffect } from 'react';
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

const STICKERS = ["🕶️", "🎩", "💋", "🍸", "💃", "🕺", "🕵️", "🔥", "🎉", "⭐"];

function PhotoFeed({ myPhotos, photoMessage, setPhotoMessage, onUpload, onDelete, uploading }) {
  // --- STATE ---
  const [selectedImage, setSelectedImage] = useState(null); 
  const [activeFrameId, setActiveFrameId] = useState('none');
  const [activeTool, setActiveTool] = useState('frames'); // 'frames' | 'stickers' | 'text'
  
  // Elementit kankaalla (tausta + tarrat/tekstit)
  const [bgPan, setBgPan] = useState({ x: 0, y: 0 }); 
  const [overlays, setOverlays] = useState([]); 
  
  // Raahaus
  const [dragTarget, setDragTarget] = useState(null); 
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Työkalun input (kuvan päälle tuleva teksti)
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

    // B) TARRAT & KUVA-TEKSTIT
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

  // --- LISÄYSTOIMINNOT ---
  const addOverlay = (type, content) => {
    const newId = Date.now();
    const newItem = { id: newId, type, content, x: 540, y: 540 }; 
    setOverlays([...overlays, newItem]);
    setDragTarget(newId);
    if (type === 'text') setToolInputText('');
  };

  const removeSelectedOverlay = () => {
    if (dragTarget && dragTarget !== 'bg') {
      setOverlays(overlays.filter(o => o.id !== dragTarget));
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
    const { x, y } = lastPos.current;
    let hitId = null;
    for (let i = overlays.length - 1; i >= 0; i--) {
      const item = overlays[i];
      const dx = x - item.x;
      const dy = y - item.y;
      if (Math.sqrt(dx*dx + dy*dy) < 120) { hitId = item.id; break; }
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
  const handleStart = (e) => { e.preventDefault(); const pt = e.touches ? e.touches[0] : e; startDrag(pt.clientX, pt.clientY); };
  const handleMove = (e) => { if(isDragging.current) e.preventDefault(); const pt = e.touches ? e.touches[0] : e; moveDrag(pt.clientX, pt.clientY); };

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

  // ---------------- RENDER ----------------

  if (selectedImage) {
    return (
      <div className="studio-container">
        
        {/* 1. KANGAS */}
        <div 
          className="studio-canvas-wrapper"
          onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={endDrag} onMouseLeave={endDrag}
          onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={endDrag}
        >
           <canvas ref={canvasRef} className="studio-canvas" />
           <div className={`delete-overlay-btn ${dragTarget && dragTarget !== 'bg' && !showSuccess ? 'visible' : ''}`}>
              Poista painamalla 🗑️
           </div>
        </div>

        {showSuccess ? (
           <div style={{ textAlign:'center', width:'100%' }}>
             <h3 style={{color: 'var(--lime)', marginBottom:'1rem'}}>✅ KUVA LÄHETETTY!</h3>
             <div className="bottom-actions">
                <button onClick={closeStudio} className="studio-btn-secondary">🔙 Alkuun</button>
                <button onClick={handleShare} className="studio-btn-primary">📤 Jaa</button>
             </div>
           </div>
        ) : (
          <>
            <p className="studio-hint">Liikuta kuvaa tai tarroja sormella.</p>
            
            {/* 2. PALAUTETTU VIESTIKENTTÄ (Live-seinälle) */}
            <div className="caption-container">
                <input 
                  type="text" 
                  className="caption-input" 
                  placeholder="Kirjoita kuvateksti seinälle..." 
                  value={photoMessage} // Tämä tulee TicketPagesta
                  onChange={(e) => setPhotoMessage(e.target.value)}
                />
            </div>

            {/* 3. TYÖKALUVALIKKO (TABS) */}
            <div className="tool-tabs">
              <button onClick={() => setActiveTool('frames')} className={`tab-btn ${activeTool === 'frames' ? 'active' : ''}`}>🎨 Kehykset</button>
              <button onClick={() => setActiveTool('stickers')} className={`tab-btn ${activeTool === 'stickers' ? 'active' : ''}`}>😎 Tarrat</button>
              <button onClick={() => setActiveTool('text')} className={`tab-btn ${activeTool === 'text' ? 'active' : ''}`}>📝 Teksti</button>
            </div>

            {/* 4. TYÖKALUN SISÄLTÖ */}
            <div className="tool-content">
              {activeTool === 'frames' && (
                <div className="frame-selector">
                  {FRAMES.map(frame => (
                    <div 
                      key={frame.id}
                      className={`frame-btn-item ${activeFrameId === frame.id ? 'selected' : ''}`}
                      onClick={() => setActiveFrameId(frame.id)}
                      style={{ borderColor: activeFrameId === frame.id ? 'var(--turquoise)' : frame.color }}
                    >
                      {frame.name}
                    </div>
                  ))}
                </div>
              )}

              {activeTool === 'stickers' && (
                <div className="sticker-grid">
                  {STICKERS.map(sticker => (
                    <button key={sticker} className="sticker-btn" onClick={() => addOverlay('sticker', sticker)}>
                      {sticker}
                    </button>
                  ))}
                  <button className="sticker-btn" onClick={removeSelectedOverlay} style={{background:'rgba(255,0,0,0.2)'}}>🗑️</button>
                </div>
              )}

              {/* TÄMÄ INPUT ON KUVAN PÄÄLLE TULEVALLE TEKSTILLE */}
              {activeTool === 'text' && (
                <div className="text-tool-wrapper">
                  <input 
                    type="text" 
                    className="text-tool-input" 
                    placeholder="Teksti kuvaan..." 
                    value={toolInputText}
                    onChange={(e) => setToolInputText(e.target.value)}
                  />
                  <button className="text-add-btn" onClick={() => addOverlay('text', toolInputText || 'TEXT')}>LISÄÄ</button>
                  <button className="text-add-btn" onClick={removeSelectedOverlay} style={{background:'#444', color:'#fff'}}>🗑️</button>
                </div>
              )}
            </div>

            {/* 5. ALAOSAN NAPIT */}
            <div className="bottom-actions">
              <button onClick={closeStudio} className="studio-btn-secondary">Peruuta</button>
              <button onClick={handlePost} className="studio-btn-primary" disabled={uploading}>
                {uploading ? 'Lähetetään...' : '🚀 LÄHETÄ'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- PERUSNÄKYMÄ ---
  return (
    <div>
      <section className="jc-card medium mb-2" style={{textAlign:'center'}}>
        <h3 className="jc-h2 feed-header">Juhlafeed</h3>
        <p className="small" style={{marginBottom:'1.5rem'}}>
          Ota kuva, lisää tarrat ja jaa screeneille!
        </p>

        <div className="jc-form">
          <label className={`jc-cta primary upload-area ${uploading ? 'disabled' : ''}`} style={{display:'inline-block', width:'100%', maxWidth:'300px'}}>
            {uploading ? 'Käsitellään...' : '📸 OTA KUVA'}
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
      </section>

      <h4 className="feed-title-small" style={{textAlign:'center'}}>MINUN OTOKSENI ({myPhotos.length})</h4>
      <div className="jc-grid">
        {myPhotos.map(photo => (
          <div key={photo.id} className="jc-col-6">
            <div className="photo-item">
              <img src={photo.image_url} alt="Post" className="photo-img" />
              <div className="photo-meta">
                <p className="photo-msg">"{photo.message || '-'}"</p>
                <button onClick={() => onDelete(photo.id)} className="photo-delete">Poista</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PhotoFeed;