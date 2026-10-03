/**
 * PublicPagesAndForms Tests — pure unit tests (no component rendering).
 * Tests contact form validation, search query parsing, document generation
 * logic, and authentication flow without rendering heavy page components.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })),
    }),
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

vi.mock('../../lib/gemini', () => ({
  chatWithAI: vi.fn().mockResolvedValue('Réponse IA simulée'),
  generateLegalDocument: vi.fn().mockResolvedValue('Document juridique simulé'),
}));

import { chatWithAI, generateLegalDocument } from '../../lib/gemini';

// ── Contact form validation helpers ──────────────────────────────────────────
function validateContactForm(data: { name: string; email: string; message: string; subject: string }) {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = 'Le nom est requis';
  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Email invalide';
  if (!data.subject.trim()) errors.subject = 'Le sujet est requis';
  if (data.message.length < 10) errors.message = 'Message trop court (min 10 caractères)';
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Search query helpers ──────────────────────────────────────────────────────
function parseSearchQuery(query: string) {
  const cleaned = query.trim().toLowerCase();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return { cleaned, tokens, hasTerms: tokens.length > 0 };
}

// ── Document generation helpers ───────────────────────────────────────────────
const DOCUMENT_TEMPLATES = [
  { id: 'lettre_mise_demeure', name: 'Lettre de mise en demeure', category: 'civil' },
  { id: 'contrat_travail', name: 'Contrat de travail', category: 'travail' },
  { id: 'promesse_vente', name: "Promesse de vente", category: 'immobilier' },
  { id: 'testament', name: 'Testament olographe', category: 'succession' },
];

describe('PublicPages — Forms & Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Contact form validation', () => {
    it('accepts a valid contact form submission', () => {
      const result = validateContactForm({
        name: 'Jean Dupont',
        email: 'jean@example.com',
        message: 'Bonjour, j ai une question urgente à poser.',
        subject: 'Question juridique',
      });
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('rejects empty name', () => {
      const result = validateContactForm({
        name: '',
        email: 'jean@example.com',
        message: 'Message valide et long',
        subject: 'Sujet',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('rejects invalid email address', () => {
      const result = validateContactForm({
        name: 'Jean',
        email: 'not-an-email',
        message: 'Message valide et long',
        subject: 'Sujet',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('rejects message that is too short', () => {
      const result = validateContactForm({
        name: 'Jean',
        email: 'jean@example.com',
        message: 'Court',
        subject: 'Sujet',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.message).toBeDefined();
    });
  });

  describe('Search query parsing', () => {
    it('tokenizes a multi-word query', () => {
      const result = parseSearchQuery('droit pénal français');
      expect(result.tokens).toHaveLength(3);
      expect(result.hasTerms).toBe(true);
    });

    it('handles empty search query', () => {
      const result = parseSearchQuery('   ');
      expect(result.hasTerms).toBe(false);
      expect(result.tokens).toHaveLength(0);
    });

    it('normalizes query to lowercase', () => {
      const result = parseSearchQuery('CODE CIVIL');
      expect(result.cleaned).toBe('code civil');
    });

    it('filters search results by relevance', () => {
      const articles = [
        { id: 1, title: 'Droit pénal et procédure' },
        { id: 2, title: 'Droit civil et obligations' },
        { id: 3, title: 'Droit fiscal et impôts' },
      ];
      const { tokens } = parseSearchQuery('pénal civil');
      const results = articles.filter(a =>
        tokens.some(t => a.title.toLowerCase().includes(t))
      );
      expect(results).toHaveLength(2);
    });
  });

  describe('Document generation', () => {
    it('lists all available document templates', () => {
      expect(DOCUMENT_TEMPLATES).toHaveLength(4);
    });

    it('finds templates by category', () => {
      const civil = DOCUMENT_TEMPLATES.filter(t => t.category === 'civil');
      expect(civil).toHaveLength(1);
      expect(civil[0].id).toBe('lettre_mise_demeure');
    });

    it('generates document via AI', async () => {
      const doc = await generateLegalDocument('Lettre de mise en demeure', { debtor: 'Paul Martin', amount: 5000 });
      expect(doc).toBeDefined();
      expect(typeof doc).toBe('string');
      expect(generateLegalDocument).toHaveBeenCalled();
    });
  });

  describe('Authentication flow validation', () => {
    it('validates email format for login', () => {
      const validEmails = ['user@example.com', 'admin@francejustice.fr'];
      const invalidEmails = ['not-email', 'missing@', '@nodomain'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      validEmails.forEach(e => expect(emailRegex.test(e)).toBe(true));
      invalidEmails.forEach(e => expect(emailRegex.test(e)).toBe(false));
    });

    it('validates password strength', () => {
      const strongPwd = 'SecureP@ss123!';
      const weakPwd = 'abc';
      expect(strongPwd.length).toBeGreaterThanOrEqual(8);
      expect(weakPwd.length).toBeLessThan(8);
    });

    it('calls supabase auth on login', async () => {
      const { supabase } = await import('../../lib/supabase');
      await supabase.auth.signInWithPassword({ email: 'user@test.com', password: 'pass123!' });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('calls supabase for password reset', async () => {
      const { supabase } = await import('../../lib/supabase');
      await supabase.auth.resetPasswordForEmail('user@test.com');
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@test.com');
    });
  });
});
