import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  HeroBlock, TicketBlock, InfoBlock, ListBlock, ImageBlock, 
  AgentBlock, ActionBlock, PointsBlock, PrivacyBlock,
  H1Block, H2Block, PBlock
} from './VisualBlocks';
import { renderBlockToHtml, assembleFullHtml } from './HtmlGenerator';
import TagPicker from './TagPicker';

export default function VisualEditor({ html, onChange, templateId, templateName: initialName, subject }) {
  const [blocks, setBlocks] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [localTemplateName, setLocalTemplateName] = useState(initialName || 'Uusi pohja');

  useEffect(() => { fetchGallery(); if (templateId) loadTemplate(); }, [templateId]);
  const fetchGallery = async () => { const { data } = await supabase.storage.from('messages').list(); setGallery(data || []); };
  const loadTemplate = async () => { const { data } = await supabase.from('email_templates').select('visual_blocks, name').eq('id', templateId).single(); if (data?.visual_blocks) { setBlocks(data.visual_blocks); setLocalTemplateName(data.name); } };

  const saveTemplate = async () => {
    try {
      setSaving(true);
      const finalHtml = assembleFullHtml(blocks.map(b => renderBlockToHtml(b)).join('\n'));
      const plainText = finalHtml.replace(/<[^>]*>/g, '').trim();
      await supabase.from('email_templates').upsert({ id: templateId || undefined, name: localTemplateName, subject: subject || 'Kutsu', body_html: finalHtml, body_text: plainText, visual_blocks: blocks, updated_at: new Date() });
      alert('Tallennettu!');
    } catch (e) { alert('Virhe: ' + e.message); } finally { setSaving(false); }
  };

  const updateMainHtml = (newBlocks) => { onChange(assembleFullHtml(newBlocks.map(b => renderBlockToHtml(b)).join('\n'))); };
  const addBlock = (type) => { const nb = { id: Date.now(), type, content: getDefaults(type) }; const u = [...blocks, nb]; setBlocks(u); updateMainHtml(u); };
  const updateBlock = (id, c) => { const u = blocks.map(b => b.id === id ? { ...b, content: { ...b.content, ...c } } : b); setBlocks(u); updateMainHtml(u); };
  const move = (index, d) => { const u = [...blocks]; const t = index + d; if (t >= 0 && t < u.length) { [u[index], u[t]] = [u[t], u[index]]; setBlocks(u); updateMainHtml(u); } };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: '15px' }}>
      <aside>
        <div className="jc-card">
          <input className="jc-input" style={{fontSize:'0.7rem', marginBottom:'10px'}} value={localTemplateName} onChange={e=>setLocalTemplateName(e.target.value)} />
          <button onClick={saveTemplate} className="jc-btn small primary" style={{width:'100%'}}>{saving ? '...' : '💾 TALLENNA'}</button>
        </div>
        <div className="jc-card">
          <h4 style={{ color: 'var(--turquoise)', fontSize: '0.6rem', marginBottom: '10px' }}>TEKSTIT</h4>
          <button onClick={() => addBlock('h1')} className="jc-btn small outline" style={{width:'100%', marginBottom:'4px'}}>H1 OTSikko</button>
          <button onClick={() => addBlock('h2')} className="jc-btn small outline" style={{width:'100%', marginBottom:'4px'}}>H2 ALAotsikko</button>
          <button onClick={() => addBlock('p')} className="jc-btn small outline" style={{width:'100%', marginBottom:'10px'}}>P LEIPÄteksti</button>
          
          <h4 style={{ color: 'var(--magenta)', fontSize: '0.6rem', marginBottom: '10px' }}>JÄRJESTELMÄ</h4>
          <button onClick={() => addBlock('ticket')} className="jc-btn small outline" style={{width:'100%', marginBottom:'4px'}}>🎟️ LIPPU</button>
          <button onClick={() => addBlock('agent')} className="jc-btn small outline" style={{width:'100%', marginBottom:'4px'}}>📱 AGENTTI</button>
          <button onClick={() => addBlock('action')} className="jc-btn small outline" style={{width:'100%', marginBottom:'10px'}}>📸 KYMPPIKUVA</button>

          <h4 style={{ color: '#555', fontSize: '0.6rem', marginBottom: '10px' }}>MUUT</h4>
          <button onClick={() => addBlock('info')} className="jc-btn small outline" style={{width:'100%', marginBottom:'4px'}}>📍 SIJAINTI</button>
          <button onClick={() => addBlock('list')} className="jc-btn small outline" style={{width:'100%', marginBottom:'4px'}}>🍴 LISTA</button>
          <button onClick={() => addBlock('points')} className="jc-btn small outline" style={{width:'100%', marginBottom:'4px'}}>🏆 PISTEET</button>
          <button onClick={() => addBlock('privacy')} className="jc-btn small outline" style={{width:'100%', marginBottom:'4px'}}>⚠️ PRIVACY</button>
          <button onClick={() => addBlock('image')} className="jc-btn small outline" style={{width:'100%'}}>🖼️ KUVA</button>
        </div>
        <TagPicker />
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {blocks.map((block, index) => (
          <div key={block.id} onClick={() => setActiveBlockId(block.id)} style={{ border: activeBlockId === block.id ? '2px solid var(--magenta)' : '1px solid #333', borderRadius: '14px', padding: '15px', background: '#0b0b10' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize:'0.6rem', color:'#444' }}>
               <span>{block.type.toUpperCase()}</span>
               <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={(e)=>{e.stopPropagation(); move(index, -1)}}>↑</button>
                  <button onClick={(e)=>{e.stopPropagation(); move(index, 1)}}>↓</button>
                  <button onClick={(e)=>{e.stopPropagation(); const f = blocks.filter(b=>b.id!==block.id); setBlocks(f); updateMainHtml(f);}} style={{color:'red'}}>✕</button>
               </div>
            </div>
            {block.type === 'h1' && <H1Block content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'h2' && <H2Block content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'p' && <PBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'ticket' && <TicketBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'agent' && <AgentBlock />}
            {block.type === 'action' && <ActionBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'points' && <PointsBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'privacy' && <PrivacyBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'info' && <InfoBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'list' && <ListBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'image' && <ImageBlock content={block.content} />}
            {block.type === 'hero' && <HeroBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
          </div>
        ))}
      </main>

      <aside className="jc-card">
         <h4 style={{fontSize:'0.7rem'}}>GALLERIA</h4>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '70vh', overflowY: 'auto' }}>
          {gallery.map(f => {
            const { data } = supabase.storage.from('messages').getPublicUrl(f.name);
            return (
              <img key={f.id} src={data.publicUrl} style={{ width: '100%', borderRadius: '4px', cursor: 'pointer', border: activeBlockId && blocks.find(b=>b.id===activeBlockId)?.content.url === data.publicUrl ? '2px solid var(--turquoise)' : '1px solid #333' }}
                onClick={() => { if (activeBlockId && blocks.find(x => x.id === activeBlockId)?.type === 'image') updateBlock(activeBlockId, { url: data.publicUrl }); }}
              />
            );
          })}
        </div>
      </aside>
    </div>
  );
}

const getDefaults = (t) => {
  if (t === 'h1') return { text: 'J:CLUB 50 PROTOKOLLA' };
  if (t === 'h2') return { text: 'YÖN AIKATAULU' };
  if (t === 'p') return { text: 'Tervetuloa juhlaan, jossa todellisuuden rajat hämärtyvät. Ole valmiina siirtymään uuteen aikaan.' };
  if (t === 'hero') return { title: 'J:CLUB 50', theme: 'Neon Gatsby', date: '14.12.2025' };
  if (t === 'agent') return {};
  if (t === 'action') return { title: 'LIVEWALL & CAM', body: 'Ota kuvia illan aikana, katso Kymppiseinää ja kerää pisteitä. Kaikki kuvat ovat julkisia.' };
  if (t === 'points') return { body: 'Illan aikana on käynnissä salainen peli. Voit kerätä pisteitä kuvaamalla, kommentoimalla ja olemalla aktiivinen.' };
  if (t === 'privacy') return { body: 'Kaikki Kymppikuva-toiminnolla otetut kuvat näkyvät livenä kaikille osallistujille Kymppiseinällä.' };
  if (t === 'ticket') return { label: 'SINUN ROOLISI' };
  if (t === 'info') return { location: 'Etelätie 3, Mikkeli', time: '17:00 - 04:00' };
  if (t === 'list') return { title: 'TARJOILU', items: 'Salakapakka Cocktails\nCyber-tapas Service\nNeon Gatsby Dinner' };
  if (t === 'image') return { url: '' };
  return {};
};