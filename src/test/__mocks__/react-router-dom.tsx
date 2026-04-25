// Mock de react-router-dom
import { vi } from 'vitest'

export const useNavigate = vi.fn()
export const useLocation = vi.fn(() => ({ pathname: '/' }))
export const useParams = vi.fn(() => ({}))
export const useSearchParams = vi.fn(() => [new URLSearchParams(), vi.fn()])

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => children
export const Routes = ({ children }: { children: React.ReactNode }) => children
export const Route = ({ element }: { element: React.ReactNode }) => element
export const Link = ({ children, to }: { children: React.ReactNode; to: string }) => (
  <a href={to}>{children}</a>
)
export const NavLink = ({ children, to }: { children: React.ReactNode; to: string }) => (
  <a href={to}>{children}</a>
)
