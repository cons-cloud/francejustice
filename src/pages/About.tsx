import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { 
  Users, 
  Scale, 
  Sparkles, 
  BrainCircuit, 
  FileText, 
  Video, 
  GraduationCap, 
  Lock, 
  CheckCircle2, 
  Globe, 
  ArrowRight, 
  BookOpen, 
  Clock,
  ShieldCheck,
  Building2,
  ExternalLink,
  BookMarked,
  FileCheck,
  Award,
  ChevronDown,
  ChevronUp,
  HeartHandshake
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n';
import SEO from '../components/common/SEO';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openArticle, setOpenArticle] = useState<string | null>('art-1');

  const toggleArticle = (id: string) => {
    setOpenArticle(openArticle === id ? null : id);
  };

  const services = [
    {
      id: 'ai-legal',
      title: t('about.service_ai_title', 'IA Juridique & GéniaL\'Avocat'),
      category: 'Intelligence Artificielle',
      description: t('about.service_ai_desc', 'Moteur de recherche intelligent analysant 100% du corpus législatif français, la jurisprudence et les textes officiels avec assistant vocal temps réel.'),
      icon: BrainCircuit,
    },
    {
      id: 'generator',
      title: t('about.service_gen_title', 'Générateur d\'Actes & Documents PDF'),
      category: 'Rédaction Automatisée',
      description: t('about.service_gen_desc', 'Création guidée de contrats, mises en demeure, statuts d\'entreprise (SAS, SARL) et requêtes juridiques aux normes françaises.'),
      icon: FileText,
    },
    {
      id: 'lawyers',
      title: t('about.service_lawyers_title', 'Annuaire Officiel des Avocats'),
      category: 'Mise en Relation Certifiée',
      description: t('about.service_lawyers_desc', 'Moteur d\'annuaire des praticiens vérifiés auprès du Conseil National des Barreaux (CNB) et des Cours d\'Appel.'),
      icon: Users,
    },
    {
      id: 'video',
      title: t('about.service_video_title', 'Visioconférences & RDV Chiffrés'),
      category: 'Consultation Sécurisée',
      description: t('about.service_video_desc', 'Salles virtuelles WebRTC chiffrées de bout en bout (Jitsi) avec devis en ligne et paiements certifiés Stripe PCI-DSS Level 1.'),
      icon: Video,
    },
    {
      id: 'classrooms',
      title: t('about.service_edu_title', 'Formations Diplômantes & Masterclass'),
      category: 'Académie Universitaire',
      description: t('about.service_edu_desc', 'Programmes académiques certifiants (Diplômants et Masterclass) sous la direction de Docteurs en Droit et d\'Enseignants-Chercheurs.'),
      icon: GraduationCap,
    },
    {
      id: 'security',
      title: t('about.service_sec_title', 'Sécurité BD, RGPD & Purge Réglementaire'),
      category: 'Conformité & Secret',
      description: t('about.service_sec_desc', 'Cryptographie TLS 1.3, AES-256 au repos, Row Level Security (RLS) et calendrier légal de rétention/purge des données CNIL.'),
      icon: Lock,
    }
  ];

  const externalOfficialSources = [
    { name: 'Légifrance — Service Public du Droit Français', url: 'https://www.legifrance.gouv.fr/', desc: 'Textes officiels de lois, 75+ Codes, Décrets et Arrêtés en vigueur.' },
    { name: 'Service-Public.fr — Site Officiel de l\'Administration', url: 'https://www.service-public.fr/', desc: 'Fiches pratiques, démarches administratives et droits des citoyens.' },
    { name: 'Conseil National des Barreaux (CNB)', url: 'https://www.cnb.avocat.fr/', desc: 'Ordre officiel des Avocats de France et annuaire certifié.' },
    { name: 'Cour de Cassation', url: 'https://www.courdecassation.fr/', desc: 'Haute juridiction judiciaire tranchant les pourvois civil et pénal.' },
    { name: 'Conseil d\'État', url: 'https://www.conseil-etat.fr/', desc: 'Juridiction administrative suprême et conseiller du Gouvernement.' },
    { name: 'CNIL — Informatique & Libertés', url: 'https://www.cnil.fr/', desc: 'Autorité de régulation des données personnelles et règles RGPD.' },
    { name: 'Défenseur des Droits', url: 'https://www.defenseurdesdroits.fr/', desc: 'Protection des libertés fondamentales et lutte contre les discriminations.' },
    { name: 'Ministère du Travail & de l\'Emploi', url: 'https://travail-emploi.gouv.fr/', desc: 'Code du Travail, conventions collectives et droits des salariés.' },
    { name: 'Infogreffe — Registre du Commerce', url: 'https://www.infogreffe.fr/', desc: 'Accès officiel aux données des entreprises françaises et RCS.' },
    { name: 'EUR-Lex — Droit de l\'Union Européenne', url: 'https://eur-lex.europa.eu/', desc: 'Journal officiel de l\'UE, directives et règlements communautaires.' },
    { name: 'CEDH — Cour Européenne des Droits de l\'Homme', url: 'https://www.echr.coe.int/', desc: 'Arrêts et décisions de la jurisprudence européenne des droits humains.' },
    { name: 'Nations Unies — Haut-Commissariat aux Droits de l\'Homme', url: 'https://www.ohchr.org/', desc: 'Déclaration Universelle des Droits de l\'Homme (DUDH) et traités internationaux.' }
  ];

  const internalRegulations = [
    {
      id: 'art-1',
      title: 'Article 1 — Statut Juridique d\'ONG & Mission d\'Intérêt Général',
      content: 'L\'organisation "FranceJustice" (Just-Law) est une Organisation Non Gouvernementale (ONG) internationale à vocation juridique et éducative, régie par la loi du 1er juillet 1901. Elle a pour mission fondamentale la démocratisation de l\'accès au Droit, la défense des libertés publiques, le soutien aux personnes vulnérables et la diffusion d\'outils numériques souverains pour les citoyens et les professionnels.'
    },
    {
      id: 'art-2',
      title: 'Article 2 — Indépendance, Neutralité Politico-Religieuse & Éthique',
      content: 'FranceJustice s\'interdit toute prise de position politique, confessionnelle ou doctrinale partisane. L\'ONG agit dans le strict respect de la Déclaration Universelle des Droits de l\'Homme de 1948 et de la Convention Européenne de Sauvegarde des Droits de l\'Homme. Ses activités sont guidées par la transparence, l\'équité et l\'impartialité.'
    },
    {
      id: 'art-3',
      title: 'Article 3 — Secret Professionnel, Secret de l\'Avocat & Déontologie',
      content: 'Tous les membres, avocats partenaires et juristes affiliés à l\'ONG FranceJustice s\'engagent au respect absolu du secret professionnel (Article 66-5 de la Loi du 31 décembre 1971). Les échanges entre citoyens et avocats sur la plateforme sont strictly chiffrés et protégés contre toute intrusion ou divulgation à des tiers.'
    },
    {
      id: 'art-4',
      title: 'Article 4 — Éthique Algorithmique & Supervision Humaine de l\'IA',
      content: 'L\'utilisation de l\'Intelligence Artificielle (moteur GéniaL\'Avocat) au sein de la plateforme répond à des règles strictes de transparence. L\'IA constitue un outil de pré-analyse et de recherche documentaire automatisée, mais ne remplace en aucun cas la décision, le conseil ou l\'acte judiciaire réservé à l\'avocat ou au juge.'
    },
    {
      id: 'art-5',
      title: 'Article 5 — Catégories de Membres & Charte d\'Adhésion',
      content: 'L\'ONG regroupe 4 catégories de membres : (a) Les Membres Avocats (inscrits au barreau), (b) Les Membres Universitaires & Enseignants (Docteurs en Droit, Professeurs), (c) Les Membres Étudiants en Droit, et (d) Les Membres Citoyens Bénéficiaires. L\'adhésion implique l\'acceptation sans réserve du présent Règlement Intérieur.'
    },
    {
      id: 'art-6',
      title: 'Article 6 — Modèle Économique, Transparence Financière & Pro Bono',
      content: 'ONG non lucrative, FranceJustice réinvestit 100% de ses ressources dans le développement des outils technologiques d\'accès au droit et l\'organisation de consultations gratuites (Pro Bono) pour les personnes en situation de précarité. Les honoraires de consultation d\'avocat sur la plateforme sont fixés en toute transparence avec devis préalable.'
    },
    {
      id: 'art-7',
      title: 'Article 7 — Direction Académique & Conseil d\'Administration',
      content: 'L\'ONG est dirigée par un Conseil d\'Administration. La Direction Pédagogique et Scientifique des formations certifiantes est assurée par le Fondateur Dr. Imam Çoban, Docteur en Droit. Le Conseil veille à l\'excellence scientifique des cours et à l\'actualisation continue de la base de données juridique.'
    },
    {
      id: 'art-8',
      title: 'Article 8 — Sécurité des Données & Calendrier de Purge RGPD',
      content: 'En conformité avec les règles de la CNIL et du RGPD, les données nominatives et pièces téléchargées bénéficient d\'un chiffrement fort. Les données sont conservées selon un calendrier réglementaire précis (10 ans pour les factures comptables, 3 ans pour les comptes inactifs, 1 an pour les journaux de connexion) avant purge sécurisée définitive.'
    },
    {
      id: 'art-9',
      title: 'Article 9 — Sanctions Disciplinaires & Exclusion',
      content: 'Tout manquement aux principes déontologiques, toute violation du secret professionnel ou tout comportement contraire à l\'honneur de la profession d\'avocat ou aux valeurs de l\'ONG entraîne la suspension immédiate du membre et sa saisine devant le Conseil d\'Administration pour radiation définitive.'
    }
  ];

  const whyChooseUs = [
    {
      title: t('about.why_1_title', 'Expertise Académique & Pratique'),
      description: t('about.why_1_desc', 'Conçu par des Docteurs en Droit et des praticiens du barreau pour garantir la justesse juridique.'),
      icon: Scale,
    },
    {
      title: t('about.why_2_title', 'IA de Dernière Génération'),
      description: t('about.why_2_desc', 'Moteur sémantique analysant 100% du corpus législatif français et international.'),
      icon: Sparkles,
    },
    {
      title: t('about.why_3_title', 'Sécurité & RGPD Absolus'),
      description: t('about.why_3_desc', 'Chiffrement de pointe, architecture Supabase PostgreSQL souveraine et respect strict du secret.'),
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <SEO 
        title="À Propos — ONG FranceJustice, Règlement Intérieur & Direction Académique"
        description="Découvrez l'ONG Internationale FranceJustice (Just-Law), son Règlement Intérieur officiel complet, son statut d'ONG d'accès au Droit et le Fondateur Dr. Imam Çoban."
        keywords="ONG FranceJustice, ONG juridique, règlement intérieur ONG, accès au droit, imam coban docteur en droit, statut ong justice, legifrance, cnb, conseil detat"
      />

      {/* HERO SECTION */}
      <section className="py-24 md:py-32 bg-slate-950 relative border-b border-slate-900 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

        <div className="container max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              ONG Internationale d'Accès au Droit & Écosystème IA
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
              FranceJustice : <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">L'ONG Juridique Intelligente</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-100 mb-8 leading-relaxed font-medium max-w-2xl">
              FranceJustice (Just-Law) est une <strong className="text-amber-300">Organisation Non Gouvernementale (ONG)</strong> internationale indépendante dédiée à la démocratisation de la justice, la protection des libertés fondamentales et la formation académique d'excellence supervisée par le <strong className="text-indigo-300">Dr. Imam Çoban</strong>.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="px-8 py-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-base shadow-xl shadow-indigo-950/60 transition-all transform hover:scale-105 flex items-center gap-2"
                onClick={() => navigate('/services')}
              >
                Découvrir nos Services <ArrowRight className="w-5 h-5" />
              </Button>
              <a 
                href="#reglement"
                className="px-8 py-4 rounded-2xl border border-slate-700 bg-slate-900/90 text-slate-100 hover:bg-slate-800 text-base font-bold transition-all inline-flex items-center gap-2"
              >
                <BookMarked className="w-5 h-5 text-amber-400" /> Consulter le Règlement Intérieur
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono text-slate-300 ml-2">francejustice.org / status-ong</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  🏛️ ONG Agrée & Souveraine
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <HeartHandshake className="w-6 h-6 text-emerald-400 mb-2" />
                  <h4 className="text-xs font-extrabold text-white">ONG d'Intérêt Général</h4>
                  <p className="text-xs text-slate-200 font-medium mt-1">Accès gratuit au droit et secours pro bono pour tous.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <Users className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="text-xs font-extrabold text-white">Avocats & Barreaux</h4>
                  <p className="text-xs text-slate-200 font-medium mt-1">Praticiens certifiés par les Barreaux de France.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <GraduationCap className="w-6 h-6 text-violet-400 mb-2" />
                  <h4 className="text-xs font-extrabold text-white">Direction Académique</h4>
                  <p className="text-xs text-slate-200 font-medium mt-1">Supervisée par le Fondateur Dr. Imam Çoban.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <Lock className="w-6 h-6 text-cyan-400 mb-2" />
                  <h4 className="text-xs font-extrabold text-white">Chiffrement & RGPD</h4>
                  <p className="text-xs text-slate-200 font-medium mt-1">PostgreSQL TLS 1.3 / AES-256 & RLS Supabase.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ALL SERVICES GRID */}
      <section className="py-28 bg-slate-950 border-b border-slate-900 relative">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-4 py-1.5 rounded-full border border-indigo-800/60 inline-block mb-4">
              Catalogue Écosystème
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Tous les Services Proposés par FranceJustice
            </h2>
            <p className="text-slate-100 font-semibold text-base md:text-lg mt-4">
              Une gamme complète de solutions juridiques, technologiques et académiques adaptées aux particuliers, entreprises, étudiants et avocats.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.id} className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all rounded-3xl p-6 shadow-xl group">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 text-slate-200">
                        {item.category}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-slate-100 text-sm font-medium leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* RÈGLEMENT INTÉRIEUR OFFICIEL DE L'ONG FRANCEJUSTICE */}
      <section id="reglement" className="py-28 bg-slate-900/50 border-b border-slate-900 relative">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-4 py-1.5 rounded-full border border-amber-800/60 inline-block mb-4">
              📌 Statuts Officiels
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Règlement Intérieur Complet de l'ONG FranceJustice
            </h2>
            <p className="text-slate-100 font-semibold text-base md:text-lg mt-4">
              Adopté par le Conseil d'Administration de l'ONG et opposable à l'ensemble des membres, praticiens affiliés et utilisateurs de la plateforme.
            </p>
          </div>

          <div className="space-y-4">
            {internalRegulations.map((art) => {
              const isOpen = openArticle === art.id;
              return (
                <div 
                  key={art.id} 
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleArticle(art.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors"
                  >
                    <span className="text-base font-bold text-white flex items-center gap-3">
                      <BookMarked className="w-5 h-5 text-amber-400 shrink-0" />
                      {art.title}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-slate-300 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-5 pt-0 border-t border-slate-800/60 text-slate-100 text-sm font-medium leading-relaxed bg-slate-950/40">
                          {art.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DIRECTORY OF OFFICIAL EXTERNAL GOVERNMENT LINKS */}
      <section className="py-28 bg-slate-950 border-b border-slate-900 relative">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-4 py-1.5 rounded-full border border-indigo-800/60 inline-block mb-4">
              🌐 Transparence & Sources
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Répertoire des Sources Officielles & Sites Gouvernementaux
            </h2>
            <p className="text-slate-100 font-semibold text-base md:text-lg mt-4">
              Retrouvez l'accès direct aux portails officiels de l'État Français, des juridictions suprêmes, du Conseil National des Barreaux et des instances internationales.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {externalOfficialSources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/80 p-6 rounded-3xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                    {source.name}
                  </h3>
                  <p className="text-slate-100 text-xs font-medium leading-relaxed">
                    {source.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-indigo-400 truncate">
                  {source.url}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP & FOUNDER SECTION (Dr. Imam Çoban) */}
      <section className="py-28 bg-slate-950 border-b border-slate-900 relative">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-1 text-center">
                <div className="w-40 h-40 mx-auto rounded-3xl bg-slate-950 border-2 border-indigo-500/50 p-2 shadow-2xl relative overflow-hidden mb-4">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-900 flex items-center justify-center">
                    <GraduationCap className="w-20 h-20 text-indigo-300" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white">Dr. Imam Çoban</h3>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-1">
                  Fondateur & Directeur Pédagogique
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 text-[11px] font-semibold border border-indigo-800">
                  🎓 Docteur en Droit • Enseignant-Chercheur
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Une Direction Académique & Scientifique de Premier Plan
                </h3>
                <p className="text-slate-100 text-sm font-medium leading-relaxed">
                  L'ONG <strong>FranceJustice</strong> a été pensée et fondée par le <strong>Dr. Imam Çoban</strong>, Docteur en Droit et Enseignant-Chercheur, avec une ambition claire : mettre la rigueur de la doctrine juridique universitaire et la puissance des technologies d'Intelligence Artificielle au service des citoyens et des professionnels du droit.
                </p>
                <p className="text-slate-100 text-sm font-medium leading-relaxed">
                  Sous sa direction pédagogique, notre centre de formation garantit des programmes certifiants d'une haute précision académique, combinant théorie fondamentale, analyse jurisprudentielle et cas pratiques pratiques.
                </p>
                
                <div className="pt-2 flex flex-wrap gap-2">
                  {[
                    "Docteur en Droit",
                    "Direction de Recherche",
                    "Droit des Affaires & Numérique",
                    "Conformité RGPD & Éthique IA",
                    "Directeur des Masterclass"
                  ].map((sk, idx) => (
                    <span key={idx} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800">
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-28 bg-slate-950 border-b border-slate-900 relative">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-16 tracking-tight text-white">
            {t('about.why_title', 'Pourquoi choisir l\'ONG FranceJustice ?')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {whyChooseUs.map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="bg-slate-900 border border-slate-800 shadow-xl rounded-3xl p-6 text-center hover:border-slate-700 transition-all">
                  <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center">
                      <Icon className="h-8 w-8 text-indigo-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-100 text-sm font-medium leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-28 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-slate-950 to-violet-950 opacity-90" />
        
        <div className="container max-w-4xl mx-auto relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Rejoignez la Révolution Juridique
            </h2>

            <p className="text-lg md:text-xl text-slate-100 mb-10 font-semibold leading-relaxed">
              Que vous soyez citoyen à la recherche d'une assistance juridique, étudiant souhaitant valider une formation diplômante, ou avocat désireux d'optimiser votre cabinet.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg"
                className="text-base px-10 py-7 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white font-black shadow-2xl transition-transform hover:scale-105" 
                onClick={() => navigate('/register')}
              >
                Créer un compte Citoyen / Étudiant
              </Button>

              <Button 
                variant="outline" 
                size="lg"
                className="text-base px-10 py-7 rounded-2xl border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 font-bold transition-transform hover:scale-105"
                onClick={() => navigate('/register/lawyer')}
              >
                Accès Cabinet Avocat / Professeur
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default About;