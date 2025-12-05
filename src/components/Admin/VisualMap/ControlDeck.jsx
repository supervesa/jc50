import React from 'react';

const VIEWS = [
  { id: 'ALL', label: 'THE NEXUS', color: '#fff' },
  { id: 'LOVE', label: 'Hearts & Arrows', color: '#FF00E5' }, // Magenta
  { id: 'WAR', label: 'Conflict Zone', color: '#FF2A2A' },    // Red
  { id: 'LONELY', label: 'Lonely Souls', color: '#00E7FF' },  // Cyan
];

function ControlDeck({ activeView, onSelectView }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', height: '100%', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
      <h4 style={{ margin: '0 0 1rem 0', color: 'var(--plasma-gold)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>TATAX SYSTEM</h4>
      
      {VIEWS.map(view => (
        <button
          key={view.id}
          onClick={() => onSelectView(view.id)}
          style={{
            background: activeView === view.id ? `rgba(255,255,255,0.1)` : 'transparent',
            border: `1px solid ${activeView === view.id ? view.color : 'rgba(255,255,255,0.1)'}`,
            color: activeView === view.id ? view.color : 'var(--muted)',
            padding: '0.8rem',
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '0.85rem',
            transition: 'all 0.2s',
            boxShadow: activeView === view.id ? `0 0 10px ${view.color}40` : 'none'
          }}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

export default ControlDeck;