import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import Home from './pages/Home/Home.jsx';
import RelationshipMap from './pages/RelationshipMap/RelationshipMap.jsx';
import UploadPhoto from './pages/UploadPhoto/UploadPhoto.jsx';
import SecretPage from './pages/SecretPage/SecretPage.jsx';
import TicketPage from './pages/TicketPage/TicketPage.jsx'; // Muista import!
import LiveWall from './pages/LiveWall/LiveWall.jsx';
import AgentPage from './pages/AgentPage/AgentPage';
import AdminPage from './pages/AdminPage/AdminPage';
import HeistLeaderboard from './components/leader/HeistLeaderboard';
import HeistPersonalScoreboard from './pages/AgentPage/HeistPersonalScoreboard';
import PhotoWall from './pages/PhotoWall';
import './mobile-universal.css'
import AntheroPage from './pages/AntheroPage';
import ScotlandYardGame from './game/scotlandyard';
import EmailViewer from './components/EmailViewer';
import ProtectedRoute from './components/ProtectedRoute';
function App() {
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

  {/* --- VAIHE 1: HYPE WEEK (CHAT AUKI) --- */}
  {/* Vaatii vähintään tason 1, jotta pääsee edes agenttisivulle */}
  <Route path="/agent" element={
    <ProtectedRoute minPhase="HYPE_WEEK">
      <AgentPage />
    </ProtectedRoute>
  } />

  {/* --- VAIHE 2: SHOWTIME (PELI KÄYNNISSÄ) --- */}
  {/* Nämä sivut liittyvät suoraan pelimekaniikkaan */}
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

  {/* ADMIN */}
  <Route path="/admin" element={<AdminPage />} />
</Routes>
      </main>
      <Footer />
    </div>
  );
}

// TÄMÄ RIVI PUUTTUU TODENNÄKÖISESTI:
export default App;