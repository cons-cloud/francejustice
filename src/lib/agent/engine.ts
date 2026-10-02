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
import { chatWithAI } from '../gemini';
import { getStoredApiKeys } from './threadManager';

interface RunAgentOptions {
  threadId: string;
  userPrompt: string;
  historyMessages: AgentMessage[];
  modelId: string;
  personaId: string;
  customSystemPrompt?: string;
  attachedFileNames?: string[];
  extractedText?: string;
  userApiKeys?: UserApiKeys;
  onStepUpdate?: (step: AgentRunStep) => void;
  onRunStatusChange?: (run: AgentRun) => void;
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
    customSystemPrompt,
    attachedFileNames = [],
    extractedText = '',
    userApiKeys,
    onStepUpdate,
    onRunStatusChange
  } = options;

  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === modelId) || AVAILABLE_MODELS[0];
  const selectedPersona = AGENT_PERSONAS.find(p => p.id === personaId) || AGENT_PERSONAS[0];
  
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

  const baseSystemPrompt = customSystemPrompt?.trim() || selectedPersona.systemPrompt;
  const effectiveSystemPrompt = `${baseSystemPrompt}\n\n[MANDAT LINGUISTIQUE: ${languageDirective}]`;

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

    // 3. Contract / Abusive clauses
    const hasContrat = /clause|contrat|déséquilibre|résiliation|pénalité/i.test(queryLower);
    if (hasContrat && !toolsToCall.some(t => t.name === 'search_legal_codes')) {
      toolsToCall.push({ name: 'search_legal_codes', input: { query: '1171', code: 'civil' } });
    }

    // 4. Document inspection only if files are attached AND user is asking about them
    if ((attachedFileNames.length > 0 || extractedText.length > 100)
        && /analys|vérifi|exam|décortiq|litige|clause|que dit|contenu/i.test(queryLower)) {
      toolsToCall.push({
        name: 'inspect_dossier_documents',
        input: { documentNames: attachedFileNames, focusArea: 'clauses et obligations' }
      });
    }

    // 5. Jurisprudence only if complex legal dispute
    if (toolsToCall.length > 0) {
      toolsToCall.push({
        name: 'search_jurisprudence_doctrine',
        input: { topic: /licenciement|salaire/.test(queryLower) ? 'licenciement' : /caution|bail/.test(queryLower) ? 'caution' : 'clause_abusive' }
      });
    }

    // 6. Mise en demeure — only on explicit request
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

=== RÉSULTATS DES OUTILS EXÉCUTÉS PAR L'AGENT DANS CE RUN ===
${toolResultsContext || 'Aucun outil externe requis.'}

${extractedText ? `=== PIÈCES DU DOSSIER FOURNIES ===\n${extractedText.substring(0, 15000)}` : ''}

=== DEMANDE DE L'UTILISATEUR ===
${userPrompt}

RÈGLES D'AFFICHAGE ET DE RIGUEUR :
- SI L'UTILISATEUR DEMANDE EXPLICITEMENT DE RÉDIGER UN DOCUMENT (mise en demeure, contrat, bail, avenant, lettre de contestation, assignation, protocole d'accord, conclusions, etc.) : Rédigez l'acte INTÉGRALEMENT, in extenso, avec toutes les mentions légales obligatoires, les visas d'articles, les montants en €, les délais fermes et les crochets de personnalisation [Nom, Adresse, Date...].
- SI L'UTILISATEUR POSE UNE QUESTION DE CONSEIL, D'ORIENTATION OU CONVERSATIONNELLE : Répondez directement et clairement en conseiller juridique expert. Pas de document formel. Pas de mise en demeure. Juste une réponse claire, structurée, avec vos recommandations concrètes et les options disponibles.
- SI DES DOCUMENTS OU DOSSIERS SONT JOINTS ET QUE L'UTILISATEUR DEMANDE DE LES ANALYSER : Décortiquez-les méticuleusement. Citez les clauses exactes, relevez les contradictions.
- Intégrez fidèlement les résultats chiffrés des outils (articles de lois exacts, montants calculés en €) uniquement si pertinents.
- N'insérez jamais de balises markdown # ou ## orphelines.
- ${languageDirective}
`.trim();

  let generatedText = '';
  let sourcesWeb: any[] = [
    {
      title: 'Légifrance - Le service public de la diffusion du droit',
      uri: 'https://www.legifrance.gouv.fr',
      category: 'officiel',
      badge: 'Portail Officiel',
      description: 'Codes officiels, lois et décrets de la République française en vigueur.'
    },
    {
      title: 'Cour de cassation - Jurisprudence de référence',
      uri: 'https://www.courdecassation.fr',
      category: 'juridiction',
      badge: 'Haute Juridiction',
      description: 'Arrêts de principe des chambres civiles, sociale, commerciale et criminelle.'
    }
  ];

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
    // 6. Clean up redundant horizontal dividers and trim
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

  // 1. Google Gemini (Client override if custom key provided)
  if (isInvalidText(generatedText) && (selectedModel.provider === 'google' || (selectedModel.provider === 'francejustice' && effectiveGeminiKey)) && effectiveGeminiKey) {
    try {
      const geminiModel = selectedModel.id === 'gemini-1.5-pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${effectiveGeminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: fullPromptForLLM }] }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 3000,
              topP: 0.95
            }
          })
        }
      );

      if (res.ok) {
        const data = await res.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!isInvalidText(candidate)) {
          generatedText = cleanAgentOutput(candidate);
        }
      }
    } catch (e) {
      console.warn("Direct Gemini LLM call failed in agent:", e);
    }
  }

  // 2. OpenAI with custom API key (or France Justice auto fallback to GPT-4o)
  if (isInvalidText(generatedText) && (selectedModel.provider === 'openai' || selectedModel.provider === 'francejustice' || effectiveOpenAIKey) && effectiveOpenAIKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveOpenAIKey}`
        },
        body: JSON.stringify({
          model: selectedModel.defaultModelName && selectedModel.provider === 'openai' ? selectedModel.defaultModelName : 'gpt-4o',
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
      console.warn("OpenAI API call error:", e);
    }
  }

  // 3. Anthropic Claude with custom API key (or France Justice auto fallback to Claude 3.5 Sonnet)
  if (isInvalidText(generatedText) && (selectedModel.provider === 'anthropic' || selectedModel.provider === 'francejustice' || effectiveAnthropicKey) && effectiveAnthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': effectiveAnthropicKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: selectedModel.defaultModelName && selectedModel.provider === 'anthropic' ? selectedModel.defaultModelName : 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
          system: effectiveSystemPrompt,
          messages: [{ role: 'user', content: fullPromptForLLM }]
        })
      });
      if (res.ok) {
        const json = await res.json();
        const candidate = json?.content?.[0]?.text;
        if (!isInvalidText(candidate)) {
          generatedText = cleanAgentOutput(candidate);
        }
      }
    } catch (e) {
      console.warn("Anthropic Claude API call error:", e);
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

  // STEP 6: RUN COMPLETED
  run.completedAt = new Date().toISOString();
  addStep('completed', 'Run exécuté avec succès', `Analyse complète générée avec ${executedToolCalls.length} outil(s) mobilisé(s).`);

  const assistantMessage: AgentMessage = {
    id: `msg_${Date.now()}_assistant`,
    role: 'assistant',
    content: generatedText,
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    run,
    toolCalls: executedToolCalls,
    sources: sourcesWeb,
    suggestions: isConversationalOrAdvice ? [
      'Litige droit du travail & Licenciement',
      'Litige de bail ou caution non restituée',
      'Contestation de facture ou contrat',
      'Divorce ou droit de la famille'
    ] : (/jugement|ordonnance|décision|decision|arrêt|arret/i.test(userPrompt + ' ' + attachedFileNames.join(' ')) ? [
      'Comment obtenir la formule exécutoire',
      'Calculer le délai d\'appel précis',
      'Procédure d\'exécution forcée (saisies)'
    ] : [
      'Générer la mise en demeure formelle en PDF',
      'Calculer les délais de forclusion précis',
      'Vérifier la compétence du tribunal'
    ]),
    automations: isConversationalOrAdvice ? [] : (/jugement|ordonnance|décision|decision|arrêt|arret/i.test(userPrompt + ' ' + attachedFileNames.join(' ')) ? [
      {
        id: 'auto_signification',
        label: 'Signification par Commissaire de Justice',
        description: 'Faire signifier la décision par huissier pour faire courir les délais d\'appel et exécuter.',
        actionPrompt: 'Expliquez la procédure pour faire signifier ce jugement par un Commissaire de Justice et faire courir le délai d\'appel.'
      },
      {
        id: 'auto_recours',
        label: 'Calculer le délai d\'appel & Voies de recours',
        description: 'Vérifier si le délai d\'appel est de 1 mois ou 15 jours et la cour d\'appel compétente.',
        actionPrompt: 'Quelles sont les voies de recours et le délai exact d\'appel contre cette décision de justice ?'
      }
    ] : [
      {
        id: 'auto_mise_en_demeure',
        label: 'Rédiger la Mise en Demeure',
        description: 'Génère un projet de lettre recommandée avec AR sommant d\'exécuter sous 15 jours.',
        actionPrompt: 'Rédigez la mise en demeure formelle intégrale avec sommation sous 15 jours, visas des articles et calcul des sommes réclamées.'
      },
      {
        id: 'auto_saisine',
        label: 'Préparer la saisine du Tribunal',
        description: 'Formalisme de la requête en justice ou tentative préalable de conciliation obligatoire.',
        actionPrompt: 'Expliquez comment saisir le tribunal compétent et quelles sont les pièces obligatoires à joindre pour prouver le préjudice.'
      }
    ])
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
  if (/jugement|décision|ordonnance|arrêt|analyse.*document|analys.*dossier/i.test(promptLower) || files.length > 0) {
    const docName = files.length > 0 ? files.join(', ') : 'Dossier / Décision de justice';
    return `RAPPORT D'ANALYSE JURIDIQUE APPROFONDIE & AUDIT DU DOSSIER
Document analysé : ${docName}

1. QUALIFICATION DE L'ACTE & CADRE JURIDIQUE
La pièce soumise à l'Agent IA constitue un acte juridictionnel officiel (décision de justice contradictoire) régi par le Code de procédure civile et le Code civil.
• Nature de l'acte : Décision juridictionnelle de premier ressort tranchant les prétentions des parties.
• Force probante : Acte authentique doté de l'autorité de la chose jugée au principal et valant titre exécutoire dès apposition de la formule exécutoire.

2. EXAMEN DU DISPOSITIF & DES CONDAMNATIONS ("PAR CES MOTIFS")
Le dispositif d'une décision est la seule partie dotée de la force exécutoire et de l'autorité de la chose jugée (art. 1355 Code civil) :
• Condamnation principale : Fixation des sommes ou obligations mises à la charge de la partie défaillante.
• Intérêts moratoires : Courants au taux légal en vigueur à compter de la mise en demeure ou de l'assignation.
• Article 700 du Code de procédure civile : Indemnité forfaitaire allouée pour couvrir les frais de justice non compris dans les dépens.
• Dépens d'instance : Frais de procédure et d'actes d'huissier mis à la charge de la partie succombante (art. 696 CPC).
• Exécution provisoire : En application de l'article 514 du CPC, les décisions de première instance sont de droit exécutoires à titre provisoire, sauf si le juge l'a expressément écartée.

3. DÉLAIS ET VOIES DE RECOURS
• Délai d'appel de droit commun : UN (1) MOIS à compter de la signification par Commissaire de Justice (art. 538 CPC).
• Délai d'appel en matière de référé : QUINZE (15) JOURS à compter de la signification (art. 490 CPC).
• Point de départ du délai : La simple lecture ou réception postale ne fait pas courir le délai d'appel ; seule la signification par acte de Commissaire de Justice fait courir le délai légal (art. 503 CPC).

4. PROCÉDURE D'EXÉCUTION FORCÉE ET RECOUVREMENT
1. Obtenir la copie exécutoire auprès du greffe (revêtue de la formule exécutoire officielle).
2. Mandater un Commissaire de Justice (Huissier) compétent dans le ressort de la cour d'appel pour signifier la décision.
3. À défaut de paiement sous 8 jours après commandement de payer, mise en œuvre des voies d'exécution forcée : saisie-attribution bancaire, saisie des rémunérations, ou saisie des biens meubles corporels.`.trim();
  }

  // DEFAULT SCENARIO: GENERAL LEGAL SYNTHESIS WITH QUANTUM & PRESCRIPTION
  return `1. SYNTHÈSE DU DOSSIER & QUALIFICATION JURIDIQUE
D'après l'analyse détaillée des faits et des éléments communiqués, la situation relève du cadre juridique encadrant les obligations civiles et contractuelles en droit français.
${files.length > 0 ? `Les pièces examinées (${files.join(', ')}) confirment la matérialité des échanges et les obligations respectives des parties.` : ''}

2. ANALYSE JURIDIQUE APPROFONDIE & FONDEMENTS DE DROIT
${codeResult && codeResult.articles?.length > 0 ? `Les textes officiels directement applicables sont :
${codeResult.articles.map((a: any) => `• **${a.article} du ${a.code}** : *${a.title}*\n${a.content}`).join('\n\n')}` : `• **Articles 1103 et 1104 du Code civil** : Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits et doivent être exécutés de bonne foi.\n• **Article 1344 du Code civil** : Constitution formelle en demeure du débiteur défaillant.`}

${quantum ? `3. ÉVALUATION FINANCIÈRE & QUANTUM DES PRÉJUDICES CALCULÉS PAR L'AGENT
${quantum.explanation}` : ''}

${prescription ? `4. VÉRIFICATION DES DÉLAIS DE PRESCRIPTION & FORCLUSION
• **Règle** : ${prescription.domainLabel} (${prescription.legalArticle})
• **Date butoir calculée** : ${prescription.deadlineDate} (${prescription.daysRemaining} jours restants)
• **Préconisation** : ${prescription.recommendation}` : ''}

5. PLAN D'ACTION STRATÉGIQUE & RECOMMANDATIONS ÉTAPE PAR ÉTAPE
• **Étape 1 (Phase amiable impérative)** : Adresser une mise en demeure formelle par Lettre Recommandée avec Accusé de Réception (LRAR), accordant un délai ferme de 15 jours calendaires pour régulariser.
• **Étape 2 (Tentative de règlement amiable préalable)** : Conformément à l'article 750-1 du Code de procédure civile, pour les litiges civils inférieurs à 5 000 €, une tentative de conciliation ou médiation est obligatoire avant toute assignation.
• **Étape 3 (Voie contentieuse)** : À défaut de règlement à l'issue du délai, saisine de la juridiction compétente en sollicitant la condamnation au principal, les intérêts moratoires de plein droit, ainsi qu'une indemnité au titre de l'article 700 du CPC pour compenser vos frais engagés.`.trim();
}

