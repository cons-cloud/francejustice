import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Users, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  ArrowLeft, 
  Scale, 
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const quickLinks = [
    {
      title: "Accueil & Services",
      desc: "Portail public officiel France Justice",
      icon: Home,
      href: "/",
      color: "from-cyan-500 to-teal-600",
    },
    {
      title: "Trouver un Avocat",
      desc: "Annuaire des avocats vérifiés aux barreaux",
      icon: Users,
      href: "/lawyers",
      color: "from-blue-600 to-indigo-600",
    },
    {
      title: "Recherche Légifrance",
      desc: "75+ Codes de lois & jurisprudences",
      icon: Search,
      href: "/search",
      color: "from-teal-500 to-emerald-600",
    },
    {
      title: "GéniaL'Avocat (IA 24/7)",
      desc: "Consultation et analyse de dossiers par IA",
      icon: Sparkles,
      href: "/genia-l",
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Formations Diplômantes",
      desc: "Masterclass & certifications juridiques",
      icon: BookOpen,
      href: "/classrooms",
      color: "from-purple-600 to-pink-600",
    },
    {
      title: "Mon Espace Juridique",
      desc: "Accéder à vos dossiers et consultations",
      icon: Scale,
      href: "/login",
      color: "from-cyan-600 to-blue-700",
    },
  ];

  return (
    <div className="min-h-[85vh] bg-white text-slate-900 flex flex-col items-center justify-center px-4 py-12 select-none relative overflow-hidden">
      {/* Background Decorative Ambient Radial Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full text-center relative z-10 space-y-8">
        {/* Error Code & Scales Badge */}
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-black uppercase tracking-widest mb-4 shadow-2xs">
            <Compass className="w-4 h-4 text-cyan-600 animate-spin-slow" />
            <span>Erreur 404 • Page Non Trouvée</span>
          </div>

          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-700">
            404
          </h1>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Oups ! Cette page juridique semble introuvable.
          </h2>

          <p className="text-base text-slate-600 max-w-lg mt-2 leading-relaxed">
            L'URL saisie n'existe pas ou a été mise à jour lors de l'intégration des nouveaux Codes de lois et services IA de France Justice.
          </p>
        </div>

        {/* Live Search Bar directly inside 404 page */}
        <div className="max-w-xl mx-auto w-full">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-lg shadow-cyan-900/5 rounded-2xl border-2 border-slate-200 focus-within:border-cyan-500 transition-all bg-white p-1">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article de loi, avocat, barème, contrat..."
              className="w-full px-3 py-2.5 text-sm text-slate-900 bg-transparent placeholder-slate-400 focus:outline-none"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold px-4 py-2 text-xs shrink-0 cursor-pointer shadow-sm"
            >
              Rechercher
            </Button>
          </form>
        </div>

        {/* Quick Recommended Destinations Grid */}
        <div className="text-left space-y-3 pt-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Pages Recommandées & Accès Rapide
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {quickLinks.map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-cyan-50/50 hover:border-cyan-300 transition-all text-left shadow-2xs group cursor-pointer"
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm px-6 py-2.5 cursor-pointer w-full sm:w-auto"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Page précédente
          </Button>

          <Button
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-sm px-6 py-2.5 shadow-md shadow-cyan-600/20 cursor-pointer w-full sm:w-auto"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Retourner à l'accueil
          </Button>

          <Button
            variant="ghost"
            className="text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50 text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer w-full sm:w-auto"
            onClick={() => navigate('/contact')}
          >
            <HelpCircle className="h-4 w-4 mr-1.5" />
            Signaler un lien mort
          </Button>
        </div>

        {/* Security & Deontology Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>France Justice • Plateforme conforme CNIL, RGPD & Déontologie des Barreaux</span>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
