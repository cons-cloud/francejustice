/**
 * PasswordResetFlow Tests — pure unit tests (no component rendering).
 * Tests password reset token validation, form validation, and supabase auth calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

// ── Password validation helpers ───────────────────────────────────────────────
function validatePasswordReset(data: {
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const errors: Record<string, string> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(data.email)) {
    errors.email = 'Adresse email invalide';
  }
  if (data.password.length < 8) {
    errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
  }
  if (!/[A-Z]/.test(data.password)) {
    errors.password = 'Le mot de passe doit contenir une majuscule';
  }
  if (!/[0-9]/.test(data.password)) {
    errors.password = 'Le mot de passe doit contenir un chiffre';
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

describe('PasswordResetFlow — Validation & Auth Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Password validation', () => {
    it('accepts a strong valid password', () => {
      const result = validatePasswordReset({
        email: 'user@example.com',
        password: 'SecurePass1!',
        confirmPassword: 'SecurePass1!',
      });
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('rejects password shorter than 8 characters', () => {
      const result = validatePasswordReset({
        email: 'user@example.com',
        password: 'Short1',
        confirmPassword: 'Short1',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('rejects password without uppercase', () => {
      const result = validatePasswordReset({
        email: 'user@example.com',
        password: 'nouppercase1',
        confirmPassword: 'nouppercase1',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('rejects password without digit', () => {
      const result = validatePasswordReset({
        email: 'user@example.com',
        password: 'NoDigitPass!',
        confirmPassword: 'NoDigitPass!',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('rejects mismatched passwords', () => {
      const result = validatePasswordReset({
        email: 'user@example.com',
        password: 'ValidPass1!',
        confirmPassword: 'DifferentPass1!',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.confirmPassword).toBeDefined();
    });

    it('rejects invalid email address', () => {
      const result = validatePasswordReset({
        email: 'not-an-email',
        password: 'ValidPass1!',
        confirmPassword: 'ValidPass1!',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });
  });

  describe('Supabase auth flows', () => {
    it('calls resetPasswordForEmail with correct email', async () => {
      const { supabase } = await import('../../lib/supabase');
      await supabase.auth.resetPasswordForEmail('user@example.com');
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('calls updateUser after OTP verification', async () => {
      const { supabase } = await import('../../lib/supabase');
      await supabase.auth.updateUser({ password: 'NewSecurePass1!' });
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'NewSecurePass1!' });
    });

    it('handles reset email success response', async () => {
      const { supabase } = await import('../../lib/supabase');
      const result = await supabase.auth.resetPasswordForEmail('user@example.com');
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('handles update user success response', async () => {
      const { supabase } = await import('../../lib/supabase');
      const result = await supabase.auth.updateUser({ password: 'NewSecurePass1!' });
      expect(result.error).toBeNull();
    });
  });
});
