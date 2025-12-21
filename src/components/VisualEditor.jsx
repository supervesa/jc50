import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { HeroBlock, TicketBlock, TextBlock, ImageBlock, InfoBlock, ListBlock, ContactBlock } from './VisualBlocks';
import { renderBlockToHtml, assembleFullHtml } from './HtmlGenerator';
import TagPicker from './TagPicker';

export default function VisualEditor({ html, onChange, templateId, templateName: initialName, subject }) {
  const [blocks, setBlocks] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localTemplateName, setLocalTemplateName] = useState(initialName || 'Uusi visuaalinen pohja');

  // Ladataan galleria ja olemassa olevat palikat
  useEffect(() => {
    fetchGallery();
    if (templateId) {
      loadTemplateBlocks();
    }
  }, [templateId]);

  const fetchGallery = async () => {
    const { data } = await supabase.storage.from('messages').list();
    setGallery(data || []);
  };

  const loadTemplateBlocks = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('visual_blocks, name')
      .eq('id', templateId)
      .single();
    
    if (data && data.visual_blocks) {
      setBlocks(data.visual_blocks);
      setLocalTemplateName(data.name);
    }
  };

  // --- TALLENNUS SUPABASEEN (KORJATTU body_text) ---
  const saveTemplate = async () => {
    try {
      setSaving(true);
      
      // Generoidaan HTML
      const finalHtml = assembleFullHtml(blocks.map(b => renderBlockToHtml(b)).join('\n'));
      
      // Generoidaan pakollinen tekstiversio (body_text) poistamalla tagit
      const plainText = finalHtml
        .replace(/<style([\s\S]*?)<\/style>/gi, '') // Poistetaan tyylit
        .replace(/<[^>]*>/g, '') // Poistetaan tagit
        .replace(/&nbsp;/g, ' ')
        .trim();

      const { data, error } = await supabase
        .from('email_templates')
        .upsert({
          id: templateId || undefined,
          name: localTemplateName,
          subject: subject || 'J:CLUB 50 Kutsu',
          body_html: finalHtml,
          body_text: plainText, // TÄMÄ KORJAA VIRHEEN
          visual_blocks: blocks,
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;
      alert('Pohja tallennettu onnistuneesti!');
    } catch (e) {
      alert('Tallennus epäonnistui: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('messages').upload(fileName, file);
      if (error) throw error;
      fetchGallery();
    } catch (e) { alert('Virhe: ' + e.message); }
    finally { setUploading(false); }
  };

  const updateMainHtml = (newBlocks) => {
    const sections = newBlocks.map(b => renderBlockToHtml(b)).join('\n');
    onChange(assembleFullHtml(sections));
  };

  const addBlock = (type) => {
    const newBlock = { id: Date.now(), type, content: getDefaults(type) };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    updateMainHtml(updated);
  };

  const updateBlock = (id, newContent) => {
    const updated = blocks.map(b => b.id === id ? { ...b, content: { ...b.content, ...newContent } } : b);
    setBlocks(updated);
    updateMainHtml(updated);
  };

  const move = (index, delta) => {
    const updated = [...blocks];
    const target = index + delta;
    if (target < 0 || target >= updated.length) return;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setBlocks(updated);
    updateMainHtml(updated);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: '15px' }}>
      
      {/* VASEN: TYÖKALUT & TALLENNUS */}
      <aside>
        <div className="jc-card" style={{ height: 'fit-content', marginBottom: '15px' }}>
          <h4 style={{ color: 'var(--turquoise)', fontSize: '0.7rem', marginBottom: '10px' }}>TALLENNUS</h4>
          <input 
            className="jc-input" 
            style={{ fontSize: '0.8rem', marginBottom: '10px' }} 
            value={localTemplateName} 
            onChange={e => setLocalTemplateName(e.target.value)} 
            placeholder="Pohjan nimi"
          />
          <button 
            onClick={saveTemplate} 
            className="jc-btn small primary" 
            style={{ width: '100%' }}
            disabled={saving}
          >
            {saving ? 'TALLENNETAAN...' : '💾 TALLENNA POHJA'}
          </button>
        </div>

        <div className="jc-card" style={{ height: 'fit-content' }}>
          <h4 style={{ color: 'var(--turquoise)', fontSize: '0.7rem', marginBottom: '15px' }}>LISÄÄ KOMPONENTTI</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => addBlock('hero')} className="jc-btn small outline">🚀 HERO</button>
            <button onClick={() => addBlock('ticket')} className="jc-btn small outline">🎟️ LIPPU</button>
            <button onClick={() => addBlock('text')} className="jc-btn small outline">📝 TEKSTI</button>
            <button onClick={() => addBlock('info')} className="jc-btn small outline">📍 OSOITE/MAP</button>
            <button onClick={() => addBlock('list')} className="jc-btn small outline">🍴 BULLETIT</button>
            <button onClick={() => addBlock('contact')} className="jc-btn small outline">📧 TUKI</button>
            <button onClick={() => addBlock('image')} className="jc-btn small outline">🖼️ KUVA</button>
          </div>
        </div>
        <TagPicker />
      </aside>

      {/* KESKI: CANVAS */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {blocks.map((block, index) => (
          <div key={block.id} onClick={() => setActiveBlockId(block.id)} style={{ border: activeBlockId === block.id ? '2px solid var(--magenta)' : '1px solid #333', borderRadius: '14px', padding: '15px', background: '#0b0b10' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.6rem', color: '#555' }}>{block.type.toUpperCase()}</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={(e) => { e.stopPropagation(); move(index, -1); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); move(index, 1); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>↓</button>
                <button onClick={(e) => { e.stopPropagation(); const filtered = blocks.filter(b => b.id !== block.id); setBlocks(filtered); updateMainHtml(filtered); }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            {block.type === 'hero' && <HeroBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'ticket' && <TicketBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'text' && <TextBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'info' && <InfoBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'list' && <ListBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'contact' && <ContactBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'image' && <ImageBlock content={block.content} />}
          </div>
        ))}
        {blocks.length === 0 && <p style={{ textAlign: 'center', color: '#444', marginTop: '40px' }}>Aloita lisäämällä lohko vasemmalta.</p>}
      </main>

      {/* OIKEA: GALLERIA */}
      <aside className="jc-card">
        <h4 style={{ color: 'var(--magenta)', fontSize: '0.7rem' }}>GALLERIA</h4>
        <label className="jc-btn small primary" style={{ width: '100%', textAlign: 'center', cursor: 'pointer', display: 'block', marginBottom: '10px' }}>
          {uploading ? 'LADATAAN...' : '⬆ LATAA KUVA'}
          <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
          {gallery.map(f => {
            const { data } = supabase.storage.from('messages').getPublicUrl(f.name);
            return (
              <img key={f.id} src={data.publicUrl} style={{ width: '100%', borderRadius: '4px', cursor: 'pointer', border: activeBlockId && blocks.find(b=>b.id===activeBlockId)?.content.url === data.publicUrl ? '2px solid var(--turquoise)' : '1px solid #333' }}
                onClick={() => {
                  if (activeBlockId && blocks.find(x => x.id === activeBlockId)?.type === 'image') updateBlock(activeBlockId, { url: data.publicUrl });
                }}
              />
            );
          })}
        </div>
      </aside>
    </div>
  );
}

const getDefaults = (t) => {
  if (t === 'hero') return { title: 'J:CLUB 50', theme: 'Neon Gatsby', date: '14.12.2025' };
  if (t === 'text') return { title: 'Yön Protokolla', body: 'Tervetuloa...' };
  if (t === 'ticket') return { label: 'SINUN ROOLISI' };
  if (t === 'info') return { location: 'Etelätie 3, Mikkeli', time: '17:00 - 04:00', mapUrl: 'http://google.com/maps' };
  if (t === 'list') return { title: 'Tarjoilu', items: 'Cocktail Service\nCyber-tapas\nSalakapakka Special' };
  if (t === 'contact') return { title: 'Tuki / Support', email: 'support@jclub50.fi' };
  if (t === 'image') return { url: '' };
  return {};
};