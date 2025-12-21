export const renderBlockToHtml = (block) => {
  const { type, content } = block;
  if (type === 'hero') return `
    <div class="jc-hero">
      <p class="small" style="letter-spacing: 0.3em; text-transform: uppercase; color: var(--turquoise);">${content.date}</p>
      <h1 class="jc-h1">${content.title}</h1>
      <p class="lead" style="text-transform: uppercase; letter-spacing: 0.1em; color: var(--magenta);">Theme: ${content.theme}</p>
    </div>`;
  
  if (type === 'text') return `
    <div class="jc-card">
      <h2 class="jc-h2">${content.title}</h2>
      <p style="white-space: pre-wrap;">${content.body}</p>
    </div>`;

  if (type === 'info') return `
    <div class="jc-card small">
        <h2 class="jc-h2" style="font-size: 1.4rem;">Sijaintitiedot</h2>
        <div style="margin-bottom: 1.5rem;">
            <span class="small" style="display:block; color:var(--turquoise);">SIJAINTI / LOC</span>
            <strong style="font-size: 1.1rem;">${content.location}</strong>
        </div>
        <div style="margin-bottom: 1.5rem;">
            <span class="small" style="display:block; color:var(--turquoise);">AIKA / TIME</span>
            <strong style="font-size: 1.1rem;">${content.time}</strong>
        </div>
        <div>
            <a href="${content.mapUrl}" target="_blank" class="jc-cta ghost" style="width:100%; text-align:center; padding: 0.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #F7F5E6; text-decoration: none; display: block;">Avaa Kartta</a>
        </div>
    </div>`;

  if (type === 'list') {
    const items = content.items.split('\n').filter(i => i.trim()).map(item => `
      <li style="padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #F7F5E6;">
        <span style="color:var(--magenta)">●</span> ${item}
      </li>`).join('');
    return `
      <div class="jc-card">
        <h2 class="jc-h2" style="font-size: 1.4rem;">${content.title}</h2>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem;">${items}</ul>
      </div>`;
  }

  if (type === 'contact') return `
    <div class="jc-card small" style="background: linear-gradient(180deg, rgba(0, 231, 255, 0.05) 0%, rgba(0,0,0,0) 100%); border-color: var(--turquoise);">
        <h2 class="jc-h2" style="font-size: 1.2rem; color: var(--turquoise);">${content.title}</h2>
        <p class="small">Yhteystiedot:</p>
        <a href="mailto:${content.email}" style="color: #fff; text-decoration: underline;">${content.email}</a>
    </div>`;

  if (type === 'image') return `
    <div style="text-align:center; margin: 2rem 0;">
      <img src="${content.url}" style="max-width:100%; border-radius:14px; border: 1px solid var(--turquoise);" />
    </div>`;

  if (type === 'ticket') return `
    <div class="jc-card ticket-wrapper">
      <div class="ticket-header">
        <span style="font-family: 'Outfit'; font-weight: 800; color: var(--cream);">ACCESS PASS_v2.0</span>
        <span class="ticket-status">CONFIRMED</span>
      </div>
      <div class="ticket-split">
        <div style="flex: 2;">
          <span class="small" style="color:var(--turquoise); letter-spacing:0.1em; text-transform:uppercase;">Tervetuloa jäsen:</span>
          <h2 class="jc-h2" style="font-size: 2.5rem; margin-bottom: 0;">{{name}}</h2>
          <div class="character-box">
            <span class="small" style="color:var(--magenta); letter-spacing:0.2em;">${content.label}</span>
            <div class="character-name">{{character}}</div>
          </div>
        </div>
        <div style="flex: 1.2; text-align: center; display: flex; align-items: center;">
          <a href="{{ticket_link}}" class="jc-cta primary" style="width:100%;">AVAA LIPPU</a>
        </div>
      </div>
    </div>`;
  return '';
};

export const assembleFullHtml = (content) => `
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&family=Montserrat:wght@400;600&family=Outfit:wght@300;400;800&display=swap" rel="stylesheet">
    <style>
        :root{
          --bg-deep: #0b0b10; --bg-mid: #121218; --cream: #F7F5E6; --muted: #888888;
          --magenta: #FF00E5; --turquoise:#00E7FF; --amethyst:#9932CC; --lime: #ADFF2F;
          --sun: #FFA500; --plasma-gold: #D4AF37; --laser-white: #EAFBFF;
          --max-width:1200px; --container-pad: clamp(1rem, 3vw, 4rem);
          --glass-blur: 8px; --card-radius: 14px; --fast: 120ms; --mid: 240ms; --slow: 420ms;
        }
        html, body { margin: 0; padding: 0; height: 100%; background-color: #0b0b10; color: var(--cream); font-family: "Montserrat", sans-serif; -webkit-font-smoothing: antialiased; }
        .email-container { width: 100%; min-height: 100%; background-color: var(--bg-deep); background-image: radial-gradient(1200px 360px at 10% 20%, rgba(0,230,255,0.02), transparent), linear-gradient(180deg, var(--bg-deep), #07070a); padding-bottom: 2rem; position: relative; }
        .grain-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 0; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23g)" opacity="0.02" fill="black"/></svg>'); opacity: 0.6; height: 100%; }
        .jc-wrapper{ max-width:var(--max-width); margin:0 auto; padding: var(--container-pad); position:relative; z-index:10; }
        .jc-hero{ min-height: 50vh; display:flex; flex-direction: column; align-items:center; justify-content:center; gap:1rem; position:relative; padding-top: 4rem; text-align: center; z-index: 10; }
        .jc-card { position: relative; background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.0) 100%), rgba(5, 7, 10, 0.65); backdrop-filter: blur(16px); border-radius: var(--card-radius); padding: 2rem; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 2rem; }
        h1.jc-h1 { font-family: "Josefin Sans"; font-size: clamp(3rem, 8vw, 6rem); font-weight: 700; color: white; text-shadow: 0 0 20px rgba(255, 0, 229, 0.5), 0 0 40px rgba(0, 231, 255, 0.4); text-transform: uppercase; margin: 0; }
        h2.jc-h2 { font-family: "Outfit"; font-weight: 800; font-size: clamp(1.2rem, 3vw, 2.4rem); background: linear-gradient(90deg, var(--plasma-gold) 0%, var(--magenta) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-transform: uppercase; }
        .ticket-wrapper { border: 1px solid var(--turquoise); box-shadow: 0 0 30px rgba(0, 231, 255, 0.15); background: rgba(0,0,0,0.6); }
        .ticket-status { font-family: monospace; color: var(--lime); border: 1px solid var(--lime); padding: 2px 5px; border-radius: 4px; text-transform: uppercase; }
        .character-box { background: rgba(255, 0, 229, 0.1); border-left: 4px solid var(--magenta); padding: 1rem; margin-top: 1rem; }
        .character-name { font-family: "Josefin Sans"; font-size: 1.8rem; color: #fff; text-shadow: 0 0 10px var(--magenta); }
        .jc-cta { display: inline-block; padding: 0.75rem 1.8rem; border-radius: 12px; font-weight: 700; text-transform: uppercase; text-decoration: none; }
        .jc-cta.primary { background: linear-gradient(135deg, #b000e6 0%, var(--magenta) 100%); color: #ffffff; }
        .small { font-size: 0.8rem; color: var(--turquoise); }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="grain-overlay"></div>
        <div class="jc-wrapper">${content}</div>
    </div>
</body>
</html>`;