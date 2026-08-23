import React from 'react';
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
  Building2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const services = [
    {
      id: 'ai-legal',
      title: t('about.service_ai_title', 'IA Juridique & GéniaL\'Avocat'),
      category: 'Intelligence Artificielle',
      description: t('about.service_ai_desc', 'Moteur de recherche intelligent analysant l\'ensemble des 75+ Codes de loi français, la jurisprudence et les textes officiels avec assistant vocal temps réel.'),
      icon: BrainCircuit,
      color: 'from-indigo-600 to-violet-600',
      badge: 'IA Avancée',
      features: [
        'Analyse instantanée de pièces de procédure & contrats',
        'Synthèse jurisprudentielle et détection de vices de forme',
        'Assistant vocal interactif 24h/24 pour citoyens et avocats'
      ]
    },
    {
      id: 'doc-generator',
      title: t('about.service_doc_title', 'Générateur d\'Actes & Documents'),
      category: 'Rédaction Juridique',
      description: t('about.service_doc_desc', 'Rédigez en quelques clics des documents juridiques sur-mesure conforme au droit français : mises en demeure, statuts, contrats, requêtes.'),
      icon: FileText,
      color: 'from-blue-600 to-cyan-600',
      badge: 'Conforme Code Civil',
      features: [
        'Modèles rédigés et validés par des docteurs en droit',
        'Personnalisation dynamique avec export PDF & Word',
        'Archivage chiffré et sécurisé dans l\'espace client'
      ]
    },
    {
      id: 'lawyer-network',
      title: t('about.service_lawyers_title', 'Réseau & Annuaire des Avocats'),
      category: 'Mise en Relation',
      description: t('about.service_lawyers_desc', 'Annuaire officiel synchronisé avec les barreaux de France et Data.gouv. Trouvez l\'avocat ou l\'expert adapté à votre dossier.'),
      icon: Users,
      color: 'from-amber-600 to-orange-600',
      badge: 'Données Vérifiées',
      features: [
        'Filtres par spécialité, ville et Cour d\'Appel',
        'Vérification rigoureuse des numéros de prestation (CNB)',
        'Messagerie directe et sécurisée client-avocat'
      ]
    },
    {
      id: 'appointments-video',
      title: t('about.service_visio_title', 'RDV & Visioconférences Chiffrées'),
      category: 'Consultation à Distance',
      description: t('about.service_visio_desc', 'Planification de consultations juridiques avec paiement sécurisé Stripe PCI-DSS et salles virtuelles WebRTC chiffrées de bout en bout.'),
      icon: Video,
      color: 'from-emerald-600 to-teal-600',
      badge: 'WebRTC Chiffré',
      features: [
        'Salles virtuelles Jitsi haute définition sans installation',
        'Paiement d\'acomptes et devis en ligne via Stripe',
        'Rappels SMS & e-mail automatiques des rendez-vous'
      ]
    },
    {
      id: 'academic-trainings',
      title: t('about.service_formations_title', 'Formations Diplômantes & Masterclass'),
      category: 'Académie Juridique',
      description: t('about.service_formations_desc', 'Formations de haut niveau dispensées par des Docteurs en Droit et Professeurs : Formations Diplômantes certifiantes et Masterclass de haute spécialité.'),
      icon: GraduationCap,
      color: 'from-purple-600 to-pink-600',
      badge: 'Docteurs en Droit',
      features: [
        'Formations Diplômantes (Certifications professionnelles)',
        'Masterclass intensives axées sur la pratique du droit',
        'Planning annuel interactif & Revues Scientifiques'
      ]
    },
    {
      id: 'security-rgpd',
      title: t('about.service_security_title', 'Sécurité BD, RGPD & Retention'),
      category: 'Protection des Données',
      description: t('about.service_security_desc', 'Garantie absolue du secret professionnel et du RGPD avec chiffrement PostgreSQL (TLS 1.3, AES-256) et calendrier réglementaire de purge des données.'),
      icon: ShieldCheck,
      color: 'from-rose-600 to-red-600',
      badge: 'Conforme CNIL',
      features: [
        'Row Level Security (RLS) sur la base de données Supabase',
        'Calendrier légal de conservation (Code de commerce, LCEN)',
        'Console de conformité RGPD accessible dans tous les dashboards'
      ]
    }
  ];

  const metrics = [
    { value: '75+', label: 'Codes de Loi & Jurisprudences indexés', icon: BookOpen },
    { value: '100%', label: 'Conformité RGPD & Chiffrement TLS 1.3', icon: Lock },
    { value: '24/7', label: 'Assistance IA & Recherche Vocale', icon: Clock },
    { value: ' temps réel', label: 'Synchronisation PostgreSQL Supabase', icon: Globe }
  ];

  const team = [
    {
      name: 'Imam Çoban',
      role: t('about.team_role_founder', 'Fondateur, Professeur & Docteur en Droit'),
      description: t('about.team_desc_founder', 'Docteur en Droit, Enseignant-Chercheur et Fondateur de FranceJustice (Just-Law). Expert reconnu en droit des affaires et en nouvelles technologies, il conçoit les programmes de formations et supervise l\'architecture juridique globale de la plateforme.'),
      icon: GraduationCap,
      skills: ['Docteur en Droit', 'Droit des Affaires & Numérique', 'Directeur Pédagogique', 'Auteur Scientifique']
    }
  ];

  const whyChooseUs = [
    {
      title: t('about.why_accessibility', 'Accessibilité 360°'),
      description: t('about.why_accessibility_desc', 'Un guichet unique pour les citoyens, étudiants et avocats accessible 24h/24 depuis n\'importe quel appareil.'),
      icon: Scale
    },
    {
      title: t('about.why_efficiency', 'Gain de Temps IA'),
      description: t('about.why_efficiency_desc', 'Analyse et rédaction accélérées d\'actes juridiques grâce à des algorithmes IA entraînés sur le droit français.'),
      icon: BrainCircuit
    },
    {
      title: t('about.why_satisfaction', 'Secret & Protection Total'),
      description: t('about.why_satisfaction_desc', 'Respect strict du secret professionnel des avocats, chiffrement bancaire des transactions et règles RLS Supabase.'),
      icon: ShieldCheck
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">

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
              <Sparkles className="w-4 h-4 text-amber-400" />
              Écosystème Juridique Global & Intelligent
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
              L'Avenir de la Justice <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">Accessible & Connectée</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed font-normal max-w-2xl">
              FranceJustice (Just-Law) est la première plateforme tout-en-un réunissant <strong>l'Intelligence Artificielle Juridique</strong>, un <strong>Réseau d'Avocats vérifiés</strong>, des <strong>Visioconférences Chiffrées</strong> et un centre de <strong>Formations Académiques Diplômantes & Masterclass</strong>.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="px-8 py-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-base shadow-xl shadow-indigo-950/60 transition-all transform hover:scale-105 flex items-center gap-2"
                onClick={() => navigate('/services')}
              >
                Découvrir nos Services <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-6 rounded-2xl border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 text-base font-bold transition-all"
                onClick={() => navigate('/register')}
              >
                Créer un compte
              </Button>
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
                  <span className="text-xs font-mono text-slate-400 ml-2">francejustice.app / ecosystem</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ⚡ Synchronisé 100% Temps Réel
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <BrainCircuit className="w-6 h-6 text-indigo-400 mb-2" />
                  <h4 className="text-xs font-extrabold text-white">IA & GéniaL'Avocat</h4>
                  <p className="text-[11px] text-slate-400 mt-1">75+ Codes de loi & assistant vocal temps réel.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <Users className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="text-xs font-extrabold text-white">Réseau d'Avocats</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Praticiens certifiés par les Barreaux de France.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <GraduationCap className="w-6 h-6 text-violet-400 mb-2" />
                  <h4 className="text-xs font-extrabold text-white">Formations & Masterclass</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Diplômantes & Masterclass par des Docteurs en Droit.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
                  <h4 className="text-xs font-extrabold text-white">Sécurité & RGPD</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Chiffrement PostgreSQL TLS 1.3 & RLS.</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Supabase RLS Chiffré</span>
                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-indigo-400" /> Annuaire des Tribunaux</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* METRICS & KEY NUMBERS */}
      <section className="py-16 bg-slate-900/60 border-b border-slate-800">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 text-center hover:border-slate-700 transition-all">
                  <Icon className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
                  <div className="text-3xl lg:text-4xl font-black text-white mb-1 tracking-tight">{m.value}</div>
                  <div className="text-xs font-medium text-slate-400">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ALL PROPOSED SERVICES SECTION */}
      <section className="py-28 bg-slate-950 border-b border-slate-900 relative">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 mb-4 inline-block">
              Catalogue Complet
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
              Tous les Services Proposés par FranceJustice
            </h2>
            <p className="text-slate-300 text-base md:text-lg">
              Une suite logicielle et pédagogique complète créée pour simplifier la justice, accompagner les avocats et former les futurs juristes.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.id} variants={itemVariants}>
                  <Card className="h-full bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/50 shadow-xl rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between group">
                    <CardHeader className="p-7 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${s.color} text-white shadow-lg shadow-indigo-950/50`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                          {s.badge}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{s.category}</span>
                      <CardTitle className="text-xl font-extrabold text-white mt-1 group-hover:text-indigo-300 transition-colors">{s.title}</CardTitle>
                      <CardDescription className="text-slate-300 text-xs mt-3 leading-relaxed">
                        {s.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-7 pt-2 flex-grow flex flex-col justify-between">
                      <div className="space-y-2 mt-2 pt-4 border-t border-slate-800/80 mb-6">
                        {s.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full rounded-xl border-slate-700 bg-slate-950 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-slate-200 text-xs font-bold transition-all py-2.5 flex items-center justify-center gap-2"
                        onClick={() => navigate('/services')}
                      >
                        En savoir plus <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FOUNDER & ACADEMIC DIRECTION */}
      <section className="py-28 bg-slate-900 border-b border-slate-800 relative">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 mb-4 inline-block">
              Direction Académique & Scientifique
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Fondateur & Direction du Projet
            </h2>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-950 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl grid md:grid-cols-3 gap-8 items-center"
          >
            <div className="md:col-span-1 text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-amber-500 to-indigo-600 p-1 shadow-2xl">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-amber-400" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">Imam Çoban</h3>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-1">Fondateur & Docteur en Droit</p>
            </div>

            <div className="md:col-span-2 space-y-4 text-slate-300 text-sm leading-relaxed">
              <p className="text-base font-semibold text-slate-200">
                « Notre mission avec FranceJustice est d'allier la rigueur scientifique de la doctrine juridique à la puissance des technologies modernes pour rendre le Droit compréhensible, accessible et protecteur pour tous. »
              </p>
              <p>
                Docteur en Droit et enseignant passionné, Imam Çoban dirige l'orientation scientifique et pédagogique de la plateforme. Il supervise la conception des <strong>Formations Diplômantes</strong> et des <strong>Masterclass</strong> juridiques, garantissant l'excellence des contenus dispensés aux étudiants, juristes et avocats.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {team[0].skills.map((sk, idx) => (
                  <span key={idx} className="px-3 py-1 bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-extrabold rounded-full">
                    ✓ {sk}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-28 bg-slate-950 border-b border-slate-900 relative">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-16 tracking-tight text-white">
            {t('about.why_title', 'Pourquoi choisir FranceJustice ?')}
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
                    <p className="text-slate-300 text-xs leading-relaxed">
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

            <p className="text-lg md:text-xl text-slate-300 mb-10 font-medium leading-relaxed">
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