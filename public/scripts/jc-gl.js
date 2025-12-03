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
    const t = (now - start) / 1000;
    gl.uniform2f(u_res, canvas.width, canvas.height);
    gl.uniform1f(u_time, t);
    gl.uniform1f(u_scroll, scrollNorm);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();