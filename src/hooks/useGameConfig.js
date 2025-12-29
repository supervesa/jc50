import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useGameConfig = (guestId = null) => {
  // 1. Globaali tila
  const [globalPhase, setGlobalPhase] = useState('TICKET_ONLY');
  
  // 2. Yksilöllinen tila
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
      // HUOM: maybeSingle ei heitä virhettä jos riviä ei ole
      const { data, error } = await supabase
        .from('guest_access_control')
        .select('*')
        .eq('guest_id', guestId)
        .maybeSingle(); 
      
      if (data) setAccessData(data);
      // Jos error on jotain muuta kuin "ei rivejä", logataan se
      if (error && error.code !== 'PGRST116') console.error("Access fetch error:", error);
      
      setLoading(false);
    };

    fetchAccess();

    const accessSub = supabase.channel(`access_realtime_${guestId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'guest_access_control', filter: `guest_id=eq.${guestId}` }, 
        (payload) => {
           if (payload.eventType === 'DELETE') {
             setAccessData({ role: 'guest', is_banned: false, override_phase: null });
           } else {
             setAccessData(payload.new);
           }
      })
      .subscribe();

    return () => supabase.removeChannel(accessSub);
  }, [guestId]);

  // C. Laske lopullinen tila (KORJATTU LOGIIKKA)
  const isTester = accessData.role === 'tester' || accessData.role === 'admin';
  const isBanned = accessData.is_banned;
  
  // Vaiheet numeroina vertailua varten
  const PHASE_VALUES = { 'TICKET_ONLY': 0, 'LOBBY': 1, 'LIVE': 2, 'ENDING': 3 };
  
  let currentPhase = accessData.override_phase || globalPhase;
  
  // KORJAUS: Jos on testaaja, nostetaan taso vähintään LIVE:ksi (2), 
  // ellei override_phase sano muuta.
  // Tämä toimii nyt vaikka globaali tila olisi 0 (Ticket Only).
  if (isTester && !accessData.override_phase) {
      if (PHASE_VALUES[globalPhase] < PHASE_VALUES['LIVE']) {
          currentPhase = 'LIVE';
      }
  }

  const phaseValue = PHASE_VALUES[currentPhase] || 0;

  return {
    phase: currentPhase,
    phaseValue,
    isBanned,
    isTester,
    loading
  };
};