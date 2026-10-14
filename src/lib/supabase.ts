import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

// Proactive stale auth token verification before client initialization
if (typeof window !== 'undefined') {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (!parsed || (typeof parsed === 'object' && !parsed.refresh_token && !parsed.access_token)) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (_e) {}

  // Filter internal GoTrue console.error for expired refresh tokens and purge immediately
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const firstArg = args[0];
    const message = typeof firstArg === 'string' ? firstArg : (firstArg?.message || '');
    if (
      message.includes('Invalid Refresh Token') ||
      message.includes('Refresh Token Not Found') ||
      message.includes('refresh_token_not_found') ||
      (firstArg?.name === 'AuthApiError' && (firstArg?.status === 400 || message.includes('refresh_token')))
    ) {
      console.info('[Supabase] Jeton de rafraîchissement obsolète purgé automatiquement.');
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('sb-') && k.endsWith('-auth-token'))) {
            localStorage.removeItem(k);
          }
        }
        localStorage.removeItem('role');
      } catch (_err) {}
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Global listener to cleanly intercept invalid refresh tokens without console crashes
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    if (
      reason?.name === 'AuthApiError' &&
      (reason?.message?.includes('Invalid Refresh Token') ||
       reason?.message?.includes('Refresh Token Not Found') ||
       reason?.message?.includes('refresh_token_not_found') ||
       reason?.status === 400)
    ) {
      event.preventDefault();
      console.info('[Supabase] Jeton de rafraîchissement obsolète intercepté et purgé.');
      try {
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
            localStorage.removeItem(k);
          }
        }
        localStorage.removeItem('role');
      } catch (_e) {}
    }
  });
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
