import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: async (_name, _acquireTimeout, fn) => {
      return await fn();
    }
  },
  realtime: {
    // Increase timeout to avoid premature WebSocket close on slow connections
    timeout: 30000,
    params: {
      // Reduce heartbeat frequency to lower concurrent connection pressure
      heartbeatIntervalMs: 30000,
    },
  },
  global: {
    headers: {
      'x-client-info': 'francejustice-web',
    },
  },
});
