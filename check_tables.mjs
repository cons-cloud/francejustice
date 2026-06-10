import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zchhijltemvrsthdaxex.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaGhpamx0ZW12cnN0aGRheGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjg0MzksImV4cCI6MjA5MjY0NDQzOX0.vPxSEMq8ENKBn5CxosrZYv9n7KNZgvECX_fDefvueoE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Formations à seeder (niveau avocat professionnel)
const FORMATIONS = [
  {
    title: "Introduction au droit des contrats",
    duration: "3h 00",
    level: "Débutant",
    category: "Droit des Contrats",
    status: "Publié"
  },
  {
    title: "Techniques de négociation en contentieux",
    duration: "4h 30",
    level: "Intermédiaire",
    category: "Contentieux",
    status: "Publié"
  },
  {
    title: "Droit du travail : licenciements et procédures",
    duration: "5h 00",
    level: "Intermédiaire",
    category: "Droit Social",
    status: "Publié"
  },
  {
    title: "Protection des données personnelles (RGPD)",
    duration: "2h 30",
    level: "Débutant",
    category: "Droit Numérique",
    status: "Publié"
  },
  {
    title: "Rédaction d'actes juridiques professionnels",
    duration: "6h 00",
    level: "Avancé",
    category: "Pratique Juridique",
    status: "Publié"
  },
  {
    title: "Droit pénal des affaires",
    duration: "4h 00",
    level: "Avancé",
    category: "Droit Pénal",
    status: "Publié"
  },
  {
    title: "Propriété intellectuelle et brevets",
    duration: "3h 30",
    level: "Intermédiaire",
    category: "Propriété Intellectuelle",
    status: "Publié"
  },
  {
    title: "Arbitrage et médiation commerciale",
    duration: "4h 00",
    level: "Avancé",
    category: "Résolution des Conflits",
    status: "Publié"
  },
  {
    title: "Fiscalité des entreprises pour avocats",
    duration: "3h 00",
    level: "Intermédiaire",
    category: "Droit Fiscal",
    status: "Publié"
  },
  {
    title: "Gestion déontologique du cabinet",
    duration: "2h 00",
    level: "Débutant",
    category: "Déontologie",
    status: "Publié"
  }
];

// Outils juridiques à seeder
const OUTILS = [
  {
    title: "Générateur de Contrats IA",
    category: "Intelligence Artificielle",
    status: "Actif"
  },
  {
    title: "Calculateur d'Honoraires",
    category: "Gestion Cabinet",
    status: "Actif"
  },
  {
    title: "Base de Jurisprudence Annotée",
    category: "Recherche Juridique",
    status: "Actif"
  },
  {
    title: "Assistant de Rédaction Légale",
    category: "Intelligence Artificielle",
    status: "Actif"
  },
  {
    title: "Agenda Judiciaire Synchronisé",
    category: "Gestion Cabinet",
    status: "Actif"
  },
  {
    title: "Outil de Suivi des Délais de Prescription",
    category: "Procédures",
    status: "Actif"
  },
  {
    title: "Bibliothèque de Modèles d'Actes",
    category: "Documentation",
    status: "Actif"
  },
  {
    title: "Analyseur de Clauses Contractuelles",
    category: "Intelligence Artificielle",
    status: "En Test"
  },
  {
    title: "Système de Gestion Électronique des Dossiers",
    category: "Gestion Cabinet",
    status: "Actif"
  },
  {
    title: "Outil de Veille Juridique Automatisée",
    category: "Recherche Juridique",
    status: "En Test"
  },
  {
    title: "Simulateur de Calcul des Pensions Alimentaires",
    category: "Droit de la Famille",
    status: "Actif"
  },
  {
    title: "Outil d'Anonymisation de Documents",
    category: "Conformité",
    status: "Actif"
  }
];

async function seedData() {
  // 1. Authentification admin
  console.log('🔐 Connexion admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'justlaw@gmail.com',
    password: 'Justlaw1@'
  });

  if (authError) {
    console.error('❌ Échec de connexion:', authError.message);
    process.exit(1);
  }
  console.log('✅ Connecté en tant qu\'admin:', authData.user.email);

  // 2. Seed formations
  console.log('\n📚 Seeding formations...');
  const { data: formationsInserted, error: fErr } = await supabase
    .from('formations_just')
    .insert(FORMATIONS)
    .select();
  
  if (fErr) {
    console.error('❌ Erreur formations:', fErr.message);
  } else {
    console.log(`✅ ${formationsInserted.length} formations insérées.`);
    formationsInserted.forEach(f => console.log(`   • [${f.category}] ${f.title} (${f.duration})`));
  }

  // 3. Seed outils
  console.log('\n🔧 Seeding outils...');
  const { data: outilsInserted, error: oErr } = await supabase
    .from('outils_just')
    .insert(OUTILS)
    .select();
  
  if (oErr) {
    console.error('❌ Erreur outils:', oErr.message);
  } else {
    console.log(`✅ ${outilsInserted.length} outils insérés.`);
    outilsInserted.forEach(o => console.log(`   • [${o.category}] ${o.title} — Statut: ${o.status}`));
  }

  // 4. Vérification finale
  console.log('\n📊 Vérification finale...');
  const { data: f2 } = await supabase.from('formations_just').select('id', { count: 'exact' });
  const { data: o2 } = await supabase.from('outils_just').select('id', { count: 'exact' });
  console.log(`   formations_just : ${f2?.length ?? 0} lignes`);
  console.log(`   outils_just     : ${o2?.length ?? 0} lignes`);

  await supabase.auth.signOut();
  console.log('\n🏁 Seed terminé avec succès !');
}

seedData().catch(e => { console.error(e); process.exit(1); });
