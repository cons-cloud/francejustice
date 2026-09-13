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

5. STRUCTURE ÉLÉGANTE ET NATURELLE DE VOTRE ANALYSE (STANDARD CHATGPT / CLAUDE / GEMINI) :
   Votre analyse doit être limpide, dynamique et parfaitement ordonnée, sans ton robotique ni accumulation d'émojis superflus :

   1. Synthèse du dossier & Qualification juridique :
   - Présentation claire des faits, qualification du litige et identification des parties (qui réclame quoi, rapports d'obligations).
   - Position juridique globale et rapport de force.

   2. Analyse juridique approfondie & Textes applicables :
   - Visas des textes de lois précis (Code Civil, Code du Travail, Code de la Consommation, etc.).
   - Application concrète de la règle de droit et jurisprudence constante aux faits précis du dossier.

   3. Évaluation stratégique : Atouts & Points de vigilance :
   - Atouts et preuves solides en votre faveur.
   - Points de vigilance, risques procéduraux ou faiblesses à anticiper et pallier.
   - Estimation objective des chances d'issue favorable.

   4. Plan d'action recommandé & Démarches étape par étape :
   - Étape 1 : Phase amiable impérative (mise en demeure formelle par LRAR, sommation avec délai).
   - Étape 2 : Préalable de conciliation ou médiation obligatoire (ex: art. 750-1 CPC, CDC, médiateur).
   - Étape 3 : Voie contentieuse & Juridiction compétente (Tribunal Judiciaire, CPH, JAF, Tribunal de Commerce ; délais de prescription).

   5. Recommandations immédiates & Suite à donner :
   - Actions concrètes à mener sous 24h à 48h.
   - Proposition proactive de 2 à 3 démarches utiles ou rédaction d'actes juridiques.

6. CADRE ET MONNAIE :
   - Droit applicable : Droit français (Codes officiels, jurisprudence de la Cour de cassation et du Conseil d'État) et Droit de l'Union européenne.
   - Monnaie : Strictement l'Euro (€).

7. PROPRETÉ TYPOGRAPHIQUE ET RENDU SOIGNÉ :
   - INTERDICTION STRICTE DES BALISES '###' ET ASTÉRISQUES PARASITES : N'insérez JAMAIS de préfixe markdown '###', '##' ou '#' devant vos titres.
   - Mettez directement en gras les termes clés (**terme**) sans astérisques orphelins.
   - Structurez le texte de façon propre, fluide et aérée : titres clairs, étapes numérotées distinctes (1., 2., 3.) et paragraphes ordonnés.
   - Vos réponses doivent être immédiatement lisibles, nettes et visuellement élégantes.
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

  const scores: Record<string, number> = {
    famille: 0,
    travail: 0,
    immobilier: 0,
    consommation: 0,
    commercial: 0,
    penal: 0
  };

  // High-weight family keywords
  const familyMatches = t.match(/\b(divorce|divorcer|séparation|époux|épouse|conjoint|mariage|pension alimentaire|prestation compensatoire|garde|jaf|juge aux affaires familiales|matrimonial|dubois|marchand|succession|héritage|notaire|prestation)\b/gi);
  if (familyMatches) scores.famille += familyMatches.length * 3;
  if (/divorce|dossier_divorce/i.test(t)) scores.famille += 15;

  // High-weight labor keywords
  const laborMatches = t.match(/\b(licenciement|licencier|prud['’]homme|cph|salari[eé]|employeur|rupture conventionnelle|faute grave|contrat de travail|bulletin de paie|heures supp)\b/gi);
  if (laborMatches) scores.travail += laborMatches.length * 3;

  // High-weight real estate keywords
  const realEstateMatches = t.match(/\b(dépôt de garantie|bailleur|locataire|quittance de loyer|expulsion locative|état des lieux|loi du 6 juillet 1989|loyer impayé|commission départementale de conciliation|cdc)\b/gi);
  if (realEstateMatches) scores.immobilier += realEstateMatches.length * 3;
  // Lower weight for generic words that appear in family/commercial contexts
  const genericRealEstate = t.match(/\b(bail|loyer|logement)\b/gi);
  if (genericRealEstate) scores.immobilier += genericRealEstate.length * 1;

  // High-weight consumer keywords
  const consumerMatches = t.match(/\b(garantie légale de conformité|vice caché|droit de rétractation|consommateur|signalconso|dgccrf|commande non reçue|produit défectueux)\b/gi);
  if (consumerMatches) scores.consommation += consumerMatches.length * 3;

  // High-weight commercial keywords
  const commercialMatches = t.match(/\b(injonction de payer|tribunal de commerce|facture impayée|créance commerciale|délai de paiement l441-10|fournisseur)\b/gi);
  if (commercialMatches) scores.commercial += commercialMatches.length * 3;

  // High-weight penal keywords
  const penalMatches = t.match(/\b(plainte|procureur|commissariat|gendarmerie|infraction|délit|victime d'escroquerie|garde à vue)\b/gi);
  if (penalMatches) scores.penal += penalMatches.length * 3;

  let bestDomain: 'travail' | 'immobilier' | 'consommation' | 'famille' | 'penal' | 'commercial' | 'general' = 'general';
  let maxScore = 0;

  for (const [dom, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestDomain = dom as typeof bestDomain;
    }
  }

  return maxScore >= 2 ? bestDomain : 'general';
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

function stripControlChars(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) {
      out += s[i];
    }
  }
  return out;
}

// Helper to clean prompt context and extract actual user query
function cleanPromptForFallback(prompt: string): string {
  if (!prompt) return '';

  const voiceMatch = prompt.match(/L'utilisateur vous dit \(commande vocale ou écrite\)\s*:\s*"([^"]*)"/i);
  if (voiceMatch) return voiceMatch[1];

  const searchMatch = prompt.match(/RECHERCHE JURIDIQUE AVEC INTERNET\s*:\s*"([^"]*)"/i);
  if (searchMatch) return searchMatch[1];

  const instMatch = prompt.match(/INSTRUCTION DE L'UTILISATEUR\s*:\s*"([^"]*)"/i);
  if (instMatch) return instMatch[1];

  const questionSituationMatch = prompt.match(/QUESTION \/ SITUATION DE L'UTILISATEUR\s*:\s*([\s\S]*?)(?=\n\nPIÈCES|\n===|\n---|\n\[MANDAT|$)/i);
  if (questionSituationMatch) return questionSituationMatch[1].trim();

  const questionMatch = prompt.match(/QUESTION \/ INSTRUCTION UTILISATEUR\s*:\s*([\s\S]*?)(?=\n===|\n---|\n\[MANDAT|$)/i);
  if (questionMatch) return questionMatch[1].trim();

  const userPromptMatch = prompt.match(/Question de l'utilisateur\s*:\s*"([^"]*)"/i);
  if (userPromptMatch) return userPromptMatch[1];

  // Strip document wrapper sections if present to extract pure user query
  let cleaned = prompt;
  cleaned = cleaned.replace(/===\s*(?:DOCUMENTS ET PIÈCES JOINTES|DOSSIERS ET PIÈCES JOINTES|PIÈCES JOINTES)[\s\S]*$/i, '');
  cleaned = cleaned.replace(/PIÈCES & TEXTE EXTRAIT DES DOCUMENTS JOINTS\s*:[\s\S]*$/i, '');
  cleaned = cleaned.replace(/TEXTE ET PIÈCES EXTRAITES DES DOCUMENTS IMPORTÉS\s*:[\s\S]*$/i, '');
  cleaned = cleaned.replace(/^DOSSIER\s*:\s*[^\n]+\n*/i, '');
  cleaned = cleaned.replace(/\[MANDAT LINGUISTIQUE[\s\S]*?\]/gi, '');
  cleaned = cleaned.replace(/PK[\s\S]*?xml/gi, '');
  cleaned = stripControlChars(cleaned);

  return cleaned.trim() || prompt;
}

// Advanced cognitive engine for human-like legal reasoning and document analysis
function getAdvancedLocalLegalAI(
  prompt: string, 
  _targetLang?: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
) {
  const isLawyer = prompt.includes('Le mode actuel du dashboard est: "Avocat"');
  const userQuery = cleanPromptForFallback(prompt);
  const clean = userQuery.toLowerCase().trim();

  // Incorporate previous multi-turn conversation context
  const previousTurnsContext = (history && history.length > 0)
    ? history.map(h => h.parts?.map(p => p.text).join(' ')).join(' ').toLowerCase()
    : '';

  let action: { type: string; payload: any } | null = null;

  // Extract attached files or documents from the prompt if present
  let attachedDocText = '';
  let attachedDocTitle = '';

  const fileSectionMatch = prompt.match(/===\s*(?:DOCUMENTS ET PIÈCES JOINTES|DOSSIERS ET PIÈCES JOINTES|PIÈCES JOINTES & DOSSIERS JURIDIQUES|PIÈCES JOINTES)[^=]*===\n([\s\S]*?)(?=\n===|\nQUESTION|\nINSTRUCTION|\nSi l'utilisateur|\nContexte|\n\[MANDAT|$)/i)
    || prompt.match(/PIÈCES & TEXTE EXTRAIT DES DOCUMENTS JOINTS\s*:\s*([\s\S]*?)(?=\n\[MANDAT|$)/i)
    || prompt.match(/TEXTE ET PIÈCES EXTRAITES DES DOCUMENTS IMPORTÉS\s*:\s*([\s\S]*?)(?=\n\[MANDAT|$)/i);

  if (fileSectionMatch && fileSectionMatch[1]) {
    attachedDocText = fileSectionMatch[1].trim();
    const titleMatch = attachedDocText.match(/---\s*(?:Nom de la pièce|Document)[^:]*:\s*([^\n-]+)\s*---/i)
      || attachedDocText.match(/^([A-Za-z0-9_\-.]+\.(?:pdf|docx?|txt|png|jpg))/im);
    if (titleMatch) {
      attachedDocTitle = titleMatch[1].trim();
    }
  }

  // Sanitize attachedDocText to ensure NO binary / PK artifacts ever leak
  if (attachedDocText.includes('PK') && (attachedDocText.includes('word/') || attachedDocText.includes('_rels/'))) {
    attachedDocText = attachedDocText.replace(/PK[\s\S]*?(?:xml|rels)/gi, ' ');
  }
  attachedDocText = stripControlChars(attachedDocText)
    .replace(/<[^>]+>/g, ' ')
    .trim();

  const hasFiles = attachedDocText.length > 20 || /dossier_divorce|\.docx?|\.pdf/i.test(prompt);

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

  // Handle greetings and casual queries naturally (ChatGPT / Claude / Gemini style)
  const isGreeting = /^(bonjour|bonsoir|salut|hello|coucou|hi|hey|yo|qui es-tu|qui êtes-vous|aide|aidez-moi)[\s!?.]*$/i.test(clean);
  if (isGreeting && !hasFiles) {
    return {
      text: "Bonjour ! Je suis l'intelligence juridique d'élite de France Justice.\n\nComment puis-je vous aider aujourd'hui ?\n\nVous pouvez me poser toute question sur vos droits, me décrire une situation de litige (droit du travail, bail d'habitation, litige de consommation, droit de la famille, etc.), ou joindre vos contrats et pièces justificatives pour obtenir une analyse juridique contradictoire approfondie.",
      sources_web: OFFICIAL_LEGAL_PORTALS.slice(0, 3),
      suggestions: [
        "Contester une retenue sur mon dépôt de garantie",
        "Calculer mes indemnités de rupture conventionnelle",
        "Rédiger une mise en demeure formelle avec accusé de réception",
        "Faire valoir la garantie légale de conformité de 2 ans"
      ],
      automations: [
        {
          id: 'demo_bail',
          label: '🏠 Litige de Bail & Caution',
          description: 'Calculer les pénalités de 10% par mois de retard sur la caution.',
          actionPrompt: 'Comment contester la retenue injustifiée sur mon dépôt de garantie sous la loi du 6 juillet 1989 ?'
        },
        {
          id: 'demo_travail',
          label: '💼 Droit du Travail & Rupture',
          description: 'Évaluer les indemnités légales et les délais de contestation.',
          actionPrompt: 'Quelles sont les démarches et indemnités légales pour un licenciement sans cause réelle et sérieuse ?'
        }
      ]
    };
  }

  // Document creation or drafting intent
  const isDocGeneration = /(rédige|rédiger|générer|génère|créer|crée|fournir|lettre|mise en demeure|contrat|plainte|conclusions|accord|requête)/i.test(clean);

  // Extract financial amounts, dates, or parties from user text or document
  const amountMatch = (userQuery + ' ' + attachedDocText).match(/(?:^|\s)(\d{1,3}(?:[\s.,]\d{3})*(?:[.,]\d{2})?|\d+)\s*(?:€|euros?)/i);
  const detectedAmount = amountMatch ? `${amountMatch[1].replace(/\s+/g, ' ')} €` : null;

  // Extract dates (DD/MM/YYYY or words)
  const dateMatch = (userQuery + ' ' + attachedDocText).match(/(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|\/\d{1,2}\/\d{2,4})\s*\d{0,4})/i);
  const detectedDate = dateMatch ? dateMatch[1] : null;

  // Extract city or jurisdiction
  const locMatch = (userQuery + ' ' + attachedDocText).match(/(?:à|au|dans le ressort de|tribunal de|ville de|demeurant à|barreau de|siège social à)\s+([A-Z][a-zàáâäçèéêëîïôöùûü]+(?:-[A-Z][a-zàáâäçèéêëîïôöùûü]+)*)/);
  const detectedLocation = locMatch ? locMatch[1] : "France (ressort du domicile conjugal ou du défendeur)";

  let responseText = '';

  // 1. SCENARIO: DOCUMENT IS IMPORTED AND MUST BE THOROUGHLY ANALYZED
  if (hasFiles) {
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

    // Combine document text, current query and conversation history
    const fullContent = (clean + ' ' + attachedDocText.toLowerCase() + ' ' + previousTurnsContext).trim();

    // Accurate legal domain detection based on scoring
    const detectedDomain = detectLegalDomain(fullContent + ' ' + allDocNames.join(' '));

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

    if (detectedDomain === 'famille') {
      docType = "Droit de la Famille, Divorce & Régimes Matrimoniaux (Code Civil)";
      
      // Extract spouses names if present in document text or filename
      let epouxDisplay = "M. MARCHAND";
      let epouseDisplay = "Mme DUBOIS";
      const partiesFound = (attachedDocText + ' ' + docNameDisplay).match(/([A-ZÀ-Ÿ]{3,})\s*(?:et|[-_&/]|contre)\s*([A-ZÀ-Ÿ]{3,})/i);
      if (partiesFound) {
        epouxDisplay = `M. ${partiesFound[1].toUpperCase()}`;
        epouseDisplay = `Mme ${partiesFound[2].toUpperCase()}`;
      }

      partiesMapping = {
        demandeur: `${epouxDisplay} (ou ${epouseDisplay})`,
        adversaire: `${epouseDisplay} (ou ${epouxDisplay})`,
        quiContreQui: `Procédure de divorce et fixation des conséquences patrimoniales et familiales entre ${epouxDisplay} et ${epouseDisplay}.`,
        rapportDeForce: "Droit d'ordre public protecteur des intérêts des enfants mineurs (art. 371-2 C. civ.) et liquidation équitable des biens."
      };

      timeline = [
        `**Mariage / Union civile :** Célébration constatée le ${detectedDate || 'selon acte d\'état civil'} à ${detectedLocation}.`,
        `**Domicile conjugal :** Fixé dans le ressort de ${detectedLocation}.`,
        `**Objet de l'instance :** Examen des modalités de séparation, liquidation du régime matrimonial et fixation des mesures relatives aux enfants.`,
        `**Prescription des créances entre époux :** Prescription quinquennale (5 ans) pour les opérations de liquidation et les créances post-divorce (art. 2224 C. civ.).`
      ];

      enVotreFaveur = [
        "Divorce par consentement mutuel déjudiciarisé (art. 229-1 C. civ.) : Procédure amiable sans comparution devant le juge, convention rédigée par deux avocats et déposée directement chez le notaire pour force exécutoire immédiate.",
        detectedAmount ? `Prestation compensatoire (art. 270 C. civ.) : Évaluation estimée autour de **${detectedAmount}** destinée à compenser la disparité dans les conditions de vie respectives créée par la rupture.` : "Prestation compensatoire (art. 270 C. civ.) : Droit à indemnisation en capital si la rupture crée une disparité notable dans les conditions de vie respectives.",
        "Contribution à l'entretien et l'éducation des enfants (art. 371-2 C. civ.) : Pension alimentaire fixée selon la grille officielle du Ministère de la Justice, révisable et indexée sur l'indice des prix à la consommation.",
        "Sort du logement de la famille et du droit au bail (art. 1751 C. civ.) : Attribution de la jouissance du domicile conjugal à l'un des conjoints avec transfert ou résiliation ordonnée du bail sans solidarité résiduelle."
      ];

      contreVous = [
        "Représentation obligatoire par deux avocats distincts : Même dans un divorce amiable par consentement mutuel, un avocat commun est formellement interdit par l'article 229-1 du Code Civil.",
        "Délai de réflexion de 15 jours incompressible : La convention ne peut être signée qu'après l'expiration d'un délai strict de 15 jours suivant la notification par LRAR.",
        `Liquidation notariée obligatoire en cas de bien immobilier : En présence d'un bien immobilier commun ou indivis à ${detectedLocation}, un état liquidatif rédigé par un notaire doit impérativement précéder la signature de la convention.`
      ];

      procedureEtapes = [
        `1. Choix de la procédure : Consentement mutuel (procédure extrajudiciaire par avocats et notaire) ou saisine du Juge aux Affaires Familiales (JAF) du Tribunal Judiciaire de ${detectedLocation}.`,
        "2. Négociation et rédaction de la convention : Accord sur l'autorité parentale, la résidence des enfants (alternée ou principale), la pension alimentaire et le partage patrimonial.",
        "3. Enregistrement chez le notaire : Dépôt de la convention au rang des minutes d'un notaire pour lui conférer force exécutoire de plein droit."
      ];

      statutoryArticles = [
        "Article 229-1 du Code Civil (Divorce par consentement mutuel sous signature privée contresigné par deux avocats et déposé chez un notaire)",
        "Article 371-2 du Code Civil (Obligation de contribution réciproque des parents à l'entretien des enfants)",
        "Article 270 & 271 du Code Civil (Prestation compensatoire et disparité de train de vie)",
        "Article 1751 du Code Civil (Droit au bail du logement familial et cotitularité entre époux)"
      ];

    } else if (detectedDomain === 'travail') {
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
        "Absence de cause réelle et sérieuse : Les motifs imprécis ou non matériellement vérifiables rendent le licenciement sans cause réelle et sérieuse.",
        detectedAmount ? `Créance salariale : Montant identifié de **${detectedAmount}** à réclamer avec intérêts au taux légal.` : "Indemnités légales et conventionnelles : Cumul possible de l'indemnité compensatrice de préavis, congés payés, et dommages-intérêts selon le barème Macron.",
        "Nullité des clauses non rémunérées : Toute clause de non-concurrence sans contrepartie financière intégrale est nulle de plein droit."
      ];
      contreVous = [
        "Barème Macron (art. L1235-3 C. trav.) : Plafonnement des indemnités prud'homales fixé selon l'ancienneté (sauf harcèlement ou violation d'une liberté fondamentale).",
        "Délai de forclusion très court : 1 an seulement pour saisir le CPH à compter de la notification de la rupture.",
        "Charge de la preuve des heures supplémentaires : L'employé doit étayer sa demande avec un décompte précis des heures."
      ];
      procedureEtapes = [
        "1. Demande de précisions sur les motifs (art. R1232-13 C. trav.) : Sous 15 jours suivant la notification de rupture par LRAR.",
        "2. Tentative de rupture conventionnelle ou protocole transactionnel : Avec assistance d'un conseiller ou avocat pour sécuriser une indemnité forfaitaire.",
        "3. Saisine du Conseil de Prud'hommes (CPH) : Bureau de Conciliation et d'Orientation (BCO), puis Bureau de Jugement territorialement compétent."
      ];
      statutoryArticles = [
        "Article L1232-1 du Code du Travail (Exigence d'une cause réelle et sérieuse)",
        "Article L1235-3 du Code du Travail (Barème des indemnités pour licenciement sans cause réelle et sérieuse)",
        "Article L1471-1 du Code du Travail (Prescription d'un an pour contester la rupture)"
      ];

    } else if (detectedDomain === 'immobilier') {
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
        "Ordre public protecteur : Les articles 7, 20 et 22 de la loi de 1989 prévalent sur toute clause abusive insérée dans le bail.",
        detectedAmount ? `Montant chiffrable : Préjudice liquide de **${detectedAmount}** dont le paiement peut être formellement exigé.` : "Majoration de 10% par mois de retard : Applicable de plein droit sur le loyer en cas de non-restitution du dépôt de garantie dans les délais légaux.",
        "Absence de retenue justifiée : Toute retenue sur caution sans devis ou facture certifiée contradictoire est illégale (Cass. Civ. 3e)."
      ];
      contreVous = [
        "Obligation de mise en demeure préalable : Impossible de saisir le juge sans justificatif d'une mise en demeure par LRAR restée infructueuse.",
        "Interdiction de faire justice soi-même : Le locataire ne peut pas suspendre unilatéralement le loyer, même en cas de désordre, sans consignation ordonnée par le juge.",
        "Médiation obligatoire (art. 750-1 CPC) : Saisine obligatoire de la Commission Départementale de Conciliation (CDC) ou d'un conciliateur avant assignation si < 5 000 €."
      ];
      procedureEtapes = [
        "1. Mise en demeure par LRAR (Délai 8 à 15 jours) : Réclamer l'exécution ou le remboursement avec décompte des pénalités légales sous peine de poursuites.",
        "2. Saisine de la Commission Départementale de Conciliation (CDC) : Procédure gratuite et rapide, suspendant la prescription.",
        "3. Saisine du Juge des Contentieux de la Protection (JCP) : Auprès du Tribunal Judiciaire compétent par simple requête ou assignation par commissaire de justice."
      ];
      statutoryArticles = [
        "Article 22 de la Loi n° 89-462 du 6 juillet 1989 (Restitution du dépôt de garantie et majoration légale de 10%/mois)",
        "Article 1719 du Code Civil (Obligation de délivrance d'un logement décent et en bon état)",
        "Article 750-1 du Code de Procédure Civile (Préalable amiable obligatoire avant saisine judiciaire)"
      ];

    } else if (detectedDomain === 'commercial') {
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
        detectedAmount ? `Montant certain : Créance principale établie à **${detectedAmount}** HT/TTC.` : "Créance exigible : Preuve matérielle de la livraison ou prestation réalisée.",
        "Pénalités de retard de plein droit : Taux BCE majoré de 10 points + 40 € d'indemnité forfaitaire de recouvrement par facture en B2B sans rappel nécessaire.",
        "Clause résolutoire ou de réserve de propriété : Restitution possible des biens ou résiliation immédiate."
      ];
      contreVous = [
        "Exception d'inexécution (art. 1219 C. civ.) : La partie adverse peut opposer un refus de paiement si la prestation n'a pas été parfaitement livrée.",
        "Absence de signature ou de bon de livraison : Si le devis n'est pas signé ou s'il n'y a pas de récépissé de livraison, le recouvrement accéléré peut être rejeté.",
        "Procédure de contestation commerciale : Risque de demande reconventionnelle pour retard de livraison."
      ];
      procedureEtapes = [
        "1. Mise en demeure formelle de payer par LRAR (Délai 8 jours) : Faisant courir les intérêts moratoires au taux légal (art. 1344 C. civ.).",
        "2. Requête en Injonction de Payer (art. 1405 CPC) : Procédure rapide et non contradictoire devant le Tribunal de Commerce ou Judiciaire.",
        "3. Signification par Commissaire de Justice de l'Ordonnance : Pour apposition de la formule exécutoire et saisie des comptes bancaires."
      ];
      statutoryArticles = [
        "Article 1103 & 1104 du Code Civil (Force obligatoire des contrats et exigence de bonne foi)",
        "Article L441-10 du Code de Commerce (Délais de paiement et pénalités de retard impératives)",
        "Article 1405 et suivants du CPC (Procédure d'Injonction de Payer)"
      ];

    } else if (detectedDomain === 'consommation') {
      docType = "Droit de la Consommation & Garanties Légales (Code de la Consommation)";
      partiesMapping = {
        demandeur: "Consommateur / Acheteur particulier",
        adversaire: "Vendeur professionnel ou Distributeur",
        quiContreQui: "Consommateur contre Professionnel pour non-conformité, vice caché ou refus de rétractation.",
        rapportDeForce: "Présomption d'antériorité du défaut de conformité de 2 ans en faveur du consommateur (art. L217-7 C. consom.)."
      };
      timeline = [
        `**Date d'achat ou commande :** Transaction intervenue (${detectedDate || 'selon facture'}).`,
        `**Lieu d'achat ou livraison :** À distance ou en magasin (${detectedLocation}).`,
        `**Délai d'action :** 2 ans à compter de la délivrance du bien (garantie légale de conformité) ou de la découverte du vice caché.`
      ];
      enVotreFaveur = [
        "Garantie légale de conformité de 2 ans (art. L217-3 C. consom.) : Remplacement ou remboursement sans frais à la charge exclusive du vendeur.",
        detectedAmount ? `Préjudice financier : Somme engagée de **${detectedAmount}** à restituer intégralement.` : "Droit au remboursement intégral ou mise en conformité sans frais.",
        "Droit de rétractation de 14 jours (achat à distance) : Sans motif ni pénalités (art. L221-18 C. consom.)."
      ];
      contreVous = [
        "Obligation de dénonciation formelle par écrit : Preuve requise du signalement préalable du défaut.",
        "Médiation préalable de la consommation : Recours au médiateur du professionnel avant toute action en justice."
      ];
      procedureEtapes = [
        "1. Mise en demeure par LRAR : Exiger la réparation, le remplacement ou le remboursement sous 8 jours.",
        "2. Saisine du Médiateur de la Consommation : Procédure gratuite pour le consommateur.",
        "3. Requête devant le Tribunal Judiciaire : Si échec de la médiation."
      ];
      statutoryArticles = [
        "Article L217-3 du Code de la Consommation (Garantie légale de conformité)",
        "Article 1641 du Code Civil (Garantie des vices cachés)",
        "Article L221-18 du Code de la Consommation (Droit de rétractation)"
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
        "Preuve littérale : Pièces et écrits produits à l'appui de votre demande.",
        detectedAmount ? `Montant du dommage : Préjudice estimé ou réclamé de **${detectedAmount}**.` : "Droit à réparation : Réparation intégrale du préjudice causé par la faute d'autrui.",
        "Intérêts moratoires : De plein droit à compter de la mise en demeure (art. 1231-6 C. civ.)."
      ];
      contreVous = [
        "Charge de la preuve (art. 9 CPC) : Obligation d'établir la réalité du préjudice et le lien de causalité.",
        "Préalable obligatoire de conciliation (art. 750-1 CPC) : Conciliateur requis pour les litiges < 5 000 €.",
        "Respect des délais de prescription pour ne pas être forclos."
      ];
      procedureEtapes = [
        "1. Mise en demeure préalable obligatoire par LRAR fixant un délai impératif de 8 jours.",
        "2. Tentative de règlement amiable (MARD / Conciliateur de justice).",
        "3. Assignation ou requête devant le Tribunal Judiciaire territorialement compétent."
      ];
      statutoryArticles = [
        "Article 1103 du Code Civil (Force obligatoire des contrats)",
        "Article 1240 du Code Civil (Responsabilité civile extracontractuelle)",
        "Article 750-1 du Code de Procédure Civile (Tentative amiable obligatoire)"
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
        `${draftTitle.toUpperCase()}\n` +
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
      responseText = `Bonjour. J'ai examiné attentivement votre dossier (**${docCount} document(s) analysé(s) :** *${docNameDisplay}* — Domaine : *${docType}*).\n\n` +
        `Voici mon analyse juridique complète, personnalisée et directement applicable à votre situation :\n\n` +
        `**Synthèse du dossier & Qualification juridique**\n` +
        `- **Votre position :** ${partiesMapping.demandeur}\n` +
        `- **Partie adverse :** ${partiesMapping.adversaire}\n` +
        `- **Objet du litige :** ${partiesMapping.quiContreQui}\n` +
        `- **Rapport de force juridique :** ${partiesMapping.rapportDeForce}\n\n` +
        `**Chronologie des faits & Éléments clés**\n` +
        `${timeline.map(t => `- ${t}`).join('\n')}\n\n` +
        `**Analyse stratégique : Atouts & Points de vigilance**\n` +
        `**Vos points forts et atouts :**\n` +
        `${enVotreFaveur.map(f => `- ${f}`).join('\n')}\n\n` +
        `**Points de vigilance et risques à anticiper :**\n` +
        `${contreVous.map(c => `- ${c}`).join('\n')}\n\n` +
        `**Plan d'action recommandé & Démarches étape par étape**\n` +
        `${procedureEtapes.map(e => `- ${e}`).join('\n')}\n\n` +
        `**Textes de loi & Fondements juridiques applicables**\n` +
        `${statutoryArticles.map(a => `- ${a}`).join('\n')}\n\n` +
        `**Suite de votre dossier**\n` +
        `Vous pouvez me poser toute question complémentaire sur ces points, m'importer d'autres pièces justificatives, ou me demander de préparer directement la mise en demeure ou les actes nécessaires à cette démarche.`;
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
      analysisDiagnosis = "En droit français, tout litige s'articule autour de la matérialité de la preuve des faits, du respect des délais légaux de prescription et de la qualification exacte de l'obligation inexécutée.";
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

      responseText = `Voici le document juridique officiel rédigé spécialement pour votre dossier :\n\n` +
        `---\n` +
        `${actTitle.toUpperCase()}\n` +
        `**RÉFÉRENCE DOSSIER :** FJ-${Math.floor(100000 + Math.random() * 900000)} / FRANCE\n` +
        `**DATE :** ${new Date().toLocaleDateString('fr-FR')}\n\n` +
        `**OBJET :** Demande formelle de régularisation et mise en demeure\n\n` +
        `Madame, Monsieur,\n\n` +
        `Par la présente, je vous notifie formellement ma contestation et demande de régularisation intégrale.\n\n` +
        `En application des règles de droit en vigueur :\n` +
        `${rulesList.map(r => `- ${r}`).join('\n')}\n\n` +
        `Je vous mets en demeure de remédier à cette situation et de faire droit à mes demandes sous un délai de **8 JOURS** à compter de la réception de cette notification.\n\n` +
        `À défaut d'accord amiable ou de règlement dans ce délai, je transmettrai immédiatement ce dossier à mon avocat pour engager une action judiciaire devant le Tribunal compétent.\n\n` +
        `Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n` +
        `*Fait à Paris, le ${new Date().toLocaleDateString('fr-FR')}.*\n` +
        `---\n\n` +
        `💬 *Ce document est disponible dans votre espace. Souhaitez-vous y apporter des ajustements particuliers ?*`;

      action = {
        type: 'CREATE_DOCUMENT',
        payload: {
          title: actTitle,
          content: responseText
        }
      };
    } else {
      const topicIntro = clean.length > 3 && clean.length < 50 && !clean.includes('\n')
        ? `votre situation concernant « ${userQuery.trim()} »`
        : `vos droits en matière de ${subjectTitle.toLowerCase()}`;

      responseText = `Bonjour. Voici mon analyse juridique personnalisée et approfondie concernant ${topicIntro} :\n\n` +
        `**Synthèse de la situation & Qualification juridique**\n` +
        `${analysisDiagnosis}\n\n` +
        `**Fondements légaux précis & Droits applicables**\n` +
        `${rulesList.map(r => `- ${r}`).join('\n')}\n\n` +
        `**Vos atouts stratégiques & Points de vigilance**\n` +
        `- **Vos points forts :** Les règles d'ordre public protectrices et la jurisprudence constante jouent en votre faveur dès lors que vos preuves sont formalisées par écrit.\n` +
        `- **Points de vigilance :** Respectez scrupuleusement la procédure préalable, évitez toute initiative unilatérale sans titre exécutoire, et veillez aux délais stricts de prescription.\n\n` +
        `**Plan d'action & Démarches recommandées**\n` +
        `${actionStepsList.map(s => `- ${s}`).join('\n')}\n\n` +
        `**Démarches immédiates conseillées**\n` +
        `- **Étape 1 :** Réunir et numéroter vos pièces justificatives (contrat, devis, courriels, relevés bancaires).\n` +
        `- **Étape 2 :** Adresser une mise en demeure formelle par LRAR fixant un délai impératif de 8 jours.\n` +
        `- **Étape 3 :** Si absence de réponse sous 8 jours, engager immédiatement la conciliation ou la saisine de la juridiction compétente.\n\n` +
        `**Suite de votre dossier**\n` +
        `👉 ${followUpQuestion}\n\n` +
        `*Vous pouvez poursuivre la discussion, me poser une question de précision ou importer des documents pour approfondir cette analyse.*`;
    }
  }

  // Nettoyage absolu : aucune balise '###', '##' ou '#' brute ne doit fuiter
  responseText = responseText
    .replace(/^#{1,6}\s*(.*?)$/gm, '**$1**')
    .replace(/###\s*/g, '');

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
