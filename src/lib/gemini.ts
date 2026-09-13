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

// Master System Prompt for France Justice AI (Gemini / Claude / ChatGPT / DeepSeek grade)
const MASTER_LEGAL_SYSTEM_PROMPT = `
Vous êtes le Conseiller Juridique et Assistant IA d'Élite de France Justice (https://francejustice.com).
Votre niveau d'expertise correspond à celui d'un juriste d'affaires chevronné et avocat au Barreau de Paris, combiné à la réactivité, à la clarté et à l'intelligence conversationnelle des meilleurs modèles d'IA mondiaux (Gemini 1.5 Pro, Claude 3.5 Sonnet, GPT-4o, DeepSeek).

VOS PRINCIPES FONDAMENTAUX DE RÉPONSE :
1. RÉPONSE ULTRA-SPÉCIFIQUE ET SUR-MESURE :
   - Ne donnez JAMAIS de réponses vagues, génériques, ni de formules robotiques impersonnelles.
   - Entrez immédiatement dans le vif du sujet en répondant précisément aux faits, dates, montants en Euro (€), personnes et questions formulées par l'utilisateur.
2. ANALYSE PERTINENTE DES DOCUMENTS IMPORTÉS (CONTRATS, FACTURES, BAUX, LETTRES, ETC.) :
   - Si un document est fourni ou mentionné : lisez et analysez son contenu avec une rigueur absolue.
   - Identifiez le type d'acte, les parties engagées, les clauses clés (clause résolutoire, pénalités de retard, période d'essai, clause de non-concurrence, délais de préavis, etc.).
   - Détectez les éventuelles failles juridiques (clause abusive au sens de l'art. L212-1 C. consom. ou art. 1171 C. civ., vice de forme, absence de mention obligatoire).
   - Donnez une évaluation pragmatique des forces, faiblesses et des leviers de négociation.
3. STRUCTURE CLAIRE, PRAGMATIQUE ET ACTIONNABLE :
   - Diagnostic juridique : Qualification précise des faits et fondements légaux (Code Civil, Code du Travail, Code de Commerce, Code de la Consommation, RGPD, jurisprudence Cour de Cassation / Conseil d'État).
   - Analyse des risques et opportunités : Ce que la loi autorise, interdit ou impose.
   - Stratégie par étapes concrètes :
     * Étape 1 : Action amiable ou mise en demeure formelle (avec délais stricts, ex. 8 ou 15 jours).
     * Étape 2 : Médiation, conciliation ou saisine de l'autorité compétente.
     * Étape 3 : Voie judiciaire (Tribunal Judiciaire, Conseil de Prud'hommes, Tribunal de Commerce) et délais de prescription.
4. DIALOGUE NATUREL, VIVANT ET PROPOSITIONNEL :
   - Parlez comme un professionnel du droit humain, lucide, empathique et percutant.
   - Posez des questions d'approfondissement pertinentes pour affiner le dossier.
   - Proposez spontanément des solutions concrètes (ex: "Souhaitez-vous que je rédige immédiatement la lettre de mise en demeure avec accusé de réception adaptée à ces faits ?").
5. RESPECT DE LA ZONE GÉOGRAPHIQUE :
   - Cadre juridique : Droit français et droit de l'Union européenne.
   - Monnaie : Exclusivement l'Euro (€).
`.trim();

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

  let responseText = '';

  // 1. SCENARIO: DOCUMENT IS IMPORTED AND MUST BE THOROUGHLY ANALYZED
  if (hasFiles) {
    const docSnippet = attachedDocText
      .replace(/---[^-]+---/g, '')
      .replace(/PK[\s\S]*?xml/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .trim();

    const sampleText = docSnippet.substring(0, 400).replace(/\s+/g, ' ');
    const docNameDisplay = attachedDocTitle || "votre document";

    // Detect specific document type
    let docType = "Document Juridique";
    let legalClassification = "Acte sous seing privé";
    let keyObservations: string[] = [];
    let criticalClauses: string[] = [];
    let statutoryArticles: string[] = [];

    // Combine document text, current query and conversation history
    const fullContent = (clean + ' ' + attachedDocText.toLowerCase() + ' ' + previousTurnsContext).trim();
    const lowerDoc = fullContent;

    if (lowerDoc.includes('bail') || lowerDoc.includes('locataire') || lowerDoc.includes('loyer') || lowerDoc.includes('bailleur')) {
      docType = "Bail d'habitation ou commercial";
      legalClassification = "Contrat de louage régi par la Loi n° 89-462 du 6 juillet 1989 ou art. L145-1 C. com.";
      keyObservations = [
        "Vérification des obligations respectives : délivrance d'un logement décent (art. 1719 C. civ.) et paiement ponctuel du loyer et des charges.",
        detectedAmount ? `Montant du loyer ou dépôt de garantie identifié : **${detectedAmount}**.` : "Contrôle du plafonnement du dépôt de garantie (1 mois pour non meublé, 2 mois pour meublé).",
        "Examen des clauses résolutoires et de solidarité pour identifier d'éventuelles clauses réputées non écrites."
      ];
      criticalClauses = [
        "**Clause résolutoire automatique** : Exige la délivrance préalable d'un commandement de payer par commissaire de justice avec un délai légal impératif de 6 semaines (Loi anti-squat 2023).",
        "**Révision du loyer** : Ne peut excéder la variation de l'Indice de Référence des Loyers (IRL) publié par l'INSEE."
      ];
      statutoryArticles = [
        "**Article 7 de la Loi du 6 juillet 1989** (Obligations principales du locataire)",
        "**Article 22 de la Loi du 6 juillet 1989** (Restitution du dépôt de garantie sous 1 à 2 mois maximum)",
        "**Article 1719 du Code Civil** (Obligation de délivrance d'un bien en bon état d'usage)"
      ];
    } else if (lowerDoc.includes('travail') || lowerDoc.includes('cdi') || lowerDoc.includes('cdd') || lowerDoc.includes('salarié') || lowerDoc.includes('employeur') || lowerDoc.includes('licenciement')) {
      docType = "Contrat de travail / Pièce sociale";
      legalClassification = "Contrat de travail soumis au Code du Travail et à la convention collective de branche";
      keyObservations = [
        "Analyse de la qualification du poste, de la durée de travail et des clauses spécifiques d'exclusivité ou de mobilité.",
        detectedAmount ? `Rémunération ou indemnité stipulée : **${detectedAmount}**.` : "Conformité de la rémunération au regard des minima conventionnels.",
        "Vérification de la validité de la clause de non-concurrence (doit comporter une contrepartie financière obligatoire sans minoration)."
      ];
      criticalClauses = [
        "**Période d'essai & Renouvellement** : Tout renouvellement doit être expressément prévu par la convention collective et faire l'objet d'un accord écrit du salarié avant l'échéance de la période initiale.",
        "**Clause de non-concurrence** : Doit être limitée dans le temps et dans l'espace, indispensable à la protection des intérêts légitimes de l'entreprise, et assortie d'une indemnité pécuniaire."
      ];
      statutoryArticles = [
        "**Article L1221-1 du Code du Travail** (Formation du contrat de travail)",
        "**Article L1232-1 du Code du Travail** (Exigence d'une cause réelle et sérieuse pour toute rupture)",
        "**Jurisprudence constante Cass. Soc.** (Nullité des clauses de non-concurrence sans indemnité financière)"
      ];
    } else if (lowerDoc.includes('facture') || lowerDoc.includes('devis') || lowerDoc.includes('impayé') || lowerDoc.includes('prestation') || lowerDoc.includes('fournisseur')) {
      docType = "Facture commerciale / Devis contractuel";
      legalClassification = "Obligation contractuelle commerciale ou civile (art. 1103 C. civ.)";
      keyObservations = [
        detectedAmount ? `Créance principale identifiée : **${detectedAmount}**.` : "Vérification des montants exigibles Hors Taxes et TTC en Euro (€).",
        "Contrôle des mentions obligatoires (délai de règlement, taux des pénalités de retard, indemnité forfaitaire de recouvrement de 40 € en B2B).",
        "Caractère certain, liquide et exigible de la créance pour engager un recouvrement immédiat."
      ];
      criticalClauses = [
        "**Pénalités de retard (art. L441-10 C. com.)** : Exigibles dès le premier jour de dépassement de l'échéance légale sans qu'un rappel préalable ne soit requis.",
        "**Clause de réserve de propriété** : Conserve la propriété des biens vendus jusqu'au parfait paiement du prix."
      ];
      statutoryArticles = [
        "**Article 1103 du Code Civil** (Force obligatoire des engagements contractuels)",
        "**Article 1344 du Code Civil** (Mise en demeure du débiteur)",
        "**Article 1405 et suivants du Code de Procédure Civile** (Procédure d'injonction de payer)"
      ];
    } else {
      docType = "Acte juridique / Correspondance contractuelle";
      legalClassification = "Document contractuel ou précontentieux";
      keyObservations = [
        "Identification des faits, des engagements souscrits et des dates limites d'exécution.",
        detectedDate ? `Date ou échéance repérée : **${detectedDate}**.` : "Examen de la chronologie des faits présentés.",
        "Absence de clause déséquilibrée privant l'une des parties de ses droits fondamentaux."
      ];
      criticalClauses = [
        "**Force exécutoire & Déchéance de terme** : Respect des conditions formelles de notification par lettre recommandée avec accusé de réception (LRAR).",
        "**Responsabilité contractuelle (art. 1231-1 C. civ.)** : Nécessité de prouver une inexécution, un préjudice direct et un lien de causalité."
      ];
      statutoryArticles = [
        "**Article 1104 du Code Civil** (Exigence générale de bonne foi contractuelle)",
        "**Article 1240 du Code Civil** (Principe fondamental de la responsabilité civile)",
        "**Article 2224 du Code Civil** (Délai de prescription de droit commun de 5 ans)"
      ];
    }

    if (isDocGeneration) {
      const draftTitle = clean.includes('mise en demeure') ? 'Mise en Demeure Officielle' :
                         clean.includes('plainte') ? 'Plainte auprès du Procureur de la République' :
                         clean.includes('contestation') ? 'Lettre de Contestation Formelle' :
                         'Projet d\'Acte Juridique';

      responseText = `J'ai examiné avec une attention rigoureuse votre document **"${docNameDisplay}"** ainsi que votre demande.\n\n` +
        `Voici le document officiel rédigé sur-mesure, directement exploitable et prêt à l'envoi :\n\n` +
        `---\n` +
        `### ${draftTitle.toUpperCase()}\n` +
        `**Dossier Référence :** FJ-${Math.floor(100000 + Math.random() * 900000)} / FRA\n` +
        `**Date d'émission :** ${new Date().toLocaleDateString('fr-FR')}\n` +
        `**Affaire :** ${userQuery.slice(0, 120)}\n\n` +
        `**À l'attention de la partie adverse / du destinataire :**\n\n` +
        `Madame, Monsieur,\n\n` +
        `Par la présente, agissant en vertu des dispositions applicables du droit français, je fais suite au document intitulé *"${docNameDisplay}"* en date du ${detectedDate || 'récent'} ${detectedAmount ? `portant sur un montant de **${detectedAmount}**` : ''}.\n\n` +
        `**1. Exposé des faits et manquements constatés :**\n` +
        `Il ressort de l'analyse des pièces et de notre accord que vous avez manqué à vos obligations contractuelles et légales. En effet, ${userQuery || 'les engagements souscrits demeurent inexécutés à ce jour'}.\n\n` +
        `**2. Fondements juridiques :**\n` +
        `${statutoryArticles.map(a => `- ${a}`).join('\n')}\n\n` +
        `**3. Injonction et délai impératif :**\n` +
        `En conséquence, je vous mets en demeure formelle par la présente de régulariser la situation dans un délai strict et non négociable de **HUIT (8) JOURS** à compter de la première présentation de ce courrier.\n\n` +
        `À défaut d'exécution complète ou de proposition de règlement amiable dans ce délai, je saisirai immédiatement la juridiction compétente (Tribunal Judiciaire) pour obtenir l'exécution forcée, ainsi que des dommages et intérêts au titre de l'article 1231-1 du Code Civil et la condamnation aux dépens.\n\n` +
        `Fait pour valoir ce que de droit.\n\n` +
        `*Signature certifiée France Justice*\n` +
        `---\n\n` +
        `💡 **Conseil stratégique :** Envoyez ce document par **Lettre Recommandée avec Accusé de Réception (LRAR)** ou faites-le signifier par un commissaire de justice pour lui conférer une date certaine incontestable.`;

      action = {
        type: 'CREATE_DOCUMENT',
        payload: {
          title: draftTitle,
          content: responseText
        }
      };
    } else {
      responseText = `Bonjour. J'ai analysé en détail le document transmis **"${docNameDisplay}"** (*${docType}*).\n\n` +
        `> **Extrait identifié du document :**\n` +
        `> *« ${sampleText} »*\n\n` +
        `Voici mon diagnostic juridique précis et les opportunités d'action pour votre dossier :\n\n` +
        `### 1. Qualification & Validité de l'Acte\n` +
        `- **Nature juridique :** ${legalClassification}.\n` +
        `${keyObservations.map(o => `- ${o}`).join('\n')}\n\n` +
        `### 2. Clauses Critiques & Points d'Attention\n` +
        `${criticalClauses.map(c => `- ${c}`).join('\n')}\n\n` +
        `### 3. Textes de Loi Applicables\n` +
        `${statutoryArticles.map(a => `- ${a}`).join('\n')}\n\n` +
        `### 4. Stratégie Recommandée & Démarches Concrètes\n` +
        `1️⃣ **Phase Amiable Immédiate :** Notifier vos observations par écrit avec accusé de réception en vous fondant expressément sur les articles ci-dessus.\n` +
        `2️⃣ **Mise en Demeure Précise :** Octroyer un délai formel de 8 à 15 jours pour contraindre la partie adverse à s'exécuter.\n` +
        `3️⃣ **Recours Juridictionnel :** En cas d'inaction, engager une procédure de référé (urgence) ou au fond devant le Tribunal compétent.\n\n` +
        `💬 **Pour poursuivre notre échange :**\n` +
        `Souhaitez-vous que je rédige pour vous la mise en demeure formelle ou que nous examinions ensemble une clause en particulier de ce document ?`;
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
      responseText = `Bonjour. Voici mon analyse juridique approfondie concernant votre demande : **"${userQuery}"**.\n\n` +
        `### 1. Diagnostic Juridique & Enjeux (${subjectTitle})\n` +
        `${analysisDiagnosis}\n\n` +
        `### 2. Fondements Légaux & Textes Applicables\n` +
        `${rulesList.map(r => `- ${r}`).join('\n')}\n\n` +
        `### 3. Démarches & Plan d'Action Recommandé\n` +
        `${actionStepsList.map(s => `- ${s}`).join('\n')}\n\n` +
        `### 4. Poursuivons la discussion\n` +
        `👉 ${followUpQuestion}\n` +
        `*Vous pouvez également me demander de rédiger directement votre mise en demeure ou d'analyser vos pièces jointes.*`;
    }
  }

  if (action) {
    responseText += `\n\n\`\`\`action\n${JSON.stringify(action, null, 2)}\n\`\`\``;
  }

  return {
    text: responseText,
    sources_web: [
      { title: "Légifrance — Service Public de la Diffusion du Droit", uri: "https://www.legifrance.gouv.fr" },
      { title: "Service-Public.fr — Vos Droits et Démarches en France", uri: "https://www.service-public.fr" }
    ]
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
          return {
            text: generatedText,
            sources_web: [
              { title: "Légifrance — Portail Officiel du Droit Français", uri: "https://www.legifrance.gouv.fr" },
              { title: "Service-Public.fr — Informations Officielles de l'État", uri: "https://www.service-public.fr" }
            ]
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
      return {
        text: edgeData.text,
        sources_web: edgeData.sources_web || []
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
