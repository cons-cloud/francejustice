/**
 * Configuration SEO centralisée pour chaque page de France Justice.
 * Utilisez le hook `useSEO` dans chaque page en passant la config correspondante.
 */

export const BASE_URL = 'https://francejustice.com';
export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

export interface PageSEOConfig {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

export const SEO_CONFIGS: Record<string, PageSEOConfig> = {
  home: {
    title: 'France Justice | Plateforme Juridique IA N°1 — Avocats, Droit du Travail & Entreprises',
    description: 'France Justice est la plateforme juridique IA de référence en France. Consultez un avocat vérifié, recherchez dans 75+ codes de loi, obtenez des conseils en droit du travail, droit des entreprises, droit de la famille et droit des étrangers.',
    keywords: "France Justice, plateforme juridique IA, avocat en ligne, droit du travail, droit des entreprises, droit de la famille, droit des étrangers, consultation juridique",
    canonical: `${BASE_URL}/`,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "France Justice",
      "url": BASE_URL,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${BASE_URL}/database?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  },

  lawyers: {
    title: 'Avocats Vérifiés en France | Annuaire Officiel par Spécialité & Barreau — France Justice',
    description: 'Trouvez votre avocat certifié parmi les barreaux de Paris, Lyon, Marseille, Bordeaux et toute la France. Consultation en visioconférence chiffrée. Filtre par spécialité : droit du travail, famille, immobilier, pénal.',
    keywords: "avocat en ligne, annuaire avocats France, barreau de Paris, avocat droit du travail, avocat famille, avocat pénal, consultation avocat visioconférence, avocat Lyon, avocat Marseille",
    canonical: `${BASE_URL}/lawyers`,
    schema: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Annuaire des Avocats de France — France Justice",
      "description": "Liste des avocats vérifiés et certifiés par spécialité et barreau en France",
      "url": `${BASE_URL}/lawyers`
    }
  },

  database: {
    title: 'Base de Données Juridique IA | 75+ Codes de Loi Français — France Justice',
    description: "Recherchez intelligemment dans plus de 75 codes de loi français grâce à l'IA. Code du Travail, Code Civil, Code Pénal, Code de Commerce, Code des Étrangers et bien plus. Accès gratuit et instantané.",
    keywords: "base de données juridique, codes de loi français, code du travail, code civil, code pénal, code de commerce, recherche juridique IA, loi française",
    canonical: `${BASE_URL}/database`,
    schema: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": "Base de Données Juridique France Justice",
      "description": "Base de données de 75+ codes de loi français avec recherche IA",
      "url": `${BASE_URL}/database`,
      "creator": { "@type": "Organization", "name": "France Justice" },
      "inLanguage": "fr",
      "license": `${BASE_URL}/legal`
    }
  },

  services: {
    title: 'Services Juridiques en Ligne | Consultation, Documents & IA — France Justice',
    description: "Découvrez tous les services France Justice : consultation d'avocat en visioconférence, génération de documents juridiques, assistant IA GéniaL'Avocat, formations diplômantes et base de données légale.",
    keywords: "services juridiques en ligne, consultation avocat, génération documents juridiques, assistant IA juridique, formations droit, aide juridictionnelle",
    canonical: `${BASE_URL}/services`,
  },

  assistant: {
    title: 'Assistant Juridique IA | Conseils Instantanés 24h/7j — France Justice',
    description: "Obtenez des réponses juridiques précises et instantanées grâce à notre assistant IA spécialisé en droit français. Disponible 24h/24, 7j/7 pour vos questions de droit du travail, famille, entreprise et étrangers.",
    keywords: "assistant juridique IA, conseil juridique en ligne, chatbot droit, IA juridique France, questions droit travail, droit famille IA, juriste IA",
    canonical: `${BASE_URL}/assistant`,
    schema: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "GéniaL'Avocat — Assistant Juridique IA",
      "applicationCategory": "LegalService",
      "operatingSystem": "Web",
      "url": `${BASE_URL}/assistant`,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" }
    }
  },

  geniaL: {
    title: "GéniaL'Avocat | IA Juridique Officielle France Justice — Réponses Instantanées",
    description: "GéniaL'Avocat est l'IA juridique officielle de France Justice. Posez vos questions en droit du travail, licenciement, divorce, bail, OQTF et obtenez des réponses claires, précises et gratuites.",
    keywords: "GéniaL'Avocat, IA juridique, questions droit travail, licenciement abusif IA, divorce conseil IA, OQTF aide, assistant avocat IA France",
    canonical: `${BASE_URL}/genia-l`,
  },

  generator: {
    title: 'Générateur de Documents Juridiques PDF | Lettres, Contrats & Statuts — France Justice',
    description: "Générez en quelques minutes vos documents juridiques professionnels : lettres de licenciement, contrats de travail, statuts de SAS/SARL, mises en demeure, requêtes aux prud'hommes. Téléchargement PDF immédiat.",
    keywords: "générateur documents juridiques, lettre licenciement, contrat travail modèle, statuts SAS SARL, mise en demeure, requête prud'hommes, PDF juridique gratuit",
    canonical: `${BASE_URL}/generator`,
  },

  classrooms: {
    title: 'Formations Juridiques Diplômantes & Masterclass | Docteurs en Droit — France Justice',
    description: "Suivez des formations juridiques diplômantes et masterclass dispensées par des Docteurs en Droit. Droit du Travail, Droit des Sociétés, Droit de la Famille, Droit Pénal. Certifications académiques reconnues.",
    keywords: "formations juridiques diplômantes, masterclass droit, docteur en droit, certificat droit du travail, formation droit des sociétés, droit formation en ligne",
    canonical: `${BASE_URL}/classrooms`,
    schema: {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "France Justice Académie",
      "url": `${BASE_URL}/classrooms`,
      "description": "Centre de formations juridiques diplômantes et masterclass supervisées par des Docteurs en Droit"
    }
  },

  guide: {
    title: 'Guide Pratique Juridique | Démarches, Droits & Procédures en France — France Justice',
    description: "Guides pratiques pour comprendre vos droits et naviguer les procédures juridiques françaises : licenciement, divorce, expulsion, OQTF, création d'entreprise, loyer impayé. Rédigés par des juristes.",
    keywords: "guide juridique pratique, procédure licenciement, divorce étapes, expulsion locataire, OQTF démarches, création entreprise guide, droits salariés",
    canonical: `${BASE_URL}/guide`,
  },

  news: {
    title: "Actualité Juridique & Droit Français | Lois & Jurisprudence — France Justice",
    description: "Suivez toute l'actualité juridique française : nouvelles lois, arrêts de jurisprudence importants, réformes du Code du Travail, décisions du Conseil d'État et de la Cour de Cassation.",
    keywords: "actualité juridique France, nouvelles lois, jurisprudence, réforme code du travail, Cour de Cassation, Conseil d'État, arrêts importants",
    canonical: `${BASE_URL}/news`,
    schema: {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "name": "France Justice — Actualité Juridique",
      "url": `${BASE_URL}/news`
    }
  },

  about: {
    title: 'À Propos de France Justice | Plateforme Juridique IA Officielle & Notre Mission',
    description: "France Justice est la plateforme juridique de référence en France, fondée pour démocratiser l'accès au droit. Découvrez notre équipe, notre mission et notre technologie IA au service de la justice.",
    keywords: "à propos France Justice, mission plateforme juridique, équipe juridique, IA droit France, démocratisation justice",
    canonical: `${BASE_URL}/about`,
  },

  faq: {
    title: 'FAQ — Questions Fréquentes sur France Justice & Nos Services Juridiques',
    description: "Trouvez les réponses à toutes vos questions sur France Justice : comment consulter un avocat, utiliser notre base de données, générer des documents ou accéder aux formations diplômantes.",
    keywords: "FAQ France Justice, questions fréquentes, comment consulter avocat, utiliser plateforme juridique, aide juridique en ligne",
    canonical: `${BASE_URL}/faq`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Comment consulter un avocat sur France Justice ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Rendez-vous dans notre annuaire, choisissez un avocat par spécialité ou barreau, réservez un créneau et réalisez votre consultation par visioconférence chiffrée."
          }
        },
        {
          "@type": "Question",
          "name": "Les services France Justice sont-ils gratuits ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "La recherche dans la base de données juridique et l'accès à l'assistant IA GéniaL'Avocat sont gratuits. Les consultations d'avocats sont payantes selon les honoraires du professionnel."
          }
        },
        {
          "@type": "Question",
          "name": "France Justice est-elle une plateforme officielle ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "France Justice est une plateforme privée spécialisée dans les services juridiques numériques, avec un annuaire d'avocats vérifiés inscrits aux barreaux de France."
          }
        }
      ]
    }
  },

  contact: {
    title: 'Contactez France Justice | Support & Partenariats Juridiques',
    description: "Contactez l'équipe France Justice pour toute question sur nos services, un partenariat avec un barreau, une intégration d'avocat ou une demande de support technique.",
    keywords: "contact France Justice, support juridique, partenariat barreau, intégration avocat, aide plateforme juridique",
    canonical: `${BASE_URL}/contact`,
  },

  login: {
    title: 'Connexion | Espace Personnel France Justice',
    description: "Connectez-vous à votre espace France Justice pour accéder à vos consultations, documents générés, formations et historique de recherches.",
    keywords: "connexion France Justice, espace personnel, login juridique",
    canonical: `${BASE_URL}/login`,
  },
};
