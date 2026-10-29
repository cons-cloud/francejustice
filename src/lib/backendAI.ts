/**
 * France Justice — Backend AI Proxy Service
 *
 * All AI API calls go through the Django backend, which holds the secret keys.
 * The frontend NEVER exposes API keys in the browser bundle.
 *
 * Endpoints:
 *   POST /api/ai/universal/    — auto-selects best provider (preferred fallback chain)
 *   POST /api/ai/chat/         — Gemini chat
 *   POST /api/ai/openai/       — OpenAI proxy
 *   POST /api/ai/anthropic/    — Anthropic Claude proxy
 *   POST /api/ai/generate-document/ — legal document generation
 */

import { supabase } from './supabase';

// ── Base URL ─────────────────────────────────────────────────────────────────
// Since frontend and backend are deployed together on Railway under the same origin (Nginx proxy),
// API requests must default to relative paths ('') so the browser sends them to the current domain (e.g. /api/...)
// instead of trying localhost:8000 on the client's machine.
function getBackendBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (typeof window !== 'undefined') {
    const isRemote = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    // If on production / remote domain, ignore any hardcoded localhost:8000
    if (isRemote) {
      if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http') && !envUrl.includes('localhost')) {
        return envUrl.replace(/\/$/, '');
      }
      return '';
    }
  }
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && !envUrl.includes('localhost')) {
    return envUrl.trim().replace(/\/$/, '');
  }
  // Default to relative path: works both in Vite dev (proxied to 127.0.0.1:8000) and in production (Nginx)
  return '';
}

const BACKEND_BASE = getBackendBase();

// ── Auth header helper ────────────────────────────────────────────────────────
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } } as any));
  const token = data?.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function backendPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const headers = await getAuthHeaders();
  let res = await fetch(`${BACKEND_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if ((res.status === 401 || res.status === 403) && headers.Authorization) {
    // Retry without Authorization header in case browser session JWT is expired or invalid
    res = await fetch(`${BACKEND_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  if (!res.ok) {
    throw new Error(`[BackendAI] HTTP ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

// ── Response type ─────────────────────────────────────────────────────────────
export interface BackendAIResponse {
  text?: string;
  sources_web?: { title: string; uri: string }[];
  provider_used?: string;
  model_used?: string;
  error?: string;
  is_fallback_trigger?: boolean;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Universal proxy — tries Groq → Gemini → OpenAI → Anthropic automatically.
 * This should be the default call for all AI requests.
 */
export async function callUniversalProxy(
  prompt: string,
  options: {
    systemPrompt?: string;
    preferredProvider?: 'groq' | 'gemini' | 'openai' | 'anthropic';
    history?: { role: string; parts: { text: string }[] }[];
  } = {}
): Promise<BackendAIResponse> {
  try {
    return await backendPost<BackendAIResponse>('/api/ai/universal/', {
      prompt,
      system_prompt: options.systemPrompt,
      preferred_provider: options.preferredProvider ?? 'groq',
      history: options.history ?? [],
    });
  } catch (e) {
    return { error: String(e), is_fallback_trigger: true };
  }
}

/**
 * Groq Ultra-fast proxy (5-20ms inference).
 */
export async function callGroqProxy(
  prompt: string,
  options: {
    systemPrompt?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<BackendAIResponse> {
  try {
    return await backendPost<BackendAIResponse>('/api/ai/groq/', {
      prompt,
      system_prompt: options.systemPrompt,
      model: options.model ?? 'qwen/qwen3.8-27b',
      max_tokens: options.maxTokens ?? 8000,
      temperature: options.temperature ?? 0.2,
    });
  } catch (e) {
    return { error: String(e), is_fallback_trigger: true };
  }
}

/**
 * Gemini chat proxy.
 */
export async function callGeminiProxy(
  prompt: string,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<BackendAIResponse> {
  try {
    return await backendPost<BackendAIResponse>('/api/ai/chat/', { prompt, history });
  } catch (e) {
    return { error: String(e), is_fallback_trigger: true };
  }
}

/**
 * OpenAI proxy.
 */
export async function callOpenAIProxy(
  prompt: string,
  options: {
    systemPrompt?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<BackendAIResponse> {
  try {
    return await backendPost<BackendAIResponse>('/api/ai/openai/', {
      prompt,
      system_prompt: options.systemPrompt,
      model: options.model ?? 'gpt-4o-mini',
      max_tokens: options.maxTokens ?? 8000,
      temperature: options.temperature ?? 0.3,
    });
  } catch (e) {
    return { error: String(e), is_fallback_trigger: true };
  }
}

/**
 * Anthropic Claude proxy.
 */
export async function callAnthropicProxy(
  prompt: string,
  options: {
    systemPrompt?: string;
    model?: string;
    maxTokens?: number;
  } = {}
): Promise<BackendAIResponse> {
  try {
    return await backendPost<BackendAIResponse>('/api/ai/anthropic/', {
      prompt,
      system_prompt: options.systemPrompt,
      model: options.model ?? 'claude-3-5-haiku-20241022',
      max_tokens: options.maxTokens ?? 8000,
    });
  } catch (e) {
    return { error: String(e), is_fallback_trigger: true };
  }
}

/**
 * Legal document generation proxy.
 */
export async function callDocumentProxy(
  type: string,
  details: string
): Promise<BackendAIResponse> {
  try {
    return await backendPost<BackendAIResponse>('/api/ai/generate-document/', { type, details });
  } catch (e) {
    return { error: String(e), is_fallback_trigger: true };
  }
}

let _backendCheckCache: { available: boolean; timestamp: number } | null = null;

/**
 * Check if backend AI proxy is reachable and configured.
 * Cached for 30s on success, 5s on failure to allow fast recovery.
 */
export async function isBackendAIAvailable(): Promise<boolean> {
  const now = Date.now();
  if (_backendCheckCache) {
    const ttl = _backendCheckCache.available ? 30000 : 5000;
    if (now - _backendCheckCache.timestamp < ttl) {
      return _backendCheckCache.available;
    }
  }
  try {
    const res = await fetch(`${BACKEND_BASE}/api/health/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3500),
    });
    const isOk = res.ok;
    _backendCheckCache = { available: isOk, timestamp: now };
    return isOk;
  } catch {
    _backendCheckCache = { available: false, timestamp: now };
    return false;
  }
}

/**
 * Executes the Python Algorithmic Legal Case Analysis (5 Pillars + Ingestion).
 */
export async function analyzeLegalCaseWithBackend(params: {
  caseTitle: string;
  userDescription: string;
  extractedDocumentsText?: string;
  targetLang?: string;
  uploadedFileNames?: string[];
}): Promise<any> {
  try {
    return await backendPost<any>('/api/ai/analyze-case/', params);
  } catch (e) {
    console.warn('[BackendAI] analyzeLegalCaseWithBackend failed:', e);
    return null;
  }
}

/**
 * Executes the Python Algorithmic Contract Analysis.
 */
export async function analyzeContractWithBackend(params: {
  contractText: string;
  contractType?: string;
  targetLang?: string;
}): Promise<any> {
  try {
    return await backendPost<any>('/api/ai/analyze-contract/', params);
  } catch (e) {
    console.warn('[BackendAI] analyzeContractWithBackend failed:', e);
    return null;
  }
}

