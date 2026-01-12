import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export const useGameConfig = (guestId = null) => {
  // 1. Globaali tila (Oletus: TICKET_ONLY)
  const [globalPhase, setGlobalPhase] = useState('TICKET_ONLY');
  
  // 2. Yksilöllinen tila (Sidecar-data)
  const [accessData, setAccessData] = useState({
    role: 'guest',
    is_banned: false,
    override_phase: null
  });

  const [loading, setLoading] = useState(true);

  // A. Hae ja kuuntele globaalia konfiguraatiota
  useEffect(() => {
    const fetchGlobal = async () => {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'game_state')
        .single();
      
      if (data?.value?.phase) {
        setGlobalPhase(data.value.phase);
      }
    };

    fetchGlobal();

    // Kuunnellaan muutoksia reaaliajassa
    const globalSub = supabase.channel('config_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_config' }, (payload) => {
        if (payload.new.key === 'game_state') {
          setGlobalPhase(payload.new.value.phase);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(globalSub);
  }, []);

  // B. Hae ja kuuntele yksilöllisiä oikeuksia
  useEffect(() => {
    if (!guestId) {
        setLoading(false);
        return;
    }

    const fetchAccess = async () => {
      // maybeSingle ei heitä virhettä jos riviä ei ole (tavallinen vieras)
      const { data, error } = await supabase
        .from('guest_access_control')
        .select('*')
        .eq('guest_id', guestId)
        .maybeSingle(); 
      
      if (data) setAccessData(data);
      if (error && error.code !== 'PGRST116') console.error("Access fetch error:", error);
      
      setLoading(false);
    };

    fetchAccess();

    const accessSub = supabase.channel(`access_realtime_${guestId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'guest_access_control', filter: `guest_id=eq.${guestId}` }, 
        (payload) => {
           if (payload.eventType === 'DELETE') {
             // Jos oikeudet poistetaan, palaa normivieraaksi
             setAccessData({ role: 'guest', is_banned: false, override_phase: null });
           } else {
             setAccessData(payload.new);
           }
      })
      .subscribe();

    return () => supabase.removeChannel(accessSub);
  }, [guestId]);

  // C. Laske lopullinen tila
  const isTester = accessData.role === 'tester' || accessData.role === 'admin';
  const isBanned = accessData.is_banned;
  
  // Vaiheet numeroina vertailua varten
  const PHASE_VALUES = { 
    'EARLY_ACCESS': 0, // Lippu & Kuvat auki (TICKET_ONLY tietokannassa)
    'TICKET_ONLY': 0,  // (Sama kuin yllä, varmuuden vuoksi)
    'HYPE_WEEK': 1,    // Chat auki
    'SHOWTIME': 2,     // Tehtävät auki
    'ENDING': 3 
  };
  
  let currentPhase = accessData.override_phase || globalPhase;
  
  // LOGIIKKA: Jos on testaaja, näe peli aina vähintään SHOWTIME-tasolla (ellei toisin määrätä)
  if (isTester && !accessData.override_phase) {
      currentPhase = 'SHOWTIME';
  }

  const phaseValue = PHASE_VALUES[currentPhase] || 0;

  // Helpot booleanit UI:lle
  const chatOpen = phaseValue >= 1;
  const missionsOpen = phaseValue >= 2;

  return {
    phase: currentPhase,
    phaseValue,
    chatOpen,
    missionsOpen,
    isBanned,
    isTester,
    loading
  };
};