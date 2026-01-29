import React from 'react';
import { User, BookOpen, Lock, ArrowRight, Eye } from 'lucide-react'; // Lisäsin Eye-ikonin

const NexusCard = ({ 
  character, 
  onClick, 
  onDossierClick, 
  relationType, 
  contextText, 
  isActive, 
  isDimmed,
  viewerName // UUSI PROP: Kuka katsoo? (esim. "Celine")
}) => {
  const name = character.character_name || character.name || "Tuntematon";
  const isLocked = character.isLocked;

  const getContextFallback = (type) => {
    switch(type) {
      case 'spouse': return "Elämänkumppani.";
      case 'lover': return "Tunneside on vahva.";
      case 'friend': return "Luotettu liittolainen.";
      case 'enemy': return "Varoitus: Jännitteitä havaittu.";
      case 'relative': return "Verisukulainen.";
      case 'business': return "Strateginen yhteys.";
      case 'avec': return "Saapuivat yhdessä.";
      default: return "Yhteys tunnistettu.";
    }
  };

  const displayContext = contextText || getContextFallback(relationType);

  const getBadgeLabel = (type) => {
    const labels = {
      'spouse': 'PUOLISO',
      'avec': 'SEURALAINEN',
      'friend': 'YSTÄVÄ',
      'neighbor': 'NAAPURI',
      'relative': 'SUKULAINEN',
      'business': 'LIIKETUTTAVA',
      'enemy':'KILPAILIJA',
      'lover': 'RAKASTAJA'
    };
    return labels[type] || null;
  };

  const badgeLabel = getBadgeLabel(relationType);

  // --- TYYLIT ---
  
  const safeAvatarStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    aspectRatio: '1/1',
    border: isActive ? '2px solid #fff' : '2px solid rgba(255,255,255,0.1)',
    marginBottom: '12px',
    display: 'block',
    filter: isLocked ? 'grayscale(1) brightness(0.5)' : 'none',
    opacity: isLocked ? 0.6 : 1,
    transition: 'all 0.3s ease',
    transform: isActive ? 'scale(1.05)' : 'scale(1)'
  };

  const isSpecialRelation = ['spouse', 'lover'].includes(relationType);
  const badgeColor = isSpecialRelation ? '#ff00e5' : 'inherit';
  const badgeBorder = isSpecialRelation 
    ? '1px solid rgba(255, 0, 229, 0.4)' 
    : '1px solid rgba(255, 255, 255, 0.1)';

  const safeBadgeStyle = {
    position: 'absolute',
    top: '6px',
    right: '6px',
    fontSize: '0.48rem',
    fontWeight: '900',
    padding: '2px 4px',
    borderRadius: '3px',
    letterSpacing: '0.05em',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 5,
    textTransform: 'uppercase',
    pointerEvents: 'none',
    color: badgeColor,
    border: badgeBorder
  };

  // KUPLAN TYYLI
  const whisperStyle = {
    position: 'absolute',
    bottom: '-20px', // Hieman alemmas jotta ei peitä kasvoja
    left: '50%',
    transform: 'translate(-50%, 0)', 
    width: '200px', 
    background: 'rgba(5, 10, 20, 0.96)', // Hyvin tumma tausta
    border: '1px solid var(--turquoise)',
    borderRadius: '12px', // Pyöreämpi
    padding: '14px',
    zIndex: 100,
    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
    textAlign: 'left',
    animation: 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  };

  return (
    <div 
      className={`nexus-card-stack ${isLocked ? 'is-locked' : ''} ${isDimmed ? 'dimmed' : ''}`} 
      onClick={(e) => {
        // TÄRKEÄ: Estä klikkausta valumasta taustalle (Gridiin)
        e.stopPropagation(); 
        onClick(character.id);
      }}
      style={{
        opacity: isDimmed ? 0.4 : 1,
        transition: 'opacity 0.3s'
      }}
    >
      {badgeLabel && <div style={safeBadgeStyle}>{badgeLabel}</div>}

      {isLocked && (
        <div className="lock-corner-icon">
          <Lock size={12} />
        </div>
      )}

      <div className="card-avatar-top">
        {character.avatar_url ? (
          <img src={character.avatar_url} alt={name} style={safeAvatarStyle} />
        ) : (
          <div className="avatar-stack-placeholder"><User size={20} /></div>
        )}
      </div>

      <div className="card-info-stack">
        <span className="card-name-small">{name}</span>
      </div>

      {/* --- NEURAALINEN KUISKAUS --- */}
      {isActive && !isLocked && (
        <div style={whisperStyle} onClick={(e) => e.stopPropagation()}>
          
          {/* UUSI OTSIKKO: Kertoo kenen ajatus tämä on */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.6rem',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '1px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '4px'
          }}>
            <Eye size={10} color="var(--turquoise)" /> 
            <span style={{color: 'var(--turquoise)'}}>{viewerName}</span> HAVAINTO:
          </div>
          
          <div style={{
            fontSize: '0.85rem', 
            color: '#fff', 
            marginBottom: '12px',
            fontStyle: 'italic',
            lineHeight: '1.4',
            fontWeight: '300'
          }}>
            "{displayContext}"
          </div>

          <button 
            style={{
              background: 'linear-gradient(90deg, rgba(0, 231, 255, 0.1), rgba(0, 231, 255, 0.05))',
              border: '1px solid rgba(0, 231, 255, 0.3)',
              color: '#fff',
              fontSize: '0.7rem',
              padding: '8px 10px',
              width: '100%',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}
            onClick={(e) => {
              e.stopPropagation(); 
              onClick(character.id);
            }}
          >
            AVAA PROFIILI <ArrowRight size={12} />
          </button>
        </div>
      )}

      {!isLocked && !isActive && (
        <button className="card-action-icon" onClick={(e) => { e.stopPropagation(); onDossierClick(character); }}>
          <BookOpen size={12} />
        </button>
      )}
    </div>
  );
};

export default NexusCard;