// src/pages/LiveWall/components/GridFlight.jsx

import React, { useMemo } from 'react';
import PhotoCard from '../PhotoCard';
import './GridFlight.css';

const GridFlight = ({ posts, activeIndex = 0 }) => {
  
  // 1. Lasketaan koordinaatit: SUORA TUNNELI
  const coords = useMemo(() => {
    return posts.map((_, i) => {
      // Etäisyys kuvien välillä (pikseleinä)
      const gap = 1500; 
      
      return {
        // X ja Y: Pieni satunnainen heittely, jotta ei ole liian kliininen
        x: (Math.random() - 0.5) * 400, 
        y: (Math.random() - 0.5) * 300,
        // Z: Tärkein! Jokainen kuva on 1500px kauempana edellisestä
        z: -i * gap, 
        // Pieni kallistus
        rotX: (Math.random() - 0.5) * 10,
        rotY: (Math.random() - 0.5) * 10,
        rotZ: (Math.random() - 0.5) * 5
      };
    });
  }, [posts]);

  // 2. Kameran sijainti (Maailma liikkuu vastakkaiseen suuntaan)
  // Jos aktiivinen kuva on kohdassa Z=-3000, maailma siirtyy Z=+3000
  const activeCoord = coords[activeIndex] || { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 };

  return (
    <div className="grid-flight-scene">
      <div 
        className="grid-world"
        style={{
          transform: `
            translate3d(0, 0, 0)
            rotateX(${-activeCoord.rotX}deg)
            rotateY(${-activeCoord.rotY}deg)
            translate3d(${-activeCoord.x}px, ${-activeCoord.y}px, ${-activeCoord.z + 100}px)
          `
        }}
      >
        {/* Lattia-efekti */}
        <div className="grid-floor"></div>

        {posts.map((post, i) => {
          const pos = coords[i];
          // Näytetään aktiivisena myös pari seuraavaa, jotta ne eivät ole liian sumeita
          const isActive = i === activeIndex;
          
          return (
            <div 
              key={post.id}
              className={`grid-card-container ${isActive ? 'active' : 'inactive'}`}
              style={{
                transform: `
                  translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
                  rotateX(${pos.rotX}deg)
                  rotateY(${pos.rotY}deg)
                  rotateZ(${pos.rotZ}deg)
                `
              }}
            >
              <PhotoCard post={post} />
              
              {/* Yhteysviiva seuraavaan kuvaan */}
              {i < posts.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: '2px', height: '1500px', // Yltää seuraavaan
                  background: 'linear-gradient(to bottom, #00ff41, transparent)',
                  transformOrigin: 'top center',
                  transform: 'rotateX(-90deg)', // Kääntää viivan syvyyssuuntaan
                  opacity: 0.4
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GridFlight;