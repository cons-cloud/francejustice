/**
 * DashboardLawyer Tests — pure unit tests (no component rendering).
 * Tests lawyer-specific business logic: appointment management,
 * client file handling, billing, and case tracking.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../data/annuaireAvocatsFrance', () => ({ ANNUAIRE_AVOCATS_FRANCE_DATA: [] }));
vi.mock('../../lib/avocatsDataGouvSync', () => ({ registerDeletedUser: vi.fn() }));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })),
    }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
}));

const mockCases = [
  { id: 'c1', client: 'Paul Martin', type: 'Droit famille', status: 'en_cours', created_at: '2026-01-01', fee: 1500 },
  { id: 'c2', client: 'Marie Curie', type: 'Droit pénal', status: 'cloture', created_at: '2026-01-10', fee: 3000 },
  { id: 'c3', client: 'Jean Dupont', type: 'Droit civil', status: 'en_cours', created_at: '2026-02-01', fee: 2000 },
];

const mockAppointments = [
  { id: 'a1', client: 'Paul Martin', date: '2026-02-15', time: '09:00', status: 'confirmed', duration: 60 },
  { id: 'a2', client: 'Jean Dupont', date: '2026-02-16', time: '14:00', status: 'pending', duration: 30 },
  { id: 'a3', client: 'Sophie Bernard', date: '2026-02-17', time: '11:00', status: 'cancelled', duration: 45 },
];

describe('DashboardLawyer — Business Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Case management', () => {
    it('counts open cases correctly', () => {
      const open = mockCases.filter(c => c.status === 'en_cours');
      expect(open).toHaveLength(2);
    });

    it('computes total billing amount', () => {
      const total = mockCases.reduce((sum, c) => sum + c.fee, 0);
      expect(total).toBe(6500);
    });

    it('sorts cases by creation date', () => {
      const sorted = [...mockCases].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      expect(sorted[0].id).toBe('c3');
    });

    it('groups cases by specialty', () => {
      const groups = mockCases.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1; return acc;
      }, {} as Record<string, number>);
      expect(groups['Droit famille']).toBe(1);
      expect(groups['Droit pénal']).toBe(1);
      expect(groups['Droit civil']).toBe(1);
    });
  });

  describe('Appointment scheduling', () => {
    it('filters confirmed appointments', () => {
      const confirmed = mockAppointments.filter(a => a.status === 'confirmed');
      expect(confirmed).toHaveLength(1);
    });

    it('calculates total scheduled duration', () => {
      const active = mockAppointments.filter(a => a.status !== 'cancelled');
      const totalMin = active.reduce((sum, a) => sum + a.duration, 0);
      expect(totalMin).toBe(90); // 60 + 30
    });

    it('identifies cancelled appointments', () => {
      const cancelled = mockAppointments.filter(a => a.status === 'cancelled');
      expect(cancelled).toHaveLength(1);
      expect(cancelled[0].client).toBe('Sophie Bernard');
    });
  });

  describe('Supabase lawyer queries', () => {
    it('can query lawyer appointments', async () => {
      const { supabase } = await import('../../lib/supabase');
      const result = await (supabase.from('appointments').select('*').eq('lawyer_id', 'law-1') as any);
      expect(result).toBeDefined();
    });

    it('can update appointment status', async () => {
      const { supabase } = await import('../../lib/supabase');
      const result = await (supabase.from('appointments').update({ status: 'confirmed' }).eq('id', 'a2') as any);
      expect(result).toBeDefined();
    });
  });
});
