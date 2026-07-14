import React, { useState } from 'react';
import { X, Scale, User as UserIcon, Home, FileText, Users, Info, LayoutGrid, LogOut, Sparkles, Cpu, ChevronDown, Wrench, BookOpen } from 'lucide-react';
import { Button } from './Button';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; email?: string } | null;
  role?: string;
  navigate: (path: string) => void;
  signOut: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, user, role, navigate, signOut }) => {
  const location = useLocation();
  const [aiExpanded, setAiExpanded] = useState(false);
  const [outilsExpanded, setOutilsExpanded] = useState(false);
  const { t } = useTranslation();

  const isAiActive = ['/genia-l', '/generator'].includes(location.pathname);
  const isOutilsActive = ['/services', '/classrooms'].includes(location.pathname);

  const navItemsBefore = [
    { name: t('nav.home'), href: '/', icon: Home },
  ];

  const navItemsAfter = [
    { name: t('nav.lawyers'), href: '/lawyers', icon: Users },
    { name: t('nav.about'), href: '/about', icon: Info },
    { name: t('nav.contact'), href: '/contact', icon: LayoutGrid },
  ];

  const aiItems = [
    { name: t('nav.genia'), href: '/genia-l', icon: Sparkles, desc: t('nav.genia_desc') },
    { name: t('nav.generator'), href: '/generator', icon: FileText, desc: t('nav.generator_desc') },
  ];

  const outilsItems = [
    { name: t('nav.services'), href: '/services', icon: Scale, desc: t('services.subtitle') },
    { name: t('classrooms.title'), href: '/classrooms', icon: BookOpen, desc: t('classrooms.subtitle') },
  ];

  return (
    <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Menu Panel */}
      <div className={`absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <span className="text-xl font-bold text-primary-600">{t('nav.menu')}</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full p-2 h-10 w-10">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            {navItemsBefore.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => { navigate(item.href); onClose(); }}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-primary-600'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {/* ── Outils Group ─────────────────────────────────────────── */}
            <div className={`rounded-xl border transition-colors overflow-hidden ${
              isOutilsActive ? 'border-primary-200 bg-primary-50/40' : 'border-secondary-100'
            }`}>
              {/* Toggle button */}
              <button
                onClick={() => setOutilsExpanded((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3.5 font-semibold transition-colors ${
                  isOutilsActive ? 'text-primary-700' : 'text-secondary-700 hover:text-primary-600'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`p-1 rounded-lg ${isOutilsActive ? 'bg-primary-100 text-primary-600' : 'bg-linear-to-br from-primary-100 to-violet-100 text-primary-600'}`}>
                    <Wrench className="h-4 w-4" />
                  </span>
                  <span>{t('nav.outils', 'Outils')}</span>
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${outilsExpanded || isOutilsActive ? 'rotate-180' : ''}`} />
              </button>

              {/* Sub items */}
              <div className={`transition-all duration-200 overflow-hidden ${outilsExpanded || isOutilsActive ? 'max-h-40' : 'max-h-0'}`}>
                <div className="px-3 pb-3 space-y-1">
                  {outilsItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <button
                        key={item.name}
                        onClick={() => { navigate(item.href); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                          isActive
                            ? 'bg-primary-100 text-primary-700 font-semibold'
                            : 'text-secondary-600 hover:bg-white hover:text-primary-600'
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-secondary-400">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── IA Group (after Services) ────────────────────────────── */}
            <div className={`rounded-xl border transition-colors overflow-hidden ${
              isAiActive ? 'border-primary-200 bg-primary-50/40' : 'border-secondary-100'
            }`}>
              {/* Toggle button */}
              <button
                onClick={() => setAiExpanded((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3.5 font-semibold transition-colors ${
                  isAiActive ? 'text-primary-700' : 'text-secondary-700 hover:text-primary-600'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`p-1 rounded-lg ${isAiActive ? 'bg-primary-100 text-primary-600' : 'bg-linear-to-br from-primary-100 to-violet-100 text-primary-600'}`}>
                    <Cpu className="h-4 w-4" />
                  </span>
                  <span>{t('nav.ai_full')}</span>
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${aiExpanded || isAiActive ? 'rotate-180' : ''}`} />
              </button>

              {/* Sub items */}
              <div className={`transition-all duration-200 overflow-hidden ${aiExpanded || isAiActive ? 'max-h-40' : 'max-h-0'}`}>
                <div className="px-3 pb-3 space-y-1">
                  {aiItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <button
                        key={item.name}
                        onClick={() => { navigate(item.href); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                          isActive
                            ? 'bg-primary-100 text-primary-700 font-semibold'
                            : 'text-secondary-600 hover:bg-white hover:text-primary-600'
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-secondary-400">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {navItemsAfter.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => { navigate(item.href); onClose(); }}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-primary-600'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t bg-secondary-50 space-y-4">
            {user ? (
              <>
                <Button
                  className="w-full justify-start rounded-xl py-6"
                  onClick={() => {
                    navigate(role === 'admin' ? '/dashboard/admin' : role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/user');
                    onClose();
                  }}
                >
                  <UserIcon className="mr-3 h-5 w-5" />
                  {t('nav.dashboard')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl py-6 border-secondary-200"
                  onClick={() => { signOut(); onClose(); }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <Button
                className="w-full rounded-xl py-6 text-lg font-bold shadow-lg shadow-primary-500/20"
                onClick={() => { navigate('/login'); onClose(); }}
              >
                <UserIcon className="mr-3 h-5 w-5" />
                {t('nav.login')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;

