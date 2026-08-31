import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../../test/utils';
import { ScientificReviews } from '../ScientificReviews';
import { HeroPappersSearch } from '../HeroPappersSearch';
import { AnnualPlanning } from '../AnnualPlanning';

// Mock Supabase
vi.mock('../../../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe('Feature Components Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ScientificReviews Component', () => {
    it('renders scientific reviews list and discipline filters', async () => {
      await act(async () => {
        render(React.createElement(ScientificReviews, { mode: 'public' }));
      });
      
      expect(screen.getByText(/Centre d'Études Doctrinales/i)).toBeInTheDocument();
      expect(screen.getByText(/Toutes disciplines/i)).toBeInTheDocument();
    });

    it('allows searching scientific reviews by query keyword', async () => {
      await act(async () => {
        render(React.createElement(ScientificReviews, { mode: 'public' }));
      });

      const searchInput = screen.getByPlaceholderText(/Rechercher par mot-clé/i);
      expect(searchInput).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'Intelligence Artificielle' } });
    });
  });

  describe('HeroPappersSearch Component', () => {
    it('renders search bar for company verification and SIREN lookup', () => {
      render(React.createElement(HeroPappersSearch, {}));
      expect(screen.getByPlaceholderText(/Entrez une entreprise, un SIREN, un dirigeant ou une juridiction/i)).toBeInTheDocument();
    });
  });

  describe('AnnualPlanning Component', () => {
    it('renders national planning events calendar', () => {
      render(React.createElement(AnnualPlanning, {}));
      expect(screen.getByText(/Planning Annuel National/i)).toBeInTheDocument();
    });
  });
});
