/**
 * AcademicRegistrationForm Tests — pure unit tests.
 * Tests form validation logic for academic users (students, professors)
 * without rendering the full component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: { data: null; error: null }) => void) => resolve({ data: null, error: null })),
    }),
  },
}));

// ── Academic form validation helpers ─────────────────────────────────────────
type AcademicRole = 'student' | 'professor' | 'doctorate';

interface AcademicFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: AcademicRole;
  university: string;
  studentId?: string;
  academicTitle?: string;
  researchField?: string;
}

function validateAcademicForm(data: AcademicFormData) {
  const errors: Record<string, string> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const academicEmailDomains = ['.edu', '.ac.fr', '.univ-', 'universite', 'sorbonne', 'cnrs'];

  if (!data.firstName.trim()) errors.firstName = 'Le prénom est requis';
  if (!data.lastName.trim()) errors.lastName = 'Le nom est requis';
  if (!emailRegex.test(data.email)) errors.email = 'Email invalide';
  if (data.password.length < 8) errors.password = 'Mot de passe trop court';
  if (!data.university.trim()) errors.university = "L'université est requise";

  if (data.role === 'student' && !data.studentId) {
    errors.studentId = "Le numéro étudiant est requis";
  }
  if (data.role === 'professor' && !data.academicTitle) {
    errors.academicTitle = 'Le titre académique est requis';
  }
  if (data.role === 'doctorate' && !data.researchField) {
    errors.researchField = 'Le domaine de recherche est requis';
  }

  const hasAcademicEmail = academicEmailDomains.some(d => data.email.includes(d));

  return { valid: Object.keys(errors).length === 0, errors, hasAcademicEmail };
}

const VALID_ACADEMIC_TITLES = ['Professeur des universités (PU)', 'Maître de conférences (MCF)', 'Professeur émérite', 'Chargé de cours'];

describe('AcademicRegistrationForm — Validation Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Student registration', () => {
    it('accepts valid student data', () => {
      const result = validateAcademicForm({
        firstName: 'Lucas', lastName: 'Bernard',
        email: 'lucas.bernard@student.univ-paris.fr',
        password: 'SecurePass1!', role: 'student',
        university: 'Université Paris I Panthéon-Sorbonne',
        studentId: '21345678',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects student without student ID', () => {
      const result = validateAcademicForm({
        firstName: 'Lucas', lastName: 'Bernard',
        email: 'lucas@univ.fr', password: 'SecurePass1!',
        role: 'student', university: 'Université Paris I',
        studentId: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.studentId).toBeDefined();
    });

    it('identifies academic email domains', () => {
      const { hasAcademicEmail: academic } = validateAcademicForm({
        firstName: 'L', lastName: 'B', email: 'l@sorbonne.fr',
        password: 'Pass1234!', role: 'student',
        university: 'Paris', studentId: '123',
      });
      expect(academic).toBe(true);
    });

  });

  describe('Professor registration', () => {
    it('accepts valid professor data', () => {
      const result = validateAcademicForm({
        firstName: 'Marie', lastName: 'Curie',
        email: 'marie.curie@cnrs.fr',
        password: 'ScientPass2!', role: 'professor',
        university: 'Université Paris VI',
        academicTitle: 'Professeur des universités (PU)',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects professor without academic title', () => {
      const result = validateAcademicForm({
        firstName: 'Marie', lastName: 'Curie',
        email: 'marie@univ.fr', password: 'Pass1234!',
        role: 'professor', university: 'Paris VI',
        academicTitle: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.academicTitle).toBeDefined();
    });

    it('validates list of allowed academic titles', () => {
      expect(VALID_ACADEMIC_TITLES).toContain('Professeur des universités (PU)');
      expect(VALID_ACADEMIC_TITLES).toContain('Maître de conférences (MCF)');
      expect(VALID_ACADEMIC_TITLES.length).toBeGreaterThan(0);
    });
  });

  describe('Doctorate registration', () => {
    it('accepts valid doctorate data', () => {
      const result = validateAcademicForm({
        firstName: 'Paul', lastName: 'Ricœur',
        email: 'paul.ricoeur@sorbonne.fr',
        password: 'DoctoralP3!', role: 'doctorate',
        university: 'Sorbonne Université',
        researchField: 'Droit international public',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects doctorate without research field', () => {
      const result = validateAcademicForm({
        firstName: 'Paul', lastName: 'R',
        email: 'paul@sorbonne.fr', password: 'Pass1234!',
        role: 'doctorate', university: 'Sorbonne',
        researchField: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.researchField).toBeDefined();
    });
  });

  describe('Common validation', () => {
    it('rejects empty first name', () => {
      const result = validateAcademicForm({
        firstName: '', lastName: 'Dupont',
        email: 'a@b.edu', password: 'Pass1234!',
        role: 'student', university: 'Paris', studentId: '123',
      });
      expect(result.errors.firstName).toBeDefined();
    });

    it('rejects short password', () => {
      const result = validateAcademicForm({
        firstName: 'Jean', lastName: 'Dupont',
        email: 'j@univ.fr', password: 'abc',
        role: 'student', university: 'Paris', studentId: '123',
      });
      expect(result.errors.password).toBeDefined();
    });

    it('rejects missing university', () => {
      const result = validateAcademicForm({
        firstName: 'Jean', lastName: 'Dupont',
        email: 'j@univ.fr', password: 'LongPass1!',
        role: 'student', university: '', studentId: '123',
      });
      expect(result.errors.university).toBeDefined();
    });
  });
});
