import React from 'react';

export default function TagPicker() {
  const tags = [
    { label: 'Nimi', value: '{{name}}', color: 'var(--turquoise)' },
    { label: 'Hahmo', value: '{{character}}', color: 'var(--magenta)' },
    { label: 'Lippu', value: '{{ticket_link}}', color: 'var(--lime)' },
    { label: 'Selain', value: '{{browser_link}}', color: 'var(--sun)' }
  ];

  return (
    <div className="jc-card" style={{ padding: '10px' }}>
      <h4 style={{ color: 'var(--muted)', fontSize: '0.6rem', marginBottom: '10px' }}>TAGIT</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {tags.map(t => (
          <button key={t.value} onClick={() => navigator.clipboard.writeText(t.value)} className="jc-btn small outline" style={{ borderColor: t.color, fontSize: '0.6rem' }}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}