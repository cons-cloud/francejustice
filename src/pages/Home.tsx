import React, { useState, useEffect } from 'react';
import { Search, Scale, Shield, ArrowRight, Star, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import heroBg from '../assets/images/3.jpg';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { number: '1,500+', label: 'Articles de loi' },
    { number: '0+', label: 'Utilisateurs' },
    { number: '0+', label: 'Avocats' },
    { number: '0+', label: 'Documents' },
  ]);
  const [activeFormations, setActiveFormations] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchFormations();
    
    const formSub = supabase
      .channel('public-formations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'formations' }, () => fetchFormations())
      .subscribe();
      
    return () => { supabase.removeChannel(formSub); };
  }, []);

  const fetchFormations = async () => {
    const { data } = await supabase.from('formations').select('*').eq('status', 'Publié').order('created_at', { ascending: false }).limit(3);
    if (data) setActiveFormations(data);
  };

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: lawyersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'lawyer').eq('is_verified', true);
      const { count: docsCount } = await supabase.from('documents').select('*', { count: 'exact', head: true });
      
      setStats([
        { number: '1,500+', label: 'Articles de loi' },
        { number: `${usersCount || 0}+`, label: 'Utilisateurs' },
        { number: `${lawyersCount || 0}+`, label: 'Avocats' },
        { number: `${docsCount || 0}+`, label: 'Documents' },
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const features = [
    {
      icon: Search,
      title: 'Recherche IA',
      description: 'Recherche intelligente dans la jurisprudence et les textes de loi avec explications simplifiées.',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      icon: Scale,
      title: 'Base de données',
      description: 'Accès complet aux codes juridiques et à la jurisprudence récente.',
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      icon: BookOpen,
      title: 'Formations',
      description: 'Guides pratiques pour comprendre vos droits et vous former.',
      color: 'text-accent-600',
      bgColor: 'bg-accent-50',
    },
    {
      icon: Shield,
      title: 'Générateur de plaintes',
      description: 'Génération automatique de documents juridiques personnalisés.',
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
  ];

  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'Victime de harcèlement',
      content: 'France Justice m\'a aidée à comprendre mes droits et à déposer ma plainte facilement.',
      rating: 5,
    },
    {
      name: 'Jean Martin',
      role: 'Avocat',
      content: 'Une plateforme innovante qui améliore la productivité juridique.',
      rating: 5,
    },
    {
      name: 'Sophie Laurent',
      role: 'Étudiante en droit',
      content: 'L’outil IA est excellent pour comprendre les textes complexes.',
      rating: 5,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as any }
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* HERO SECTION */}
      <section className="relative h-[90vh] flex items-center justify-center">
        {/* Image */}
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-none text-balance">
              Votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">partenaire juridique</span>
            </h1>

            <p className="text-lg md:text-2xl text-secondary-200 mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
              Accédez facilement au droit grâce à notre intelligence artificielle,
              générez vos documents juridiques et trouvez un avocat en quelques clics.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Button
                size="lg"
                className="text-lg px-10 py-7 rounded-2xl bg-primary-600 hover:bg-primary-500 shadow-xl shadow-primary-600/30 transition-all hover:scale-105 active:scale-95"
                onClick={() => navigate('/login')}
              >
                Démarrez votre session
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="text-lg px-10 py-7 rounded-2xl border-white/30 text-white hover:bg-white hover:text-black backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                onClick={() => navigate('/services')}
              >
                Nos services
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-24 bg-white relative">
        <div className="container px-4">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-12"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={itemVariants} className="text-center group">
                <div className="text-3xl md:text-5xl font-black text-primary-600 mb-3 tracking-tighter group-hover:scale-110 transition-transform duration-300">
                  <AnimatedCounter value={stat.number} />
                </div>
                <div className="text-secondary-500 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
                <div className="mt-4 h-1.5 w-12 bg-primary-100 mx-auto rounded-full group-hover:w-20 transition-all duration-300" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-32 bg-secondary-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center text-center mb-24"
          >
            <h2 className="text-3xl md:text-5xl font-black text-secondary-900 mb-6 tracking-tight">
              Nos services innovants
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto text-center">
              Une technologie de pointe pour un accès démocratique au droit français.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-none shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden rounded-3xl">
                  <CardHeader className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-black/5`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-2xl font-bold group-hover:text-primary-600 transition-colors uppercase tracking-tight">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <CardDescription className="text-base leading-relaxed text-secondary-600">{feature.description}</CardDescription>
                  </CardContent>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PUBLIC FORMATIONS */}
      {activeFormations.length > 0 && (
        <section className="py-24 bg-white relative">
          <div className="container px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-black text-secondary-900 mb-6 tracking-tight">
                Catalogue de Formations
              </h2>
              <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
                Apprenez vos droits grâce à nos guides exclusifs préparés par des experts.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {activeFormations.map((f) => (
                <Card key={f.id} className="border-none shadow-lg hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-primary-50 rounded-t-xl pb-8">
                    <span className="text-xs font-bold text-primary-600 uppercase mb-2 inline-block px-3 py-1 bg-white rounded-full shadow-sm">{f.category}</span>
                    <CardTitle className="text-xl font-bold">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-secondary-600 font-medium mb-6">Durée: {f.duration} • {f.level}</p>
                    <Button variant="outline" className="w-full group" onClick={() => navigate('/login')}>
                      Accéder au cours
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="py-32 bg-secondary-50">
        <div className="container px-4">
          <motion.h2 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-center mb-20 tracking-tight"
          >
            La confiance de nos utilisateurs
          </motion.h2>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="h-full rounded-3xl border-secondary-100 bg-secondary-50/30 hover:bg-white transition-all duration-300">
                  <CardContent className="p-10">
                    <div className="flex mb-6 space-x-1">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-lg text-secondary-700 italic mb-8 font-medium">"{t.content}"</p>
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 uppercase">
                        {t.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-secondary-900">{t.name}</div>
                        <div className="text-sm text-primary-600 font-semibold">{t.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-600" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-indigo-800" />
        
        <div className="container px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center"
          >
            <h2 className="text-3xl md:text-6xl font-black text-white mb-8 tracking-tight text-center">
              Prêt à simplifier votre accès au droit ?
            </h2>
            <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-3xl mx-auto font-medium text-center">
              Rejoignez France Justice aujourd'hui et bénéficiez d'une assistance juridique 100% intelligente.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-12 py-8 rounded-2xl bg-white text-primary-700 hover:bg-primary-50 shadow-2xl scale-110"
                onClick={() => navigate('/register')}
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Home;