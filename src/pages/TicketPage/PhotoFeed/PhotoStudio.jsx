import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, Type, Smile, Frame, X, Send, 
  CheckCircle, ArrowLeft, Move, Wand2, Lock 
} from 'lucide-react';
import { FRAMES, STICKERS, FILTERS } from './constants';

export function PhotoStudio({ 
  imageSrc, 
  identityName, 
  onCancel, 
  onSend,     
  uploading,  
  uploadSuccess,
  phaseValue = 0 
}) {
  // --- Tila ---
  const [activeFrameId, setActiveFrameId] = useState('none');
  const [activeFilterId, setActiveFilterId] = useState('none');
  const [activeTool, setActiveTool] = useState('filters'); 
  
  const [bgPan, setBgPan] = useState({ x: 0, y: 0 }); 
  const [overlays, setOverlays] = useState([]); 
  const [dragTarget, setDragTarget] = useState(null); 
  
  const [toolInputText, setToolInputText] = useState('');
  const [photoMessage, setPhotoMessage] = useState(''); 
  const [processedBlob, setProcessedBlob] = useState(null); 
  
  const canvasRef = useRef(null);
  const workspaceRef = useRef(null);
  const imgRef = useRef(null); 

  // --- iOS VAKAUTUS REFS ---
  // Tarvitaan, jotta natiivitapahtumat saavat tuoreen tiedon ilman uudelleenkiinnitystä
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const overlaysRef = useRef([]);
  const bgPanRef = useRef({ x: 0, y: 0 });
  const dragTargetRef = useRef(null);
  const renderRequested = useRef(false);

  // Synkronoidaan tilat refeihin natiivikuuntelijoita varten
  useEffect(() => { overlaysRef.current = overlays; }, [overlays]);
  useEffect(() => { bgPanRef.current = bgPan; }, [bgPan]);
  useEffect(() => { dragTargetRef.current = dragTarget; }, [dragTarget]);

  // --- Alustus ---
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      img.onload = () => {
        imgRef.current = img;
        setBgPan({ x: 0, y: 0 });
        setOverlays([]); 
        setActiveFrameId('none');
        setActiveFilterId('none');
        setPhotoMessage('');
        requestCanvasDraw();
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  // --- Piirtologiikka (Optimoitu requestAnimationFrame) ---
  const drawCanvas = () => {
    if (!imgRef.current || !canvasRef.current) {
      renderRequested.current = false;
      return;
    }
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

    let renderW, renderH, offsetX, offsetY;
    const aspect = img.width / img.height;
    if (aspect > 1) {
      renderW = size * aspect; renderH = size;
      offsetX = -(renderW - size) / 2 + bgPanRef.current.x;
      offsetY = 0 + bgPanRef.current.y;
    } else {
      renderW = size; renderH = size / aspect;
      offsetX = 0 + bgPanRef.current.x;
      offsetY = -(renderH - size) / 2 + bgPanRef.current.y;
    }
    
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();

    if (currentFilter.applyExtra) {
      ctx.filter = 'none'; 
      currentFilter.applyExtra(ctx, size, size);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    overlaysRef.current.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);
      if (dragTargetRef.current === item.id) {
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
        if (phaseValue >= 1 || !frame.isLocked) {
            frame.draw(ctx, size, size);
        }
    }

    canvas.toBlob((blob) => {
      setProcessedBlob(blob);
      renderRequested.current = false;
    }, 'image/jpeg', 0.9);
  };

  const requestCanvasDraw = () => {
    if (!renderRequested.current) {
      renderRequested.current = true;
      window.requestAnimationFrame(drawCanvas);
    }
  };

  useEffect(() => { 
    requestCanvasDraw();
  }, [activeFrameId, activeFilterId, bgPan, overlays, dragTarget, phaseValue]);

  // --- iOS TOUCH INTERCEPTOR (Nuclear Option) ---
  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = 1080 / rect.width;
    return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
  };

  const handleStartInternal = (e) => {
    if (e.cancelable) e.preventDefault();
    const pt = e.touches ? e.touches[0] : e; 
    const coords = getCanvasCoords(pt.clientX, pt.clientY);
    isDragging.current = true;
    lastPos.current = coords;

    let hitId = null;
    const currentOverlays = overlaysRef.current;
    for (let i = currentOverlays.length - 1; i >= 0; i--) {
      const item = currentOverlays[i];
      const dx = coords.x - item.x;
      const dy = coords.y - item.y;
      if (Math.sqrt(dx*dx + dy*dy) < 100) { hitId = item.id; break; }
    }
    const target = hitId || 'bg';
    dragTargetRef.current = target;
    setDragTarget(target);
  };

  const handleMoveInternal = (e) => {
    if (!isDragging.current) return;
    if (e.cancelable) e.preventDefault(); // LUKITSEE iOS RULLAUKSEN

    const pt = e.touches ? e.touches[0] : e; 
    const pos = getCanvasCoords(pt.clientX, pt.clientY);
    const dx = pos.x - lastPos.current.x;
    const dy = pos.y - lastPos.current.y;
    
    if (dragTargetRef.current === 'bg') {
      setBgPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (dragTargetRef.current) {
      setOverlays(prev => prev.map(item => 
        item.id === dragTargetRef.current ? { ...item, x: item.x + dx, y: item.y + dy } : item
      ));
    }
    lastPos.current = pos;
  };

  const handleEndInternal = () => { 
    isDragging.current = false; 
    dragTargetRef.current = null;
    setDragTarget(null);
  };

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const opt = { passive: false };
    workspace.addEventListener('touchstart', handleStartInternal, opt);
    workspace.addEventListener('touchmove', handleMoveInternal, opt);
    workspace.addEventListener('touchend', handleEndInternal, opt);
    workspace.addEventListener('touchcancel', handleEndInternal, opt);
    return () => {
      workspace.removeEventListener('touchstart', handleStartInternal);
      workspace.removeEventListener('touchmove', handleMoveInternal);
      workspace.removeEventListener('touchend', handleEndInternal);
      workspace.removeEventListener('touchcancel', handleEndInternal);
    };
  }, []); // Tyhjä array = Kiinnitetään kerran, ei katkea koskaan

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
      dragTargetRef.current = null;
    }
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
          <div 
            className="studio-workspace"
            ref={workspaceRef}
            onMouseDown={handleStartInternal} 
            onMouseMove={handleMoveInternal} 
            onMouseUp={handleEndInternal} 
            onMouseLeave={handleEndInternal}
          >
              <div className="canvas-wrapper">
                <canvas ref={canvasRef} className="studio-canvas" />
                
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
                  phaseValue < 1 ? (
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
                  phaseValue < 1 ? (
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
                  phaseValue < 1 ? (
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