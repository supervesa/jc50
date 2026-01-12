import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGameConfig } from '../hooks/useGameConfig';

const ProtectedRoute = ({ children, minPhase = 'HYPE_WEEK' }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlId = searchParams.get('id');
  const storedId = localStorage.getItem('my_guest_id');
  const guestId = urlId || storedId;

  useEffect(() => {
    if (urlId) {
      localStorage.setItem('my_guest_id', urlId);
    }
  }, [urlId]);

  const { phaseValue, isBanned, loading, isTester } = useGameConfig(guestId);

  const PHASE_VALUES = { 
    'TICKET_ONLY': 0,
    'EARLY_ACCESS': 0, 
    'HYPE_WEEK': 1, 
    'SHOWTIME': 2, 
    'ENDING': 3 
  };
  
  const requiredValue = PHASE_VALUES[minPhase] || 1;

  if (loading) return (
    <div style={{background: '#111', color: '#00ff00', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace'}}>
      {'>'} INITIALIZING SECURE CONNECTION...
    </div>
  );

  if (isBanned) {
    return (
      <div style={{background:'black', color:'red', height:'100vh', padding:'50px', textAlign:'center'}}>
        <h1>ACCESS DENIED</h1>
        <p>Your ID has been flagged by Sentinel Security.</p>
      </div>
    );
  }

  // Jos testaaja, hänellä on aina vähintään pääsy Hype-viikolle (1)
  const effectivePhaseValue = isTester ? Math.max(phaseValue, 1) : phaseValue;

  if (effectivePhaseValue < requiredValue) {
    return <Navigate to={guestId ? `/lippu/${guestId}` : '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;