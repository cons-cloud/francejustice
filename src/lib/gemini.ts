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
function getLocalAIFallback(prompt: string, targetLang?: string) {
  const isLawyer = prompt.includes('Le mode actuel du dashboard est: "Avocat"');
  const clean = cleanPromptForFallback(prompt).toLowerCase();
  const lang = targetLang || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'fr') || 'fr';

  const isInformationalQuery = /(jurisprudence|arrêt|décision de justice|droit\s+(civil|pénal|travail|commercial|fiscal|européen|international)|article\s+\d|code\s+(civil|pénal|du travail|de commerce)|directive\s+\d|règlement\s+(ue|cee)|traité\s+de|convention\s+(europ|intern)|cjue|cedh|cour\s+de\s+justice|cour\s+europ|tribunal|expliqu|qu'est-ce|c'est quoi|comment\s+(fonctionne|faire|obtenir|calculer|demander|prouver|contester|annuler|résilier|divorcer|licencier)|qu[ea]lle[s]?\s+(sont|est)\s+|quels?\s+(sont|est)\s+|donnez?[-\s]moi|cite[rz]?|parlez?[-\s]moi|définition|définissez?|décris?|résumez?|analysez?|qu[ea]nd\s+(peut|faut|doit|est-ce)|existe[-\s]t[-\s]il|comment\s+prouver|quels?\s+recours|mes?\s+droits?|obligation[s]?\s+de|délai[s]?\s+de|prescription|indemnité|dommages?)/.test(clean);

  if (isInformationalQuery) {
    if (lang === 'en') {
      return {
        text: `⚠️ **The AI server is temporarily unavailable.**\n\nYour question requires an in-depth legal analysis which cannot be provided offline. The Gemini AI engine is momentarily unreachable.\n\n**What can you do now?**\n- 🔄 Try again in a few moments.\n- 🔍 Use the **Legal AI** tab for textual search.\n- 📚 Consult the **Law Codes** section.\n- 💬 Message your lawyer directly via **Chat**.`,
        sources_web: []
      };
    }
    if (lang === 'es') {
      return {
        text: `⚠️ **El servidor de inteligencia artificial no está disponible temporalmente.**\n\nSu consulta requiere un análisis legal que no se puede realizar sin conexión. El motor de IA está momentáneamente inalcanzable.\n\n**¿Qué puede hacer ahora?**\n- 🔄 Vuelva a intentarlo en unos momentos.\n- 🔍 Use la pestaña **IA Legal**.\n- 📚 Consulte los **Códigos de Ley**.\n- 💬 Contacte a su abogado mediante **Chat**.`,
        sources_web: []
      };
    }
    if (lang === 'ar') {
      return {
        text: `⚠️ **خادم الذكاء الاصطناعي غير متصل حالياً.**\n\nسؤالك يتطلب تحليلاً قانونياً عميقاً لا يمكن توفيره دون اتصال بالإنترنت.\n\n**ماذا يمكنك أن تفعل الآن؟**\n- 🔄 أعد المحاولة بعد لحظات.\n- 🔍 استخدم تبويب **الذكاء الاصطناعي القانوني**.\n- 📚 تصفح **رموز القوانين**.\n- 💬 تواصل مع محاميك عبر **المحادثة**.`,
        sources_web: []
      };
    }
    return {
      text: `⚠️ **Le serveur d'intelligence artificielle est temporairement indisponible.**\n\nVotre question nécessite une analyse juridique approfondie que je ne peux pas fournir en mode hors-ligne. Le serveur Gemini qui alimente les réponses juridiques est momentanément inaccessible.\n\n**Que pouvez-vous faire maintenant ?**\n- 🔄 **Réessayez dans quelques instants** — le serveur se reconnecte automatiquement.\n- 🔍 Utilisez l'onglet **"IA Juridique"** pour une recherche textuelle.\n- 📚 Consultez l'onglet **"Codes de Loi"** pour parcourir les textes officiels français.\n- 💬 Posez votre question directement à votre avocat via la **"Discussion"**.`,
      sources_web: []
    };
  }

  let text = lang === 'en' 
    ? "Hello! I am the France Justice backup assistant. How can I help you navigate your dashboard?"
    : lang === 'es'
    ? "¡Hola! Soy el asistente de respaldo de France Justice. ¿En qué puedo ayudarle en este panel?"
    : lang === 'ar'
    ? "مرحباً! أنا مساعد فرنسا جستي المباشر. كيف يمكنني مساعدتك في لوحة التحكم؟"
    : "Bonjour ! Je suis l'assistant France Justice de secours. Le serveur d'IA principal est hors ligne pour le moment. Que puis-je faire pour vous aider sur ce tableau de bord ?";

  let action: { type: string; payload: { tab?: string; query?: string; lawyer_id?: string; date?: string; time?: string; notes?: string; title?: string; content?: string } } | null = null;

  if (clean.includes('rendez-vous') || clean.includes('rdv') || clean.includes('agenda') || clean.includes('appointment')) {
    text = lang === 'en' ? "Navigating to your appointments tab." : "Très bien, je bascule sur l'onglet de vos rendez-vous.";
    action = { type: 'SWITCH_TAB', payload: { tab: 'appointments' } };
  } else if (clean.includes('document') || clean.includes('dossier') || clean.includes('file')) {
    text = lang === 'en' ? "Redirecting to your secure document vault." : "Je vous dirige vers l'espace de vos documents sécurisés.";
    action = { type: 'SWITCH_TAB', payload: { tab: isLawyer ? 'cases' : 'documents' } };
  } else if (clean.includes('avocat') || clean.includes('lawyer') || clean.includes('annuaire')) {
    text = lang === 'en' ? "Opening the lawyers directory." : "Je vous oriente vers l'annuaire des avocats.";
    action = { type: 'SWITCH_TAB', payload: { tab: 'avocats' } };
  } else if (clean.includes('profil') || clean.includes('profile') || clean.includes('account')) {
    text = lang === 'en' ? "Displaying your profile details." : "J'affiche vos informations de profil.";
    action = { type: 'SWITCH_TAB', payload: { tab: isLawyer ? 'profil' : 'profile' } };
  } else if (clean.includes('devis') || clean.includes('quote') || clean.includes('invoice')) {
    text = lang === 'en' ? "Opening quotes & billing management." : "Je vous redirige vers la gestion des devis.";
    action = { type: 'SWITCH_TAB', payload: { tab: 'quotes' } };
  } else if (clean.includes('chat') || clean.includes('message') || clean.includes('discussion')) {
    text = lang === 'en' ? "Opening real-time messaging." : "Je vous ouvre la messagerie en temps réel.";
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
      // Direct call fallback
    }
  }

  return `[DOCUMENT JURIDIQUE DE SECOURS - ${lang.toUpperCase()}]

RÉFÉRENCE : ${type.toUpperCase()}
DATE : ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}

DÉTAILS COMPLÉMENTAIRES :
${details}

---
OBJET : Document Officiel / Formulaire Juridique FranceJustice (${langName}).
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
      // Direct call fallback
    }
  }

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

  return {
    text: activeLang === 'en'
      ? `Hello! I am FranceJustice's AI Assistant. How can I assist you with legal questions in ${langName}?`
      : activeLang === 'es'
      ? `¡Hola! Soy el Asistente de IA de FranceJustice. ¿En qué puedo ayudarle con preguntas legales en ${langName}?`
      : activeLang === 'ar'
      ? `مرحباً! أنا المساعد الذكي لموقع فرنسا جستي. كيف يمكنني مساعدتك في الاستشارات القانونية؟`
      : `Bonjour ! Je suis l'Assistant IA Officiel de FranceJustice. Comment puis-je vous aider ?`,
    lawyers: relatedLawyers,
    courses: relatedCourses,
    news: relatedNews,
    reviews: relatedReviews
  };
}
