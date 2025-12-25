/**
 * HtmlGenerator.js
 * Generoi HTML-koodin ja pakottaa Dark Moden metatiedoilla.
 */

// TÄHÄN KOPIOIDAAN SAMA CSS KUIN EmailStyles.css-TIEDOSTOON
const EMAIL_CSS = `
  :root { 
    color-scheme: light dark; 
    supported-color-schemes: light dark;
    --bg-deep:#0b0b10; --cream:#F7F5E6; --magenta:#FF00E5; --turquoise:#00E7FF; --lime:#ADFF2F; --sun:#FFA500; --plasma-gold:#D4AF37; --card-radius:14px; 
  }
  
  /* Reset ja Dark Mode Pakotus */
  body, .email-container { 
    margin:0; padding:0; 
    background-color:#0b0b10 !important; 
    color:#F7F5E6 !important; 
    font-family:"Montserrat", sans-serif; 
    mso-line-height-rule: exactly;
  }
  
  /* Kuvien korjaus (poistaa haamu-välit) */
  img { display:block; border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
  
  .email-container { width:100%; padding-bottom:4rem; }
  .jc-wrapper { max-width:800px; margin:0 auto; padding:2rem; }
  .jc-card { background:rgba(5,7,10,0.65); border-radius:14px; padding:2rem; margin-bottom:2.5rem; border:1px solid rgba(255,255,255,0.1); }
  
  .jc-h1 { font-family:"Josefin Sans"; font-size:3.5rem; color:white; text-shadow:0 0 20px #FF00E5; text-align:center; margin:0; line-height:1; }
  .jc-h2 { font-family:"Outfit"; font-weight:800; font-size:1.8rem; color:#00E7FF; text-transform:uppercase; margin:0 0 10px 0; }
  .jc-p { font-family:"Montserrat"; font-size:1rem; line-height:1.6; color:#F7F5E6; opacity:0.9; margin:0; }
  
  .agent-hero-btn { display:flex; align-items:center; background:rgba(0,231,255,0.05); border:1px solid #00E7FF; padding:15px; border-radius:12px; margin-bottom:2.5rem; text-decoration:none; }
  .agent-icon-box { width:50px; height:50px; background:#00E7FF; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-right:15px; position:relative; }
  .ping-ring { position:absolute; inset:0; border-radius:10px; border:2px solid #00E7FF; animation:ping 2s infinite; }
  
  .ticket-wrapper { border:1px solid #00E7FF; background:rgba(0,0,0,0.6); padding:2rem; margin-bottom:2.5rem; border-radius:14px; }
  .ticket-header { display:flex; justify-content:space-between; margin-bottom:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem; }
  .ticket-status { color:#ADFF2F; border:1px solid #ADFF2F; padding:2px 8px; border-radius:4px; font-family:monospace; font-size:0.7rem; }
  .character-box { border-left:4px solid #FF00E5; background:rgba(255,0,229,0.1); padding:2rem; margin:1.5rem 0; }
  .jc-cta { background:linear-gradient(135deg, #b000e6, #FF00E5); color:white; padding:1.2rem 2.5rem; border-radius:12px; font-weight:bold; text-decoration:none; display:inline-block; text-align:center; }
  
  .action-box { background:rgba(0,231,255,0.05); border:1px dashed #00E7FF; border-radius:12px; padding:2rem; text-align:center; margin-bottom:2.5rem; }
  .camera-icon { font-size:2.5rem; margin-bottom:1rem; animation:pulse 2s infinite; }
  
  .points-box { border:1px solid #ADFF2F; background:rgba(173,255,47,0.05); padding:2rem; border-radius:14px; margin-bottom:2.5rem; }
  .privacy-box { border:1px solid #FFA500; background:rgba(255,165,0,0.05); color:#ffeab0; padding:1rem; border-radius:8px; margin-bottom:2.5rem; font-size:0.85rem; }
  
  @keyframes ping { 75%, 100% { transform:scale(1.4); opacity:0; } }
  @keyframes pulse { 0%, 100% { transform:scale(1); opacity:0.8; } 50% { transform:scale(1.1); opacity:1; } }
  .small { font-size:0.75rem; color:#00E7FF; text-transform:uppercase; letter-spacing:0.1em; }
`;

export const renderBlockToHtml = (block) => {
  const { type, content } = block;
  
  switch (type) {
    case 'hero':
      return `
        <div style="text-align:center; padding:2rem 0 2.5rem 0;">
          <p class="small" style="margin-bottom:10px;">${content.date}</p>
          <h1 class="jc-h1">${content.title}</h1>
          <p class="small" style="color:#FF00E5; margin-top:10px;">Theme: ${content.theme}</p>
        </div>`;

    case 'h1': return `<h1 class="jc-h1" style="padding-bottom:2.5rem;">${content.text}</h1>`;
    case 'h2': return `<h2 class="jc-h2" style="padding-bottom:1rem;">${content.text}</h2>`;
    case 'p': return `<p class="jc-p" style="padding-bottom:2.5rem;">${content.text}</p>`;

    case 'agent':
      return `
        <div class="agent-hero-btn">
          <div class="agent-icon-box"><span style="font-size:24px;">📱</span><div class="ping-ring"></div></div>
          <div style="display:flex; flex-direction:column;">
            <span class="small">TEHTÄVÄT & VIESTIT</span>
            <span style="font-family:'Outfit'; font-weight:800; color:white; font-size:1rem;">AVAA SALAINEN KOMMUNIKAATTORI</span>
          </div>
        </div>`;

    case 'ticket':
      return `
        <div class="ticket-wrapper">
          <div class="ticket-header">
            <span style="font-family:'Outfit'; font-weight:800; color:#F7F5E6; font-size:0.75rem;">ACCESS PASS_v2.0</span>
            <span class="ticket-status">CONFIRMED</span>
          </div>
          <div style="text-align:center; margin-bottom:2rem;">
            <span class="small">TERVETULOA JÄSEN:</span>
            <h2 class="jc-h1" style="font-size:3rem; margin-top:0.5rem;">{{name}}</h2>
          </div>
          <div class="character-box">
            <span class="small" style="color:#FF00E5; display:block; margin-bottom:1rem;">${content.label}</span>
            <div style="font-family:'Josefin Sans'; font-size:2.2rem; color:white; text-shadow:0 0 10px #FF00E5;">{{character}}</div>
          </div>
          <div style="text-align:center; margin-top:2rem;">
            <a href="{{ticket_link}}" class="jc-cta" style="width:100%; box-sizing:border-box;">AVAA LIPPU & LIVEWALL</a>
          </div>
        </div>`;

    case 'action':
      return `
        <div class="action-box">
          <div class="camera-icon">📸</div>
          <h3 style="margin:0; color:white; font-family:'Outfit'; text-transform:uppercase;">${content.title}</h3>
          <p class="jc-p" style="font-size:0.9rem; margin-top:10px;">${content.body}</p>
        </div>`;

    case 'points':
      return `
        <div class="points-box">
          <h3 style="color:#ADFF2F; text-transform:uppercase; margin:0 0 10px 0; font-family:'Outfit';">Pistejahti: Aktiivisuus palkitaan</h3>
          <p class="jc-p" style="font-size:0.95rem;">${content.body}</p>
        </div>`;

    case 'privacy':
      return `
        <div class="privacy-box">
          <strong>⚠️ YKSITYISYYS:</strong><br>${content.body}
        </div>`;

    case 'info':
      return `
        <div class="jc-card small">
            <h2 class="jc-h2">Sijaintitiedot</h2>
            <div style="margin-bottom:1rem;"><span class="small">OSOITE</span><br><strong style="font-size:1.1rem; color:white;">${content.location}</strong></div>
            <div><span class="small">AIKA</span><br><strong style="font-size:1.1rem; color:white;">${content.time}</strong></div>
        </div>`;

    case 'list':
      const items = content.items.split('\n').filter(i=>i).map(i => `<li style="padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.1); color:#F7F5E6;"><span style="color:#FF00E5; margin-right:10px;">●</span> ${i}</li>`).join('');
      return `<div class="jc-card"><h2 class="jc-h2">${content.title}</h2><ul style="list-style:none; padding:0; margin:0;">${items}</ul></div>`;

    case 'contact':
      return `
        <div class="jc-card small" style="border-color:#00E7FF;">
          <h2 class="jc-h2" style="font-size:1.2rem; color:#00E7FF;">${content.title}</h2>
          <a href="mailto:${content.email}" style="color:white; text-decoration:underline;">${content.email}</a>
        </div>`;

    case 'image':
      return `<div style="text-align:center; margin-bottom:2.5rem;"><img src="${content.url}" style="max-width:100%; border-radius:14px; border:1px solid #00E7FF;" /></div>`;

    default: return '';
  }
};

export const assembleFullHtml = (content) => `
<!DOCTYPE html>
<html lang="fi" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&family=Montserrat:wght@400;600&family=Outfit:wght@300;400;800&display=swap" rel="stylesheet">
    <style>${EMAIL_CSS}</style>
    </head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#0b0b10;">
    <div class="email-container">
        <div style="text-align:center; padding:15px 0; font-size:10px; color:#444; font-family:sans-serif;">
            Eikö viesti näy oikein? <a href="{{browser_link}}" style="color:#00E7FF; text-decoration:underline;">Avaa selainversio tästä.</a>
        </div>
        <div class="jc-wrapper">
            ${content}
        </div>
        <div style="text-align:center; margin-top:2rem; color:#333; font-size:10px; font-family:sans-serif;">
            © 2025 J:CLUB Event Systems. All protocols secure.
        </div>
    </div>
</body>
</html>`;