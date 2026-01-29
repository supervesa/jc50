import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import Home from './pages/Home/Home.jsx';
import RelationshipMap from './pages/RelationshipMap/RelationshipMap.jsx';
import UploadPhoto from './pages/UploadPhoto/UploadPhoto.jsx';
import SecretPage from './pages/SecretPage/SecretPage.jsx';
import TicketPage from './pages/TicketPage/TicketPage.jsx';
import LiveWall from './pages/LiveWall/LiveWall.jsx';
import AgentPage from './pages/AgentPage/AgentPage';
import AdminPage from './pages/AdminPage/AdminPage';
import HeistLeaderboard from './components/leader/HeistLeaderboard';
import HeistPersonalScoreboard from './pages/AgentPage/HeistPersonalScoreboard';
import PhotoWall from './pages/PhotoWall';
import './mobile-universal.css'; // Mobiilioptimointi
import AntheroPage from './pages/AntheroPage';
import ScotlandYardGame from './game/scotlandyard';
import EmailViewer from './components/EmailViewer';
import ProtectedRoute from './components/ProtectedRoute';

// NEXUS - Sosiaalinen hermokeskus
import NexusPage from './pages/nexus/index.jsx';

// KONFIGURAATIO JA BÄNNI-LOGIIKKA
import { useGameConfig } from './hooks/useGameConfig'; 

function App() {
  /**
   * Nexuksen ja muiden komponenttien tarvitsema käyttäjätieto.
   */
  const currentUserGuestId = localStorage.getItem('my_guest_id');

  // Haetaan järjestelmän tila ja bänni-status reaaliajassa
  const { isBanned, loading } = useGameConfig(currentUserGuestId);

  // 1. LATAUSTILA: Estetään vilkkuminen haun aikana
  if (loading) {
    return null; // Tai kevyt latausindikaattori
  }

  // 2. BLACKOUT SCREEN: Jos agentti on bännätty, näytetään vain tämä
  if (isBanned) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000',
        color: '#00e7ff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'monospace',
        textAlign: 'center',
        padding: '20px',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999
      }}>
        <div style={{
          border: '1px solid #00e7ff',
          padding: '2rem',
          maxWidth: '500px',
          boxShadow: '0 0 20px rgba(0, 231, 255, 0.2)'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            [ ERROR_CODE: CONNECTION_TERMINATED ]
          </p>
          <p style={{ color: '#ccc', letterSpacing: '1px' }}>
            Järjestelmäyhteys katkennut, tietoja päivitetään...
          </p>
          <div style={{ 
            marginTop: '20px', 
            height: '2px', 
            width: '100%', 
            background: 'linear-gradient(90deg, transparent, #00e7ff, transparent)',
            animation: 'pulse 2s infinite' 
          }}></div>
        </div>
      </div>
    );
  }

  // 3. NORMAALI SOVELLUS: Jos kaikki kunnossa
  return (
    <div className="App">
      <Header />
      <main>
        <Routes>
          {/* --- VAIHE 0: AINA AUKI (EARLY ACCESS) --- */}
          <Route path="/" element={<Home />} />
          <Route path="/lippu/:id" element={<TicketPage />} />
          <Route path="/live" element={<LiveWall />} />
          <Route path="/wall/:guestId?" element={<PhotoWall />} />
          
          <Route path="/relaatiopuu" element={<RelationshipMap />} />
          <Route path="/lataa-kuva" element={<UploadPhoto />} />
          <Route path="/salaisuus" element={<SecretPage />} />
          <Route path="/anthero" element={<AntheroPage />} />
          <Route path="/viesti" element={<EmailViewer />} />

          {/* --- VAIHE 1: HYPE WEEK (CHAT & NEXUS AUKI) --- */}
          <Route path="/nexus/:ticketId" element={<NexusPage />} />

          <Route path="/agent" element={
            <ProtectedRoute minPhase="HYPE_WEEK">
              <AgentPage />
            </ProtectedRoute>
          } />

          {/* --- VAIHE 2: SHOWTIME (PELI KÄYNNISSÄ) --- */}
          <Route path="/leaderboard" element={
            <ProtectedRoute minPhase="SHOWTIME">
              <HeistLeaderboard />
            </ProtectedRoute>
          } />
          
          <Route path="/personal-stats" element={
            <ProtectedRoute minPhase="SHOWTIME">
              <HeistPersonalScoreboard />
            </ProtectedRoute>
          } />

          <Route path="/game" element={
            <ProtectedRoute minPhase="SHOWTIME">
              <ScotlandYardGame />
            </ProtectedRoute>
          } />

          {/* ADMIN & HALLINTA */}
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;