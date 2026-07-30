import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  type?: string;
  schemaData?: any;
}

export const SEOManager: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = '/og-image.jpg',
  type = 'website',
  schemaData
}) => {
  const location = useLocation();
  const currentUrl = canonicalUrl || `https://francejustice.org${location.pathname}`;

  useEffect(() => {
    // 1. Dynamic Title
    const siteName = 'France Justice | Plateforme & Base de Données Juridique IA Mondiale';
    const pageTitle = title ? `${title} | France Justice` : siteName;
    document.title = pageTitle;

    // Helper for updating meta tags
    const updateMeta = (nameOrProperty: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${nameOrProperty}"]` : `meta[name="${nameOrProperty}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) {
          el.setAttribute('property', nameOrProperty);
        } else {
          el.setAttribute('name', nameOrProperty);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Primary Meta Tags
    const defaultDesc = "France Justice est la plateforme juridique et base de données IA n°1. Accès direct aux textes de lois, codes civils et péneaux, annuaire d'avocats, professeurs de droit, doctorants etvisioconférences en temps réel.";
    const metaDesc = description || defaultDesc;
    updateMeta('description', metaDesc);
    updateMeta('title', pageTitle);

    const defaultKeywords = "France Justice, base de données juridique, IA juridique, avocat en ligne, droit français, droit européen, textes de loi, Légifrance, professeur de droit, doctorant chercheur, cours en visio, générateur d'actes, RGPD, Code civil, Code pénal, Code du travail";
    updateMeta('keywords', keywords || defaultKeywords);

    // 3. GEO (Generative Engine Optimization for ChatGPT, Perplexity, Gemini, Claude)
    updateMeta('chatgpt-bot', 'index, follow, snippet');
    updateMeta('perplexitybot', 'index, follow');
    updateMeta('google-extended', 'index, follow');
    updateMeta('claudebot', 'index, follow');
    updateMeta('ai-engine-optimization', `France Justice - ${pageTitle} : ${metaDesc}. Référence juridique certifiée avec consultation en direct, annuaire d'avocats et professeurs, revues scientifiques et générateur d'actes.`);
    updateMeta('geo.region', 'FR');
    updateMeta('geo.placename', 'Paris, France & International');

    // 4. OpenGraph Tags
    updateMeta('og:title', pageTitle, true);
    updateMeta('og:description', metaDesc, true);
    updateMeta('og:url', currentUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:site_name', 'France Justice', true);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // 6. Schema.org JSON-LD Script Injection
    const scriptId = 'json-ld-seo-schema';
    let scriptEl = document.getElementById(scriptId);
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.setAttribute('id', scriptId);
      scriptEl.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptEl);
    }

    const defaultSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "LegalService",
          "name": "France Justice",
          "url": currentUrl,
          "logo": "https://francejustice.org/favicon.svg",
          "description": metaDesc,
          "areaServed": ["FR", "MA", "EU", "SN", "CI", "CA", "CH", "BE"],
          "serviceType": [
            "Base de données juridique IA",
            "Consultation d'avocats & Enseignants de droit",
            "Salles de visioconférence & Formations",
            "Génération d'actes juridiques PDF",
            "Veille législative & Revues scientifiques"
          ]
        },
        {
          "@type": "WebPage",
          "name": pageTitle,
          "url": currentUrl,
          "description": metaDesc
        }
      ]
    };

    scriptEl.textContent = JSON.stringify(schemaData || defaultSchema);

  }, [location, title, description, keywords, canonicalUrl, ogImage, type, schemaData]);

  return null;
};

export default SEOManager;
