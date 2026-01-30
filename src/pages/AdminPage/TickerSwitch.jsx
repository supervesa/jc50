import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Activity, Power, Radio, Clock, Flame, Sun, Calendar, Infinity as InfinityIcon } from 'lucide-react';

// Määritellään "levylautasen" preset-asennot
const TIME_PRESETS = [
  { value: 60,   label: 'HYPE',  desc: '1h (Viimeisimmät)',   color: '#ff3333', icon: Flame },
  { value: 240,  label: 'PARTY', desc: '4h (Juhlan kaari)',   color: '#00E7FF', icon: Activity },
  { value: 720,  label: 'DAY',   desc: '12h (Aamusta iltaan)',color: '#00ff41', icon: Sun },
  { value: 0,    label: 'ALL',   desc: 'HISTORY (Kaikki)',    color: '#bd00ff', icon: Calendar } // 0 = näytä kaikki
];

const AdminControlDeck = () => {
  // --- STATE: Ticker ---
  const [tickerMode, setTickerMode] = useState('AUTO');
  
  // --- STATE: Time Slider ---
  // Etsitään lähin preset-indeksi tietokannan minuuttiluvun perusteella
  const [sliderIndex, setSliderIndex] = useState(2); // Oletus: DAY (720)
  const [loading, setLoading] = useState(true);

  // --- 1. ALUSTUS JA KUUNTELU ---
  useEffect(() => {
    const fetchData = async () => {
      // Hae Ticker-tila
      const { data: tickerData } = await supabase
        .from('broadcast_settings')
        .select('value')
        .eq('key', 'ticker_mode')
        .maybeSingle();

      // Hae Live-tila (aikajänne)
      const { data: liveData } = await supabase
        .from('live_state')
        .select('history_window_minutes')
        .eq('id', 1)
        .maybeSingle();

      if (tickerData) setTickerMode(tickerData.value);
      
      if (liveData) {
        const mins = liveData.history_window_minutes;
        // Etsi mikä preset vastaa tietokannan minuutteja (tai on lähimpänä)
        const foundIndex = TIME_PRESETS.findIndex(p => p.value === mins);
        setSliderIndex(foundIndex !== -1 ? foundIndex : 2); // Fallback: DAY
      }
      
      setLoading(false);
    };

    fetchData();

    // Kuuntele muutoksia (jos toinen admin säätää)
    const channel = supabase.channel('admin_deck_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'broadcast_settings' }, 
        (payload) => { if(payload.new.key === 'ticker_mode') setTickerMode(payload.new.value); }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_state', filter: 'id=eq.1' }, 
        (payload) => {
           const mins = payload.new.history_window_minutes;
           const foundIndex = TIME_PRESETS.findIndex(p => p.value === mins);
           if (foundIndex !== -1) setSliderIndex(foundIndex);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // --- 2. PÄIVITYSFUNKTIOT ---
  const updateTicker = async (newMode) => {
    setTickerMode(newMode);
    await supabase.from('broadcast_settings').update({ value: newMode }).eq('key', 'ticker_mode');
  };

  const handleSliderChange = (e) => {
    setSliderIndex(parseInt(e.target.value));
  };

  // Päivitetään tietokanta vasta kun "päästetään irti" sliderista (ettei tule turhia kutsuja)
  const handleSliderCommit = async () => {
    const selectedPreset = TIME_PRESETS[sliderIndex];
    console.log("Setting time window to:", selectedPreset.desc);
    
    await supabase
      .from('live_state')
      .update({ history_window_minutes: selectedPreset.value })
      .eq('id', 1);
  };

  if (loading) return <div style={{color:'#666', fontSize:'12px'}}>Loading Deck...</div>;

  // --- UI APURIT ---
  const currentPreset = TIME_PRESETS[sliderIndex];
  const IconComponent = currentPreset.icon;

  const btnStyle = (active, color) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
    background: active ? color : 'rgba(255,255,255,0.05)',
    color: active ? '#000' : '#666', fontWeight: 'bold', transition: 'all 0.2s',
    fontSize: '0.8rem'
  });

  return (
    <div style={{ 
      background: '#0a0a0a', 
      padding: '20px', 
      borderRadius: '12px', 
      border: '1px solid #333', 
      maxWidth: '380px',
      fontFamily: 'sans-serif'
    }}>
      
      {/* OSA 1: TICKER CONTROL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#666', marginBottom: '10px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing:'1px' }}>
        <Activity size={12} /> BROADCAST SIGNAL
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px' }}>
        <button onClick={() => updateTicker('OFF')} style={btnStyle(tickerMode === 'OFF', '#ff3333')}>
          <Power size={14} /> OFF
        </button>
        <button onClick={() => updateTicker('AUTO')} style={btnStyle(tickerMode === 'AUTO', '#00ff41')}>
          <Activity size={14} /> AUTO
        </button>
        <button onClick={() => updateTicker('ON')} style={btnStyle(tickerMode === 'ON', '#00E7FF')}>
          <Radio size={14} /> ON AIR
        </button>
      </div>

      {/* EROTIN */}
      <div style={{height: '1px', background: '#222', marginBottom: '20px'}}></div>

      {/* OSA 2: TIME WINDOW SLIDER */}
      <div style={{ display: 'flex', justifyContent:'space-between', alignItems: 'center', color: '#666', marginBottom: '15px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing:'1px' }}>
        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
           <Clock size={12} /> TIME WINDOW
        </div>
        <div style={{color: currentPreset.color, transition: 'color 0.3s'}}>
          {currentPreset.desc.toUpperCase()}
        </div>
      </div>

      {/* SLIDER CONTAINER */}
      <div style={{ position: 'relative', height: '50px', display: 'flex', alignItems: 'center' }}>
        
        {/* Taustaraidat (Steps) */}
        <div style={{
          position: 'absolute', width: '100%', display: 'flex', justifyContent: 'space-between', 
          padding: '0 10px', boxSizing: 'border-box', zIndex: 0, pointerEvents: 'none'
        }}>
           {TIME_PRESETS.map((p, i) => (
             <div key={i} style={{
               width: '2px', height: '10px', 
               background: i === sliderIndex ? p.color : '#333',
               transition: 'background 0.3s'
             }}/>
           ))}
        </div>

        {/* Itse Slider (Range Input) */}
        <input 
          type="range" 
          min="0" 
          max={TIME_PRESETS.length - 1} 
          step="1"
          value={sliderIndex}
          onChange={handleSliderChange}
          onMouseUp={handleSliderCommit} // Hiiri
          onTouchEnd={handleSliderCommit} // Kosketusnäyttö
          style={{
            width: '100%',
            cursor: 'pointer',
            zIndex: 2,
            accentColor: currentPreset.color // Selaimen natiivi väri slider-pallolle
          }}
        />
      </div>

      {/* VISUAALINEN PALAUTE ALHAALLA */}
      <div style={{ 
        marginTop: '5px', 
        padding: '10px', 
        background: `linear-gradient(90deg, ${currentPreset.color}22 0%, transparent 100%)`, 
        borderLeft: `3px solid ${currentPreset.color}`,
        borderRadius: '0 4px 4px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.3s ease'
      }}>
         <IconComponent size={20} color={currentPreset.color} />
         <div>
            <div style={{color: '#fff', fontWeight: 'bold', fontSize: '0.9rem'}}>
              {currentPreset.label} MODE
            </div>
            <div style={{color: '#888', fontSize: '0.75rem'}}>
              Näytetään: {currentPreset.value === 0 ? 'Kaikki kuvat' : `Viimeiset ${currentPreset.value / 60} tuntia`}
            </div>
         </div>
      </div>

    </div>
  );
};

export default AdminControlDeck;