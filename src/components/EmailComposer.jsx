import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// TURVALISTA (Vain nämä osoitteet saavat postia kun SAFE MODE on päällä)
const SAFE_MODE_EMAILS = ['vesa.nessling@gmail.com', 'saikkonen.jukka@outlook.com'];

const DEFAULT_TEMPLATE = `
<html>
  <body style="background-color: #0b0b10; color: #ccc; font-family: sans-serif; padding: 20px;">
    <h1 style="color: #FF00E5;">Hei {{name}}!</h1>
    <p>Olet saanut roolin juhlissamme. Hahmosi on <strong>{{character}}</strong>.</p>
    <p>Tässä on henkilökohtainen lippusi juhliin:</p>
    <br />
    <a href="{{ticket_link}}" style="display: inline-block; background: #00E7FF; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase;">
      AVAA HENKILÖKOHTAINEN LIPPU
    </a>
    <br />
    <p style="margin-top: 30px; color: #888; font-size: 0.9rem; border-top: 1px solid #333; padding-top: 10px;">
      Terveisin,<br>Juhlatimi / Jukka Club 50
    </p>
  </body>
</html>
`;

export default function EmailComposer() {
  const [activeTab, setActiveTab] = useState('recipients');
  const [loading, setLoading] = useState(true);
  
  // DATA STATE
  const [recipients, setRecipients] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(true);

  // EDITOR STATE
  const [subject, setSubject] = useState('Kutsu juhliin: Neon Gatsby 2025');
  const [htmlContent, setHtmlContent] = useState(DEFAULT_TEMPLATE);
  const editorRef = useRef(null);
  const [previewId, setPreviewId] = useState(null);

  // 1. DATAHAKU
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Haetaan hahmot ja niihin liitetyt vieraat
    const { data, error } = await supabase
      .from('characters')
      .select(`
        id, 
        name, 
        role, 
        pre_assigned_email, 
        assigned_guest_id,
        guests:assigned_guest_id ( name, email )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      return;
    }

    const processed = data.map(char => {
      // Sähköpostin ratkaisu
      const email = char.pre_assigned_email || char.guests?.email;
      const isWhitelisted = email && SAFE_MODE_EMAILS.includes(email.toLowerCase().trim());

      return {
        id: char.id, // Hahmon UUID
        characterName: char.name || 'Nimetön hahmo',
        guestName: char.guests?.name || null,
        guestId: char.assigned_guest_id, // Tämä on se mitä lippu-osoite tarvitsee
        email: email,
        hasEmail: !!email,
        isAllowed: isWhitelisted
      };
    });

    setRecipients(processed);
    
    // Valitaan esikatseluun ensimmäinen jolla on näyttelijä
    const firstWithGuest = processed.find(r => r.guestName);
    if (firstWithGuest) setPreviewId(firstWithGuest.id);
    
    setLoading(false);
  };

  // SUODATUS
  const visibleRecipients = recipients.filter(r => showOnlyAssigned ? !!r.guestName : true);

  // VALINNAT
  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    const allSelectable = visibleRecipients.filter(r => r.isAllowed).map(r => r.id);
    const isAllSelected = allSelectable.length > 0 && allSelectable.every(id => selectedIds.has(id));
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allSelectable));
  };

  // LÄHETYS (Kutsuu Netlify-funktiota)
  const handleSend = async () => {
    const targets = Array.from(selectedIds);
    if (targets.length === 0) return alert('Valitse ainakin yksi vastaanottaja.');
    
    if (!confirm(`Olet lähettämässä viestiä ${targets.length} vastaanottajalle. Oletko varma?`)) return;

    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterIds: targets,
          subject: subject,
          htmlTemplate: htmlContent
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Lähetys valmis! Tarkista sähköpostit.');
        fetchData(); // Päivitetään tilat
      } else {
        alert('Virhe: ' + (result.error || 'Palvelinvirhe'));
      }
    } catch (err) {
      console.error(err);
      alert('Lähetys epäonnistui. Varmista että npx netlify dev pyörii.');
    } finally {
      setLoading(false);
    }
  };

  // EDITORIN APURIT
  const insertTag = (tag) => {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const newText = currentText.substring(0, start) + tag + currentText.substring(end);
    setHtmlContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // ESIKATSELU (KORJATTU: Ei enää token-viittauksia)
  const getPreviewHtml = () => {
    const target = recipients.find(r => r.id === previewId);
    if (!target) return '<p style="color:#000; padding:20px;">Valitse hahmo listasta esikatselua varten.</p>';
    
    // Käytetään esikatselussa joko oikeaa guestId:tä tai testi-merkkijonoa
    const previewLink = `https://jclub50.netlify.app/lippu/${target.guestId || 'ESIMERKKI-ID'}`;

    return htmlContent
      .replace(/{{name}}/g, target.guestName || 'Testi Vieras')
      .replace(/{{character}}/g, target.characterName)
      .replace(/{{ticket_link}}/g, previewLink);
  };

  if (loading && recipients.length === 0) return <div className="jc-spinner">Ladataan viestikeskusta...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--magenta)', paddingBottom: '10px' }}>
        <h2 style={{ color: 'var(--magenta)', margin: 0 }}>COMMS CENTER <span style={{fontSize:'0.6em', border:'1px solid var(--lime)', padding:'2px 5px', borderRadius:'4px', color:'var(--lime)', marginLeft:'10px'}}>SAFE MODE ON</span></h2>
      </div>

      {/* NAVIGIOINTI */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className={`jc-btn ${activeTab === 'recipients' ? '' : 'outline'}`} onClick={() => setActiveTab('recipients')}>👥 1. Valitse</button>
        <button className={`jc-btn ${activeTab === 'editor' ? '' : 'outline'}`} onClick={() => setActiveTab('editor')}>✏️ 2. Kirjoita</button>
        <button className={`jc-btn ${activeTab === 'preview' ? '' : 'outline'}`} onClick={() => setActiveTab('preview')}>👁️ 3. Esikatsele</button>
      </div>

      {/* VASTAANOTTAJAT */}
      {activeTab === 'recipients' && (
        <div className="jc-card fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--cream)' }}>
              <input type="checkbox" checked={showOnlyAssigned} onChange={e => setShowOnlyAssigned(e.target.checked)} style={{accentColor:'var(--magenta)'}} />
              Näytä vain roolitetut
            </label>
            <button onClick={toggleAll} className="jc-btn small outline">Valitse kaikki sallitut</button>
          </div>
          
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--cream)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--muted)', textAlign: 'left', color: 'var(--muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '10px' }}>VALINTA</th>
                  <th style={{ padding: '10px' }}>HAHMO / NÄYTTELIJÄ</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecipients.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: r.isAllowed ? 1 : 0.5 }}>
                    <td style={{ padding: '10px' }}>
                      {r.isAllowed ? (
                        <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelection(r.id)} style={{accentColor:'var(--turquoise)', transform:'scale(1.2)'}} />
                      ) : '🚫'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--turquoise)' }}>{r.characterName}</div>
                      <div style={{ fontSize: '0.85rem' }}>{r.guestName || '(Vapaa rooli)'}</div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontSize: '0.8rem' }}>{r.email || 'Ei osoitetta'}</div>
                      {!r.isAllowed && r.hasEmail && <div style={{ fontSize: '0.6rem', color: 'var(--magenta)' }}>SAFE MODE ESTÄÄ</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDITOR */}
      {activeTab === 'editor' && (
        <div className="jc-card fade-in">
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: 'var(--muted)', marginBottom: '5px' }}>Sähköpostin otsikko</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--muted)', color: '#fff', borderRadius: '4px' }} />
          </div>
          <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
             <button onClick={() => insertTag('{{name}}')} className="jc-btn small outline" style={{fontSize:'0.75rem'}}>+ Nimi</button>
             <button onClick={() => insertTag('{{character}}')} className="jc-btn small outline" style={{fontSize:'0.75rem'}}>+ Hahmo</button>
             <button onClick={() => insertTag('<a href="{{ticket_link}}">Lippusi tästä</a>')} className="jc-btn small outline" style={{fontSize:'0.75rem'}}>+ Linkki</button>
          </div>
          <textarea ref={editorRef} value={htmlContent} onChange={e => setHtmlContent(e.target.value)} style={{ width: '100%', height: '450px', background: '#050508', color: 'var(--lime)', fontFamily: 'monospace', padding: '15px', border: '1px solid var(--muted)', borderRadius: '4px', lineHeight: '1.4' }} />
        </div>
      )}

      {/* PREVIEW */}
      {activeTab === 'preview' && (
        <div className="jc-card fade-in">
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{color:'var(--muted)'}}>Esikatselu hahmolle:</label>
            <select className="jc-select" value={previewId || ''} onChange={e => setPreviewId(e.target.value)} style={{flex: 1}}>
              {recipients.filter(r => r.guestName).map(r => (
                <option key={r.id} value={r.id}>{r.characterName} ({r.guestName})</option>
              ))}
            </select>
          </div>
          <div style={{ border: '2px dashed var(--muted)', padding: '20px', background: '#fff', borderRadius: '8px', color: '#000', overflowX: 'auto' }}>
            <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
          </div>
          <div style={{ marginTop: '30px' }}>
            <button className="jc-btn primary" style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }} onClick={handleSend} disabled={loading}>
              {loading ? 'KÄSITTELEE...' : `🚀 LÄHETÄ ${selectedIds.size} VALITTUA VIESTIÄ`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}