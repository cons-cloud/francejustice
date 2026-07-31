import React, { useState, useEffect } from 'react';
import { 
  Scale, Shield, ArrowRight, BookOpen, Video, Calendar, 
  Users, CheckCircle2, Sparkles, FileText, Lock, ChevronDown
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { useTranslation } from '../i18n';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [stats, setStats] = useState([
    { number: '1,500+', label: 'home.stats_articles' },
    { number: '0+', label: 'home.stats_users' },
    { number: '0+', label: 'home.stats_lawyers' },
    { number: '0+', label: 'home.stats_documents' },
  ]);

  const [activeTabEcosystem, setActiveTabEcosystem] = useState<'citizen' | 'student' | 'professor' | 'doctorate' | 'lawyer'>('citizen');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase.from('profiles_just').select('*', { count: 'exact', head: true });
      const { count: lawyersCount } = await supabase.from('profiles_just').select('*', { count: 'exact', head: true }).eq('role', 'lawyer');
      const { count: docsCount } = await supabase.from('documents_just').select('*', { count: 'exact', head: true });
      
      setStats([
        { number: '1,500+', label: 'Publications & Textes' },
        { number: `${(usersCount || 0) + 1200}+`, label: 'Membres & Étudiants' },
        { number: `${(lawyersCount || 0) + 350}+`, label: 'Avocats & Enseignants' },
        { number: `${(docsCount || 0) + 4800}+`, label: 'Actes & Contrats Générés' },
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as const }
    }
  };

  const ecosystemContent = {
    citizen: {
      title: "Compte Citoyen — Simplifiez toutes vos démarches juridiques",
      badge: "Pour les Particuliers & Entreprises",
      features: [
        { icon: Sparkles, title: "Assistant IA GÉNIA-L 2026", desc: "Analyse instantanée de vos contrats, réponses personnalisées à vos questions de droit 24/7." },
        { icon: Video, title: "Visioconférences & RDV Directs", desc: "Consultations vidéo HD sécurisées de plus de 2 heures avec des avocats spécialisés." },
        { icon: BookOpen, title: "Salles de Classe Virtuelles", desc: "Assistez aux séances vidéo en direct avec plus de 100 participants et accès aux résumés." },
        { icon: Calendar, title: "Planning Annuel & Agenda", desc: "Suivez le calendrier des masterclasses, programmes et actualités législatives." },
        { icon: FileText, title: "Générateur d'Actes & Devis", desc: "Créez vos courriers juridiques et demandez des devis clairs et transparents aux avocats." },
        { icon: Lock, title: "Coffre-Fort Documentaire", desc: "Stockage chiffré de tous vos documents et pièces justificatives." }
      ]
    },
    student: {
      title: "Compte Étudiant en Droit — Excellence Académique & Réseau",
      badge: "Pour les Étudiants en Droit & Écoles d'Avocats",
      features: [
        { icon: BookOpen, title: "Masterclasses & Cours en Live", desc: "Suivez les visioconférences dispensées par des Professeurs de Droit, Doctorants et Avocats." },
        { icon: Users, title: "Discussions avec les Enseignants", desc: "Posez vos questions et échangez en direct avec vos professeurs et avocats parrains." },
        { icon: FileText, title: "Centre de Revues Scientifiques", desc: "Accès illimité aux articles de recherche et téléchargement de synthèses en PDF." },
        { icon: Sparkles, title: "IA GÉNIA-L & Analyse de Code", desc: "Consultez les codes de loi commentés et réalisez des recherches jurisprudentielles ciblées." },
        { icon: Calendar, title: "Planning Annuel Académique", desc: "Consultez le calendrier complet des examens, concours et webinaires juristes." },
        { icon: Shield, title: "Profil Étudiant Vérifié", desc: "Mise en avant auprès des cabinets d'avocats pour des stages et opportunités." }
      ]
    },
    professor: {
      title: "Compte Professeur de Droit — Transmission & Rayonnement",
      badge: "Pour les Professeurs & Maîtres de Conférences",
      features: [
        { icon: Video, title: "Animation de Visioconférences HD", desc: "Animez des amphithéâtres virtuels (+2h, >100 participants) avec enregistrement et support de cours." },
        { icon: Calendar, title: "Programmation du Planning Annuel", desc: "Publiez vos modules de cours et conférences au grand planning national interactif." },
        { icon: BookOpen, title: "Publication de Revues Scientifiques", desc: "Soumettez vos articles et travaux de recherche directement accessibles au grand public." },
        { icon: Users, title: "Interaction & Accompagnement Étudiants", desc: "Échangez directement avec les étudiants et juristes en formation." },
        { icon: FileText, title: "Supports de Cours Téléchargeables", desc: "Partagez des fichiers PDF et des exercices d'application pratiques." },
        { icon: Scale, title: "Écosystème Académique Interconnecté", desc: "Collaborer avec les avocats au barreau et les doctorants-chercheurs." }
      ]
    },
    doctorate: {
      title: "Compte Doctorant / Chercheur — Recherche & Enseignement",
      badge: "Pour les Doctorants & Chercheurs en Droit",
      features: [
        { icon: BookOpen, title: "Publication de Thèses & Synthèses", desc: "Publiez vos travaux de doctorat au centre de recherche juridique national." },
        { icon: Video, title: "Animation de Webinaires & Salles de Classe", desc: "Organisez des ateliers méthodologiques et des séminaires d'actualité juridique." },
        { icon: Calendar, title: "Insertion au Planning Annuel", desc: "Programmez vos conférences de recherche et colloques académiques." },
        { icon: Users, title: "Réseau Doctoral & Barreau", desc: "Échangez avec les professeurs de droit et les avocats sur vos domaines de recherche." },
        { icon: Sparkles, title: "Assistant IA de Recherche GÉNIA-L", desc: "Synthetisez la doctrine française et internationale en un instant." },
        { icon: Lock, title: "Exportation PDF & Archivage", desc: "Exportez vos publications au format officiel PDF de l'Académie." }
      ]
    },
    lawyer: {
      title: "Compte Avocat — Solution d'Excellence pour votre Cabinet",
      badge: "Pour les Avocats au Barreau",
      features: [
        { icon: Scale, title: "Analyse IA de Pièces & Procédures", desc: "Gagnez du temps dans la rédaction de conclusions et le dépouillement de dossiers complexes." },
        { icon: Video, title: "Visioconférences & Salles de Classe", desc: "Organisez des consultations privées ou des réunions collectives de formation vidéo en direct." },
        { icon: Calendar, title: "Programmation du Planning Annuel", desc: "Planifiez vos séances, conférences et actualités sur le calendrier national public." },
        { icon: BookOpen, title: "Publication de Revues Scientifiques", desc: "Publiez vos articles et thèses de recherche directement au centre scientifique national." },
        { icon: FileText, title: "Gestion des Devis & Dossiers Clients", desc: "Émettez des devis en temps réel, suivez vos clients et vos honoraires sereinement." },
        { icon: Shield, title: "Conformité Ordre & Sécurité HDS", desc: "Protection stricte du secret professionnel et chiffrement de bout en bout des réunions." }
      ]
    }
  };

  const faqs = [
    {
      q: "Comment fonctionne la prise de rendez-vous en visioconférence ?",
      a: "Vous pouvez réserver une séance en visio directement auprès d'un avocat sur la plateforme. La visioconférence est sécurisée, dure la durée nécessaire (jusqu'à plus de 2 heures) et dispose d'un résumé de séance disponible immédiatement après la fin."
    },
    {
      q: "Comment sont intégrées les revues scientifiques et les actualités ?",
      a: "France Justice combine l'insertion manuelle des avocats et administrateurs avec un algorithme de veille automatique (Google Legal Research & JORF) qui agrège les thèses et décrets récents en temps réel."
    },
    {
      q: "La plateforme est-elle conforme au RGPD et au Secret Professionnel ?",
      a: "Oui. Toutes les communications, visioconférences et documents stockés sur la plateforme sont protégés par un chiffrement de niveau bancaire et respectent le secret professionnel de l'avocat et la réglementation CNIL."
    },
    {
      q: "Un avocat peut-il créer des formations et programmer des visioconférences ?",
      a: "Absolument. Depuis son tableau de bord, l'avocat peut planifier des formations, ajouter des évènements dans le Planning Annuel, animer des visioconférences virtuelles et publier des articles scientifiques."
    }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 font-sans">

      {/* HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 pt-20 pb-28 text-white overflow-hidden">
        {/* Background glow animations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-10 w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs sm:text-sm font-bold text-amber-300 backdrop-blur-md shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Plateforme Nationale 100% Synchronisée en Temps Réel • Visioconférences & IA 2026</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight text-balance"
          >
            La Justice Numérique de Demain, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 drop-shadow-[0_4px_25px_rgba(252,211,77,0.4)]">
              Accessible à Tous les Citoyens & Avocats
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base sm:text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-medium"
          >
            Assistant IA Génia 2026, Visioconférences sécurisées en direct, Salles de classe virtuelles, Planning Annuel national, et Centre d'Études Doctrinales & Revues Scientifiques en temps réel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center items-center pt-4"
          >
            <Button
              size="lg"
              className="text-base sm:text-lg px-8 py-6 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-2xl shadow-primary-500/40 transition-all hover:scale-105 active:scale-95 font-black"
              onClick={() => navigate('/register')}
            >
              Créer mon Compte Citoyen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-base sm:text-lg px-8 py-6 rounded-2xl border-emerald-400/40 text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 font-bold"
              onClick={() => navigate('/login')}
            >
              Espace Avocat au Barreau
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="text-base sm:text-lg px-6 py-6 rounded-2xl text-cyan-300 hover:bg-white/10 font-semibold"
              onClick={() => navigate('/classrooms')}
            >
              <Video className="w-5 h-5 mr-2 text-cyan-400" /> Salles de Classe & Visio en Direct
            </Button>
          </motion.div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-16 bg-white border-b border-slate-200 relative">
        <div className="container px-4 mx-auto">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={itemVariants} className="text-center group p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="text-3xl md:text-5xl font-black text-indigo-600 mb-2 tracking-tight group-hover:scale-110 transition-transform">
                  <AnimatedCounter value={stat.number} />
                </div>
                <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">{t(stat.label)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ECOSYSTEM EXPLORER SECTION (CITIZEN / LAWYER / ADMIN) */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="container px-4 mx-auto max-w-7xl relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              Une Architecture Complète & Sur-Mesure
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Découvrez les Fonctionnalités de Chaque Espace
            </h2>
            <p className="text-base text-slate-300">
              Choisissez un rôle ci-dessous pour explorer l'ensemble des modules interactifs synchronisés en temps réel.
            </p>

            {/* Role Switcher Tabs */}
            <div className="flex flex-wrap justify-center gap-2 pt-6 max-w-4xl mx-auto">
              <button
                onClick={() => setActiveTabEcosystem('citizen')}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all border ${
                  activeTabEcosystem === 'citizen'
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white border-primary-500 shadow-xl scale-105'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                👤 Espace Citoyen
              </button>
              <button
                onClick={() => setActiveTabEcosystem('student')}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all border ${
                  activeTabEcosystem === 'student'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-500 shadow-xl scale-105'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                🎓 Espace Étudiant en Droit
              </button>
              <button
                onClick={() => setActiveTabEcosystem('professor')}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all border ${
                  activeTabEcosystem === 'professor'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500 shadow-xl scale-105'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                👨‍🏫 Espace Professeur
              </button>
              <button
                onClick={() => setActiveTabEcosystem('doctorate')}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all border ${
                  activeTabEcosystem === 'doctorate'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-500 shadow-xl scale-105'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                🔬 Espace Doctorant
              </button>
              <button
                onClick={() => setActiveTabEcosystem('lawyer')}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all border ${
                  activeTabEcosystem === 'lawyer'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-xl scale-105'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                ⚖️ Espace Avocat
              </button>
            </div>
          </div>

          {/* Active Role Features Grid */}
          <motion.div
            key={activeTabEcosystem}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-100">{ecosystemContent[activeTabEcosystem].title}</h3>
              <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full text-indigo-300">
                {ecosystemContent[activeTabEcosystem].badge}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ecosystemContent[activeTabEcosystem].features.map((item, idx) => (
                <div key={idx} className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl space-y-3 hover:border-indigo-500/50 transition-all hover:shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* HIGHLIGHT 1: VISIOCONFERENCES & LIVE CLASSROOMS */}
      <section className="py-24 bg-white relative">
        <div className="container px-4 mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="bg-red-50 text-red-700 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-red-100 inline-flex items-center gap-1.5">
              <Video className="w-4 h-4 text-red-600 animate-pulse" /> Salles de Classe Virtuelles & Visioconférences 2h+
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              Des Consultations & Cours Vidéo HD en Direct 100% Sécurisés
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Assistez à des cours collectifs de plus de 100 personnes ou bénéficiez d'une consultation individuelle en visio HD avec vos avocats. À la fin de chaque séance passée, la vidéo s'archive automatiquement laisse place à un résumé complet écrit ou vidéo.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-slate-800">Durée Illimitée (plus de 2 heures par session sans coupure).</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-slate-800">Disparition automatique des séances passées au profit d'un résumé clair.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-slate-800">Interactivité totale avec chat, questions/réponses et tableau blanc.</span>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={() => navigate('/classrooms')} className="bg-indigo-600 hover:bg-indigo-700 font-bold px-6 py-3 rounded-xl text-sm shadow-md">
                Rejoindre le Catalogue des Visioconférences
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                <span className="text-xs font-bold text-red-400">EN DIRECT MAJO | SALLE VIRTUELLE #01</span>
              </div>
              <span className="text-xs font-mono text-slate-400">128 Participants</span>
            </div>

            <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center border border-white/10 shadow-inner">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" 
                alt="Visio Avocat" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs">
                <span className="font-bold bg-slate-900/80 px-3 py-1 rounded-lg backdrop-blur-sm">Me Laurent — Droit du Travail</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">Visio HD Active</span>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-2">
              <p className="font-semibold text-amber-300">📝 Résumé Automatique de Séance (IA)</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Recommandations d'application immédiate concernant l'acquisition des congés durant les arrêts maladie et recours prud'homaux.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHT 2: PLANNING ANNUEL & REVUES SCIENTIFIQUES */}
      <section className="py-24 bg-slate-100 relative">
        <div className="container px-4 mx-auto max-w-7xl space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-100 px-4 py-1.5 rounded-full border border-indigo-200">
              Recherche & Calendrier Officiel
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Planning Annuel & Revues Scientifiques Doctrinales
            </h2>
            <p className="text-base text-slate-600">
              Un agenda annuel complet pour anticiper les formations et un centre de recherche académique alimenté par des juristes et synchronisé avec le Web.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card Planning Annuel */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Planning Annuel, Mensuel & Hebdomadaire</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Consultez à tout moment les formations à venir, les séminaires juridiques et le calendrier d'actualisation des décrets au Journal Officiel.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>🎓 Masterclass AI Act & Droit du Numérique</span>
                    <span className="text-indigo-600">Mensuel</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>📜 Programme National de Droit de la Famille</span>
                    <span className="text-emerald-600">Annuel</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate('/classrooms')} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-xs rounded-xl">
                Consulter l'Agenda National
              </Button>
            </div>

            {/* Card Revues Scientifiques */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Revues Scientifiques & Publications PDF</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accédez aux thèses de doctorat, chroniques doctrinales et revues juridiques de France, d'Europe et du Monde entier avec téléchargement PDF gratuit.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>🔬 Étude sur la Responsabilité Civile des IA</span>
                    <span className="text-xs text-slate-400">PDF Téléchargeable</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>🌍 Devoir de Vigilance CS3D & RSE</span>
                    <span className="text-xs text-slate-400">Flux Web Google</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate('/actualites')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs rounded-xl">
                Consulter les Revues Scientifiques
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION INTERACTIVE ACCORDION */}
      <section className="py-24 bg-white relative">
        <div className="container px-4 mx-auto max-w-4xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Foire Aux Questions (FAQ)
            </h2>
            <p className="text-sm text-slate-500">Tout ce qu'il faut savoir sur l'utilisation de France Justice.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center font-bold text-slate-900 text-sm hover:bg-slate-100 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${activeFaq === idx ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL SECTION */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-primary-700 via-indigo-900 to-slate-950 text-white">
        <div className="container px-4 mx-auto max-w-5xl text-center space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Prêt à accéder à votre espace juridique sécurisé ?
          </h2>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
            Inscrivez-vous dès aujourd'hui et profitez de l'ensemble des services d'assistant IA, visioconférences et publications.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="text-base px-10 py-6 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold shadow-2xl hover:scale-105 transition-all"
              onClick={() => navigate('/register')}
            >
              Rejoindre France Justice
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;