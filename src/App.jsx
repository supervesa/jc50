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
          <Route path="/" element={<Home />} />
          <Route path="/relaatiopuu" element={<RelationshipMap />} />
          <Route path="/lataa-kuva" element={<UploadPhoto />} />
          <Route path="/salaisuus" element={<SecretPage />} />
          {/* Muuta path haluamaksesi, esim "/hallinta" tai "/admin" */}
  <Route path="/salaisuus" element={<SecretPage />} />
  <Route path="/lippu/:id" element={<TicketPage />} />
  {/* UUSI REITTI */}
          <Route path="/live" element={<LiveWall />} />
       {/* PELIREITIT (Vaatii vähintään LOBBY tai LIVE) */}
           <Route path="/agent" element={
              <ProtectedRoute minPhase="LIVE">
                <AgentPage />
              </ProtectedRoute>
           } />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/leaderboard" element={<HeistLeaderboard />} />
          <Route path="/personal-stats" element={<HeistPersonalScoreboard />} />
   <Route path="/wall/:guestId?" element={<PhotoWall />} />
   <Route path="/anthero" element={<AntheroPage />} />
        <Route path="/game" element={<ScotlandYardGame />} />
        <Route path="/viesti" element={<EmailViewer />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

// TÄMÄ RIVI PUUTTUU TODENNÄKÖISESTI:
export default App;