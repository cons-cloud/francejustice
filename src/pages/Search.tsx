import React, { useState } from 'react';
import { Search, Scale, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { chatWithAI } from '../lib/gemini';
import { AuthModal } from '../components/ui/AuthModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface SearchPageProps {
  skipAuthCheck?: boolean;
}

const SearchPage: React.FC<SearchPageProps> = ({ skipAuthCheck = false }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const performSearch = async (q: string) => {
    setLoading(true);
    setAiExplanation(null);
    try {
      const prompt = `RECHERCHE JURIDIQUE AVEC INTERNET : "${q}"

INSTRUCTIONS :
1. Recherche sur Internet les informations les plus RÉCENTES sur ce sujet
2. Cite les articles de loi exacts (Code Civil, Code du Travail, Dahirs marocains, etc.)
3. Trouve les jurisprudences récentes (2024-2026) sur Internet
4. Donne des conseils pratiques et concrets
5. Cite tes sources avec les dates

Réponds de manière structurée et complète.`;
      
      const explanation = await chatWithAI(prompt);
      setAiExplanation(explanation);
      
      if (user) {
        await supabase.from('search_history').insert([{
          user_id: user.id,
          query: q,
          results_count: 1
        }]);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !skipAuthCheck) {
      setShowAuthModal(true);
      return;
    }
    if (query.trim()) performSearch(query.trim());
  };

  if (skipAuthCheck) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-secondary-400" />
            <form onSubmit={handleSubmit} className="flex gap-4">
              <Input
                className="pl-12 h-12 text-base flex-1"
                placeholder="Ex: licenciement, pension alimentaire, héritage..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" className="h-12 px-6 font-bold" disabled={loading}>
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Rechercher'}
              </Button>
            </form>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-secondary-600">L'IA analyse les textes de loi...</p>
          </div>
        )}

        {aiExplanation && (
          <Card className="border-l-4 border-l-primary-500">
            <CardHeader className="bg-primary-50">
              <CardTitle className="flex items-center gap-2 text-primary-900">
                <Scale className="h-6 w-6" />
                Analyse Juridique par l'IA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-secondary-800 leading-relaxed">
                {aiExplanation}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !aiExplanation && (
          <Card>
            <CardContent className="p-8 text-center text-secondary-400">
              <Scale className="h-12 w-12 mx-auto mb-4 text-primary-200" />
              <p className="text-lg font-medium">Posez votre question juridique</p>
              <p className="text-sm mt-1">Jurisprudence, codes, conseils — notre IA vous répond instantanément</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-primary-900 text-white py-16">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Recherche IA — Droit en Temps Réel</h1>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto">
            Accédez instantanément à la jurisprudence et aux textes de loi grâce à notre IA connectée à Internet en temps réel.
          </p>
        </div>
      </div>

      <div className="container -mt-12">
        <Card className="max-w-4xl mx-auto shadow-2xl border-none">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-secondary-400" />
                <Input
                  className="pl-12 h-14 text-lg"
                  placeholder="Ex: Code du travail licenciement, pension alimentaire droit français..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 font-bold" disabled={loading}>
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Rechercher'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <div className="mt-12 text-center py-20">
            <RefreshCw className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-xl text-secondary-600">L'IA analyse les textes de loi français...</p>
          </div>
        )}

        {aiExplanation && (
          <div className="mt-12 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-l-4 border-l-primary-500">
              <CardHeader className="bg-primary-50">
                <CardTitle className="flex items-center gap-2 text-primary-900">
                  <Scale className="h-6 w-6" />
                  Analyse Juridique par l'IA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-secondary-800 leading-relaxed text-lg">
                  {aiExplanation}
                </div>
              </CardContent>
            </Card>

            <div className="bg-warning-50 border border-warning-200 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-warning-600 mt-1 shrink-0" />
              <p className="text-warning-800">
                <strong>Attention:</strong> Cette analyse est générée par IA et fournie à titre informatif uniquement. 
                Elle ne remplace pas l'avis d'un avocat inscrit au barreau. Pour une assistance personnalisée, 
                nous vous recommandons de consulter un professionnel.
              </p>
            </div>
          </div>
        )}

        {!loading && !aiExplanation && (
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
            {[
              { title: "Jurisprudence", desc: "Décisions des tribunaux français", icon: Scale },
              { title: "Codes & Dahirs", desc: "Base complète des textes législatifs", icon: ExternalLink },
              { title: "Conseils IA", desc: "Explications simplifiées du droit", icon: Search }
            ].map((item, i) => (
              <div key={i} className="text-center p-8 bg-white rounded-3xl border border-secondary-100 hover:shadow-xl transition-all group">
                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 mb-2">{item.title}</h3>
                <p className="text-secondary-600">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default SearchPage;
