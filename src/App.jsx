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

function App() {
  /**
   * Nexuksen ja muiden komponenttien tarvitsema käyttäjätieto.
   * Haetaan se tässä vaiheessa suoraan localStoragesta.
   */
const currentUserGuestId = localStorage.getItem('my_guest_id');

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
 <Route path="/nexus/:ticketId" element={
  <ProtectedRoute minPhase="HYPE_WEEK">
    <NexusPage />
  </ProtectedRoute>
          } />

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