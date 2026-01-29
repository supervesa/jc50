import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useGameConfig = (guestId = null) => {
  const [globalPhase, setGlobalPhase] = useState('TICKET_ONLY');
  const [accessData, setAccessData] = useState({
    role: 'guest',
    is_banned: false,
    override_phase: null
  });
  const [loading, setLoading] = useState(true);

  // A. Hae globaali tila
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

  // B. Hae yksilölliset oikeudet
  useEffect(() => {
    if (!guestId) {
        setLoading(false);
        return;
    }
    const fetchAccess = async () => {
      const { data } = await supabase
        .from('guest_access_control')
        .select('*')
        .eq('guest_id', guestId)
        .maybeSingle(); 
      
      if (data) setAccessData(data);
      setLoading(false);
    };
    fetchAccess();
  }, [guestId]);

  // C. LOGIIKKA - Tässä oli virhe
  const isTester = accessData.role === 'tester' || accessData.role === 'admin';
const isBanned = accessData?.is_banned === true || accessData?.is_banned === 'true';
  
  const PHASE_VALUES = { 
    'TICKET_ONLY': 0, 
    'EARLY_ACCESS': 0, 
    'HYPE_WEEK': 1, 
    'SHOWTIME': 2, 
    'ENDING': 3 
  };
  
  // 1. Määritellään muuttuja ENNEN kuin sitä käytetään
  let currentPhase = accessData.override_phase || globalPhase;
  
  // 2. Tehdään testaaja-nosto
  if (isTester && !accessData.override_phase) {
      // Jos maailman tila on pienempi kuin SHOWTIME, nostetaan se testaajalle
      if (PHASE_VALUES[currentPhase] < PHASE_VALUES['SHOWTIME']) {
          currentPhase = 'SHOWTIME';
      }
  }

  const phaseValue = PHASE_VALUES[currentPhase] || 0;

  return {
    phase: currentPhase,
    phaseValue,
    chatOpen: phaseValue >= 1,
    missionsOpen: phaseValue >= 2,
    isBanned,
    isTester,
    loading
  };
};