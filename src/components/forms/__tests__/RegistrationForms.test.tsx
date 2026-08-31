import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/utils';
import UserRegistrationForm from '../UserRegistrationForm';
import LawyerRegistrationForm from '../LawyerRegistrationForm';

// Mock Supabase
vi.mock('../../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.pdf' } }),
        }),
      },
    },
  };
});

describe('RegistrationForms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UserRegistrationForm', () => {
    it('renders citizen registration form correctly', () => {
      render(<UserRegistrationForm />);
      expect(screen.getByText('Créer un compte France Justice')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nom')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    it('renders shortcut buttons for academic roles', () => {
      render(<UserRegistrationForm />);
      expect(screen.getByText('👤 Citoyen')).toBeInTheDocument();
      expect(screen.getByText('🎓 Étudiant →')).toBeInTheDocument();
      expect(screen.getByText('👨‍🏫 Professeur →')).toBeInTheDocument();
      expect(screen.getByText('🔬 Doctorant →')).toBeInTheDocument();
    });
  });

  describe('LawyerRegistrationForm', () => {
    it('renders professional lawyer registration form', () => {
      render(<LawyerRegistrationForm />);
      expect(screen.getByText('Inscription Professionnelle')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nom')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email Pro')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Barreau/i)).toBeInTheDocument();
    });
  });
});
