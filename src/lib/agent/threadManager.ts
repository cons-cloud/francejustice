import type { AgentThread, AgentMessage, UserApiKeys } from './types';
import { supabase } from '../supabase';

const THREADS_STORAGE_KEY = 'fj_ai_agent_threads_v1';
const ACTIVE_THREAD_ID_KEY = 'fj_ai_agent_active_thread_id_v1';
const API_KEYS_STORAGE_KEY = 'fj_ai_agent_api_keys_v1';

export function getStoredApiKeys(): UserApiKeys {
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      gemini: parsed.gemini || (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
      openai: parsed.openai || (import.meta as any).env?.VITE_OPENAI_API_KEY || '',
      anthropic: parsed.anthropic || (import.meta as any).env?.VITE_ANTHROPIC_API_KEY || '',
      deepseek: parsed.deepseek || (import.meta as any).env?.VITE_DEEPSEEK_API_KEY || '',
      ...parsed
    };
  } catch (_e) {
    return {
      gemini: (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
      openai: (import.meta as any).env?.VITE_OPENAI_API_KEY || '',
      anthropic: (import.meta as any).env?.VITE_ANTHROPIC_API_KEY || '',
      deepseek: (import.meta as any).env?.VITE_DEEPSEEK_API_KEY || '',
    };
  }
}

export function saveStoredApiKeys(keys: UserApiKeys): void {
  try {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (_e) {
    console.warn("Failed to persist user API keys in localStorage");
  }
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (_e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createNewThread(
  modelId: string = 'france-justice-auto',
  personaId: string = 'generalist-lawyer',
  userId?: string
): AgentThread {
  const newThread: AgentThread = {
    id: generateUUID(),
    title: 'Nouvelle Analyse Juridique',
    userId,
    modelId,
    personaId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    uploadedFiles: []
  };

  const existingThreads = loadAllThreads();
  const updatedThreads = [newThread, ...existingThreads];
  saveAllThreads(updatedThreads);
  setActiveThreadId(newThread.id);

  return newThread;
}

export function loadAllThreads(): AgentThread[] {
  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
    if (!raw) return [];
    const threads: AgentThread[] = JSON.parse(raw);
    return Array.isArray(threads) ? threads : [];
  } catch (e) {
    console.warn("Error parsing threads from localStorage:", e);
    return [];
  }
}

export function saveAllThreads(threads: AgentThread[]): void {
  try {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads.slice(0, 50)));
  } catch (e) {
    console.warn("Error saving threads to localStorage:", e);
  }
}

export function getActiveThreadId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_THREAD_ID_KEY);
  } catch (_e) {
    return null;
  }
}

export function setActiveThreadId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_THREAD_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_THREAD_ID_KEY);
    }
  } catch (_e) {
    // Ignore storage issues
  }
}

export function updateThreadInStorage(updatedThread: AgentThread): void {
  const threads = loadAllThreads();
  const index = threads.findIndex(t => t.id === updatedThread.id);
  if (index >= 0) {
    threads[index] = { ...updatedThread, updatedAt: new Date().toISOString() };
  } else {
    threads.unshift(updatedThread);
  }
  saveAllThreads(threads);
}

export function deleteThreadFromStorage(threadId: string): void {
  const threads = loadAllThreads().filter(t => t.id !== threadId);
  saveAllThreads(threads);
  if (getActiveThreadId() === threadId) {
    setActiveThreadId(threads[0]?.id || null);
  }
}

/**
 * Synchronize threads with Supabase `legal_diagnostics_just` table
 */
export async function syncThreadToSupabase(thread: AgentThread, userId: string): Promise<void> {
  if (!userId || !thread) return;

  try {
    const lastAssistantMsg = [...thread.messages].reverse().find(m => m.role === 'assistant');
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(thread.id);

    const payload: any = {
      user_id: userId,
      case_title: thread.title || 'Analyse IA Juridique',
      uploaded_files: thread.uploadedFiles || [],
      full_analysis: {
        summary: lastAssistantMsg?.content || 'Analyse juridique générée par l\'Agent IA.',
        thread_id: thread.id,
        model_id: thread.modelId,
        persona_id: thread.personaId,
        messages_count: thread.messages.length,
        messages: thread.messages.slice(-50),
        last_message: lastAssistantMsg?.content?.substring(0, 500),
        tools_used: lastAssistantMsg?.toolCalls?.map(t => t.toolName) || []
      },
      win_probability: 75,
      updated_at: new Date().toISOString()
    };

    if (isUUID) {
      payload.id = thread.id;
    }

    await supabase
      .from('legal_diagnostics_just')
      .upsert(payload, isUUID ? { onConflict: 'id' } : undefined);
  } catch (err) {
    console.warn("Supabase thread sync warning:", err);
  }
}

/**
 * Fetch threads from Supabase `legal_diagnostics_just` for a user (cross-device sync)
 */
export async function fetchThreadsFromSupabase(userId: string): Promise<AgentThread[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('legal_diagnostics_just')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      title: row.case_title || 'Analyse Juridique',
      userId: row.user_id,
      modelId: row.full_analysis?.model_id || 'france-justice-auto',
      personaId: row.full_analysis?.persona_id || 'generalist-lawyer',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      messages: Array.isArray(row.full_analysis?.messages) && row.full_analysis.messages.length > 0 
        ? row.full_analysis.messages 
        : (
          row.full_analysis?.summary ? [{
            id: `msg_${row.id}`,
            role: 'assistant' as const,
            content: row.full_analysis.summary,
            createdAt: row.created_at || new Date().toISOString(),
            status: 'completed' as const
          }] : []
        ),
      uploadedFiles: row.uploaded_files || []
    }));
  } catch (err) {
    console.warn("Failed to fetch threads from Supabase:", err);
    return [];
  }
}
