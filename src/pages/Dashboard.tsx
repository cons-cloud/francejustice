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
  LogOut,
  TrendingUp,
  Receipt,
  BookOpen,
  Users
} from 'lucide-react';
import { AdvancedAreaChart } from '../components/features/StatsCharts';
import { exportToJSON } from '../lib/exportUtils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { DocumentGenerator } from './Generator';
import { Chat } from '../components/features/Chat';
import Modal from '../components/ui/Modal';
import SearchPage from './Search';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';

const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { toasts, success, error: toastError, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showWelcome, setShowWelcome] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [formations, setFormations] = useState<any[]>([]);
  const [availableLawyers, setAvailableLawyers] = useState<any[]>([]);
  const [lawyerSearch, setLawyerSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', phone: '', city: '', postal_code: '', birth_date: ''
  });

  useEffect(() => {
    if (user && profile) {
      if (!sessionStorage.getItem('user_welcome_shown')) {
        setShowWelcome(true);
        sessionStorage.setItem('user_welcome_shown', 'true');
      }
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: (profile as any).phone || '',
        city: (profile as any).city || '',
        postal_code: (profile as any).postal_code || '',
        birth_date: (profile as any).birth_date || ''
      });
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
      const quotesSub = supabase
        .channel('user-quotes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes', filter: `client_id=eq.${user.id}` }, () => fetchQuotes())
        .subscribe();
        
      const chatSub = supabase
        .channel('user-chats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms', filter: `client_id=eq.${user.id}` }, () => fetchChatRooms())
        .subscribe();
        
      const lawyersSub = supabase
        .channel('citizen-lawyers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchLawyers)
        .subscribe();

      return () => {
        docsSub.unsubscribe();
        searchSub.unsubscribe();
        formSub.unsubscribe();
        quotesSub.unsubscribe();
        chatSub.unsubscribe();
        lawyersSub.unsubscribe();
      };
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    await Promise.all([fetchDocuments(), fetchSearches(), fetchFormations(), fetchQuotes(), fetchChatRooms(), fetchLawyers()]);
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

  const fetchQuotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('quotes')
      .select('*, profiles:lawyer_id(first_name, last_name, email)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setQuotes(data);
  };

  const fetchChatRooms = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_rooms')
      .select('*, profiles:lawyer_id(first_name, last_name, email)')
      .eq('client_id', user.id);
    if (data) setChatRooms(data);
  };

  const fetchLawyers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'lawyer')
      .eq('is_verified', true)
      .order('first_name');
    if (data) setAvailableLawyers(data);
  };

  const contactLawyer = async (lawyerId: string, lawyerName: string) => {
    if (!user) return;
    // Create or get existing chat room
    let { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .eq('client_id', user.id)
      .maybeSingle();
    if (!existingRoom) {
      const { data: newRoom } = await supabase
        .from('chat_rooms')
        .insert([{ lawyer_id: lawyerId, client_id: user.id }])
        .select().single();
      existingRoom = newRoom;
    }
    if (existingRoom) {
      await fetchChatRooms();
      setActiveRoom({ id: existingRoom.id, name: lawyerName });
      setActiveTab('chat');
    }
  };

  const downloadQuotePDF = (quote: any) => {
    const content = `
DEVIS JURIDIQUE
===============
Émission: ${new Date(quote.created_at).toLocaleDateString('fr-FR')}

Avocat: Me ${quote.profiles?.first_name} ${quote.profiles?.last_name}
Client: ${profile?.first_name} ${profile?.last_name}

Montant: ${quote.amount} MAD
Description: ${quote.description || ''}
Statut: ${quote.status === 'paid' ? 'Payé' : 'En attente'}

Ce document est généré par la plateforme JustLaw.
    `;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devis_${quote.id?.slice(0,8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error: saveErr } = await supabase.from('profiles').update({
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      phone: profileForm.phone,
      city: profileForm.city,
      postal_code: profileForm.postal_code,
      birth_date: profileForm.birth_date || null,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);
    if (saveErr) {
      toastError('Erreur', 'Impossible de sauvegarder. Vérifiez votre connexion.');
    } else {
      success('Profil mis à jour ✅', 'Vos informations sont synchronisées en temps réel.');
    }
  };

  const handlePayQuote = async (quote: any) => {
    try {
      const response = await fetch('/api/payments/create-checkout-session/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: quote.id,
          type: 'quote_payment',
          amount: Math.round(quote.amount * 100)
        })
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPersonalData = () => {
    const personalData = {
      profile,
      documents,
      searches,
      timestamp: new Date().toISOString()
    };
    exportToJSON(personalData, `mon_export_donnees_${user?.id}`);
  };

  const caseActivityData = [
    { name: 'Sem 1', value: 2 },
    { name: 'Sem 2', value: 5 },
    { name: 'Sem 3', value: 3 },
    { name: 'Sem 4', value: 8 },
  ];

  const tabs = [
    { id: 'overview', name: "Vue d'ensemble", icon: BarChart3 },
    { id: 'generator', name: 'Générateur IA', icon: Shield },
    { id: 'documents', name: 'Mes documents', icon: FileText },
    { id: 'quotes', name: 'Mes Devis', icon: Receipt },
    { id: 'chat', name: 'Discussion Avocat', icon: MessageSquare },
    { id: 'searches', name: 'IA Juridique', icon: Search },
    { id: 'formations', name: 'Formations', icon: BookOpen },
    { id: 'avocats', name: 'Annuaire Avocats', icon: Users },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progression des Dossiers</span>
              <TrendingUp className="h-4 w-4 text-primary-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedAreaChart data={caseActivityData} height={250} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>
              Gérer vos données personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full h-16 justify-start px-6 gap-3" onClick={handleDownloadPersonalData}>
              <Download className="h-5 w-5 text-primary-600" />
              <div className="text-left">
                <p className="font-bold">Mes Données</p>
                <p className="text-xs text-secondary-500">Télécharger tout (JSON)</p>
              </div>
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" className="h-20 flex-col space-y-1 text-xs" onClick={() => setActiveTab('generator')}>
                <Plus className="h-5 w-5 mb-1" />
                <span>Générer</span>
              </Button>
              <Button variant="ghost" className="h-20 flex-col space-y-1 text-xs" onClick={() => setActiveTab('searches')}>
                <Search className="h-5 w-5 mb-1" />
                <span>Recherche</span>
              </Button>
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
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('generator')}>
              <Plus className="h-6 w-6" />
              <span>Générer un Document</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('searches')}>
              <Search className="h-6 w-6" />
              <span>Recherche IA</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('chat')}>
              <MessageSquare className="h-6 w-6" />
              <span>Discussion Avocat</span>
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
        <Button onClick={() => setActiveTab('generator')}>
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
                <nav className="flex flex-wrap lg:flex-col gap-2 pb-2 lg:pb-0 lg:space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 lg:w-full flex items-center space-x-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-left transition-all duration-200 text-sm sm:text-base ${
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
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-secondary-900">Générateur de Documents Juridiques</h2>
                    <DocumentGenerator skipAuthCheck />
                  </div>
                )}
                {activeTab === 'quotes' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-secondary-900">Mes Devis & Honoraires</h2>
                    <div className="grid gap-4">
                      {quotes.map((q) => (
                        <Card key={q.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="p-3 bg-accent-50 rounded-lg">
                                  <Receipt className="h-6 w-6 text-accent-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-secondary-900">Devis de Me {q.profiles?.last_name}</h3>
                                  <p className="text-secondary-600">{q.amount} MAD • {q.description}</p>
                                  <p className="text-xs text-secondary-400">Reçu le {new Date(q.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => downloadQuotePDF(q)}>
                                  <Download className="h-4 w-4 mr-1" />
                                  Télécharger
                                </Button>
                                {q.status === 'pending' ? (
                                  <Button onClick={() => handlePayQuote(q)}>
                                    Payer {q.amount} MAD
                                  </Button>
                                ) : (
                                  <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-bold">
                                    Payé
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {quotes.length === 0 && <div className="text-center py-12 bg-white rounded-xl text-secondary-400">Aucun devis reçu.</div>}
                    </div>
                  </div>
                )}
                {activeTab === 'documents' && renderDocuments()}
                {activeTab === 'searches' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-secondary-900">IA Juridique — Recherche de Droit</h2>
                    <SearchPage skipAuthCheck />
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
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-secondary-900">Mon Profil</h2>
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                          <div className="h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700">
                            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-xl font-bold">{profile?.first_name} {profile?.last_name}</p>
                            <p className="text-secondary-500 text-sm">{user?.email}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Prénom</label>
                            <Input value={profileForm.first_name} onChange={e => setProfileForm(p => ({...p, first_name: e.target.value}))} required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Nom</label>
                            <Input value={profileForm.last_name} onChange={e => setProfileForm(p => ({...p, last_name: e.target.value}))} required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <Input value={user?.email || ''} disabled className="bg-secondary-50" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Téléphone</label>
                            <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} placeholder="+212 6 00 00 00 00" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Ville</label>
                            <Input value={profileForm.city} onChange={e => setProfileForm(p => ({...p, city: e.target.value}))} placeholder="Casablanca" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Code Postal</label>
                            <Input value={profileForm.postal_code} onChange={e => setProfileForm(p => ({...p, postal_code: e.target.value}))} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Date de naissance</label>
                            <Input type="date" value={profileForm.birth_date} onChange={e => setProfileForm(p => ({...p, birth_date: e.target.value}))} />
                          </div>
                        </CardContent>
                      </Card>
                      <Button type="submit" className="w-full h-12 text-base font-bold">Enregistrer le profil</Button>
                    </form>
                  </div>
                )}
              {activeTab === 'avocats' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-secondary-900">Annuaire des Avocats</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom ou spécialité..."
                      value={lawyerSearch}
                      onChange={e => setLawyerSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableLawyers
                      .filter(l => `${l.first_name} ${l.last_name} ${l.specialty || ''}`.toLowerCase().includes(lawyerSearch.toLowerCase()))
                      .map(lawyer => (
                        <Card key={lawyer.id} className="overflow-hidden">
                          <div className="h-1 bg-primary-600" />
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                                {lawyer.avatar_url ? (
                                  <img src={lawyer.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-primary-700 text-xl font-bold">{lawyer.first_name?.[0]}{lawyer.last_name?.[0]}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-secondary-900">Me. {lawyer.first_name} {lawyer.last_name}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    lawyer.is_available !== false ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-500'
                                  }`}>
                                    {lawyer.is_available !== false ? 'Disponible' : 'Indisponible'}
                                  </span>
                                </div>
                                <p className="text-sm text-primary-600 font-medium">{lawyer.specialty || 'Avocat au barreau'}</p>
                                <p className="text-xs text-secondary-500 mt-1">{lawyer.city || ''}</p>
                                {lawyer.bio && <p className="text-xs text-secondary-600 mt-2 line-clamp-2">{lawyer.bio}</p>}
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button
                                className="flex-1 text-sm"
                                onClick={() => contactLawyer(lawyer.id, `Me. ${lawyer.first_name} ${lawyer.last_name}`)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Contacter
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    {availableLawyers.filter(l => `${l.first_name} ${l.last_name} ${l.specialty || ''}`.toLowerCase().includes(lawyerSearch.toLowerCase())).length === 0 && (
                      <div className="col-span-2 text-center py-12 text-secondary-400">
                        <Users className="h-10 w-10 mx-auto mb-2 text-secondary-200" />
                        <p>Aucun avocat disponible pour le moment.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Mes Avocats</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y text-sm">
                        {chatRooms.map(room => (
                          <button 
                            key={room.id}
                            onClick={() => setActiveRoom({ id: room.id, name: `Me ${room.profiles?.last_name}` })}
                            className={`w-full p-4 text-left hover:bg-secondary-50 ${activeRoom?.id === room.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''}`}
                          >
                            <p className="font-bold">Me {room.profiles?.first_name} {room.profiles?.last_name}</p>
                            <p className="text-xs text-secondary-500">Avocat spécialisé</p>
                          </button>
                        ))}
                        {chatRooms.length === 0 && <div className="p-8 text-center text-secondary-400">Aucune discussion active.</div>}
                      </div>
                    </CardContent>
                  </Card>
                  <div className="lg:col-span-2">
                    {activeRoom ? (
                      <Chat 
                        roomId={activeRoom.id} 
                        currentUserId={user?.id || ''} 
                        recipientName={activeRoom.name} 
                      />
                    ) : (
                      <Card className="h-[500px] flex items-center justify-center text-secondary-400">
                        <p>Sélectionnez un avocat pour discuter</p>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              </>
            )}
          </main>
        </div>
      </div>
      
      <Modal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        title="Bienvenue sur JustLaw"
      >
        <div className="text-center py-6">
          <div className="mx-auto h-16 w-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-success-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-2">Bienvenue {profile?.first_name} !</h3>
          <p className="text-secondary-600 mb-6">
            Votre espace personnel est ouvert. Accédez à vos documents juridiques, consultez l'assistance ou contactez votre avocat à tout moment.
          </p>
          <Button className="w-full" onClick={() => setShowWelcome(false)}>
            Découvrir mon espace
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
