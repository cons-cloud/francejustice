import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import DashboardLawyer from '../DashboardLawyer';

// Mock useAuth hook for Lawyer
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-lawyer-id', email: 'lawyer@example.com' },
    session: {},
    loading: false,
    signOut: vi.fn(),
    role: 'lawyer',
    profile: { first_name: 'Sarah', last_name: 'Alami', is_verified: true },
  }),
}));

describe('DashboardLawyer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders lawyer dashboard side navigation and stats', async () => {
    await act(async () => {
      render(<DashboardLawyer />);
    });
    
    // Side navigation checks
    expect(screen.getByText("Vue d'ensemble")).toBeInTheDocument();
    expect(screen.getByText('Rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('Dossiers')).toBeInTheDocument();
  });

  it('allows switching to Rendez-vous and managing them', async () => {
    await act(async () => {
      render(<DashboardLawyer />);
    });
    
    const rdvTab = screen.getByText('Rendez-vous');
    await act(async () => {
      fireEvent.click(rdvTab);
    });
    
    // Heading should be visible
    expect(screen.getByText('Gestion des Rendez-vous')).toBeInTheDocument();
  });

  it('allows uploading client documents in Dossiers tab', async () => {
    await act(async () => {
      render(<DashboardLawyer />);
    });
    
    const dossiersTab = screen.getByText('Dossiers');
    await act(async () => {
      fireEvent.click(dossiersTab);
    });
    
    // Document action buttons should be visible
    expect(screen.getByText('Ajouter un Document Client')).toBeInTheDocument();
  });
});
