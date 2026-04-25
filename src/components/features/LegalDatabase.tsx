import React, { useState } from 'react';
import { BookOpen, Scale, FileText, Search, Filter, Download, Bookmark, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

interface LegalDocument {
  id: number;
  title: string;
  type: 'code' | 'article' | 'jurisprudence' | 'doctrine';
  category: string;
  content: string;
  source: string;
  date: string;
  tags: string[];
  isBookmarked: boolean;
}

const LegalDatabase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [results, setResults] = useState<LegalDocument[]>([]);

  const categories = [
    { id: 'all', name: 'Toutes les catégories' },
    { id: 'civil', name: 'Droit civil' },
    { id: 'penal', name: 'Droit pénal' },
    { id: 'travail', name: 'Droit du travail' },
    { id: 'commerce', name: 'Droit commercial' },
    { id: 'administratif', name: 'Droit administratif' },
  ];

  const documentTypes = [
    { id: 'all', name: 'Tous les types', icon: FileText },
    { id: 'code', name: 'Codes', icon: BookOpen },
    { id: 'article', name: 'Articles', icon: FileText },
    { id: 'jurisprudence', name: 'Jurisprudence', icon: Scale },
    { id: 'doctrine', name: 'Doctrine', icon: BookOpen },
  ];

  const mockDocuments: LegalDocument[] = [
    {
      id: 1,
      title: 'Code civil - Livre III, Titre IV',
      type: 'code',
      category: 'civil',
      content: 'Des obligations en général. Les obligations naissent de la loi, du contrat, du quasi-contrat, du délit et du quasi-délit.',
      source: 'Code civil',
      date: '2024-01-15',
      tags: ['obligations', 'contrat', 'responsabilité'],
      isBookmarked: false,
    },
    {
      id: 2,
      title: 'Article 1382 - Responsabilité délictuelle',
      type: 'article',
      category: 'civil',
      content: 'Tout fait quelconque de l\'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer.',
      source: 'Code civil',
      date: '2024-01-15',
      tags: ['responsabilité', 'dommage', 'faute'],
      isBookmarked: true,
    },
    {
      id: 3,
      title: 'Cass. civ. 1ère, 3 novembre 2020 - Harcèlement moral',
      type: 'jurisprudence',
      category: 'travail',
      content: 'Le harcèlement moral se caractérise par des agissements répétés qui ont pour objet ou pour effet une dégradation des conditions de travail...',
      source: 'Cour de cassation',
      date: '2024-01-10',
      tags: ['harcèlement', 'travail', 'conditions'],
      isBookmarked: false,
    },
    {
      id: 4,
      title: 'Article 222-33 - Harcèlement sexuel',
      type: 'article',
      category: 'penal',
      content: 'Le fait de harceler autrui par des propos ou comportements à connotation sexuelle est puni de deux ans d\'emprisonnement...',
      source: 'Code pénal',
      date: '2024-01-12',
      tags: ['harcèlement', 'sexuel', 'pénal'],
      isBookmarked: false,
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setResults(mockDocuments.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = documentTypes.find(t => t.id === type);
    return typeConfig ? typeConfig.icon : FileText;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'code':
        return 'bg-primary-100 text-primary-800';
      case 'article':
        return 'bg-success-100 text-success-800';
      case 'jurisprudence':
        return 'bg-warning-100 text-warning-800';
      case 'doctrine':
        return 'bg-accent-100 text-accent-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'civil':
        return 'bg-blue-100 text-blue-800';
      case 'penal':
        return 'bg-red-100 text-red-800';
      case 'travail':
        return 'bg-green-100 text-green-800';
      case 'commerce':
        return 'bg-purple-100 text-purple-800';
      case 'administratif':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 text-primary-600 mr-2" />
            Base de données juridique
          </CardTitle>
          <CardDescription>
            Accédez à l'ensemble des textes de loi, jurisprudence et doctrine française
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <Input
                type="text"
                placeholder="Rechercher un article, une jurisprudence, un concept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Type de document
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button type="submit" className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres avancés
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Code civil', icon: BookOpen, color: 'bg-blue-500' },
          { title: 'Code pénal', icon: Scale, color: 'bg-red-500' },
          { title: 'Code du travail', icon: FileText, color: 'bg-green-500' },
          { title: 'Code de commerce', icon: BookOpen, color: 'bg-purple-500' },
        ].map((item, index) => (
          <Card key={index} hover className="cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-secondary-900">{item.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-secondary-900">
              Résultats ({results.length})
            </h3>
            <div className="text-sm text-secondary-500">
              Triés par pertinence
            </div>
          </div>

          <div className="space-y-4">
            {results.map((document) => {
              const TypeIcon = getTypeIcon(document.type);
              return (
                <Card key={document.id} hover>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary-50 rounded-lg">
                          <TypeIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-secondary-900 mb-2">
                            {document.title}
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(document.type)}`}>
                              {document.type === 'code' ? 'Code' :
                               document.type === 'article' ? 'Article' :
                               document.type === 'jurisprudence' ? 'Jurisprudence' : 'Doctrine'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
                              {categories.find(c => c.id === document.category)?.name}
                            </span>
                          </div>
                          <p className="text-secondary-600 mb-4 leading-relaxed">
                            {document.content}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {document.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center text-sm text-secondary-500">
                            <span>{document.source}</span>
                            <span className="mx-2">•</span>
                            <span>{document.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Voir le détail
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={document.isBookmarked ? 'text-warning-600' : ''}
                        >
                          <Bookmark className={`h-4 w-4 ${document.isBookmarked ? 'fill-current' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && results.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-secondary-600 mb-6">
              Essayez avec d'autres mots-clés ou utilisez des termes plus généraux.
            </p>
            <Button variant="outline">
              Nouvelle recherche
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LegalDatabase;
