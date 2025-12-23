import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  History, Download, ChevronDown, ChevronUp, 
  MessageSquare, Vote, Trophy, Image, ExternalLink, Clock 
} from 'lucide-react';

const MemoryLane = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('system_logs')
        .select('*')
        .eq('event_type', 'GUEST_DELETE_ARCHIVE')
        .order('created_at', { ascending: false });

      if (data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const downloadJson = (log) => {
    const jsonString = JSON.stringify(log.snapshot_data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `archive-${log.snapshot_data.guestName}-${log.created_at}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Apufunktio ajan muotoiluun (esim. 24.12. klo 14:30)
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return `${d.getDate()}.${d.getMonth()+1}. klo ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) return <div style={{padding:'20px', color:'#888'}}>Ladataan arkistoa...</div>;
  if (logs.length === 0) return <div style={{padding:'20px', color:'#888'}}>Ei poistettuja vieraita.</div>;

  return (
    <div style={{marginTop:'30px', borderTop:'1px solid #333', paddingTop:'20px'}}>
      <h3 style={{display:'flex', alignItems:'center', gap:'10px', color:'var(--muted)'}}>
        <History size={20} /> Memory Lane (Poistetut)
      </h3>
      
      <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
        {logs.map(log => {
          const data = log.snapshot_data?.backup || {};
          const name = log.snapshot_data?.guestName || 'Tuntematon';
          const isOpen = expandedId === log.id;
          
          // Järjestetään chatit uusin ensin
          const sortedChats = data.chatMessages ? [...data.chatMessages].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) : [];
          // Järjestetään kuvat uusin ensin
          const sortedPhotos = data.photosMetadata ? [...data.photosMetadata].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) : [];

          return (
            <div key={log.id} className="jc-card" style={{padding:0, overflow:'hidden', borderColor: isOpen ? 'var(--magenta)' : '#333'}}>
              
              {/* HEADER (Nimi ja aika) */}
              <div 
                onClick={() => setExpandedId(isOpen ? null : log.id)}
                style={{
                  padding:'15px', 
                  cursor:'pointer', 
                  display:'flex', 
                  justifyContent:'space-between', 
                  alignItems:'center', 
                  background: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent'
                }}
              >
                <div>
                  <div style={{fontWeight:'bold', color:'var(--cream)', fontSize:'1.1rem'}}>{name}</div>
                  <div style={{fontSize:'0.8rem', color:'#888'}}>Poistettu: {formatTime(log.created_at)}</div>
                </div>
                {isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </div>

              {/* DETAILS (Avautuva osio) */}
              {isOpen && (
                <div style={{padding:'15px', borderTop:'1px solid #333', background:'#1a1a1a'}}>
                  
                  {/* 1. YHTEENVETO GRID */}
                  <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginBottom:'20px', textAlign:'center'}}>
                    <Stat icon={<Vote size={14}/>} val={data.votes?.length} label="Äänet" />
                    <Stat icon={<MessageSquare size={14}/>} val={data.chatMessages?.length} label="Chat" />
                    <Stat icon={<Trophy size={14}/>} val={data.missionLog?.length} label="Tehtävät" />
                    <Stat icon={<Image size={14}/>} val={data.photosMetadata?.length} label="Kuvat" />
                  </div>

                  {/* 2. HAHMOPALAUTE (Korostettu jos on) */}
                  {data.feedback?.length > 0 && (
                     <div style={{background:'#222', padding:'10px', borderRadius:'6px', marginBottom:'20px', borderLeft:'3px solid var(--turquoise)'}}>
                        <div style={{fontSize:'0.8rem', color:'var(--turquoise)', marginBottom:'4px'}}>Hahmopalaute</div>
                        <div style={{fontStyle:'italic', color:'#ddd'}}>"{data.feedback[0]?.message || '(Ei viestiä)'}"</div>
                     </div>
                  )}

                  {/* 3. CHAT HISTORIA (Jos viestejä) */}
                  {sortedChats.length > 0 && (
                    <div style={{marginBottom:'20px'}}>
                      <h4 style={{fontSize:'0.9rem', color:'var(--muted)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px'}}>
                        <MessageSquare size={14} /> CHAT-HISTORIA ({sortedChats.length})
                      </h4>
                      <div style={{maxHeight:'200px', overflowY:'auto', background:'#222', borderRadius:'6px', padding:'5px'}}>
                        {sortedChats.map((chat, i) => (
                          <div key={i} style={{display:'flex', gap:'10px', padding:'8px', borderBottom: i < sortedChats.length-1 ? '1px solid #333' : 'none'}}>
                            <span style={{fontSize:'0.75rem', color:'#666', minWidth:'80px', paddingTop:'2px'}}>
                              {formatTime(chat.created_at)}
                            </span>
                            <span style={{fontSize:'0.9rem', color:'#eee'}}>
                              {chat.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. KUVAT (Jos kuvia) */}
                  {sortedPhotos.length > 0 && (
                    <div style={{marginBottom:'20px'}}>
                      <h4 style={{fontSize:'0.9rem', color:'var(--muted)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px'}}>
                        <Image size={14} /> LÄHETETYT KUVAT ({sortedPhotos.length})
                      </h4>
                      <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                        {sortedPhotos.map((photo, i) => (
                          <div key={i} style={{background:'#222', padding:'8px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                            <div style={{display:'flex', flexDirection:'column'}}>
                              <span style={{fontSize:'0.9rem', color:'#eee'}}>{photo.message || '(Ei kuvatekstiä)'}</span>
                              <span style={{fontSize:'0.75rem', color:'#666'}}>{formatTime(photo.created_at)}</span>
                            </div>
                            {photo.image_url && (
                              <a href={photo.image_url} target="_blank" rel="noopener noreferrer" style={{color:'var(--magenta)', display:'flex', alignItems:'center', gap:'4px', fontSize:'0.8rem', textDecoration:'none'}}>
                                Avaa <ExternalLink size={14}/>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LATAUSNAPPI */}
                  <button onClick={() => downloadJson(log)} className="jc-btn outline" style={{width:'100%', fontSize:'0.8rem', marginTop:'10px'}}>
                    <Download size={14} style={{marginRight:5}}/> Lataa täysi JSON-arkisto
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Pieni apukomponentti gridille
const Stat = ({ icon, val, label }) => (
  <div style={{background:'#222', padding:'8px', borderRadius:'5px'}}>
    <div style={{color:'var(--muted)', display:'flex', justifyContent:'center', marginBottom:2}}>{icon}</div>
    <div style={{fontWeight:'bold', fontSize:'1.1rem'}}>{val || 0}</div>
    <div style={{fontSize:'0.7rem', opacity:0.6}}>{label}</div>
  </div>
);

export default MemoryLane;