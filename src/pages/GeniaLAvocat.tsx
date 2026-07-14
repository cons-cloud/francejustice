import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Shield, Zap, TrendingUp, Handshake, CheckCircle, 
  XCircle, Check, ChevronDown, ChevronRight, ArrowRight, BookOpen, Star
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';

const GeniaLAvocat: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Features list
  const features = [
    {
      icon: Sparkles,
      title: t('genia.feat_expertise', "Expertise Métier Augmentée"),
      desc: t('genia.feat_expertise_desc', "GénIA-L s'appuie sur les sources juridiques les plus fiables du marché pour structurer des raisonnements solides.")
    },
    {
      icon: Zap,
      title: t('genia.feat_productivity', "Productivité Décuplée"),
      desc: t('genia.feat_productivity_desc', "Optimisez vos tâches chronophages : analyse de pièces, recherche de jurisprudence et génération de premiers drafts.")
    },
    {
      icon: Shield,
      title: t('genia.feat_security', "Sécurité & Conformité Strictes"),
      desc: t('genia.feat_security_desc', "Conçue dans le respect rigoureux du RGPD. Vos données de dossiers sont chiffrées de bout en bout.")
    },
    {
      icon: TrendingUp,
      title: t('genia.feat_decisions', "Accompagnement Décisionnel"),
      desc: t('genia.feat_decisions_desc', "Libérez du temps pour vous concentrer sur la stratégie, l'audience et l'orientation à forte valeur ajoutée.")
    },
    {
      icon: BookOpen,
      title: t('genia.feat_deliverables', "Livrables Robustes"),
      desc: t('genia.feat_deliverables_desc', "Rédigez en toute sécurité des conclusions, contrats, clauses spécifiques ou lettres de mission.")
    },
    {
      icon: Handshake,
      title: t('genia.feat_relations', "Relation Client Renforcée"),
      desc: t('genia.feat_relations_desc', "Améliorez la réactivité de votre cabinet avec des réponses structurées, claires et sourcées.")
    }
  ];

  // Onboarding steps
  const steps = [
    { num: "1", title: t('genia.step1_title', "Inscription en 3 min"), desc: t('genia.step1_desc', "Choisissez l'offre adaptée aux besoins de votre cabinet et activez votre espace sécurisé en quelques instants.") },
    { num: "2", title: t('genia.step2_title', "Onboarding & Configuration"), desc: t('genia.step2_desc', "Bénéficiez d'une session d'accueil personnalisée pour configurer vos accès et connecter vos outils.") },
    { num: "3", title: t('genia.step3_title', "Prise en main guidée"), desc: t('genia.step3_desc', "Des capsules de formation courtes et un accompagnement pas-à-pas pour maîtriser l'art des prompts juridiques.") },
    { num: "4", title: t('genia.step4_title', "Support Client Dédié"), desc: t('genia.step4_desc', "Notre équipe support, composée de juristes et d'experts, répond à vos questions en moins de 2 heures.") },
    { num: "5", title: t('genia.step5_title', "Mises à jour régulières"), desc: t('genia.step5_desc', "Accédez en continu aux nouvelles fonctionnalités et aux enrichissements hebdomadaires de nos bases de données.") }
  ];

  // Comparison criteria
  const comparison = [
    {
      criterion: t('genia.comp_rgpd', "Conformité RGPD & IA Act"),
      genial: t('genial.comp_rgpd_yes', "Totale (Hébergement souverain, conformité stricte)"),
      public: t('genial.comp_rgpd_no', "Partielle ou inexistante (Risque de transfert hors UE)"),
      check: true
    },
    {
      criterion: t('genia.comp_confidentiality', "Confidentialité des dossiers"),
      genial: t('genial.comp_confidentiality_yes', "Absolue (Chiffrement de bout en bout, aucune donnée stockée/réutilisée)"),
      public: t('genial.comp_confidentiality_no', "Très faible (Données potentiellement exploitées pour l'entraînement)"),
      check: true
    },
    {
      criterion: t('genia.comp_sources', "Source des informations"),
      genial: t('genial.comp_sources_yes', "Bases de données vérifiées & validées par des juristes"),
      public: t('genial.comp_sources_no', "Internet ouvert (Risque d'hallucinations et textes obsolètes)"),
      check: true
    },
    {
      criterion: t('genia.comp_rigor', "Rigueur de la rédaction"),
      genial: t('genial.comp_rigor_yes', "Fiable et adaptée aux usages des professionnels"),
      public: t('genial.comp_rigor_no', "Générique, approximative et nécessitant une réécriture"),
      check: true
    },
    {
      criterion: t('genia.comp_precision', "Précision des références"),
      genial: t('genial.comp_precision_yes', "Citations précises avec liens vers la jurisprudence et la loi"),
      public: t('genial.comp_precision_no', "Absentes ou fausses (Hallucinations)"),
      check: true
    },
    {
      criterion: t('genia.comp_support', "Accompagnement & Support"),
      genial: t('genial.comp_support_yes', "Inclus (Support par des experts du droit, formation)"),
      public: t('genial.comp_support_no', "Aucun (Auto-apprentissage uniquement)"),
      check: true
    }
  ];

  // FAQ list
  const faqs = [
    {
      q: t('genia.faq_q1', "GénIA-L Avocat remplace-t-il le travail de recherche de l'avocat ?"),
      a: t('genia.faq_a1', "Non. GénIA-L agit comme un copilote ou un collaborateur virtuel ultra-rapide. Il effectue le travail de tri et de synthèse, mais l'avocat conserve l'entière maîtrise.")
    },
    {
      q: t('genia.faq_q2', "Où sont stockées mes données et comment est garantie la sécurité ?"),
      a: t('genia.faq_a2', "Toutes les conversations sont chiffrées. Nous utilisons des serveurs conformes au RGPD. Aucune donnée saisie n'est utilisée pour réentraîner les modèles.")
    },
    {
      q: t('genia.faq_q3', "Quelles sont les sources utilisées par l'intelligence artificielle ?"),
      a: t('genia.faq_a3', "GénIA-L combine notre technologie d'intelligence artificielle avec une recherche en temps réel sur les codes officiels, la jurisprudence et les bases doctrinales.")
    },
    {
      q: t('genia.faq_q4', "Puis-je analyser des documents volumineux ?"),
      a: t('genia.faq_a4', "Oui, vous pouvez y téléverser des documents (PDF, Word) pour obtenir une synthèse des risques juridiques, une comparaison de clauses, ou extraire des arguments en quelques secondes.")
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
      
      {/* HERO SECTION */}
      <section className="relative bg-slate-900 text-white py-24 md:py-32 overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary-600/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container px-4 mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Copy */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center space-x-2 bg-primary-500/15 border border-primary-500/30 px-4 py-1.5 rounded-full text-primary-400 text-sm font-semibold"
              >
                <Sparkles className="h-4 w-4" />
                <span>{t('genia.hero_badge', "L'IA Juridique de Référence pour les Avocats")}</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight"
              >
                {t('genia.hero_title_left', "Décuplez la puissance de votre cabinet avec")}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-300">
                  {t('genia.title', 'GénIA-L Avocat')}
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl"
              >
                {t('genia.hero_desc', "Économisez jusqu'à 30 jours de travail par an. Effectuez des recherches de jurisprudence complexes en temps réel, analysez vos pièces et rédigez vos drafts en toute sécurité.")}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-4 pt-2"
              >
                <Button 
                  size="lg" 
                  className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-600/30 px-8 py-4 text-base font-bold transition-all duration-300 hover:scale-105"
                  onClick={() => navigate('/assistant')}
                >
                  {t('genia.try_cta', "Essayer l'Assistant IA")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-slate-700 text-white hover:bg-slate-800 rounded-xl px-8 py-4 text-base font-bold"
                  onClick={() => navigate('/contact')}
                >
                  {t('genia.demo_cta', "Demander une Démo")}
                </Button>
              </motion.div>

              <div className="flex items-center space-x-6 pt-4 border-t border-slate-800 text-slate-400">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">4.8/5</span>
                  <span>{t('genia.rating_by', 'par les cabinets')}</span>
                </div>
                <div className="h-4 w-px bg-slate-800" />
                <div>{t('genia.compliance_tag', 'Conforme RGPD & Secret Pro')}</div>
              </div>
            </div>

            {/* Right Column: Visual Mockup */}
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative mx-auto max-w-md lg:max-w-none bg-slate-800/60 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 height-3 rounded-full bg-red-500 h-3" />
                    <div className="w-3 height-3 rounded-full bg-yellow-500 h-3" />
                    <div className="w-3 height-3 rounded-full bg-green-500 h-3" />
                  </div>
                  <div className="text-xs text-slate-400 font-mono">GénIA-L Avocat Workspace</div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-3.5 text-slate-300">
                    <span className="text-primary-400 font-bold block mb-1">{t('genia.mock_search_label', 'Recherche Assistée')}</span>
                    {t('genia.mock_query', '"Trouve la jurisprudence récente concernant le manquement à l\'obligation de délivrance conforme en matière de vente de matériel industriel."')}
                  </div>
                  
                  <div className="bg-primary-950/40 border border-primary-500/20 rounded-xl p-4 text-slate-200">
                    <div className="flex items-center space-x-2 text-primary-400 font-bold mb-2">
                      <Sparkles className="h-4 w-4" />
                      <span>{t('genia.mock_reply_title', 'Synthèse GénIA-L')}</span>
                    </div>
                    <p className="text-xs leading-relaxed mb-2 text-slate-300">
                      {t('genia.mock_reply_text', "Selon l'art. 1604 du Code civil et la jurisprudence constante de la Cour de cassation (Com. 12 janv. 2024, n° 22-18.450), le vendeur est tenu de livrer une chose conforme aux spécifications contractuelles...")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="bg-slate-800 text-primary-300 px-2 py-0.5 rounded border border-slate-700">Art. 1604 C. Civ.</span>
                      <span className="bg-slate-800 text-primary-300 px-2 py-0.5 rounded border border-slate-700">Com. 12 janv. 2024</span>
                    </div>
                  </div>

                  <div className="border border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center text-slate-400 cursor-pointer hover:bg-slate-700/20 transition-all duration-200">
                    <span className="text-xs font-semibold block text-slate-300">{t('genia.mock_drag_drop', 'Glisser-déposer un contrat ou conclusions')}</span>
                    <span className="text-[10px] text-slate-500">{t('genia.mock_formats', 'Formats supportés : PDF, DOCX (Max 20Mo)')}</span>
                  </div>
                </div>
              </motion.div>
            </div>
            
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-24 bg-white relative">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900">
              {t('genia.features_title', 'Conçu pour répondre aux exigences des professionnels du droit')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('genia.features_subtitle', "GénIA-L Avocat sécurise vos démarches, libère du temps de recherche et structure vos livrables.")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div 
                  key={i}
                  whileHover={{ y: -6 }}
                  className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:bg-white hover:border-primary-100 transition-all duration-300 flex flex-col text-left group"
                >
                  <div className="w-12 h-12 mb-6 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-950">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO ACCORDION */}
      <section className="py-24 bg-slate-900 text-white relative">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side: content details */}
            <div className="lg:col-span-5 text-left space-y-6">
              <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1 rounded-full text-indigo-300 text-xs font-semibold">
                <span>{t('genia.demo_badge', 'Démo Interactive')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {t('genia.demo_title', "Visualisez l'IA en action")}
              </h2>
              <p className="text-slate-400 leading-relaxed">
                {t('genia.demo_desc', "Découvrez comment GénIA-L analyse vos requêtes et structure instantanément ses rapports :")}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/20 text-primary-400">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">{t('genia.demo_point1_title', 'Synthèse Immédiate')}</strong>
                    <span className="text-xs text-slate-400">{t('genia.demo_point1_desc', 'Une réponse concise et argumentée à votre problématique.')}</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/20 text-primary-400">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">{t('genia.demo_point2_title', 'Cas Pratiques & Exemples')}</strong>
                    <span className="text-xs text-slate-400">{t('genia.demo_point2_desc', 'Des mises en situation concrètes pour appliquer la règle de droit.')}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/20 text-primary-400">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">{t('genia.demo_point3_title', 'Points de Vigilance')}</strong>
                    <span className="text-xs text-slate-400">{t('genia.demo_point3_desc', 'Mise en avant des risques juridiques et des délais d\'action.')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 rounded-xl transition-all"
                  onClick={() => navigate('/assistant')}
                >
                  {t('genia.demo_cta_btn', 'Ouvrir mon assistant de recherche')}
                </Button>
              </div>
            </div>

            {/* Right side: iframe simulation */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 aspect-video w-full">
                <iframe 
                  src="https://demo.arcade.software/XF8i48HBWJNPVUhgeLfL?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true" 
                  title="GenIA-L Avocat - Démo interactive" 
                  loading="lazy" 
                  allowFullScreen 
                  allow="clipboard-write"
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-24 bg-white relative">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
              {t('genia.comparison_title', 'Pourquoi choisir une IA juridique dédiée ?')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('genia.comparison_subtitle', "Comparatif entre GénIA-L et les outils d'intelligence artificielle grand public.")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="py-4 px-6 text-sm font-extrabold text-slate-500 uppercase tracking-wider w-1/3">{t('genia.comp_header1', "Critères d'exigences")}</th>
                  <th className="py-4 px-6 text-sm font-extrabold text-primary-600 uppercase tracking-wider bg-primary-50/40 rounded-t-2xl w-1/3 text-center">{t('nav.genia')}</th>
                  <th className="py-4 px-6 text-sm font-extrabold text-slate-400 uppercase tracking-wider w-1/3 text-center">{t('genia.comp_header3', 'IA Grand Public')}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 px-6 font-semibold text-slate-900 text-sm">{item.criterion}</td>
                    <td className="py-5 px-6 bg-primary-50/20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-800">{item.genial}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <XCircle className="h-5 w-5 text-red-400" />
                        <span className="text-xs text-slate-500">{item.public}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* IMPLEMENTATION / ONBOARDING TIMELINE */}
      <section className="py-24 bg-slate-900 text-white relative">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
              {t('genia.steps_title', 'Votre cabinet équipé en 5 étapes')}
            </h2>
            <p className="text-lg text-slate-400">
              {t('genia.steps_subtitle', "Un parcours d'intégration fluide et assisté pour maximiser le potentiel de l'outil.")}
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 relative">
            {steps.map((st, i) => (
              <div key={i} className="relative flex flex-col text-left space-y-4">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-12 right-0 h-0.5 bg-slate-800 z-0" />
                )}
                
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-primary-600 text-white font-extrabold flex items-center justify-center text-lg shadow-lg shadow-primary-600/30">
                  {st.num}
                </div>
                
                <h3 className="text-lg font-bold text-white pt-2">{st.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 bg-white relative">
        <div className="container max-w-4xl px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
              {t('faq.title')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="space-y-4 text-left">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100/60 font-semibold text-slate-900 text-base md:text-lg transition-colors text-left"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  <span className="pr-4">{faq.q}</span>
                  {activeFaq === i ? (
                    <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-500 shrink-0" />
                  )}
                </button>
                
                {activeFaq === i && (
                  <div className="p-6 bg-white border-t border-slate-100 text-slate-600 text-sm md:text-base leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-indigo-900" />
        <div className="container relative z-10 text-center px-4 mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            {t('genia.cta_banner_title', 'Prêt à moderniser votre cabinet ?')}
          </h2>
          <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
            {t('genia.cta_banner_desc', "Rejoignez des milliers de professionnels du droit et commencez à utiliser GénIA-L dès aujourd'hui.")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-primary-700 hover:bg-primary-50 rounded-xl px-8 py-4 text-base font-bold shadow-xl transition-all"
              onClick={() => navigate('/assistant')}
            >
              {t('genia.cta_banner_btn_try', 'Démarrer Gratuitement')}
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="border-primary-400 text-white hover:bg-primary-700/50 rounded-xl px-8 py-4 text-base font-bold"
              onClick={() => navigate('/contact')}
            >
              {t('genia.cta_banner_btn_contact', 'Contacter un conseiller')}
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default GeniaLAvocat;
