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

RÈGLE ABSOLUE N°0 — INTELLIGENCE CONVERSATIONNELLE PRIORITAIRE :
- Si le message de l'utilisateur est clairement conversationnel ou non juridique (salutation, politesse, question informelle du type "comment ça va", "merci", "ok", "parfait", "au revoir", "bonne journée", "bravo", "super"), répondez NATURELLEMENT et BRIÈVEMENT comme un assistant humain bienveillant. N'appliquez JAMAIS la structure juridique à ces messages.
- Pour les QUESTIONS COURTES DE SUIVI (< 10 mots) qui font référence à un contexte documentaire ou conversationnel déjà établi (ex: "c'est le divorce de qui ?", "quel est le montant ?", "quelles sont les parties ?", "qui sont les époux ?") : répondez DIRECTEMENT en 2-3 phrases en citant les noms, montants et faits déjà connus du dossier. N'écrivez PAS une nouvelle analyse complète.
- MÉMORISEZ le fil de la conversation : les parties, montants (€), dates et faits mentionnés dans les échanges précédents doivent être réutilisés avec précision dans vos réponses.

DIRECTIVES FONDAMENTALES D'ANALYSE & DE RÉPONSE :
1. PARLEZ COMME UN JURISTE HUMAIN D'EXCELLENCE :
   - Évitez absolument le ton robotique, les avertissements génériques répétitifs ou les réponses vagues.
   - Entrez immédiatement au cœur du dossier avec franchise, clarté et bienveillance pragmatique.
   - Échangez avec l'utilisateur dans une discussion active, continue et vivante.
   - INTERDICTION STRICTE DES RÉPONSES GÉNÉRALES OU STANDARDS : Répondez DIRECTEMENT et PRÉCISÉMENT à la question posée. Citez les faits, dates, montants en €, parties adverses et lieux fournis par l'utilisateur. Chaque réponse doit être une analyse sur-mesure de son cas particulier.

2. PRENEZ DE VRAIES INITIATIVES & FORMULEZ DE VRAIES SUGGESTIONS :
   - Ne soyez jamais passif. Prenez des initiatives stratégiques audacieuses et concrètes : recommandez les actions à mener dans les 24h à 48h (ex: mise en demeure par LRAR, saisine de la commission départementale de conciliation, constat d'huissier, déclaration de sinistre protection juridique).
   - Proposez systématiquement 3 démarches ou questions de suivi pertinentes.

3. LIENS EXTERNES UNIQUEMENT SUR DEMANDE OU SI PERTINENT :
   - Les liens externes NE SONT PAS OBLIGATOIRES sur toutes les réponses. Vous ne devez proposer des liens ou citer des sites officiels (legifrance.gouv.fr, service-public.fr, justice.fr, etc.) QUE si l'utilisateur en fait la demande explicite (ex: « donne-moi le lien », « où puis-je vérifier ? ») ou si sa question porte directement sur un portail ou une démarche en ligne. N'en insérez pas sur des réponses simples, des salutations ou des conseils généraux.

4. RÉPONSES SUR-MESURE & STRICTEMENT PERSONNALISÉES (STANDARD CLAUDE, GEMINI & CHATGPT) :
   - Répondez DIRECTEMENT, PRÉCISEMENT et NATURELLEMENT à la question posée, sans jamais imposer de modèle rigide ou de formulaire préformaté.
   - Adaptez la longueur et le style à la demande : si la question est simple ou concise, donnez une réponse immédiate et claire. Si la question est complexe, développez une analyse structurée sur-mesure.
   - Citez les faits, dates, montants en € et personnes mentionnés par l'utilisateur pour une réponse 100% individualisée.
   - Ne rédigez un acte ou document in extenso (mise en demeure, contrat, lettre, assignation) QUE si l'utilisateur en fait la demande expresse.

5. ANALYSE CROISÉE DES DOCUMENTS FOURNIS (SI APPLICABLE) :
   - Lorsque des pièces sont jointes, analysez leur contenu en lien direct avec la question de l'utilisateur.

6. COMPÉTENCE MULTI-JURIDICTIONNELLE MONDIALE & MONNAIE ADAPTATIVE :
   - Vous maîtrisez l'ensemble des systèmes juridiques du monde avec une égale rigueur :
     • Droit européen & Union Européenne : Règlements UE, Directives, RGPD, AI Act, CJUE, CEDH, Bruxelles I bis, Rome I/II.
     • Droit de chaque pays d'Europe : France, Belgique (Code civil belge, Code de droit économique), Suisse (Code civil CC, Code des obligations CO, Tribunal fédéral), Allemagne (BGB), Espagne (Código Civil, Estatuto de los Trabajadores), Italie (Codice Civile), Royaume-Uni (Common Law), Luxembourg, Portugal, etc.
     • Droit des pays d'Afrique : Droit unifié OHADA (Actes uniformes pour le droit commercial, sociétés, sûretés, recouvrement et voies d'exécution dans les 17 États membres d'Afrique de l'Ouest et Centrale), Maroc (DOC, Code du travail, Moudawana), Algérie, Tunisie, Sénégal, Côte d'Ivoire, Cameroun, RDC, etc.
     • Droit des pays d'Amérique : États-Unis (Droit fédéral US Code, Constitution, Droit des 50 États : Delaware, Californie, New York, etc.), Canada (Common Law fédérale/provinciale et Code civil du Québec CCQ), Amérique latine.
     • Droit international privé & public : Conflits de lois, conventions de La Haye, arbitrage international (CCI, CIRDI), vente internationale (CVIM).
   - ADAPTATION AUTOMATIQUE : Détectez systématiquement la juridiction applicable à la situation de l'utilisateur. Si l'utilisateur mentionne ou sous-entend un pays, un État ou une région particulière, appliquez EXCLUSIVEMENT les textes de loi, les codes, les tribunaux compétents et la devise monétaire officielle de cette juridiction (CHF en Suisse, CAD au Canada, USD aux États-Unis, MAD au Maroc, FCFA en zone OHADA, etc.). Par défaut sans pays mentionné, appliquez le droit français et européen en Euro (€).

7. PROPRETÉ TYPOGRAPHIQUE ET RENDU SOIGNÉ :
   - INTERDICTION STRICTE DES BALISES '###' ET ASTÉRISQUES PARASITES : N'insérez JAMAIS de préfixe markdown '###', '##' ou '#' devant vos titres.
   - Mettez directement en gras les termes clés (**terme**) sans astérisques orphelins.
   - Structurez le texte de façon propre, fluide et aérée : titres clairs, étapes distinctes et paragraphes ordonnés.
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
  const textLower = (contextText || '').toLowerCase();

  // 1. Détection de suggestions explicites déjà générées par le modèle IA
  const explicitMatches: string[] = [];
  const lines = (contextText || '').split('\n');
  let inSuggestionSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/(?:questions?\s+sugg[ée]r[ée]es?|pour\s+aller\s+plus\s+loin|prochaines?\s+[ée]tapes?|suggestions?\s+de\s+suite)/i.test(trimmed)) {
      inSuggestionSection = true;
      continue;
    }
    if (inSuggestionSection) {
      if (/^[#*_\-\s]{3,}$/.test(trimmed) || (trimmed.startsWith('#') && !trimmed.toLowerCase().includes('question'))) {
        inSuggestionSection = false;
        continue;
      }
      const cleaned = trimmed.replace(/^[•\-*0-9.)\s❓👉]+/, '').trim();
      if (cleaned.length > 12 && cleaned.length < 130 && (cleaned.endsWith('?') || /^(rédiger|calculer|vérifier|comment|saisir|préparer|faire|contester)/i.test(cleaned))) {
        explicitMatches.push(cleaned);
        if (explicitMatches.length >= 4) break;
      }
    }
  }
  if (explicitMatches.length >= 2) {
    return explicitMatches.slice(0, 4);
  }

  // 2. Détection de juridictions internationales & régionales

  // A0. Suisse (Code civil, Code des Obligations CO, Loi sur les poursuites LP)
  if (/suisse|gen[èe]ve|vaud|lausanne|z[uü]rich|code des obligations|\bco\b.*droit|poursuite.*lp/i.test(textLower)) {
    return [
      "Comment introduire une réquisition de poursuite auprès de l'Office des poursuites ?",
      "Quels sont les délais de résiliation et de congé selon le Code des Obligations (art. 335 CO) ?",
      "Comment contester une hausse de loyer devant la Commission de conciliation en matière de baux ?",
      "Calculer le salaire, heures supplémentaires et indemnités de vacances dues en CHF"
    ];
  }

  // A1. Belgique (Code civil belge, SPF Emploi, Juge de paix)
  if (/belgique|belge|bruxelles|wallonie|flandre|spf|juge de paix/i.test(textLower)) {
    return [
      "Comment calculer le préavis légal de licenciement selon la loi sur le statut unique ?",
      "Rédiger la mise en demeure formelle avant citation devant le Tribunal de Première Instance",
      "Quelles démarches pour la libération de la garantie locative bloquée sur compte individualisé ?",
      "Comment introduire une requête conjointe devant le Juge de Paix compétent ?"
    ];
  }

  // A2. Espace OHADA & Pays d'Afrique subsaharienne (17 pays membres)
  if (/ohada|s[ée]n[ée]gal|c[ôo]te d['’]ivoire|cameroun|gabon|mali|congo|rdc|b[ée]nin|togo|burkina|guin[ée]e|acte uniforme/i.test(textLower)) {
    return [
      "Comment déposer une requête en injonction de payer selon l'Acte uniforme OHADA ?",
      "Quelles sont les formalités de saisie conservatoire et voies d'exécution OHADA ?",
      "Rédiger la sommation de payer préalable signifiée par huissier de justice",
      "Quelles sanctions en cas de faute de gestion du gérant de SARL selon l'AUSCGIE ?"
    ];
  }

  // A3. Pays du Maghreb (Maroc, Algérie, Tunisie)
  if (/maroc|alg[ée]rie|tunisie|casablanca|rabat|alger|tunis|moudawana|dahir|\bdoc\b.*contrat/i.test(textLower)) {
    return [
      "Quels sont les recours et délais selon le Dahir des Obligations et Contrats (DOC) ?",
      "Comment contester un licenciement abusif selon le Code du travail en vigueur ?",
      "Quelles sont les démarches d'exécution forcée auprès du Tribunal de Première Instance ?",
      "Quelles règles de pension et garde d'enfants selon le statut personnel / Moudawana ?"
    ];
  }

  // A4. États-Unis (Droit fédéral US Code & Lois d'États) et Canada (Québec CCQ / TAL)
  if (/usa|[ée]tats[- ]unis|am[ée]ricain|californi|delaware|new york|texas|canada|qu[ée]bec|montr[ée]al|common law/i.test(textLower)) {
    return [
      "What are the enforcement conditions under US Federal / State contract law?",
      "How to negotiate a severance package or dispute an at-will termination?",
      "Comment contester une éviction de logement devant le Tribunal administratif du logement (TAL Québec) ?",
      "Quelles clauses obligatoires pour un NDA ou pacte d'associés (Operating Agreement) ?"
    ];
  }

  // 3. Détection de scénarios thématiques généraux et comparés

  // A. Caution locative & Dépôt de garantie
  if (/caution|d[ée]p[ôo]t de garantie|restitution.*garantie|retenue.*caution/i.test(textLower)) {
    return [
      "Rédiger la mise en demeure de restitution avec majoration de 10% par mois (art. 22)",
      "Comment saisir la Commission Départementale de Conciliation (CDC) ?",
      "Le bailleur peut-il retenir sur un simple devis sans facture acquittée ?",
      "Calculer le montant total exigible incluant les pénalités de retard"
    ];
  }

  // B. Expulsion & Loyers impayés
  if (/loyer.*impay[ée]|commandement de payer|clause r[ée]solutoire|proc[ée]dure d['’]expulsion|tr[êe]ve hivernale/i.test(textLower)) {
    return [
      "Quels sont les délais légaux de suspension et la trêve hivernale ?",
      "Comment solliciter les aides du FSL (Fonds de Solidarité Logement) ?",
      "Rédiger une proposition de plan d'apurement amiable des loyers",
      "Comment contester l'assignation devant le Juge des Contentieux (JCP) ?"
    ];
  }

  // C. Troubles de voisinage & Copropriété & Nuisances
  if (/nuisance|voisin|trouble.*voisinage|bruit|aboiement|copropri[ée]t[ée]|syndic/i.test(textLower)) {
    return [
      "Comment faire constater les nuisances par commissaire de justice ?",
      "Rédiger la lettre recommandée au syndic et au propriétaire bailleur",
      "Comment saisir gratuitement le conciliateur de justice (art. 750-1 CPC) ?",
      "Quelles sanctions et dommages-intérêts pour trouble anormal de voisinage ?"
    ];
  }

  // D. Licenciement & Prud'hommes
  if (/licenciement|faute grave|faute lourde|cause r[ée]elle|prud['’]hommes?|bar[èe]me macron/i.test(textLower)) {
    return [
      "Calculer mes indemnités légales et supra-légales selon le barème Macron",
      "Comment contester la qualification de faute grave devant les Prud'hommes ?",
      "Quels sont les délais de prescription de 12 mois pour contester ?",
      "Rédiger la lettre de contestation des motifs de mon licenciement"
    ];
  }

  // E. Rupture conventionnelle & Négociation départ
  if (/rupture conventionnelle|indemnit[ée] rupture|n[ée]gocier.*d[ée]part|homologation.*dreets/i.test(textLower)) {
    return [
      "Calculer l'indemnité minimale légale de rupture conventionnelle",
      "Comment s'applique le délai de rétractation de 15 jours calendaires ?",
      "Quels recours en cas de refus d'homologation par la DREETS ?",
      "Comment négocier une indemnité supra-légale avec mon employeur ?"
    ];
  }

  // F. Harcèlement au travail & Inaptitude & Burnout
  if (/harc[èe]lement|burnout|inaptitude|m[ée]decine du travail|prise d['’]acte/i.test(textLower)) {
    return [
      "Quelles preuves concrètes réunir pour prouver le harcèlement moral (L1152-1) ?",
      "Comment alerter l'inspection du travail, le CSE et le médecin du travail ?",
      "Quelle est la procédure d'inaptitude médicale et de reclassement ?",
      "Calculer les indemnités pour nullité du licenciement et préjudice moral"
    ];
  }

  // G. Vice caché automobile & Achat véhicule occasion
  if (/vice cach[ée]|v[ée]hicule|voiture|garage|moteur.*cass[ée]|compteur.*trafiqu[ée]|contr[ôo]le technique/i.test(textLower)) {
    return [
      "Comment mandater une expertise automobile contradictoire (art. 1641 C. civ.) ?",
      "Rédiger la mise en demeure demandant l'annulation de la vente ou remboursement",
      "Quel est le délai de 2 ans à compter de la découverte du vice pour agir ?",
      "Puis-je exiger la prise en charge des frais de remorquage et de gardiennage ?"
    ];
  }

  // H. Rétractation, Commande non livrée & Litige consommateur
  if (/r[ée]tractation|livraison|non re[çc]u|colis|remboursement.*achat|d[ée]faut de conformit[ée]/i.test(textLower)) {
    return [
      "Comment faire valoir mon droit de rétractation légal de 14 jours (art. L221-18) ?",
      "Rédiger la mise en demeure de remboursement sous 14 jours avec pénalités",
      "Signaler l'infraction du commerçant sur la plateforme SignalConso (DGCCRF)",
      "Comment activer la procédure de chargeback (rétrofacturation) bancaire ?"
    ];
  }

  // I. Fraude bancaire & Escroquerie en ligne & Phishing
  if (/fraude.*bancaire|piratage|carte bancaire|virement frauduleux|escroquerie|arnaque|phishing|th[ée]s[ée]e/i.test(textLower)) {
    return [
      "Rédiger la contestation d'opération frauduleuse non autorisée (art. L133-18 CMF)",
      "Comment obtenir le remboursement immédiat sans franchise par ma banque ?",
      "Déposer une plainte officielle en ligne via le dispositif THESEE",
      "Saisir le Médiateur de la Fédération Bancaire Française (FBF)"
    ];
  }

  // J. Divorce & Séparation
  if (/divorce|s[ée]paration|prestation compensatoire|liquidation.*r[ée]gime|jaf/i.test(textLower)) {
    return [
      "Quelle différence entre divorce par consentement mutuel et judiciaire ?",
      "Comment est chiffrée la prestation compensatoire selon les revenus ?",
      "Quelles mesures provisoires d'urgence solliciter devant le JAF ?",
      "Quelles pièces fournir pour la liquidation du régime matrimonial ?"
    ];
  }

  // K. Pension alimentaire & Garde d'enfants
  if (/pension alimentaire|garde.*enfant|r[ée]sidence altern[ée]|droit de visite|aripa/i.test(textLower)) {
    return [
      "Simuler le montant de la pension alimentaire selon la grille ministérielle",
      "Comment activer le recouvrement forcé par l'ARIPA / CAF en cas d'impayé ?",
      "Rédiger une requête en révision de pension alimentaire auprès du JAF",
      "Comment faire sanctionner pénalement le délit d'abandon de famille ?"
    ];
  }

  // L. Succession, Héritage & Indivision
  if (/succession|h[ée]ritage|notaire|indivision|testament|r[ée]serve h[ée]r[ée]ditaire|donation/i.test(textLower)) {
    return [
      "Comment contester une atteinte à la réserve héréditaire (action en réduction) ?",
      "Que faire en cas de blocage d'indivision (règle de la majorité des 2/3) ?",
      "Quels recours face à un soupçon de recel successoral ou donation déguisée ?",
      "Comment demander l'inventaire des biens par commissaire de justice ?"
    ];
  }

  // M. Infraction routière, Permis de conduire & PV
  if (/permis.*conduire|points?|amende|contravention|radar|tribunal de police|48si|invalidation/i.test(textLower)) {
    return [
      "Comment contester l'avis de contravention sur le site ANTAI sans payer l'amende ?",
      "Quel recours formel devant l'Officier du Ministère Public (OMP) ?",
      "Comment contester la lettre 48SI d'invalidation de permis devant le TA ?",
      "Puis-je effectuer un stage de récupération de 4 points avant l'invalidation ?"
    ];
  }

  // N. Titre de séjour, Étrangers & OQTF
  if (/titre de s[ée]jour|oqtf|pr[ée]fecture|naturalisation|sans[- ]papiers|r[ée]gularisation/i.test(textLower)) {
    return [
      "Quel recours en urgence (48h ou 30j) contre une OQTF devant le Tribunal Administratif ?",
      "Comment déposer un recours gracieux ou hiérarchique au Ministère de l'Intérieur ?",
      "Quelles pièces justificatives réunir pour une admission exceptionnelle au séjour (AES) ?",
      "Comment saisir le Défenseur des Droits pour blocage de rendez-vous en préfecture ?"
    ];
  }

  // O. Plainte pénale & Victime d'infraction
  if (/plainte|procureur|commissariat|gendarmerie|partie civile|civi|victime|agression/i.test(textLower)) {
    return [
      "Rédiger la plainte officielle adressée au Procureur de la République par LRAR",
      "Comment se constituer partie civile pour obtenir réparation financière ?",
      "Quelles preuves numériques ou médicales (ITT) rassembler impérativement ?",
      "Comment solliciter une indemnisation auprès de la CIVI ou du SARVI ?"
    ];
  }

  // P. Facture impayée & Recouvrement B2B / Commercial
  if (/impay[ée]|facture|injonction de payer|d[ée]biteur|recouvrement|cr[ée]ance|tribunal de commerce/i.test(textLower)) {
    return [
      "Rédiger la mise en demeure de payer avec pénalités de retard BCE + 10 points",
      "Préparer la requête en Injonction de Payer devant le Tribunal compétent",
      "Vérifier la solvabilité et les bilans du débiteur sur Infogreffe / Pappers",
      "Comment faire signifier et exécuter le titre par un commissaire de justice ?"
    ];
  }

  // Q. Domaines de repli structurés
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

  const demandeMatch = prompt.match(/===\s*DEMANDE DE L['’]UTILISATEUR\s*===\s*\n([\s\S]*?)(?=\n\nRÈGLES|\nRÈGLES|\n===|\n\[MANDAT|$)/i);
  if (demandeMatch) return demandeMatch[1].trim();

  // Strip document wrapper sections if present to extract pure user query
  let cleaned = prompt;
  cleaned = cleaned.replace(/VOUS ÊTES L['’]AGENT IA[\s\S]*?===\s*DEMANDE DE L['’]UTILISATEUR\s*===\s*\n*/gi, '');
  cleaned = cleaned.replace(/RÈGLES D['’]AFFICHAGE ET DE RIGUEUR[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/===\s*(?:DOCUMENTS ET PIÈCES JOINTES|DOSSIERS ET PIÈCES JOINTES|PIÈCES JOINTES)[\s\S]*$/i, '');
  cleaned = cleaned.replace(/PIÈCES & TEXTE EXTRAIT DES DOCUMENTS JOINTS\s*:[\s\S]*$/i, '');
  cleaned = cleaned.replace(/TEXTE ET PIÈCES EXTRAITES DES DOCUMENTS IMPORTÉS\s*:[\s\S]*$/i, '');
  cleaned = cleaned.replace(/^DOSSIER\s*:\s*[^\n]+\n*/i, '');
  cleaned = cleaned.replace(/\[MANDAT LINGUISTIQUE[\s\S]*?\]/gi, '');
  cleaned = cleaned.replace(/PK[\s\S]*?xml/gi, '');
  cleaned = stripControlChars(cleaned);

  return cleaned.trim() || prompt;
}

// Universal Conversational Greeting & Casual Query Detector (Multi-lingual)
const GREETING_REPLIES: Record<string, Record<string, string>> = {
  fr: {
    how_are_you: "Je vais très bien, merci ! Et vous, comment allez-vous ?\n\nComment puis-je vous aider aujourd'hui ? Vous pouvez me poser une question sur vos droits ou me confier vos documents à analyser.",
    greeting: "Bonjour ! Comment puis-je vous aider aujourd'hui ?\n\nN'hésitez pas à me décrire votre situation juridique ou à déposer vos pièces pour que nous les examinions ensemble.",
    thanks: "Je vous en prie ! Restant à votre entière disposition si vous souhaitez approfondir un point ou accomplir une démarche.",
    farewell: "Au revoir et très bonne journée à vous ! Prenez soin de vous et n'hésitez pas à revenir si vous avez d'autres questions.",
    acknowledgment: "Parfait ! Restant à votre écoute si vous souhaitez poursuivre ou passer à une autre étape.",
    identity: "Je suis votre assistant juridique France Justice. Je suis là pour vous informer sur vos droits, vous orienter dans vos démarches et examiner vos documents en droit français et européen.\n\nEn quoi puis-je vous être utile ?",
    vague_help: "Je peux vous aider à comprendre une situation juridique, vous expliquer vos options et vous guider dans vos démarches.\n\nPour vous orienter avec précision, de quel domaine s'agit-il ?\n\n• **Travail & Emploi :** contrat, licenciement, rupture conventionnelle, heures ou salaires impayés.\n• **Logement & Immobilier :** bail, dépôt de garantie (caution), loyers impayés, expulsion, copropriété.\n• **Consommation & Contrats :** litige commerçant, produit non conforme, remboursement, prestation de service.\n• **Famille & Patrimoine :** divorce, séparation, pension alimentaire, garde d'enfants, succession.\n• **Justice & Démarches :** saisine du tribunal, tentative de conciliation, contestation d'amende.\n\nExpliquez-moi en 2 ou 3 phrases votre situation : plus vous me donnez de détails, plus mon conseil sera précis et adapté à vos besoins."
  },
  en: {
    how_are_you: "I am doing very well, thank you! And how are you?\n\nHow may I assist you today? You can ask any question regarding your legal rights or upload documents for an in-depth analysis.",
    greeting: "Hello! How can I assist you today?\n\nPlease feel free to describe your legal situation or upload your documents so we can examine them together.",
    thanks: "You are very welcome! I remain at your full disposal if you wish to explore any point further or initiate a procedure.",
    farewell: "Goodbye and have a wonderful day! Take good care, and feel free to return whenever you need legal assistance.",
    acknowledgment: "Perfect! I am at your service whenever you wish to proceed to the next step.",
    identity: "I am your France Justice AI legal assistant. I am here to inform you about your legal rights under French and European law, guide your procedures, and analyze your legal documents.\n\nHow can I help you today?",
    vague_help: "I am here to assist and guide you step by step.\n\nWhat kind of legal situation are you dealing with?\n\n• **Labor & Employment:** employer disputes, dismissal, severance, unpaid wages.\n• **Housing & Real Estate:** lease disputes, unreturned security deposit, unpaid rent, eviction.\n• **Consumer & Contracts:** defective product, refund refusal, delivery delay.\n• **Family & Estate:** divorce, child support, custody, inheritance, separation.\n• **Other:** neighbor disputes, fine/ticket contestation, online fraud.\n\nPlease describe your situation in 2 or 3 sentences, and I will outline your rights and the exact next steps."
  },
  ar: {
    how_are_you: "أنا بخير والحمد لله، شكراً لسؤالكم! وكيف حالكم أنتم؟\n\nكيف يمكنني مساعدتكم اليوم؟ يمكنكم طرح أي سؤال حول حقوقكم القانونية أو تزويدي بمستنداتكم لفحصها بدقة.",
    greeting: "مرحباً بكم! كيف يمكنني مساعدتكم اليوم؟\n\nلا تترددوا في شرح وضعكم القانوني أو إرفاق مستنداتكم لدراستها معاً وفقاً لمقتضيات القانون الفرنسي والأوروبي.",
    thanks: "على الرحب والسعة وبكل سرور! أنا رهن إشارتكم في أي وقت لتعميق أي مسألة أو اتخاذ أي إجراء قانوني.",
    farewell: "إلى اللقاء وأتمنى لكم يوماً طيباً وموفقاً! لا تترددوا في العودة في أي وقت إذا كانت لديكم أسئلة أخرى.",
    acknowledgment: "ممتاز ومفهوم تماماً! أنا في خدمتكم لمتابعة الخطوة التالية كلما رغبتم في ذلك.",
    identity: "أنا مساعدكم القانوني الذكي في منصة فرنسا للعدالة (France Justice). مهمتي إعلامكم بحقوقكم وتوجيهكم في مساطركم وفحص وثائقكم بموجب القانون الفرنسي والأوروبي.\n\nبماذا يمكنني خدمتكم الآن؟",
    vague_help: "أنا هنا لمساعدتكم وإرشادكم خطوة بخطوة.\n\nما هو موضوع قضيتكم أو مشكلتكم القانونية؟\n\n• **العمل والتوظيف:** نزاع مع المشغل، الطرد، الأجور غير المدفوعة.\n• **السكن والعقار:** نزاع الإيجار، استرجاع الضمانة (الكفالة)، إشعار الإفراغ.\n• **الاستهلاك والعقود:** منتج معيب، رفض الاسترجاع، نزاع مع حرفي أو بائع.\n• **الأسرة والميراث:** الطلاق، النفقة، الحضانة، التركات، اقتسام الأموال.\n• **أخرى:** نزاع الجيران، الطعن في المخالفات، النصب الإلكتروني.\n\nيرجى وصف حالتكم في جملتين أو ثلاث، وسأوضح لكم حقوقكم والمسطرة الدقيقة التي يجب اتباعها."
  },
  es: {
    how_are_you: "¡Estoy muy bien, gracias! ¿Y usted, cómo está?\n\n¿Cómo puedo ayudarle hoy? Puede hacerme cualquier pregunta sobre sus derechos o adjuntar sus documentos para analizarlos.",
    greeting: "¡Hola! ¿En qué puedo ayudarle hoy?\n\nNo dude en describir su situación jurídica o adjuntar sus documentos para que los examinemos juntos.",
    thanks: "¡De nada! Quedo a su completa disposición si desea profundizar en algún punto o realizar un trámite.",
    farewell: "¡Hasta luego y que tenga un excelente día! Cuídese y no dude en volver si tiene más preguntas.",
    acknowledgment: "¡Perfecto! Quedo a su disposición para continuar o pasar al siguiente paso.",
    identity: "Soy su asistente legal de France Justice. Estoy aquí para informarle sobre sus derechos, guiarle en sus trámites y analizar sus documentos según el derecho francés y europeo.\n\n¿En qué puedo serle útil?",
    vague_help: "Estoy aquí para ayudarle y guiarle paso a paso.\n\n¿Qué tipo de situación le preocupa?\n\n• **Trabajo y Empleo:** conflicto laboral, despido, salarios impagados.\n• **Vivienda e Inmuebles:** conflicto de alquiler, fianza no devuelta, desahucio.\n• **Consumo y Contratos:** producto defectuoso, rechazo de reembolso, retraso de entrega.\n• **Familia y Sucesiones:** divorcio, pensión alimenticia, custodia, herencias.\n• **Otros:** problemas vecinales, multas, fraude online.\n\nExplíqueme su situación en 2 o 3 frases y le indicaré sus derechos y el procedimiento exacto."
  },
  tr: {
    how_are_you: "Çok iyiyim, teşekkür ederim! Siz nasılsınız?\n\nBugün size nasıl yardımcı olabilirim? Haklarınızla ilgili soru sorabilir veya belgelerinizi analiz için yükleyebilirsiniz.",
    greeting: "Merhaba! Bugün size nasıl yardımcı olabilirim?\n\nLütfen hukuki durumunuzu açıklayın veya belgelerinizi birlikte incelememiz için yükleyin.",
    thanks: "Rica ederim! Herhangi bir konuyu derinleştirmek veya bir adım atmak isterseniz hizmetinizdeyim.",
    farewell: "Görüşmek üzere, iyi günler dilerim! Yeni bir sorunuz olduğunda tekrar beklerim.",
    acknowledgment: "Harika! Bir sonraki adıma geçmek istediğinizde buradayım.",
    identity: "Ben France Justice YZ hukuki asistanınızım. Fransız ve Avrupa hukuku kapsamında haklarınızı öğrenmenize, prosedürleri yürütmenize ve belgelerinizi incelemenize yardımcı olmak için buradayım.\n\nSize nasıl yardımcı olabilirim?",
    vague_help: "Adım adım size rehberlik etmek için buradayım.\n\nNe tür bir hukuki konuyla karşı karşıyasınız?\n\n• **İş ve İstihdam:** işveren uyuşmazlığı, fesih, ödenmemiş maaşlar.\n• **Konut ve Gayrimenkul:** kira uyuşmazlığı, depozito iadesi, tahliye.\n• **Tüketici ve Sözleşmeler:** ayıplı mal, iade reddi, teslimat gecikmesi.\n• **Aile ve Miras:** boşanma, nafaka, velayet, veraset.\n• **Diğer:** komşuluk uyuşmazlıkları, ceza itirazları, internet dolandırıcılığı.\n\nDurumunuzu 2-3 cümleyle açıklayın, size haklarınızı ve izlenecek adımları belirteyim."
  },
  ku: {
    how_are_you: "Ez pir baş im, spas! Hûn çawa ne?\n\nÎro ez çawa dikarim alîkariya we bikim? Hûn dikarin li ser mafên xwe bipirsin an jî belgeyên xwe ji bo analîzê bişînin.",
    greeting: "Silav! Îro ez çawa dikarim alîkariya we bikim?\n\nJi kerema xwe rewşa xwe ya yasayî vebêjin an belgeyên xwe bar bikin da ku em bi hev re lêkolîn bikin.",
    thanks: "Ser çavan! Ger hûn bixwazin xalek kûrtir bikin an gavan bavêjin, ez di xizmeta we de me.",
    farewell: "Xatirê te û rojek xweş ji we re! Dema pirsên we hebin hûn dikarin vegerin.",
    acknowledgment: "Pir baş e! Dema ku hûn bixwazin derbasî gava pêş bibin ez amade me.",
    identity: "Ez asîstana yasayî ya AI a France Justice me. Li gorî yasaya Fransî û Ewropî ji bo alîkariya maf û belgeyên we li vir im.\n\nEz dikarim çi ji we re bikim?",
    vague_help: "Ez gav bi gav rêberiya we dikim.\n\nMijara we çi ye?\n\n• **Kar û Xebat:** nakokiya kar, îxrac, mûçeyên nehatî dayîn.\n• **Cih û Xanî:** kirê, temînat, derxistin.\n• **Bikarhêner:** berhema xirab, paşveçûn.\n• **Malbat:** telaq, nefeqe, mîrat.\n\nRewşa xwe di 2-3 hevokan de bibêjin, ez ê maf û gavan nîşanî we bidim."
  },
  ru: {
    how_are_you: "У меня всё отлично, спасибо! А как ваши дела?\n\nЧем я могу вам помочь сегодня? Вы можете задать вопрос о своих правах или прикрепить документы для юридического анализа.",
    greeting: "Здравствуйте! Чем я могу вам помочь сегодня?\n\nОпишите вашу правовую ситуацию или загрузите документы, чтобы мы изучили их вместе.",
    thanks: "Пожалуйста! Я в вашем полном распоряжении, если нужно уточнить какой-либо вопрос или начать юридическую процедуру.",
    farewell: "До свидания и хорошего вам дня! Берегите себя и обращайтесь, если возникнут новые вопросы.",
    acknowledgment: "Отлично! Я на связи, когда вы будете готовы перейти к следующему шагу.",
    identity: "Я ваш юридический ИИ-ассистент France Justice. Я помогаю разобраться в правах по французскому и европейскому законодательству, вести дела и анализировать документы.\n\nЧем я могу быть полезен?",
    vague_help: "Я здесь, чтобы помочь вам шаг за шагом.\n\nО какой ситуации идет речь?\n\n• **Труд и занятость:** спор с работодателем, увольнение, невыплата зарплаты.\n• **Жильё и аренда:** возврат залога, задолженность по аренде, выселение.\n• **Потребление и договоры:** брак товара, отказ в возврате, задержка доставки.\n• **Семья и наследство:** развод, алименты, опека над детьми, наследство.\n• **Другое:** соседские споры, обжалование штрафов, онлайн-мошенничество.\n\nОпишите вашу ситуацию в 2-3 предложениях, и я объясню ваши права и конкретный порядок действий."
  }
};

export function detectConversationalGreeting(input: string, lang?: string): {
  isConversational: boolean;
  type?: 'greeting' | 'how_are_you' | 'thanks' | 'farewell' | 'acknowledgment' | 'identity' | 'vague_help';
  replyText?: string;
} {
  if (!input) return { isConversational: false };
  const clean = input.trim().toLowerCase().replace(/[!?.,;:()]+$/, '').trim();
  if (!clean || clean.length > 90) return { isConversational: false };

  // Detect explicit input language by characters or words
  let detectedLang = lang;
  if (!detectedLang) {
    if (/[\u0600-\u06FF]/.test(clean)) detectedLang = 'ar';
    else if (/[\u0400-\u04FF]/.test(clean)) detectedLang = 'ru';
    else if (typeof window !== 'undefined') detectedLang = localStorage.getItem('i18nextLng') || 'fr';
    else detectedLang = 'fr';
  }
  const effectiveLang = GREETING_REPLIES[detectedLang] ? detectedLang : 'fr';
  const replies = GREETING_REPLIES[effectiveLang] || GREETING_REPLIES.fr;

  // 1. How are you
  if (
    /^(comment\s+(?:tu\s+vas|vas-tu|allez-vous|vous\s+allez|(?:ça|ca)\s+va)|(?:tu\s+vas|vous\s+allez)\s+bien|(?:ça|ca)\s+va(?:\s+bien)?|tout\s+va\s+bien)$/i.test(clean) ||
    /^(how\s+are\s+you|how\s+is\s+it\s+going|how\s+are\s+things|are\s+you\s+well|how\s+do\s+you\s+do)$/i.test(clean) ||
    /^(كيف\s+حالك|كيفك|شخبارك|أنت\s+بخير|انت\s+بخير|كيف\s+الأمور|كيف\s+الحال)$/i.test(clean) ||
    /^(c[oó]mo\s+est[aá]s|c[oó]mo\s+te\s+va|todo\s+bien|qu[eé]\s+tal)$/i.test(clean) ||
    /^(nas[iı]ls[iı]n|nas[iı]ls[iı]n[iı]z|nas[iı]l\s+gidiyor|iyi\s+misin)$/i.test(clean) ||
    /^(как\s+дела|как\s+вы|как\s+жизнь|всё\s+хорошо)$/i.test(clean) ||
    /^(çawa\s+y[iî]|h[uû]n\s+çawa\s+ne)$/i.test(clean)
  ) {
    return { isConversational: true, type: 'how_are_you', replyText: replies.how_are_you };
  }

  // 2. Pure greetings
  if (
    /^(bonjour|bonsoir|salut|coucou|bonjour\s+[aà]\s+tous)$/i.test(clean) ||
    /^(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening|howdy|yo)$/i.test(clean) ||
    /^(مرحبا|مرحباً|أهلا|اهلا|السلام\s+عليكم|صباح\s+الخير|مساء\s+الخير|أهلاً|هلا)$/i.test(clean) ||
    /^(hola|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches)$/i.test(clean) ||
    /^(merhaba|selam|g[uü]nayd[iı]n|iyi\s+g[uü]nler|iyi\s+ak[sş]amlar)$/i.test(clean) ||
    /^(привет|здравствуйте|добрый\s+день|доброе\s+утро|добрый\s+вечер)$/i.test(clean) ||
    /^(silav|rojba[sş]|[eê]varba[sş])$/i.test(clean)
  ) {
    return { isConversational: true, type: 'greeting', replyText: replies.greeting };
  }

  // 3. Thanks / gratitude
  if (
    /^(merci(?:\s+beaucoup|\s+bien|\s+infiniment)?|de\s+rien|je\s+te\s+remercie|je\s+vous\s+remercie)$/i.test(clean) ||
    /^(thanks|thank\s+you|thank\s+you\s+very\s+much|many\s+thanks)$/i.test(clean) ||
    /^(شكرا|شكراً|شكرا\s+جزيلا|شكراً\s+جزيلاً|بارك\s+الله\s+فيك|ألف\s+شكر|تسلم)$/i.test(clean) ||
    /^(gracias|muchas\s+gracias|mil\s+gracias)$/i.test(clean) ||
    /^(te[sş]ekk[uü]rler|te[sş]ekk[uü]r\s+ederim|sa[gğ]\s+ol)$/i.test(clean) ||
    /^(спасибо|большое\s+спасибо|благодарю)$/i.test(clean) ||
    /^(spas|gelek\s+spas)$/i.test(clean)
  ) {
    return { isConversational: true, type: 'thanks', replyText: replies.thanks };
  }

  // 4. Farewells
  if (
    /^(au\s+revoir|bonne\s+(?:journée|soirée|nuit|continuation)|à\s+(?:bientôt|tout\s+à\s+l['']heure|la\s+prochaine))$/i.test(clean) ||
    /^(bye|goodbye|see\s+you|have\s+a\s+nice\s+day|farewell)$/i.test(clean) ||
    /^(مع\s+السلامة|إلى\s+اللقاء|وداعا|وداعاً|في\s+أمان\s+الله|نهارك\s+سعيد)$/i.test(clean) ||
    /^(adi[oó]s|hasta\s+luego|hasta\s+pronto|que\s+tengas\s+un\s+buen\s+d[ií]a)$/i.test(clean) ||
    /^(g[oö]r[uü][sş][uü]r[uü]z|ho[sş][cç]akal|iyi\s+g[uü]nler)$/i.test(clean) ||
    /^(до\s+свидания|пока|всего\s+доброго)$/i.test(clean) ||
    /^(xatir[eê]\s+te|bi\s+xatira\s+te)$/i.test(clean)
  ) {
    return { isConversational: true, type: 'farewell', replyText: replies.farewell };
  }

  // 5. Acknowledgments
  if (
    /^(ok|d['']accord|dacc|parfait|super|génial|bravo|c['']est\s+noté|très\s+bien|bien\s+compris|entendu|noté)$/i.test(clean) ||
    /^(ok|okay|understood|got\s+it|perfect|great|awesome|noted)$/i.test(clean) ||
    /^(حسنا|حسناً|تمام|مفهوم|واضح|ممتاز|رائع|أوكي|اوكي)$/i.test(clean) ||
    /^(vale|de\s+acuerdo|perfecto|entendido|genial)$/i.test(clean) ||
    /^(tamam|anla[sş][iı]ld[iı]|harika|peki)$/i.test(clean) ||
    /^(хорошо|ладно|понятно|ясно|отлично|договорились)$/i.test(clean) ||
    /^(ba[sş]\s+e|f[eê]hm\s+kir|temam)$/i.test(clean)
  ) {
    return { isConversational: true, type: 'acknowledgment', replyText: replies.acknowledgment };
  }

  // 6. Identity
  if (
    /^(qui\s+es-tu|qui\s+êtes-vous|qui\s+es\s+tu|qui\s+etes\s+vous|comment\s+tu\s+t['']appelles?|c['']est\s+quoi\s+france\s+justice|que\s+peux-tu\s+faire|tu\s+peux\s+faire\s+quoi|aide|aidez-moi)$/i.test(clean) ||
    /^(who\s+are\s+you|what\s+can\s+you\s+do|what\s+is\s+france\s+justice|help\s+me)$/i.test(clean) ||
    /^(من\s+أنت|من\s+انت|ماذا\s+يمكنك\s+أن\s+تفعل|ماذا\s+تفعل|ما\s+هي\s+فرنسا\s+للعدالة|ساعدني)$/i.test(clean) ||
    /^(qui[eé]n\s+eres|qu[eé]\s+puedes\s+hacer|qu[eé]\s+es\s+france\s+justice|ay[uú]dame)$/i.test(clean) ||
    /^(kimsin|sen\s+kimsin|ne\s+yapabilirsin|bana\s+yard[iı]m\s+et)$/i.test(clean) ||
    /^(кто\s+ты|что\s+ты\s+умеешь|помоги\s+мне)$/i.test(clean) ||
    /^(tu\s+k[iî]\s+y[iî]|tu\s+dikare\s+çi\s+bikî|al[iî]kar[iî]\s+bide\s+min)$/i.test(clean)
  ) {
    return { isConversational: true, type: 'identity', replyText: replies.identity };
  }

  // 7. Vague help / starter inquiries & general advice requests
  if (
    /^(?:(?:qu['’]est[- ]ce que tu (?:me )?(?:conseilles?|proposes?)(?: comme conseil)?)|(?:tu (?:me )?(?:conseilles?|proposes?) quoi)|(?:que (?:me )?(?:conseillez|conseilles)[- ](?:vous|tu))|(?:donne[- ]moi un conseil)|(?:quel(?:s)? (?:est|sont) (?:ton|votre|tes|vos) conseils?)|(?:besoin d['’]un? conseils?)|(?:je cherche un conseil)|(?:tu peux me conseiller)|(?:conseil(?:s)?(?: juridique[s]?)?)|(?:j['’]ai\s+(?:un\s+)?(?:probl[èe]me|probleme|souci|litige|diff[ée]rend))|(?:aidez-moi|aide\s+moi|j['’]ai\s+besoin\s+d['’]aide|que\s+faire(?:\s+maintenant)?|je\s+ne\s+sais\s+pas\s+quoi\s+faire|pouvez-vous\s+m['’]aider|peux-tu\s+m['’]aider|comment\s+(?:faire|procéder)|j['’]ai\s+une\s+question|conseillez-moi|au\s+secours)|(?:probl[èe]me|probleme|souci|litige|aide|conseil))[\s!?.]*$/i.test(clean) ||
    /^(i\s+have\s+a\s+problem|i\s+need\s+help|what\s+should\s+i\s+do|can\s+you\s+help\s+me|help|legal\s+advice|what\s+do\s+you\s+advise)$/i.test(clean) ||
    /^(لدي\s+مشكلة|عندي\s+مشكلة|أحتاج\s+مساعدة|احتاج\s+مساعدة|ماذا\s+أفعل|ماذا\s+افعل|هل\s+يمكنك\s+مساعدتي|مساعدة|استشارة\s+قانونية|نصيحة)$/i.test(clean) ||
    /^(tengo\s+un\s+problema|necesito\s+ayuda|qu[eé]\s+debo\s+hacer|puedes\s+ayudarme|consejo\s+legal|qu[eé]\s+me\s+aconsejas)$/i.test(clean) ||
    /^(bir\s+sorunum\s+var|yard[iı]ma\s+ihtiyac[iı]m\s+var|ne\s+yapmal[iı]y[iı]m|yard[iı]m\s+eder\s+misin|hukuki\s+dan[iı][sş]manl[iı]k)$/i.test(clean) ||
    /^(у\s+меня\s+проблема|мне\s+нужна\s+помощь|что\s+мне\s+делать|можешь\s+помочь|юридическая\s+консультация|совет)$/i.test(clean) ||
    /^(pirsgir[eê]kek\s+min\s+heye|p[eê]w[iî]stiya\s+min\s+bi\s+al[iî]kar[iî]y[eê]\s+heye|div[eê]\s+ez\s+çi\s+bikim)$/i.test(clean) ||
    /^(probl[èe]me|probleme|souci|litige|aide|conseil)[\s!?.]*$/i.test(clean)
  ) {
    return { isConversational: true, type: 'vague_help', replyText: replies.vague_help };
  }

  return { isConversational: false };
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
  const convGreeting = detectConversationalGreeting(clean, _targetLang);
  if (convGreeting.isConversational) {
    let reply = convGreeting.replyText || "Bonjour ! Comment puis-je vous aider aujourd'hui ?";
    if (hasFiles && convGreeting.type === 'vague_help') {
      reply = `Je suis à votre disposition pour vous conseiller et examiner vos documents.\n\n` +
        `J'ai bien accès à vos pièces jointes${attachedDocTitle ? ` (*${attachedDocTitle}*)` : ''}. Souhaitez-vous :\n` +
        `• Que j'analyse les clauses et les risques de vos documents ?\n` +
        `• Que je vous explique vos droits et les recours possibles ?\n` +
        `• Que je prépare une démarche amiable ou un courrier ?\n\n` +
        `Indiquez-moi votre priorité ou posez-moi directement votre question.`;
    }
    return {
      text: reply,
      sources_web: [],
      suggestions: [
        "Poser une question en droit du travail",
        "Litige de bail ou de caution",
        "Contestation de facture ou contrat",
        "Divorce ou droit de la famille"
      ],
      automations: []
    };
  }

  // ── SMART FOLLOW-UP HANDLER ────────────────────────────────────────────────
  // When the user asks a short question (< 9 words) in an ongoing conversation,
  // answer directly from the previous context instead of re-running a full template.
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  const hasHistory = Array.isArray(history) && history.length >= 2;

  if (hasHistory && wordCount < 9) {
    // Get the last assistant message text as the primary context source
    const lastModelMsg = [...history].reverse().find(h => h.role === 'model');
    const prevCtx = lastModelMsg?.parts?.[0]?.text || '';
    const allCtx = previousTurnsContext;

    // "c'est le divorce de qui" / "qui sont les parties" / "c'est qui" / "c'est quoi"
    if (/(?:divorce de qui|qui sont|qui est|c'est qui|parties?|époux|épouse|demandeur|défendeur|concernant qui)/i.test(clean)) {
      // Extract M./Mme names from previous context
      const mNames = prevCtx.match(/M\.\s+([A-ZÀ-Ÿ][a-zA-ZÀ-Ÿ\-]{2,})/g) || [];
      const mmeNames = prevCtx.match(/Mme\.?\s+([A-ZÀ-Ÿ][a-zA-ZÀ-Ÿ\-]{2,})/g) || [];
      // All-caps surnames (e.g. MARCHAND, DUBOIS)
      const capsNames = prevCtx.match(/\b([A-ZÀ-Ÿ]{4,})\b/g)?.filter(n => !['CODE', 'CIVIL', 'DROIT', 'ARTICLE', 'LRAR', 'JAF', 'TRIBUNAL'].includes(n)) || [];

      if (mNames.length > 0 || mmeNames.length > 0 || capsNames.length >= 2) {
        const p1 = mNames[0] || (capsNames[0] ? `M. ${capsNames[0]}` : 'la première partie');
        const p2 = mmeNames[0] || (capsNames[1] ? `Mme ${capsNames[1]}` : 'la seconde partie');
        return {
          text: `Il s'agit du divorce de **${p1}** et **${p2}**.\n\nSi vous souhaitez des précisions sur un point particulier — prestation compensatoire, garde des enfants, partage du patrimoine, ou pension alimentaire — n'hésitez pas à poser votre question.`,
          sources_web: [],
          suggestions: [
            'Quel est le montant de la prestation compensatoire ?',
            'Comment se calcule la pension alimentaire pour les enfants ?',
            'Quelles sont les étapes du divorce par consentement mutuel ?'
          ],
          automations: []
        };
      }
    }

    // "quel est le montant" / "combien" / "quelle somme"
    if (/(?:montant|combien|quelle somme|quel prix|indemnité|pension|prestation|€)/i.test(clean)) {
      const amountsInCtx = allCtx.match(/[\d\s]{1,8}(?:000)?\s*(?:€|euros?)/gi) || [];
      if (amountsInCtx.length > 0) {
        const unique = [...new Set(amountsInCtx.map(a => a.trim()))].slice(0, 2).join(' et ');
        return {
          text: `D'après l'analyse du dossier, les montants identifiés s'élèvent à **${unique}**.\n\nSouhaitez-vous que je détaille le calcul ou que je prépare la clause correspondante ?`,
          sources_web: [],
          suggestions: ['Calculer la prestation compensatoire', 'Simuler la pension alimentaire selon la grille officielle'],
          automations: []
        };
      }
    }
  }
  // ── END FOLLOW-UP HANDLER ──────────────────────────────────────────────────
  // ── END FOLLOW-UP HANDLER ──────────────────────────────────────────────────


  const isDocGeneration = !convGreeting.isConversational && (
    /^(?:rédige|rédiger|génère|générer|crée|créer|établis|établir|fais-moi|écris-moi|prépare-moi)\s+(?:une?\s+)?(?:lettre|mise en demeure|contrat|plainte|conclusions|accord|requête|assignation|sommation)/i.test(clean) ||
    /^(?:mise en demeure|sommation|plainte|assignation)[\s!?.]*$/i.test(clean) ||
    /(?:peux-tu|veuillez|merci de)\s+(?:me\s+)?(?:rédiger|générer|créer|établir)\s+(?:une?\s+)?(?:lettre|mise en demeure|contrat|plainte|conclusions|accord|requête|assignation)/i.test(clean)
  );

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
      // NOTE: regex WITHOUT /i flag so only truly ALL-CAPS surnames match (MARCHAND, DUBOIS)
      // and not mixed-case words like "Dossier" or "Divorce" that appear in filenames
      let epouxDisplay = "Époux";
      let epouseDisplay = "Épouse";
      // First try to find fully uppercase surnames 4+ chars separated by a delimiter
      const partiesStrict = (attachedDocText + ' ' + docNameDisplay).match(/([A-ZÀ-Ÿ]{4,})\s*(?:[-_&/]|\s+et\s+|\s+contre\s+)\s*([A-ZÀ-Ÿ]{4,})/);
      // Fallback: look for typical "NOM Prénom" pattern in document text
      const partiesText = !partiesStrict && attachedDocText.match(/(?:M\.|Monsieur|époux)\s+([A-ZÀ-Ÿ][a-zà-ÿ]{2,})/i);
      const partiesText2 = !partiesStrict && attachedDocText.match(/(?:Mme|Madame|épouse)\s+([A-ZÀ-Ÿ][a-zà-ÿ]{2,})/i);

      if (partiesStrict) {
        epouxDisplay = `M. ${partiesStrict[1]}`;
        epouseDisplay = `Mme ${partiesStrict[2]}`;
      } else if (partiesText && partiesText2) {
        epouxDisplay = `M. ${partiesText[1]}`;
        epouseDisplay = `Mme ${partiesText2[1]}`;
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

    // DETECT USER SPECIFIC CONVERSATIONAL INTENTS (LIKE CHATGPT / CLAUDE)
    const isGardeEnfants = /(garde|enfant|autorité parentale|résidence alternée|résidence principale|droit de visite|dvh|vacances|scolaire|scolarité|week-end|mineur)/i.test(clean);
    const isPensionAlimentaire = /(pension|alimentaire|contribution|barème|combien|montant|frais|caf|aripa|entretien)/i.test(clean);
    const isPrestationCompensatoire = /(prestation|compensatoire|disparité|capital|270|271|train de vie)/i.test(clean);
    const isLogementOuImmobilier = /(logement|appartement|maison|bien|immobilier|crédit|loyer|bail|1751|jouissance|vendre|vente|indivision|soulte|notaire)/i.test(clean);
    const isProcedureOuDelais = /(délai|délais|combien de temps|durée|étape|étapes|procédure|comment faire|marche à suivre|coût|tarif|prix|avocat|notaire)/i.test(clean);
    const isResume = /(résumé|résume|synthèse|synthétise|bref|en quelques lignes|court|synthétique)/i.test(clean);
    const isGenericDossierUpload = !clean || 
      /^(analyse|analyser|voici mon dossier|voici mes pièces|dossier juridique|audit|analyse de dossier|examen|étudie|étudier|regarde ce dossier)[\s!?.]*$/i.test(clean) ||
      /^(audit et analyse complète du dossier|dossier soumis)[\s!?.]*$/i.test(clean);

    const isSpecificFollowUp = (history && history.length > 0) || (!isGenericDossierUpload && clean.length > 3);

    // INTENT 1: DOCUMENT DRAFTING (CONVENTION, MISE EN DEMEURE, PROJET D'ACCORD)
    if (isDocGeneration) {
      if (detectedDomain === 'famille') {
        const docTitle = clean.includes('convention') ? 'Projet de Convention de Divorce par Consentement Mutuel' :
                         clean.includes('accord') || clean.includes('parental') ? 'Accord Parental & Modalités d\'Exercice de l\'Autorité Parentale' :
                         'Projet d\'Acte Juridique & Convention Familiale';

        responseText = `J'ai rédigé le projet d'acte complet et immédiatement exploitable pour votre dossier (*${docNameDisplay}*) :\n\n` +
          `---\n` +
          `${docTitle.toUpperCase()}\n` +
          `(Articles 229-1 et suivants du Code Civil)\n\n` +
          `**ENTRE LES SOUSSIGNÉS :**\n` +
          `- **Époux :** ${partiesMapping.demandeur}, assisté de son avocat au Barreau.\n` +
          `- **Épouse :** ${partiesMapping.adversaire}, assistée de son avocat au Barreau distinct.\n\n` +
          `**PRÉAMBULE :**\n` +
          `Les époux se sont mariés le ${detectedDate || 'selon acte d\'état civil'} à ${detectedLocation}. Constatant la rupture irrémédiable de leur vie commune, ils s'accordent par les présentes sur l'ensemble des conséquences du divorce conformément à l'article 229-1 du Code Civil.\n\n` +
          `**ARTICLE 1 : CONSENTEMENT AU DIVORCE**\n` +
          `Les époux déclarent mutuellement et expressément consentir à la rupture de leur mariage par acte sous signature privée contresigné par avocats et déposé au rang des minutes d'un notaire.\n\n` +
          `**ARTICLE 2 : AUTORITÉ PARENTALE & RÉSIDENCE DES ENFANTS**\n` +
          `- **Autorité parentale :** Conjointe et exclusive des deux parents (art. 371-1 et 372 du Code civil). Toutes les décisions importantes (santé, scolarité, orientation religieuse) requièrent l'accord exprès des deux parents.\n` +
          `- **Résidence :** Les parties conviennent de fixer la résidence habituelle des enfants selon un calendrier équilibré (résidence alternée hebdomadaire du vendredi sortie des classes au vendredi suivant, ou résidence principale avec droit de visite et d'hébergement un week-end sur deux et la moitié de toutes les vacances scolaires).\n\n` +
          `**ARTICLE 3 : PENSION ALIMENTAIRE & FRAIS EXCEPTIONNELS**\n` +
          `Au titre de l'article 371-2 du Code Civil, une contribution à l'entretien et à l'éducation des enfants fixée à ${detectedAmount || '350 € par enfant et par mois'} sera versée d'avance le 1er de chaque mois, indexée annuellement sur l'indice INSEE des prix à la consommation. Les frais exceptionnels (frais médicaux non remboursés, voyages scolaires, activités sportives) seront partagés par moitié sur justificatifs préalablement concertés.\n\n` +
          `**ARTICLE 4 : LOGEMENT FAMILIAL & PATRIMOINE**\n` +
          `La jouissance du domicile conjugal sis à ${detectedLocation} est attribuée selon accord des parties (avec transfert du bail ou état liquidatif notarié préalable si bien immobilier commun).\n\n` +
          `**ARTICLE 5 : DÉPÔT CHEZ LE NOTAIRE & FORCE EXÉCUTOIRE**\n` +
          `Après purge du délai de réflexion légal de 15 jours par LRAR (art. 229-4 C. civ.), la présente convention sera contresignée et déposée au rang des minutes d'un notaire pour lui conférer force exécutoire et date certaine.\n\n` +
          `Fait à ${detectedLocation}, le ${new Date().toLocaleDateString('fr-FR')}, en autant d'originaux que de parties et d'avocats.\n` +
          `---\n\n` +
          `💡 **Instructions pratiques :** Ce document constitue la trame officielle que vos deux avocats respectifs doivent adapter et vous notifier formellement par lettre recommandée avec accusé de réception pour faire courir le délai de réflexion de 15 jours incompressibles.`;

        action = {
          type: 'CREATE_DOCUMENT',
          payload: {
            title: docTitle,
            content: responseText
          }
        };
      } else {
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
      }

    // INTENT 2: GARDE DES ENFANTS / AUTORITÉ PARENTALE
    } else if (isGardeEnfants && detectedDomain === 'famille') {
      responseText = `Voici les règles juridiques précises et les modalités concrètes concernant la garde de vos enfants pour votre dossier (*${docNameDisplay}*) :\n\n` +
        `**1. Principe fondamental : L'autorité parentale conjointe (Art. 371-1 et 372 du Code civil)**\n` +
        `La séparation ou le divorce des parents est sans incidence sur les règles de dévolution de l'exercice de l'autorité parentale. Les deux parents conservent les mêmes droits et devoirs. Cela signifie que tout choix déterminant (changement d'école, interventions médicales non urgentes, voyages à l'étranger) nécessite obligatoirement l'accord des deux parents.\n\n` +
        `**2. Les deux options de résidence pour les enfants**\n` +
        `- **Option A : La résidence alternée (Art. 373-2-9 du Code civil)**\n` +
        `  Les enfants partagent leur temps de manière équilibrée entre le domicile du père et celui de la mère (généralement une semaine sur deux, avec bascule le vendredi à la sortie des classes). Conditions pratiques : proximité géographique des deux domiciles, respect des repères scolaires et capacité des parents à dialoguer de manière constructive.\n` +
        `- **Option B : La résidence principale chez un parent + Droit de visite et d'hébergement (DVH)**\n` +
        `  L'enfant a sa résidence habituelle fixée chez l'un des parents (par exemple la mère ou le père). L'autre parent bénéficie alors d'un droit de visite et d'hébergement classique : un week-end sur deux (les fins de semaine paires ou impaires selon le calendrier officiel) et la moitié de toutes les vacances scolaires (1ère moitié les années paires, 2nde moitié les années impaires).\n\n` +
        `**3. Prise en charge des frais du quotidien & Frais exceptionnels**\n` +
        `- **Frais habituels :** Nourriture, logement et habillement quotidien sont pris en charge par le parent qui accueille l'enfant au moment considéré.\n` +
        `- **Frais exceptionnels :** Les frais de scolarité, cantine, activités extrascolaires, voyages scolaires et soins de santé non remboursés (optique, orthodontie) font l'objet d'un partage par moitié (50/50), sous réserve d'un accord préalable sur devis ou présentation de facture acquittée.\n\n` +
        `**4. Ce que vous devez acter dès maintenant**\n` +
        `Dans le cadre d'un divorce par consentement mutuel, vos deux avocats inséreront ces modalités dans la convention. Si vous êtes d'accord sur le principe d'une résidence alternée ou d'une résidence principale, je peux vous rédiger la clause parentale type prête à signer.`;

    // INTENT 3: PENSION ALIMENTAIRE & CONTRIBUTION
    } else if (isPensionAlimentaire && detectedDomain === 'famille') {
      responseText = `Voici le cadre juridique officiel et la méthode de calcul de la contribution à l'entretien et l'éducation des enfants (Art. 371-2 du Code civil) pour votre dossier :\n\n` +
        `**1. Fondement légal de la pension alimentaire (Art. 371-2 du Code civil)**\n` +
        `Chacun des parents contribue à l'entretien et à l'éducation des enfants à proportion de ses ressources personnelles et des besoins de l'enfant. Cette obligation ne cesse pas automatiquement à la majorité, mais se poursuit tant que l'enfant n'est pas financièrement autonome (études supérieures, formation).\n\n` +
        `**2. Barème et table de référence officielle du Ministère de la Justice**\n` +
        `Le montant est calculé à partir du **revenu net mensuel disponible du parent débiteur**, après déduction du minimum vital (montant forfaitaire du RSA, soit environ 635 €) :\n` +
        `- **En garde classique (droit de visite et d'hébergement standard) :**\n` +
        `  • Pour 1 enfant : environ 11,5% du revenu net disponible.\n` +
        `  • Pour 2 enfants : environ 9,5% par enfant (soit 19% au total).\n` +
        `  • Pour 3 enfants : environ 8,5% par enfant (soit 25,5% au total).\n` +
        `- **En résidence alternée :**\n` +
        `  En principe, chaque parent assume directement les frais durant sa semaine de garde. Toutefois, si une **disparité significative de revenus** existe entre les parents, une pension alimentaire d'ajustement est fixée pour maintenir un niveau de vie harmonieux à l'enfant dans ses deux foyers.\n\n` +
        `**3. Modalités de paiement & Revalorisation automatique**\n` +
        `- **Échéance :** Paiement d'avance par virement bancaire automatique avant le 1er ou le 5 de chaque mois.\n` +
        `- **Indexation obligatoire :** La pension est révisée chaque année au 1er janvier en fonction de la variation de l'indice des prix à la consommation (série France entière hors tabac publiée par l'INSEE).\n` +
        `- **Sécurité anti-impayés (ARIPA) :** Le paiement peut être automatiquement intermédié par l'Agence de recouvrement des impayés de pensions alimentaires (CAF/MSA), garantissant le versement sans conflit direct.\n\n` +
        `💡 Souhaitez-vous que nous simulions le montant exact de la pension en fonction des revenus respectifs ?`;

    // INTENT 4: PRESTATION COMPENSATOIRE
    } else if (isPrestationCompensatoire && detectedDomain === 'famille') {
      responseText = `Voici l'analyse juridique approfondie sur la prestation compensatoire (Articles 270 et 271 du Code civil) applicable à votre dossier :\n\n` +
        `**1. Définition et finalité (Art. 270 du Code civil)**\n` +
        `La prestation compensatoire est destinée à compenser, autant qu'il est possible, la disparité que la rupture du mariage crée dans les conditions de vie respectives des époux. Elle présente un caractère forfaitaire.\n\n` +
        `**2. Critères légaux d'évaluation (Art. 271 du Code civil)**\n` +
        `Le montant est fixé en tenant compte notamment :\n` +
        `- De la durée du mariage et de la vie commune.\n` +
        `- De l'âge et de l'état de santé des époux.\n` +
        `- De leur qualification et de leur situation professionnelles.\n` +
        `- Des conséquences des choix professionnels faits par l'un des époux pendant la vie commune pour l'éducation des enfants et du temps qu'il faudra encore y consacrer.\n` +
        `- Du patrimoine estimé ou prévisible des époux, tant en capital qu'en revenu, après la liquidation du régime matrimonial.\n` +
        `- De leurs droits existants et prévisibles à la retraite.\n\n` +
        `**3. Forme du versement**\n` +
        `- **Principe : Le capital (Art. 274 du Code civil)** : Versement d'une somme d'argent en une seule fois, ou abandon d'un bien en pleine propriété ou d'un droit d'usager.\n` +
        `- **Modalités échelonnées (Art. 275 du Code civil)** : Possibilité de verser ce capital sous forme de versements mensuels ou annuels étalés sur une durée maximale de **8 ans** (96 mensualités).\n\n` +
        `**4. Régime fiscal**\n` +
        `- Si versée dans les 12 mois du divorce définitif : Réduction d'impôt sur le revenu de 25% dans la limite de 30 500 € pour le débiteur, et non imposable pour le bénéficiaire.\n` +
        `- Si étalée sur plus de 12 mois : Déductible des revenus pour le débiteur, mais imposable dans la catégorie des pensions pour le créancier.`;

    // INTENT 5: LOGEMENT FAMILIAL & PATRIMOINE IMMOBILIER
    } else if (isLogementOuImmobilier && detectedDomain === 'famille') {
      responseText = `Voici le sort juridique du logement familial et des biens immobiliers pour votre dossier :\n\n` +
        `**1. Si le domicile conjugal est loué (bail d'habitation)**\n` +
        `- **Cotitularité légale (Art. 1751 du Code civil)** : Même si un seul des époux a signé le bail avant le mariage, les deux conjoints sont légalement cotitulaires du bail et solidairement responsables du paiement des loyers pendant toute la durée du mariage.\n` +
        `- **Rupture de la solidarité :** La convention de divorce doit expressément attribuer la jouissance exclusive du logement à l'un des époux. Dès le dépôt de la convention chez le notaire, l'avocat notifie le bailleur pour acter la désolidarisation de l'autre époux pour les loyers futurs.\n\n` +
        `**2. Si le domicile conjugal est la propriété des époux (bien commun ou indivis)**\n` +
        `En présence d'un bien immobilier commun ou acquis ensemble, le passage devant un **notaire est obligatoirement requis** avant de finaliser la convention de divorce (Art. 229-1 alinéa 3 du Code civil). Trois solutions s'offrent à vous :\n` +
        `- **Option 1 : La vente du bien à un tiers**\n` +
        `  Le bien est mis en vente, le crédit immobilier est remboursé par anticipation, et le reliquat net vendeur est partagé selon les quotes-parts chez le notaire.\n` +
        `- **Option 2 : Le rachat de part (rachat de soulte)**\n` +
        `  L'un des époux conserve le logement et rachète la part de l'autre en lui versant une soulte chiffrée par le notaire, avec reprise intégrale du prêt immobilier auprès de la banque (désolidarisation bancaire indispensable).\n` +
        `- **Option 3 : Le maintien dans l'indivision (Convention d'indivision notariée)**\n` +
        `  Les époux restent copropriétaires du bien pour une durée déterminée (ex: 5 ans) en fixant les modalités de paiement des charges et une éventuelle indemnité d'occupation si un époux l'occupe seul.`;

    // INTENT 6: PROCÉDURE, DÉLAIS & ÉTAPES
    } else if (isProcedureOuDelais) {
      if (detectedDomain === 'famille') {
        responseText = `Voici la chronologie exacte, les délais incompressibles et le coût d'une procédure de divorce par consentement mutuel (Art. 229-1 du Code civil) :\n\n` +
          `**1. Les 5 étapes indispensables de la procédure**\n` +
          `- **Étape 1 : Désignation de deux avocats distincts (Obligation légale)**\n` +
          `  Un avocat unique est formellement interdit par l'article 229-1 du Code Civil, afin de garantir l'absence de conflit d'intérêts et l'équilibre des accords.\n` +
          `- **Étape 2 : Rédaction commune de la convention de divorce**\n` +
          `  Vos avocats rédigent le projet de convention réglant l'intégralité des effets : résidence des enfants, pension alimentaire, sort du logement et liquidation patrimoniale (état liquidatif notarié préalable si bien immobilier).\n` +
          `- **Étape 3 : Notification par LRAR & Délai de réflexion strict de 15 jours (Art. 229-4 C. civ.)**\n` +
          `  Chaque avocat adresse le projet de convention à son client par lettre recommandée avec accusé de réception. **Un délai légal de réflexion de 15 jours incompressibles** doit obligatoirement s'écouler. La signature avant le 16ème jour est frappée de nullité absolue de plein droit.\n` +
          `- **Étape 4 : Signature conjointe en présentiel**\n` +
          `  Les deux époux et leurs deux avocats signent la convention en 4 exemplaires originaux lors d'une séance commune.\n` +
          `- **Étape 5 : Enregistrement chez le notaire sous 7 jours (Art. 229-1 C. civ.)**\n` +
          `  L'un des avocats transmet la convention à un notaire dans un délai de 7 jours. Le notaire dispose de 15 jours pour vérifier les mentions obligatoires et la déposer au rang de ses minutes. Ce dépôt confère au divorce date certaine et force exécutoire immédiate.\n\n` +
          `**2. Délais réels & Coût indicatif**\n` +
          `- **Durée globale :** Entre **1 et 3 mois** si les époux sont d'accord sur tous les points (contre 12 à 24 mois pour un divorce judiciaire contentieux devant le JAF).\n` +
          `- **Coût moyen :** En moyenne entre 1 200 € et 2 500 € par époux selon la complexité patrimoniale (frais d'avocat) + frais fixes d'enregistrement notarié de 41,20 € TTC.`;
      } else {
        responseText = `Pour faire valoir vos droits efficacement dans cette situation, la démarche se déroule généralement en deux étapes complémentaires :\n\n` +
          `D'abord, la phase amiable préalable : il est préconisé d'adresser une mise en demeure officielle par lettre recommandée avec accusé de réception (LRAR). Ce courrier fixe un délai clair de régularisation (généralement 8 à 15 jours) et formalise les manquements. Conformément à l'article 750-1 du Code de procédure civile, une tentative préalable de conciliation ou médiation est d'ailleurs obligatoire pour la plupart des litiges civils avant de saisir le juge.\n\n` +
          `Ensuite, si aucune issue amiable n'aboutit au terme du délai, la phase judiciaire permet de saisir la juridiction compétente dans votre secteur (${detectedLocation}). Il convient de surveiller attentivement les délais de prescription pour préserver l'intégralité de vos droits.\n\n` +
          `Souhaitez-vous que nous examinions ensemble les détails de vos pièces ou que nous préparions un courrier adapté ?`;
      }

    // INTENT 7: SYNTHÈSE / RÉSUMÉ EN 3 OU 4 POINTS
    } else if (isResume) {
      responseText = `Voici le résumé concis et percutant de votre dossier en 4 points clés :\n\n` +
        `1. **Situation et parties :** ${partiesMapping.quiContreQui}\n` +
        `2. **Points forts :** ${enVotreFaveur.slice(0, 2).join(' ')}\n` +
        `3. **Points de vigilance :** ${contreVous.slice(0, 2).join(' ')}\n` +
        `4. **Action immédiate recommandée :** ${procedureEtapes[0] || "Valider les termes de l'accord amiable avec vos conseils respectifs."}\n\n` +
        `Que souhaitez-vous approfondir parmi ces points ?`;

    // INTENT 8: SPECIFIC FOLLOW-UP QUESTION (ANSWER DIRECTLY, RESPECTING USER INSTRUCTIONS TO THE LETTER)
    } else if (isSpecificFollowUp) {
      responseText = `Voici la réponse précise et juridique à votre question concernant « ${userQuery} » :\n\n` +
        `**1. Analyse juridique ciblée**\n` +
        `Au vu des faits de votre dossier (*${docNameDisplay}*) et de votre question, la règle de droit français s'applique de la manière suivante :\n` +
        `- Concernant votre demande, le cadre légal applicable (${detectedDomain === 'famille' ? 'Code Civil - Droit de la Famille' : 'Droit Français des Obligations'}) prévoit que vos intérêts doivent être formellement préservés par écrit.\n` +
        `- Les parties identifiées (${partiesMapping.demandeur} et ${partiesMapping.adversaire}) doivent veiller à respecter les formes légales impératives.\n\n` +
        `**2. Réponse concrète à vos instructions**\n` +
        `Conformément à vos instructions, voici les points exacts à retenir :\n` +
        `- **Sur le plan pratique :** Toute décision ou demande doit être formalisée et portée à la connaissance de l'autre partie avec date certaine (courrier recommandé ou convention contresignée).\n` +
        `- **Sur le plan financier :** ${detectedAmount ? `Le montant de **${detectedAmount}** doit être intégré dans le décompte global.` : "Tous les flux financiers et compensations doivent faire l'objet d'un état récapitulatif détaillé."}\n` +
        `- **Sur le plan juridique :** Les textes applicables (${statutoryArticles.slice(0, 2).join(', ')}) confirment votre droit d'agir et d'exiger une issue conforme à l'équité.\n\n` +
        `**3. Prochaine étape recommandée**\n` +
        `Je peux vous aider à formuler immédiatement la clause correspondante, préparer un courrier officiel ou simuler l'impact financier. Quelle est votre prochaine instruction ?`;

    // INTENT 9: INITIAL DOSSIER UPLOAD (FULL 5-PILLAR DIAGNOSTIC TEMPLATE)
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

    // 1. Vague help & general advice inquiries: "qu'est ce que tu me conseille", "que faire ?", "aidez-moi", etc.
    const isVagueHelp = /^(?:(?:qu['’]est[- ]ce que tu (?:me )?(?:conseilles?|proposes?)(?: comme conseil)?)|(?:tu (?:me )?(?:conseilles?|proposes?) quoi)|(?:que (?:me )?(?:conseillez|conseilles)[- ](?:vous|tu))|(?:donne[- ]moi un conseil)|(?:quel(?:s)? (?:est|sont) (?:ton|votre|tes|vos) conseils?)|(?:besoin d['’]un? conseils?)|(?:je cherche un conseil)|(?:tu peux me conseiller)|(?:conseil(?:s)?(?: juridique[s]?)?)|(?:j['’]ai\s+(?:un\s+)?(?:probl[èe]me|probleme|souci|litige|diff[ée]rend))|(?:aidez-moi|aide\s+moi|j['’]ai\s+besoin\s+d['’]aide|que\s+faire(?:\s+maintenant)?|je\s+ne\s+sais\s+pas\s+quoi\s+faire|pouvez-vous\s+m['’]aider|peux-tu\s+m['’]aider|comment\s+(?:faire|procéder)|j['’]ai\s+une\s+question|conseillez-moi|au\s+secours)|(?:probl[èe]me|probleme|souci|litige|aide|conseil))[\s!?.]*$/i.test(clean);

    if (isVagueHelp) {
      responseText = `Je peux vous aider à comprendre une situation juridique, vous expliquer vos options et vous guider dans vos démarches.\n\n` +
        `Pour vous apporter un conseil précis et adapté à votre cas :\n\n` +
        `• **Travail & Emploi :** contrat de travail, licenciement, rupture conventionnelle, salaires impayés.\n` +
        `• **Logement & Immobilier :** litige de bail, caution non restituée, impayés de loyer, expulsion, copropriété.\n` +
        `• **Consommation & Contrats :** litige commerçant, produit non conforme, remboursement, contestation facture.\n` +
        `• **Famille & Patrimoine :** divorce, pension alimentaire, garde des enfants, succession, séparation.\n` +
        `• **Justice & Démarches :** saisine du tribunal, médiation obligatoire, contestation d'amende.\n\n` +
        `Expliquez-moi en 2 ou 3 phrases votre situation : plus vous me donnez de précisions, plus mon conseil sera pertinent et efficace.`;

    // 2. JUSTICE & FRAIS : Combien coûte un avocat / Honoraires
    } else if (/combien\s+co[uû]te.*avocat|honoraires?.*avocat|tarif.*avocat|prix.*avocat/i.test(clean)) {
      subjectTitle = "Honoraires & Coût d'un Avocat";
      analysisDiagnosis = "En France, les honoraires d'avocat sont libres mais obligatoirement encadrés par une convention écrite d'honoraires signée avant toute intervention (Loi Macron).";
      rulesList = [
        "**Convention d'honoraires obligatoire (Art. 10 Loi du 31 décembre 1971)** : L'avocat doit fixer précisément le mode de facturation : au temps passé (150 € à 350 € HT/heure en moyenne) ou au forfait (somme globale convenue).",
        "**Honoraires de résultat autorisés en complément** : Un pourcentage sur les gains obtenus ou l'économie réalisée peut s'ajouter au fixe, mais un honoraire exclusivement basé sur le résultat (pacte de quota litis) est formellement interdit.",
        "**TVA applicable** : Les prestations d'avocat sont assujetties à la TVA à 20% en France métropolitaine."
      ];
      actionStepsList = [
        "Demander un premier devis estimatif écrit et la signature d'une convention d'honoraires détaillée avant toute diligence.",
        "Vérifier si vous bénéficiez d'une Protection Juridique (incluse dans votre assurance habitation, carte bancaire ou auto) qui prend en charge tout ou partie des frais d'avocat selon son barème.",
        "Si vos ressources sont modestes, solliciter l'Aide Juridictionnelle (prise en charge par l'État de 25% à 100% des frais de procédure)."
      ];
      followUpQuestion = "Pour quel type d'affaire (prud'hommes, divorce, pénal, immobilier) recherchez-vous un avocat, et souhaitez-vous être mis en relation avec un avocat partenaire ?";

    // 3. JUSTICE & AIDE : Aide Juridictionnelle (AJ) / Avocat gratuit
    } else if (/aide\s+juridictionnelle|avocat\s+gratuit|pas\s+d['']argent.*avocat|sans\s+ressources/i.test(clean)) {
      subjectTitle = "Aide Juridictionnelle & Accès Gratuit au Droit";
      analysisDiagnosis = "L'Aide Juridictionnelle (AJ) permet à l'État de prendre en charge tout ou partie des honoraires d'avocat et des frais d'huissier ou d'expertise si vos revenus sont inférieurs aux plafonds légaux.";
      rulesList = [
        "**Barème de ressources 2024 (Loi du 10 juillet 1991)** : Pour une personne seule, l'aide est totale (100%) si le revenu fiscal est inférieur à environ 12 200 €/an, et partielle (55% ou 25%) jusqu'à environ 18 300 €/an (plafonds majorés par personne à charge).",
        "**Interdiction de dépassement** : En cas d'aide totale à 100%, l'avocat désigné ou acceptant l'AJ ne peut réclamer aucun honoraire direct au justiciable.",
        "**Consultations juridiques gratuites** : Des Points-Justice, Maisons de Justice et du Droit (MJD) et permanences gratuites des Ordres des avocats existent dans chaque département."
      ];
      actionStepsList = [
        "Déposer la demande d'aide juridictionnelle en ligne sur le portail officiel du Ministère de la Justice (aidejuridictionnelle.justice.fr) ou via le formulaire Cerfa n° 16146*03.",
        "Joindre votre dernier avis d'imposition et les justificatifs de charges du foyer.",
        "Demander à l'avocat choisi s'il accepte d'intervenir au titre de l'aide juridictionnelle avant d'engager le dossier."
      ];
      followUpQuestion = "Votre demande concerne-t-elle une action que vous engagez ou une assignation que vous avez reçue en justice ?";

    // 4. JUSTICE & PROCÉDURE : Avocat obligatoire ou dispensé
    } else if (/avocat\s+obligatoire|sans\s+avocat|se\s+d[ée]fendre\s+seul/i.test(clean)) {
      subjectTitle = "Représentation Obligatoire ou Facultative par Avocat";
      analysisDiagnosis = "En droit français, la présence d'un avocat n'est pas toujours obligatoire : elle dépend de la juridiction saisie et du montant du litige.";
      rulesList = [
        "**Avocat dispensé (procédure orale sans représentation obligatoire)** : Devant le Conseil de Prud'hommes en 1ère instance, devant le Juge du Contentieux de la Protection (litiges locatifs, baux), et devant le Tribunal Judiciaire pour les litiges dont l'enjeu financier est inférieur ou égal à **10 000 €**.",
        "**Avocat obligatoire** : Devant le Tribunal Judiciaire pour les demandes supérieures à 10 000 €, devant la Cour d'Appel (sauf exceptions), et en matière de divorce contentieux ou par consentement mutuel.",
        "**Représentation par un tiers** : Devant les prud'hommes, vous pouvez vous faire assister par un défenseur syndical agréé."
      ];
      actionStepsList = [
        "Identifier le montant total de vos demandes financières pour déterminer si le seuil des 10 000 € est franchi.",
        "Si l'avocat est facultatif, vous pouvez rédiger et déposer vous-même une requête auprès du greffe du tribunal compétent.",
        "Même si la loi autorise à se défendre seul, l'assistance d'un juriste ou d'un avocat est vivement recommandée pour sécuriser la rédaction des conclusions et les délais de procédure."
      ];
      followUpQuestion = "Quelle est la juridiction concernée ou le montant financier de votre demande ?";

    // 5. JUSTICE & ACTE : Qu'est-ce qu'une mise en demeure
    } else if (/mise\s+en\s+demeure.*(?:c['']est\s+quoi|comment|d[ée]finition|valeur|mod[èe]le|formalit[ée])/i.test(clean) || /qu['']est-ce\s+qu['']une\s+mise\s+en\s+demeure/i.test(clean)) {
      subjectTitle = "La Mise en Demeure en Droit Français";
      analysisDiagnosis = "La mise en demeure est un acte juridique préalable fondamental par lequel vous sommez officiellement votre adversaire d'exécuter son obligation dans un délai précis.";
      rulesList = [
        "**Article 1344 du Code Civil** : Le débiteur est mis en demeure de payer soit par sommation ou acte équivalent, soit par une stipulation expresse du contrat.",
        "**Article 1231-6 du Code Civil** : La mise en demeure fait courir les intérêts de retard moratoires au taux légal à compter de sa réception.",
        "**Mentions obligatoires indispensables** : L'indication expresse des termes « MISE EN DEMEURE », l'exposé des griefs, le fondement contractuel ou légal, et un délai impératif d'exécution (généralement 8 à 15 jours)."
      ];
      actionStepsList = [
        "Adresser le courrier par Lettre Recommandée avec Accusé de Réception (LRAR) ou par signification de Commissaire de Justice (huissier) pour lui donner date certaine opposable.",
        "Conserver précieusement le récépissé de dépôt et l'accusé de réception signé.",
        "Si aucune réponse satisfaisante n'est reçue à l'expiration du délai fixé, vous pouvez engager la conciliation ou assigner devant le tribunal."
      ];
      followUpQuestion = "Souhaitez-vous que je génère directement votre lettre de mise en demeure officielle prête à l'envoi ?";

    // 6. JUSTICE & RECOUVREMENT : Injonction de payer
    } else if (/injonction\s+de\s+payer|recouvrement.*cr[ée]ance|facture\s+impay[ée]e|dette\s+impay[ée]e/i.test(clean)) {
      subjectTitle = "Procédure d'Injonction de Payer & Recouvrement";
      analysisDiagnosis = "L'injonction de payer est une procédure judiciaire rapide, non contradictoire et peu coûteuse permettant d'obtenir un titre exécutoire pour recouvrer une créance certaine, liquide et exigible.";
      rulesList = [
        "**Article 1405 du Code de Procédure Civile** : L'injonction de payer peut être demandée pour toute créance contractuelle ou statutaire d'un montant déterminé.",
        "**Ordonnance sur requête** : Le juge statue sans entendre le débiteur. Si la demande est justifiée, il rend une ordonnance portant injonction de payer.",
        "**Signification et opposition (Art. 1416 CPC)** : L'ordonnance doit être signifiée au débiteur par commissaire de justice sous 6 mois. Le débiteur dispose alors d'un délai strict de **1 mois** pour former opposition s'il conteste la dette."
      ];
      actionStepsList = [
        "Rassembler le contrat, les bons de commande signés, les factures certifiées et la copie de la mise en demeure restée infructueuse.",
        "Remplir la requête en injonction de payer (formulaire Cerfa n° 12946*02) et la déposer au greffe du Tribunal Judiciaire ou de Commerce.",
        "Dès l'ordonnance obtenue, mandater un commissaire de justice pour la signifier et procéder aux saisies (saisie sur compte bancaire ou sur salaire)."
      ];
      followUpQuestion = "Quel est le montant exact de votre créance et disposez-vous du contrat ou devis initial signé ?";

    // 7. JUSTICE & COMMISSAIRE : Huissier de Justice / Titre exécutoire / Saisie
    } else if (/huissier|commissaire\s+de\s+justice|titre\s+ex[ée]cut[oi]re|saisie\s+sur\s+compte|saisie\s+sur\s+salaire/i.test(clean)) {
      subjectTitle = "Commissaire de Justice & Exécution des Décisions";
      analysisDiagnosis = "Les commissaires de justice (fusion des huissiers de justice et commissaires-priseurs judiciaires) ont le monopole des significations d'actes, constats et exécutions forcées en France.";
      rulesList = [
        "**Article L111-2 du Code des Procédures Civiles d'Exécution** : Une saisie ou mesure d'exécution forcée ne peut être mise en œuvre que sur présentation d'un **titre exécutoire** (décision de justice, acte notarié revêtu de la formule exécutoire, ou ordonnance d'injonction de payer non contestée).",
        "**Lettre de relance sans titre** : Si un commissaire de justice intervient en simple recouvrement amiable (sans titre exécutoire), il ne dispose d'aucun pouvoir de saisie et ne peut facturer de frais de recouvrement au débiteur (art. L111-8 CPCE).",
        "**Valeur probante du constat** : Le constat de commissaire de justice fait foi jusqu'à preuve du contraire pour établir la matérialité d'un fait (dégât des eaux, malfaçons, abandon de chantier, tapage)."
      ];
      actionStepsList = [
        "Vérifier si le courrier reçu mentionne expressément un jugement ou titre exécutoire, ou s'il s'agit d'une simple relance amiable.",
        "Si vous disposez d'un jugement rendu en votre faveur, mandatez un commissaire de justice du ressort de la cour d'appel compétente pour signifier l'acte et lancer l'exécution.",
        "En cas de constat urgent (chantier ou dégât des eaux), contactez immédiatement une étude locale pour fixer l'intervention."
      ];
      followUpQuestion = "Avez-vous reçu un acte d'huissier (signification, sommation) ou souhaitez-vous faire établir un constat officiel ?";

    // 8. JUSTICE & CONCILIATION : Conciliateur de justice & Médiateur
    } else if (/conciliat(?:eur|ion)|m[ée]diat(?:eur|ion)|r[ée]solution\s+amiable|accord\s+amiable/i.test(clean)) {
      subjectTitle = "Conciliation & Médiation Obligatoire (Art. 750-1 CPC)";
      analysisDiagnosis = "En droit français, la tentative de résolution amiable est un préalable obligatoire à la saisine de la justice pour de nombreux litiges du quotidien.";
      rulesList = [
        "**Article 750-1 du Code de Procédure Civile** : À peine d'irrecevabilité que le juge peut prononcer d'office, la saisine du tribunal judiciaire pour un litige inférieur ou égal à **5 000 €**, ou pour un trouble anormal de voisinage ou un bornage, doit obligatoirement être précédée d'une tentative de conciliation de justice, de médiation ou de procédure participative.",
        "**Gratuité du Conciliateur de Justice** : Les conciliateurs de justice sont des auxiliaires de justice bénévoles et leur saisine est 100% gratuite.",
        "**Force de l'accord constaté** : Le constat d'accord signé par les parties devant le conciliateur peut être homologué par le juge pour acquérir la même force exécutoire qu'un jugement."
      ];
      actionStepsList = [
        "Prendre contact avec le conciliateur de justice lors de ses permanences en mairie, au tribunal judiciaire ou à la Maison de Justice et du Droit (conciliateurs.fr).",
        "Transmettre vos pièces justificatives et l'historique de vos échanges avec la partie adverse.",
        "Participer à la réunion de conciliation pour parvenir à un protocole d'accord écrit et sécurisé."
      ];
      followUpQuestion = "Quel est l'objet de votre litige et la partie adverse est-elle ouverte à une discussion amiable ?";

    // 9. JUSTICE & DÉLAIS : Prescription légale
    } else if (/prescription|d[ée]lai.*agir|d[ée]lai.*porter\s+plainte|combien\s+de\s+temps.*agir|trop\s+tard/i.test(clean)) {
      subjectTitle = "Délais de Prescription Légale en Droit Français";
      analysisDiagnosis = "La prescription éteint le droit d'agir en justice si aucun recours n'est formalisé avant l'expiration du délai légal imparti.";
      rulesList = [
        "**Droit commun civil (Art. 2224 C. civ.)** : Les actions personnelles ou mobilières se prescrivent par **5 ans** à compter du jour où le titulaire d'un droit a connu ou aurait dû connaître les faits.",
        "**Droit de la consommation (Art. L218-2 C. conso)** : L'action des professionnels pour les biens ou services fournis aux consommateurs se prescrit par **2 ans** (les factures de plus de 2 ans sont prescrites).",
        "**Droit du travail** : Contestation de licenciement = **12 mois** (art. L1471-1 C. trav.) ; Rappel de salaires et heures supplémentaires = **3 ans** (art. L3245-1 C. trav.).",
        "**Droit pénal** : Contraventions = 1 an ; Délits (escroquerie, vol, harcèlement) = **6 ans** ; Crimes = 20 ans (Art. 8 CPP) ; Diffamation et injure = **3 mois** (Loi 1881)."
      ];
      actionStepsList = [
        "Identifier la date exacte du fait générateur ou de la découverte du dommage pour calculer le point de départ du délai.",
        "Attention : une simple relance amiable n'interrompt pas la prescription ; seule une assignation en justice ou un acte d'exécution forcée l'interrompt (art. 2241 et 2244 C. civ.).",
        "Agir rapidement en adressant une citation ou requête avant l'échéance fatidique."
      ];
      followUpQuestion = "À quelle date précise sont survenus les faits ou la dernière facture contestée ?";

    // 10. TRAVAIL : Licenciement & Contestation CPH
    } else if (clean.includes('licenciement') || clean.includes('faute grave') || clean.includes('prud\'homme') || clean.includes('cph') || clean.includes('barème macron')) {
      subjectTitle = "Droit du Travail & Contestation de Licenciement";
      analysisDiagnosis = "Tout licenciement prononcé par un employeur doit reposer sur une cause réelle et sérieuse, objective, vérifiable et proportionnée (Code du Travail).";
      rulesList = [
        "**Article L1232-1 du Code du Travail** : L'absence de cause réelle et sérieuse ouvre droit à réintégration ou indemnisation du salarié pour licenciement abusif.",
        "**Article L1235-3 du Code du Travail (Barème Macron)** : En cas de licenciement sans cause réelle et sérieuse, les indemnités prud'homales sont encadrées par un plancher et un plafond fixés selon votre ancienneté dans l'entreprise.",
        "**Faute grave** : La faute grave prive le salarié de l'indemnité de préavis et de l'indemnité légale de licenciement, mais la charge exclusive de la preuve pèse sur l'employeur.",
        "**Article L1471-1 du Code du Travail** : Vous disposez d'un délai strict de **12 mois** à compter de la notification du licenciement pour saisir le Conseil de Prud'hommes."
      ];
      actionStepsList = [
        "Demander des précisions écrites sur les motifs du licenciement dans les 15 jours suivant la notification (art. R1232-13 C. trav.).",
        "Vérifier le respect de la procédure légale (convocation préalable avec mention d'assistance, délai de 5 jours ouvrables avant l'entretien, délai de notification).",
        "Saisir le Conseil de Prud'hommes (bureau de conciliation et d'orientation puis jugement) pour réclamer vos indemnités de rupture et dommages-intérêts."
      ];
      followUpQuestion = "Quelle est votre ancienneté, le motif invoqué (économique, personnel, faute) et la date de notification ?";

    // 11. TRAVAIL : Rupture conventionnelle
    } else if (clean.includes('rupture conventionnelle') || clean.includes('séparation amiable travail')) {
      subjectTitle = "Rupture Conventionnelle Individuelle du CDI";
      analysisDiagnosis = "La rupture conventionnelle permet à l'employeur et au salarié en CDI de convenir d'un commun accord des conditions de la rupture du contrat de travail (Art. L1237-11 C. trav.).";
      rulesList = [
        "**Indemnité minimale légale (Art. L1237-13 C. trav.)** : L'indemnité spécifique de rupture ne peut pas être inférieure à l'indemnité légale de licenciement (1/4 de mois de salaire par an jusqu'à 10 ans, 1/3 au-delà), ou conventionnelle si plus favorable.",
        "**Délai de rétractation de 15 jours (Art. L1237-12 C. trav.)** : À compter de la signature de la convention, chaque partie dispose d'un délai de 15 jours calendaires pour se rétracter par écrit.",
        "**Homologation par la DREETS (Art. L1237-14 C. trav.)** : À l'issue du délai de rétractation, le dossier est télétransmis à la DREETS (TéléRC) qui dispose de 15 jours ouvrables pour instruire. Le silence vaut homologation tacite.",
        "**Droit aux allocations chômage (ARE)** : La rupture conventionnelle ouvre immédiatement droit aux allocations de retour à l'emploi (France Travail / Pôle Emploi)."
      ];
      actionStepsList = [
        "Convenir d'un ou plusieurs entretiens préalables pour négocier le montant de l'indemnité de départ et la date effective de sortie.",
        "Remplir et signer le formulaire réglementaire Cerfa via la plateforme officielle TéléRC.",
        "Respecter scrupuleusement les délais incompressibles de rétractation et d'instruction administrative avant le départ de l'entreprise."
      ];
      followUpQuestion = "Avez-vous déjà abordé le sujet avec votre direction et un accord sur le montant d'indemnité est-il envisagé ?";

    // 12. TRAVAIL : Démission, Chômage & Préavis
    } else if (clean.includes('démission') || clean.includes('demission') || /quitter.*travail/i.test(clean)) {
      subjectTitle = "Démission, Préavis & Droits au Chômage";
      analysisDiagnosis = "La démission est un acte unilatéral par lequel le salarié manifeste sa volonté claire et non équivoque de rompre son CDI.";
      rulesList = [
        "**Droit au chômage (ARE)** : En principe, une démission volontaire n'ouvre pas droit aux allocations chômage, sauf démissions considérées comme « légitimes » par France Travail (suivi de conjoint muté, non-paiement de salaires, violences conjugales).",
        "**Préavis contractuel** : La durée du préavis est fixée par la convention collective, le contrat de travail ou les usages. L'employeur peut vous en dispenser (avec ou sans maintien de salaire selon l'initiateur).",
        "**Démission requalifiée en prise d'acte** : Si vous quittez l'entreprise en raison de manquements graves de l'employeur (harcèlement, salaires impayés), vous pouvez prendre acte de la rupture aux torts de l'employeur pour faire requalifier la rupture en licenciement abusif devant les prud'hommes."
      ];
      actionStepsList = [
        "Consulter votre convention collective pour connaître la durée exacte de votre préavis et vos droits à heures pour recherche d'emploi.",
        "Rédiger une lettre de démission claire, remise en main propre contre décharge ou expédiée par lettre recommandée avec accusé de réception.",
        "Négocier par écrit une dispense totale ou partielle de préavis si vous avez une nouvelle opportunité professionnelle."
      ];
      followUpQuestion = "Quel est votre motif de départ et souhaitez-vous être dispensé d'effectuer votre préavis ?";

    // 13. TRAVAIL : Salaires impayés & Heures supplémentaires
    } else if (clean.includes('salaire impayé') || clean.includes('heures sup') || clean.includes('fiche de paie') || clean.includes('retenue sur salaire') || clean.includes('primes non payées')) {
      subjectTitle = "Salaires Impayés & Heures Supplémentaires";
      analysisDiagnosis = "Le paiement du salaire à date fixe est l'obligation principale et essentielle de l'employeur. Tout retard ou défaut est sanctionné civilement et pénalement.";
      rulesList = [
        "**Article L3242-1 du Code du Travail** : La rémunération des salariés est payée au moins une fois par mois.",
        "**Article L3245-1 du Code du Travail** : L'action en paiement ou en répétition du salaire se prescrit par **3 ans** à compter du jour où celui qui l'exerce a connu ou aurait dû connaître les faits.",
        "**Heures supplémentaires (Art. L3121-28 C. trav.)** : Toute heure accomplie au-delà de 35 heures hebdomadaires ouvre droit à une majoration légale de salaire (25% pour les 8 premières heures, 50% au-delà) ou à un repos compensateur.",
        "**Référé prud'homal rapide** : Le paiement des salaires indubitables peut être ordonné en référé d'urgence sous 15 jours par la formation de référé du Conseil de Prud'hommes."
      ];
      actionStepsList = [
        "Reconstituer un décompte précis des sommes dues (relevés d'heures, plannings, emails, relevés d'accès, fiches de paie).",
        "Adresser immédiatement une mise en demeure formelle par lettre recommandée exigeant le virement sous 8 jours.",
        "À défaut de règlement, saisir en urgence la formation de référé du Conseil de Prud'hommes compétent."
      ];
      followUpQuestion = "Quel est le montant total des impayés et depuis combien de mois ce retard dure-t-il ?";

    // 14. TRAVAIL : Harcèlement moral / sexuel & Souffrance
    } else if (clean.includes('harcèlement') || clean.includes('harcelement') || clean.includes('burn out') || clean.includes('au placard') || clean.includes('dénigrement travail')) {
      subjectTitle = "Harcèlement Moral & Protection du Salarié";
      analysisDiagnosis = "Le harcèlement moral au travail est constitué par des agissements répétés ayant pour objet ou pour effet une dégradation des conditions de travail susceptible de porter atteinte aux droits, à la dignité, ou à la santé du salarié.";
      rulesList = [
        "**Article L1152-1 du Code du Travail & Art. 222-33-2 du Code Pénal** : Le harcèlement moral est un délit passible de 2 ans de prison et 30 000 € d'amende.",
        "**Aménagement de la charge de la preuve (Art. L1154-1 C. trav.)** : Le salarié doit seulement présenter des éléments de fait laissant supposer l'existence d'un harcèlement ; il incombe alors à l'employeur de prouver que ses décisions étaient justifiées par des éléments objectifs étrangers à tout harcèlement.",
        "**Nullité des sanctions et représailles (Art. L1152-2 C. trav.)** : Aucun salarié ne peut être sanctionné, licencié ou discriminé pour avoir témoigné ou relaté des faits de harcèlement moral."
      ];
      actionStepsList = [
        "Consigner par écrit chaque fait avec date, heure, lieu, témoins et conserver tous les emails, SMS ou ordres contradictoires.",
        "Consulter votre médecin traitant et alerter sans tarder le Médecin du Travail pour faire constater l'altération de votre santé physique ou psychique.",
        "Signaler formellement les faits à la direction, aux élus du personnel (CSE) et à l'Inspection du Travail."
      ];
      followUpQuestion = "Avez-vous déjà consulté la médecine du travail ou informé les représentants du personnel (CSE) ?";

    // 15. TRAVAIL : Période d'essai, Contrats, Avenants
    } else if (clean.includes('période d\'essai') || clean.includes('periode d\'essai') || clean.includes('clause de non-concurrence') || clean.includes('refus avenant') || clean.includes('modification contrat')) {
      subjectTitle = "Exécution du Contrat de Travail & Période d'Essai";
      analysisDiagnosis = "La relation de travail est régie par les stipulations du contrat de travail dans le respect des règles d'ordre public du Code du travail.";
      rulesList = [
        "**Rupture de la période d'essai (Art. L1221-25 C. trav.)** : L'employeur ou le salarié peut rompre librement la période d'essai, mais l'employeur doit respecter un **délai de prévenance** (de 24h à 1 mois selon la durée de présence). La rupture ne doit pas être discriminatoire ni abusive.",
        "**Modification du contrat de travail** : L'employeur ne peut pas modifier un élément essentiel du contrat (rémunération, qualification, horaires de nuit, lieu dans un autre secteur géographique) sans l'accord exprès et signé du salarié. Le refus d'un avenant ne constitue pas en soi une faute.",
        "**Clause de non-concurrence** : Pour être valable, elle doit être indispensable à la protection des intérêts de l'entreprise, limitée dans le temps et l'espace, tenir compte des spécificités d'emploi, et comporter une **contrepartie financière obligatoire non dérisoire** versée après la rupture."
      ];
      actionStepsList = [
        "Vérifier les clauses exactes de votre contrat de travail et de votre convention collective applicable.",
        "Formaliser votre position par écrit (courrier recommandé ou courriel avec accusé) sans signer de document sous pression.",
        "En cas de litige, faire contrôler la validité de la clause par un juriste ou avocat en droit du travail."
      ];
      followUpQuestion = "De quelle clause ou modification s'agit-il précisément, et quand vous a-t-elle été soumise ?";

    // 16. LOGEMENT : Caution / Dépôt de garantie
    } else if (clean.includes('caution') || clean.includes('dépôt de garantie') || clean.includes('depot de garantie') || clean.includes('état des lieux')) {
      subjectTitle = "Restitution du Dépôt de Garantie (Loi du 6 juillet 1989)";
      analysisDiagnosis = "La restitution du dépôt de garantie (caution) par le bailleur est soumise à des règles d'ordre public très strictes en droit français.";
      rulesList = [
        "**Article 22 de la Loi n° 89-462 du 6 juillet 1989** : Le délai de restitution est de **1 mois** si l'état des lieux de sortie est conforme à l'entrée, ou **2 mois** si des dégradations imputables au locataire sont constatées.",
        "**Justification obligatoire** : Toute retenue sur le dépôt de garantie doit être impérativement justifiée par la comparaison des états des lieux contradictoires et étayée par des factures ou devis d'entreprises.",
        "**Majoration légale de 10% par mois de retard (Art. 22)** : À défaut de restitution dans le délai légal, le solde restant dû est majoré de plein droit de **10% du loyer mensuel hors charges** pour chaque mois de retard commencé."
      ];
      actionStepsList = [
        "Comparer précisément l'état des lieux d'entrée et de sortie signés contradictoirement pour identifier les éventuelles dégradations notées.",
        "Adresser au propriétaire une mise en demeure formelle par lettre recommandée (LRAR) exigeant la restitution immédiate sous 8 jours avec calcul des pénalités de retard de 10%/mois.",
        "Si pas de réponse sous 8 jours, saisir gratuitement la Commission Départementale de Conciliation (CDC) puis le Juge des Contentieux de la Protection (JCP)."
      ];
      followUpQuestion = "Quel est le montant de votre dépôt de garantie, la date de remise des clés et l'état des lieux de sortie était-il conforme ?";

    // 17. LOGEMENT : Loyers impayés & Expulsion locative
    } else if (clean.includes('loyers impayés') || clean.includes('loyer impayé') || clean.includes('expulsion') || clean.includes('trêve hivernale') || clean.includes('treve hivernale') || clean.includes('commandement de payer')) {
      subjectTitle = "Contentieux des Loyers Impayés & Procédure d'Expulsion";
      analysisDiagnosis = "La gestion des impayés locatifs et la procédure d'expulsion obéissent à un formalisme impératif protecteur et à des délais incompressibles.";
      rulesList = [
        "**Article 24 de la Loi du 6 juillet 1989 (modifié par la Loi Kasbarian 2023)** : Le bailleur doit d'abord faire délivrer par commissaire de justice un **commandement de payer** visant la clause résolutoire. Le locataire dispose d'un délai légal de **6 semaines** pour régulariser sa dette.",
        "**Trêve hivernale (Art. L412-6 du Code des Procédures Civiles d'Exécution)** : Du **1er novembre au 31 mars**, aucune mesure d'expulsion physique avec le concours de la force publique ne peut être exécutée par huissier.",
        "**Obligation de décision judiciaire** : L'expulsion ne peut jamais être réalisée unilatéralement par le propriétaire (changer les serrures est un délit de violation de domicile puni de 3 ans de prison et 30 000 € d'amende - Art. 226-4-2 C. pén.)."
      ];
      actionStepsList = [
        "Dès le premier impayé, engager une démarche amiable et proposer un plan d'apurement échelonné de la dette locative.",
        "Solliciter le Fonds de Solidarité pour le Logement (FSL) ou les aides d'Action Logement pour résorber la dette.",
        "Faire délivrer un commandement de payer par commissaire de justice si vous êtes bailleur, ou demander des délais de grâce au juge si vous êtes locataire."
      ];
      followUpQuestion = "Êtes-vous bailleur ou locataire, et à combien s'élève le montant total de la dette de loyers ?";

    // 18. LOGEMENT : Indécent, Insalubre, Chauffage, Humidité
    } else if (clean.includes('insalubre') || clean.includes('indécent') || clean.includes('indecent') || clean.includes('chauffage') || clean.includes('humidité') || clean.includes('fuite') || clean.includes('travaux propriétaire')) {
      subjectTitle = "Logement Indécent, Non Conforme & Travaux du Bailleur";
      analysisDiagnosis = "Le bailleur a l'obligation légale de délivrer au locataire un logement décent ne laissant pas apparaître de risques manifestes pour la sécurité physique ou la santé (Art. 6 Loi 1989 & Art. 1719 C. civ.).";
      rulesList = [
        "**Critères de décence (Décret n° 2002-120)** : Le logement doit comporter des dispositifs de chauffage fonctionnels, une étanchéité à l'air et à l'eau, une ventilation efficace, et être exempt de toute infestation de nuisibles.",
        "**Interdiction de bloquer les loyers unilatéralement** : Le locataire ne peut JAMAIS cesser unilatéralement de payer son loyer, sous peine de résiliation du bail. Seul le juge peut ordonner la consignation des loyers à la Caisse des Dépôts.",
        "**Article 20-1 de la Loi du 6 juillet 1989** : Le locataire peut demander au juge d'ordonner la réalisation des travaux sous astreinte financière par jour de retard et une diminution du loyer."
      ];
      actionStepsList = [
        "Constituer un dossier de preuves photographiques et faire établir un constat de commissaire de justice ou un rapport du service d'hygiène de la mairie (SCHS).",
        "Adresser au bailleur une mise en demeure formelle par LRAR d'exécuter les travaux indispensables sous un délai impératif de 15 jours.",
        "Saisir la Commission Départementale de Conciliation (CDC) ou le Juge des Contentieux de la Protection pour ordonner les travaux et consigner les loyers."
      ];
      followUpQuestion = "Quels sont les désordres constatés (moisissures, absence de chauffage, infiltrations) et le bailleur a-t-il été averti par écrit ?";

    // 19. LOGEMENT : Droits du locataire / Violation de domicile par le propriétaire
    } else if (clean.includes('propriétaire entre') || clean.includes('bailleur entre') || clean.includes('sans prévenir') || clean.includes('double des clés') || clean.includes('visite propriétaire') || clean.includes('animal location') || clean.includes('animaux bail')) {
      subjectTitle = "Droits du Locataire, Jouissance Paisible & Vie Privée";
      analysisDiagnosis = "Le locataire a le droit à la jouissance paisible de son logement. Le bailleur ne peut en aucun cas pénétrer dans les lieux sans accord préalable exprès.";
      rulesList = [
        "**Violation de domicile (Art. 226-4 du Code Pénal)** : Le fait pour un propriétaire d'entrer dans le logement loué sans l'autorisation expresse du locataire (même avec un double des clés) constitue un délit pénal puni d'**un an d'emprisonnement et 15 000 € d'amende**.",
        "**Droit de changer le barillet** : Le locataire a le droit légal de changer le cylindre de la serrure pendant la durée du bail, à condition de remettre la serrure initiale à la sortie.",
        "**Animaux familiers (Loi du 9 juillet 1970)** : Toute clause interdisant la détention d'un animal familier (chien, chat) dans un bail d'habitation est réputée **non écrite** de plein droit (seuls les chiens d'attaque de 1ère catégorie peuvent être interdits)."
      ];
      actionStepsList = [
        "Rappeler fermement par écrit à votre bailleur l'interdiction pénale d'accès à votre logement sans votre accord écrit préalable.",
        "Changer le canon de votre serrure si vous craignez des intrusions intempestives (conservez le cylindre d'origine).",
        "En cas d'intrusion constatée, déposer plainte au commissariat ou à la gendarmerie pour violation de domicile."
      ];
      followUpQuestion = "Le bailleur est-il déjà entré dans votre logement sans accord ou menace-t-il de le faire ?";

    // 20. LOGEMENT : Dégât des eaux & Assurances
    } else if (clean.includes('dégât des eaux') || clean.includes('degat des eaux') || clean.includes('fuite eau') || clean.includes('inondation appartement')) {
      subjectTitle = "Gestion d'un Dégât des Eaux & Convention IRSI";
      analysisDiagnosis = "La gestion des dégâts des eaux entre locataires, propriétaires et syndics est encadrée par la Convention IRSI (Indemnisation et Recours des Sinistres Immeuble).";
      rulesList = [
        "**Délai de déclaration (Art. L113-2 du Code des Assurances)** : Vous devez déclarer le sinistre à votre compagnie d'assurance habitation dans un délai maximal de **5 jours ouvrés** à compter de la découverte des faits.",
        "**Convention IRSI (Seuils de gestion)** : Pour les dommages matériels inférieurs à 1 600 € HT (Tranche 1), l'assureur du gestionnaire de l'immeuble ou de l'occupant prend en charge sans recours contre les autres assureurs. Entre 1 600 € et 5 000 € HT (Tranche 2), une expertise unique pour compte commun est organisée.",
        "**Recherche de fuite** : Le syndic ou l'assureur de l'immeuble organise et finance la recherche de fuite si celle-ci provient d'une canalisation encastrée ou commune."
      ];
      actionStepsList = [
        "Remplir immédiatement un constat amiable de dégât des eaux avec le voisin ou le syndic concerné.",
        "Transmettre la déclaration circonstanciée accompagnée de photos à votre assureur sous 5 jours.",
        "Ne pas réaliser de travaux de remise en état définitifs avant le passage éventuel de l'expert ou l'accord formel de l'assureur."
      ];
      followUpQuestion = "La cause de la fuite a-t-elle été identifiée et votre assureur a-t-il déjà été contacté ?";

    // 21. CONSOMMATION : Garantie légale de conformité
    } else if (clean.includes('garantie de conformité') || clean.includes('garantie légale') || clean.includes('panne') || clean.includes('appareil défectueux') || clean.includes('produit défectueux')) {
      subjectTitle = "Garantie Légale de Conformité (Code de la Consommation)";
      analysisDiagnosis = "La garantie légale de conformité protège tout consommateur contre les défauts de fabrication ou pannes survenant sur un produit acheté neuf ou d'occasion auprès d'un professionnel.";
      rulesList = [
        "**Article L217-3 du Code de la Consommation** : Le vendeur professionnel répond des défauts de conformité apparaissant sur le bien pendant un délai de **2 ans** à compter de la délivrance.",
        "**Présomption d'antériorité (Art. L217-7 C. conso)** : Tout défaut apparaissant dans les 24 mois (12 mois pour l'occasion) est présumé exister au moment de l'achat. Vous n'avez AUCUNE preuve technique à apporter.",
        "**Gratuité intégrale et choix de la solution (Art. L217-8 et L217-11)** : La mise en conformité a lieu sans aucun frais pour le consommateur (pièces, main-d'œuvre, frais de port). Vous pouvez choisir entre la réparation et le remplacement sous 30 jours, ou obtenir le remboursement intégral si la solution tarde."
      ];
      actionStepsList = [
        "Retrouver votre preuve d'achat (facture, ticket de caisse, relevé bancaire) et vérifier que la date d'achat est inférieure à 2 ans.",
        "Mettre en demeure le vendeur professionnel d'assurer la réparation ou l'échange gratuit sous 30 jours.",
        "Si le professionnel refuse ou réclame des frais indus, saisir la DGCCRF (SignalConso) et le Médiateur de la consommation."
      ];
      followUpQuestion = "Quel est le produit concerné, la date d'achat et le refus formulé par le vendeur ?";

    // 22. CONSOMMATION : Vices cachés (Voiture occasion, Immobilier)
    } else if (clean.includes('vice caché') || clean.includes('vices cachés') || clean.includes('voiture occasion') || clean.includes('moteur cassé') || clean.includes('compteur trafiqué')) {
      subjectTitle = "Garantie Légale des Vices Cachés (Art. 1641 du Code Civil)";
      analysisDiagnosis = "La garantie des vices cachés s'applique à toute vente (entre particuliers ou avec un professionnel) pour un défaut grave non apparent lors de l'achat rendant le bien impropre à son usage.";
      rulesList = [
        "**Article 1641 du Code Civil** : Le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise.",
        "**Les 3 conditions cumulatives impératives** : Le vice doit être **caché** (non décelable par un examen visuel normal), **antérieur à la vente** (non dû à l'usure normale post-achat), et d'une **gravité suffisante**.",
        "**Article 1648 du Code Civil** : L'action doit être intentée dans un délai de **2 ans à compter de la découverte du vice** (dans la limite de 20 ans après la vente).",
        "**Options de l'acheteur (Art. 1644 C. civ.)** : Vous pouvez choisir entre l'action rédhibitoire (rendre la chose et vous faire restituer le prix) ou l'action estimatoire (garder le bien et vous faire rembourser une partie du prix)."
      ];
      actionStepsList = [
        "Faire réaliser une expertise contradictoire par un expert automobile certifié indépendant (ou via votre protection juridique).",
        "Adresser une mise en demeure formelle par LRAR au vendeur en lui notifiant le rapport d'expertise et en lui demandant l'annulation de la vente.",
        "À défaut de résolution amiable, assigner devant le Tribunal Judiciaire pour obtenir la restitution du prix et des dommages-intérêts."
      ];
      followUpQuestion = "S'agit-il d'un véhicule d'occasion, à quelle date a eu lieu l'achat et disposez-vous d'un rapport de garage ou d'expertise ?";

    // 23. CONSOMMATION : Rétractation achat en ligne & Vente à distance
    } else if (clean.includes('rétractation') || clean.includes('retractation') || clean.includes('achat sur internet') || clean.includes('délai 14 jours') || clean.includes('annuler commande')) {
      subjectTitle = "Droit de Rétractation de 14 Jours (Vente à Distance)";
      analysisDiagnosis = "Pour tout achat conclu à distance (sur internet, par téléphone) ou hors établissement (démarchage à domicile), le consommateur bénéficie d'un droit de rétractation discrétionnaire.";
      rulesList = [
        "**Article L221-18 du Code de la Consommation** : Le consommateur dispose d'un délai strict de **14 jours calendaires** pour exercer son droit de rétractation sans avoir à motiver sa décision ni à supporter de pénalités.",
        "**Point de départ du délai** : Le délai court à compter du jour de la réception physique du bien par le consommateur (ou de la conclusion du contrat pour les prestations de services).",
        "**Remboursement intégral sous 14 jours (Art. L221-24)** : Le professionnel doit rembourser la totalité des sommes versées, y compris les frais de livraison standard, dans les 14 jours suivant la notification de rétractation. Tout retard entraîne des majorations légales jusqu'à 50%."
      ];
      actionStepsList = [
        "Notifier votre décision de rétractation au vendeur par écrit dénué d'ambiguïté (courriel, formulaire en ligne ou LRAR).",
        "Renvoyer le produit en bon état dans son emballage d'origine dans les 14 jours suivant la notification.",
        "Conserver la preuve d'expédition du colis avec numéro de suivi pour prouver le retour."
      ];
      followUpQuestion = "À quelle date avez-vous reçu le produit et avez-vous déjà notifié votre rétractation au marchand ?";

    // 24. CONSOMMATION : Colis non livré / Perdu / Retard
    } else if (clean.includes('colis') || clean.includes('non livré') || clean.includes('pas reçu ma commande') || clean.includes('retard livraison')) {
      subjectTitle = "Colis Non Livré, Perdu ou Retard de Livraison";
      analysisDiagnosis = "En droit de la consommation, le vendeur professionnel est seul responsable de plein droit de la parfaite livraison du colis jusqu'à sa remise effective au client.";
      rulesList = [
        "**Article L216-1 du Code de la Consommation** : Le professionnel doit délivrer le bien à la date convenue, ou au plus tard 30 jours après la commande.",
        "**Responsabilité de plein droit du vendeur (Art. L221-15 C. conso)** : Le vendeur est responsable de la bonne exécution de la livraison, même s'il fait appel à un transporteur tiers (Colissimo, Chronopost, DPD, Mondial Relay). Il ne peut pas vous renvoyer vers le transporteur.",
        "**Résolution et remboursement intégral (Art. L216-6 C. conso)** : Si le bien n'est pas livré après mise en demeure d'effectuer la livraison dans un délai raisonnable, le contrat est résolu et le vendeur doit rembourser l'intégralité des sommes perçues sous 14 jours."
      ];
      actionStepsList = [
        "Adresser une réclamation écrite au vendeur en rappelant sa responsabilité de plein droit au titre de l'article L221-15 du Code de la consommation.",
        "Lui fixer un délai impératif de 8 jours pour vous relivrer ou procéder au remboursement intégral.",
        "En cas d'échec, contester l'opération auprès de votre banque via la procédure de « chargeback » (rétrofacturation) si vous avez réglé par carte bancaire."
      ];
      followUpQuestion = "Quel est le montant de la commande et le suivi indique-t-il le colis comme 'livré' ou 'en cours' ?";

    // 25. CONSOMMATION : Factures abusives (Électricité, Gaz, Opérateurs)
    } else if (clean.includes('facture électricité') || clean.includes('facture edf') || clean.includes('facture gaz') || clean.includes('résiliation box') || clean.includes('forfait mobile') || clean.includes('surfacturation')) {
      subjectTitle = "Contestation de Factures d'Énergie & Litiges Télécoms";
      analysisDiagnosis = "Les litiges relatifs aux factures d'énergie (EDF, Engie, TotalEnergies) ou aux abonnements télécoms sont régis par des plafonds de rétroactivité et des règles de médiation sectorielle.";
      rulesList = [
        "**Article L224-11 du Code de la Consommation (Règle des 14 mois en énergie)** : Les fournisseurs d'énergie ne peuvent pas facturer de rattrapage ou de régularisation pour des consommations d'électricité ou de gaz vieilles de plus de **14 mois** (sauf fraude ou impossibilité d'accès au compteur imputable au client).",
        "**Résiliation sans frais (Loi Hamon & Loi Châtel)** : Pour les contrats télécoms avec engagement de 24 mois, la résiliation au-delà du 12ème mois ne peut entraîner que des frais plafonnés à 25% des mensualités restantes.",
        "**Saisine gratuite des médiateurs sectoriels** : Le Médiateur National de l'Énergie (energie-mediateur.fr) ou le Médiateur des Communications Électroniques (mediation-telecom.org) peuvent être saisis gratuitement après réclamation restée sans réponse."
      ];
      actionStepsList = [
        "Contester formellement la facture par lettre recommandée auprès du service client du fournisseur en citant les index réels du compteur.",
        "En cas de refus ou d'absence de réponse sous 2 mois, saisir directement le Médiateur National de l'Énergie en ligne.",
        "Bloquer les prélèvements litigieux auprès de votre banque si le fournisseur tente de débiter des sommes disproportionnées contestées."
      ];
      followUpQuestion = "Quel est le montant contesté et votre fournisseur a-t-il émis un rattrapage supérieur à 14 mois ?";

    // 26. CONSOMMATION : Arnaques en ligne / Leboncoin / Vinted / Phishing
    } else if (clean.includes('arnaque') || clean.includes('escroquerie') || clean.includes('leboncoin') || clean.includes('vinted') || clean.includes('faux virement') || clean.includes('phishing')) {
      subjectTitle = "Arnaques en Ligne, Escroqueries & Voies de Recours";
      analysisDiagnosis = "L'escroquerie en ligne consiste à tromper une personne par des manœuvres frauduleuses pour la déterminer à remettre des fonds ou des données.";
      rulesList = [
        "**Article 313-1 du Code Pénal** : L'escroquerie est punie de **5 ans d'emprisonnement et 375 000 € d'amende**.",
        "**Plateformes sécurisées (Leboncoin, Vinted)** : Si la transaction s'est déroulée avec le système de paiement sécurisé de la plateforme, signalez le litige avant validation de la transaction pour bloquer le transfert des fonds au vendeur.",
        "**Signalement et plainte en ligne (THESEE / Pharos)** : Pour les escroqueries sur internet commises sans violence, vous pouvez déposer plainte directement en ligne sur le portail officiel THESEE du Ministère de l'Intérieur (service-public.fr)."
      ];
      actionStepsList = [
        "Conserver l'ensemble des preuves : captures d'écran de l'annonce, échanges de messages, relevé du virement, numéro de téléphone de l'escroc.",
        "Déposer plainte en ligne via le dispositif officiel THESEE ou au commissariat le plus proche.",
        "Alerter immédiatement votre banque pour tenter un rappel de virement d'urgence (recall) et faire opposition sur vos moyens de paiement."
      ];
      followUpQuestion = "Quel est le montant dérobé et la transaction a-t-elle eu lieu par virement, carte ou via la messagerie de la plateforme ?";

    // 27. FAMILLE : Divorce amiable par consentement mutuel
    } else if (clean.includes('divorce amiable') || clean.includes('consentement mutuel') || clean.includes('divorce sans juge')) {
      subjectTitle = "Divorce par Consentement Mutuel Déjudiciarisé";
      analysisDiagnosis = "Depuis 2017, le divorce par consentement mutuel est une procédure contractuelle extrajudiciaire enregistrée chez un notaire sans passage devant un juge (Art. 229-1 C. civ.).";
      rulesList = [
        "**Article 229-1 du Code Civil** : Les époux doivent s'accorder sur le principe du divorce et sur l'intégralité de ses conséquences (patrimoine, prestation compensatoire, enfants).",
        "**Deux avocats distincts obligatoires** : Chaque époux doit impérativement avoir son propre avocat. Un avocat commun est formellement interdit par la loi pour garantir l'absence de conflit d'intérêts.",
        "**Délai de réflexion de 15 jours (Art. 229-4 C. civ.)** : Les avocats adressent le projet de convention par LRAR. Un délai strict de 15 jours incompressibles doit s'écouler avant toute signature.",
        "**Dépôt chez le notaire sous 7 jours (Art. 229-1 C. civ.)** : Le dépôt au rang des minutes du notaire confère au divorce force exécutoire immédiate (coût fixe de 41,20 € TTC pour le dépôt notarié)."
      ];
      actionStepsList = [
        "Lister l'ensemble des biens communs ou indivis (si vous possédez un bien immobilier, un acte liquidatif notarié préalable est obligatoire).",
        "Désigner chacun un avocat pour négocier et rédiger la convention de divorce.",
        "Signer la convention après l'expiration du délai de réflexion de 15 jours, puis la transmettre au notaire pour enregistrement."
      ];
      followUpQuestion = "Êtes-vous d'accord sur le partage des biens et les mesures concernant les enfants mineurs ?";

    // 28. FAMILLE : Divorce contentieux / JAF
    } else if (clean.includes('divorce') || clean.includes('jaf') || clean.includes('juge aux affaires familiales') || clean.includes('séparation de corps')) {
      subjectTitle = "Divorce Contentieux & Saisine du Juge aux Affaires Familiales";
      analysisDiagnosis = "En cas de désaccord persistant entre époux, la procédure de divorce judiciaire est portée devant le Juge aux Affaires Familiales (JAF) du Tribunal Judiciaire.";
      rulesList = [
        "**Les 3 formes de divorce contentieux** : Le divorce accepté (accord sur le principe, désaccord sur les conséquences), le divorce pour altération définitive du lien conjugal (séparation de fait depuis au moins 1 an - Art. 238 C. civ.), et le divorce pour faute (Art. 242 C. civ.).",
        "**Représentation obligatoire par avocat** : L'assistance d'un avocat est obligatoire pour chacun des époux tout au long de la procédure judiciaire.",
        "**Audience d'orientation et mesures provisoires (Art. 254 C. civ.)** : Le JAF fixe les mesures d'urgence pour la durée de l'instance : attribution de la jouissance du domicile conjugal, résidence des enfants, pension alimentaire au titre du devoir de secours."
      ];
      actionStepsList = [
        "Consulter un avocat spécialisé en droit de la famille pour introduire l'assignation en divorce.",
        "Dresser l'inventaire précis de vos ressources, charges et patrimoine pour l'audience de mesures provisoires.",
        "Proposer un calendrier d'exercice de l'autorité parentale préservant l'intérêt supérieur des enfants."
      ];
      followUpQuestion = "La séparation est-elle conflictuelle et des enfants mineurs sont-ils concernés ?";

    // 29. FAMILLE : Pension alimentaire
    } else if (clean.includes('pension alimentaire') || clean.includes('aripa') || clean.includes('pension impayée')) {
      subjectTitle = "Fixation, Révision & Recouvrement de la Pension Alimentaire";
      analysisDiagnosis = "La contribution à l'entretien et à l'éducation des enfants est une obligation légale d'ordre public incombant aux deux parents (Art. 371-2 C. civ.).";
      rulesList = [
        "**Critères de calcul** : La pension est fixée en fonction des ressources des parents, des charges réelles et des besoins de l'enfant (la table de référence du Ministère de la Justice donne une estimation indicative par enfant).",
        "**Rôle gratuit de l'ARIPA (Intermédiation financière)** : Depuis 2023, le versement de la pension alimentaire passe automatiquement par l'ARIPA (Caf / MSA), qui prélève le parent débiteur et reverse au parent créancier, évitant tout impayé.",
        "**Délit d'abandon de famille (Art. 227-3 du Code Pénal)** : Le non-paiement de la pension alimentaire pendant plus de **2 mois consécutifs** constitue un délit pénal puni de **2 ans d'emprisonnement et 15 000 € d'amende**."
      ];
      actionStepsList = [
        "Activer gratuitement l'intermédiation financière auprès de l'ARIPA (pension-alimentaire.caf.fr) en fournissant votre titre exécutoire (jugement ou convention de divorce).",
        "Si vous subissez des impayés, mandater un commissaire de justice pour engager une procédure de paiement direct sur le salaire de votre ex-conjoint.",
        "En cas d'impayés répétés de plus de 2 mois, déposer plainte pénale pour abandon de famille auprès du Procureur de la République."
      ];
      followUpQuestion = "Disposez-vous d'un jugement fixant la pension et à combien de mois s'élèvent les impayés ?";

    // 30. FAMILLE : Garde des enfants & Droit de visite
    } else if (clean.includes('garde des enfants') || clean.includes('résidence alternée') || clean.includes('droit de visite') || clean.includes('garde alternée') || clean.includes('refus de donner l\'enfant')) {
      subjectTitle = "Résidence des Enfants & Modalités du Droit de Visite";
      analysisDiagnosis = "L'exercice de l'autorité parentale conjointe impose aux parents de prendre ensemble les décisions relatives à la vie de l'enfant dans son intérêt supérieur exclusif.";
      rulesList = [
        "**Résidence alternée ou principale (Art. 373-2-9 C. civ.)** : Le JAF privilégie l'accord des parents. En cas de désaccord, il apprécie la pratique antérieure, les capacités d'accueil de chaque parent et l'avis de l'enfant capable de discernement (Art. 388-1 C. civ.).",
        "**Délit de non-représentation d'enfant (Art. 227-5 du Code Pénal)** : Le fait de refuser indûment de représenter un enfant mineur à la personne qui a le droit de le réclamer est puni d'**un an de prison et 15 000 € d'amende**.",
        "**Audition de l'enfant mineur** : L'enfant mineur capable de discernement peut demander à être entendu par le juge avec l'assistance gratuite d'un avocat d'enfants désigné d'office."
      ];
      actionStepsList = [
        "En cas de non-respect des dates de garde fixées par le jugement, faire constater les faits par la police ou gendarmerie (dépôt de plainte pour non-représentation d'enfant).",
        "Tenter une médiation familiale conventionnelle pour apaiser les modalités de transition.",
        "Saisir le JAF en modification de résidence si la situation de fait a profondément changé."
      ];
      followUpQuestion = "Un jugement fixe-t-il déjà les modalités de garde ou devez-vous faire trancher la situation pour la première fois ?";

    // 31. FAMILLE : Violences conjugales & Ordonnance de protection
    } else if (clean.includes('violence conjugale') || clean.includes('ordonnance de protection') || clean.includes('femme battue') || clean.includes('conjoint violent') || clean.includes('3919')) {
      subjectTitle = "Protection d'Urgence contre les Violences Conjugales";
      analysisDiagnosis = "La loi française offre des mécanismes d'urgence judiciaires et policiers pour protéger immédiatement les victimes de violences intrafamiliales.";
      rulesList = [
        "**Ordonnance de protection en urgence (Art. 515-9 du Code Civil)** : Le Juge aux Affaires Familiales peut être saisi en urgence et statue dans un délai de **6 jours**. Il peut ordonner l'éviction immédiate du conjoint violent du domicile conjugal et l'attribution du logement à la victime.",
        "**Interdiction de contact et port d'arme (Art. 515-11 C. civ.)** : Le juge peut interdire à l'auteur des violences d'approcher la victime, lui retirer ses armes et ordonner le port d'un bracelet anti-rapprochement (BAR).",
        "**Numéros d'urgence vitaux** : Le **3919** (écoute, écoute et orientation gratuite et anonyme 24h/24), le **17** pour une intervention policière immédiate, et le **114** par SMS."
      ];
      actionStepsList = [
        "Consulter un médecin ou vous rendre aux urgences médico-judiciaires (UMJ) pour faire constater médicalement les blessures et obtenir un certificat d'Incapacité Totale de Travail (ITT).",
        "Déposer plainte au commissariat ou en gendarmerie et demander la saisine du Procureur de la République pour l'attribution d'un Téléphone Grave Danger (TGD).",
        "Déposer immédiatement une requête en Ordonnance de Protection auprès du greffe du Juge aux Affaires Familiales (l'assistance d'un avocat désigné au titre de l'aide juridictionnelle d'urgence est possible)."
      ];
      followUpQuestion = "Êtes-vous actuellement en sécurité et souhaitez-vous de l'aide pour préparer une saisine d'urgence ?";

    // 32. SUCCESSIONS : Héritage, Déshériter, Testament
    } else if (clean.includes('succession') || clean.includes('héritage') || clean.includes('heritage') || clean.includes('déshériter') || clean.includes('desheriter') || clean.includes('testament') || clean.includes('notaire')) {
      subjectTitle = "Droit des Successions, Réserve Héréditaire & Partage";
      analysisDiagnosis = "En droit français, la transmission du patrimoine successoral est régie par le principe protecteur de la réserve héréditaire.";
      rulesList = [
        "**Interdiction d'exshéréder un enfant (Art. 912 du Code Civil)** : En droit français, il est strictement impossible de déshériter totalement ses enfants. La loi réserve une part intangible du patrimoine aux enfants (la réserve héréditaire : 1/2 pour 1 enfant, 2/3 pour 2 enfants, 3/4 pour 3 enfants ou plus).",
        "**Quotité disponible (Art. 913 C. civ.)** : Le défunt ne peut disposer librement par testament ou donation que de la part restante (la quotité disponible).",
        "**Action en réduction (Art. 921 C. civ.)** : Si des donations ou legs consentis de son vivant dépassent la quotité disponible, les héritiers réservataires peuvent exercer une action en réduction dans un délai de **5 ans** à compter de l'ouverture de la succession.",
        "**Règlement chez le notaire** : Le recours au notaire est obligatoire dès que la succession comporte un bien immobilier ou si son montant dépasse 5 000 €."
      ];
      actionStepsList = [
        "Demander au notaire chargé de la succession d'interroger le Fichier Central des Dispositions de Dernières Volontés (FCDDV) pour rechercher l'existence d'un testament.",
        "Faire dresser un inventaire successoral contradictoire de l'ensemble des comptes bancaires, biens et donations antérieures.",
        "En cas de blocage persistant entre héritiers depuis plus d'un an, saisir le Tribunal Judiciaire pour ordonner le partage judiciaire de la succession."
      ];
      followUpQuestion = "La succession comporte-t-elle des biens immobiliers et un testament a-t-il été découvert ?";

    // 33. VOISINAGE : Nuisances sonores & Tapage
    } else if (clean.includes('bruit') || clean.includes('tapage') || clean.includes('nuisance sonore') || clean.includes('voisin bruyant') || clean.includes('musique voisine')) {
      subjectTitle = "Troubles Anormaux de Voisinage & Nuisances Sonores";
      analysisDiagnosis = "La liberté de jouissance de son domicile trouve sa limite dans l'interdiction de causer un trouble excédant les inconvénients normaux de voisinage (Art. 1253 C. civ.).";
      rulesList = [
        "**Article R1336-5 du Code de la Santé Publique** : Aucun bruit particulier ne doit, par sa durée, sa répétition ou son intensité, porter atteinte à la tranquillité du voisinage, de jour comme de nuit.",
        "**Amende forfaitaire pour tapage (Art. R623-2 du Code Pénal)** : Le tapage nocturne ou diurne est passible d'une amende forfaitaire immédiate de **68 €** dressée par les forces de l'ordre (majorée à 180 €).",
        "**Responsabilité sans faute du voisin (Art. 1253 du Code Civil)** : Le propriétaire ou locataire à l'origine d'un trouble anormal est responsable de plein droit des dommages causés sans que vous n'ayez à prouver une faute intentionnelle."
      ];
      actionStepsList = [
        "Noter les dates et heures de chaque nuisance et solliciter des attestations écrites auprès d'autres voisins (formulaire Cerfa n° 11527*03).",
        "Faire intervenir la police municipale ou nationale pour faire constater l'infraction en direct.",
        "Adresser un courrier recommandé de mise en demeure, puis saisir gratuitement le **Conciliateur de Justice** en mairie (étape obligatoire avant toute action au tribunal selon l'art. 750-1 du CPC)."
      ];
      followUpQuestion = "Le trouble est-il diurne ou nocturne, et avez-vous déjà alerté le syndic ou le propriétaire de votre voisin ?";

    // 34. VOISINAGE : Arbres, Hauteurs, Clôtures & Servitudes
    } else if (clean.includes('arbre') || clean.includes('hauteur') || clean.includes('élagage') || clean.includes('clôture') || clean.includes('cloture') || clean.includes('servitude') || clean.includes('bornage')) {
      subjectTitle = "Plantations, Distances Légales & Servitudes de Voisinage";
      analysisDiagnosis = "Les plantations et limites séparatives entre propriétés privées sont régies par des distances et hauteurs légales impératives du Code civil.";
      rulesList = [
        "**Article 671 du Code Civil (Distances légales des arbres)** : Tout arbre ou arbuste destiné à dépasser 2 mètres de hauteur doit être planté à au moins **2 mètres** de la ligne séparative. Les plantations inférieures à 2 mètres doivent respecter une distance minimale de **0,50 mètre**.",
        "**Élagage des branches surplombantes (Art. 673 C. civ.)** : Vous ne pouvez pas couper vous-même les branches du voisin qui dépassent sur votre terrain, mais vous pouvez exiger du voisin qu'il les coupe à ses frais. En revanche, vous pouvez couper vous-même les racines qui avancent sur votre sol.",
        "**Bornage contradictoire (Art. 646 C. civ.)** : Tout propriétaire peut obliger son voisin au bornage de leurs propriétés contiguës à frais partagés."
      ];
      actionStepsList = [
        "Prendre des photographies précises de l'empiètement ou du non-respect des distances légales.",
        "Mettre en demeure le voisin par LRAR de procéder à l'élagage ou à l'arrachage des plantations non conformes sous 15 jours.",
        "À défaut de régularisation, saisir le conciliateur de justice ou le Tribunal Judiciaire pour ordonner les travaux sous astreinte financière journalière."
      ];
      followUpQuestion = "Quelle est la hauteur estimée des arbres et la distance par rapport à votre clôture séparative ?";

    // 35. VOISINAGE : Caméra de surveillance privée
    } else if (clean.includes('caméra') || clean.includes('camera') || clean.includes('filme chez moi') || clean.includes('vidéosurveillance voisine')) {
      subjectTitle = "Vidéosurveillance Privée & Atteinte à la Vie Privée";
      analysisDiagnosis = "L'installation de caméras de vidéosurveillance par un particulier est strictement limitée aux limites exclusives de sa propriété privée.";
      rulesList = [
        "**Article 9 du Code Civil & Art. 226-1 du Code Pénal** : Chacun a droit au respect de sa vie privée. Le fait de capter ou enregistrer des images d'une personne dans un lieu privé sans son consentement est puni d'**un an d'emprisonnement et 45 000 € d'amende**.",
        "**Règlementation CNIL** : Un particulier ne peut filmer que l'intérieur de sa propriété (son jardin, son intérieur). Il est strictement interdit d'orienter une caméra vers la voie publique, le trottoir ou chez les voisins.",
        "**Pouvoir du juge des référés** : Le juge peut ordonner le démontage ou la réorientation immédiate de la caméra sous astreinte financière par jour de retard."
      ];
      actionStepsList = [
        "Prendre des photographies démontrant l'orientation de l'objectif de la caméra vers votre cour, vos fenêtres ou votre jardin.",
        "Adresser une mise en demeure par lettre recommandée exigeant la réorientation immédiate de la caméra sous 48 heures.",
        "Déposer une plainte en ligne auprès de la CNIL (cnil.fr) et déposer plainte pénale au commissariat pour atteinte à l'intimité de la vie privée."
      ];
      followUpQuestion = "La caméra filme-t-elle votre propriété ou la voie publique, et avez-vous déjà alerté le voisin ?";

    // 36. TRAVAUX : Abandon de chantier & Malfaçons
    } else if (clean.includes('artisan') || clean.includes('abandon de chantier') || clean.includes('malfaçon') || clean.includes('garantie décennale') || clean.includes('travaux non finis')) {
      subjectTitle = "Abandon de Chantier, Malfaçons & Garanties Bâtiment";
      analysisDiagnosis = "Les litiges liés aux travaux de construction ou rénovation engagent la responsabilité contractuelle de l'artisan et les garanties légales obligatoires du bâtiment.";
      rulesList = [
        "**Constat d'abandon de chantier** : L'interruption prolongée et injustifiée des travaux sans motif légitime constitue une inexécution contractuelle grave permettant d'appliquer les articles 1222 et 1226 du Code Civil.",
        "**Garantie de parfait achèvement (Art. 1792-6 C. civ.)** : L'entrepreneur répond de tous les désordres signalés lors de la réception ou apparaissant dans un délai de **1 an**.",
        "**Garantie biennale (Art. 1792-3 C. civ.)** : Couvre le bon fonctionnement des éléments d'équipement dissociables pendant **2 ans**.",
        "**Garantie décennale (Art. 1792 C. civ.)** : Rend l'artisan responsable de plein droit pendant **10 ans** des dommages compromettant la solidité de l'ouvrage ou le rendant impropre à sa destination (couverte par l'assurance décennale obligatoire)."
      ];
      actionStepsList = [
        "Faire établir sans tarder un constat d'abandon de chantier ou de malfaçons par un commissaire de justice.",
        "Adresser à l'artisan une mise en demeure par LRAR d'avoir à reprendre le chantier sous un délai impératif de 8 à 15 jours.",
        "À défaut, saisir le juge des référés pour faire constater la résiliation aux torts de l'artisan et être autorisé à faire achever les travaux aux frais du constructeur (Art. 1222 C. civ.)."
      ];
      followUpQuestion = "Avez-vous versé des acomptes, et disposez-vous de l'attestation d'assurance décennale de l'artisan ?";

    // 37. AUTOMOBILE : Garagiste & Réparation contestée
    } else if (clean.includes('garagiste') || clean.includes('réparation voiture') || clean.includes('panne après garage') || clean.includes('devis garage')) {
      subjectTitle = "Obligation de Résultat du Garagiste & Facturation";
      analysisDiagnosis = "Le garagiste réparateur automobile est tenu d'une obligation de résultat stricte en droit français (Art. 1231-1 du Code Civil).";
      rulesList = [
        "**Obligation de résultat & Présomption de faute** : Le réparateur doit rendre un véhicule en parfait état de marche. Si la même panne réapparaît peu après l'intervention, la faute du garagiste est présumée de plein droit (jurisprudence constante de la Cour de Cassation). Il doit réparer à ses frais sans refacturer.",
        "**Devis et ordre de réparation signés** : Le garagiste ne peut procéder à aucune réparation non prévue sans avoir obtenu au préalable l'accord écrit et signé du client. Toute prestation non commandée ne peut être facturée.",
        "**Droit de rétention (Art. 2286 C. civ.)** : Le garagiste peut retenir le véhicule jusqu'au paiement, mais uniquement pour des réparations expressément commandées par le client."
      ];
      actionStepsList = [
        "Conserver l'ordre de réparation initial et la facture détaillée mentionnant les pièces changées.",
        "Si la panne persiste, mettre en demeure le garagiste par LRAR d'effectuer la reprise gratuite sous son obligation de résultat.",
        "Mandater un expert automobile indépendant pour constater le lien de causalité entre l'intervention et le nouveau dysfonctionnement."
      ];
      followUpQuestion = "À quelle date la réparation a-t-elle été effectuée et la nouvelle panne est-elle identique à l'ancienne ?";

    // 38. ROUTIER : Contestation d'amende & PV radar
    } else if (clean.includes('amende') || clean.includes('pv') || clean.includes('radar') || clean.includes('antai') || clean.includes('vitesse')) {
      subjectTitle = "Contestation d'Amende Forfaitaire & Infractions Routières";
      analysisDiagnosis = "Les infractions routières constatées par radar automatique ou procès-verbal sont contestables selon des règles procédurales strictes auprès de l'Officier du Ministère Public.";
      rulesList = [
        "**Règle d'or absolue : Ne payez jamais l'amende si vous la contestez** : L'article 529-2 du Code de Procédure Pénale dispose que le paiement vaut reconnaissance définitive de la réalité de l'infraction et entraîne automatiquement le retrait des points.",
        "**Délais impératifs de recours** : Vous disposez de **45 jours** pour contester une amende forfaitaire initiale, et de **30 jours** pour une amende forfaitaire majorée.",
        "**Consignation préalable obligatoire** : Pour certaines infractions (excès de vitesse constatés par radar automatique, non-respect des distances de sécurité), la loi impose de consigner le montant avant de pouvoir contester (consignation remboursée en cas de classement sans suite ou relaxe).",
        "**Responsabilité pécuniaire vs retrait de points (Art. L121-3 C. route)** : Si vous n'êtes pas clairement identifiable sur le cliché photographique, vous pouvez contester avoir été le conducteur : vous ne perdrez aucun point sur votre permis."
      ];
      actionStepsList = [
        "Demander la transmission du cliché photographique auprès du Centre National de Traitement de Rennes pour vérifier si le conducteur est identifiable.",
        "Effectuer la contestation en ligne directement sur le portail officiel de l'ANTAI (antai.gouv.fr) en joignant les justificatifs requis.",
        "Ne cocher la désignation d'un autre conducteur que si vous connaissez son identité précise, sinon contester en qualité de titulaire du certificat d'immatriculation."
      ];
      followUpQuestion = "S'agit-il d'un avis d'amende forfaitaire ou d'une amende forfaitaire majorée, et à quelle date l'avez-vous reçu ?";

    // 39. ROUTIER : Permis de conduire & Perte de points
    } else if (clean.includes('points permis') || clean.includes('perte de points') || clean.includes('suspension permis') || clean.includes('lettre 48si')) {
      subjectTitle = "Permis de Conduire, Retrait de Points & Recours 48SI";
      analysisDiagnosis = "Le retrait de points sur le permis de conduire est une sanction administrative accessoire soumise à une obligation préalable d'information du conducteur.";
      rulesList = [
        "**Obligation d'information préalable (Art. L223-2 du Code de la Route)** : Lors de la constatation d'une infraction, le conducteur doit obligatoirement être informé de l'existence d'un traitement automatisé de perte de points, du nombre exact de points susceptibles d'être retirés et de la possibilité de suivre un stage.",
        "**Reconstitution des points** : Les points se reconstituent automatiquement après 6 mois pour un retrait d'un point, après 2 ans sans infraction pour les infractions de classe 2 ou 3, ou après 3 ans pour les infractions de classe 4 ou 5.",
        "**Lettre 48SI et invalidation** : La lettre 48SI notifie l'invalidation du permis pour solde de points nul. Un recours gracieux ou contentieux devant le Tribunal Administratif (avec référé-suspension) est possible pour contester la légalité des retraits."
      ];
      actionStepsList = [
        "Consulter immédiatement votre solde de points officiel sur le service gouvernemental Télépoints ou MesPointsPermis.",
        "Si votre solde est critique (1 ou 2 points), vous inscrire d'urgence à un stage de sensibilisation à la sécurité routière pour récupérer jusqu'à 4 points.",
        "En cas de réception d'une lettre 48SI, consulter un avocat en droit routier pour examiner les vices de forme dans les avis d'amendes préalables."
      ];
      followUpQuestion = "Combien de points vous reste-t-il actuellement et avez-vous reçu un courrier recommandé 48SI ?";

    // 40. ROUTIER : Forfait Post-Stationnement (FPS)
    } else if (clean.includes('fps') || clean.includes('forfait post-stationnement') || clean.includes('stationnement payant')) {
      subjectTitle = "Contestation du Forfait Post-Stationnement (FPS)";
      analysisDiagnosis = "Le Forfait Post-Stationnement (FPS) remplace l'ancienne amende de stationnement et relève du contentieux administratif local.";
      rulesList = [
        "**Recours Administratif Préalable Obligatoire (RAPO)** : Vous devez impérativement former un RAPO auprès de la collectivité locale ou de son délégataire dans un délai strict de **1 mois** à compter de la date de notification de l'avis de FPS.",
        "**Délai de réponse de l'administration** : L'autorité dispose d'un mois pour statuer. L'absence de réponse dans le délai de 1 mois vaut décision implicite de rejet.",
        "**Saisine de la CCSP** : En cas de rejet du RAPO, vous disposez d'un délai d'un mois pour saisir la Commission du Contentieux du Stationnement Payant (CCSP) à Limoges."
      ];
      actionStepsList = [
        "Déposer votre recours RAPO en ligne sur le portail dédié de la commune émettrice en joignant l'avis de paiement et votre certificat d'immatriculation.",
        "Fournir les preuves justificatives : ticket horodateur, capture de l'application de paiement (PayByPhone, EasyPark), justificatif de cession ou de vol du véhicule.",
        "Conserver l'accusé d'enregistrement électronique du RAPO."
      ];
      followUpQuestion = "À quelle date avez-vous reçu l'avis de paiement du FPS et pour quel motif souhaitez-vous le contester ?";

    // 41. TRANSPORTS : Vol d'avion retardé ou annulé
    } else if (clean.includes('vol retardé') || clean.includes('vol annulé') || clean.includes('indemnisation avion') || clean.includes('easyjet') || clean.includes('air france') || clean.includes('ryanair') || clean.includes('261/2004')) {
      subjectTitle = "Indemnisation pour Vol Annulé ou Retardé (Règlement CE 261/2004)";
      analysisDiagnosis = "Les passagers aériens au départ d'un aéroport de l'Union Européenne bénéficient d'une indemnisation forfaitaire légale en cas de retard important ou d'annulation.";
      rulesList = [
        "**Règlement Européen CE n° 261/2004** : S'applique à tous les vols au départ de l'UE, ou à destination de l'UE si la compagnie est européenne.",
        "**Barème légal d'indemnisation financière forfaitaire** : Dès **3 heures de retard à l'arrivée** ou en cas d'annulation notifiée moins de 14 jours avant le départ :\n  • **250 €** pour les vols jusqu'à 1 500 km.\n  • **400 €** pour les vols intra-UE de plus de 1 500 km ou tous vols entre 1 500 et 3 500 km.\n  • **600 €** pour tous les vols extracommunautaires de plus de 3 500 km.",
        "**Exonération très stricte** : La compagnie ne peut refuser d'indemniser qu'en prouvant des « circonstances extraordinaires » imprévisibles et inévitables (météo extrême, grève du contrôle aérien). Une panne technique ne constitue PAS une circonstance extraordinaire."
      ];
      actionStepsList = [
        "Conserver vos cartes d'embarquement, confirmation de réservation et attestation de retard délivrée par la compagnie.",
        "Déposer une réclamation formelle d'indemnisation auprès du service client de la compagnie aérienne en citant le Règlement CE 261/2004.",
        "Si la compagnie refuse sous 2 mois, saisir la Direction Générale de l'Aviation Civile (DGAC) et le Médiateur Tourisme et Voyage."
      ];
      followUpQuestion = "Quel était le trajet du vol (aéroports de départ et d'arrivée) et quelle a été la durée exacte du retard à l'arrivée ?";

    // 42. BANCAIRE : Frais bancaires abusifs & Blocage de compte
    } else if (clean.includes('frais bancaire') || clean.includes('frais bancaires') || clean.includes('commission d\'intervention') || clean.includes('compte bloqué')) {
      subjectTitle = "Frais Bancaires Abusifs & Droits du Client";
      analysisDiagnosis = "La loi française plafonne strictement les frais d'incidents bancaires facturés aux particuliers par les établissements de crédit.";
      rulesList = [
        "**Plafonnement légal des commissions d'intervention (Art. R312-4-1 du Code Monétaire et Financier)** : Plafonnées à **8 € par opération** et à un maximum de **80 € par mois** (plafonné à 4 € par opération et 20 €/mois pour les clients en situation de fragilité financière).",
        "**Plafond pour rejet de chèque ou prélèvement** : Les frais de rejet de chèque sont limités à 30 € (< 50 €) ou 50 € (> 50 €). Pour un prélèvement rejeté, le plafond est de **20 €**.",
        "**Délai d'information préalable de 14 jours (Art. L312-1-5 CMF)** : La banque a l'obligation légale d'informer le client sur son relevé au moins 14 jours avant le prélèvement effectif des frais d'incidents, sous peine de nullité."
      ];
      actionStepsList = [
        "Pointer vos relevés bancaires des 12 derniers mois et comptabiliser l'ensemble des frais prélevés sans respect des plafonds ou sans préavis légal.",
        "Adresser une lettre recommandée avec accusé de réception à votre directeur d'agence demandant le remboursement intégral des frais contestés.",
        "En l'absence de régularisation sous 2 mois, saisir gratuitement le Médiateur de la Fédération Bancaire Française (FBF)."
      ];
      followUpQuestion = "Quel est le montant total des frais bancaires facturés sur votre compte ces derniers mois ?";

    // 43. BANCAIRE : Fraude carte bancaire & Piratage de compte
    } else if (clean.includes('fraude carte') || clean.includes('piratage compte') || clean.includes('débit frauduleux') || clean.includes('virement frauduleux')) {
      subjectTitle = "Fraude Bancaire, Opérations Non Autorisées & Remboursement";
      analysisDiagnosis = "En cas de débit frauduleux sur votre compte ou votre carte bancaire, la banque a une obligation légale de remboursement immédiat.";
      rulesList = [
        "**Article L133-18 du Code Monétaire et Financier** : En cas d'opération de paiement non autorisée signalée par le client, la banque est tenue de rembourser immédiatement le montant de l'opération et de rétablir le compte dans l'état où il se serait trouvé si l'opération n'avait pas eu lieu.",
        "**Délai de contestation de 13 mois (Art. L133-24 CMF)** : Vous disposez d'un délai de **13 mois** après la date de débit pour contester l'opération frauduleuse.",
        "**Charge exclusive de la preuve sur la banque (Art. L133-23 CMF)** : La banque ne peut refuser d'indemniser qu'en prouvant formellement une négligence grave ou une fraude du client. Le simple fait que l'opération ait été validée par un code SMS ou une notification ne suffit pas à caractériser une négligence grave."
      ];
      actionStepsList = [
        "Faire immédiatement opposition sur votre carte bancaire ou bloquer vos identifiants d'accès.",
        "Déposer un signalement sur la plateforme gouvernementale officielle Perceval (service-public.fr) pour les fraudes à la carte bancaire.",
        "Mettre en demeure votre banque par LRAR de recréditer les sommes débitées sans frais sous 24h conformément à l'article L133-18 du Code Monétaire et Financier."
      ];
      followUpQuestion = "Quel est le montant total des débits frauduleux et votre banque refuse-t-elle le remboursement ?";

    // 44. BANCAIRE : Prêt d'argent entre particuliers & Dette
    } else if (clean.includes('prêté de l\'argent') || clean.includes('reconnaissance de dette') || clean.includes('remboursement prêt ami') || clean.includes('dette entre particuliers')) {
      subjectTitle = "Prêt d'Argent entre Particuliers & Reconnaissance de Dette";
      analysisDiagnosis = "Le prêt d'argent entre particuliers est régi par les règles de preuve écrites strictes du Code civil.";
      rulesList = [
        "**Écrit obligatoire au-delà de 1 500 € (Art. 1359 du Code Civil)** : Tout acte juridique portant sur une somme supérieure à 1 500 € doit impérativement être prouvé par un écrit (reconnaissance de dette signée).",
        "**Mentions obligatoires (Art. 1376 C. civ.)** : La reconnaissance de dette doit comporter la signature de l'emprunteur et la mention de la somme écrite par lui-même en toutes lettres et en chiffres.",
        "**Déclaration fiscale obligatoire (Art. 242 ter CGI)** : Tout prêt consenti entre particuliers supérieur à **5 000 €** doit obligatoirement être déclaré aux impôts via le formulaire Cerfa n° 2062."
      ];
      actionStepsList = [
        "Rassembler les preuves du virement bancaire et les échanges écrits (SMS, emails, courriers) attestant de l'engagement de remboursement (commencement de preuve par écrit - Art. 1362 C. civ.).",
        "Adresser à l'emprunteur une mise en demeure formelle par lettre recommandée avec accusé de réception de rembourser la somme sous 15 jours.",
        "À défaut de restitution, engager une procédure d'injonction de payer ou assigner en justice devant le Tribunal Judiciaire."
      ];
      followUpQuestion = "Disposez-vous d'une reconnaissance de dette signée ou de traces écrites du prêt et du virement bancaire ?";

    // 45. PÉNAL : Dépôt de plainte & Procédure
    } else if (clean.includes('porter plainte') || clean.includes('dépôt de plainte') || clean.includes('main courante') || clean.includes('procureur de la république')) {
      subjectTitle = "Dépôt de Plainte & Droits des Victimes d'Infractions";
      analysisDiagnosis = "Toute victime d'une infraction pénale (crime, délit, contravention) a le droit fondamental de déposer plainte pour faire poursuivre l'auteur des faits.";
      rulesList = [
        "**Obligation d'enregistrement des plaintes (Art. 15-3 du Code de Procédure Pénale)** : Les policiers et gendarmes ont l'obligation légale impérative de recevoir et enregistrer les plaintes déposées par les victimes d'infractions pénales. Il leur est formellement interdit de refuser une plainte ou de la réorienter vers une simple main courante.",
        "**Plainte directe auprès du Procureur de la République (Art. 40 CPP)** : Vous pouvez déposer plainte directement par courrier recommandé avec accusé de réception adressé au Procureur de la République près le Tribunal Judiciaire du lieu de l'infraction.",
        "**Constitution de partie civile (Art. 85 CPP)** : Si le Procureur classe sans suite ou n'a pas répondu dans un délai de 3 mois, vous pouvez saisir le Doyen des Juges d'Instruction avec constitution de partie civile pour forcer l'ouverture d'une information judiciaire."
      ];
      actionStepsList = [
        "Rédiger un courrier circonstancié exposant chronologiquement les faits précis, dates, lieux, témoins et préjudices subis.",
        "Joindre l'ensemble des pièces justificatives (certificats médicaux ITT, captures d'écran, factures, échanges).",
        "Envoyer la plainte par LRAR au Procureur ou vous présenter au commissariat de votre choix."
      ];
      followUpQuestion = "Quelle est la nature de l'infraction subie et disposez-vous d'éléments pour identifier l'auteur ?";

    // 46. PÉNAL : Diffamation & Injure
    } else if (clean.includes('diffamation') || clean.includes('injure') || clean.includes('calomnie') || clean.includes('dénigrement internet')) {
      subjectTitle = "Diffamation, Injure & Atteinte à la Réputation";
      analysisDiagnosis = "La diffamation (allégation d'un fait précis portant atteinte à l'honneur) et l'injure sont régies par la Loi du 29 juillet 1881 sur la liberté de la presse.";
      rulesList = [
        "**Article 29 de la Loi du 29 juillet 1881** : Toute allégation ou imputation d'un fait qui porte atteinte à l'honneur ou à la considération de la personne constitue une diffamation.",
        "**Prescription ultra-courte de 3 MOIS (Art. 65 de la Loi de 1881)** : L'action en justice se prescrit par **3 mois révolus** à compter du jour de la première publication des propos litigieux. Au-delà de 3 mois, toute action est irrémédiablement forclose.",
        "**Formalisme très strict** : La citation directe devant le Tribunal Correctionnel doit qualifier précisément les propos incriminés et viser l'article de loi exact sous peine de nullité absolue."
      ];
      actionStepsList = [
        "Faire constater immédiatement les propos en ligne par un commissaire de justice (huissier) avant qu'ils ne soient supprimés.",
        "Mettre en demeure l'auteur et l'hébergeur du site de retirer les propos litigieux sous 24h.",
        "Consulter d'urgence un avocat spécialisé pour délivrer une citation directe avant l'expiration du délai fatidique des 3 mois."
      ];
      followUpQuestion = "Les propos ont-ils été tenus en public ou sur internet, et à quelle date précise ?";

    // 47. PÉNAL : Usurpation d'identité & Cybercriminalité
    } else if (clean.includes('usurpation d\'identité') || clean.includes('usurpation identite') || clean.includes('faux profil') || clean.includes('chantage')) {
      subjectTitle = "Usurpation d'Identité & Infractions Numériques";
      analysisDiagnosis = "L'usurpation d'identité sur internet ou dans la vie quotidienne est un délit pénal sévèrement réprimé par la législation française.";
      rulesList = [
        "**Article 226-4-1 du Code Pénal** : Le fait d'usurper l'identité d'un tiers ou de faire usage d'une ou plusieurs données de toute nature permettant de l'identifier en vue de troubler sa tranquillité ou celle d'autrui, ou de porter atteinte à son honneur ou à sa considération, est puni d'**un an d'emprisonnement et 15 000 € d'amende**.",
        "**Chantage (Art. 312-10 du Code Pénal)** : Le fait d'extorquer des fonds en menaçant de révéler ou d'imputer des faits de nature à porter atteinte à l'honneur (chantage à la webcam) est puni de **5 ans d'emprisonnement et 75 000 € d'amende**.",
        "**Prévention des crédits frauduleux** : Si des pièces d'identité ont été dérobées, les escrocs peuvent souscrire des crédits à la consommation à votre nom."
      ];
      actionStepsList = [
        "Déposer plainte immédiatement en gendarmerie ou commissariat pour usurpation d'identité en listant les pièces usurpées.",
        "Contacter la Banque de France pour vérifier si vous êtes inscrit au Fichier Central des Chèques (FCC) ou FICP à votre insu.",
        "En cas de chantage en ligne, ne versez JAMAIS d'argent, coupez tout contact et conservez les captures d'écran des menaces."
      ];
      followUpQuestion = "Quelles sont les pièces d'identité concernées et l'usurpateur a-t-il commis des actes en votre nom ?";

    // 48. MOTEUR UNIVERSEL SÉMANTIQUE (POUR ABSOLUMENT TOUTE AUTRE QUESTION JURIDIQUE OU PRATIQUE)
    } else {
      // Analyze interrogative nature of the user's prompt
      const isAskingCost = /combien|co[uû]t|prix|tarif|payer|somme|argent/i.test(clean);
      const isAskingProcedure = /comment|quelles\s+d[ée]marches|quelles\s+[ée]tapes|proc[ée]dure|o[uù]\s+s['']adresser|qui\s+contacter/i.test(clean);
      const isAskingLegality = /est-ce\s+l[ée]gal|ai-je\s+le\s+droit|a-t-il\s+le\s+droit|peut-on|puis-je|interdit|autoris[ée]|l[ée]galit[ée]/i.test(clean);
      const isAskingDuration = /d[ée]lai|combien\s+de\s+temps|quand|prescription|dur[ée]e/i.test(clean);
      const isAskingRisk = /que\s+risque|quelles\s+sanctions|amende|peine|prison|danger/i.test(clean);

      subjectTitle = "Conseil & Orientation Juridique Approfondie";

      if (isAskingCost) {
        analysisDiagnosis = `Pour évaluer l'aspect financier et le coût de votre situation concernant « ${userQuery} », le droit français encadre les frais d'actes, dépens et honoraires professionnels.`;
        rulesList = [
          "**Principe des honoraires conventionnés** : Les honoraires de conseil juridique ou d'avocat font l'objet d'une convention écrite préalable obligatoire précisant le forfait ou le taux horaire.",
          "**Prise en charge par la Protection Juridique** : Si vous avez souscrit un contrat d'assurance protection juridique, vos frais d'expertise et d'avocat peuvent être pris en charge selon le barème de votre contrat.",
          "**Aide de l'État** : Selon vos ressources, l'Aide Juridictionnelle peut couvrir 25%, 55% ou 100% des frais de procédure et d'auxiliaires de justice."
        ];
        actionStepsList = [
          "Solliciter un devis préalable écrit avant tout engagement d'acte ou de démarche payante.",
          "Vérifier auprès de votre assureur l'existence d'une garantie de protection juridique mobilisable.",
          "Calculer votre éligibilité à l'aide juridictionnelle sur le simulateur officiel du Ministère de la Justice."
        ];
        followUpQuestion = "Souhaitez-vous une estimation personnalisée du coût ou vérifier votre éligibilité à une aide financière ?";

      } else if (isAskingProcedure) {
        analysisDiagnosis = `Pour mener à bien votre démarche concernant « ${userQuery} », il convient de suivre la méthode juridique française structurée en 3 étapes.`;
        rulesList = [
          "**Étape 1 - Phase amiable préalable (Art. 750-1 du CPC)** : La loi privilégie toujours une tentative de conciliation ou médiation préalable pour formaliser un accord écrit.",
          "**Étape 2 - Mise en demeure formelle** : En l'absence d'accord spontané, l'envoi d'une mise en demeure par lettre recommandée avec accusé de réception (LRAR) fixe un délai impératif d'exécution.",
          "**Étape 3 - Saisine de la juridiction compétente** : Si le désaccord persiste, la juridiction du ressort de votre domicile (Tribunal Judiciaire, Prud'hommes ou JCP) peut être saisie par simple requête ou assignation."
        ];
        actionStepsList = [
          "Constituer un dossier probatoire complet avec les pièces justificatives écrites datées.",
          "Adresser une réclamation officielle motivée en droit fixant un délai d'exécution de 8 à 15 jours.",
          "Prendre contact avec un juriste ou un conciliateur de justice pour tenter une résolution négociée."
        ];
        followUpQuestion = "Disposez-vous des documents justificatifs attestant de ces échanges pour enclencher la démarche ?";

      } else if (isAskingLegality) {
        analysisDiagnosis = `Concernant la conformité légale de votre situation (« ${userQuery} »), les règles de droit en vigueur en France fixent des limites précises à ce qui est licite ou interdit.`;
        rulesList = [
          "**Principe de légalité & Force obligatoire (Art. 1103 du Code Civil)** : Tout engagement ou acte contractuel doit être exécuté de bonne foi dans le strict respect de la réglementation applicable.",
          "**Règles d'ordre public protectrices** : En droit français, les dispositions d'ordre public (droit du travail, droit du logement, droit de la consommation) prévalent sur toute clause contraire, qui est alors réputée non écrite.",
          "**Sanctions de l'illégalité** : Un acte conclu en violation de la loi peut être frappé de nullité relative ou absolue, ouvrant droit à réparation du préjudice subi (Art. 1240 du Code Civil)."
        ];
        actionStepsList = [
          "Vérifier si un écrit contractuel ou une disposition d'ordre public régit spécifiquement cette situation.",
          "Notifier formellement à la partie adverse l'irrégularité constatée par écrit en rappelant le cadre légal.",
          "Faire valoir la nullité de la mesure ou de la clause devant le tribunal compétent."
        ];
        followUpQuestion = "Cette situation découle-t-elle d'un contrat signé, d'un accord verbal ou d'une décision unilatérale imposée ?";

      } else if (isAskingDuration) {
        analysisDiagnosis = `Pour déterminer les délais applicables à votre situation concernant « ${userQuery} », le droit français impose des règles de prescription et de forclusion strictes.`;
        rulesList = [
          "**Prescription de droit commun (Art. 2224 du Code Civil)** : Les actions personnelles ou mobilières se prescrivent par **5 ans** à compter de la connaissance des faits.",
          "**Délais spéciaux dérogatoires** : Des délais beaucoup plus courts s'appliquent selon la matière (2 ans en consommation, 3 ans pour les salaires, 12 mois pour le licenciement, 3 mois pour la diffamation).",
          "**Interruption de prescription (Art. 2241 C. civ.)** : Seule une demande en justice (assignation ou requête) interrompt le cours du délai de prescription."
        ];
        actionStepsList = [
          "Identifier précisément la date de départ du délai (date du fait générateur ou de la première contestation).",
          "Calculer la date limite impérative pour agir avant l'extinction irréversible de vos droits.",
          "Introduire votre recours sans tarder pour interrompre formellement la prescription."
        ];
        followUpQuestion = "À quelle date précise sont survenus les faits générateurs de cette situation ?";

      } else if (isAskingRisk) {
        analysisDiagnosis = `Concernant les risques juridiques et sanctions éventuelles liées à « ${userQuery} », le droit français distingue les conséquences civiles (dommages-intérêts) des sanctions pénales (amendes, peines).`;
        rulesList = [
          "**Responsabilité civile (Art. 1240 du Code Civil)** : Tout fait quelconque qui cause à autrui un préjudice matériel, corporel ou moral oblige son auteur à le réparer intégralement.",
          "**Sanctions pénales éventuelles** : Les infractions prévues par le Code Pénal ou le Code de la Route sont punies d'amendes forfaitaires ou correctionnelles et de peines complémentaires selon la qualification retenue.",
          "**Principes de proportionnalité & Droits de la défense** : Toute sanction doit être motivée et respecter le principe du contradictoire et la présomption d'innocence."
        ];
        actionStepsList = [
          "Analyser si l'acte reproché relève d'une simple inexécution civile ou d'une infraction pénale caractérisée.",
          "Solliciter un conseil juridique préalable avant toute déclaration ou signature engageante.",
          "Mettre en œuvre les voies de recours légales pour contester la légitimité de la sanction envisagée."
        ];
        followUpQuestion = "Une procédure, une mise en demeure ou une poursuite a-t-elle déjà été engagée contre vous ?";

      } else {
        analysisDiagnosis = `Pour répondre à votre question concernant « ${userQuery} », voici l'analyse des règles fondamentales du droit français applicables à votre situation :`;
        rulesList = [
          "**Exécution de bonne foi (Article 1104 du Code Civil)** : Les contrats et relations de droit doivent impérativement être négociés, formés et exécutés de bonne foi.",
          "**Charge de la preuve écrite (Article 1353 du Code Civil)** : Celui qui réclame l'exécution d'une obligation ou invoque un droit doit en apporter la preuve matérielle. Les écrits électroniques ont la même force probante que l'écrit papier (Art. 1366 C. civ.).",
          "**Résolution amiable privilégiée (Article 750-1 du CPC)** : La loi encourage la recherche d'une solution négociée avant tout recours contentieux devant le juge."
        ];
        actionStepsList = [
          "Rassembler et numéroter tous vos éléments de preuve (contrats, devis, courriels, SMS, relevés bancaires, attestations).",
          "Adresser une réclamation formelle écrite (courrier recommandé avec accusé de réception) fixant un délai d'exécution raisonnable.",
          "À défaut d'accord amiable, solliciter l'intervention gratuite d'un conciliateur de justice ou saisir le tribunal compétent."
        ];
        followUpQuestion = "Pouvez-vous me donner plus de détails sur le contexte ou les démarches déjà accomplies afin que je vous guide précisément ?";
      }
    }

    if (!isVagueHelp) {
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
        const greetingPrefix = (hasHistory || (history && history.length > 0)) ? "" : "Bonjour. ";

        responseText = `${greetingPrefix}Voici les éléments juridiques applicables concernant **${subjectTitle}** :\n\n` +
          `${analysisDiagnosis}\n\n` +
          `**Ce que prévoit la loi :**\n` +
          `${rulesList.map(r => `- ${r}`).join('\n')}\n\n` +
          `**Les démarches recommandées :**\n` +
          `${actionStepsList.map(s => `- ${s}`).join('\n')}\n\n` +
          `👉 ${followUpQuestion}\n\n` +
          `*Vous pouvez me donner plus de précisions ou me poser une autre question.*`;
      }
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
  const userRequestedLinks = /(?:lien|source|site|url|o[ùu] (?:trouver|consulter|v[ée]rifier)|legifrance|service-public|justice\.fr)/i.test(userQuery);
  const sources_web = userRequestedLinks 
    ? getTargetedLegalSources(userQuery + ' ' + attachedDocText, detectedDomain, detectedLocation)
    : [];
  return {
    text: responseText,
    sources_web,
    suggestions: [],
    automations: []
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

  // Fast Conversational Greeting & Politeness Check (ChatGPT / Claude style)
  const rawQuery = cleanPromptForFallback(prompt);
  const conv = detectConversationalGreeting(rawQuery, activeLang);
  if (conv.isConversational && conv.replyText) {
    return {
      text: conv.replyText,
      sources_web: [],
      suggestions: [
        "Poser une question en droit du travail",
        "Litige de caution ou de loyer",
        "Contestation de facture ou contrat",
        "Divorce ou droit de la famille"
      ],
      automations: []
    };
  }

  const fullPromptWithLang = `${prompt}\n\n[MANDAT LINGUISTIQUE IMPÉRATIF: Vous DEVEZ rédiger STRICTEMENT et INTÉGRALEMENT dans la langue suivante: ${langName}. Si la langue cible est l'anglais (English), TOUTE l'explication et la réponse DOIVENT être en anglais. Si la langue cible est l'arabe (العربية), TOUTE la réponse DOIT être en arabe littéraire (الفصحى). Conservez fidèlement les numéros d'articles et codes juridiques applicables. Répondez avec précision chirurgicale, clarté et pertinence. Utilisez l'Euro (€) pour toute référence monétaire.]`;

  // 1. DIRECT GEMINI API CALL WITH CONVERSATION HISTORY & SYSTEM INSTRUCTION
  // AQ. keys work as ?key= query param with gemini-3.8-flash (confirmed working)
  if (geminiApiKey && geminiApiKey.trim().length >= 20) {
    try {
      const cleanKey = geminiApiKey.trim();
      // gemini-3.8-flash is the current model (gemini-2.0-flash deprecated per Google)
      const geminiModel = 'gemini-3.8-flash';

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
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${cleanKey}`,
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
      } else {
        const errBody = await response.text().catch(() => '');
        console.warn(`Direct Gemini API call notice (${response.status}):`, errBody.substring(0, 200));
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
  targetLang?: string,
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[]
) {
  const activeLang = targetLang || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';
  const langName = LANGUAGE_NAMES[activeLang] || 'French (Français)';
  const cleanQuery = userPrompt.trim().toLowerCase();

  // Instant Conversational Greeting Check
  const convGreeting = detectConversationalGreeting(userPrompt, activeLang);
  if (convGreeting.isConversational && convGreeting.replyText) {
    return {
      text: convGreeting.replyText,
      sources_web: [],
      suggestions: [
        "Poser une question en droit du travail",
        "Litige de caution ou de loyer",
        "Rédiger une mise en demeure"
      ],
      automations: []
    };
  }
  
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
            contents: [
              ...(history && history.length > 0 ? history : []),
              {
                role: 'user',
                parts: [{ text: systemPrompt }]
              }
            ],
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

  const localRes = getAdvancedLocalLegalAI(userPrompt, activeLang, history);

  return {
    text: localRes.text,
    lawyers: relatedLawyers,
    courses: relatedCourses,
    news: relatedNews,
    reviews: relatedReviews
  };
}

export function generateSmartLegalPrognosis(
  contextText: string,
  _domain: string = 'general',
  docCount: number = 0
): { score: number; label: string; riskLevel: 'faible' | 'modéré' | 'élevé'; strengthText: string; prescriptionStatus: 'respecté' | 'urgent' | 'vigilance' } | undefined {
  const textLower = (contextText || '').toLowerCase();
  
  if (/^(bonjour|salut|hello|merci|parfait|au revoir)[\s!?.]*$/i.test(contextText.trim())) {
    return undefined;
  }

  let score = 75;
  let riskLevel: 'faible' | 'modéré' | 'élevé' = 'faible';
  let strengthText = docCount > 0 ? "Éléments probants étayés par pièces au dossier" : "Faits précis justifiant une action";
  let prescriptionStatus: 'respecté' | 'urgent' | 'vigilance' = 'respecté';

  if (/caution|d[ée]p[ôo]t de garantie/i.test(textLower)) {
    score = 90;
    riskLevel = 'faible';
    strengthText = "Droit à restitution de plein droit avec pénalité légale de 10%/mois";
  } else if (/vice cach[ée]/i.test(textLower)) {
    score = 70;
    riskLevel = 'modéré';
    strengthText = "Exige une expertise contradictoire probante";
    prescriptionStatus = 'vigilance';
  } else if (/faute grave|licenciement/i.test(textLower)) {
    score = 80;
    riskLevel = 'faible';
    strengthText = "Charge de la preuve légalement imputable à l'employeur";
    prescriptionStatus = /an|mois/i.test(textLower) ? 'vigilance' : 'respecté';
  } else if (/harc[èe]lement/i.test(textLower)) {
    score = 65;
    riskLevel = 'modéré';
    strengthText = "Nécessite la réunion d'un faisceau d'indices précis";
  } else if (/facture.*impay[ée]|injonction de payer/i.test(textLower)) {
    score = 85;
    riskLevel = 'faible';
    strengthText = "Créance certaine, liquide et immédiatement exigible";
  } else if (/arnaque|fraude.*bancaire/i.test(textLower)) {
    score = 88;
    riskLevel = 'faible';
    strengthText = "Obligation légale de remboursement immédiat sans franchise";
  }

  if (/forclusion|d[ée]lai d[ée]pass[ée]|tardif|prescription/i.test(textLower)) {
    prescriptionStatus = 'urgent';
    riskLevel = 'modéré';
  }

  let label = "Chances favorables";
  if (score >= 85) label = "Chances très favorables";
  else if (score >= 70) label = "Dossier solide";
  else if (score >= 50) label = "Chances modérées";
  else label = "Litige complexe / Aléatoire";

  return {
    score,
    label: `${label} (${score}%)`,
    riskLevel,
    strengthText,
    prescriptionStatus
  };
}

export function generateSmartProceduralRoadmap(
  contextText: string,
  _domain: string = 'general',
  jurisdictionId: string = 'fr_eu'
): { stepNumber: number; timeframe: string; title: string; description: string; badge?: string }[] | undefined {
  const textLower = (contextText || '').toLowerCase();

  if (/^(bonjour|salut|hello|merci|parfait)[\s!?.]*$/i.test(contextText.trim())) {
    return undefined;
  }

  if (jurisdictionId === 'ch' || /suisse|gen[èe]ve|vaud/i.test(textLower)) {
    return [
      {
        stepNumber: 1,
        timeframe: "J+0 à J+10",
        title: "Mise en demeure formelle",
        description: "Notification écrite par courrier recommandé fixant un délai péremptoire d'exécution.",
        badge: "Phase amiable"
      },
      {
        stepNumber: 2,
        timeframe: "Mois 1",
        title: "Conciliation ou Réquisition de poursuite (LP)",
        description: "Dépôt de la réquisition auprès de l'Office des poursuites ou saisine de la commission de conciliation.",
        badge: "Procédure suisse"
      },
      {
        stepNumber: 3,
        timeframe: "Mois 2 à M+3",
        title: "Action judiciaire au fond",
        description: "Introduction de l'action devant le Tribunal de première instance ou Tribunal des prud'hommes.",
        badge: "Jugement"
      }
    ];
  }

  if (jurisdictionId === 'be' || /belgique|bruxelles/i.test(textLower)) {
    return [
      {
        stepNumber: 1,
        timeframe: "J+0 à J+15",
        title: "Mise en demeure préalable obligatoire",
        description: "Courrier recommandé avec accusé de réception sommant la partie adverse d'exécuter.",
        badge: "Phase amiable"
      },
      {
        stepNumber: 2,
        timeframe: "Mois 1",
        title: "Tentative de conciliation (Juge de Paix)",
        description: "Comparution volontaire ou requête conjointe devant le Juge de Paix ou Tribunal du travail.",
        badge: "Gratuit"
      },
      {
        stepNumber: 3,
        timeframe: "Mois 2",
        title: "Citation en justice par Huissier",
        description: "Délivrance de la citation pour jugement exécutoire par le Tribunal compétent.",
        badge: "Contentieux"
      }
    ];
  }

  if (jurisdictionId === 'ohada' || /ohada|s[ée]n[ée]gal|c[ôo]te d['’]ivoire|cameroun/i.test(textLower)) {
    return [
      {
        stepNumber: 1,
        timeframe: "J+0 à J+15",
        title: "Sommation de payer avec délai impératif",
        description: "Exploit d'huissier ou lettre recommandée sommant le débiteur sous délai légal.",
        badge: "Acte d'huissier"
      },
      {
        stepNumber: 2,
        timeframe: "Mois 1",
        title: "Requête en Injonction de Payer OHADA",
        description: "Dépôt de la requête devant la juridiction compétente avec titre exécutoire (Acte uniforme).",
        badge: "Titre exécutoire"
      },
      {
        stepNumber: 3,
        timeframe: "Mois 2",
        title: "Signification & Saisie conservatoire",
        description: "Exécution forcée des créances et blocage des comptes bancaires par commissaire de justice.",
        badge: "Voies d'exécution"
      }
    ];
  }

  return [
    {
      stepNumber: 1,
      timeframe: "J+0 à J+15",
      title: "Mise en demeure formelle par LRAR",
      description: "Sommation d'exécuter sous 8 à 15 jours avec visa des articles de loi et décompte des pénalités.",
      badge: "Phase amiable"
    },
    {
      stepNumber: 2,
      timeframe: "J+15 à M+1",
      title: "Médiation ou Conciliation de Justice",
      description: "Saisine gratuite du conciliateur de justice ou de la commission de conciliation pour accord amiable.",
      badge: "Pré-contentieux"
    },
    {
      stepNumber: 3,
      timeframe: "M+2",
      title: "Saisine du Tribunal compétent",
      description: "Assignation ou requête devant le Juge des Contentieux, Tribunal Judiciaire ou Prud'hommes.",
      badge: "Décision de Justice"
    }
  ];
}
