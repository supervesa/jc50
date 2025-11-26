import React, { useRef, useEffect, useState } from 'react';

// Nämä ovat uudet animoitavat tekstit
const splashLines = [
  "Jälleen kerran..",
  "pimeän ja kylmän keskellä..",
  "puolivuosisadan juhlat",
  "JC50 - Jukka Club"
];

// Lasketaan animaation kesto CSS-asetusten perusteella
// (Rivien määrä - 1) * porrastus + viimeisen rivin kesto
// (4 - 1) * 1.5s + (0.7s + 1.2s) + 0.5s puskuri = 4.5s + 1.9s + 0.5s = 6.9s
const SPLASH_TOTAL_DURATION = 6900; // 6.9 sekuntia millisekunteina

function HeroSection() {
  const canvasRef = useRef(null);
  const [isSplash, setIsSplash] = useState(false);

// --- SPLASH-LOGIIKKA (PAKOTETTU PÄÄLLE KEHITYSTÄ VARTEN) ---
  useEffect(() => {
    
    // 1. POISTA TAI KOMMENTOI NÄMÄ RIVIT VÄLIAIKAISESTI:
    // const hasVisited = sessionStorage.getItem('hasVisited');
    // if (!hasVisited) {
    //   sessionStorage.setItem('hasVisited', 'true');
    // }

    // 2. Aseta splash-tila päälle JOKA Kerta
    setIsSplash(true); 
    
    // 3. Aseta ajastin, joka poistaa sen animaation jälkeen
    const timer = setTimeout(() => {
      setIsSplash(false);
    }, SPLASH_TOTAL_DURATION); // 6.9 sekuntia

    return () => clearTimeout(timer); 

    // 4. POISTA TAI KOMMENTOI MYÖS TÄMÄ LOPETUS-AALTOSULJE:
    // } 
    
  }, []); // Tyhjä taulukko [] on tärkeä

  // --- CANVAS-ANIMAATIO (Pysyy samana) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; 
    
    const ctx = canvas.getContext('2d');
    let frameId; 

    if (canvas.parentElement) {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    } else {
      canvas.width = window.innerWidth;
      canvas.height = 300; 
    }

    let particles = [];
    const particleCount = 70;
    const particleColor = 'rgba(0, 231, 255, 0.6)';

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, 
        vy: (Math.random() - 0.5) * 0.3, 
        radius: Math.random() * 1.5,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = particleColor;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      frameId = requestAnimationFrame(animate);
    }
    animate(); 
    return () => cancelAnimationFrame(frameId);
  }, []); 

  // --- RENDERÖINTI (PÄIVITETTY EHDOHIN) ---
  const heroClasses = `jc-hero ${isSplash ? 'splash-mode' : ''}`;

  return (
    <header className={heroClasses}>
      
      {/* Canvas on aina taustalla */}
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%', 
          zIndex: 1, pointerEvents: 'none' 
        }} 
      />
      
      {/* TÄMÄ ON PÄÄMUUTOS:
        Näytetään joko splash-tekstit TAI normaali sisältö
      */}
      {isSplash ? (
        // --- NÄYTETÄÄN KUN isSplash = TRUE ---
        <div className="splash-text-container" style={{ position: 'relative', zIndex: 10 }}>
          {splashLines.map((line, index) => (
            <h1 
              key={index} 
              className={`splash-line ${index === 3 ? 'large' : ''}`} 
              style={{
                // Porrastetaan animaatiot 1.5s välein
                // Sisääntulo alkaa (indeksi * 1.5s)
                // Ulosmeno alkaa (indeksi * 1.5s) + 0.7s (sisääntulon kesto)
                animationDelay: `calc(${index} * 1.5s), calc(${index} * 1.5s + 0.7s)`
              }}
            >
              {line}
            </h1>
          ))}
        </div>
      ) : (
        // --- NÄYTETÄÄN KUN isSplash = FALSE ---
        <div className="hero-content-container" style={{ position: 'relative', zIndex: 10 }}> 
          <h2 className="jc-h2">Tervetuloa</h2>
          <h1 className="jc-h1">JC - Jukka Clubiin</h1>
          <p className="lead">Eksklusiivinen ilta Jukan 50-vuotisen matkan kunniaksi.</p>
        </div>
      )}
      
    </header>
  );
}

export default HeroSection;