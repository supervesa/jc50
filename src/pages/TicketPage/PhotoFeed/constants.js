// public/scripts/constants.js

// --- APUFUNKTIOT FILTTEREILLE ---

// 1. Oranssi päivämääräleima (The 90s Signature)
const drawDateStamp = (ctx, w, h) => {
  const now = new Date();
  // Nostalgian vuoksi vuosi on aina '96
  const dateStr = `${now.getDate()} ${now.getMonth() + 1}  '96`;
  ctx.save();
  ctx.fillStyle = '#ff8c00'; // Klassinen digitaali-oranssi
  ctx.font = 'bold 48px "Courier New", monospace';
  ctx.textAlign = 'right';
  
  // Valotushehku: Numerot näyttävät filmiin poltetuilta
  ctx.shadowColor = '#ff8c00';
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.85;
  ctx.fillText(dateStr, w - 60, h - 80);
  
  // Piirretään vielä kerran ilman hehkua, jotta teksti pysyy luettavana
  ctx.shadowBlur = 0;
  ctx.fillText(dateStr, w - 60, h - 80);
  ctx.restore();
};

// 2. Vinjetointi (Linssin reuna-efekti)
const drawVignette = (ctx, w, h) => {
  const grd = ctx.createRadialGradient(w/2, h/2, w * 0.4, w/2, h/2, w * 0.9);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.6)'); // Voimakkaampi reuna
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);
};

// 3. Fujifilm Rae-moottori (Grain)
const drawGrain = (ctx, w, h, amount) => {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Satunnainen kohina per pikseli
    const noise = (Math.random() - 0.5) * amount;
    data[i] += noise;     // Punainen
    data[i+1] += noise;   // Vihreä
    data[i+2] += noise;   // Sininen
  }
  ctx.putImageData(imageData, 0, 0);
};

// --- FILTTERIT ---

export const FILTERS = [
  { id: 'none', name: 'Original', filter: 'none', applyExtra: null },
  { 
    id: 'kodak', name: 'Kodak Gold', 
    // Lämmin, keltainen ja kirkas
    filter: 'sepia(0.3) contrast(1.1) saturate(1.6) brightness(1.05)',
    applyExtra: (ctx, w, h) => drawDateStamp(ctx, w, h)
  },
  { 
    id: 'agfa', name: 'Agfa Vista', 
    // Korkea kontrasti, punaiset sävyt ylhäällä, hieman viileä huntu
    filter: 'contrast(1.35) saturate(1.7) hue-rotate(-8deg) brightness(0.95)',
    applyExtra: (ctx, w, h) => {
      drawVignette(ctx, w, h);
      drawDateStamp(ctx, w, h);
    }
  },
  { 
    id: 'fuji', name: 'Fuji Neopan', 
    // Rakeinen mustavalko: korkea kontrasti ja rakeisuus
    filter: 'grayscale(1) contrast(1.8) brightness(0.9)',
    applyExtra: (ctx, w, h) => {
      drawGrain(ctx, w, h, 65); // Voimakas rae
      drawDateStamp(ctx, w, h);
    }
  }
];

// --- KEHYKSET ---
export const FRAMES = [
  { id: 'none', name: 'Ei kehystä', color: '#444', draw: null, isLocked: false },
  { 
    id: 'neon-pink', name: 'Neon', color: '#FF00E5', isLocked: false,
    draw: (ctx, w, h) => {
      ctx.lineWidth = 40; ctx.strokeStyle = '#FF00E5'; ctx.strokeRect(0,0,w,h);
      ctx.lineWidth = 10; ctx.strokeStyle = '#FFF'; ctx.strokeRect(20,20,w-40,h-40);
    }
  },
  { 
    id: 'top-secret', name: 'Sentinel', color: '#00ff41', isLocked: true,
    draw: (ctx, w, h) => {} // Tähän piirto hypeviikolla
  }
];

// --- TARRAT ---
export const STICKERS = [
  { char: "🕶️", isLocked: true }, 
  { char: "🎩", isLocked: true }, 
  { char: "💋", isLocked: true }, 
  { char: "🍸", isLocked: true }, 
  { char: "💃", isLocked: true }, 
  { char: "🕺", isLocked: true }, 
  { char: "🕵️", isLocked: true }, 
  { char: "🔥", isLocked: true }, 
  { char: "🎉", isLocked: true }, 
  { char: "⭐", isLocked: true }
];