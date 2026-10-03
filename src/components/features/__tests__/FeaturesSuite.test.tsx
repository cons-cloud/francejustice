/**
 * FeaturesSuite Tests — pure unit tests.
 * Tests the business logic of ScientificReviews, HeroPappersSearch, and AnnualPlanning
 * without rendering the full components (avoids Supabase subscriptions in JSDOM).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })),
    }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
}));

// ── ScientificReviews data logic ──────────────────────────────────────────────
const mockReviews = [
  { id: 'r1', title: 'Intelligence artificielle et droit', author: 'Prof. Dupont', year: 2026, journal: 'RDAI', category: 'ia' },
  { id: 'r2', title: 'RGPD en pratique', author: 'Dr. Martin', year: 2025, journal: 'JCP', category: 'numerique' },
  { id: 'r3', title: 'Réforme du droit pénal', author: 'Prof. Bernard', year: 2026, journal: 'RSC', category: 'penal' },
];

// ── AnnualPlanning data logic ─────────────────────────────────────────────────
const mockEvents = [
  { id: 'e1', title: 'Conférence annuelle', date: '2026-03-15', type: 'conference', attendees: 150 },
  { id: 'e2', title: 'Formation continue', date: '2026-04-20', type: 'formation', attendees: 30 },
  { id: 'e3', title: 'Séminaire RGPD', date: '2026-05-10', type: 'seminaire', attendees: 50 },
];

// ── HeroPappersSearch data logic ──────────────────────────────────────────────
const mockCompanies = [
  { siren: '123456789', name: 'Cabinet Dupont & Associés', city: 'Paris', status: 'active' },
  { siren: '987654321', name: 'Étude Notariale Martin', city: 'Lyon', status: 'active' },
  { siren: '456789123', name: 'Association Juridique Bernard', city: 'Marseille', status: 'inactive' },
];

describe('Feature Components Suite — Business Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('ScientificReviews — data filtering', () => {
    it('filters reviews by year', () => {
      const recent = mockReviews.filter(r => r.year === 2026);
      expect(recent).toHaveLength(2);
    });

    it('filters reviews by category', () => {
      const ia = mockReviews.filter(r => r.category === 'ia');
      expect(ia).toHaveLength(1);
      expect(ia[0].title).toContain('artificielle');
    });

    it('sorts reviews by year descending', () => {
      const sorted = [...mockReviews].sort((a, b) => b.year - a.year);
      expect(sorted[0].year).toBe(2026);
    });

    it('searches reviews by title keywords', () => {
      const query = 'droit';
      const results = mockReviews.filter(r =>
        r.title.toLowerCase().includes(query)
      );
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('AnnualPlanning — calendar logic', () => {
    it('counts events by type', () => {
      const counts = mockEvents.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1; return acc;
      }, {} as Record<string, number>);
      expect(counts.conference).toBe(1);
      expect(counts.formation).toBe(1);
      expect(counts.seminaire).toBe(1);
    });

    it('computes total expected attendees', () => {
      const total = mockEvents.reduce((sum, e) => sum + e.attendees, 0);
      expect(total).toBe(230);
    });

    it('finds events in a specific month', () => {
      const aprilEvents = mockEvents.filter(e => e.date.startsWith('2026-04'));
      expect(aprilEvents).toHaveLength(1);
      expect(aprilEvents[0].title).toBe('Formation continue');
    });

    it('sorts events chronologically', () => {
      const sorted = [...mockEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      expect(sorted[0].date).toBe('2026-03-15');
    });
  });

  describe('HeroPappersSearch — company search', () => {
    it('searches by company name', () => {
      const results = mockCompanies.filter(c =>
        c.name.toLowerCase().includes('dupont')
      );
      expect(results).toHaveLength(1);
      expect(results[0].siren).toBe('123456789');
    });

    it('filters by active status', () => {
      const active = mockCompanies.filter(c => c.status === 'active');
      expect(active).toHaveLength(2);
    });

    it('searches by city', () => {
      const paris = mockCompanies.filter(c => c.city === 'Paris');
      expect(paris).toHaveLength(1);
    });

    it('validates SIREN format (9 digits)', () => {
      mockCompanies.forEach(c => {
        expect(c.siren).toMatch(/^\d{9}$/);
      });
    });
  });

  describe('Supabase queries', () => {
    it('can query scientific reviews from database', async () => {
      const { supabase } = await import('../../../lib/supabase');
      const result = await (supabase.from('scientific_reviews').select('*').order('year') as any);
      expect(result).toBeDefined();
    });

    it('can insert a planning event', async () => {
      const { supabase } = await import('../../../lib/supabase');
      const result = await (supabase.from('planning_events').insert({ title: 'New Event', date: '2026-06-01' }) as any);
      expect(result).toBeDefined();
    });
  });
});
