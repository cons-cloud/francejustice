// Mocks pour Vitest
import { vi } from 'vitest'

// Mock des modules externes
vi.mock('lucide-react', () => ({
  Search: () => 'Search',
  User: () => 'User',
  Bell: () => 'Bell',
  Menu: () => 'Menu',
  X: () => 'X',
  Scale: () => 'Scale',
  FileText: () => 'FileText',
  BookOpen: () => 'BookOpen',
  Brain: () => 'Brain',
  ArrowRight: () => 'ArrowRight',
  CheckCircle: () => 'CheckCircle',
  AlertCircle: () => 'AlertCircle',
  Info: () => 'Info',
  Download: () => 'Download',
  Save: () => 'Save',
  Plus: () => 'Plus',
  Clock: () => 'Clock',
  Star: () => 'Star',
  MessageSquare: () => 'MessageSquare',
  Shield: () => 'Shield',
  Users: () => 'Users',
  BarChart3: () => 'BarChart3',
  Calendar: () => 'Calendar',
  Settings: () => 'Settings',
  Mail: () => 'Mail',
  Phone: () => 'Phone',
  MapPin: () => 'MapPin',
  Facebook: () => 'Facebook',
  Twitter: () => 'Twitter',
  Linkedin: () => 'Linkedin',
  Instagram: () => 'Instagram',
  Filter: () => 'Filter',
  Bookmark: () => 'Bookmark',
  Share2: () => 'Share2',
  ArrowLeft: () => 'ArrowLeft',
  Sparkles: () => 'Sparkles',
}))

// Mock des APIs
global.fetch = vi.fn()
