import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth, isUserAdmin } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { 
  Scale, 
  GraduationCap, 
  BookOpen, 
  Microscope, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Radio
} from 'lucide-react';

export type UserRoleType = 'lawyer' | 'professor' | 'doctorate' | 'student' | 'user';

interface RoleOption {
  id: UserRoleType;
  titleKey: string;
  defaultTitle: string;
  badgeKey: string;
  defaultBadge: string;
  destination: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgLight: string;
  borderColor: string;
  ringColor: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'lawyer',
    titleKey: 'role_selection.lawyer_title',
    defaultTitle: 'Avocat',
    badgeKey: 'role_selection.lawyer_badge',
    defaultBadge: 'Barreau',
    destination: '/dashboard/lawyer',
    icon: Scale,
    accentColor: 'text-cyan-600',
    bgLight: 'bg-cyan-50/70',
    borderColor: 'border-cyan-200',
    ringColor: 'ring-cyan-500',
  },
  {
    id: 'professor',
    titleKey: 'role_selection.professor_title',
    defaultTitle: 'Professeur de droit',
    badgeKey: 'role_selection.professor_badge',
    defaultBadge: 'Enseignement',
    destination: '/dashboard/lawyer',
    icon: GraduationCap,
    accentColor: 'text-indigo-600',
    bgLight: 'bg-indigo-50/70',
    borderColor: 'border-indigo-200',
    ringColor: 'ring-indigo-500',
  },
  {
    id: 'doctorate',
    titleKey: 'role_selection.doctorate_title',
    defaultTitle: 'Doctorant en droit',
    badgeKey: 'role_selection.doctorate_badge',
    defaultBadge: 'Recherche',
    destination: '/dashboard/lawyer',
    icon: Microscope,
    accentColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200',
    ringColor: 'ring-emerald-500',
  },
  {
    id: 'student',
    titleKey: 'role_selection.student_title',
    defaultTitle: 'Étudiant en droit',
    badgeKey: 'role_selection.student_badge',
    defaultBadge: 'Université',
    destination: '/dashboard/user',
    icon: BookOpen,
    accentColor: 'text-amber-600',
    bgLight: 'bg-amber-50/70',
    borderColor: 'border-amber-200',
    ringColor: 'ring-amber-500',
  },
  {
    id: 'user',
    titleKey: 'role_selection.citizen_title',
    defaultTitle: 'Citoyen / Justiciable',
    badgeKey: 'role_selection.citizen_badge',
    defaultBadge: 'Citoyen',
    destination: '/dashboard/user',
    icon: UserCheck,
    accentColor: 'text-blue-600',
    bgLight: 'bg-blue-50/70',
    borderColor: 'border-blue-200',
    ringColor: 'ring-blue-500',
  },
];

export const FirstTimeRoleSelector: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();
  const { t, language } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('user');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-redirect if user is admin
  useEffect(() => {
    if (isUserAdmin(user?.email, role)) {
      navigate('/dashboard/admin', { replace: true });
    }
  }, [user, role, navigate]);

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Utilisateur';

  const userEmail = user?.email || '';

  const handleConfirmRole = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Update in Supabase profiles_just
      const { error } = await supabase
        .from('profiles_just')
        .update({
          role: selectedRole,
          is_verified: selectedRole === 'user',
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // 2. Mark role_selected in user metadata & localStorage so the selector is never displayed again
      try {
        await supabase.auth.updateUser({
          data: { role_selected: true, role: selectedRole }
        });
      } catch (e) {
        console.warn('Metadata update notice:', e);
      }

      localStorage.setItem(`fj_role_selected_${user.id}`, 'true');
      localStorage.setItem('role', selectedRole);

      // 3. Determine target dashboard
      const selectedOption = ROLE_OPTIONS.find((opt) => opt.id === selectedRole);
      const destination = selectedOption?.destination || '/dashboard/user';

      // 4. Smooth redirection
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error('Erreur lors de la sélection du rôle :', err);
      setErrorMessage(err.message || 'Impossible d\'enregistrer votre profil. Veuillez réessayer.');
      setSubmitting(false);
    }
  };

  const currentOption = ROLE_OPTIONS.find((opt) => opt.id === selectedRole) || ROLE_OPTIONS[4];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-blue-50/30 flex flex-col items-center justify-center py-8 px-4 sm:px-6">
      <div className="max-w-3xl w-full space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100/80 border border-cyan-300 text-cyan-900 text-[11px] font-bold tracking-wide uppercase shadow-sm">
            <Radio className="w-3 h-3 text-cyan-600 animate-pulse" />
            {t('role_selection.badge_first_login', 'Première Connexion — Configuration du Profil')}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('role_selection.welcome', 'Bienvenue sur')}{' '}
            <span className="bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">France Justice</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            {t('role_selection.hello', 'Bonjour')}{' '}
            <strong className="text-slate-900">{displayName}</strong> ({userEmail}).{' '}
            {t('role_selection.prompt', 'Veuillez sélectionner votre statut :')}
          </p>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Compact, sleek Role Selection Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedRole === opt.id;
            const roleTitle = t(opt.titleKey, opt.defaultTitle);
            const roleBadge = t(opt.badgeKey, opt.defaultBadge);

            return (
              <div
                key={opt.id}
                onClick={() => setSelectedRole(opt.id)}
                className={`relative cursor-pointer rounded-lg p-2.5 border transition-all duration-150 flex flex-col justify-between select-none ${
                  isSelected
                    ? `${opt.borderColor} ${opt.bgLight} ring-1.5 ${opt.ringColor}`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
                style={{ minHeight: '74px' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${isSelected ? 'bg-white shadow-xs' : 'bg-slate-100'} ${opt.accentColor}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span
                    style={{ fontSize: '7.5px', lineHeight: '9px', letterSpacing: '0.05em' }}
                    className={`font-semibold uppercase px-1.5 py-0.5 rounded border ${
                      isSelected ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    {roleBadge}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 mt-auto pt-1">
                  <span
                    style={{
                      fontSize: '9.5px',
                      lineHeight: '12px',
                      fontWeight: isSelected ? 700 : 600,
                      letterSpacing: '-0.01em',
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}
                    className={isSelected ? 'text-slate-900 font-bold' : 'text-slate-700'}
                  >
                    {roleTitle}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-cyan-600 shrink-0 ml-0.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact Confirmation Action Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {t('role_selection.selected_profile', 'Profil sélectionné :')}{' '}
                <span className="text-cyan-700">{t(currentOption.titleKey, currentOption.defaultTitle)}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {t('role_selection.desc_customized', 'Votre tableau de bord sera configuré selon ce profil.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmRole}
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold text-xs shadow-xs hover:from-cyan-700 hover:to-blue-800 transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('role_selection.submitting', 'Synchronisation...')}
              </>
            ) : (
              <>
                {t('role_selection.confirm_btn', 'Valider & Continuer')}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="text-center text-[11px] text-slate-400">
          {t('role_selection.footer_note', 'Plateforme France Justice — Synchronisation instantanée et sécurisée.')}
        </div>

      </div>
    </div>
  );
};

export default FirstTimeRoleSelector;
