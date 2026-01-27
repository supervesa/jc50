// public/scripts/constants.js

// ==========================================
// 1. SVG LOGOT JA ESILATAUS
// ==========================================

const CLASSIFIED_SVG = `
<svg width="100%" height="100%" viewBox="0 0 778 784" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
  <path d="M391.987,487.457l-71.344,71.344c-20.231,20.231 -53.082,20.231 -73.313,0l-232.157,-232.157c-20.231,-20.231 -20.231,-53.082 -0,-73.313l232.157,-232.157c20.231,-20.231 53.082,-20.231 73.313,0l65.344,65.344l71.344,-71.344c20.231,-20.231 53.082,-20.231 73.313,0l232.157,232.157c20.231,20.231 20.231,53.082 0,73.313l-232.157,232.157c-20.231,20.231 -53.082,20.231 -73.313,-0l-65.344,-65.344Zm-46.305,-360.635l-34.712,-34.712c-14.892,-14.892 -39.074,-14.892 -53.966,0l-170.894,170.894c-14.892,14.892 -14.892,39.074 0,53.966l170.894,170.894c14.892,14.892 39.074,14.892 53.966,0l40.712,-40.712l-126.509,-126.509c-20.231,-20.231 -20.231,-53.082 0,-73.313l120.509,-120.509Zm86.61,320.33l34.712,34.712c14.892,14.892 39.074,14.892 53.966,0l170.894,-170.894c14.892,-14.892 14.892,-39.074 0,-53.966l-170.894,-170.894c-14.892,-14.892 -39.074,-14.892 -53.966,0l-40.712,40.712l126.509,126.509c20.231,20.231 20.231,53.082 0,73.313l-120.509,120.509Zm-40.305,-40.305l89.877,-89.877c14.892,-14.892 14.892,-39.074 0,-53.966l-95.877,-95.877l-89.877,89.877c-14.892,14.892 -14.892,39.074 0,53.966l95.877,95.877Z" style="fill:#A0A0A0;"/>
</svg>
`;

const createSvgImage = (svgString) => {
  if (typeof window === 'undefined') return null;
  const img = new Image();
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  img.src = url;
  return img;
};

const classifiedImg = createSvgImage(CLASSIFIED_SVG);


// ==========================================
// 2. APUFUNKTIOT FILTTEREILLE
// ==========================================

const drawDateStamp = (ctx, w, h) => {
  const now = new Date();
  const dateStr = `${now.getDate()} ${now.getMonth() + 1}  '96`;
  ctx.save();
  ctx.fillStyle = '#ff8c00';
  ctx.font = 'bold 48px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.shadowColor = '#ff8c00';
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.85;
  ctx.fillText(dateStr, w - 60, h - 80);
  ctx.shadowBlur = 0;
  ctx.fillText(dateStr, w - 60, h - 80);
  ctx.restore();
};

// KORJAUS: Lisätty ctx.save() ja ctx.restore() tähän funktioon.
// Tämä estää sen, että musta gradient jää päälle ja värjää tarrat mustiksi.
const drawVignette = (ctx, w, h) => {
  ctx.save(); // <--- TÄRKEÄ FIX
  const grd = ctx.createRadialGradient(w/2, h/2, w * 0.4, w/2, h/2, w * 0.9);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);
  ctx.restore(); // <--- TÄRKEÄ FIX
};

const drawGrain = (ctx, w, h, amount) => {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount;
    data[i] += noise;
    data[i+1] += noise;
    data[i+2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
};

// ==========================================
// 3. APUFUNKTIO TEKSTEILLE
// ==========================================

const drawTopBottomText = (ctx, w, h, textTop, textBottom, fontFace = 'sans-serif', colorTop = '#fff', colorBottom = '#888') => {
  ctx.save();
  ctx.textAlign = 'center';
  
  // ALHAALLA
  ctx.font = `italic 36px ${fontFace}`; 
  ctx.fillStyle = colorBottom;
  ctx.shadowBlur = 0; 
  ctx.fillText(textBottom, w / 2, h - 60); 

  // YLHÄÄLLÄ
  ctx.font = `bold 52px ${fontFace}`;
  ctx.fillStyle = colorTop;
  ctx.shadowColor = colorTop;
  ctx.shadowBlur = 15;
  ctx.fillText(textTop, w / 2, 110);

  ctx.restore();
};


// ==========================================
// 4. DATAT (Filters, Frames, Stickers)
// ==========================================

export const FILTERS = [
  { id: 'none', name: 'Original', filter: 'none', applyExtra: null },
  { 
    id: 'kodak', name: 'Kodak Gold', 
    filter: 'sepia(0.3) contrast(1.1) saturate(1.6) brightness(1.05)',
    applyExtra: (ctx, w, h) => drawDateStamp(ctx, w, h)
  },
  { 
    id: 'agfa', name: 'Agfa Vista', 
    filter: 'contrast(1.35) saturate(1.7) hue-rotate(-8deg) brightness(0.95)',
    applyExtra: (ctx, w, h) => {
      drawVignette(ctx, w, h);
      drawDateStamp(ctx, w, h);
    }
  },
  { 
    id: 'fuji', name: 'Fuji Neopan', 
    filter: 'grayscale(1) contrast(1.8) brightness(0.9)',
    applyExtra: (ctx, w, h) => {
      drawGrain(ctx, w, h, 65);
      drawDateStamp(ctx, w, h);
    }
  }
];

export const FRAMES = [
  { id: 'none', name: 'Ei kehystä', color: '#444', draw: null, isLocked: false },
  
  // 1. NEON GATSBY - J:CLUB50
  { 
    id: 'gatsby', 
    name: 'Neon Gatsby', 
    color: '#D4AF37', 
    isLocked: false, 
    draw: (ctx, w, h) => {
      const m = 20;
      
      ctx.save();
      
      // 1. Pääkehys
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#D4AF37'; // Gold
      ctx.shadowColor = '#D4AF37';
      ctx.shadowBlur = 20; 
      ctx.lineJoin = 'bevel';
      ctx.strokeRect(m, m, w - m*2, h - m*2);

      // 2. Art Deco -säteet
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#FF00E5'; // Magenta
      ctx.shadowColor = '#FF00E5';
      ctx.shadowBlur = 10;
      
      const rayLen = 120;
      const drawRays = (x, y, dirX, dirY) => {
        ctx.beginPath();
        for(let i=0; i<=3; i++) {
           const shift = i * 25; 
           if (i===0) { ctx.moveTo(x, y); ctx.lineTo(x + (rayLen * dirX), y); }
           else if (i===3) { ctx.moveTo(x, y); ctx.lineTo(x, y + (rayLen * dirY)); }
           else { 
             ctx.moveTo(x, y); 
             ctx.lineTo(x + (rayLen * dirX * 0.8), y + (shift * dirY)); 
             ctx.moveTo(x, y); 
             ctx.lineTo(x + (shift * dirX), y + (rayLen * dirY * 0.8)); 
           }
        }
        ctx.stroke();
      };

      drawRays(m, m, 1, 1);       
      drawRays(w-m, m, -1, 1);    
      drawRays(m, h-m, 1, -1);    
      drawRays(w-m, h-m, -1, -1); 

      // 3. J:Club50 -teksti alareunaan (H1 tyyli)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = '700 90px "Josefin Sans", sans-serif'; 

      const textX = w / 2;
      const textY = h - 40; 

      // Magenta hehku
      ctx.shadowColor = 'rgba(255, 0, 229, 0.6)';
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'rgba(255,255,255,0.01)'; 
      ctx.fillText("J:Club50", textX, textY);

      // Turkoosi hehku
      ctx.shadowColor = 'rgba(0, 231, 255, 0.4)';
      ctx.shadowBlur = 40;
      ctx.fillText("J:Club50", textX, textY);

      // Terävä reunus
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.strokeText("J:Club50", textX, textY);

      // Himmeä sisus
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillText("J:Club50", textX, textY);
      
      ctx.restore();
    }
  },

  // 2. AGENTTI
  { 
    id: 'agent', 
    name: 'Agentti', 
    color: '#00E7FF', 
    isLocked: false, 
    draw: (ctx, w, h) => {
      const m = 40; 
      const len = 80; 

      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#00E7FF';
      ctx.shadowColor = '#00E7FF';
      ctx.shadowBlur = 8;

      const drawCorner = (x, y, dx, dy) => {
        ctx.beginPath();
        ctx.moveTo(x, y + dy * len);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * len, y);
        ctx.stroke();
      };

      drawCorner(m, m, 1, 1);       
      drawCorner(w-m, m, -1, 1);    
      drawCorner(m, h-m, 1, -1);    
      drawCorner(w-m, h-m, -1, -1); 

      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#00E7FF';
      for(let i = m; i < h - m; i += 10) {
        ctx.fillRect(m, i, w - m*2, 1);
      }
      ctx.globalAlpha = 1.0;

      if (classifiedImg) {
          const padding = 70; 
          const size = w * 0.11; 
          ctx.drawImage(classifiedImg, padding, padding, size, size);
      }

      drawTopBottomText(ctx, w, h, "STATUS: AGENTTI", "STATUS: VARJO", "Courier New", "#00E7FF", "#008899");
      
      ctx.restore();
    }
  },

  // 3. BILEET
  { 
    id: 'fun', 
    name: 'Bileet', 
    color: '#ADFF2F', 
    isLocked: false, 
    draw: (ctx, w, h) => {
      const m = 35;

      ctx.save();
      
      // Kehykset
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#FF00E5'; 
      ctx.globalAlpha = 0.7;
      ctx.strokeRect(m + 5, m + 5, w - m*2, h - m*2);

      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#ADFF2F'; 
      ctx.shadowColor = '#ADFF2F';
      ctx.shadowBlur = 10;
      ctx.strokeRect(m, m, w - m*2, h - m*2);

      // Bokeh Effect
      ctx.globalCompositeOperation = 'screen';
      
      const colors = ['#ADFF2F', '#FF00E5', '#00E7FF', '#FFA500'];
      
      for(let i = 0; i < 25; i++) {
        const side = i % 4;
        let x, y;
        const spread = 150; 
        
        if (side === 0) { x = (i*67)%w; y = (i*31)%spread; } 
        if (side === 1) { x = (i*47)%w; y = h - (i*53)%spread; } 
        if (side === 2) { x = (i*73)%spread; y = (i*89)%h; } 
        if (side === 3) { x = w - (i*97)%spread; y = (i*101)%h; } 

        ctx.fillStyle = colors[i % colors.length];
        const size = 20 + (i * 7) % 60;
        ctx.globalAlpha = 0.3 + ((i%5)/10); 

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.shadowBlur = 20; 
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
      }

      ctx.restore();
    }
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