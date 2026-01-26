import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import './SentinelGuardian.css';
import { 
  Shield, 
  Activity, 
  Smartphone, 
  BatteryLow, 
  WifiOff, 
  AlertTriangle, 
  UserCheck 
} from 'lucide-react';

const SentinelGuardian = ({ guests }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    osDistribution: {},
    alerts: [],
    totalEngagement: 0
  });

  // 1. Datan haku ja reaaliaikainen seuranta
  useEffect(() => {
    fetchSentinelLogs();

    const channel = supabase
      .channel('sentinel_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentinel_access_logs' }, (payload) => {
        setLogs(prev => [payload.new, ...prev].slice(0, 100));
        processStats([payload.new, ...logs]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchSentinelLogs = async () => {
    const { data, error } = await supabase
      .from('sentinel_access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      setLogs(data);
      processStats(data);
    }
    setLoading(false);
  };

  // 2. Analyysimoottori: Aggregointi ja hälytykset
  const processStats = (rawLogs) => {
    const osMap = {};
    const alertList = [];
    
    rawLogs.forEach(log => {
      // OS Jakauma
      const os = log.tech_profile?.os || 'Unknown';
      osMap[os] = (osMap[os] || 0) + 1;

      // Hälytyslogiikka
      if (log.battery_alert) alertList.push({ type: 'BATTERY', guest: log.guest_id });
      if (log.signals?.includes('Signal Drift')) alertList.push({ type: 'SIGNAL', guest: log.guest_id });
      if (log.signals?.includes('Incompatibility')) alertList.push({ type: 'TECH', guest: log.guest_id });
    });

    setStats({
      osDistribution: osMap,
      alerts: alertList,
      totalEngagement: rawLogs.length
    });
  };

  // 3. Apufunktio sitoutumisasteen väritykseen
  const getEngagementStyle = (level) => {
    switch (level) {
      case 'Deep Immersion': return 'sentinel-status-deep';
      case 'Operative Briefing': return 'sentinel-status-active';
      case 'Quick Glance': return 'sentinel-status-brief';
      default: return 'sentinel-status-ghost';
    }
  };

  if (loading) return <div className="sentinel-loading">Alustetaan Sentinel-yhteyttä...</div>;

  return (
    <div className="sentinel-wrapper">
      
      {/* KERROS 1: KOOTUT TIEDOT & HÄLYTYKSET (MOBIILI-OPTIMOITU) */}
      <div className="sentinel-dashboard-grid">
        
        {/* Tekninen tilannekuva */}
        <div className="jc-card sentinel-card">
          <div className="sentinel-card-header">
            <Smartphone size={20} className="sentinel-icon-turquoise" />
            <h3 className="sentinel-h3">Tekninen Profiili</h3>
          </div>
          <div className="sentinel-stats-list">
            {Object.entries(stats.osDistribution).map(([os, count]) => (
              <div key={os} className="sentinel-stat-item">
                <span className="sentinel-label">{os}</span>
                <span className="sentinel-value">{count} käyttäjää</span>
              </div>
            ))}
          </div>
        </div>

        {/* Aktiiviset hälytykset */}
        <div className="jc-card sentinel-card sentinel-alert-border">
          <div className="sentinel-card-header">
            <AlertTriangle size={20} className="sentinel-icon-magenta" />
            <h3 className="sentinel-h3">Anomaliat</h3>
          </div>
          <div className="sentinel-alerts-container">
            {stats.alerts.length > 0 ? (
              stats.alerts.slice(0, 3).map((alert, i) => (
                <div key={i} className="sentinel-alert-toast">
                  {alert.type === 'BATTERY' && <BatteryLow size={14} />}
                  {alert.type === 'SIGNAL' && <WifiOff size={14} />}
                  <span>{alert.type} Anomalia havaittu</span>
                </div>
              ))
            ) : (
              <p className="sentinel-muted-text">Ei kriittisiä poikkeamia.</p>
            )}
          </div>
        </div>
      </div>

      {/* KERROS 2: VIERASKOHTAINEN SEURANTA (DETAIL TRACKER) */}
      <div className="jc-card sentinel-card mt-2">
        <div className="sentinel-card-header">
          <UserCheck size={20} className="sentinel-icon-lime" />
          <h3 className="sentinel-h3">Vieraskohtainen Sitoutumisäly</h3>
        </div>
        
        <div className="sentinel-table-container">
          <table className="sentinel-table">
            <thead>
              <tr>
                <th>Vieras</th>
                <th>Tila</th>
                <th>Viimeisin Toiminto</th>
                <th className="sentinel-hide-mobile">Laite</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="sentinel-row">
                  <td className="sentinel-guest-name">
                    {guests.find(g => g.id === log.guest_id)?.name || 'Tuntematon'}
                  </td>
                  <td>
                    <span className={`sentinel-badge ${getEngagementStyle(log.engagement)}`}>
                      {log.engagement || 'Ghost Trace'}
                    </span>
                  </td>
                  <td className="sentinel-action-cell">
                    {log.interaction_point || 'Passive Heartbeat'}
                  </td>
                  <td className="sentinel-hide-mobile sentinel-muted-text">
                    {log.tech_profile?.browser} ({log.tech_profile?.os})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SentinelGuardian;