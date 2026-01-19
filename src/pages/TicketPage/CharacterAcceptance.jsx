import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Sparkles, MessageCircleQuestion, ThumbsUp, X, Send, 
  Users, PartyPopper, Clock, CheckCircle 
} from 'lucide-react';

const CharacterAcceptance = ({ guestId, characterCount }) => {
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState('idle'); 
  const [savedStatus, setSavedStatus] = useState(null); 
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIIKKA (PÄIVITETTY HAKEMAAN UUSIN RIVI) ---
  useEffect(() => {
    if (!guestId) return;

    const fetchStatus = async () => {
      // MUUTOS: Haetaan aikajärjestyksessä uusin rivi (created_at descending),
      // jotta nähdään viimeisin tila, vaikka historiassa olisi vanhoja rivejä.
      const { data } = await supabase
        .from('character_feedback')
        .select('status')
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false }) // Uusin ensin
        .limit(1)
        .maybeSingle(); // Turvallisempi kuin .single() jos rivejä on nolla tai useita

      if (data) setSavedStatus(data.status);
      setLoading(false);
    };
    fetchStatus();

    // MUUTOS: Kuunnellaan kaikkia tapahtumia ('*'), eli myös INSERT.
    // Kun vieras lähettää uuden viestin, se on INSERT-tapahtuma.
    const channel = supabase.channel(`feedback:${guestId}`)
      .on(
        'postgres_changes', 
        { 
          event: '*', // Kuuntelee: INSERT, UPDATE, DELETE
          schema: 'public', 
          table: 'character_feedback', 
          filter: `guest_id=eq.${guestId}`
        }, 
        (payload) => {
          // Jos uusi rivi luodaan tai vanhaa päivitetään, otetaan uusi status talteen
          if (payload.new && payload.new.status) {
            setSavedStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [guestId]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    // Koska guest_id:llä ei ole unique-rajoitetta, tämä luo uuden rivin historiaan (mikä on ok).
    const { error } = await supabase.from('character_feedback').upsert({ guest_id: guestId, status: 'accepted', message: null });
    if (!error) { setSavedStatus('accepted'); setViewState('idle'); }
    setIsSubmitting(false);
  };

  const handleSendFeedback = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    // Tämä luo uuden rivin pinon päälle tilalla 'pending_feedback'
    const { error } = await supabase.from('character_feedback').upsert({ guest_id: guestId, status: 'pending_feedback', message: message });
    if (!error) { setSavedStatus('pending_feedback'); setViewState('idle'); setMessage(''); }
    setIsSubmitting(false);
  };

  if (loading) return null;

  // --- NÄKYMÄT ---

  // 1. HYVÄKSYTTY
  if (savedStatus === 'accepted') {
    return (
      <div className="jc-card status-accepted">
        <div className="ca-row">
          <PartyPopper size={32} color="var(--lime)" style={{flexShrink:0}} />
          <div>
            <h3 className="ca-title" style={{color:'var(--lime)'}}>Hahmo vahvistettu!</h3>
            <p className="ca-text">Olet valmis juhlaan. Nähdään pian!</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. KIRJOITUSTILA
  if (viewState === 'writing') {
    return (
      <div className="jc-card status-writing">
        <h3 className="jc-h2" style={{color:'var(--turquoise)', display:'flex', gap:'10px'}}>
          <MessageCircleQuestion /> Mikä mietityttää?
        </h3>
        <textarea
          className="jc-input"
          rows={4}
          placeholder="Kirjoita viestisi..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{marginBottom:'1rem'}}
        />
        <div style={{display:'flex', gap:'10px'}}>
          <button className="jc-btn outline" onClick={() => setViewState('idle')} disabled={isSubmitting}>
            <X size={18} /> Peruuta
          </button>
          <button className="jc-btn secondary" onClick={handleSendFeedback} disabled={isSubmitting || !message.trim()}>
             <Send size={18} style={{marginRight:5}}/> Lähetä
          </button>
        </div>
      </div>
    );
  }

  // 3. PERUSTILA (Idle / Pending / Resolved)
  const isPending = savedStatus === 'pending_feedback';
  const isResolved = savedStatus === 'resolved';

  return (
  <div className={`jc-card medium ${isPending ? 'status-pending' : ''}`} style={{ marginBottom: '2rem', position: 'relative' }}>
    
    {/* INFO / VAROITUSLAATIKOT - Yhtenäistetty AvecSplitCardin kanssa */}
    
    {isPending && (
      <div className="ca-notice pending ca-row" style={{ 
        background: 'rgba(212, 175, 55, 0.05)', 
        borderLeft: '4px solid var(--plasma-gold)',
        padding: '15px',
        borderRadius: '8px',
        display: 'flex',
        gap: '15px',
        marginBottom: '1.5rem'
      }}>
        <Clock size={24} color="var(--plasma-gold)" style={{flexShrink:0}} />
        <div>
          <strong style={{ color: 'var(--plasma-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Viesti lähetetty</strong>
          <div style={{ opacity: 0.8, fontSize: '0.9rem', color: 'var(--laser-white)' }}>
            Odotamme vastausta järjestäjiltä. Saat tiedon kun asia on käsitelty.
          </div>
        </div>
      </div>
    )}

    {isResolved && (
      <div className="ca-notice resolved ca-row" style={{ 
        background: 'rgba(0, 231, 255, 0.05)', 
        borderLeft: '4px solid var(--turquoise)',
        padding: '15px',
        borderRadius: '8px',
        display: 'flex',
        gap: '15px',
        marginBottom: '1.5rem'
      }}>
        <CheckCircle size={24} color="var(--turquoise)" style={{flexShrink:0}} />
        <div>
          <strong style={{ color: 'var(--turquoise)', textTransform: 'uppercase', letterSpacing: '1px' }}>Asia käsitelty!</strong>
          <div style={{ opacity: 0.8, fontSize: '0.9rem', color: 'var(--laser-white)' }}>
            Admin on merkinnyt pyyntösi valmiiksi. Jos olet tyytyväinen, voit nyt hyväksyä hahmon.
          </div>
        </div>
      </div>
    )}

    {/* Normaalit huomiot - Puhdistettu ja terävöitetty */}
    {!isPending && !isResolved && (
      <>
        <div className="ca-meta" style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '1.5rem', 
          padding: '12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Sparkles size={20} color="var(--plasma-gold)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: '1.4' }}>
            Hahmot ovat tekoälyn generoimia fiktiivisiä rooleja hauskanpitoon, eikä niiden ole tarkoitus loukata. 
            Kaikki yhtäläisyydet todellisuuteen ovat sattumaa (tai algoritmin huumoria).
          </span>
        </div>

        {characterCount > 1 && (
          <div className="ca-notice warning ca-row" style={{ 
            background: 'rgba(255, 0, 229, 0.05)', 
            borderLeft: '4px solid var(--magenta)',
            padding: '15px',
            borderRadius: '8px',
            display: 'flex',
            gap: '15px',
            marginBottom: '1.5rem',
            boxShadow: '0 0 20px rgba(255, 0, 229, 0.1)'
          }}>
            <Users size={24} color="var(--magenta)" style={{flexShrink:0}} />
            <div>
              <strong style={{ color: 'var(--magenta)', textTransform: 'uppercase', letterSpacing: '1px' }}>Huomio pariskunnat!</strong>
              <div style={{ opacity: 0.8, fontSize: '0.9rem', color: 'var(--laser-white)' }}>
                Hallinnoit nyt molempia hahmoja. Jos painat "Hyväksy", lukitset molemmat itsellesi. 
                Jos haluatte pelata erillisillä puhelimilla, tee <strong>Split</strong> sivun alareunasta <em>ennen</em> hyväksyntää.
              </div>
            </div>
          </div>
        )}
      </>
    )}

    {/* TOIMINNOT */}
    <div className="ca-center" style={{ textAlign: 'center' }}>
      {!isPending && (
         <h3 className="jc-h2" style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>
           {isResolved ? 'Oletko nyt valmis?' : 'Miltä hahmo vaikuttaa?'}
         </h3>
      )}

      {/* Päätoiminto (Hyväksy) */}
      {!isPending && (
        <button 
          className="jc-cta primary" 
          style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          onClick={handleAccept}
          disabled={isSubmitting}
        >
          <ThumbsUp size={22} /> 
          <span style={{ letterSpacing: '1px' }}>
            {characterCount > 1 ? 'Hyväksymme hahmot' : 'Hyväksyn hahmon'}
          </span>
        </button>
      )}

      {/* Sivutoiminto (Kysy) */}
      <button 
        className="jc-cta ghost" 
        onClick={() => setViewState('writing')}
        disabled={isSubmitting}
        style={{ width: '100%', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent' }}
      >
        <MessageCircleQuestion size={16} />
        {isPending ? 'LÄHETÄ LISÄTIETOA / UUSI VIESTI' : 'MINULLA ON KYSYTTÄVÄÄ'}
      </button>
    </div>

  </div>
);
};

export default CharacterAcceptance;