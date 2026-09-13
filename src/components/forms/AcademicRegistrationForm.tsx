import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  Building,
  AlertCircle,
  Lock,
  Mail
} from 'lucide-react';

export type AcademicRole = 'student' | 'professor' | 'doctorate';

interface AcademicRegistrationFormProps {
  onClose?: () => void;
  defaultRole?: AcademicRole;
}

const AcademicRegistrationForm: React.FC<AcademicRegistrationFormProps> = ({ 
  onClose,
  defaultRole = 'student'
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };
  
  // Determine role from props or URL query
  const queryRole = searchParams.get('role') as AcademicRole | null;
  const initialRole: AcademicRole = queryRole || defaultRole;

  const [role, setRole] = useState<AcademicRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    university: '',
    studyLevel: 'Master 1',
    academicTitle: 'Professeur des Universités',
    specialty: 'Droit Privé & Sciences Criminelles',
    thesisTopic: '',
    thesisYear: '1ère année de Thèse',
  });

  useEffect(() => {
    if (queryRole) {
      setRole(queryRole);
    }
  }, [queryRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim() || !form.university.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (role === 'doctorate' && !form.thesisTopic.trim()) {
      setError("Le sujet de thèse est obligatoire pour les doctorants.");
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            role: role,
            university: form.university,
            study_level: role === 'student' ? form.studyLevel : undefined,
            academic_title: role === 'professor' ? form.academicTitle : undefined,
            specialty: role === 'professor' ? form.specialty : undefined,
            thesis_topic: role === 'doctorate' ? form.thesisTopic : undefined,
            thesis_year: role === 'doctorate' ? form.thesisYear : undefined,
          }
        }
      });

      if (authError && !authError.message.includes('User already registered')) {
        throw authError;
      }

      const userId = authData.user?.id || `user_${Date.now()}`;

      // 2. Insert or Upsert main user profile in profiles_just
      await supabase.from('profiles_just').upsert([{
        id: userId,
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        role: role,
        university: form.university,
        specialty: role === 'professor' ? form.specialty : (role === 'doctorate' ? form.thesisTopic : form.studyLevel),
        is_verified: true,
      }], { onConflict: 'id' });

      // 3. Insert full academic details in academic_profiles_just
      await supabase.from('academic_profiles_just').upsert([{
        id: userId,
        role: role,
        university: form.university,
        study_level: role === 'student' ? form.studyLevel : null,
        academic_title: role === 'professor' ? form.academicTitle : null,
        specialty: role === 'professor' ? form.specialty : null,
        thesis_topic: role === 'doctorate' ? form.thesisTopic : null,
        thesis_year: role === 'doctorate' ? form.thesisYear : null,
        status: 'verified'
      }], { onConflict: 'id' });

      setShowSuccessModal(true);

    } catch (err: any) {
      console.error("Erreur lors de l'inscription académique :", err);
      setError(err.message || "Une erreur est survenue lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  const roleTitles = {
    student: {
      title: "Inscription Étudiant en Droit",
      badge: "🎓 Profil Étudiant",
      description: "Accédez gratuitement aux salles de classe virtuelles, résumés de cours et assistant IA."
    },
    professor: {
      title: "Inscription Enseignant / Professeur",
      badge: "👨‍🏫 Profil Enseignant",
      description: "Animez des amphithéâtres virtuels, publiez des cours et transmettez votre savoir académique."
    },
    doctorate: {
      title: "Inscription Doctorant / Chercheur",
      badge: "🔬 Profil Doctorant",
      description: "Publiez vos travaux de recherche, participez aux revues scientifiques et colloques juridiques."
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-white to-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-900 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center text-slate-500 hover:text-cyan-600 transition-colors text-sm font-semibold gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </button>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-600" /> France Justice Académie
            </span>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => { setRole('student'); setError(null); }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'student'
                ? 'bg-cyan-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Étudiant</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('professor'); setError(null); }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'professor'
                ? 'bg-cyan-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Professeur</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('doctorate'); setError(null); }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'doctorate'
                ? 'bg-cyan-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Doctorant</span>
          </button>
        </div>

        {/* Form Card */}
        <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            
            {/* Header Title */}
            <div className="border-b border-slate-100 pb-5 text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                {roleTitles[role].badge}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {roleTitles[role].title}
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto">
                {roleTitles[role].description}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Streamlined Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
                  <Input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Jean"
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
                  <Input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Dupont"
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Email Universitaire / Professionnelle *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="prenom.nom@univ.fr"
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 pl-10!"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 pl-10! pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role-Specific Field 1: University */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {role === 'student' && 'Université / Faculté de Droit *'}
                  {role === 'professor' && 'Université / Établissement d\'enseignement *'}
                  {role === 'doctorate' && 'Université / Laboratoire de recherche *'}
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    required
                    value={form.university}
                    onChange={e => setForm({ ...form, university: e.target.value })}
                    placeholder="ex: Université Paris 1 Panthéon-Sorbonne"
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 pl-10!"
                  />
                </div>
              </div>

              {/* Role-Specific Field 2 */}
              {role === 'student' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Niveau d'études *</label>
                  <select
                    value={form.studyLevel}
                    onChange={e => setForm({ ...form, studyLevel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  >
                    <option value="Licence 1">Licence 1 (L1 Droit)</option>
                    <option value="Licence 2">Licence 2 (L2 Droit)</option>
                    <option value="Licence 3">Licence 3 (L3 Droit)</option>
                    <option value="Master 1">Master 1 (M1 Droit)</option>
                    <option value="Master 2">Master 2 (M2 Droit)</option>
                    <option value="IEJ / Prépa CRFPA">IEJ / Prépa CRFPA</option>
                    <option value="Élève-Avocat (EFB / EDA)">Élève-Avocat (EFB / EDA)</option>
                  </select>
                </div>
              )}

              {role === 'professor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Titre / Grade Académique *</label>
                    <select
                      value={form.academicTitle}
                      onChange={e => setForm({ ...form, academicTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                    >
                      <option value="Professeur des Universités">Professeur des Universités (PU)</option>
                      <option value="Maître de Conférences">Maître de Conférences (MCU)</option>
                      <option value="Enseignant-Chercheur">Enseignant-Chercheur</option>
                      <option value="Professeur Agrégé (PRAG)">Professeur Agrégé (PRAG)</option>
                      <option value="Intervenant Juridique">Intervenant / Formateur Juridique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Discipline d'enseignement *</label>
                    <Input
                      type="text"
                      required
                      value={form.specialty}
                      onChange={e => setForm({ ...form, specialty: e.target.value })}
                      placeholder="ex: Droit Privé, Droit des Affaires"
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {role === 'doctorate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Année de Thèse *</label>
                    <select
                      value={form.thesisYear}
                      onChange={e => setForm({ ...form, thesisYear: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                    >
                      <option value="1ère année de Thèse">1ère année de Thèse</option>
                      <option value="2ème année de Thèse">2ème année de Thèse</option>
                      <option value="3ème année de Thèse">3ème année de Thèse</option>
                      <option value="4ème année et +">4ème année et +</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sujet de Thèse de Doctorat *</label>
                    <Input
                      type="text"
                      required
                      value={form.thesisTopic}
                      onChange={e => setForm({ ...form, thesisTopic: e.target.value })}
                      placeholder="ex: La régulation juridique de l'Intelligence Artificielle en Europe"
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-base shadow-md shadow-cyan-600/25 transition-all"
                >
                  {loading ? "Création du compte..." : `Créer mon compte ${role === 'student' ? 'Étudiant' : role === 'professor' ? 'Professeur' : 'Doctorant'}`}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <Modal isOpen={true} onClose={() => navigate('/login')}>
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              Compte créé avec succès !
            </h3>

            <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
              Félicitations <strong className="text-slate-900">{form.firstName} {form.lastName}</strong>. Votre profil <strong className="text-cyan-700">{roleTitles[role].badge}</strong> a été créé et activé immédiatement.
            </p>

            <div className="pt-4 flex flex-col gap-2">
              <Button
                onClick={() => navigate(role === 'student' ? '/dashboard/user' : '/dashboard/lawyer')}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md shadow-cyan-600/25"
              >
                Accéder à mon Espace {role === 'student' ? 'Étudiant' : role === 'professor' ? 'Enseignant' : 'Doctorant'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AcademicRegistrationForm;
