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

        const [charsRes, relsRes, splitsRes, feedbackRes] = await Promise.all([
          supabase.from('characters').select('*'),
          supabase.from('character_relationships').select('*'),
          supabase.from('guest_splits').select('*'),
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

  const focalChar = allCharacters.find(c => c.id === currentFocusId);
  const focalFeedback = feedback ? [...feedback]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .find(f => f.guest_id === focalChar?.assigned_guest_id) : null;
  
  const isPublic = !!(focalChar?.avatar_url && focalFeedback?.status === 'accepted');

  const findOfficialPartner = (charId, chars, splitList) => {
    const char = chars.find(c => c.id === charId);
    if (!char || !char.assigned_guest_id) return null;
    const split = splitList.find(s => 
      s.parent_guest_id === char.assigned_guest_id || 
      s.child_guest_id === char.assigned_guest_id
    );
    if (!split) return null;
    const pId = split.parent_guest_id === char.assigned_guest_id ? split.child_guest_id : split.parent_guest_id;
    return chars.find(c => c.assigned_guest_id === pId);
  };

  const spouse = findOfficialPartner(currentFocusId, filteredCharacters, splits);
  const neighbors = [];
  if (spouse) neighbors.push({ ...spouse, relationType: 'spouse' });
  
  const otherRels = filteredCharacters.filter(c => 
    c.id !== currentFocusId && (!spouse || c.id !== spouse.id) &&
    relationships.some(r => 
      (r.char1_id === currentFocusId && r.char2_id === c.id) || 
      (r.char2_id === currentFocusId && r.char1_id === c.id)
    )
  ).map(c => {
    const r = relationships.find(rel => 
      (rel.char1_id === currentFocusId && rel.char2_id === c.id) || 
      (rel.char2_id === currentFocusId && rel.char1_id === c.id)
    );
    return { ...c, relationType: r?.relation_type };
  });

  neighbors.push(...otherRels);

  const clusterOthers = (chars, splitList) => {
    const done = new Set();
    const result = [];
    const pool = [...chars].sort(() => Math.random() - 0.5);
    pool.forEach(c => {
      if (done.has(c.id)) return;
      const p = findOfficialPartner(c.id, filteredCharacters, splitList);
      if (p && pool.find(x => x.id === p.id) && !done.has(p.id)) {
        result.push({ type: 'couple', members: [c, p] });
        done.add(c.id); done.add(p.id);
      } else {
        result.push({ type: 'single', members: [c] });
        done.add(c.id);
      }
    });
    return result;
  };

  const usedIds = [currentFocusId, ...neighbors.map(n => n.id)];
  const remaining = filteredCharacters.filter(c => !usedIds.includes(c.id));
  const groupedOthers = clusterOthers(remaining, splits);

  return { 
    focalChar, isPublic, isTester: gameConfig.isTester, neighbors, 
    groupedOthers, loading: loading || gameConfig.loading, error, 
    currentFocusId, setCurrentFocusId, originalCharId 
  };
};