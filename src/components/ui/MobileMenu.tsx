import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Scale,
  User as UserIcon,
  Home,
  FileText,
  Users,
  Info,
  LayoutGrid,
  LogOut,
  Sparkles,
  Cpu,
  ChevronDown,
  Wrench,
  BookOpen,
  Search,
  BookMarked,
  Newspaper,
  ShieldCheck,
} from 'lucide-react';
import { Button } from './Button';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; email?: string } | null;
  role?: string;
  navigate: (path: string) => void;
  signOut: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  user,
  role,
  navigate,
  signOut,
}) => {
  const location = useLocation();
  const { t } = useTranslation();
  const [aiExpanded, setAiExpanded] = useState(true);
  const [outilsExpanded, setOutilsExpanded] = useState(true);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  if (typeof document === 'undefined') return null;

  const isAiActive = ['/genia-l', '/generator'].includes(location.pathname);
  const isOutilsActive = ['/services', '/classrooms'].includes(location.pathname);

  const mainNavItems = [
    { name: t('nav.home', 'Accueil'), href: '/', icon: Home },
    { name: 'Recherche & Codes', href: '/search', icon: Search },
    { name: t('nav.lawyers', 'Trouver un Avocat'), href: '/lawyers', icon: Users },
  ];

  const aiItems = [
    {
      name: t('nav.genia', "GéniaL'Avocat"),
      href: '/genia-l',
      icon: Sparkles,
      desc: t('nav.genia_desc', 'Assistant vocal & juridique 24/7'),
    },
    {
      name: t('nav.generator', "Générateur d'actes"),
      href: '/generator',
      icon: FileText,
      desc: t('nav.generator_desc', 'Contrats, statuts, mises en demeure PDF'),
    },
  ];

  const outilsItems = [
    {
      name: t('nav.services', 'Services & Honoraires'),
      href: '/services',
      icon: Scale,
      desc: t('services.subtitle', 'Consultations, barèmes & expertises'),
    },
    {
      name: t('classrooms.title', 'Formations Diplômantes'),
      href: '/classrooms',
      icon: BookOpen,
      desc: t('classrooms.subtitle', 'Certifications & Masterclass'),
    },
  ];

  const secondaryNavItems = [
    { name: 'Guide Pratique', href: '/guide', icon: BookMarked },
    { name: 'Actualités Juridiques', href: '/news', icon: Newspaper },
    { name: t('nav.about', 'À propos & Éthique'), href: '/about', icon: Info },
    { name: t('nav.contact', 'Contact & Assistance'), href: '/contact', icon: LayoutGrid },
  ];

  const menuContent = (
    <div
      className={`fixed inset-0 z-[9999] lg:hidden transition-all duration-300 ${
        isOpen
          ? 'opacity-100 pointer-events-auto visible'
          : 'opacity-0 pointer-events-none invisible'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.menu', 'Menu de navigation')}
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white border-l border-slate-200 shadow-2xl flex flex-col h-[100dvh] max-h-[100dvh] transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-sm">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 tracking-tight block">
                France Justice
              </span>
              <span className="text-[10px] uppercase font-bold text-cyan-700 tracking-wider">
                Portail Officiel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={onClose}
              aria-label="Fermer le menu"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Body */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 bg-slate-50/50">
          {/* Main Primary Links */}
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    navigate(item.href);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                      : 'text-slate-800 bg-white hover:bg-cyan-50/70 hover:text-cyan-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? 'text-white' : 'text-cyan-600'
                    }`}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* ── Intelligence Artificielle Juridique ─────────────────────────────── */}
          <div className="rounded-2xl border border-cyan-200 bg-white shadow-2xs overflow-hidden">
            <button
              onClick={() => setAiExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-50 to-teal-50/40 text-cyan-900 font-bold text-sm cursor-pointer border-b border-cyan-100"
            >
              <span className="flex items-center gap-2.5">
                <span className="p-1 rounded-lg bg-cyan-600 text-white shadow-2xs">
                  <Cpu className="h-4 w-4" />
                </span>
                <span>{t('nav.ai_full', 'Intelligence Artificielle')}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-cyan-700 transition-transform duration-200 ${
                  aiExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {aiExpanded && (
              <div className="p-2 space-y-1.5 bg-white">
                {aiItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        navigate(item.href);
                        onClose();
                      }}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-cyan-50 border border-cyan-300 text-cyan-900'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-cyan-600 text-white'
                            : 'bg-cyan-100/70 text-cyan-700'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500 leading-tight mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Outils & Services Métiers ─────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <button
              onClick={() => setOutilsExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-slate-900 font-bold text-sm cursor-pointer border-b border-slate-200"
            >
              <span className="flex items-center gap-2.5">
                <span className="p-1 rounded-lg bg-teal-600 text-white shadow-2xs">
                  <Wrench className="h-4 w-4" />
                </span>
                <span>{t('nav.outils', 'Services & Formations')}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-600 transition-transform duration-200 ${
                  outilsExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {outilsExpanded && (
              <div className="p-2 space-y-1.5 bg-white">
                {outilsItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        navigate(item.href);
                        onClose();
                      }}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-teal-50 border border-teal-300 text-teal-900'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-100/70 text-teal-700'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500 leading-tight mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secondary Links (Guides, News, About, Contact) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 space-y-1 shadow-2xs">
            {secondaryNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    navigate(item.href);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-800 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-cyan-700'
                  }`}
                >
                  <item.icon className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* RGPD & Security Badge */}
          <div className="flex items-center justify-center gap-2 p-3 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Chiffrement WebRTC & Conformité RGPD</span>
          </div>
        </nav>

        {/* Bottom Drawer Actions (Auth / Dashboard) */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {user ? (
            <>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="truncate text-xs font-semibold text-slate-700">
                  {user.email || 'Utilisateur connecté'}
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full">
                  {role === 'admin'
                    ? 'Admin'
                    : role === 'lawyer'
                    ? 'Avocat'
                    : 'Membre'}
                </span>
              </div>

              <Button
                className="w-full justify-center rounded-xl py-3.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/25"
                onClick={() => {
                  navigate(
                    role === 'admin'
                      ? '/dashboard/admin'
                      : role === 'lawyer'
                      ? '/dashboard/lawyer'
                      : '/dashboard/user'
                  );
                  onClose();
                }}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                {t('nav.dashboard', 'Mon Espace Juridique')}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-center rounded-xl py-3 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                onClick={() => {
                  signOut();
                  onClose();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.logout', 'Déconnexion')}
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <Button
                className="w-full justify-center rounded-xl py-3.5 text-sm font-bold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-600/25 cursor-pointer"
                onClick={() => {
                  navigate('/login');
                  onClose();
                }}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                {t('nav.login', 'Connexion / Espace Membre')}
              </Button>

              <button
                onClick={() => {
                  navigate('/login?tab=register');
                  onClose();
                }}
                className="w-full text-center py-2 text-xs font-semibold text-cyan-700 hover:text-cyan-800 transition-colors cursor-pointer"
              >
                Créer un compte citoyen ou professionnel →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
};

export default MobileMenu;
