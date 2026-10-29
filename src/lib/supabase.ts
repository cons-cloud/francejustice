import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const purgeStaleSupabaseTokens = () => {
  if (typeof window === 'undefined') return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') && k.endsWith('-auth-token'))) {
        localStorage.removeItem(k);
      }
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('sb-') && k.endsWith('-auth-token'))) {
        sessionStorage.removeItem(k);
      }
    }
    localStorage.removeItem('role');
  } catch (_e) {}
};

// Proactive stale auth token verification before client initialization
if (typeof window !== 'undefined') {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (!parsed || (typeof parsed === 'object' && !parsed.refresh_token && !parsed.access_token)) {
              localStorage.removeItem(key);
            } else if (parsed && typeof parsed.expires_at === 'number') {
              // If expired by more than 7 days, refresh token is guaranteed invalid in Supabase
              if (nowSec - parsed.expires_at > 7 * 86400) {
                localStorage.removeItem(key);
                localStorage.removeItem('role');
              }
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
      message.includes('invalid_grant') ||
      (firstArg?.name === 'AuthApiError' && (firstArg?.status === 400 || message.includes('refresh_token')))
    ) {
      console.info('[Supabase] Jeton de rafraîchissement obsolète purgé automatiquement.');
      purgeStaleSupabaseTokens();
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
       reason?.message?.includes('invalid_grant') ||
       reason?.status === 400)
    ) {
      event.preventDefault();
      console.info('[Supabase] Jeton de rafraîchissement obsolète intercepté et purgé.');
      purgeStaleSupabaseTokens();
    }
  });
}

// Custom fetch wrapper to catch 400 Bad Request on token refresh and immediately purge local storage
const supabaseFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
  try {
    const response = await fetch(input, init);
    if (
      response.status === 400 &&
      (url.includes('/auth/v1/token') || (typeof init?.body === 'string' && init.body.includes('refresh_token')))
    ) {
      purgeStaleSupabaseTokens();
    }
    return response;
  } catch (err: any) {
    if (url.includes('/auth/v1/token')) {
      purgeStaleSupabaseTokens();
    }
    throw err;
  }
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: async (_name, _acquireTimeout, fn) => {
      try {
        return await fn();
      } catch (err: any) {
        const msg = err?.message || '';
        if (
          err?.name === 'AuthApiError' ||
          err?.status === 400 ||
          msg.includes('Invalid Refresh Token') ||
          msg.includes('Refresh Token Not Found') ||
          msg.includes('refresh_token_not_found') ||
          msg.includes('invalid_grant')
        ) {
          purgeStaleSupabaseTokens();
        }
        throw err;
      }
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
    fetch: supabaseFetch,
    headers: {
      'x-client-info': 'francejustice-web',
    },
  },
});

// Cleanly handle auth state changes and purge invalid sessions
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (!session && event === 'TOKEN_REFRESHED')) {
    purgeStaleSupabaseTokens();
  }
});
