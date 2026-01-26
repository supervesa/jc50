import { useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useSentinel = (passedId, context = 'GENERAL') => {
  // 1. ÄLYKÄS ID-TUNNISTUS
  // Prioriteetti: 1. Komponentin antama ID, 2. URL-osoitteen ID, 3. Välimuisti
  const guestId = useMemo(() => {
    if (passedId && passedId.length > 30) return passedId;

    // Haetaan UUID URL-osoitteesta (esim. /lippu/f5b82...)
    const urlParts = window.location.pathname.split('/');
    const uuidFromUrl = urlParts.find(part => 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)
    );

    return uuidFromUrl || localStorage.getItem('jc_ticket_id');
  }, [passedId, window.location.pathname]);

  // 2. SESSIO-HALLINTA
  // Luodaan uusi session_id aina, kun vieras (guestId) vaihtuu
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

  // 3. AKTIVOINTI JA SYKE
  useEffect(() => {
    if (!guestId) return;

    // Kun guestId vaihtuu (esim. vaihdat URL-osoitetta lennosta):
    // - Luodaan uusi uniikki sessio-ID
    // - Lähetetään välitön INIT-signaali
    sessionId.current = Math.random().toString(36).substring(7);
    
    logEvent({ point: `${context}_INIT`, engagement: 'Quick Glance' });

    const heartbeat = setInterval(() => {
      logEvent({ point: `${context}_PULSE`, engagement: 'Ghost Trace' });
    }, 45000);

    return () => clearInterval(heartbeat);
  }, [guestId, context]); // Uudelleenkäynnistys aina kun guestId muuttuu

  return { 
    trackInteraction: (point, level = 'Operative Briefing') => logEvent({ point, engagement: level }) 
  };
};