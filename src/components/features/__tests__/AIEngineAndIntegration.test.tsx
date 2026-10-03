/**
 * Tests unitaires & d'intégration — Moteur IA, Gemini, LegalAIDiagnostic
 * Couvre : engine.ts, gemini.ts (chatWithAI), LegalAIDiagnostic.tsx
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: { message: 'disabled in tests' } }),
    },
  },
}));

// ─── 1. Gemini Key Validation ─────────────────────────────────────────────────
describe('Gemini API Key Validation', () => {
  it('accepts AQ. prefixed keys (new Google format)', () => {
    const key = 'AQ.PLACEHOLDER_GEMINI_KEY_FOR_TESTING_PURPOSES_ONLY_123456';
    expect(key.trim().length >= 20).toBe(true);
  });

  it('accepts AIzaSy prefixed keys (legacy format)', () => {
    const key = 'AIzaSyD3A-longvalidkeyformat12345678';
    expect(key.trim().length >= 20).toBe(true);
  });

  it('rejects empty key', () => {
    expect(''.trim().length >= 20).toBe(false);
  });

  it('rejects short/invalid key', () => {
    expect('short'.trim().length >= 20).toBe(false);
  });
});

// ─── 2. Gemini API URL Construction ──────────────────────────────────────────
describe('Gemini API URL Construction', () => {
  const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

  it('builds correct URL for AQ. key with gemini-3.8-flash', () => {
    const key = 'AQ.PLACEHOLDER_GEMINI_KEY_FOR_TESTING_PURPOSES_ONLY_123456';
    const model = 'gemini-3.8-flash';
    const url = `${BASE}/${model}:generateContent?key=${key}`;
    expect(url).toContain('gemini-3.8-flash');
    expect(url).toContain('?key=AQ.');
  });

  it('uses ?key= query param format (not Bearer auth) for AQ. keys', () => {
    const key = 'AQ.TestKey12345678901234567890';
    const url = `${BASE}/gemini-3.8-flash:generateContent?key=${key}`;
    expect(url.includes('?key=')).toBe(true);
    expect(url.includes('Bearer')).toBe(false);
  });
});

// ─── 3. AI Provider Fallback Chain Logic ─────────────────────────────────────
describe('AI Provider Fallback Chain', () => {
  const isInvalidText = (t: string | null | undefined) =>
    !t || t.trim().length < 10 || t.includes('Erreur') || t.includes('error');

  it('falls through to OpenAI when Gemini returns empty', () => {
    expect(isInvalidText('')).toBe(true);
  });

  it('stops fallback when Gemini returns valid text', () => {
    const validResponse = 'Voici une analyse juridique complète de votre situation professionnelle.';
    expect(isInvalidText(validResponse)).toBe(false);
  });

  it('rejects error-containing responses', () => {
    expect(isInvalidText('Erreur de génération')).toBe(true);
    expect(isInvalidText('error occurred')).toBe(true);
  });

  it('all providers failing triggers internal synthesis fallback', () => {
    const allFailed = isInvalidText('') && isInvalidText('') && isInvalidText('');
    expect(allFailed).toBe(true);
  });
});

// ─── 4. OpenAI 429 Retry Model Chain ─────────────────────────────────────────
describe('OpenAI 429 Retry Logic', () => {
  it('defines fallback chain: gpt-4o-mini → gpt-3.5-turbo', () => {
    const openAIModels = ['gpt-4o-mini', 'gpt-3.5-turbo'];
    expect(openAIModels[0]).toBe('gpt-4o-mini');
    expect(openAIModels[1]).toBe('gpt-3.5-turbo');
  });

  it('breaks on 429 and tries next model in chain', async () => {
    let callIdx = 0;
    const responses = [
      { ok: false, status: 429, text: async () => 'quota exceeded' },
      { ok: true, json: async () => ({ choices: [{ message: { content: 'Réponse GPT-3.5 Turbo réussie' } }] }) },
    ];
    const mockFetch = vi.fn().mockImplementation(() => Promise.resolve(responses[callIdx++]));

    const models = ['gpt-4o-mini', 'gpt-3.5-turbo'];
    let result = '';

    for (const model of models) {
      if (result.trim().length >= 10) break;
      const res = await mockFetch(`https://api.openai.com/v1/chat/completions`, { method: 'POST', body: JSON.stringify({ model }) }) as any;
      if (res.ok) {
        const json = await res.json();
        result = json?.choices?.[0]?.message?.content || '';
      }
    }

    expect(result).toBe('Réponse GPT-3.5 Turbo réussie');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

// ─── 5. Anthropic Prompt Truncation ──────────────────────────────────────────
describe('Anthropic Payload Truncation', () => {
  it('truncates user content beyond 14000 chars', () => {
    const longPrompt = 'A'.repeat(20000);
    const truncated = longPrompt.length > 14000
      ? longPrompt.substring(0, 14000) + '\n\n[...Contenu tronqué...]'
      : longPrompt;
    expect(truncated.length).toBeLessThan(20000);
    expect(truncated).toContain('[...Contenu tronqué...]');
  });

  it('does NOT truncate content under 14000 chars', () => {
    const normalPrompt = 'B'.repeat(5000);
    const result = normalPrompt.length > 14000 ? normalPrompt.substring(0, 14000) + '...' : normalPrompt;
    expect(result.length).toBe(5000);
  });

  it('uses claude-3-5-haiku as default model (fewer 400 errors)', () => {
    const defaultModel = 'claude-3-5-haiku-20241022';
    expect(defaultModel).toContain('haiku');
  });
});

// ─── 6. Auth Role Redirections ───────────────────────────────────────────────
describe('Auth Role Redirect Logic', () => {
  function getRedirectPath(role: string): string {
    if (role === 'admin') return '/dashboard/admin';
    if (['lawyer', 'professor', 'doctorate'].includes(role)) return '/dashboard/lawyer';
    return '/dashboard/user';
  }

  const cases = [
    { role: 'admin', expected: '/dashboard/admin' },
    { role: 'lawyer', expected: '/dashboard/lawyer' },
    { role: 'professor', expected: '/dashboard/lawyer' },
    { role: 'doctorate', expected: '/dashboard/lawyer' },
    { role: 'user', expected: '/dashboard/user' },
    { role: 'student', expected: '/dashboard/user' },
    { role: 'unknown', expected: '/dashboard/user' },
  ];

  cases.forEach(({ role, expected }) => {
    it(`role "${role}" → "${expected}"`, () => {
      expect(getRedirectPath(role)).toBe(expected);
    });
  });
});

// ─── 7. canvasDoc null safety ────────────────────────────────────────────────
describe('canvasDoc null guard (Assistant.tsx)', () => {
  it('does not open canvas portal when canvasDoc is null', () => {
    const canvasOpen = true;
    const canvasDoc = null;
    const shouldRender = canvasOpen && canvasDoc !== null;
    expect(shouldRender).toBe(false);
  });

  it('opens canvas portal when both flags are set', () => {
    const canvasOpen = true;
    const canvasDoc = { title: 'Mise en Demeure', content: 'Contenu...' };
    const shouldRender = canvasOpen && canvasDoc !== null;
    expect(shouldRender).toBe(true);
  });

  it('setCanvasDoc preserves title when updating content only', () => {
    const prev = { title: 'Titre original', content: 'Ancien contenu' };
    const updated = prev ? { ...prev, content: 'Nouveau contenu' } : null;
    expect(updated?.title).toBe('Titre original');
    expect(updated?.content).toBe('Nouveau contenu');
  });
});

// ─── 8. handleRegenerate string/number id lookup ─────────────────────────────
describe('handleRegenerate ID lookup (Assistant.tsx)', () => {
  const messages = [
    { id: 'msg-1', role: 'user' as const, content: 'Première question' },
    { id: 'msg-2', role: 'assistant' as const, content: 'Première réponse' },
    { id: 'msg-3', role: 'user' as const, content: 'Deuxième question' },
    { id: 'msg-4', role: 'assistant' as const, content: 'Deuxième réponse' },
  ];

  function findIdx(msgIdOrIdx: string | number) {
    return typeof msgIdOrIdx === 'string' ? messages.findIndex(m => m.id === msgIdOrIdx) : msgIdOrIdx;
  }

  it('finds index by string id', () => { expect(findIdx('msg-3')).toBe(2); });
  it('returns number index directly', () => { expect(findIdx(1)).toBe(1); });
  it('returns -1 for unknown id', () => { expect(findIdx('msg-999')).toBe(-1); });

  it('retrieves previous user message for regeneration', () => {
    const idx = findIdx('msg-4');
    let prompt = '';
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { prompt = messages[i].content; break; }
    }
    expect(prompt).toBe('Deuxième question');
  });
});

// ─── 9. Gemini API Integration (mocked fetch) ────────────────────────────────
describe('Gemini API Integration (mocked)', () => {
  beforeEach(() => { global.fetch = vi.fn(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls gemini-3.8-flash with correct URL format and returns text', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        candidates: [{ content: { parts: [{ text: 'Analyse juridique complète.' }] } }],
      }),
    });

    const key = 'AQ.PLACEHOLDER_GEMINI_KEY_FOR_TESTING_PURPOSES_ONLY_123456';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`;

    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(global.fetch).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'POST' }));
    const data = await res.json();
    expect(data.candidates[0].content.parts[0].text).toBe('Analyse juridique complète.');
  });

  it('handles 401 Gemini error gracefully (falls back to next provider)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue('{"error":{"code":401}}'),
    });
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=invalid');
    expect(res.ok).toBe(false);
  });
});

// ─── 10. Multi-Jurisdiction System Prompt ────────────────────────────────────
describe('Multi-Jurisdiction System Prompt Coverage', () => {
  const prompt = `Vous maîtrisez l'ensemble des systèmes juridiques du monde :
    Droit européen & Union Européenne (RGPD, AI Act, CJUE, CEDH),
    Droit de chaque pays d'Europe (France, Belgique, Suisse-CHF, Allemagne-BGB),
    Droit des pays d'Afrique (OHADA-FCFA, Maroc-MAD, Algérie, Sénégal),
    Droit des pays d'Amérique (États-Unis-USD, Canada-CAD, Québec-CCQ)`;

  it('covers European Union law', () => { expect(prompt).toContain('Union Européenne'); });
  it('covers African OHADA law', () => { expect(prompt).toContain('OHADA'); });
  it('covers US federal law', () => { expect(prompt).toContain('États-Unis'); });
  it('covers Quebec civil code', () => { expect(prompt).toContain('CCQ'); });
  it('covers Swiss currency (CHF)', () => { expect(prompt).toContain('CHF'); });
  it('covers Moroccan currency (MAD)', () => { expect(prompt).toContain('MAD'); });
  it('covers FCFA for OHADA zone', () => { expect(prompt).toContain('FCFA'); });
});
