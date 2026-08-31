import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import es from './locales/es.json';
import tr from './locales/tr.json';
import ku from './locales/ku.json';
import ru from './locales/ru.json';

const resources: Record<string, any> = {
  fr,
  en,
  ar,
  es,
  tr,
  ku,
  ru,
};

// Helper for text direction & SEO meta attributes
const updateDocAttributes = (lng: string, tFunc?: (key: string, defaultValue?: string) => string) => {
  if (typeof document === 'undefined') return;
  const isRtl = lng === 'ar' || lng === 'ku';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  
  if (tFunc) {
    const title = tFunc('seo.title');
    const desc = tFunc('seo.description');
    if (title && title !== 'seo.title') {
      document.title = title;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && desc && desc !== 'seo.description') {
      metaDesc.setAttribute('content', desc);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title && title !== 'seo.title') {
      ogTitle.setAttribute('content', title);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && desc && desc !== 'seo.description') {
      ogDesc.setAttribute('content', desc);
    }
  }
};

// Initial language detection with localStorage & browser persistence
export const detectLanguage = (): string => {
  if (typeof window === 'undefined') return 'fr';
  const saved = localStorage.getItem('i18nextLng');
  if (saved && resources[saved]) return saved;
  const navLang = navigator.language.split('-')[0];
  if (resources[navLang]) return navLang;
  return 'fr';
};

interface I18nContextType {
  language: string;
  changeLanguage: (lng: string) => void;
  t: (key: string, defaultValue?: string) => string;
}

export const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(detectLanguage);

  const t = useCallback((key: string, defaultValue?: string): string => {
    const keys = key.split('.');
    let current: any = resources[language] || resources['fr'];
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to French if key not found in current language
        let fallback: any = resources['fr'];
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            fallback = null;
            break;
          }
        }
        return fallback || defaultValue || key;
      }
    }
    return typeof current === 'string' ? current : (defaultValue || key);
  }, [language]);

  // Sync language with localStorage, DOM attributes, and custom broadcast events
  useEffect(() => {
    updateDocAttributes(language, t);
    localStorage.setItem('i18nextLng', language);
  }, [language, t]);

  // Listen for real-time language change events from other components/windows
  useEffect(() => {
    const handleGlobalLangChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newLng = customEvent.detail || localStorage.getItem('i18nextLng');
      if (newLng && resources[newLng] && newLng !== language) {
        setLanguage(newLng);
      }
    };

    window.addEventListener('app_language_change', handleGlobalLangChange);
    window.addEventListener('storage', handleGlobalLangChange);

    return () => {
      window.removeEventListener('app_language_change', handleGlobalLangChange);
      window.removeEventListener('storage', handleGlobalLangChange);
    };
  }, [language]);

  const changeLanguage = (lng: string) => {
    if (resources[lng]) {
      setLanguage(lng);
      localStorage.setItem('i18nextLng', lng);
      updateDocAttributes(lng, t);
      window.dispatchEvent(new CustomEvent('app_language_change', { detail: lng }));
    }
  };

  return React.createElement(
    I18nContext.Provider,
    { value: { language, changeLanguage, t } },
    children
  );
};

// Hook matching react-i18next API signature with full fallback and real-time sync
export const useTranslation = () => {
  const context = useContext(I18nContext);
  const [currentLang, setCurrentLang] = useState<string>(detectLanguage);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newLng = customEvent.detail || localStorage.getItem('i18nextLng') || 'fr';
      if (newLng && resources[newLng]) {
        setCurrentLang(newLng);
      }
    };

    window.addEventListener('app_language_change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('app_language_change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  if (!context) {
    const activeLng = currentLang || detectLanguage();
    const defaultT = (key: string, defaultValue?: string) => {
      const keys = key.split('.');
      let current: any = resources[activeLng] || resources['fr'];
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return defaultValue || key;
        }
      }
      return typeof current === 'string' ? current : (defaultValue || key);
    };

    const changeLanguage = (lng: string) => {
      if (resources[lng]) {
        localStorage.setItem('i18nextLng', lng);
        setCurrentLang(lng);
        updateDocAttributes(lng, defaultT);
        window.dispatchEvent(new CustomEvent('app_language_change', { detail: lng }));
      }
    };

    return {
      t: defaultT,
      i18n: {
        language: activeLng,
        changeLanguage,
      },
    };
  }

  return {
    t: context.t,
    i18n: {
      language: context.language,
      changeLanguage: context.changeLanguage,
    },
  };
};

const i18nMock = {
  language: detectLanguage(),
  changeLanguage: (lng: string) => {
    localStorage.setItem('i18nextLng', lng);
    updateDocAttributes(lng);
    window.dispatchEvent(new CustomEvent('app_language_change', { detail: lng }));
  },
  t: (key: string, defaultValue?: string) => {
    const lng = detectLanguage();
    const keys = key.split('.');
    let current: any = resources[lng] || resources['fr'];
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue || key;
      }
    }
    return typeof current === 'string' ? current : (defaultValue || key);
  },
  on: (_event: string, _callback: (lng: string) => void) => {},
};

export default i18nMock;
