import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import AIAssistant from './AIAssistant/AIAssistant';
import { 
  HeroBlock, TicketBlock, InfoBlock, ListBlock, ImageBlock, 
  AgentBlock, ActionBlock, PointsBlock, PrivacyBlock, ContactBlock,
  H1Block, H2Block, PBlock 
} from './VisualBlocks';
import { renderBlockToHtml, assembleFullHtml } from './HtmlGenerator';
import TagPicker from './TagPicker';

export default function VisualEditor({ html, onChange, templateId, templateName: initialName, subject, selectedCharacter }) {
  const [blocks, setBlocks] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localTemplateName, setLocalTemplateName] = useState(initialName || 'Uusi visuaalinen pohja');

  // Ladataan galleria ja olemassa oleva pohja jos templateId on annettu
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

  // --- TALLENNUS SUPABASEEN ---
  const saveTemplate = async () => {
    try {
      setSaving(true);
      
      // Generoidaan lopullinen HTML
      const finalHtml = assembleFullHtml(blocks.map(b => renderBlockToHtml(b)).join('\n'));
      
      // Generoidaan puhdas tekstiversio (body_text) riisumalla HTML-tagit
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
          subject: subject || 'J:CLUB 50 Tiedonanto',
          body_html: finalHtml,
          body_text: plainText,
          visual_blocks: blocks, // Tallennetaan palikat JSON-muodossa muokkausta varten
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;
      alert('Pohja tallennettu onnistuneesti Järjestelmään!');
    } catch (e) {
      alert('Tallennus epäonnistui: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  // AI-AVUSTAJAN TUOTTAMAN TEKSTIN KÄSITTELY
  const handleAiGenerated = (text) => {
    const newBlock = { 
      id: Date.now(), 
      type: 'p', 
      content: { text: text } 
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    updateMainHtml(updated);
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
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '15px' }}>
      
      {/* VASEN: TYÖKALUT & AI */}
      <aside>
        <div className="jc-card" style={{ marginBottom: '15px' }}>
          <h4 style={{ color: 'var(--turquoise)', fontSize: '0.6rem', marginBottom: '10px' }}>TALLENNUS</h4>
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

        <div style={{ marginBottom: '15px' }}>
          <AIAssistant 
            onGenerated={handleAiGenerated} 
            selectedCharacter={selectedCharacter} 
          />
        </div>

        <div className="jc-card">
          <h4 style={{ color: 'var(--turquoise)', fontSize: '0.6rem', marginBottom: '15px' }}>TEKSTIELEMENTIT</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
            <button onClick={() => addBlock('h1')} className="jc-btn small outline">H1 PÄÄOTSIKKO</button>
            <button onClick={() => addBlock('h2')} className="jc-btn small outline">H2 ALAOTSIKKO</button>
            <button onClick={() => addBlock('p')} className="jc-btn small outline">P LEIPÄTEKSTI</button>
          </div>

          <h4 style={{ color: 'var(--magenta)', fontSize: '0.6rem', marginBottom: '15px' }}>ERIKOISLOHKOT</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
            <button onClick={() => addBlock('ticket')} className="jc-btn small outline">🎟️ LIPPU-KORTTI</button>
            <button onClick={() => addBlock('agent')} className="jc-btn small outline">📱 AGENTTI-NAPPI</button>
            <button onClick={() => addBlock('action')} className="jc-btn small outline">📸 KYMPPIKUVA</button>
            <button onClick={() => addBlock('points')} className="jc-btn small outline">🏆 PISTEJAHTI</button>
            <button onClick={() => addBlock('privacy')} className="jc-btn small outline">⚠️ YKSITYISYYS</button>
          </div>

          <h4 style={{ color: '#555', fontSize: '0.6rem', marginBottom: '15px' }}>MUUT</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button onClick={() => addBlock('hero')} className="jc-btn small outline">🚀 HERO-OTSIKKO</button>
            <button onClick={() => addBlock('info')} className="jc-btn small outline">📍 SIJAINTI/AIKA</button>
            <button onClick={() => addBlock('list')} className="jc-btn small outline">🍴 LISTA / MENU</button>
            <button onClick={() => addBlock('contact')} className="jc-btn small outline">📧 TUKI / EMAIL</button>
            <button onClick={() => addBlock('image')} className="jc-btn small outline">🖼️ KUVA</button>
          </div>
        </div>
        <TagPicker />
      </aside>

      {/* KESKI: CANVAS */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {blocks.map((block, index) => (
          <div 
            key={block.id} 
            onClick={() => setActiveBlockId(block.id)} 
            style={{ 
              border: activeBlockId === block.id ? '2px solid var(--magenta)' : '1px solid #333', 
              borderRadius: '14px', 
              padding: '15px', 
              background: '#0b0b10',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--turquoise)', fontWeight: 'bold' }}>{block.type.toUpperCase()}</span>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={(e) => { e.stopPropagation(); move(index, -1); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); move(index, 1); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>↓</button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const filtered = blocks.filter(b => b.id !== block.id); 
                    setBlocks(filtered); 
                    updateMainHtml(filtered); 
                  }} 
                  style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Renderöidään oikea lohko tyypin perusteella */}
            {block.type === 'h1' && <H1Block content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'h2' && <H2Block content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'p' && <PBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'hero' && <HeroBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'ticket' && <TicketBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'agent' && <AgentBlock />}
            {block.type === 'action' && <ActionBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'points' && <PointsBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'privacy' && <PrivacyBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'info' && <InfoBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'list' && <ListBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'contact' && <ContactBlock content={block.content} onUpdate={(c) => updateBlock(block.id, c)} />}
            {block.type === 'image' && <ImageBlock content={block.content} />}
          </div>
        ))}
        {blocks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#444', marginTop: '100px', border: '2px dashed #222', padding: '40px', borderRadius: '20px' }}>
            <p>Canvas on tyhjä. Aloita lisäämällä komponentteja vasemmalta tai käytä Vesa-avustajaa.</p>
          </div>
        )}
      </main>

      {/* OIKEA: GALLERIA */}
      <aside className="jc-card" style={{ height: 'fit-content', position: 'sticky', top: '20px' }}>
        <h4 style={{ color: 'var(--magenta)', fontSize: '0.7rem', marginBottom: '15px' }}>KUVA-ARKISTO</h4>
        <label className="jc-btn small primary" style={{ width: '100%', textAlign: 'center', cursor: 'pointer', display: 'block', marginBottom: '15px' }}>
          {uploading ? 'SIIRRETÄÄN...' : '⬆ LATAA UUSI KUVA'}
          <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '5px' }}>
          {gallery.map(f => {
            const { data } = supabase.storage.from('messages').getPublicUrl(f.name);
            return (
              <img 
                key={f.id} 
                src={data.publicUrl} 
                style={{ 
                  width: '100%', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  border: activeBlockId && blocks.find(b=>b.id===activeBlockId)?.content.url === data.publicUrl ? '2px solid var(--turquoise)' : '1px solid #222',
                  transition: '0.2s'
                }}
                onClick={() => {
                  if (activeBlockId && blocks.find(x => x.id === activeBlockId)?.type === 'image') {
                    updateBlock(activeBlockId, { url: data.publicUrl });
                  }
                }}
              />
            );
          })}
        </div>
      </aside>
    </div>
  );
}

// OLETUSARVOT UUSILLE LOHKOILLE
const getDefaults = (t) => {
  if (t === 'h1') return { text: 'J:CLUB 50 PROTOKOLLA' };
  if (t === 'h2') return { text: 'YÖN AIKATAULU' };
  if (t === 'p') return { text: 'Tervetuloa juhlaan, jossa todellisuuden rajat hämärtyvät. Ole valmiina siirtymään uuteen aikaan.' };
  if (t === 'hero') return { title: 'J:CLUB 50', theme: 'Neon Gatsby', date: '14.12.2025' };
  if (t === 'agent') return {};
  if (t === 'action') return { title: 'LIVEWALL & CAM', body: 'Ota kuvia illan aikana, katso Kymppiseinää ja kerää pisteitä. Kaikki otetut kuvat ovat julkisia.' };
  if (t === 'points') return { body: 'Illan aikana on käynnissä salainen peli. Voit kerätä pisteitä kuvaamalla, kommentoimalla ja olemalla aktiivinen.' };
  if (t === 'privacy') return { body: 'Kaikki Kymppikuva-toiminnolla otetut kuvat näkyvät livenä kaikille osallistujille Kymppiseinällä.' };
  if (t === 'ticket') return { label: 'SINUN ROOLISI' };
  if (t === 'info') return { location: 'Etelätie 3, Mikkeli', time: '17:00 - 04:00' };
  if (t === 'list') return { title: 'TARJOILU', items: 'Salakapakka Cocktails\nCyber-tapas Service\nNeon Gatsby Dinner' };
  if (t === 'contact') return { title: 'TUKI / SUPPORT', email: 'support@jclub50.fi' };
  if (t === 'image') return { url: '' };
  return {};
};