import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGameConfig } from '../../hooks/useGameConfig';
import { useGatekeeper } from './useGatekeeper';

export const useNexusLogic = (ticketId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allCharacters, setAllCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [splits, setSplits] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [currentFocusId, setCurrentFocusId] = useState(null);
  const [originalCharId, setOriginalCharId] = useState(null);

  const gameConfig = useGameConfig(ticketId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!ticketId) throw new Error("ID puuttuu.");

        // Haetaan data
        const [charsRes, relsRes, splitsRes, feedbackRes] = await Promise.all([
          supabase.from('characters').select('*'),
          supabase.from('character_relationships').select('*'),
          supabase.from('guest_splits').select('*').eq('is_grouped', true),
          supabase.from('character_feedback').select('*')
        ]);

        if (charsRes.error) throw charsRes.error;

        setAllCharacters(charsRes.data || []);
        setRelationships(relsRes.data || []);
        setSplits(splitsRes.data || []);
        setFeedback(feedbackRes.data || []);

        const startChar = charsRes.data?.find(c => 
          c.assigned_guest_id === ticketId || c.id === ticketId
        );

        if (!startChar) throw new Error("Hahmoa ei löytynyt.");

        setOriginalCharId(startChar.id);
        setCurrentFocusId(startChar.id);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticketId]);

  const { filteredCharacters } = useGatekeeper(allCharacters, feedback, gameConfig, originalCharId);

  const viewerChar = allCharacters.find(c => c.id === originalCharId);
  const viewerFeedback = feedback ? [...feedback]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .find(f => f.guest_id === viewerChar?.assigned_guest_id) : null;
   
  const isViewerPublic = !!(viewerChar?.avatar_url && viewerFeedback?.status === 'accepted');

  const currentFocal = filteredCharacters.find(c => c.id === currentFocusId);
  
  // LOGIIKKA: Etsitään "Logistinen pari" (Harmaata laatikkoa varten)
  const findOfficialPartner = (charId, chars, splitList) => {
    const char = chars.find(c => c.id === charId);
    if (!char || !char.assigned_guest_id) return null;
    
    // Etsitään split-taulusta
    const split = splitList.find(s => 
      s.parent_guest_id === char.assigned_guest_id || s.child_guest_id === char.assigned_guest_id
    );
    
    if (!split) return null; // Ei logistista paria

    const pId = split.parent_guest_id === char.assigned_guest_id ? split.child_guest_id : split.parent_guest_id;
    return chars.find(c => c.assigned_guest_id === pId);
  };

  // APUFUNKTIO: Selvittää suhteen todellisen luonteen ja tekstin
  const getRelationshipDetails = (targetId) => {
    if (!currentFocusId || !targetId) return { type: null, context: null };

    // 1. Etsitään tietokannasta oikea suhderivi
    const relRow = relationships.find(r => 
      (r.char1_id === currentFocusId && r.char2_id === targetId) || 
      (r.char2_id === currentFocusId && r.char1_id === targetId)
    );

    if (relRow) {
      // Jos suhde löytyy, määritellään suunta kontekstitekstille
      let contextText = null;
      if (relRow.char1_id === currentFocusId) contextText = relRow.context_1_to_2;
      else contextText = relRow.context_2_to_1;

      return { type: relRow.relation_type, context: contextText };
    }

    // 2. Jos ei löydy suhdetta, tarkistetaan onko "Avec" (split)
    const spouse = findOfficialPartner(currentFocusId, filteredCharacters, splits);
    if (spouse && spouse.id === targetId) {
      return { type: 'avec', context: null }; // Geneerinen avec
    }

    return { type: null, context: null };
  };

  const spouse = findOfficialPartner(currentFocusId, filteredCharacters, splits);
   
  // RAKENNETAAN NAAPURIT (Avec + muut suhteet)
  // Tässä yhdistetään logistinen tieto ja semanttinen tieto
  const neighbors = [];
   
  // 1. Käsittelijä Avecille (jos on)
  if (spouse) {
    const details = getRelationshipDetails(spouse.id);
    neighbors.push({ 
      ...spouse, 
      relationType: details.type || 'avec', // Käytä oikeaa tyyppiä (esim. sibling) jos löytyi
      contextText: details.context,
      isGrouped: true 
    });
  }

  // 2. Muut suhteet (jotka eivät ole spousen paikalla)
  const otherRels = filteredCharacters.filter(c => 
    c.id !== currentFocusId && (!spouse || c.id !== spouse.id) &&
    relationships.some(r => (r.char1_id === currentFocusId && r.char2_id === c.id) || (r.char2_id === currentFocusId && r.char1_id === c.id))
  ).map(c => {
    const details = getRelationshipDetails(c.id);
    return { 
      ...c, 
      relationType: details.type,
      contextText: details.context,
      isGrouped: false
    };
  });

  neighbors.push(...otherRels);

  const usedIds = [currentFocusId, ...(spouse ? [spouse.id] : []), ...neighbors.map(n => n.id)];
  const remaining = filteredCharacters.filter(c => !usedIds.includes(c.id));

  // Ryhmittelylogiikka "Muille juhlijoille"
  const clusterOthers = (chars, splitList) => {
    const done = new Set();
    const result = [];
    chars.forEach(c => {
      if (done.has(c.id)) return;
      const p = findOfficialPartner(c.id, filteredCharacters, splitList);
      
      // Tässä säilytetään visuaalinen ryhmittely (Harmaa laatikko), 
      // mutta NexusCard hoitaa tiedon näyttämisen.
      if (p && !done.has(p.id)) {
        result.push({ type: 'couple', members: [c, p] });
        done.add(c.id); done.add(p.id);
      } else {
        result.push({ type: 'single', members: [c] });
        done.add(c.id);
      }
    });
    return result;
  };

  return { 
    focalChar: currentFocal, 
    isPublic: isViewerPublic, 
    isTester: gameConfig.isTester, 
    neighbors, 
    groupedOthers: clusterOthers(remaining, splits), 
    loading: loading || gameConfig.loading, 
    error, currentFocusId, setCurrentFocusId, originalCharId 
  };
};