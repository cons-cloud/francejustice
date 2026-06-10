// Configuration des tests pour Law Just
import '@testing-library/jest-dom'
import React from 'react'
import { vi, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock des APIs externes
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ text: 'Réponse simulée de l\'IA', sources_web: [] }),
  } as unknown as Response)
)

if (typeof window !== 'undefined') {
  (window as any).speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
  };
  (window as any).SpeechSynthesisUtterance = class MockSpeechSynthesisUtterance {
    text = '';
    lang = '';
    voice = null;
    volume = 1;
    rate = 1;
    pitch = 1;
    onstart = null;
    onend = null;
    onerror = null;
    constructor(text = '') {
      this.text = text;
    }
  } as any;
}

// Mock global pour react-router-dom
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

// Exposer globalement pour les tests
;(global as unknown as { mockNavigate: typeof mockNavigate }).mockNavigate = mockNavigate

// Mock de Supabase
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  };
  return { supabase: mockSupabase };
})

vi.mock('../lib/supabase', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  };
  return { supabase: mockSupabase };
})

// Mock complet pour lucide-react (ESM compatible)
const icons = [
  'Users', 'Search', 'Phone', 'Mail', 'MapPin', 'CheckCircle', 'RefreshCw',
  'Database', 'FileText', 'Activity', 'Briefcase', 'TrendingUp', 'BarChart3',
  'Calendar', 'AlertCircle', 'Scale', 'TrendingDown', 'Plus', 'Trash', 'Clock',
  'Sparkles', 'ArrowRight', 'Lock', 'ShieldAlert', 'FileDown', 'UserCheck',
  'Bookmark', 'Sparkle', 'ArrowUpRight', 'HelpCircle', 'LogOut', 'Menu', 'X',
  'ChevronDown', 'ChevronUp', 'Upload', 'BookOpen', 'Heart', 'ScaleAlert',
  'Trash2', 'History', 'User', 'PlusCircle', 'Download', 'LayoutDashboard', 'Shield',
  'Check', 'ChevronRight', 'UserX', 'CheckSquare', 'FileSignature', 'Receipt',
  'PenTool', 'Bell', 'ExternalLink', 'CreditCard', 'Settings', 'MessageSquare',
  'Mic', 'MicOff', 'Volume2', 'VolumeX', 'CornerDownLeft', 'Loader2', 'AlertTriangle',
  'Home', 'CheckCircle2', 'Info', 'Save', 'Brain', 'EyeOff', 'FileJson', 'FileSpreadsheet',
  'Edit', 'UserPlus', 'DollarSign', 'Globe', 'ArrowLeft', 'Eye'
];

const mockLucide: Record<string, React.ComponentType<Record<string, unknown>>> = {};
icons.forEach(icon => {
  mockLucide[icon] = (props: Record<string, unknown>) => React.createElement('span', { 'data-testid': `icon-${icon.toLowerCase()}`, ...props }, icon);
});

vi.mock('lucide-react', () => mockLucide);

// Mock heavy feature components to avoid OOM in Dashboard/DashboardLawyer tests
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
    { id: 'IDF', name: 'Île-de-France', path: 'M 170 100 L 210 100 L 210 130 L 170 130 Z', labelX: 190, labelY: 115, departments: ['75', '92', '93', '94'] },
  ],
}));

// Mock heavy chart components from features/StatsCharts to avoid OOM
vi.mock('../components/features/StatsCharts', () => ({
  AdvancedAreaChart: () => React.createElement('div', { 'data-testid': 'mock-advanced-area-chart' }),
  AdvancedBarChart: () => React.createElement('div', { 'data-testid': 'mock-advanced-bar-chart' }),
  SimplePieChart: () => React.createElement('div', { 'data-testid': 'mock-simple-pie-chart' }),
}));

// Mock Recharts globally to avoid JSDOM layout loop / memory exhaustion
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'mock-responsive-container' }, children),
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => React.createElement('div', { 'data-testid': 'mock-area-chart', 'data-data': JSON.stringify(data) }, children),
  Area: () => React.createElement('div', { 'data-testid': 'mock-area' }),
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => React.createElement('div', { 'data-testid': 'mock-bar-chart', 'data-data': JSON.stringify(data) }, children),
  Bar: () => React.createElement('div', { 'data-testid': 'mock-bar' }),
  Cell: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'mock-pie-chart' }, children),
  Pie: () => React.createElement('div', { 'data-testid': 'mock-pie' }),
}));

// Mock additional components and helpers to prevent OOM
vi.mock('../components/features/Chat', () => ({
  Chat: () => React.createElement('div', { 'data-testid': 'mock-chat' }, 'Chat'),
}));

vi.mock('../pages/Generator', () => ({
  DocumentGenerator: () => React.createElement('div', { 'data-testid': 'mock-document-generator' }, 'DocumentGenerator'),
}));

vi.mock('../pages/Search', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-search-page' }, 'SearchPage'),
  SearchPage: () => React.createElement('div', { 'data-testid': 'mock-search-page' }, 'SearchPage'),
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



// Configuration des tests
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

