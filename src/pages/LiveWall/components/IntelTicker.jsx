import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Zap, Trophy, Target, ShieldAlert, Activity } from 'lucide-react';
import './IntelTicker.css';

const IntelTicker = () => {
  const [messages, setMessages] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [tickerMode, setTickerMode] = useState('AUTO'); 
  const hideTimerRef = useRef(null);
  const HIDE_DELAY = 5 * 60 * 1000; 

  // --- LOGIIKKA: PÄÄTÄ NÄKYVYYS ---
  useEffect(() => {
    // 1. MASTER OFF
    if (tickerMode === 'OFF') {
      setIsVisible(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }
    // 2. MASTER ON
    if (tickerMode === 'ON') {
      setIsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }
    // 3. AUTO
    if (tickerMode === 'AUTO') {
       if (messages.length > 0 && !isVisible) {
          setIsVisible(true);
          resetHideTimer();
       } else if (messages.length === 0) {
         setIsVisible(false);
       }
    }
  }, [tickerMode, messages.length]); 

  const resetHideTimer = () => {
    if (tickerMode !== 'AUTO') return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsVisible(true);
    hideTimerRef.current = setTimeout(() => setIsVisible(false), HIDE_DELAY);
  };

  useEffect(() => {
    // 1. HAE ALKUTILANTEET
    const init = async () => {
      // Asetus uudesta taulusta
      const { data: settings } = await supabase
        .from('broadcast_settings') // UUSI TAULU
        .select('value')
        .eq('key', 'ticker_mode')
        .maybeSingle();
      if (settings) setTickerMode(settings.value);

      // Viestit
      const fiveMinsAgo = new Date(Date.now() - HIDE_DELAY).toISOString();
      const { data: msgs } = await supabase
        .from('live_posts')
        .select('*')
        .eq('type', 'announcement')
        .eq('is_visible', true)
        .gte('created_at', fiveMinsAgo)
        .order('created_at', { ascending: false })
        .limit(10);
      if (msgs) setMessages(msgs);
    };
    init();

    // 2. REAALIAIKAINEN KUUNTELU
    const channel = supabase.channel('ticker_broadcast_channel')
      // Kuuntele uutta asetustaulua
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'broadcast_settings', filter: "key=eq.ticker_mode" }, 
        (payload) => setTickerMode(payload.new.value)
      )
      // Kuuntele viestejä
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_posts', filter: "type=eq.announcement" }, 
        (payload) => {
          if (payload.new.is_visible) {
            setMessages(prev => [payload.new, ...prev].slice(0, 10));
            if (tickerMode === 'AUTO') resetHideTimer();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [tickerMode]);

  const getIcon = (msg) => {
    if (!msg) return <Activity size={16} />;
    const upper = msg.toUpperCase();
    if (upper.includes('XP')) return <Zap size={16} color="#ffd700" fill="#ffd700" />;
    if (upper.includes('TASO') || upper.includes('LEVEL')) return <Trophy size={16} color="#00ff41" />;
    if (upper.includes('SUORITTI') || upper.includes('MURSI')) return <Target size={16} color="#ff4444" />;
    return <ShieldAlert size={16} color="#fff" />;
  };

  const displayMessages = messages.length > 0 
    ? [...messages, ...messages, ...messages, ...messages] 
    : [];

  // 1. Luodaan sisältö nauhalle
  let content = [];

  if (messages.length > 0) {
    // Jos on oikeita viestejä, monistetaan ne 4x infinite scrollia varten
    content = [...messages, ...messages, ...messages, ...messages];
  } else if (tickerMode === 'ON') {
    // Jos pakotettu päälle mutta ei viestejä, luodaan dummy-viestejä ja monistetaan ne
    const dummy = [
      { id: 'd1', message: 'SYSTEM ONLINE' },
      { id: 'd2', message: 'SCANNING FOR INTEL' },
      { id: 'd3', message: 'BROADCAST ACTIVE' }
    ];
    content = [...dummy, ...dummy, ...dummy, ...dummy];
  }

  return (
    <div className={`intel-ticker-container ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="hazard-stripe top"></div>
      
      <div className="ticker-wrapper">
        <div className="ticker-track">
          {content.map((msg, i) => (
            <div key={`${msg.id}-${i}`} className="ticker-item">
              <span className="ticker-icon">{getIcon(msg.message)}</span>
              <span className="ticker-text">{msg.message}</span>
              <span className="ticker-separator">///</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hazard-stripe bottom"></div>
      
      <div className="ticker-label">
        <Activity size={12} /> INTEL FEED
      </div>
    </div>
  );
};

export default IntelTicker;