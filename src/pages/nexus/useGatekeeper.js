import { useMemo } from 'react';

/**
 * Gatekeeper-suodatin Nexuksen hahmoille.
 * Hallitsee näkyvyyttä pelin vaiheen, käyttäjän roolin ja hahmon statuksen mukaan.
 */
export const useGatekeeper = (allCharacters, feedbackData, gameConfig, originalCharId) => {
  
  const filteredCharacters = useMemo(() => {
    if (!allCharacters || allCharacters.length === 0) return [];

    const { isTester, phase } = gameConfig;
    const isShowtime = phase === 'SHOWTIME';

    // Lajitellaan palaute aikajärjestykseen (uusin ensin)
    const sortedFeedback = feedbackData ? [...feedbackData].sort((a, b) => 
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
    ) : [];

    return allCharacters.filter(char => {
      // 1. VARAUKSEN TARKISTUS
      const isOccupied = !!char.assigned_guest_id || char.is_assigned === true;
      if (!isOccupied) return false;

      // 2. MASTER ACCESS & OMA HAHMO
      if (isTester || isShowtime || char.id === originalCharId) return true;

      // 3. STANDARDI-SUODATUS
      const hasAvatar = char.avatar_url && char.avatar_url.trim() !== '';
      
      // Etsitään TUOREIN palaute tälle vieraalle
      const latestFeedback = sortedFeedback.find(f => f.guest_id === char.assigned_guest_id);
      const isAccepted = latestFeedback?.status === 'accepted';

      return hasAvatar && isAccepted;
    });
  }, [allCharacters, feedbackData, gameConfig, originalCharId]);

  return { filteredCharacters };
};