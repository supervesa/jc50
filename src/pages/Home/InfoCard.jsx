import React from 'react';
// 1. Poistetaan .module.css-tuonti, emme tarvitse sitä enää
// import styles from './InfoCard.module.css';

// Tämä komponentti ottaa 'title' ja 'children' propsit
function InfoCard({ title, children }) {
  return (
    // 2. Tässä on päämuutos:
    // Vaihdetaan 'styles.card' -> 'jc-card'
    // Tämä luokka tuo huurrelasin, reunat ja leijumisefektin
    <div className="jc-card">
      
      {/* 3. Vaihdetaan otsikko käyttämään neon-teeman
           määrittelemää h2-tyyliä (kulta-plasma) */}
      <h2 className="jc-h2">{title}</h2>
      
      {/* 4. Kääritään sisältö (children) <p>-elementtiin,
           jotta se saa oikean leipätekstin tyylin */}
      <p>
        {children}
      </p>
    </div>
  );
}

export default InfoCard;