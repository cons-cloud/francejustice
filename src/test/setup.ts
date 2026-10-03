// Configuration des tests pour France Justice
import '@testing-library/jest-dom'
import React from 'react'
import { vi, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// ── Global Fetch Mock ────────────────────────────────────────────────────────
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ text: "Réponse simulée de l'IA", sources_web: [] }),
  } as unknown as Response)
)

// ── Speech Synthesis Mock ─────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  (window as any).speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
  };
  (window as any).SpeechSynthesisUtterance = class MockSpeechSynthesisUtterance {
    text = ''; lang = ''; voice = null; volume = 1; rate = 1; pitch = 1;
    onstart = null; onend = null; onerror = null;
    constructor(text = '') { this.text = text; }
  } as any;
}

// ── React Router Mock ─────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => React.createElement('a', { href: to }, children),
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => React.createElement('a', { href: to }, children),
}))

;(global as unknown as { mockNavigate: typeof mockNavigate }).mockNavigate = mockNavigate

// ── Mock @supabase/supabase-js (prevents createClient WebSocket deadlocks) ────
vi.mock('@supabase/supabase-js', () => {
  const mockClient = {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      updateUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
  };
  return { createClient: vi.fn(() => mockClient) };
});

// ── Mock lib/supabase (both path alias variants) ──────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));



// ── lucide-react mock (Dynamic Proxy — all icons work) ────────────────────────
vi.mock('lucide-react', async () => {
  return new Proxy({}, {
    get: (_target, prop: string) => {
      return (props: Record<string, unknown>) => React.createElement(
        'span',
        { 'data-testid': `icon-${prop.toLowerCase()}`, ...props },
        String(prop)
      );
    }
  });
});

// ── framer-motion mock (prevents requestAnimationFrame deadlocks in JSDOM) ────
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, tag: string) => {
      const Comp = ({ children, ...props }: Record<string, unknown>) =>
        React.createElement(tag as string, props, children as React.ReactNode);
      return Comp;
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useMotionValue: (initial: unknown) => ({ get: () => initial, set: vi.fn() }),
  useTransform: () => ({ get: vi.fn() }),
  useSpring: (initial: unknown) => ({ get: () => initial }),
  animate: vi.fn(),
  useScroll: () => ({ scrollY: { get: () => 0 }, scrollYProgress: { get: () => 0 } }),
  useInView: () => true,
}));

// ── useAuth mock (prevents onAuthStateChange subscriptions) ───────────────────
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: null, profile: null, role: null, loading: false,
    signOut: vi.fn().mockResolvedValue(undefined),
    isAdmin: false, isLawyer: false,
  }),
}));

// ── i18n mock ─────────────────────────────────────────────────────────────────
vi.mock('../i18n', () => ({
  useTranslation: vi.fn().mockReturnValue({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'fr', changeLanguage: vi.fn() },
  }),
}));

// ── Heavy feature component mocks (avoid OOM in Dashboard tests) ──────────────
vi.mock('../components/features/LawCodes', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-law-codes' }, 'LawCodes'),
  LawCodes: () => React.createElement('div', { 'data-testid': 'mock-law-codes' }, 'LawCodes'),
}));

vi.mock('../components/features/ProcedureLibrary', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-procedure-library' }, 'ProcedureLibrary'),
  ProcedureLibrary: () => React.createElement('div', { 'data-testid': 'mock-procedure-library' }, 'ProcedureLibrary'),
}));

vi.mock('../components/features/CodeAnalysis', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-code-analysis' }, 'CodeAnalysis'),
  CodeAnalysis: () => React.createElement('div', { 'data-testid': 'mock-code-analysis' }, 'CodeAnalysis'),
}));

vi.mock('../components/features/FranceMap', () => ({
  FranceMap: ({ onSelectRegion }: { onSelectRegion: (r: string | null) => void }) =>
    React.createElement('div', { 'data-testid': 'mock-france-map', onClick: () => onSelectRegion(null) }, 'FranceMap'),
  regions: [
    { id: 'IDF', name: 'Île-de-France', path: 'M 170 100', labelX: 190, labelY: 115, departments: ['75'] },
  ],
}));

vi.mock('../components/features/StatsCharts', () => ({
  AdvancedAreaChart: () => React.createElement('div', { 'data-testid': 'mock-advanced-area-chart' }),
  AdvancedBarChart: () => React.createElement('div', { 'data-testid': 'mock-advanced-bar-chart' }),
  SimplePieChart: () => React.createElement('div', { 'data-testid': 'mock-simple-pie-chart' }),
}));

// ── Recharts mock (prevents JSDOM layout loops) ───────────────────────────────
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'mock-responsive-container' }, children),
  AreaChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'mock-area-chart' }, children),
  Area: () => React.createElement('div', { 'data-testid': 'mock-area' }),
  XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'mock-bar-chart' }, children),
  Bar: () => React.createElement('div', { 'data-testid': 'mock-bar' }),
  Cell: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'mock-pie-chart' }, children),
  Pie: () => React.createElement('div', { 'data-testid': 'mock-pie' }),
}));

// ── Other component / lib mocks ───────────────────────────────────────────────
vi.mock('../components/features/Chat', () => ({
  Chat: () => React.createElement('div', { 'data-testid': 'mock-chat' }, 'Chat'),
}));

// ── CRITICAL: Mock 100k-line annuaire data file — causes worker OOM/timeout ───
vi.mock('../data/annuaireAvocatsFrance', () => ({
  ANNUAIRE_AVOCATS_FRANCE_DATA: [],
}));

vi.mock('../lib/avocatsDataGouvSync', () => ({
  registerDeletedUser: vi.fn().mockResolvedValue(undefined),
  syncAvocat: vi.fn().mockResolvedValue(undefined),
  getAllUnifiedLawyers: vi.fn().mockResolvedValue([]),
  searchUnifiedLawyers: vi.fn().mockResolvedValue([]),
  getUnifiedLawyerById: vi.fn().mockResolvedValue(null),
}));

vi.mock('../lib/formationAttachmentUtils', () => ({
  convertFileToAttachment: vi.fn().mockResolvedValue({}),
  exportAllAttachments: vi.fn().mockResolvedValue(undefined),
  getFormationAttachments: vi.fn().mockResolvedValue([]),
}));

vi.mock('../lib/dataSecurityUtils', () => ({
  DATA_RETENTION_SCHEDULE: [],
  DATABASE_SECURITY_INFO: {},
  getSecurityStatusBadge: vi.fn().mockReturnValue({ label: 'OK', color: 'green' }),
}));

vi.mock('../lib/jurisdictions', () => ({
  COURS_D_APPEL_LIST: [],
  getCourDAppelForCity: vi.fn().mockReturnValue(null),
  getJurisdictionForPostalCode: vi.fn().mockReturnValue(null),
}));



vi.mock('../components/ui/Modal', () => ({
  default: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? React.createElement('div', { 'data-testid': 'mock-modal' }, children) : null,
}));

vi.mock('../lib/exportUtils', () => ({
  exportToJSON: vi.fn(),
  exportToCSV: vi.fn(),
}));

vi.mock('../lib/gemini', () => ({
  chatWithAI: vi.fn().mockResolvedValue('Réponse IA simulée'),
  generateLegalDocument: vi.fn().mockResolvedValue('Document simulé'),
  analyzeContract: vi.fn().mockResolvedValue({ score: 95, clauses: [] }),
}));

// ── Test lifecycle ────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
})

afterEach(() => {
  cleanup();
})
