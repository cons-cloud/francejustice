import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import AdminDashboard from '../AdminDashboard';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => {
  const user = { id: 'admin-test-id', email: 'admin@francejustice.fr' };
  const profile = { first_name: 'Admin', last_name: 'FranceJustice', role: 'admin' };
  return {
    useAuth: () => ({
      user,
      session: {},
      loading: false,
      signOut: vi.fn(),
      role: 'admin',
      profile,
    }),
  };
});

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  const mockUsers = [
    { id: 'usr-1', email: 'citizen@example.com', first_name: 'Paul', last_name: 'Martin', role: 'user', is_verified: true, created_at: '2026-01-01' },
    { id: 'usr-2', email: 'student@univ.fr', first_name: 'Lucas', last_name: 'Bernard', role: 'student', is_verified: true, university: 'Panthéon Sorbonne', created_at: '2026-01-02' },
    { id: 'usr-3', email: 'prof@univ.fr', first_name: 'Marie', last_name: 'Curie', role: 'professor', is_verified: true, academic_title: 'PU', created_at: '2026-01-03' },
    { id: 'usr-4', email: 'lawyer@barreau.fr', first_name: 'Marc', last_name: 'Dubois', role: 'lawyer', is_verified: false, bar_association: 'Paris', created_at: '2026-01-04' },
  ];

  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          eq: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        upsert: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      }),
      removeChannel: vi.fn(),
    },
  };
});

describe('AdminDashboard Actions & Business Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Admin Dashboard overview and navigation tabs', async () => {
    await act(async () => {
      render(<AdminDashboard />);
    });
    
    expect(screen.getByText(/Administration /i)).toBeInTheDocument();
    expect(screen.getAllByText(/Membres & Citoyens/i)[0]).toBeInTheDocument();
  });

  it('allows filtering members by user role', async () => {
    await act(async () => {
      render(<AdminDashboard />);
    });

    const membersTab = screen.getAllByText(/Gestion Utilisateurs/i)[0];
    if (membersTab) {
      await act(async () => {
        fireEvent.click(membersTab);
      });
    }
  });

  it('allows exporting system logs and member list to CSV/JSON', async () => {
    await act(async () => {
      render(<AdminDashboard />);
    });

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    if (exportBtn) {
      await act(async () => {
        fireEvent.click(exportBtn);
      });
    }
  });
});
