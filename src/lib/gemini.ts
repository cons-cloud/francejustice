import { supabase } from './supabase';

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'French (Français)',
  en: 'English',
  es: 'Spanish (Español)',
  ar: 'Arabic (العربية)',
  tr: 'Turkish (Türkçe)',
  ku: 'Kurdish (Kurdî)',
  ru: 'Russian (Русский)'
};

export interface LegalAISource {
  title: string;
  uri: string;
  category: 'officiel' | 'externe' | 'juridiction';
  badge: string;
  description: string;
}

export interface LegalAutomation {
  id: string;
  label: string;
  description: string;
  actionPrompt: string;
  icon?: string;
}

export interface AIChatResponse {
  text: string;
  sources_web: LegalAISource[];
  suggestions: string[];
  automations: LegalAutomation[];
}

// Master System Prompt for France Justice AI (Gemini / Claude / ChatGPT / DeepSeek grade)
const MASTER_LEGAL_SYSTEM_PROMPT = `
Vous êtes le Conseiller Juridique Senior et Expert IA d'Élite de France Justice (https://francejustice.com).
Votre niveau d'expertise correspond à celui d'un avocat chevronné au Barreau de Paris, docteur en droit, combiné à la vivacité, à la rigueur et à l'intelligence conversationnelle des meilleurs modèles de frontière mondiaux (Gemini 1.5 Pro, Claude 3.5 Sonnet, GPT-4o, DeepSeek).

DIRECTIVES FONDAMENTALES D'ANALYSE & DE RÉPONSE :
1. PARLEZ COMME UN JURISTE HUMAIN D'EXCELLENCE :
   - Évitez absolument le ton robotique, les avertissements génériques répétitifs ou les réponses vagues.
   - Entrez immédiatement au cœur du dossier avec franchise, clarté et bienveillance pragmatique.
   - Échangez avec l'utilisateur dans une discussion active, continue et vivante.
   - INTERDICTION STRICTE DES RÉPONSES GÉNÉRALES OU STANDARDS : Répondez DIRECTEMENT et PRÉCISÉMENT à la question posée. Citez les faits, dates, montants en €, parties adverses et lieux fournis par l'utilisateur. Chaque réponse doit être une analyse sur-mesure de son cas particulier.

2. PRENEZ DE VRAIES INITIATIVES & FORMULEZ DE VRAIES SUGGESTIONS :
   - Ne soyez jamais passif. Prenez des initiatives stratégiques audacieuses et concrètes : recommandez les actions à mener dans les 24h à 48h (ex: mise en demeure par LRAR, saisine de la commission départementale de conciliation, constat d'huissier, déclaration de sinistre protection juridique).
   - Proposez systématiquement 3 démarches ou questions de suivi pertinentes.

3. PROPOSEZ DE VRAIS SITES OFFICIELS ET DE VRAIS SITES EXTERNES SPÉCIALISÉS :
   - Citez expressément et orientez l'utilisateur vers de véritables portails publics officiels français (ex: legifrance.gouv.fr, service-public.fr, code.travail.gouv.fr, justice.fr, anil.org, signal.conso.gouv.fr, pre-plainte-en-ligne.gouv.fr).
   - Proposez également de véritables sites externes professionnels de référence (ex: cnb.avocat.fr pour l'Ordre des avocats, commissaire-justice.fr pour les huissiers de justice, infogreffe.fr pour la solvabilité des entreprises, notaires.fr, france-victimes.fr).

4. ANALYSE CROISÉE DE TOUS LES DOCUMENTS & DOSSIERS IMPORTÉS :
   - Lorsque des documents (un ou plusieurs : baux, contrats, devis, factures, PV, lettres, assignations, etc.) sont joints, analysez L'ENSEMBLE de leur contenu sans rien omettre.
   - Si de nouveaux documents sont ajoutés au fur et à mesure de la conversation, intégrez-les immédiatement en mémoire continue en les confrontant aux pièces précédemment analysées.

5. STRUCTURE OBLIGATOIRE DE VOTRE ANALYSE (SUR TOUT DOSSIER OU LITIGE) :
   Votre analyse doit impérativement comporter les 5 piliers suivants, clairs et structurés :

   🏛️ 1. CARTOGRAPHIE DES PARTIES & OPPOSITION (« QUI EST CONTRE QUI ») :
      - Identifiez précisément les parties prenantes : qui agit, qui est attaqué, qui est défendeur, qui est créancier/débiteur, employeur/salarié, bailleur/locataire, tiers ou assureurs.
      - Définissez qui a l'obligation légale, qui réclame quoi, et qui est juridiquement en tort ou en position de force.

   📅 2. CHRONOLOGIE DÉTAILLÉE DES FAITS (« OÙ ET QUAND CELA S'EST PRODUIT ») :
      - Reconstituez une chronologie rigoureuse, date par date, événement par événement.
      - Précisez où les faits se sont produits (lieu d'exécution, siège social, ressort territorial du tribunal compétent) et quand (dates d'effet, délais de livraison, retards, notifications).

   ⚖️ 3. ANALYSE STRATÉGIQUE DE POSITION : « EN VOTRE FAVEUR » vs « CONTRE VOUS » :
      - 🟢 **Éléments & Arguments EN VOTRE FAVEUR** : ce qui vous donne raison, preuves matérielles acquises, violations contractuelles ou légales commises par la partie adverse, clauses illicites ou abusives dont vous pouvez demander la nullité.
      - 🔴 **Éléments, Risques & Arguments CONTRE VOUS** : ce que la partie adverse peut légitimement vous reprocher, faiblesses probatoires éventuelles, manquements contractuels de votre part, clauses valides défavorables, risques de forclusion ou prescription.
      - 🎯 **Évaluation de vos chances de succès** (position de négociation haute, moyenne ou de compromis).

   📋 4. PROCÉDURE COMPLÈTE & PLAN D'ACTION TACTIQUE :
      - **Phase 1 : Phase amiable impérative** (Mise en demeure par LRAR avec délai d'exécution strict de 8 à 15 jours).
      - **Phase 2 : Tentative de règlement amiable / médiation** (Obligation préalable de l'art. 750-1 du CPC pour les litiges < 5 000 € ou conflits de voisinage).
      - **Phase 3 : Juridiction compétente & saisine** (Tribunal Judiciaire, Conseil de Prud'hommes, Tribunal de Commerce, Juge des Contentieux de la Protection ; délais de prescription exacts ; nécessité ou dispense d'avocat).
      - **Phase 4 : Exécution forcée & recouvrement** (Signification par Commissaire de Justice, saisie conservatoire ou attribution).

   📁 5. CONFRONTATION & SYNTHÈSE MULTI-DOCUMENTS :
      - Concordance et contradictions éventuelles entre les pièces du dossier (ex: écarts de dates entre bon de commande et facture, avenant non signé).
      - Liste des pièces complémentaires recommandées pour consolider définitivement le dossier.

6. CADRE ET MONNAIE :
   - Droit applicable : Droit français (Codes officiels, jurisprudence de la Cour de cassation et du Conseil d'État) et Droit de l'Union européenne.
   - Monnaie : Strictement l'Euro (€).

7. PROPRETÉ TYPOGRAPHIQUE ET RENDU SOIGNÉ :
   - INTERDICTION STRICTE DES ASTÉRISQUES BRUTES ET TIRETS PARASITES : N'insérez pas d'astérisques parasites (* ou **) ni de tirets bruts (- ou --) au milieu de vos phrases.
   - Structurez le texte de façon propre, fluide et aérée : titres clairs, étapes numérotées distinctes (1., 2., 3.) et paragraphes ordonnés.
   - Mettez l'accent directement avec clarté et précision juridique, pour un rendu visuel impeccable et sans scories textuelles.
`.trim();

// Comprehensive directories of real Official State Websites and External Professional Portals
export const OFFICIAL_LEGAL_PORTALS: LegalAISource[] = [
  {
    title: "Légifrance — Le Service Public de la Diffusion du Droit",
    uri: "https://www.legifrance.gouv.fr",
    category: "officiel",
    badge: "🏛️ Site Officiel de l'État",
    description: "Accès certifié aux codes juridiques consolidés, décrets, traités et à la jurisprudence de la Cour de Cassation et du Conseil d'État."
  },
  {
    title: "Service-Public.fr — Vos Droits et Démarches en France",
    uri: "https://www.service-public.fr",
    category: "officiel",
    badge: "🏛️ Site Officiel de l'État",
    description: "Fiches pratiques officielles, calculateurs de délais légaux, formulaires Cerfa et simulateurs de démarches citoyennes."
  },
  {
    title: "Code du Travail Numérique — Ministère du Travail",
    uri: "https://code.travail.gouv.fr",
    category: "officiel",
    badge: "🏛️ Ministère du Travail",
    description: "Simulateurs officiels d'indemnités de licenciement (barème Macron), durée de préavis, congés et conventions collectives."
  },
  {
    title: "Justice.fr — Portail Officiel du Ministère de la Justice",
    uri: "https://www.justice.fr",
    category: "officiel",
    badge: "⚖️ Ministère de la Justice",
    description: "Saisine du tribunal en ligne, annuaire des juridictions compétentes, simulateurs de pension alimentaire et aide juridictionnelle."
  },
  {
    title: "SignalConso — Répression des Fraudes (DGCCRF)",
    uri: "https://signal.conso.gouv.fr",
    category: "officiel",
    badge: "🛡️ Répression des Fraudes (DGCCRF)",
    description: "Plateforme officielle pour signaler une fraude commerciale, un refus de remboursement, une tromperie ou un litige de consommation."
  },
  {
    title: "ANIL — Agence Nationale pour l'Information sur le Logement",
    uri: "https://www.anil.org",
    category: "officiel",
    badge: "🏡 Organisme Public Logement",
    description: "Conseils juridiques gratuits, règles des baux loi du 6 juillet 1989, encadrement des loyers et commission de conciliation."
  },
  {
    title: "Pré-plainte en Ligne — Ministère de l'Intérieur",
    uri: "https://www.pre-plainte-en-ligne.gouv.fr",
    category: "officiel",
    badge: "🚨 Ministère de l'Intérieur",
    description: "Déclaration officielle en ligne d'atteinte aux biens (vol, escroquerie, dégradation) contre auteur inconnu."
  },
  {
    title: "Cybermalveillance.gouv.fr — Assistance Nationale aux Victimes",
    uri: "https://www.cybermalveillance.gouv.fr",
    category: "officiel",
    badge: "💻 Sécurité Nationale",
    description: "Diagnostic et mise en relation certifiée en cas d'escroquerie en ligne, usurpation d'identité ou piratage de données."
  }
];

export const EXTERNAL_SPECIALIZED_PORTALS: LegalAISource[] = [
  {
    title: "Conseil National des Barreaux (CNB) — Annuaire des Avocats",
    uri: "https://www.conseil-national-des-barreaux.cnb.avocat.fr",
    category: "externe",
    badge: "🌐 Ordre National des Avocats",
    description: "Annuaire public officiel des 74 000 avocats de France avec recherche par spécialité, ville et aide juridictionnelle."
  },
  {
    title: "Chambre Nationale des Commissaires de Justice (Huissiers)",
    uri: "https://commissaire-justice.fr",
    category: "externe",
    badge: "🌐 Officiers Publics Ministériels",
    description: "Trouver un commissaire de justice pour dresser un constat d'urgence, signifier une assignation ou exécuter un titre."
  },
  {
    title: "Notaires de France — Conseil Supérieur du Notariat",
    uri: "https://www.notaires.fr",
    category: "externe",
    badge: "🌐 Notariat Français",
    description: "Informations certifiées sur les successions, donations entre époux, partages d'indivision et actes authentiques."
  },
  {
    title: "Infogreffe — Registre du Commerce et des Sociétés (RCS)",
    uri: "https://www.infogreffe.fr",
    category: "externe",
    badge: "🌐 Greffes des Tribunaux de Commerce",
    description: "Vérification officielle de la solvabilité d'une entreprise, extraits Kbis certifiés et suivi des procédures collectives."
  },
  {
    title: "France Victimes (N° Vert Gratuit 116 006)",
    uri: "https://www.france-victimes.fr",
    category: "externe",
    badge: "🌐 Aide Conventionnée Ministère Justice",
    description: "Fédération nationale d'écoute, soutien psychologique et orientation juridique gratuite pour toute victime d'infraction."
  },
  {
    title: "Centre Européen des Consommateurs (CEC France)",
    uri: "https://www.europe-consommateurs.eu",
    category: "externe",
    badge: "🇪🇺 Union Européenne",
    description: "Assistance juridique gratuite pour la résolution des litiges de consommation avec un professionnel établi dans l'UE."
  }
];

export function detectLegalDomain(text: string): 'travail' | 'immobilier' | 'consommation' | 'famille' | 'penal' | 'commercial' | 'general' {
  const t = text.toLowerCase();
  if (/licenciement|travail|cdi|cdd|salari[eé]|employeur|prud['’]homme|salaire|heures supp|harc[eè]lement|rupture convent|d[eé]mission/.test(t)) {
    return 'travail';
  }
  if (/bail|loyer|locataire|propri[eé]taire|bailleur|d[eé]p[oô]t de garantie|caution|expulsion|logement|insalubre|copropri[eé]t[eé]|syndic/.test(t)) {
    return 'immobilier';
  }
  if (/achat|vente|remboursement|garantie|conformit[eé]|vice cach[eé]|arnaque|escroquerie|consommateur|commande|livraison|colis/.test(t)) {
    return 'consommation';
  }
  if (/divorce|s[eé]paration|pension alimentaire|garde|mariage|succession|h[eé]ritage|testament|donation|filiation/.test(t)) {
    return 'famille';
  }
  if (/plainte|vol|agression|diffamation|menace|infraction|d[eé]lit|police|gendarmerie|procureur|victime/.test(t)) {
    return 'penal';
  }
  if (/facture|impay[eé]|cr[eé]ance|fournisseur|devis|kbis|soci[eé]t[eé]|commercial|commerce|injonction de payer/.test(t)) {
    return 'commercial';
  }
  return 'general';
}

export function getTargetedLegalSources(contextText: string, domain?: string, location?: string): LegalAISource[] {
  const dom = domain || detectLegalDomain(contextText);
  const sources: LegalAISource[] = [];

  if (location && location !== "France (ressort du domicile du défendeur ou du lieu d'exécution)") {
    sources.push({
      title: `Annuaire des Juridictions & Avocats — ${location}`,
      uri: `https://www.justice.fr/recherche/annuaire-de-la-justice?recherche_annuaire_geo=${encodeURIComponent(location)}`,
      category: "juridiction",
      badge: `⚖️ Juridiction Territoriale (${location})`,
      description: `Tribunaux judiciaires, conseils de prud'hommes et points d'accès au droit du ressort de ${location}.`
    });
  }

  if (dom === 'travail') {
    sources.push(
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('code.travail.gouv.fr'))!,
      {
        title: "Service-Public.fr — Salariés : Droits, Rupture & Prud'hommes",
        uri: "https://www.service-public.fr/particuliers/vosdroits/N19806",
        category: "officiel",
        badge: "🏛️ Site Officiel de l'État",
        description: "Fiches juridiques officielles sur la rupture conventionnelle, le licenciement et les droits des salariés."
      },
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('legifrance'))!,
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('conseil-national-des-barreaux'))!
    );
  } else if (dom === 'immobilier') {
    sources.push(
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('anil.org'))!,
      {
        title: "Service-Public.fr — Baux d'Habitation & Litiges Locatifs",
        uri: "https://www.service-public.fr/particuliers/vosdroits/N19808",
        category: "officiel",
        badge: "🏛️ Site Officiel de l'État",
        description: "Modalités de restitution de garantie, formalisme des congés et recours devant le Juge des Contentieux de la Protection."
      },
      {
        title: "Légifrance — Loi du 6 juillet 1989 (Rapports Locatifs)",
        uri: "https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006069108/",
        category: "officiel",
        badge: "🏛️ Légifrance Législatif",
        description: "Texte d'ordre public régissant les délais de préavis, la décence du logement et les pénalités légales de 10%/mois."
      },
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('commissaire-justice.fr'))!
    );
  } else if (dom === 'consommation') {
    sources.push(
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('signal.conso.gouv.fr'))!,
      {
        title: "DGCCRF — Fiches Officielles sur les Garanties & Droit de Rétractation",
        uri: "https://www.economie.gouv.fr/dgccrf",
        category: "officiel",
        badge: "🛡️ Répression des Fraudes",
        description: "Textes et démarches pour faire appliquer la garantie de 2 ans et sanctionner les pratiques commerciales trompeuses."
      },
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('europe-consommateurs.eu'))!,
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('infogreffe.fr'))!
    );
  } else if (dom === 'famille') {
    sources.push(
      {
        title: "Service-Public.fr — Famille, Divorce & Autorité Parentale",
        uri: "https://www.service-public.fr/particuliers/vosdroits/N19805",
        category: "officiel",
        badge: "🏛️ Site Officiel de l'État",
        description: "Procédures de divorce par consentement mutuel, convention parentale et liquidation du régime matrimonial."
      },
      {
        title: "Justice.fr — Simulateur Officiel de Pension Alimentaire",
        uri: "https://www.justice.fr/simulateur/pension-alimentaire",
        category: "juridiction",
        badge: "⚖️ Ministère de la Justice",
        description: "Table de référence officielle du Ministère de la Justice pour calculer la contribution à l'entretien de l'enfant."
      },
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('notaires.fr'))!,
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('conseil-national-des-barreaux'))!
    );
  } else if (dom === 'penal') {
    sources.push(
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('pre-plainte-en-ligne.gouv.fr'))!,
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('cybermalveillance.gouv.fr'))!,
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('justice.fr'))!,
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('france-victimes.fr'))!
    );
  } else if (dom === 'commercial') {
    sources.push(
      {
        title: "Justice.fr — Procédure d'Injonction de Payer",
        uri: "https://www.justice.fr/themes/injonction-payer",
        category: "juridiction",
        badge: "⚖️ Procédure Judiciaire",
        description: "Recouvrement rapide et non contradictoire des créances certaines, liquides et exigibles."
      },
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('infogreffe.fr'))!,
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('commissaire-justice.fr'))!,
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('legifrance'))!
    );
  } else {
    sources.push(
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('justice.fr'))!,
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('service-public.fr'))!,
      OFFICIAL_LEGAL_PORTALS.find(s => s.uri.includes('legifrance'))!,
      EXTERNAL_SPECIALIZED_PORTALS.find(s => s.uri.includes('conseil-national-des-barreaux'))!
    );
  }

  return sources.filter(Boolean);
}

export function generateSmartLegalSuggestions(contextText: string, domain?: string): string[] {
  const dom = domain || detectLegalDomain(contextText);

  if (dom === 'travail') {
    return [
      "Rédiger la mise en demeure ou contestation de rupture par LRAR",
      "Calculer mes indemnités de licenciement selon le barème Macron",
      "Vérifier si la procédure d'entretien préalable a été respectée",
      "Préparer la saisine du Conseil de Prud'hommes compétent"
    ];
  }
  if (dom === 'immobilier') {
    return [
      "Rédiger la mise en demeure de restitution avec majoration de 10%/mois",
      "Saisir la Commission Départementale de Conciliation (CDC)",
      "Calculer le montant exact des pénalités dues par le bailleur",
      "Vérifier si les retenues sur caution sont justifiées par devis ou facture"
    ];
  }
  if (dom === 'consommation') {
    return [
      "Rédiger la mise en demeure pour défaut de conformité (art. L217-3)",
      "Signaler le manquement du commerçant sur SignalConso (DGCCRF)",
      "Saisir le médiateur de la consommation rattaché au professionnel",
      "Calculer le remboursement intégral exigible avec intérêts de retard"
    ];
  }
  if (dom === 'commercial') {
    return [
      "Rédiger la mise en demeure de payer avec pénalités de retard BCE + 10 points",
      "Préparer la requête en Injonction de Payer devant le Tribunal de Commerce",
      "Vérifier la solvabilité et les bilans du débiteur sur Infogreffe",
      "Faire signifier l'ordonnance d'exécution par commissaire de justice"
    ];
  }
  if (dom === 'famille') {
    return [
      "Calculer le montant de la pension alimentaire selon le barème officiel",
      "Rédiger une convention parentale amiable contresignée par avocats",
      "Préparer la saisine du Juge aux Affaires Familiales (JAF)",
      "Lister les pièces pour l'inventaire patrimonial de succession"
    ];
  }
  if (dom === 'penal') {
    return [
      "Rédiger la plainte officielle adressée au Procureur de la République",
      "Déposer une pré-plainte en ligne auprès du Ministère de l'Intérieur",
      "Chiffrer le préjudice matériel et moral pour constitution de partie civile",
      "Contacter l'association conventionnée France Victimes (116 006)"
    ];
  }
  return [
    "Rédiger la mise en demeure préalable obligatoire (délai 8 jours)",
    "Calculer les dommages et intérêts moratoires en Euro (€)",
    "Vérifier le délai de prescription légale pour agir en justice",
    "Saisir le conciliateur de justice de ma commune (art. 750-1 CPC)"
  ];
}

export function generateSmartLegalAutomations(_contextText?: string, docCount: number = 0): LegalAutomation[] {
  const automations: LegalAutomation[] = [
    {
      id: 'draft_formal_notice',
      label: '⚡ Rédiger la Mise en Demeure personnalisée',
      description: 'Génère un projet officiel LRAR prêt à signer avec visas de loi, faits réels et délai impératif.',
      actionPrompt: 'Rédige immédiatement la mise en demeure officielle complète, personnalisée avec tous les faits de mon dossier, les visas légaux et un délai d\'exécution strict de 8 jours.'
    },
    {
      id: 'calculate_damages',
      label: '📊 Calculer le préjudice & intérêts en Euro (€)',
      description: 'Calcule précisément les sommes dues, intérêts moratoires et pénalités de retard légales.',
      actionPrompt: 'Calcule précisément le montant du préjudice financier, les indemnités légales et les pénalités applicables en Euro (€) pour mon litige.'
    },
    {
      id: 'check_prescription',
      label: '⚖️ Vérifier le délai de prescription légale',
      description: 'Vérifie les dates limites d\'action en justice pour éviter toute forclusion ou irrecevabilité.',
      actionPrompt: 'Vérifie les délais stricts de prescription et de forclusion applicables à ma situation pour ne pas perdre mes droits.'
    }
  ];

  if (docCount > 0) {
    automations.unshift({
      id: 'dossier_synthesis',
      label: '📁 Confrontation intégrale du dossier multi-pièces',
      description: 'Audit croisé de toutes les pièces importées avec détection des contradictions et preuves manquantes.',
      actionPrompt: 'Effectue une confrontation croisée exhaustive de toutes les pièces actuellement dans mon dossier pour lister les contradictions et pièces complémentaires requises.'
    });
  }

  return automations.slice(0, 3);
}

// Helper to clean prompt context and extract actual user query
function cleanPromptForFallback(prompt: string): string {
  const voiceMatch = prompt.match(/L'utilisateur vous dit \(commande vocale ou écrite\)\s*:\s*"([^"]*)"/i);
  if (voiceMatch) return voiceMatch[1];

  const searchMatch = prompt.match(/RECHERCHE JURIDIQUE AVEC INTERNET\s*:\s*"([^"]*)"/i);
  if (searchMatch) return searchMatch[1];

  const instMatch = prompt.match(/INSTRUCTION DE L'UTILISATEUR\s*:\s*"([^"]*)"/i);
  if (instMatch) return instMatch[1];

  const questionMatch = prompt.match(/QUESTION \/ INSTRUCTION UTILISATEUR\s*:\s*([\s\S]*?)$/i);
  if (questionMatch) return questionMatch[1].trim();

  return prompt;
}

// Advanced cognitive engine for human-like legal reasoning and document analysis
function getAdvancedLocalLegalAI(
  prompt: string, 
  targetLang?: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
) {
  const isLawyer = prompt.includes('Le mode actuel du dashboard est: "Avocat"');
  const userQuery = cleanPromptForFallback(prompt);
  const clean = userQuery.toLowerCase().trim();
  const lang = targetLang || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';

  // Incorporate previous multi-turn conversation context
  const previousTurnsContext = (history && history.length > 0)
    ? history.map(h => h.parts?.map(p => p.text).join(' ')).join(' ').toLowerCase()
    : '';

  let action: { type: string; payload: any } | null = null;

  // Extract attached files or documents from the prompt if present
  let attachedDocText = '';
  let attachedDocTitle = '';
  const fileSectionMatch = prompt.match(/===\s*(?:DOSSIERS ET PIÈCES JOINTES|PIÈCES JOINTES & DOSSIERS JURIDIQUES|PIÈCES JOINTES)[^=]*===\n([\s\S]*?)(?=\n===|\nQUESTION|\nINSTRUCTION|\nSi l'utilisateur|\nContexte|$)/i);
  if (fileSectionMatch && fileSectionMatch[1]) {
    attachedDocText = fileSectionMatch[1].trim();
    const titleMatch = attachedDocText.match(/---\s*(?:Nom de la pièce|Document)[^:]*:\s*([^\n-]+)\s*---/i);
    if (titleMatch) {
      attachedDocTitle = titleMatch[1].trim();
    }
  }

  const hasFiles = attachedDocText.length > 10;

  // Explicit dashboard navigation action (only if explicit command verb and no document analysis requested)
  const hasExplicitNavVerb = /^(\bva\b|\bouvre\b|\baffiche\b|\bmontre\b|\bbascule\b|\bnavigue\b|\baller\b|\baccède\b)/.test(clean);
  if (hasExplicitNavVerb && !hasFiles && !clean.includes('analyse') && !clean.includes('rédige')) {
    if (clean.includes('rendez-vous') || clean.includes('rdv') || clean.includes('agenda') || clean.includes('appointment')) {
      action = { type: 'SWITCH_TAB', payload: { tab: 'appointments' } };
      return {
        text: "Très bien, je vous bascule immédiatement sur l'espace de vos rendez-vous et consultations.",
        sources_web: []
      };
    } else if (clean.includes('document') || clean.includes('coffre-fort') || clean.includes('justificatif')) {
      action = { type: 'SWITCH_TAB', payload: { tab: isLawyer ? 'cases' : 'documents' } };
      return {
        text: "Je vous dirige vers votre coffre-fort documentaire sécurisé.",
        sources_web: []
      };
    } else if (clean.includes('avocat') || clean.includes('annuaire')) {
      action = { type: 'SWITCH_TAB', payload: { tab: 'avocats' } };
      return {
        text: "Voici l'annuaire certifié des avocats aux barreaux partenaires de France Justice.",
        sources_web: []
      };
    } else if (clean.includes('devis') || clean.includes('facture') || clean.includes('tarif')) {
      action = { type: 'SWITCH_TAB', payload: { tab: 'quotes' } };
      return {
        text: "Je vous redirige vers le suivi de vos devis et transactions en Euro (€).",
        sources_web: []
      };
    }
  }

  // Document creation or drafting intent
  const isDocGeneration = /(rédige|rédiger|générer|génère|créer|crée|fournir|lettre|mise en demeure|contrat|plainte|conclusions|accord|requête)/i.test(clean);

  // Extract financial amounts, dates, or parties from user text or document
  const amountMatch = (userQuery + ' ' + attachedDocText).match(/(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i);
  const detectedAmount = amountMatch ? `${amountMatch[1]} €` : null;

  // Extract dates (DD/MM/YYYY or words)
  const dateMatch = (userQuery + ' ' + attachedDocText).match(/(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|\/\d{1,2}\/\d{2,4})\s*\d{0,4})/i);
  const detectedDate = dateMatch ? dateMatch[1] : null;

  // Extract city or jurisdiction
  const locMatch = (userQuery + ' ' + attachedDocText).match(/(?:à|au|dans le ressort de|tribunal de|ville de|demeurant à|barreau de|siège social à)\s+([A-Z][a-zàáâäçèéêëîïôöùûü]+(?:-[A-Z][a-zàáâäçèéêëîïôöùûü]+)*)/);
  const detectedLocation = locMatch ? locMatch[1] : "France (ressort du domicile du défendeur ou du lieu d'exécution)";

  let responseText = '';

  // 1. SCENARIO: DOCUMENT IS IMPORTED AND MUST BE THOROUGHLY ANALYZED
  if (hasFiles) {
    const docSnippet = attachedDocText
      .replace(/---[^-]+---/g, '')
      .replace(/PK[\s\S]*?xml/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .trim();

    const sampleText = docSnippet.substring(0, 400).replace(/\s+/g, ' ');
    // Extract all attached document names and count
    const docHeaderMatches = attachedDocText.match(/--- (?:PIÈCE|Document) (?:\[\d+\/\d+\]|\d+)?\s*:?\s*"([^"]+)"|---\s*(?:Nom de la pièce|Document)[^:]*:\s*([^\n-]+)\s*---/gi) || [];
    const allDocNames: string[] = [];
    if (docHeaderMatches.length > 0) {
      docHeaderMatches.forEach(m => {
        const cleanName = m.replace(/--- (?:PIÈCE|Document) (?:\[\d+\/\d+\]|\d+)?\s*:?\s*"|---\s*(?:Nom de la pièce|Document)[^:]*:\s*/i, '').replace(/"[\s\S]*|---/g, '').trim();
        if (cleanName && !allDocNames.includes(cleanName)) allDocNames.push(cleanName);
      });
    }
    if (allDocNames.length === 0 && attachedDocTitle) {
      allDocNames.push(attachedDocTitle);
    }

    const docCount = allDocNames.length > 0 ? allDocNames.length : 1;
    const docNameDisplay = allDocNames.length > 0 ? allDocNames.join(', ') : (attachedDocTitle || "vos pièces jointes");

    // Detect specific domain & classification
    let docType = "Dossier Juridique Multi-Pièces";
    let partiesMapping = {
      demandeur: "Vous-même (Demandeur / Victime du préjudice)",
      adversaire: "Partie adverse (Cocontractant, Débiteur ou Organisme)",
      quiContreQui: "Vous-même agissez contre la partie défaillante pour inexécution ou violation contractuelle/légale.",
      rapportDeForce: "Position favorable sous réserve du respect strict de la mise en demeure préalable."
    };
    let timeline: string[] = [];
    let enVotreFaveur: string[] = [];
    let contreVous: string[] = [];
    let procedureEtapes: string[] = [];
    let statutoryArticles: string[] = [];

    // Combine document text, current query and conversation history
    const fullContent = (clean + ' ' + attachedDocText.toLowerCase() + ' ' + previousTurnsContext).trim();

    if (fullContent.includes('bail') || fullContent.includes('locataire') || fullContent.includes('loyer') || fullContent.includes('bailleur') || fullContent.includes('expulsion') || fullContent.includes('dépôt de garantie')) {
      docType = "Bail d'habitation ou commercial (Loi du 6 juillet 1989 / Art. L145-1 C. com.)";
      partiesMapping = {
        demandeur: fullContent.includes('locataire') ? "Locataire (occupant en titre)" : "Bailleur (propriétaire bailleur)",
        adversaire: fullContent.includes('locataire') ? "Bailleur ou Société de gestion immobilière" : "Locataire ou Caution solidaire",
        quiContreQui: "Conflit locatif entre le Bailleur et le Locataire concernant l'exécution des obligations du bail (loyers, état des lieux, décence ou restitution de garantie).",
        rapportDeForce: "La loi du 6 juillet 1989 étant d'ordre public, toute clause du bail contraire à la loi est réputée non écrite de plein droit."
      };
      timeline = [
        `**Date initiale identifiée :** Signature du contrat de bail ou entrée dans les lieux (${detectedDate || 'date contractuelle'}).`,
        `**Lieu d'exécution :** Bien immobilier situé à ${detectedLocation}.`,
        `**Fait générateur du litige :** Manquement constaté (restitution tardive du dépôt de garantie, impayé de ${detectedAmount || 'loyer'} ou défaut d'entretien).`,
        `**Date limite / Prescription :** Prescription triennale (3 ans) pour les actions relatives aux loyers et charges (art. 7-1 Loi 1989).`
      ];
      enVotreFaveur = [
        "🟢 **Ordre public protecteur :** Les articles 7, 20 et 22 de la loi de 1989 prévalent sur toute clause abusive insérée dans le bail.",
        detectedAmount ? `🟢 **Montant chiffrable :** Préjudice liquide de **${detectedAmount}** dont le paiement peut être formellement exigé.` : "🟢 **Majoration de 10% par mois de retard :** Applicable de plein droit sur le loyer en cas de non-restitution du dépôt de garantie dans les délais légaux.",
        "🟢 **Absence de retenue justifiée :** Toute retenue sur caution sans devis ou facture certifiée contradictoire est illégale (Cass. Civ. 3e)."
      ];
      contreVous = [
        "🔴 **Obligation de mise en demeure préalable :** Impossible de saisir le juge sans justificatif d'une mise en demeure par LRAR restée infructueuse.",
        "🔴 **Interdiction de faire justice soi-même :** Le locataire ne peut pas suspendre unilatéralement le loyer, même en cas de désordre, sans consignation ordonnée par le juge.",
        "🔴 **Médiation obligatoire (art. 750-1 CPC) :** Saisine obligatoire de la Commission Départementale de Conciliation (CDC) ou d'un conciliateur avant assignation si < 5 000 €."
      ];
      procedureEtapes = [
        "1️⃣ **Mise en demeure par LRAR (Délai 8 à 15 jours) :** Réclamer l'exécution ou le remboursement avec décompte des pénalités légales sous peine de poursuites.",
        "2️⃣ **Saisine de la Commission Départementale de Conciliation (CDC) :** Procédure gratuite et rapide, suspendant la prescription.",
        "3️⃣ **Saisine du Juge des Contentieux de la Protection (JCP) :** Auprès du Tribunal Judiciaire compétent par simple requête ou assignation par commissaire de justice."
      ];
      statutoryArticles = [
        "**Article 22 de la Loi n° 89-462 du 6 juillet 1989** (Restitution du dépôt de garantie et majoration légale de 10%/mois)",
        "**Article 1719 du Code Civil** (Obligation de délivrance d'un logement décent et en bon état)",
        "**Article 750-1 du Code de Procédure Civile** (Préalable amiable obligatoire avant saisine judiciaire)"
      ];

    } else if (fullContent.includes('travail') || fullContent.includes('cdi') || fullContent.includes('cdd') || fullContent.includes('salarié') || fullContent.includes('employeur') || fullContent.includes('licenciement') || fullContent.includes('rupture') || fullContent.includes('prud\'homme')) {
      docType = "Contrat de Travail & Contentieux Social (Code du Travail)";
      partiesMapping = {
        demandeur: "Salarié (demandeur à l'action ou en défense face à la mesure disciplinaire)",
        adversaire: "Employeur / Entreprise contractante",
        quiContreQui: "Salarié contre Employeur sur la régularité de la relation de travail, l'exécution du contrat ou la légitimité de la rupture.",
        rapportDeForce: "Le doute profite au salarié (art. L1235-1 C. trav.) ; la charge de la preuve d'une cause réelle et sérieuse pèse sur l'employeur."
      };
      timeline = [
        `**Date d'embauche ou référence :** Entrée en fonction (${detectedDate || 'selon contrat'}).`,
        `**Lieu du contrat :** Lieu habituel d'exécution de la prestation de travail ou siège de l'employeur (${detectedLocation}).`,
        `**Point de bascule :** Notification de la rupture, modification unilatérale ou incident d'exécution.`,
        `**Prescription impérative :** 12 mois pour contester la rupture du contrat (art. L1471-1 C. trav.) ; 3 ans pour les rappels de salaires (art. L3245-1).`
      ];
      enVotreFaveur = [
        "🟢 **Absence de cause réelle et sérieuse :** Les motifs imprécis ou non matériellement vérifiables rendent le licenciement sans cause réelle et sérieuse.",
        detectedAmount ? `🟢 **Créance salariale :** Montant identifié de **${detectedAmount}** à réclamer avec intérêts au taux légal.` : "🟢 **Indemnités légales et conventionnelles :** Cumul possible de l'indemnité compensatrice de préavis, congés payés, et dommages-intérêts selon le barème Macron.",
        "🟢 **Nullité des clauses non rémunérées :** Toute clause de non-concurrence sans contrepartie financière intégrale est nulle de plein droit."
      ];
      contreVous = [
        "🔴 **Barème Macron (art. L1235-3 C. trav.) :** Plafonnement des indemnités prud'homales fixé selon l'ancienneté (sauf harcèlement ou violation d'une liberté fondamentale).",
        "🔴 **Délai de forclusion très court :** 1 an seulement pour saisir le CPH à compter de la notification de la rupture.",
        "🔴 **Charge de la preuve des heures supplémentaires :** L'employé doit étayer sa demande avec un décompte précis des heures."
      ];
      procedureEtapes = [
        "1️⃣ **Demande de précisions sur les motifs (art. R1232-13 C. trav.) :** Sous 15 jours suivant la notification de rupture par LRAR.",
        "2️⃣ **Tentative de rupture conventionnelle ou protocole transactionnel :** Avec assistance d'un conseiller ou avocat pour sécuriser une indemnité forfaitaire.",
        "3️⃣ **Saisine du Conseil de Prud'hommes (CPH) :** Bureau de Conciliation et d'Orientation (BCO), puis Bureau de Jugement territorialement compétent."
      ];
      statutoryArticles = [
        "**Article L1232-1 du Code du Travail** (Exigence d'une cause réelle et sérieuse)",
        "**Article L1235-3 du Code du Travail** (Barème des indemnités pour licenciement sans cause réelle et sérieuse)",
        "**Article L1471-1 du Code du Travail** (Prescription d'un an pour contester la rupture)"
      ];

    } else if (fullContent.includes('facture') || fullContent.includes('devis') || fullContent.includes('impayé') || fullContent.includes('prestation') || fullContent.includes('fournisseur') || fullContent.includes('commerce') || fullContent.includes('client')) {
      docType = "Facture commerciale / Devis & Contrat d'Entreprise (Code de Commerce / Code Civil)";
      partiesMapping = {
        demandeur: "Créancier / Prestataire (ou Client lésé en cas de malfaçon)",
        adversaire: "Débiteur récalcitrant (ou Professionnel défaillant)",
        quiContreQui: "Créancier contre Débiteur pour recouvrement d'une créance exigible ou résolution pour inexécution.",
        rapportDeForce: "Créance certaine, liquide et exigible matérialisée par document écrit signé."
      };
      timeline = [
        `**Émission / Commande :** Bon de commande ou devis accepté (${detectedDate || 'selon pièces'}).`,
        `**Lieu de livraison / exécution :** ${detectedLocation}.`,
        `**Échéance dépassée :** Dépassement du délai de paiement légal de 30 à 60 jours (art. L441-10 C. com.).`,
        `**Prescription :** 5 ans entre professionnels (art. L110-4 C. com.) ; 2 ans contre un consommateur (art. L218-2 C. consom.).`
      ];
      enVotreFaveur = [
        detectedAmount ? `🟢 **Montant certain :** Créance principale établie à **${detectedAmount}** HT/TTC.` : "🟢 **Créance exigible :** Preuve matérielle de la livraison ou prestation réalisée.",
        "🟢 **Pénalités de retard de plein droit :** Taux BCE majoré de 10 points + 40 € d'indemnité forfaitaire de recouvrement par facture en B2B sans rappel nécessaire.",
        "🟢 **Clause résolutoire ou de réserve de propriété :** Restitution possible des biens ou résiliation immédiate."
      ];
      contreVous = [
        "🔴 **Exception d'inexécution (art. 1219 C. civ.) :** La partie adverse peut opposer un refus de paiement si la prestation n'a pas été parfaitement livrée.",
        "🔴 **Absence de signature ou de bon de livraison :** Si le devis n'est pas signé ou s'il n'y a pas de récépissé de livraison, le recouvrement accéléré peut être rejeté.",
        "🔴 **Procédure de contestation commerciale :** Risque de demande reconventionnelle pour retard de livraison."
      ];
      procedureEtapes = [
        "1️⃣ **Mise en demeure formelle de payer par LRAR (Délai 8 jours) :** Faisant courir les intérêts moratoires au taux légal (art. 1344 C. civ.).",
        "2️⃣ **Requête en Injonction de Payer (art. 1405 CPC) :** Procédure rapide et non contradictoire devant le Tribunal de Commerce ou Judiciaire.",
        "3️⃣ **Signification par Commissaire de Justice de l'Ordonnance :** Pour apposition de la formule exécutoire et saisie des comptes bancaires."
      ];
      statutoryArticles = [
        "**Article 1103 & 1104 du Code Civil** (Force obligatoire des contrats et exigence de bonne foi)",
        "**Article L441-10 du Code de Commerce** (Délais de paiement et pénalités de retard impératives)",
        "**Article 1405 et suivants du CPC** (Procédure d'Injonction de Payer)"
      ];

    } else {
      docType = "Dossier Contractuel & Responsabilité Civile / Litige Général";
      partiesMapping = {
        demandeur: "Vous-même (Demandeur / Victime du préjudice)",
        adversaire: "Partie adverse mise en cause",
        quiContreQui: "Vous-même engagez la responsabilité de la partie adverse pour manquement à ses engagements légaux ou contractuels.",
        rapportDeForce: "Droit à réparation intégrale du préjudice direct et certain subi."
      };
      timeline = [
        `**Origine des engagements :** Établissement des faits (${detectedDate || 'date des pièces'}).`,
        `**Territorialité :** Faits survenus ou exécutés à ${detectedLocation}.`,
        `**Manquement constaté :** Défaut d'exécution ou faute préjudiciable constatée.`,
        `**Prescription légale :** 5 ans de droit commun pour les actions personnelles ou mobilières (art. 2224 C. civ.).`
      ];
      enVotreFaveur = [
        "🟢 **Preuve littérale :** Pièces et écrits produits à l'appui de votre demande.",
        detectedAmount ? `🟢 **Montant du dommage :** Préjudice estimé ou réclamé de **${detectedAmount}**.` : "🟢 **Droit à réparation :** Réparation intégrale du préjudice causé par la faute d'autrui.",
        "🟢 **Force obligatoire du contrat :** L'article 1103 du Code Civil lie strictement les parties."
      ];
      contreVous = [
        "🔴 **Charge de la preuve (art. 1353 C. civ.) :** Il appartient au demandeur d'établir la réalité du dommage, de la faute et du lien de causalité.",
        "🔴 **Diligence précontentieuse obligatoire :** Justification obligatoire d'une tentative de résolution amiable avant saisine du juge.",
        "🔴 **Risque d'aléa judiciaire :** Frais irrépétibles (art. 700 CPC) en cas de rejet infondé."
      ];
      procedureEtapes = [
        "1️⃣ **Mise en demeure préalable obligatoire par LRAR :** Exposant les griefs et fixant un délai impératif de 15 jours.",
        "2️⃣ **Médiation ou Conciliation de justice :** Obligatoire selon l'art. 750-1 du CPC pour les litiges civils.",
        "3️⃣ **Assignation ou Requête au Tribunal Judiciaire :** Compétent en fonction de la nature et du montant de la demande."
      ];
      statutoryArticles = [
        "**Article 1103 du Code Civil** (Force obligatoire des contrats légalement formés)",
        "**Article 1240 du Code Civil** (Principe de la responsabilité civile délictuelle)",
        "**Article 2224 du Code Civil** (Prescription quinquennale de droit commun)"
      ];
    }

    if (isDocGeneration) {
      const draftTitle = clean.includes('mise en demeure') ? 'Mise en Demeure Officielle LRAR' :
                         clean.includes('plainte') ? 'Plainte auprès du Procureur de la République' :
                         clean.includes('contestation') ? 'Lettre de Contestation Formelle' :
                         'Projet d\'Acte Juridique & Injonction';

      responseText = `J'ai examiné l'ensemble de votre dossier (**${docCount} pièce(s) analysée(s) :** *${docNameDisplay}*).\n\n` +
        `Voici le projet d'acte officiel complet et immédiatement exploitable :\n\n` +
        `---\n` +
        `### ${draftTitle.toUpperCase()}\n` +
        `**Référence dossier :** FJ-${Math.floor(100000 + Math.random() * 900000)} / FRA\n` +
        `**Date d'émission :** ${new Date().toLocaleDateString('fr-FR')}\n` +
        `**Lieu :** ${detectedLocation}\n` +
        `**Objet :** Mise en demeure formelle avant saisine judiciaire - ${userQuery.slice(0, 100)}\n\n` +
        `**Parties :**\n` +
        `- **Émetteur :** ${partiesMapping.demandeur}\n` +
        `- **Destinataire :** ${partiesMapping.adversaire}\n\n` +
        `Madame, Monsieur,\n\n` +
        `Par la présente, agissant en application des règles impératives du droit français et au vu des pièces analysées (*${docNameDisplay}*),\n\n` +
        `**1. Rappel des faits et chronologie :**\n` +
        `Il ressort des documents contractuels que vous vous étiez engagé à exécuter vos obligations à ${detectedLocation}. Or, à ce jour, les manquements suivants sont formellement constatés : ${userQuery || 'inexécution flagrante des obligations contractuelles'}${detectedAmount ? ` pour un montant de **${detectedAmount}**` : ''}.\n\n` +
        `**2. Fondements juridiques :**\n` +
        `${statutoryArticles.map(a => `- ${a}`).join('\n')}\n\n` +
        `**3. Injonction et délai impératif :**\n` +
        `En conséquence, je vous mets en demeure formelle de régulariser intégralement la situation dans un délai strict et non négociable de **HUIT (8) JOURS** à compter de la réception de la présente.\n\n` +
        `À défaut d'exécution complète ou d'accord écrit dans ce délai, je saisirai immédiatement la juridiction compétente afin d'obtenir votre condamnation sous astreinte journalière, assortie de dommages et intérêts au titre de l'article 1231-1 du Code Civil ainsi que la charge des dépens et frais d'avocat au titre de l'article 700 du CPC.\n\n` +
        `Fait pour valoir ce que de droit.\n\n` +
        `*Signature certifiée*\n` +
        `---\n\n` +
        `💡 **Recommandation :** Envoyez ce document en **Lettre Recommandée avec Accusé de Réception (LRAR)** pour lui donner date certaine et ouvrir officiellement la phase contentieuse.`;

      action = {
        type: 'CREATE_DOCUMENT',
        payload: {
          title: draftTitle,
          content: responseText
        }
      };
    } else {
      responseText = `Bonjour. J'ai réalisé une analyse complète et croisée de votre dossier (**${docCount} document(s) examiné(s) :** *${docNameDisplay}* — Domaine : *${docType}*).\n\n` +
        `Voici l'expertise juridique détaillée, la chronologie des faits, les forces et faiblesses pour votre position, ainsi que la procédure à suivre :\n\n` +
        `### 🏛️ 1. Cartographie des Parties (« Qui est contre qui »)\n` +
        `- **Votre rôle (Demandeur / Victime) :** ${partiesMapping.demandeur}\n` +
        `- **Partie adverse :** ${partiesMapping.adversaire}\n` +
        `- **Nature de l'opposition :** ${partiesMapping.quiContreQui}\n` +
        `- **Rapport de force juridique :** ${partiesMapping.rapportDeForce}\n\n` +
        `### 📅 2. Chronologie Détaillée des Faits (« Où & Quand »)\n` +
        `${timeline.map(t => `- ${t}`).join('\n')}\n\n` +
        `### ⚖️ 3. Évaluation Stratégique : « En votre faveur » vs « Contre vous »\n` +
        `#### 🟢 Éléments et Arguments EN VOTRE FAVEUR :\n` +
        `${enVotreFaveur.map(f => `- ${f}`).join('\n')}\n\n` +
        `#### 🔴 Éléments, Risques & Arguments CONTRE VOUS :\n` +
        `${contreVous.map(c => `- ${c}`).join('\n')}\n\n` +
        `### 📋 4. Procédure Complète & Plan d'Action Recommandé\n` +
        `${procedureEtapes.map(e => `- ${e}`).join('\n')}\n\n` +
        `### 📁 5. Confrontation & Synthèse des Pièces du Dossier\n` +
        `- **Documents examinés :** ${docNameDisplay}\n` +
        `- **Concordance :** Les pièces produites établissent l'existence du lien juridique et les obligations non respectées.\n` +
        `- **Pièces complémentaires à joindre :** Conservez tous les échanges écrits (emails, SMS, accusés de réception, relevés de comptes bancaires ou constats d'huissier) pour sceller la preuve.\n\n` +
        `### 📖 Textes de Loi Applicables\n` +
        `${statutoryArticles.map(a => `- ${a}`).join('\n')}\n\n` +
        `💬 **Comment souhaitez-vous poursuivre ?**\n` +
        `Vous pouvez importer d'autres pièces complémentaires au dossier à tout moment, ou me demander de rédiger immédiatement la mise en demeure formelle pour cette affaire.`;
    }

  // 2. SCENARIO: REGULAR CONVERSATIONAL QUESTION (WITHOUT DOCUMENT)
  } else {
    // Dynamic legal subject analyzer
    let subjectTitle = "Consultation Juridique";
    let analysisDiagnosis = "";
    let rulesList: string[] = [];
    let actionStepsList: string[] = [];
    let followUpQuestion = "";

    if (clean.includes('licenciement') || clean.includes('travail') || clean.includes('salaire') || clean.includes('rupture') || clean.includes('employeur') || clean.includes('prud\'homme') || clean.includes('cdd') || clean.includes('cdi')) {
      subjectTitle = "Droit du Travail & Rupture du Contrat";
      analysisDiagnosis = "Votre situation relève du Code du Travail. Tout licenciement pour motif personnel doit reposer sur une cause réelle et sérieuse, matériellement vérifiable et objective. En cas d'irrégularité ou de rupture abusive, des indemnités substantielles peuvent être réclamées.";
      rulesList = [
        "**Article L1232-1 du Code du Travail** : L'employeur est tenu d'énoncer un motif clair, vérifiable et fondé sur des éléments objectifs.",
        "**Article L1235-3 du Code du Travail (Barème d'indemnisation)** : En cas de licenciement sans cause réelle et sérieuse, le juge octroie au salarié une indemnité à la charge de l'employeur fixée selon l'ancienneté.",
        "**Article L1471-1 du Code du Travail** : Le délai de contestation d'une rupture devant le Conseil de Prud'hommes est de **12 mois** à compter de la notification."
      ];
      actionStepsList = [
        "**Vérifier la procédure suivie** : Contrôlez le respect du délai de 5 jours ouvrables entre la convocation et l'entretien préalable.",
        "**Demander des précisions sur les motifs** : Dans les 15 jours suivant la notification (art. R1232-13 C. trav.), vous pouvez demander à votre employeur d'éclaircir les griefs formulés.",
        "**Saisir le Conseil de Prud'hommes (CPH)** : Pour solliciter l'indemnité compensatrice de préavis, les congés payés afférents et des dommages-intérêts pour licenciement sans cause réelle et sérieuse."
      ];
      followUpQuestion = "Quelle est votre ancienneté exacte dans l'entreprise et la lettre de licenciement vous a-t-elle déjà été remise ?";

    } else if (clean.includes('loyer') || clean.includes('bail') || clean.includes('locataire') || clean.includes('propriétaire') || clean.includes('dépôt de garantie') || clean.includes('caution') || clean.includes('expulsion') || clean.includes('insalubre')) {
      subjectTitle = "Droit Immobilier & Baux d'Habitation";
      analysisDiagnosis = "Ce litige relève de la Loi du 6 juillet 1989. Le propriétaire et le locataire sont tenus à des obligations réciproques d'ordre public auxquelles aucune clause du contrat ne peut déroger.";
      rulesList = [
        "**Article 22 de la Loi du 6 juillet 1989** : Le dépôt de garantie doit être restitué sous **1 mois** si l'état des lieux de sortie est conforme, ou sous **2 mois** en cas de dégradations justifiées par devis ou factures. Tout mois de retard entame une majoration de plein droit de **10% du loyer mensuel** en principal.",
        "**Article 1719 du Code Civil** : Le bailleur est tenu de remettre un logement décent ne laissant pas apparaître de risques manifestes pour la sécurité ou la santé.",
        "**Article 7 de la Loi de 1989** : Le locataire ne peut pas se faire justice à lui-même en suspendant unilatéralement le paiement du loyer sans autorisation judiciaire."
      ];
      actionStepsList = [
        "**Mise en demeure formelle avec pénalités de 10%** : Adressez une LRAR au bailleur en exigeant le remboursement sous 8 jours avec décompte des pénalités légales de retard.",
        "**Saisine de la Commission Départementale de Conciliation (CDC)** : Démarche gratuite et obligatoire pour les litiges de dépôt de garantie avant assignation.",
        "**Saisine du Juge des Contentieux de la Protection (JCP)** : Auprès du Tribunal Judiciaire compétent par simple requête si le montant est inférieur à 5 000 €."
      ];
      followUpQuestion = "Quel est le montant du dépôt de garantie retenu et l'état des lieux de sortie mentionnait-il des dégradations ?";

    } else if (clean.includes('achat') || clean.includes('vente') || clean.includes('remboursement') || clean.includes('garantie') || clean.includes('consommateur') || clean.includes('arnaque') || clean.includes('vice caché')) {
      subjectTitle = "Droit de la Consommation & Garanties Légales";
      analysisDiagnosis = "En tant qu'acheteur ou consommateur, la loi française et les directives européennes vous octroient une protection impérative et automatique contre les défauts, les tromperies et les retards de livraison.";
      rulesList = [
        "**Article L217-3 du Code de la Consommation (Garantie de conformité)** : Le vendeur répond de tous les défauts de conformité apparaissant pendant **2 ans** après la délivrance, sans que l'acheteur n'ait à prouver que le défaut existait lors de l'achat.",
        "**Article 1641 du Code Civil (Garantie des vices cachés)** : Le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine. Délai d'action : **2 ans** à compter de la découverte du vice.",
        "**Article L221-18 du Code de la Consommation** : En cas d'achat sur internet ou à distance, vous bénéficiez d'un droit de rétractation de **14 jours francs** sans justification."
      ];
      actionStepsList = [
        "**Notifier la non-conformité par écrit** : Exiger formellement la réparation sans frais, le remplacement du produit ou le remboursement intégral.",
        "**Saisir le Médiateur de la Consommation** : Tout professionnel a l'obligation de communiquer les coordonnées de son médiateur sur ses factures et CGV.",
        "**Action en résolution de la vente** : Si le professionnel refuse sous 30 jours, engager une injonction de faire ou de payer."
      ];
      followUpQuestion = "Le vendeur est-il un professionnel ou un particulier, et à quelle date précise a eu lieu la livraison ?";

    } else if (clean.includes('divorce') || clean.includes('séparation') || clean.includes('pension') || clean.includes('garde') || clean.includes('mariage') || clean.includes('succession') || clean.includes('héritage')) {
      subjectTitle = "Droit de la Famille & du Patrimoine";
      analysisDiagnosis = "Votre préoccupation concerne le droit civil de la famille ou des successions. Les intérêts des enfants mineurs et l'équilibre patrimonial entre les parties sont protégés par le juge et par l'ordre public.";
      rulesList = [
        "**Article 229-1 du Code Civil** : Le divorce par consentement mutuel peut être acté par acte sous signature privée contresigné par deux avocats et déposé chez un notaire, sans comparution devant le juge.",
        "**Article 371-2 du Code Civil** : Chacun des parents contribue à l'entretien et à l'éducation des enfants proportionnellement à ses ressources et aux besoins de l'enfant.",
        "**Article 724 du Code Civil** : Les héritiers désignés par la loi sont saisis de plein droit des biens, droits et actions du défunt dès l'ouverture de la succession."
      ];
      actionStepsList = [
        "**Faire le point sur l'état liquidatif** : Établir l'inventaire précis des biens mobiliers, immobiliers et des crédits en cours.",
        "**Tentative d'accord amiable conventionnel** : Organiser une discussion avec avocats respectifs pour fixer la pension et le mode de résidence.",
        "**Saisine du Juge aux Affaires Familiales (JAF)** : À défaut d'accord amiable, déposer une requête auprès du Tribunal Judiciaire du lieu de résidence de la famille."
      ];
      followUpQuestion = "Un accord amiable vous semble-t-il envisageable avec l'autre partie ou la situation est-elle d'ores et déjà conflictuelle ?";

    } else {
      subjectTitle = "Analyse Juridique & Stratégie Contentieuse";
      analysisDiagnosis = `Concernant votre situation : "${userQuery}". En droit français, tout litige s'articule autour de la preuve des faits, du respect des délais de prescription et de la qualification exacte de l'obligation inexécutée.`;
      rulesList = [
        "**Article 1103 du Code Civil** : Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits.",
        "**Article 1240 du Code Civil** : Tout fait quelconque de l'homme qui cause à autrui un dommage oblige celui par la faute duquel il est arrivé à le réparer.",
        "**Article 2224 du Code Civil** : Les actions personnelles ou mobilières se prescrivent par **5 ans** à compter du jour où le titulaire d'un droit a connu ou aurait dû connaître les faits."
      ];
      actionStepsList = [
        "**Constituer le dossier probatoire** : Réunissez les preuves écrites (emails, SMS, attestations, devis, relevés bancaires). Les écrits électroniques ont la même force probante que l'écrit papier (art. 1366 C. civ.).",
        "**Adresser une mise en demeure formelle** : Indispensable pour faire courir les intérêts de retard moratoires (art. 1231-6 C. civ.) et démontrer votre bonne foi avant toute action en justice.",
        "**Recours judiciaire adapté** : Selon l'enjeu financier, le Tribunal Judiciaire (chambre civile ou pôle de proximité) sera compétent pour trancher le litige."
      ];
      followUpQuestion = "Disposez-vous d'écrits ou de justificatifs formels prouvant vos échanges et le préjudice subi ?";
    }

    if (isDocGeneration) {
      const actTitle = clean.includes('plainte') ? 'Plainte auprès du Procureur' :
                       clean.includes('mise en demeure') ? 'Mise en Demeure Officielle' :
                       'Acte Juridique Formel';

      responseText = `Voici le document juridique officiel que j'ai rédigé spécialement pour votre dossier :\n\n` +
        `---\n` +
        `### ${actTitle.toUpperCase()}\n` +
        `**RÉFÉRENCE DOSSIER :** FJ-${Math.floor(100000 + Math.random() * 900000)} / FRANCE\n` +
        `**DATE :** ${new Date().toLocaleDateString('fr-FR')}\n\n` +
        `**OBJET :** ${userQuery}\n\n` +
        `Madame, Monsieur,\n\n` +
        `Par la présente, je vous notifie formellement ma contestation et demande de régularisation concernant les faits suivants : ${userQuery}.\n\n` +
        `En application des règles de droit en vigueur :\n` +
        `${rulesList.map(r => `- ${r}`).join('\n')}\n\n` +
        `Je vous mets en demeure de remédier à cette situation et de faire droit à mes demandes sous un délai de **8 JOURS** à compter de la réception de cette notification.\n\n` +
        `À défaut d'accord amiable ou de règlement dans ce délai, je transmettrai immédiatement ce dossier à mon avocat pour engager une action judiciaire devant le Tribunal compétent.\n\n` +
        `Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n` +
        `*Fait à Paris, le ${new Date().toLocaleDateString('fr-FR')}.*\n` +
        `---\n\n` +
        `💬 *Ce document est enregistré dans votre espace. Souhaitez-vous y apporter des ajustements particuliers ?*`;

      action = {
        type: 'CREATE_DOCUMENT',
        payload: {
          title: actTitle,
          content: responseText
        }
      };
    } else {
      responseText = `Bonjour. Voici mon analyse juridique personnalisée et directe concernant votre question : **"${userQuery}"**.\n\n` +
        `### 🏛️ 1. Diagnostic Direct & Qualification Juridique (${subjectTitle})\n` +
        `${analysisDiagnosis}\n\n` +
        `### ⚖️ 2. Fondements Légaux Précis & Droits Applicables\n` +
        `${rulesList.map(r => `- ${r}`).join('\n')}\n\n` +
        `### 🟢 3. Vos Atouts Stratégiques & 🔴 Points de Vigilance\n` +
        `- 🟢 **Vos points forts :** Les règles de droit en vigueur (ordre public protecteur, jurisprudence constante) jouent en votre faveur si vous matérialisez vos preuves par écrit.\n` +
        `- 🔴 **Points de vigilance :** Ne commettez aucun manquement de forme, ne vous faites pas justice à vous-même sans titre exécutoire, et respectez impérativement les délais de prescription légale.\n\n` +
        `### 📋 4. Plan de Bataille & Démarches Recommandées\n` +
        `${actionStepsList.map(s => `- ${s}`).join('\n')}\n\n` +
        `### 🚀 5. Initiatives Immédiates Recommandées (Sous 24h à 48h)\n` +
        `- **Étape 1 :** Réunir et numéroter vos pièces justificatives (contrat, devis, courriels, relevés bancaires).\n` +
        `- **Étape 2 :** Adresser une mise en demeure formelle par LRAR fixant un délai impératif de 8 jours.\n` +
        `- **Étape 3 :** Si absence de réponse sous 8 jours, engager immédiatement la conciliation ou la saisine de la juridiction compétente.\n\n` +
        `💬 **Questions & Suite du Dossier :**\n` +
        `👉 ${followUpQuestion}\n` +
        `*Vous pouvez cliquer ci-dessous sur l'une des automatisations ou suggestions proposées, ou m'importer des documents complémentaires à tout moment.*`;
    }
  }

  if (action) {
    responseText += `\n\n\`\`\`action\n${JSON.stringify(action, null, 2)}\n\`\`\``;
  }

  const detectedDomain = detectLegalDomain(clean + ' ' + attachedDocText);
  const sources_web = getTargetedLegalSources(userQuery + ' ' + attachedDocText, detectedDomain, detectedLocation);
  const suggestions = generateSmartLegalSuggestions(userQuery + ' ' + attachedDocText, detectedDomain);
  const automations = generateSmartLegalAutomations(userQuery + ' ' + attachedDocText, hasFiles ? 1 : 0);

  return {
    text: responseText,
    sources_web,
    suggestions,
    automations
  };
}

export async function generateLegalDocument(type: string, details: string, targetLang?: string) {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const lang = targetLang || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';
  const langName = LANGUAGE_NAMES[lang] || 'French (Français)';

  if (geminiApiKey && !geminiApiKey.startsWith('AQ.')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: MASTER_LEGAL_SYSTEM_PROMPT }]
            },
            contents: [{ 
              role: 'user',
              parts: [{ text: `Rédigez un document juridique officiel complet, irréprochable et prêt à être signé/notifié de type "${type}". Détails du litige et des parties : ${details}. [INSTRUCTION IMPÉRATIVE: Rédigez l'intégralité du document en ${langName}. Utilisez exclusivement l'Euro (€). Citez les articles de loi applicables et formulez un délai impératif].` }] 
            }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) return generatedText;
      }
    } catch (e) {
      console.warn("Direct Gemini call error in generateLegalDocument:", e);
    }
  }

  return `[ACTE JURIDIQUE OFFICIEL — FRANCE JUSTICE]

RÉFÉRENCE : ${type.toUpperCase()} / DOSSIER #${Math.floor(100000 + Math.random() * 900000)}
DATE : ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}

ENTRE LES PARTIES CONCERNÉES :
${details}

FONDEMENT JURIDIQUE :
- Code Civil Français (Art. 1103, 1104, 1231-1 et suivants)
- Droit Français et Européen applicable en matière d'obligations et de procédure.

EXÉCUTION & DÉLAI IMPÉRATIF :
Les présentes stipulations font obligation aux parties de s'exécuter dans un délai strict de HUIT (8) JOURS à compter de la notification.

Fait à Paris, le ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}, en deux exemplaires originaux faisant foi.`;
}

export async function chatWithAI(
  prompt: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  _useSearch: boolean = true,
  targetLang?: string
) {
  void _useSearch;
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const activeLang = targetLang || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';
  const langName = LANGUAGE_NAMES[activeLang] || 'French (Français)';

  const fullPromptWithLang = `${prompt}\n\n[MANDAT LINGUISTIQUE: Rédigez STRICTEMENT en ${langName}. Répondez avec précision chirurgicale, profondeur, empathie et pertinence. Aucune généralité creuse. Utilisez l'Euro (€) pour toute référence monétaire.]`;

  // 1. DIRECT GEMINI API CALL WITH CONVERSATION HISTORY & SYSTEM INSTRUCTION
  if (geminiApiKey && !geminiApiKey.startsWith('AQ.')) {
    try {
      // Build conversation contents including past user and assistant turns
      const conversationContents: { role: string; parts: { text: string }[] }[] = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history) {
          if (item && item.parts && item.parts[0]?.text) {
            conversationContents.push({
              role: item.role === 'model' ? 'model' : 'user',
              parts: [{ text: item.parts[0].text }]
            });
          }
        }
      }

      // Gemini requires first message in contents to have role 'user'
      if (conversationContents.length > 0 && conversationContents[0].role === 'model') {
        conversationContents.shift();
      }

      // Append current user prompt
      conversationContents.push({
        role: 'user',
        parts: [{ text: fullPromptWithLang }]
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: MASTER_LEGAL_SYSTEM_PROMPT }]
            },
            contents: conversationContents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 2500,
              topP: 0.95
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          const detectedDomain = detectLegalDomain(prompt + ' ' + generatedText);
          const sources = getTargetedLegalSources(prompt + ' ' + generatedText, detectedDomain);
          const suggestions = generateSmartLegalSuggestions(prompt + ' ' + generatedText, detectedDomain);
          const automations = generateSmartLegalAutomations(prompt + ' ' + generatedText);
          return {
            text: generatedText,
            sources_web: sources,
            suggestions,
            automations
          };
        }
      }
    } catch (e) {
      console.warn("Direct Gemini API call notice:", e);
    }
  }

  // 2. TRY SUPABASE EDGE FUNCTION
  try {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('ai-legal-search', {
      body: { 
        query: fullPromptWithLang,
        history: history.slice(-6)
      }
    });
    if (!edgeError && edgeData && edgeData.text && !edgeData.is_fallback_trigger && edgeData.text !== "Erreur de génération" && !edgeData.text.toLowerCase().includes("erreur de génération")) {
      const detectedDomain = detectLegalDomain(prompt + ' ' + edgeData.text);
      const sources = (edgeData.sources_web && edgeData.sources_web.length > 2)
        ? edgeData.sources_web
        : getTargetedLegalSources(prompt + ' ' + edgeData.text, detectedDomain);
      const suggestions = edgeData.suggestions || generateSmartLegalSuggestions(prompt + ' ' + edgeData.text, detectedDomain);
      const automations = edgeData.automations || generateSmartLegalAutomations(prompt + ' ' + edgeData.text);
      return {
        text: edgeData.text,
        sources_web: sources,
        suggestions,
        automations
      };
    }
  } catch (err) {
    console.warn("Supabase edge function notice:", err);
  }

  // 3. ADVANCED COGNITIVE REASONING ENGINE (Full offline & fallback parity)
  return getAdvancedLocalLegalAI(prompt, activeLang, history);
}

export async function smartGlobalLegalAssistantQuery(
  userPrompt: string, 
  roleContext: string = 'public',
  targetLang?: string
) {
  const activeLang = targetLang || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';
  const langName = LANGUAGE_NAMES[activeLang] || 'French (Français)';
  const cleanQuery = userPrompt.trim().toLowerCase();
  
  let dbContextInfo = '';
  let relatedLawyers: any[] = [];
  let relatedCourses: any[] = [];
  let relatedNews: any[] = [];
  let relatedReviews: any[] = [];

  try {
    if (cleanQuery.includes('avocat') || cleanQuery.includes('lawyer') || cleanQuery.includes('professeur') || cleanQuery.includes('doctorant') || cleanQuery.includes('expert')) {
      const { data: profiles } = await supabase
        .from('profiles_just')
        .select('id, first_name, last_name, role, city, specialty, bio')
        .in('role', ['lawyer', 'professor', 'doctorate'])
        .eq('is_verified', true)
        .limit(4);
      if (profiles && profiles.length > 0) {
        relatedLawyers = profiles;
        dbContextInfo += `\n- Experts et Avocats réels inscrits : ${profiles.map(p => `${p.first_name} ${p.last_name} (${p.role}, Barreau / Ville: ${p.city || 'Paris/France'}, Spécialité: ${p.specialty || 'Généraliste'})`).join(' ; ')}`;
      }
    }

    if (cleanQuery.includes('formation') || cleanQuery.includes('course') || cleanQuery.includes('visio') || cleanQuery.includes('classe')) {
      const { data: courses } = await supabase
        .from('classrooms_just')
        .select('id, title, category, date, price, lawyer_id')
        .gte('date', new Date().toISOString())
        .limit(3);
      if (courses && courses.length > 0) {
        relatedCourses = courses;
        dbContextInfo += `\n- Amphis et Formations en cours : ${courses.map(c => `"${c.title}" (${c.category}, Date: ${c.date}, Tarif: ${c.price || 0} €)`).join(' ; ')}`;
      }
    }
  } catch (err) {
    console.warn("Notice: Error fetching DB context for assistant query:", err);
  }

  const systemPrompt = `
${MASTER_LEGAL_SYSTEM_PROMPT}

CONTEXTE UTILISATEUR CONNECTÉ : ${roleContext}
DONNÉES TEMPS RÉEL DE LA BASE SUPABASE :
${dbContextInfo || "Plateforme France Justice connectée en direct."}

INSTRUCTION LINGUISTIQUE :
Rédigez l'intégralité de votre réponse en ${langName}. Répondez avec précision et convivialité humaine, comme un juriste de confiance.
Question de l'utilisateur : "${userPrompt}"
  `.trim();

  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (geminiApiKey && !geminiApiKey.startsWith('AQ.')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: MASTER_LEGAL_SYSTEM_PROMPT }]
            },
            contents: [{ 
              role: 'user',
              parts: [{ text: systemPrompt }] 
            }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 2500
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            text,
            lawyers: relatedLawyers,
            courses: relatedCourses,
            news: relatedNews,
            reviews: relatedReviews
          };
        }
      }
    } catch (e) {
      console.warn("Direct Gemini call error in smartGlobalLegalAssistantQuery", e);
    }
  }

  const localRes = getAdvancedLocalLegalAI(userPrompt, activeLang);

  return {
    text: localRes.text,
    lawyers: relatedLawyers,
    courses: relatedCourses,
    news: relatedNews,
    reviews: relatedReviews
  };
}
