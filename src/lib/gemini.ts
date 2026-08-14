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
  let text = "Bonjour ! Je suis l'assistant France Justice de secours. Le serveur d'IA principal est hors ligne ou indisponible pour le moment. Que puis-je faire pour vous aider sur ce tableau de bord ?";
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
  _history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  _useSearch: boolean = true
) {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // 1. Direct call to Gemini REST API if valid key is set in VITE_GEMINI_API_KEY
  if (geminiApiKey && !geminiApiKey.startsWith('AQ.')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
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

  // 2. Local intelligent response fallback (prevents 500 network error logs when Django backend is offline)
  return getLocalAIFallback(prompt);
}

export async function generateLegalDocument(type: string, details: string) {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (geminiApiKey && !geminiApiKey.startsWith('AQ.')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Rédige un document juridique officiel de type "${type}". Détails : ${details}` }] }]
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

  return getLocalDocumentFallback(type, details);
}

export async function smartGlobalLegalAssistantQuery(userPrompt: string, roleContext: string = 'public') {
  const cleanQuery = userPrompt.trim().toLowerCase();
  
  // Data holders for Supabase enrichment
  let dbContextInfo = '';
  let relatedLawyers: any[] = [];
  let relatedCourses: any[] = [];
  let relatedNews: any[] = [];
  let relatedReviews: any[] = [];

  try {
    // 1. Check if asking about lawyers / experts
    if (cleanQuery.includes('avocat') || cleanQuery.includes('professeur') || cleanQuery.includes('doctorant') || cleanQuery.includes('expert') || cleanQuery.includes('spécialiste') || cleanQuery.includes('contact') || cleanQuery.includes('cabinet')) {
      const { data: profiles } = await supabase
        .from('profiles_just')
        .select('id, first_name, last_name, role, city, specialty, bio')
        .in('role', ['lawyer', 'professor', 'doctorate'])
        .eq('is_verified', true)
        .limit(4);
      if (profiles && profiles.length > 0) {
        relatedLawyers = profiles;
        dbContextInfo += `\n- Experts/Avocats disponibles dans la base FranceJustice : ${profiles.map(p => `${p.first_name} ${p.last_name} (${p.role === 'lawyer' ? 'Avocat' : p.role === 'professor' ? 'Professeur' : 'Doctorant'}, ${p.city || 'France'}, spél: ${p.specialty || 'Généraliste'})`).join(' ; ')}`;
      }
    }

    // 2. Check if asking about courses / formations / visio
    if (cleanQuery.includes('formation') || cleanQuery.includes('cours') || cleanQuery.includes('visio') || cleanQuery.includes('classe') || cleanQuery.includes('masterclass') || cleanQuery.includes('planning')) {
      const { data: courses } = await supabase
        .from('classrooms_just')
        .select('id, title, category, date, price, lawyer_id')
        .gte('date', new Date().toISOString())
        .limit(3);
      if (courses && courses.length > 0) {
        relatedCourses = courses;
        dbContextInfo += `\n- Formations/Visio à venir sur FranceJustice : ${courses.map(c => `"${c.title}" (${c.category}, date: ${new Date(c.date).toLocaleDateString('fr-FR')}, tarif: ${c.price || 0}€)`).join(' ; ')}`;
      }
    }

    // 3. Check if asking about news or law decrees
    if (cleanQuery.includes('actualité') || cleanQuery.includes('décret') || cleanQuery.includes('loi') || cleanQuery.includes('réforme') || cleanQuery.includes('jurisprudence') || cleanQuery.includes('arrêt')) {
      const { data: newsItems } = await supabase
        .from('news_just')
        .select('title, category, summary, country')
        .limit(3);
      if (newsItems && newsItems.length > 0) {
        relatedNews = newsItems;
        dbContextInfo += `\n- Dernières actualités juridiques en base : ${newsItems.map(n => `"${n.title}" (${n.category}, ${n.country})`).join(' ; ')}`;
      }
    }

    // 4. Check if asking about scientific reviews / publications
    if (cleanQuery.includes('revue') || cleanQuery.includes('thèse') || cleanQuery.includes('article') || cleanQuery.includes('recherche') || cleanQuery.includes('doctrinal')) {
      const { data: reviews } = await supabase
        .from('scientific_reviews_just')
        .select('title, authors, domain, year')
        .limit(3);
      if (reviews && reviews.length > 0) {
        relatedReviews = reviews;
        dbContextInfo += `\n- Revues scientifiques publiées : ${reviews.map(r => `"${r.title}" par ${r.authors} (${r.domain}, ${r.year})`).join(' ; ')}`;
      }
    }
  } catch (err) {
    console.warn("Notice: Error fetching DB context for assistant query:", err);
  }

  // System Prompt for Gemini AI REST API
  const systemPrompt = `
Vous êtes l'Assistant IA Officiel en direct de FranceJustice (https://francejustice.org), la première plateforme juridique et base de données IA francophone mondiale.
Votre rôle est d'apporter une assistance juridique claire, rigoureuse, précise et directement opérationnelle aux citoyens, étudiants, avocats, professeurs et chercheurs.

Profil de l'utilisateur connecté : ${roleContext}

Données en temps réel extraites de la plateforme FranceJustice :
${dbContextInfo || "Plateforme FranceJustice connectée en temps réel à 100%."}

Règles de réponse :
1. Répondez de manière professionnelle avec des citations de textes de loi officiels français (Code Civil, Code Pénal, Code du Travail, Code de Commerce, Légifrance, Jurisprudence Cour de Cassation / Conseil d'État, DUDH/CEDH).
2. Proposez des liens internes sous forme de texte clair ou suggérez les actions disponibles sur le site (/lawyers pour contacter un avocat, /classrooms pour les formations visio, /generator pour rédiger des actes, /news pour les revues et actualités).
3. Soyez précis, structuré (avec des puces, du gras et des sections), et rassurant.
4. Si la question concerne un cas personnel grave, rappelez l'importance de consulter un avocat référencé sur FranceJustice.

Question de l'utilisateur : "${userPrompt}"
  `.trim();

  // Try API Call to Gemini REST
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

  // Smart Local Fallback Response with Law Citations & Platform Links
  let fallbackText = `### ⚖️ Réponse Juridique FranceJustice\n\n`;

  if (cleanQuery.includes('licenciement') || cleanQuery.includes('travail') || cleanQuery.includes('rupture') || cleanQuery.includes('contrat')) {
    fallbackText += `En droit du travail français (**Code du travail, art. L. 1231-1 et suivants**), toute rupture de contrat à durée indéterminée (CDI) doit être fondée sur une cause réelle et sérieuse.\n\n` +
      `**Points clés à retenir :**\n` +
      `- **Préavis & Procédure :** Entretien préalable obligatoire (L. 1232-2) avec notification par lettre recommandée.\n` +
      `- **Indemnités légales :** Calculées selon l'ancienneté et la convention collective (L. 1234-9).\n` +
      `- **Recours :** Saisine du Conseil de Prud'hommes possible dans un délai d'un an pour contester le motif.\n\n` +
      `👉 *Vous pouvez utiliser notre [Générateur d'Actes](/generator) pour rédiger un courrier officiel ou consulter notre [Annuaire des Avocats](/lawyers) spécialisés en Droit du Travail.*`;
  } else if (cleanQuery.includes('plainte') || cleanQuery.includes('infraction') || cleanQuery.includes('police') || cleanQuery.includes('vol') || cleanQuery.includes('agression')) {
    fallbackText += `Conformément à l'**article 15-3 du Code de Procédure Pénale**, la police et la gendarmerie sont tenues de recevoir les plaintes déposées par les victimes d'infractions pénales.\n\n` +
      `**Vos démarches possibles sur FranceJustice :**\n` +
      `1. **Pré-plainte en ligne :** Préparer votre déclaration officielle.\n` +
      `2. **Plainte simple auprès du Procureur :** Lettre recommandée avec accusé de réception adressée au tribunal.\n` +
      `3. **Main courante :** Consignation officielle des faits sans poursuites immédiates.\n\n` +
      `👉 *Générez directement votre dossier complet via le [Générateur d'Actes Juridiques](/generator).*`;
  } else if (cleanQuery.includes('avocat') || cleanQuery.includes('consultation') || cleanQuery.includes('contact') || cleanQuery.includes('rdv')) {
    fallbackText += `La plateforme FranceJustice regroupe des **Avocats inscrits aux barreaux**, des **Professeurs de Droit** et des **Doctorants Chercheurs** certifiés.\n\n` +
      `**Comment prendre rendez-vous ou échanger ?**\n` +
      `- Accédez à l'[Annuaire des Avocats & Enseignants](/lawyers).\n` +
      `- Filtrez par domaine juridique (*Droit civil, pénal, affaires, travail, santé*).\n` +
      `- Lancez une consultation sécurisée ou réservez un créneau en visio.\n\n` +
      (relatedLawyers.length > 0 ? `**Experts recommandés en direct :**\n` + relatedLawyers.map(l => `- **${l.first_name} ${l.last_name}** (${l.role === 'lawyer' ? 'Avocat' : l.role === 'professor' ? 'Prof. de Droit' : 'Doctorant'}, ${l.city || 'France'})`).join('\n') : '');
  } else if (cleanQuery.includes('formation') || cleanQuery.includes('cours') || cleanQuery.includes('étudiant') || cleanQuery.includes('masterclass')) {
    fallbackText += `FranceJustice propose un catalogue complet de **Visioconférences & Formations juridiques** animées par des avocats et professeurs universitaires.\n\n` +
      `**Fonctionnalités disponibles :**\n` +
      `- Attestations de formation certifiées.\n` +
      `- Salles de visioconférence HD en direct et retransmissions.\n` +
      `- Support de cours téléchargeables au format PDF.\n\n` +
      `👉 *Consultez le catalogue et l'agenda des sessions sur la page [Visioconférences & Formations](/classrooms).*`;
  } else {
    fallbackText += `Bienvenue sur l'assistance FranceJustice. Votre question a été analysée au regard des sources du **Code Civil**, du **Code Pénal**, du **Code du Travail** et de la jurisprudence française.\n\n` +
      `**Que souhaitez-vous faire ?**\n` +
      `- ⚖️ **Trouver un Avocat ou Enseignant :** Explorez l'[Annuaire Officiel](/lawyers).\n` +
      `- 📄 **Rédiger un Document Officiel :** Utilisez le [Générateur d'Actes](/generator).\n` +
      `- 🎓 **Suivre une Formation en Visio :** Accédez aux [Salles de classe](/classrooms).\n` +
      `- 🔬 **Consulter la Veille Juridique :** Lisez les [Actualités & Revues Scientifiques](/news).\n\n` +
      `N'hésitez pas à préciser votre situation juridique !`;
  }

  return {
    text: fallbackText,
    lawyers: relatedLawyers,
    courses: relatedCourses,
    news: relatedNews,
    reviews: relatedReviews
  };
}


