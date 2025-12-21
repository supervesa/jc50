import React from 'react';

// HERO
export const HeroBlock = ({ content, onUpdate }) => (
  <div style={{ textAlign: 'center', padding: '20px' }}>
    <input 
      style={{ background: 'transparent', border: 'none', color: 'var(--turquoise)', textAlign: 'center', width: '100%', fontSize: '0.8rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}
      value={content.date} onChange={e => onUpdate({ date: e.target.value })} 
    />
    <input 
      style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'center', width: '100%', fontSize: '2.5rem', fontWeight: 'bold', textShadow: '0 0 15px var(--magenta)', fontFamily: 'Josefin Sans' }}
      value={content.title} onChange={e => onUpdate({ title: e.target.value })} 
    />
    <input 
      style={{ background: 'transparent', border: 'none', color: 'var(--magenta)', textAlign: 'center', width: '100%', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}
      value={content.theme} onChange={e => onUpdate({ theme: e.target.value })} 
    />
  </div>
);

// LIPPU
export const TicketBlock = ({ content, onUpdate }) => (
  <div className="jc-card ticket-wrapper" style={{ margin: 0, border: '1px solid var(--turquoise)', padding: '15px', background: 'rgba(0,0,0,0.6)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--cream)', fontWeight: '800' }}>ACCESS PASS v2.0</span>
      <span style={{ color: 'var(--lime)', border: '1px solid var(--lime)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.6rem', textTransform: 'uppercase' }}>CONFIRMED</span>
    </div>
    <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontFamily: 'Outfit' }}>{"{{name}}"}</h2>
    <div style={{ borderLeft: '4px solid var(--magenta)', background: 'rgba(255,0,229,0.1)', padding: '10px', marginTop: '10px' }}>
      <input 
        style={{ background: 'transparent', border: 'none', color: 'var(--magenta)', fontSize: '0.7rem', width: '100%', letterSpacing: '0.2em' }}
        value={content.label} onChange={e => onUpdate({ label: e.target.value })} 
      />
      <div style={{ color: 'white', fontSize: '1.2rem', fontFamily: 'Josefin Sans', textShadow: '0 0 10px var(--magenta)' }}>{"{{character}}"}</div>
    </div>
  </div>
);

// TEKSTI
export const TextBlock = ({ content, onUpdate }) => (
  <div className="jc-card" style={{ margin: 0 }}>
    <input 
      style={{ background: 'transparent', border: 'none', color: 'var(--turquoise)', fontSize: '1.2rem', width: '100%', marginBottom: '10px', fontFamily: 'Outfit', fontWeight: '800' }}
      value={content.title} onChange={e => onUpdate({ title: e.target.value })} 
    />
    <textarea 
      style={{ background: 'transparent', border: 'none', color: 'var(--cream)', width: '100%', fontSize: '0.9rem', resize: 'none', lineHeight: '1.6' }}
      rows="4" value={content.body} onChange={e => onUpdate({ body: e.target.value })} 
    />
  </div>
);

// OSOITE
export const InfoBlock = ({ content, onUpdate }) => (
  <div className="jc-card" style={{ margin: 0, borderColor: 'var(--turquoise)' }}>
    <h2 className="jc-h2" style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>Sijaintitiedot</h2>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '0.6rem', color: 'var(--turquoise)' }}>OSOITE:</label>
      <input className="jc-input" style={{ padding: '5px' }} value={content.location} onChange={e => onUpdate({ location: e.target.value })} />
    </div>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '0.6rem', color: 'var(--turquoise)' }}>AIKA:</label>
      <input className="jc-input" style={{ padding: '5px' }} value={content.time} onChange={e => onUpdate({ time: e.target.value })} />
    </div>
    <input className="jc-input" style={{ padding: '5px', fontSize: '0.7rem' }} value={content.mapUrl} onChange={e => onUpdate({ mapUrl: e.target.value })} />
  </div>
);

// LISTA
export const ListBlock = ({ content, onUpdate }) => (
  <div className="jc-card" style={{ margin: 0 }}>
    <input 
      style={{ background: 'transparent', border: 'none', color: 'var(--turquoise)', fontSize: '1.2rem', width: '100%', marginBottom: '10px' }}
      value={content.title} onChange={e => onUpdate({ title: e.target.value })} 
    />
    <textarea 
      style={{ background: 'transparent', border: 'none', color: 'var(--cream)', width: '100%', fontSize: '0.8rem', resize: 'none' }}
      rows="4" value={content.items} onChange={e => onUpdate({ items: e.target.value })}
    />
  </div>
);

// TUKI
export const ContactBlock = ({ content, onUpdate }) => (
  <div className="jc-card" style={{ margin: 0, border: '1px solid var(--turquoise)' }}>
    <input 
      style={{ background: 'transparent', border: 'none', color: 'var(--turquoise)', fontSize: '1.1rem', width: '100%', fontWeight: 'bold' }}
      value={content.title} onChange={e => onUpdate({ title: e.target.value })} 
    />
    <input 
      style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', width: '100%', marginTop: '5px' }}
      value={content.email} onChange={e => onUpdate({ email: e.target.value })} 
    />
  </div>
);

// KUVA
export const ImageBlock = ({ content }) => (
  <div style={{ textAlign: 'center', minHeight: '100px', border: '1px dashed #444', borderRadius: '12px', overflow: 'hidden' }}>
    {content.url ? (
      <img src={content.url} style={{ maxWidth: '100%', display: 'block', border: '1px solid var(--turquoise)' }} />
    ) : (
      <p style={{ padding: '40px', color: '#444' }}>Valitse kuva galleriasta</p>
    )}
  </div>
);