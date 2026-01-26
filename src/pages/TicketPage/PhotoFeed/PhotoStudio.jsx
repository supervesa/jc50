import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, Type, Smile, Frame, X, Send, 
  CheckCircle, ArrowLeft, Move, Wand2, Lock,
  Maximize2 
} from 'lucide-react';
import { FRAMES, STICKERS, FILTERS } from './constants';

export function PhotoStudio({ 
  imageSrc, 
  identityName, 
  onCancel, 
  onSend,     
  uploading,  
  uploadSuccess,
  phaseValue = 0,
  isTester = false 
}) {
  // --- Tila ---
  const [activeFrameId, setActiveFrameId] = useState('none');
  const [activeFilterId, setActiveFilterId] = useState('none');
  const [activeTool, setActiveTool] = useState('filters'); 
  
  const [bgPan, setBgPan] = useState({ x: 0, y: 0 }); 
  const [bgZoom, setBgZoom] = useState(1); 
  const [overlays, setOverlays] = useState([]); 
  const [dragTarget, setDragTarget] = useState(null); 
  
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const initialPinchDistance = useRef(null);
  const initialPinchZoom = useRef(1);

  const [toolInputText, setToolInputText] = useState('');
  const [photoMessage, setPhotoMessage] = useState(''); 
  const [processedBlob, setProcessedBlob] = useState(null); 
  
  const canvasRef = useRef(null);
  const imgRef = useRef(null); 

  // --- Alustus ---
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      img.onload = () => {
        imgRef.current = img;
        setBgPan({ x: 0, y: 0 });
        setBgZoom(1);
        setOverlays([]); 
        setActiveFrameId('none');
        setActiveFilterId('none');
        setPhotoMessage('');
        drawCanvas();
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  // --- Piirtologiikka ---
  const drawCanvas = () => {
    if (!imgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    
    const size = 1080; 
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    
    const currentFilter = FILTERS.find(f => f.id === activeFilterId) || FILTERS[0];
    ctx.filter = currentFilter.filter || 'none';

    const effectiveZoom = isTester ? bgZoom : 1;

    let renderW, renderH, offsetX, offsetY;
    const aspect = img.width / img.height;
    
    if (aspect > 1) {
      renderH = size * effectiveZoom; 
      renderW = size * aspect * effectiveZoom;
    } else {
      renderW = size * effectiveZoom; 
      renderH = (size / aspect) * effectiveZoom;
    }
    
    offsetX = (size - renderW) / 2 + bgPan.x;
    offsetY = (size - renderH) / 2 + bgPan.y;
    
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();

    if (currentFilter.applyExtra) {
      ctx.filter = 'none'; 
      currentFilter.applyExtra(ctx, size, size);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    overlays.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);
      if (dragTarget === item.id) {
        ctx.shadowColor = "rgba(0, 231, 255, 0.9)";
        ctx.shadowBlur = 20;
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
    if (frame && frame.draw) {
        if (phaseValue >= 2 || !frame.isLocked) {
            frame.draw(ctx, size, size);
        }
    }

    canvas.toBlob((blob) => setProcessedBlob(blob), 'image/jpeg', 0.9);
  };

  useEffect(() => { 
    const timer = setTimeout(() => drawCanvas(), 50); 
    return () => clearTimeout(timer);
  }, [activeFrameId, activeFilterId, bgPan, bgZoom, overlays, dragTarget, phaseValue]);

  // --- Muokkaustoiminnot ---
  const addOverlay = (type, content) => {
    if (!content) return;
    const newId = Date.now();
    setOverlays(prev => [...prev, { id: newId, type, content, x: 540, y: 540 }]);
    setDragTarget(newId);
    if (type === 'text') setToolInputText('');
  };

  const removeSelectedOverlay = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (dragTarget && dragTarget !== 'bg') {
      setOverlays(current => current.filter(o => o.id !== dragTarget));
      setDragTarget(null);
    }
  };

  // --- Koordinaatit ja Mobiilieleet ---
  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = 1080 / rect.width;
    return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
  };

  const getPinchDistance = (touches) => {
    return Math.sqrt(
      Math.pow(touches[0].clientX - touches[1].clientX, 2) +
      Math.pow(touches[0].clientY - touches[1].clientY, 2)
    );
  };

  const handleStart = (e) => { 
    if (isTester && e.touches && e.touches.length === 2) {
      isDragging.current = false;
      initialPinchDistance.current = getPinchDistance(e.touches);
      initialPinchZoom.current = bgZoom;
      return;
    }

    const pt = e.touches ? e.touches[0] : e; 
    const coords = getCanvasCoords(pt.clientX, pt.clientY);
    isDragging.current = true;
    lastPos.current = coords;

    let hitId = null;
    for (let i = overlays.length - 1; i >= 0; i--) {
      const item = overlays[i];
      const dx = coords.x - item.x;
      const dy = coords.y - item.y;
      if (Math.sqrt(dx*dx + dy*dy) < 100) { hitId = item.id; break; }
    }
    setDragTarget(hitId || 'bg');
  };

  const handleMove = (e) => { 
    if (isTester && e.touches && e.touches.length === 2 && initialPinchDistance.current) {
      if (e.cancelable) e.preventDefault();
      const currentDist = getPinchDistance(e.touches);
      const ratio = currentDist / initialPinchDistance.current;
      const newZoom = Math.min(Math.max(initialPinchZoom.current * ratio, 1), 4);
      setBgZoom(newZoom);
      return;
    }

    if(!isDragging.current) return;
    if (e.cancelable) e.preventDefault();
    const pt = e.touches ? e.touches[0] : e; 
    const pos = getCanvasCoords(pt.clientX, pt.clientY);
    const dx = pos.x - lastPos.current.x;
    const dy = pos.y - lastPos.current.y;
    
    if (dragTarget === 'bg') {
      setBgPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (dragTarget && dragTarget !== 'bg') {
      setOverlays(prev => prev.map(item => item.id === dragTarget ? { ...item, x: item.x + dx, y: item.y + dy } : item));
    }
    lastPos.current = pos;
  };

  const endDrag = () => { 
    isDragging.current = false; 
    initialPinchDistance.current = null;
  };

  const handleSendClick = () => {
    if (processedBlob) onSend(processedBlob, photoMessage);
  };

  return (
    <div className="studio-overlay">
      <div className="studio-header">
        <button onClick={onCancel} className="btn-ghost"><X size={24} /> Peruuta</button>
        <span className="studio-title">STUDIO</span>
        <button onClick={handleSendClick} className="btn-primary" disabled={uploading || uploadSuccess}>
          {uploading ? '...' : <><Send size={18} /> Lähetä</>}
        </button>
      </div>

      {uploadSuccess ? (
          <div className="success-view">
            <CheckCircle className="success-icon" />
            <h2>LÄHETETTY! 🚀</h2>
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
                <canvas ref={canvasRef} className="studio-canvas" style={{ touchAction: 'none' }} />
                
                <button 
                  className={`delete-hint-overlay ${dragTarget && dragTarget !== 'bg' ? 'visible' : ''}`}
                  onMouseDown={removeSelectedOverlay}
                  onTouchStart={removeSelectedOverlay}
                  type="button"
                >
                  <Trash2 size={22} /> <span>Poista</span>
                </button>
              </div>
          </div>

          <div className="studio-controls">
              {/* TESTER ZOOM TYÖKALUT INLINE-TYYLEILLÄ */}
              {isTester && (
                <div style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px', 
                  background: 'rgba(0,0,0,0.6)', 
                  borderRadius: '16px', 
                  marginBottom: '10px',
                  border: '1px solid rgba(0, 231, 255, 0.3)'
                }}>
                  <Maximize2 size={16} color="#00e7ff" />
                  <input 
                    type="range" min="1" max="4" step="0.01" 
                    value={bgZoom} 
                    onChange={(e) => setBgZoom(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      background: '#444',
                      accentColor: '#00e7ff',
                      cursor: 'pointer'
                    }}
                  />
                  <button 
                    onClick={() => { setBgZoom(1); setBgPan({x:0, y:0}); }}
                    style={{
                      padding: '4px 10px',
                      background: 'transparent',
                      color: '#00e7ff',
                      border: '1px solid #00e7ff',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}
                  >
                    Reset
                  </button>
                </div>
              )}

              <div className="caption-area">
                <input type="text" className="caption-input" placeholder="Viesti seinälle..." 
                  value={photoMessage} onChange={(e) => setPhotoMessage(e.target.value)} />
              </div>

              <div className="tool-tabs">
                <button onClick={() => setActiveTool('filters')} className={`tab-btn ${activeTool === 'filters' ? 'active' : ''}`}><Wand2 size={18} /> Filtterit</button>
                <button onClick={() => setActiveTool('frames')} className={`tab-btn ${activeTool === 'frames' ? 'active' : ''}`}><Frame size={18} /> Kehykset</button>
                <button onClick={() => setActiveTool('stickers')} className={`tab-btn ${activeTool === 'stickers' ? 'active' : ''}`}><Smile size={18} /> Tarrat</button>
                <button onClick={() => setActiveTool('text')} className={`tab-btn ${activeTool === 'text' ? 'active' : ''}`}><Type size={18} /> Teksti</button>
              </div>

              <div className="tool-panel">
                {activeTool === 'filters' && (
                  <div className="horizontal-scroll">
                    {FILTERS.map(f => (
                      <div key={f.id} className={`filter-item ${activeFilterId === f.id ? 'selected' : ''}`}
                        onClick={() => setActiveFilterId(f.id)}>
                          <div className="filter-preview-circle" style={{ filter: f.filter }}></div>
                          <span>{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTool === 'frames' && (
                  phaseValue < 2 ? (
                    <div className="sentinel-lock-overlay-panel">
                        <Lock size={28} />
                        <div className="sentinel-lock-text">
                          <p>MODUULIT LUKITTU</p>
                          <span>KEHYKSET VAATIVAT VALTUUTUKSEN</span>
                        </div>
                    </div>
                  ) : (
                    <div className="horizontal-scroll">
                      {FRAMES.map(frame => (
                        <div key={frame.id} className={`frame-item ${activeFrameId === frame.id ? 'selected' : ''}`}
                          onClick={() => setActiveFrameId(frame.id)} 
                          style={{ borderTop: `4px solid ${frame.color}` }}>{frame.name}</div>
                      ))}
                    </div>
                  )
                )}

                {activeTool === 'stickers' && (
                  phaseValue < 2 ? (
                    <div className="sentinel-lock-overlay-panel">
                        <Lock size={28} />
                        <div className="sentinel-lock-text">
                          <p>PROSESSOIDAAN...</p>
                          <span>SENTINEL-YDIN KALIBROIDAAN</span>
                        </div>
                    </div>
                  ) : (
                    <div className="horizontal-scroll">
                      {STICKERS.map(s => (
                        <button key={s.char} className="sticker-item" 
                          onClick={() => addOverlay('sticker', s.char)}>{s.char}</button>
                      ))}
                    </div>
                  )
                )}

                {activeTool === 'text' && (
                  phaseValue < 2 ? (
                    <div className="sentinel-lock-overlay-panel">
                        <Lock size={28} />
                        <div className="sentinel-lock-text">
                          <p>PÄÄSY ESTETTY</p>
                          <span>ODOTTAA PURKUASETUKSIA</span>
                        </div>
                    </div>
                  ) : (
                    <div className="text-tool-row">
                      <input type="text" className="text-input-modern" placeholder="Teksti..." 
                        value={toolInputText} onChange={(e) => setToolInputText(e.target.value)} />
                      <button className="btn-add-text" 
                        onClick={() => addOverlay('text', toolInputText || 'TEKSTI')}><Move size={20} color="black" /></button>
                    </div>
                  )
                )}
              </div>
          </div>
        </>
      )}
    </div>
  );
}