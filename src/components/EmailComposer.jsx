import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const SAFE_MODE_EMAILS = ['vesa.nessling@gmail.com', 'saikkonen.jukka@outlook.com', 'ilona.nessling@gmail.com'];

export default function EmailComposer() {
  const [activeTab, setActiveTab] = useState('recipients');
  const [loading, setLoading] = useState(true);
  
  // DATA
  const [recipients, setRecipients] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [templates, setTemplates] = useState([]);
  
  // EDITOR STATE
  const [currentTemplateId, setCurrentTemplateId] = useState(null); // Seurataan muokattavaa pohjaa
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
    const { data: chars } = await supabase.from('characters').select('id, name, pre_assigned_email, assigned_guest_id, guests:assigned_guest_id(name, email)').order('name');
    const { data: tmpls } = await supabase.from('email_templates').select('*').order('name');

    const processed = chars?.map(char => {
      const email = char.pre_assigned_email || char.guests?.email;
      return {
        id: char.id,
        characterName: char.name || 'Nimetön',
        guestName: char.guests?.name,
        guestId: char.assigned_guest_id,
        email: email,
        isAllowed: email && SAFE_MODE_EMAILS.includes(email.toLowerCase().trim())
      };
    }) || [];

    setRecipients(processed);
    setTemplates(tmpls || []);
    
    // Valitaan oletuksena ensimmäinen templaatti jos niitä on
    if (tmpls && tmpls.length > 0 && !currentTemplateId) {
      applyTemplate(tmpls[0]);
    }
    
    if (processed.length > 0) setPreviewId(processed[0].id);
    setLoading(false);
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

  // --- TEMPLAATTIEN HALLINTA ---
  
  const saveAsNewTemplate = async () => {
    const name = prompt("Anna uudelle viestipohjalle nimi:", templateName);
    if (!name) return;

    const { data, error } = await supabase.from('email_templates').insert({
      name: name,
      subject: subject,
      body_html: htmlContent,
      body_text: textContent
    }).select().single();

    if (error) alert("Virhe tallennuksessa: " + error.message);
    else {
      alert("Tallennettu uutena pohjana!");
      fetchInitialData();
      setCurrentTemplateId(data.id);
    }
  };

  const updateSelectedTemplate = async () => {
    if (!currentTemplateId) return alert("Valitse ensin pohja jota haluat päivittää.");
    
    const { error } = await supabase.from('email_templates').update({
      name: templateName,
      subject: subject,
      body_html: htmlContent,
      body_text: textContent
    }).eq('id', currentTemplateId);

    if (error) alert("Virhe päivityksessä: " + error.message);
    else alert("Viestipohja päivitetty onnistuneesti!");
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
    if (!confirm(`Lähetetään ${targets.length} viestiä?`)) return;

    setLoading(true);
    try {
      await fetch('/.netlify/functions/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterIds: targets, subject, htmlTemplate: htmlContent, textTemplate: textContent })
      });
      alert('Lähetys valmis!');
    } catch (err) {
      alert('Virhe lähetyksessä!');
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

  if (loading && recipients.length === 0) return <div className="jc-spinner">Ladataan...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '100px' }}>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className={`jc-btn ${activeTab === 'recipients' ? '' : 'outline'}`} onClick={() => setActiveTab('recipients')}>👥 1. Vastaanottajat</button>
        <button className={`jc-btn ${activeTab === 'editor' ? '' : 'outline'}`} onClick={() => setActiveTab('editor')}>✏️ 2. Editori</button>
        <button className={`jc-btn ${activeTab === 'preview' ? '' : 'outline'}`} onClick={() => setActiveTab('preview')}>👁️ 3. Esikatselu</button>
      </div>

      {activeTab === 'recipients' && (
        <div className="jc-card fade-in">
           <div style={{marginBottom:'15px'}}>
             <label style={{color:'var(--cream)', cursor:'pointer'}}><input type="checkbox" checked={showOnlyAssigned} onChange={e => setShowOnlyAssigned(e.target.checked)} /> Näytä vain roolitetut</label>
           </div>
           <div style={{maxHeight:'60vh', overflowY:'auto'}}>
             <table style={{width:'100%', color:'#fff', borderCollapse:'collapse'}}>
               <thead>
                 <tr style={{textAlign:'left', color:'var(--muted)', fontSize:'0.8rem', borderBottom:'1px solid #333'}}>
                   <th style={{padding:'10px'}}>LÄHETÄ</th>
                   <th>HAHMO</th>
                   <th>OSOITE</th>
                 </tr>
               </thead>
               <tbody>
                 {recipients.filter(r => showOnlyAssigned ? !!r.guestName : true).map(r => (
                   <tr key={r.id} style={{opacity: r.isAllowed ? 1 : 0.4, borderBottom:'1px solid #222'}}>
                     <td style={{padding:'10px'}}>{r.isAllowed ? <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => {
                       const n = new Set(selectedIds);
                       if (n.has(r.id)) n.delete(r.id); else n.add(r.id);
                       setSelectedIds(n);
                     }} style={{accentColor:'var(--magenta)'}} /> : '🚫'}</td>
                     <td><strong>{r.characterName}</strong><br/><small style={{color:'var(--muted)'}}>{r.guestName || 'Ei näyttelijää'}</small></td>
                     <td style={{fontSize:'0.9rem'}}>{r.email || '-'}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="jc-card fade-in">
          
          {/* TEMPLAATIN VALINTA JA TALLENNUS */}
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', marginBottom:'25px', padding:'20px', background:'rgba(255,255,255,0.03)', borderRadius:'8px', border:'1px solid #333'}}>
            <div>
              <label style={{fontSize:'0.7rem', color:'var(--muted)'}}>VALITTU POHJA:</label>
              <select className="jc-select" value={currentTemplateId || ''} onChange={(e) => applyTemplate(templates.find(t => t.id === e.target.value))}>
                <option value="" disabled>--- Valitse tallennettu pohja ---</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{display:'flex', alignItems:'flex-end', gap:'10px'}}>
              <button onClick={updateSelectedTemplate} className="jc-btn small outline" style={{flex:1}}>Päivitä</button>
              <button onClick={saveAsNewTemplate} className="jc-btn small outline" style={{flex:1, borderColor:'var(--lime)', color:'var(--lime)'}}>Tallenna uusi</button>
            </div>
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{color:'var(--muted)', fontSize:'0.8rem'}}>POHJAN NIMI (VAIN ADMIN):</label>
            <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} style={{width:'100%', padding:'10px', background:'#111', color:'#fff', border:'1px solid #333', marginTop:'5px'}} />
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{color:'var(--muted)', fontSize:'0.8rem'}}>SÄHKÖPOSTIN AIHE (SUBJECT):</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={{width:'100%', padding:'12px', background:'#000', color:'#fff', border:'1px solid var(--muted)', marginTop:'5px'}} />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                <label style={{color:'var(--magenta)', fontWeight:'bold'}}>HTML</label>
                <div style={{display:'flex', gap:'5px'}}>
                  <button onClick={() => insertTag('{{name}}')} className="jc-btn small outline">Nimi</button>
                  <button onClick={() => insertTag('{{character}}')} className="jc-btn small outline">Hahmo</button>
                  <button onClick={() => insertTag('{{ticket_link}}')} className="jc-btn small outline">Linkki</button>
                </div>
              </div>
              <textarea ref={editorRef} value={htmlContent} onChange={e => handleHtmlChange(e.target.value)} style={{width:'100%', height:'400px', background:'#050508', color:'var(--lime)', padding:'15px', fontFamily:'monospace', border:'1px solid #444'}} />
            </div>

            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                <label style={{color:'var(--turquoise)', fontWeight:'bold'}}>TEKSTI (FALLBACK)</label>
                <label style={{fontSize:'0.7rem', color:'var(--muted)', cursor:'pointer'}}>
                  <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} /> Auto-sync
                </label>
              </div>
              <textarea value={textContent} onChange={e => { setTextContent(e.target.value); setAutoSync(false); }} style={{width:'100%', height:'400px', background:'#0a0a0c', color:'#aaa', padding:'15px', border:'1px solid #444'}} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="jc-card fade-in">
          <div style={{marginBottom:'15px'}}>
            <label>Esikatsele hahmolle:</label>
            <select className="jc-select" value={previewId || ''} onChange={e => setPreviewId(e.target.value)} style={{marginLeft:'10px'}}>
              {recipients.filter(r => r.guestName).map(r => <option key={r.id} value={r.id}>{r.characterName}</option>)}
            </select>
          </div>
          <div style={{background:'#fff', padding:'30px', color:'#000', borderRadius:'8px', minHeight:'300px'}}>
             <div dangerouslySetInnerHTML={{ __html: htmlContent.replace(/{{name}}/g, 'Testi Vieras').replace(/{{character}}/g, 'Testi Hahmo').replace(/{{ticket_link}}/g, '#') }} />
          </div>
          <button className="jc-btn primary" style={{width:'100%', marginTop:'30px', padding:'25px', fontSize:'1.2rem'}} onClick={handleSend} disabled={loading}>
            {loading ? 'KÄSITELLÄÄN...' : `🚀 LÄHETÄ ${selectedIds.size} VIESTIÄ`}
          </button>
        </div>
      )}
    </div>
  );
}