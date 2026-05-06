import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Users, Scale, Shield, Star, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  const navigate = useNavigate();

  const team = [
    {
      name: 'Me. Alice Dupont',
      role: 'Fondatrice & Avocate',
      description: 'Expertise en droit du travail et assistance aux particuliers.',
      icon: Users
    },
    {
      name: 'Me. Julien Martin',
      role: 'Responsable Juridique',
      description: 'Spécialiste en droit civil et procédure légale.',
      icon: Shield
    },
    {
      name: 'Sophie Laurent',
      role: 'Lead Développeuse',
      description: 'Création d’outils IA pour simplifier l’accès au droit.',
      icon: Star
    }
  ];

  const whyChooseUs = [
    {
      title: 'Accessibilité',
      description: 'Accédez à l’information juridique 24/7.',
      icon: Scale
    },
    {
      title: 'Efficacité',
      description: 'Gagnez du temps avec nos outils IA.',
      icon: Shield
    },
    {
      title: 'Satisfaction',
      description: 'Support réactif et personnalisé.',
      icon: MessageSquare
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
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
    <div className="min-h-screen bg-secondary-50 overflow-x-hidden">

      {/* HERO PRO */}
      <section className="py-32 bg-white relative">
        <div className="container grid md:grid-cols-2 gap-16 items-center px-4">
          {/* LEFT TEXT */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-black mb-8 text-secondary-900 tracking-tight leading-tight">
              À propos de <span className="text-primary-600">France Justice</span>
            </h1>

            <p className="text-xl text-secondary-600 mb-10 leading-relaxed font-medium">
              Notre mission est de rendre le droit accessible à tous grâce à 
              l’intelligence artificielle et des services juridiques simplifiés en France.
            </p>

            <Button size="lg" className="relative overflow-hidden
            px-5 py-2 text-sm rounded-xl border border-blue-600 text-white
            before:absolute before:inset-0
            before:bg-linear-to-r before:from-blue-600 before:via-white before:to-red-600
            before:opacity-0 before:transition-opacity before:duration-300
            hover:before:opacity-100
            hover:text-black
            z-0 before:z-[-1]
            transition-all hover:scale-105 active:scale-95" onClick={() => navigate('/services')}>
              Découvrir nos services
            </Button>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1 }}
            className="hidden md:block relative px-4"
          >
            <div className="absolute -inset-4 bg-primary-100 rounded-3xl -rotate-3 z-0" />
            <img
              src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop"
              alt="Justice"
              className="relative z-10 rounded-2xl shadow-2xl object-cover w-full h-[500px]"
            />
          </motion.div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-24 bg-secondary-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 border border-white rounded-full" />
            <div className="absolute bottom-10 right-10 w-96 h-96 border border-white rounded-full opacity-50" />
        </div>
        <div className="container max-w-4xl mx-auto text-center px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tight">Notre mission</h2>
            <p className="text-xl text-primary-100 mb-6 font-medium leading-relaxed">
              Simplifier l’accès aux services juridiques et rendre le droit compréhensible pour chaque citoyen.
            </p>
            <p className="text-lg text-secondary-300">
              Nous combinons expertise juridique de haut niveau et technologie d'intelligence artificielle pour une expérience fluide, sécurisée et efficace au service de la justice.
            </p>
          </motion.div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-32 bg-white">
        <div className="container px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-center mb-20 tracking-tight"
          >
            Notre équipe
          </motion.h2>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-10"
          >
            {team.map((member, i) => {
              const Icon = member.icon;
              return (
                <motion.div key={i} variants={itemVariants}>
                  <Card className="h-full border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-3xl group overflow-hidden bg-secondary-50/50">
                    <CardHeader className="text-center pt-10">
                      <div className="w-20 h-20 mx-auto mb-6 bg-white shadow-lg rounded-2xl flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-300">
                        <Icon className="h-8 w-8 text-primary-600 group-hover:text-white transition-colors animate-pulse" />
                      </div>
                      <CardTitle className="text-2xl font-bold">{member.name}</CardTitle>
                      <CardDescription className="text-primary-600 font-bold uppercase tracking-widest text-xs mt-2">{member.role}</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-10">
                      <p className="text-secondary-600 text-center leading-relaxed">
                        {member.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-32 bg-secondary-50 relative overflow-hidden">
        <div className="container px-4 text-center">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black mb-20 tracking-tight"
          >
            Pourquoi nous choisir ?
          </motion.h2>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-10"
          >
            {whyChooseUs.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} variants={itemVariants}>
                  <Card className="h-full border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white p-6">
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center">
                        <Icon className="h-8 w-8 text-primary-600" />
                      </div>
                      <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-secondary-600 leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-600" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-700 to-indigo-900" />
        
        <div className="container relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center"
          >
            <h2 className="text-3xl md:text-6xl font-black text-white mb-10 tracking-tight text-center">
              Prêt à rejoindre l'aventure ?
            </h2>

            <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto font-medium text-center">
              Rejoignez une plateforme juridique moderne qui met la technologie au service de l'humain.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button 
                className="relative overflow-hidden
                px-5 py-2 text-sm rounded-xl border border-blue-600 text-white
                before:absolute before:inset-0
                before:bg-linear-to-r before:from-blue-600 before:via-white before:to-red-600
                before:opacity-0 before:transition-opacity before:duration-300
                hover:before:opacity-100
                hover:text-black
                z-0 before:z-[-1]
                transition-all hover:scale-105 active:scale-95" 
                onClick={() => navigate('/register')}
              >
                Créer un compte
              </Button>

              <Button 
                variant="outline" 
                className="relative overflow-hidden
                px-5 py-2 text-sm rounded-xl border border-blue-600 text-white
                before:absolute before:inset-0
                before:bg-linear-to-r before:from-blue-600 before:via-white before:to-red-600
                before:opacity-0 before:transition-opacity before:duration-300
                hover:before:opacity-100
                hover:text-black
                z-0 before:z-[-1]
                transition-all hover:scale-105 active:scale-95"
                onClick={() => navigate('/register/lawyer')}
              >
                Espace avocat
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default About;