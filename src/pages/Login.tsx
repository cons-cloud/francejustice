import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { LogIn, Mail, Lock, ShieldCheck, User as UserIcon, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Veuillez vérifier votre boîte email et cliquer sur le lien de confirmation avant de vous connecter.');
      } else if (error.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    // Role will be fetched by AuthProvider and navigate accordingly
    // The AuthProvider's fetchProfile will update the state
  };

  // Auto-redirect if already logged in and role is known
  React.useEffect(() => {
    if (role) {
      if (role === 'admin') navigate('/dashboard/admin');
      else if (role === 'lawyer') navigate('/dashboard/lawyer');
      else navigate('/dashboard/user');
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center text-secondary-600 hover:text-primary-600 font-medium transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
        Retour à l'accueil
      </Link>

      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-primary-600" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-secondary-900">
              Bienvenue sur France Justice
            </CardTitle>
            <CardDescription>
              Connectez-vous à votre espace juridique sécurisé
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
                    placeholder="Adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="!pl-14"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="!pl-14 !pr-12"
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
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Mot de passe oublié ?
                  </a>
                </div>
              </div>

              <div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-secondary-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-secondary-500">Pas encore de compte ?</span>
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
                  Citoyen
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/register/lawyer')}
                  className="flex items-center justify-center"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Avocat
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