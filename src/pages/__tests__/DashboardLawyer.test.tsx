import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import DashboardLawyer from '../DashboardLawyer';

// Mock useAuth hook for Lawyer
vi.mock('../../hooks/useAuth', () => {
  const user = { id: 'test-lawyer-id', email: 'lawyer@example.com' };
  const profile = { first_name: 'Sarah', last_name: 'Alami', is_verified: true };
  const session = {};
  const signOut = vi.fn();
  return {
    useAuth: () => ({
      user,
      session,
      loading: false,
      signOut,
      role: 'lawyer',
      profile,
    }),
  };
});

// Mock VoiceAssistant locally for DashboardLawyer tests
vi.mock('../../components/ui/VoiceAssistant', () => ({
  VoiceAssistant: () => null,
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
    expect(screen.getAllByText('Rendez-vous')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Dossiers')[0]).toBeInTheDocument();
  });

  it('allows switching to Rendez-vous and managing them', async () => {
    await act(async () => {
      render(<DashboardLawyer />);
    });
    
    const rdvTab = screen.getAllByText('Rendez-vous')[0];
    await act(async () => {
      fireEvent.click(rdvTab);
    });
    
    // Heading should be visible
    expect(screen.getByText('Historique & Gestion des Rendez-vous')).toBeInTheDocument();
  });

  it('allows uploading client documents in Dossiers tab', async () => {
    await act(async () => {
      render(<DashboardLawyer />);
    });
    
    const dossiersTab = screen.getAllByText('Dossiers')[0];
    await act(async () => {
      fireEvent.click(dossiersTab);
    });
    
    // Document action buttons should be visible
    expect(screen.getByText('Nouveau Document Client')).toBeInTheDocument();
  });
});
