// jc-gl.js — "Neon Mist / Asphalt Reflections" Edition
(() => {
  const canvas = document.getElementById('jc-gl');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
  if (!gl) {
    console.warn('WebGL not supported — fallback gradient active');
    return;
  }

  // Resize handling
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener('resize', resize);
  resize();

  // Vertex shader
  const vert = `
    attribute vec2 aPos;
    void main() {
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  // Fragment shader — soft fog, wet reflections, and subtle neon sparks
  const frag = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_scroll;

    // Noise functions
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
    float noise(vec2 p){
      vec2 i=floor(p);
      vec2 f=fract(p);
      float a=hash(i);
      float b=hash(i+vec2(1.,0.));
      float c=hash(i+vec2(0.,1.));
      float d=hash(i+vec2(1.,1.));
      vec2 u=f*f*(3.-2.*f);
      return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
    }
    float fbm(vec2 p){
      float v=0.0;
      float a=0.5;
      mat2 m=mat2(1.6,1.2,-1.2,1.6);
      for(int i=0;i<5;i++){
        v+=a*noise(p);
        p=m*p;
        a*=0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      vec2 p = (uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
      float t = u_time * 0.06; // very slow movement

      // Base tone — deep bluish steel, faint light haze
      vec3 col = vec3(0.08, 0.1, 0.12);
      float mist = fbm(p * 1.4 + vec2(t * 0.15, t * 0.05));
      col += vec3(0.1, 0.12, 0.14) * mist * 0.7;

      // Wet reflection ripple — faint mirror shimmer
      float ripple = sin((p.y - 0.1 * fbm(p * 2.0 + vec2(t))) * 25.0 + t * 4.0);
      float reflect = smoothstep(0.3, 0.9, abs(ripple)) * 0.25;
      col += vec3(0.15, 0.17, 0.2) * reflect;

      // Neon spark reflections — subtle, like puddle glow
      float n1 = fbm(p * 3.0 + vec2(t * 0.5, -t * 0.3));
      float n2 = fbm(p * 4.5 - vec2(t * 0.4, t * 0.2));
      float spark = smoothstep(0.75, 0.95, n1 * n2);
      vec3 neonA = vec3(0.0, 0.8, 1.0);   // cyan
      vec3 neonB = vec3(1.0, 0.0, 0.7);   // magenta
      vec3 neonC = vec3(0.9, 0.75, 0.3);  // gold
      vec3 neonMix = mix(neonA, neonB, sin(t*0.2)*0.5+0.5);
      neonMix = mix(neonMix, neonC, 0.3 + 0.2*sin(t*0.1));
      col += neonMix * spark * 0.25;

      // Light diffusion / blur glow
      float blur = fbm(p * 6.0 + vec2(t*0.3));
      col = mix(col, vec3(0.25, 0.3, 0.35), 0.05 * blur);

      // Slow shifting color bleed (city light ambience)
      float bleed = sin(p.y * 2.0 + t * 0.5) * 0.5 + 0.5;
      col += mix(vec3(0.02,0.04,0.05), vec3(0.15,0.18,0.2), bleed) * 0.1;

      // Scroll deepens the fog
      col += vec3(0.04, 0.05, 0.06) * u_scroll * 0.7;

      // Vignette for cinematic depth
      float v = smoothstep(0.9, 0.2, distance(uv, vec2(0.5)));
      col *= mix(1.0, 0.7, v);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // Compile helpers
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Quad buffer
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
    gl.STATIC_DRAW
  );
  const pos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const u_res = gl.getUniformLocation(prog, 'u_res');
  const u_time = gl.getUniformLocation(prog, 'u_time');
  const u_scroll = gl.getUniformLocation(prog, 'u_scroll');

  let start = performance.now();
  let scrollNorm = 0;
  function updateScroll() {
    const max = Math.max(document.body.scrollHeight - innerHeight, 1);
    scrollNorm = Math.min(1, window.scrollY / max);
  }
  addEventListener('scroll', updateScroll, { passive: true });
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
