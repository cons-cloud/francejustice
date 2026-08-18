import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ku', name: 'Kurdî', flag: '🏴' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(l => l.code === (i18n.language || 'fr').split('-')[0]) || languages[0];

  return (
    <div ref={containerRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 backdrop-blur-md transition-all font-medium focus:outline-none shadow-sm cursor-pointer"
      >
        <Globe className="h-4 w-4 text-primary-400" />
        <span className="text-sm">{currentLang.flag} {currentLang.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 origin-top-right bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-indigo-800/50 overflow-hidden text-white z-50"
          >
            <div className="py-1">
              {languages.map((lang) => {
                const isSelected = currentLang.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-primary-400 font-semibold bg-primary-900/40'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
