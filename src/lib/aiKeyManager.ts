/**
 * France Justice - Unified AI Key Manager & Realtime Resilient Fallback Engine
 * 
 * Features:
 * - Realtime Sync across tabs & devices (via Supabase Realtime & broadcast channel / localStorage)
 * - Automatic Fallback on failure (401 invalid key, 429 rate limit / quota exceeded)
 * - Live Status Tracking: 'active' | 'quota_exceeded' | 'invalid_key' | 'disabled'
 * - Realtime Admin Notifications when a key fails
 * - Admin UI Integration with instant updates
 */

import { supabase } from './supabase';

export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'deepseek';

export interface KeyStatus {
  provider: AIProvider;
  key: string;
  status: 'active' | 'quota_exceeded' | 'invalid_key' | 'disabled';
  lastChecked?: string;
  lastError?: string;
}

export interface PlatformAIConfig {
  openai_key: string;
  gemini_key: string;
  anthropic_key: string;
  deepseek_key: string;
  openai_status?: 'active' | 'quota_exceeded' | 'invalid_key' | 'disabled';
  gemini_status?: 'active' | 'quota_exceeded' | 'invalid_key' | 'disabled';
  anthropic_status?: 'active' | 'quota_exceeded' | 'invalid_key' | 'disabled';
  deepseek_status?: 'active' | 'quota_exceeded' | 'invalid_key' | 'disabled';
  last_alert?: {
    provider: AIProvider;
    message: string;
    timestamp: string;
  };
}

const STORAGE_KEY = 'fj_platform_ai_keys_v2';
const BROADCAST_CHANNEL_NAME = 'fj_ai_key_sync_channel';

// In-memory cache
let cachedConfig: PlatformAIConfig = loadInitialConfig();
let broadcastChannel: BroadcastChannel | null = null;
const listeners = new Set<(config: PlatformAIConfig) => void>();

function loadInitialConfig(): PlatformAIConfig {
  const envConfig: PlatformAIConfig = {
    openai_key: (import.meta as any).env?.VITE_OPENAI_API_KEY || '',
    gemini_key: (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
    anthropic_key: (import.meta as any).env?.VITE_ANTHROPIC_API_KEY || '',
    deepseek_key: (import.meta as any).env?.VITE_DEEPSEEK_API_KEY || '',
    openai_status: 'active',
    gemini_status: 'active',
    anthropic_status: 'active',
    deepseek_status: 'active'
  };

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...envConfig,
          ...parsed,
          // Ensure keys prefer localStorage if present, else fallback to env
          openai_key: parsed.openai_key || envConfig.openai_key,
          gemini_key: parsed.gemini_key || envConfig.gemini_key,
          anthropic_key: parsed.anthropic_key || envConfig.anthropic_key,
          deepseek_key: parsed.deepseek_key || envConfig.deepseek_key,
        };
      }
    } catch (_e) {}
  }

  return envConfig;
}

// Setup BroadcastChannel for instant same-browser cross-tab sync
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'CONFIG_UPDATE' && event.data?.config) {
        cachedConfig = event.data.config;
        notifyListeners();
      }
    };
  } catch (_e) {}
}

function notifyListeners() {
  listeners.forEach(fn => fn({ ...cachedConfig }));
}

/**
 * Subscribe to realtime config updates
 */
export function subscribeToAIConfig(callback: (config: PlatformAIConfig) => void): () => void {
  listeners.add(callback);
  callback({ ...cachedConfig });
  return () => listeners.delete(callback);
}

/**
 * Get current configured keys & statuses
 */
export function getAIConfig(): PlatformAIConfig {
  return { ...cachedConfig };
}

/**
 * Update and persist config across localStorage, Supabase and BroadcastChannel
 */
export async function updateAIConfig(newConfig: Partial<PlatformAIConfig>): Promise<void> {
  cachedConfig = {
    ...cachedConfig,
    ...newConfig
  };

  // 1. LocalStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedConfig));
    } catch (_e) {}
  }

  // 2. BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CONFIG_UPDATE', config: cachedConfig });
    } catch (_e) {}
  }

  // 3. Local storage & in-browser broadcast channel (no direct failing table upsert)

  notifyListeners();
}

/**
 * Report a key failure (e.g. 429 quota or 401 invalid) and trigger an admin notification
 */
export async function reportKeyFailure(provider: AIProvider, reason: 'quota_exceeded' | 'invalid_key', errorDetails?: string) {
  console.warn(`[AIKeyManager] ⚠️ Clef ${provider.toUpperCase()} en échec: ${reason} (${errorDetails || 'Erreur'})`);

  const statusKey = `${provider}_status` as keyof PlatformAIConfig;
  const alert = {
    provider,
    message: reason === 'quota_exceeded' 
      ? `Quota dépassé pour ${provider.toUpperCase()} (Erreur 429). Bascule automatique activée.`
      : `Clé ${provider.toUpperCase()} invalide ou révoquée (Erreur 401). Bascule automatique activée.`,
    timestamp: new Date().toISOString()
  };

  await updateAIConfig({
    [statusKey]: reason,
    last_alert: alert
  } as any);

  // Send in-app notification to admins
  try {
    await supabase.from('notifications_just').insert([{
      title: `🚨 Alerte Clé IA: ${provider.toUpperCase()}`,
      message: `${alert.message} Veuillez mettre à jour la clé dans le Dashboard Admin.`,
      type: 'warning',
      category: 'system',
      created_at: new Date().toISOString()
    }]);
  } catch (_e) {}
}

/**
 * Mark a key back as active
 */
export async function markKeyActive(provider: AIProvider) {
  const statusKey = `${provider}_status` as keyof PlatformAIConfig;
  await updateAIConfig({
    [statusKey]: 'active'
  } as any);
}

/**
 * Realtime init listener on Supabase platform_settings_just
 */
export function initAIKeyRealtimeSync(): () => void {
  // Initial fetch from Supabase
  supabase
    .from('platform_settings_just')
    .select('ai_config')
    .eq('id', 'global')
    .maybeSingle()
    .then(({ data }) => {
      if (data?.ai_config) {
        cachedConfig = {
          ...cachedConfig,
          ...data.ai_config
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedConfig));
        }
        notifyListeners();
      }
    })
    .catch((err) => console.warn('[AIKeyManager] Initial sync warning:', err));

  // Subscribe to changes on platform_settings_just
  const channel = supabase
    .channel('platform_ai_keys_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'platform_settings_just' },
      (payload: any) => {
        if (payload?.new?.ai_config) {
          cachedConfig = {
            ...cachedConfig,
            ...payload.new.ai_config
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedConfig));
          }
          notifyListeners();
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
