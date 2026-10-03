import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Hook pour injecter des meta tags SEO dynamiques sur chaque page.
 * Utilise directement le DOM pour la compatibilité maximale avec les SPA.
 */
export function useSEO({
  title,
  description,
  keywords,
  canonical,
  ogImage = 'https://francejustice.com/og-image.jpg',
  ogType = 'website',
  noIndex = false,
  schema,
}: SEOProps) {
  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────────────────
    document.title = title;

    // ── Helper ─────────────────────────────────────────────────────────────
    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const attr = selector.startsWith('meta[name')
          ? 'name'
          : selector.startsWith('meta[property')
          ? 'property'
          : 'name';
        const value = selector.match(/["']([^"']+)["']/)?.[1] ?? '';
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // ── Standard meta ─────────────────────────────────────────────────────
    setMeta('meta[name="title"]', title);
    setMeta('meta[name="description"]', description);
    if (keywords) setMeta('meta[name="keywords"]', keywords);
    setMeta('meta[name="robots"]', noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large');

    // ── Canonical ────────────────────────────────────────────────────────
    if (canonical) setLink('canonical', canonical);

    // ── Open Graph ────────────────────────────────────────────────────────
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:type"]', ogType);
    setMeta('meta[property="og:image"]', ogImage);
    if (canonical) setMeta('meta[property="og:url"]', canonical);

    // ── Twitter Card ─────────────────────────────────────────────────────
    setMeta('meta[property="twitter:title"]', title);
    setMeta('meta[property="twitter:description"]', description);
    setMeta('meta[property="twitter:image"]', ogImage);
    if (canonical) setMeta('meta[property="twitter:url"]', canonical);

    // ── JSON-LD Schema ────────────────────────────────────────────────────
    if (schema) {
      const scriptId = 'page-schema-ld';
      let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schema);
    }
  }, [title, description, keywords, canonical, ogImage, ogType, noIndex, schema]);
}
