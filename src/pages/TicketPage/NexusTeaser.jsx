import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Share2, Users, ChevronRight, Flame, Heart, User, Network, Quote } from 'lucide-react';
import { useGameConfig } from '../../hooks/useGameConfig'; 
import { supabase } from '../../lib/supabaseClient';

const NexusTeaser = ({ characterName, id: propId }) => {
  const params = useParams();
  const finalId = propId || params.id || params.ticketId;
  
  const [heroRel, setHeroRel] = useState(null);
  const [branchRels, setBranchRels] = useState([]);
  const [hasData, setHasData] = useState(false);
  
  const { phaseValue, isTester, loading } = useGameConfig(finalId);

  useEffect(() => {
    const fetchAndEnrichNexus = async () => {
      if (!finalId) return;

      try {
        // 1. HAE OMA HAHMO-ID
        const { data: myChar } = await supabase
          .from('characters')
          .select('id')
          .eq('assigned_guest_id', finalId)
          .single();

        if (!myChar) return;

        // 2. HAE RELAATIOT
        const { data: rawRels } = await supabase
          .from('character_relationships')
          .select('*')
          .or(`char1_id.eq.${myChar.id},char2_id.eq.${myChar.id}`);

        if (!rawRels || rawRels.length === 0) return;

        // 3. RIKASTUS
        const enrichedRels = await Promise.all(rawRels.map(async (rel) => {
          const targetId = rel.char1_id === myChar.id ? rel.char2_id : rel.char1_id;
          const { data: charData } = await supabase
            .from('characters')
            .select('name, avatar_url, role')
            .eq('id', targetId)
            .single();
            
          return {
            ...rel,
            targetName: charData?.name || 'Tuntematon',
            targetAvatar: charData?.avatar_url || null,
            targetRole: charData?.role
          };
        }));

        // 4. LAJITTELU
        const getPriority = (type) => {
          if (['enemy', 'rival'].includes(type)) return 3;
          if (['spouse', 'lover', 'partner'].includes(type)) return 2;
          return 1;
        };

        const sorted = enrichedRels.sort((a, b) => {
          const prioDiff = getPriority(b.relation_type) - getPriority(a.relation_type);
          if (prioDiff !== 0) return prioDiff;
          return (b.description ? 1 : 0) - (a.description ? 1 : 0);
        });

        // 5. JAKO
        setHeroRel(sorted[0]);
        setBranchRels(sorted.slice(1, 4)); 
        setHasData(true);

      } catch (err) {
        console.error("NexusTeaser fetch error:", err);
      }
    };

    if (!loading && (phaseValue >= 1 || isTester)) {
      fetchAndEnrichNexus();
    }
  }, [finalId, loading, phaseValue, isTester]);

  const isVisible = !loading && (phaseValue >= 1 || isTester);
  if (!isVisible || !finalId) return null;

  // --- HELPERIT ---
  const getGlowColor = (type) => {
    if (['enemy', 'rival'].includes(type)) return 'rgba(255, 51, 51, 0.6)'; // Punainen hehku
    if (['spouse', 'lover'].includes(type)) return 'rgba(255, 0, 229, 0.6)'; // Magenta hehku
    return 'rgba(0, 231, 255, 0.4)'; // Syaani hehku
  };

  const getTextColor = (type) => {
    if (['enemy', 'rival'].includes(type)) return '#ff4d4d';
    if (['spouse', 'lover'].includes(type)) return '#ff00e5';
    return 'var(--turquoise)';
  };

  const getTypeLabel = (type) => {
    const map = {
      'enemy': 'KILPAILIJA', 'rival': 'VIHOLLINEN',
      'spouse': 'PUOLISO', 'lover': 'RAKASTAJA',
      'friend': 'YSTÄVÄ', 'business': 'KONTAKTI',
      'relative': 'SUKULAINEN'
    };
    return map[type] || 'YHTEYS';
  };

  // --- GENEERINEN NÄKYMÄ (JOS EI DATAA) ---
  if (!hasData) {
    return (
      <div className="jc-card mt-3" style={{ padding: '2rem 1.5rem', position: 'relative' }}>
        <div className="jc-hud-corners"></div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(0,231,255,0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <Share2 className="neon-text-cyan" size={30} />
          </div>
          <h3 className="jc-h2" style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>NEXUS NEURAALIVERKKO</h3>
          <p className="small">Visualisoi hahmosi sosiaaliset kytkökset.</p>
        </div>
        <Link to={`/nexus/${finalId}`} className="jc-cta primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <Users size={18} /> AVAA NEXUS <ChevronRight size={18} />
        </Link>
      </div>
    );
  }

  // --- DOSSIER NÄKYMÄ (HERO + BRANCHES) ---
  const glowColor = getGlowColor(heroRel.relation_type);
  const themeColor = getTextColor(heroRel.relation_type);

  return (
    <div className="jc-card mt-3" style={{ padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div className="jc-hud-corners"></div>
      
      {/* 1. HEADER (Intro) */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', opacity: 0.8 }}>
        <h3 style={{ 
          fontSize: '0.75rem', letterSpacing: '3px', textTransform: 'uppercase', 
          margin: 0, color: 'rgba(255,255,255,0.6)' 
        }}>
          NEXUS NEURAALIVERKKO
        </h3>
      </div>

      {/* 2. HERO SECTION (Massiivinen) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
        
        {/* Avatar */}
        <div style={{ 
          width: '110px', height: '110px', borderRadius: '50%', 
          border: `3px solid ${themeColor}`,
          boxShadow: `0 0 25px ${glowColor}`,
          overflow: 'hidden', marginBottom: '1rem',
          background: '#000'
        }}>
          {heroRel.targetAvatar ? (
            <img src={heroRel.targetAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <User size={40} color={themeColor} />
            </div>
          )}
        </div>

        {/* Badge & Name */}
        <div style={{ 
          color: themeColor, fontSize: '0.8rem', fontWeight: '900', 
          textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px',
          textShadow: `0 0 10px ${glowColor}`
        }}>
          {getTypeLabel(heroRel.relation_type)}
        </div>
        
        <h2 className="jc-h2" style={{ fontSize: '1.6rem', margin: '0 0 1rem 0', textAlign: 'center', lineHeight: '1.2' }}>
          {heroRel.targetName}
        </h2>

        {/* Description (Airy quote) */}
        {heroRel.description && (
          <div style={{ position: 'relative', padding: '0 1rem', maxWidth: '320px' }}>
            <Quote 
              size={40} 
              style={{ position: 'absolute', top: '-10px', left: '-10px', opacity: 0.2, color: themeColor, transform: 'scaleX(-1)' }} 
            />
            <p style={{ 
              fontSize: '1.1rem', fontStyle: 'italic', textAlign: 'center', 
              color: 'rgba(255,255,255,0.9)', lineHeight: '1.5', margin: 0,
              fontWeight: '300'
            }}>
              "{heroRel.description}"
            </p>
          </div>
        )}
      </div>

      {/* Erotinviiva */}
      {branchRels.length > 0 && (
        <div style={{ 
          height: '1px', width: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          marginBottom: '1.5rem'
        }}></div>
      )}

      {/* 3. BRANCHES (Facepile - "Muut havainnot") */}
      {branchRels.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', 
            marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' 
          }}>
            Muut havainnot verkostossa
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
            {branchRels.map((rel, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {/* Mini Avatar */}
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', 
                  border: '1px solid rgba(255,255,255,0.3)', overflow: 'hidden',
                  background: '#111'
                }}>
                  {rel.targetAvatar ? (
                     <img src={rel.targetAvatar} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="" />
                  ) : (
                     <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                       <User size={16} color="#666" />
                     </div>
                  )}
                </div>
                {/* Mini Name */}
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>
                  {rel.targetName.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ACTION FOOTER */}
      <div>
        <Link 
          to={`/nexus/${finalId}`} 
          className="jc-cta primary" 
          style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1rem' }}
        >
          <Network size={20} /> AVAA KOKO VERKOSTO <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  );
};

export default NexusTeaser;