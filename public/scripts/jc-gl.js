// public/scripts/jc-gl.js
// "JC 50 V4.3: Majestic Fusion (Slow Core & United Colors)" Edition

(() => {
  const canvas = document.getElementById('jc-gl');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) return;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  const vert = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const frag = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_scroll;

    // --- NOISE ---
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
      return mix( mix( hash( i + vec2(0.0,0.0) ), hash( i + vec2(1.0,0.0) ), u.x),
                  mix( hash( i + vec2(0.0,1.0) ), hash( i + vec2(1.0,1.0) ), u.x), u.y);
    }

    // --- KALEIDOSCOPE ---
    vec2 kaleidoscope(vec2 uv, float segments, float time) {
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);

        float segmentAngle = (3.14159 * 2.0) / segments;
        // Hyvin hidas taustapyöriminen
        angle += time * 0.02; 

        angle = mod(angle, segmentAngle);
        angle = abs(angle - segmentAngle * 0.5);

        return vec2(cos(angle), sin(angle)) * radius;
    }

    // --- COMPLEX BEAM ---
    float complexBeam(vec2 uv, float height, float amp, float freq, float speed, float t, float twist) {
      // Twist: Helix-kierre
      float twistOffset = sin(uv.x * 6.0 + t * 2.0) * twist;
      
      float y = height + sin(uv.x * freq + t * speed) * amp + twistOffset;
      float dist = abs(uv.y - y);
      
      // Pulse: Kaikki viivat hengittävät samaan tahtiin (t*2.0)
      float pulse = 1.0 + sin(uv.x * 3.0 + t * 2.0) * 0.4;
      
      return pow(0.007 * pulse / (dist + 0.0015), 1.6);
    }

    void main() {
      vec2 uvBase = (gl_FragCoord.xy - 0.5 * u_res.xy) / u_res.y;
      
      // Yleinen aika
      float t = u_time * 0.3; 
      
      // YTIMEN AIKA (Paljon hitaampi)
      float tCore = u_time * 0.1; 

      // 1. GLOBAL WARP
      uvBase += vec2(sin(uvBase.y * 3.0 + tCore), cos(uvBase.x * 2.0 + tCore)) * 0.015;

      // 2. KALEIDOSKOOPPI
      vec2 kUV = kaleidoscope(uvBase, 8.0, t);

      vec3 col = vec3(0.0);

      // --- BACKGROUND ---
      vec3 bgCol = vec3(0.03, 0.03, 0.06); 
      float grain = noise(vec2(kUV.x * 60.0, kUV.y * 10.0 + t)); 
      bgCol += vec3(0.015) * grain;
      col = bgCol;

      // --- CRYSTAL SPARKLES ---
      float crystal = noise(kUV * 18.0 + t * 0.5);
      crystal = smoothstep(0.75, 1.0, crystal);
      col += vec3(0.6, 0.8, 1.0) * crystal * 0.4; 

      // --- CHROMATIC FUSION ---
      // Pienemmät offsetit tekevät väreistä tiukempia
      vec2 offsetR = vec2(0.0015, 0.0); 
      vec2 offsetB = vec2(-0.0015, 0.0); 

      // A. MAGENTA (Inner wrapper)
      // Height laskettu 0.3 -> 0.12 (Hyvin lähellä ydintä)
      float r1 = complexBeam(kUV + offsetR, 0.12, 0.15, 2.0, 1.0, t, 0.0);
      float b1 = complexBeam(kUV + offsetB, 0.12, 0.15, 2.0, 1.0, t, 0.0);
      col += vec3(r1 * 1.6, 0.0, b1 * 1.3); 

      // B. CYAN (Outer wrapper)
      // Height laskettu 0.4 -> 0.22 (Lähellä magentaa)
      float r2 = complexBeam(kUV + offsetR, 0.22, 0.1, 4.0, -0.8, t, 0.0);
      float g2 = complexBeam(kUV,           0.22, 0.1, 4.0, -0.8, t, 0.0);
      float b2 = complexBeam(kUV + offsetB, 0.22, 0.1, 4.0, -0.8, t, 0.0);
      col += vec3(r2 * 0.1, g2 * 1.1, b2 * 1.6); 

      // C. THE MAJESTIC CORE (GOLD)
      // Käyttää hidasta aikaa (tCore).
      // Helix-kierre on rauhallinen mutta voimakas.
      
      float r3 = complexBeam(kUV + offsetR, 0.0, 0.0, 0.0, 0.0, tCore, 0.08); // Twist 0.08
      float g3 = complexBeam(kUV,           0.0, 0.0, 0.0, 0.0, tCore, 0.08);
      float b3 = complexBeam(kUV + offsetB, 0.0, 0.0, 0.0, 0.0, tCore, 0.08);
      
      // Vastakkainen kierre (DNA)
      float r4 = complexBeam(kUV + offsetR, 0.0, 0.0, 0.0, 0.0, tCore + 3.14, 0.08);
      float g4 = complexBeam(kUV,           0.0, 0.0, 0.0, 0.0, tCore + 3.14, 0.08);
      float b4 = complexBeam(kUV + offsetB, 0.0, 0.0, 0.0, 0.0, tCore + 3.14, 0.08);

      vec3 coreColor = vec3(2.0, 1.4, 0.5); // Kirkas kulta
      
      // Yhdistetään kierteet
      col += vec3(r3, g3, b3) * coreColor;
      col += vec3(r4, g4, b4) * coreColor;

      // 5. PRISM FLASH (DISPERSION)
      // Koska viivat ovat nyt lähempänä toisiaan, ne kohtaavat useammin.
      // Lasketaan kokonaiskirkkaus keskialueella.
      float totalIntensity = (r1 + b1 + g2 + r3 + r4);
      
      // Kynnysarvo 1.2 -> Kun värit osuvat päällekkäin, syttyy valkoinen valo
      float flash = smoothstep(1.2, 2.5, totalIntensity);
      col += vec3(1.0, 1.0, 1.2) * flash * 1.2;

      // 6. POST-PROCESSING
      col -= u_scroll * 0.4;
      float vig = smoothstep(1.4, 0.3, length(uvBase));
      col *= vig;
      
      // Kontrasti lasimaiseksi
      col = pow(col, vec3(1.3)); 

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // --- WebGL Setup ---
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }

  const prog = gl.createProgram();
  const v = compile(gl.VERTEX_SHADER, vert);
  const f = compile(gl.FRAGMENT_SHADER, frag);
  if(!v || !f) return;

  gl.attachShader(prog, v);
  gl.attachShader(prog, f);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u_res = gl.getUniformLocation(prog, 'u_res');
  const u_time = gl.getUniformLocation(prog, 'u_time');
  const u_scroll = gl.getUniformLocation(prog, 'u_scroll');

  let start = performance.now();
  let scrollNorm = 0;

  function updateScroll() {
    const max = Math.max(document.body.scrollHeight - innerHeight, 1);
    scrollNorm = Math.min(window.scrollY / max, 1.0);
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();

  function frame(now) {
    const disabledRoutes = ['/admin', '/agent', '/live', '/wall', '/leaderboard', '/personal-stats'];
    const currentPath = window.location.pathname;
    if (disabledRoutes.some(route => currentPath.startsWith(route))) {
        canvas.style.opacity = '0';
        requestAnimationFrame(frame);
        return; 
    } else {
        canvas.style.opacity = '1';
    }

    const t = (now - start) / 1000;
    gl.uniform2f(u_res, canvas.width, canvas.height);
    gl.uniform1f(u_time, t);
    gl.uniform1f(u_scroll, scrollNorm);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();