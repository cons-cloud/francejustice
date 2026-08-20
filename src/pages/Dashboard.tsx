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
  Users,
  Eye,
  MapPin, 
  Video, 
  Clock,
  Menu,
  X
} from 'lucide-react';
import LawCodes from '../components/features/LawCodes';
import ProcedureLibrary from '../components/features/ProcedureLibrary';
import CodeAnalysis from '../components/features/CodeAnalysis';
import { FranceMap, regions } from '../components/features/FranceMap';
import { COURS_D_APPEL_LIST, getCourDAppelForCity } from '../lib/jurisdictions';
import { AdvancedAreaChart } from '../components/features/StatsCharts';
import { exportToJSON } from '../lib/exportUtils';
import {
  exportAttachmentFile,
  exportAllAttachments,
  getFormationAttachments,
  convertFileToAttachment,
  type FormationAttachment
} from '../lib/formationAttachmentUtils';
import { createCheckoutSession } from '../lib/api';
import { filterActiveSessions } from '../lib/classroomUtils';
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
import { VoiceAssistant } from '../components/ui/VoiceAssistant';
import { Sparkles } from 'lucide-react';
import AssistantPage from './Assistant';
import NotificationBell from '../components/ui/NotificationBell';
import LiveSyncBadge from '../components/ui/LiveSyncBadge';
import { useTranslation } from '../i18n';

const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { toasts, success, error: toastError, removeToast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [formations, setFormations] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<string[]>([]);
  const [classroomsSubTab, setClassroomsSubTab] = useState<'static' | 'virtual'>('virtual');
  
  const [createFormationOpen, setCreateFormationOpen] = useState(false);
  const [newFormation, setNewFormation] = useState({
    title: '',
    category: 'Droit des Contrats',
    level: 'Débutant',
    duration: '2h 00',
    description: '',
    attachments: [] as FormationAttachment[]
  });

  const handleCreateFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormation.title.trim()) {
      toastError('Erreur', 'Le titre de la formation est obligatoire.');
      return;
    }
    try {
      const authorRole = profile?.role === 'professor' ? 'Professeur' : profile?.role === 'doctorate' ? 'Doctorant' : profile?.role === 'admin' ? 'Administrateur' : 'Avocat';
      const authorName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Expert France Justice';
      const pdfUrlData = newFormation.attachments.length > 0 ? JSON.stringify(newFormation.attachments) : null;

      const { error } = await supabase.from('formations_just').insert([{
        title: newFormation.title,
        category: newFormation.category,
        level: newFormation.level,
        duration: newFormation.duration,
        description: newFormation.description,
        pdf_url: pdfUrlData,
        author_id: user?.id,
        author_name: authorName,
        author_role: authorRole,
        status: 'Publié'
      }]);

      if (error) throw error;
      success('Formation créée 🎓', 'La nouvelle formation a été publiée avec succès !');
      setCreateFormationOpen(false);
      setNewFormation({
        title: '',
        category: 'Droit des Contrats',
        level: 'Débutant',
        duration: '2h 00',
        description: '',
        attachments: []
      });
      await fetchFormations();
    } catch (err: any) {
      console.error("Error creating formation:", err);
      toastError('Erreur', err.message || "Erreur lors de la création de la formation");
    }
  };
  


  const [availableLawyers, setAvailableLawyers] = useState<any[]>([]);
  const [lawyerSearch, setLawyerSearch] = useState('');

  const [selectedFormation, setSelectedFormation] = useState<{ id: string; title: string; category: string; duration: string; level: string } | null>(null);
  const [formationViewMode, setFormationViewMode] = useState<'start' | 'preview'>('preview');
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [chaptersRead, setChaptersRead] = useState<Record<number, boolean>>({});
  const [completedFormations, setCompletedFormations] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('completedFormations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Curriculums dynamiques pour les formations
  const getFormationCurriculum = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('contrat')) {
      return [
        {
          title: "1. Définition et formation du contrat",
          content: "Un contrat est un accord de volontés entre deux ou plusieurs personnes destiné à créer, modifier, transmettre ou éteindre des obligations. Pour être valide, il exige le consentement des parties, leur capacité de contracter, et un contenu licite et certain. L'offre et l'acceptation constituent la rencontre des volontés indispensable au contrat."
        },
        {
          title: "2. Les clauses contractuelles clés",
          content: "La rédaction des clauses nécessite une précision chirurgicale. Les clauses limitatives de responsabilité encadrent l'indemnisation en cas de manquement. La clause pénale fixe forfaitairement le montant des dommages-intérêts. La clause de force majeure suspend ou met fin au contrat en cas d'événement imprévisible et irrésistible."
        },
        {
          title: "3. Inexécution et résolution",
          content: "En cas d'inexécution des obligations contractuelles par l'une des parties, le créancier dispose de plusieurs recours : refuser d'exécuter sa propre obligation (exception d'inexécution), poursuivre l'exécution forcée, solliciter une réduction du prix, ou provoquer la résolution/résiliation du contrat assortie de dommages-intérêts."
        }
      ];
    } else if (t.includes('contentieux') || t.includes('litige')) {
      return [
        {
          title: "1. Phase précontentieuse et mise en demeure",
          content: "Avant toute action judiciaire, la tentative de résolution amiable est souvent requise. La lettre de mise en demeure formalise la réclamation et fait courir les intérêts moratoires. Elle fixe un dernier délai de conformité et constitue le préalable obligatoire à de nombreuses actions en justice."
        },
        {
          title: "2. Stratégies de procédure et saisine",
          content: "Choisir la bonne juridiction (Tribunal de Commerce, Tribunal Judiciaire, Conseil de Prud'hommes) est primordial. L'assignation doit être rédigée rigoureusement et signifiée par commissaire de justice. La gestion du calendrier de procédure et la communication des pièces respectent le principe du contradictoire."
        },
        {
          title: "3. L'audience et la plaidoirie",
          content: "La préparation du dossier de plaidoirie combine une synthèse des faits et des arguments de droit. Lors de l'audience, l'avocat doit structurer sa plaidoirie de manière percutante, répondre aux arguments de la partie adverse, et convaincre le juge par une démonstration juridique claire et concise."
        }
      ];
    } else if (t.includes('travail') || t.includes('social')) {
      return [
        {
          title: "1. Le contrat de travail et ses clauses",
          content: "Le contrat de travail (CDI, CDD) formalise la relation de subordination, les fonctions, la rémunération et le temps de travail. Il peut contenir des clauses sensibles comme la clause de non-concurrence (qui doit être limitée dans le temps/l'espace et comporter une contrepartie financière) ou la clause de mobilité."
        },
        {
          title: "2. Les procédures de rupture",
          content: "La rupture du contrat à l'initiative de l'employeur (licenciement pour motif personnel ou économique) est strictement encadrée : entretien préalable, notification écrite motivée, respect du préavis. La rupture conventionnelle homologuée offre une alternative consensuelle sécurisée."
        },
        {
          title: "3. Le contentieux prud'homal",
          content: "Le Conseil de Prud'hommes règle les litiges individuels du travail. La procédure comporte deux phases : l'audience de conciliation et d'orientation (ACO) cherchant un accord amiable, et en cas d'échec, l'audience de jugement (AJ). La charge de la preuve est partagée selon les motifs invoqués."
        }
      ];
    } else if (t.includes('rgpd') || t.includes('données') || t.includes('numérique')) {
      return [
        {
          title: "1. Les principes fondamentaux du RGPD",
          content: "Le Règlement Général sur la Protection des Données régit le traitement des données personnelles dans l'UE. Les principes clés sont la licéité, la loyauté, la transparence, la limitation des finalités, la minimisation des données, et l'obligation d'obtenir un consentement libre, spécifique, éclairé et univoque."
        },
        {
          title: "2. Obligations du responsable de traitement",
          content: "Les organisations doivent tenir un registre des activités de traitement, nommer un DPO (Délégué à la Protection des Données) dans certains cas, effectuer des Analyses d'Impact sur la Protection des Données (AIPD) pour les traitements à risque, et notifier toute violation de données à la CNIL sous 72 heures."
        },
        {
          title: "3. Droits des personnes concernées",
          content: "Le RGPD confère aux citoyens des droits étendus sur leurs données : droit d'accès, de rectification, d'effacement (droit à l'oubli), de limitation du traitement, de portabilité des données, et d'opposition. L'avocat doit guider les clients pour répondre efficacement à ces demandes d'exercice de droits."
        }
      ];
    } else {
      return [
        {
          title: "1. Analyse et recherche doctrinale",
          content: "Chaque dossier juridique commence par une qualification rigoureuse des faits. L'avocat doit rechercher les textes législatifs applicables, analyser la jurisprudence récente (arrêts de la Cour de cassation ou du Conseil d'État), et consulter la doctrine pertinente pour fonder son argumentation."
        },
        {
          title: "2. Rédaction d'actes et de mémoires",
          content: "La clarté, la rigueur logique et la précision terminologique sont les piliers de la rédaction juridique. Qu'il s'agisse de conclusions, de contrats ou de statuts de société, la structure doit être limpide, éliminant toute ambiguïté qui pourrait nuire aux intérêts du client ou engendrer un litige futur."
        },
        {
          title: "3. Déontologie et éthique professionnelle",
          content: "L'avocat exerce ses fonctions avec dignité, conscience, indépendance, probité et humanité, conformément à son serment. Le respect du secret professionnel est absolu et d'ordre public. La gestion des conflits d'intérêts et le maniement des fonds via la CARPA font l'objet d'une vigilance constante."
        }
      ];
    }
  };

  // Geographical filtering states
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBarreau, setSelectedBarreau] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', phone: '', city: '', postal_code: '', birth_date: ''
  });
  // Law Just - Added states for Appointments & Document classification/upload
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedLawyerForRDV, setSelectedLawyerForRDV] = useState<string>('');
  const [rdvDate, setRdvDate] = useState<string>('');
  const [rdvTime, setRdvTime] = useState<string>('');
  const [rdvNotes, setRdvNotes] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [uploadDocName, setUploadDocName] = useState<string>('');
  const [uploadDocType, setUploadDocType] = useState<string>('client_document');
  const [isUploading, setIsUploading] = useState(false);
  const [docFilterType, setDocFilterType] = useState<string>('all');
  const [selectedIADoc, setSelectedIADoc] = useState<any>(null);

  const handleVoiceAction = (action: { type: string; payload: any }) => {
    if (action.type === 'SWITCH_TAB') {
      setActiveTab(action.payload.tab);
    } else if (action.type === 'SEARCH_LAWYER') {
      setActiveTab('avocats');
      setLawyerSearch(action.payload.query || '');
    } else if (action.type === 'PREFILL_APPOINTMENT') {
      setActiveTab('appointments');
      if (action.payload.lawyer_id) {
        setSelectedLawyerForRDV(action.payload.lawyer_id);
      }
      if (action.payload.date) {
        setRdvDate(action.payload.date);
      }
      if (action.payload.time) {
        setRdvTime(action.payload.time);
      }
      if (action.payload.notes) {
        setRdvNotes(action.payload.notes);
      }
    } else if (action.type === 'CREATE_DOCUMENT') {
      if (user && action.payload.title && action.payload.content) {
        supabase
          .from('documents_just')
          .insert([{
            name: action.payload.title,
            type: 'client_document',
            owner_id: user.id,
            created_at: new Date().toISOString(),
            metadata: { 
              content: action.payload.content, 
              source: 'IA Vocale',
              type: 'ai_generated'
            }
          }])
          .then(({ error }) => {
            if (error) {
              console.error('Error saving AI generated document:', error);
            } else {
              success('Document généré par l\'IA 📄', `Le document "${action.payload.title}" a été enregistré dans votre coffre-fort.`);
              fetchDocuments();
            }
          });
      }
    }
  };

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents_just', filter: `owner_id=eq.${user.id}` }, () => fetchDocuments())
        .subscribe();
        
      const searchSub = supabase
        .channel('user-search')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'search_history_just', filter: `user_id=eq.${user.id}` }, () => fetchSearches())
        .subscribe();
        
      const formSub = supabase
        .channel('user-formations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'formations_just' }, () => fetchFormations())
        .subscribe();
      const quotesSub = supabase
        .channel('user-quotes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes_just', filter: `client_id=eq.${user.id}` }, () => fetchQuotes())
        .subscribe();
        
      const chatSub = supabase
        .channel('user-chats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms_just', filter: `client_id=eq.${user.id}` }, () => fetchChatRooms())
        .subscribe();
        
      const lawyersSub = supabase
        .channel('citizen-lawyers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles_just' }, fetchLawyers)
        .subscribe();

      const apptSub = supabase
        .channel('user-appts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments_just', filter: `client_id=eq.${user.id}` }, () => fetchAppointments())
        .subscribe();

      const classroomsSub = supabase
        .channel('user-classrooms')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classrooms_just' }, () => fetchClassrooms())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_registrations_just' }, () => fetchClassrooms())
        .subscribe();

      return () => {
        supabase.removeChannel(docsSub);
        supabase.removeChannel(searchSub);
        supabase.removeChannel(formSub);
        supabase.removeChannel(quotesSub);
        supabase.removeChannel(chatSub);
        supabase.removeChannel(lawyersSub);
        supabase.removeChannel(apptSub);
        supabase.removeChannel(classroomsSub);
      };
    }
  }, [user]);

  // UX Shortcut: Preselect lawyer from URL query params (for public directory redirect)
  useEffect(() => {
    if (availableLawyers.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const bookLawyerId = params.get('bookLawyerId');
      if (bookLawyerId) {
        setSelectedLawyerForRDV(bookLawyerId);
        setActiveTab('appointments');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [availableLawyers]);

  // Feedback visuel après retour de Stripe Checkout & Sélection dynamique d'onglet
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const tab = params.get('tab');

    if (tab) {
      setActiveTab(tab);
    }

    if (payment === 'success') {
      // Le webhook Stripe (Django) a déjà mis à jour quotes_just.status
      // On se contente d'afficher le toast et de rafraîchir
      success('Paiement confirmé 🎉', 'Votre paiement a été validé. Votre avocat en a été notifié en temps réel.');
      fetchQuotes();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === 'cancel') {
      toastError('Paiement annulé', 'La transaction Stripe a été annulée. Vous pouvez réessayer.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDocuments().catch(err => console.error("Error fetching documents:", err)),
        fetchSearches().catch(err => console.error("Error fetching searches:", err)),
        fetchFormations().catch(err => console.error("Error fetching formations:", err)),
        fetchQuotes().catch(err => console.error("Error fetching quotes:", err)),
        fetchChatRooms().catch(err => console.error("Error fetching chat rooms:", err)),
        fetchLawyers().catch(err => console.error("Error fetching lawyers:", err)),
        fetchAppointments().catch(err => console.error("Error fetching appointments:", err)),
        fetchClassrooms().catch(err => console.error("Error fetching classrooms:", err))
      ]);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const { data: rooms, error: roomsErr } = await supabase
        .from('classrooms_just')
        .select('*, registrations:classroom_registrations_just(count)')
        .order('created_at', { ascending: false });
      
      if (roomsErr) throw roomsErr;

      if (rooms && rooms.length > 0) {
        const lawyerIds = [...new Set(rooms.map(r => r.lawyer_id))];
        const { data: profiles } = await supabase
          .from('profiles_just')
          .select('id, first_name, last_name')
          .in('id', lawyerIds);

        const profileMap: Record<string, any> = {};
        profiles?.forEach(p => { profileMap[p.id] = p; });

        const enriched = rooms.map(r => ({
          ...r,
          lawyer_first_name: profileMap[r.lawyer_id]?.first_name || '',
          lawyer_last_name: profileMap[r.lawyer_id]?.last_name || '',
          registered_count: r.registrations?.[0]?.count || 0
        }));
        setClassrooms(filterActiveSessions(enriched));
      } else {
        setClassrooms([]);
      }

      if (user) {
        const { data: regs } = await supabase
          .from('classroom_registrations_just')
          .select('classroom_id')
          .eq('user_id', user.id);
        if (regs) setRegistrations(regs.map(r => r.classroom_id));
      }
    } catch (e) {
      console.error("Error fetching classrooms:", e);
    }
  };

  const handleRegisterClassroom = async (classroom: any) => {
    if (!user) return;
    try {
      const isRegistered = registrations.includes(classroom.id);
      if (isRegistered) {
        await supabase
          .from('classroom_registrations_just')
          .delete()
          .eq('classroom_id', classroom.id)
          .eq('user_id', user.id);
        setRegistrations(prev => prev.filter(id => id !== classroom.id));
      } else {
        await supabase
          .from('classroom_registrations_just')
          .insert([{ classroom_id: classroom.id, user_id: user.id }]);
        setRegistrations(prev => [...prev, classroom.id]);
      }
    } catch (e) {
      console.error("Error toggling classroom registration:", e);
    }
  };

  const startClassroomSimulator = (classroom: any) => {
    window.location.href = `/classrooms?join=${classroom.id}`;
  };




  const fetchDocuments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('documents_just')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const fetchFormations = async () => {
    const { data } = await supabase
      .from('formations_just')
      .select('*')
      .eq('status', 'Publié')
      .order('created_at', { ascending: false });
    if (data) setFormations(data);
  };

  const fetchSearches = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('search_history_just')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setSearches(data);
  };

  const fetchQuotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('quotes_just')
      .select('*, profiles:lawyer_id(first_name, last_name, email)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setQuotes(data);
  };

  const fetchChatRooms = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_rooms_just')
      .select('*, profiles:lawyer_id(first_name, last_name, email)')
      .eq('client_id', user.id);
    if (data) setChatRooms(data);
  };

  const fetchLawyers = async () => {
    const { data } = await supabase
      .from('profiles_just')
      .select('*, lawyers:lawyers_just(bar_association)')
      .in('role', ['lawyer', 'professor', 'doctorate'])
      .eq('is_verified', true)
      .order('first_name');
    if (data) setAvailableLawyers(data);
  };

  // Helper to resolve region from postal code
  const getRegionFromPostalCode = (postalCode?: string) => {
    if (!postalCode) return null;
    const dept = postalCode.trim().substring(0, 2);
    const region = regions.find(r => r.departments.includes(dept));
    return region ? region.name : null;
  };

  const availableCities = React.useMemo(() => {
    return Array.from(new Set(availableLawyers.map(l => l.city).filter(Boolean).map(c => c!.trim()))).sort() as string[];
  }, [availableLawyers]);

  const availableBarreaux = React.useMemo(() => {
    return Array.from(
      new Set(
        availableLawyers
          .map(l => {
            const bar = Array.isArray(l.lawyers) 
              ? l.lawyers[0]?.bar_association 
              : l.lawyers?.bar_association;
            return bar?.trim();
          })
          .filter(Boolean)
      )
    ).sort() as string[];
  }, [availableLawyers]);

  const lawyerCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    regions.forEach(r => {
      counts[r.name] = 0;
    });
    
    availableLawyers.forEach(l => {
      const regionName = getRegionFromPostalCode(l.postal_code);
      if (regionName) {
        counts[regionName] = (counts[regionName] || 0) + 1;
      }
    });
    return counts;
  }, [availableLawyers]);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('appointments_just')
      .select('*, profiles:lawyer_id(first_name, last_name, email)')
      .eq('client_id', user.id)
      .order('scheduled_at', { ascending: true });
    if (data) setAppointments(data);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedLawyerForRDV || !rdvDate || !rdvTime) return;
    
    setIsBooking(true);
    const scheduledAt = new Date(`${rdvDate}T${rdvTime}`).toISOString();
    
    const { error: err } = await supabase
      .from('appointments_just')
      .insert([{
        client_id: user.id,
        lawyer_id: selectedLawyerForRDV,
        scheduled_at: scheduledAt,
        duration_minutes: 30,
        status: 'pending',
        notes: rdvNotes
      }]);
      
    setIsBooking(false);
    if (err) {
      toastError('Erreur', "Impossible de réserver le rendez-vous. Veuillez réessayer.");
    } else {
      success('Rendez-vous réservé ! 📅', "Votre demande a été envoyée à l'avocat et est en attente de confirmation.");
      setRdvDate('');
      setRdvTime('');
      setRdvNotes('');
      fetchAppointments();
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    const { error: err } = await supabase
      .from('appointments_just')
      .update({ status: 'cancelled' })
      .eq('id', apptId);
      
    if (err) {
      toastError('Erreur', "Impossible d'annuler le rendez-vous.");
    } else {
      success('Rendez-vous annulé ❌', "Le rendez-vous a bien été annulé.");
      fetchAppointments();
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadDocName) return;
    
    setIsUploading(true);
    const mockFileUrl = `https://zchhijltemvrsthdaxex.supabase.co/storage/v1/object/public/documents/${user.id}/${Date.now()}_${uploadDocName.replace(/\s+/g, '_')}.pdf`;
    
    const { error: err } = await supabase
      .from('documents_just')
      .insert([{
        name: uploadDocName,
        type: uploadDocType,
        file_url: mockFileUrl,
        owner_id: user.id,
        created_at: new Date().toISOString(),
        metadata: { source: 'Manuel' }
      }]);
      
    setIsUploading(false);
    if (err) {
      toastError('Erreur', "Impossible de téléverser le document.");
    } else {
      success('Document ajouté 📁', "Votre document a bien été enregistré dans votre coffre-fort.");
      setUploadDocName('');
      fetchDocuments();
    }
  };

  const contactLawyer = async (lawyerId: string, lawyerName: string) => {
    if (!user) return;
    // Create or get existing chat room
    let { data: existingRoom } = await supabase
      .from('chat_rooms_just')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .eq('client_id', user.id)
      .maybeSingle();
    if (!existingRoom) {
      const { data: newRoom } = await supabase
        .from('chat_rooms_just')
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

Ce document est généré par la plateforme France Justice.
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
    const { error: saveErr } = await supabase.from('profiles_just').update({
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

  const [payingQuoteId, setPayingQuoteId] = React.useState<string | null>(null);
  const [selectedPaymentQuote, setSelectedPaymentQuote] = React.useState<any | null>(null);

  const handlePayQuote = async (quote: any) => {
    setPayingQuoteId(quote.id);
    try {
      const url = await createCheckoutSession(quote.id, 'quote_payment', quote.amount);
      window.location.href = url;
    } catch (err: any) {
      console.warn('Stripe backend unavailable, launching Stripe Payment Modal directly:', err);
      setSelectedPaymentQuote(quote);
    } finally {
      setPayingQuoteId(null);
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

  // Dynamically compute weekly activity from real documents data
  const caseActivityData = React.useMemo(() => {
    const now = new Date();
    const weeks: { name: string; value: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (w + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - w * 7);
      const count = documents.filter(d => {
        const created = new Date(d.created_at);
        return created >= weekStart && created < weekEnd;
      }).length + searches.filter(s => {
        const created = new Date(s.created_at);
        return created >= weekStart && created < weekEnd;
      }).length;
      weeks.push({ name: `Sem ${4 - w}`, value: count });
    }
    return weeks;
  }, [documents, searches]);

  // URL tab selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  const tabs = [
    { id: 'overview', name: t('dashboard.overview', "Vue d'ensemble"), icon: BarChart3 },
    { id: 'appointments', name: t('dashboard.appointments', 'Rendez-vous'), icon: Calendar },
    { id: 'assistant', name: t('nav.genia', 'Assistant IA'), icon: Sparkles },
    { id: 'generator', name: t('dashboard.generator_tab', 'Générateur IA'), icon: Shield },
    { id: 'documents', name: t('dashboard.my_documents', 'Mes documents'), icon: FileText },
    { id: 'quotes', name: t('dashboard.my_quotes', 'Mes Devis'), icon: Receipt },
    { id: 'chat', name: t('dashboard.chat_tab', 'Discussion Avocat'), icon: MessageSquare },
    { id: 'searches', name: t('dashboard.ia_search', 'IA Juridique'), icon: Search },
    { id: 'codes', name: t('dashboard.law_codes', 'Codes de Loi'), icon: BookOpen },
    { id: 'procedures', name: t('dashboard.procedures', 'Procédures'), icon: FileText },
    { id: 'analyse', name: t('dashboard.ai_analysis', 'Analyse IA'), icon: Shield },
    { id: 'formations', name: t('dashboard.formations', 'Formations'), icon: BookOpen },
    { id: 'planning', name: 'Planning Annuel', icon: Calendar },
    { id: 'reviews', name: 'Revues Scientifiques', icon: BookOpen },
    { id: 'avocats', name: t('dashboard.lawyers_directory', 'Annuaire Avocats'), icon: Users },
    { id: 'profile', name: t('dashboard.profile', 'Profil'), icon: User },
  ];

  const stats = [
    { label: t('dashboard.my_documents', 'Documents'), value: documents.length.toString(), icon: FileText, color: 'text-primary-600' },
    { label: t('dashboard.my_quotes', 'Devis'), value: quotes.length.toString(), icon: Receipt, color: 'text-success-600' },
    { label: t('dashboard.appointments', 'Rendez-vous'), value: appointments.length.toString(), icon: Calendar, color: 'text-warning-600' },
    { label: t('dashboard.messages', 'Discussions'), value: chatRooms.length.toString(), icon: MessageSquare, color: 'text-accent-600' },
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
              <span>{t('dashboard.weekly_activity', 'Activité Hebdomadaire')}</span>
              <TrendingUp className="h-4 w-4 text-primary-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedAreaChart data={caseActivityData} height={250} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quick_actions', 'Actions Rapides')}</CardTitle>
            <CardDescription>
              {t('dashboard.manage_data', 'Gérer vos données personnelles')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full h-16 justify-start px-6 gap-3" onClick={handleDownloadPersonalData}>
              <Download className="h-5 w-5 text-primary-600" />
              <div className="text-left">
                <p className="font-bold">{t('dashboard.my_data', 'Mes Données')}</p>
                <p className="text-xs text-secondary-500">{t('dashboard.download_json', 'Télécharger tout (JSON)')}</p>
              </div>
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" className="h-20 flex-col space-y-1 text-xs" onClick={() => setActiveTab('generator')}>
                <Plus className="h-5 w-5 mb-1" />
                <span>{t('dashboard.generate', 'Générer')}</span>
              </Button>
              <Button variant="ghost" className="h-20 flex-col space-y-1 text-xs" onClick={() => setActiveTab('searches')}>
                <Search className="h-5 w-5 mb-1" />
                <span>{t('common.search', 'Recherche')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quick_actions', 'Actions rapides')}</CardTitle>
          <CardDescription>
            {t('dashboard.access_tools', 'Accédez à vos outils juridiques favoris')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('generator')}>
              <Plus className="h-6 w-6" />
              <span>{t('dashboard.generate_doc', 'Générer un Document')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('searches')}>
              <Search className="h-6 w-6" />
              <span>{t('dashboard.ia_search', 'Recherche IA')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('chat')}>
              <MessageSquare className="h-6 w-6" />
              <span>{t('dashboard.chat_tab', 'Discussion Avocat')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDocuments = () => {
    const filteredDocs = documents.filter(doc => docFilterType === 'all' || doc.type === docFilterType);

    const docTypeLabels: Record<string, string> = {
      identity: "🪪 Pièce d'identité",
      license: "📜 Licence / Diplôme",
      legal_template: "📝 Modèle de document",
      client_document: "📁 Pièce de dossier / Justificatif"
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.digital_safe', 'Coffre-fort Numérique (Mes Documents)')}</h2>
            <p className="text-sm text-secondary-500 mt-1">{t('dashboard.safe_desc', 'Espace sécurisé de stockage de vos pièces justificatives et documents légaux.')}</p>
          </div>
          <Button onClick={() => setActiveTab('generator')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard.new_ia_doc', 'Nouveau document IA')}
          </Button>
        </div>

        {/* Upload form */}
        <Card className="bg-primary-50/10 border border-primary-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-primary-900">{t('dashboard.add_to_safe', 'Ajouter un document au coffre-fort')}</CardTitle>
            <CardDescription>{t('dashboard.safe_security', 'Vos documents sont protégés par chiffrement et la sécurité au niveau des lignes (RLS).')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadDocument} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-secondary-600 mb-1">{t('dashboard.doc_name', 'Nom du document')}</label>
                <Input 
                  value={uploadDocName} 
                  onChange={e => setUploadDocName(e.target.value)} 
                  placeholder={t('dashboard.doc_name_placeholder', 'Ex: CNI Recto Verso, Contrat de Bail...')} 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-600 mb-1">{t('dashboard.doc_type', 'Classification / Type')}</label>
                <select 
                  className="w-full flex h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  value={uploadDocType} 
                  onChange={e => setUploadDocType(e.target.value)}
                >
                  <option value="identity">{t('dashboard.doc_identity', "🪪 Pièce d'identité")}</option>
                  <option value="license">{t('dashboard.doc_license', '📜 Licence / Diplôme')}</option>
                  <option value="legal_template">{t('dashboard.doc_template', '📝 Modèle de document')}</option>
                  <option value="client_document">{t('dashboard.doc_client', '📁 Pièce de dossier / Justificatif')}</option>
                </select>
              </div>
              <Button type="submit" disabled={isUploading} className="w-full">
                {isUploading ? t('common.loading', 'Enregistrement...') : t('dashboard.save_to_safe', 'Enregistrer dans le coffre-fort')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Classification Filters */}
        <div className="flex flex-wrap gap-2 pb-2">
          {['all', 'identity', 'license', 'legal_template', 'client_document'].map(type => (
            <button
              key={type}
              onClick={() => setDocFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                docFilterType === type 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {type === 'all' ? 'Tous les documents' : (docTypeLabels[type] || type)}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-secondary-900">{doc.name}</h3>
                      <p className="text-xs text-secondary-500 mt-1">
                        <span className="bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded font-medium">
                          {docTypeLabels[doc.type] || doc.type}
                        </span>
                        <span className="mx-2">•</span>
                        Créé le {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.file_url ? (
                      <a href={doc.file_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger / Visualiser
                        </Button>
                      </a>
                    ) : doc.metadata?.content ? (
                      <Button variant="outline" size="sm" onClick={() => setSelectedIADoc(doc)}>
                        <Eye className="h-4.5 w-4.5 mr-2 text-primary-600" />
                        Visualiser / Télécharger
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredDocs.length === 0 && (
            <div className="text-center py-12 bg-slate-900 text-slate-100 rounded-2xl border border-dashed border-slate-800">
              <FileText className="h-10 w-10 mx-auto mb-2 text-secondary-200" />
              Aucun document dans cette catégorie.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAppointments = () => {
    const statusLabels: Record<string, { text: string; color: string }> = {
      pending: { text: t('dashboard.status_pending', 'En attente'), color: "bg-yellow-100 text-yellow-700" },
      confirmed: { text: t('dashboard.status_confirmed', 'Confirmé'), color: "bg-green-100 text-green-700" },
      cancelled: { text: t('dashboard.status_cancelled', 'Annulé'), color: "bg-red-100 text-red-700" },
      completed: { text: t('dashboard.status_completed', 'Terminé'), color: "bg-primary-100 text-primary-700" }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.my_appointments', 'Mes Rendez-vous')}</h2>
            <p className="text-sm text-secondary-500 mt-1">{t('dashboard.appointments_desc', 'Planifiez des téléconsultations et suivez vos échanges avec les avocats de la plateforme.')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reservation Form */}
          <Card className="lg:col-span-1 border border-secondary-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('dashboard.book_consultation', 'Réserver une consultation')}</CardTitle>
              <CardDescription>{t('dashboard.book_desc', "Choisissez un avocat vérifié et planifiez votre créneau d'assistance.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">{t('dashboard.available_lawyer', 'Avocat disponible')}</label>
                  <select
                    className="w-full flex h-10 rounded-md border border-slate-800 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedLawyerForRDV}
                    onChange={e => setSelectedLawyerForRDV(e.target.value)}
                    required
                  >
                    <option value="" className="bg-slate-900 text-slate-100">{t('dashboard.select_lawyer', 'Sélectionnez un avocat...')}</option>
                    {availableLawyers.map(l => (
                      <option key={l.id} value={l.id} className="bg-slate-900 text-slate-100">
                        Me. {l.first_name} {l.last_name} ({l.specialty || 'Généraliste'}) - {l.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('dashboard.date', 'Date')}</label>
                    <Input 
                      type="date" 
                      value={rdvDate} 
                      onChange={e => setRdvDate(e.target.value)} 
                      min={new Date().toISOString().split('T')[0]} 
                      required 
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('dashboard.time', 'Heure')}</label>
                    <Input 
                      type="time" 
                      value={rdvTime} 
                      onChange={e => setRdvTime(e.target.value)} 
                      required 
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('dashboard.notes', 'Description / Notes préliminaires')}</label>
                  <textarea
                    value={rdvNotes}
                    onChange={e => setRdvNotes(e.target.value)}
                    placeholder={t('dashboard.notes_placeholder', 'Expliquez brièvement votre dossier ou vos questions...')}
                    rows={4}
                    className="w-full rounded-md border border-slate-800 bg-slate-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  />
                </div>
                <Button type="submit" disabled={isBooking} className="w-full">
                  {isBooking ? t('common.loading', 'Enregistrement...') : t('dashboard.book_appointment', 'Prendre rendez-vous')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-secondary-800">{t('dashboard.planned_consultations', 'Mes consultations planifiées')}</h3>
            <div className="space-y-4">
              {appointments.map((appt) => {
                const label = statusLabels[appt.status] || { text: appt.status, color: "bg-secondary-100 text-secondary-600" };
                return (
                  <Card key={appt.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex gap-4">
                          <div className="p-3 bg-secondary-50 rounded-xl text-secondary-600">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-secondary-900">
                              Consultation avec Me. {appt.profiles?.first_name} {appt.profiles?.last_name}
                            </h4>
                            <p className="text-xs text-secondary-500 mt-1 font-semibold">
                              {new Date(appt.scheduled_at).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {appt.notes && (
                              <p className="text-sm text-secondary-600 bg-secondary-50 rounded-lg p-3 mt-3 border border-secondary-100 max-w-lg italic">
                                "{appt.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${label.color}`}>
                            {label.text}
                          </span>
                          {appt.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 mt-2"
                              onClick={() => handleCancelAppointment(appt.id)}
                            >
                              {t('dashboard.cancel_rdv', 'Annuler RDV')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {appointments.length === 0 && (
                <div className="text-center py-20 bg-slate-900 text-slate-100 rounded-2xl border border-dashed border-slate-800">
                  <Calendar className="h-10 w-10 mx-auto mb-2 text-secondary-200" />
                  {t('dashboard.no_appointments', 'Aucune consultation planifiée pour le moment.')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-16">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Modern Hero Glassmorphism Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl mb-8 border border-indigo-800/40">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Espace Officiel
                </span>
                {(profile as any)?.role === 'student' && (
                  <span className="bg-blue-500/20 text-blue-200 text-xs font-extrabold px-3 py-1 rounded-full border border-blue-400/30 backdrop-blur-md">
                    🎓 Étudiant en Droit
                  </span>
                )}
                {(profile as any)?.role === 'professor' && (
                  <span className="bg-amber-500/20 text-amber-200 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-md">
                    👨‍🏫 Professeur de Droit
                  </span>
                )}
                {(profile as any)?.role === 'doctorate' && (
                  <span className="bg-teal-500/20 text-teal-200 text-xs font-extrabold px-3 py-1 rounded-full border border-teal-400/30 backdrop-blur-md">
                    🔬 Doctorant / Chercheur
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                {t('dashboard.hello', 'Bonjour')}, <span className="bg-gradient-to-r from-indigo-200 via-white to-violet-200 bg-clip-text text-transparent">{profile?.first_name || t('dashboard.user', 'Utilisateur')}</span> 👋
              </h1>

              <p className="text-indigo-200/90 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
                {(profile as any)?.role === 'student' 
                  ? 'Consultez vos formations juridiques, téléchargez vos supports de cours au format PDF et échangez avec vos avocats & professeurs.'
                  : t('dashboard.welcome_portal', 'Bienvenue sur votre portail juridique intelligent France Justice')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 backdrop-blur-md bg-white/5 p-3 rounded-2xl border border-white/10">
              <LiveSyncBadge status="connected" showText={true} />
              <NotificationBell userId={user?.id ?? null} />
              <VoiceAssistant
                mode="citizen"
                activeTab={activeTab}
                onAction={handleVoiceAction}
                variant="inline"
                stateContext={{
                  profile,
                  availableLawyers,
                  appointments,
                  documents
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="text-red-300 hover:text-white bg-red-500/10 hover:bg-red-600/80 border-red-400/30 flex items-center justify-center font-semibold rounded-xl transition-all shadow-sm"
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
              <span>Menu : {tabs.find(t => t.id === activeTab)?.name || "Navigation"}</span>
            </div>
            <span className="text-xs bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold">
              Navigation ☰
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
                    Menu du Tableau de Bord
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
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
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
            <Card className="sticky top-6 bg-slate-900/90 border-slate-800">
              <CardContent className="p-4 sm:p-6">
                <nav className="flex flex-col space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 text-sm cursor-pointer ${
                          activeTab === tab.id
                            ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 text-indigo-400" />
                        <span className="font-medium whitespace-nowrap">{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3 order-1 lg:order-2">
            {loading ? (
              <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-primary-600" /></div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'appointments' && renderAppointments()}
                {activeTab === 'generator' && (
                  <div className="space-y-4 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.doc_generator_title', 'Générateur de Documents Juridiques')}</h2>
                    <DocumentGenerator skipAuthCheck />
                  </div>
                )}
                {activeTab === 'quotes' && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.quotes_title', 'Mes Devis & Honoraires')}</h2>
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
                                  {t('common.download', 'Télécharger')}
                                </Button>
                                {q.status === 'pending' ? (
                                  <Button
                                    onClick={() => handlePayQuote(q)}
                                    disabled={payingQuoteId === q.id}
                                    className="relative"
                                  >
                                    {payingQuoteId === q.id ? (
                                      <span className="flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        {t('dashboard.redirecting', 'Redirection...')}
                                      </span>
                                    ) : (
                                      `${t('dashboard.pay', 'Payer')} ${q.amount} MAD`
                                    )}
                                  </Button>
                                ) : q.status === 'paid' ? (
                                  <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-bold flex items-center gap-1">
                                    ✅ {t('dashboard.status_paid', 'Payé')}
                                  </span>
                                ) : (
                                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold">
                                    {t('dashboard.commission_paid', 'Commission payée')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {quotes.length === 0 && <div className="text-center py-12 bg-slate-900 text-slate-100 rounded-xl border border-slate-800">{t('dashboard.no_quotes', 'Aucun devis reçu.')}</div>}
                    </div>
                  </div>
                )}
                {activeTab === 'assistant' && (
                  <div className="space-y-4 animate-fade-in">
                    <AssistantPage embedded={true} />
                  </div>
                )}
                {activeTab === 'documents' && renderDocuments()}
                {activeTab === 'searches' && (
                  <div className="space-y-4 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.ia_legal_search', 'IA Juridique — Recherche de Droit')}</h2>
                    <SearchPage skipAuthCheck />
                  </div>
                )}
                {activeTab === 'codes' && (
                  <div className="space-y-4 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.law_codes', 'Codes de Loi')}</h2>
                    <LawCodes />
                  </div>
                )}
                {activeTab === 'procedures' && (
                  <div className="space-y-4 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.procedures_library', 'Bibliothèque des Procédures')}</h2>
                    <ProcedureLibrary />
                  </div>
                )}
                {activeTab === 'analyse' && (
                  <div className="space-y-4 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.ia_analysis', 'Analyse de Contrats & Codes (IA)')}</h2>
                    <h2 className="text-2xl font-semibold text-white">{t('dashboard.ia_analysis', 'Analyse de Contrats & Codes (IA)')}</h2>
                    <CodeAnalysis />
                  </div>
                )}
                {activeTab === 'formations' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-semibold text-white">{t('dashboard.formations_academic', 'Formations et Espace Académique')}</h2>
                        <p className="text-xs text-slate-400 mt-1">Accédez aux programmes de formation, masterclasses et supports téléchargeables.</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {['professor', 'doctorate', 'lawyer', 'admin'].includes((profile as any)?.role) && (
                          <Button
                            onClick={() => setCreateFormationOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg rounded-xl flex items-center gap-1.5 py-2 px-3.5"
                          >
                            <Plus className="w-4 h-4" />
                            🎓 Créer une Formation / Masterclass
                          </Button>
                        )}

                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => setClassroomsSubTab('virtual')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              classroomsSubTab === 'virtual' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {t('dashboard.virtual_classrooms', 'Salles de Classe Virtuelles')}
                          </button>
                          <button
                            onClick={() => setClassroomsSubTab('static')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              classroomsSubTab === 'static' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-600 hover:text-primary-600'
                            }`}
                          >
                            {t('dashboard.training_guides', 'Guides de Formation')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {classroomsSubTab === 'virtual' ? (
                      <div className="space-y-6">
                        {/* Status filter pills */}
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'all', label: 'Toutes' },
                            { id: 'upcoming', label: '📅 À venir' },
                            { id: 'live', label: '🔴 En cours' },
                            { id: 'finished', label: '✅ Terminées' },
                          ].map((f) => (
                            <button
                              key={f.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:border-primary-400 transition-all"
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classrooms.map((room) => {
                          const isRegistered = registrations.includes(room.id);
                          // Determine session status
                          const now = new Date();
                          let sessionStatus: 'upcoming' | 'live' | 'finished' = 'upcoming';
                          if (room.date && room.time) {
                            try {
                              const [y, m, d] = room.date.split('-');
                              const [hh, mm] = room.time.split(':');
                              const start = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
                              const end = new Date(start.getTime() + (room.duration_minutes || 120) * 60000);
                              if (now > end) sessionStatus = 'finished';
                              else if (now >= start && now <= end) sessionStatus = 'live';
                            } catch {}
                          }
                          const isSuspended = room.is_active === false;
                          
                          return (
                            <Card key={room.id} className={`overflow-hidden hover:shadow-md transition-all border-slate-800 bg-slate-900 text-slate-100 flex flex-col h-full ${isSuspended ? 'opacity-60' : ''}`}>
                              <div className={`p-3 text-white font-bold flex justify-between items-center bg-gradient-to-r ${
                                room.type === 'direct' 
                                  ? 'from-red-600 to-orange-500' 
                                  : room.type === 'video' 
                                  ? 'from-blue-600 to-indigo-500' 
                                  : 'from-emerald-600 to-teal-500'
                              }`}>
                                <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                                  {room.type === 'direct' ? 'Direct / Conférence' : room.type === 'video' ? 'Salle Vidéo' : 'Différé'}
                                </span>
                                <div className="flex gap-1.5 items-center">
                                  {sessionStatus === 'live' && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded animate-pulse">🔴 EN DIRECT</span>}
                                  {sessionStatus === 'finished' && <span className="bg-slate-800/50 text-white text-[9px] font-bold px-2 py-0.5 rounded">✅ Terminée</span>}
                                  {isSuspended && <span className="bg-amber-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded">⏸️ Suspendue</span>}
                                  <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Max {room.max_members}
                                  </span>
                                </div>
                              </div>
                              <CardContent className="p-5 flex flex-col justify-between flex-1 gap-4">
                                <div className="space-y-2">
                                  <h3 className="text-base font-bold text-secondary-900 line-clamp-1">{room.title}</h3>
                                  <p className="text-xs text-secondary-500 line-clamp-3">{room.description}</p>
                                </div>
                                <div className="space-y-1.5 border-t border-secondary-50 pt-3 text-xs text-secondary-600">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-secondary-400" />
                                    <span>Par : Me {room.lawyer_first_name} {room.lawyer_last_name}</span>
                                  </div>
                                  {room.scheduled_at && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-secondary-400" />
                                      <span>Le {new Date(room.scheduled_at).toLocaleDateString()} à {new Date(room.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  )}
                                  
                                  {/* Fichiers PDF & Images rattachés */}
                                  {room.attachments && room.attachments.length > 0 && (
                                    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-200">📑 Fichiers PDF & Images ({room.attachments.length})</span>
                                        <button
                                          type="button"
                                          onClick={() => exportAllAttachments(room.attachments)}
                                          className="text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                        >
                                          <Download className="w-3 h-3" /> Tout exporter
                                        </button>
                                      </div>
                                      <div className="space-y-1.5">
                                        {room.attachments.map((att: any) => (
                                          <div key={att.id} className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-700">
                                            <div className="flex items-center gap-2 truncate">
                                              <span className={`px-1 rounded text-[9px] font-extrabold ${att.type === 'pdf' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'}`}>
                                                {att.type.toUpperCase()}
                                              </span>
                                              <span className="truncate text-[11px] text-slate-200">{att.name}</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => exportAttachmentFile(att)}
                                              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0 ml-2"
                                            >
                                              <Download className="w-3 h-3" /> Exporter
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-secondary-400" />
                                    <span>Durée : {room.duration_minutes} min</span>
                                  </div>
                                </div>

                                {/* Session terminée — Résumé */}
                                {sessionStatus === 'finished' && (
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                                    <h4 className="text-xs font-bold text-emerald-800">📋 Résumé de la séance</h4>
                                    <p className="text-[11px] text-emerald-700 leading-relaxed">La séance de formation est terminée. Consultez les détails complets sur la page des formations.</p>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-2 flex-wrap">
                                  {sessionStatus !== 'finished' && !isSuspended ? (
                                    <>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        className={`flex-1 text-xs font-bold ${sessionStatus === 'live' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                        onClick={() => startClassroomSimulator(room)}
                                      >
                                        <Video className="w-3.5 h-3.5 mr-1" /> {sessionStatus === 'live' ? 'Rejoindre la session 🔴' : 'Rejoindre'}
                                      </Button>
                                      {isRegistered ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs text-red-500 border-red-200 hover:bg-red-50"
                                          onClick={() => handleRegisterClassroom(room)}
                                        >
                                          Quitter
                                        </Button>
                                      ) : (
                                        <div className="flex gap-1.5">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                            onClick={() => handleRegisterClassroom(room)}
                                          >
                                            ✅ Accepter
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs text-slate-400 border-slate-200 hover:bg-slate-50"
                                          >
                                            Ignorer
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  ) : sessionStatus === 'finished' ? (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-full text-center">Séance terminée — Résumé disponible</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-full text-center">Séance suspendue par l'avocat</span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        {classrooms.length === 0 && (
                          <div className="col-span-full text-center py-12 text-secondary-400 border border-dashed rounded-2xl">
                            Aucune salle de classe virtuelle n'est disponible pour le moment.
                          </div>
                        )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {formations.map((f) => {
                          const isCompleted = completedFormations.includes(f.id);
                          const atts = getFormationAttachments(f);
                          return (
                            <Card key={f.id} className="hover:shadow-md transition-all duration-200 border-secondary-100 flex flex-col justify-between">
                              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                                <div className="flex flex-col space-y-3">
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">{f.category}</span>
                                    {isCompleted ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-100 text-success-700 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                                        Terminé
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary-100 text-secondary-600">
                                        Disponible
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-lg font-bold text-secondary-900 line-clamp-2">{f.title}</h3>
                                  <p className="text-xs text-secondary-500">Durée: {f.duration} • Niveau: {f.level} {f.author_name ? `• Par ${f.author_name}` : ''}</p>
                                  
                                  {f.description && (
                                    <p className="text-xs text-secondary-600 line-clamp-2 italic bg-secondary-50 p-2 rounded-xl">
                                      "{f.description}"
                                    </p>
                                  )}

                                  <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between text-xs text-secondary-400">
                                      <span>Progression</span>
                                      <span>{isCompleted ? '100%' : '0%'}</span>
                                    </div>
                                    <div className="w-full bg-secondary-100 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${isCompleted ? 'bg-success-500' : 'bg-secondary-300'}`}
                                        style={{ width: isCompleted ? '100%' : '0%' }}
                                      />
                                    </div>
                                  </div>

                                  {atts.length > 0 && (
                                    <div className="pt-2 space-y-1.5">
                                      <p className="text-[11px] font-bold text-secondary-700 flex items-center gap-1">
                                        <span>📑</span> Supports joints ({atts.length}) :
                                      </p>
                                      <div className="flex flex-col gap-1.5">
                                        {atts.map((att) => (
                                          <button
                                            key={att.id}
                                            type="button"
                                            onClick={() => exportAttachmentFile(att)}
                                            className="inline-flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all w-full text-left"
                                          >
                                            <span className="truncate flex items-center gap-1.5">
                                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${att.type === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {att.type.toUpperCase()}
                                              </span>
                                              <span className="truncate">{att.name}</span>
                                            </span>
                                            <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex gap-2 pt-2">
                                    <Button 
                                      variant={isCompleted ? "outline" : "primary"}
                                      className="flex-1 text-sm font-semibold"
                                      onClick={() => {
                                        setSelectedFormation(f);
                                        setFormationViewMode('start');
                                        setActiveChapterIndex(0);
                                        setChaptersRead(isCompleted ? {0: true, 1: true, 2: true} : {});
                                      }}
                                    >
                                      {isCompleted ? "Recommencer" : "Commencer le module"}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="px-3 text-secondary-500 hover:text-primary-600"
                                      onClick={() => {
                                        setSelectedFormation(f);
                                        setFormationViewMode('preview');
                                        setActiveChapterIndex(0);
                                        setChaptersRead({0: true, 1: true, 2: true});
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        {formations.length === 0 && (
                          <div className="col-span-full text-center py-12 text-secondary-400 border border-dashed rounded-2xl">
                            Aucun module de formation n'est actuellement publié.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.profile', 'Mon Profil')}</h2>
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>{t('dashboard.personal_info', 'Informations Personnelles')}</CardTitle>
                          <CardDescription>{t('dashboard.update_info', 'Mettez à jour vos coordonnées pour faciliter vos échanges.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">{t('register.first_name', 'Prénom')}</label>
                            <Input value={profileForm.first_name} onChange={e => setProfileForm(p => ({...p, first_name: e.target.value}))} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">{t('register.last_name', 'Nom')}</label>
                            <Input value={profileForm.last_name} onChange={e => setProfileForm(p => ({...p, last_name: e.target.value}))} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">{t('dashboard.phone', 'Téléphone')}</label>
                            <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">{t('dashboard.city', 'Ville')}</label>
                            <Input value={profileForm.city} onChange={e => setProfileForm(p => ({...p, city: e.target.value}))} placeholder="Casablanca" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">{t('dashboard.email', 'Email')}</label>
                            <Input value={user?.email || ''} disabled className="bg-secondary-50" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">{t('dashboard.postal_code', 'Code Postal')}</label>
                            <Input value={profileForm.postal_code} onChange={e => setProfileForm(p => ({...p, postal_code: e.target.value}))} />
                          </div>
                          
                          {(profileForm.city || profileForm.postal_code) && (
                            <div className="md:col-span-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-900">
                              <span className="font-bold flex items-center gap-1.5">
                                ⚖️ Cour d'Appel de la ville : {getCourDAppelForCity(profileForm.city, profileForm.postal_code).name}
                              </span>
                              <span className="text-indigo-600 font-semibold">
                                Premier Président : {getCourDAppelForCity(profileForm.city, profileForm.postal_code).premierPresident}
                              </span>
                            </div>
                          )}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">{t('dashboard.birth_date', 'Date de naissance')}</label>
                            <Input type="date" value={profileForm.birth_date} onChange={e => setProfileForm(p => ({...p, birth_date: e.target.value}))} />
                          </div>
                        </CardContent>
                      </Card>
                      <Button type="submit" className="w-full h-12 text-base font-bold">{t('dashboard.save_profile', 'Enregistrer le profil')}</Button>
                    </form>
                  </div>
                )}
              {activeTab === 'avocats' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-semibold text-secondary-900">{t('dashboard.lawyers_directory', 'Annuaire des Avocats')}</h2>

                  {(!(profile as any)?.city || !(profile as any)?.postal_code) ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center justify-between text-yellow-800 text-sm">
                      <div className="flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{t('dashboard.complete_profile_hint', 'Complétez votre profil avec votre ville et votre code postal pour filtrer automatiquement les avocats près de chez vous.')}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('profile')} className="text-xs text-yellow-900 hover:bg-yellow-100 font-semibold">
                        {t('dashboard.complete_profile', 'Compléter mon profil')}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-primary-50 border border-primary-100 rounded-2xl text-primary-800 text-xs flex justify-between items-center">
                      <span>📍 {t('dashboard.location_filtered', 'Recherche restreinte automatiquement à votre secteur')} : <strong>{(profile as any).city} ({(profile as any).postal_code.substring(0, 2)})</strong>.</span>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('profile')} className="text-xs text-primary-900 hover:bg-primary-100 font-semibold">
                        {t('common.edit', 'Modifier')}
                      </Button>
                    </div>
                  )}
                  
                  {/* Interactive Map & Dropdowns */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                      <FranceMap 
                        selectedRegion={selectedRegion} 
                        onSelectRegion={setSelectedRegion} 
                        lawyerCounts={lawyerCounts} 
                      />
                    </div>
                    
                    <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 text-slate-100">
                      <div>
                        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                          🏛️ Localisation
                        </h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Région</label>
                            <select
                              value={selectedRegion || ''}
                              onChange={(e) => setSelectedRegion(e.target.value || null)}
                              className="w-full h-10 px-2.5 border border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-slate-800 text-slate-100"
                            >
                              <option value="">Toutes les régions</option>
                              {regions.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Barreau d'inscription</label>
                            <select
                              value={selectedBarreau}
                              onChange={(e) => setSelectedBarreau(e.target.value)}
                              className="w-full h-10 px-2.5 border border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-slate-800 text-slate-100"
                            >
                              <option value="">Tous les barreaux</option>
                              {availableBarreaux.map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Ville du cabinet</label>
                            <select
                              value={selectedCity}
                              onChange={(e) => setSelectedCity(e.target.value)}
                              className="w-full h-10 px-2.5 border border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-slate-800 text-slate-100"
                            >
                              <option value="">Toutes les villes</option>
                              {availableCities.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {(selectedRegion || selectedBarreau || selectedCity) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRegion(null);
                            setSelectedBarreau('');
                            setSelectedCity('');
                          }}
                          className="w-full"
                        >
                          Réinitialiser les filtres
                        </Button>
                      )}
                    </div>
                  </div>

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
                      .filter(l => {
                        const matchesSearch = `${l.first_name} ${l.last_name} ${l.specialty || ''}`.toLowerCase().includes(lawyerSearch.toLowerCase());
                        if (!matchesSearch) return false;

                        // Strict location restriction for citizen matching: same city & department
                        const citizenCity = (profile as any)?.city?.trim().toLowerCase();
                        const citizenDept = (profile as any)?.postal_code?.trim().substring(0, 2);
                        if (citizenCity && citizenDept) {
                          const lawyerCity = l.city?.trim().toLowerCase();
                          const lawyerDept = l.postal_code?.trim().substring(0, 2);
                          if (lawyerCity !== citizenCity || lawyerDept !== citizenDept) {
                            return false;
                          }
                        }

                        if (selectedRegion) {
                          const lawyerRegion = getRegionFromPostalCode(l.postal_code);
                          if (lawyerRegion !== selectedRegion) return false;
                        }

                        if (selectedCity && l.city !== selectedCity) return false;

                        if (selectedBarreau) {
                          const bar = Array.isArray(l.lawyers) 
                            ? l.lawyers[0]?.bar_association 
                            : l.lawyers?.bar_association;
                          if (bar !== selectedBarreau) return false;
                        }

                        return true;
                      })
                      .map(lawyer => {
                        const bar = Array.isArray(lawyer.lawyers) 
                          ? lawyer.lawyers[0]?.bar_association 
                          : lawyer.lawyers?.bar_association;

                        return (
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
                                  <p className="text-xs text-secondary-500 mt-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-secondary-400 shrink-0" />
                                    <span>
                                      {lawyer.city || ''}
                                      {lawyer.postal_code ? ` (${lawyer.postal_code.substring(0, 2)})` : ''}
                                    </span>
                                  </p>
                                  {bar && (
                                    <p className="text-xs text-secondary-500 mt-1 flex items-center gap-1">
                                      <span className="text-sm">🏛️</span>
                                      <span>{t('dashboard.bar_of', 'Barreau de')} {bar}</span>
                                    </p>
                                  )}
                                  {lawyer.bio && <p className="text-xs text-secondary-600 mt-2 line-clamp-2">{lawyer.bio}</p>}
                                </div>
                              </div>
                              <div className="mt-4 flex gap-2">
                                <Button
                                  className="flex-1 text-sm"
                                  onClick={() => contactLawyer(lawyer.id, `Me. ${lawyer.first_name} ${lawyer.last_name}`)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  {t('lawyers.contact_btn', 'Contacter')}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 text-sm border-primary-200 text-primary-700 hover:bg-primary-50"
                                  onClick={() => {
                                    setSelectedLawyerForRDV(lawyer.id);
                                    setActiveTab('appointments');
                                  }}
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {t('lawyers.book_appointment', 'Réserver RDV')}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    {availableLawyers.filter(l => {
                      const matchesSearch = `${l.first_name} ${l.last_name} ${l.specialty || ''}`.toLowerCase().includes(lawyerSearch.toLowerCase());
                      if (!matchesSearch) return false;

                      // Strict location restriction for citizen matching: same city & department
                      const citizenCity = (profile as any)?.city?.trim().toLowerCase();
                      const citizenDept = (profile as any)?.postal_code?.trim().substring(0, 2);
                      if (citizenCity && citizenDept) {
                        const lawyerCity = l.city?.trim().toLowerCase();
                        const lawyerDept = l.postal_code?.trim().substring(0, 2);
                        if (lawyerCity !== citizenCity || lawyerDept !== citizenDept) {
                          return false;
                        }
                      }

                      if (selectedRegion) {
                        const lawyerRegion = getRegionFromPostalCode(l.postal_code);
                        if (lawyerRegion !== selectedRegion) return false;
                      }

                      if (selectedCity && l.city !== selectedCity) return false;

                      if (selectedBarreau) {
                        const bar = Array.isArray(l.lawyers) 
                          ? l.lawyers[0]?.bar_association 
                          : l.lawyers?.bar_association;
                        if (bar !== selectedBarreau) return false;
                      }

                      return true;
                    }).length === 0 && (
                      <div className="col-span-2 text-center py-12 text-secondary-400">
                        <Users className="h-10 w-10 mx-auto mb-2 text-secondary-200" />
                        <p>Aucun avocat disponible pour ces critères de recherche.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>{t('dashboard.my_lawyers', 'Mes Avocats')}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y text-sm">
                        {chatRooms.map(room => (
                          <button 
                            key={room.id}
                            onClick={() => setActiveRoom({ id: room.id, name: `Me ${room.profiles?.last_name}` })}
                            className={`w-full p-4 text-left hover:bg-secondary-50 ${activeRoom?.id === room.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''}`}
                          >
                            <p className="font-bold">Me {room.profiles?.first_name} {room.profiles?.last_name}</p>
                            <p className="text-xs text-secondary-500">{t('dashboard.specialized_lawyer', 'Avocat spécialisé')}</p>
                          </button>
                        ))}
                        {chatRooms.length === 0 && <div className="p-8 text-center text-secondary-400">{t('dashboard.no_active_chats', 'Aucune discussion active.')}</div>}
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
                        <p>{t('dashboard.select_lawyer_to_chat', 'Sélectionnez un avocat pour discuter')}</p>
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
        title={t('dashboard.welcome_modal_title', 'Bienvenue sur France Justice')}
      >
        <div className="text-center py-6">
          <div className="mx-auto h-16 w-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-success-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-2">{t('dashboard.welcome', 'Bienvenue')} {profile?.first_name} !</h3>
          <p className="text-secondary-600 mb-6">
            {t('dashboard.welcome_modal_desc', "Votre espace personnel est ouvert. Accédez à vos documents juridiques, consultez l'assistance ou contactez votre avocat à tout moment.")}
          </p>
          <Button className="w-full" onClick={() => setShowWelcome(false)}>
            {t('dashboard.discover_space', 'Découvrir mon espace')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedIADoc}
        onClose={() => setSelectedIADoc(null)}
        title={selectedIADoc?.name || "Visualisation du Document"}
      >
        <div className="space-y-6">
          <div className="p-5 bg-secondary-50 border border-secondary-200 rounded-2xl max-h-[60vh] overflow-y-auto whitespace-pre-wrap font-serif text-secondary-800 text-sm leading-relaxed shadow-inner">
            {selectedIADoc?.metadata?.content}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="outline" onClick={() => setSelectedIADoc(null)}>{t('common.close', 'Fermer')}</Button>
            <Button onClick={() => {
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>${selectedIADoc?.name || 'Document Juridique'}</title>
                      <style>
                        body { font-family: Georgia, serif; padding: 40px; color: #1f2937; line-height: 1.6; }
                        h1 { font-family: sans-serif; text-align: center; margin-bottom: 30px; }
                        pre { white-space: pre-wrap; font-family: Georgia, serif; font-size: 14px; }
                      </style>
                    </head>
                    <body>
                      <h1>${selectedIADoc?.name || 'Document Juridique'}</h1>
                      <pre>${selectedIADoc?.metadata?.content}</pre>
                      <script>
                        window.onload = function() {
                          window.print();
                          window.close();
                        }
                      </script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }
            }}>
              <Download className="h-4 w-4 mr-2" />
              Imprimer / PDF
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Formations Interactif */}
      <Modal
        isOpen={!!selectedFormation}
        onClose={() => setSelectedFormation(null)}
        title={selectedFormation ? `${selectedFormation.category} : ${selectedFormation.title}` : "Module de Formation"}
      >
        {(() => {
          if (!selectedFormation) return null;
          const chapters = getFormationCurriculum(selectedFormation.title);
          const totalChapters = chapters.length;
          const readCount = chapters.reduce((acc, _, idx) => acc + (chaptersRead[idx] ? 1 : 0), 0);
          const percent = Math.round((readCount / totalChapters) * 100);

          const atts = getFormationAttachments(selectedFormation);

          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-secondary-50 p-4 rounded-2xl border border-secondary-100">
                <div className="space-y-1">
                  <p className="text-xs text-secondary-400 font-bold uppercase font-sans">Durée du module</p>
                  <p className="text-sm font-semibold text-secondary-900 font-sans">{selectedFormation.duration}</p>
                </div>
                {selectedFormation.author_name && (
                  <div className="space-y-1 text-center">
                    <p className="text-xs text-secondary-400 font-bold uppercase font-sans">Formateur</p>
                    <p className="text-xs font-bold text-primary-700 font-sans">{selectedFormation.author_name} ({selectedFormation.author_role || 'Expert'})</p>
                  </div>
                )}
                <div className="space-y-1 text-right">
                  <p className="text-xs text-secondary-400 font-bold uppercase font-sans">Niveau requis</p>
                  <p className="text-sm font-semibold text-secondary-900 font-sans">{selectedFormation.level}</p>
                </div>
              </div>

              {selectedFormation.description && (
                <div className="bg-primary-50/60 border border-primary-100 p-4 rounded-2xl space-y-1 text-xs">
                  <p className="font-bold text-primary-900 uppercase tracking-wider text-[10px]">Description & Objectifs</p>
                  <p className="text-primary-800 leading-relaxed">{selectedFormation.description}</p>
                </div>
              )}

              {atts.length > 0 && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-slate-100 font-sans">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📑</span> Documents PDF & Visuels joints ({atts.length})
                    </h4>
                    <Button variant="outline" size="sm" className="text-xs font-bold border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => exportAllAttachments(atts)}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Exporter tout
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {atts.map((att) => (
                      <div key={att.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${att.type === 'pdf' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                            {att.type.toUpperCase()}
                          </span>
                          <span className="truncate text-xs font-medium text-slate-200">{att.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary-400 hover:text-primary-300 hover:bg-primary-950/50 p-1.5 h-auto text-xs font-bold" onClick={() => exportAttachmentFile(att)}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress bar in Modal */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-secondary-700">
                  <span>Progression globale</span>
                  <span>{percent}%</span>
                </div>
                <div className="w-full bg-secondary-100 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-success-500 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Chapter navigation */}
              <div className="border-t border-secondary-100 pt-4">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveChapterIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        activeChapterIndex === idx 
                          ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20' 
                          : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100 border border-secondary-200'
                      }`}
                    >
                      {ch.title.split('.')[0]}. {ch.title.split('.').slice(1).join('.').trim()}
                      {chaptersRead[idx] && " ✓"}
                    </button>
                  ))}
                </div>

                {/* Chapter content */}
                <div className="bg-secondary-50/50 border border-secondary-200/50 rounded-2xl p-5 min-h-[180px] flex flex-col justify-between font-sans">
                  <div className="space-y-3">
                    <h4 className="font-bold text-secondary-900 text-base">{chapters[activeChapterIndex].title}</h4>
                    <p className="text-sm text-secondary-700 leading-relaxed font-sans">{chapters[activeChapterIndex].content}</p>
                  </div>
                  {formationViewMode === 'start' && (
                    <div className="mt-4 pt-4 border-t border-secondary-100 flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!chaptersRead[activeChapterIndex]}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setChaptersRead(prev => ({
                              ...prev,
                              [activeChapterIndex]: checked
                            }));
                          }}
                          className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-secondary-700">J'ai lu et compris ce chapitre</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
                <Button variant="outline" onClick={() => setSelectedFormation(null)}>
                  {t('common.close', 'Fermer')}
                </Button>
                {formationViewMode === 'start' && (
                  <Button
                    disabled={percent < 100}
                    onClick={() => {
                      const newCompleted = [...completedFormations];
                      if (!newCompleted.includes(selectedFormation.id)) {
                        newCompleted.push(selectedFormation.id);
                        setCompletedFormations(newCompleted);
                        localStorage.setItem('completedFormations', JSON.stringify(newCompleted));
                      }
                      success(t('dashboard.module_completed', 'Module Terminé 🎓'), `${t('dashboard.congrats', 'Félicitations, vous avez validé le module')} "${selectedFormation.title}" !`);
                      setSelectedFormation(null);
                    }}
                  >
                    {t('dashboard.validate_module', 'Valider le module')}
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>


      {/* Modal de Création de Formation pour Enseignants, Doctorants, Avocats et Admins */}
      <Modal
        isOpen={createFormationOpen}
        onClose={() => setCreateFormationOpen(false)}
        title="🎓 Créer & Publier une nouvelle Formation Académique"
      >
        <form onSubmit={handleCreateFormation} className="space-y-4 text-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Titre de la Formation *</label>
            <Input
              type="text"
              placeholder="ex: Le Contentieux Administratif & Recours pour Excès de Pouvoir"
              value={newFormation.title}
              onChange={e => setNewFormation({ ...newFormation, title: e.target.value })}
              required
              className="bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Catégorie</label>
              <select
                value={newFormation.category}
                onChange={e => setNewFormation({ ...newFormation, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Droit des Contrats">Droit des Contrats</option>
                <option value="Droit Administratif">Droit Administratif</option>
                <option value="Droit des Affaires">Droit des Affaires</option>
                <option value="Droit du Travail">Droit du Travail</option>
                <option value="Droit Pénal">Droit Pénal</option>
                <option value="Droit Immobilier">Droit Immobilier</option>
                <option value="Droit International">Droit International</option>
                <option value="Recherche & Doctrine">Recherche & Doctrine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Niveau</label>
              <select
                value={newFormation.level}
                onChange={e => setNewFormation({ ...newFormation, level: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Débutant">Débutant (L1-L2)</option>
                <option value="Intermédiaire">Intermédiaire (L3-M1)</option>
                <option value="Avancé">Avancé (M2-Doctorat)</option>
                <option value="Expert">Expert / Praticien</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Durée Estimée</label>
              <Input
                type="text"
                placeholder="ex: 3h 30"
                value={newFormation.duration}
                onChange={e => setNewFormation({ ...newFormation, duration: e.target.value })}
                className="bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description & Programme détaillé</label>
            <textarea
              rows={4}
              placeholder="Décrivez les objectifs pédagogiques, les compétences visées et le plan de la formation..."
              value={newFormation.description}
              onChange={e => setNewFormation({ ...newFormation, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              📄 Pièces Jointes & Supports de cours (PDF, Images)
            </label>
            <input
              type="file"
              accept="application/pdf,image/*"
              multiple
              onChange={async (e) => {
                if (!e.target.files) return;
                const files = Array.from(e.target.files);
                const atts: FormationAttachment[] = [];
                for (const f of files) {
                  const att = await convertFileToAttachment(f);
                  atts.push(att);
                }
                setNewFormation(prev => ({
                  ...prev,
                  attachments: [...prev.attachments, ...atts]
                }));
              }}
              className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />

            {newFormation.attachments.length > 0 && (
              <div className="mt-3 space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <p className="text-[11px] font-bold text-indigo-300 uppercase">Fichiers sélectionnés :</p>
                {newFormation.attachments.map((att, i) => (
                  <div key={att.id || i} className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="truncate max-w-[200px]">{att.type === 'pdf' ? '📄' : '🖼️'} {att.name}</span>
                    <button
                      type="button"
                      onClick={() => setNewFormation(prev => ({ ...prev, attachments: prev.attachments.filter((_, idx) => idx !== i) }))}
                      className="text-red-400 hover:text-red-300 text-xs font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateFormationOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              🎓 Publier la Formation
            </Button>
          </div>
        </form>
      </Modal>

      <StripePaymentModal
        isOpen={!!selectedPaymentQuote}
        onClose={() => setSelectedPaymentQuote(null)}
        quote={selectedPaymentQuote}
        paymentType="quote_payment"
        onSuccess={() => {
          fetchQuotes();
          success('Paiement réussi !', 'Votre devis est validé et transmis à votre avocat.');
        }}
      />
    </div>
  );
};

export default DashboardPage;
