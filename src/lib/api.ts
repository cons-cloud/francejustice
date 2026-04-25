const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

export function ensureUserId(): string {
  const key = 'uid';
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(key, uid);
  }
  return uid;
}

export async function fetchSearchResults(query: string, category: string) {
  const params = new URLSearchParams({ query, category });
  return request(`/search?${params.toString()}`);
}

export async function fetchUserSearchHistory(userId: string) {
  const params = new URLSearchParams({ userId });
  return request(`/search/history?${params.toString()}`);
}

export async function logUserSearch(userId: string, query: string, category: string) {
  return request('/search/log', {
    method: 'POST',
    body: JSON.stringify({ userId, query, category, ts: new Date().toISOString() }),
  });
}

// Assistant chat API stubs
export async function sendChatMessage(messages: Array<{ role: string; content: string }>, _file?: File) {
  // Placeholder to integrate with backend later
  return request('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}


