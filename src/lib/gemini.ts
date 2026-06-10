import { supabase } from './supabase';

// Helper to clean prompt context and extract actual user query
function cleanPromptForFallback(prompt: string): string {
  // Extract user command if it is inside the VoiceAssistant prompt template
  const voiceMatch = prompt.match(/L'utilisateur vous dit \(commande vocale ou écrite\)\s*:\s*"([^"]*)"/i);
  if (voiceMatch) {
    return voiceMatch[1];
  }
  // Extract user command if it is inside the Search prompt template
  const searchMatch = prompt.match(/RECHERCHE JURIDIQUE AVEC INTERNET\s*:\s*"([^"]*)"/i);
  if (searchMatch) {
    return searchMatch[1];
  }
  return prompt;
}

// Local AI response fallback when Django backend is offline
function getLocalAIFallback(prompt: string) {
  const isLawyer = prompt.includes('Le mode actuel du dashboard est: "Avocat"');
  const clean = cleanPromptForFallback(prompt).toLowerCase();

  // -------------------------------------------------------------------------
  // ÉTAPE 1 — Détecter si c'est une QUESTION JURIDIQUE INFORMATIVE
  // Ces requêtes doivent être traitées par Gemini, pas par le routeur local.
  // Si le serveur est hors ligne, on retourne un message honnête SANS redirection.
  // -------------------------------------------------------------------------
  const isInformationalQuery = /(jurisprudence|arrêt|décision de justice|droit\s+(civil|pénal|travail|commercial|fiscal|européen|international)|article\s+\d|code\s+(civil|pénal|du travail|de commerce)|directive\s+\d|règlement\s+(ue|cee)|traité\s+de|convention\s+(europ|intern)|cjue|cedh|cour\s+de\s+justice|cour\s+europ|tribunal|expliqu|qu'est-ce|c'est quoi|comment\s+(fonctionne|faire|obtenir|calculer|demander|prouver|contester|annuler|résilier|divorcer|licencier)|qu[ea]lle[s]?\s+(sont|est)\s+|quels?\s+(sont|est)\s+|donnez?[-\s]moi|cite[rz]?|parlez?[-\s]moi|définition|définissez?|décris?|résumez?|analysez?|qu[ea]nd\s+(peut|faut|doit|est-ce)|existe[-\s]t[-\s]il|comment\s+prouver|quels?\s+recours|mes?\s+droits?|obligation[s]?\s+de|délai[s]?\s+de|prescription|indemnité|dommages?)/.test(clean);

  if (isInformationalQuery) {
    return {
      text: `⚠️ **Le serveur d'intelligence artificielle est temporairement indisponible.**

Votre question nécessite une analyse juridique approfondie que je ne peux pas fournir en mode hors-ligne. Le serveur Gemini qui alimente les réponses juridiques est momentanément inaccessible.

**Que pouvez-vous faire maintenant ?**
- 🔄 **Réessayez dans quelques instants** — le serveur se reconnecte automatiquement.
- 🔍 Utilisez l'onglet **"IA Juridique"** pour une recherche textuelle.
- 📚 Consultez l'onglet **"Codes de Loi"** pour parcourir les textes officiels français.
- 💬 Posez votre question directement à votre avocat via la **"Discussion"**.`,
      sources_web: []
    };
  }

  // -------------------------------------------------------------------------
  // ÉTAPE 2 — Commandes de NAVIGATION (routage local vers les onglets)
  // -------------------------------------------------------------------------
  let text = "Bonjour ! Je suis l'assistant Law Just de secours. Le serveur d'IA principal est hors ligne ou indisponible pour le moment. Que puis-je faire pour vous aider sur ce tableau de bord ?";
  let action: { type: string; payload: { tab?: string; query?: string; lawyer_id?: string; date?: string; time?: string; notes?: string; title?: string; content?: string } } | null = null;

  if (clean.includes('rendez-vous') || clean.includes('rdv') || clean.includes('agenda') || clean.includes('calendrier') || clean.includes('planning') || clean.includes('consultation')) {
    text = "Très bien, je bascule sur l'onglet de vos rendez-vous. Vous pouvez y planifier et suivre vos consultations.";
    action = { type: 'SWITCH_TAB', payload: { tab: 'appointments' } };
  } else if (clean.includes('document') || clean.includes('dossier') || clean.includes('coffre-fort') || clean.includes('pièce') || clean.includes('fichier') || clean.includes('justificatif')) {
    if (isLawyer) {
      text = "Je vous dirige vers l'espace de gestion de vos dossiers clients.";
      action = { type: 'SWITCH_TAB', payload: { tab: 'cases' } };
    } else {
      text = "Je vous dirige vers l'espace de vos documents sécurisés dans le coffre-fort.";
      action = { type: 'SWITCH_TAB', payload: { tab: 'documents' } };
    }
  } else if (clean.includes('avocat') || clean.includes('annuaire') || clean.includes('trouver') || clean.includes('confrère') || clean.includes('réseau')) {
    text = isLawyer
      ? "Je vous redirige vers votre réseau d'avocats."
      : "Je vous oriente vers l'annuaire des avocats de Law Just pour que vous puissiez trouver un avocat spécialisé.";
    action = { type: 'SWITCH_TAB', payload: { tab: 'avocats' } };
  } else if (clean.includes('profil') || clean.includes('compte') || clean.includes('biographie') || clean.includes('specialité') || clean.includes('mon compte') || clean.includes('paramètres')) {
    text = "J'affiche vos informations de profil.";
    action = { type: 'SWITCH_TAB', payload: { tab: isLawyer ? 'profil' : 'profile' } };
  } else if (clean.includes('générateur') || clean.includes('rédiger') || clean.includes('créer un document') || clean.includes('générer') || clean.includes('mise en demeure')) {
    if (isLawyer) {
      text = "Je vous bascule vers vos outils de rédaction et de simulation.";
      action = { type: 'SWITCH_TAB', payload: { tab: 'outils' } };
    } else {
      text = "Je vous dirige vers le générateur de documents juridiques.";
      action = { type: 'SWITCH_TAB', payload: { tab: 'generator' } };
    }
  } else if (clean.includes('devis') || clean.includes('facture') || clean.includes('tarif') || clean.includes('paiement') || clean.includes('argent') || clean.includes('compta') || clean.includes('billing')) {
    text = "Je vous redirige vers l'onglet de gestion des devis.";
    action = { type: 'SWITCH_TAB', payload: { tab: 'quotes' } };
  } else if (clean.includes('formation') || clean.includes('cours') || clean.includes('apprendre')) {
    text = "Je vous dirige vers l'espace des formations juridiques.";
    action = { type: 'SWITCH_TAB', payload: { tab: 'formations' } };
  } else if (clean.includes('outil') || clean.includes('simulateur') || clean.includes('calcul')) {
    if (isLawyer) {
      text = "Je vous dirige vers vos outils et simulateurs professionnels.";
      action = { type: 'SWITCH_TAB', payload: { tab: 'outils' } };
    }
  } else if (clean.includes('assistance') || clean.includes('support') || clean.includes('ticket')) {
    if (isLawyer) {
      text = "Je vous redirige vers l'assistance technique pour les avocats.";
      action = { type: 'SWITCH_TAB', payload: { tab: 'assistance' } };
    }
  } else if (clean.includes('discussion') || clean.includes('chat') || clean.includes('message') || clean.includes('messagerie') || clean.includes('échanges')) {
    text = "Je vous ouvre la messagerie en temps réel.";
    action = { type: 'SWITCH_TAB', payload: { tab: isLawyer ? 'messages' : 'chat' } };
  }

  if (action) {
    text += `\n\n\`\`\`action\n${JSON.stringify(action, null, 2)}\n\`\`\``;
  }

  return {
    text,
    sources_web: []
  };
}

// Local Document generation fallback when Django backend is offline
function getLocalDocumentFallback(type: string, details: string) {
  return `[DOCUMENT JURIDIQUE DE SECOURS - SERVEUR IA HORS LIGNE]

RÉFÉRENCE : ${type.toUpperCase()}
DATE : ${new Date().toLocaleDateString('fr-FR')}

DÉTAILS COMPLÉMENTAIRES :
${details}

---

OBJET : Mise en demeure / Requête officielle relative aux faits susmentionnés.

À l'attention des parties concernées,

Par la présente, il est rappelé les dispositions applicables en droit français relatives aux faits décrits ci-dessus. Tout manquement aux obligations contractuelles ou légales engage la responsabilité de son auteur conformément aux articles applicables du Code Civil.

Veuillez considérer cette notification comme valant mise en demeure formelle de régulariser la situation dans un délai de huit (8) jours à compter de la réception de la présente.

Fait à Paris, pour valoir ce que de droit.

[Signature de la partie requérante]`;
}

export async function chatWithAI(
  prompt: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  useSearch: boolean = true
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const response = await fetch('/api/ai/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prompt, history, use_search: useSearch })
    });

    if (!response.ok) {
      console.warn("Backend API returned status " + response.status + ". Using local AI fallback.");
      return getLocalAIFallback(prompt);
    }

    const data = await response.json();
    if (data.is_fallback_trigger) {
      console.warn("Backend API returned fallback trigger. Using local AI fallback. Error details: " + data.error);
      return getLocalAIFallback(prompt);
    }
    return {
      text: data.text,
      sources_web: data.sources_web || []
    };
  } catch (error: unknown) {
    console.warn("AI Chat API call failed. Using local fallback. Error:", error);
    return getLocalAIFallback(prompt);
  }
}

export async function generateLegalDocument(type: string, details: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const response = await fetch('/api/ai/generate-document/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, details })
    });

    if (!response.ok) {
      console.warn("Backend API returned status " + response.status + " for document generation. Using local fallback.");
      return getLocalDocumentFallback(type, details);
    }

    const data = await response.json();
    if (data.is_fallback_trigger) {
      console.warn("Backend API returned fallback trigger for document generation. Using local fallback. Error details: " + data.error);
      return getLocalDocumentFallback(type, details);
    }
    return data.text;
  } catch (error: unknown) {
    console.warn("AI Document API call failed. Using local fallback. Error:", error);
    return getLocalDocumentFallback(type, details);
  }
}

export async function analyzeAndSuggestActions() {
  // Simple suggestion fallback or we could add another proxy endpoint
  return null;
}

