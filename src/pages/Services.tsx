import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Search, Scale, Users, Shield, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
    
    // Real-time synchronization for services
    const servicesSub = supabase
      .channel('public-services-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => fetchServices())
      .subscribe();

    return () => {
      supabase.removeChannel(servicesSub);
    };
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('services').select('*').eq('is_active', true);
      if (data && data.length > 0) {
        setServices(data);
      } else {
        setServices([
          { title: 'Recherche IA juridique', description: 'Analyse automatique des lois, jurisprudences et précédents.', icon_name: 'Search', path: '/assistant' },
          { title: 'Générateur de documents', description: 'Création de plaintes, contrats et recours.', icon_name: 'Shield', path: '/generator' },
          { title: 'Formation & ressources', description: 'Guides pratiques pour comprendre vos droits.', icon_name: 'MessageSquare', path: '/search' }
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
    'Plateforme sécurisée et conforme RGPD',
    'Analyse IA rapide (moins de 24h)',
    'Interface simple et intuitive',
    'Accompagnement juridique expert',
  ];

  const faqs = [
    {
      question: 'Qui peut utiliser la plateforme ?',
      answer: 'Particuliers, entreprises et avocats souhaitant moderniser leur pratique.'
    },
    {
      question: 'Les documents sont-ils valables ?',
      answer: 'Oui, ils respectent les standards juridiques français et sont conçus pour être utilisés officiellement.'
    },
    {
      question: 'Mes données sont-elles protégées ?',
      answer: 'Toutes les données sont chiffrées de bout en bout et stockées de manière sécurisée sur Supabase.'
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
              Des services <span className="text-primary-600">juridiques</span> modernes
            </h1>

            <p className="text-xl text-secondary-600 mb-10 leading-relaxed font-medium">
              France Justice  combine intelligence artificielle de pointe et expertise humaine 
              pour simplifier l’accès au droit et accélérer vos démarches en France.
            </p>

            <div className="flex gap-6 flex-wrap">
              <Button size="lg" className="relative overflow-hidden
              px-5 py-2 text-sm rounded-xl border border-blue-600 text-whithe
              before:absolute before:inset-0
              before:bg-linear-to-r before:from-blue-600 before:via-white before:to-red-600
              before:opacity-0 before:transition-opacity before:duration-300
              hover:before:opacity-100
              hover:text-black
              z-0 before:z-[-1]
              transition-all hover:scale-105 active:scale-95" onClick={() => navigate('/register')}>
                Démarrez maintenant
              </Button>

              <Button variant="outline" size="lg" className="relative overflow-hidden
              px-5 py-2 text-sm rounded-xl border border-blue-600 text-blue-600
              before:absolute before:inset-0
              before:bg-linear-to-r before:from-blue-600 before:via-white before:to-red-600
              before:opacity-0 before:transition-opacity before:duration-300
              hover:before:opacity-100
              hover:text-black
              z-0 before:z-[-1]
              transition-all hover:scale-105 active:scale-95" 
              onClick={() => navigate('/register/lawyer')}>
                Espace avocat
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
            className=" container flex flex-col items-center text-center mb-24"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
              Ce que nous proposons
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto font-medium text-center">
              Une suite complète d’outils intelligents pour gérer vos problématiques juridiques en toute simplicité.
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
                Pourquoi choisir <span className="text-primary-600">France Justice</span> ?
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

      {/* USERS VS LAWYERS */}
      <section className="py-32 relative">
        <div className="container px-4 text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Une solution pour tous</h2>
            <p className="text-xl text-secondary-600 font-medium">Deux espaces dédiés pour une collaboration optimale.</p>
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
                <CardTitle className="text-3xl font-bold">Citoyens</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-secondary-600 mb-8 leading-relaxed">
                  Déposez vos dossiers, générez vos documents officiels et obtenez de l’aide intelligente instantanément.
                </p>
                <Button size="lg" className="relative overflow-hidden
                px-5 py-2 text-sm rounded-xl border border-blue-600 text-white
                before:absolute before:inset-0
                before:bg-linear-to-r before:from-blue-600 before:via-white before:to-red-600
                before:opacity-0 before:transition-opacity before:duration-300
                hover:before:opacity-100
                hover:text-black
                z-0 before:z-[-1]
                transition-all hover:scale-105 active:scale-95" onClick={() => navigate('/register')}>
                  Créer mon compte citoyen
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
                <CardTitle className="text-3xl font-bold">Avocats</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-secondary-600 mb-8 leading-relaxed">
                  Gérez vos clients, automatisez votre secrétariat juridique et accédez à une base de données surpuissante.
                </p>
                <Button variant="outline" size="lg" className="relative overflow-hidden
                px-5 py-2 text-sm rounded-xl border border-blue-600 text-white
                before:absolute before:inset-0
                before:bg-linear-to-r before:from-blue-600 before:via-white before:to-red-600
                before:opacity-0 before:transition-opacity before:duration-300
                hover:before:opacity-100
                hover:text-white
                z-0 before:z-[-1]
                transition-all hover:scale-105 active:scale-95" onClick={() => navigate('/register/lawyer')}>
                  Rejoindre le réseau France Justice 
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
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Questions fréquentes</h2>
            <p className="text-xl text-secondary-600 font-medium">Tout ce que vous devez savoir sur nos services.</p>
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
              Passez à l’action <span className="text-primary-200 underline decoration-primary-400">maintenant</span>
            </h2>

            <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-3xl mx-auto font-medium text-center">
              Accédez à vos droits et gérez vos dossiers plus rapidement avec l'IA avancée de France Justice.
            </p>

            <Button 
              size="lg" 
              variant="secondary" 
              className="relative overflow-hidden
              px-5 py-2 text-sm rounded-xl border border-blue-600 text-blue-600
              before:absolute before:inset-0
              before:bg-linear-to-r before:from-blue-600 before:via-white before:to-red-600
              before:opacity-0 before:transition-opacity before:duration-300
              hover:before:opacity-100
              hover:text-black
              z-0 before:z-[-1]
              transition-all hover:scale-105 active:scale-95"
              onClick={() => navigate('/register')}
            >
              Commencer gratuitement
              <ArrowRight className="ml-3 h-8 w-8" />
            </Button>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Services;