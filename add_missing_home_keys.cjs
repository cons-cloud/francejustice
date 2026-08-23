const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/i18n/locales');
const frPath = path.join(localesDir, 'fr.json');
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Inject new Home & Search Keys
fr.home = fr.home || {};
Object.assign(fr.home, {
  hero_badge: "Plateforme Nationale 100% Synchronisée en Temps Réel • Visioconférences & IA 2026",
  hero_title_part1: "La Justice Numérique de Demain,",
  hero_title_part2: "Accessible à Tous les ",
  hero_title_part3: "Citoyens & Avocats",
  hero_sub1: "Assistant IA Génia 2026",
  hero_sub2: "Visioconférences sécurisées en direct",
  hero_sub3: "Salles de classe virtuelles",
  hero_sub4: "Planning Annuel national",
  hero_sub5: "Centre d'Études Doctrinales & Revues Scientifiques",
  hero_sub6: "en temps réel.",
  btn_create_account: "Créer mon Compte Citoyen",
  btn_lawyer_space: "Espace Avocat au Barreau",
  btn_live_rooms: "Salles de Classe & Visio en Direct",
  section_classrooms_badge: "Formations Juridiques Inscrites",
  section_classrooms_title: "Les Formations & Salles de Classe Virtuelles",
  section_classrooms_desc: "Suivez en direct ou en replay les masterclasses dispensées par les avocats au barreau, professeurs de droit et juristes experts.",
  btn_all_classrooms: "Voir Toutes les Formations",
  section_lawyers_badge: "Annuaire Officiel des Barreaux",
  section_lawyers_title: "Les Avocats & Juristes inscrits sur la Plateforme",
  section_lawyers_desc: "Consultez les profils certifiés des avocats au barreau, vérifiez leurs spécialités et réservez votre consultation en visioconférence direct.",
  news_badge: "Fil d'Actualité Direct & Législation 2026",
  news_title: "Toutes les Nouvelles Actualités Juridiques",
  news_desc: "Suivez l'évolution en temps réel du droit français et européen : décrets au JORF, nouvelles jurisprudences de la Cour de Cassation, AI Act UE 2024/1689 et publications scientifiques.",
  btn_all_news: "Consulter Toutes les Actualités",
  genai_badge: "Intelligence Artificielle Juridique 2026",
  genai_title: "Les Assistants IA GÉNIA-L à votre Service",
  genai_desc: "Profitez des technologies d'IA générative les plus avancées pour répondre à vos questions, analyser vos contrats et éditer des actes légaux.",
  complaints_badge: "Dépôt de Plaintes & Mises en Demeure Directes",
  complaints_title: "Les Dépôts de Plaintes & Démarches Juridiques",
  complaints_desc: "Générez directement le dossier de plainte officielle auprès du Procureur de la République ou la saisine prud'homale en quelques clics.",
  btn_generate_complaint: "Générer une Plainte en Direct",
  btn_start_complaint: "Démarrer la Plainte",
  ecosystem_badge: "Une Architecture Complète & Sur-Mesure",
  ecosystem_title: "Découvrez les Fonctionnalités de Chaque Espace",
  ecosystem_desc: "Choisissez un rôle ci-dessous pour explorer l'ensemble des modules interactifs synchronisés en temps réel.",
  tab_citizen: "Espace Citoyen",
  tab_student: "Espace Étudiant en Droit",
  tab_prof: "Espace Professeur",
  tab_doc: "Espace Doctorant",
  tab_lawyer: "Espace Avocat"
});

fr.search = fr.search || {};
Object.assign(fr.search, {
  domain_label: "Domaine de Recherche :",
  opt_pappers: "🏢 Justice & Droit des Entreprises, Salariés & Sociétés (Pappers RNE)",
  opt_decisions: "⚖️ Décisions & Jurisprudence",
  opt_ia: "✨ Question Juridique IA (GÉNIA-L)",
  opt_codes: "📜 Textes de Loi & Codes Officiels",
  opt_conventions: "🤝 Conventions Collectives (IDCC)",
  opt_bofip: "💼 BOFiP, BOSS & Conventions Fiscales",
  official_base: "Base officielle :",
  base_pappers: "🏢 Justice & Droit des Entreprises (Pappers RNE Temps Réel)",
  base_decisions: "⚖️ Jurisprudence Française",
  base_ia: "✨ IA Juridique 2026",
  base_codes: "📜 Legifrance Codes",
  base_conventions: "🤝 Conventions IDCC",
  base_bofip: "💼 BOFiP & BOSS",
  popular_companies: "Sociétés populaires :",
  ph_pappers: "Rechercher une entreprise, droit des salariés & dirigeants, SIREN, SIRET, RCS (ex: TotalEnergies, 808741870)...",
  ph_decisions: "Mot-clé, référence, arrêt, juridiction (ex: \"Cour de cassation harcèlement\", \"22-18.405\")...",
  ph_ia: "Posez votre question en langage naturel (ex: \"Quel est le préavis de démission pour un cadre Syntec ?\")...",
  ph_codes: "Code civil, Code du travail, Article 1240, CGI...",
  ph_conventions: "Nom d'entreprise, IDCC 1486 (Syntec), HCR 1979, Bâtiment...",
  ph_bofip: "BOFiP frais de déplacement, BOSS avantages en nature, Convention fiscale France-Maroc...",
  exact_title: "Rechercher l'expression exacte",
  exact: "Exacte",
  advanced_btn: "Recherche avancée",
  btn_submit: "Rechercher"
});

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
console.log(`Updated fr.json with new home & search keys.`);
