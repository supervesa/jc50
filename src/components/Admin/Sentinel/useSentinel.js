import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useSentinel = (guestId, context = 'GENERAL') => {
  const sessionId = useRef(Math.random().toString(36).substring(7));

  // 1. KERÄÄ TEKNINEN PROFIILI
  const getTechProfile = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Trident")) browser = "IE";
    else if (ua.includes("Edge")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    return {
      os: navigator.platform,
      browser: browser,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      mobile: /Mobi|Android/i.test(navigator.userAgent),
      referrer: document.referrer || 'Direct'
    };
  };

  // 2. LÄHETÄ LOKI SUPABASEEN
  const logEvent = async (params = {}) => {
    if (!guestId) return;

    try {
      // Akun tila (jos selain tukee)
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
          type: navigator.connection ? navigator.connection.effectiveType : 'unknown',
          downlink: navigator.connection ? navigator.connection.downlink : null
        },
        battery_alert: batteryAlert,
        signals: params.signals || []
      }]);

      if (error) console.warn("Sentinel: Silent Comms Error", error.message);
    } catch (err) {
      // Silent fail, jotta vieras ei huomaa mitään
    }
  };

  // 3. HEARTBEAT & INITIALIZATION
  useEffect(() => {
    if (!guestId) return;

    // Alkutervehdys
    logEvent({ point: `${context}_INIT`, engagement: 'Quick Glance' });

    // Syke 45 sekunnin välein (pidetään kuormitus matalana)
    const heartbeat = setInterval(() => {
      logEvent({ point: `${context}_PULSE`, engagement: 'Ghost Trace' });
    }, 45000);

    return () => clearInterval(heartbeat);
  }, [guestId, context]);

  // 4. JULKINEN FUNKTIO INTERAKTIOIDEN SEURANTAAN
  const trackInteraction = (point, level = 'Operative Briefing') => {
    logEvent({ point, engagement: level });
  };

  return { trackInteraction };
};