// Aseta tämä falseksi, kun haluat nähdä vain oikeat pelaajat
export const ENABLE_DUMMY_MODE = false;

const NOW = Date.now();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const DUMMY_AGENTS = [
  // --- LIVE (0-30 min) ---
  { 
    id: 'd1', name: 'Ghost Protocol', role: 'MASTER SPY', xp: 6200, 
    found_secret_bar: true, completed_secret_mission: true,
    last_active_at: new Date(NOW - 2 * MINUTE).toISOString() 
  },
  { 
    id: 'd2', name: 'Black Widow', role: 'ASSASSIN', xp: 5800, 
    found_secret_bar: false, completed_secret_mission: true,
    last_active_at: new Date(NOW - 12 * MINUTE).toISOString() 
  },
  
  // --- ILTA (30min - 6h) ---
  { 
    id: 'd4', name: '007', role: '00-STATUS', xp: 4500, 
    found_secret_bar: true, completed_secret_mission: true,
    last_active_at: new Date(NOW - 1 * HOUR).toISOString() 
  },
  { 
    id: 'd5', name: 'Jack Bauer', role: 'CTU AGENT', xp: 4100, 
    found_secret_bar: false, completed_secret_mission: false,
    last_active_at: new Date(NOW - 3 * HOUR).toISOString() 
  },

  // --- HISTORIA ---
  { id: 'd7', name: 'Austin Powers', xp: 2500, found_secret_bar: true, completed_secret_mission: false, last_active_at: new Date(NOW - 24 * HOUR).toISOString() },
  { id: 'd8', name: 'Inspector Gadget', xp: 1800, found_secret_bar: false, completed_secret_mission: false, last_active_at: new Date(NOW - 48 * HOUR).toISOString() },
  { id: 'd9', name: 'Pink Panther', xp: 1200, found_secret_bar: true, completed_secret_mission: false, last_active_at: new Date(NOW - 72 * HOUR).toISOString() },
  { id: 'd10', name: 'Smart', xp: 900, found_secret_bar: false, completed_secret_mission: false, last_active_at: '2023-01-01T12:00:00Z' },
  { id: 'd11', name: 'Solo', xp: 500, found_secret_bar: false, completed_secret_mission: false, last_active_at: '2023-01-01T12:00:00Z' },
  { id: 'd12', name: 'Mr. Bean', xp: 50, found_secret_bar: true, completed_secret_mission: false, last_active_at: '2023-01-01T12:00:00Z' },
];