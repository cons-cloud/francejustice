import React, { useState, useEffect } from 'react';
import { 
  User, 
  FileText, 
  Search, 
  Plus, 
  BarChart3,
  Calendar,
  MessageSquare,
  RefreshCw,
  Shield,
  Download,
  LogOut
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { DocumentGenerator } from './Generator';

const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      
      const docsSub = supabase
        .channel('user-docs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `owner_id=eq.${user.id}` }, () => fetchDocuments())
        .subscribe();
        
      const searchSub = supabase
        .channel('user-search')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'search_history', filter: `user_id=eq.${user.id}` }, () => fetchSearches())
        .subscribe();
        
      const formSub = supabase
        .channel('user-formations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'formations' }, () => fetchFormations())
        .subscribe();
        
      return () => {
        docsSub.unsubscribe();
        searchSub.unsubscribe();
        formSub.unsubscribe();
      };
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    await Promise.all([fetchDocuments(), fetchSearches(), fetchFormations()]);
    setLoading(false);
  };

  const fetchDocuments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const fetchFormations = async () => {
    const { data } = await supabase
      .from('formations')
      .select('*')
      .eq('status', 'Publié')
      .order('created_at', { ascending: false });
    if (data) setFormations(data);
  };

  const fetchSearches = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setSearches(data);
  };

  const tabs = [
    { id: 'overview', name: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'generator', name: 'Générateur IA', icon: Shield },
    { id: 'documents', name: 'Mes documents', icon: FileText },
    { id: 'searches', name: 'IA Juridique', icon: Search },
    { id: 'formations', name: 'Formations', icon: Search },
    { id: 'profile', name: 'Profil', icon: User },
  ];

  const stats = [
    { label: 'Documents', value: documents.length.toString(), icon: FileText, color: 'text-primary-600' },
    { label: 'Recherches', value: searches.length.toString(), icon: Search, color: 'text-success-600' },
    { label: 'Rendez-vous', value: '0', icon: Calendar, color: 'text-warning-600' },
    { label: 'Crédits IA', value: 'Illimité', icon: MessageSquare, color: 'text-accent-600' },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-secondary-50`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Documents récents</span>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('documents')}>
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <FileText className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{doc.name}</p>
                      <p className="text-sm text-secondary-500">{doc.type} • {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {documents.length === 0 && <p className="text-center text-secondary-500 py-4">Aucun document.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recherches récentes</span>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('searches')}>
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searches.slice(0, 3).map((search) => (
                <div key={search.id} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-success-50 rounded-lg">
                      <Search className="h-4 w-4 text-success-600" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{search.query}</p>
                      <p className="text-sm text-secondary-500">{search.results_count} résultats • {new Date(search.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Rechercher</Button>
                </div>
              ))}
              {searches.length === 0 && <p className="text-center text-secondary-500 py-4">Aucune recherche.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accédez à vos outils juridiques favoris
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => window.location.href='/generator'}>
              <Plus className="h-6 w-6" />
              <span>Générer un Document</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => window.location.href='/search'}>
              <Search className="h-6 w-6" />
              <span>Recherche Expert</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => window.location.href='/assistant'}>
              <MessageSquare className="h-6 w-6" />
              <span>IA Legal Assistant</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-secondary-900">Mes documents</h2>
        <Button onClick={() => window.location.href='/generator'}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau document
        </Button>
      </div>
      
      <div className="grid gap-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">{doc.name}</h3>
                    <p className="text-secondary-600">{doc.type} • Créé le {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && <div className="text-center py-12 bg-white rounded-xl">Aucun document généré.</div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-2">
            Bonjour, {profile?.first_name || 'Utilisateur'}
          </h1>
          <p className="text-secondary-600">
            Bienvenue sur votre portail juridique intelligent
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-6">
              <CardContent className="p-4 sm:p-6">
                <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:space-y-2 lg:overflow-visible no-scrollbar">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 lg:w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                            : 'text-secondary-600 hover:bg-secondary-100 hover:text-primary-600'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium whitespace-nowrap">{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
                <div className="w-full h-px bg-secondary-200 my-4" />
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 text-danger-600 hover:bg-danger-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium whitespace-nowrap">Déconnexion</span>
                </button>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3 order-1 lg:order-2">
            {loading ? (
              <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-primary-600" /></div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'generator' && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <DocumentGenerator />
                  </div>
                )}
                {activeTab === 'documents' && renderDocuments()}
                {activeTab === 'searches' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-secondary-900">Historique des recherches</h2>
                    <div className="grid gap-4">
                      {searches.map((s) => (
                        <Card key={s.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Search className="h-5 w-5 text-success-600" />
                              <div>
                                <p className="font-bold">{s.query}</p>
                                <p className="text-xs text-secondary-500">{new Date(s.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost">Relancer</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'formations' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-secondary-900">Formations et Guides</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formations.map((f) => (
                        <Card key={f.id}>
                          <CardContent className="p-6">
                            <div className="flex flex-col space-y-2">
                              <span className="text-xs font-bold text-primary-600 uppercase">{f.category}</span>
                              <h3 className="text-lg font-bold text-secondary-900">{f.title}</h3>
                              <p className="text-sm text-secondary-500">Durée: {f.duration} • Niveau: {f.level}</p>
                              <Button variant="outline" className="mt-4 w-full">Commencer le module</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'profile' && (
                  <Card>
                    <CardHeader><CardTitle>Votre Profil</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 bg-secondary-100 rounded-full flex items-center justify-center text-2xl font-bold">
                          {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-xl font-bold">{profile?.first_name} {profile?.last_name}</p>
                          <p className="text-secondary-500">{user?.email}</p>
                        </div>
                      </div>
                      <Button variant="outline">Modifier mes informations</Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
