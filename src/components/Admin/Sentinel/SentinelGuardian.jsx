import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Activity, Smartphone, BatteryLow, Battery, Wifi, WifiOff, AlertTriangle, 
  Zap, Clock, Shield, Database, Globe, UserCheck, 
  BookOpen, Camera, Ghost, Star, UserMinus, LayoutDashboard,
  Target, Eye, Mail, MailCheck, MailWarning, ClockAlert, Info,
  MapPin, MousePointer2, Monitor, BarChart3, PieChart, Layers,
  Signal, Radio, Timer, MousePointerClick, UserX, Plus, Trash2, ShieldCheck, ShieldAlert
} from 'lucide-react';
import './SentinelGuardian.css';

const SentinelGuardian = ({ guests }) => {
  const [logs, setLogs] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showTechDossier, setShowTechDossier] = useState(false);

  // --- STEALTH CONTROL STATE ---
  const HARDCODED_TEST_IDS = [
    'f5b82d23-94a7-44ff-ab1c-1dbddd230f94',
    'bad5c88e-9d0a-4f92-9b85-61f46cd83d92'
  ];

  const [ignoredIds, setIgnoredIds] = useState(() => {
    const saved = localStorage.getItem('sentinel_stealth_ids');
    if (saved) {
      const parsed = JSON.parse(saved);
      return [...new Set([...HARDCODED_TEST_IDS, ...parsed])];
    }
    return HARDCODED_TEST_IDS;
  });

  const [activeExclusions, setActiveExclusions] = useState(() => {
    const savedActive = localStorage.getItem('sentinel_active_exclusions');
    return savedActive ? JSON.parse(savedActive) : HARDCODED_TEST_IDS;
  });

  const [newIdInput, setNewIdInput] = useState('');

  useEffect(() => {
    localStorage.setItem('sentinel_stealth_ids', JSON.stringify(ignoredIds.filter(id => !HARDCODED_TEST_IDS.includes(id))));
    localStorage.setItem('sentinel_active_exclusions', JSON.stringify(activeExclusions));
  }, [ignoredIds, activeExclusions]);

  useEffect(() => {
    fetchInitialData();
    const channel = supabase.channel('sentinel_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentinel_access_logs' }, 
      (payload) => setLogs(prev => [payload.new, ...prev].slice(0, 1000)))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchInitialData = async () => {
    const [logsRes, emailsRes, charsRes] = await Promise.all([
      supabase.from('sentinel_access_logs').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('email_logs').select('*').order('sent_at', { ascending: false }),
      supabase.from('characters').select('id, assigned_guest_id, name')
    ]);
    if (logsRes.data) setLogs(logsRes.data);
    if (emailsRes.data) setEmailLogs(emailsRes.data);
    if (charsRes.data) setCharacters(charsRes.data);
    setLoading(false);
  };

  const handleAddId = () => {
    if (!newIdInput) return;
    const cleanId = newIdInput.trim();
    if (!ignoredIds.includes(cleanId)) {
      setIgnoredIds(prev => [...prev, cleanId]);
      setActiveExclusions(prev => [...prev, cleanId]);
    }
    setNewIdInput('');
  };

  const toggleExclusion = (id) => {
    setActiveExclusions(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const removeId = (id) => {
    if (HARDCODED_TEST_IDS.includes(id)) return;
    setIgnoredIds(prev => prev.filter(item => item !== id));
    setActiveExclusions(prev => prev.filter(item => item !== id));
  };

  const analysis = useMemo(() => {
    const charToGuestMap = {};
    characters.forEach(c => { if(c.assigned_guest_id) charToGuestMap[c.id] = c.assigned_guest_id; });

    const filteredLogs = logs.filter(l => !activeExclusions.includes(l.guest_id));
    const filteredEmailLogs = emailLogs.filter(e => !activeExclusions.includes(charToGuestMap[e.character_id]));
    const filteredGuests = guests.filter(g => !activeExclusions.includes(g.id));

    const now = new Date();
    const agentMap = {};
    const stats = { 
      browsers: {}, 
      os: {},
      referrers: {},
      systems: { NEXUS: 0, PHOTO: 0, TICKET: 0 },
      email: { sent: 0, errors: 0, templates: {} }
    };
    
    let totalInteractions = 0;
    const sessionIds = new Set();

    filteredEmailLogs.forEach(email => {
      stats.email.sent++;
      if (email.status !== 'sent') stats.email.errors++;
      stats.email.templates[email.template_name] = (stats.email.templates[email.template_name] || 0) + 1;
    });

    filteredLogs.forEach(log => {
      totalInteractions++;
      sessionIds.add(log.session_id);

      if (log.interaction_point.includes('NEXUS')) stats.systems.NEXUS++;
      if (log.interaction_point.includes('PHOTO')) stats.systems.PHOTO++;
      if (log.interaction_point.includes('TICKET')) stats.systems.TICKET++;
      
      const b = log.tech_profile?.browser || 'Unknown';
      stats.browsers[b] = (stats.browsers[b] || 0) + 1;
      const os = log.tech_profile?.os || 'Unknown';
      stats.os[os] = (stats.os[os] || 0) + 1;
      const ref = log.tech_profile?.referrer || 'Direct';
      stats.referrers[ref] = (stats.referrers[ref] || 0) + 1;

      if (!agentMap[log.guest_id]) {
        const guestInfo = filteredGuests.find(g => g.id === log.guest_id);
        agentMap[log.guest_id] = {
          id: log.guest_id,
          name: guestInfo ? guestInfo.name : 'Tuntematon Agentti',
          sessions: {},
          durations: { NEXUS: 0, PHOTO: 0, TICKET: 0 },
          totalTime: 0,
          latest: log,
          firstSeen: log.created_at,
          points: new Set(),
          emails: [],
          interactionCount: 0
        };
      }
      const agent = agentMap[log.guest_id];
      agent.interactionCount++;
      agent.points.add(log.interaction_point);
      if (!agent.sessions[log.session_id]) agent.sessions[log.session_id] = [];
      agent.sessions[log.session_id].push(log);
      if (new Date(log.created_at) < new Date(agent.firstSeen)) agent.firstSeen = log.created_at;
    });

    const processedAgents = Object.values(agentMap).map(agent => {
      agent.emails = filteredEmailLogs.filter(e => charToGuestMap[e.character_id] === agent.id);
      Object.values(agent.sessions).forEach(sessionLogs => {
        const sorted = [...sessionLogs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        sorted.forEach((log, i) => {
          let duration = 45; 
          if (sorted[i + 1]) {
            const diff = (new Date(sorted[i + 1].created_at) - new Date(log.created_at)) / 1000;
            duration = diff > 600 ? 45 : diff;
          }
          if (log.interaction_point.includes('NEXUS')) agent.durations.NEXUS += duration;
          else if (log.interaction_point.includes('PHOTO')) agent.durations.PHOTO += duration;
          else agent.durations.TICKET += duration;
          agent.totalTime += duration;
        });
      });

      const { NEXUS, PHOTO, TICKET } = agent.durations;
      const total = NEXUS + PHOTO + TICKET || 1;
      const percentages = { 
        NEXUS: Math.round((NEXUS / total) * 100), 
        PHOTO: Math.round((PHOTO / total) * 100), 
        TICKET: Math.round((TICKET / total) * 100) 
      };

      let archetype = { label: 'Field Operative', icon: Activity, color: 'var(--turquoise)' };
      const lastEmail = agent.emails[0];
      if (lastEmail) {
        const timeDiff = (new Date(agent.firstSeen) - new Date(lastEmail.sent_at)) / (1000 * 60);
        if (timeDiff > 0 && timeDiff < 30) {
          archetype = { label: 'Responsive Agent', icon: Zap, color: 'var(--sun)' };
        } else if (percentages.NEXUS > 60) {
          archetype = { label: 'Lore Hunter', icon: BookOpen, color: 'var(--lime)' };
        } else if (percentages.PHOTO > 60) {
          archetype = { label: 'Paparazzi', icon: Camera, color: 'var(--magenta)' };
        }
      } else if (agent.totalTime < 60) {
        archetype = { label: 'Ghost Trace', icon: Ghost, color: 'var(--muted)' };
      }

      const status = (new Date(agent.latest.created_at) < new Date(now.getTime() - 24*60*60*1000)) ? 'Pudonnut' : 'Aktiivinen';
      return { ...agent, archetype, percentages, status };
    });

    const techDossier = {
      browsers: Object.entries(stats.browsers).sort((a,b) => b[1]-a[1]).slice(0, 3),
      os: Object.entries(stats.os).sort((a,b) => b[1]-a[1]).slice(0, 3),
      referrers: Object.entries(stats.referrers).sort((a,b) => b[1]-a[1]).slice(0, 3),
      mobileCount: processedAgents.filter(a => a.latest.tech_profile?.mobile).length,
      desktopCount: processedAgents.filter(a => !a.latest.tech_profile?.mobile).length,
      batteryCritical: processedAgents.filter(a => a.latest.battery_alert).length,
      wifiCount: processedAgents.filter(a => a.latest.connection_info?.type?.includes('wifi')).length,
      cellularCount: processedAgents.filter(a => ['4g', '5g', 'cellular'].some(t => a.latest.connection_info?.type?.toLowerCase().includes(t))).length,
      visibleCount: filteredLogs.filter(l => l.interaction_point.includes('PULSE')).length,
      sessionIntensity: (totalInteractions / (sessionIds.size || 1)).toFixed(1)
    };

    const deadSignals = filteredGuests.filter(g => {
      const hasEmail = filteredEmailLogs.some(e => charToGuestMap[e.character_id] === g.id);
      const hasActivity = filteredLogs.some(l => l.guest_id === g.id);
      return hasEmail && !hasActivity;
    }).map(g => ({
      ...g,
      emails: filteredEmailLogs.filter(e => charToGuestMap[e.character_id] === g.id)
    }));

    return { 
      agents: processedAgents, 
      stats, 
      techDossier,
      deadSignals,
      filteredLogs,
      filteredGuests,
      alerts: processedAgents.filter(a => a.latest.battery_alert).slice(0, 4) 
    };
  }, [logs, emailLogs, characters, guests, activeExclusions]);

  if (loading) return <div className="sentinel-loading">Synkronoidaan HUD...</div>;

  return (
    <div className="sentinel-wrapper">
      
      {/* KERROS 1: HUD */}
      <div className="sentinel-hud-grid">
        <div className="jc-card sentinel-card sentinel-alert-border">
          <div className="sentinel-card-header"><AlertTriangle size={20} className="sentinel-icon-magenta" /> <h3 className="sentinel-h3">Hälytyskeskus</h3></div>
          <div className="sentinel-alerts-list">
            {analysis.alerts.length > 0 ? analysis.alerts.map(a => (
              <div key={a.id} className="sentinel-alert-toast"><BatteryLow size={14} /> <strong>{a.name}</strong> – Akku vähissä!</div>
            )) : <p className="sentinel-muted-text">Ei teknisiä poikkeamia.</p>}
          </div>
        </div>
        <div className="jc-card sentinel-card">
          <div className="sentinel-card-header"><Target size={20} className="sentinel-icon-turquoise" /> <h3 className="sentinel-h3">Verkon tila</h3></div>
          <div className="sentinel-stats-summary">
             <div className="sentinel-stat-box"><span className="sentinel-label">Agentit</span><span className="sentinel-value">{analysis.agents.length}</span></div>
             <div className="sentinel-stat-box"><span className="sentinel-label">Immersion</span><span className="sentinel-value lime">{analysis.agents.filter(a => a.totalTime > 300).length}</span></div>
          </div>
        </div>
      </div>

      {/* KERROS 2: NUDGE & DEAD SIGNALS */}
      <div className="sentinel-summary-grid mt-2">
        <div className="jc-card sentinel-card">
          <div className="sentinel-card-header"><Mail size={18} className="sentinel-icon-sun" /> <h3 className="sentinel-h3">Nudge Control</h3></div>
          <div className="sentinel-nudge-stats">
            <div className="nudge-row"><span>Sähköposteja:</span> <strong>{analysis.stats.email.sent}</strong></div>
            <div className="nudge-row"><span>Virheet:</span> <strong className="text-magenta">{analysis.stats.email.errors}</strong></div>
            <div className="nudge-row"><span>Aktivointi:</span> <strong className="text-lime">{Math.round((analysis.agents.length / (analysis.filteredGuests.length || 1)) * 100)}%</strong></div>
          </div>
        </div>
        <div className="jc-card sentinel-card sentinel-dead-border">
          <div className="sentinel-card-header">
            <ClockAlert size={18} className="text-magenta" /> 
            <h3 className="sentinel-h3">Dead Signals ({analysis.deadSignals.length})</h3>
          </div>
          <div className="sentinel-dead-list sentinel-scrollable">
            {analysis.deadSignals.length > 0 ? analysis.deadSignals.map(g => (
              <div key={g.id} className="dead-signal-item">
                <span>{g.name}</span>
                <div className="dead-tags">
                  {g.emails.map((e, i) => <span key={i} className="mini-tag" title={e.template_name}><Mail size={10}/></span>)}
                </div>
              </div>
            )) : <p className="sentinel-muted-text">Ei pimeitä signaaleja.</p>}
          </div>
        </div>
      </div>

      {/* KERROS 3: TEKNIIKKA TRENDIT */}
      <div className="sentinel-summary-grid mt-2">
        <div className="jc-card sentinel-card">
          <div className="sentinel-card-header"><LayoutDashboard size={18} /> <h3 className="sentinel-h3">Järjestelmäsuosio</h3></div>
          <div className="sentinel-usage-bar-container">
            {Object.entries(analysis.stats.systems).map(([sys, val]) => (
              <div key={sys} className="sentinel-usage-row">
                <span className="sentinel-mini-label">{sys}</span>
                <div className="sentinel-bar-bg"><div className="sentinel-bar-fill" style={{ width: `${(val / (analysis.filteredLogs.length || 1)) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="jc-card sentinel-card sentinel-clickable" onClick={() => setShowTechDossier(true)}>
          <div className="sentinel-card-header"><Globe size={18} className="sentinel-icon-turquoise" /> <h3 className="sentinel-h3">Tekniikka Intel</h3></div>
          <div className="sentinel-tech-brief">
            <p>Pääselain: <strong>{analysis.techDossier.browsers[0]?.[0] || '??'}</strong></p>
            <p>Aktiivisia nyt: <strong>{analysis.agents.filter(a => a.status === 'Aktiivinen').length}</strong></p>
          </div>
          <div className="mini-tech-footer">Avaa Globaali Telemetria →</div>
        </div>
      </div>

      {/* KERROS 4: PROFIILIT */}
      <div className="sentinel-card mt-2">
        <div className="sentinel-card-header">
          <UserCheck size={20} /> 
          <h3 className="sentinel-h3">Agenttien Profiilit</h3>
          {activeExclusions.length > 0 && <span style={{fontSize: '10px', color: 'var(--sun)', marginLeft: '10px'}}>STEALTH ACTIVE</span>}
        </div>
        <div className="sentinel-agent-grid">
          {analysis.agents.length > 0 ? (
            analysis.agents.sort((a,b) => new Date(b.latest.created_at) - new Date(a.latest.created_at)).map(agent => (
              <div key={agent.id} className="sentinel-behavior-card" onClick={() => setSelectedAgent(agent)}>
                <div className="behavior-card-header">
                  <agent.archetype.icon size={18} style={{ color: agent.archetype.color }} />
                  <span className="agent-name">{agent.name}</span>
                  <div className="email-status-icons">
                    {agent.emails.some(e => e.status === 'sent') && <MailCheck size={14} className="text-lime" />}
                  </div>
                </div>
                <div className="signal-mini-bar">
                  <div className="sig-part nexus" style={{ width: `${agent.percentages.NEXUS}%` }}></div>
                  <div className="sig-part photo" style={{ width: `${agent.percentages.PHOTO}%` }}></div>
                  <div className="sig-part ticket" style={{ width: `${agent.percentages.TICKET}%` }}></div>
                </div>
                <div className="behavior-card-footer">
                  <span className="arch-label">{agent.archetype.label}</span>
                  <span className="time-label">{Math.floor(agent.totalTime / 60)} min</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{padding: '40px', textAlign: 'center', gridColumn: '1/-1', opacity: 0.5}}>
              <Ghost size={40} style={{marginBottom: '10px'}} />
              <p>Ei aktiivisia agentteja suodattimen ulkopuolella.</p>
            </div>
          )}
        </div>
      </div>

      {/* KERROS 5: RAW FEED */}
      <div className="jc-card sentinel-card mt-2">
        <div className="sentinel-card-header"><Database size={16} /> <h3 className="sentinel-h3">Signaalivirta (Raw)</h3></div>
        <div className="sentinel-table-scroll">
          <table className="sentinel-table-mini">
            <thead>
              <tr><th>Aika</th><th>Agentti</th><th>Toiminto</th></tr>
            </thead>
            <tbody>
              {analysis.filteredLogs.slice(0, 30).map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleTimeString()}</td>
                  <td>{guests.find(g => g.id === log.guest_id)?.name || '??'}</td>
                  <td>{log.interaction_point}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: AGENTTI-DOSSIER */}
      {selectedAgent && (
        <div className="sentinel-dossier-overlay" onClick={() => setSelectedAgent(null)}>
          <div className="sentinel-dossier-card jc-card" onClick={e => e.stopPropagation()}>
            <div className="dossier-header-main">
              <selectedAgent.archetype.icon size={40} style={{ color: selectedAgent.archetype.color }} />
              <div>
                <h2 className="jc-h2">{selectedAgent.name}</h2>
                <p className="archetype-title" style={{ color: selectedAgent.archetype.color }}>{selectedAgent.archetype.label}</p>
              </div>
            </div>
            <div className="dossier-grid-main">
              <div className="dossier-column">
                <div className="dossier-section">
                  <h4 className="dossier-h4"><Mail size={14}/> Viestintähistoria</h4>
                  <div className="dossier-email-list">
                    {selectedAgent.emails.length > 0 ? selectedAgent.emails.map((e, i) => (
                      <div key={i} className="dossier-email-item">
                        <span>{e.template_name}</span> <small>{new Date(e.sent_at).toLocaleDateString()}</small>
                      </div>
                    )) : <p className="sentinel-muted-text">Ei lähetettyjä viestejä.</p>}
                  </div>
                </div>
                <div className="dossier-section mt-2">
                  <h4 className="dossier-h4"><Activity size={14}/> Pääasiallinen Signaali</h4>
                  <div className="full-signal-bar">
                    <div className="sig-segment nexus" style={{ width: `${selectedAgent.percentages.NEXUS}%` }}><span>NEXUS {selectedAgent.percentages.NEXUS}%</span></div>
                    <div className="sig-segment photo" style={{ width: `${selectedAgent.percentages.PHOTO}%` }}><span>PHOTO {selectedAgent.percentages.PHOTO}%</span></div>
                    <div className="sig-segment ticket" style={{ width: `${selectedAgent.percentages.TICKET}%` }}><span>TICKET {selectedAgent.percentages.TICKET}%</span></div>
                  </div>
                </div>
              </div>
              <div className="dossier-column">
                <div className="dossier-section tech-telemetry">
                  <h4 className="dossier-h4"><Shield size={14}/> Tekninen Telemetria</h4>
                  <div className="telemetry-grid">
                    <div className="telemetry-item"><span className="tel-label"><Smartphone size={12}/> Laite</span><span className="tel-value">{selectedAgent.latest.tech_profile?.os}</span></div>
                    <div className="telemetry-item"><span className="tel-label"><Wifi size={12}/> Yhteys</span><span className="tel-value">{selectedAgent.latest.connection_info?.type || 'Mobiilidata'}</span></div>
                    <div className="telemetry-item">
                      <span className="tel-label">{selectedAgent.latest.battery_alert ? <BatteryLow size={12} className="text-magenta"/> : <Battery size={12} className="text-lime"/>} Akku</span>
                      <span className={selectedAgent.latest.battery_alert ? "tel-value text-magenta" : "tel-value"}>{selectedAgent.latest.battery_alert ? 'Kriittinen (<15%)' : 'Vakaa'}</span>
                    </div>
                    <div className="telemetry-item"><span className="tel-label"><MapPin size={12}/> Sijainti</span><span className="tel-value">{selectedAgent.latest.interaction_point}</span></div>
                    <div className="telemetry-item"><span className="tel-label"><Clock size={12}/> Viipymä</span><span className="tel-value">{Math.floor(selectedAgent.totalTime / 60)} min</span></div>
                  </div>
                </div>
              </div>
            </div>
            <button className="jc-btn ghost mt-2" style={{ width: '100%' }} onClick={() => setSelectedAgent(null)}>Sulje Dossier</button>
          </div>
        </div>
      )}

      {/* MODAL 2: GLOBAALI TEKNIIKKA-INTEL */}
      {showTechDossier && (
        <div className="sentinel-dossier-overlay" onClick={() => setShowTechDossier(false)}>
          <div className="sentinel-dossier-card jc-card global-tech-card" onClick={e => e.stopPropagation()}>
            <div className="dossier-header-main">
              <Globe size={40} className="sentinel-icon-turquoise" />
              <div>
                <h2 className="jc-h2">Global Technical Intel</h2>
                <p className="archetype-title text-turquoise">Järjestelmän Telemetria ja Stealth-hallinta</p>
              </div>
            </div>

            <div className="tech-dossier-grid">
              {/* 1. Ohjelmistoympäristö */}
              <div className="tech-widget">
                <h4 className="dossier-h4"><Monitor size={14}/> Ohjelmisto & Lähteet</h4>
                <div className="tech-stat-list">
                  <div className="stat-group">
                    <label>Top Selaimet</label>
                    {analysis.techDossier.browsers.map(([name, count]) => (
                      <div key={name} className="stat-row"><span>{name}</span> <strong>{Math.round((count/(analysis.filteredLogs.length || 1))*100)}%</strong></div>
                    ))}
                  </div>
                  <div className="stat-group mt-1">
                    <label>Tulolähteet (Referrer)</label>
                    {analysis.techDossier.referrers.map(([name, count]) => (
                      <div key={name} className="stat-row"><span className="truncate">{name.substring(0,25)}</span> <strong>{count}</strong></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Energia ja Yhteys */}
              <div className="tech-widget">
                <h4 className="dossier-h4"><Zap size={14}/> Energia & Signaali</h4>
                <div className="tech-stat-list">
                  <div className="stat-row-large">
                     <div className="large-box">
                        <Smartphone size={24} />
                        <span>Mobiili</span>
                        <strong>{Math.round((analysis.techDossier.mobileCount / (analysis.agents.length || 1)) * 100)}%</strong>
                     </div>
                     <div className="large-box">
                        <Monitor size={24} />
                        <span>Desktop</span>
                        <strong>{Math.round((analysis.techDossier.desktopCount / (analysis.agents.length || 1)) * 100)}%</strong>
                     </div>
                  </div>
                  <div className="stat-group mt-1">
                    <div className="stat-row"><span><BatteryLow size={12} className="text-magenta"/> Globaali akkukunto</span> <strong className="text-magenta">{Math.round((analysis.techDossier.batteryCritical / (analysis.agents.length || 1)) * 100)}% kriittinen</strong></div>
                    <div className="stat-row"><span><Wifi size={12}/> WiFi-aste</span> <strong>{analysis.techDossier.wifiCount} agenttia</strong></div>
                    <div className="stat-row"><span><Radio size={12}/> Mobiilidata</span> <strong>{analysis.techDossier.cellularCount} agenttia</strong></div>
                  </div>
                </div>
              </div>

              {/* 3. Aktiivisuus-telemetria */}
              <div className="tech-widget full-width">
                <h4 className="dossier-h4"><MousePointerClick size={14}/> Aktiivisuus & Vakaus</h4>
                <div className="tech-tri-grid">
                  <div className="tri-box">
                    <span className="tel-label">Visibility Index</span>
                    <span className="tel-value">{analysis.techDossier.visibleCount} Aktiivista pulssia</span>
                    <small>Sivu aktiivisena edessä</small>
                  </div>
                  <div className="tri-box">
                    <span className="tel-label">Sessio-intensiteetti</span>
                    <span className="tel-value text-lime">{analysis.techDossier.sessionIntensity}</span>
                    <small>Tapahtumaa per istunto</small>
                  </div>
                  <div className="tri-box">
                    <span className="tel-label">Signaalin vakaus</span>
                    <span className="tel-value text-turquoise">Vakaa</span>
                    <small>Heartbeat-synkronointi OK</small>
                  </div>
                </div>
              </div>

              {/* STEALTH CONTROL SECTION */}
              <div className="tech-widget full-width" style={{borderTop: '1px solid rgba(255,180,0,0.2)', paddingTop: '15px', marginTop: '10px'}}>
                <h4 className="dossier-h4"><ShieldAlert size={14} className="text-sun"/> Sentinel Stealth Control</h4>
                <p style={{fontSize: '11px', opacity: 0.6, marginBottom: '10px'}}>Hallitse testi-ID:tä. Aktiiviset ID:t poistetaan tilastoista.</p>
                
                <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                  <input 
                    type="text" 
                    placeholder="Liitä uusi guest_id..." 
                    value={newIdInput} 
                    onChange={(e) => setNewIdInput(e.target.value)}
                    style={{flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: 'white', padding: '5px 10px', borderRadius: '4px'}}
                  />
                  <button onClick={handleAddId} style={{background: 'var(--sun)', color: 'black', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>Lisää</button>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                  {ignoredIds.map(id => (
                    <div key={id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '4px', border: activeExclusions.includes(id) ? '1px solid rgba(255,180,0,0.3)' : '1px solid transparent'}}>
                      <div style={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                        <span style={{fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{id}</span>
                        {HARDCODED_TEST_IDS.includes(id) && <small style={{color: 'var(--sun)', fontSize: '9px'}}>SYSTEM</small>}
                      </div>
                      <div style={{display: 'flex', gap: '8px', marginLeft: '10px'}}>
                        <button onClick={() => toggleExclusion(id)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                          {activeExclusions.includes(id) ? <ShieldCheck size={16} className="text-lime" /> : <ShieldAlert size={16} style={{opacity: 0.3}} />}
                        </button>
                        {!HARDCODED_TEST_IDS.includes(id) && (
                          <button onClick={() => removeId(id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--magenta)'}}><Trash2 size={14}/></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button className="jc-btn ghost mt-2" style={{ width: '100%' }} onClick={() => setShowTechDossier(false)}>Sulje Intel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentinelGuardian;