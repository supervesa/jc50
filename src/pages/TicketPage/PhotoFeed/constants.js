export const FRAMES = [
  { id: 'none', name: 'Ei kehystä', color: '#444', draw: null },
  { 
    id: 'neon-pink', name: 'Neon', color: '#FF00E5',
    draw: (ctx, w, h) => {
      ctx.lineWidth = 40; ctx.strokeStyle = '#FF00E5'; ctx.strokeRect(0,0,w,h);
      ctx.lineWidth = 10; ctx.strokeStyle = '#FFF'; ctx.strokeRect(20,20,w-40,h-40);
    }
  },
  { 
    id: 'top-secret', name: 'Secret', color: '#00ff41',
    draw: (ctx, w, h) => {
      ctx.lineWidth = 50; ctx.strokeStyle = '#000'; ctx.strokeRect(0,0,w,h);
      ctx.lineWidth = 4; ctx.strokeStyle = '#00ff41'; ctx.strokeRect(25,25,w-50,h-50);
      ctx.font = 'bold 80px Courier New'; ctx.fillStyle = '#00ff41'; ctx.textAlign = 'center';
      ctx.fillText('TOP SECRET', w/2, 100);
    }
  },
  { 
    id: 'vip-gold', name: 'VIP', color: '#D4AF37',
    draw: (ctx, w, h) => {
      ctx.lineWidth = 60; ctx.strokeStyle = '#D4AF37'; ctx.strokeRect(0,0,w,h);
      ctx.font = 'bold 60px sans-serif'; ctx.fillStyle = '#D4AF37'; ctx.textAlign = 'right';
      ctx.fillText('VIP', w-50, h-50);
    }
  }
];

export const STICKERS = ["🕶️", "🎩", "💋", "🍸", "💃", "🕺", "🕵️", "🔥", "🎉", "⭐", "🦄", "🌈"];