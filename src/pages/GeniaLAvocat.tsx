import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Shield, Zap, TrendingUp, Handshake, CheckCircle, 
  XCircle, Check, ChevronDown, ChevronRight, ArrowRight, BookOpen, Star
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const GeniaLAvocat: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Features list
  const features = [
    {
      icon: Sparkles,
      title: "Expertise Métier Augmentée",
      desc: "GénIA-L s'appuie sur les sources juridiques les plus fiables du marché pour structurer des raisonnements solides et identifier les points clés et risques majeurs sur vos dossiers complexes."
    },
    {
      icon: Zap,
      title: "Productivité Décuplée",
      desc: "Optimisez vos tâches chronophages : analyse de pièces, recherche de jurisprudence, comparaison de contrats et génération de premiers projets ou drafts de qualité."
    },
    {
      icon: Shield,
      title: "Sécurité & Conformité Strictes",
      desc: "Conçue dans le respect rigoureux du RGPD et de l'IA Act. Vos données de dossiers sont chiffrées de bout en bout, sans stockage permanent ni réutilisation pour l'entraînement."
    },
    {
      icon: TrendingUp,
      title: "Accompagnement Décisionnel",
      desc: "Libérez du temps de cerveau disponible pour vous concentrer sur la stratégie, l'argumentation d'audience et l'orientation stratégique à forte valeur ajoutée."
    },
    {
      icon: BookOpen,
      title: "Livrables Robustes",
      desc: "Rédigez en toute sécurité des documents adaptés : conclusions, contrats, procès-verbaux, clauses spécifiques, lettres de mission ou comptes-rendus de rendez-vous."
    },
    {
      icon: Handshake,
      title: "Relation Client Renforcée",
      desc: "Améliorez la réactivité de votre cabinet avec des réponses structurées, claires et sourcées, faciles à vulgariser pour vos clients."
    }
  ];

  // Onboarding steps
  const steps = [
    { num: "1", title: "Inscription en 3 min", desc: "Choisissez l'offre adaptée aux besoins de votre cabinet et activez votre espace sécurisé en quelques instants." },
    { num: "2", title: "Onboarding & Configuration", desc: "Bénéficiez d'une session d'accueil personnalisée pour configurer vos accès et connecter vos outils." },
    { num: "3", title: "Prise en main guidée", desc: "Des capsules de formation courtes et un accompagnement pas-à-pas pour maîtriser l'art des prompts juridiques." },
    { num: "4", title: "Support Client Dédié", desc: "Notre équipe support, composée de juristes et d'experts, répond à vos questions en moins de 2 heures." },
    { num: "5", title: "Mises à jour régulières", desc: "Accédez en continu aux nouvelles fonctionnalités et aux enrichissements hebdomadaires de nos bases de données." }
  ];

  // Comparison criteria
  const comparison = [
    {
      criterion: "Conformité RGPD & IA Act",
      genial: "Totale (Hébergement souverain, conformité stricte)",
      public: "Partielle ou inexistante (Risque de transfert hors UE)",
      check: true
    },
    {
      criterion: "Confidentialité des dossiers",
      genial: "Absolue (Chiffrement de bout en bout, aucune donnée stockée/réutilisée)",
      public: "Très faible (Données potentiellement exploitées pour l'entraînement)",
      check: true
    },
    {
      criterion: "Source des informations",
      genial: "Bases de données vérifiées & validées par plus de 300 juristes",
      public: "Internet ouvert (Risque élevé d'hallucinations et de textes obsolètes)",
      check: true
    },
    {
      criterion: "Rigueur de la rédaction",
      genial: "Fiable et adaptée aux usages des avocats et professionnels",
      public: "Générique, approximative et nécessitant une réécriture lourde",
      check: true
    },
    {
      criterion: "Précision des références",
      genial: "Citations précises avec liens directs vers la jurisprudence et la loi",
      public: "Absentes ou fausses (Hallucinations de jurisprudence)",
      check: true
    },
    {
      criterion: "Accompagnement & Support",
      genial: "Inclus (Support par des experts du droit, formation initiale)",
      public: "Aucun (Auto-apprentissage uniquement)",
      check: true
    }
  ];

  // FAQ list
  const faqs = [
    {
      q: "GénIA-L Avocat remplace-t-il le travail de recherche de l'avocat ?",
      a: "Non. GénIA-L agit comme un copilote ou un collaborateur virtuel ultra-rapide. Il effectue le travail de tri, de synthèse et de premier jet en quelques secondes, mais l'avocat conserve l'entière maîtrise, la responsabilité et la validation finale du livrable."
    },
    {
      q: "Où sont stockées mes données et comment est garantie la sécurité ?",
      a: "Toutes les conversations et pièces jointes sont chiffrées de bout en bout. Nous utilisons des serveurs sécurisés et conformes aux exigences européennes du RGPD. Aucune donnée saisie n'est utilisée pour réentraîner les modèles d'IA, préservant ainsi le secret professionnel de manière absolue."
    },
    {
      q: "Quelles sont les sources utilisées par l'intelligence artificielle ?",
      a: "GénIA-L combine notre technologie d'intelligence artificielle avec une recherche en temps réel sur les codes officiels, la jurisprudence mise à jour de la Cour de cassation, du Conseil d'État et des cours d'appel, ainsi que les bases doctrinales de référence."
    },
    {
      q: "Puis-je analyser des documents volumineux (contrats, conclusions adverses) ?",
      a: "Oui, notre outil intègre un module d'analyse de pièces. Vous pouvez y téléverser des documents complexes (PDF, Word) pour en obtenir une synthèse des risques juridiques, une comparaison de clauses, ou extraire des arguments clés en quelques secondes."
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
                <span>L'IA Juridique de Référence pour les Avocats</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight"
              >
                Décuplez la puissance de votre cabinet avec <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-300">GénIA-L Avocat</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl"
              >
                Économisez jusqu'à <strong className="text-white">30 jours de travail par an</strong>. Effectuez des recherches de jurisprudence complexes en temps réel, analysez vos pièces et rédigez vos drafts en toute sécurité.
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
                  Essayer l'Assistant IA
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-slate-700 text-white hover:bg-slate-800 rounded-xl px-8 py-4 text-base font-bold"
                  onClick={() => navigate('/contact')}
                >
                  Demander une Démo
                </Button>
              </motion.div>

              <div className="flex items-center space-x-6 pt-4 border-t border-slate-800 text-slate-400">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">4.8/5</span>
                  <span>par les cabinets</span>
                </div>
                <div className="h-4 w-px bg-slate-800" />
                <div>Conforme RGPD & Secret Pro</div>
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
                    <span className="text-primary-400 font-bold block mb-1">Recherche Assistée</span>
                    "Trouve la jurisprudence récente concernant le manquement à l'obligation de délivrance conforme en matière de vente de matériel industriel."
                  </div>
                  
                  <div className="bg-primary-950/40 border border-primary-500/20 rounded-xl p-4 text-slate-200">
                    <div className="flex items-center space-x-2 text-primary-400 font-bold mb-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Synthèse GénIA-L</span>
                    </div>
                    <p className="text-xs leading-relaxed mb-2 text-slate-300">
                      Selon l'art. 1604 du Code civil et la jurisprudence constante de la Cour de cassation (Com. 12 janv. 2024, n° 22-18.450), le vendeur est tenu de livrer une chose conforme aux spécifications contractuelles...
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="bg-slate-800 text-primary-300 px-2 py-0.5 rounded border border-slate-700">Art. 1604 C. Civ.</span>
                      <span className="bg-slate-800 text-primary-300 px-2 py-0.5 rounded border border-slate-700">Com. 12 janv. 2024</span>
                    </div>
                  </div>

                  <div className="border border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center text-slate-400 cursor-pointer hover:bg-slate-700/20 transition-all duration-200">
                    <span className="text-xs font-semibold block text-slate-300">Glisser-déposer un contrat ou conclusions</span>
                    <span className="text-[10px] text-slate-500">Formats supportés : PDF, DOCX (Max 20Mo)</span>
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
              Conçu pour répondre aux exigences des professionnels du droit
            </h2>
            <p className="text-lg text-slate-600">
              GénIA-L Avocat sécurise vos démarches, libère du temps de recherche et structure vos livrables.
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
                <span>Démo Interactive</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Visualisez l'IA en action
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Découvrez comment GénIA-L analyse vos requêtes et structure instantanément ses rapports :
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/20 text-primary-400">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">Synthèse Immédiate</strong>
                    <span className="text-xs text-slate-400">Une réponse concise et argumentée à votre problématique.</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/20 text-primary-400">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">Cas Pratiques & Exemples</strong>
                    <span className="text-xs text-slate-400">Des mises en situation concrètes pour appliquer la règle de droit.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/20 text-primary-400">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">Points de Vigilance</strong>
                    <span className="text-xs text-slate-400">Mise en avant des risques juridiques et des délais d'action.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 rounded-xl transition-all"
                  onClick={() => navigate('/assistant')}
                >
                  Ouvrir mon assistant de recherche
                </Button>
              </div>
            </div>

            {/* Right side: iframe simulation */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 aspect-video w-full">
                {/* Embedded walk-through interactive demo */}
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
              Pourquoi choisir une IA juridique dédiée ?
            </h2>
            <p className="text-lg text-slate-600">
              Comparatif entre GénIA-L et les outils d'intelligence artificielle grand public.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="py-4 px-6 text-sm font-extrabold text-slate-500 uppercase tracking-wider w-1/3">Critères d'exigences</th>
                  <th className="py-4 px-6 text-sm font-extrabold text-primary-600 uppercase tracking-wider bg-primary-50/40 rounded-t-2xl w-1/3 text-center">GénIA-L Avocat</th>
                  <th className="py-4 px-6 text-sm font-extrabold text-slate-400 uppercase tracking-wider w-1/3 text-center">IA Grand Public (ChatGPT, etc.)</th>
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
              Votre cabinet équipé en 5 étapes
            </h2>
            <p className="text-lg text-slate-400">
              Un parcours d'intégration fluide et assisté pour maximiser le potentiel de l'outil.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 relative">
            {steps.map((st, i) => (
              <div key={i} className="relative flex flex-col text-left space-y-4">
                {/* Line connectors */}
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
              Questions Fréquentes
            </h2>
            <p className="text-lg text-slate-600">
              Tout ce que vous devez savoir sur notre assistant intelligent.
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
            Prêt à moderniser votre cabinet ?
          </h2>
          <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
            Rejoignez plus de 18 000 professionnels du droit et commencez à utiliser GénIA-L dès aujourd'hui.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-primary-700 hover:bg-primary-50 rounded-xl px-8 py-4 text-base font-bold shadow-xl transition-all"
              onClick={() => navigate('/assistant')}
            >
              Démarrer Gratuitement
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="border-primary-400 text-white hover:bg-primary-700/50 rounded-xl px-8 py-4 text-base font-bold"
              onClick={() => navigate('/contact')}
            >
              Contacter un conseiller
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default GeniaLAvocat;
