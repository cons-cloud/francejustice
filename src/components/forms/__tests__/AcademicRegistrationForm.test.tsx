import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../../test/utils';
import AcademicRegistrationForm from '../AcademicRegistrationForm';

// Mock Supabase
vi.mock('../../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-academic-user-id', email: 'test@univ.fr' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    },
  };
});

describe('AcademicRegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders role switcher tabs for Student, Professor, Doctorate', () => {
    render(<AcademicRegistrationForm defaultRole="student" />);
    expect(screen.getByText('Étudiant')).toBeInTheDocument();
    expect(screen.getByText('Professeur')).toBeInTheDocument();
    expect(screen.getByText('Doctorant')).toBeInTheDocument();
  });

  it('renders student specific fields when student role is selected', () => {
    render(<AcademicRegistrationForm defaultRole="student" />);
    expect(screen.getByText('Inscription Étudiant en Droit')).toBeInTheDocument();
    expect(screen.getByText('Université / Faculté de Droit *')).toBeInTheDocument();
    expect(screen.getByText("Niveau d'études *")).toBeInTheDocument();
  });

  it('renders professor specific fields when professor tab is clicked', async () => {
    render(<AcademicRegistrationForm defaultRole="student" />);
    
    const profTab = screen.getByText('Professeur');
    await act(async () => {
      fireEvent.click(profTab);
    });

    expect(screen.getByText('Inscription Enseignant / Professeur')).toBeInTheDocument();
    expect(screen.getByText("Université / Établissement d'enseignement *")).toBeInTheDocument();
    expect(screen.getByText('Titre / Grade Académique *')).toBeInTheDocument();
    expect(screen.getByText("Discipline d'enseignement *")).toBeInTheDocument();
  });

  it('renders doctorate specific fields when doctorate tab is clicked', async () => {
    render(<AcademicRegistrationForm defaultRole="student" />);
    
    const docTab = screen.getByText('Doctorant');
    await act(async () => {
      fireEvent.click(docTab);
    });

    expect(screen.getByText('Inscription Doctorant / Chercheur')).toBeInTheDocument();
    expect(screen.getByText('Université / Laboratoire de recherche *')).toBeInTheDocument();
    expect(screen.getByText('Sujet de Thèse de Doctorat *')).toBeInTheDocument();
    expect(screen.getByText('Année de Thèse *')).toBeInTheDocument();
  });

  it('allows submitting student registration form successfully', async () => {
    render(<AcademicRegistrationForm defaultRole="student" />);
    
    fireEvent.change(screen.getByPlaceholderText('Jean'), { target: { value: 'Lucas' } });
    fireEvent.change(screen.getByPlaceholderText('Dupont'), { target: { value: 'Bernard' } });
    fireEvent.change(screen.getByPlaceholderText('prenom.nom@univ.fr'), { target: { value: 'lucas@univ-paris1.fr' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByPlaceholderText('ex: Université Paris 1 Panthéon-Sorbonne'), { target: { value: 'Panthéon Sorbonne' } });

    const submitBtn = screen.getByRole('button', { name: /Créer mon compte Étudiant/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText('Compte créé avec succès !')).toBeInTheDocument();
  });
});
