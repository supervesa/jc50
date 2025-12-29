import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Zap, Trophy, Target, ShieldAlert, Activity } from 'lucide-react';
import './IntelTicker.css';

const IntelTicker = () => {
  const [messages, setMessages] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef(null);

  const HIDE_DELAY = 5 * 60 * 1000; 

  const resetHideTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsVisible(true);
    
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, HIDE_DELAY);
  };

  useEffect(() => {
    const fetchRecent = async () => {
      const fiveMinsAgo = new Date(Date.now() - HIDE_DELAY).toISOString();
      const { data } = await supabase
        .from('live_posts')
        .select('*')
        .eq('type', 'announcement')
        .eq('is_visible', true)
        .gte('created_at', fiveMinsAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setMessages(data);
        resetHideTimer();
      }
    };

    fetchRecent();

    const channel = supabase.channel('ticker-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_posts', filter: "type=eq.announcement" },
        (payload) => {
          if (payload.new.is_visible) {
            setMessages(prev => [payload.new, ...prev].slice(0, 10)); 
            resetHideTimer();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const getIcon = (msg) => {
    if (msg.includes('XP')) return <Zap size={16} color="#ffd700" fill="#ffd700" />;
    if (msg.includes('TASON') || msg.includes('Milestone')) return <Trophy size={16} color="#00ff41" />;
    if (msg.includes('SUORITTI')) return <Target size={16} color="#ff4444" />;
    return <ShieldAlert size={16} color="#fff" />;
  };

  // MONISTETAAN VIESTIT 4 KERTAA (Varmistaa, ettei lopu kesken leveällä ruudulla)
  // Jos viestejä on vähän, tämä täyttää ruudun. Jos paljon, animaatio on vain pidempi.
  const displayMessages = messages.length > 0 
    ? [...messages, ...messages, ...messages, ...messages] 
    : [];

  return (
    <div className={`intel-ticker-container ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="hazard-stripe top"></div>
      
      <div className="ticker-wrapper">
        <div className="ticker-track">
          {displayMessages.map((msg, i) => (
            <div key={`${msg.id}-${i}`} className="ticker-item">
              <span className="ticker-icon">{getIcon(msg.message)}</span>
              <span className="ticker-text">{msg.message}</span>
              <span className="ticker-separator">///</span>
            </div>
          ))}
          {messages.length === 0 && <div className="ticker-item">SYSTEM STANDBY...</div>}
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