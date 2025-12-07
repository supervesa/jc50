import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import { Trophy, Clock, XCircle, CheckCircle } from 'lucide-react';

const History = ({ guestId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guestId) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('mission_log')
        .select('*')
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching mission history:", error);
      } else {
        setHistory(data);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [guestId]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const options = { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return date.toLocaleDateString('fi-FI', options);
  };
  
  if (loading) {
    return <div className="history-loading">Ladataan tietoja...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <Clock size={32} />
        <p>Ei kirjattua historiaa.</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-list">
        {history.map((log) => {
          const isApproved = log.approval_status === 'approved';
          const isPending = log.approval_status === 'pending';
          const isRejected = log.approval_status === 'rejected';
          
          let statusClass = 'status-default';
          let statusIcon = <Trophy size={15} />;
          let xpDisplay = `+${log.xp_earned || 0} XP`;
          let statusText = 'Hyväksytty';
          let reason = log.custom_reason || log.mission_id || 'Tehtävä suoritettu';

          if (isApproved) {
            statusClass = 'status-approved';
            statusIcon = <CheckCircle size={15} />;
            if (log.xp_earned === 0) xpDisplay = '0 XP';
          } else if (isPending) {
            statusClass = 'status-pending';
            statusIcon = <Clock size={15} />;
            statusText = 'Odottaa';
            xpDisplay = '---';
          } else if (isRejected) {
            statusClass = 'status-rejected';
            statusIcon = <XCircle size={15} />;
            statusText = 'Hylätty';
            xpDisplay = 'HYLÄTTY';
          }

          return (
            <div key={log.id} className={`history-item ${statusClass}`}>
              
              <div className="history-item-top">
                <span className="history-badge">
                  {statusIcon} {statusText}
                </span>
                <span className="history-time">{formatTimestamp(log.created_at)}</span>
              </div>
              
              <div className="history-item-content">
                <div className="history-reason">{reason}</div>
                <div className="history-xp">{xpDisplay}</div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;