import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Activity, Smartphone, BatteryLow, WifiOff, AlertTriangle, 
  Zap, Clock, Shield, Database, Globe, UserCheck, 
  BookOpen, Camera, Ghost, Star, UserMinus, LayoutDashboard,
  Target, Eye, Mail, MailCheck, MailWarning, ClockAlert, Info
} from 'lucide-react';
import './SentinelGuardian.css';

const SentinelGuardian = ({ guests }) => {
  const [logs, setLogs] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);

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

  const analysis = useMemo(() => {
    const now = new Date();
    const agentMap = {};
    const stats = { 
      browsers: {}, 
      systems: { NEXUS: 0, PHOTO: 0, TICKET: 0 },
      email: { sent: 0, errors: 0, templates: {} }
    };

    const charToGuest = {};
    characters.forEach(c => { if(c.assigned_guest_id) charToGuest[c.id] = c.assigned_guest_id; });

    emailLogs.forEach(email => {
      stats.email.sent++;
      if (email.status !== 'sent') stats.email.errors++;
      stats.email.templates[email.template_name] = (stats.email.templates[email.template_name] || 0) + 1;
    });

    logs.forEach(log => {
      if (log.interaction_point.includes('NEXUS')) stats.systems.NEXUS++;
      if (log.interaction_point.includes('PHOTO')) stats.systems.PHOTO++;
      if (log.interaction_point.includes('TICKET')) stats.systems.TICKET++;
      
      const b = log.tech_profile?.browser || 'Unknown';
      stats.browsers[b] = (stats.browsers[b] || 0) + 1;

      if (!agentMap[log.guest_id]) {
        const guestInfo = guests.find(g => g.id === log.guest_id);
        agentMap[log.guest_id] = {
          id: log.guest_id,
          name: guestInfo ? guestInfo.name : 'Tuntematon Agentti',
          sessions: {},
          durations: { NEXUS: 0, PHOTO: 0, TICKET: 0 },
          totalTime: 0,
          latest: log,
          firstSeen: log.created_at,
          points: new Set(),
          emails: []
        };
      }
      const agent = agentMap[log.guest_id];
      agent.points.add(log.interaction_point);
      if (!agent.sessions[log.session_id]) agent.sessions[log.session_id] = [];
      agent.sessions[log.session_id].push(log);
      if (new Date(log.created_at) < new Date(agent.firstSeen)) agent.firstSeen = log.created_at;
    });

    const processedAgents = Object.values(agentMap).map(agent => {
      agent.emails = emailLogs.filter(e => charToGuest[e.character_id] === agent.id);
      
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

    const deadSignals = guests.filter(g => {
      const hasEmail = emailLogs.some(e => charToGuest[e.character_id] === g.id);
      const hasActivity = logs.some(l => l.guest_id === g.id);
      return hasEmail && !hasActivity;
    }).map(g => ({
      ...g,
      emails: emailLogs.filter(e => charToGuest[e.character_id] === g.id)
    }));

    return { 
      agents: processedAgents, 
      stats, 
      deadSignals,
      alerts: processedAgents.filter(a => a.latest.battery_alert).slice(0, 4) 
    };
  }, [logs, emailLogs, characters, guests]);

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

      {/* KERROS 2: NUDGE CONTROL & DEAD SIGNALS (SCROLL LISÄTTY) */}
      <div className="sentinel-summary-grid mt-2">
        <div className="jc-card sentinel-card">
          <div className="sentinel-card-header"><Mail size={18} className="sentinel-icon-sun" /> <h3 className="sentinel-h3">Nudge Control</h3></div>
          <div className="sentinel-nudge-stats">
            <div className="nudge-row"><span>Sähköposteja:</span> <strong>{analysis.stats.email.sent}</strong></div>
            <div className="nudge-row"><span>Virheet:</span> <strong className="text-magenta">{analysis.stats.email.errors}</strong></div>
            <div className="nudge-row"><span>Aktivointi:</span> <strong className="text-lime">{Math.round((analysis.agents.length / guests.length) * 100)}%</strong></div>
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

      {/* KERROS 3: TRENDIT */}
      <div className="sentinel-summary-grid mt-2">
        <div className="jc-card sentinel-card">
          <div className="sentinel-card-header"><LayoutDashboard size={18} /> <h3 className="sentinel-h3">Järjestelmäsuosio</h3></div>
          <div className="sentinel-usage-bar-container">
            {Object.entries(analysis.stats.systems).map(([sys, val]) => (
              <div key={sys} className="sentinel-usage-row">
                <span className="sentinel-mini-label">{sys}</span>
                <div className="sentinel-bar-bg"><div className="sentinel-bar-fill" style={{ width: `${(val / logs.length) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="jc-card sentinel-card">
          <div className="sentinel-card-header"><Globe size={18} /> <h3 className="sentinel-h3">Tekniikka</h3></div>
          <div className="sentinel-tech-brief">
            <p>Pääselain: <strong>{Object.entries(analysis.stats.browsers).sort((a,b)=>b[1]-a[1])[0]?.[0] || '??'}</strong></p>
            <p>Aktiivisia nyt: <strong>{analysis.agents.filter(a => a.status === 'Aktiivinen').length}</strong></p>
          </div>
        </div>
      </div>

      {/* KERROS 4: PROFIILIT */}
      <div className="sentinel-card mt-2">
        <div className="sentinel-card-header"><UserCheck size={20} /> <h3 className="sentinel-h3">Agenttien Profiilit</h3></div>
        <div className="sentinel-agent-grid">
          {analysis.agents.sort((a,b) => new Date(b.latest.created_at) - new Date(a.latest.created_at)).map(agent => (
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
          ))}
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
              {logs.slice(0, 30).map(log => (
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

      {/* DOSSIER MODAL */}
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
            
            <div className="dossier-signal-section">
              <h4>Viestintähistoria</h4>
              <div className="dossier-email-list">
                {selectedAgent.emails.map((e, i) => (
                  <div key={i} className="dossier-email-item">
                    <Mail size={12}/> <span>{e.template_name}</span> <small>{new Date(e.sent_at).toLocaleDateString()}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="dossier-signal-section mt-2">
              <h4>Pääasiallinen Signaali</h4>
              <div className="full-signal-bar">
                <div className="sig-segment nexus" style={{ width: `${selectedAgent.percentages.NEXUS}%` }}><span>NEXUS {selectedAgent.percentages.NEXUS}%</span></div>
                <div className="sig-segment photo" style={{ width: `${selectedAgent.percentages.PHOTO}%` }}><span>PHOTO {selectedAgent.percentages.PHOTO}%</span></div>
                <div className="sig-segment ticket" style={{ width: `${selectedAgent.percentages.TICKET}%` }}><span>TICKET {selectedAgent.percentages.TICKET}%</span></div>
              </div>
            </div>

            <div className="dossier-details-grid">
              <div className="dossier-box">
                <h5>Kronologia</h5>
                <p>Eka yhteys: {new Date(selectedAgent.firstSeen).toLocaleString()}</p>
                <p>Status: <strong>{selectedAgent.status}</strong></p>
              </div>
              <div className="dossier-box">
                <h5>Tekniikka</h5>
                <p>Laite: {selectedAgent.latest.tech_profile?.os}</p>
                <p>Viipymä: <strong>{Math.floor(selectedAgent.totalTime / 60)} min</strong></p>
              </div>
            </div>
            <button className="jc-btn ghost mt-2" style={{ width: '100%' }} onClick={() => setSelectedAgent(null)}>Sulje Dossier</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentinelGuardian;