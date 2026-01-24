import { useMemo } from 'react';

/**
 * Gatekeeper-suodatin Nexuksen hahmoille.
 * Palauttaa kaikki varatut (assigned) hahmot, mutta merkitsee ne lukituiksi tarvittaessa.
 */
export const useGatekeeper = (allCharacters, feedbackData, gameConfig, originalCharId) => {
  
  const filteredCharacters = useMemo(() => {
    if (!allCharacters || allCharacters.length === 0) return [];

    const { isTester, phase } = gameConfig;
    const isShowtime = phase === 'SHOWTIME';

    // Lajitellaan palaute aikajärjestykseen (uusin ensin), jotta poimitaan tuorein tila
    const sortedFeedback = feedbackData ? [...feedbackData].sort((a, b) => 
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
    ) : [];

    return allCharacters
      .filter(char => {
        // NÄYTETÄÄN VAIN VARATUT (Assigned) HAHMOT
        return !!char.assigned_guest_id || char.is_assigned === true;
      })
      .map(char => {
        // Tarkistetaan onko hahmo "julkinen" (Avatar + Accepted)
        const hasAvatar = !!(char.avatar_url && char.avatar_url.trim() !== '');
        const latestFeedback = sortedFeedback.find(f => f.guest_id === char.assigned_guest_id);
        const isAccepted = latestFeedback?.status === 'accepted';

        // LUKITUS-LOGIIKKA
        // Hahmo on auki katselijalle jos:
        // 1. Hahmo on julkinen (Avatar + Accepted)
        // 2. Katselija on testaaja tai peli on Showtime-vaiheessa
        // 3. Kyseessä on katselijan oma hahmo
        const isOpen = (hasAvatar && isAccepted) || isTester || isShowtime || char.id === originalCharId;

        return {
          ...char,
          isLocked: !isOpen
        };
      });
  }, [allCharacters, feedbackData, gameConfig, originalCharId]);

  return { filteredCharacters };
};