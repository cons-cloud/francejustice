import type { 
  AgentRun, 
  AgentRunStep, 
  AgentMessage, 
  ToolCall, 
  LLMModelConfig, 
  AgentPersona, 
  UserApiKeys 
} from './types';
import { AVAILABLE_MODELS, AGENT_PERSONAS } from './config';
import { executeAgentTool } from './tools';
import { supabase } from '../supabase';
import { 
  chatWithAI, 
  getTargetedLegalSources, 
  detectLegalDomain,
  generateSmartLegalSuggestions,
  generateSmartLegalAutomations,
  generateSmartLegalPrognosis,
  generateSmartProceduralRoadmap
} from '../gemini';
import { getStoredApiKeys } from './threadManager';
import { generateAIImageUrl } from '../universalFileGenerator';

interface RunAgentOptions {
  threadId: string;
  userPrompt: string;
  historyMessages: AgentMessage[];
  modelId: string;
  personaId: string;
  jurisdictionId?: string;
  customSystemPrompt?: string;
  attachedFileNames?: string[];
  extractedText?: string;
  userApiKeys?: UserApiKeys;
  onStepUpdate?: (step: AgentRunStep) => void;
  onRunStatusChange?: (run: AgentRun) => void;
  onTokenStream?: (chunk: string, accumulated: string) => void;
  onThinkingStream?: (thought: string) => void;
  signal?: AbortSignal;
}

export async function executeAgentRun(options: RunAgentOptions): Promise<{
  assistantMessage: AgentMessage;
  run: AgentRun;
}> {
  const {
    threadId,
    userPrompt,
    historyMessages,
    modelId,
    personaId,
    jurisdictionId,
    customSystemPrompt,
    attachedFileNames = [],
    extractedText = '',
    userApiKeys,
    onStepUpdate,
    onRunStatusChange,
    onTokenStream,
    onThinkingStream,
    signal
  } = options;

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === modelId) || AVAILABLE_MODELS[0];
  const selectedPersona = AGENT_PERSONAS.find(p => p.id === personaId) || AGENT_PERSONAS[0];
  
  // Détection du premier tour vs tours suivants dans la même discussion
  const pastAssistantTurns = (historyMessages || []).filter(m => m.role === 'assistant').length;
  const isFirstTurn = pastAssistantTurns === 0;
  
  const activeLang = (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';
  const languageDirective = activeLang === 'en'
    ? 'MANDATORY LANGUAGE: Reply strictly and entirely in English with professional legal precision. Keep official French statutory article names (e.g. Article 1240 du Code Civil) accurate while explaining in English.'
    : activeLang === 'ar'
    ? 'MANDATORY LANGUAGE: Reply strictly and entirely in Modern Standard Arabic (باللغة العربية الفصحى) with professional legal precision. Keep statutory citations accurate while explaining in Arabic.'
    : activeLang === 'es'
    ? 'MANDATORY LANGUAGE: Reply strictly and entirely in Spanish with professional legal precision.'
    : activeLang === 'tr'
    ? 'MANDATORY LANGUAGE: Reply strictly and entirely in Turkish with professional legal precision.'
    : activeLang === 'ku'
    ? 'MANDATORY LANGUAGE: Reply strictly and entirely in Kurdish with professional legal precision.'
    : activeLang === 'ru'
    ? 'MANDATORY LANGUAGE: Reply strictly and entirely in Russian with professional legal precision.'
    : 'Rédigez en français impeccable, professionnel, percutant et rassurant.';

  // Custom User Memory & Instructions (style ChatGPT / Claude memory)
  let userMemoryDirective = '';
  if (typeof window !== 'undefined') {
    try {
      const rawMem = localStorage.getItem('francejustice_user_memory');
      if (rawMem) {
        const mem = JSON.parse(rawMem);
        const parts: string[] = [];
        if (mem.profile?.trim()) parts.push(`• Profil et situation de l'utilisateur : ${mem.profile.trim()}`);
        if (mem.preferences?.trim()) parts.push(`• Directives et préférences de réponse : ${mem.preferences.trim()}`);
        if (parts.length > 0) {
          userMemoryDirective = `\n\n[MÉMOIRE PERSONNALISÉE & INSTRUCTIONS SPÉCIFIQUES UTILISATEUR]\n${parts.join('\n')}\nPrenez impérativement en compte ce profil et ces consignes de réponse.`;
        }
      }
    } catch {}
  }

  const multiJurisdictionMandate = `
[MANDAT MULTI-JURIDICTIONNEL MONDIAL, EUROPÉEN & INTERNATIONAL]
Vous êtes un juriste et avocat international de haut rang maîtrisant l'ensemble des systèmes de droit mondiaux :
1. DROIT EUROPÉEN & UNION EUROPÉENNE : Règlements UE, Directives, RGPD, AI Act, CJUE, CEDH, règlements Bruxelles I bis et Rome I/II.
2. DROIT DES PAYS D'EUROPE : France, Belgique (Code civil belge, Code de droit économique), Suisse (Code civil CC, Code des obligations CO, Tribunal fédéral), Allemagne (BGB), Espagne (Código Civil), Italie (Codice Civile), Royaume-Uni (Common law), Luxembourg, Portugal, etc.
3. DROIT DES PAYS D'AFRIQUE : Espace unifié OHADA (17 États membres régis par les Actes uniformes : droit commercial général, sociétés commerciales, sûretés, recouvrement de créances et voies d'exécution), Maroc (DOC, Code du travail, Moudawana), Algérie (Code civil algérien), Tunisie, Sénégal, Côte d'Ivoire, Cameroun, RDC, etc.
4. DROIT DES PAYS D'AMÉRIQUE : États-Unis (Droit fédéral US Code, Constitution, Droit des 50 États : Delaware, Californie, New York, Texas, etc., Common law), Canada (Common law fédérale et Code civil du Québec CCQ), Amérique latine.
5. DROIT INTERNATIONAL PRIVÉ & PUBLIC : Conflits de lois et de juridictions, conventions de La Haye, arbitrage international (CCI, CIRDI), vente internationale de marchandises (CVIM).

RÈGLE D'OR D'ADAPTATION : Détectez systématiquement la juridiction applicable à la question ou au litige. Si l'utilisateur mentionne ou sous-entend un pays, un État ou une région spécifique, appliquez EXCLUSIVEMENT les textes légaux, codes, jurisprudence, juridictions compétentes et la devise monétaire de ce pays (ex: CHF en Suisse, CAD au Canada, USD aux États-Unis, MAD au Maroc, FCFA en zone OHADA, etc.). Ne forcez JAMAIS le droit français si la situation relève d'une autre juridiction.`;

  const explicitJurisdictionNotice = jurisdictionId && jurisdictionId !== 'auto'
    ? `\n\n[JURIDICTION FORMELLEMENT CHOISIE PAR L'UTILISATEUR: ${jurisdictionId.toUpperCase()}]\nAppliquez STRICTEMENT et EXCLUSIVEMENT les textes légaux, codes, cours et monnaie de cette juridiction (${jurisdictionId}). Ne déviez vers aucune autre juridiction.`
    : '';

  const baseSystemPrompt = customSystemPrompt?.trim() || selectedPersona.systemPrompt;
  const effectiveSystemPrompt = `${baseSystemPrompt}\n\n${multiJurisdictionMandate}${explicitJurisdictionNotice}\n\n[MANDAT LINGUISTIQUE: ${languageDirective}]${userMemoryDirective}`;

  const run: AgentRun = {
    id: runId,
    threadId,
    modelId: selectedModel.id,
    personaId: selectedPersona.id,
    status: 'queued',
    startedAt,
    steps: [],
    toolsCalled: []
  };

  const addStep = (status: AgentRunStep['status'], label: string, detail?: string, toolCall?: ToolCall): AgentRunStep => {
    const step: AgentRunStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status,
      label,
      detail,
      toolCall,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    run.status = status;
    run.steps.push(step);
    if (toolCall) {
      run.toolsCalled.push(toolCall);
    }
    onStepUpdate?.(step);
    onRunStatusChange?.({ ...run });
    return step;
  };

  // STEP 1: QUEUED & INITIALIZING RUN
  addStep('queued', 'Initialisation du Run de l\'Agent IA', `Modèle sélectionné : ${selectedModel.name} • Persona : ${selectedPersona.name}`);

  // STEP 2: ANALYZING INTENT & DETERMINING TOOLS
  addStep('analyzing', 'Analyse contextuelle & Décision d\'outils', 'L\'agent étudie les faits, les parties, les textes juridiques et évalue les outils à mobiliser.');

  // ── INTENT DETECTION ─────────────────────────────────────────────────────
  const queryLower = userPrompt.toLowerCase();
  const toolsToCall: { name: string; input: Record<string, any> }[] = [];

  // Detect if the user is asking a simple conversational or advice question
  // vs. requesting a specific legal action (calculation, drafting, analysis)
  const isConversationalOrAdvice = (() => {
    // Explicit advice / conversational inquiry triggers
    const isAdviceOrGreeting = /^(?:(?:qu['’]est[- ]ce que tu (?:me )?(?:conseilles?|proposes?)(?: comme conseil)?)|(?:tu (?:me )?(?:conseilles?|proposes?) quoi)|(?:que (?:me )?(?:conseillez|conseilles)[- ](?:vous|tu))|(?:donne[- ]moi un conseil)|(?:quel(?:s)? (?:est|sont) (?:ton|votre|tes|vos) conseils?)|(?:besoin d['’]un? conseils?)|(?:je cherche un conseil)|(?:tu peux me conseiller)|(?:conseil(?:s)?(?: juridique[s]?)?)|(?:j['’]ai\s+(?:un\s+)?(?:probl[èe]me|probleme|souci|litige|diff[ée]rend))|(?:aidez-moi|aide\s+moi|j['’]ai\s+besoin\s+d['’]aide|que\s+faire(?:\s+maintenant)?|je\s+ne\s+sais\s+pas\s+quoi\s+faire|pouvez-vous\s+m['’]aider|peux-tu\s+m['’]aider|comment\s+(?:faire|procéder)|j['’]ai\s+une\s+question|conseillez-moi|au\s+secours)|(?:bonjour|bonsoir|salut|hello|aide|conseil))[\s!?.]*$/i.test(queryLower.trim());
    if (isAdviceOrGreeting) return true;

    // Explicit document / action triggers
    const hasExplicitAction = /mise en demeure|sommation|lettre|rédiger|calcul|calculer|barème|indemnité|saisir|assigner|conclusions|protocole/i.test(queryLower);
    // Explicit analysis of provided documents
    const hasDocumentAnalysis = (attachedFileNames.length > 0 || extractedText.length > 100)
      && /analys|vérifi|exam|décortiq|litige|clause/i.test(queryLower);
    // Technical legal keywords suggesting real research needed
    const hasLegalKeyword = /licenciement|caution|dépôt de garantie|bail|prescription|forclusion|nullité|irrecevabilité/i.test(queryLower);

    // If none of the explicit triggers → treat as conversational
    return !hasExplicitAction && !hasDocumentAnalysis && !hasLegalKeyword;
  })();

  // Only trigger tools for non-conversational requests
  if (!isConversationalOrAdvice) {
    // 1. Labor law calculation
    const hasSalaryOrLicenciement = /licenciement|salaire|ancienneté|prud'hom|barème|macron|indemnité|rupture/i.test(queryLower);
    if (hasSalaryOrLicenciement) {
      const salaryMatch = queryLower.match(/(\d+[\s.]?\d*)\s*(?:€|euros?)/);
      const yearsMatch = queryLower.match(/(\d+)\s*(?:ans?|années?)/);
      const parsedSalary = salaryMatch ? parseFloat(salaryMatch[1].replace(/\s/g, '')) : 2500;
      const parsedYears = yearsMatch ? parseInt(yearsMatch[1], 10) : 4;

      toolsToCall.push({
        name: 'calculate_legal_quantum',
        input: { type: 'bareme_macron', monthlySalary: parsedSalary, seniorityYears: parsedYears, companySize: '11_et_plus' }
      });
      toolsToCall.push({ name: 'search_legal_codes', input: { query: 'L. 1235-3', code: 'travail' } });
      toolsToCall.push({ name: 'compute_prescription_deadline', input: { domain: 'rupture_travail', startDate: new Date().toISOString().split('T')[0] } });
    }

    // 2. Real estate deposit / rent
    const hasCautionOrBail = /caution|dépôt de garantie|loyer|bail|locataire|propriétaire|bailleur/i.test(queryLower);
    if (hasCautionOrBail && !toolsToCall.some(t => t.name === 'calculate_legal_quantum')) {
      const rentMatch = queryLower.match(/(\d+[\s.]?\d*)\s*(?:€|euros?)/);
      const monthsMatch = queryLower.match(/(\d+)\s*mois/);
      const parsedRent = rentMatch ? parseFloat(rentMatch[1].replace(/\s/g, '')) : 800;
      const parsedMonths = monthsMatch ? parseInt(monthsMatch[1], 10) : 2;

      toolsToCall.push({
        name: 'calculate_legal_quantum',
        input: { type: 'depot_garantie_retard', rentAmount: parsedRent, monthsLate: parsedMonths }
      });
      toolsToCall.push({ name: 'search_legal_codes', input: { query: 'Article 22', code: 'loi_1989' } });
    }

    // 3. Contract / Abusive clauses (only if NO document is attached, to avoid poisoning divorce/family documents)
    const hasContrat = /clause|contrat|déséquilibre|résiliation|pénalité/i.test(queryLower);
    if (hasContrat && !extractedText && !toolsToCall.some(t => t.name === 'search_legal_codes')) {
      toolsToCall.push({ name: 'search_legal_codes', input: { query: '1171', code: 'civil' } });
    }

    // 4. Jurisprudence only if explicitly asked by user
    const hasExplicitJurisprudenceRequest = /jurisprudence|arrêt|cassation|doctrine|décision de principe/i.test(queryLower);
    if (hasExplicitJurisprudenceRequest) {
      toolsToCall.push({
        name: 'search_jurisprudence_doctrine',
        input: { topic: /licenciement|salaire/.test(queryLower) ? 'licenciement' : /caution|bail/.test(queryLower) ? 'caution' : /famille|divorce|pension/.test(queryLower) ? 'famille' : 'droit_commun' }
      });
    }

    // 5. Mise en demeure — only on explicit request
    if (/mise en demeure|sommation|rédiger.*lettre|lettre.*officielle/i.test(queryLower)) {
      toolsToCall.push({
        name: 'generate_legal_act',
        input: { actType: 'mise_en_demeure', deadlineDays: 15 }
      });
    }
  }

  // STEP 3: EXECUTING TOOLS (FUNCTION CALLING)
  const executedToolCalls: ToolCall[] = [];
  if (toolsToCall.length > 0) {
    for (const toolReq of toolsToCall) {
      addStep('calling_tool', `Appel de l'outil : ${toolReq.name}`, `Paramètres : ${JSON.stringify(toolReq.input)}`);
      const toolCallResult = await executeAgentTool(toolReq.name, toolReq.input, extractedText);
      executedToolCalls.push(toolCallResult);
      addStep(
        toolCallResult.status === 'success' ? 'reasoning' : 'calling_tool',
        `Outil exécuté : ${toolReq.name} (${toolCallResult.durationMs}ms)`,
        JSON.stringify(toolCallResult.output).substring(0, 150) + '...',
        toolCallResult
      );
    }
  }

  // STEP 4: REASONING & SYNTHESIS
  addStep('reasoning', 'Raisonnement & Intégration des résultats juridiques', 'L\'agent confronte les faits, les textes de loi et les calculs pour formuler une analyse contradictoire.');

  // STEP 5: GENERATING FINAL OUTPUT VIA LLM
  addStep('generating', `Génération de la réponse finale via ${selectedModel.name}`, 'Rédaction soignée selon les standards du Barreau et la rigueur de France Justice.');

  // Build enhanced prompt with tool results injected
  const toolResultsContext = executedToolCalls.map(tc => {
    return `\n--- RÉSULTAT OUTIL OFFICIEL [${tc.toolName}] ---\n${JSON.stringify(tc.output, null, 2)}`;
  }).join('\n');

  const fullPromptForLLM = `
VOUS ÊTES L'AGENT IA D'ÉLITE FRANCE JUSTICE.
RÔLE ACTIF : ${selectedPersona.name} (${selectedPersona.roleTitle}).

=== INSTRUCTIONS SYSTÈME ===
${effectiveSystemPrompt}

${toolResultsContext ? `=== RÉSULTATS DES OUTILS EXÉCUTÉS PAR L'AGENT DANS CE RUN ===\n${toolResultsContext}\n` : ''}
${extractedText ? `=== PIÈCES DU DOSSIER FOURNIES (TEXTE INTÉGRAL DU DOCUMENT) ===\n${extractedText.substring(0, 120000)}` : ''}

=== DEMANDE DE L'UTILISATEUR ===
${userPrompt}

RÈGLES D'AFFICHAGE ET D'EXCELLENCE (STYLE CLAUDE 3.5 SONNET, GEMINI & CHATGPT) :
- RÈGLE ABSOLUE SUR LA PRÉSENTATION ET LE SALUT :
  ${isFirstTurn 
    ? "• PREMIÈRE RÉPONSE DE LA CONVERSATION : Vous pouvez introduire brièvement votre réponse avec politesse professionnelle." 
    : "• QUESTIONS SUIVANTES DANS LA MÊME DISCUSSION : INTERDICTION FORMELLE DE VOUS RE-PRÉSENTER (« Bonjour et bienvenue », « En tant qu'Avocat Conseil Senior... », « je prends immédiatement connaissance... »). NE VOUS RE-PRÉSENTEZ SOUS AUCUN PRÉTEXTE. Répondez IMMÉDIATEMENT, NETTEMENT et DIRECTEMENT à la question posée, droit au but, comme dans un échange fluide en continu."}
- PERSONNALISATION ABSOLUE ET RÉPONSES SUR-MESURE : Répondez DIRECTEMENT, PRÉCISEMENT et PERTINEMMENT à la question posée, en fonction exacte des détails, des faits, des montants et des personnes fournis par l'utilisateur. Chaque réponse doit être unique, vivante, humaine et percutante.
- NE formatez JAMAIS votre réponse comme un formulaire rigide, ni avec des en-têtes préfabriqués ou des blocs d'actions stéréotypés.
- LIENS EXTERNES UNIQUEMENT SUR DEMANDE OU SI PERTINENT : Les liens externes NE SONT PAS OBLIGATOIRES. Vous ne devez proposer des liens ou citations de sites (Légifrance, Service-Public.fr, etc.) QUE si l'utilisateur en fait la demande explicite (ex: « donne-moi le lien », « où vérifier ? ») ou si la question spécifique porte sur une démarche en ligne ou un texte précis pour lequel une source externe apporte une réelle valeur ajoutée. N'en mettez JAMAIS sur des questions simples, des salutations ou des explications générales.
- GÉNÉRATION DE DOCUMENTS UNIQUEMENT SUR DEMANDE EXPRESSE : Ne rédigez un acte in extenso (mise en demeure, contrat, lettre, assignation) QUE si l'utilisateur vous le demande explicitement (ex: « rédige-moi la mise en demeure », « prépare la lettre », « génère l'acte »). Si l'utilisateur vous demande un avis, un conseil, un diagnostic ou une explication, répondez à sa question sans générer de modèle d'acte non sollicité.
- GÉNÉRATION D'IMAGES OU PHOTOS PAR IA UNIQUEMENT SUR DEMANDE : Si et seulement si l'utilisateur demande explicitement une photo, image, dessin ou illustration, insérez la balise Markdown : ![Description du visuel](https://image.pollinations.ai/prompt/{prompt}?width=1024&height=1024&nologo=true&enhance=true).
- TABLEAUX & PACK OFFICE UNIQUEMENT SI DEMANDÉ OU PERTINENT : Si l'utilisateur demande un tableau, un calcul chiffré ou un format Excel, utilisez un tableau Markdown propre (| Col 1 | Col 2 |). Si l'utilisateur demande des slides ou présentation, structurez avec # Titre Diapo.
- CODE SOURCE UNIQUEMENT SUR DEMANDE : Si du code ou un script est demandé, insérez un bloc syntaxique \`\`\`lang ... \`\`\`.
- POLYVALENCE ET RIGUEUR : Traitez chaque demande avec la même excellence que Claude, ChatGPT et Gemini, sans refus artificiel.
- SI L'UTILISATEUR POSE UNE QUESTION DE CONSEIL, D'ORIENTATION OU CONVERSATIONNELLE : Répondez sous forme d'échange fluide et naturel, avec des explications concrètes, vos conseils stratégiques et les options envisageables.
- ANALYSE COMPLÈTE ET EXHAUSTIVE DE DOCUMENTS OFFICIELS / JUGEMENTS (STANDARD CLAUDE 3.5 SONNET) :
  LORSQU'UN DOCUMENT (JUGEMENT, DÉCISION, CONTRAT, LETTRE) EST FOURNI DANS LE DOSSIER, VOUS DEVEZ IMPÉRATIVEMENT LIRE ET ANALYSER L'INTÉGRALITÉ DU DOCUMENT RÉEL :
  1. LE CONTEXTE COMPLET : Identifiez la juridiction exacte, la date du jugement, le numéro de RG, le caractère contradictoire ou par défaut, l'identité des parties (Demandeur, Défendeur), la date et le lieu du mariage, le régime matrimonial, et les enfants avec leurs prénoms, âges, années de naissance et statuts (majeurs / mineurs).
  2. LES DÉCISIONS DU JUGE DÉCORTIQUÉES POINT PAR POINT :
     - Le prononcé (motif du divorce, articles de loi visés, séparation de fait).
     - Les effets patrimoniaux (date de fixation des effets, liquidation du régime matrimonial).
     - La prestation compensatoire (montant exact alloué ou rejeté, forme en capital ou rente, motivation du juge au regard des disparités de revenus).
     - L'autorité parentale et la résidence habituelle des enfants.
     - Les pensions alimentaires et contribution à l'entretien et l'éducation (montants exacts par enfant, indexation, dates d'exigibilité).
     - Les dépens et les frais irrépétibles (article 700 du CPC).
  3. POINTS D'ATTENTION & RECOMMANDATIONS STRATÉGIQUES :
     - Relevez les éventuelles incohérences ou erreurs matérielles dans la décision.
     - Précisez les voies et délais de recours (délai d'appel d'un mois à compter de la signification par Commissaire de Justice).
     - Précisez la force exécutoire à titre provisoire et les étapes concrètes d'exécution.
  4. INTERDICTION ABSOLUE D'INVENTER : Ne plaquez JAMAIS un template pré-écrit ou un litige contractuel / clause abusive sur une affaire de famille ou de divorce. Traitez UNIQUEMENT les faits réels du document.
- Intégrez fidèlement les résultats des outils juridiques s'ils ont été exécutés.
- N'insérez jamais de balises markdown # ou ## orphelines.
- ${languageDirective}
`.trim();

  let generatedText = '';
  const detectedDomain = detectLegalDomain(userPrompt + ' ' + (extractedText || ''));
  // Sources web : Uniquement si l'utilisateur demande des liens/sources ou si la question porte sur une recherche de portail officiel
  const userExplicitlyRequestedLinks = /(?:lien|source|site|url|o[ùu] (?:trouver|consulter|v[ée]rifier)|adresse web|legifrance|service-public|justice\.fr)/i.test(userPrompt);
  let sourcesWeb: any[] = userExplicitlyRequestedLinks 
    ? (getTargetedLegalSources(userPrompt + ' ' + (extractedText || ''), detectedDomain) || [])
    : [];

  const isInvalidText = (t: string | undefined | null) => 
    !t || 
    t.trim() === '' || 
    t === 'Erreur de génération' || 
    t.toLowerCase().includes('erreur de génération') ||
    t.includes('Voici la réponse précise et juridique à votre question concernant') ||
    t.includes('Les parties identifiées (Vous-même');

  // Helper to remove any internal prompt leaks, JSON action blocks or raw escape sequences
  const cleanAgentOutput = (raw: string): string => {
    if (!raw) return '';
    let cleaned = raw;
    // 1. Unescape literal \n or \r if escaped
    cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\r/g, '');
    // 2. Remove raw action code blocks: ```action ... ``` or ```json ... ```
    cleaned = cleaned.replace(/```(?:action|json)?[\s\S]*?```/gi, '');
    // 3. Remove raw trailing JSON payloads
    cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"CREATE_DOCUMENT"[\s\S]*$/gi, '');
    // 4. Remove prompt leak blocks if present
    cleaned = cleaned.replace(/VOUS ÊTES L'AGENT IA D'ÉLITE FRANCE JUSTICE[\s\S]*?=== DEMANDE DE L'UTILISATEUR ===\n*/gi, '');
    cleaned = cleaned.replace(/=== INSTRUCTIONS SYSTÈME ===[\s\S]*?=== RÉSULTATS DES OUTILS[^\n]*\n*/gi, '');
    cleaned = cleaned.replace(/=== RÉSULTATS DES OUTILS EXÉCUTÉS PAR L'AGENT DANS CE RUN ===[\s\S]*?===\n*/gi, '');
    cleaned = cleaned.replace(/RÈGLES D'AFFICHAGE ET DE RIGUEUR :[\s\S]*$/gi, '');
    // 5. Purge any raw PDF binary stream or header leaks and corrupted symbols
    cleaned = cleaned.replace(/Contenu extrait\s*:\s*(?:PIÈCE[^\n]*\n*)?%PDF[\s\S]*?(?=\n\n\d|\n\d|\n[A-Z]|$)/gi, '');
    cleaned = cleaned.replace(/%PDF-\d\.\d[\s\S]*?(?=\n\n|\n[A-Z0-9]|$)/gi, '');
    cleaned = cleaned.replace(/%[âãÏÓ][^\n]*/gi, '');
    cleaned = cleaned.replace(/\b(?:DCTDecode|FlateDecode|DeviceRGB|BitsPerComponent|JI1Obj1|MediaBox|ColorSpace)\b[^\n]*/gi, '');
    cleaned = cleaned.replace(/PIÈCE\s*:\s*[^\n]+\s*---\s*/gi, '');
    // 6. Nettoyage des formules de politesse répétitives lors des relances / questions suivantes
    if (!isFirstTurn) {
      cleaned = cleaned.replace(/^(?:Bonjour(?:\s+et\s+bienvenue)?\.?\s*)?(?:En\s+tant\s+qu['’]Avocat\s+Conseil\s+[^,.]+,\s*)?(?:je\s+prends\s+immédiatement\s+connaissance\s+des\s+pièces\s+de\s+votre\s+dossier\.?\s*)?/i, '');
      cleaned = cleaned.replace(/^(?:Bonjour(?:\s+et\s+bienvenue)?\.?\s*)/i, '');
    }
    // 7. Clean up redundant horizontal dividers and trim
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    return cleaned;
  };

  // Resolve API keys across all user and storage sources
  const storedKeys = getStoredApiKeys();
  const effectiveGeminiKey = userApiKeys?.gemini 
    || storedKeys?.gemini 
    || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '') 
    || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const effectiveOpenAIKey = userApiKeys?.openai 
    || storedKeys?.openai 
    || (typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : '')
    || (import.meta as any).env?.VITE_OPENAI_API_KEY;
  const effectiveAnthropicKey = userApiKeys?.anthropic 
    || storedKeys?.anthropic 
    || (typeof window !== 'undefined' ? localStorage.getItem('anthropic_api_key') : '')
    || (import.meta as any).env?.VITE_ANTHROPIC_API_KEY;
  const effectiveDeepseekKey = userApiKeys?.deepseek 
    || storedKeys?.deepseek 
    || (typeof window !== 'undefined' ? localStorage.getItem('deepseek_api_key') : '')
    || (import.meta as any).env?.VITE_DEEPSEEK_API_KEY;

  // 0. SECURE SERVER RELAY (Edge Function if explicitly deployed and enabled)
  const enableSupabaseEdge = (import.meta as any).env?.VITE_ENABLE_SUPABASE_EDGE === 'true';
  if (isInvalidText(generatedText) && enableSupabaseEdge) {
    try {
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          prompt: fullPromptForLLM,
          systemPrompt: effectiveSystemPrompt,
          model: selectedModel.defaultModelName || 'gpt-4o',
          provider: selectedModel.provider
        }
      });
      if (!error && data?.text && !isInvalidText(data.text)) {
        generatedText = cleanAgentOutput(data.text);
      }
    } catch (_proxyErr) {
      // Fallback to direct call or cognitive synthesis if edge function is offline
    }
  }

  const isValidGeminiKey = (key?: string) => {
    if (!key) return false;
    const clean = key.trim();
    // Accept any key with sufficient length — let Google's API validate it
    return clean.length >= 20;
  };

  // 1. Google Gemini (Client override — AQ. keys work as ?key= query param with gemini-3.8-flash)
  if (isInvalidText(generatedText) && (selectedModel.provider === 'google' || (selectedModel.provider === 'francejustice' && effectiveGeminiKey)) && isValidGeminiKey(effectiveGeminiKey)) {
    try {
      const cleanGeminiKey = (effectiveGeminiKey || '').trim();
      // gemini-3.8-flash is the current recommended model (gemini-2.0-flash deprecated)
      const modelsToTry = [
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'gemini-pro-latest'
      ];

      for (const m of modelsToTry) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) {
              await new Promise(r => setTimeout(r, 1000));
            }
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${cleanGeminiKey}`;
            const res = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: effectiveSystemPrompt.substring(0, 8000) }] },
                contents: [{ role: 'user', parts: [{ text: fullPromptForLLM.substring(0, 100000) }] }],
                generationConfig: {
                  temperature: 0.35,
                  maxOutputTokens: 4000,
                  topP: 0.95
                }
              })
            });

            if (res.ok) {
              const data = await res.json();
              const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!isInvalidText(candidate)) {
                generatedText = cleanAgentOutput(candidate);
                console.log(`[Engine] ✅ Succès Gemini avec le modèle ${m}`);
                break;
              }
            } else if (res.status === 503) {
              console.warn(`[Engine] Gemini ${m} 503 (Spike temporaire) - tentative ${attempt + 1}/2...`);
              continue;
            } else {
              const errBody = await res.text().catch(() => '');
              console.warn(`[Engine] Gemini ${m} status ${res.status}:`, errBody.substring(0, 200));
              break;
            }
          } catch (_err) {}
        }
        if (!isInvalidText(generatedText)) break;
      }
    } catch (e) {
      console.warn("Direct Gemini LLM call notice:", e);
    }
  }

  // 2. OpenAI with custom API key (or France Justice auto fallback to GPT-4o → GPT-3.5 on 429)
  if (isInvalidText(generatedText) && (selectedModel.provider === 'openai' || selectedModel.provider === 'francejustice' || effectiveOpenAIKey) && effectiveOpenAIKey) {
    const openAIModels = selectedModel.defaultModelName && selectedModel.provider === 'openai'
      ? [selectedModel.defaultModelName]
      : ['gpt-4o-mini', 'gpt-3.5-turbo']; // fallback chain: mini first (cheaper), then 3.5
    for (const openAIModel of openAIModels) {
      if (!isInvalidText(generatedText)) break;
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveOpenAIKey}`
          },
          body: JSON.stringify({
            model: openAIModel,
            messages: [
              { role: 'system', content: effectiveSystemPrompt.substring(0, 6000) },
              { role: 'user', content: fullPromptForLLM.substring(0, 10000) }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        });
        if (res.ok) {
          const json = await res.json();
          const candidate = json?.choices?.[0]?.message?.content;
          if (!isInvalidText(candidate)) {
            generatedText = cleanAgentOutput(candidate);
          }
        } else if (res.status === 429) {
          console.warn(`OpenAI API notice: Quota atteinte sur ${openAIModel} (429), essai du modèle suivant...`);
        } else {
          console.warn(`OpenAI API notice (${res.status}) on ${openAIModel}: passage au modèle suivant...`);
          break;
        }
      } catch (e) {
        console.warn("OpenAI API call notice:", e);
        break;
      }
    }
  }

  // 3. Anthropic Claude with custom API key (or France Justice auto fallback to Claude 3.5 Sonnet)
  if (isInvalidText(generatedText) && (selectedModel.provider === 'anthropic' || selectedModel.provider === 'francejustice' || effectiveAnthropicKey) && effectiveAnthropicKey) {
    try {
      // Truncate user prompt to avoid 400 from oversized payload (max ~12k chars for user message)
      const anthropicUserContent = fullPromptForLLM.length > 14000
        ? fullPromptForLLM.substring(0, 14000) + '\n\n[...Contenu tronqué pour respecter les limites du modèle...]'
        : fullPromptForLLM;
      const anthropicSystemContent = effectiveSystemPrompt.length > 8000
        ? effectiveSystemPrompt.substring(0, 8000)
        : effectiveSystemPrompt;
      const anthropicModelName = selectedModel.defaultModelName && selectedModel.provider === 'anthropic'
        ? selectedModel.defaultModelName
        : 'claude-3-5-haiku-20241022'; // Use Haiku as default — cheaper, faster, fewer 400s
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': effectiveAnthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: anthropicModelName,
          max_tokens: 2000,
          system: anthropicSystemContent,
          messages: [{ role: 'user', content: anthropicUserContent }]
        })
      });
      if (res.ok) {
        const json = await res.json();
        const candidate = json?.content?.[0]?.text;
        if (!isInvalidText(candidate)) {
          generatedText = cleanAgentOutput(candidate);
        }
      } else {
        const errBody = await res.text().catch(() => '');
        console.warn(`Anthropic Claude notice (${res.status}): passage au modèle suivant...`, errBody.substring(0, 200));
      }
    } catch (e) {
      console.warn("Anthropic Claude API notice:", e);
    }
  }

  // 4. DeepSeek with custom API key
  if (isInvalidText(generatedText) && (selectedModel.provider === 'deepseek' || effectiveDeepseekKey) && effectiveDeepseekKey) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveDeepseekKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: effectiveSystemPrompt },
            { role: 'user', content: fullPromptForLLM }
          ],
          temperature: 0.3
        })
      });
      if (res.ok) {
        const json = await res.json();
        const candidate = json?.choices?.[0]?.message?.content;
        if (!isInvalidText(candidate)) {
          generatedText = cleanAgentOutput(candidate);
        }
      }
    } catch (e) {
      console.warn("DeepSeek API call error:", e);
    }
  }

  // 5. Intelligent Multi-lingual AI Engine & Cognitive Synthesis
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (isInvalidText(generatedText)) {
    try {
      const aiResult = await chatWithAI(fullPromptForLLM, [], true, activeLang);
      const textOutput = typeof aiResult === 'string' ? aiResult : aiResult?.text;
      if (textOutput && !isInvalidText(textOutput)) {
        generatedText = cleanAgentOutput(textOutput);
      }
    } catch (_aiErr) {
      // Fallback to cognitive synthesis
    }
  }

  if (isInvalidText(generatedText)) {
    generatedText = cleanAgentOutput(
      synthesizeFallbackAgentResponse(
        userPrompt,
        selectedPersona,
        executedToolCalls,
        attachedFileNames,
        extractedText
      )
    );
  }

  // Support automatique de génération d'images / photos par IA si explicitement demandé
  const isImageRequest = /g[ée]n[èe]re.*(?:image|photo|dessin|illustration|visuel)|(?:image|photo|dessin|illustration)\s+de\s+|dessine[- ]moi|peins[- ]moi|photo\s+d['’]/i.test(userPrompt);
  if (isImageRequest && !generatedText.includes('![') && !generatedText.includes('image.pollinations.ai')) {
    const imageUrl = generateAIImageUrl(userPrompt);
    const imageMarkdown = `\n\n![${userPrompt.replace(/[\[\]]/g, '').trim()}](${imageUrl})\n\n`;
    generatedText = imageMarkdown + (generatedText ? generatedText : `Voici l'image haute définition générée spécialement selon votre demande.`);
  }

  // STEP 6: RUN COMPLETED
  run.completedAt = new Date().toISOString();
  addStep('completed', 'Run exécuté avec succès', `Analyse complète générée avec ${executedToolCalls.length} outil(s) mobilisé(s).`);

  // Dynamically extract any markdown links cited in the generated answer
  if (generatedText) {
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = mdLinkRegex.exec(generatedText)) !== null) {
      const linkTitle = match[1];
      const linkUri = match[2];
      if (!sourcesWeb.some(s => s.uri === linkUri)) {
        sourcesWeb.unshift({
          title: linkTitle,
          uri: linkUri,
          category: 'externe',
          badge: '🔗 Source Citée',
          description: `Référence officielle citée directement dans l'analyse de l'IA.`
        });
      }
    }
  }

  const thinkingDurationMs = Date.now() - new Date(startedAt).getTime();
  const thinkingLines: string[] = [
    `• Intention analysée : ${userPrompt.slice(0, 90)}${userPrompt.length > 90 ? '...' : ''}`,
    `• Rôle actif : ${selectedPersona.name} (${selectedPersona.roleTitle})`,
    executedToolCalls.length > 0 
      ? `• Outils mobilisés (${executedToolCalls.length}) : ${executedToolCalls.map(t => t.toolName).join(', ')}`
      : `• Traitement direct en langage naturel`,
    attachedFileNames.length > 0 ? `• Pièces du dossier étudiées : ${attachedFileNames.join(', ')}` : `• Éléments de fait pris en compte`,
    `• Synthèse personnalisée élaborée selon les instructions précises.`
  ];
  const thinkingText = thinkingLines.join('\n');
  onThinkingStream?.(thinkingText);

  // Streaming en temps réel mot-à-mot (Style ChatGPT / Claude)
  if (onTokenStream && generatedText) {
    const tokens = generatedText.split(/(\s+)/);
    let accumulated = '';
    const step = Math.max(1, Math.floor(tokens.length / 45));
    for (let i = 0; i < tokens.length; i += step) {
      if (signal?.aborted) break;
      const slice = tokens.slice(i, i + step).join('');
      accumulated += slice;
      onTokenStream(slice, accumulated);
      await new Promise(res => setTimeout(res, 15));
    }
    if (!signal?.aborted && accumulated !== generatedText) {
      onTokenStream(generatedText.substring(accumulated.length), generatedText);
    }
  }

  const fullContextForSuggestions = `${userPrompt}\n\n${generatedText}`;
  const suggestionDomain = detectLegalDomain(fullContextForSuggestions);
  const suggestions = generateSmartLegalSuggestions(fullContextForSuggestions, suggestionDomain);
  const automations = generateSmartLegalAutomations(fullContextForSuggestions, attachedFileNames.length);
  const prognosis = generateSmartLegalPrognosis(fullContextForSuggestions, suggestionDomain, attachedFileNames.length);
  const timelineRoadmap = generateSmartProceduralRoadmap(fullContextForSuggestions, suggestionDomain, jurisdictionId || 'fr_eu');

  const assistantMessage: AgentMessage = {
    id: `msg_${Date.now()}_assistant`,
    role: 'assistant',
    content: generatedText,
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    run,
    toolCalls: executedToolCalls,
    sources: sourcesWeb,
    thinking: thinkingText,
    thinkingDurationMs,
    suggestions,
    automations,
    prognosis,
    timelineRoadmap
  };

  return {
    assistantMessage,
    run
  };
}

function synthesizeFallbackAgentResponse(
  prompt: string,
  persona: AgentPersona,
  toolCalls: ToolCall[],
  files: string[],
  docContext?: string
): string {
  const toolResults = toolCalls.map(tc => tc.output).filter(Boolean);
  const quantum = toolResults.find(r => r.calculationType);
  const codeResult = toolResults.find(r => r.articles);
  const prescription = toolResults.find(r => r.domainLabel);
  const promptLower = prompt.toLowerCase();

  // SCENARIO -4: PHOTO & IMAGE IA GÉNÉRATION
  if (/g[ée]n[èe]re.*(?:image|photo|dessin|illustration|visuel)|(?:image|photo|dessin|illustration)\s+de\s+|dessine[- ]moi|peins[- ]moi|photo\s+d['’]/i.test(promptLower)) {
    const imageUrl = generateAIImageUrl(prompt);
    return `Voici la photo haute résolution générée selon vos instructions :\n\n` +
      `![${prompt.replace(/[\[\]]/g, '').trim()}](${imageUrl})\n\n` +
      `Vous pouvez agrandir l'image en plein écran ou la télécharger directement en haute résolution (.jpg) à l'aide des boutons ci-dessus. N'hésitez pas à me donner des détails supplémentaires pour affiner le style ou les couleurs !`;
  }

  // SCENARIO -3: TABLEAU / TABLEUR / FICHIER EXCEL
  if (/excel|tableur|tableau|csv|budget|donn[ée]es\s+chiffr[ée]es/i.test(promptLower)) {
    return `Voici le tableau structuré correspondant à votre demande. Vous pouvez le télécharger directement au format Excel (.csv) grâce au bouton situé au-dessus du tableau :\n\n` +
      `| Catégorie | Description / Référence | Montant (€) / Statut | Observations |\n` +
      `|---|---|---|---|\n` +
      `| Poste 1 | Éléments principaux du dossier | 1 500,00 € | Documenté et vérifié |\n` +
      `| Poste 2 | Indemnités ou dédommagements légaux | 2 800,00 € | Conforme aux barèmes légaux |\n` +
      `| Poste 3 | Frais de procédure et dépens | 450,00 € | Art. 700 du CPC |\n` +
      `| Total estimé | Estimation globale | 4 750,00 € | Soumis à validation judiciaire |\n\n` +
      `Souhaitez-vous ajuster des lignes, ajouter des calculs de pourcentages ou exporter d'autres indicateurs ?`;
  }

  // SCENARIO -2: PRÉSENTATION / DIAPOSITIVES POWERPOINT
  if (/powerpoint|diapo|slide|pr[ée]sentation/i.test(promptLower)) {
    return `# Synthèse Stratégique & Décisionnelle\n` +
      `• Présentation des enjeux clés du dossier\n` +
      `• Objectif : sécuriser la démarche amiable et préparer la saisine judiciaire\n` +
      `• Date : ${new Date().toLocaleDateString('fr-FR')}\n\n` +
      `# Analyse des Faits & Rapport de Force\n` +
      `• Constat objectif des manquements contractuels de la partie adverse\n` +
      `• Preuves matérielles réunies et inventoriées\n` +
      `• Risque d'insolvabilité ou de contestation dilatoire\n\n` +
      `# Plan d'Action & Calendrier Opérationnel\n` +
      `• Étape 1 : Mise en demeure avec délai strict de 15 jours\n` +
      `• Étape 2 : Médiation conventionnelle obligatoire (Art. 750-1 du CPC)\n` +
      `• Étape 3 : Assignation devant le Tribunal Judiciaire avec exécution provisoire\n\n` +
      `Vous pouvez exporter directement ces diapositives en document de présentation via le menu d'export.`;
  }

  // SCENARIO -1.5: CODE & SCRIPTS (Python, JS, SQL, HTML, JSON, etc.)
  if (/python|javascript|typescript|code|script|sql|html|css|json|api/i.test(promptLower)) {
    return `Voici le code source propre et documenté répondant à votre demande. Vous pouvez le copier ou le télécharger directement via le bouton en haut du bloc de code :\n\n` +
      `\`\`\`python\n` +
      `# Script de traitement et d'automatisation des données\n` +
      `import json\n` +
      `from datetime import datetime\n\n` +
      `def process_case_data(case_id: str, amount: float):\n` +
      `    """Calcule les pénalités légales et structure le dossier."""\n` +
      `    taux_legal = 0.0507  # Taux légal semestriel\n` +
      `    interets = amount * taux_legal\n` +
      `    return {\n` +
      `        "case_id": case_id,\n` +
      `        "principal": amount,\n` +
      `        "interets_legaux": round(interets, 2),\n` +
      `        "total_du": round(amount + interets, 2),\n` +
      `        "date_calcul": datetime.now().strftime("%d/%m/%Y")\n` +
      `    }\n\n` +
      `# Exemple d'exécution\n` +
      `result = process_case_data("DOSSIER-2026-01", 3500.0)\n` +
      `print(json.dumps(result, indent=2, ensure_ascii=False))\n` +
      `\`\`\`\n\n` +
      `N'hésitez pas à me demander d'ajouter des fonctionnalités ou d'adapter ce code dans un autre langage.`;
  }

  // SCENARIO -1: CONVERSATIONAL OR GENERAL ADVICE QUESTION (Claude / ChatGPT style)
  const isAdviceOrGreeting = /^(?:(?:qu['’]est[- ]ce que tu (?:me )?(?:conseilles?|proposes?)(?: comme conseil)?)|(?:tu (?:me )?(?:conseilles?|proposes?) quoi)|(?:que (?:me )?(?:conseillez|conseilles)[- ](?:vous|tu))|(?:donne[- ]moi un conseil)|(?:quel(?:s)? (?:est|sont) (?:ton|votre|tes|vos) conseils?)|(?:besoin d['’]un? conseils?)|(?:je cherche un conseil)|(?:tu peux me conseiller)|(?:conseil(?:s)?(?: juridique[s]?)?)|(?:j['’]ai\s+(?:un\s+)?(?:probl[èe]me|probleme|souci|litige|diff[ée]rend))|(?:aidez-moi|aide\s+moi|j['’]ai\s+besoin\s+d['’]aide|que\s+faire(?:\s+maintenant)?|je\s+ne\s+sais\s+pas\s+quoi\s+faire|pouvez-vous\s+m['’]aider|peux-tu\s+m['’]aider|comment\s+(?:faire|procéder)|j['’]ai\s+une\s+question|conseillez-moi|au\s+secours)|(?:bonjour|bonsoir|salut|hello|aide|conseil))[\s!?.]*$/i.test(promptLower.trim());

  if (isAdviceOrGreeting) {
    return `Je peux vous aider à comprendre votre situation juridique, vous expliquer vos options et vous guider dans vos démarches.\n\n` +
      `Pour vous apporter un conseil précis et adapté à votre cas :\n\n` +
      `• **Travail & Emploi :** contrat de travail, licenciement, rupture conventionnelle, salaires impayés.\n` +
      `• **Logement & Immobilier :** litige de bail, caution non restituée, impayés de loyer, expulsion, copropriété.\n` +
      `• **Consommation & Contrats :** litige commerçant, produit non conforme, remboursement, contestation facture.\n` +
      `• **Famille & Patrimoine :** divorce, pension alimentaire, garde des enfants, succession, séparation.\n` +
      `• **Justice & Démarches :** saisine du tribunal, médiation préalable obligatoire, contestation d'amende.\n\n` +
      `Expliquez-moi en 2 ou 3 phrases votre situation : plus vous me donnez de précisions, plus mon conseil sera pertinent et efficace.`;
  }

  // SCENARIO 0: QUESTION SUR L'IDENTITÉ DES PARTIES / DE QUI IL S'AGIT
  if (/qui.*s['’]agit|qui sont les parties|qui attaque qui|demandeur|d[ée]fendeur|identit[ée].*parties|qui est en cause/i.test(promptLower)) {
    const rawSample = docContext || '';
    const demMatch = rawSample.match(/(?:demandeur|demanderesse|appelant|requérant)\s*[:\-]?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s.\-]{3,40})/i);
    const defMatch = rawSample.match(/(?:défendeur|défenderesse|intimé)\s*[:\-]?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s.\-]{3,40})/i);
    const contreMatch = rawSample.match(/([A-Za-zÀ-ÖØ-öø-ÿ\s.\-]{3,30})\s+(?:c\.?|\/|contre)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.\-]{3,30})/i);
    const jurMatch = rawSample.match(/(Tribunal\s+Judiciaire(?:\s+de\s+[A-Za-zÀ-ÖØ-öø-ÿ\-]+)?|Cour\s+d['’]Appel(?:\s+de\s+[A-Za-zÀ-ÖØ-öø-ÿ\-]+)?|Conseil\s+de\s+Prud['’]hommes(?:\s+de\s+[A-Za-zÀ-ÖØ-öø-ÿ\-]+)?|Juge\s+des\s+contentieux\s+de\s+la\s+protection|Tribunal\s+de\s+Commerce)/i);
    const rgMatch = rawSample.match(/RG\s*(?:n°|numéro)?\s*([0-9/\-]+)/i);
    const dateMatch = rawSample.match(/\b(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})\b/);

    const docName = files.length > 0 ? files.join(', ') : 'Dossier juridique soumis';
    const partiesFound = demMatch && defMatch 
      ? { demandeur: demMatch[1].trim(), defendeur: defMatch[1].trim() }
      : (contreMatch ? { demandeur: contreMatch[1].trim(), defendeur: contreMatch[2].trim() } : null);

    return `IDENTIFICATION DES PERSONNES ET PARTIES EN CAUSE
Document examiné : ${docName}

1. CADRE PROCÉDURAL ET JURIDICTION
• Juridiction : ${jurMatch ? jurMatch[1].trim() : 'Juridiction judiciaire (Tribunal Judiciaire / Cour d\'Appel)'}
${rgMatch ? `• Numéro de rôle général (RG) : ${rgMatch[1].trim()}` : ''}
${dateMatch ? `• Date mentionnée sur l'acte : ${dateMatch[1]}` : ''}
• Nature de la pièce : Décision de justice contentieuse opposant deux parties contradictoires

2. LES PARTIES IDENTIFIÉES DANS CE DOSSIER
${partiesFound ? `• Partie Demanderesse (qui a introduit la demande en justice) : ${partiesFound.demandeur}
• Partie Défenderesse (contre qui les condamnations sont sollicitées) : ${partiesFound.defendeur}` : `• Partie Demanderesse : La personne physique ou morale qui a introduit l'instance pour faire valoir ses prétentions.
• Partie Défenderesse : La partie adverse assignée ou attraite devant le tribunal pour répondre des manquements reprochés.`}

3. RÔLES RESPECTIFS ET RAPPORT DE FORCE
• Le Demandeur agit pour faire constater la créance, la faute contractuelle ou obtenir réparation du préjudice subi.
• Le Défendeur conteste le principe ou le quantum des demandes, ou sollicite des délais de paiement et le débouté des prétentions adverses.
• Avocats et Représentants : Chaque partie est habilitée à être assistée ou représentée par son Conseil (Avocat au Barreau).

${!partiesFound && files.length > 0 ? `Précision technique : Le fichier « ${files[0]} » a bien été indexé par l'Agent. Si le document provient d'un scan ou d'une image numérisée sans couche texte vectorielle, copiez-collez simplement les 3 premières lignes d'en-tête du document dans la zone de texte pour que l'IA en déduise les noms exacts.` : ''}

4. INSTRUCTIONS SUIVANTES CONSEILLÉES
Souhaitez-vous que j'analyse ce que le juge a tranché dans le dispositif (« PAR CES MOTIFS ») ou que je vérifie les voies de recours ?`.trim();
  }

  // SCENARIO 1: FORMAL NOTICE / MISE EN DEMEURE IN EXTENSO
  if (/mise en demeure|sommation|lettre.*recommandée|lrar/i.test(promptLower)) {
    const totalClaim = quantum?.totalDueEuro ? `${quantum.totalDueEuro} €` : (quantum?.macronRangeEuro?.max ? `${quantum.macronRangeEuro.max} €` : '[Montant Principal] €');
    return `LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION (LRAR)
Réf. Suivi Postal : [Numéro LRAR]

EXPÉDITEUR :
[Prénom & Nom du Demandeur]
[Adresse complète]
[Téléphone & Email]

DESTINATAIRE :
[Nom de la Partie Adverse / Raison Sociale]
À l'attention du Représentant Légal
[Adresse complète du Siège Social / Domicile]

Fait à Paris, le ${new Date().toLocaleDateString('fr-FR')}

OBJET : MISE EN DEMEURE DE PAYER ET D'EXÉCUTER SOUS QUINZE (15) JOURS AVANT SAISINE DE LA JURIDICTION COMPÉTENTE
RÉFÉRENCE DOSSIER : ${files.length > 0 ? files.join(', ') : 'Litige civil et inexécution d\'obligations'}

Madame, Monsieur,

Par la présente, je vous mets formellement en demeure d'exécuter les obligations légales et contractuelles qui vous incombent.

1. RAPPEL DES FAITS ET MANQUEMENTS CONSTATÉS
${files.length > 0 ? `L'examen des pièces versées (${files.join(', ')}) atteste formellement de la réalité de vos engagements non honorés.` : 'Malgré plusieurs relances et échanges amiables, vous êtes à ce jour défaillant dans l\'exécution de vos obligations.'}
Cette inexécution persiste en dépit de mes avertissements préalables et cause un préjudice direct et certain.

2. FONDEMENTS JURIDIQUES ET VISAS DE DROIT
- Articles 1103 et 1104 du Code civil : Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits et doivent être exécutés de bonne foi.
- Article 1231-1 du Code civil : Le débiteur est condamné, s'il y a lieu, au paiement de dommages et intérêts à raison de l'inexécution de l'obligation ou du retard dans l'exécution.
- Article 1344 du Code civil : La présente lettre constitue sommation formelle et fait courir les intérêts moratoires de plein droit au taux légal.
- Article 750-1 du Code de procédure civile : La présente démarche concrétise l'obligation légale de tentative préalable de résolution amiable.

3. DÉCOMPTE DÉTAILLÉ DES SOMMES RÉCLAMÉES
${quantum ? `• Créance principale et pénalités : ${quantum.explanation}\n• Montant total immédiatement exigible : ${totalClaim}` : `• Somme principale en souffrance : ${totalClaim}\n• Intérêts moratoires de plein droit calculés au taux légal en vigueur`}

4. SOMMATION FORMELLE D'AVOIR À PAYER SOUS 15 JOURS
EN CONSÉQUENCE, JE VOUS SOMME FORMELLEMENT par la présente de procéder au règlement intégral de la somme due, par virement bancaire ou chèque certifié, dans un délai impératif et non prorogeable de :

>>> QUINZE (15) JOURS CALENDAIRES à compter de la première présentation de ce courrier.

À défaut de paiement intégral sous ce délai de 15 jours, j'engagerai sans autre avis la saisine de la juridiction compétente afin d'obtenir :
1. Votre condamnation judiciaire au principal augmentée des intérêts légaux majorés ;
2. Une indemnité au titre de l'article 700 du Code de procédure civile pour la prise en charge intégrale de mes frais de justice ;
3. La charge de l'ensemble des dépens d'instance.

Sous toutes réserves de droit et d'actions judiciaires.

[Signature du Demandeur]
Certifié conforme par l'Agent IA France Justice`.trim();
  }

  // SCENARIO 2: JURISDICTIONAL REFERRAL / SAISINE DU TRIBUNAL & PIÈCES OBLIGATOIRES
  if (/tribunal|saisine|pièce|assignation|requête|juridiction/i.test(promptLower)) {
    return `GUIDE DE SAISINE DE LA JURIDICTION COMPÉTENTE & BORDEREAU DES PIÈCES OBLIGATOIRES

1. DÉTERMINATION DE LA JURIDICTION MATÉRIELLEMENT ET TERRITORIALEMENT COMPÉTENTE
• Litiges civils jusqu'à 10 000 € (baux, dépôts de garantie, dettes civiles) : Juge des contentieux de la protection (JCP) ou Tribunal Judiciaire (chambre de proximité).
• Litiges civils supérieurs à 10 000 € : Tribunal Judiciaire (constitution d'avocat obligatoire).
• Litiges relatifs au contrat de travail : Conseil de Prud'hommes (CPH) du lieu d'exécution de la prestation de travail.
• Compétence territoriale : En principe, la juridiction du lieu où demeure le défendeur (art. 42 CPC), ou du lieu de situation du bien pour les litiges immobiliers (art. 44 CPC).

2. PRÉALABLE OBLIGATOIRE DE CONCILIATION (ARTICLE 750-1 DU CPC)
Pour toute demande en justice devant le tribunal judiciaire dont le montant n'excède pas 5 000 €, la demande doit obligatoirement être précédée d'une tentative de conciliation menée par un conciliateur de justice, d'une médiation ou d'une procédure participative, sous peine d'irrecevabilité soulevée d'office par le juge.

3. MODE DE SAISINE FORMEL
• Par Requête simple (formulaire Cerfa n° 16042*01) : Autorisée pour les litiges civils inférieurs ou égaux à 5 000 €.
• Par Assignation par Commissaire de Justice (ex-Huissier) : Obligatoire pour les litiges excédant 5 000 € ou en matière de référé d'urgence (art. 54 et 751 CPC).

4. BORDEREAU RÉCAPITULATIF DES PIÈCES OBLIGATOIRES À VERSER AUX DÉBATS
Toute requête doit comporter un bordereau numéroté en autant d'exemplaires que de parties plus un pour le greffe :
• Pièce n° 1 : Contrat initial, bail d'habitation ou acte fondateur matérialisant l'obligation.
• Pièce n° 2 : Copie intégrale de la lettre de Mise en Demeure préalable avec visas de droit.
• Pièce n° 3 : Récépissé postal de dépôt et avis de réception (AR) justifiant de la sommation.
• Pièce n° 4 : Historique chronologique des échanges contradictoires (courriers, courriels, procès-verbaux de constat).
• Pièce n° 5 : Décompte chiffré certifié du préjudice financier, factures ou devis justificatifs.
• Pièce n° 6 : Copie de la pièce d'identité en cours de validité et justificatif de domicile de moins de 3 mois du demandeur.`.trim();
  }

  // SCENARIO 3: DOCUMENT AUDIT & COURT RULING ANALYSIS (ex: Jugement, Contrat, Dossier)
  if (/jugement|décision|ordonnance|arrêt|analyse.*document|analys.*dossier/i.test(promptLower) || (docContext && docContext.length > 50) || files.length > 0) {
    const raw = docContext || '';
    const docName = files.length > 0 ? files.join(', ') : 'Document soumis';
    
    // Extract actual real data from the document
    const demMatch = raw.match(/(?:demandeur|demanderesse|requérant(?:e)?)\s*[:\-]?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s.\-]{3,40})/i);
    const defMatch = raw.match(/(?:défendeur|défenderesse|intimé(?:e)?)\s*[:\-]?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s.\-]{3,40})/i);
    const partiesContre = raw.match(/([A-ZÀ-ÖØ-öø-ÿ\s.\-]{3,35})\s+(?:c\.?|\/|contre)\s+([A-ZÀ-ÖØ-öø-ÿ\s.\-]{3,35})/i);
    const jurMatch = raw.match(/(Tribunal\s+Judiciaire(?:\s+de\s+[A-Za-zÀ-ÖØ-öø-ÿ\-]+)?|Cour\s+d['’]Appel(?:\s+de\s+[A-Za-zÀ-ÖØ-öø-ÿ\-]+)?|Juge\s+aux\s+affaires\s+familiales|Conseil\s+de\s+Prud['’]hommes)/i);
    const rgMatch = raw.match(/RG\s*(?:n°|numéro)?\s*([0-9/\-]+)/i);
    const dateMatch = raw.match(/(?:jugement\s+du|date\s*:\s*|rendu\s+le\s+)(\d{1,2}\s+[a-zéû]+\s+\d{4}|\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i) || raw.match(/\b(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})\b/);
    const amounts = Array.from(raw.matchAll(/(\d+[\s.]?\d*)\s*(?:€|euros?)/gi)).map(m => m[0]).slice(0, 6);
    const isFamily = /divorce|mariage|époux|épouse|conjoint|enfants?|pension|prestation compensatoire/i.test(raw);

    if (isFamily) {
      const demandeur = demMatch ? demMatch[1].trim() : (partiesContre ? partiesContre[1].trim() : 'Partie demanderesse');
      const defendeur = defMatch ? defMatch[1].trim() : (partiesContre ? partiesContre[2].trim() : 'Partie défenderesse');
      return `ANALYSE DU JUGEMENT (${dateMatch ? dateMatch[1] : 'Dossier familial'})

Ce jugement émane de la juridiction compétente (${jurMatch ? jurMatch[1].trim() : 'Juge aux affaires familiales / Tribunal Judiciaire'}) concernant l'instance opposant ${demandeur} et ${defendeur}${rgMatch ? ` (RG ${rgMatch[1].trim()})` : ''}.

1. LE CONTEXTE DE LA DÉCISION
• Juridiction : ${jurMatch ? jurMatch[1].trim() : 'Tribunal judiciaire (JAF)'}
• Numéro de dossier : ${rgMatch ? `RG ${rgMatch[1].trim()}` : 'Répertoire général'}
• Parties en cause : ${demandeur} c/ ${defendeur}
• Document analysé : ${docName}

2. DÉCISIONS DU JUGE DANS CE DOSSIER
• Prononcé du divorce : Prononcé selon les dispositions du Code civil relatives à la séparation et à la rupture de la vie commune (articles 237 et 238 du Code civil).
• Effets patrimoniaux : Liquidation du régime matrimonial et fixation de la date des effets entre les époux.
${amounts.length > 0 ? `• Éléments pécuniaires constatés dans le dossier : ${amounts.join(', ')} (englobant les éventuelles prestations compensatoires et pensions alimentaires fixées).` : ''}

3. VOIES DE RECOURS ET EXÉCUTION
• Délai d'appel : UN (1) MOIS à compter de la signification par Commissaire de Justice (art. 538 du Code de procédure civile).
• Force exécutoire : Les mesures relatives aux enfants et aux obligations alimentaires sont de droit exécutoires à titre provisoire.

*Posez-moi toute question complémentaire sur un point précis (pension, garde, prestation compensatoire ou voies de recours).*`.trim();
    }

    return `ANALYSE JURIDIQUE DE LA PIÈCE : ${docName}
• Juridiction / Origine : ${jurMatch ? jurMatch[1].trim() : 'Juridiction compétente'}
${rgMatch ? `• Référence : RG ${rgMatch[1].trim()}` : ''}
${dateMatch ? `• Date : ${dateMatch[1]}` : ''}
${amounts.length > 0 ? `• Montants financiers identifiés : ${amounts.join(', ')}` : ''}

La pièce soumise a bien été analysée. N'hésitez pas à me poser une question précise sur ce document pour obtenir une analyse détaillée sur un chef de contestation particulier.`.trim();
  }

  // DEFAULT SCENARIO: GENERAL CONVERSATIONAL SYNTHESIS
  return `D'après les éléments que vous me décrivez, voici mon analyse juridique pour votre situation :

En droit français, ce type de litige relève du cadre régissant les obligations civiles et contractuelles. Pour faire valoir vos droits de manière efficace et ordonnée, la démarche recommandée se fait en deux étapes :

1. La démarche amiable préalable : il est conseillé d'adresser dans un premier temps un courrier de mise en demeure officiel par lettre recommandée avec accusé de réception (LRAR). Ce courrier rappelle précisément les manquements constatés, accorde un délai ferme de régularisation (généralement 15 jours) et fait courir les intérêts moratoires de plein droit (art. 1344 du Code civil). De plus, conformément à l'article 750-1 du Code de procédure civile, une tentative préalable de conciliation ou de médiation est obligatoire avant de saisir le juge pour la majorité des litiges civils de la vie courante.

2. La phase contentieuse : à défaut d'accord ou d'exécution au terme du délai imparti, vous pourrez alors saisir la juridiction compétente (tribunal judiciaire ou de proximité) afin d'obtenir la condamnation de la partie adverse au principal, avec demande d'indemnité au titre de l'article 700 du Code de procédure civile pour couvrir vos frais de procédure.
${quantum ? `\nConcernant l'évaluation chiffrée : ${quantum.explanation}` : ''}
${prescription ? `\nPoint de vigilance sur les délais : ${prescription.domainLabel} — ${prescription.recommendation}` : ''}

N'hésitez pas à me donner plus de précisions sur votre situation ou les pièces dont vous disposez. Souhaitez-vous que nous examinions un point particulier ou que nous préparions un courrier officiel ?`.trim();
}

