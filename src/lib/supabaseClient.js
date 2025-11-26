import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL tai Anon Key puuttuu. Tarkista .env-tiedosto.")
}

// TÄMÄ ON KRIITTINEN RIVI:
// Meidän pitää luoda muuttuja JA exportata se 'const'-avaainsanalla,
// jotta se on "named export".
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ÄLÄ TEE NÄIN (tämä olisi default export):
// const supabase = createClient(supabaseUrl, supabaseAnonKey)
// export default supabase