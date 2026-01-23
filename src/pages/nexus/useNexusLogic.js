import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export const useNexusLogic = () => {
  const { ticketId } = useParams();
  const [characters, setCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusId, setFocusId] = useState(null);

  useEffect(() => {
    const fetchNexusData = async () => {
      try {
        setLoading(true);

        const { data: feedbackData, error: fbError } = await supabase
          .from('character_feedback')
          .select('guest_id')
          .eq('status', 'accepted');

        if (fbError) throw fbError;
        const acceptedIds = feedbackData.map(f => f.guest_id);

        if (acceptedIds.length === 0) {
          setCharacters([]);
          setLoading(false);
          return;
        }

        const [chars, rels, splitData] = await Promise.all([
          supabase.from('characters').select('*').in('assigned_guest_id', acceptedIds),
          supabase.from('character_relationships').select('*'),
          supabase.from('guest_splits').select('*')
        ]);

        if (chars.error) throw chars.error;
        if (rels.error) throw rels.error;
        if (splitData.error) throw splitData.error;

        setCharacters(chars.data || []);
        setRelationships(rels.data || []);
        setSplits(splitData.data || []);

        if (ticketId) {
          // Jos samalla lipulla on kaksi hahmoa, valitaan ensimmäinen fokukseen oletuksena
          const myChars = chars.data.filter(c => c.assigned_guest_id === ticketId);
          if (myChars.length > 0) setFocusId(myChars[0].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNexusData();
  }, [ticketId]);

  const nexusNetwork = useMemo(() => {
    if (!characters.length || !focusId) return { focalCharacter: null, neighbors: [], others: [] };

    const focalCharacter = characters.find(c => c.id === focusId);
    if (!focalCharacter) return { focalCharacter: null, neighbors: [], others: [] };
    
    const myGuestId = focalCharacter.assigned_guest_id;
    
    // 1. Haetaan käsin syötetyt relaatiot
    let neighbors = relationships
      .filter(rel => rel.char1_id === focusId || rel.char2_id === focusId)
      .map(rel => {
        const isFirst = rel.char1_id === focusId;
        const targetId = isFirst ? rel.char2_id : rel.char1_id;
        const targetChar = characters.find(c => c.id === targetId);
        if (!targetChar) return null;

        return {
          ...targetChar,
          relationType: rel.relation_type,
          context: isFirst ? rel.context_1_to_2 : rel.context_2_to_1
        };
      }).filter(Boolean);

    // 2. AUTOMAATTINEN LINKITYS
    
    // A) SAMAN LIPUN ALLA OLEVAT HAHMOT (Ei splitattu)
    const sharedTicketPartner = characters.find(c => 
      c.assigned_guest_id === myGuestId && c.id !== focalCharacter.id
    );

    if (sharedTicketPartner && !neighbors.find(n => n.id === sharedTicketPartner.id)) {
      neighbors.push({
        ...sharedTicketPartner,
        relationType: 'avec',
        context: `Jaatte saman pääkutsun. ${sharedTicketPartner.character_name || sharedTicketPartner.name} on kumppanisi, jonka kanssa saavuitte juhliin erottumattomana parina.`
      });
    }

    // B) SPLIT-LINKITYKSET (Eri liput, sama alkuperä)
    const splitRow = splits.find(s => s.parent_guest_id === myGuestId || s.child_guest_id === myGuestId);

    if (splitRow) {
      const spouseGuestId = splitRow.parent_guest_id === myGuestId 
        ? splitRow.child_guest_id 
        : splitRow.parent_guest_id;

      const spouseChar = characters.find(c => c.assigned_guest_id === spouseGuestId);

      if (spouseChar && !neighbors.find(n => n.id === spouseChar.id)) {
        neighbors.push({
          ...spouseChar,
          relationType: 'avec',
          context: `Vaikka teillä on omat lippunne, saavuitte juhliin saman kutsun kautta. ${spouseChar.character_name || spouseChar.name} on kumppanisi tässä illassa.`
        });
      }
    }

    const neighborIds = new Set(neighbors.map(n => n.id));
    const others = characters.filter(c => c.id !== focusId && !neighborIds.has(c.id));

    return { focalCharacter, neighbors, others };
  }, [characters, relationships, splits, focusId]);

  return { ...nexusNetwork, loading, error, setFocusId };
};