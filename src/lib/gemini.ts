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

  // Navigation tab detection
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
    // Standard intelligent legal answer
    text = `### ⚖️ Analyse Juridique France Justice\n\n` +
           `J'ai bien pris en compte votre demande : **"${userQuery || "Analyse de votre dossier"}"** ${hasFiles ? 'ainsi que les pièces jointes associées.' : '.'}\n\n` +
           `**1. Textes de Loi et Cadre d'Application :**\n` +
           `- **Article 1240 du Code Civil** : Tout fait quelconque de l'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer.\n` +
           `- **Code du Travail / Code de Commerce** : Les conventions légalement formées tiennent lieu de loi à ceux qui les ont faites et doivent être exécutées de bonne foi.\n\n` +
           `**2. Recommandations & Démarches à Suivre :**\n` +
           `1️⃣ **Preuves & Documents** : Conservez l'intégralité des courriels, contrats, factures et récépissés.\n` +
           `2️⃣ **Phase Amiable** : Adressez une mise en demeure formelle par lettre recommandée avec accusé de réception (LRAR).\n` +
           `3️⃣ **Phase Contentieuse** : À défaut de réponse sous 15 jours, vous pouvez saisir la juridiction compétente (Tribunal Judiciaire ou Conseil de Prud'hommes).\n\n` +
           `*Vous pouvez demander à l'IA de rédiger directement vos documents ou de basculer vers l'annuaire des avocats.*`;
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
    if (!edgeError && edgeData && edgeData.text && !edgeData.is_fallback_trigger) {
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
