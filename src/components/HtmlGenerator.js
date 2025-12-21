/**
 * HtmlGenerator.js
 * Globaali 2.5rem välys kaikille lohkoille.
 */

export const renderBlockToHtml = (block) => {
  const { type, content } = block;
  const wrap = (html) => `<div style="padding-bottom: 2.5rem;">${html}</div>`;

  switch (type) {
    case 'hero':
      return wrap(`
        <div class="jc-hero">
          <p class="small" style="letter-spacing: 0.3em; text-transform: uppercase; color: var(--turquoise);">${content.date}</p>
          <h1 class="jc-h1" style="padding: 0 1.5rem;">${content.title}</h1>
          <p class="lead" style="text-transform: uppercase; letter-spacing: 0.1em; color: var(--magenta);">Theme: ${content.theme}</p>
        </div>`);

    case 'h1':
      return wrap(`<h1 class="jc-h1" style="margin: 0; text-align: center; padding: 0 1.5rem;">${content.text}</h1>`);
    
    case 'h2':
      return wrap(`<h2 class="jc-h2" style="margin: 0; text-align: left; padding: 0 1rem;">${content.text}</h2>`);
    
    case 'p':
      return wrap(`<p style="margin: 0; line-height: 1.7; font-family: 'Montserrat'; color: var(--cream); opacity: 0.9; padding: 0 1rem;">${content.text}</p>`);

    case 'agent':
      return wrap(`
        <div class="agent-hero-container">
          <div class="agent-hero-btn" style="display: flex; align-items: center; background: rgba(0, 231, 255, 0.05); border: 1px solid var(--turquoise); padding: 15px; border-radius: 12px; text-decoration: none;">
            <div class="agent-icon-box" style="width: 50px; height: 50px; background: var(--turquoise); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; position: relative; flex-shrink: 0;">
              <span style="font-size: 24px;">📱</span>
              <div class="ping-ring"></div>
            </div>
            <div class="agent-text-box">
              <span style="font-size: 0.7rem; color: var(--turquoise); text-transform: uppercase; letter-spacing: 1px;">TEHTÄVÄT & VIESTIT</span><br/>
              <span style="font-family: 'Outfit'; font-weight: 800; color: #fff; font-size: 1rem;">AVAA SALAINEN KOMMUNIKAATTORI</span>
            </div>
          </div>
        </div>`);

    case 'ticket':
      return wrap(`
        <div class="jc-card ticket-wrapper">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <span style="font-family: 'Outfit'; font-weight: 800; color: var(--cream); font-size: 0.75rem;">ACCESS PASS_v2.0</span>
            <span style="font-family: monospace; color: var(--lime); border: 1px solid var(--lime); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">CONFIRMED</span>
          </div>
          <div style="text-align: center; margin-bottom: 2rem;">
            <span class="small" style="color:var(--turquoise); letter-spacing:0.1em; font-size: 0.7rem;">TERVETULOA JÄSEN:</span>
            <h2 class="jc-h2" style="font-size: 3rem; margin: 0.5rem 0; text-align: center; background: none; -webkit-text-fill-color: white; color: white; text-shadow: 0 0 15px var(--magenta);">{{name}}</h2>
          </div>
          <div class="character-box" style="background: rgba(255, 0, 229, 0.1); border-left: 4px solid var(--magenta); padding: 2rem; margin: 1.5rem 0;">
            <span class="small" style="color:var(--magenta); letter-spacing:0.2em; display: block; margin-bottom: 1.5rem;">${content.label}</span>
            <div style="font-family: 'Josefin Sans'; font-size: 2.5rem; color: #fff; text-shadow: 0 0 10px var(--magenta);">{{character}}</div>
          </div>
          <div style="margin-top: 3.5rem;">
            <a href="{{ticket_link}}" class="jc-cta primary" style="display: block; width: 100%; text-align: center; box-sizing: border-box;">AVAA LIPPU & LIVEWALL</a>
          </div>
        </div>`);

    case 'action':
      return wrap(`
        <div style="background: rgba(0, 231, 255, 0.05); border: 1px dashed var(--turquoise); border-radius: 12px; padding: 2rem; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem; animation: pulse 2s infinite;">📸</div>
          <h3 style="margin:0; color:white; font-family: 'Outfit'; text-transform: uppercase; letter-spacing: 0.1em;">${content.title}</h3>
          <p style="font-size:0.9rem; color:var(--muted); margin-top: 10px; line-height: 1.5;">${content.body}</p>
        </div>`);

    case 'points':
      return wrap(`
        <div class="jc-card" style="border: 1px solid var(--lime); background: rgba(173, 255, 47, 0.05);">
          <h3 style="color: var(--lime); text-transform: uppercase; margin: 0 0 10px 0; font-family: 'Outfit';">Pistejahti: Aktiivisuus palkitaan</h3>
          <p style="white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6;">${content.body}</p>
        </div>`);

    case 'privacy':
      return wrap(`
        <div style="padding: 1rem; border: 1px solid var(--sun); border-radius: 8px; background: rgba(255, 165, 0, 0.05); color: #ffeab0; font-size: 0.85rem; line-height: 1.4;">
          <strong>⚠️ YKSITYISYYS:</strong><br>${content.body}
        </div>`);

    case 'info':
      return wrap(`
        <div class="jc-card small">
            <h2 class="jc-h2" style="font-size: 1.4rem; margin-bottom: 1.5rem;">Sijaintitiedot</h2>
            <div style="margin-bottom: 1rem;"><span class="small">OSOITE / LOC</span><br><strong style="font-size: 1.1rem;">${content.location}</strong></div>
            <div><span class="small">AIKA / TIME</span><br><strong style="font-size: 1.1rem;">${content.time}</strong></div>
        </div>`);

    case 'list':
      const listItems = content.items.split('\n').filter(i => i.trim()).map(item => `<li style="padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #F7F5E6;"><span style="color:var(--magenta); margin-right: 10px;">●</span> ${item}</li>`).join('');
      return wrap(`<div class="jc-card"><h2 class="jc-h2">${content.title}</h2><ul style="list-style: none; padding: 0; margin: 0;">${listItems}</ul></div>`);

    case 'image':
      return wrap(`<div style="text-align:center; padding: 1rem 0;"><img src="${content.url}" style="max-width:100%; border-radius:14px; border: 1px solid var(--turquoise);" /></div>`);

    default:
      return '';
  }
};

export const assembleFullHtml = (content) => `
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&family=Montserrat:wght@400;600&family=Outfit:wght@300;400;800&display=swap" rel="stylesheet">
    <style>
        :root{ --bg-deep: #0b0b10; --cream: #F7F5E6; --magenta: #FF00E5; --turquoise:#00E7FF; --lime: #ADFF2F; --sun: #FFA500; --plasma-gold: #D4AF37; }
        body { margin: 0; padding: 0; background-color: #0b0b10; color: #F7F5E6; font-family: "Montserrat", sans-serif; }
        .email-container { width: 100%; background-color: #0b0b10; padding-bottom: 4rem; }
        .jc-wrapper{ max-width: 800px; margin: 0 auto; padding: 2rem; }
        .jc-card { background: rgba(5, 7, 10, 0.65); border-radius: 14px; padding: 2rem; border: 1px solid rgba(255, 255, 255, 0.1); }
        .jc-h1 { font-family: "Josefin Sans"; font-size: 3.5rem; color: white; text-shadow: 0 0 20px var(--magenta); text-align: center; line-height: 1; }
        .jc-h2 { font-family: "Outfit"; font-weight: 800; color: var(--turquoise); text-transform: uppercase; background: linear-gradient(90deg, var(--plasma-gold) 0%, var(--magenta) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .ping-ring { position: absolute; inset: 0; border-radius: 10px; border: 2px solid var(--turquoise); animation: ping 2s infinite; }
        @keyframes ping { 75%, 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } }
        .jc-cta.primary { background: linear-gradient(135deg, #b000e6, var(--magenta)); color: #fff; text-decoration: none; padding: 1.2rem 2.5rem; border-radius: 12px; font-weight: bold; display: inline-block; }
        .small { font-size: 0.75rem; color: var(--turquoise); text-transform: uppercase; letter-spacing: 0.1em; }
    </style>
</head>
<body><div class="email-container"><div class="jc-wrapper">${content}</div></div></body>
</html>`;