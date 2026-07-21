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
import franceDemocratieImg from '../../assets/images/francedemocratie.webp';
import interieurImg from '../../assets/images/interieur.webp';
import justiceImg from '../../assets/images/justice.webp';
import presidentielleImg from '../../assets/images/presidentielle.webp';
import superieurImg from '../../assets/images/superieur.png';
import travailImg from '../../assets/images/travail.png';
import justeImg from '../../assets/images/juste.webp';

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
  { src: interieurImg, alt: 'Ministère de l\'Intérieur', href: 'https://www.interieur.gouv.fr/' },
];

const otherImages: BannerImage[] = [
  { src: conseilImg, alt: 'Conseil d\'État', href: 'https://www.conseil-etat.fr/' },
  { src: superieurImg, alt: 'Conseil Supérieur de la Magistrature', href: 'https://www.conseil-superieur-magistrature.fr/' },
  { src: justiceImg, alt: 'France Justice', href: 'https://www.info.gouv.fr/actualite/la-justice-et-moi-par-ou-commencer', overlayText: 'France justice' },
  { src: franceDemocratieImg, alt: 'France Démocratie', href: 'https://www.francedemocratie.com/', overlayText: 'France Démocratie' },
  { src: presidentielleImg, alt: 'Présidentielle', href: 'https://www.presidentielle2027.org/', overlayText: 'Présidentielle2027' },
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
    <header className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white shadow-sm flex flex-col">
      {/* Top Banner with Images (Hidden on mobile, just like reference site d-none d-lg-block) */}
      <div className="hidden lg:block w-full bg-white border-b border-gray-200 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="container mx-auto flex justify-between items-center gap-4">
          
          {/* Ministries - All the way to the left */}
          <div className="flex items-center gap-4">
            {ministryImages.map((img, idx) => (
              <a 
                key={`min-${idx}`} 
                href={img.href} 
                target="_blank" 
                rel="noopener noreferrer"
                title={img.alt}
                className="relative inline-block transition-transform hover:scale-105"
                style={{ textDecoration: 'none', color: 'white' }}
              >
                <img 
                  src={img.src} 
                  alt={img.alt} 
                  className="h-[80px] w-auto block" 
                />
                {img.overlayText && (
                  <p 
                    className="absolute bottom-0 left-0 right-0 m-0 text-center text-white font-sans text-sm"
                    style={{ padding: '10px', background: 'rgba(0, 0, 0, 0.5)' }}
                  >
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
                className="relative inline-block transition-transform hover:scale-105"
                style={{ textDecoration: 'none', color: 'white' }}
              >
                <img 
                  src={img.src} 
                  alt={img.alt} 
                  className="h-[80px] w-auto block" 
                />
                {img.overlayText && (
                  <p 
                    className="absolute bottom-0 left-0 right-0 m-0 text-center text-white font-sans text-sm"
                    style={{ padding: '10px', background: 'rgba(0, 0, 0, 0.5)' }}
                  >
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
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <Scale className="h-6 w-6 text-primary-600" />
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary-600 tracking-tight">France Justice</span>
            </div>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationBefore.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`nav-link font-medium transition-colors ${isActive
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                    : 'text-secondary-600 hover:text-primary-600'
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
                className={`flex items-center gap-1.5 font-medium transition-colors focus:outline-none ${
                  isAiActive
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                    : 'text-secondary-600 hover:text-primary-600'
                }`}
              >
                <Cpu className="h-4 w-4" />
                {t('nav.ai')}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${isAiDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 origin-top transition-all duration-200 ${
                  isAiDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}
              >
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-secondary-200 rotate-45" />

                <div className="relative bg-white rounded-2xl shadow-xl border border-secondary-200 overflow-hidden">
                  {/* Header gradient band */}
                  <div className="px-4 py-2.5 bg-linear-to-r from-primary-600 to-violet-600">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
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
                            ? 'bg-primary-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${
                          isActive
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-secondary-100 text-secondary-500 group-hover:bg-primary-100 group-hover:text-primary-600'
                        } transition-colors`}>
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className={`text-sm font-semibold ${isActive ? 'text-primary-700' : 'text-secondary-800 group-hover:text-primary-700'}`}>
                            {item.name}
                          </p>
                          <p className="text-xs text-secondary-400 mt-0.5">{item.desc}</p>
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
                className={`flex items-center gap-1.5 font-medium transition-colors focus:outline-none ${
                  isOutilsActive
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                    : 'text-secondary-600 hover:text-primary-600'
                }`}
              >
                <Wrench className="h-4 w-4" />
                {t('nav.outils', 'Outils')}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${isOutilsDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 origin-top transition-all duration-200 ${
                  isOutilsDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}
              >
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-secondary-200 rotate-45" />

                <div className="relative bg-white rounded-2xl shadow-xl border border-secondary-200 overflow-hidden">
                  {/* Header gradient band */}
                  <div className="px-4 py-2.5 bg-linear-to-r from-primary-600 to-violet-600">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
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
                            ? 'bg-primary-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${
                          isActive
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-secondary-100 text-secondary-500 group-hover:bg-primary-100 group-hover:text-primary-600'
                        } transition-colors`}>
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className={`text-sm font-semibold ${isActive ? 'text-primary-700' : 'text-secondary-800 group-hover:text-primary-700'}`}>
                            {item.name}
                          </p>
                          <p className="text-xs text-secondary-400 mt-0.5">{item.desc}</p>
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
                  className={`nav-link font-medium transition-colors ${isActive
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                    : 'text-secondary-600 hover:text-primary-600'
                    }`}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(role === 'admin' ? '/dashboard/admin' : role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/user')}
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  {t('nav.dashboard')}
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                <UserIcon className="h-4 w-4 mr-2" />
                {t('nav.login')}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
              className="hover:bg-primary-50 text-secondary-600"
            >
              <Menu className="h-6 w-6" />
            </Button>
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

