import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, Reply } from 'lucide-react';

const FeedbackInbox = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchFeedbacks = async () => {
    setLoading(true);
    // Hakee: Palaute -> Vieras -> Hahmot (eksplisiittisellä joinilla)
    const { data, error } = await supabase
      .from('character_feedback')
      .select(`
        *,
        guests (
          id,
          name,
          email,
          characters!assigned_guest_id (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) setFeedbacks(data);
    else console.error("Virhe haettaessa viestejä:", error);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks();
    
    const channel = supabase.channel('inbox_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_feedback' }, () => {
        fetchFeedbacks();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const markResolved = async (id) => {
    await supabase.from('character_feedback').update({ status: 'resolved' }).eq('id', id);
    fetchFeedbacks();
  };

  // --- MAILTO GENERATOR ---
  const handleMailTo = (guest) => {
    if (!guest || !guest.email) {
      alert("Vieraalla ei ole sähköpostiosoitetta.");
      return;
    }

    const subject = encodeURIComponent("Neon Gatsby: Vastaus palautteeseesi");
    const body = encodeURIComponent(
      `Hei ${guest.name},\n\n` +
      `Kiitos yhteydenotostasi hahmoosi liittyen!\n\n` +
      `[KIRJOITA VASTAUS TÄHÄN]\n\n` +
      `Terveisin,\n` +
      `Jukka Club 50 - Pelinjohto 🕵️‍♂️✨`
    );

    window.location.href = `mailto:${guest.email}?subject=${subject}&body=${body}`;
  };

  const filtered = feedbacks.filter(f => {
    if (filter === 'pending') return f.status === 'pending_feedback';
    if (filter === 'accepted') return f.status === 'accepted';
    return true;
  });

  if (loading) return <div style={{padding:'20px', textAlign:'center'}}>Ladataan viestejä...</div>;

  return (
    <div className="jc-card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--cream)' }}>Saapuneet viestit ({feedbacks.length})</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={`jc-btn small ${filter==='all'?'primary':'outline'}`} onClick={()=>setFilter('all')}>Kaikki</button>
          <button className={`jc-btn small ${filter==='pending'?'primary':'outline'}`} onClick={()=>setFilter('pending')}>Kysymykset</button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
        <thead>
          <tr style={{ color: 'var(--muted)', fontSize: '0.8rem', borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>STATUS</th>
            <th>LÄHETTÄJÄ (HAHMO)</th>
            <th>VIESTI</th>
            <th>AIKA</th>
            <th style={{ textAlign: 'right' }}>TOIMINNOT</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => {
            const charNames = item.guests?.characters?.map(c => c.name).join(' & ') || 'Ei hahmoa';
            const guestName = item.guests?.name || 'Tuntematon';
            const isPending = item.status === 'pending_feedback';
            const isAccepted = item.status === 'accepted';

            return (
              <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '12px' }}>
                  {isAccepted && <span style={{color: 'var(--lime)', fontSize:'0.8rem'}}>✅ HYVÄKSYTTY</span>}
                  {isPending && <span style={{color: 'var(--sun)', fontSize:'0.8rem'}}>❓ KYSYMYS</span>}
                  {item.status === 'resolved' && <span style={{color: 'var(--muted)', fontSize:'0.8rem'}}>✔ KÄSITELTY</span>}
                </td>
                <td>
                  <strong style={{ color: 'var(--turquoise)' }}>{charNames}</strong><br/>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>{guestName}</span>
                </td>
                <td style={{ maxWidth: '300px', paddingRight:'20px' }}>
                  {item.message ? (
                    <div style={{ background: '#111', padding: '8px', borderRadius: '4px', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      "{item.message}"
                    </div>
                  ) : (
                    <span style={{ opacity: 0.3, fontSize: '0.8rem' }}>- Ei viestiä -</span>
                  )}
                </td>
                <td style={{ fontSize: '0.8rem', color: '#666' }}>
                  {new Date(item.created_at).toLocaleString('fi-FI')}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {isPending && (
                      <button 
                        className="jc-btn small outline" 
                        title="Merkitse käsitellyksi"
                        onClick={() => markResolved(item.id)}
                      >
                        <CheckCircle size={14} /> OK
                      </button>
                    )}
                    
                    {/* YKSINKERTAISTETTU MAILTO-NAPPI */}
                    <button 
                      className="jc-btn small secondary" 
                      title="Vastaa sähköpostilla"
                      onClick={() => handleMailTo(item.guests)}
                    >
                      <Reply size={14} /> Vastaa
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Ei viestejä.</div>}
    </div>
  );
};

export default FeedbackInbox;