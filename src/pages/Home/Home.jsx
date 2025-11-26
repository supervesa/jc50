import React from 'react';
import InfoSection from './InfoSection.jsx';
import Registration from './Registration.jsx';
import HeroSection from '../../components/HeroSection/HeroSection.jsx';
// Huom: Emme tarvitse enää Home.module.css-importia,
// koska käytämme globaaleja jc-neon.css-tyylejä.

function Home() {
 return (
    <div className="jc-wrapper">
      
      {/* 5. Kutsutaan uutta, siistiä komponenttia */}
      <HeroSection />

      {/* Muu sisältö pysyy ennallaan */}
      <InfoSection />
      <Registration />
      
    </div>
  );
}

export default Home;