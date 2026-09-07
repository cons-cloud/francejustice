import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  Users, 
  Scale, 
  Sparkles, 
  BrainCircuit, 
  FileText, 
  Video, 
  GraduationCap, 
  Lock, 
  ArrowRight, 
  ShieldCheck,
  Building2,
  ExternalLink,
  BookMarked,
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
    { name: t('about.source_1_name', 'Légifrance — Service Public du Droit Français'), url: 'https://www.legifrance.gouv.fr/', desc: t('about.source_1_desc', 'Textes officiels de lois, 75+ Codes, Décrets et Arrêtés en vigueur.') },
    { name: t('about.source_2_name', 'Service-Public.fr — Site Officiel de l\'Administration'), url: 'https://www.service-public.fr/', desc: t('about.source_2_desc', 'Fiches pratiques, démarches administratives et droits des citoyens.') },
    { name: t('about.source_3_name', 'Conseil National des Barreaux (CNB)'), url: 'https://www.cnb.avocat.fr/', desc: t('about.source_3_desc', 'Ordre officiel des Avocats de France et annuaire certifié.') },
    { name: t('about.source_4_name', 'Cour de Cassation'), url: 'https://www.courdecassation.fr/', desc: t('about.source_4_desc', 'Haute juridiction judiciaire tranchant les pourvois civil et pénal.') },
    { name: t('about.source_5_name', 'Conseil d\'État'), url: 'https://www.conseil-etat.fr/', desc: t('about.source_5_desc', 'Juridiction administrative suprême et conseiller du Gouvernement.') },
    { name: t('about.source_6_name', 'CNIL — Informatique & Libertés'), url: 'https://www.cnil.fr/', desc: t('about.source_6_desc', 'Autorité de régulation des données personnelles et règles RGPD.') },
    { name: t('about.source_7_name', 'Défenseur des Droits'), url: 'https://www.defenseurdesdroits.fr/', desc: t('about.source_7_desc', 'Protection des libertés fondamentales et lutte contre les discriminations.') },
    { name: t('about.source_8_name', 'Ministère du Travail & de l\'Emploi'), url: 'https://travail-emploi.gouv.fr/', desc: t('about.source_8_desc', 'Code du Travail, conventions collectives et droits des salariés.') },
    { name: t('about.source_9_name', 'Infogreffe — Registre du Commerce'), url: 'https://www.infogreffe.fr/', desc: t('about.source_9_desc', 'Accès officiel aux données des entreprises françaises et RCS.') },
    { name: t('about.source_10_name', 'EUR-Lex — Droit de l\'Union Européenne'), url: 'https://eur-lex.europa.eu/', desc: t('about.source_10_desc', 'Journal officiel de l\'UE, directives et règlements communautaires.') },
    { name: t('about.source_11_name', 'CEDH — Cour Européenne des Droits de l\'Homme'), url: 'https://www.echr.coe.int/', desc: t('about.source_11_desc', 'Arrêts et décisions de la jurisprudence européenne des droits humains.') },
    { name: t('about.source_12_name', 'Nations Unies — Haut-Commissariat aux Droits de l\'Homme'), url: 'https://www.ohchr.org/', desc: t('about.source_12_desc', 'Déclaration Universelle des Droits de l\'Homme (DUDH) et traités internationaux.') }
  ];

  const internalRegulations = [
    {
      id: 'art-1',
      title: t('about.art_1_title', 'Article 1 — Statut Juridique d\'ONG & Mission d\'Intérêt Général'),
      content: t('about.art_1_content', 'L\'organisation "FranceJustice" (Just-Law) est une Organisation Non Gouvernementale (ONG) internationale à vocation juridique et éducative, régie par la loi du 1er juillet 1901. Elle a pour mission fondamentale la démocratisation de l\'accès au Droit, la défense des libertés publiques, le soutien aux personnes vulnérables et la diffusion d\'outils numériques souverains pour les citoyens et les professionnels.')
    },
    {
      id: 'art-2',
      title: t('about.art_2_title', 'Article 2 — Indépendance, Neutralité Politico-Religieuse & Éthique'),
      content: t('about.art_2_content', 'FranceJustice s\'interdit toute prise de position politique, confessionnelle ou doctrinale partisane. L\'ONG agit dans le strict respect de la Déclaration Universelle des Droits de l\'Homme de 1948 et de la Convention Européenne de Sauvegarde des Droits de l\'Homme. Ses activités sont guidées par la transparence, l\'équité et l\'impartialité.')
    },
    {
      id: 'art-3',
      title: t('about.art_3_title', 'Article 3 — Secret Professionnel, Secret de l\'Avocat & Déontologie'),
      content: t('about.art_3_content', 'Tous les membres, avocats partenaires et juristes affiliés à l\'ONG FranceJustice s\'engagent au respect absolu du secret professionnel (Article 66-5 de la Loi du 31 décembre 1971). Les échanges entre citoyens et avocats sur la plateforme sont strictly chiffrés et protégés contre toute intrusion ou divulgation à des tiers.')
    },
    {
      id: 'art-4',
      title: t('about.art_4_title', 'Article 4 — Éthique Algorithmique & Supervision Humaine de l\'IA'),
      content: t('about.art_4_content', 'L\'utilisation de l\'Intelligence Artificielle (moteur GéniaL\'Avocat) au sein de la plateforme répond à des règles strictes de transparence. L\'IA constitue un outil de pré-analyse et de recherche documentaire automatisée, mais ne remplace en aucun cas la décision, le conseil ou l\'acte judiciaire réservé à l\'avocat ou au juge.')
    },
    {
      id: 'art-5',
      title: t('about.art_5_title', 'Article 5 — Catégories de Membres & Charte d\'Adhésion'),
      content: t('about.art_5_content', 'L\'ONG regroupe 4 catégories de membres : (a) Les Membres Avocats (inscrits au barreau), (b) Les Membres Universitaires & Enseignants (Docteurs en Droit, Professeurs), (c) Les Membres Étudiants en Droit, et (d) Les Membres Citoyens Bénéficiaires. L\'adhésion implique l\'acceptation sans réserve du présent Règlement Intérieur.')
    },
    {
      id: 'art-6',
      title: t('about.art_6_title', 'Article 6 — Modèle Économique, Transparence Financière & Pro Bono'),
      content: t('about.art_6_content', 'ONG non lucrative, FranceJustice réinvestit 100% de ses ressources dans le développement des outils technologiques d\'accès au droit et l\'organisation de consultations gratuites (Pro Bono) pour les personnes en situation de précarité. Les honoraires de consultation d\'avocat sur la plateforme sont fixés en toute transparence avec devis préalable.')
    },
    {
      id: 'art-7',
      title: t('about.art_7_title', 'Article 7 — Direction Académique & Conseil d\'Administration'),
      content: t('about.art_7_content', 'L\'ONG est dirigée par un Conseil d\'Administration. La Direction Pédagogique et Scientifique des formations certifiantes est assurée par le Fondateur Dr. Imam Çoban, Docteur en Droit. Le Conseil veille à l\'excellence scientifique des cours et à l\'actualisation continue de la base de données juridique.')
    },
    {
      id: 'art-8',
      title: t('about.art_8_title', 'Article 8 — Sécurité des Données & Calendrier de Purge RGPD'),
      content: t('about.art_8_content', 'En conformité avec les règles de la CNIL et du RGPD, les données nominatives et pièces téléchargées bénéficient d\'un chiffrement fort. Les données sont conservées selon un calendrier réglementaire précis (10 ans pour les factures comptables, 3 ans pour les comptes inactifs, 1 an pour les journaux de connexion) avant purge sécurisée définitive.')
    },
    {
      id: 'art-9',
      title: t('about.art_9_title', 'Article 9 — Sanctions Disciplinaires & Exclusion'),
      content: t('about.art_9_content', 'Tout manquement aux principes déontologiques, toute violation du secret professionnel ou tout comportement contraire à l\'honneur de la profession d\'avocat ou aux valeurs de l\'ONG entraîne la suspension immédiate du membre et sa saisine devant le Conseil d\'Administration pour radiation définitive.')
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
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <SEO 
        title="À Propos — ONG FranceJustice, Règlement Intérieur & Direction Académique"
        description="Découvrez l'ONG Internationale FranceJustice (Just-Law), son Règlement Intérieur officiel complet, son statut d'ONG d'accès au Droit et le Fondateur Dr. Imam Çoban."
        keywords="ONG FranceJustice, ONG juridique, règlement intérieur ONG, accès au droit, imam coban docteur en droit, statut ong justice, legifrance, cnb, conseil detat"
      />

      {/* HERO SECTION */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-cyan-50/70 via-white to-slate-50 relative border-b border-slate-200/80 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] rounded-full bg-cyan-200/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[500px] h-[500px] rounded-full bg-teal-200/20 blur-[100px] pointer-events-none" />

        <div className="container max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100/80 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wide mb-6">
              <HeartHandshake className="w-4 h-4 text-cyan-600" />
              ONG Internationale d'Accès au Droit & Écosystème IA
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              ONG: France Justice ; <span className="text-cyan-600">justice intelligente pour tous</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed font-medium max-w-2xl">
              FranceJustice est une <strong className="text-cyan-900 font-bold">Organisation Non Gouvernementale (ONG)</strong> internationale indépendante dédiée à la démocratisation de la justice, la protection des libertés fondamentales et la formation académique d'excellence supervisée par le <strong className="text-cyan-800 font-bold">Dr. Imam Çoban</strong>.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="px-8 py-6 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-base shadow-lg shadow-cyan-600/20 transition-all transform hover:scale-105 flex items-center gap-2"
                onClick={() => navigate('/services')}
              >
                Découvrir nos Services <ArrowRight className="w-5 h-5" />
              </Button>
              <a 
                href="#reglement"
                className="px-8 py-4 rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-base font-bold transition-all inline-flex items-center gap-2 shadow-xs"
              >
                <BookMarked className="w-5 h-5 text-amber-500" /> Consulter le Règlement Intérieur
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative z-10 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs font-mono text-slate-500 ml-2">francejustice.com / status-ong</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  🏛️ ONG Agréée & Souveraine
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                  <HeartHandshake className="w-6 h-6 text-cyan-600 mb-2" />
                  <h4 className="text-xs font-bold text-slate-900">ONG d'Intérêt Général</h4>
                  <p className="text-xs text-slate-600 font-medium mt-1">Accès gratuit au droit et secours pro bono pour tous.</p>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                  <Users className="w-6 h-6 text-teal-600 mb-2" />
                  <h4 className="text-xs font-bold text-slate-900">Avocats & Barreaux</h4>
                  <p className="text-xs text-slate-600 font-medium mt-1">Praticiens certifiés par les Barreaux de France.</p>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                  <GraduationCap className="w-6 h-6 text-indigo-600 mb-2" />
                  <h4 className="text-xs font-bold text-slate-900">Direction Académique</h4>
                  <p className="text-xs text-slate-600 font-medium mt-1">Supervisée par le Fondateur Dr. Imam Çoban.</p>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                  <Lock className="w-6 h-6 text-cyan-600 mb-2" />
                  <h4 className="text-xs font-bold text-slate-900">Chiffrement & RGPD</h4>
                  <p className="text-xs text-slate-600 font-medium mt-1">PostgreSQL TLS 1.3 / AES-256 & RLS Supabase.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ALL SERVICES GRID */}
      <section className="py-24 bg-slate-50/60 border-b border-slate-200/80 relative">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-100/80 px-3.5 py-1.5 rounded-full border border-cyan-200 inline-block mb-4">
              Catalogue Écosystème
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Tous les Services Proposés par FranceJustice
            </h2>
            <p className="text-slate-600 font-medium text-base md:text-lg mt-4">
              Une gamme complète de solutions juridiques, technologiques et académiques adaptées aux particuliers, entreprises, étudiants et avocats.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.id} className="bg-white border border-slate-200/80 hover:border-cyan-400 hover:shadow-xl transition-all rounded-3xl p-6 shadow-sm group">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-slate-600 text-sm font-normal leading-relaxed">
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
      <section id="reglement" className="py-24 bg-white border-b border-slate-200/80 relative">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100/80 px-3.5 py-1.5 rounded-full border border-amber-200 inline-block mb-4">
              📌 Statuts Officiels
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Règlement Intérieur Complet de l'ONG FranceJustice
            </h2>
            <p className="text-slate-600 font-medium text-base md:text-lg mt-4">
              Adopté par le Conseil d'Administration de l'ONG et opposable à l'ensemble des membres, praticiens affiliés et utilisateurs de la plateforme.
            </p>
          </div>

          <div className="space-y-4">
            {internalRegulations.map((art) => {
              const isOpen = openArticle === art.id;
              return (
                <div 
                  key={art.id} 
                  className="bg-slate-50/60 border border-slate-200 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleArticle(art.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-100/80 transition-colors"
                  >
                    <span className="text-base font-bold text-slate-900 flex items-center gap-3">
                      <BookMarked className="w-5 h-5 text-cyan-600 shrink-0" />
                      {art.title}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-slate-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
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
                        <div className="p-5 pt-0 border-t border-slate-200 text-slate-700 text-sm font-normal leading-relaxed bg-white">
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
      <section className="py-24 bg-slate-50/60 border-b border-slate-200/80 relative">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-100/80 px-3.5 py-1.5 rounded-full border border-cyan-200 inline-block mb-4">
              🌐 Transparence & Sources
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Répertoire des Sources Officielles & Sites Gouvernementaux
            </h2>
            <p className="text-slate-600 font-medium text-base md:text-lg mt-4">
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
                className="bg-white border border-slate-200/80 hover:border-cyan-400 hover:shadow-lg p-6 rounded-3xl transition-all group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Building2 className="w-5 h-5 text-cyan-600" />
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors mb-2">
                    {source.name}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {source.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-cyan-600 truncate">
                  {source.url}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP & FOUNDER SECTION (Dr. Imam Çoban) */}
      <section className="py-24 bg-white border-b border-slate-200/80 relative">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-br from-cyan-50/60 via-white to-teal-50/40 border border-cyan-200/80 rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden"
          >
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-1 text-center">
                <div className="w-36 h-36 mx-auto rounded-3xl bg-white border-2 border-cyan-400 p-2 shadow-md relative overflow-hidden mb-4">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-600 flex items-center justify-center text-white">
                    <GraduationCap className="w-16 h-16 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Dr. Imam Çoban</h3>
                <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mt-1">
                  Fondateur & Directeur Pédagogique
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-semibold border border-cyan-200">
                  🎓 Docteur en Droit • Enseignant-Chercheur
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Une Direction Académique & Scientifique de Premier Plan
                </h3>
                <p className="text-slate-600 text-sm font-normal leading-relaxed">
                  L'ONG <strong className="text-slate-900">FranceJustice</strong> a été pensée et fondée par le <strong className="text-slate-900">Dr. Imam Çoban</strong>, Docteur en Droit et Enseignant-Chercheur, avec une ambition claire : mettre la rigueur de la doctrine juridique universitaire et la puissance des technologies d'Intelligence Artificielle au service des citoyens et des professionnels du droit.
                </p>
                <p className="text-slate-600 text-sm font-normal leading-relaxed">
                  Sous sa direction pédagogique, notre centre de formation garantit des programmes certifiants d'une haute précision académique, combinant théorie fondamentale, analyse jurisprudentielle et cas pratiques.
                </p>
                
                <div className="pt-2 flex flex-wrap gap-2">
                  {[
                    "Docteur en Droit",
                    "Direction de Recherche",
                    "Droit des Affaires & Numérique",
                    "Conformité RGPD & Éthique IA",
                    "Directeur des Masterclass"
                  ].map((sk, idx) => (
                    <span key={idx} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white text-slate-800 border border-slate-200 shadow-xs">
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
      <section className="py-24 bg-slate-50/60 border-b border-slate-200/80 relative">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-14 tracking-tight text-slate-900">
            {t('about.why_title', 'Pourquoi choisir l\'ONG FranceJustice ?')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {whyChooseUs.map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="bg-white border border-slate-200/80 shadow-sm rounded-3xl p-6 text-center hover:border-cyan-400 hover:shadow-lg transition-all">
                  <CardHeader className="text-center pb-2">
                    <div className="w-14 h-14 mx-auto mb-4 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-center">
                      <Icon className="h-7 w-7 text-cyan-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm font-normal leading-relaxed">
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
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-cyan-50/50 via-cyan-100/30 to-white">
        <div className="container max-w-4xl mx-auto relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Rejoignez la Révolution Juridique
            </h2>

            <p className="text-lg md:text-xl text-slate-600 mb-10 font-medium leading-relaxed">
              Que vous soyez citoyen à la recherche d'une assistance juridique, étudiant souhaitant valider une formation diplômante, ou avocat désireux d'optimiser votre cabinet.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg"
                className="text-base px-8 py-6 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-lg shadow-cyan-600/20 transition-transform hover:scale-105" 
                onClick={() => navigate('/register')}
              >
                Créer un compte Citoyen / Étudiant
              </Button>

              <Button 
                variant="outline" 
                size="lg"
                className="text-base px-8 py-6 rounded-2xl border-slate-300 bg-white text-slate-800 hover:bg-slate-50 font-bold transition-transform hover:scale-105"
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