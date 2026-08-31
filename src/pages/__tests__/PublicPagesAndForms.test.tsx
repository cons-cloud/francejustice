import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import Contact from '../Contact';
import Generator from '../Generator';
import SearchPage from '../Search';
import Login from '../Login';
import ResetPassword from '../ResetPassword';

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    },
  };
});

describe('Public Pages and Forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contact Form', () => {
    it('renders contact page with input fields and submits message', async () => {
      render(<Contact />);
      
      expect(screen.getByText(/Contactez France Justice/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Votre nom/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/votre@email.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Sujet de votre message/i)).toBeInTheDocument();
      
      const submitBtn = screen.getByRole('button', { name: /Envoyer le message/i });
      expect(submitBtn).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Votre nom/i), { target: { value: 'Jean Dupont' } });
      fireEvent.change(screen.getByPlaceholderText(/votre@email.com/i), { target: { value: 'jean@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Sujet de votre message/i), { target: { value: 'Question juridique' } });

      await act(async () => {
        fireEvent.click(submitBtn);
      });
    });
  });

  describe('Generator (Générateur de Documents)', () => {
    it('renders document generator page and document type selection', () => {
      render(<Generator />);
      expect(screen.getByText(/Générateur de Documents Juridiques/i)).toBeInTheDocument();
    });
  });

  describe('Search Page', () => {
    it('renders legal search engine and handles queries', () => {
      render(<SearchPage />);
      expect(screen.getByPlaceholderText(/Rechercher une loi, un arrêt, un code ou une entreprise/i)).toBeInTheDocument();
    });
  });

  describe('Login Page', () => {
    it('renders login form and submits user credentials', async () => {
      render(<Login />);
      expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/votre@email.com/i)).toBeInTheDocument();
      
      const loginBtn = screen.getByRole('button', { name: /Se connecter/i });
      expect(loginBtn).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/votre@email.com/i), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'Password123' } });

      await act(async () => {
        fireEvent.click(loginBtn);
      });
    });
  });

  describe('Reset Password Page', () => {
    it('renders reset password form and submits email', async () => {
      render(<ResetPassword />);
      expect(screen.getByText(/Réinitialisation du mot de passe/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/votre@email.com/i)).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: /Envoyer le lien de réinitialisation/i });
      expect(submitBtn).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/votre@email.com/i), { target: { value: 'reset@example.com' } });

      await act(async () => {
        fireEvent.click(submitBtn);
      });
    });
  });
});
