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
    <div className={`jc-card ${isPending ? 'status-pending' : ''}`}>
      
      {/* INFO / VAROITUSLAATIKOT */}
      
      {isPending && (
        <div className="ca-notice pending ca-row">
          <Clock size={24} style={{flexShrink:0}} />
          <div>
            <strong>Viesti lähetetty</strong>
            <div style={{opacity:0.8}}>Odotamme vastausta järjestäjiltä. Saat tiedon kun asia on käsitelty.</div>
          </div>
        </div>
      )}

      {isResolved && (
        <div className="ca-notice resolved ca-row">
          <CheckCircle size={24} style={{flexShrink:0}} />
          <div>
            <strong>Asia käsitelty!</strong>
            <div style={{opacity:0.8}}>Admin on merkinnyt pyyntösi valmiiksi. Jos olet tyytyväinen, voit nyt hyväksyä hahmon.</div>
          </div>
        </div>
      )}

      {/* Normaalit huomiot (piilotetaan jos ollaan pending/resolved tilan säästämiseksi) */}
      {!isPending && !isResolved && (
        <>
          <div className="ca-meta">
            <Sparkles size={16} color="var(--turquoise)" />
            <span>Hahmot ovat tekoälyn generoimia fiktiivisiä rooleja hauskanpitoon, eikä niiden ole tarkoitus loukata. 
            Kaikki yhtäläisyydet todellisuuteen ovat sattumaa (tai algoritmin huumoria).</span>
          </div>

          {characterCount > 1 && (
            <div className="ca-notice warning ca-row">
              <Users size={24} style={{flexShrink:0}} />
              <div>
                <strong>Huomio pariskunnat!</strong>
                <div style={{opacity:0.8}}>Hallinnoit nyt molempia hahmoja. Jos painat "Hyväksy", lukitset molemmat itsellesi. 
                  Jos haluatte pelata erillisillä puhelimilla, tee <strong>Split</strong> sivun alareunasta <em>ennen</em> hyväksyntää.</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TOIMINNOT */}
      <div className="ca-center">
        {!isPending && (
           <h3 className="ca-title">{isResolved ? 'Oletko nyt valmis?' : 'Miltä hahmo vaikuttaa?'}</h3>
        )}

        {/* Päätoiminto (Hyväksy) - Piilossa vain jos Pending */}
        {!isPending && (
          <button 
            className="jc-btn primary" 
            style={{width:'100%', padding:'1rem', fontSize:'1.1rem'}}
            onClick={handleAccept}
            disabled={isSubmitting}
          >
            <ThumbsUp size={20} style={{marginRight:10}} /> 
            {characterCount > 1 ? 'Hyväksymme hahmot' : 'Hyväksyn hahmon'}
          </button>
        )}

        {/* Sivutoiminto (Kysy) */}
        <button 
          className="jc-btn ghost" 
          onClick={() => setViewState('writing')}
          disabled={isSubmitting}
          style={{fontSize:'0.9rem', color:'var(--muted)'}}
        >
          <MessageCircleQuestion size={16} style={{marginRight:5}} />
          {isPending ? 'Lähetä lisätietoa / uusi viesti' : 'Minulla on kysyttävää'}
        </button>
      </div>

    </div>
  );
};

export default CharacterAcceptance;