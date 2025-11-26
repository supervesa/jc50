import React from 'react';
// 1. Poistetaan .module.css-tuonti
// import styles from './InfoCard.module.css';

function InfoCard({ title, children }) {
  return (
    // 2. Vaihdetaan luokaksi "jc-card"
    <div className="jc-card">
      
      {/* 3. Vaihdetaan otsikko käyttämään h2-tyyliä */}
      <h2 className="jc-h2">{title}</h2>
      
      {/* 4. Kääritään sisältö <p>-elementtiin */}
      <p>
        {children}
      </p>
    </div>
  );
}

export default InfoCard;