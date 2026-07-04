import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase envoie le token dans l'URL sous la forme #access_token=...&type=recovery
  // onAuthStateChange l'intercepte automatiquement et ouvre une session temporaire.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      // Déconnecter et rediriger après 3 s pour forcer une reconnexion propre
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 3000);
    }
  };

  // ── Succès ────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="pt-10 pb-8 text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-secondary-900 mb-2">
                Mot de passe mis à jour !
              </CardTitle>
              <p className="text-secondary-500 text-sm">
                Vous allez être redirigé vers la page de connexion dans quelques secondes…
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Attente de la session Supabase ─────────────────────────────────────────
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="pt-10 pb-8 text-center">
              <div className="mx-auto h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-xl font-bold text-secondary-900 mb-2">
                Vérification du lien…
              </CardTitle>
              <p className="text-secondary-500 text-sm mb-4">
                Si ce message persiste, votre lien de réinitialisation est peut-être expiré.
              </p>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Formulaire de nouveau mot de passe ────────────────────────────────────
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="h-6 w-6 text-primary-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-secondary-900">
              Nouveau mot de passe
            </CardTitle>
            <CardDescription>
              Choisissez un mot de passe sécurisé d'au moins 8 caractères.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="mt-2 space-y-4" onSubmit={handleReset}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Nouveau mot de passe */}
              <div className="relative">
                <Lock className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="!pl-14 !pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>

              {/* Confirmation */}
              <div className="relative">
                <Lock className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirmer le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="!pl-14"
                />
              </div>

              {/* Indicateur de force */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          password.length >= level * 3
                            ? level <= 1 ? 'bg-red-400'
                            : level <= 2 ? 'bg-amber-400'
                            : level <= 3 ? 'bg-yellow-400'
                            : 'bg-green-500'
                            : 'bg-secondary-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-secondary-400">
                    {password.length < 6 ? 'Trop court' : password.length < 8 ? 'Faible' : password.length < 12 ? 'Moyen' : 'Fort'}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
