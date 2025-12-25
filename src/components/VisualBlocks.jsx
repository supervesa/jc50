import React from 'react';
import './EmailStyles.css'; // Tuodaan CSS

// --- TEKSTILOHKOT ---
export const H1Block = ({ content, onUpdate }) => (
  <div className="jc-hero-block">
    <input 
      className="jc-input-transparent jc-title-h1"
      value={content.text} 
      onChange={e => onUpdate({ text: e.target.value })} 
      placeholder="SYÖTÄ PÄÄOTSIKKO"
    />
  </div>
);

export const H2Block = ({ content, onUpdate }) => (
  <div style={{ padding: '10px 0' }}>
    <input 
      className="jc-input-transparent jc-title-h2" style={{textAlign: 'left'}}
      value={content.text} 
      onChange={e => onUpdate({ text: e.target.value })} 
      placeholder="ALAOTSIKKO"
    />
  </div>
);

export const PBlock = ({ content, onUpdate }) => (
  <div style={{ padding: '10px 0' }}>
    <textarea 
      className="jc-textarea jc-text-p"
      rows="4" 
      value={content.text} 
      onChange={e => onUpdate({ text: e.target.value })} 
      placeholder="Leipäteksti..."
    />
  </div>
);

// --- ERIKOISLOHKOT ---
export const AgentBlock = () => (
  <div className="agent-hero-btn">
    <div className="agent-icon-box">
      <span style={{ fontSize: '24px' }}>📱</span>
      <div className="ping-ring"></div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--turquoise)', textTransform: 'uppercase', letterSpacing: '1px' }}>TEHTÄVÄT & VIESTIT</span>
      <span style={{ fontWeight: '800', color: '#fff', fontSize: '0.95rem' }}>AVAA SALAINEN KOMMUNIKAATTORI</span>
    </div>
  </div>
);

export const ActionBlock = ({ content, onUpdate }) => (
  <div className="action-box">
    <div className="camera-icon">📸</div>
    <input 
      className="jc-input-transparent" 
      style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'Outfit' }}
      value={content.title} 
      onChange={e => onUpdate({ title: e.target.value })} 
    />
    <textarea 
      className="jc-textarea" 
      style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', marginTop: '10px' }}
      value={content.body} 
      onChange={e => onUpdate({ body: e.target.value })} 
    />
  </div>
);

export const TicketBlock = ({ content, onUpdate }) => (
  <div className="jc-card-wrapper ticket-wrapper">
    <div className="ticket-header">
      <span style={{ fontSize: '0.7rem', color: 'var(--cream)', fontWeight: '800' }}>ACCESS PASS v2.0</span>
      <span className="ticket-status">CONFIRMED</span>
    </div>
    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--turquoise)' }}>TERVETULOA JÄSEN:</span>
      <h2 className="jc-title-h2" style={{ fontSize: '2rem', textAlign: 'center', color: 'white', webkitTextFillColor: 'white' }}>{"{{name}}"}</h2>
    </div>
    <div className="character-box">
      <input 
        className="jc-input-transparent"
        style={{ color: 'var(--magenta)', fontSize: '0.75rem', letterSpacing: '0.2em', marginBottom: '15px' }}
        value={content.label} 
        onChange={e => onUpdate({ label: e.target.value })} 
      />
      <div style={{ color: 'white', fontSize: '1.5rem', fontFamily: 'Josefin Sans', textShadow: '0 0 10px var(--magenta)' }}>{"{{character}}"}</div>
    </div>
    <div className="jc-cta-primary" style={{ width: '100%', boxSizing: 'border-box' }}>
      AVAA LIPPU & LIVEWALL
    </div>
  </div>
);

export const PointsBlock = ({ content, onUpdate }) => (
  <div className="jc-card-wrapper points-box">
    <h3 style={{ color: 'var(--lime)', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Pistejahti: Aktiivisuus palkitaan</h3>
    <textarea 
      className="jc-textarea"
      rows="4" 
      value={content.body} 
      onChange={e => onUpdate({ body: e.target.value })} 
    />
  </div>
);

export const PrivacyBlock = ({ content, onUpdate }) => (
  <div className="jc-card-wrapper privacy-box" style={{ padding: '15px' }}>
    <strong>⚠️ YKSITYISYYS:</strong><br />
    <textarea 
      className="jc-textarea"
      style={{ color: 'inherit', marginTop: '5px' }}
      rows="2" 
      value={content.body} 
      onChange={e => onUpdate({ body: e.target.value })} 
    />
  </div>
);

export const InfoBlock = ({ content, onUpdate }) => (
  <div className="jc-card-wrapper info-box">
    <h2 className="jc-title-h2" style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Sijaintitiedot</h2>
    <input className="jc-input" style={{marginBottom:'10px', fontSize:'1rem'}} value={content.location} onChange={e => onUpdate({ location: e.target.value })} placeholder="Osoite" />
    <input className="jc-input" style={{fontSize:'1rem'}} value={content.time} onChange={e => onUpdate({ time: e.target.value })} placeholder="Aika" />
  </div>
);

export const ListBlock = ({ content, onUpdate }) => (
  <div className="jc-card-wrapper">
    <input className="jc-input" value={content.title} onChange={e => onUpdate({ title: e.target.value })} />
    <textarea className="jc-textarea" style={{marginTop:'10px'}} rows="4" value={content.items} onChange={e => onUpdate({ items: e.target.value })} />
  </div>
);

export const ContactBlock = ({ content, onUpdate }) => (
  <div className="jc-card-wrapper info-box">
    <input className="jc-input" style={{fontWeight:'bold'}} value={content.title} onChange={e => onUpdate({ title: e.target.value })} />
    <input className="jc-input" style={{color:'white', fontSize:'0.9rem', marginTop:'5px'}} value={content.email} onChange={e => onUpdate({ email: e.target.value })} />
  </div>
);

export const HeroBlock = ({ content, onUpdate }) => (
  <div className="jc-hero-block">
    <input className="jc-input-transparent" style={{ color: 'var(--turquoise)', fontSize: '0.8rem', letterSpacing: '0.3em' }} value={content.date} onChange={e => onUpdate({ date: e.target.value })} />
    <input className="jc-input-transparent jc-title-h1" value={content.title} onChange={e => onUpdate({ title: e.target.value })} />
    <input className="jc-input-transparent" style={{ color: 'var(--magenta)', fontSize: '1rem', marginTop:'10px' }} value={content.theme} onChange={e => onUpdate({ theme: e.target.value })} />
  </div>
);

export const ImageBlock = ({ content }) => (
  <div style={{ textAlign: 'center', minHeight: '100px', border: '1px dashed #444', borderRadius: '12px' }}>
    {content.url ? <img src={content.url} style={{ maxWidth: '100%', borderRadius: '12px' }} /> : <p style={{padding:'40px', color:'#555'}}>Valitse kuva galleriasta</p>}
  </div>
);