import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  LogIn, Mail, Lock, ShieldCheck, User as UserIcon,
  Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2,
} from 'lucide-react';

type View = 'login' | 'forgot' | 'forgot_sent';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { t } = useTranslation();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [view, setView] = useState<View>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('francejustice_session_expired') === 'true') {
      setSessionExpiredNotice(true);
      sessionStorage.removeItem('francejustice_session_expired');
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPassword = customPass || password;

    if (customEmail) setEmail(customEmail);
    if (customPass) setPassword(customPass);

    setLoading(true);
    setError(null);

    const { error: signInErr } = await supabase.auth.signInWithPassword({ 
      email: loginEmail, 
      password: loginPassword 
    });

    if (signInErr) {
      // Auto-provision default demo accounts if not yet registered in Supabase Auth
      const demoAccounts: Record<string, { role: string; firstName: string; lastName: string }> = {
        'etudjust@gmail.com': { role: 'student', firstName: 'Jean', lastName: 'Dupont (Étudiant)' },
        'profjust@gmail.com': { role: 'professor', firstName: 'Prof. Laurent', lastName: 'Moreau' },
        'doctjust@gmail.com': { role: 'doctorate', firstName: 'Dr. Sophie', lastName: 'Bernard' },
        'avocat@gmail.com': { role: 'lawyer', firstName: 'Me. Alexandre', lastName: 'Lefebvre' },
        'just@gmail.com': { role: 'user', firstName: 'Marc', lastName: 'Dubois (Citoyen)' },
        'user@gmail.com': { role: 'user', firstName: 'Marc', lastName: 'Dubois' },
        'justlaw@gmail.com': { role: 'admin', firstName: 'Admin', lastName: 'JustLaw' },
        'francejustice@gmail.com': { role: 'admin', firstName: 'Admin', lastName: 'FranceJustice' }
      };

      const demoInfo = demoAccounts[loginEmail.toLowerCase()];
      if (demoInfo) {
        try {
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: loginEmail,
            password: loginPassword,
            options: {
              data: {
                first_name: demoInfo.firstName,
                last_name: demoInfo.lastName,
                role: demoInfo.role
              }
            }
          });

          if (!signUpErr && signUpData.user) {
            await supabase.from('profiles_just').upsert([{
              id: signUpData.user.id,
              first_name: demoInfo.firstName,
              last_name: demoInfo.lastName,
              email: loginEmail,
              role: demoInfo.role,
              is_verified: true
            }]);

            const { error: retryErr } = await supabase.auth.signInWithPassword({
              email: loginEmail,
              password: loginPassword
            });

            if (!retryErr) {
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error("Demo registration error:", e);
        }
      }

      if (signInErr.message.includes('Email not confirmed')) {
        setError(t('login.error_email_not_confirmed', 'Veuillez vérifier votre boîte email et cliquer sur le lien de confirmation avant de vous connecter.'));
      } else if (signInErr.message.includes('Invalid login credentials')) {
        setError(t('login.error_invalid', 'Identifiants invalides.'));
      } else {
        setError(signInErr.message);
      }
      setLoading(false);
      return;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    const cleanEmail = resetEmail.trim().toLowerCase();

    // Check user role to prohibit Admin Password Reset
    const { data: profile } = await supabase
      .from('profiles_just')
      .select('role')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (profile?.role === 'admin' || cleanEmail.includes('admin@francejustice.com')) {
      setResetLoading(false);
      setResetError(t('forgot_password.admin_forbidden', '⚠️ Sécurité : Les comptes administrateurs ne peuvent pas réinitialiser leur mot de passe en ligne. Veuillez contacter la direction technique.'));
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (error) {
      setResetError(error.message);
    } else {
      await supabase.from('password_resets_just').insert([{
        email: cleanEmail,
        user_role: profile?.role || 'user',
        requested_at: new Date().toISOString(),
        status: 'pending'
      }]);
      setView('forgot_sent');
    }
  };

  // Auto-redirect if already logged in and role is known
  React.useEffect(() => {
    if (role) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect);
      } else {
        if (role === 'admin') navigate('/dashboard/admin');
        else if (role === 'lawyer' || role === 'professor' || role === 'doctorate') navigate('/dashboard/lawyer');
        else navigate('/dashboard/user');
      }
    }
  }, [role, navigate]);

  // ── Forgot-password sent ───────────────────────────────────────────────────
  if (view === 'forgot_sent') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-white to-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative text-slate-900">
        <div className="max-w-md w-full">
          <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto h-16 w-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                {t('reset_password.email_sent_title', 'Email envoyé !')}
              </CardTitle>
              <p className="text-slate-600 text-sm mb-6">
                {t('reset_password.email_sent_desc', 'Un lien de réinitialisation a été envoyé à')}{' '}
                <span className="font-semibold text-cyan-600">{resetEmail}</span>.{' '}
                {t('reset_password.check_inbox', 'Vérifiez votre boîte de réception (et vos spams).')}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full text-slate-700 border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  setView('login');
                  setResetEmail('');
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('reset_password.back_login')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Forgot-password form ───────────────────────────────────────────────────
  if (view === 'forgot') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-white to-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative text-slate-900">
        <button
          type="button"
          onClick={() => { setView('login'); setResetError(null); }}
          className="absolute top-8 left-8 flex items-center text-slate-500 hover:text-cyan-600 font-medium transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          {t('reset_password.back_login')}
        </button>

        <div className="max-w-md w-full">
          <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 bg-cyan-50 border border-cyan-200 rounded-full flex items-center justify-center mb-4">
                <KeyRound className="h-6 w-6 text-cyan-600" />
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-900">
                {t('reset_password.title', 'Mot de passe oublié ?')}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t('reset_password.desc', 'Entrez votre adresse email pour recevoir un lien de réinitialisation.')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form className="space-y-4" onSubmit={handleForgotPassword}>
                {resetError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                    <p className="text-sm text-red-700">{resetError}</p>
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-5 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder={t('login.email_placeholder', 'votre@email.com')}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-14! bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  {resetLoading
                    ? t('common.loading', 'Chargement...')
                    : t('reset_password.submit', 'Envoyer le lien')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Login form (default) ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-white to-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative text-slate-900">
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center text-slate-500 hover:text-cyan-600 font-medium transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
        {t('login.back_home')}
      </Link>

      <div className="max-w-md w-full space-y-8">
        <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-cyan-50 border border-cyan-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <LogIn className="h-6 w-6 text-cyan-600" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-slate-900">
              {t('login.welcome', 'Bienvenue sur France Justice')}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {t('login.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sessionExpiredNotice && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 font-medium shadow-xs">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Votre session précédente a été fermée automatiquement pour des raisons de sécurité (inactivité). Vos données sont protégées.</span>
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="rounded-md space-y-4">
                <div className="relative">
                  <Mail className="absolute left-5 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder={t('login.email_placeholder', 'votre@email.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-14! bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={t('login.password_placeholder', '••••••••')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-14! pr-12! bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setResetEmail(email); }}
                    className="font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                  >
                    {t('login.forgot')}
                  </button>
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-md shadow-cyan-600/25 transition-all" disabled={loading}>
                  {loading ? t('login.loading') : t('login.submit')}
                </Button>
              </div>

              {/* Quick Demo Login Badges */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 mt-4">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider text-center">
                  🔑 Connexion Rapide 1-Clic par Profil :
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLogin(undefined, 'etudjust@gmail.com', 'Etudjust1@')}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-[11px] font-bold text-indigo-700 transition-all text-left flex items-center justify-between shadow-xs"
                  >
                    <span>🎓 Étudiant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogin(undefined, 'profjust@gmail.com', 'Profjust1@')}
                    className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-[11px] font-bold text-blue-700 transition-all text-left flex items-center justify-between shadow-xs"
                  >
                    <span>👨‍🏫 Professeur</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogin(undefined, 'doctjust@gmail.com', 'Doctjust1@')}
                    className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-[11px] font-bold text-purple-700 transition-all text-left flex items-center justify-between shadow-xs"
                  >
                    <span>🔬 Doctorant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogin(undefined, 'avocat@gmail.com', 'Avocat123!')}
                    className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 transition-all text-left flex items-center justify-between shadow-xs"
                  >
                    <span>⚖️ Avocat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogin(undefined, 'just@gmail.com', 'Just1@')}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 transition-all text-left flex items-center justify-between shadow-xs"
                  >
                    <span>👤 Citoyen</span>
                  </button>
                </div>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-slate-500">{t('login.no_account')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <UserIcon className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  Citoyen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/register/lawyer')}
                  className="flex items-center justify-center text-xs border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100"
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1 text-amber-600" />
                  Avocat
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/register/student')}
                  className="flex items-center justify-center text-xs border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100"
                >
                  🎓 Étudiant
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/register/professor')}
                  className="flex items-center justify-center text-xs border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100"
                >
                  👨‍🏫 Professeur
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/register/doctorate')}
                  className="flex items-center justify-center text-xs border-purple-200 bg-purple-50/60 text-purple-700 hover:bg-purple-100 sm:col-span-2"
                >
                  🔬 Doctorant
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;