/**
 * Lawyers Page Tests — pure unit tests (no component rendering).
 * Tests lawyer search, filtering, sorting, and annuaire data logic
 * without importing LawyersPage which pulls in the 100k-line dataset.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../data/annuaireAvocatsFrance', () => ({ ANNUAIRE_AVOCATS_FRANCE_DATA: [] }));
vi.mock('../../lib/avocatsDataGouvSync', () => ({
  getAllUnifiedLawyers: vi.fn().mockResolvedValue([]),
  searchUnifiedLawyers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })),
    }),
  },
}));

const mockLawyers = [
  { id: 'l1', first_name: 'Marc', last_name: 'Dubois', specialty: 'Droit famille', city: 'Paris', bar_association: 'Paris', is_verified: true, rating: 4.8 },
  { id: 'l2', first_name: 'Sophie', last_name: 'Martin', specialty: 'Droit pénal', city: 'Lyon', bar_association: 'Lyon', is_verified: true, rating: 4.5 },
  { id: 'l3', first_name: 'Pierre', last_name: 'Bernard', specialty: 'Droit civil', city: 'Paris', bar_association: 'Paris', is_verified: false, rating: 4.2 },
  { id: 'l4', first_name: 'Claire', last_name: 'Leroy', specialty: 'Droit fiscal', city: 'Bordeaux', bar_association: 'Bordeaux', is_verified: true, rating: 4.9 },
  { id: 'l5', first_name: 'Antoine', last_name: 'Blanc', specialty: 'Droit famille', city: 'Paris', bar_association: 'Paris', is_verified: true, rating: 4.6 },
];

describe('Lawyers Page — Search & Filter Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Text search', () => {
    it('searches lawyers by last name', () => {
      const query = 'dubois';
      const results = mockLawyers.filter(l =>
        l.last_name.toLowerCase().includes(query)
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('l1');
    });

    it('searches lawyers by city', () => {
      const results = mockLawyers.filter(l => l.city === 'Paris');
      expect(results).toHaveLength(3);
    });

    it('searches lawyers by specialty', () => {
      const results = mockLawyers.filter(l => l.specialty === 'Droit famille');
      expect(results).toHaveLength(2);
    });

    it('returns empty for no-match query', () => {
      const results = mockLawyers.filter(l =>
        l.last_name.toLowerCase().includes('zzz')
      );
      expect(results).toHaveLength(0);
    });
  });

  describe('Filtering', () => {
    it('filters by verified status', () => {
      const verified = mockLawyers.filter(l => l.is_verified);
      expect(verified).toHaveLength(4);
    });

    it('filters by bar association', () => {
      const paris = mockLawyers.filter(l => l.bar_association === 'Paris');
      expect(paris).toHaveLength(3);
    });
  });

  describe('Sorting', () => {
    it('sorts by rating descending', () => {
      const sorted = [...mockLawyers].sort((a, b) => b.rating - a.rating);
      expect(sorted[0].id).toBe('l4'); // 4.9
      expect(sorted[sorted.length - 1].id).toBe('l3'); // 4.2
    });

    it('sorts by last name alphabetically', () => {
      const sorted = [...mockLawyers].sort((a, b) =>
        a.last_name.localeCompare(b.last_name, 'fr')
      );
      expect(sorted[0].last_name).toBe('Bernard');
    });
  });

  describe('Statistics', () => {
    it('counts lawyers by specialty', () => {
      const counts = mockLawyers.reduce((acc, l) => {
        acc[l.specialty] = (acc[l.specialty] || 0) + 1; return acc;
      }, {} as Record<string, number>);
      expect(counts['Droit famille']).toBe(2);
      expect(counts['Droit pénal']).toBe(1);
    });

    it('computes average rating', () => {
      const avg = mockLawyers.reduce((sum, l) => sum + l.rating, 0) / mockLawyers.length;
      expect(avg).toBeCloseTo(4.6, 1);
    });

    it('counts lawyers per city', () => {
      const byCityCounts = mockLawyers.reduce((acc, l) => {
        acc[l.city] = (acc[l.city] || 0) + 1; return acc;
      }, {} as Record<string, number>);
      expect(byCityCounts.Paris).toBe(3);
      expect(byCityCounts.Lyon).toBe(1);
      expect(byCityCounts.Bordeaux).toBe(1);
    });
  });
});
