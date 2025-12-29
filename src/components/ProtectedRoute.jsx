import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom'; // 1. Tuo useLocation
import { useGameConfig } from '../hooks/useGameConfig';

const ProtectedRoute = ({ children, minPhase = 'LIVE' }) => {
  // 2. Lue URL-parametrit
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlId = searchParams.get('id');
  
  // 3. Lue LocalStorage
  const storedId = localStorage.getItem('my_guest_id');

  // 4. Määritä lopullinen ID (URL voittaa, jos se on olemassa)
  const guestId = urlId || storedId;

  // 5. (Valinnainen) Tallenna URL-ID muistiin, jotta se pysyy tallessa refreshin jälkeen
  useEffect(() => {
    if (urlId) {
      localStorage.setItem('my_guest_id', urlId);
    }
  }, [urlId]);

  const { phaseValue, isBanned, loading } = useGameConfig(guestId);

  const PHASE_VALUES = { 'TICKET_ONLY': 0, 'LOBBY': 1, 'LIVE': 2, 'ENDING': 3 };
  const requiredValue = PHASE_VALUES[minPhase];

  if (loading) return <div className="loading-screen">Ladataan salausavaimia...</div>;

  // 1. Jos bannattu -> Ulos
  if (isBanned) {
    return (
      <div style={{background:'black', color:'red', height:'100vh', padding:'50px', textAlign:'center'}}>
        <h1>ACCESS DENIED</h1>
        <p>Your ID has been flagged by Sentinel Security.</p>
      </div>
    );
  }

  // 2. Jos vaihe ei riitä -> Ohjaa takaisin lippuun
  // Huom: Jos guestId puuttuu kokonaan, ohjataan etusivulle
  if (phaseValue < requiredValue) {
    return <Navigate to={guestId ? `/lippu/${guestId}` : '/'} replace />;
  }

  // 3. OK
  return children;
};

export default ProtectedRoute;