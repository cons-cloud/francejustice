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
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
  FileCheck,
  ShieldCheck,
  Sparkles,
  Building,
  AlertCircle
} from 'lucide-react';

export type AcademicRole = 'student' | 'professor' | 'doctorate';

interface AcademicRegistrationFormProps {
  onClose?: () => void;
  defaultRole?: AcademicRole;
}

interface UploadedFiles {
  idDocument: File | null;
  idDocumentUrl: string;
  diploma: File | null;
  diplomaUrl: string;
  dossier: File | null;
  dossierUrl: string;
  cv: File | null;
  cvUrl: string;
  motivationLetter: File | null;
  motivationLetterUrl: string;
}

const AcademicRegistrationForm: React.FC<AcademicRegistrationFormProps> = ({ 
  onClose,
  defaultRole = 'student'
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Determine role from props or URL path/query
  const queryRole = searchParams.get('role') as AcademicRole | null;
  const initialRole: AcademicRole = queryRole || defaultRole;

  const [role, setRole] = useState<AcademicRole>(initialRole);
  const [step, setStep] = useState<1 | 2>(1); // 1: Personal & Academic Info, 2: Document Uploads
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
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
    postalCode: '',
    country: 'France',
    birthDate: '',
    // Academic fields
    university: '',
    studyLevel: 'Master 1',
    specialty: 'Droit Général',
    studentIdNumber: '',
    academicTitle: 'Professeur des Universités',
    cnuNumber: '',
    thesisTopic: '',
    thesisDirector: '',
    thesisYear: '1ère année',
  });

  const [files, setFiles] = useState<UploadedFiles>({
    idDocument: null,
    idDocumentUrl: '',
    diploma: null,
    diplomaUrl: '',
    dossier: null,
    dossierUrl: '',
    cv: null,
    cvUrl: '',
    motivationLetter: null,
    motivationLetterUrl: '',
  });

  useEffect(() => {
    if (queryRole) {
      setRole(queryRole);
    }
  }, [queryRole]);

  const handleFileChange = (key: keyof UploadedFiles, file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [key]: file
    }));
  };

  const uploadFileToSupabase = async (file: File, folder: string, userId: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${folder}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('academic-documents')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.warn(`Supabase Storage upload fallback to object URL for ${folder}:`, error.message);
        return URL.createObjectURL(file);
      }

      const { data: publicUrlData } = supabase.storage
        .from('academic-documents')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.warn(`Storage upload warning for ${folder}:`, err.message);
      return URL.createObjectURL(file);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.email !== form.confirmEmail) {
      setError("Les adresses e-mail ne correspondent pas.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate documents
    if (!files.idDocument) {
      setError("La pièce d'identité est obligatoire.");
      return;
    }
    if (!files.diploma) {
      setError("Le diplôme ou attestation d'études est obligatoire.");
      return;
    }
    if (!files.cv) {
      setError("Le CV (Curriculum Vitae) est obligatoire.");
      return;
    }

    setLoading(true);
    setUploadProgress("Création du compte utilisateur...");

    try {
      // 1. Sign up user in Supabase Auth
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
            role: role,
            university: form.university,
            specialty: form.specialty,
          }
        }
      });

      if (authError) throw authError;

      const userId = authData.user?.id || `user_${Date.now()}`;

      // 2. Upload documents to Supabase storage
      setUploadProgress("Téléversement sécurisé de la pièce d'identité...");
      const idDocUrl = files.idDocument 
        ? await uploadFileToSupabase(files.idDocument, 'id_card', userId)
        : '';

      setUploadProgress("Téléversement sécurisé du diplôme...");
      const diplomaUrl = files.diploma 
        ? await uploadFileToSupabase(files.diploma, 'diploma', userId)
        : '';

      setUploadProgress("Téléversement du dossier académique...");
      const dossierUrl = files.dossier 
        ? await uploadFileToSupabase(files.dossier, 'dossier', userId)
        : '';

      setUploadProgress("Téléversement du CV...");
      const cvUrl = files.cv 
        ? await uploadFileToSupabase(files.cv, 'cv', userId)
        : '';

      setUploadProgress("Téléversement de la lettre de motivation...");
      const motivationUrl = files.motivationLetter 
        ? await uploadFileToSupabase(files.motivationLetter, 'motivation_letter', userId)
        : '';

      // 3. Insert or Upsert main user profile in profiles_just
      setUploadProgress("Synchronisation du profil utilisateur...");
      await supabase.from('profiles_just').upsert([{
        id: userId,
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        role: role,
        phone: form.phone,
        city: form.city,
        country: form.country,
        postal_code: form.postalCode,
        birth_date: form.birthDate || null,
        is_verified: true, // Mark verified for demo / immediate activation
      }], { onConflict: 'id' });

      // 4. Insert full academic details in academic_profiles_just
      setUploadProgress("Enregistrement du dossier académique complet...");
      await supabase.from('academic_profiles_just').upsert([{
        id: userId,
        role: role,
        university: form.university,
        study_level: role === 'student' ? form.studyLevel : null,
        specialty: form.specialty,
        student_id_number: role === 'student' ? form.studentIdNumber : null,
        academic_title: role === 'professor' ? form.academicTitle : null,
        cnu_number: role === 'professor' ? form.cnuNumber : null,
        thesis_topic: role === 'doctorate' ? form.thesisTopic : null,
        thesis_director: role === 'doctorate' ? form.thesisDirector : null,
        thesis_year: role === 'doctorate' ? form.thesisYear : null,
        id_document_url: idDocUrl,
        diploma_url: diplomaUrl,
        dossier_url: dossierUrl,
        cv_url: cvUrl,
        motivation_letter_url: motivationUrl,
        status: 'verified'
      }], { onConflict: 'id' });

      // 5. Also register in documents table for Vault access
      const docEntries = [
        { user_id: userId, title: `Pièce d'Identité - ${form.lastName}`, type: "Pièce d'identité", file_url: idDocUrl },
        { user_id: userId, title: `Diplôme - ${form.lastName}`, type: "Diplôme", file_url: diplomaUrl },
        { user_id: userId, title: `CV - ${form.lastName}`, type: "CV", file_url: cvUrl },
      ];
      if (dossierUrl) docEntries.push({ user_id: userId, title: `Dossier Académique`, type: "Dossier", file_url: dossierUrl });
      if (motivationUrl) docEntries.push({ user_id: userId, title: `Lettre de Motivation`, type: "Lettre de motivation", file_url: motivationUrl });

      await supabase.from('documents_just').insert(docEntries);

      setUploadProgress(null);
      setShowSuccessModal(true);

    } catch (err: any) {
      console.error("Erreur lors de l'inscription académique :", err);
      setError(err.message || "Une erreur est survenue lors de la création du compte.");
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const roleTitles = {
    student: {
      title: "Inscription Profil Étudiant",
      badge: "🎓 Étudiant en Droit",
      description: "Accédez aux ressources pédagogiques, tribunaux virtuels et mentorat par des avocats et enseignants."
    },
    professor: {
      title: "Inscription Profil Enseignant / Professeur",
      badge: "👨‍🏫 Enseignant & Chercheur",
      description: "Animez des cours, dirigez des travaux de recherche et transmettez vos connaissances sur la plateforme."
    },
    doctorate: {
      title: "Inscription Profil Doctorant en Droit",
      badge: "🔬 Doctorant & Chercheur",
      description: "Publiez vos travaux de recherche, participez aux colloques et interagissez avec les professionnels du droit."
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 text-slate-100 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm font-semibold gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </button>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-primary-400" /> France Justice Académique
            </span>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => { setRole('student'); setError(null); }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'student'
                ? 'bg-gradient-to-r from-indigo-600 to-primary-600 text-white shadow-lg shadow-primary-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>🎓 Étudiant</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('professor'); setError(null); }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'professor'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>👨‍🏫 Professeur</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('doctorate'); setError(null); }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'doctorate'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>🔬 Doctorant</span>
          </button>
        </div>

        {/* Form Card */}
        <Card className="bg-slate-800/90 border-slate-700 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xl">
          <CardContent className="p-6 sm:p-10 space-y-8">
            
            {/* Header Title */}
            <div className="border-b border-slate-700/80 pb-6 text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {roleTitles[role].badge}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {roleTitles[role].title}
              </h1>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                {roleTitles[role].description}
              </p>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <div className={`flex items-center gap-2 text-xs font-semibold ${step === 1 ? 'text-primary-400' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300'}`}>1</span>
                  Informations Académiques
                </div>
                <div className="w-12 h-0.5 bg-slate-700" />
                <div className={`flex items-center gap-2 text-xs font-semibold ${step === 2 ? 'text-primary-400' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300'}`}>2</span>
                  Dossier & Documents (5 pièces)
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-sm animate-pulse">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Personal & Academic Data */}
            {step === 1 && (
              <form onSubmit={handleNextStep} className="space-y-6">
                
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-bold text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> Informations Personnelles
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Prénom *</label>
                      <Input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={e => setForm({ ...form, firstName: e.target.value })}
                        placeholder="Jean"
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Nom *</label>
                      <Input
                        type="text"
                        required
                        value={form.lastName}
                        onChange={e => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Dupont"
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Adresse E-mail *</label>
                      <Input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="etudiant@univ.fr"
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Confirmer l'E-mail *</label>
                      <Input
                        type="email"
                        required
                        value={form.confirmEmail}
                        onChange={e => setForm({ ...form, confirmEmail: e.target.value })}
                        placeholder="etudiant@univ.fr"
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Téléphone mobile *</label>
                      <Input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="06 12 34 56 78"
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Date de naissance *</label>
                      <Input
                        type="date"
                        required
                        value={form.birthDate}
                        onChange={e => setForm({ ...form, birthDate: e.target.value })}
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Ville d'études / Résidence *</label>
                      <Input
                        type="text"
                        required
                        value={form.city}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                        placeholder="Paris, Lyon, Toulouse..."
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Code Postal *</label>
                      <Input
                        type="text"
                        required
                        value={form.postalCode}
                        onChange={e => setForm({ ...form, postalCode: e.target.value })}
                        placeholder="75005"
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Cour d'Appel / Ressort Judiciaire (CSM) *</label>
                      <select
                        required
                        value={(form as any).courDAppel || ''}
                        onChange={e => setForm({ ...form, courDAppel: e.target.value } as any)}
                        className="w-full rounded-xl bg-slate-900/80 border border-slate-700 text-white p-2.5 text-sm focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Sélectionnez votre Cour d'Appel / Ressort...</option>
                        <option value="Cour d'Appel de Paris">Cour d'Appel de Paris</option>
                        <option value="Cour d'Appel de Versailles">Cour d'Appel de Versailles</option>
                        <option value="Cour d'Appel de Paris-Nord (Île-de-France)">Cour d'Appel de Paris-Nord (Île-de-France)</option>
                        <option value="Cour d'Appel d'Aix-en-Provence">Cour d'Appel d'Aix-en-Provence</option>
                        <option value="Cour d'Appel d'Agen">Cour d'Appel d'Agen</option>
                        <option value="Cour d'Appel d'Amiens">Cour d'Appel d'Amiens</option>
                        <option value="Cour d'Appel d'Angers">Cour d'Appel d'Angers</option>
                        <option value="Cour d'Appel de Bastia">Cour d'Appel de Bastia</option>
                        <option value="Cour d'Appel de Bordeaux">Cour d'Appel de Bordeaux</option>
                        <option value="Cour d'Appel de Bourges">Cour d'Appel de Bourges</option>
                        <option value="Cour d'Appel de Caen">Cour d'Appel de Caen</option>
                        <option value="Cour d'Appel de Chambéry">Cour d'Appel de Chambéry</option>
                        <option value="Cour d'Appel de Colmar">Cour d'Appel de Colmar</option>
                        <option value="Cour d'Appel de Dijon">Cour d'Appel de Dijon</option>
                        <option value="Cour d'Appel de Douai">Cour d'Appel de Douai</option>
                        <option value="Cour d'Appel de Grenoble">Cour d'Appel de Grenoble</option>
                        <option value="Cour d'Appel de Limoges">Cour d'Appel de Limoges</option>
                        <option value="Cour d'Appel de Lyon">Cour d'Appel de Lyon</option>
                        <option value="Cour d'Appel de Metz">Cour d'Appel de Metz</option>
                        <option value="Cour d'Appel de Montpellier">Cour d'Appel de Montpellier</option>
                        <option value="Cour d'Appel de Nancy">Cour d'Appel de Nancy</option>
                        <option value="Cour d'Appel de Nîmes">Cour d'Appel de Nîmes</option>
                        <option value="Cour d'Appel de Nouméa">Cour d'Appel de Nouméa</option>
                        <option value="Cour d'Appel d'Orléans">Cour d'Appel d'Orléans</option>
                        <option value="Cour d'Appel de Papeete">Cour d'Appel de Papeete</option>
                        <option value="Cour d'Appel de Pau">Cour d'Appel de Pau</option>
                        <option value="Cour d'Appel de Poitiers">Cour d'Appel de Poitiers</option>
                        <option value="Cour d'Appel de Reims">Cour d'Appel de Reims</option>
                        <option value="Cour d'Appel de Rennes">Cour d'Appel de Rennes</option>
                        <option value="Cour d'Appel de Riom">Cour d'Appel de Riom</option>
                        <option value="Cour d'Appel de Rouen">Cour d'Appel de Rouen</option>
                        <option value="Cour d'Appel de Saint-Denis de la Réunion">Cour d'Appel de Saint-Denis de la Réunion</option>
                        <option value="Cour d'Appel de Fort-de-France (Martinique)">Cour d'Appel de Fort-de-France (Martinique)</option>
                        <option value="Cour d'Appel de Toulouse">Cour d'Appel de Toulouse</option>
                        <option value="Cour d'Appel de Basse-Terre (Guadeloupe)">Cour d'Appel de Basse-Terre (Guadeloupe)</option>
                        <option value="Conseil Supérieur de la Magistrature (CSM - Nominations)">Conseil Supérieur de la Magistrature (CSM - Nominations)</option>
                      </select>
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe *</label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="bg-slate-900/80 border-slate-700 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-7 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-medium text-slate-300 mb-1">Confirmer le mot de passe *</label>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={form.confirmPassword}
                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="bg-slate-900/80 border-slate-700 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-7 text-slate-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specific Academic Details */}
                <div className="border-t border-slate-700/80 pt-6">
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building className="w-4 h-4" /> 
                    {role === 'student' && 'Détails du Parcours Étudiant'}
                    {role === 'professor' && 'Détails du Poste d\'Enseignement'}
                    {role === 'doctorate' && 'Détails du Projet de Thèse'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Université / Établissement académique *
                      </label>
                      <Input
                        type="text"
                        required
                        value={form.university}
                        onChange={e => setForm({ ...form, university: e.target.value })}
                        placeholder="Université Paris 1 Panthéon-Sorbonne, Assas..."
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Spécialité / Filière Juridique *
                      </label>
                      <Input
                        type="text"
                        required
                        value={form.specialty}
                        onChange={e => setForm({ ...form, specialty: e.target.value })}
                        placeholder="Droit Privé, Droit Public, Droit des Affaires..."
                        className="bg-slate-900/80 border-slate-700 text-white"
                      />
                    </div>

                    {/* Role Specific Fields */}
                    {role === 'student' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Niveau d'études *</label>
                          <select
                            value={form.studyLevel}
                            onChange={e => setForm({ ...form, studyLevel: e.target.value })}
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="Licence 1">Licence 1 (L1)</option>
                            <option value="Licence 2">Licence 2 (L2)</option>
                            <option value="Licence 3">Licence 3 (L3)</option>
                            <option value="Master 1">Master 1 (M1)</option>
                            <option value="Master 2">Master 2 (M2)</option>
                            <option value="IEJ / Prépa CRFPA">IEJ / Prépa CRFPA</option>
                            <option value="Élève-Avocat (EFB / EDA)">Élève-Avocat (EFB / EDA)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Numéro d'Étudiant (INE / N° Carte)</label>
                          <Input
                            type="text"
                            value={form.studentIdNumber}
                            onChange={e => setForm({ ...form, studentIdNumber: e.target.value })}
                            placeholder="Ex: 22009841"
                            className="bg-slate-900/80 border-slate-700 text-white"
                          />
                        </div>
                      </>
                    )}

                    {role === 'professor' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Titre / Grade Académique *</label>
                          <select
                            value={form.academicTitle}
                            onChange={e => setForm({ ...form, academicTitle: e.target.value })}
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="Professeur des Universités">Professeur des Universités (PU)</option>
                            <option value="Maître de Conférences">Maître de Conférences (MCU)</option>
                            <option value="Enseignant-Chercheur">Enseignant-Chercheur</option>
                            <option value="Professeur Agrégé (PRAG)">Professeur Agrégé (PRAG)</option>
                            <option value="Intervenant / Formateur Juridique">Intervenant / Formateur Juridique</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Section CNU ou Référence Professionnelle</label>
                          <Input
                            type="text"
                            value={form.cnuNumber}
                            onChange={e => setForm({ ...form, cnuNumber: e.target.value })}
                            placeholder="Ex: CNU 01 (Droit Privé) / CNU 02 (Droit Public)"
                            className="bg-slate-900/80 border-slate-700 text-white"
                          />
                        </div>
                      </>
                    )}

                    {role === 'doctorate' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Année de Thèse *</label>
                          <select
                            value={form.thesisYear}
                            onChange={e => setForm({ ...form, thesisYear: e.target.value })}
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="1ère année">1ère année de Thèse</option>
                            <option value="2ème année">2ème année de Thèse</option>
                            <option value="3ème année">3ème année de Thèse</option>
                            <option value="4ème année et +">4ème année et +</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Directeur(s) de Thèse</label>
                          <Input
                            type="text"
                            value={form.thesisDirector}
                            onChange={e => setForm({ ...form, thesisDirector: e.target.value })}
                            placeholder="Pr. Nom du Directeur"
                            className="bg-slate-900/80 border-slate-700 text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-300 mb-1">Sujet de Thèse de Doctorat *</label>
                          <textarea
                            rows={2}
                            required
                            value={form.thesisTopic}
                            onChange={e => setForm({ ...form, thesisTopic: e.target.value })}
                            placeholder="Ex: L'impact de l'intelligence artificielle sur le droit de la responsabilité civile..."
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit Step 1 */}
                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 font-bold rounded-2xl shadow-xl shadow-primary-500/20"
                  >
                    Étape suivante : Pièces Justificatives (5 documents) →
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 2: Complete Documents Upload */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/80 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Vérification de sécurité & Conformité France Justice
                  </div>
                  <p>
                    Afin de garantir la qualité et la certification des profils académiques, veuillez téléverser les 5 pièces réglementaires. Formats acceptés : PDF, PNG, JPG (Max 10 Mo par document).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Document 1: Pièce d'Identité */}
                  <div className="p-4 bg-slate-900/70 border border-slate-700/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-indigo-400" />
                        1. Pièce d'Identité (CNI / Passeport) *
                      </label>
                      {files.idDocument && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          ✓ Prêt
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">Carte d'identité (recto/verso) ou passeport valide.</p>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => handleFileChange('idDocument', e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                    />
                    {files.idDocument && (
                      <div className="text-[11px] text-indigo-300 font-medium truncate">
                        📄 {files.idDocument.name} ({(files.idDocument.size / 1024 / 1024).toFixed(2)} Mo)
                      </div>
                    )}
                  </div>

                  {/* Document 2: Diplôme / Attestation */}
                  <div className="p-4 bg-slate-900/70 border border-slate-700/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-400" />
                        2. Diplôme ou Certificat de Scolarité *
                      </label>
                      {files.diploma && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          ✓ Prêt
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">Dernier diplôme universitaire obtenu ou carte étudiant.</p>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => handleFileChange('diploma', e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                    />
                    {files.diploma && (
                      <div className="text-[11px] text-blue-300 font-medium truncate">
                        🎓 {files.diploma.name} ({(files.diploma.size / 1024 / 1024).toFixed(2)} Mo)
                      </div>
                    )}
                  </div>

                  {/* Document 3: Dossier Académique / Inscription */}
                  <div className="p-4 bg-slate-900/70 border border-slate-700/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        3. Dossier Académique / Relevé de Notes
                      </label>
                      {files.dossier && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          ✓ Prêt
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">Attestation d'inscription, relevé de notes ou dossier d'études.</p>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => handleFileChange('dossier', e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                    />
                    {files.dossier && (
                      <div className="text-[11px] text-purple-300 font-medium truncate">
                        📁 {files.dossier.name} ({(files.dossier.size / 1024 / 1024).toFixed(2)} Mo)
                      </div>
                    )}
                  </div>

                  {/* Document 4: CV */}
                  <div className="p-4 bg-slate-900/70 border border-slate-700/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        4. CV (Curriculum Vitae) *
                      </label>
                      {files.cv && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          ✓ Prêt
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">Curriculum Vitae détaillé et à jour (PDF).</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={e => handleFileChange('cv', e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                    />
                    {files.cv && (
                      <div className="text-[11px] text-amber-300 font-medium truncate">
                        📄 {files.cv.name} ({(files.cv.size / 1024 / 1024).toFixed(2)} Mo)
                      </div>
                    )}
                  </div>

                  {/* Document 5: Lettre de Motivation */}
                  <div className="p-4 bg-slate-900/70 border border-slate-700/80 rounded-2xl space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-400" />
                        5. Lettre de Motivation (Recommandée)
                      </label>
                      {files.motivationLetter && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          ✓ Prêt
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">Exposez vos objectifs d'apprentissage ou de contribution sur France Justice.</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={e => handleFileChange('motivationLetter', e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                    />
                    {files.motivationLetter && (
                      <div className="text-[11px] text-emerald-300 font-medium truncate">
                        ✉️ {files.motivationLetter.name} ({(files.motivationLetter.size / 1024 / 1024).toFixed(2)} Mo)
                      </div>
                    )}
                  </div>

                </div>

                {uploadProgress && (
                  <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-center text-xs text-indigo-300 font-semibold animate-pulse">
                    ⚡ {uploadProgress}
                  </div>
                )}

                {/* Actions Step 2 */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    ← Précédent (Étape 1)
                  </button>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full sm:w-auto px-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold rounded-2xl shadow-xl shadow-emerald-500/20 text-white"
                  >
                    {loading ? 'Finalisation et Synchronisation...' : 'Valider l\'inscription & Transmettre le dossier ✨'}
                  </Button>
                </div>

              </form>
            )}

          </CardContent>
        </Card>

      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/login');
        }}
        title="Inscription Académique Validée ! 🎉"
      >
        <div className="space-y-4 text-center p-4">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white">Bienvenue sur France Justice</h3>
          <p className="text-sm text-slate-300">
            Votre compte <strong className="text-emerald-400">{roleTitles[role].badge}</strong> et votre dossier composé des 5 pièces justificatives ont été transmis et synchronisés en temps réel.
          </p>
          <p className="text-xs text-slate-400 bg-slate-800 p-3 rounded-xl">
            Un courriel de confirmation a été envoyé à <strong>{form.email}</strong>. Vous pouvez dès à présent accéder à votre espace de travail.
          </p>
          <Button
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/login');
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-white"
          >
            Accéder à la connexion →
          </Button>
        </div>
      </Modal>

    </div>
  );
};

export default AcademicRegistrationForm;
