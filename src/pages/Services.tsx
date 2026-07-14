import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Search, Scale, Users, Shield, MessageSquare, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n';

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
          { title: t('services.ai_search_title', 'Recherche IA juridique'), description: t('services.ai_search_desc', 'Analyse automatique des lois, jurisprudences et précédents.'), icon_name: 'Search', path: '/assistant' },
          { title: t('services.generator_title', 'Générateur de documents'), description: t('services.generator_desc', 'Création de plaintes, contrats et recours.'), icon_name: 'Shield', path: '/generator' },
          { title: t('services.formations_title', 'Formation & ressources'), description: t('services.formations_desc', 'Guides pratiques pour comprendre vos droits.'), icon_name: 'MessageSquare', path: '/search' }
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
    <div className="min-h-screen bg-secondary-50 overflow-x-hidden">

      {/* HERO PRO */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-50/30 skew-x-12 translate-x-1/2 pointer-events-none" />
        <div className="container grid md:grid-cols-2 gap-16 items-center px-4 relative z-10">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-7xl font-black mb-8 text-secondary-900 tracking-tight leading-none text-balance">
              {t('services.hero_title_left', 'Des services')}{' '}
              <span className="text-primary-600">{t('services.hero_title_highlight', 'juridiques')}</span>{' '}
              {t('services.hero_title_right', 'modernes')}
            </h1>

            <p className="text-xl text-secondary-600 mb-10 leading-relaxed font-medium">
              {t('services.hero_subtitle', 'Just-Law combine intelligence artificielle de pointe et expertise humaine pour simplifier l’accès au droit et accélérer vos démarches.')}
            </p>

            <div className="flex gap-6 flex-wrap">
              <Button size="lg" className="px-10 py-7 rounded-2xl shadow-xl shadow-primary-600/20" onClick={() => navigate('/register')}>
                {t('services.hero_cta', 'Démarrez maintenant')}
              </Button>

              <Button variant="outline" size="lg" className="px-10 py-7 rounded-2xl" onClick={() => navigate('/register/lawyer')}>
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
              className="rounded-3xl shadow-2xl object-cover w-full h-[550px]"
            />
          </motion.div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="py-32 relative">
        <div className="container px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
              {t('services.grid_title', 'Ce que nous proposons')}
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto font-medium text-center">
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
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
              </motion.div>
            ) : (
              <motion.div 
                key="services"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid md:grid-cols-3 gap-10"
              >
                {services.map((service, i) => {
                  const Icon = getIcon(service.icon_name);
                  return (
                    <motion.div key={i} variants={itemVariants}>
                      <Card 
                        className="h-full border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-3xl group bg-white overflow-hidden cursor-pointer"
                        onClick={() => navigate(service.path)}
                      >
                        <CardHeader className="pt-10 px-8">
                          <div className="w-16 h-16 mb-6 bg-primary-50 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-300">
                            <Icon className="h-8 w-8 text-primary-600 group-hover:text-white transition-colors" />
                          </div>
                          <CardTitle className="text-2xl font-bold group-hover:text-primary-600 transition-colors">{service.title}</CardTitle>
                        </CardHeader>

                        <CardContent className="px-8 pb-10">
                          <CardDescription className="text-base text-secondary-600 leading-relaxed">
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
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-black mb-10 tracking-tight leading-tight text-balance">
                {t('services.why_title_left', 'Pourquoi choisir')}{' '}
                <span className="text-primary-600">Just-Law</span> ?
              </h2>

              <div className="space-y-6">
                {benefits.map((b, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary-50 transition-colors"
                  >
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-lg font-bold text-secondary-700">{b}</span>
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
              <div className="absolute -inset-4 bg-primary-100 rounded-3xl rotate-3 z-0" />
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop"
                alt="Trust"
                className="relative z-10 rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* GENIA-L PROMO */}
      <section className="py-24 relative overflow-hidden bg-secondary-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.15),transparent_50%)]" />
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container px-4 relative z-10">
          <div className="max-w-5xl mx-auto bg-linear-to-r from-secondary-800/80 to-secondary-900/80 backdrop-blur-md rounded-3xl border border-secondary-800 p-8 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="h-48 w-48 text-primary-400" />
            </div>

            <div className="grid md:grid-cols-5 gap-12 items-center">
              <div className="md:col-span-3 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-semibold tracking-wide uppercase">
                  <Sparkles className="h-4 w-4" />
                  {t('services.genia_badge', 'Nouveau service IA')}
                </div>
                
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                  {t('services.genia_title', 'GénIA-L Avocat')}{' '}
                  <span className="bg-clip-text text-transparent bg-linear-to-r from-primary-400 to-indigo-400">
                    {t('services.genia_title_gradient', "l'IA générative")}
                  </span>{' '}
                  {t('services.genia_title_end', 'pour les professionnels')}
                </h2>
                
                <p className="text-lg text-secondary-300 leading-relaxed">
                  {t('services.genia_description', 'Augmentez votre productivité au quotidien : recherche jurisprudentielle ultrarapide, génération intelligente de projets d’actes et analyse approfondie de pièces contractuelles complexes.')}
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary-400 shrink-0" />
                    <span className="text-secondary-200 font-medium">{t('services.genia_benefit1', 'Gain de temps de 50%')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary-400 shrink-0" />
                    <span className="text-secondary-200 font-medium">{t('services.genia_benefit2', 'Données 100% sécurisées')}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col justify-center gap-4">
                <Button 
                  size="lg" 
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-6 rounded-2xl shadow-xl shadow-primary-600/20 hover:shadow-primary-600/30 transition-all text-center flex items-center justify-center gap-2" 
                  onClick={() => navigate('/genia-l')}
                >
                  {t('services.genia_discover', 'Découvrir GénIA-L Avocat')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                
                <button 
                  className="w-full py-4 text-secondary-400 hover:text-white font-semibold transition-colors flex items-center justify-center gap-1"
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
      <section className="py-32 relative">
        <div className="container px-4 text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{t('services.audience_title', 'Une solution pour tous')}</h2>
            <p className="text-xl text-secondary-600 font-medium">{t('services.audience_subtitle', 'Deux espaces dédiés pour une collaboration optimale.')}</p>
        </div>
        <div className="container px-4 grid md:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full rounded-3xl border-none shadow-xl p-8 hover:scale-[1.02] transition-transform">
              <CardHeader>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 mb-6">
                    <Users className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl font-bold">{t('services.audience_citizens_title', 'Citoyens')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-secondary-600 mb-8 leading-relaxed">
                  {t('services.audience_citizens_desc', 'Déposez vos dossiers, générez vos documents officiels et obtenez de l’aide intelligente instantanément.')}
                </p>
                <Button size="lg" className="w-full py-7 rounded-2xl font-bold text-lg" onClick={() => navigate('/register')}>
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
            <Card className="h-full rounded-3xl border-none shadow-xl p-8 hover:scale-[1.02] transition-transform">
              <CardHeader>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-600 mb-6">
                    <Scale className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl font-bold">{t('services.audience_lawyers_title', 'Avocats')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-secondary-600 mb-8 leading-relaxed">
                  {t('services.audience_lawyers_desc', 'Gérez vos clients, automatisez votre secrétariat juridique et accédez à une base de données surpuissante.')}
                </p>
                <Button variant="outline" size="lg" className="w-full py-7 rounded-2xl font-bold text-lg" onClick={() => navigate('/register/lawyer')}>
                  {t('services.audience_lawyers_cta', 'Rejoindre le réseau Just-Law')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 bg-white">
        <div className="container max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">{t('faq.title')}</h2>
            <p className="text-xl text-secondary-600 font-medium">{t('faq.subtitle')}</p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="rounded-2xl border-secondary-100 hover:border-primary-200 transition-colors cursor-pointer group">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{faq.question}</h3>
                    <p className="text-lg text-secondary-600 leading-relaxed font-medium">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-indigo-900" />
        <div className="container relative z-10 text-center px-4">
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="flex flex-col items-center justify-center"
          >
            <h2 className="text-4xl md:text-7xl font-black text-white mb-10 tracking-tight text-center">
              {t('services.cta_title_left', 'Passez à l’action')}{' '}
              <span className="text-primary-200 underline decoration-primary-400">{t('services.cta_title_highlight', 'maintenant')}</span>
            </h2>

            <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-3xl mx-auto font-medium text-center">
              {t('services.cta_subtitle', "Accédez à vos droits et gérez vos dossiers plus rapidement avec l'IA avancée de Just-Law.")}
            </p>

            <Button 
              size="lg" 
              variant="secondary" 
              className="text-xl px-16 py-10 rounded-3xl bg-white text-primary-700 hover:bg-primary-50 shadow-2xl hover:scale-110 active:scale-95 transition-all"
              onClick={() => navigate('/register')}
            >
              {t('services.cta_btn', 'Commencer gratuitement')}
              <ArrowRight className="ml-3 h-8 w-8" />
            </Button>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Services;