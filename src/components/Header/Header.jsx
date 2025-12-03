import React from 'react';
import { Link } from 'react-router-dom';
// 1. Poistetaan moduulityylien tuonti
// import styles from './Header.module.css'; 

function Header() {
  return (
    // 2. Tehdään ylätunnisteesta täysleveä palkki,
    //    jolla on samanlainen reuna kuin footerissa.
    <header style={{ 
      padding: '1rem 0', 
      borderBottom: '1px solid rgba(255, 255, 255, 0.03)' 
    }}>
      
      {/* 3. Käytetään .jc-wrapperia sisällön keskittämiseen
           ja .flex-apuluokkaa asetteluun. */}
      <div 
        className="jc-wrapper flex" 
        style={{ justifyContent: 'space-between' }}
      >
        
        {/* 4. Poistetaan turhat luokat logosta
        <h1>
          <Link to="/">
            JC50
          </Link>
        </h1> */}
        
        {/* 5. Käytetään .flex-luokkaa navigaatiolinkkien asetteluun
        <nav className="flex">
          <Link to="/">Koti</Link>
          <Link to="/relaatiopuu">Relaatiopuu</Link>
          <Link to="/salaisuus">Salainen</Link>
        </nav> */}

      </div>
    </header>
  );
}

// 6. Lisätään puuttuva export-rivi
export default Header;