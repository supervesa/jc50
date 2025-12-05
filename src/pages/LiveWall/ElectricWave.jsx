import React, { useEffect, useRef } from 'react';

const ElectricWave = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const createGradient = (ctx, width, colorStart, colorMid, colorEnd) => {
      const gradient = ctx.createLinearGradient(width, 0, 0, 0);
      gradient.addColorStop(0, colorStart);
      gradient.addColorStop(0.5, colorMid);
      gradient.addColorStop(1, colorEnd);
      return gradient;
    };

    // Lisätty parametri: glowColor
    const drawWave = (gradientColors, thickness, amp, freq, speed, yOffset, glowColor) => {
      ctx.beginPath();
      
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // --- TÄSSÄ ON SE BLURRAUS / HEHKU ---
      ctx.shadowBlur = 25;       // Hehkun määrä (oli 0 tai puuttui)
      ctx.shadowColor = glowColor; // Hehkun väri
      // ------------------------------------

      const gradient = createGradient(
        ctx, 
        canvas.width, 
        gradientColors[0], 
        gradientColors[1], 
        gradientColors[2]
      );
      ctx.strokeStyle = gradient;

      const centerY = canvas.height / 2 + yOffset; 

      for (let x = 0; x <= canvas.width; x += 5) {
        const y = centerY + 
          Math.sin(x * freq + time * speed) * amp + 
          Math.sin(x * (freq * 0.5) - time * (speed * 0.5)) * (amp * 0.5);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Nollataan varjo, ettei se jää "päälle" seuraavaa piirtoa varten vahingossa
      ctx.shadowBlur = 0;
    };

    const render = () => {
      // Tyhjennetään ruutu
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time += 0.02; // Rauhallinen vauhti
      const baseAmp = window.innerHeight * 0.15;

      // --- AALTO 1: Magenta/Violetti ---
      drawWave(
        ['#ff00ff', '#bd00ff', '#00eaff'], 
        8,              // Paksuus
        baseAmp, 
        0.003, 
        1.0, 
        0,
        '#ff00ff'       // Hehkun väri (Magenta)
      );

      // --- AALTO 2: Syaani/Sininen ---
      drawWave(
        ['#00ffff', '#0088ff', '#8800ff'], 
        5,              // Paksuus
        baseAmp * 0.8, 
        0.004, 
        -1.2, 
        0,
        '#00ffff'       // Hehkun väri (Syaani)
      );

      // --- AALTO 3: Valkoinen ydin ---
      drawWave(
        ['#ffffff', '#ffffff', '#ffffff'], 
        3,              // Paksuus
        baseAmp * 0.6, 
        0.002, 
        1.5, 
        0,
        '#ffffff'       // Hehkun väri (Valkoinen)
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
};

export default ElectricWave;