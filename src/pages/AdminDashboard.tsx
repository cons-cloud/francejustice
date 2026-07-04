import React, { useState, useEffect } from 'react';
import { Users, Shield, BarChart3, Settings, Database, RefreshCw, Mail, FileText, UserPlus, Edit, HelpCircle, PenTool, BookOpen, Plus, CreditCard, Trash2, Eye, EyeOff, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
import Modal from '../components/ui/Modal';
import { LogOut, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { AdvancedAreaChart, AdvancedBarChart, SimplePieChart } from '../components/features/StatsCharts';
import { exportToCSV, exportToJSON } from '../lib/exportUtils';
import { regions } from '../components/features/FranceMap';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/ui/NotificationBell';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  is_verified?: boolean;
  city?: string;
  postal_code?: string;
  lawyers?: {
    bar_association?: string;
    license_number?: string;
    experience_years?: number;
    verification_status?: string;
    verification_documents?: string[];
  } | {
    bar_association?: string;
    license_number?: string;
    experience_years?: number;
    verification_status?: string;
    verification_documents?: string[];
  }[];
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toasts, success, error: toastError, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'lawyers' | 'documents' | 'messages' | 'system' | 'settings' | 'assistance' | 'outils' | 'formations' | 'payments' | 'monitoring' | 'appointments' | 'classrooms'>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  // Geographical filtering states
  const [filterBarreau, setFilterBarreau] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [messages, setMessages] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [outils, setOutils] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ commission_rate: 15, maintenance_mode: false, welcome_message: '' });
  const [loading, setLoading] = useState(true);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);

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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchMessages();
    fetchAllDocuments();
    fetchFormations();
    fetchOutils();
    fetchTickets();
    fetchPayments();
    fetchQuotes();
    fetchChatRooms();
    fetchSettings();
    fetchAllAppointments();
    fetchClassrooms();
    
    // Subscribe to multiple channels for real-time synchronization
    const techSub = supabase
      .channel('admin-tech-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'formations_just' }, fetchFormations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outils_just' }, fetchOutils)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_tickets_just' }, fetchTickets)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments_just' }, fetchPayments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes_just' }, fetchQuotes)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings_just' }, fetchSettings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments_just' }, fetchAllAppointments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms_just' }, fetchChatRooms)
      .subscribe();

    const usersSub = supabase
      .channel('admin-users-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles_just' }, () => fetchUsers())
      .subscribe();

    const messagesSub = supabase
      .channel('admin-messages-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages_just' }, (payload) => {
        setMessages(prev => [payload.new, ...prev]);
      })
      .subscribe();

    const docsSub = supabase
      .channel('admin-docs-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents_just' }, () => fetchAllDocuments())
      .subscribe();

    const classroomsSub = supabase
      .channel('admin-classrooms-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classrooms_just' }, () => fetchClassrooms())
      .subscribe();

    const monitorSub = supabase.channel('admin-monitor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages_just' }, async (p) => {
        const { data } = await supabase.from('profiles_just').select('first_name, last_name').eq('id', p.new.sender_id).single();
        addActivity(`Nouveau message de ${data?.first_name || 'utilisateur'}`, 'chat');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes_just' }, (p) => {
        if (p.eventType === 'INSERT') addActivity(`Nouveau devis créé: ${p.new.amount} MAD`, 'quote');
        if (p.eventType === 'UPDATE' && (p.new as any).status === 'paid') addActivity(`Devis payé: ${(p.new as any).amount} MAD`, 'payment');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'documents_just' }, async (p) => {
        const { data } = await supabase.from('profiles_just').select('first_name, last_name').eq('id', p.new.owner_id).single();
        addActivity(`Nouveau document généré par ${data?.first_name || 'Citoyen'}`, 'document');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments_just' }, () => {
        addActivity(`Nouveau rendez-vous créé`, 'appointment');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles_just' }, (p) => {
        const name = `${p.new.first_name || ''} ${p.new.last_name || ''}`.trim() || p.new.email;
        if (p.new.role === 'lawyer') {
          addActivity(`Nouvel avocat inscrit : Me ${name} (en attente d'approbation)`, 'lawyer');
        } else {
          addActivity(`Nouvel utilisateur inscrit : ${name}`, 'user');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(messagesSub);
      supabase.removeChannel(docsSub);
      supabase.removeChannel(techSub);
      supabase.removeChannel(monitorSub);
      supabase.removeChannel(classroomsSub);
    };
  }, []);

  const addActivity = (message: string, type: string) => {
    setActivities(prev => [{ id: Date.now(), message, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

  // Helper to resolve region from postal code
  const getRegionFromPostalCode = (postalCode?: string) => {
    if (!postalCode) return null;
    const dept = postalCode.trim().substring(0, 2);
    const region = regions.find(r => r.departments.includes(dept));
    return region ? region.name : null;
  };

  const uniqueCities = React.useMemo(() => {
    return Array.from(new Set(users.map(u => u.city).filter(Boolean).map(c => c!.trim()))).sort();
  }, [users]);

  const uniqueBarreaux = React.useMemo(() => {
    const list: string[] = [];
    users.forEach(u => {
      const lawyerInfo = Array.isArray(u.lawyers) ? u.lawyers[0] : u.lawyers;
      if (lawyerInfo?.bar_association) {
        list.push(lawyerInfo.bar_association.trim());
      }
    });
    return Array.from(new Set(list)).sort();
  }, [users]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles_just')
      .select('*, lawyers:lawyers_just(*)')
      .limit(50); // Limit initial load for performance
    if (data) setUsers(data);
    setLoading(false);
  };

  const fetchAllDocuments = async () => {
    const { data } = await supabase
      .from('documents_just')
      .select('*, profiles:owner_id(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setAllDocuments(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('contact_messages_just')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setMessages(data);
  };

  const fetchFormations = async () => {
    const { data } = await supabase.from('formations_just').select('*').order('created_at', { ascending: false });
    if (data) setFormations(data);
  };

  const fetchOutils = async () => {
    const { data } = await supabase.from('outils_just').select('*').order('created_at', { ascending: false });
    if (data) setOutils(data);
  };

  const fetchTickets = async () => {
    const { data } = await supabase.from('assistance_tickets_just').select('*, profiles:user_id(first_name, last_name)').order('created_at', { ascending: false });
    if (data) setTickets(data);
  };

  const fetchPayments = async () => {
    const { data } = await supabase.from('payments_just').select('*, profiles:user_id(first_name, last_name)').order('created_at', { ascending: false });
    if (data) setPayments(data);
  };

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from('quotes_just')
      .select('*, profiles:lawyer_id(first_name, last_name), client:client_id(first_name, last_name)')
      .order('created_at', { ascending: false });
    if (data) setQuotes(data);
  };

  const fetchChatRooms = async () => {
    const { data } = await supabase
      .from('chat_rooms_just')
      .select('*, lawyer:lawyer_id(first_name, last_name), client:client_id(first_name, last_name)')
      .order('created_at', { ascending: false });
    if (data) setChatRooms(data);
  };

  const fetchClassrooms = async () => {
    const { data } = await supabase
      .from('classrooms_just')
      .select('*, lawyer:profiles_just!classrooms_just_lawyer_id_fkey(first_name, last_name)')
      .order('created_at', { ascending: false });
    if (data) setClassrooms(data);
  };

  const handleDeleteClassroomByAdmin = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette visioconférence ?")) {
      const { error } = await supabase
        .from('classrooms_just')
        .delete()
        .eq('id', id);
      if (error) {
        toastError("Erreur", error.message);
      } else {
        success("Classe supprimée", "La visioconférence a été supprimée avec succès par l'administrateur.");
        fetchClassrooms();
      }
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('platform_settings_just').select('*').eq('id', 'global').maybeSingle();
    if (data) setSettings(data);
  };

  const fetchAllAppointments = async () => {
    const { data } = await supabase
      .from('appointments_just')
      .select('*, client:client_id(first_name, last_name), lawyer:lawyer_id(first_name, last_name)')
      .order('scheduled_at', { ascending: false });
    if (data) setAllAppointments(data);
  };

  const handleCancelAppointmentByAdmin = async (id: string) => {
    const { error } = await supabase
      .from('appointments_just')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (!error) {
      fetchAllAppointments();
      success("Rendez-vous annulé", "Le rendez-vous a été annulé par l'administrateur.");
    } else {
      toastError("Erreur", error.message);
    }
  };

  const handleDeleteAppointmentByAdmin = async (id: string) => {
    openModal("Supprimer ce rendez-vous ?", [], async () => {
      const { error } = await supabase
        .from('appointments_just')
        .delete()
        .eq('id', id);
      if (!error) {
        fetchAllAppointments();
        success("Rendez-vous supprimé", "Le rendez-vous a été retiré de la plateforme.");
      } else {
        toastError("Erreur", error.message);
      }
    }, "Supprimer définitivement", true);
  };

  const handleUpdateSettings = async (key: string, value: any) => {
    const { error } = await supabase.from('platform_settings_just').update({ [key]: value }).eq('id', 'global');
    if (!error) success("Paramètre mis à jour", `Le paramètre a été enregistré en temps réel.`);
    else toastError("Erreur", error.message);
  };

  const handleAddOutil = () => {
    openModal(
      "Ajouter un Outil",
      [{ name: 'title', label: "Nom de l'outil" }, { name: 'category', label: 'Catégorie (ex: Intelligence Artificielle)' }],
      async (vals) => {
        if (!vals.title || !vals.category) return;
        const { error } = await supabase.from('outils_just').insert([{ title: vals.title, category: vals.category }]);
        if (error) toastError("Erreur", error.message);
        else success("Outil ajouté", "L'outil est en ligne.");
      }
    );
  };

  const handleDeleteOutil = (id: string) => {
    openModal("Supprimer l'outil ?", [], async () => {
      await supabase.from('outils_just').delete().eq('id', id);
    }, "Supprimer définitivement", true);
  };

  const handleEditOutil = (outil: any) => {
    openModal("Modifier l'outil", [{ name: 'title', label: "Nouveau titre", defaultValue: outil.title }], async (vals) => {
      if (vals.title) await supabase.from('outils_just').update({ title: vals.title }).eq('id', outil.id);
    });
  };

  const handleAddFormation = () => {
    openModal("Créer une formation", [
      { name: 'title', label: "Titre" }, 
      { name: 'duration', label: "Durée (ex: 2h 30)" }, 
      { name: 'category', label: "Catégorie (ex: Droit Social)" }
    ], async (vals) => {
      if (!vals.title) return;
      const { error } = await supabase.from('formations_just').insert([{ title: vals.title, duration: vals.duration, level: 'Débutant', category: vals.category }]);
      if (error) toastError("Erreur", error.message);
      else success("Formation créée", "Formation enregistrée.");
    });
  };

  const handleDeleteFormation = (id: string) => {
    openModal("Supprimer la formation ?", [], async () => {
      await supabase.from('formations_just').delete().eq('id', id);
    }, "Supprimer définitivement", true);
  };

  const handleEditFormation = (formation: any) => {
    openModal("Modifier la formation", [{ name: 'title', label: "Nouveau titre", defaultValue: formation.title }], async (vals) => {
      if (vals.title) await supabase.from('formations_just').update({ title: vals.title }).eq('id', formation.id);
    });
  };

  const handleManageTicket = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'En attente' ? 'En cours' : currentStatus === 'En cours' ? 'Résolu' : 'En attente';
    const { error } = await supabase.from('assistance_tickets_just').update({ status: newStatus }).eq('id', id);
    if (error) toastError("Erreur", error.message);
  };

  const handleDeleteTicket = (id: string) => {
    openModal("Supprimer ce ticket ?", [], async () => {
      await supabase.from('assistance_tickets_just').delete().eq('id', id);
    }, "Supprimer", true);
  };
  
  const handleToggleOutilStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'En Test' ? 'Actif' : 'En Test';
    await supabase.from('outils_just').update({ status: newStatus }).eq('id', id);
  };
  
  const handleToggleFormationStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Brouillon' ? 'Publié' : 'Brouillon';
    await supabase.from('formations_just').update({ status: newStatus }).eq('id', id);
  };

  const handleApproveLawyer = async (userId: string) => {
    const { error } = await supabase
      .from('profiles_just')
      .update({ is_verified: true })
      .eq('id', userId);
    
    if (!error) {
      await supabase
        .from('lawyers_just')
        .update({ verification_status: 'approved' })
        .eq('id', userId);
      success("Avocat approuvé", "Le compte a été vérifié avec succès.");
      fetchUsers();
    }
  };

  const handleDeleteUser = (id: string) => {
    openModal("Supprimer l'utilisateur ?", [], async () => {
      try {
        const response = await fetch(`/api/accounts/delete-user-admin/${id}/`, { method: 'DELETE' });
        if(response.ok) {
          fetchUsers();
          success("Supprimé", "L'utilisateur a été supprimé.");
        } else {
          toastError("Erreur", "Erreur lors de la suppression.");
        }
      } catch(e) { console.error(e); }
    }, "Supprimer définitivement", true);
  };

  const handleToggleSuspend = async (u: any) => {
    const action = u.is_verified ? 'suspend' : 'activate';
    try {
      const response = await fetch(`/api/accounts/${action}-user-admin/${u.id}/`, { method: 'POST' });
      if(response.ok) {
        fetchUsers();
        success("Mise à jour", `L'utilisateur a été ${u.is_verified ? 'suspendu' : 'activé'}.`);
      } else {
        toastError("Erreur", "Erreur de mise à jour");
      }
    } catch(e) { console.error(e); }
  };

  const handleEditUser = (u: any) => {
    openModal("Modifier Utilisateur", [
      { name: 'firstName', label: 'Prénom', defaultValue: u.first_name || '' },
      { name: 'lastName', label: 'Nom', defaultValue: u.last_name || '' },
      { name: 'role', label: 'Rôle (user, lawyer, admin)', defaultValue: u.role || 'user' }
    ], async (vals) => {
      try {
        const response = await fetch(`/api/accounts/update-user-admin/${u.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vals)
        });
        if(response.ok) {
          fetchUsers();
          success("Modifié", "Les informations ont été mises à jour.");
        } else {
          toastError("Erreur", "Erreur lors de la modification");
        }
      } catch(e) { console.error(e); }
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/accounts/create-user-admin/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du compte');
      }

      success("Compte créé", `Le compte ${newUser.role} a été créé avec succès.`);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
      fetchUsers(); 
    } catch (err: any) {
      toastError("Erreur création", err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportData = (type: 'users' | 'payments' | 'documents', format: 'csv' | 'json') => {
    const dataToExport = type === 'users' ? users : type === 'payments' ? payments : allDocuments;
    const filename = `export_${type}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') exportToCSV(dataToExport, filename);
    else exportToJSON(dataToExport, filename);
    
    success("Export réussi", `Le fichier ${format.toUpperCase()} a été généré.`);
  };

  const chartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 700 },
  ];

  const roleDistribution = [
    { name: 'Citoyens', value: users.filter(u => u.role === 'user').length },
    { name: 'Avocats', value: users.filter(u => u.role === 'lawyer').length },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
  ];

  const systemStats = [
    { label: 'Utilisateurs', value: users.filter(u => u.role === 'user').length.toString(), icon: Users },
    { label: 'Avocats', value: users.filter(u => u.role === 'lawyer').length.toString(), icon: Shield },
    { label: 'Documents', value: allDocuments.length.toString(), icon: FileText },
    { label: 'Commissions', value: `${quotes.filter(q => q.status === 'commissioned').reduce((acc, q) => acc + Number(q.commission_amount), 0)} MAD`, icon: CreditCard },
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
            <NotificationBell userId={user?.id ?? null} />
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
                  { id: 'appointments', name: "Rendez-vous", icon: RefreshCw },
                  { id: 'users', name: "Utilisateurs", icon: Users },
                  { id: 'lawyers', name: "Approbations", icon: Shield },
                  { id: 'documents', name: "Documents", icon: FileText },
                  { id: 'messages', name: "Messages", icon: Mail },
                  { id: 'system', name: "Système", icon: Database },
                  { id: 'settings', name: "Paramètres Globaux", icon: Settings },
                  { id: 'assistance', name: "Assistance", icon: HelpCircle },
                  { id: 'outils', name: "Outils Avocats", icon: PenTool },
                  { id: 'formations', name: "Formations", icon: BookOpen },
                  { id: 'classrooms', name: "Visioconférences", icon: Video },
                  { id: 'payments', name: "Paiements", icon: CreditCard },
                  { id: 'monitoring', name: "LIVE Monitoring", icon: RefreshCw },
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Activité de la plateforme</CardTitle>
                      <CardDescription>Évolution des inscriptions et activités</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AdvancedAreaChart data={chartData} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribution des Rôles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SimplePieChart data={roleDistribution} height={250} />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Flux de Paiements</CardTitle>
                      <CardDescription>Analyse hebdomadaire</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AdvancedBarChart data={chartData} height={200} />
                    </CardContent>
                  </Card>
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

            {activeTab === 'monitoring' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <RefreshCw className="h-5 w-5 text-primary-600 animate-spin" />
                       Flux Live
                    </CardTitle>
                    <CardDescription>Événements en temps réel</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[600px] overflow-y-auto">
                    <div className="space-y-4">
                      {activities.map(act => (
                        <div key={act.id} className="p-3 bg-white rounded-lg border-l-4 border-primary-500 shadow-sm">
                          <p className="text-sm font-bold">{act.message}</p>
                          <p className="text-[10px] text-secondary-500 uppercase">{act.time} • {act.type}</p>
                        </div>
                      ))}
                      {activities.length === 0 && <p className="text-center text-secondary-400 py-10">En attente d'activité...</p>}
                    </div>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Surveillance des Chats</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-secondary-50 border-y">
                          <tr><th className="px-6 py-4">Avocat</th><th className="px-6 py-4">Citizen</th><th className="px-6 py-4">Logs</th></tr>
                        </thead>
                        <tbody className="divide-y text-xs">
                          {chatRooms.map(room => (
                            <tr key={room.id} className="hover:bg-secondary-50">
                              <td className="px-6 py-4">Me {room.lawyer?.first_name} {room.lawyer?.last_name}</td>
                              <td className="px-6 py-4">{room.client?.first_name} {room.client?.last_name}</td>
                              <td className="px-6 py-4">
                                <Button variant="ghost" size="sm" className="text-primary-600 hover:bg-primary-50">Visualiser</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Statistiques Commissions Live</CardTitle></CardHeader>
                    <CardContent>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-success-50 rounded-xl">
                            <p className="text-xs font-bold text-success-600 uppercase">Total Commissions</p>
                            <p className="text-2xl font-bold text-success-900">
                              {quotes.filter(q => q.status === 'commissioned').reduce((acc, q) => acc + Number(q.commission_amount), 0)} MAD
                            </p>
                         </div>
                         <div className="p-4 bg-warning-50 rounded-xl">
                            <p className="text-xs font-bold text-warning-600 uppercase">En attente</p>
                            <p className="text-2xl font-bold text-warning-900">
                              {quotes.filter(q => q.status === 'paid').reduce((acc, q) => acc + Number(q.commission_amount), 0)} MAD
                            </p>
                         </div>
                       </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border shadow-sm">
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 block mb-1">Rôle</label>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="w-full h-10 px-3 border border-secondary-200 rounded-lg text-sm bg-white focus:outline-none"
                    >
                      <option value="all">Tous les rôles</option>
                      <option value="user">Citoyens</option>
                      <option value="lawyer">Avocats</option>
                      <option value="admin">Administrateurs</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 block mb-1">Région</label>
                    <select
                      value={filterRegion}
                      onChange={(e) => setFilterRegion(e.target.value)}
                      className="w-full h-10 px-3 border border-secondary-200 rounded-lg text-sm bg-white focus:outline-none"
                    >
                      <option value="">Toutes les régions</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 block mb-1">Barreau</label>
                    <select
                      value={filterBarreau}
                      onChange={(e) => setFilterBarreau(e.target.value)}
                      className="w-full h-10 px-3 border border-secondary-200 rounded-lg text-sm bg-white focus:outline-none"
                    >
                      <option value="">Tous les barreaux</option>
                      {uniqueBarreaux.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 block mb-1">Ville</label>
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="w-full h-10 px-3 border border-secondary-200 rounded-lg text-sm bg-white focus:outline-none"
                    >
                      <option value="">Toutes les villes</option>
                      {uniqueCities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

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
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Mot de passe" 
                          value={newUser.password} 
                          onChange={e => setNewUser({...newUser, password: e.target.value})} 
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-[2.4rem] -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
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
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Répertoire des Utilisateurs</CardTitle>
                      <CardDescription>Gestion complète des comptes</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExportData('users', 'csv')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExportData('users', 'json')}>
                        <FileJson className="h-4 w-4 mr-2" />
                        JSON
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-secondary-50 border-y">
                          <tr><th className="px-6 py-3">Membre</th><th className="px-6 py-3">Rôle</th><th className="px-6 py-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {users
                            .filter(u => {
                              if (filterRole !== 'all' && u.role !== filterRole) return false;
                              if (filterCity && u.city !== filterCity) return false;
                              if (filterRegion) {
                                const reg = getRegionFromPostalCode(u.postal_code);
                                if (reg !== filterRegion) return false;
                              }
                              if (filterBarreau) {
                                const lawyerInfo = Array.isArray(u.lawyers) ? u.lawyers[0] : u.lawyers;
                                if (lawyerInfo?.bar_association !== filterBarreau) return false;
                              }
                              return true;
                            })
                            .map((u) => {
                              const regName = getRegionFromPostalCode(u.postal_code);
                              return (
                                <tr key={u.id} className="hover:bg-secondary-50">
                                  <td className="px-6 py-4">
                                    <div>{u.first_name} {u.last_name}</div>
                                    <div className="text-xs text-secondary-500">{u.email}</div>
                                    <div className="text-[10px] text-secondary-400 font-semibold mt-1">
                                      📍 {u.city || 'Non renseigné'}{u.postal_code ? ` (${u.postal_code.substring(0, 2)})` : ''} 
                                      {regName ? ` - Région : ${regName}` : ''}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)}>
                                      <Edit className="w-4 h-4"/>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleToggleSuspend(u)} className={u.is_verified ? "text-warning-600" : "text-success-600"}>
                                      {u.is_verified ? "Suspendre" : "Activer"}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteUser(u.id)}>
                                      <Trash2 className="w-4 h-4"/>
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'lawyers' && (
              <div className="space-y-6">
                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border shadow-sm">
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 block mb-1">Région</label>
                    <select
                      value={filterRegion}
                      onChange={(e) => setFilterRegion(e.target.value)}
                      className="w-full h-10 px-3 border border-secondary-200 rounded-lg text-sm bg-white focus:outline-none"
                    >
                      <option value="">Toutes les régions</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 block mb-1">Barreau</label>
                    <select
                      value={filterBarreau}
                      onChange={(e) => setFilterBarreau(e.target.value)}
                      className="w-full h-10 px-3 border border-secondary-200 rounded-lg text-sm bg-white focus:outline-none"
                    >
                      <option value="">Tous les barreaux</option>
                      {uniqueBarreaux.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 block mb-1">Ville</label>
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="w-full h-10 px-3 border border-secondary-200 rounded-lg text-sm bg-white focus:outline-none"
                    >
                      <option value="">Toutes les villes</option>
                      {uniqueCities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Validation des Avocats</CardTitle>
                    <CardDescription>Approuvez ou suspendez l'accès des avocats à la plateforme</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y border-t">
                      {users
                        .filter(u => u.role === 'lawyer')
                        .filter(u => {
                          if (filterCity && u.city !== filterCity) return false;
                          if (filterRegion) {
                            const reg = getRegionFromPostalCode(u.postal_code);
                            if (reg !== filterRegion) return false;
                          }
                          if (filterBarreau) {
                            const lawyerInfo = Array.isArray(u.lawyers) ? u.lawyers[0] : u.lawyers;
                            if (lawyerInfo?.bar_association !== filterBarreau) return false;
                          }
                          return true;
                        })
                        .map((l) => {
                          const lawyerInfo = Array.isArray(l.lawyers) ? l.lawyers[0] : l.lawyers;
                          const regName = getRegionFromPostalCode(l.postal_code);
                          return (
                          <div key={l.id} className="p-6 space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`h-3 w-3 rounded-full shrink-0 ${l.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <div>
                                  <p className="font-bold">Me {l.first_name} {l.last_name}</p>
                                  <p className="text-xs text-secondary-500">{l.email}</p>
                                  <p className="text-[10px] text-secondary-400 font-semibold mt-0.5">
                                    📍 Cabinet : {l.city || 'Non renseigné'}{l.postal_code ? ` (${l.postal_code.substring(0, 2)})` : ''} 
                                    {regName ? ` - Région : ${regName}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                            {!l.is_verified && <Button size="sm" onClick={() => handleApproveLawyer(l.id)}>Approuver</Button>}
                            <Button size="sm" variant="outline" className="text-red-600">Suspendre</Button>
                          </div>
                        </div>

                        {lawyerInfo && (
                          <div className="ml-7 space-y-2">
                            <div className="flex flex-wrap gap-3 text-xs">
                              {lawyerInfo.bar_association && (
                                <span className="bg-secondary-100 text-secondary-700 px-2.5 py-1 rounded-full font-medium">🏛️ Barreau : {lawyerInfo.bar_association}</span>
                              )}
                              {lawyerInfo.license_number && (
                                <span className="bg-secondary-100 text-secondary-700 px-2.5 py-1 rounded-full font-medium">📋 Licence : {lawyerInfo.license_number}</span>
                              )}
                              {lawyerInfo.experience_years != null && (
                                <span className="bg-secondary-100 text-secondary-700 px-2.5 py-1 rounded-full font-medium">⏳ {lawyerInfo.experience_years} ans d'expérience</span>
                              )}
                              <span className={`px-2.5 py-1 rounded-full font-medium ${lawyerInfo.verification_status === 'approved' ? 'bg-green-100 text-green-700' : lawyerInfo.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {lawyerInfo.verification_status === 'approved' ? '✅ Approuvé' : lawyerInfo.verification_status === 'rejected' ? '❌ Rejeté' : '⏳ En attente'}
                              </span>
                            </div>

                            {lawyerInfo.verification_documents && lawyerInfo.verification_documents.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {lawyerInfo.verification_documents.map((docUrl: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={docUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-600 hover:underline flex items-center gap-1 bg-primary-50 px-2.5 py-1 rounded-full font-medium transition-colors hover:bg-primary-100"
                                  >
                                    📄 Document justificatif #{idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}

                            {(!lawyerInfo.verification_documents || lawyerInfo.verification_documents.length === 0) && !l.is_verified && (
                              <p className="text-xs text-orange-500 italic">⚠️ Aucun document justificatif soumis</p>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              </div>
            )}

            {activeTab === 'appointments' && (
              <Card>
                <CardHeader>
                  <CardTitle>Suivi Global des Rendez-vous</CardTitle>
                  <CardDescription>Tous les rendez-vous de consultation planifiés sur la plateforme</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-secondary-50 border-y">
                        <tr>
                          <th className="px-6 py-3">Client</th>
                          <th className="px-6 py-3">Avocat</th>
                          <th className="px-6 py-3">Date planifiée</th>
                          <th className="px-6 py-3">Statut</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allAppointments.map((appt) => {
                          const statusLabels: Record<string, { text: string; color: string }> = {
                            pending: { text: "En attente", color: "bg-yellow-100 text-yellow-700" },
                            confirmed: { text: "Confirmé", color: "bg-green-100 text-green-700" },
                            cancelled: { text: "Annulé", color: "bg-red-100 text-red-700" },
                            completed: { text: "Terminé", color: "bg-primary-100 text-primary-700" }
                          };
                          const label = statusLabels[appt.status] || { text: appt.status, color: "bg-secondary-100 text-secondary-600" };
                          
                          return (
                            <tr key={appt.id} className="hover:bg-secondary-50">
                              <td className="px-6 py-4 font-medium">
                                {appt.client ? `${appt.client.first_name} ${appt.client.last_name}` : "Client inconnu"}
                              </td>
                              <td className="px-6 py-4">
                                {appt.lawyer ? `Me. ${appt.lawyer.first_name} ${appt.lawyer.last_name}` : "Avocat inconnu"}
                              </td>
                              <td className="px-6 py-4 text-secondary-500">
                                {new Date(appt.scheduled_at).toLocaleString('fr-FR')}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${label.color}`}>
                                  {label.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right flex justify-end gap-2">
                                {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                  <Button size="sm" variant="outline" className="text-red-600 border-red-100" onClick={() => handleCancelAppointmentByAdmin(appt.id)}>
                                    Annuler
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteAppointmentByAdmin(appt.id)}>
                                  Supprimer
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {allAppointments.length === 0 && <div className="p-8 text-center text-secondary-500">Aucun rendez-vous sur la plateforme.</div>}
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Gestion des Paiements</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportData('payments', 'csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Rapport CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-secondary-50 border-y">
                      <tr>
                        <th className="px-6 py-4">Avocat</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Montant Devis</th>
                        <th className="px-6 py-4">Commission (20%)</th>
                        <th className="px-6 py-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y relative">
                      {quotes.map(q => (
                        <tr key={q.id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4">{q.profiles?.first_name} {q.profiles?.last_name}</td>
                          <td className="px-6 py-4">{(q as any).client?.first_name} {(q as any).client?.last_name}</td>
                          <td className="px-6 py-4 font-bold">{q.amount} MAD</td>
                          <td className="px-6 py-4 text-primary-600 font-bold">{q.commission_amount} MAD</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${q.status === 'commissioned' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {q.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {quotes.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-secondary-500">Aucune transaction de devis.</td></tr>}
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

            {activeTab === 'classrooms' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-secondary-900">Gestion des Visioconférences</h2>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-secondary-50 border-b border-secondary-100 text-xs font-bold text-secondary-500 uppercase">
                            <th className="px-6 py-4">Titre</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Avocat</th>
                            <th className="px-6 py-4">Date / Heure</th>
                            <th className="px-6 py-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-50 text-sm">
                          {classrooms.map((room) => (
                            <tr key={room.id} className="hover:bg-secondary-50/50">
                              <td className="px-6 py-4 font-semibold text-secondary-900">{room.title}</td>
                              <td className="px-6 py-4 text-secondary-500 max-w-xs truncate" title={room.description}>{room.description}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  room.type === 'direct' ? 'bg-red-50 text-red-700' :
                                  room.type === 'video' ? 'bg-blue-50 text-blue-700' :
                                  'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {room.type === 'direct' ? 'Direct' : room.type === 'video' ? 'Vidéo' : 'Différé'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-secondary-700">
                                {room.lawyer ? `Me ${room.lawyer.first_name} ${room.lawyer.last_name}` : 'Avocat inconnu'}
                              </td>
                              <td className="px-6 py-4 text-secondary-500">
                                {room.scheduled_at ? new Date(room.scheduled_at).toLocaleString('fr-FR') : 'Non planifié'}
                              </td>
                              <td className="px-6 py-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteClassroomByAdmin(room.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {classrooms.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-secondary-400 italic">
                                Aucune visioconférence active.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
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
