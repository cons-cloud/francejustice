import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { UserPlus, Mail, Lock, User as UserIcon, MapPin, Calendar, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Modal from '../ui/Modal';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
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
    role: 'user',
    university: '',
    specialty: '',
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
            university: form.university,
            specialty: form.specialty,
            role: form.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Upsert into profiles_just
        await supabase.from('profiles_just').upsert([{
          id: authData.user.id,
          first_name: form.firstName,
          last_name: form.lastName,
          role: form.role,
          email: form.email,
          city: form.city,
          country: form.country,
          postal_code: form.postalCode,
          university: form.university,
          specialty: form.specialty,
          is_verified: form.role === 'user' || form.role === 'student'
        }]);
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 py-12 px-4 relative">
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center text-slate-400 hover:text-white font-semibold transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
        Retour à l'accueil
      </Link>

      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 bg-primary-900/60 border border-primary-700/50 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-primary-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Créer un compte France Justice
            </h2>
            <p className="text-slate-300 mt-2 text-sm">
              Rejoignez France Justice pour gérer vos démarches juridiques
            </p>

            {/* Quick Profile Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'user' })}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left ${form.role === 'user' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              >
                👤 Citoyen
              </button>
              <button
                type="button"
                onClick={() => navigate('/register/student')}
                className="p-2.5 rounded-xl text-xs font-bold transition-all border text-left bg-indigo-950/80 border-indigo-700 text-indigo-300 hover:bg-indigo-900/80"
              >
                🎓 Étudiant →
              </button>
              <button
                type="button"
                onClick={() => navigate('/register/professor')}
                className="p-2.5 rounded-xl text-xs font-bold transition-all border text-left bg-blue-950/80 border-blue-700 text-blue-300 hover:bg-blue-900/80"
              >
                👨‍🏫 Professeur →
              </button>
              <button
                type="button"
                onClick={() => navigate('/register/doctorate')}
                className="p-2.5 rounded-xl text-xs font-bold transition-all border text-left bg-purple-950/80 border-purple-700 text-purple-300 hover:bg-purple-900/80"
              >
                🔬 Doctorant →
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-950/80 border-l-4 border-red-500 p-4 rounded-r-md font-medium">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Type de compte :</label>
              <select
                value={form.role}
                onChange={(e) => {
                  const r = e.target.value;
                  if (r === 'student') navigate('/register/student');
                  else if (r === 'professor') navigate('/register/professor');
                  else if (r === 'doctorate') navigate('/register/doctorate');
                  else if (r === 'lawyer') navigate('/register/lawyer');
                  else setForm({ ...form, role: r });
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="user">👤 Citoyen / Particulier</option>
                <option value="student">🎓 Étudiant en Droit (Dossier complet 5 pièces)</option>
                <option value="professor">👨‍🏫 Professeur de Droit (Dossier complet 5 pièces)</option>
                <option value="doctorate">🔬 Doctorant / Chercheur (Dossier complet 5 pièces)</option>
                <option value="lawyer">⚖️ Avocat au Barreau</option>
              </select>
            </div>

            {(form.role === 'student' || form.role === 'professor' || form.role === 'doctorate') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
                <div>
                  <label className="text-[11px] font-bold text-indigo-900">Université / Établissement :</label>
                  <Input
                    placeholder="ex: Université Paris 1 Panthéon-Sorbonne"
                    value={form.university}
                    onChange={(e) => setForm({ ...form, university: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-indigo-900">Spécialité / Discipline :</label>
                  <Input
                    placeholder="ex: Droit Privé / Droit Numérique & IA"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  />
                </div>
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
                  required
                  placeholder="Ville"
                  className="!pl-14"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="relative md:col-span-1">
                <Input
                  required
                  placeholder="CP"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
              <div className="relative md:col-span-1">
                <Calendar className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  required
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
                onClick={() => {
                  const redirect = new URLSearchParams(window.location.search).get('redirect');
                  navigate(`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`);
                }}
              >
                Se connecter
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          if (onClose) onClose();
          const redirect = new URLSearchParams(window.location.search).get('redirect');
          navigate(`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`);
        }}
        title="Inscription réussie"
      >
        <div className="text-center py-6">
          <div className="mx-auto h-16 w-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
            <UserIcon className="h-8 w-8 text-success-600" />
          </div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Bienvenue sur France Justice !</h3>
          <p className="text-secondary-600 mb-6">
            Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter à votre espace personnel.
          </p>
          <Button className="w-full" onClick={() => {
            setShowSuccessModal(false);
            if (onClose) onClose();
            const redirect = new URLSearchParams(window.location.search).get('redirect');
            navigate(`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`);
          }}>
            Aller à la connexion
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default UserRegistrationForm;