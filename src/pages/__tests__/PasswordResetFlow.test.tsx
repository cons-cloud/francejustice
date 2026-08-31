import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import ForgotPasswordPage from '../ForgotPassword';
import ResetPasswordPage from '../ResetPassword';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn(),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  };
});

describe('Password Reset Flow & Admin Restriction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ForgotPasswordPage', () => {
    it('renders email input and submit button', () => {
      render(React.createElement(ForgotPasswordPage, {}));
      expect(screen.getByPlaceholderText(/nom@exemple.com/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Envoyer le lien/i })).toBeInTheDocument();
    });

    it('BLOCKS password reset if user is an ADMIN', async () => {
      // Mock Supabase profile returning role: 'admin'
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: { role: 'admin', first_name: 'Admin', last_name: 'User' },
      });
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: maybeSingleMock,
          }),
        }),
      });

      render(React.createElement(ForgotPasswordPage, {}));

      const emailInput = screen.getByPlaceholderText(/nom@exemple.com/i);
      fireEvent.change(emailInput, { target: { value: 'admin@francejustice.com' } });

      const submitBtn = screen.getByRole('button', { name: /Envoyer le lien/i });

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(screen.getByText(/Les comptes administrateurs ne peuvent pas réinitialiser leur mot de passe/i)).toBeInTheDocument();
      expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('ALLOWS password reset email sending for non-admin roles (e.g. Student / Lawyer / Citizen)', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: { role: 'student', first_name: 'Alex', last_name: 'Dupont' },
      });
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: maybeSingleMock,
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      });
      (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });

      render(React.createElement(ForgotPasswordPage, {}));

      const emailInput = screen.getByPlaceholderText(/nom@exemple.com/i);
      fireEvent.change(emailInput, { target: { value: 'etudiant@univ-paris.fr' } });

      const submitBtn = screen.getByRole('button', { name: /Envoyer le lien/i });

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'etudiant@univ-paris.fr',
        expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
      );
      expect(screen.getByText(/Un e-mail d'instructions de réinitialisation sécurisé a été envoyé/i)).toBeInTheDocument();
    });
  });

  describe('ResetPasswordPage', () => {
    it('shows session checking when auth session is initializing', async () => {
      await act(async () => {
        render(React.createElement(ResetPasswordPage, {}));
      });
      expect(screen.getByText(/Vérification du lien/i)).toBeInTheDocument();
    });
  });
});
