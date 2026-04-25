import React, { useState, useEffect } from 'react';
import { Users, Shield, BarChart3, Settings, Database, RefreshCw, Mail, FileText, UserPlus, Edit, HelpCircle, PenTool, BookOpen, Plus, CreditCard, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
import Modal from '../components/ui/Modal';
import { LogOut } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  is_verified?: boolean;
}

const AdminDashboard: React.FC = () => {
  const { toasts, success, error: toastError, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'lawyers' | 'documents' | 'messages' | 'system' | 'settings' | 'assistance' | 'outils' | 'formations' | 'payments'>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [outils, setOutils] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ commission_rate: 15, maintenance_mode: false, welcome_message: '' });
  const [loading, setLoading] = useState(true);

  // Modern Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    fields: { name: string; label: string; defaultValue?: string; type?: string }[];
    onConfirm: (values: any) => void;
    confirmText?: string;
    isDanger?: boolean;
  }>({ isOpen: false, title: '', fields: [], onConfirm: () => {} });

  const openModal = (title: string, fields: any[], onConfirm: (v: any) => void, confirmText = 'Valider', isDanger = false) => {
    setModalConfig({ isOpen: true, title, fields, onConfirm, confirmText, isDanger });
  };
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
  
  // Create User Form State
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchMessages();
    fetchAllDocuments();
    fetchFormations();
    fetchOutils();
    fetchTickets();
    fetchPayments();
    fetchSettings();
    
    // Subscribe to multiple channels for real-time synchronization
    const techSub = supabase
      .channel('admin-tech-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'formations' }, fetchFormations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outils' }, fetchOutils)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_tickets' }, fetchTickets)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchPayments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, fetchSettings)
      .subscribe();

    const usersSub = supabase
      .channel('admin-users-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .subscribe();

    const messagesSub = supabase
      .channel('admin-messages-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, (payload) => {
        setMessages(prev => [payload.new, ...prev]);
      })
      .subscribe();

    const docsSub = supabase
      .channel('admin-docs-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchAllDocuments())
      .subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(messagesSub);
      supabase.removeChannel(docsSub);
      supabase.removeChannel(techSub);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .limit(50); // Limit initial load for performance
    if (data) setUsers(data);
    setLoading(false);
  };

  const fetchAllDocuments = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*, profiles:owner_id(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setAllDocuments(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setMessages(data);
  };

  const fetchFormations = async () => {
    const { data } = await supabase.from('formations').select('*').order('created_at', { ascending: false });
    if (data) setFormations(data);
  };

  const fetchOutils = async () => {
    const { data } = await supabase.from('outils').select('*').order('created_at', { ascending: false });
    if (data) setOutils(data);
  };

  const fetchTickets = async () => {
    const { data } = await supabase.from('assistance_tickets').select('*, profiles:user_id(first_name, last_name)').order('created_at', { ascending: false });
    if (data) setTickets(data);
  };

  const fetchPayments = async () => {
    const { data } = await supabase.from('payments').select('*, profiles:user_id(first_name, last_name)').order('created_at', { ascending: false });
    if (data) setPayments(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('platform_settings').select('*').eq('id', 'global').maybeSingle();
    if (data) setSettings(data);
  };

  const handleUpdateSettings = async (key: string, value: any) => {
    const { error } = await supabase.from('platform_settings').update({ [key]: value }).eq('id', 'global');
    if (!error) success("Paramètre mis à jour", `Le paramètre a été enregistré en temps réel.`);
    else toastError("Erreur", error.message);
  };

  const handleAddOutil = () => {
    openModal(
      "Ajouter un Outil",
      [{ name: 'title', label: "Nom de l'outil" }, { name: 'category', label: 'Catégorie (ex: Intelligence Artificielle)' }],
      async (vals) => {
        if (!vals.title || !vals.category) return;
        const { error } = await supabase.from('outils').insert([{ title: vals.title, category: vals.category }]);
        if (error) toastError("Erreur", error.message);
        else success("Outil ajouté", "L'outil est en ligne.");
      }
    );
  };

  const handleDeleteOutil = (id: string) => {
    openModal("Supprimer l'outil ?", [], async () => {
      await supabase.from('outils').delete().eq('id', id);
    }, "Supprimer définitivement", true);
  };

  const handleEditOutil = (outil: any) => {
    openModal("Modifier l'outil", [{ name: 'title', label: "Nouveau titre", defaultValue: outil.title }], async (vals) => {
      if (vals.title) await supabase.from('outils').update({ title: vals.title }).eq('id', outil.id);
    });
  };

  const handleAddFormation = () => {
    openModal("Créer une formation", [
      { name: 'title', label: "Titre" }, 
      { name: 'duration', label: "Durée (ex: 2h 30)" }, 
      { name: 'category', label: "Catégorie (ex: Droit Social)" }
    ], async (vals) => {
      if (!vals.title) return;
      const { error } = await supabase.from('formations').insert([{ title: vals.title, duration: vals.duration, level: 'Débutant', category: vals.category }]);
      if (error) toastError("Erreur", error.message);
      else success("Formation créée", "Formation enregistrée.");
    });
  };

  const handleDeleteFormation = (id: string) => {
    openModal("Supprimer la formation ?", [], async () => {
      await supabase.from('formations').delete().eq('id', id);
    }, "Supprimer définitivement", true);
  };

  const handleEditFormation = (formation: any) => {
    openModal("Modifier la formation", [{ name: 'title', label: "Nouveau titre", defaultValue: formation.title }], async (vals) => {
      if (vals.title) await supabase.from('formations').update({ title: vals.title }).eq('id', formation.id);
    });
  };

  const handleManageTicket = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'En attente' ? 'En cours' : currentStatus === 'En cours' ? 'Résolu' : 'En attente';
    const { error } = await supabase.from('assistance_tickets').update({ status: newStatus }).eq('id', id);
    if (error) toastError("Erreur", error.message);
  };

  const handleDeleteTicket = (id: string) => {
    openModal("Supprimer ce ticket ?", [], async () => {
      await supabase.from('assistance_tickets').delete().eq('id', id);
    }, "Supprimer", true);
  };
  
  const handleToggleOutilStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'En Test' ? 'Actif' : 'En Test';
    await supabase.from('outils').update({ status: newStatus }).eq('id', id);
  };
  
  const handleToggleFormationStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Brouillon' ? 'Publié' : 'Brouillon';
    await supabase.from('formations').update({ status: newStatus }).eq('id', id);
  };

  const handleApproveLawyer = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId);
    
    if (!error) {
      success("Avocat approuvé", "Le compte a été vérifié avec succès.");
      fetchUsers();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: newUser.email,
              first_name: newUser.firstName,
              last_name: newUser.lastName,
              role: newUser.role
            }
          ]);
        
        if (profileError) throw profileError;

        success("Compte créé", `Le compte ${newUser.role} a été créé avec succès.`);
        setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
      }
    } catch (err: any) {
      toastError("Erreur création", err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const systemStats = [
    { label: 'Utilisateurs', value: users.filter(u => u.role === 'user').length.toString(), icon: Users },
    { label: 'Avocats', value: users.filter(u => u.role === 'lawyer').length.toString(), icon: Shield },
    { label: 'Documents', value: allDocuments.length.toString(), icon: FileText },
    { label: 'Messages', value: messages.length.toString(), icon: Mail },
    { label: 'Santé Système', value: '100%', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Espace Administration</h1>
            <p className="text-secondary-600">Gestion centrale des comptes, avocats et messages</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { fetchUsers(); fetchMessages(); }} variant="outline" size="sm" className="hidden sm:flex">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex text-danger-600 hover:text-danger-700 hover:bg-danger-50 border-danger-200 hover:border-danger-300"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-6 overflow-hidden">
              <CardContent className="p-2 sm:p-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0">
                {[
                  { id: 'overview', name: "Vue d'ensemble", icon: BarChart3 },
                  { id: 'users', name: "Utilisateurs", icon: Users },
                  { id: 'lawyers', name: "Approbations", icon: Shield },
                  { id: 'documents', name: "Documents", icon: FileText },
                  { id: 'messages', name: "Messages", icon: Mail },
                  { id: 'system', name: "Système", icon: Database },
                  { id: 'settings', name: "Paramètres Globaux", icon: Settings },
                  { id: 'assistance', name: "Assistance", icon: HelpCircle },
                  { id: 'outils', name: "Outils Avocats", icon: PenTool },
                  { id: 'formations', name: "Formations", icon: BookOpen },
                  { id: 'payments', name: "Paiements", icon: CreditCard },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-shrink-0 lg:w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
                        : 'text-secondary-700 hover:bg-secondary-100 hover:text-primary-600'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-3" />
                    <span className="font-medium whitespace-nowrap">{tab.name}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3 space-y-8 order-1 lg:order-2">
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {systemStats.map((s, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">{s.label}</p>
                            <p className="text-2xl font-bold text-secondary-900">{s.value}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                            <s.icon className="h-6 w-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Derniers Messages</CardTitle>
                      <CardDescription>Nouvelles demandes de contact</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y border-t">
                        {messages.slice(0, 5).map((m) => (
                          <div key={m.id} className="p-4 hover:bg-secondary-50 transition-colors">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-sm">{m.name}</span>
                              <span className="text-[10px] text-secondary-400">{new Date(m.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-secondary-600 truncate">{m.subject}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Avocats en attente</CardTitle>
                      <CardDescription>Demandes d'inscription à vérifier</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y border-t">
                        {users.filter(u => u.role === 'lawyer' && !u.is_verified).slice(0, 5).map((u) => (
                          <div key={u.id} className="p-4 flex items-center justify-between">
                            <span className="text-sm font-medium">{u.first_name} {u.last_name}</span>
                            <Button size="sm" variant="outline" onClick={() => handleApproveLawyer(u.id)}>Approuver</Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <Card className="bg-primary-50/20">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserPlus className="h-5 w-5 mr-3 text-primary-600" />
                      Nouveau compte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Prénom" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} required/>
                      <Input placeholder="Nom" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} required/>
                      <Input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required/>
                      <Input type="password" placeholder="Pass" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required/>
                      <select className="w-full flex h-10 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                        <option value="user">Utilisateur</option>
                        <option value="lawyer">Avocat</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button type="submit" disabled={isCreating}>{isCreating ? 'En cours...' : 'Créer'}</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Répertoire</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-secondary-50 border-y">
                          <tr><th className="px-6 py-3">Membre</th><th className="px-6 py-3">Rôle</th><th className="px-6 py-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-secondary-50">
                              <td className="px-6 py-4"><div>{u.first_name} {u.last_name}</div><div className="text-xs text-secondary-500">{u.email}</div></td>
                              <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold bg-secondary-100">{u.role}</span></td>
                              <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm"><Edit className="w-4 h-4"/></Button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'lawyers' && (
              <Card>
                <CardHeader>
                  <CardTitle>Validation des Avocats</CardTitle>
                  <CardDescription>Approuvez ou suspendez l'accès des avocats à la plateforme</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y border-t">
                    {users.filter(u => u.role === 'lawyer').map((l) => (
                      <div key={l.id} className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-3 w-3 rounded-full ${l.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <div>
                            <p className="font-bold">{l.first_name} {l.last_name}</p>
                            <p className="text-xs text-secondary-500">{l.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!l.is_verified && <Button size="sm" onClick={() => handleApproveLawyer(l.id)}>Approuver</Button>}
                          <Button size="sm" variant="outline" className="text-red-600">Suspendre</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents Générés</CardTitle>
                  <CardDescription>Tous les documents créés sur la plateforme</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-secondary-50 border-y">
                        <tr>
                          <th className="px-6 py-3">Document</th>
                          <th className="px-6 py-3">Propriétaire</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-secondary-50">
                            <td className="px-6 py-4 font-medium">{doc.name}</td>
                            <td className="px-6 py-4">
                              {doc.profiles?.first_name} {doc.profiles?.last_name}
                            </td>
                            <td className="px-6 py-4">{doc.type}</td>
                            <td className="px-6 py-4 text-secondary-500">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {allDocuments.length === 0 && <div className="p-8 text-center text-secondary-500">Aucun document généré.</div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'messages' && (
              <Card>
                <CardHeader>
                  <CardTitle>Messages de contact</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y border-t">
                    {messages.map((m) => (
                      <div key={m.id} className="p-6 hover:bg-secondary-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-secondary-900">{m.subject}</h3>
                            <p className="text-sm text-secondary-500">De: {m.name} ({m.email})</p>
                          </div>
                          <span className="text-xs text-secondary-400">{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-secondary-700 bg-secondary-50 p-4 rounded-xl mt-2">{m.message}</p>
                      </div>
                    ))}
                    {messages.length === 0 && <div className="p-8 text-center text-secondary-500">Aucun message pour le moment.</div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'system' && (
              <Card>
                <CardHeader><CardTitle>État du Système</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-xl flex items-center justify-between bg-white">
                    <span className="font-semibold text-secondary-700">Services Just-Law</span>
                    <span className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold">100% Online</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'payments' && (
              <Card>
                <CardHeader><CardTitle>Gestion des Paiements</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-secondary-50 border-y">
                      <tr>
                        <th className="px-6 py-4">Utilisateur</th>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Montant</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y relative">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 font-medium">{p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : p.user_id}</td>
                          <td className="px-6 py-4">{p.service_type}</td>
                          <td className="px-6 py-4">{p.amount} MAD</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'Complété' ? 'bg-success-100 text-success-700' : p.status === 'Échoué' ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700'}`}>{p.status}</span>
                          </td>
                          <td className="px-6 py-4">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {payments.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-secondary-500">Aucun paiement trouvé.</td></tr>}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card>
                <CardHeader><CardTitle>Paramètres Globaux du Système</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-semibold text-secondary-900">Mode Maintenance</h4>
                      <p className="text-sm text-secondary-500">Désactiver l'accès public au site</p>
                    </div>
                    <Button variant={settings?.maintenance_mode ? 'danger' : 'outline'} onClick={() => handleUpdateSettings('maintenance_mode', !settings?.maintenance_mode)}>
                      {settings?.maintenance_mode ? 'Désactiver le site' : 'Activer'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-semibold text-secondary-900">Commission Avocat (%)</h4>
                      <p className="text-sm text-secondary-500">Taux prélevé sur les consultations</p>
                    </div>
                    <div className="flex gap-2">
                      <Input type="number" defaultValue={settings?.commission_rate} id="comm_rate" className="w-20" />
                      <Button variant="outline" onClick={() => handleUpdateSettings('commission_rate', (document.getElementById('comm_rate') as HTMLInputElement).value)}>Enregistrer</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h4 className="font-semibold text-secondary-900">Message de Bienvenue</h4>
                    </div>
                    <div className="flex gap-2 w-1/2">
                      <Input type="text" defaultValue={settings?.welcome_message} id="welcome_msg" className="w-full" />
                      <Button variant="outline" onClick={() => handleUpdateSettings('welcome_message', (document.getElementById('welcome_msg') as HTMLInputElement).value)}>Sauver</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'assistance' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-secondary-900">Tickets d'Assistance</h2>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-secondary-50 border-y">
                        <tr>
                          <th className="px-6 py-4">Utilisateur</th>
                          <th className="px-6 py-4">Sujet</th>
                          <th className="px-6 py-4">Statut</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y relative">
                        {tickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-secondary-50">
                            <td className="px-6 py-4 font-medium">{ticket.profiles ? `${ticket.profiles.first_name} ${ticket.profiles.last_name}` : ticket.user_id}</td>
                            <td className="px-6 py-4">{ticket.subject}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'En cours' ? 'bg-warning-100 text-warning-700' : ticket.status === 'Résolu' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'}`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">{new Date(ticket.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleManageTicket(ticket.id, ticket.status)}>Statut</Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteTicket(ticket.id)}><Trash2 className="h-4 w-4" /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'outils' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-secondary-900">Gestion des Outils Avocats</h2>
                  <Button onClick={handleAddOutil}><Plus className="h-4 w-4 mr-2" /> Ajouter un Outil</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {outils.map((o) => (
                    <Card key={o.id}>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between">
                          <span className="text-xs font-bold text-primary-600 uppercase">{o.category}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${o.status === 'Actif' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>{o.status}</span>
                        </div>
                        <h3 className="font-bold text-lg">{o.title}</h3>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" className="flex-1" size="sm" onClick={() => handleToggleOutilStatus(o.id, o.status)}>Statut</Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditOutil(o)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteOutil(o.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'formations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-secondary-900">Catalogue des Formations</h2>
                  <Button onClick={handleAddFormation}><Plus className="h-4 w-4 mr-2" /> Créer un module</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formations.map((f) => (
                    <Card key={f.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-lg">{f.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${f.status === 'Publié' ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-700'}`}>{f.status}</span>
                        </div>
                        <p className="text-secondary-500 mb-4">{f.duration} • {f.category}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" size="sm" onClick={() => handleToggleFormationStatus(f.id, f.status)}>Publier / Masquer</Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditFormation(f)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteFormation(f.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      
      <Modal isOpen={modalConfig.isOpen} onClose={closeModal}>
        <h2 className="text-xl font-bold mb-4">{modalConfig.title}</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const vals = Object.fromEntries(formData.entries());
          modalConfig.onConfirm(vals);
          closeModal();
        }}>
          <div className="space-y-4">
            {modalConfig.fields.map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-secondary-700 mb-1">{f.label}</label>
                <Input name={f.name} type={f.type || 'text'} defaultValue={f.defaultValue} required className="w-full" />
              </div>
            ))}
            {modalConfig.fields.length === 0 && (
              <p className="text-secondary-600 mb-4">Êtes-vous sûr de vouloir effectuer cette action ?</p>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={closeModal}>Annuler</Button>
            <Button type="submit" variant={modalConfig.isDanger ? 'danger' : 'primary'}>{modalConfig.confirmText || 'Valider'}</Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default AdminDashboard;
