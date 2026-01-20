import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Zap, Trophy, Mail, 
  Users, Wine, CheckCircle2, AlertCircle, ShieldCheck, Clock
} from 'lucide-react';

const EmailFilter = ({ 
  recipients, 
  leaderboard, 
  emailLogs, 
  onFilterChange, 
  onSmartSelect 
}) => {
  // --- TILAT ---
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 
  const [xpFilter, setXpFilter] = useState('all'); 
  const [sentStatus, setSentStatus] = useState('all'); 
  const [uniqueMode, setUniqueMode] = useState(true);

  // --- DATAN RIKASTAMINEN JA SUODATUS ---
  const enrichedAndFiltered = useMemo(() => {
    // A. Lasketaan sähköpostien esiintyvyys (tuplatunnistus)
    const emailCounts = {};
    recipients.forEach(r => {
      if (r.email) {
        const e = r.email.toLowerCase();
        emailCounts[e] = (emailCounts[e] || 0) + 1;
      }
    });

    return recipients.map(r => {
      // 1. Haetaan leaderboard-tiedot
      const lb = leaderboard.find(l => l.assigned_guest_id === r.guestId) || {};
      
      // 2. HAETAAN LÄHETYSHISTORIA (Viimeisin onnistunut viesti)
      const charLogs = emailLogs.filter(l => l.character_id === r.id && l.status === 'sent');
      const lastSuccess = charLogs.length > 0 ? charLogs[0] : null;

      // 3. Tunnistetaan splittaamaton avec (jakaa sähköpostin ja on avec-hahmo)
      const isUnsplitAvec = r.isSplit && r.email && emailCounts[r.email.toLowerCase()] > 1;

      return {
        ...r,
        xp: parseInt(lb.xp || 0),
        missionDone: lb.completed_secret_mission === true || lb.completed_secret_mission === 'true',
        foundBar: lb.found_secret_bar === true || lb.found_secret_bar === 'true',
        // Historia-tiedot
        lastLogTemplate: lastSuccess ? lastSuccess.template_name : null,
        lastLogDate: lastSuccess ? lastSuccess.sent_at : null,
        sentStatus: lastSuccess ? 'sent' : 'unsent',
        isUnsplitAvec: isUnsplitAvec
      };
    }).filter(r => {
      // --- SUODATUSEHDOT ---

      // 1. UNIQUE MODE: Jos päällä, poistetaan rivit jotka aiheuttaisivat tuplapostin samaan osoitteeseen
      if (uniqueMode && r.isUnsplitAvec) return false;

      // 2. TEKSTIHAKU (Hakee nimistä, rooleista ja myös historiasta!)
      const searchStr = `${r.characterName} ${r.guestName} ${r.role} ${r.email} ${r.lastLogTemplate || ''}`.toLowerCase();
      if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false;

      // 3. TYYPPI
      if (activeTab === 'primary' && r.isSplit) return false;
      if (activeTab === 'split' && !r.isSplit) return false;

      // 4. XP
      if (xpFilter === 'zero' && r.xp > 0) return false;
      if (xpFilter === 'active' && r.xp === 0) return false;

      // 5. HISTORIAN TILA
      if (sentStatus === 'unsent' && r.sentStatus !== 'unsent') return false;
      if (sentStatus === 'sent' && r.sentStatus !== 'sent') return false;

      return true;
    });
  }, [recipients, leaderboard, emailLogs, searchTerm, activeTab, xpFilter, sentStatus, uniqueMode]);

  useEffect(() => {
    onFilterChange(enrichedAndFiltered);
  }, [enrichedAndFiltered]);

  // --- SMART ACTIONS ---
  const selectNeverSent = () => {
    const ids = enrichedAndFiltered
      .filter(r => r.sentStatus === 'unsent')
      .map(r => r.id);
    onSmartSelect(ids);
  };

  return (
    <div className="email-filter-container fade-in">
      
      {/* TURVAKYTKIN */}
      <div className="jc-card" style={{ 
        marginBottom: '1rem', 
        padding: '1rem', 
        border: uniqueMode ? '1px solid var(--lime)' : '1px solid #444',
        background: uniqueMode ? 'rgba(173, 255, 47, 0.05)' : 'transparent'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={uniqueMode} 
            onChange={e => setUniqueMode(e.target.checked)} 
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <div style={{ color: uniqueMode ? 'var(--lime)' : 'var(--cream)', fontWeight: 'bold', fontSize: '0.9rem' }}>
              PUHDAS LÄHETYSLISTA (1 PER OSOITE)
            </div>
            <div className="small" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
              Piilottaa seuralaiset, jotka jakavat sähköpostin päävieraan kanssa.
            </div>
          </div>
        </label>
      </div>

      {/* HAKU */}
      <div className="jc-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--turquoise)' }} />
          <input 
            type="text" 
            className="jc-input-custom" 
            style={{ paddingLeft: '45px', marginBottom: 0, width: '100%' }}
            placeholder="Etsi nimellä, hahmolla tai aiemmalla viestillä..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* TYYPPI */}
        <div className="jc-card">
          <h4 className="small" style={{ color: 'var(--turquoise)', marginBottom: '10px' }}>TYYPPI</h4>
          <div className="jc-btn-group">
            <button onClick={() => setActiveTab('all')} className={`jc-btn small ${activeTab === 'all' ? 'primary' : 'outline'}`}>Kaikki</button>
            <button onClick={() => setActiveTab('primary')} className={`jc-btn small ${activeTab === 'primary' ? 'primary' : 'outline'}`}>Vain Pää</button>
            <button onClick={() => setActiveTab('split')} className={`jc-btn small ${activeTab === 'split' ? 'primary' : 'outline'}`}>Vain Avec</button>
          </div>
        </div>

        {/* LÄHETYSSTATUS */}
        <div className="jc-card">
          <h4 className="small" style={{ color: 'var(--muted)', marginBottom: '10px' }}>HISTORIAN TILA</h4>
          <select className="jc-input-custom" style={{ padding: '8px', fontSize: '0.8rem', width: '100%' }} value={sentStatus} onChange={(e) => setSentStatus(e.target.value)}>
            <option value="all">Kaikki (Status vapaa)</option>
            <option value="sent">Vähintään yksi viesti lähetetty ✅</option>
            <option value="unsent">Ei ole saanut vielä mitään 📩</option>
          </select>
        </div>
      </div>

      {/* PELILLISET (MAGENTA) */}
      <div className="jc-card" style={{ borderColor: 'var(--magenta)', background: 'rgba(255, 0, 229, 0.02)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <h4 className="small neon-text-magenta" style={{ marginBottom: '10px' }}>XP-TASO</h4>
            <div className="jc-btn-group">
              <button onClick={() => setXpFilter('all')} className={`jc-btn small ${xpFilter === 'all' ? 'primary' : 'ghost'}`}>Kaikki</button>
              <button onClick={() => setXpFilter('zero')} className={`jc-btn small ${xpFilter === 'zero' ? 'primary' : 'ghost'}`}>0 XP</button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 className="small neon-text-magenta" style={{ marginBottom: '10px' }}>SMART SELECT</h4>
            <button onClick={selectNeverSent} className="jc-btn small outline" style={{ color: 'var(--lime)', borderColor: 'var(--lime)', width: '100%' }}>
              📩 VALITSE KAIKKI JOILLE EI OLE LÄHETETTY MITÄÄN ({enrichedAndFiltered.filter(r => r.sentStatus === 'unsent').length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailFilter;