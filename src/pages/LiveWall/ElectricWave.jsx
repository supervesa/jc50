import React, { useEffect, useRef } from 'react';

const CosmicFlow = () => {
  const glowCanvasRef = useRef(null);
  const sharpCanvasRef = useRef(null);

  useEffect(() => {
    const glowCanvas = glowCanvasRef.current;
    const sharpCanvas = sharpCanvasRef.current;
    const ctxGlow = glowCanvas.getContext('2d');
    const ctxSharp = sharpCanvas.getContext('2d');
    
    ctxGlow.globalCompositeOperation = 'lighter';
    ctxSharp.globalCompositeOperation = 'source-over';

    let animationFrameId;
    let time = 0;

    const resize = () => {
      glowCanvas.width = window.innerWidth;
      glowCanvas.height = window.innerHeight;
      sharpCanvas.width = window.innerWidth;
      sharpCanvas.height = window.innerHeight;
      ctxGlow.globalCompositeOperation = 'lighter';
    };
    window.addEventListener('resize', resize);
    resize();


    // --- PARTIKKELIEN ALUSTUS ---
    
    // BOKEH (Pehmeät pallerot) - Pidetään nämä ennallaan
    const bokehs = Array.from({ length: 20 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: 20 + Math.random() * 60,
      speedY: 0.2 + Math.random() * 0.5,
      oscSpeed: 0.01 + Math.random() * 0.02,
      oscAmp: 20 + Math.random() * 50,
      initialX: Math.random() * window.innerWidth,
      color: Math.random() > 0.5 ? 'rgba(120, 0, 255, 0.15)' : 'rgba(0, 200, 255, 0.15)'
    }));

    // LASERIT (Wormhole Edition)
    // Nyt emme tallenna x/y koordinaatteja, vaan kulman ja etäisyyden keskustasta.
    const lasers = Array.from({ length: 10 }, () => ({
      angle: Math.random() * Math.PI * 2, // Satunnainen suunta (0-360 astetta)
      distance: Math.random() * 200, // Aloitusetäisyys keskustasta
      baseSpeed: 2 + Math.random() * 3, // HITAAMPI PERUSNOPEUS (oli 10-40)
      color: Math.random() > 0.7 ? '#FFFFFF' : (Math.random() > 0.5 ? '#FF00FF' : '#00FFFF'),
    }));


    // --- PIIRTOFUNKTIOT ---

    // Aaltojen piirto (Glow Layer)
    const drawStrand = (ctx, yBase, amp, freq, speed, color, thickness) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      const width = glowCanvas.width;
      for (let x = 0; x <= width; x += 8) { 
        const y = yBase + 
          Math.sin(x * freq + time * speed) * amp +
          Math.sin(x * freq * 0.5 + time * speed * 1.5) * (amp * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const render = () => {
      ctxGlow.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
      ctxSharp.clearRect(0, 0, sharpCanvas.width, sharpCanvas.height);
      
      time += 0.008;
      const w = glowCanvas.width;
      const h = glowCanvas.height;
      const centerX = w / 2;
      const centerY = h / 2;
      const baseAmp = h * 0.12;
      // Lasketaan diagonaali, jotta tiedetään milloin laser on varmasti ulkona ruudusta
      const maxDistance = Math.sqrt(w*w + h*h) / 2; 

      // --- 1. BOKEH (Glow Layer) ---
      bokehs.forEach(b => {
        b.y -= b.speedY;
        b.x = b.initialX + Math.sin(time * b.oscSpeed * 100) * b.oscAmp;
        if (b.y + b.radius < 0) {
          b.y = h + b.radius;
          b.initialX = Math.random() * w;
        }
        ctxGlow.beginPath();
        ctxGlow.fillStyle = b.color;
        ctxGlow.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctxGlow.fill();
      });

      // --- 2. AALLOT (Glow Layer) ---
      drawStrand(ctxGlow, centerY, baseAmp, 0.002, 0.5, 'rgba(120, 0, 255, 0.5)', 20);
      drawStrand(ctxGlow, centerY + 20, baseAmp, 0.003, -0.6, 'rgba(0, 200, 255, 0.5)', 15);
      drawStrand(ctxGlow, centerY, baseAmp, 0.002, 0.5, 'rgba(255, 0, 255, 0.8)', 6);
      drawStrand(ctxGlow, centerY + 20, baseAmp, 0.003, -0.6, 'rgba(0, 255, 255, 0.8)', 5);
      drawStrand(ctxGlow, centerY, baseAmp, 0.002, 0.5, '#FFFFFF', 2);
      drawStrand(ctxGlow, centerY + 20, baseAmp, 0.003, -0.6, '#FFFFFF', 1.5);


      // --- 3. LASERIT (Sharp Layer - WORMHOLE MODE) ---
      lasers.forEach(l => {
        // LIIKE: Nopeus kiihtyy kun etäisyys kasvaa (perspektiivi)
        // Mitä kauempana keskustasta, sitä nopeammin liikkuu.
        const currentSpeed = l.baseSpeed * (l.distance / 200 + 1);
        l.distance += currentSpeed;

        // LASKETAAN KOORDINAATIT (Trigonometria)
        // Laserin etupää (kauimpana keskustasta)
        const headX = centerX + Math.cos(l.angle) * l.distance;
        const headY = centerY + Math.sin(l.angle) * l.distance;

        // Laserin häntäpää. Häntä pitenee vauhdin kasvaessa.
        const tailLength = currentSpeed * 8 + 50; // Pituus riippuu vauhdista
        const tailDistance = l.distance - tailLength;
        // Varmistetaan ettei häntä mene keskustan "yli" taaksepäin
        const actualTailDist = Math.max(0, tailDistance); 
        const tailX = centerX + Math.cos(l.angle) * actualTailDist;
        const tailY = centerY + Math.sin(l.angle) * actualTailDist;

        // PIIRRÄ
        ctxSharp.beginPath();
        // Paksuus kasvaa etäisyyden mukaan (tulee "lähemmäs kameraa")
        ctxSharp.lineWidth = 1 + (l.distance / maxDistance) * 5;

        // Gradientti: Läpinäkyvä häntä -> Kirkas kärki
        const grad = ctxSharp.createLinearGradient(tailX, tailY, headX, headY);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, l.color);
        ctxSharp.strokeStyle = grad;

        // Pyöristetyt päät näyttävät paremmalta tässä vauhdissa
        ctxSharp.lineCap = 'round'; 
        
        ctxSharp.moveTo(tailX, tailY);
        ctxSharp.lineTo(headX, headY);
        ctxSharp.stroke();

        // RESET: Jos mennyt kokonaan ulos ruudusta, aloita alusta keskeltä
        if (tailDistance > maxDistance) {
          l.distance = Math.random() * 50; // Aloita läheltä keskustaa
          l.angle = Math.random() * Math.PI * 2; // Uusi satunnainen suunta
          // Arvotaan uusi värikin vaihtelun vuoksi
          l.color = Math.random() > 0.7 ? '#FFFFFF' : (Math.random() > 0.5 ? '#FF00FF' : '#00FFFF');
        }
      });
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const canvasStyle = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none',
  };

  return (
    <>
      {/* KERROS 1: GLOW (Aallot + Bokeh) */}
      <canvas 
        ref={glowCanvasRef} 
        style={{
          ...canvasStyle,
          zIndex: 5,
          filter: 'blur(3px) brightness(1.3) contrast(1.2)'
        }}
      />
      
      {/* KERROS 2: SHARP (Wormhole Laserit) */}
      <canvas 
        ref={sharpCanvasRef} 
        style={{
          ...canvasStyle,
          zIndex: 6, 
          // Ei filteriä -> terävät laserit
        }}
      />
    </>
  );
};

export default CosmicFlow;