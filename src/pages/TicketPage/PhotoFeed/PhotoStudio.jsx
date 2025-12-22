import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, Type, Smile, Frame, X, Send, 
  CheckCircle, ArrowLeft, Move 
} from 'lucide-react';
import { FRAMES, STICKERS } from './constants';

export function PhotoStudio({ 
  imageSrc, 
  identityName, 
  onCancel, 
  onSend,     // Funktio: (blob, message) => Promise
  uploading,  // Boolean
  uploadSuccess // Boolean (Parent kertoo kun valmis)
}) {
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
  
  const canvasRef = useRef(null);
  const imgRef = useRef(null); 

  // Alustus: Kun kuva tulee propseista, ladataan se Image-objektiin
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setBgPan({ x: 0, y: 0 });
        setOverlays([]); 
        setActiveFrameId('none');
        setPhotoMessage('');
        // Pakotetaan piirto heti
        drawCanvas();
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

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

  useEffect(() => { drawCanvas(); }, [activeFrameId, bgPan, overlays, dragTarget]);

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

  // --- LÄHETYS KLIKKAUS ---
  const handleSendClick = () => {
    if (processedBlob) {
        onSend(processedBlob, photoMessage);
    }
  };

  return (
    <div className="studio-overlay">
      <div className="studio-header">
        <button onClick={onCancel} className="btn-ghost"><X size={24} /> Peruuta</button>
        <span className="studio-title">Muokkaa</span>
        <button onClick={handleSendClick} className="btn-primary" disabled={uploading || uploadSuccess}>
          {uploading ? '...' : <><Send size={18} /> Lähetä</>}
        </button>
      </div>

      {uploadSuccess ? (
          <div className="success-view">
            <CheckCircle className="success-icon" />
            <h2>Lähetetty! 🚀</h2>
            {identityName && <p style={{color: '#00ff41'}}>Lähettäjä: {identityName}</p>}
            
            <button onClick={onCancel} className="btn-ghost" style={{border: '1px solid #444', borderRadius: '20px', marginTop: '20px'}}>
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