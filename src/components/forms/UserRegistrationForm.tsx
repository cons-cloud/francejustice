import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { UserPlus, Mail, Lock, User as UserIcon, MapPin, Calendar, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface UserRegistrationFormProps {
  onClose?: () => void;
  type?: 'user' | 'lawyer';
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    country: 'France',
    postalCode: '',
    birthDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.email !== form.confirmEmail) {
      setError("Les emails ne correspondent pas");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      // 1. Sign Up in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            city: form.city,
            country: form.country,
            postal_code: form.postalCode,
            birth_date: form.birthDate,
            role: 'user'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        alert('Compte créé avec succès ! Veuillez vérifier votre email.');
        if (onClose) onClose();
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 py-12 px-4 relative">
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center text-secondary-600 hover:text-primary-600 font-medium transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
        Retour à l'accueil
      </Link>

      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-secondary-900">
              Créer un compte citoyen
            </h2>
            <p className="text-secondary-600 mt-2">
              Rejoignez Just-Law pour gérer vos démarches juridiques
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md font-medium">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <UserIcon className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  required
                  placeholder="Prénom"
                  className="!pl-14"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="relative">
                <UserIcon className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  required
                  placeholder="Nom"
                  className="!pl-14"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Mail className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  type="email"
                  required
                  placeholder="Email"
                  className="!pl-14"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  type="email"
                  required
                  placeholder="Confirmer"
                  className="!pl-14"
                  value={form.confirmEmail}
                  onChange={(e) => setForm({ ...form, confirmEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Lock className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mot de passe"
                  className="!pl-14 !pr-12"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Confirmer"
                  className="!pl-14 !pr-12"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-1">
                <MapPin className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  placeholder="Ville"
                  className="!pl-14"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="relative md:col-span-1">
                <Input
                  placeholder="CP"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
              <div className="relative md:col-span-1">
                <Calendar className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  type="date"
                  className="!pl-14"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>
            </div>

            <Button className="w-full h-10 text-base font-bold mt-2" disabled={loading}>
              {loading ? 'Création en cours...' : 'Créer mon compte citoyen'}
            </Button>

            <p className="text-center text-sm text-secondary-600">
              Déjà un compte ?{' '}
              <button
                type="button"
                className="text-primary-600 font-semibold hover:underline"
                onClick={() => navigate('/login')}
              >
                Se connecter
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRegistrationForm;