import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { Mail, ShieldAlert, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { useTranslation } from '../i18n';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAdminBlocked, setIsAdminBlocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsAdminBlocked(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(t('forgot_password.enter_email', 'Veuillez saisir votre adresse email.'));
      return;
    }

    setLoading(true);

    try {
      // 1. Check user role in profiles_just to enforce Admin Reset Prohibition
      const { data: profile } = await supabase
        .from('profiles_just')
        .select('role, first_name, last_name')
        .eq('email', cleanEmail)
        .maybeSingle();

      const userRole = profile?.role;

      if (userRole === 'admin' || cleanEmail.includes('admin@francejustice.com')) {
        setLoading(false);
        setIsAdminBlocked(true);
        setError(
          t(
            'forgot_password.admin_forbidden',
            '⚠️ Sécurité : Les comptes administrateurs ne peuvent pas réinitialiser leur mot de passe en ligne. Veuillez contacter la direction technique.'
          )
        );
        return;
      }

      // 2. Trigger Supabase Auth Password Reset Email for all other roles
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetErr) {
        throw resetErr;
      }

      // 3. Log password reset request in Supabase password_resets_just table for audit
      await supabase.from('password_resets_just').insert([{
        email: cleanEmail,
        user_role: userRole || 'user',
        requested_at: new Date().toISOString(),
        status: 'pending'
      }]);

      setSuccessMsg(
        t(
          'forgot_password.email_sent',
          'Un e-mail d\'instructions de réinitialisation sécurisé a été envoyé à votre adresse. Veuillez consulter votre boîte de réception.'
        )
      );
    } catch (err: any) {
      console.error('Password Reset Error:', err);
      setError(err.message || t('forgot_password.generic_error', 'Une erreur est survenue lors de l\'envoi de l\'email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-white to-slate-50 text-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center justify-center shadow-sm">
              <KeyRound className="h-7 w-7 text-cyan-600" />
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {t('forgot_password.title', 'Mot de passe oublié ?')}
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs sm:text-sm">
              {t(
                'forgot_password.subtitle',
                'Saisissez votre adresse email pour recevoir un lien de réinitialisation sécurisé (étudiants, professeurs, doctorants, avocats et citoyens).'
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Admin Blocked Alert */}
            {isAdminBlocked && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
                  <span>Réinitialisation Admin Interdite</span>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">
                  Pour des raisons de haute sécurité, les comptes avec le rôle Administrateur ne disposent pas de réinitialisation autonome par courriel. Contactez le responsable système de FranceJustice.
                </p>
              </div>
            )}

            {/* Error Banner */}
            {error && !isAdminBlocked && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs text-emerald-800 font-semibold">{successMsg}</p>
              </div>
            )}

            {!successMsg && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {t('forgot_password.label_email', 'Adresse Email de votre compte')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      required
                      placeholder="nom@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl shadow-md shadow-cyan-600/25 transition-all"
                >
                  {loading ? t('common.loading', 'Envoi en cours…') : t('forgot_password.btn_send', 'Envoyer le lien de réinitialisation')}
                </Button>
              </form>
            )}

            <div className="pt-2 text-center border-t border-slate-200">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-cyan-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('forgot_password.back_to_login', 'Retour à la page de connexion')}</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
