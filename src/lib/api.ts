import { supabase } from './supabase';

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

/**
 * Authenticated POST to Django backend.
 * Automatically attaches the current Supabase session JWT as Bearer token
 * for the SupabaseJWTAuthentication middleware.
 */
export async function apiPost<T = any>(path: string, body: object): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    throw new Error(json?.error || `Erreur serveur (${res.status})`);
  }
  return json as T;
}

/**
 * Creates a Stripe Checkout Session via the Django backend and redirects
 * the user to the Stripe-hosted payment page.
 *
 * @param quoteId    - UUID of the quote/devis
 * @param type       - 'quote_payment' (citizen pays lawyer) | 'commission_payment' (lawyer pays platform)
 * @param amountMAD  - Amount in MAD (converted to centimes internally)
 * @returns The Stripe checkout URL
 */
export async function createCheckoutSession(
  quoteId: string,
  type: 'quote_payment' | 'commission_payment',
  amountMAD: number
): Promise<string> {
  const data = await apiPost<{ url?: string; error?: string }>(
    '/payments/create-checkout-session/',
    {
      quote_id: quoteId,
      type,
      amount: Math.round(amountMAD * 100), // MAD → centimes
    }
  );

  if (!data.url) {
    throw new Error(data.error || 'Aucune URL de paiement reçue du serveur.');
  }
  return data.url;
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


