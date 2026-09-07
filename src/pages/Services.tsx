import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Search, Scale, Users, Shield, MessageSquare, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n';
import SEO from '../components/common/SEO';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
    
    // Real-time synchronization for services
    const servicesSub = supabase
      .channel('public-services-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services_just' }, () => fetchServices())
      .subscribe();

    return () => {
      supabase.removeChannel(servicesSub);
    };
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('services_just').select('*').eq('is_active', true);
      if (data && data.length > 0) {
        setServices(data);
      } else {
        setServices([
          { title: t('services.ai_search_title', 'Assistant IA GÉNIA-L'), description: t('services.ai_search_desc', 'Analyse automatique des lois, jurisprudences et précédents en temps réel.'), icon_name: 'Search', path: '/genia-l' },
          { title: t('services.generator_title', 'Générateur de Documents'), description: t('services.generator_desc', 'Création de plaintes, contrats, recours et actes juridiques anonymisés.'), icon_name: 'Shield', path: '/generator' },
          { title: t('services.formations_title', 'Visioconférences & Salles de Classe'), description: t('services.formations_desc', 'Cours en direct et masterclasses enregistrées jusqu’à +2h et >100 participants.'), icon_name: 'MessageSquare', path: '/classrooms' },
          { title: t('services.directory_title', 'Annuaire Avocats, Profs & Doctorants'), description: t('services.directory_desc', 'Consultez les profils vérifiés des avocats, enseignants et chercheurs.'), icon_name: 'Users', path: '/lawyers' },
          { title: t('services.reviews_title', 'Revues Scientifiques & Actualités'), description: t('services.reviews_desc', 'Flux d’actualités et revues de recherche juridique téléchargeables en PDF.'), icon_name: 'Scale', path: '/news' },
          { title: t('services.planning_title', 'Planning Annuel des Formations'), description: t('services.planning_desc', 'Agenda national interactif des formations et webinaires de l’année.'), icon_name: 'MessageSquare', path: '/classrooms' }
        ]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Search': return Search;
      case 'Shield': return Shield;
      case 'Users': return Users;
      case 'Scale': return Scale;
      case 'MessageSquare': return MessageSquare;
      default: return MessageSquare;
    }
  };

  const benefits = [
    t('services.benefit1', 'Plateforme sécurisée et conforme RGPD'),
    t('services.benefit2', 'Analyse IA rapide (moins de 24h)'),
    t('services.benefit3', 'Interface simple et intuitive'),
    t('services.benefit4', 'Accompagnement juridique expert'),
  ];

  const faqs = [
    {
      question: t('services.faq_q1', 'Qui peut utiliser la plateforme ?'),
      answer: t('services.faq_a1', 'Particuliers, entreprises et avocats souhaitant moderniser leur pratique.')
    },
    {
      question: t('services.faq_q2', 'Les documents sont-ils valables ?'),
      answer: t('services.faq_a2', 'Oui, ils respectent les standards juridiques et sont conçus pour être utilisés officiellement.')
    },
    {
      question: t('services.faq_q3', 'Mes données sont-elles protégées ?'),
      answer: t('services.faq_a3', 'Toutes les données sont chiffrées de bout en bout et stockées de manière sécurisée.')
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <SEO 
        title="Services Juridiques IA & Consultations Avocats" 
        description="Découvrez tous nos services juridiques : recherche IA, visioconférence chiffrée avec avocats, générateur de documents et formations certifiantes."
        keywords="services juridiques, avocat en ligne, consultation avocat, générateur contrat, IA droit, visioconférence avocat"
      />

      {/* HERO PRO */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-cyan-50/70 via-white to-slate-50 relative overflow-hidden border-b border-slate-200/80">
        <div className="container grid md:grid-cols-2 gap-16 items-center px-4 relative z-10">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100/80 text-cyan-800 border border-cyan-200 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Plateforme Juridique d'Excellence
            </div>
            <h1 className="text-4xl md:text-7xl font-black mb-8 text-slate-900 tracking-tight leading-none text-balance">
              {t('services.hero_title_left', 'Des services')}{' '}
              <span className="text-cyan-600">{t('services.hero_title_highlight', 'juridiques')}</span>{' '}
              {t('services.hero_title_right', 'modernes')}
            </h1>

            <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
              {t('services.hero_subtitle', 'Just-Law combine intelligence artificielle de pointe et expertise humaine pour simplifier l’accès au droit et accélérer vos démarches.')}
            </p>

            <div className="flex gap-4 flex-wrap">
              <Button size="lg" className="px-8 py-6 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-lg shadow-cyan-600/20" onClick={() => navigate('/register')}>
                {t('services.hero_cta', 'Démarrez maintenant')}
              </Button>

              <Button variant="outline" size="lg" className="px-8 py-6 rounded-2xl border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400" onClick={() => navigate('/register/lawyer')}>
                {t('services.hero_lawyer_cta', 'Espace avocat')}
              </Button>
            </div>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="hidden md:block"
          >
            <img
              src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=1200&auto=format&fit=crop"
              alt="Legal services"
              className="rounded-3xl shadow-xl object-cover w-full h-[520px] border border-slate-200"
            />
          </motion.div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="py-24 relative bg-slate-50/60 border-b border-slate-200/80">
        <div className="container px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-slate-900">
              {t('services.grid_title', 'Ce que nous proposons')}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium text-center">
              {t('services.grid_subtitle', 'Une suite complète d’outils intelligents pour gérer vos problématiques juridiques en toute simplicité.')}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-20"
              >
                <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-cyan-600"></div>
              </motion.div>
            ) : (
              <motion.div 
                key="services"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid md:grid-cols-3 gap-8"
              >
                {services.map((service, i) => {
                  const Icon = getIcon(service.icon_name);
                  return (
                    <motion.div key={i} variants={itemVariants}>
                      <Card 
                        className="h-full border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cyan-400 transition-all duration-300 rounded-3xl group bg-white overflow-hidden cursor-pointer"
                        onClick={() => navigate(service.path)}
                      >
                        <CardHeader className="pt-8 px-8">
                          <div className="w-14 h-14 mb-6 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-center group-hover:bg-cyan-600 transition-colors duration-300">
                            <Icon className="h-7 w-7 text-cyan-600 group-hover:text-white transition-colors" />
                          </div>
                          <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">{service.title}</CardTitle>
                        </CardHeader>

                        <CardContent className="px-8 pb-8">
                          <CardDescription className="text-base text-slate-600 leading-relaxed">
                            {service.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-24 bg-white relative overflow-hidden border-b border-slate-200/80">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tight leading-tight text-slate-900 text-balance">
                {t('services.why_title_left', 'Pourquoi choisir')}{' '}
                <span className="text-cyan-600">France Justice</span> ?
              </h2>

              <div className="space-y-4">
                {benefits.map((b, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-cyan-300 transition-colors"
                  >
                    <div className="bg-cyan-100/80 border border-cyan-200 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-cyan-700" />
                    </div>
                    <span className="text-base font-bold text-slate-800">{b}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-cyan-50 border border-cyan-100 rounded-3xl rotate-2 z-0" />
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop"
                alt="Trust"
                className="relative z-10 rounded-2xl shadow-xl border border-slate-200 object-cover w-full h-[460px]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* GENIA-L PROMO */}
      <section className="py-24 relative overflow-hidden bg-slate-50/60 border-b border-slate-200/80">
        <div className="container px-4 relative z-10">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-cyan-50 via-white to-teal-50/60 rounded-3xl border border-cyan-200/80 p-8 md:p-14 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="h-48 w-48 text-cyan-600" />
            </div>

            <div className="grid md:grid-cols-5 gap-10 items-center">
              <div className="md:col-span-3 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-bold tracking-wide uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                  {t('services.genia_badge', 'Nouveau service IA')}
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-slate-900">
                  {t('services.genia_title', 'GénIA-L Avocat')}{' '}
                  <span className="text-cyan-600">
                    {t('services.genia_title_gradient', "l'IA générative")}
                  </span>{' '}
                  {t('services.genia_title_end', 'pour les professionnels')}
                </h2>
                
                <p className="text-base text-slate-600 leading-relaxed">
                  {t('services.genia_description', 'Augmentez votre productivité au quotidien : recherche jurisprudentielle ultrarapide, génération intelligente de projets d’actes et analyse approfondie de pièces contractuelles complexes.')}
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-cyan-600 shrink-0" />
                    <span className="text-slate-800 font-semibold text-sm">{t('services.genia_benefit1', 'Gain de temps de 50%')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-cyan-600 shrink-0" />
                    <span className="text-slate-800 font-semibold text-sm">{t('services.genia_benefit2', 'Données 100% sécurisées')}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col justify-center gap-3">
                <Button 
                  size="lg" 
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-cyan-600/20 text-center flex items-center justify-center gap-2" 
                  onClick={() => navigate('/genia-l')}
                >
                  {t('services.genia_discover', 'Découvrir GénIA-L Avocat')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                
                <button 
                  className="w-full py-3 text-slate-600 hover:text-cyan-700 font-semibold text-sm transition-colors flex items-center justify-center gap-1"
                  onClick={() => navigate('/contact')}
                >
                  {t('services.genia_demo', 'Demander une démo personnalisée')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USERS VS LAWYERS */}
      <section className="py-24 relative bg-white border-b border-slate-200/80">
        <div className="container px-4 text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3 text-slate-900">{t('services.audience_title', 'Une solution pour tous')}</h2>
            <p className="text-lg text-slate-600 font-medium">{t('services.audience_subtitle', 'Deux espaces dédiés pour une collaboration optimale.')}</p>
        </div>
        <div className="container px-4 grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full rounded-3xl border border-slate-200 shadow-md p-8 hover:shadow-xl hover:border-cyan-400 transition-all bg-white text-slate-900">
              <CardHeader>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 mb-6">
                    <Users className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">{t('services.audience_citizens_title', 'Citoyens')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-slate-600 mb-8 leading-relaxed">
                  {t('services.audience_citizens_desc', 'Déposez vos dossiers, générez vos documents officiels et obtenez de l’aide intelligente instantanément.')}
                </p>
                <Button size="lg" className="w-full py-6 rounded-2xl font-bold text-base bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20" onClick={() => navigate('/register')}>
                  {t('services.audience_citizens_cta', 'Créer mon compte citoyen')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full rounded-3xl border border-slate-200 shadow-md p-8 hover:shadow-xl hover:border-cyan-400 transition-all bg-white text-slate-900">
              <CardHeader>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 mb-6">
                    <Scale className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">{t('services.audience_lawyers_title', 'Avocats')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-slate-600 mb-8 leading-relaxed">
                  {t('services.audience_lawyers_desc', 'Gérez vos clients, automatisez votre secrétariat juridique et accédez à une base de données surpuissante.')}
                </p>
                <Button variant="outline" size="lg" className="w-full py-6 rounded-2xl font-bold text-base border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400" onClick={() => navigate('/register/lawyer')}>
                  {t('services.audience_lawyers_cta', 'Rejoindre le réseau Just-Law')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50/60 border-b border-slate-200/80">
        <div className="container max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-slate-900">{t('faq.title')}</h2>
            <p className="text-lg text-slate-600 font-medium">{t('faq.subtitle')}</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="rounded-2xl border border-slate-200 bg-white text-slate-900 hover:border-cyan-400 transition-colors cursor-pointer group shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-700 transition-colors text-slate-900">{faq.question}</h3>
                    <p className="text-base text-slate-600 leading-relaxed font-normal">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-gradient-to-b from-cyan-50/50 via-cyan-100/30 to-white relative overflow-hidden">
        <div className="container relative z-10 text-center px-4">
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="flex flex-col items-center justify-center max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight text-center">
              {t('services.cta_title_left', 'Passez à l’action')}{' '}
              <span className="text-cyan-600 underline decoration-cyan-400">{t('services.cta_title_highlight', 'maintenant')}</span>
            </h2>

            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium text-center">
              {t('services.cta_subtitle', "Accédez à vos droits et gérez vos dossiers plus rapidement avec l'IA avancée de France Justice.")}
            </p>

            <Button 
              size="lg" 
              className="text-lg px-12 py-8 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-xl shadow-cyan-600/25 hover:scale-105 transition-all"
              onClick={() => navigate('/register')}
            >
              {t('services.cta_btn', 'Commencer gratuitement')}
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Services;