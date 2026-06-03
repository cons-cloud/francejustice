import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import CitizenDashboard from '../Dashboard';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-citizen-id', email: 'citizen@example.com' },
    session: {},
    loading: false,
    signOut: vi.fn(),
    role: 'user',
    profile: { first_name: 'Jean', last_name: 'Dupont', is_verified: true },
  }),
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
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('Mes documents')).toBeInTheDocument();
    expect(screen.getByText('Annuaire')).toBeInTheDocument();
  });

  it('allows clicking the Rendez-vous tab and showing appointments list', async () => {
    await act(async () => {
      render(<CitizenDashboard />);
    });
    
    // Switch to appointments tab
    const rdvTab = screen.getByText('Rendez-vous');
    await act(async () => {
      fireEvent.click(rdvTab);
    });
    
    // The main appointment layout elements should be present
    expect(screen.getByText('Nouveau Rendez-vous')).toBeInTheDocument();
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
    expect(screen.getByText('Téléverser un document')).toBeInTheDocument();
    
    // Verify file type select input exists
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Pièce d'identité")).toBeInTheDocument();
  });
});
