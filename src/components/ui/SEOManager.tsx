import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO_CONFIGS, BASE_URL, DEFAULT_OG_IMAGE, type PageSEOConfig } from '../../lib/seoConfigs';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  type?: string;
  schemaData?: any;
}

const getRouteConfig = (path: string): PageSEOConfig | null => {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/') return SEO_CONFIGS.home;
  if (clean === '/database') return SEO_CONFIGS.database;
  if (clean === '/lawyers') return SEO_CONFIGS.lawyers;
  if (clean === '/services') return SEO_CONFIGS.services;
  if (clean === '/assistant') return SEO_CONFIGS.assistant;
  if (clean === '/genia-l') return SEO_CONFIGS.geniaL;
  if (clean === '/generator') return SEO_CONFIGS.generator;
  if (clean === '/classrooms') return SEO_CONFIGS.classrooms;
  if (clean === '/guide' || clean === '/guides') return SEO_CONFIGS.guide;
  if (clean === '/news') return SEO_CONFIGS.news;
  if (clean === '/about') return SEO_CONFIGS.about;
  if (clean === '/faq') return SEO_CONFIGS.faq;
  if (clean === '/contact') return SEO_CONFIGS.contact;
  if (clean === '/login') return SEO_CONFIGS.login;
  if (clean === '/search') return {
    title: 'Moteur de Recherche Juridique IA | France Justice',
    description: 'Recherchez parmi des milliers de textes de lois, codes officiels, fiches pratiques et avocats certifiés en France.',
    keywords: 'recherche juridique, moteur de recherche droit, codes français, jurisprudence, avocat recherche',
    canonical: `${BASE_URL}/search`
  };
  if (clean === '/legal' || clean === '/privacy' || clean === '/terms' || clean === '/cookies') return {
    title: 'Mentions Légales, RGPD & Déontologie | France Justice',
    description: 'Consultez les mentions légales, la politique de confidentialité RGPD, les conditions générales d\'utilisation et la déontologie de la plateforme France Justice.',
    keywords: 'mentions légales France Justice, RGPD, confidentialité, déontologie avocat, conditions générales',
    canonical: `${BASE_URL}${clean}`,
  };
  if (clean.startsWith('/register')) return {
    title: 'Inscription & Accès Professionnel | France Justice',
    description: 'Créez votre compte justiciable, avocat, professeur ou étudiant en droit pour accéder aux services certifiés de France Justice.',
    keywords: 'inscription avocat, compte France Justice, portail juridique, accès professionnel',
    canonical: `${BASE_URL}${clean}`
  };
  return null;
};

export const SEOManager: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  type = 'website',
  schemaData
}) => {
  const location = useLocation();

  useEffect(() => {
    const routeConfig = getRouteConfig(location.pathname);
    const currentUrl = canonicalUrl || routeConfig?.canonical || `${BASE_URL}${location.pathname}`;

    // 1. Dynamic Title
    const siteName = 'France Justice | Plateforme & Base de Données Juridique IA Mondiale';
    const rawTitle = title || routeConfig?.title;
    const pageTitle = rawTitle ? (rawTitle.includes('France Justice') ? rawTitle : `${rawTitle} | France Justice`) : siteName;
    document.title = pageTitle;

    // Helper for updating or creating meta tags
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
    const defaultDesc = "France Justice est la plateforme juridique et base de données IA n°1 en France. Accès direct aux textes de lois, codes officiels consolidés, annuaire d'avocats vérifiés et visioconférences chiffrées.";
    const metaDesc = description || routeConfig?.description || defaultDesc;
    updateMeta('description', metaDesc);
    updateMeta('title', pageTitle);

    const defaultKeywords = "France Justice, base de données juridique, IA juridique, avocat en ligne, droit français, droit européen, textes de loi, Légifrance, professeur de droit, docteur en droit, cours en visio, générateur d'actes, RGPD, Code civil, Code pénal, Code du travail";
    updateMeta('keywords', keywords || routeConfig?.keywords || defaultKeywords);

    // 3. Generative Engine Optimization (GEO) & AI Crawlers Meta Directives
    updateMeta('chatgpt-bot', 'index, follow, snippet');
    updateMeta('gptbot', 'index, follow');
    updateMeta('oai-searchbot', 'index, follow');
    updateMeta('perplexitybot', 'index, follow');
    updateMeta('google-extended', 'index, follow');
    updateMeta('claudebot', 'index, follow');
    updateMeta('claude-web', 'index, follow');
    updateMeta('anthropic-ai', 'index, follow');
    updateMeta('deepseekbot', 'index, follow');
    updateMeta('mistralbot', 'index, follow');
    updateMeta('applebot-extended', 'index, follow');
    updateMeta('ai-content-declaration', 'official-legal-corpus-france');
    updateMeta('ai-engine-optimization', `France Justice - ${pageTitle} : ${metaDesc}. Référence juridique certifiée avec consultation d'avocats vérifiés en visioconférence chiffrée, 75+ codes de lois, veille législative et générateur d'actes.`);
    updateMeta('geo.region', 'FR');
    updateMeta('geo.placename', 'Paris, France & International');

    // 4. OpenGraph Tags (Facebook, LinkedIn, Slack, WhatsApp)
    updateMeta('og:title', pageTitle, true);
    updateMeta('og:description', metaDesc, true);
    updateMeta('og:url', currentUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:site_name', 'France Justice', true);
    updateMeta('og:locale', 'fr_FR', true);

    // 5. Twitter Card Tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', pageTitle);
    updateMeta('twitter:description', metaDesc);
    updateMeta('twitter:image', ogImage);
    updateMeta('twitter:url', currentUrl);

    // 6. Dynamic Canonical Link (Guarantees every subpage has its unique canonical)
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // 7. Schema.org JSON-LD Script Injection
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
          "logo": `${BASE_URL}/favicon.svg`,
          "image": ogImage,
          "description": metaDesc,
          "areaServed": ["FR", "MA", "EU", "SN", "CI", "CA", "CH", "BE"],
          "serviceType": [
            "Base de données juridique IA (75+ Codes)",
            "Consultation d'avocats vérifiés par visioconférence WebRTC",
            "Génération d'actes juridiques certifiés PDF",
            "Formations diplômantes & Masterclass",
            "Veille législative et jurisprudence"
          ]
        },
        {
          "@type": "WebPage",
          "name": pageTitle,
          "url": currentUrl,
          "description": metaDesc
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Accueil",
              "item": `${BASE_URL}/`
            },
            ...(location.pathname !== '/' ? [{
              "@type": "ListItem",
              "position": 2,
              "name": pageTitle.split('|')[0].trim(),
              "item": currentUrl
            }] : [])
          ]
        }
      ]
    };

    const targetSchema = schemaData || routeConfig?.schema || defaultSchema;
    scriptEl.textContent = JSON.stringify(targetSchema);

  }, [location.pathname, title, description, keywords, canonicalUrl, ogImage, type, schemaData]);

  return null;
};

export default SEOManager;
