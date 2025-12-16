import React, { useMemo } from 'react';
import './Constellation.css';

// Apufunktio: Arvo sijainti, joka EI ole keskellä
const getRandomPosition = (index) => {
  // Pääkuva vie noin 40% leveydestä keskellä ja 60% korkeudesta.
  // Jaetaan ruutu sektoreihin tai "turva-alueisiin" reunoilla.
  
  // Arvotaan onko vasen (0-30%) vai oikea (70-100%) puoli TAI ylä/ala
  const edge = Math.random();
  
  let x, y;
  
  if (edge < 0.5) {
    // Sivut (Vasen tai Oikea)
    const isLeft = Math.random() < 0.5;
    x = isLeft ? Math.random() * 25 : 75 + Math.random() * 25; // 0-25% tai 75-100%
    y = Math.random() * 90; // Koko korkeus (jätetään vähän marginaalia)
  } else {
    // Ylä tai Ala (mutta varotaan osumasta pääkuvan päälle pystysuunnassa)
    const isTop = Math.random() < 0.5;
    x = Math.random() * 100;
    y = isTop ? Math.random() * 15 : 85 + Math.random() * 15; // 0-15% tai 85-100%
  }

  // Satunnainen koko ja viive elävyyden vuoksi
  const size = 60 + Math.random() * 60; // 60px - 120px
  const delay = Math.random() * 0.5; // Eri tahtiin ilmestyminen

  return { x, y, size, delay };
};

const ConstellationHistory = ({ history }) => {
  // Lasketaan positiot vain kun historia muuttuu, jotta ne eivät hypi turhaan.
  // Huom: Oikeassa tuotannossa haluaisimme sitoa positiot ID:hen, jotta vanhat kuvat
  // eivät vaihtaisi paikkaa kun uusi tulee. Tässä yksinkertaistettu versio.
  
  const nodes = useMemo(() => {
    return history.map((post, index) => {
      const pos = getRandomPosition(index);
      return { ...post, ...pos };
    });
  }, [history]);

  if (!history || history.length === 0) return null;

  return (
    <div className="jc-constellation-container">
      
      {/* 1. LAYER: VIIVAT (SVG) */}
      <svg className="jc-constellation-lines">
        {/* Piirretään viiva solmusta seuraavaan luomaan ketju */}
        {nodes.map((node, i) => {
          if (i === nodes.length - 1) return null; // Viimeisestä ei viivaa eteenpäin
          const nextNode = nodes[i + 1];
          return (
            <line 
              key={`line-${i}`}
              x1={`${node.x}%`} y1={`${node.y}%`}
              x2={`${nextNode.x}%`} y2={`${nextNode.y}%`}
              className="jc-constellation-path"
            />
          );
        })}
      </svg>

      {/* 2. LAYER: TÄHDET (KUVAT) */}
      {nodes.map((node, index) => (
        <div 
          key={node.id || index}
          className={`jc-star-node ${index === 0 ? 'latest' : ''}`}
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: `${node.size}px`,
            height: `${node.size}px`,
            animationDelay: `${node.delay}s`
          }}
        >
          <img 
            src={node.image_url} 
            alt="" 
            className="jc-star-img"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      ))}
    </div>
  );
};

export default ConstellationHistory;