import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import CitizenDashboard from '../Dashboard';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => {
  const user = { id: 'test-citizen-id', email: 'citizen@example.com' };
  const profile = { first_name: 'Jean', last_name: 'Dupont', is_verified: true };
  const session = {};
  const signOut = vi.fn();
  return {
    useAuth: () => ({
      user,
      session,
      loading: false,
      signOut,
      role: 'user',
      profile,
    }),
  };
});

// Mock VoiceAssistant locally for Dashboard tests
vi.mock('../../components/ui/VoiceAssistant', () => ({
  VoiceAssistant: () => null,
}));

describe('CitizenDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders side navigation and default tab', async () => {
    await act(async () => {
      render(<CitizenDashboard />);
    });
    
    // Check navigation buttons are present
    expect(screen.getByText("Vue d'ensemble")).toBeInTheDocument();
    expect(screen.getAllByText('Rendez-vous')[0]).toBeInTheDocument();
    expect(screen.getByText('Mes documents')).toBeInTheDocument();
    expect(screen.getByText('Annuaire Avocats')).toBeInTheDocument();
  });

  it('allows clicking the Rendez-vous tab and showing appointments list', async () => {
    await act(async () => {
      render(<CitizenDashboard />);
    });
    
    // Switch to appointments tab
    const rdvTab = screen.getAllByText('Rendez-vous')[0];
    await act(async () => {
      fireEvent.click(rdvTab);
    });
    
    // The main appointment layout elements should be present
    expect(screen.getByText('Réserver une consultation')).toBeInTheDocument();
    expect(screen.getByText('Mes Rendez-vous')).toBeInTheDocument();
  });

  it('allows uploading a document with category selection', async () => {
    await act(async () => {
      render(<CitizenDashboard />);
    });
    
    // Switch to documents tab
    const docsTab = screen.getByText('Mes documents');
    await act(async () => {
      fireEvent.click(docsTab);
    });
    
    // Check for upload elements
    expect(screen.getByText('Ajouter un document au coffre-fort')).toBeInTheDocument();
    
    // Verify file type select input exists
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getAllByText(/Pièce d'identité/)[0]).toBeInTheDocument();
  });
});
