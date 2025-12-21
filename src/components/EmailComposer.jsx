import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const SAFE_MODE_EMAILS = [
  import.meta.env.VITE_ADMIN_EMAIL_1,
  import.meta.env.VITE_ADMIN_EMAIL_2
];

export default function EmailComposer() {
  const [activeTab, setActiveTab] = useState('recipients');
  const [loading, setLoading] = useState(true);
  
  const [recipients, setRecipients] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [templates, setTemplates] = useState([]);
  
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [templateName, setTemplateName] = useState('Uusi viestipohja');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(true);
  
  const editorRef = useRef(null);
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: chars } = await supabase
        .from('characters')
        .select('id, name, pre_assigned_email, assigned_guest_id, guests:assigned_guest_id(name, email, spouse_name)')
        .order('name');

      const { data: tmpls } = await supabase.from('email_templates').select('*').order('name');

      const processed = chars?.map(char => {
        const guestData = Array.isArray(char.guests) ? char.guests[0] : char.guests;
        const email = char.pre_assigned_email || guestData?.email;
        return {
          id: char.id,
          characterName: char.name || 'Nimetön',
          guestName: guestData?.name || 'Ei nimeä',
          email: email,
          isAllowed: email && SAFE_MODE_EMAILS.includes(email.toLowerCase().trim())
        };
      }) || [];

      setRecipients(processed);
      setTemplates(tmpls || []);
      
      if (tmpls?.length > 0 && !currentTemplateId) {
        applyTemplate(tmpls[0]);
      }
      
      if (processed.length > 0) setPreviewId(processed[0].id);
    } catch (err) {
      console.error("Datahaku epäonnistui:", err);
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
    setTextContent(tmpl.body_text);
    setAutoSync(false);
  };

  const handleHtmlChange = (val) => {
    setHtmlContent(val);
    if (autoSync) {
      let text = val
        .replace(/<p[^>]*>/g, '\n')
        .replace(/<\/p>/g, '')
        .replace(/<br[^>]*>/g, '\n')
        .replace(/<a href="([^"]+)">([^<]+)<\/a>/g, '$2 ($1)')
        .replace(/<[^>]*>/g, '');
      setTextContent(text.trim());
    }
  };

  const handleSend = async () => {
    const targets = Array.from(selectedIds);
    if (targets.length === 0) return alert('Valitse vastaanottajat.');
    if (!currentTemplateId) return alert('Valitse tai tallenna viestipohja ensin.');
    
    if (!confirm(`Lähetetään ${targets.length} viestiä?`)) return;

    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characterIds: targets, 
          subject, 
          htmlTemplate: htmlContent, 
          textTemplate: textContent,
          templateId: currentTemplateId 
        })
      });

      const result = await response.json();
      if (response.ok) {
        alert('Lähetys suoritettu! Tarkista lokit.');
      } else {
        alert('Virhe: ' + result.error);
      }
    } catch (err) {
      alert('Lähetys epäonnistui. Onko Netlify dev päällä?');
    } finally {
      setLoading(false);
    }
  };

  const insertTag = (tag) => {
    const t = editorRef.current;
    if (!t) return;
    const start = t.selectionStart;
    const end = t.selectionEnd;
    const newText = htmlContent.substring(0, start) + tag + htmlContent.substring(end);
    handleHtmlChange(newText);
  };

  if (loading && recipients.length === 0) return <div className="jc-spinner">Ladataan järjestelmää...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className={`jc-btn ${activeTab === 'recipients' ? '' : 'outline'}`} onClick={() => setActiveTab('recipients')}>👥 1. Vastaanottajat</button>
        <button className={`jc-btn ${activeTab === 'editor' ? '' : 'outline'}`} onClick={() => setActiveTab('editor')}>✏️ 2. Viesti</button>
        <button className={`jc-btn ${activeTab === 'preview' ? '' : 'outline'}`} onClick={() => setActiveTab('preview')}>👁️ 3. Esikatselu</button>
      </div>

      {activeTab === 'recipients' && (
        <div className="jc-card fade-in">
           <div style={{marginBottom:'15px'}}>
             <label style={{color:'var(--cream)', cursor:'pointer'}}><input type="checkbox" checked={showOnlyAssigned} onChange={e => setShowOnlyAssigned(e.target.checked)} /> Näytä vain roolitetut</label>
           </div>
           <table style={{width:'100%', color:'#fff', borderCollapse:'collapse'}}>
             <thead>
               <tr style={{textAlign:'left', color:'var(--muted)', fontSize:'0.8rem', borderBottom:'1px solid #333'}}>
                 <th style={{padding:'10px'}}>VALITSE</th>
                 <th>HAHMO / VIERAS</th>
                 <th>OSOITE</th>
               </tr>
             </thead>
             <tbody>
               {recipients.filter(r => showOnlyAssigned ? !!r.guestName : true).map(r => (
                 <tr key={r.id} style={{opacity: r.isAllowed ? 1 : 0.4, borderBottom:'1px solid #222'}}>
                   <td style={{padding:'10px'}}>
                     {r.isAllowed ? <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => {
                       const n = new Set(selectedIds);
                       if (n.has(r.id)) n.delete(r.id); else n.add(r.id);
                       setSelectedIds(n);
                     }} /> : '🚫'}
                   </td>
                   <td><strong>{r.characterName}</strong><br/><small>{r.guestName}</small></td>
                   <td>{r.email || 'Puuttuu'}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="jc-card fade-in">
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', marginBottom:'20px'}}>
            <select className="jc-select" value={currentTemplateId || ''} onChange={(e) => applyTemplate(templates.find(t => t.id === e.target.value))}>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={() => {
              const name = prompt("Pohjan nimi?", templateName);
              if (name) supabase.from('email_templates').insert({ name, subject, body_html: htmlContent, body_text: textContent }).then(() => fetchInitialData());
            }} className="jc-btn outline">Tallenna uutena</button>
          </div>

          <label style={{fontSize:'0.7rem', color:'var(--muted)'}}>AIHE:</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={{width:'100%', padding:'10px', background:'#000', color:'#fff', border:'1px solid #333', marginBottom:'15px'}} />

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
            <div>
              <div style={{display:'flex', gap:'5px', marginBottom:'5px'}}>
                <button onClick={() => insertTag('{{name}}')} className="jc-btn small outline">Nimi</button>
                <button onClick={() => insertTag('{{character}}')} className="jc-btn small outline">Hahmo</button>
                <button onClick={() => insertTag('{{ticket_link}}')} className="jc-btn small outline">Lippu</button>
                <button onClick={() => insertTag('{{browser_link}}')} className="jc-btn small outline" style={{borderColor:'var(--turquoise)'}}>Selainlinkki</button>
              </div>
              <textarea ref={editorRef} value={htmlContent} onChange={e => handleHtmlChange(e.target.value)} style={{width:'100%', height:'400px', background:'#050508', color:'var(--lime)', padding:'10px', fontFamily:'monospace'}} />
            </div>
            <div>
               <div style={{marginBottom:'5px', fontSize:'0.8rem', color:'var(--muted)'}}>
                 <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} /> Auto-sync teksti
               </div>
               <textarea value={textContent} onChange={e => { setTextContent(e.target.value); setAutoSync(false); }} style={{width:'100%', height:'400px', background:'#0a0a0c', color:'#aaa', padding:'10px'}} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="jc-card fade-in">
          <div style={{background:'#fff', padding:'25px', color:'#000', borderRadius:'8px', minHeight:'300px'}}>
             <div dangerouslySetInnerHTML={{ __html: htmlContent.replace(/{{name}}/g, 'Esimerkki Vieras').replace(/{{character}}/g, 'Esimerkki Hahmo').replace(/{{ticket_link}}/g, '#').replace(/{{browser_link}}/g, '#') }} />
          </div>
          <button className="jc-btn primary" style={{width:'100%', marginTop:'20px', padding:'25px'}} onClick={handleSend} disabled={loading}>
            {loading ? 'LÄHETETÄÄN...' : `🚀 LÄHETÄ ${selectedIds.size} VIESTIÄ`}
          </button>
        </div>
      )}
    </div>
  );
}