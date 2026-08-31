import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../i18n';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [isAdminBlocked, setIsAdminBlocked] = useState(false);

  useEffect(() => {
    // Check initial session & auth state
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if current user is Admin
        const { data: profile } = await supabase
          .from('profiles_just')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.role === 'admin' || session.user.email?.includes('admin@francejustice.com')) {
          setIsAdminBlocked(true);
        } else {
          setSessionReady(true);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        if (session) {
          const { data: profile } = await supabase
            .from('profiles_just')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile?.role === 'admin' || session.user.email?.includes('admin@francejustice.com')) {
            setIsAdminBlocked(true);
          } else {
            setSessionReady(true);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isAdminBlocked) {
      setError(t('reset_password.admin_blocked', '⚠️ Les comptes administrateurs ne peuvent pas réinitialiser leur mot de passe en ligne.'));
      return;
    }

    if (password.length < 8) {
      setError(t('reset_password.error_length', 'Le mot de passe doit contenir au moins 8 caractères.'));
      return;
    }
    if (password !== confirm) {
      setError(t('reset_password.error_match', 'Les deux mots de passe ne correspondent pas.'));
      return;
    }

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setDone(true);
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 3000);
    }
  };

  // ── Admin Blocked Render ───────────────────────────────────────────────────
  if (isAdminBlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="pt-10 pb-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-xl font-bold text-red-400">
                Action Interdite pour l'Admin
              </CardTitle>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Les comptes administrateurs ne sont pas autorisés à utiliser la réinitialisation automatique en ligne par courriel pour des motifs de haute sécurité.
              </p>
              <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800" onClick={() => navigate('/login')}>
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Success Render ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="pt-10 pb-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                {t('reset_password.success_title', 'Mot de passe mis à jour !')}
              </CardTitle>
              <p className="text-slate-400 text-xs sm:text-sm">
                {t('reset_password.success_desc_redirect', 'Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion…')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Waiting for Session Render ─────────────────────────────────────────────
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="pt-10 pb-8 text-center space-y-4">
              <div className="mx-auto h-12 w-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-400" />
              </div>
              <CardTitle className="text-xl font-bold text-white">
                {t('reset_password.checking_link', 'Vérification du lien de récupération…')}
              </CardTitle>
              <p className="text-slate-400 text-xs leading-relaxed">
                {t('reset_password.expired_hint', 'Si cette page reste bloquée, le lien de récupération est peut-être expiré ou déjà utilisé.')}
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800" onClick={() => navigate('/forgot-password')}>
                  Redemander un lien
                </Button>
                <Button className="bg-primary-600 hover:bg-primary-500 text-white" onClick={() => navigate('/login')}>
                  Se connecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Form Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center">
              <KeyRound className="h-7 w-7 text-primary-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {t('reset_password.new_password', 'Nouveau mot de passe')}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              {t('reset_password.choose_secure', "Choisissez un mot de passe sécurisé d'au moins 8 caractères.")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleReset}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                  <p className="text-xs text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-950 border-slate-800 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10 bg-slate-950 border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          password.length >= level * 3
                            ? level <= 1 ? 'bg-red-500'
                            : level <= 2 ? 'bg-amber-500'
                            : level <= 3 ? 'bg-yellow-400'
                            : 'bg-emerald-500'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-600/25 transition-all"
              >
                {loading ? t('common.loading', 'Mise à jour…') : t('reset_password.update', 'Mettre à jour le mot de passe')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
