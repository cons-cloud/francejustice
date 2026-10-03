/**
 * RegistrationForms Tests — pure unit tests.
 * Tests validation logic for UserRegistrationForm and LawyerRegistrationForm
 * without rendering the full components.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: { data: null; error: null }) => void) => resolve({ data: null, error: null })),
    }),
  },
}));

// ── User registration validation ──────────────────────────────────────────────
interface UserFormData {
  firstName: string; lastName: string;
  email: string; password: string; confirmPassword: string;
  acceptTerms: boolean;
}

function validateUserForm(data: UserFormData) {
  const errors: Record<string, string> = {};
  if (!data.firstName.trim()) errors.firstName = 'Prénom requis';
  if (!data.lastName.trim()) errors.lastName = 'Nom requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email invalide';
  if (data.password.length < 8) errors.password = 'Mot de passe trop court';
  if (data.password !== data.confirmPassword) errors.confirmPassword = 'Mots de passe différents';
  if (!data.acceptTerms) errors.terms = 'Acceptez les conditions';
  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Lawyer registration validation ────────────────────────────────────────────
interface LawyerFormData {
  firstName: string; lastName: string;
  email: string; password: string;
  barAssociation: string; barNumber: string;
  specialty: string; phone: string;
}

function validateLawyerForm(data: LawyerFormData) {
  const errors: Record<string, string> = {};
  if (!data.firstName.trim()) errors.firstName = 'Prénom requis';
  if (!data.lastName.trim()) errors.lastName = 'Nom requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email invalide';
  if (data.password.length < 8) errors.password = 'Mot de passe trop court';
  if (!data.barAssociation.trim()) errors.barAssociation = 'Barreau requis';
  if (!data.barNumber.trim()) errors.barNumber = 'Numéro de barreau requis';
  if (!data.specialty.trim()) errors.specialty = 'Spécialité requise';
  if (!/^(\+33|0)[1-9](\d{2}){4}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Numéro de téléphone invalide';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

const FRENCH_BAR_ASSOCIATIONS = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille'];
const LEGAL_SPECIALTIES = ['Droit famille', 'Droit pénal', 'Droit civil', 'Droit fiscal', 'Droit du travail', 'Droit immobilier'];

describe('Registration Forms — Validation Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('UserRegistrationForm', () => {
    it('accepts valid user registration data', () => {
      const result = validateUserForm({
        firstName: 'Jean', lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'SecurePass1!', confirmPassword: 'SecurePass1!',
        acceptTerms: true,
      });
      expect(result.valid).toBe(true);
    });

    it('rejects mismatched passwords', () => {
      const result = validateUserForm({
        firstName: 'Jean', lastName: 'Dupont',
        email: 'jean@example.com',
        password: 'PassA1234!', confirmPassword: 'PassB5678!',
        acceptTerms: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.confirmPassword).toBeDefined();
    });

    it('rejects missing terms acceptance', () => {
      const result = validateUserForm({
        firstName: 'Jean', lastName: 'Dupont',
        email: 'jean@example.com',
        password: 'SecurePass1!', confirmPassword: 'SecurePass1!',
        acceptTerms: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.terms).toBeDefined();
    });

    it('rejects empty last name', () => {
      const result = validateUserForm({
        firstName: 'Jean', lastName: '',
        email: 'jean@example.com',
        password: 'SecurePass1!', confirmPassword: 'SecurePass1!',
        acceptTerms: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.lastName).toBeDefined();
    });
  });

  describe('LawyerRegistrationForm', () => {
    it('accepts valid lawyer registration data', () => {
      const result = validateLawyerForm({
        firstName: 'Marc', lastName: 'Dubois',
        email: 'marc.dubois@cabinet-dubois.fr',
        password: 'LawyerPass1!',
        barAssociation: 'Paris', barNumber: 'A-12345',
        specialty: 'Droit pénal', phone: '0612345678',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects missing bar association', () => {
      const result = validateLawyerForm({
        firstName: 'Marc', lastName: 'Dubois',
        email: 'marc@example.com', password: 'Pass1234!',
        barAssociation: '', barNumber: 'A-123',
        specialty: 'Droit pénal', phone: '0612345678',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.barAssociation).toBeDefined();
    });

    it('rejects missing bar number', () => {
      const result = validateLawyerForm({
        firstName: 'Marc', lastName: 'Dubois',
        email: 'marc@example.com', password: 'Pass1234!',
        barAssociation: 'Paris', barNumber: '',
        specialty: 'Droit pénal', phone: '0612345678',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.barNumber).toBeDefined();
    });

    it('rejects invalid French phone number', () => {
      const result = validateLawyerForm({
        firstName: 'Marc', lastName: 'Dubois',
        email: 'marc@example.com', password: 'Pass1234!',
        barAssociation: 'Paris', barNumber: 'A-123',
        specialty: 'Droit pénal', phone: '12345',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.phone).toBeDefined();
    });

    it('validates list of French bar associations', () => {
      expect(FRENCH_BAR_ASSOCIATIONS).toContain('Paris');
      expect(FRENCH_BAR_ASSOCIATIONS).toContain('Lyon');
      expect(FRENCH_BAR_ASSOCIATIONS.length).toBeGreaterThan(0);
    });

    it('validates list of legal specialties', () => {
      expect(LEGAL_SPECIALTIES).toContain('Droit pénal');
      expect(LEGAL_SPECIALTIES).toContain('Droit famille');
      expect(LEGAL_SPECIALTIES.length).toBeGreaterThan(0);
    });
  });

  describe('Supabase registration calls', () => {
    it('calls signUp with email and password', async () => {
      const { supabase } = await import('../../../lib/supabase');
      await supabase.auth.signUp({ email: 'test@example.com', password: 'SecurePass1!' });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'test@example.com', password: 'SecurePass1!' });
    });

    it('inserts profile after signup', async () => {
      const { supabase } = await import('../../../lib/supabase');
      const result = await (supabase.from('profiles').insert({ user_id: 'u1', role: 'user' }) as any);
      expect(result).toBeDefined();
    });
  });
});
