import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/design.css';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import GeneratorPage from './pages/Generator';
import DashboardPage from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/Login';
import LawyersPage from './pages/Lawyers';
import AssistantPage from './pages/Assistant';
import ContactPage from './pages/Contact';
import DashboardLawyer from './pages/DashboardLawyer';
import ServicesPage from './pages/Services';
import AboutPage from './pages/About';
import RegistrationForm from './components/forms/UserRegistrationForm';
import LawyerRegistrationForm from './components/forms/LawyerRegistrationForm';
import { AuthProvider, useAuth } from './hooks/useAuth';
import GuidePratique from './pages/GuidePratique';
import FAQ from './pages/FAQ';

function RequireRole({ role, children }: { role: 'user' | 'admin' | 'lawyer'; children: React.ReactNode }) {
  const { role: current, loading } = useAuth();
  
  if (loading) return null;
  if (!current) return <Navigate to="/login" replace />;
  if (current !== role) return <Navigate to={current === 'admin' ? '/dashboard/admin' : current === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/user'} replace />;
  return <>{children}</>;
}

import CookieConsent from './components/ui/CookieConsent';

function AppContent() {
  const { pathname } = useLocation();
  const isAuthPage = ['/login', '/register', '/register/lawyer'].includes(pathname);
  const isDashboardPage = pathname.startsWith('/dashboard');
  const hideLayout = isAuthPage || isDashboardPage;

  return (
    <div className="min-h-screen flex flex-col relative">
      {!hideLayout && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/generator" element={<GeneratorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/dashboard/lawyer"
            element={
              <RequireRole role="lawyer">
                <DashboardLawyer />
              </RequireRole>
            }
          />
          <Route path="/register/lawyer" element={<LawyerRegistrationForm onClose={() => {}} />} />
          <Route path="/register" element={<RegistrationForm onClose={() => {}} />} />
          <Route path="/guide" element={<GuidePratique />} />
          <Route path="/faq" element={<FAQ />} />
          <Route
            path="/dashboard/user"
            element={
              <RequireRole role="user">
                <DashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/dashboard/user" replace />} />
          <Route path="/lawyers" element={<LawyersPage />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
