import React from 'react';

function InfoSidecar({ character, onClose }) {
  if (!character) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: '300px',
      background: 'rgba(10, 10, 15, 0.95)', borderLeft: '1px solid var(--turquoise)',
      padding: '1.5rem', overflowY: 'auto', zIndex: 10,
      boxShadow: '-10px 0 30px rgba(0,0,0,0.8)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
      
      <div style={{ marginTop: '1rem' }}>
        <span className="small" style={{ color: 'var(--plasma-gold)', letterSpacing: '0.1em' }}>IDENTITY</span>
        <h2 className="jc-h2" style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>{character.name}</h2>
        <h4 style={{ color: 'var(--turquoise)', margin: '0 0 1rem 0' }}>{character.role}</h4>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', lineHeight: '1.5', fontStyle: 'italic', marginBottom: '1.5rem' }}>
          "{character.backstory || 'Ei taustatarinaa.'}"
        </div>

        <span className="small" style={{ color: 'var(--magenta)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>CONNECTIONS</span>
        
        {character.links && character.links.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {character.links.map((link, i) => (
              <li key={i} style={{ marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase' }}>{link.label}</div>
                <strong style={{ color: '#fff' }}>{link.targetName}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small" style={{ opacity: 0.5 }}>Ei tunnettuja yhteyksiä.</p>
        )}
      </div>
    </div>
  );
}

export default InfoSidecar;