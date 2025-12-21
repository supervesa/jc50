import React from 'react';

// --- TEKSTILOHKOT ---
export const H1Block = ({ content, onUpdate }) => (
  <div style={{ textAlign: 'center', padding: '20px 15px' }}>
    <input 
      style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'center', width: '100%', fontSize: '2.5rem', fontWeight: 'bold', textShadow: '0 0 15px var(--magenta)', fontFamily: 'Josefin Sans', textTransform: 'uppercase' }}
      value={content.text} onChange={e => onUpdate({ text: e.target.value })} placeholder="SYÖTÄ PÄÄOTSIKKO"
    />
  </div>
);

export const H2Block = ({ content, onUpdate }) => (
  <div style={{ textAlign: 'left', padding: '10px 0' }}>
    <input 
      style={{ background: 'transparent', border: 'none', color: 'var(--turquoise)', width: '100%', fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit', textTransform: 'uppercase' }}
      value={content.text} onChange={e => onUpdate({ text: e.target.value })} placeholder="ALAOTSIKKO"
    />
  </div>
);

export const PBlock = ({ content, onUpdate }) => (
  <div style={{ textAlign: 'left', padding: '10px 0' }}>
    <textarea 
      style={{ background: 'transparent', border: 'none', color: 'var(--cream)', width: '100%', fontSize: '1rem', resize: 'none', lineHeight: '1.6', fontFamily: 'Montserrat' }}
      rows="4" value={content.text} onChange={e => onUpdate({ text: e.target.value })} placeholder="Leipäteksti..."
    />
  </div>
);

// --- ERIKOISLOHKOT ---
export const AgentBlock = () => (
  <div className="agent-hero-container">
    <div className="agent-hero-btn" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0, 231, 255, 0.05)', border: '1px solid var(--turquoise)', padding: '15px', borderRadius: '12px' }}>
      <div className="agent-icon-box" style={{ width: '50px', height: '50px', background: 'var(--turquoise)', borderRadius: '10px', display: 'flex', alignInterms: 'center', justifyContent: 'center', marginRight: '15px', position: 'relative', flexShrink: 0 }}>
        <span style={{ fontSize: '24px' }}>📱</span>
        <div className="ping-ring" style={{ position: 'absolute', inset: 0, borderRadius: '10px', border: '2px solid var(--turquoise)', animation: 'ping 2s infinite' }}></div>
      </div>
      <div className="agent-text-box">
        <span style={{ fontSize: '0.7rem', color: 'var(--turquoise)', textTransform: 'uppercase', letterSpacing: '1px' }}>TEHTÄVÄT & VIESTIT</span><br/>
        <span style={{ fontWeight: '800', color: '#fff', fontSize: '0.95rem' }}>AVAA SALAINEN KOMMUNIKAATTORI</span>
      </div>
    </div>
  </div>
);

export const ActionBlock = ({ content, onUpdate }) => (
  <div style={{ background: 'rgba(0, 231, 255, 0.03)', border: '1px dashed var(--turquoise)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📸</div>
    <input 
      style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'center', width: '100%', fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'Outfit' }}
      value={content.title} onChange={e => onUpdate({ title: e.target.value })} 
    />
    <textarea 
      style={{ background: 'transparent', border: 'none', color: 'var(--muted)', width: '100%', fontSize: '0.85rem', textAlign: 'center', resize: 'none', marginTop: '10px' }}
      value={content.body} onChange={e => onUpdate({ body: e.target.value })} 
    />
  </div>
);

export const TicketBlock = ({ content, onUpdate }) => (
  <div className="jc-card ticket-wrapper" style={{ margin: 0, border: '1px solid var(--turquoise)', padding: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--cream)', fontWeight: '800' }}>ACCESS PASS v2.0</span>
      <span style={{ color: 'var(--lime)', border: '1px solid var(--lime)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem' }}>CONFIRMED</span>
    </div>
    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--turquoise)' }}>TERVETULOA JÄSEN:</span>
      <h2 style={{ color: 'white', margin: '5px 0', fontSize: '2rem', textAlign: 'center' }}>{"{{name}}"}</h2>
    </div>
    <div style={{ borderLeft: '4px solid var(--magenta)', background: 'rgba(255,0,229,0.1)', padding: '20px', marginTop: '20px' }}>
      <input 
        style={{ background: 'transparent', border: 'none', color: 'var(--magenta)', fontSize: '0.75rem', width: '100%', letterSpacing: '0.2em', marginBottom: '15px' }}
        value={content.label} onChange={e => onUpdate({ label: e.target.value })} 
      />
      <div style={{ color: 'white', fontSize: '1.5rem', fontFamily: 'Josefin Sans', textShadow: '0 0 10px var(--magenta)' }}>{"{{character}}"}</div>
    </div>
    <div style={{ marginTop: '30px', background: 'var(--magenta)', padding: '12px', borderRadius: '10px', textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>
      AVAA LIPPU & LIVEWALL
    </div>
  </div>
);

export const PointsBlock = ({ content, onUpdate }) => (
  <div className="jc-card" style={{ margin: 0, border: '1px solid var(--lime)', background: 'rgba(173, 255, 47, 0.05)' }}>
    <h3 style={{ color: 'var(--lime)', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Pistejahti: Aktiivisuus palkitaan</h3>
    <textarea 
      style={{ background: 'transparent', border: 'none', color: 'var(--cream)', width: '100%', fontSize: '0.9rem', resize: 'none', lineHeight: '1.6' }}
      rows="4" value={content.body} onChange={e => onUpdate({ body: e.target.value })} 
    />
  </div>
);

export const PrivacyBlock = ({ content, onUpdate }) => (
  <div style={{ padding: '1rem', border: '1px solid var(--sun)', borderRadius: '8px', background: 'rgba(255, 165, 0, 0.05)', color: '#ffeab0', fontSize: '0.85rem' }}>
    <strong>⚠️ YKSITYISYYS:</strong><br />
    <textarea 
      style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', fontSize: 'inherit', resize: 'none', marginTop: '5px' }}
      rows="2" value={content.body} onChange={e => onUpdate({ body: e.target.value })} 
    />
  </div>
);

// --- MUUT STANDARDILOHKOT ---
export const HeroBlock = ({ content, onUpdate }) => (
  <div style={{ textAlign: 'center', padding: '20px' }}>
    <input style={{ background: 'transparent', border: 'none', color: 'var(--turquoise)', textAlign: 'center', width: '100%', fontSize: '0.8rem', letterSpacing: '0.3em' }} value={content.date} onChange={e => onUpdate({ date: e.target.value })} />
    <input style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'center', width: '100%', fontSize: '2.5rem', fontWeight: 'bold' }} value={content.title} onChange={e => onUpdate({ title: e.target.value })} />
    <input style={{ background: 'transparent', border: 'none', color: 'var(--magenta)', textAlign: 'center', width: '100%', fontSize: '1rem' }} value={content.theme} onChange={e => onUpdate({ theme: e.target.value })} />
  </div>
);

export const InfoBlock = ({ content, onUpdate }) => (
  <div className="jc-card" style={{ margin: 0, borderColor: 'var(--turquoise)' }}>
    <h2 className="jc-h2" style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>Sijaintitiedot</h2>
    <input className="jc-input" style={{marginBottom:'10px'}} value={content.location} onChange={e => onUpdate({ location: e.target.value })} placeholder="Osoite" />
    <input className="jc-input" value={content.time} onChange={e => onUpdate({ time: e.target.value })} placeholder="Aika" />
  </div>
);

export const ListBlock = ({ content, onUpdate }) => (
  <div className="jc-card" style={{ margin: 0 }}>
    <input style={{ background: 'transparent', border: 'none', color: 'var(--turquoise)', fontSize: '1.2rem', width: '100%' }} value={content.title} onChange={e => onUpdate({ title: e.target.value })} />
    <textarea style={{ background: 'transparent', border: 'none', color: 'var(--cream)', width: '100%', marginTop: '10px' }} rows="4" value={content.items} onChange={e => onUpdate({ items: e.target.value })} />
  </div>
);

export const ImageBlock = ({ content }) => (
  <div style={{ textAlign: 'center', minHeight: '100px', border: '1px dashed #444', borderRadius: '12px' }}>
    {content.url ? <img src={content.url} style={{ maxWidth: '100%', borderRadius: '12px' }} /> : <p style={{padding:'40px'}}>Valitse kuva galleriasta</p>}
  </div>
);