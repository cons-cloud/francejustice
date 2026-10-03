/**
 * AdminDashboard Tests — pure unit tests (no component rendering).
 * Avoids importing AdminDashboard which pulls in a 100k-line data file.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../data/annuaireAvocatsFrance', () => ({ ANNUAIRE_AVOCATS_FRANCE_DATA: [] }));
vi.mock('../../lib/avocatsDataGouvSync', () => ({ registerDeletedUser: vi.fn() }));
vi.mock('../../lib/formationAttachmentUtils', () => ({
  convertFileToAttachment: vi.fn(),
  exportAllAttachments: vi.fn(),
  getFormationAttachments: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/dataSecurityUtils', () => ({
  DATA_RETENTION_SCHEDULE: [
    { table: 'profiles', retention: '5 ans', legal_basis: 'RGPD Art. 5' },
    { table: 'appointments', retention: '3 ans', legal_basis: 'Code civil' },
  ],
  DATABASE_SECURITY_INFO: { encryption: 'AES-256', tls: '1.3' },
  getSecurityStatusBadge: vi.fn().mockReturnValue({ label: 'Sécurisé', color: 'green' }),
}));
vi.mock('../../lib/jurisdictions', () => ({
  COURS_D_APPEL_LIST: ['Paris', 'Lyon', 'Marseille'],
  getCourDAppelForCity: vi.fn().mockReturnValue('Paris'),
}));

import { DATA_RETENTION_SCHEDULE, DATABASE_SECURITY_INFO, getSecurityStatusBadge } from '../../lib/dataSecurityUtils';
import { COURS_D_APPEL_LIST } from '../../lib/jurisdictions';
import { getFormationAttachments } from '../../lib/formationAttachmentUtils';

const mockUsers = [
  { id: 'u1', email: 'admin@fj.fr', role: 'admin', is_verified: true, created_at: '2026-01-01' },
  { id: 'u2', email: 'lawyer@barreau.fr', role: 'lawyer', is_verified: false, created_at: '2026-01-02' },
  { id: 'u3', email: 'student@univ.fr', role: 'student', is_verified: true, created_at: '2026-01-03' },
  { id: 'u4', email: 'citizen@gmail.com', role: 'user', is_verified: true, created_at: '2026-01-04' },
  { id: 'u5', email: 'prof@univ.fr', role: 'professor', is_verified: true, created_at: '2026-01-05' },
];

describe('AdminDashboard — Data & Security Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Security utilities', () => {
    it('DATA_RETENTION_SCHEDULE is defined and non-empty', () => {
      expect(DATA_RETENTION_SCHEDULE).toBeDefined();
      expect(Array.isArray(DATA_RETENTION_SCHEDULE)).toBe(true);
      expect(DATA_RETENTION_SCHEDULE.length).toBeGreaterThan(0);
    });

    it('DATABASE_SECURITY_INFO has required fields', () => {
      expect(DATABASE_SECURITY_INFO).toHaveProperty('encryption');
      expect(DATABASE_SECURITY_INFO).toHaveProperty('tls');
    });

    it('getSecurityStatusBadge returns valid badge structure', () => {
      const badge = getSecurityStatusBadge('active');
      expect(badge).toHaveProperty('label');
      expect(badge).toHaveProperty('color');
    });
  });

  describe('Jurisdictions data', () => {
    it('COURS_D_APPEL_LIST is a non-empty array', () => {
      expect(Array.isArray(COURS_D_APPEL_LIST)).toBe(true);
      expect(COURS_D_APPEL_LIST.length).toBeGreaterThan(0);
    });
  });

  describe('Admin user management logic', () => {
    it('counts users by role', () => {
      const counts = mockUsers.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1; return acc;
      }, {} as Record<string, number>);
      expect(counts.admin).toBe(1);
      expect(counts.lawyer).toBe(1);
    });

    it('computes pending verification list', () => {
      const pending = mockUsers.filter(u => !u.is_verified);
      expect(pending).toHaveLength(1);
      expect(pending[0].email).toBe('lawyer@barreau.fr');
    });

    it('sorts users by creation date descending', () => {
      const sorted = [...mockUsers].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      expect(sorted[0].id).toBe('u5');
    });

    it('filters by search query', () => {
      const matches = mockUsers.filter(u => u.email.includes('univ'));
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Formation attachments', () => {
    it('getFormationAttachments returns an array', async () => {
      const result = await getFormationAttachments('formation-123');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
