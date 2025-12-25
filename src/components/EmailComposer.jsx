import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import RecipientSelector from './RecipientSelector';
import VisualEditor from './VisualEditor';

const SAFE_MODE_EMAILS = (import.meta.env.VITE_SAFE_MODE_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export default function EmailComposer({ initialRecipient }) { // <--- LISÄTTY PROP
  const [activeTab, setActiveTab] = useState('recipients');
  const [editorMode, setEditorMode] = useState('code'); // 'code' tai 'visual'
  const [loading, setLoading] = useState(true);
  
  // DATA TILAT
  const [recipients, setRecipients] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [templates, setTemplates] = useState([]);
  
  // VIESTIN TILAT
  const [subject, setSubject] = useState('');
  const [senderName, setSenderName] = useState('Vesa / J:CLUB');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  
  // UI TILAT
  const [autoSync, setAutoSync] = useState(true);
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(true);

  const editorRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Haetaan hahmot ja vieraat - LAAJENNETTU haku AI-kontekstia varten
      const { data: chars } = await supabase
        .from('characters')
        .select(`
          id, 
          name, 
          role, 
          backstory, 
          secret_mission, 
          is_spouse_character, 
          pre_assigned_email, 
          assigned_guest_id, 
          guests:assigned_guest_id(name, email)
        `)
        .order('name');

      // 2. Haetaan viestipohjat
      const { data: tmpls } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');

      // Käsitellään vastaanottajat ja tarkistetaan Safe Mode
      const processed = chars?.map(char => {
        const guestData = Array.isArray(char.guests) ? char.guests[0] : char.guests;
        const email = (char.pre_assigned_email || guestData?.email)?.toLowerCase().trim();
        return {
          id: char.id,
          characterName: char.name || char.role || 'Nimetön',
          role: char.role,
          backstory: char.backstory,
          secret_mission: char.secret_mission,
          is_avec: char.is_spouse_character,
          guestName: guestData?.name || 'Ei nimeä',
          email: email,
          isAllowed: email && SAFE_MODE_EMAILS.includes(email)
        };
      }) || [];

      setRecipients(processed);
      setTemplates(tmpls || []);
      
      // Valitaan ensimmäinen pohja oletukseksi jos niitä on
      if (tmpls?.length > 0) {
        applyTemplate(tmpls[0]);
      }
    } catch (err) {
      console.error("Datan haku epäonnistui:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (tmpl) => {
    if (!tmpl) return;
    setCurrentTemplateId(tmpl.id);
    setTemplateName(tmpl.name);
    setSubject(tmpl.subject);
    setHtmlContent(tmpl.body_html);
    setTextContent(tmpl.body_text || '');
    setAutoSync(false); // Estetään automaattinen ylikirjoitus ladattaessa valmista pohjaa
  };

  // HTML-muutosten käsittely
  const handleHtmlChange = (val) => {
    setHtmlContent(val);
    if (autoSync) {
      const plainText = val
        .replace(/<[^>]*>/g, '') 
        .replace(/&nbsp;/g, ' ')
        .trim();
      setTextContent(plainText);
    }
  };

  const handleSend = async () => {
    const targets = Array.from(selectedIds);
    if (targets.length === 0) return alert('Valitse vastaanottajat ensin.');
    if (!confirm(`LÄHETYS: ${targets.length} viestiä. Oletko täysin varma?`)) return;

    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characterIds: targets, 
          senderName, 
          subject, 
          htmlTemplate: htmlContent, 
          textTemplate: textContent,
          templateId: currentTemplateId
        })
      });

      if (response.ok) {
        alert('Viestit lähetetty onnistuneesti!');
      } else {
        alert('Lähetys epäonnistui palvelimella.');
      }
    } catch (err) {
      console.error(err);
      alert('Yhteysvirhe lähetettäessä.');
    } finally {
      setLoading(false);
    }
  };

  // AI-KONTEKSTIN VALINTA (Valitaan ensimmäinen valittu hahmo avustajalle)
  const firstSelectedId = Array.from(selectedIds)[0];
  const selectedCharContext = recipients.find(r => r.id === firstSelectedId);

  if (loading && recipients.length === 0) {
    return <div className="jc-spinner">Ladataan J:CLUB Järjestelmää...</div>;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      
      {/* PÄÄNAVIGAATIO */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={`jc-btn ${activeTab === 'recipients' ? '' : 'outline'}`} 
          onClick={() => setActiveTab('recipients')}
        >
          👥 VASTAANOTTAJAT
        </button>
        <button 
          className={`jc-btn ${activeTab === 'editor' ? '' : 'outline'}`} 
          onClick={() => setActiveTab('editor')}
        >
          ✏️ VIESTI
        </button>
        <button 
          className={`jc-btn ${activeTab === 'preview' ? '' : 'outline'}`} 
          onClick={() => setActiveTab('preview')}
        >
          👁️ ESIKATSELU
        </button>
      </div>

      {/* TAB 1: VASTAANOTTAJIEN VALINTA */}
      {activeTab === 'recipients' && (
        <RecipientSelector 
          recipients={recipients} 
          selectedIds={selectedIds} 
          setSelectedIds={setSelectedIds}
          showOnlyAssigned={showOnlyAssigned}
          setShowOnlyAssigned={setShowOnlyAssigned}
        />
      )}

      {/* TAB 2: EDITORI */}
      {activeTab === 'editor' && (
        <div className="jc-card fade-in">
          
          {/* TEMPLATE VALINTA */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--turquoise)', display: 'block', marginBottom: '5px' }}>
              VALITSE VIESTIPOHJA JÄRJESTELMÄSTÄ:
            </label>
            <select 
              className="jc-select" 
              value={currentTemplateId || ''} 
              onChange={(e) => applyTemplate(templates.find(t => t.id === e.target.value))}
            >
              <option value="">-- Valitse pohja --</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* LÄHETTÄJÄ JA AIHE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>LÄHETTÄJÄN NIMI (SENDER):</label>
              <input 
                type="text" 
                value={senderName} 
                onChange={e => setSenderName(e.target.value)} 
                className="jc-input" 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>VIESTIN AIHE (SUBJECT):</label>
              <input 
                type="text" 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                className="jc-input" 
              />
            </div>
          </div>

          {/* EDITORITILAN VAIHTO */}
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={() => setEditorMode('code')} 
              className={editorMode === 'code' ? 'jc-btn small' : 'jc-btn small outline'}
            >
              HTML-KOODI
            </button>
            <button 
              onClick={() => setEditorMode('visual')} 
              className={editorMode === 'visual' ? 'jc-btn small' : 'jc-btn small outline'} 
              style={{ marginLeft: '10px' }}
            >
              VISUAALINEN MUOKKAUS
            </button>
          </div>

          {editorMode === 'code' ? (
            /* RAW HTML EDITOR */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="fade-in">
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--turquoise)' }}>HTML SISÄLTÖ:</label>
                <textarea 
                  value={htmlContent} 
                  onChange={(e) => handleHtmlChange(e.target.value)}
                  style={{ 
                    width: '100%', 
                    height: '600px', 
                    background: '#050508', 
                    color: 'var(--lime)', 
                    padding: '15px', 
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    border: '1px solid #333'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                  <input 
                    type="checkbox" 
                    checked={autoSync} 
                    onChange={e => setAutoSync(e.target.checked)} 
                  /> AUTOMAATTINEN TEKSTIVERSIO (SYNC)
                </label>
                <textarea 
                  value={textContent} 
                  onChange={(e) => { setTextContent(e.target.value); setAutoSync(false); }}
                  style={{ 
                    width: '100%', 
                    height: '600px', 
                    background: '#0a0a0c', 
                    color: '#888', 
                    padding: '15px',
                    fontSize: '13px',
                    border: '1px solid #222'
                  }}
                  placeholder="Viestin tekstiversio..."
                />
              </div>
            </div>
          ) : (
            /* VISUAL BLOCK EDITOR - LISÄTTY selectedCharacter */
            <VisualEditor 
              html={htmlContent} 
              onChange={handleHtmlChange} 
              templateId={currentTemplateId}
              templateName={templateName}
              subject={subject}
              selectedCharacter={selectedCharContext}
            />
          )}
        </div>
      )}

      {/* TAB 3: ESIKATSELU */}
      {activeTab === 'preview' && (
        <div className="jc-card fade-in">
          <div style={{ background: '#fff', padding: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
            <div 
              style={{ padding: '20px', color: '#000' }} 
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
            />
          </div>
          
          <div style={{ marginTop: '30px', padding: '20px', border: '1px solid var(--magenta)', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--magenta)', margin: '0 0 10px 0' }}>VALMIS LÄHETETTÄVÄKSI?</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Viesti lähetetään {selectedIds.size} valitulle ja sallitulle vastaanottajalle.
            </p>
            <button 
              className="jc-btn primary" 
              style={{ width: '100%', padding: '20px', fontSize: '1.1rem' }} 
              onClick={handleSend} 
              disabled={loading}
            >
              {loading ? 'KÄSITTELLÄÄN...' : `🚀 LÄHETÄ ${selectedIds.size} VIESTIÄ NYT`}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}