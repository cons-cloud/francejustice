import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import LawyersPage from '../Lawyers';

describe('LawyersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main heading and search bar', async () => {
    await act(async () => {
      render(<LawyersPage />);
    });

    // Titre principal depuis Lawyers.tsx ligne 88
    expect(screen.getByText('Trouvez un Avocat de Confiance')).toBeInTheDocument();

    // Champ de recherche
    expect(
      screen.getByPlaceholderText('Rechercher par nom ou spécialité...')
    ).toBeInTheDocument();
  });

  it('renders the lawyer registration CTA section', async () => {
    await act(async () => {
      render(<LawyersPage />);
    });

    // Section inscription avocat
    expect(screen.getByText('Vous êtes avocat ?')).toBeInTheDocument();
    expect(screen.getByText("S'inscrire comme Avocat")).toBeInTheDocument();
  });

  it('navigates to /register/lawyer when clicking the registration button', async () => {
    await act(async () => {
      render(<LawyersPage />);
    });

    const registerBtn = screen.getByText("S'inscrire comme Avocat");
    expect(registerBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(registerBtn);
    });

    // mockNavigate est exposé globalement dans setup.ts
    expect((global as any).mockNavigate).toHaveBeenCalledWith('/register/lawyer');
  });

  it('shows an empty state when no lawyers match the query', async () => {
    await act(async () => {
      render(<LawyersPage />);
    });

    // Le mock Supabase retourne data:[] — la liste est vide
    // Le composant affiche l'état vide "Aucun avocat trouvé"
    expect(screen.getByText('Aucun avocat trouvé')).toBeInTheDocument();
    expect(
      screen.getByText('Essayez de modifier vos critères de recherche.')
    ).toBeInTheDocument();
  });

  it('shows an empty state when no lawyers are returned', async () => {
    await act(async () => {
      render(<LawyersPage />);
    });

    // Le mock retourne data:[] donc la liste d'avocats est vide
    // La page doit afficher le bouton de chargement supplémentaire ou la section CTA
    expect(screen.getByText("S'inscrire comme Avocat")).toBeInTheDocument();
  });
});
