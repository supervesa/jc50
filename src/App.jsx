import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import Home from './pages/Home/Home.jsx';
import RelationshipMap from './pages/RelationshipMap/RelationshipMap.jsx';
import UploadPhoto from './pages/UploadPhoto/UploadPhoto.jsx';
import SecretPage from './pages/SecretPage/SecretPage.jsx';

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
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

// TÄMÄ RIVI PUUTTUU TODENNÄKÖISESTI:
export default App;