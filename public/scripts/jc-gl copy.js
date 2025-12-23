// public/scripts/jc-gl.js
// "Neon Gatsby V3: Kaleidoscopic Dream & Soft Blur" Edition

(() => {
  const canvas = document.getElementById('jc-gl');
  // Alpha false parantaa suorituskykyä taustalla
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) {
    console.warn('WebGL not supported');
    return;
  }

  // --- Resize Handling ---
  function resize() {
    // Rajoitetaan dpr max 1.5:een suorituskyvyn takaamiseksi
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Vertex Shader ---
  const vert = `
    attribute vec2 aPos;
    void main() {
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  // --- Fragment Shader (Kaleidoscope & Blur) ---
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
        // Muutetaan napakoordinaateiksi (kulma ja säde)
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);

        // Lasketaan yhden segmentin kulma
        float segmentAngle = (3.14159 * 2.0) / segments;

        // Lisätään hidas pyöriminen
        angle += time * 0.05;

        // "Taitetaan" kulma käyttämällä moduloa ja itseisarvoa.
        // Tämä luo peiliefektin segmentin sisällä.
        angle = mod(angle, segmentAngle);
        angle = abs(angle - segmentAngle * 0.5);

        // Palautetaan takaisin normaaleiksi koordinaateiksi
        return vec2(cos(angle), sin(angle)) * radius;
    }

    // --- BEAM FUNCTION (MUOKATTU: PEHMEÄMPI BLUR) ---
    float beam(vec2 uv, float height, float amp, float freq, float speed, float t) {
      float y = height + sin(uv.x * freq + t * speed) * amp;
      // MUUTOS: Nostin osoittajaa (0.004 -> 0.015) ja lisäsin nimittäjään pienen luvun (+ 0.01).
      // Tämä tekee säteestä paljon leveämmän ja pehmeämmän, vähentäen terävää keskustaa.
      return 0.015 / (abs(uv.y - y) + 0.01);
    }

    void main() {
      // Normalisoidut UV:t
      vec2 uvBase = (gl_FragCoord.xy - 0.5 * u_res.xy) / u_res.y;
      
      float t = u_time * 0.3; // Hitaampi kokonaisaika
      vec3 col = vec3(0.0);

      // --- 1. SOVELLETAAN KALEIDOSKOOPPI ---
      // Käytämme 8 segmenttiä monimutkaisen kuvion luomiseksi.
      // Koko loppushaderi käyttää nyt näitä peilattuja 'kUV'-koordinaatteja.
      vec2 kUV = kaleidoscope(uvBase, 8.0, t);

      // --- 2. BACKGROUND: SOFT STEEL ---
      vec3 bgCol = vec3(0.05, 0.06, 0.08);
      // Käytetään kaleidoscope-UV:ta myös taustakohinaan
      float grain = noise(vec2(kUV.x * 100.0, kUV.y * 2.0)); 
      bgCol += vec3(0.03) * grain;
      col = bgCol;

      // --- 3. MIST / FOG (PEHMEÄMPI) ---
      // Sumu seuraa myös kaleidoskooppia
      float fog = fbm(kUV * 1.5 + vec2(t * 0.1));
      // Hieman kirkkaampi sumun väri
      vec3 mistColor = mix(vec3(0.1, 0.0, 0.15), vec3(0.0, 0.15, 0.2), sin(t*0.2)*0.5+0.5);
      col += mistColor * fog * 2.0; // Lisätty intensiteettiä

      // --- 4. SOFT LASER BEAMS ---
      // Nyt käytämme kUV-koordinaatteja, joten säteet monistuvat ympyrään.

      // Beam 1: Magenta (Pehmeä aalto)
      float b1 = beam(kUV, 0.3, 0.2, 2.0, 1.0, t);
      col += vec3(1.0, 0.1, 0.9) * b1; 

      // Beam 2: Cyan (Terävämpi siksak, mutta pehmennetty funktiolla)
      float b2 = beam(kUV, 0.4, 0.15, 4.0, -0.8, t);
      col += vec3(0.1, 0.9, 1.0) * b2;

      // Beam 3: Gold (Keskiympyrä/skanneri)
      // Koska kUV:n y-akseli on etäisyys keskustasta taitettuna,
      // tämä luo sykkivän renkaan keskelle.
      float b3 = beam(kUV, 0.1 + sin(t)*0.05, 0.0, 0.0, 0.0, t);
      col += vec3(1.0, 0.7, 0.2) * b3 * 0.8;

      // --- 5. VOLUMETRIC GLOW BOOST ---
      // Lisätään yleistä hehkua sumun ja säteiden yhteisvaikutuksesta
      col += vec3(0.6, 0.2, 0.7) * fog * b1 * 1.5;
      col += vec3(0.2, 0.6, 0.8) * fog * b2 * 1.5;

      // Scrollaus tummentaa hieman
      col -= u_scroll * 0.3;

      // Final soft vignette using original UVs to keep corners dark
      float vig = smoothstep(1.3, 0.4, length(uvBase));
      col *= vig;

      // Pehmeämpi gammakorjaus
      col = pow(col, vec3(0.9)); 

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // --- WebGL Boilerplate ---
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

  const u_res = gl.getUniformLocation(prog, 'u_res');
  const u_time = gl.getUniformLocation(prog, 'u_time');
  const u_scroll = gl.getUniformLocation(prog, 'u_scroll');

  let start = performance.now();
  let scrollNorm = 0;

  function updateScroll() {
    const max = Math.max(document.body.scrollHeight - innerHeight, 1);
    scrollNorm = window.scrollY / max;
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  function frame(now) {
    // 1. Määritä sivut, joilla WebGL on POIS PÄÄLTÄ
    // Lisää tähän listaan kaikki reitit, joilla haluat säästää akkua/tehoa
    const disabledRoutes = ['/admin', '/agent', '/live', '/wall', '/leaderboard', '/personal-stats'];
    const currentPath = window.location.pathname;

    // 2. Tarkista, alkaako nykyinen polku jollakin kielletyistä
    const isDisabled = disabledRoutes.some(route => currentPath.startsWith(route));

    if (isDisabled) {
        // Jos estetty, piilota canvas ja ÄLÄ piirrä mitään
        canvas.style.opacity = '0';
        
        // Kutsu seuraavaa framea, mutta älä tee mitään raskasta.
        // Tämä pitää loopin elossa, jotta se palautuu heti kun vaihdat sivua.
        requestAnimationFrame(frame);
        return; 
    } else {
        // Jos sallittu, varmista että canvas näkyy
        canvas.style.opacity = '1';
    }

    // --- ALKUPERÄINEN PIIRTOLOGIIKKA JATKUU TÄSTÄ ---
    const t = (now - start) / 1000;
    gl.uniform2f(u_res, canvas.width, canvas.height);
    gl.uniform1f(u_time, t);
    gl.uniform1f(u_scroll, scrollNorm);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

//// toinen

// public/scripts/jc-gl.js
// "JC 50 V4.2: Prism Core & Chromatic Flow" Edition

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
        angle += time * 0.05; 

        angle = mod(angle, segmentAngle);
        angle = abs(angle - segmentAngle * 0.5);

        return vec2(cos(angle), sin(angle)) * radius;
    }

    // --- COMPLEX BEAM ---
    // Tämä funktio luo viivan, joka voi olla suora tai kierteinen
    float complexBeam(vec2 uv, float height, float amp, float freq, float speed, float t, float twist) {
      // Twist: Jos > 0, viiva kiertyy itsensä ympäri (Helix effect)
      float twistOffset = sin(uv.x * 10.0 + t * 5.0) * twist;
      
      float y = height + sin(uv.x * freq + t * speed) * amp + twistOffset;
      float dist = abs(uv.y - y);
      
      // Pulse: Liike viivaa pitkin
      float pulse = 1.0 + sin(uv.x * 4.0 + t * 3.0) * 0.5;
      
      return pow(0.006 * pulse / (dist + 0.001), 1.5);
    }

    void main() {
      vec2 uvBase = (gl_FragCoord.xy - 0.5 * u_res.xy) / u_res.y;
      float t = u_time * 0.35; // Hieman nopeampi aika

      // 1. GLOBAL WARP (Lisää liikettä koko kuvaan)
      // Avaruus "hengittää" ja vääntyilee hitaasti
      uvBase += vec2(sin(uvBase.y * 4.0 + t), cos(uvBase.x * 3.0 + t)) * 0.02;

      // 2. KALEIDOSKOOPPI
      vec2 kUV = kaleidoscope(uvBase, 8.0, t);

      vec3 col = vec3(0.0);

      // --- BACKGROUND: DARK METALLIC ---
      vec3 bgCol = vec3(0.03, 0.03, 0.06); 
      float grain = noise(vec2(kUV.x * 80.0, kUV.y * 10.0 + t * 2.0)); 
      bgCol += vec3(0.02) * grain;
      col = bgCol;

      // 3. CRYSTALLINE SPARKLES
      float crystal = noise(kUV * 20.0 + t);
      crystal = smoothstep(0.7, 1.0, crystal);
      col += vec3(0.6, 0.8, 1.0) * crystal * 0.5; 

      // --- 4. CHROMATIC BEAMS (RGB SPLIT) ---
      // Tässä tapahtuu taika. Laskemme viivat kolme kertaa (R, G, B)
      // hieman eri koordinaateilla. Tämä luo sateenkaari-reunat.

      vec2 offsetR = vec2(0.002, 0.0); // Punainen siirtymä
      vec2 offsetB = vec2(-0.002, 0.0); // Sininen siirtymä

      // A. MAGENTA BEAMS (Waving)
      float r1 = complexBeam(kUV + offsetR, 0.3, 0.2, 2.0, 1.0, t, 0.0);
      float g1 = complexBeam(kUV,           0.3, 0.2, 2.0, 1.0, t, 0.0);
      float b1 = complexBeam(kUV + offsetB, 0.3, 0.2, 2.0, 1.0, t, 0.0);
      col += vec3(r1 * 1.5, g1 * 0.2, b1 * 1.2); // Violetti/Magenta pohja

      // B. CYAN BEAMS (Structure)
      float r2 = complexBeam(kUV + offsetR, 0.4, 0.15, 4.0, -0.8, t, 0.0);
      float g2 = complexBeam(kUV,           0.4, 0.15, 4.0, -0.8, t, 0.0);
      float b2 = complexBeam(kUV + offsetB, 0.4, 0.15, 4.0, -0.8, t, 0.0);
      col += vec3(r2 * 0.1, g2 * 1.0, b2 * 1.5); // Syaani pohja

      // C. THE CORE: GOLDEN HELIX (EI TYLSÄ!)
      // Keskustassa on nyt kaksi kietoutunutta säiettä (twist = 0.05)
      // jotka liikkuvat nopeasti.
      
      // Strand 1
      float r3a = complexBeam(kUV + offsetR, 0.0, 0.0, 0.0, 0.0, t, 0.05);
      float g3a = complexBeam(kUV,           0.0, 0.0, 0.0, 0.0, t, 0.05);
      float b3a = complexBeam(kUV + offsetB, 0.0, 0.0, 0.0, 0.0, t, 0.05);
      
      // Strand 2 (Vastakkainen vaihe twistissä -> tekee DNA-kierteen)
      float r3b = complexBeam(kUV + offsetR, 0.0, 0.0, 0.0, 0.0, t + 3.14, 0.05);
      float g3b = complexBeam(kUV,           0.0, 0.0, 0.0, 0.0, t + 3.14, 0.05);
      float b3b = complexBeam(kUV + offsetB, 0.0, 0.0, 0.0, 0.0, t + 3.14, 0.05);

      vec3 coreColor = vec3(1.8, 1.2, 0.5); // Kirkas kulta
      col += vec3(r3a, g3a, b3a) * coreColor;
      col += vec3(r3b, g3b, b3b) * coreColor;

      // 5. PRISM FLASH (DISPERSION)
      // Kun viivat kohtaavat, syntyy kirkas valkoinen välähdys
      float totalIntensity = (g1 + g2 + g3a + g3b);
      float flash = smoothstep(1.0, 2.5, totalIntensity);
      col += vec3(1.0) * flash * 1.5;

      // 6. POST-PROCESSING
      col -= u_scroll * 0.4;
      float vig = smoothstep(1.4, 0.3, length(uvBase));
      col *= vig;
      
      // Nostetaan kontrastia lasimaiseksi
      col = pow(col, vec3(1.2)); 

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

// tähti

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