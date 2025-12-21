import React, { useState } from 'react';
import { generateAiContent } from './aiService';

export default function AIAssistant({ onGenerated, selectedCharacter }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (intent) => {
    if (!input && intent !== 'full_message') return alert('Syötä ensin jotain raakatekstiä.');
    
    setLoading(true);
    try {
      const result = await generateAiContent(input, intent, selectedCharacter);
      // Palautetaan generoitu teksti parent-komponentille
      onGenerated(result);
    } catch (e) {
      alert('Tekoälyvirhe: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jc-card" style={{ border: '1px solid var(--magenta)', background: 'rgba(255, 0, 229, 0.02)' }}>
      <h4 style={{ color: 'var(--magenta)', fontSize: '0.7rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🪄</span> AI-AVUSTAJA (VESA)
      </h4>
      
      <textarea 
        className="jc-input"
        style={{ height: '80px', fontSize: '0.8rem', marginBottom: '10px', background: 'rgba(0,0,0,0.3)' }}
        placeholder="Syötä raakateksti tai ohje tekoälylle..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
        <button 
          onClick={() => handleGenerate('full_message')} 
          disabled={loading}
          className="jc-btn small outline"
          style={{ fontSize: '0.6rem' }}
        >
          {loading ? '...' : '🚀 LUO KOKO VIESTI'}
        </button>
        <button 
          onClick={() => handleGenerate('instructions')} 
          disabled={loading}
          className="jc-btn small outline"
          style={{ fontSize: '0.6rem' }}
        >
          {loading ? '...' : '📱 OHJEISTA'}
        </button>
        <button 
          onClick={() => handleGenerate('mystify')} 
          disabled={loading}
          className="jc-btn small outline"
          style={{ fontSize: '0.6rem', gridColumn: 'span 2' }}
        >
          {loading ? '...' : '🕵️ MYSTIFIOI TEKSTI'}
        </button>
      </div>

      {selectedCharacter && (
        <div style={{ marginTop: '10px', fontSize: '0.6rem', color: 'var(--turquoise)', opacity: 0.7 }}>
          Kontekstina: {selectedCharacter.role || selectedCharacter.character_name}
        </div>
      )}
    </div>
  );
}