import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Terminal, Check, Sparkles, Database, Copy, AlertTriangle } from 'lucide-react';

const AIPromptGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualPrompt, setManualPrompt] = useState(''); // Varajärjestelmä

  const copyText = (text) => {
    // 1. Luodaan näkymätön elementti
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Varmistetaan, ettei elementti näy tai vaikuta leiskaan
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    let success = false;
    try {
      // 2. Käytetään perinteistä kopiokomentoa
      success = document.execCommand('copy');
    } catch (err) {
      console.error("Kopiointivirhe:", err);
    }
    
    document.body.removeChild(textArea);
    return success;
  };

  const fetchAndProcessData = async () => {
    setLoading(true);
    setManualPrompt('');
    
    try {
      // Haetaan Intelligence Data
      const { data: leaderboard } = await supabase
        .from('leaderboard')
        .select('*')
        .order('xp', { ascending: false })
        .limit(5);

      const { data: posts } = await supabase
        .from('live_posts')
        .select('sender_name, message, image_url')
        .neq('status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(15);

      const { data: missions } = await supabase
        .from('mission_log')
        .select('xp_earned, approval_status');

      const totalXp = missions?.reduce((sum, m) => sum + (m.xp_earned || 0), 0) || 0;
      const approvedCount = missions?.filter(m => m.approval_status === 'approved').length || 0;

      const promptText = `
Olet J:CLUB 50 HQ tiedustelu-upseeri. Kirjoita humoristinen loppuraportti juhlista.

DATALÄHTEET:
- Mestarit: ${leaderboard?.map(l => `${l.name} (${l.role}): ${l.xp} XP`).join(', ')}
- Viestit: ${posts?.map(p => `${p.sender_name}: ${p.message}`).join(' | ')}
- Kuvat (Lisää <img> tägeillä): ${posts?.filter(p => p.image_url).map(p => p.image_url).join(', ')}
- Tilastot: ${totalXp} XP, ${approvedCount} tehtävää suoritettu.

OHJEET:
1. Käytä Neon Gatsby HTML-teemaa (.jc-card, .jc-h1 jne).
2. Tyyli on vakoojamainen, ironinen ja juhlava.
3. Palauta vain HTML-koodi ilman selityksiä.
`;

      const isSuccessful = copyText(promptText);

      if (isSuccessful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        // Jos automaattinen kopiointi epäonnistuu, näytetään teksti käyttäjälle
        setManualPrompt(promptText);
      }

    } catch (err) {
      console.error("HQ virhe:", err);
      alert("Tietokantayhteys epäonnistui.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jc-card" style={{ 
      border: '1px solid var(--sun)', 
      background: 'rgba(255, 165, 0, 0.05)',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            width: '50px', height: '50px', borderRadius: '12px', 
            background: 'var(--sun)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Terminal color="#000" size={24} />
          </div>
          <div>
            <h3 className="small neon-text-sun" style={{ margin: 0, color: 'var(--sun)' }}>AI INTELLIGENCE REPORT</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
              Kerää juhladatan promptiksi tekoälylle.
            </p>
          </div>
        </div>

        <button 
          onClick={fetchAndProcessData} 
          disabled={loading}
          className="jc-btn"
          style={{ 
            background: copied ? 'var(--lime)' : 'linear-gradient(135deg, #FF8C00, #FFA500)',
            color: '#000',
            minWidth: '240px'
          }}
        >
          {loading ? <Database className="spin" size={18} /> : 
           copied ? <><Check size={18} /> KOPIOITU!</> : 
           <><Sparkles size={18} /> GENERATE PROMPT</>}
        </button>
      </div>

      {/* VARAJÄRJESTELMÄ: Jos kopiointi estetään, näytetään teksti tässä */}
      {manualPrompt && (
        <div className="fade-in" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--sun)', paddingTop: '1rem' }}>
          <p style={{ color: 'var(--sun)', fontSize: '0.8rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={14} /> Selain esti automaattisen kopioinnin. Kopioi alta manuaalisesti:
          </p>
          <textarea 
            readOnly
            value={manualPrompt}
            onClick={(e) => e.target.select()}
            style={{ 
              width: '100%', height: '150px', background: '#000', 
              color: 'var(--lime)', border: '1px solid var(--sun)',
              padding: '10px', fontSize: '12px', fontFamily: 'monospace'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AIPromptGenerator;