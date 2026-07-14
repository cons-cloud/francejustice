import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  LogIn, Mail, Lock, ShieldCheck, User as UserIcon,
  Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2, X,
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError(t('login.error_email_not_confirmed', 'Veuillez vérifier votre boîte email et cliquer sur le lien de confirmation avant de vous connecter.'));
      } else if (error.message.includes('Invalid login credentials')) {
        setError(t('login.error_invalid'));
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }
    // AuthProvider will detect session change and navigate
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (error) {
      setResetError(error.message);
    } else {
      setView('forgot_sent');
    }
  };

  // Auto-redirect if already logged in and role is known
  React.useEffect(() => {
    if (role) {
      if (role === 'admin') navigate('/dashboard/admin');
      else if (role === 'lawyer') navigate('/dashboard/lawyer');
      else navigate('/dashboard/user');
    }
  }, [role, navigate]);

  // ── Forgot-password sent confirmation ──────────────────────────────────────
  if (view === 'forgot_sent') {
    return (
      <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-secondary-900 mb-2">
                {t('reset_password.email_sent_title', 'Email envoyé !')}
              </CardTitle>
              <p className="text-secondary-600 text-sm mb-6">
                {t('reset_password.email_sent_desc', 'Un lien de réinitialisation a été envoyé à')}{' '}
                <span className="font-semibold text-primary-600">{resetEmail}</span>.{' '}
                {t('reset_password.check_inbox', 'Vérifiez votre boîte de réception (et vos spams).')}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
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
      <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <button
          type="button"
          onClick={() => { setView('login'); setResetError(null); }}
          className="absolute top-8 left-8 flex items-center text-secondary-600 hover:text-primary-600 font-medium transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          {t('reset_password.back_login')}
        </button>

        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <KeyRound className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-secondary-900">
                {t('login.forgot')}
              </CardTitle>
              <CardDescription>
                {t('reset_password.subtitle')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form className="mt-4 space-y-4" onSubmit={handleForgotPassword}>
                {resetError && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{resetError}</p>
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                  <Input
                    type="email"
                    required
                    placeholder={t('login.email_placeholder', 'votre@email.com')}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-14!"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading ? t('common.loading') : t('reset_password.submit')}
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
    <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center text-secondary-600 hover:text-primary-600 font-medium transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
        {t('login.back_home')}
      </Link>

      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-primary-600" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-secondary-900">
              {t('login.welcome', 'Bienvenue sur Just-Law')}
            </CardTitle>
            <CardDescription>
              {t('login.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="rounded-md space-y-4">
                <div className="relative">
                  <Mail className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                  <Input
                    type="email"
                    required
                    placeholder={t('login.email_placeholder', 'votre@email.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-14!"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={t('login.password_placeholder', '••••••••')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-14! pr-12!"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-secondary-400 hover:text-secondary-600 transition-colors"
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
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    {t('login.forgot')}
                  </button>
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('login.loading') : t('login.submit')}
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-secondary-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-secondary-500">{t('login.no_account')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  {t('login.citizen', 'Citoyen')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/register/lawyer')}
                  className="flex items-center justify-center"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {t('login.lawyer', 'Avocat')}
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