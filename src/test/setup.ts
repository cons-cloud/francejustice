// Configuration des tests pour Law Just
import '@testing-library/jest-dom'

// Mock des APIs externes
global.fetch = vi.fn()

// Mock des modules
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}))

// Configuration des tests
beforeEach(() => {
  vi.clearAllMocks()
})
