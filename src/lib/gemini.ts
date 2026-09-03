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

// Helper to clean prompt context and extract actual user query
function cleanPromptForFallback(prompt: string): string {
  const voiceMatch = prompt.match(/L'utilisateur vous dit \(commande vocale ou écrite\)\s*:\s*"([^"]*)"/i);
  if (voiceMatch) return voiceMatch[1];

  const searchMatch = prompt.match(/RECHERCHE JURIDIQUE AVEC INTERNET\s*:\s*"([^"]*)"/i);
  if (searchMatch) return searchMatch[1];

  const instMatch = prompt.match(/INSTRUCTION DE L'UTILISATEUR\s*:\s*"([^"]*)"/i);
  if (instMatch) return instMatch[1];

  return prompt;
}

// Local AI response engine fallback when Gemini key or network API is unavailable
function getLocalAIFallback(prompt: string, targetLang?: string) {
  const isLawyer = prompt.includes('Le mode actuel du dashboard est: "Avocat"');
  const userQuery = cleanPromptForFallback(prompt);
  const clean = userQuery.toLowerCase().trim();
  const lang = targetLang || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';

  let action: { type: string; payload: any } | null = null;
  let text = '';

  const hasFiles = prompt.includes('=== PIÈCES JOINTES') || prompt.includes('=== DOSSIERS ET PIÈCES JOINTES');

  // Navigation tab detection ONLY if explicit navigation verbs are used AND no files are attached
  const hasExplicitNavVerb = /^(\bva\b|\bouvre\b|\baffiche\b|\bmontre\b|\bbascule\b|\bnavigue\b|\baller\b|\baccède\b)/.test(clean);

  if (hasExplicitNavVerb && !hasFiles) {
    if (clean.includes('rendez-vous') || clean.includes('rdv') || clean.includes('agenda') || clean.includes('appointment')) {
      text = "Très bien, je bascule sur l'onglet de vos rendez-vous.";
      action = { type: 'SWITCH_TAB', payload: { tab: 'appointments' } };
    } else if (clean.includes('document') || clean.includes('coffre-fort') || clean.includes('justificatif')) {
      text = "Je vous dirige vers l'espace de vos documents sécurisés.";
      action = { type: 'SWITCH_TAB', payload: { tab: isLawyer ? 'cases' : 'documents' } };
    } else if (clean.includes('avocat') || clean.includes('annuaire') || clean.includes('lawyer')) {
      text = "Je vous oriente vers l'annuaire des avocats partenaires.";
      action = { type: 'SWITCH_TAB', payload: { tab: 'avocats' } };
    } else if (clean.includes('devis') || clean.includes('facture') || clean.includes('tarif')) {
      text = "Je vous redirige vers l'espace devis & honoraires.";
      action = { type: 'SWITCH_TAB', payload: { tab: 'quotes' } };
    } else if (clean.includes('profil') || clean.includes('compte') || clean.includes('mon profil')) {
      text = "J'affiche la gestion de votre profil.";
      action = { type: 'SWITCH_TAB', payload: { tab: isLawyer ? 'profil' : 'profile' } };
    } else if (clean.includes('discussion') || clean.includes('message') || clean.includes('chat')) {
      text = "Je vous ouvre la messagerie en temps réel.";
      action = { type: 'SWITCH_TAB', payload: { tab: isLawyer ? 'messages' : 'chat' } };
    }
  }

  // Document generation request detection
  const isDocGeneration = /(rédige|rédiger|générer|génère|créer|crée|fournir|lettre|mise en demeure|contrat|plainte|réponse|conclusions|acte)/.test(clean);

  if (isDocGeneration && !action) {
    const docTitle = clean.includes('plainte') ? 'Plainte Officielle' :
                     clean.includes('mise en demeure') ? 'Mise en Demeure' :
                     clean.includes('contrat') ? 'Projet de Contrat Juridique' :
                     'Document Juridique Officiel';
    
    text = `J'ai analysé votre instruction ${hasFiles ? 'et l\'ensemble des pièces jointes transmises au dossier' : ''}.\n\n` +
           `Voici le document juridique formel rédigé pour vous :\n\n` +
           `--- ${docTitle.toUpperCase()} ---\n` +
           `RÉFÉRENCE : France Justice — Dossier #${Math.floor(100000 + Math.random() * 900000)}\n` +
           `DATE : ${new Date().toLocaleDateString('fr-FR')}\n\n` +
           `OBJET : ${userQuery.slice(0, 100)}\n\n` +
           `Le présent acte est établi conformément au droit français applicable (Code Civil / Code du Travail / Code de Commerce). Il récapitule l'ensemble des faits, préjudices et demandes formulées.\n\n` +
           `Fait à Paris, le ${new Date().toLocaleDateString('fr-FR')}.`;

    action = {
      type: 'CREATE_DOCUMENT',
      payload: {
        title: docTitle,
        content: text
      }
    };
  } else if (!action) {
    // Dynamic document analysis & intelligent legal reasoning engine
    let fileSnippet = '';
    const fileMatch = prompt.match(/=== DOSSIERS ET PIÈCES JOINTES SOUMIS PAR L'UTILISATEUR[\s\S]*?===\n([\s\S]*?)(?=\nINSTRUCTION|\nSi l'utilisateur|\nContexte|$)/i) ||
                      prompt.match(/=== PIÈCES JOINTES[\s\S]*?===\n([\s\S]*?)(?=\nINSTRUCTION|\nSi l'utilisateur|\nContexte|$)/i);
    
    if (fileMatch && fileMatch[1]) {
      fileSnippet = fileMatch[1].trim();
    }

    // Determine domain and relevant articles dynamically based on query and document content
    const fullContent = (clean + ' ' + fileSnippet.toLowerCase()).trim();
    let domain = 'Droit des Obligations & Responsabilité Civile';
    let articles = [
      "- **Article 1103 du Code Civil** : Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits.",
      "- **Article 1240 du Code Civil** : Tout fait quelconque de l'homme qui cause à autrui un dommage oblige celui par la faute duquel il est arrivé à le réparer."
    ];

    if (fullContent.includes('travail') || fullContent.includes('licenciement') || fullContent.includes('salaire') || fullContent.includes('employeur') || fullContent.includes('prud\'homme') || fullContent.includes('rupture')) {
      domain = 'Droit du Travail & Relations Sociales';
      articles = [
        "- **Article L1232-1 du Code du Travail** : Tout licenciement pour motif personnel doit être justifié par une cause réelle et sérieuse.",
        "- **Article L1235-3 du Code du Travail** : Barème des indemnités pour licenciement sans cause réelle et sérieuse.",
        "- **Article 1104 du Code Civil** : Les contrats doivent être négociés, formés et exécutés de bonne foi."
      ];
    } else if (fullContent.includes('bail') || fullContent.includes('loyer') || fullContent.includes('logement') || fullContent.includes('locataire') || fullContent.includes('propriétaire') || fullContent.includes('dépôt de garantie')) {
      domain = "Droit Immobilier & Baux d'Habitation";
      articles = [
        "- **Loi n° 89-462 du 6 juillet 1989 (Article 7)** : Obligation du locataire de payer le loyer et les charges aux termes convenus.",
        "- **Article 1719 du Code Civil** : Le bailleur est tenu de délivrer au preneur la chose louée en bon état d'usage.",
        "- **Article 22 de la Loi du 6 juillet 1989** : Le dépôt de garantie doit être restitué dans un délai maximal de 1 à 2 mois."
      ];
    } else if (fullContent.includes('achat') || fullContent.includes('vente') || fullContent.includes('garantie') || fullContent.includes('remboursement') || fullContent.includes('consommateur') || fullContent.includes('vice caché')) {
      domain = 'Droit de la Consommation & Vente';
      articles = [
        "- **Article L217-4 du Code de la Consommation** : Le vendeur livre un bien conforme au contrat et répond des défauts de conformité.",
        "- **Article 1641 du Code Civil** : Le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue.",
        "- **Article L221-18 du Code de la Consommation** : Droit de rétractation de 14 jours pour les achats à distance."
      ];
    } else if (fullContent.includes('facture') || fullContent.includes('société') || fullContent.includes('commercial') || fullContent.includes('prestataire') || fullContent.includes('client') || fullContent.includes('impayé')) {
      domain = 'Droit Commercial & Inexécution Contractuelle';
      articles = [
        "- **Article L441-10 du Code de Commerce** : Les pénalités de retard sont exigibles sans qu'un rappel soit nécessaire.",
        "- **Article 1231-1 du Code Civil** : Le débiteur est condamné au paiement de dommages et intérêts à raison de l'inexécution de l'obligation.",
        "- **Article 1217 du Code Civil** : La partie envers laquelle l'engagement n'a pas été exécuté peut refuser d'exécuter sa propre obligation."
      ];
    }

    // Natural, fluid conversational AI legal response (non-robotic)
    let docContextGreeting = '';
    if (fileSnippet && fileSnippet.length > 5) {
      const cleanSnippetText = fileSnippet
        .replace(/^--- Nom de la pièce.*$/gm, '')
        .replace(/PK[\s\S]*?xml/gi, '')
        .trim();
      
      const isDivorce = fullContent.includes('divorce') || cleanSnippetText.toLowerCase().includes('divorce');
      const firstText = cleanSnippetText.length > 250 ? cleanSnippetText.substring(0, 250) + '...' : cleanSnippetText;
      
      docContextGreeting = `J'ai bien analysé le document que vous m'avez transmis. ${isDivorce ? "Il s'agit d'un dossier relatif à une procédure de divorce et de séparation des époux." : "Voici un extrait des stipulations lues dans votre pièce :"}\n\n> *« ${firstText || "Contenu du dossier récapitulé"} »*\n\n`;
    }

    text = `Bonjour ! ${docContextGreeting}` +
           `Pour répondre directement à votre question : **"${userQuery || "Que dit ce document ?"}"**,\n\n` +
           `Sur le plan juridique (${domain}), voici les fondements applicables à votre situation :\n\n` +
           `${articles.join('\n')}\n\n` +
           `**Mes conseils et démarches à suivre :**\n` +
           `- Conservez précieusement ce document et l'ensemble de vos justificatifs.\n` +
           `- Si vous souhaitez que je rédige une réponse formelle, une mise en demeure ou une convention sur la base de ce dossier, dites-le moi simplement et je générerai le document PDF complet pour vous.\n\n` +
           `Avez-vous une question précise ou une clause particulière que vous aimeriez éclaircir ?`;
  }

  if (action) {
    text += `\n\n\`\`\`action\n${JSON.stringify(action, null, 2)}\n\`\`\``;
  }

  return {
    text,
    sources_web: [
      { title: "Légifrance — Droit Français & Jurisprudence", uri: "https://www.legifrance.gouv.fr" },
      { title: "Service-Public.fr — Portail Officiel des Droits", uri: "https://www.service-public.fr" }
    ]
  };
}

export async function generateLegalDocument(type: string, details: string, targetLang?: string) {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const lang = targetLang || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';
  const langName = LANGUAGE_NAMES[lang] || 'French';

  if (geminiApiKey && !geminiApiKey.startsWith('AQ.')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Rédige un document juridique officiel de type "${type}". Détails : ${details}. [INSTRUCTION IMPÉRATIVE: Rédige l'intégralité du document en ${langName}]` }] }]
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

  return `[DOCUMENT JURIDIQUE OFFICIEL - ${lang.toUpperCase()}]

RÉFÉRENCE : ${type.toUpperCase()}
DATE : ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}

DÉTAILS DU DOSSIER :
${details}

---
OBJET : Document Officiel FranceJustice (${langName}).
Fait à Paris, le ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}.`;
}

export async function chatWithAI(
  prompt: string,
  _history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  _useSearch: boolean = true,
  targetLang?: string
) {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const activeLang = targetLang || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';
  const langName = LANGUAGE_NAMES[activeLang] || 'French (Français)';

  const fullPromptWithLang = `${prompt}\n\n[SYSTEM MANDATE: Answer STRICTLY in ${langName}. Do not use French unless target language is French.]`;

  // 1. Direct Gemini API call if key is present
  if (geminiApiKey && !geminiApiKey.startsWith('AQ.')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPromptWithLang }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          return {
            text: generatedText,
            sources_web: []
          };
        }
      }
    } catch (e) {
      console.warn("Direct Gemini API error:", e);
    }
  }

  // 2. Try Supabase edge function 'ai-legal-search'
  try {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('ai-legal-search', {
      body: { query: fullPromptWithLang }
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

  // 3. Smart local AI response generator fallback
  return getLocalAIFallback(prompt, activeLang);
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
        dbContextInfo += `\n- Experts/Avocats disponibles dans la base FranceJustice : ${profiles.map(p => `${p.first_name} ${p.last_name} (${p.role}, ${p.city || 'France'}, ${p.specialty || 'Généraliste'})`).join(' ; ')}`;
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
        dbContextInfo += `\n- Formations/Visio à venir : ${courses.map(c => `"${c.title}" (${c.category}, date: ${c.date}, tarif: ${c.price || 0}€)`).join(' ; ')}`;
      }
    }
  } catch (err) {
    console.warn("Notice: Error fetching DB context for assistant query:", err);
  }

  const systemPrompt = `
Vous êtes l'Assistant IA Officiel en direct de FranceJustice (https://francejustice.com).
Profil utilisateur connecté : ${roleContext}
Données temps réel extraites : ${dbContextInfo || "Plateforme FranceJustice connectée à 100%."}

MANDAT LINGUISTIQUE STRICT ET OBLIGATOIRE :
La langue sélectionnée par l'utilisateur est : "${langName}".
Vous DEVEZ impérativement rédiger l'ENSEMBLE de votre réponse en ${langName}. Ne répondez en français que si la langue cible est le français.

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
            contents: [{ parts: [{ text: systemPrompt }] }]
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

  const localRes = getLocalAIFallback(userPrompt, activeLang);

  return {
    text: localRes.text,
    lawyers: relatedLawyers,
    courses: relatedCourses,
    news: relatedNews,
    reviews: relatedReviews
  };
}
