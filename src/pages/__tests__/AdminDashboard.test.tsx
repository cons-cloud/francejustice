import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import AdminDashboard from '../AdminDashboard';

// Mock useAuth hook for Admin
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-admin-id', email: 'francejustice@gmail.com' },
    session: {},
    loading: false,
    signOut: vi.fn(),
    role: 'admin',
    profile: { first_name: 'Admin', last_name: 'France Justice', is_verified: true },
  }),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin dashboard options', async () => {
    await act(async () => {
      render(<AdminDashboard />);
    });
    
    // Check navigation buttons for admin
    expect(screen.getByText('Avocats')).toBeInTheDocument();
    expect(screen.getByText('Rendez-vous')).toBeInTheDocument();
  });

  it('allows switching to Rendez-vous tab', async () => {
    await act(async () => {
      render(<AdminDashboard />);
    });
    
    const rdvTab = screen.getByText('Rendez-vous');
    await act(async () => {
      fireEvent.click(rdvTab);
    });
    
    // Heading should be visible
    expect(screen.getByText('Suivi Global des Rendez-vous')).toBeInTheDocument();
  });
});
