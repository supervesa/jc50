import React, { useRef, useEffect, useState } from 'react';

const splashLines = [
  "On tullut aika...",
  "pimeän ja kylmän keskellä..",
  "juhlia puolivuosisadan kunniaksi",
  "J:Club 50", // Tämä on indeksi 3 (Large)
  "Hold on to your hat, nu kör vi!" // Tämä on indeksi 4
];

// LASKUKAAVA:
// (Viimeinen indeksi 4 * tahti 2.2s) + luku-aika 1.5s + puskuri 1s
// 8.8s + 1.5s + 1s = n. 11.5s
const SPLASH_TOTAL_DURATION = 11500; 

function HeroSection() {
  const canvasRef = useRef(null);
  const [isSplash, setIsSplash] = useState(false);

  // --- SPLASH-LOGIIKKA (KEHITYSTILA: AINA PÄÄLLÄ) ---
  useEffect(() => {
    setIsSplash(true); 
    
    const timer = setTimeout(() => {
      setIsSplash(false);
    }, SPLASH_TOTAL_DURATION);

    return () => clearTimeout(timer); 
  }, []); 

  // --- CANVAS-ANIMAATIO: RAFFI DIGI-ROMU ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; 
    const ctx = canvas.getContext('2d');
    let frameId; 

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let particles = [];
    const particleCount = 120; // Hieman vähemmän, mutta isompia

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        // Paljon kovempi vauhti sivulle (viima)
        vx: Math.random() * 4 + 2, 
        // Kovempi putoamisvauhti
        vy: Math.random() * 3 + 3,   
        // Koko vaihtelee enemmän (pienestä pölystä isoihin siruihin)
        size: Math.random() * 5 + 1, 
        // Pyöriminen (rotaatio)
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        color: `rgba(${200 + Math.random()*55}, ${230 + Math.random()*25}, 255, ${Math.random() * 0.5 + 0.2})`
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Respawn
        if (p.y > canvas.height || p.x > canvas.width) {
            p.y = -20; 
            p.x = Math.random() * (canvas.width + 200) - 200; 
            p.vx = Math.random() * 4 + 2;
            p.vy = Math.random() * 3 + 3;
        }

        // PIIRRETÄÄN NELIÖITÄ JA SUORAKULMIOITA (RAFFIMPI)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        
        // Piirretään suorakulmio (x, y, width, height)
        // Osa on neliöitä, osa "tikkuja"
        const width = p.size;
        const height = p.size * (Math.random() > 0.5 ? 1 : 3); // 50% mahis olla pitkä siru
        
        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.restore();
      });
      
      frameId = requestAnimationFrame(animate);
    }
    animate(); 
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const heroClasses = `jc-hero ${isSplash ? 'splash-mode' : ''}`;

  return (
    <header className={heroClasses}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%', 
          zIndex: 1, pointerEvents: 'none' 
        }} 
      />
      
      {isSplash ? (
        // SPLASH-TEKSTIT
        <div className="splash-text-container" style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          {splashLines.map((line, index) => (
            <h1 
              key={index} 
              // Jos haluat "JC50" isoksi, pidä index === 3.
              // Jos haluat viimeisen lauseen isoksi, muuta index === 4.
              className={`splash-line ${index === 3 ? 'large' : ''}`} 
              style={{
                // Nopeutin tahtia hieman (2.5s -> 2.2s), jotta jaksaa odottaa loppuun
                animationDelay: `calc(${index} * 2.2s), calc(${index} * 2.2s + 1.5s)`
              }}
            >
              {line}
            </h1>
          ))}
        </div>
      ) : (
        // NORMAALI OTSIKKO
        <div className="hero-content-container" style={{ position: 'relative', zIndex: 10 }}> 
          <h2 className="jc-h2">Tervetuloa</h2>
          <h1 className="jc-h1">J:Club 50 <br />It's crazy <br />it's party </h1>
          <p className="lead">Eksklusiivinen ilta Jukan 50-vuotisen matkan kunniaksi.</p>
        </div>
      )}
      
    </header>
  );
}

export default HeroSection;