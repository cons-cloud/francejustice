import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './styles/design.css';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { AuthProvider, useAuth } from './hooks/useAuth';
import CookieConsent from './components/ui/CookieConsent';

// ─── Lazy-loaded pages (code-split per route) ────────────────────────────────
// Each page is loaded only when the user navigates to that route.
// Heavy dashboards (DashboardLawyer 161 kB, Dashboard 95 kB, AdminDashboard 75 kB)
// are never bundled into the initial load.
const Home                 = lazy(() => import('./pages/Home'));
const SearchPage           = lazy(() => import('./pages/Search'));
const GeneratorPage        = lazy(() => import('./pages/Generator'));
const DashboardPage        = lazy(() => import('./pages/Dashboard'));
const AdminDashboard       = lazy(() => import('./pages/AdminDashboard'));
const LoginPage            = lazy(() => import('./pages/Login'));
const LawyersPage          = lazy(() => import('./pages/Lawyers'));
const AssistantPage        = lazy(() => import('./pages/Assistant'));
const ContactPage          = lazy(() => import('./pages/Contact'));
const DashboardLawyer      = lazy(() => import('./pages/DashboardLawyer'));
const ServicesPage         = lazy(() => import('./pages/Services'));
const AboutPage            = lazy(() => import('./pages/About'));
const RegistrationForm     = lazy(() => import('./components/forms/UserRegistrationForm'));
const LawyerRegistrationForm = lazy(() => import('./components/forms/LawyerRegistrationForm'));
const GuidePratique        = lazy(() => import('./pages/GuidePratique'));
const FAQ                  = lazy(() => import('./pages/FAQ'));
const News                 = lazy(() => import('./pages/News'));
const Legal                = lazy(() => import('./pages/Legal'));
const Database             = lazy(() => import('./pages/Database'));
const GeniaLAvocat         = lazy(() => import('./pages/GeniaLAvocat'));
const ClassroomsPage       = lazy(() => import('./pages/Classrooms'));
const ResetPasswordPage    = lazy(() => import('./pages/ResetPassword'));

// ─── Lightweight page-level fallback ─────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        <span className="text-sm text-slate-400 font-medium">Chargement…</span>
      </div>
    </div>
  );
}

function RequireRole({ role, children }: { role: 'user' | 'admin' | 'lawyer'; children: React.ReactNode }) {
  const { role: current, loading } = useAuth();

  if (loading) return null;
  if (!current) return <Navigate to="/login" replace />;
  if (current !== role) return <Navigate to={current === 'admin' ? '/dashboard/admin' : current === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/user'} replace />;
  return <>{children}</>;
}

function AppContent() {
  const { pathname } = useLocation();
  const isAuthPage = ['/login', '/register', '/register/lawyer', '/reset-password'].includes(pathname);
  const isDashboardPage = pathname.startsWith('/dashboard');
  const hideLayout = isAuthPage || isDashboardPage;

  return (
    <div className="min-h-screen flex flex-col relative">
      {!hideLayout && <Header />}
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                element={<Home />} />
            <Route path="/search"          element={<SearchPage />} />
            <Route path="/generator"       element={<GeneratorPage />} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/assistant"       element={<AssistantPage />} />
            <Route path="/contact"         element={<ContactPage />} />
            <Route path="/services"        element={<ServicesPage />} />
            <Route path="/classrooms"      element={<ClassroomsPage />} />
            <Route path="/about"           element={<AboutPage />} />
            <Route path="/guide"           element={<GuidePratique />} />
            <Route path="/faq"             element={<FAQ />} />
            <Route path="/news"            element={<News />} />
            <Route path="/legal"           element={<Legal />} />
            <Route path="/privacy"         element={<Legal />} />
            <Route path="/terms"           element={<Legal />} />
            <Route path="/cookies"         element={<Legal />} />
            <Route path="/database"        element={<Database />} />
            <Route path="/genia-l"         element={<GeniaLAvocat />} />
            <Route path="/lawyers"         element={<LawyersPage />} />
            <Route path="/register"        element={<RegistrationForm onClose={() => {}} />} />
            <Route path="/register/lawyer" element={<LawyerRegistrationForm onClose={() => {}} />} />
            <Route
              path="/dashboard/lawyer"
              element={
                <RequireRole role="lawyer">
                  <DashboardLawyer />
                </RequireRole>
              }
            />
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
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<Navigate to="/dashboard/user" replace />} />
          </Routes>
        </Suspense>
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
