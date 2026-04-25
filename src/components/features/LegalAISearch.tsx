import React, { useState } from 'react';
import { Search, Brain, FileText, Scale, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

interface SearchResult {
  id: number;
  title: string;
  type: 'article' | 'jurisprudence' | 'doctrine';
  content: string;
  relevance: number;
  source: string;
  date: string;
  aiExplanation?: string;
}

const LegalAISearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiExplanation, setAiExplanation] = useState('');

  const mockResults: SearchResult[] = [
    {
      id: 1,
      title: 'Article 1382 du Code civil - Responsabilité délictuelle',
      type: 'article',
      content: 'Tout fait quelconque de l\'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer.',
      relevance: 95,
      source: 'Code civil',
      date: '2024-01-15',
      aiExplanation: 'Cet article établit le principe général de la responsabilité civile. Il signifie que toute personne qui cause un dommage à autrui par sa faute doit le réparer. C\'est la base du droit de la responsabilité en France.'
    },
    {
      id: 2,
      title: 'Jurisprudence - Harcèlement moral au travail',
      type: 'jurisprudence',
      content: 'Le harcèlement moral se caractérise par des agissements répétés qui ont pour objet ou pour effet une dégradation des conditions de travail...',
      relevance: 88,
      source: 'Cass. soc., 3 novembre 2010',
      date: '2024-01-10',
      aiExplanation: 'Cette jurisprudence précise que le harcèlement moral nécessite des agissements répétés ayant pour but de dégrader les conditions de travail. Il faut prouver l\'intention de nuire et la répétition des faits.'
    }
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    
    // Simulation d'une recherche IA
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setResults(mockResults);
    setAiExplanation(`
      Basé sur votre recherche "${query}", voici les éléments juridiques pertinents :

      🔍 **Analyse IA** : Votre question touche au droit de la responsabilité civile et au harcèlement moral. 
      
      📚 **Concepts clés** :
      - Responsabilité délictuelle (art. 1382 C. civ.)
      - Harcèlement moral au travail
      - Preuve de la faute et du dommage
      
      ⚖️ **Recommandations** :
      - Conservez tous les éléments de preuve
      - Documentez les faits avec précision
      - Consultez un avocat spécialisé si nécessaire
    `);
    
    setIsSearching(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'jurisprudence':
        return <Scale className="h-4 w-4" />;
      case 'doctrine':
        return <Brain className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return 'bg-primary-100 text-primary-800';
      case 'jurisprudence':
        return 'bg-success-100 text-success-800';
      case 'doctrine':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 text-primary-600 mr-2" />
            Recherche juridique IA
          </CardTitle>
          <CardDescription>
            Posez votre question en langage naturel et obtenez des explications intelligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <Input
                type="text"
                placeholder="Ex: 'Que faire en cas de harcèlement au travail ?' ou 'Article 1382 code civil'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 text-lg"
                disabled={isSearching}
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={isSearching || !query.trim()}
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Recherche en cours...
                </>
              ) : (
                <>
                  Rechercher avec l'IA
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* AI Explanation */}
      {aiExplanation && (
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader>
            <CardTitle className="flex items-center text-primary-800">
              <Sparkles className="h-5 w-5 mr-2" />
              Explication IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-secondary-700">
                {aiExplanation}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-secondary-900">
            Résultats trouvés ({results.length})
          </h3>
          
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-50 rounded-lg">
                        {getTypeIcon(result.type)}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-secondary-900 mb-1">
                          {result.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-secondary-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                            {result.type === 'article' ? 'Article' : 
                             result.type === 'jurisprudence' ? 'Jurisprudence' : 'Doctrine'}
                          </span>
                          <span>{result.source}</span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {result.date}
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                            {result.relevance}% de pertinence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-secondary-600 mb-4 leading-relaxed">
                    {result.content}
                  </p>

                  {result.aiExplanation && (
                    <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4 mb-4">
                      <h5 className="font-semibold text-secondary-900 mb-2 flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-primary-600" />
                        Explication IA
                      </h5>
                      <p className="text-sm text-secondary-700">
                        {result.aiExplanation}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm">
                      Voir le détail complet
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        Sauvegarder
                      </Button>
                      <Button variant="ghost" size="sm">
                        Partager
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Suggestions */}
      {!query && (
        <Card>
          <CardHeader>
            <CardTitle>Suggestions de recherche</CardTitle>
            <CardDescription>
              Essayez ces recherches populaires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Harcèlement moral au travail',
                'Responsabilité civile article 1382',
                'Droit du licenciement',
                'Divorce par consentement mutuel',
                'Droit de la consommation',
                'Contrat de travail CDI'
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left h-auto p-4"
                  onClick={() => setQuery(suggestion)}
                >
                  <Search className="h-4 w-4 mr-3 text-secondary-500" />
                  <span className="text-sm">{suggestion}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LegalAISearch;
