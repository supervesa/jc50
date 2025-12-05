import React, { useEffect, useRef } from 'react';

const Kaleidoscope = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Alpha false parantaa suorituskykyä, kuten alkuperäisessä koodissa
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });

    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    // --- 1. Shader Sources (Sinun koodisi) ---
    
    const vert = `
      attribute vec2 aPos;
      void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;

    // "Neon Gatsby V3: Kaleidoscopic Dream & Soft Blur"
    const frag = `
      precision mediump float;
      uniform vec2 u_res;
      uniform float u_time;
      uniform float u_scroll;

      // --- NOISE FUNCTIONS ---
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
        return mix( mix( hash( i + vec2(0.0,0.0) ), hash( i + vec2(1.0,0.0) ), u.x),
                    mix( hash( i + vec2(0.0,1.0) ), hash( i + vec2(1.0,1.0) ), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0; float a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
        return v;
      }

      // --- UUSI FUNKTIO: KALEIDOSKOOPPI ---
      vec2 kaleidoscope(vec2 uv, float segments, float time) {
          float angle = atan(uv.y, uv.x);
          float radius = length(uv);
          float segmentAngle = (3.14159 * 2.0) / segments;
          angle += time * 0.05;
          angle = mod(angle, segmentAngle);
          angle = abs(angle - segmentAngle * 0.5);
          return vec2(cos(angle), sin(angle)) * radius;
      }

      // --- BEAM FUNCTION (MUOKATTU: PEHMEÄMPI BLUR) ---
      float beam(vec2 uv, float height, float amp, float freq, float speed, float t) {
        float y = height + sin(uv.x * freq + t * speed) * amp;
        return 0.015 / (abs(uv.y - y) + 0.01);
      }

      void main() {
        vec2 uvBase = (gl_FragCoord.xy - 0.5 * u_res.xy) / u_res.y;
        float t = u_time * 0.3;
        vec3 col = vec3(0.0);

        // --- 1. SOVELLETAAN KALEIDOSKOOPPI ---
        vec2 kUV = kaleidoscope(uvBase, 8.0, t);

        // --- 2. BACKGROUND: SOFT STEEL ---
        vec3 bgCol = vec3(0.05, 0.06, 0.08);
        float grain = noise(vec2(kUV.x * 100.0, kUV.y * 2.0)); 
        bgCol += vec3(0.03) * grain;
        col = bgCol;

        // --- 3. MIST / FOG (PEHMEÄMPI) ---
        float fog = fbm(kUV * 1.5 + vec2(t * 0.1));
        vec3 mistColor = mix(vec3(0.1, 0.0, 0.15), vec3(0.0, 0.15, 0.2), sin(t*0.2)*0.5+0.5);
        col += mistColor * fog * 2.0;

        // --- 4. SOFT LASER BEAMS ---
        float b1 = beam(kUV, 0.3, 0.2, 2.0, 1.0, t);
        col += vec3(1.0, 0.1, 0.9) * b1; 

        float b2 = beam(kUV, 0.4, 0.15, 4.0, -0.8, t);
        col += vec3(0.1, 0.9, 1.0) * b2;

        float b3 = beam(kUV, 0.1 + sin(t)*0.05, 0.0, 0.0, 0.0, t);
        col += vec3(1.0, 0.7, 0.2) * b3 * 0.8;

        // --- 5. VOLUMETRIC GLOW BOOST ---
        col += vec3(0.6, 0.2, 0.7) * fog * b1 * 1.5;
        col += vec3(0.2, 0.6, 0.8) * fog * b2 * 1.5;

        col -= u_scroll * 0.3;

        float vig = smoothstep(1.3, 0.4, length(uvBase));
        col *= vig;
        col = pow(col, vec3(0.9)); 

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // --- 2. WebGL Setup ---
    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(s));
      }
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u_resLocation = gl.getUniformLocation(prog, 'u_res');
    const u_timeLocation = gl.getUniformLocation(prog, 'u_time');
    const u_scrollLocation = gl.getUniformLocation(prog, 'u_scroll');

    // --- 3. Resize & Scroll Logic ---
    let scrollNorm = 0;
    
    const handleResize = () => {
        // Alkuperäinen logiikka: dpr max 1.5
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        // Asetetaan kankaan koko
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const handleScroll = () => {
        const max = Math.max(document.body.scrollHeight - window.innerHeight, 1);
        scrollNorm = window.scrollY / max;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Alustus
    handleResize();
    handleScroll();

    // --- 4. Animation Loop ---
    let animationFrameId;
    const start = performance.now();

    function render(now) {
      const t = (now - start) / 1000;
      
      gl.uniform2f(u_resLocation, canvas.width, canvas.height);
      gl.uniform1f(u_timeLocation, t);
      gl.uniform1f(u_scrollLocation, scrollNorm);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      // Tärkeä: tallennetaan ID jotta voidaan peruuttaa
      animationFrameId = requestAnimationFrame(render);
    }
    
    render(performance.now());

    // --- 5. CLEANUP (TÄMÄ ON SE, MIKÄ PUUTTUI) ---
    // Kun poistut sivulta, tämä funktio ajetaan.
    return () => {
      cancelAnimationFrame(animationFrameId); // PYSÄYTÄ LOOPPI!
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      
      // Vapautetaan muistia
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block' 
      }} 
    />
  );
};

export default Kaleidoscope;