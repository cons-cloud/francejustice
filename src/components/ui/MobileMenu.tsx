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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Menu Panel */}
      <div className={`absolute inset-y-0 right-0 w-full max-w-sm bg-white border-l border-slate-200 shadow-2xl transition-transform duration-300 transform text-slate-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">{t('nav.menu')}</span>
            <button 
              onClick={onClose} 
              aria-label="Fermer le menu"
              className="rounded-full p-2 h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-6 space-y-3">
            {navItemsBefore.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => { navigate(item.href); onClose(); }}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-cyan-700'
                  }`}
                >
                  <item.icon className="h-5 w-5 text-cyan-600" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {/* ── Outils Group ─────────────────────────────────────────── */}
            <div className={`rounded-xl border transition-colors overflow-hidden ${
              isOutilsActive ? 'border-cyan-300 bg-cyan-50/50' : 'border-slate-200 bg-slate-50/50'
            }`}>
              {/* Toggle button */}
              <button
                onClick={() => setOutilsExpanded((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3.5 font-bold transition-colors cursor-pointer ${
                  isOutilsActive ? 'text-cyan-800' : 'text-slate-800 hover:text-cyan-700'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-white text-cyan-600 border border-slate-200 shadow-xs">
                    <Wrench className="h-4 w-4" />
                  </span>
                  <span>{t('nav.outils', 'Outils')}</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${outilsExpanded || isOutilsActive ? 'rotate-180 text-cyan-700' : ''}`} />
              </button>

              {/* Sub items */}
              <div className={`transition-all duration-200 overflow-hidden ${outilsExpanded || isOutilsActive ? 'max-h-48' : 'max-h-0'}`}>
                <div className="px-3 pb-3 space-y-1">
                  {outilsItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <button
                        key={item.name}
                        onClick={() => { navigate(item.href); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                          isActive
                            ? 'bg-cyan-100/70 text-cyan-900 font-bold border border-cyan-300'
                            : 'text-slate-700 hover:bg-white hover:text-cyan-700'
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-cyan-600" />
                        <div className="text-left">
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── IA Group ─────────────────────────────────────────────── */}
            <div className={`rounded-xl border transition-colors overflow-hidden ${
              isAiActive ? 'border-cyan-300 bg-cyan-50/50' : 'border-slate-200 bg-slate-50/50'
            }`}>
              {/* Toggle button */}
              <button
                onClick={() => setAiExpanded((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3.5 font-bold transition-colors cursor-pointer ${
                  isAiActive ? 'text-cyan-800' : 'text-slate-800 hover:text-cyan-700'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-white text-cyan-600 border border-slate-200 shadow-xs">
                    <Cpu className="h-4 w-4" />
                  </span>
                  <span>{t('nav.ai_full')}</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${aiExpanded || isAiActive ? 'rotate-180 text-cyan-700' : ''}`} />
              </button>

              {/* Sub items */}
              <div className={`transition-all duration-200 overflow-hidden ${aiExpanded || isAiActive ? 'max-h-48' : 'max-h-0'}`}>
                <div className="px-3 pb-3 space-y-1">
                  {aiItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <button
                        key={item.name}
                        onClick={() => { navigate(item.href); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                          isActive
                            ? 'bg-cyan-100/70 text-cyan-900 font-bold border border-cyan-300'
                            : 'text-slate-700 hover:bg-white hover:text-cyan-700'
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-cyan-600" />
                        <div className="text-left">
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.desc}</div>
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
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-cyan-700'
                  }`}
                >
                  <item.icon className="h-5 w-5 text-cyan-600" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
            {user ? (
              <>
                <Button
                  className="w-full justify-start rounded-xl py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/20"
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
                  className="w-full rounded-xl py-4 border-slate-300 text-slate-700 hover:bg-slate-200"
                  onClick={() => { signOut(); onClose(); }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <Button
                className="w-full rounded-xl py-4 text-base font-bold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-600/25"
                onClick={() => { navigate('/login'); onClose(); }}
              >
                <UserIcon className="mr-2 h-5 w-5" />
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
