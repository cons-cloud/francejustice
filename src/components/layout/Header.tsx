import React, { useState, useRef, useEffect } from 'react';
import { Menu, Scale, User as UserIcon, ChevronDown, Sparkles, FileText, Cpu, Wrench, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import MobileMenu from '../ui/MobileMenu';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import LanguageSwitcher from '../ui/LanguageSwitcher';

// Banner Images
import conseilImg from '../../assets/images/conseil.webp';
import educationImg from '../../assets/images/education.jpg';
import interieurImg from '../../assets/images/interieur.webp';
import superieurImg from '../../assets/images/superieur.png';
import travailImg from '../../assets/images/travail.png';
import justeImg from '../../assets/images/juste.webp';
import legifranceImg from '../../assets/images/legifrance.svg';
import parquetImg from '../../assets/images/parquet.png';

interface BannerImage {
  src: string;
  alt: string;
  href: string;
  overlayText?: string;
}

const ministryImages: BannerImage[] = [
  { src: educationImg, alt: 'Ministère de l\'Éducation', href: 'https://www.education.gouv.fr/' },
  { src: travailImg, alt: 'Ministère du Travail', href: 'https://travail-emploi.gouv.fr/' },
  { src: justeImg, alt: 'Ministère de la Justice', href: 'https://www.justice.fr/' },
  { src: parquetImg, alt: 'Parquet — Ministère de la Justice', href: 'https://www.justice.fr/' },
  { src: interieurImg, alt: 'Ministère de l\'Intérieur', href: 'https://www.interieur.gouv.fr/' },
];

const otherImages: BannerImage[] = [
  { src: legifranceImg, alt: 'Légifrance', href: 'https://www.legifrance.gouv.fr/' },
  { src: conseilImg, alt: 'Conseil d\'État', href: 'https://www.conseil-etat.fr/' },
  { src: superieurImg, alt: 'Conseil Supérieur de la Magistrature', href: 'https://www.conseil-superieur-magistrature.fr/' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState(false);
  const [isOutilsDropdownOpen, setIsOutilsDropdownOpen] = useState(false);
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const outilsDropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAiDropdownOpen(false);
      }
      if (outilsDropdownRef.current && !outilsDropdownRef.current.contains(e.target as Node)) {
        setIsOutilsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsAiDropdownOpen(false);
    setIsOutilsDropdownOpen(false);
  }, [location.pathname]);

  const navigationBefore = [
    { name: t('nav.home'), href: '/' },
  ];

  const navigationAfter = [
    { name: t('nav.lawyers'), href: '/lawyers' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  // AI dropdown items
  const aiItems = [
    { name: t('nav.genia'), href: '/genia-l', icon: Sparkles, desc: t('nav.genia_desc') },
    { name: t('nav.generator'), href: '/generator', icon: FileText, desc: t('nav.generator_desc') },
  ];

  // Outils dropdown items
  const outilsItems = [
    { name: t('nav.services'), href: '/services', icon: Scale, desc: t('services.subtitle') },
    { name: t('classrooms.title'), href: '/classrooms', icon: BookOpen, desc: t('classrooms.subtitle') },
  ];

  const isAiActive = ['/genia-l', '/generator'].includes(location.pathname);
  const isOutilsActive = ['/services', '/classrooms'].includes(location.pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md text-slate-800 shadow-xs flex flex-col transition-all duration-300">
      {/* Top Banner with Images on Light Background */}
      <div className="hidden lg:block w-full bg-slate-50 border-b border-slate-200/80 py-2">
        <div className="container mx-auto flex justify-between items-center gap-4">
          
          {/* Ministries */}
          <div className="flex items-center gap-4">
            {ministryImages.map((img, idx) => (
              <a 
                key={`min-${idx}`} 
                href={img.href} 
                target="_blank" 
                rel="noopener noreferrer"
                title={img.alt}
                className="relative inline-flex items-center justify-center p-1 rounded-lg bg-white hover:bg-slate-50 transition-all duration-300 hover:scale-105 shadow-xs border border-slate-200/60 group overflow-hidden"
              >
                <img 
                  src={img.src} 
                  alt={img.alt} 
                  className="h-12 w-auto block object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300" 
                />
                {img.overlayText && (
                  <p className="absolute bottom-0 left-0 right-0 m-0 text-center text-slate-800 font-sans text-[10px] font-bold py-0.5 bg-white/90 backdrop-blur-xs tracking-tight rounded-b-md">
                    {img.overlayText}
                  </p>
                )}
              </a>
            ))}
          </div>

          {/* Other Institutions & Campaigns */}
          <div className="flex items-center gap-4">
            {otherImages.map((img, idx) => (
              <a 
                key={`oth-${idx}`} 
                href={img.href} 
                target="_blank" 
                rel="noopener noreferrer"
                title={img.alt}
                className="relative inline-flex items-center justify-center p-1 rounded-lg bg-white hover:bg-slate-50 transition-all duration-300 hover:scale-105 shadow-xs border border-slate-200/60 group overflow-hidden"
              >
                <img 
                  src={img.src} 
                  alt={img.alt} 
                  className="h-12 w-auto block object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300" 
                />
                {img.overlayText && (
                  <p className="absolute bottom-0 left-0 right-0 m-0 text-center text-slate-800 font-sans text-[10px] font-bold py-0.5 bg-white/90 backdrop-blur-xs tracking-tight rounded-b-md">
                    {img.overlayText}
                  </p>
                )}
              </a>
            ))}
          </div>

        </div>
      </div>

      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2.5 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-md shadow-cyan-600/20 group-hover:scale-105 transition-transform">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">France Justice</span>
              <span className="text-[10px] font-bold text-cyan-700 tracking-wider uppercase -mt-1">Droit & IA 2026</span>
            </div>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navigationBefore.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`font-semibold transition-colors text-sm ${isActive
                    ? 'text-cyan-700 border-b-2 border-cyan-600 pb-1 font-bold'
                    : 'text-slate-700 hover:text-cyan-600'
                    }`}
                >
                  {item.name}
                </a>
              );
            })}

            {/* ── IA Dropdown ─────────────────────────────────────────────── */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsAiDropdownOpen((v) => !v)}
                className={`flex items-center gap-1.5 font-semibold transition-colors text-sm focus:outline-none cursor-pointer ${
                  isAiActive
                    ? 'text-cyan-700 border-b-2 border-cyan-600 pb-1 font-bold'
                    : 'text-slate-700 hover:text-cyan-600'
                }`}
              >
                <Cpu className="h-4 w-4 text-cyan-600" />
                {t('nav.ai')}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-cyan-600 transition-transform duration-200 ${isAiDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-68 origin-top transition-all duration-200 ${
                  isAiDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}
              >
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45" />

                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
                  {/* Header gradient band */}
                  <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-white">
                      {t('nav.ai_full')}
                    </p>
                  </div>

                  {aiItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(item.href);
                          setIsAiDropdownOpen(false);
                        }}
                        className={`flex items-start gap-3 px-4 py-3.5 group transition-colors ${
                          isActive
                            ? 'bg-cyan-50/80 text-cyan-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${
                          isActive
                            ? 'bg-cyan-100 text-cyan-700'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-cyan-100 group-hover:text-cyan-700'
                        } transition-colors`}>
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className={`text-sm font-bold ${isActive ? 'text-cyan-800' : 'text-slate-900 group-hover:text-cyan-700'}`}>
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Outils Dropdown ─────────────────────────────────────────── */}
            <div ref={outilsDropdownRef} className="relative">
              <button
                onClick={() => setIsOutilsDropdownOpen((v) => !v)}
                className={`flex items-center gap-1.5 font-semibold transition-colors text-sm focus:outline-none cursor-pointer ${
                  isOutilsActive
                    ? 'text-cyan-700 border-b-2 border-cyan-600 pb-1 font-bold'
                    : 'text-slate-700 hover:text-cyan-600'
                }`}
              >
                <Wrench className="h-4 w-4 text-cyan-600" />
                {t('nav.outils', 'Outils')}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-cyan-600 transition-transform duration-200 ${isOutilsDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-68 origin-top transition-all duration-200 ${
                  isOutilsDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}
              >
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45" />

                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
                  {/* Header gradient band */}
                  <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-white">
                      {t('nav.outils', 'Outils')}
                    </p>
                  </div>

                  {outilsItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(item.href);
                          setIsOutilsDropdownOpen(false);
                        }}
                        className={`flex items-start gap-3 px-4 py-3.5 group transition-colors ${
                          isActive
                            ? 'bg-cyan-50/80 text-cyan-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${
                          isActive
                            ? 'bg-cyan-100 text-cyan-700'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-cyan-100 group-hover:text-cyan-700'
                        } transition-colors`}>
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className={`text-sm font-bold ${isActive ? 'text-cyan-800' : 'text-slate-900 group-hover:text-cyan-700'}`}>
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {navigationAfter.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`font-semibold transition-colors text-sm ${isActive
                    ? 'text-cyan-700 border-b-2 border-cyan-600 pb-1 font-bold'
                    : 'text-slate-700 hover:text-cyan-600'
                    }`}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center space-x-3">
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full hover:bg-cyan-50 hover:text-cyan-700 font-bold"
                  onClick={() => navigate(role === 'admin' ? '/dashboard/admin' : role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/user')}
                >
                  <UserIcon className="h-4 w-4 mr-1.5 text-cyan-600" />
                  {t('nav.dashboard')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full border-slate-300 hover:bg-slate-100 text-slate-700 font-bold"
                  onClick={signOut}
                >
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <Button 
                variant="primary" 
                size="sm" 
                className="rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-md shadow-cyan-600/20 font-bold px-5 py-2 transition-all hover:scale-105"
                onClick={() => navigate('/login')}
              >
                <UserIcon className="h-4 w-4 mr-1.5" />
                {t('nav.login')}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Ouvrir le menu"
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-cyan-600 hover:text-cyan-700 transition-all duration-200 shadow-xs flex items-center justify-center cursor-pointer"
            >
              <Menu className="h-6 w-6 text-cyan-600" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          user={user}
          role={role || undefined}
          navigate={navigate}
          signOut={signOut}
        />
      </div>
    </header>
  );
};

export default Header;
