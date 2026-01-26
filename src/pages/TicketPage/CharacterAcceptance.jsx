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

  // --- 1. LOGIIKKA: STATUKSEN HAKU JA REALTIME-PÄIVITYS ---
  useEffect(() => {
    if (!guestId) return;

    const fetchStatus = async () => {
      // Haetaan uusin rivi, jotta nähdään feedback-syklin nykyinen vaihe
      const { data } = await supabase
        .from('character_feedback')
        .select('status')
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setSavedStatus(data.status);
      setLoading(false);
    };
    fetchStatus();

    // Kuunnellaan kaikkia muutoksia (INSERT ja UPDATE)
    const channel = supabase.channel(`feedback:${guestId}`)
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'character_feedback', 
          filter: `guest_id=eq.${guestId}`
        }, 
        (payload) => {
          if (payload.new && payload.new.status) {
            setSavedStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [guestId]);

  // --- 2. TOIMINNOT: HYVÄKSYNTÄ JA PALAUTE ---
  const handleAccept = async () => {
    setIsSubmitting(true);
    const { error } = await supabase.from('character_feedback').upsert({ 
      guest_id: guestId, 
      status: 'accepted', 
      message: null 
    });
    if (!error) { 
      setSavedStatus('accepted'); 
      setViewState('idle'); 
    }
    setIsSubmitting(false);
  };

  const handleSendFeedback = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    
    // Luodaan uusi rivi tilalla 'pending_feedback'
    const { error } = await supabase.from('character_feedback').insert({ 
      guest_id: guestId, 
      status: 'pending_feedback', 
      message: message 
    });

    if (!error) { 
      setSavedStatus('pending_feedback'); 
      setViewState('idle'); // TÄRKEÄ: Sulkee lomakkeen ja palauttaa päänäkymään
      setMessage(''); 
    } else {
      console.error("Lähetysvirhe:", error);
      alert("Viestin lähetys epäonnistui. Yritä uudelleen.");
    }
    setIsSubmitting(false);
  };

  if (loading) return null;

  // --- 3. NÄKYMÄT (Priorisoidaan statuksen mukaan) ---

  // A. HYVÄKSYTTY (Lopullinen tila)
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

  // B. KIRJOITUSTILA (Lomake auki)
  if (viewState === 'writing') {
    return (
      <div className="jc-card status-writing medium" style={{ marginBottom: '2rem' }}>
        <h3 className="jc-h2" style={{color:'var(--turquoise)', display:'flex', gap:'10px', alignItems: 'center'}}>
          <MessageCircleQuestion /> Mikä mietityttää?
        </h3>
        <textarea
          className="jc-input"
          rows={4}
          placeholder="Kirjoita viestisi..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ 
            width: '100%', 
            marginBottom: '1rem', 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '10px',
            borderRadius: '8px'
          }}
        />
        <div style={{display:'flex', gap:'10px'}}>
          <button className="jc-cta ghost" onClick={() => setViewState('idle')} disabled={isSubmitting} style={{ flex: 1 }}>
            <X size={18} /> Peruuta
          </button>
          <button className="jc-cta primary" onClick={handleSendFeedback} disabled={isSubmitting || !message.trim()} style={{ flex: 2 }}>
             <Send size={18} style={{marginRight:5}}/> Lähetä
          </button>
        </div>
      </div>
    );
  }

  // C. PERUSTILA (Idle / Pending / Resolved)
  const isPending = savedStatus === 'pending_feedback';
  const isResolved = savedStatus === 'resolved';

  return (
    <div className={`jc-card medium ${isPending ? 'status-pending' : ''}`} style={{ marginBottom: '2rem', position: 'relative' }}>
      
      {/* INFO / VAROITUSLAATIKOT */}
      
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

      {/* Normaalit huomiot (piilotetaan vain pending-tilassa tilan säästämiseksi) */}
      {!isPending && (
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
                <strong style={{ color: 'var(--magenta)', textTransform: 'uppercase', letterSpacing: '1px' }}>Huomio seuralaiset!</strong>
                <div style={{ opacity: 0.8, fontSize: '0.9rem', color: 'var(--laser-white)' }}>
                  Hallinnoit nyt molempia hahmoja. Jos painat "Hyväksy", lukitset molemmat itsellesi. 
                  Jos haluatte pelata erillisillä puhelimilla, <strong>Eriytä hahmot</strong> <em>ennen</em> hyväksyntää.
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TOIMINNOT */}
      <div className="ca-center" style={{ textAlign: 'center' }}>
        
        {/* Hyväksy-painike näkyy vain jos viestiä ei ole odottamassa (isPending) */}
        {!isPending && (
          <>
            <h3 className="jc-h2" style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>
              {isResolved ? 'Oletko nyt valmis?' : 'Miltä hahmo vaikuttaa?'}
            </h3>
            
            <button 
              className="jc-cta primary" 
              style={{ 
                width: '100%', 
                padding: '1.2rem', 
                fontSize: '1.1rem', 
                marginBottom: '1rem', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '10px' 
              }}
              onClick={handleAccept}
              disabled={isSubmitting}
            >
              <ThumbsUp size={22} /> 
              <span style={{ letterSpacing: '1px' }}>
                {characterCount > 1 ? 'Hyväksymme hahmot' : 'Hyväksyn hahmon'}
              </span>
            </button>
          </>
        )}

        {/* Kysy-painike: 
            - Piilotetaan kokonaan jos isPending (vain yksi viesti kerrallaan).
            - Näkyy jos isIdle tai isResolved.
        */}
        {!isPending && (
          <button 
            className="jc-cta ghost" 
            onClick={() => setViewState('writing')}
            disabled={isSubmitting}
            style={{ 
              width: '100%', 
              fontSize: '0.85rem', 
              color: 'var(--muted)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px', 
              border: 'none', 
              background: 'transparent' 
            }}
          >
            <MessageCircleQuestion size={16} />
            {isResolved ? 'MINULLA ON VIELÄ KYSYTTÄVÄÄ' : 'MINULLA ON KYSYTTÄVÄÄ'}
          </button>
        )}

        {/* Jos odotetaan vastausta, näytetään vain ohjeteksti painikkeen sijaan */}
        {isPending && (
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
            Toiminto lukittu, kunnes HQ vastaa viestiisi.
          </div>
        )}
      </div>

    </div>
  );
};

export default CharacterAcceptance;