// Aseta tämä falseksi, kun haluat nähdä vain oikeat pelaajat
export const ENABLE_DUMMY_MODE = true;

const NOW = Date.now();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const DUMMY_AGENTS = [
  // --- 🔥 THE RIVALS (Kärkikaksikko, kova taistelu) ---
  { 
    id: 'd1', name: 'Vesper Lynd', role: 'DOUBLE AGENT', xp: 7250, 
    found_secret_bar: true, completed_secret_mission: true,
    last_active_at: new Date(NOW - 30 * 1000).toISOString() // 30 sekuntia sitten
  },
  { 
    id: 'd2', name: 'Jason Bourne', role: 'ROGUE ASSET', xp: 7100, 
    found_secret_bar: true, completed_secret_mission: false, // Jahtaa kärkeä!
    last_active_at: new Date(NOW - 2 * MINUTE).toISOString() 
  },
  
  // --- 🚀 THE CHASING PACK (Aktiivinen kärki) ---
  { 
    id: 'd3', name: 'Ethan Hunt', role: 'IMF POINTMAN', xp: 6400, 
    found_secret_bar: false, completed_secret_mission: true,
    last_active_at: new Date(NOW - 5 * MINUTE).toISOString() 
  },
  { 
    id: 'd4', name: 'Black Widow', role: 'AVENGER', xp: 5900, 
    found_secret_bar: true, completed_secret_mission: true,
    last_active_at: new Date(NOW - 8 * MINUTE).toISOString() 
  },
  { 
    id: 'd5', name: 'Agent 47', role: 'HITMAN', xp: 5150, 
    found_secret_bar: false, completed_secret_mission: false,
    last_active_at: new Date(NOW - 12 * MINUTE).toISOString() 
  },

  // --- 🍸 THE VETERANS (Aktiivisia tunnin sisään) ---
  { 
    id: 'd6', name: '007', role: '00-STATUS', xp: 4200, 
    found_secret_bar: true, completed_secret_mission: false,
    last_active_at: new Date(NOW - 45 * MINUTE).toISOString() 
  },
  { 
    id: 'd7', name: 'Trinity', role: 'THE HACKER', xp: 3800, 
    found_secret_bar: true, completed_secret_mission: true,
    last_active_at: new Date(NOW - 25 * MINUTE).toISOString() 
  },
  { 
    id: 'd8', name: 'Neo', role: 'THE ONE', xp: 3600, 
    found_secret_bar: false, completed_secret_mission: true,
    last_active_at: new Date(NOW - 28 * MINUTE).toISOString() 
  },

  // --- 🕵️ THE ROOKIES & LEGENDS (Historialliset) ---
  { id: 'd9', name: 'Jack Bauer', role: 'CTU', xp: 2100, found_secret_bar: false, completed_secret_mission: false, last_active_at: new Date(NOW - 2 * HOUR).toISOString() },
  { id: 'd10', name: 'Austin Powers', role: 'INT. MAN OF MYSTERY', xp: 1500, found_secret_bar: true, completed_secret_mission: false, last_active_at: new Date(NOW - 5 * HOUR).toISOString() },
  { id: 'd11', name: 'Johnny English', role: 'MI7', xp: 450, found_secret_bar: false, completed_secret_mission: false, last_active_at: new Date(NOW - 6 * HOUR).toISOString() },
  { id: 'd12', name: 'Inspector Gadget', role: 'CYBORG', xp: 100, found_secret_bar: false, completed_secret_mission: false, last_active_at: new Date(NOW - 24 * HOUR).toISOString() },
];