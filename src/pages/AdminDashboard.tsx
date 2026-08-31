import React, { useState, useEffect } from 'react';
import { Users, Shield, BarChart3, Settings, Database, RefreshCw, Mail, FileText, UserPlus, Edit, HelpCircle, PenTool, BookOpen, Plus, CreditCard, Trash2, Eye, EyeOff, Video, Menu, X, LogOut, Download, FileJson, FileSpreadsheet, Calendar, AlertCircle, Lock, KeyRound } from 'lucide-react';
import { DATA_RETENTION_SCHEDULE, DATABASE_SECURITY_INFO, getSecurityStatusBadge } from '../lib/dataSecurityUtils';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
import Modal from '../components/ui/Modal';
import { AdvancedAreaChart, AdvancedBarChart, SimplePieChart } from '../components/features/StatsCharts';
import { exportToCSV, exportToJSON } from '../lib/exportUtils';
import { regions } from '../components/features/FranceMap';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/ui/NotificationBell';
import LiveSyncBadge from '../components/ui/LiveSyncBadge';
import { useTranslation } from '../i18n';
import { AnnualPlanning } from '../components/features/AnnualPlanning';
import { ScientificReviews } from '../components/features/ScientificReviews';
import { COURS_D_APPEL_LIST } from '../lib/jurisdictions';
import {
  type FormationAttachment,
  convertFileToAttachment,
  exportAllAttachments,
  getFormationAttachments
} from '../lib/formationAttachmentUtils';
import { registerDeletedUser } from '../lib/avocatsDataGouvSync';
import { getMergedOfficialFormations } from '../data/officialFormationsData';

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
    [key: string]: any;
  };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toasts, removeToast, success, error: toastError } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'lawyers' | 'documents' | 'messages' | 'system' | 'settings' | 'assistance' | 'outils' | 'formations' | 'payments' | 'monitoring' | 'appointments' | 'classrooms' | 'planning' | 'reviews' | 'security'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const [createFormationOpen, setCreateFormationOpen] = useState(false);
  const [newFormation, setNewFormation] = useState({
    title: '',
    category: 'Droit des Contrats',
    course_category: 'masterclass' as 'masterclass' | 'diplomante',
    level: 'Débutant',
    duration: '2h 00',
    description: '',
    attachments: [] as FormationAttachment[]
  });

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
    fields: { name: string; label: string; defaultValue?: string; type?: string; options?: { value: string; label: string }[] }[];
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

  const [passwordResets, setPasswordResets] = useState<any[]>([]);

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
    fetchPasswordResets();
    
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'password_resets_just' }, fetchPasswordResets)
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
    const caNames = COURS_D_APPEL_LIST.map(ca => ca.name);
    return Array.from(new Set([...list, ...caNames])).sort();
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
    try {
      const { data, error } = await supabase
        .from('documents_just')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (!error && data && data.length > 0) {
        const ownerIds = [...new Set(data.map(d => d.owner_id || d.user_id).filter(Boolean))];
        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles_just')
            .select('id, first_name, last_name, email')
            .in('id', ownerIds);
          
          const profileMap: Record<string, any> = {};
          profiles?.forEach(p => { profileMap[p.id] = p; });

          const enriched = data.map(d => ({
            ...d,
            profiles: profileMap[d.owner_id || d.user_id] || null
          }));
          setAllDocuments(enriched);
        } else {
          setAllDocuments(data);
        }
      } else if (data) {
        setAllDocuments(data);
      }
    } catch (e) {
      console.warn("Could not fetch documents:", e);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await supabase
        .from('contact_messages_just')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setMessages(data);
    } catch (e) {
      console.warn("Could not fetch messages:", e);
    }
  };

  const fetchFormations = async () => {
    try {
      const { data } = await supabase.from('formations_just').select('*').order('created_at', { ascending: false });
      setFormations(getMergedOfficialFormations(data || []));
    } catch (e) {
      console.warn("Could not fetch formations:", e);
      setFormations(getMergedOfficialFormations([]));
    }
  };

  const fetchOutils = async () => {
    try {
      const { data } = await supabase.from('outils_just').select('*').order('created_at', { ascending: false });
      if (data) setOutils(data);
    } catch (e) {
      console.warn("Could not fetch outils:", e);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase.from('assistance_tickets_just').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const uIds = [...new Set(data.map(t => t.user_id || t.owner_id).filter(Boolean))];
        if (uIds.length > 0) {
          const { data: profs } = await supabase.from('profiles_just').select('id, first_name, last_name').in('id', uIds);
          const pMap: Record<string, any> = {};
          profs?.forEach(p => { pMap[p.id] = p; });
          setTickets(data.map(t => ({ ...t, profiles: pMap[t.user_id || t.owner_id] || null })));
        } else {
          setTickets(data);
        }
      } else if (data) {
        setTickets(data);
      }
    } catch (e) {
      console.warn("Could not fetch tickets:", e);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase.from('payments_just').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const uIds = [...new Set(data.map(p => p.user_id || p.owner_id).filter(Boolean))];
        if (uIds.length > 0) {
          const { data: profs } = await supabase.from('profiles_just').select('id, first_name, last_name').in('id', uIds);
          const pMap: Record<string, any> = {};
          profs?.forEach(p => { pMap[p.id] = p; });
          setPayments(data.map(p => ({ ...p, profiles: pMap[p.user_id || p.owner_id] || null })));
        } else {
          setPayments(data);
        }
      } else if (data) {
        setPayments(data);
      }
    } catch (e) {
      console.warn("Could not fetch payments:", e);
    }
  };

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase.from('quotes_just').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const allIds = [...new Set(data.flatMap(q => [q.lawyer_id, q.client_id]).filter(Boolean))];
        if (allIds.length > 0) {
          const { data: profs } = await supabase.from('profiles_just').select('id, first_name, last_name').in('id', allIds);
          const pMap: Record<string, any> = {};
          profs?.forEach(p => { pMap[p.id] = p; });
          setQuotes(data.map(q => ({
            ...q,
            profiles: pMap[q.lawyer_id] || null,
            client: pMap[q.client_id] || null
          })));
        } else {
          setQuotes(data);
        }
      } else if (data) {
        setQuotes(data);
      }
    } catch (e) {
      console.warn("Could not fetch quotes:", e);
    }
  };

  const fetchChatRooms = async () => {
    try {
      const { data, error } = await supabase.from('chat_rooms_just').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const allIds = [...new Set(data.flatMap(c => [c.lawyer_id, c.client_id]).filter(Boolean))];
        if (allIds.length > 0) {
          const { data: profs } = await supabase.from('profiles_just').select('id, first_name, last_name').in('id', allIds);
          const pMap: Record<string, any> = {};
          profs?.forEach(p => { pMap[p.id] = p; });
          setChatRooms(data.map(c => ({
            ...c,
            lawyer: pMap[c.lawyer_id] || null,
            client: pMap[c.client_id] || null
          })));
        } else {
          setChatRooms(data);
        }
      } else if (data) {
        setChatRooms(data);
      }
    } catch (e) {
      console.warn("Could not fetch chat rooms:", e);
    }
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

  const handleAddClassroomByAdmin = () => {
    openModal("Créer une Visioconférence (Admin)", [
      { name: 'title', label: "Titre de la session" },
      { name: 'description', label: "Description" },
      { name: 'type', label: "Type (direct / video / differe)" },
      { name: 'scheduled_at', label: "Date et heure (YYYY-MM-DDTHH:MM)", type: 'datetime-local' },
      { name: 'duration_minutes', label: "Durée (minutes)", type: 'number' },
      { name: 'max_members', label: "Max participants", type: 'number' },
      { name: 'video_url', label: "URL Vidéo (YouTube / Vimeo / MP4)" },
    ], async (vals) => {
      if (!vals.title) return;
      const scheduledDate = vals.scheduled_at ? new Date(vals.scheduled_at) : null;
      const dateStr = scheduledDate ? scheduledDate.toISOString().split('T')[0] : null;
      const timeStr = scheduledDate ? scheduledDate.toTimeString().slice(0, 5) : null;
      const { error } = await supabase.from('classrooms_just').insert([{
        title: vals.title,
        description: vals.description || '',
        type: vals.type || 'direct',
        scheduled_at: vals.scheduled_at || null,
        date: dateStr,
        time: timeStr,
        duration_minutes: parseInt(vals.duration_minutes) || 60,
        max_members: parseInt(vals.max_members) || 100,
        video_url: vals.video_url || '',
        lawyer_id: user?.id,
        is_active: true
      }]);
      if (error) toastError("Erreur", error.message);
      else { success("Visio créée", "La visioconférence a été créée par l'administrateur."); fetchClassrooms(); }
    });
  };

  const handleEditClassroomByAdmin = (room: any) => {
    openModal("Modifier la Visioconférence", [
      { name: 'title', label: "Titre", defaultValue: room.title || '' },
      { name: 'description', label: "Description", defaultValue: room.description || '' },
      { name: 'video_url', label: "URL Vidéo", defaultValue: room.video_url || '' },
    ], async (vals) => {
      const updates: any = {};
      if (vals.title) updates.title = vals.title;
      if (vals.description !== undefined) updates.description = vals.description;
      if (vals.video_url !== undefined) updates.video_url = vals.video_url;
      const { error } = await supabase.from('classrooms_just').update(updates).eq('id', room.id);
      if (error) toastError("Erreur", error.message);
      else { success("Visio modifiée", "La visioconférence a été mise à jour."); fetchClassrooms(); }
    });
  };

  const handleToggleClassroomByAdmin = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('classrooms_just').update({ is_active: !isActive }).eq('id', id);
    if (!error) {
      success(isActive ? "Suspendue" : "Activée", `La visioconférence a été ${isActive ? 'suspendue' : 'activée'}.`);
      fetchClassrooms();
    } else {
      toastError("Erreur", error.message);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('platform_settings_just').select('*').eq('id', 'global').maybeSingle();
    if (data) setSettings(data);
  };

  const fetchPasswordResets = async () => {
    try {
      const { data } = await supabase
        .from('password_resets_just')
        .select('*')
        .order('requested_at', { ascending: false });
      if (data) setPasswordResets(data);
    } catch (e) {
      console.warn("Notice: Error fetching password resets:", e);
    }
  };

  const handleAdminTriggerPasswordReset = async (userEmail: string, userRole: string) => {
    if (userRole === 'admin' || userEmail.includes('admin@francejustice.com')) {
      toastError("Action Interdite", "Les comptes administrateurs ne peuvent pas réinitialiser leur mot de passe par ce canal en ligne.");
      return;
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      toastError("Erreur d'envoi", error.message);
    } else {
      success("Lien Envoyé", `Un lien de réinitialisation sécurisé a été envoyé à ${userEmail}.`);
      await supabase.from('password_resets_just').insert([{
        email: userEmail,
        user_role: userRole,
        requested_at: new Date().toISOString(),
        status: 'admin_triggered'
      }]);
      fetchPasswordResets();
    }
  };

  const handleDeletePasswordResetLog = async (id: string) => {
    const { error } = await supabase.from('password_resets_just').delete().eq('id', id);
    if (!error) {
      success("Supprimé", "Le journal de réinitialisation a été supprimé.");
      fetchPasswordResets();
    }
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
    setCreateFormationOpen(true);
  };

  const handleCreateFormationAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormation.title.trim()) {
      toastError("Erreur", "Le titre de la formation est obligatoire.");
      return;
    }
    try {
      const pdfUrlData = newFormation.attachments.length > 0 ? JSON.stringify(newFormation.attachments) : null;
      const { error } = await supabase.from('formations_just').insert([{
        title: newFormation.title,
        category: newFormation.category,
        level: newFormation.level,
        duration: newFormation.duration,
        description: newFormation.description,
        pdf_url: pdfUrlData,
        author_id: user?.id,
        author_name: 'Administration France Justice',
        author_role: 'Admin',
        status: 'Publié'
      }]);
      if (error) throw error;
      success("Formation créée 🎓", "Module de formation publié avec succès.");
      setCreateFormationOpen(false);
      setNewFormation({
        title: '',
        category: 'Droit des Contrats',
        course_category: 'masterclass',
        level: 'Débutant',
        duration: '2h 00',
        description: '',
        attachments: []
      });
      fetchFormations();
    } catch (err: any) {
      toastError("Erreur", err.message || "Impossible de créer la formation.");
    }
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
    const targetUser = users.find(u => u.id === id);
    openModal("Supprimer l'utilisateur ?", [], async () => {
      try {
        if (targetUser?.email) {
          registerDeletedUser(targetUser.email);
        }
        await supabase.from('lawyers_just').delete().eq('id', id);
        await supabase.from('academic_profiles_just').delete().eq('user_id', id);
        const { error: err3 } = await supabase.from('profiles_just').delete().eq('id', id);

        if (!err3) {
          fetchUsers();
          success("Supprimé", "L'utilisateur a été supprimé avec succès.");
        } else {
          const response = await fetch(`/api/accounts/delete-user-admin/${id}/`, { method: 'DELETE' });
          if(response.ok) {
            fetchUsers();
            success("Supprimé", "L'utilisateur a été supprimé.");
          } else {
            toastError("Erreur", "Impossible de supprimer l'utilisateur.");
          }
        }
      } catch(e) {
        console.error("User deletion error:", e);
        toastError("Erreur", "Erreur lors de la suppression.");
      }
    }, "Supprimer définitivement", true);
  };

  const handleToggleSuspend = async (u: any) => {
    const newStatus = !u.is_verified;
    try {
      const { error } = await supabase.from('profiles_just').update({ is_verified: newStatus }).eq('id', u.id);
      if (!error) {
        fetchUsers();
        success("Mise à jour", `L'utilisateur a été ${newStatus ? 'activé' : 'suspendu'}.`);
      } else {
        const action = u.is_verified ? 'suspend' : 'activate';
        const response = await fetch(`/api/accounts/${action}-user-admin/${u.id}/`, { method: 'POST' });
        if(response.ok) {
          fetchUsers();
          success("Mise à jour", `L'utilisateur a été ${u.is_verified ? 'suspendu' : 'activé'}.`);
        } else {
          toastError("Erreur", "Erreur de mise à jour");
        }
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zchhijltemvrsthdaxex.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });

      const { data: authData, error: authErr } = await tempSupabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            role: newUser.role
          }
        }
      });

      if (authErr && !authErr.message.includes('User already registered')) {
        throw new Error(authErr.message || 'Échec de la création du compte');
      }

      const newUserId = authData.user?.id || authData.session?.user?.id || `user_${Date.now()}`;
      
      // Upsert profiles_just
      await supabase.from('profiles_just').upsert([{
        id: newUserId,
        email: newUser.email,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        role: newUser.role,
        is_verified: true
      }]);

      if (newUser.role === 'lawyer') {
        await supabase.from('lawyers_just').upsert([{
          id: newUserId,
          verification_status: 'verified'
        }]);
      } else if (['student', 'professor', 'doctorate'].includes(newUser.role)) {
        await supabase.from('academic_profiles_just').upsert([{
          id: newUserId,
          role: newUser.role,
          status: 'verified'
        }]);
      }

      success("Utilisateur créé", `Le compte ${newUser.firstName} ${newUser.lastName} (${newUser.role}) a été créé avec succès.`);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
      fetchUsers();
    } catch (err: any) {
      toastError("Erreur", err.message || "Impossible de créer l'utilisateur");
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
    { name: 'Étudiants', value: users.filter(u => u.role === 'student').length },
    { name: 'Professeurs', value: users.filter(u => u.role === 'professor').length },
    { name: 'Doctorants', value: users.filter(u => u.role === 'doctorate').length },
    { name: 'Avocats', value: users.filter(u => u.role === 'lawyer').length },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
  ];

  const systemStats = [
    { label: t('admin_dashboard.users', 'Membres & Citoyens'), value: users.length.toString(), icon: Users },
    { label: t('admin_dashboard.lawyers', 'Avocats & Enseignants'), value: users.filter(u => ['lawyer', 'professor', 'doctorate'].includes(u.role)).length.toString(), icon: Shield },
    { label: t('admin_dashboard.all_documents', 'Documents'), value: allDocuments.length.toString(), icon: FileText },
    { label: t('admin_dashboard.platform_revenue', 'Commissions'), value: `${quotes.filter(q => q.status === 'commissioned').reduce((acc, q) => acc + Number(q.commission_amount), 0)} MAD`, icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-16">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Modern Hero Glassmorphism Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl mb-8 border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  Administration Centrale
                </span>
                <span className="bg-white/10 text-slate-200 text-xs font-bold px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                  Ressort National & Européen
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                {t('admin_dashboard.title', 'Espace Administration France Justice')}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
                Supervision globale de la plateforme, gestion des utilisateurs, validation des avocats & enseignants, contrôle des documents PDF et visioconférences.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 backdrop-blur-md bg-white/5 p-3 rounded-2xl border border-white/10">
              <LiveSyncBadge status="connected" showText={true} />
              <NotificationBell userId={user?.id ?? null} />
              <Button onClick={() => { fetchUsers(); fetchMessages(); }} variant="outline" size="sm" className="hidden sm:flex bg-white/10 text-white hover:bg-white/20 border-white/20 rounded-xl">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('common.refresh', 'Actualiser')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex text-red-300 hover:text-white bg-red-500/10 hover:bg-red-600/80 border-red-400/30 rounded-xl"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout', 'Déconnexion')}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Hamburger Button for Sidebar (Visible < lg) */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white font-extrabold text-sm shadow-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Menu className="w-5 h-5 text-indigo-400" />
              <span>Menu Admin : {[
                { id: 'overview', name: t('dashboard.overview', "Vue d'ensemble") },
                { id: 'appointments', name: t('dashboard.appointments', "Rendez-vous") },
                { id: 'users', name: t('admin_dashboard.users', "Utilisateurs") },
                { id: 'lawyers', name: t('admin_dashboard.verifications', "Approbations") },
                { id: 'documents', name: t('admin_dashboard.all_documents', "Documents") },
                { id: 'messages', name: t('dashboard.messages', "Messages") },
                { id: 'system', name: t('admin_dashboard.system', "Système") },
                { id: 'settings', name: t('admin_dashboard.settings', "Paramètres Globaux") },
                { id: 'assistance', name: t('admin_dashboard.assistance', "Assistance") },
                { id: 'outils', name: t('admin_dashboard.lawyer_tools', "Outils Avocats") },
                { id: 'formations', name: t('dashboard.formations', "Formations") },
                { id: 'classrooms', name: t('admin_dashboard.videoconferences', "Visioconférences") },
                { id: 'planning', name: 'Planning Annuel' },
                { id: 'reviews', name: 'Revues Scientifiques' },
                { id: 'payments', name: t('admin_dashboard.platform_revenue', "Paiements") },
                { id: 'monitoring', name: t('admin_dashboard.live_monitoring', "LIVE Monitoring") }
              ].find(t => t.id === activeTab)?.name || "Navigation"}</span>
            </div>
            <span className="text-xs bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold">
              Menu Admin ☰
            </span>
          </button>
        </div>

        {/* Mobile Sidebar Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-md transition-all">
            <div className="relative w-4/5 max-w-sm bg-slate-900 text-slate-100 h-full p-6 shadow-2xl border-r border-slate-800 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2 font-extrabold text-white text-base">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Administration Centrale
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {[
                    { id: 'overview', name: t('dashboard.overview', "Vue d'ensemble"), icon: BarChart3 },
                    { id: 'appointments', name: t('dashboard.appointments', "Rendez-vous"), icon: RefreshCw },
                    { id: 'users', name: t('admin_dashboard.users', "Utilisateurs"), icon: Users },
                    { id: 'lawyers', name: t('admin_dashboard.verifications', "Approbations"), icon: Shield },
                    { id: 'documents', name: t('admin_dashboard.all_documents', "Documents"), icon: FileText },
                    { id: 'messages', name: t('dashboard.messages', "Messages"), icon: Mail },
                    { id: 'system', name: t('admin_dashboard.system', "Système"), icon: Database },
                    { id: 'settings', name: t('admin_dashboard.settings', "Paramètres Globaux"), icon: Settings },
                    { id: 'assistance', name: t('admin_dashboard.assistance', "Assistance"), icon: HelpCircle },
                    { id: 'outils', name: t('admin_dashboard.lawyer_tools', "Outils Avocats"), icon: PenTool },
                    { id: 'formations', name: t('dashboard.formations', "Formations"), icon: BookOpen },
                    { id: 'classrooms', name: t('admin_dashboard.videoconferences', "Visioconférences"), icon: Video },
                    { id: 'planning', name: 'Planning Annuel', icon: Calendar },
                    { id: 'reviews', name: 'Revues Scientifiques', icon: BookOpen },
                    { id: 'payments', name: t('admin_dashboard.platform_revenue', "Paiements"), icon: CreditCard },
                    { id: 'monitoring', name: t('admin_dashboard.live_monitoring', "LIVE Monitoring"), icon: RefreshCw },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 text-sm font-semibold cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <Button
                  variant="outline"
                  className="w-full text-red-400 border-red-900/60 hover:bg-red-950 text-xs font-bold"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                </Button>
              </div>
            </div>

            {/* Backdrop area to close when clicked outside */}
            <div className="flex-1 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-6 overflow-hidden bg-slate-900/90 border-slate-800">
              <CardContent className="p-4 flex flex-col space-y-1.5">
                {[
                  { id: 'overview', name: t('dashboard.overview', "Vue d'ensemble"), icon: BarChart3 },
                  { id: 'appointments', name: t('dashboard.appointments', "Rendez-vous"), icon: RefreshCw },
                  { id: 'users', name: t('admin_dashboard.users', "Utilisateurs"), icon: Users },
                  { id: 'lawyers', name: t('admin_dashboard.verifications', "Approbations"), icon: Shield },
                  { id: 'documents', name: t('admin_dashboard.all_documents', "Documents"), icon: FileText },
                  { id: 'messages', name: t('dashboard.messages', "Messages"), icon: Mail },
                  { id: 'system', name: t('admin_dashboard.system', "Système"), icon: Database },
                  { id: 'settings', name: t('admin_dashboard.settings', "Paramètres Globaux"), icon: Settings },
                  { id: 'assistance', name: t('admin_dashboard.assistance', "Assistance"), icon: HelpCircle },
                  { id: 'outils', name: t('admin_dashboard.lawyer_tools', "Outils Avocats"), icon: PenTool },
                  { id: 'formations', name: t('dashboard.formations', "Formations"), icon: BookOpen },
                  { id: 'classrooms', name: t('admin_dashboard.videoconferences', "Visioconférences"), icon: Video },
                  { id: 'planning', name: 'Planning Annuel', icon: Calendar },
                  { id: 'reviews', name: 'Revues Scientifiques', icon: BookOpen },
                  { id: 'payments', name: t('admin_dashboard.platform_revenue', "Paiements"), icon: CreditCard },
                  { id: 'monitoring', name: t('admin_dashboard.live_monitoring', "LIVE Monitoring"), icon: RefreshCw },
                  { id: 'security', name: 'Sécurité BD & RGPD', icon: Lock },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      activeTab === tab.id 
                        ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30' 
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-3 text-indigo-400" />
                    <span className="font-medium whitespace-nowrap">{tab.name}</span>
                  </button>
                ))}

                {/* 📜 CONFORMITÉ & SÉCURITÉ DE LA BASE DE DONNÉES */}
                <div className="pt-4 mt-4 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-2 mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" /> Administration RGPD & BD
                  </div>
                  <a href="/legal#legal" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors">
                    ⚖️ Mentions Légales
                  </a>
                  <a href="/legal#privacy" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors">
                    🔒 Politique de Confidentialité
                  </a>
                  <a href="/legal#cgv" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors">
                    📜 CGV / CGU Plateforme
                  </a>
                  <a href="/legal#retention" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors">
                    🛡️ Schedule Retention & BD
                  </a>
                </div>
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
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-primary-950/80 text-primary-400 border border-primary-800">
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
                      <CardTitle>{t('admin_dashboard.platform_activity', 'Activité de la plateforme')}</CardTitle>
                      <CardDescription>{t('admin_dashboard.activity_desc', 'Évolution des inscriptions et activités')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AdvancedAreaChart data={chartData} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('admin_dashboard.role_distribution', 'Distribution des Rôles')}</CardTitle>
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
                      <div className="divide-y border-t border-slate-800">
                        {messages.slice(0, 5).map((m) => (
                          <div key={m.id} className="p-4 hover:bg-slate-800/60 transition-colors">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-sm text-white">{m.name}</span>
                              <span className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-300 truncate">{m.subject}</p>
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
                      <div className="divide-y border-t border-slate-800">
                        {users.filter(u => u.role === 'lawyer' && !u.is_verified).slice(0, 5).map((u) => (
                          <div key={u.id} className="p-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-200">{u.first_name} {u.last_name}</span>
                            <Button size="sm" variant="outline" onClick={() => handleApproveLawyer(u.id)} className="border-slate-700 text-slate-300 hover:bg-slate-800">Approuver</Button>
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
                       <RefreshCw className="h-5 w-5 text-primary-400 animate-spin" />
                       Flux Live
                    </CardTitle>
                    <CardDescription>Événements en temps réel</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[600px] overflow-y-auto">
                    <div className="space-y-4">
                      {activities.map(act => (
                        <div key={act.id} className="p-3 bg-slate-900 rounded-lg border-l-4 border-indigo-500 shadow-sm text-slate-100 border border-slate-800">
                          <p className="text-sm font-bold text-white">{act.message}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{act.time} • {act.type}</p>
                        </div>
                      ))}
                      {activities.length === 0 && <p className="text-center text-slate-400 py-10">En attente d'activité...</p>}
                    </div>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Surveillance des Chats</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 border-y border-slate-800 text-slate-400">
                          <tr><th className="px-6 py-4">Avocat</th><th className="px-6 py-4">Citizen</th><th className="px-6 py-4">Logs</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                          {chatRooms.map(room => (
                            <tr key={room.id} className="hover:bg-slate-800/60 transition-colors">
                              <td className="px-6 py-4">Me {room.lawyer?.first_name} {room.lawyer?.last_name}</td>
                              <td className="px-6 py-4">{room.client?.first_name} {room.client?.last_name}</td>
                              <td className="px-6 py-4">
                                <Button variant="ghost" size="sm" className="text-primary-400 hover:bg-slate-800">Visualiser</Button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm text-slate-100">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Rôle</label>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:outline-none"
                    >
                      <option value="all">Tous les rôles</option>
                      <option value="user">Citoyens</option>
                      <option value="lawyer">Avocats</option>
                      <option value="admin">Administrateurs</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Région</label>
                    <select
                      value={filterRegion}
                      onChange={(e) => setFilterRegion(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:outline-none"
                    >
                      <option value="">Toutes les régions</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Barreau</label>
                    <select
                      value={filterBarreau}
                      onChange={(e) => setFilterBarreau(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:outline-none"
                    >
                      <option value="">Tous les barreaux</option>
                      {uniqueBarreaux.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Ville</label>
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:outline-none"
                    >
                      <option value="">Toutes les villes</option>
                      {uniqueCities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <UserPlus className="h-5 w-5 mr-3 text-indigo-400" />
                      Création Administrative de Compte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Prénom" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} required className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400" />
                      <Input placeholder="Nom" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} required className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400" />
                      <Input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400" />
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Mot de passe" 
                          value={newUser.password} 
                          onChange={e => setNewUser({...newUser, password: e.target.value})} 
                          required
                          className="pr-10 bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <select 
                        className="w-full flex h-10 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans" 
                        value={newUser.role} 
                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                      >
                        <option value="user">👤 Citoyen / Utilisateur</option>
                        <option value="lawyer">⚖️ Avocat</option>
                        <option value="admin">🛡️ Administrateur</option>
                        <option value="student">🎓 Étudiant en Droit</option>
                        <option value="professor">👨‍🏫 Professeur de Droit</option>
                        <option value="doctorate">📜 Doctorant en Droit</option>
                      </select>
                      <Button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold">{isCreating ? 'En cours...' : 'Créer le Compte'}</Button>
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
                        <thead className="bg-slate-950 border-y border-slate-800 text-slate-400">
                          <tr><th className="px-6 py-3">Membre</th><th className="px-6 py-3">Rôle</th><th className="px-6 py-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
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
                                <tr key={u.id} className="hover:bg-slate-800/60 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-white">{u.first_name} {u.last_name}</div>
                                    <div className="text-xs text-slate-400">{u.email}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold mt-1">
                                      📍 {u.city || 'Non renseigné'}{u.postal_code ? ` (${u.postal_code.substring(0, 2)})` : ''} 
                                      {regName ? ` - Région : ${regName}` : ''}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)} className="hover:bg-slate-800" title="Modifier le compte">
                                      <Edit className="w-4 h-4 text-slate-300"/>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title={u.role === 'admin' ? "Interdit pour l'Admin" : "Réinitialiser le mot de passe de l'utilisateur"}
                                      disabled={u.role === 'admin'}
                                      onClick={() => handleAdminTriggerPasswordReset(u.email, u.role)}
                                      className={u.role === 'admin' ? "text-slate-600 opacity-50 cursor-not-allowed" : "text-indigo-400 hover:bg-slate-800"}
                                    >
                                      <KeyRound className="w-4 h-4"/>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleToggleSuspend(u)} className={u.is_verified ? "text-amber-400 hover:bg-slate-800" : "text-emerald-400 hover:bg-slate-800"}>
                                      {u.is_verified ? "Suspendre" : "Activer"}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-400 hover:bg-slate-800" onClick={() => handleDeleteUser(u.id)}>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm text-slate-100">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Région</label>
                    <select
                      value={filterRegion}
                      onChange={(e) => setFilterRegion(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:outline-none"
                    >
                      <option value="" className="bg-slate-900 text-slate-100">Toutes les régions</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.name} className="bg-slate-900 text-slate-100">{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Barreau</label>
                    <select
                      value={filterBarreau}
                      onChange={(e) => setFilterBarreau(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:outline-none"
                    >
                      <option value="" className="bg-slate-900 text-slate-100">Tous les barreaux</option>
                      {uniqueBarreaux.map(b => (
                        <option key={b} value={b} className="bg-slate-900 text-slate-100">{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Ville</label>
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:outline-none"
                    >
                      <option value="" className="bg-slate-900 text-slate-100">Toutes les villes</option>
                      {uniqueCities.map(c => (
                        <option key={c} value={c} className="bg-slate-900 text-slate-100">{c}</option>
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
                    <div className="divide-y divide-slate-800 border-t border-slate-800">
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
                                  <p className="font-bold text-white">Me {l.first_name} {l.last_name}</p>
                                  <p className="text-xs text-slate-400">{l.email}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    📍 Cabinet : {l.city || 'Non renseigné'}{l.postal_code ? ` (${l.postal_code.substring(0, 2)})` : ''} 
                                    {regName ? ` - Région : ${regName}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                            {!l.is_verified && <Button size="sm" onClick={() => handleApproveLawyer(l.id)}>Approuver</Button>}
                            <Button size="sm" variant="outline" className="text-red-400 border-slate-700 hover:bg-slate-800">Suspendre</Button>
                          </div>
                        </div>

                        {lawyerInfo && (
                          <div className="ml-7 space-y-2">
                            <div className="flex flex-wrap gap-3 text-xs">
                              {lawyerInfo.bar_association && (
                                <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-full font-medium">🏛️ Barreau : {lawyerInfo.bar_association}</span>
                              )}
                              {lawyerInfo.license_number && (
                                <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-full font-medium">📋 Licence : {lawyerInfo.license_number}</span>
                              )}
                              {lawyerInfo.experience_years != null && (
                                <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-full font-medium">⏳ {lawyerInfo.experience_years} ans d'expérience</span>
                              )}
                              <span className={`px-2.5 py-1 rounded-full font-medium ${lawyerInfo.verification_status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : lawyerInfo.verification_status === 'rejected' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
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
                      <thead className="bg-slate-950 border-y border-slate-800 text-slate-400">
                        <tr>
                          <th className="px-6 py-3">Client</th>
                          <th className="px-6 py-3">Avocat</th>
                          <th className="px-6 py-3">Date planifiée</th>
                          <th className="px-6 py-3">Statut</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {allAppointments.map((appt) => {
                          const statusLabels: Record<string, { text: string; color: string }> = {
                            pending: { text: "En attente", color: "bg-amber-950 text-amber-300 border border-amber-800" },
                            confirmed: { text: "Confirmé", color: "bg-emerald-950 text-emerald-300 border border-emerald-800" },
                            cancelled: { text: "Annulé", color: "bg-red-950 text-red-300 border border-red-800" },
                            completed: { text: "Terminé", color: "bg-indigo-950 text-indigo-300 border border-indigo-800" }
                          };
                          const label = statusLabels[appt.status] || { text: appt.status, color: "bg-slate-800 text-slate-300" };
                          
                          return (
                            <tr key={appt.id} className="hover:bg-slate-800/60 transition-colors">
                              <td className="px-6 py-4 font-medium text-white">
                                {appt.client ? `${appt.client.first_name} ${appt.client.last_name}` : "Client inconnu"}
                              </td>
                              <td className="px-6 py-4 text-slate-300">
                                {appt.lawyer ? `Me. ${appt.lawyer.first_name} ${appt.lawyer.last_name}` : "Avocat inconnu"}
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                {new Date(appt.scheduled_at).toLocaleString('fr-FR')}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${label.color}`}>
                                  {label.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right flex justify-end gap-2">
                                {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                  <Button size="sm" variant="outline" className="text-red-400 border-red-900/60 hover:bg-slate-800" onClick={() => handleCancelAppointmentByAdmin(appt.id)}>
                                    Annuler
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-red-400 hover:bg-slate-800" onClick={() => handleDeleteAppointmentByAdmin(appt.id)}>
                                  Supprimer
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {allAppointments.length === 0 && <div className="p-8 text-center text-slate-400">Aucun rendez-vous sur la plateforme.</div>}
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
                      <thead className="bg-slate-950 border-y border-slate-800 text-slate-400">
                        <tr>
                          <th className="px-6 py-3">Document</th>
                          <th className="px-6 py-3">Propriétaire</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {allDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-800/60 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{doc.name}</td>
                            <td className="px-6 py-4 text-slate-300">
                              {doc.profiles?.first_name} {doc.profiles?.last_name}
                            </td>
                            <td className="px-6 py-4 text-slate-400">{doc.type}</td>
                            <td className="px-6 py-4 text-slate-400">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {allDocuments.length === 0 && <div className="p-8 text-center text-slate-400">Aucun document généré.</div>}
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
                  <div className="divide-y divide-slate-800 border-t border-slate-800">
                    {messages.map((m) => (
                      <div key={m.id} className="p-6 hover:bg-slate-800/60 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-white">{m.subject}</h3>
                            <p className="text-sm text-slate-400">De: {m.name} ({m.email})</p>
                          </div>
                          <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200 bg-slate-950 p-4 rounded-xl mt-2 border border-slate-800">{m.message}</p>
                      </div>
                    ))}
                    {messages.length === 0 && <div className="p-8 text-center text-slate-400">Aucun message pour le moment.</div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'system' && (
              <Card>
                <CardHeader><CardTitle>État du Système</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-slate-800 rounded-xl flex items-center justify-between bg-slate-900 text-slate-100">
                    <span className="font-semibold text-slate-200">Services France-Justice</span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800">100% Online</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'payments' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Gestion des Paiements</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportData('payments', 'csv')} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                      <Download className="h-4 w-4 mr-2" />
                      Rapport CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 border-y border-slate-800 text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Avocat</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Montant Devis</th>
                        <th className="px-6 py-4">Commission (20%)</th>
                        <th className="px-6 py-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 relative">
                      {quotes.map(q => (
                        <tr key={q.id} className="hover:bg-slate-800/60 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{q.profiles?.first_name} {q.profiles?.last_name}</td>
                          <td className="px-6 py-4 text-slate-300">{(q as any).client?.first_name} {(q as any).client?.last_name}</td>
                          <td className="px-6 py-4 font-bold text-white">{q.amount} MAD</td>
                          <td className="px-6 py-4 text-indigo-400 font-bold">{q.commission_amount} MAD</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${q.status === 'commissioned' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                              {q.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {quotes.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Aucune transaction de devis.</td></tr>}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card>
                <CardHeader><CardTitle>Paramètres Globaux du Système</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="font-semibold text-white">Mode Maintenance</h4>
                      <p className="text-sm text-slate-400">Désactiver l'accès public au site</p>
                    </div>
                    <Button variant={settings?.maintenance_mode ? 'danger' : 'outline'} onClick={() => handleUpdateSettings('maintenance_mode', !settings?.maintenance_mode)} className={!settings?.maintenance_mode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : ""}>
                      {settings?.maintenance_mode ? 'Désactiver le site' : 'Activer'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="font-semibold text-white">Commission Avocat (%)</h4>
                      <p className="text-sm text-slate-400">Taux prélevé sur les consultations</p>
                    </div>
                    <div className="flex gap-2">
                       <Input type="number" defaultValue={settings?.commission_rate} id="comm_rate" className="w-20 bg-slate-900 border-slate-800 text-slate-100" />
                       <Button variant="outline" onClick={() => handleUpdateSettings('commission_rate', (document.getElementById('comm_rate') as HTMLInputElement).value)} className="border-slate-700 text-slate-300 hover:bg-slate-800">Enregistrer</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h4 className="font-semibold text-white">Message de Bienvenue</h4>
                    </div>
                    <div className="flex gap-2 w-1/2">
                       <Input type="text" defaultValue={settings?.welcome_message} id="welcome_msg" className="w-full bg-slate-900 border-slate-800 text-slate-100" />
                       <Button variant="outline" onClick={() => handleUpdateSettings('welcome_message', (document.getElementById('welcome_msg') as HTMLInputElement).value)} className="border-slate-700 text-slate-300 hover:bg-slate-800">Sauver</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'assistance' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">Tickets d'Assistance</h2>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-950 border-y border-slate-800 text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Utilisateur</th>
                          <th className="px-6 py-4">Sujet</th>
                          <th className="px-6 py-4">Statut</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300 relative">
                        {tickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-slate-800/60 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{ticket.profiles ? `${ticket.profiles.first_name} ${ticket.profiles.last_name}` : ticket.user_id}</td>
                            <td className="px-6 py-4 text-slate-300">{ticket.subject}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'En cours' ? 'bg-amber-950 text-amber-300 border border-amber-800' : ticket.status === 'Résolu' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'}`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 flex items-center gap-2">
                              <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => handleManageTicket(ticket.id, ticket.status)}>Statut</Button>
                              <Button size="sm" variant="ghost" className="text-red-400 hover:bg-slate-800" onClick={() => handleDeleteTicket(ticket.id)}><Trash2 className="h-4 w-4" /></Button>
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
                  <h2 className="text-2xl font-semibold text-white">Gestion des Outils Avocats</h2>
                  <Button onClick={handleAddOutil} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"><Plus className="h-4 w-4 mr-2" /> Ajouter un Outil</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {outils.map((o) => (
                    <Card key={o.id}>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between">
                          <span className="text-xs font-bold text-indigo-400 uppercase">{o.category}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${o.status === 'Actif' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>{o.status}</span>
                        </div>
                        <h3 className="font-bold text-lg text-white">{o.title}</h3>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" size="sm" onClick={() => handleToggleOutilStatus(o.id, o.status)}>Statut</Button>
                          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => handleEditOutil(o)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:bg-slate-800" onClick={() => handleDeleteOutil(o.id)}><Trash2 className="h-4 w-4" /></Button>
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
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Catalogue des Formations</h2>
                    <p className="text-xs text-slate-400">Supervisez et créez des formations enrichies avec documents PDF et visuels d'illustration pour l'ensemble des utilisateurs.</p>
                  </div>
                  <Button onClick={handleAddFormation} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"><Plus className="h-4 w-4 mr-2" /> Créer une formation</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formations.map((f) => {
                    const atts = getFormationAttachments(f);
                    return (
                      <Card key={f.id} className="flex flex-col justify-between">
                        <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-indigo-400 uppercase">{f.category || 'Général'}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.status === 'Publié' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>{f.status}</span>
                            </div>
                            <h3 className="font-bold text-base text-white line-clamp-2">{f.title}</h3>
                            <p className="text-xs text-slate-400">{f.duration} • Niveau: {f.level} {f.author_name ? `• Par ${f.author_name}` : ''}</p>

                            {f.description && (
                              <p className="text-xs text-slate-300 line-clamp-2 italic bg-slate-950 p-2 rounded-xl border border-slate-800">
                                "{f.description}"
                              </p>
                            )}

                            {atts.length > 0 && (
                              <div className="flex items-center justify-between text-xs text-indigo-300 bg-slate-950 border border-indigo-900/60 p-2 rounded-xl">
                                <span className="font-bold flex items-center gap-1">
                                  <span>📑</span> {atts.length} fichier(s) joint(s)
                                </span>
                                <Button variant="ghost" size="sm" className="h-auto p-1 text-indigo-300 hover:text-indigo-100 hover:bg-slate-800" onClick={() => exportAllAttachments(atts)}>
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 border-t border-slate-800 pt-3">
                            <Button variant="outline" className="flex-1 text-xs border-slate-700 text-slate-300 hover:bg-slate-800" size="sm" onClick={() => handleToggleFormationStatus(f.id, f.status)}>Publier / Masquer</Button>
                            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => handleEditFormation(f)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:bg-slate-800" onClick={() => handleDeleteFormation(f.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {formations.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-900 space-y-3">
                      <p className="text-base font-semibold">Aucun module de formation enregistré.</p>
                      <Button onClick={handleAddFormation} size="sm"><Plus className="w-4 h-4 mr-1.5" /> Créer la première formation</Button>
                    </div>
                  )}
                </div>

                {/* Modal de création de formation Admin */}
                <Modal
                  isOpen={createFormationOpen}
                  onClose={() => setCreateFormationOpen(false)}
                  title="Créer une Formation (Mode Administration)"
                >
                  <form onSubmit={handleCreateFormationAdmin} className="space-y-4 text-sm font-sans text-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Titre de la formation *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Formation pratique au Contentieux et à la Rédaction d'Actes"
                        value={newFormation.title}
                        onChange={e => setNewFormation(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full text-xs bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 font-sans p-2.5"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Catégorie</label>
                        <select
                          value={newFormation.category}
                          onChange={e => setNewFormation(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-100 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 font-sans p-2.5"
                        >
                          <option value="Droit des Contrats" className="bg-slate-900 text-slate-100">Droit des Contrats</option>
                          <option value="Droit Social" className="bg-slate-900 text-slate-100">Droit Social / du Travail</option>
                          <option value="Contentieux" className="bg-slate-900 text-slate-100">Contentieux & Procédure</option>
                          <option value="Droit Numérique" className="bg-slate-900 text-slate-100">Droit Numérique & RGPD</option>
                          <option value="Droit Pénal" className="bg-slate-900 text-slate-100">Droit Pénal des Affaires</option>
                          <option value="Propriété Intellectuelle" className="bg-slate-900 text-slate-100">Propriété Intellectuelle</option>
                          <option value="Pratique Juridique" className="bg-slate-900 text-slate-100">Pratique Juridique</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Niveau</label>
                        <select
                          value={newFormation.level}
                          onChange={e => setNewFormation(prev => ({ ...prev, level: e.target.value }))}
                          className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-100 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 font-sans p-2.5"
                        >
                          <option value="Débutant" className="bg-slate-900 text-slate-100">Débutant</option>
                          <option value="Intermédiaire" className="bg-slate-900 text-slate-100">Intermédiaire</option>
                          <option value="Avancé" className="bg-slate-900 text-slate-100">Avancé</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Durée estimée</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 3h 00"
                          value={newFormation.duration}
                          onChange={e => setNewFormation(prev => ({ ...prev, duration: e.target.value }))}
                          className="w-full text-xs bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 font-sans p-2.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Description & Sommaire Pédagogique</label>
                      <textarea
                        rows={3}
                        placeholder="Ex: Présentation des objectifs pédagogiques et du contenu du programme..."
                        value={newFormation.description}
                        onChange={e => setNewFormation(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full text-xs bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 font-sans p-2.5"
                      />
                    </div>

                    {/* Import PDF & Image Attachments */}
                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 text-slate-100">
                      <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                        📑 Importer des Documents PDF et Visuels (Images)
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Sélectionnez les supports PDF et visuels d'illustration rattachés à cette formation.
                      </p>

                      <input
                        type="file"
                        multiple
                        accept=".pdf,image/*"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          const newAtts: FormationAttachment[] = [];
                          for (const file of files) {
                            try {
                              const att = await convertFileToAttachment(file);
                              newAtts.push(att);
                            } catch (err) {
                              console.error("Error reading file:", err);
                            }
                          }
                          setNewFormation(prev => ({
                            ...prev,
                            attachments: [...prev.attachments, ...newAtts]
                          }));
                        }}
                        className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-primary-600 file:text-white hover:file:bg-primary-500 cursor-pointer"
                      />

                      {newFormation.attachments.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <p className="text-[11px] font-bold text-slate-300">Fichiers rattachés ({newFormation.attachments.length}) :</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {newFormation.attachments.map((att, idx) => (
                              <div key={att.id} className="p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 truncate">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${att.type === 'pdf' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                                    {att.type.toUpperCase()}
                                  </span>
                                  <span className="truncate text-slate-200 text-[11px]">{att.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setNewFormation(prev => ({
                                    ...prev,
                                    attachments: prev.attachments.filter((_, i) => i !== idx)
                                  }))}
                                  className="text-slate-400 hover:text-red-400 p-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                      <Button variant="outline" type="button" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setCreateFormationOpen(false)}>
                        Annuler
                      </Button>
                      <Button variant="primary" type="submit" className="flex-1 font-bold bg-indigo-600 hover:bg-indigo-500 text-white">
                        Publier la Formation
                      </Button>
                    </div>
                  </form>
                </Modal>
              </div>
            )}

            {activeTab === 'classrooms' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">Gestion des Visioconférences</h2>
                  <Button onClick={handleAddClassroomByAdmin} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                    <Plus className="h-4 w-4 mr-2" /> Créer une visio (Admin)
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase">
                            <th className="px-6 py-4">Titre</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Avocat</th>
                            <th className="px-6 py-4">Date / Heure</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                          {classrooms.map((room) => (
                            <tr key={room.id} className="hover:bg-slate-800/60 transition-colors">
                              <td className="px-6 py-4 font-semibold text-white">{room.title}</td>
                              <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={room.description}>{room.description}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  room.type === 'direct' ? 'bg-red-950 text-red-300 border border-red-800' :
                                  room.type === 'video' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}>
                                  {room.type === 'direct' ? 'Direct' : room.type === 'video' ? 'Vidéo' : 'Différé'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-300">
                                {room.lawyer ? `Me ${room.lawyer.first_name} ${room.lawyer.last_name}` : 'Avocat / Admin'}
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                {room.scheduled_at ? new Date(room.scheduled_at).toLocaleString('fr-FR') : 'Non planifié'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  room.is_active !== false ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}>
                                  {room.is_active !== false ? 'Actif' : 'Suspendu'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                                    onClick={() => handleToggleClassroomByAdmin(room.id, room.is_active !== false)}
                                    title={room.is_active !== false ? 'Suspendre' : 'Activer'}
                                  >
                                    {room.is_active !== false ? '⏸️ Suspendre' : '✅ Activer'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                    onClick={() => handleEditClassroomByAdmin(room)}
                                    title="Modifier"
                                  >
                                    <Edit className="h-4 w-4 text-secondary-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteClassroomByAdmin(room.id)}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {classrooms.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-8 text-center text-secondary-400 italic">
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

            {activeTab === 'planning' && (
              <div className="space-y-6">
                <AnnualPlanning mode="admin" onAddEventClick={handleAddClassroomByAdmin} />
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <ScientificReviews 
                  mode="admin" 
                  onPublishClick={() => {
                    openModal("Publier une Revue Scientifique (Admin)", [
                      { name: 'title', label: "Titre de la publication" },
                      { name: 'abstract', label: "Résumé académique" },
                      { name: 'discipline', label: "Discipline" },
                      { name: 'region', label: "Région (France / Union Européenne / International)" },
                      { name: 'journal_name', label: "Revue scientifique d'origine" },
                      { name: 'author_name', label: "Nom de l'auteur / Chercheur" },
                      { name: 'content', label: "Texte intégral" },
                    ], async (vals) => {
                      if (!vals.title || !vals.content) return;
                      const { error } = await supabase.from('scientific_reviews_just').insert([{
                        title: vals.title,
                        abstract: vals.abstract || '',
                        discipline: vals.discipline || 'Droit Numérique & IA',
                        region: vals.region || 'France',
                        journal_name: vals.journal_name || 'Journal Officiel des Sciences Juridiques',
                        author_name: vals.author_name || 'Administration France Justice',
                        content: vals.content,
                        published_year: new Date().getFullYear(),
                        is_verified: true,
                        is_auto_scraped: false
                      }]);
                      if (error) toastError("Erreur", error.message);
                      else success("Revue Publiée", "La publication scientifique a été ajoutée avec succès par l'administrateur.");
                    });
                  }} 
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in text-slate-100">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
                    <div>
                      <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {getSecurityStatusBadge().label}
                      </span>
                      <h2 className="text-2xl font-black text-white mt-2">Console d'Administration Sécurité, RGPD & Database</h2>
                      <p className="text-slate-400 text-xs mt-1">Contrôle central des règles RLS, protocoles d'isolation et politique de purge/conservation.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href="/legal#legal" target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all">
                        ⚖️ Mentions Légales
                      </a>
                      <a href="/legal#privacy" target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all">
                        🔒 Confidentialité
                      </a>
                      <a href="/legal#cgv" target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all">
                        📜 CGV / CGU
                      </a>
                    </div>
                  </div>

                  {/* Security Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-indigo-400" /> Infrastructure PostgreSQL & Auth
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-1.5">
                        <li>• <strong>Chiffrement Transit :</strong> {DATABASE_SECURITY_INFO.encryptionTransit}</li>
                        <li>• <strong>Chiffrement Repos :</strong> {DATABASE_SECURITY_INFO.encryptionRest}</li>
                        <li>• <strong>Isolation RLS :</strong> {DATABASE_SECURITY_INFO.accessControl}</li>
                        <li>• <strong>Auth JWT éphémère :</strong> {DATABASE_SECURITY_INFO.authStandard}</li>
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-400" /> Conformité Financière & Synchro Realtime
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-1.5">
                        <li>• <strong>Supervision :</strong> {DATABASE_SECURITY_INFO.complianceStandard}</li>
                        <li>• <strong>Moteur Realtime :</strong> {DATABASE_SECURITY_INFO.realtimeSync}</li>
                        <li>• <strong>Encaissements Stripe :</strong> Tokenized PCI-DSS Level 1</li>
                        <li>• <strong>Sauvegardes BD :</strong> {DATABASE_SECURITY_INFO.backupFrequency}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Data Retention Schedule Table */}
                  <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
                    📅 Schedule de Conservation & Purge Réglementaire des Données
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-800/80 text-slate-200 uppercase font-bold text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Type de Donnée</th>
                          <th className="px-4 py-3">Durée de Conservation</th>
                          <th className="px-4 py-3">Base Légale</th>
                          <th className="px-4 py-3">Action à l'Échéance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {DATA_RETENTION_SCHEDULE.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900/60">
                            <td className="px-4 py-3 font-bold text-white">{item.dataType}</td>
                            <td className="px-4 py-3 text-amber-300 font-semibold">{item.retentionPeriod}</td>
                            <td className="px-4 py-3 text-slate-400">{item.legalBasis}</td>
                            <td className="px-4 py-3 text-emerald-400 font-semibold">{item.actionAfterExpiry}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Password Reset Requests Audit Table */}
                  <div className="pt-6 mt-6 border-t border-slate-800">
                    <h3 className="text-sm font-extrabold text-white mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">🔑 Journal Audit & Demandes de Réinitialisation de Mots de Passe</span>
                      <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                        {passwordResets.length} demande(s)
                      </span>
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead className="bg-slate-800/80 text-slate-200 uppercase font-bold text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="px-4 py-3">Email Utilisateur</th>
                            <th className="px-4 py-3">Rôle</th>
                            <th className="px-4 py-3">Date de Demande</th>
                            <th className="px-4 py-3">Statut</th>
                            <th className="px-4 py-3 text-right">Actions Admin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {passwordResets.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-6 text-center text-slate-500 italic">
                                Aucune demande de réinitialisation de mot de passe récente.
                              </td>
                            </tr>
                          ) : (
                            passwordResets.map((pr) => (
                              <tr key={pr.id || pr.email} className="hover:bg-slate-900/60 transition-colors">
                                <td className="px-4 py-3 font-bold text-white">{pr.email}</td>
                                <td className="px-4 py-3 font-semibold text-indigo-400 capitalize">{pr.user_role || 'user'}</td>
                                <td className="px-4 py-3 text-slate-400">
                                  {pr.requested_at ? new Date(pr.requested_at).toLocaleString('fr-FR') : 'Récemment'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    pr.status === 'admin_triggered'
                                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                      : pr.status === 'completed'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}>
                                    {pr.status === 'admin_triggered' ? 'Lancé par Admin' : pr.status === 'completed' ? 'Modifié' : 'En attente'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title={pr.user_role === 'admin' ? "Interdit pour l'Admin" : "Renvoyer le lien de réinitialisation"}
                                    disabled={pr.user_role === 'admin'}
                                    onClick={() => handleAdminTriggerPasswordReset(pr.email, pr.user_role)}
                                    className={pr.user_role === 'admin' ? "text-slate-600 opacity-50 cursor-not-allowed" : "text-primary-400 hover:bg-slate-800"}
                                  >
                                    🔑 Renvoyer Lien
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePasswordResetLog(pr.id)}
                                    className="text-red-400 hover:bg-slate-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Modal d'action / confirmation / modification / suppression */}
      <Modal isOpen={modalConfig.isOpen} onClose={closeModal} title={modalConfig.title}>
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
                <label className="block text-xs font-bold text-slate-300 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select name={f.name} defaultValue={f.defaultValue} required className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none">
                    {f.options?.map((opt: any) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <Input name={f.name} type={f.type || 'text'} defaultValue={f.defaultValue} required className="w-full bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" />
                )}
              </div>
            ))}
            {modalConfig.fields.length === 0 && (
              <div className="p-5 bg-slate-950 border border-slate-800/90 rounded-2xl text-slate-200 text-sm space-y-2 flex items-start gap-3.5 shadow-inner">
                <div className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", modalConfig.isDanger ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20")}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-extrabold text-white text-base">Confirmation Requise</p>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">Êtes-vous sûr de vouloir exécuter cette opération ? Elle sera immédiatement répercutée en base de données.</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={closeModal} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl">Annuler</Button>
            <Button type="submit" variant={modalConfig.isDanger ? 'danger' : 'primary'} className={cn("font-extrabold rounded-xl px-5 shadow-lg", modalConfig.isDanger ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/30" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30")}>
              {modalConfig.confirmText || 'Valider'}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default AdminDashboard;
