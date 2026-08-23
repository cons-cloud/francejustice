import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: object | object[];
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogImage = 'https://francejustice.org/og-image.jpg',
  jsonLd
}) => {
  const defaultTitle = "France Justice | N°1 Plateforme Juridique IA, Avocats, Droit du Travail & Entreprises en France";
  const defaultDesc = "Plateforme juridique officielle propulsée par l'IA. Recherche dans 75+ Codes de loi, consultation d'avocats vérifiés, droit du travail, licenciement, création d'entreprise, divorce, OQTF et formations diplômantes.";
  const defaultKeywords = "France Justice, droit du travail, licenciement, prud'hommes, rupture conventionnelle, droit des entreprises, création SAS SARL, droit de la famille, divorce, garde d'enfants, pension alimentaire, droit immobilier, loyer impayé, expulsion, droit pénal, garde à vue, amende, droit des étrangers, titre de séjour, OQTF, avocat en ligne, base de données juridique, IA juridique, formations diplômantes, masterclass droit";

  const siteTitle = title ? `${title} | France Justice` : defaultTitle;
  const metaDesc = description || defaultDesc;
  const metaKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;
  const canonicalUrl = canonical || 'https://francejustice.org' + (typeof window !== 'undefined' ? window.location.pathname : '');

  useEffect(() => {
    // 1. Update Title
    document.title = siteTitle;

    // Helper to set or create meta tag
    const setMetaTag = (nameAttr: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', metaDesc);
    setMetaTag('name', 'keywords', metaKeywords);
    setMetaTag('name', 'title', siteTitle);

    // 3. Open Graph Tags
    setMetaTag('property', 'og:title', siteTitle);
    setMetaTag('property', 'og:description', metaDesc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', ogImage);

    // 4. Twitter Card Tags
    setMetaTag('property', 'twitter:title', siteTitle);
    setMetaTag('property', 'twitter:description', metaDesc);
    setMetaTag('property', 'twitter:url', canonicalUrl);
    setMetaTag('property', 'twitter:image', ogImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 6. Dynamic JSON-LD Schema
    let jsonLdScript = document.getElementById('dynamic-jsonld-schema') as HTMLScriptElement;
    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'dynamic-jsonld-schema';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }
  }, [siteTitle, metaDesc, metaKeywords, canonicalUrl, ogImage, jsonLd]);

  return null;
};

export default SEO;
