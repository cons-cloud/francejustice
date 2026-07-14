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

// Initial language detection
const detectLanguage = (): string => {
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

  useEffect(() => {
    updateDocAttributes(language, t);
    localStorage.setItem('i18nextLng', language);
  }, [language, t]);

  const changeLanguage = (lng: string) => {
    if (resources[lng]) {
      setLanguage(lng);
    }
  };

  return React.createElement(
    I18nContext.Provider,
    { value: { language, changeLanguage, t } },
    children
  );
};

// Hook matching react-i18next API signature
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return {
    t: context.t,
    i18n: {
      language: context.language,
      changeLanguage: context.changeLanguage,
    },
  };
};

// Mock global object for compat with any direct imports
const i18nMock = {
  language: 'fr',
  changeLanguage: (lng: string) => updateDocAttributes(lng),
  t: (key: string, defaultValue?: string) => {
    const keys = key.split('.');
    let current: any = resources['fr'];
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue || key;
      }
    }
    return typeof current === 'string' ? current : (defaultValue || key);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  on: (_event: string, _callback: (lng: string) => void) => {
    // language-change event registration placeholder
  }
};

export default i18nMock;
