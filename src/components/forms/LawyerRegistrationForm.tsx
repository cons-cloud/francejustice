import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Mail, Lock, User as UserIcon, Briefcase, FileText, MapPin, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface LawyerRegistrationFormProps {
  onClose?: () => void;
}

const LawyerRegistrationForm: React.FC<LawyerRegistrationFormProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    barAssociation: '',
    licenseNumber: '',
    experience: '',
    city: '',
    country: 'France',
    postalCode: '',
  });

  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
            role: 'lawyer',
            phone: form.phone,
            city: form.city,
            country: form.country,
            postal_code: form.postalCode,
            bar_association: form.barAssociation,
            license_number: form.licenseNumber,
            experience: form.experience
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Handle File Uploads (Simulation of bucket upload)
        if (files && files.length > 0) {
          // In a real scenario: supabase.storage.from('verification-docs').upload(...)
        }

        alert('Candidature soumise avec succès ! Un administrateur vérifiera votre compte.');
        if (onClose) onClose();
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
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
              <ShieldCheck className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-secondary-900">
              Inscription Professionnelle
            </h2>
            <p className="text-secondary-600 mt-2">
              Rejoignez notre réseau d'avocats certifiés
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
                  placeholder="Email Pro"
                  className="!pl-14"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="relative">
                <Input
                  required
                  placeholder="Téléphone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
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

            <div className="space-y-4">
              <div className="relative">
                <Briefcase className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  required
                  placeholder="Barreau (Casablanca...)"
                  className="!pl-14"
                  value={form.barAssociation}
                  onChange={(e) => setForm({ ...form, barAssociation: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <FileText className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                  <Input
                    required
                    placeholder="Licence"
                    className="!pl-14"
                    value={form.licenseNumber}
                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  />
                </div>
                <Input
                  required
                  placeholder="Expérience (ans)"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <MapPin className="absolute left-5 top-3 h-5 w-5 text-secondary-400" />
                <Input
                  placeholder="Ville"
                  className="!pl-14"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <Input
                placeholder="Code postal"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-700 mb-2 block">
                Documents justificatifs (Carte professionnelle, diplôme...)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-secondary-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-secondary-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                      <span>Télécharger des fichiers</span>
                      <input 
                        type="file" 
                        className="sr-only" 
                        multiple 
                        onChange={(e) => setFiles(e.target.files)} 
                      />
                    </label>
                  </div>
                  <p className="text-xs text-secondary-500">PNG, JPG, PDF jusqu'à 10MB</p>
                </div>
              </div>
            </div>

            <Button className="w-full h-12 text-lg" disabled={loading}>
              {loading ? 'Traitement en cours...' : 'Soumettre ma candidature'}
            </Button>
            
            <p className="text-center text-sm text-secondary-600">
              Déjà inscrit ?{' '}
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

export default LawyerRegistrationForm;