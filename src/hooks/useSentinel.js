import { useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useSentinel = (passedId, context = 'GENERAL') => {
  // 1. ÄLYKÄS ID-TUNNISTUS
  const guestId = useMemo(() => {
    if (passedId && passedId.length > 30) return passedId;

    const urlParts = window.location.pathname.split('/');
    const uuidFromUrl = urlParts.find(part => 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)
    );

    return uuidFromUrl || localStorage.getItem('jc_ticket_id');
  }, [passedId, window.location.pathname]);

  // 2. SESSIO-HALLINTA
  const sessionId = useRef(Math.random().toString(36).substring(7));

  const getTechProfile = () => {
    return {
      os: navigator.platform,
      browser: navigator.userAgent.includes("Chrome") ? "Chrome" : 
               navigator.userAgent.includes("Safari") ? "Safari" : "Other",
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      mobile: /Mobi|Android/i.test(navigator.userAgent),
      referrer: document.referrer || 'Direct'
    };
  };

  const logEvent = async (params = {}) => {
    if (!guestId) return;

    try {
      let batteryAlert = false;
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        batteryAlert = battery.level < 0.15 && !battery.charging;
      }

      const { error } = await supabase.from('sentinel_access_logs').insert([{
        guest_id: guestId,
        session_id: sessionId.current,
        engagement: params.engagement || 'Ghost Trace',
        interaction_point: params.point || 'Heartbeat',
        tech_profile: getTechProfile(),
        connection_info: {
          type: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        },
        battery_alert: batteryAlert,
        signals: params.signals || []
      }]);

      if (error) console.warn("Sentinel: Blocked", error.message);
    } catch (err) {
      // Silent fail
    }
  };

  // 3. AKTIVOINTI JA SYKE (Visibility API lisätty)
  useEffect(() => {
    if (!guestId) return;

    sessionId.current = Math.random().toString(36).substring(7);
    
    // INIT lähetetään aina kun sivu ladataan
    logEvent({ point: `${context}_INIT`, engagement: 'Quick Glance' });

    const heartbeat = setInterval(() => {
      // LISÄYS: Lähetetään signaali vain, jos välilehti on aktiivinen ja näkyvissä
      if (document.visibilityState === 'visible') {
        logEvent({ point: `${context}_PULSE`, engagement: 'Ghost Trace' });
      }
    }, 45000);

    return () => clearInterval(heartbeat);
  }, [guestId, context]);

  return { 
    trackInteraction: (point, level = 'Operative Briefing') => logEvent({ point, engagement: level }) 
  };
};