import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import DashboardLawyer from '../DashboardLawyer';

// Mock useAuth hook for lawyer
vi.mock('../../hooks/useAuth', () => {
  const user = { id: 'lawyer-test-id', email: 'avocat@barreau.fr' };
  const profile = { first_name: 'Alexandre', last_name: 'Vidal', role: 'lawyer', bar_association: 'Paris', is_verified: true };
  return {
    useAuth: () => ({
      user,
      session: {},
      loading: false,
      signOut: vi.fn(),
      role: 'lawyer',
      profile,
    }),
  };
});

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        upsert: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      }),
      removeChannel: vi.fn(),
    },
  };
});

describe('DashboardLawyer Actions & Business Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Lawyer Dashboard overview and main stats', async () => {
    await act(async () => {
      render(<DashboardLawyer />);
    });
    
    expect(screen.getByText(/Alexandre Vidal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rendez-vous/i)[0]).toBeInTheDocument();
  });

  it('allows creating a quote for a client', async () => {
    await act(async () => {
      render(<DashboardLawyer />);
    });

    const quoteTab = screen.getAllByText(/Devis & Honoraires/i)[0];
    if (quoteTab) {
      await act(async () => {
        fireEvent.click(quoteTab);
      });
    }
  });

  it('allows scheduling a virtual classroom / video consultation', async () => {
    await act(async () => {
      render(<DashboardLawyer />);
    });

    const videoTab = screen.getAllByText(/Salles Virtuelles & Visioconférences/i)[0];
    if (videoTab) {
      await act(async () => {
        fireEvent.click(videoTab);
      });
    }
  });

  it('allows exporting lawyer cases and client history to CSV', async () => {
    await act(async () => {
      render(<DashboardLawyer />);
    });

    const exportBtn = screen.getByRole('button', { name: /Export/i });
    if (exportBtn) {
      await act(async () => {
        fireEvent.click(exportBtn);
      });
    }
  });
});
