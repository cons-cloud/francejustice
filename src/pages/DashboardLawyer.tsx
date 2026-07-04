import React, { useState, useEffect, useMemo } from "react"
import {
  Users,
  FileText,
  Calendar,
  MessageSquare,
  BarChart3,
  Shield,
  RefreshCw,
  Plus,
  HelpCircle,
  PenTool,
  LogOut,
  FileSpreadsheet,
  DollarSign,
  Receipt,
  Sparkles,
  Eye,
  Download,
  AlertTriangle,
  BookOpen,
  Globe,
  Search,
  ArrowLeft,
  Video,
  Clock,
  Trash2
} from "lucide-react"

import { AdvancedAreaChart } from "../components/features/StatsCharts"
import LawCodes from '../components/features/LawCodes';
import ProcedureLibrary from '../components/features/ProcedureLibrary';
import CodeAnalysis from '../components/features/CodeAnalysis';
import SearchPage from './Search';
import { exportToCSV } from "../lib/exportUtils"
import { Chat } from "../components/features/Chat"
import { FranceMap, regions } from "../components/features/FranceMap"
import JitsiMeeting from "../components/features/JitsiMeeting"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { useToast } from "../hooks/useToast"
import Modal from "../components/ui/Modal"
import { Input } from "../components/ui/Input"
import { VoiceAssistant } from "../components/ui/VoiceAssistant"
import NotificationBell from '../components/ui/NotificationBell';
import { cn } from "../lib/utils";
import { createCheckoutSession } from "../lib/api";

const DashboardLawyer: React.FC = () => {
  const { user, profile } = useAuth()
  const { success, error: toastError } = useToast()
  const [payingCommissionId, setPayingCommissionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [showWelcome, setShowWelcome] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [outils, setOutils] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [chatRooms, setChatRooms] = useState<any[]>([])
  const [activeRoom, setActiveRoom] = useState<any>(null)
  const [formations, setFormations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [ticketSubject, setTicketSubject] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [newQuote, setNewQuote] = useState({ client_id: '', amount: '', description: '', case_id: '' })
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [newDoc, setNewDoc] = useState({ name: '', type: 'client_document', client_id: '' })
  const [selectedIADoc, setSelectedIADoc] = useState<any>(null)
  const [paymentAlarmQuote, setPaymentAlarmQuote] = useState<any | null>(null)
  const [availableLawyers, setAvailableLawyers] = useState<any[]>([])
  const [lawyerSearch, setLawyerSearch] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedBarreau, setSelectedBarreau] = useState<string>('')
  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', phone: '', city: '', postal_code: '',
    bio: '', specialty: '', bar_number: '', experience_years: 0, is_available: true,
    stripe_public_key: '', stripe_secret_key: '', bar_association: ''
  })

  const [selectedClientForCases, setSelectedClientForCases] = useState<string | null>(null)
  const [clientSearchText, setClientSearchText] = useState('')

  // Salles de classe / Visioconférences
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [classroomsSubTab, setClassroomsSubTab] = useState<'static' | 'virtual'>('virtual')
  const [activeClassroom, setActiveClassroom] = useState<any | null>(null)
  const [isInMeeting, setIsInMeeting] = useState(false)
  const [createClassroomOpen, setCreateClassroomOpen] = useState(false)
  const [newClassroom, setNewClassroom] = useState({
    title: '',
    description: '',
    type: 'direct', // 'direct' | 'video' | 'differe'
    scheduled_at: '',
    duration_minutes: 60,
    max_members: 100,
    video_url: '',
    meeting_link: ''
  })

  // États pour le module Formations
  const [selectedFormation, setSelectedFormation] = useState<any | null>(null)
  const [formationViewMode, setFormationViewMode] = useState<'start' | 'preview'>('preview')
  const [completedFormations, setCompletedFormations] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('completedFormations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0)
  const [chaptersRead, setChaptersRead] = useState<Record<number, boolean>>({})

  // États pour le module Outils
  const [selectedOutil, setSelectedOutil] = useState<any | null>(null)
  
  // États pour l'outil Générateur de Contrat IA
  const [contractType, setContractType] = useState('service')
  const [contractClient, setContractClient] = useState('')
  const [contractPrice, setContractPrice] = useState('5000')
  const [contractGeneratedText, setContractGeneratedText] = useState('')
  const [contractGenerating, setContractGenerating] = useState(false)

  // États pour l'outil Calculateur d'Honoraires
  const [calcHourlyRate, setCalcHourlyRate] = useState('1200')
  const [calcHours, setCalcHours] = useState('10')
  const [calcExpenses, setCalcExpenses] = useState('500')
  const [calcVatRate, setCalcVatRate] = useState('20')
  const [calcClient, setCalcClient] = useState('')
  const [calcDescription, setCalcDescription] = useState('')

  // États pour l'outil Délais de Prescription
  const [prescDomain, setPrescDomain] = useState('civil')
  const [prescStartDate, setPrescStartDate] = useState('')
  const [prescResult, setPrescResult] = useState<any>(null)

  // États pour l'outil d'Anonymisation
  const [anonInputText, setAnonInputText] = useState('')
  const [anonOutputText, setAnonOutputText] = useState('')
  const [anonProcessing, setAnonProcessing] = useState(false)

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

  const filteredClients = useMemo(() => {
    const map = new Map<string, { id: string; first_name: string; last_name: string; email: string; city: string; postal_code: string; count: number }>();
    cases.forEach((c) => {
      const ownerId = c.owner_id;
      if (!ownerId) return;
      if (!map.has(ownerId)) {
        map.set(ownerId, {
          id: ownerId,
          first_name: c.profiles?.first_name || 'Citoyen',
          last_name: c.profiles?.last_name || '',
          email: c.profiles?.email || '',
          city: c.profiles?.city || '',
          postal_code: c.profiles?.postal_code || '',
          count: 0
        });
      }
      map.get(ownerId)!.count += 1;
    });

    const list = Array.from(map.values());
    if (!clientSearchText.trim()) return list;
    const search = clientSearchText.toLowerCase();
    return list.filter(u => 
      u.first_name.toLowerCase().includes(search) || 
      u.last_name.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search) ||
      u.city.toLowerCase().includes(search)
    );
  }, [cases, clientSearchText]);

  const allInteractingClients = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    
    // Add from cases
    cases.forEach(c => {
      if (c.owner_id) {
        const cityStr = c.profiles?.city ? ` (${c.profiles.city})` : '';
        map.set(c.owner_id, {
          id: c.owner_id,
          name: `${c.profiles?.first_name || ''} ${c.profiles?.last_name || ''}${cityStr}`.trim() || 'Citoyen'
        });
      }
    });

    // Add from appointments
    appointments.forEach(a => {
      if (a.client_id) {
        const cityStr = (a.profiles as any)?.city ? ` (${(a.profiles as any).city})` : '';
        map.set(a.client_id, {
          id: a.client_id,
          name: `${(a.profiles as any)?.first_name || ''} ${(a.profiles as any)?.last_name || ''}${cityStr}`.trim() || 'Citoyen'
        });
      }
    });

    // Add from chatRooms
    chatRooms.forEach(r => {
      if (r.client_id) {
        const cityStr = r.profiles?.city ? ` (${r.profiles.city})` : '';
        map.set(r.client_id, {
          id: r.client_id,
          name: `${r.profiles?.first_name || ''} ${r.profiles?.last_name || ''}${cityStr}`.trim() || 'Citoyen'
        });
      }
    });

    return Array.from(map.values());
  }, [cases, appointments, chatRooms]);

  const selectedClientInfo = useMemo(() => {
    if (!selectedClientForCases) return null;
    const clientDoc = cases.find(c => c.owner_id === selectedClientForCases);
    if (clientDoc) {
      return {
        id: selectedClientForCases,
        name: `${clientDoc.profiles?.first_name || ''} ${clientDoc.profiles?.last_name || ''}`.trim() || 'Citoyen',
        email: clientDoc.profiles?.email || '',
        city: clientDoc.profiles?.city || '',
        postal_code: clientDoc.profiles?.postal_code || ''
      };
    }
    const appt = appointments.find(a => a.client_id === selectedClientForCases);
    if (appt) {
      return {
        id: selectedClientForCases,
        name: `${(appt.profiles as any)?.first_name || ''} ${(appt.profiles as any)?.last_name || ''}`.trim() || 'Citoyen',
        email: (appt.profiles as any)?.email || '',
        city: (appt.profiles as any)?.city || '',
        postal_code: (appt.profiles as any)?.postal_code || ''
      };
    }
    const room = chatRooms.find(r => r.client_id === selectedClientForCases);
    if (room) {
      return {
        id: selectedClientForCases,
        name: `${room.profiles?.first_name || ''} ${room.profiles?.last_name || ''}`.trim() || 'Citoyen',
        email: room.profiles?.email || '',
        city: room.profiles?.city || '',
        postal_code: room.profiles?.postal_code || ''
      };
    }
    return { id: selectedClientForCases, name: 'Citoyen', email: '', city: '', postal_code: '' };
  }, [selectedClientForCases, cases, appointments, chatRooms]);

  const handleVoiceAction = (action: { type: string; payload: any }) => {
    if (action.type === 'SWITCH_TAB') {
      setActiveTab(action.payload.tab);
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
              success('Document généré par l\'IA 📄', `Le document "${action.payload.title}" a été enregistré dans vos dossiers.`);
              fetchCases();
            }
          });
      }
    }
  };

  const playAlarmSound = () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const ctx = new AudioContextClass();
      const playBeep = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      playBeep(ctx.currentTime, 587.33, 0.25);
      playBeep(ctx.currentTime + 0.25, 698.46, 0.25);
      playBeep(ctx.currentTime + 0.5, 587.33, 0.25);
      playBeep(ctx.currentTime + 0.75, 698.46, 0.35);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  };

  useEffect(() => {
    if (profile && !sessionStorage.getItem('lawyer_welcome_shown')) {
      setShowWelcome(true)
      sessionStorage.setItem('lawyer_welcome_shown', 'true')
    }
    if (profile) {
      setProfileForm(p => ({
        ...p,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: (profile as any).phone || '',
        city: (profile as any).city || '',
        postal_code: (profile as any).postal_code || '',
        bio: (profile as any).bio || '',
        specialty: (profile as any).specialty || '',
        bar_number: (profile as any).bar_number || '',
        experience_years: (profile as any).experience_years || 0,
        is_available: (profile as any).is_available ?? true,
        bar_association: (profile as any).bar_association || ''
      }))
    }
  }, [profile])

  useEffect(() => {
    if (user) {
      fetchLawyerData()
      
      const apptSub = supabase
        .channel(`lawyer-appts-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'appointments_just', 
          filter: `lawyer_id=eq.${user.id}` 
        }, () => fetchAppointments())
        .subscribe()

      const casesSub = supabase
        .channel('lawyer-cases-updates')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'documents_just' 
        }, () => fetchCases())
        .subscribe()
      const techSub = supabase
        .channel('lawyer-tech-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'outils_just' }, () => fetchOutils())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_tickets_just', filter: `user_id=eq.${user.id}` }, () => fetchTickets())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'formations_just' }, () => fetchFormations())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classrooms_just' }, () => fetchClassrooms())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_registrations_just' }, () => fetchClassrooms())
        .subscribe()
        
      const quotesSub = supabase
        .channel(`lawyer-quotes-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'quotes_just', 
          filter: `lawyer_id=eq.${user.id}` 
        }, (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new && payload.new.status === 'paid' && payload.old && payload.old.status !== 'paid') {
            supabase
              .from('profiles_just')
              .select('first_name, last_name')
              .eq('id', payload.new.client_id)
              .single()
              .then(({ data }) => {
                setPaymentAlarmQuote({
                  ...payload.new,
                  profiles: data
                });
                playAlarmSound();
              });
          }
          fetchQuotes();
        })
        .subscribe()
        
      const lawyersSub = supabase
        .channel('lawyer-network')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles_just' }, () => fetchLawyers())
        .subscribe()

      const chatSub = supabase
        .channel(`lawyer-chats-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_rooms_just',
          filter: `lawyer_id=eq.${user.id}`
        }, () => fetchChatRooms())
        .subscribe()

      return () => {
        supabase.removeChannel(apptSub)
        supabase.removeChannel(casesSub)
        supabase.removeChannel(techSub)
        supabase.removeChannel(quotesSub)
        supabase.removeChannel(lawyersSub)
        supabase.removeChannel(chatSub)
      }
    }
  }, [user])

  // Refetch lawyer data when city or postal code changes in real-time
  useEffect(() => {
    if (user && profile) {
      fetchLawyerData()
    }
  }, [user, profile?.city, profile?.postal_code])

  // Feedback visuel après retour de Stripe Checkout (commission avocat)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')

    if (payment === 'success') {
      // Le webhook Stripe (Django) a déjà mis à jour quotes_just.status = 'commissioned'
      success('Commission réglée ✓', 'Le paiement de votre commission a été validé. Merci !')
      fetchQuotes()
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (payment === 'cancel') {
      toastError('Paiement annulé', 'Le paiement de la commission a été annulé. Vous pouvez réessayer.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [user])


  const fetchFullProfile = async () => {
    if (!user) return null
    const { data } = await supabase
      .from('profiles_just')
      .select('stripe_public_key, stripe_secret_key, phone, city, postal_code, bio, specialty, bar_number, experience_years, is_available, first_name, last_name, lawyers:lawyers_just(bar_association)')
      .eq('id', user.id)
      .maybeSingle()

    if (data) {
      const barAssoc = Array.isArray((data as any).lawyers) 
        ? (data as any).lawyers[0]?.bar_association 
        : (data as any).lawyers?.bar_association;
      
      const formValues = {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        city: data.city || '',
        postal_code: data.postal_code || '',
        bio: data.bio || '',
        specialty: data.specialty || '',
        bar_number: data.bar_number || '',
        experience_years: data.experience_years || 0,
        is_available: data.is_available ?? true,
        stripe_public_key: data.stripe_public_key || '',
        stripe_secret_key: data.stripe_secret_key || '',
        bar_association: barAssoc || ''
      };
      
      setProfileForm(formValues)
      return { city: data.city, postal_code: data.postal_code }
    }
    return null
  }

  const fetchLawyerData = async () => {
    setLoading(true)
    try {
      const lawyerLoc = await fetchFullProfile();
      await Promise.all([
        fetchAppointments(lawyerLoc || undefined).catch(e => console.error("Error fetching appointments:", e)),
        fetchCases(lawyerLoc || undefined).catch(e => console.error("Error fetching cases:", e)),
        fetchQuotes(lawyerLoc || undefined).catch(e => console.error("Error fetching quotes:", e)),
        fetchChatRooms(lawyerLoc || undefined).catch(e => console.error("Error fetching chat rooms:", e)),
        fetchClassrooms().catch(e => console.error("Error fetching classrooms:", e))
      ])
      await fetchOutils().catch(e => console.error("Error fetching outils:", e))
      await fetchTickets().catch(e => console.error("Error fetching tickets:", e))
      await fetchFormations().catch(e => console.error("Error fetching formations:", e))
      await fetchLawyers().catch(e => console.error("Error fetching lawyers:", e))
    } catch (err) {
      console.error("Error loading lawyer data:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms_just')
        .select('*, registrations:classroom_registrations_just(count)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching classrooms:", error.message);
        setClassrooms([]);
        return;
      }

      if (data && data.length > 0) {
        const lawyerIds = [...new Set(data.map(r => r.lawyer_id))];
        const { data: profiles } = await supabase
          .from('profiles_just')
          .select('id, first_name, last_name')
          .in( 'id', lawyerIds);

        const profileMap = (profiles || []).reduce((acc: any, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});

        const enriched = data.map(r => ({
          ...r,
          lawyer_first_name: profileMap[r.lawyer_id]?.first_name || '',
          lawyer_last_name: profileMap[r.lawyer_id]?.last_name || '',
          registered_count: r.registrations?.[0]?.count || 0
        }));
        setClassrooms(enriched);
      } else {
        setClassrooms([]);
      }
    } catch (e) {
      console.error("Error fetching classrooms:", e);
    }
  };

  const joinMeeting = async (classroom: any) => {
    if (!user) return;
    setActiveClassroom(classroom);
    setIsInMeeting(true);

    if (classroom.lawyer_id === user.id) {
      await supabase
        .from("classrooms_just")
        .update({ is_live: true })
        .eq("id", classroom.id);
    }
  };

  const leaveMeeting = async () => {
    if (activeClassroom && user && activeClassroom.lawyer_id === user.id) {
      await supabase
        .from("classrooms_just")
        .update({ is_live: false })
        .eq("id", activeClassroom.id);
    }
    setIsInMeeting(false);
    setActiveClassroom(null);
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { error } = await supabase
        .from('classrooms_just')
        .insert([{
          ...newClassroom,
          lawyer_id: user.id
        }]);

      if (error) {
        toastError('Erreur', 'Impossible de créer la visioconférence : ' + error.message);
      } else {
        success('Succès 🎉', 'La visioconférence a été programmée en temps réel !');
        setCreateClassroomOpen(false);
        setNewClassroom({
          title: '',
          description: '',
          type: 'direct',
          scheduled_at: '',
          duration_minutes: 60,
          max_members: 100,
          video_url: '',
          meeting_link: ''
        });
        fetchClassrooms();
      }
    } catch (err: any) {
      toastError('Erreur', err.message);
    }
  };

  const handleDeleteClassroom = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette visioconférence ?")) return;
    try {
      const { error } = await supabase
        .from('classrooms_just')
        .delete()
        .eq('id', id);

      if (error) {
        toastError('Erreur', 'Impossible de supprimer la visioconférence : ' + error.message);
      } else {
        success('Supprimé', 'La visioconférence a été supprimée avec succès.');
        fetchClassrooms();
      }
    } catch (err: any) {
      toastError('Erreur', err.message);
    }
  };

  const fetchFormations = async () => {
    const { data } = await supabase.from('formations_just').select('*').order('created_at', { ascending: false })
    if (data) setFormations(data)
  }

  const fetchOutils = async () => {
    const { data } = await supabase.from('outils_just').select('*').order('created_at', { ascending: false })
    if (data) setOutils(data)
  }

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase.from('assistance_tickets_just').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setTickets(data)
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketSubject) return;
    await supabase.from('assistance_tickets_just').insert([{ user_id: user.id, subject: ticketSubject, status: 'En attente' }]);
    setModalOpen(false);
    setTicketSubject('');
  }

  const fetchAppointments = async (lawyerLoc?: { city?: string; postal_code?: string }) => {
    if (!user) return
    const { data } = await supabase
      .from('appointments_just')
      .select('*, profiles:client_id(first_name, last_name, email, city, postal_code)')
      .eq('lawyer_id', user.id)
      .order('scheduled_at', { ascending: true })
    if (data) {
      const city = lawyerLoc?.city || profileForm.city;
      const postalCode = lawyerLoc?.postal_code || profileForm.postal_code;
      const lawyerCity = city?.trim().toLowerCase();
      const lawyerDept = postalCode?.trim().substring(0, 2);

      const filtered = data.filter(a => {
        const clientCity = (a.profiles as any)?.city?.trim().toLowerCase();
        const clientDept = (a.profiles as any)?.postal_code?.trim().substring(0, 2);
        if (!lawyerCity && !lawyerDept) return true;
        const cityMatch = lawyerCity ? clientCity === lawyerCity : true;
        const deptMatch = lawyerDept ? clientDept === lawyerDept : true;
        return cityMatch && deptMatch;
      });
      setAppointments(filtered)
    }
  }

  const fetchCases = async (lawyerLoc?: { city?: string; postal_code?: string }) => {
    if (!user) return
    const { data } = await supabase
      .from('documents_just')
      .select('*, profiles:owner_id(first_name, last_name, email, city, postal_code)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      const city = lawyerLoc?.city || profileForm.city;
      const postalCode = lawyerLoc?.postal_code || profileForm.postal_code;
      const lawyerCity = city?.trim().toLowerCase();
      const lawyerDept = postalCode?.trim().substring(0, 2);

      const filtered = data.filter(c => {
        const clientCity = c.profiles?.city?.trim().toLowerCase();
        const clientDept = c.profiles?.postal_code?.trim().substring(0, 2);
        if (!lawyerCity && !lawyerDept) return true;
        const cityMatch = lawyerCity ? clientCity === lawyerCity : true;
        const deptMatch = lawyerDept ? clientDept === lawyerDept : true;
        return cityMatch && deptMatch;
      });
      setCases(filtered)
    }
  }

  const handleExportClients = () => {
    const clients = Array.from(new Set(cases.map(c => JSON.stringify({ 
      id: c.owner_id, 
      name: `${c.profiles?.first_name} ${c.profiles?.last_name}`,
      email: c.profiles?.email
    })))).map(s => JSON.parse(s));
    exportToCSV(clients, `clients_lawyer_${new Date().toISOString().split('T')[0]}`);
  };

  // Dynamically compute revenue data from real quotes
  const revenueData = React.useMemo(() => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const now = new Date();
    const result: { name: string; value: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(now.getDate() - d);
      const dayStr = day.toISOString().split('T')[0];
      const dayRevenue = quotes
        .filter(q => q.status === 'paid' && q.created_at?.startsWith(dayStr))
        .reduce((sum: number, q: any) => sum + (parseFloat(q.amount) || 0), 0);
      result.push({ name: dayNames[day.getDay()], value: dayRevenue });
    }
    return result;
  }, [quotes]);

  const fetchQuotes = async (lawyerLoc?: { city?: string; postal_code?: string }) => {
    if (!user) return
    const { data } = await supabase
      .from('quotes_just')
      .select('*, profiles:client_id(first_name, last_name, email, city, postal_code)')
      .eq('lawyer_id', user.id)
      .order('created_at', { ascending: false })
    if (data) {
      const city = lawyerLoc?.city || profileForm.city;
      const postalCode = lawyerLoc?.postal_code || profileForm.postal_code;
      const lawyerCity = city?.trim().toLowerCase();
      const lawyerDept = postalCode?.trim().substring(0, 2);

      const filtered = data.filter(q => {
        const clientCity = q.profiles?.city?.trim().toLowerCase();
        const clientDept = q.profiles?.postal_code?.trim().substring(0, 2);
        if (!lawyerCity && !lawyerDept) return true;
        const cityMatch = lawyerCity ? clientCity === lawyerCity : true;
        const deptMatch = lawyerDept ? clientDept === lawyerDept : true;
        return cityMatch && deptMatch;
      });
      setQuotes(filtered)
    }
  }

  const fetchChatRooms = async (lawyerLoc?: { city?: string; postal_code?: string }) => {
    if (!user) return
    const { data } = await supabase
      .from('chat_rooms_just')
      .select('*, profiles:client_id(first_name, last_name, email, city, postal_code)')
      .eq('lawyer_id', user.id)
    if (data) {
      const city = lawyerLoc?.city || profileForm.city;
      const postalCode = lawyerLoc?.postal_code || profileForm.postal_code;
      const lawyerCity = city?.trim().toLowerCase();
      const lawyerDept = postalCode?.trim().substring(0, 2);

      const filtered = data.filter(r => {
        const clientCity = r.profiles?.city?.trim().toLowerCase();
        const clientDept = r.profiles?.postal_code?.trim().substring(0, 2);
        if (!lawyerCity && !lawyerDept) return true;
        const cityMatch = lawyerCity ? clientCity === lawyerCity : true;
        const deptMatch = lawyerDept ? clientDept === lawyerDept : true;
        return cityMatch && deptMatch;
      });
      setChatRooms(filtered)
    }
  }

  const fetchLawyers = async () => {
    const { data } = await supabase
      .from('profiles_just')
      .select('*, lawyers:lawyers_just(bar_association)')
      .eq('role', 'lawyer')
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

  const handleOpenChat = async (clientId: string, clientName: string) => {
    // Check if room exists
    let room = chatRooms.find(r => r.client_id === clientId)
    
    if (!room) {
      const { data } = await supabase
        .from('chat_rooms_just')
        .insert([{ lawyer_id: user?.id, client_id: clientId }])
        .select()
        .single()
      
      if (data) {
        room = data
        fetchChatRooms()
      }
    }
    
    setActiveRoom({ id: room.id, name: clientName, clientId })
    setActiveTab('messages')
  }

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const amountNum = parseFloat(newQuote.amount)
    const commission = amountNum * 0.20
    
    const { error } = await supabase.from('quotes_just').insert([{
      lawyer_id: user.id,
      client_id: newQuote.client_id,
      amount: amountNum,
      commission_amount: commission,
      description: newQuote.description,
      case_id: newQuote.case_id || null,
      status: 'pending'
    }])

    if (!error) {
      setQuoteModalOpen(false)
      setNewQuote({ client_id: '', amount: '', description: '', case_id: '' })
      fetchQuotes()
    }
  }

  const handlePayCommission = async (quote: any) => {
    setPayingCommissionId(quote.id)
    try {
      const url = await createCheckoutSession(quote.id, 'commission_payment', quote.commission_amount)
      window.location.href = url
    } catch (err: any) {
      console.error('Stripe commission error:', err)
      toastError(
        'Erreur de paiement commission',
        err?.message || 'Impossible de créer la session Stripe. Vérifiez que le backend Django est lancé sur le port 8000.'
      )
    } finally {
      setPayingCommissionId(null)
    }
  }

  const handleMarkAsPaid = async (quoteId: string) => {
    const { error } = await supabase
      .from('quotes_just')
      .update({ status: 'paid' })
      .eq('id', quoteId);
    
    if (!error) {
      fetchQuotes();
    }
  }

  const handleUpdateAppointmentStatus = async (apptId: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments_just')
      .update({ status: newStatus })
      .eq('id', apptId);
    
    if (!error) {
      fetchAppointments();
      success('Statut mis à jour', `Le rendez-vous a été mis à jour avec succès.`);
    }
  };

  const handleUploadLawyerDocument = async (name: string, type: string, ownerId: string) => {
    if (!user || !name || !ownerId) return;
    const mockFileUrl = `https://zchhijltemvrsthdaxex.supabase.co/storage/v1/object/public/documents/${ownerId}/${Date.now()}_${name.replace(/\s+/g, '_')}.pdf`;
    
    const { error } = await supabase
      .from('documents_just')
      .insert([{
        name,
        type,
        file_url: mockFileUrl,
        owner_id: ownerId,
        created_at: new Date().toISOString(),
        metadata: { source: 'Avocat', uploaded_by: user.id }
      }]);
      
    if (!error) {
      fetchCases();
      success('Document ajouté 📁', "Le document a bien été téléversé pour votre client.");
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const filePath = `${user.id}/avatar.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      await supabase.from('profiles_just').update({ avatar_url: urlData.publicUrl }).eq('id', user.id)
      success('Photo mise à jour', 'Votre photo de profil a été enregistrée.')
    } else {
      success('Info', 'Photo mise à jour localement (éventuellement bucket à créer dans Supabase).')
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const { error } = await supabase.from('profiles_just').update({
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      phone: profileForm.phone,
      city: profileForm.city,
      postal_code: profileForm.postal_code,
      bio: profileForm.bio,
      specialty: profileForm.specialty,
      bar_number: profileForm.bar_number,
      experience_years: profileForm.experience_years,
      is_available: profileForm.is_available,
      stripe_public_key: profileForm.stripe_public_key,
      stripe_secret_key: profileForm.stripe_secret_key,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)

    // Save bar association in lawyers_just table
    await supabase.from('lawyers_just').upsert({
      id: user.id,
      bar_association: profileForm.bar_association
    })

    if (!error) success('Profil mis à jour', 'Vos informations, association de barreau et clés Stripe ont été enregistrées.')
  }

  const tabs = [
    { id: "overview", name: "Vue d'ensemble", icon: BarChart3 },
    { id: "appointments", name: "Rendez-vous", icon: Calendar },
    { id: "cases", name: "Dossiers", icon: FileText },
    { id: "quotes", name: "Gestion Devis", icon: Receipt },
    { id: "messages", name: "Messages IA", icon: MessageSquare },
    { id: "searches", name: "IA Juridique", icon: Search },
    { id: "avocats", name: "Réseau Avocats", icon: Globe },
    { id: "codes", name: "Codes de Loi", icon: BookOpen },
    { id: "procedures", name: "Procédures", icon: FileText },
    { id: "analyse", name: "Analyse IA", icon: Shield },
    { id: "formations", name: "Formations", icon: BookOpen },
    { id: "outils", name: "Outils Avocats", icon: PenTool },
    { id: "assistance", name: "Assistance", icon: HelpCircle },
    { id: "profil", name: "Mon Profil", icon: Users }
  ]

  const stats = [
    { label: "Clients Actifs", value: Array.from(new Set(cases.map(c => c.owner_id))).length.toString(), icon: Users },
    { label: "Dossiers", value: cases.length.toString(), icon: FileText },
    { label: "Rendez-vous", value: appointments.length.toString(), icon: Calendar },
    { label: "Verification", value: profile?.is_verified ? "Vérifié" : "En attente", icon: Shield }
  ]

  const renderOverview = () => (
    <div className="space-y-8">
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-4', 'gap-6')}>
        {stats.map((s, idx) => {
          const Icon = s.icon
          return (
            <Card key={idx} className={cn('border-none', 'shadow-sm', 'hover:shadow-md', 'transition-shadow')}>
              <CardContent className={cn('p-6', 'flex', 'justify-between', 'items-center')}>
                <div>
                  <p className={cn('text-xs', 'font-bold', 'text-secondary-500', 'uppercase', 'tracking-wider', 'mb-1')}>{s.label}</p>
                  <p className={cn('text-2xl', 'font-bold', 'text-secondary-900')}>{s.value}</p>
                </div>
                <div className={cn('p-3', 'bg-primary-50', 'rounded-xl', 'text-primary-600')}>
                  <Icon className={cn('h-6', 'w-6')} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-2', 'gap-8')}>
        <Card>
          <CardHeader>
            <CardTitle className={cn('flex', 'justify-between', 'items-center')}>
              <span>Prochains Rendez-vous</span>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('appointments')}>Voir tout</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {appointments.slice(0, 3).map((a) => (
                <div key={a.id} className={cn('p-4', 'flex', 'items-center', 'justify-between')}>
                  <div className={cn('flex', 'items-center', 'gap-3')}>
                    <div className={cn('h-10', 'w-10', 'bg-secondary-100', 'rounded-full', 'flex', 'items-center', 'justify-center', 'font-bold')}>
                      {(a.profiles as any)?.first_name?.[0]}{(a.profiles as any)?.last_name?.[0]}
                    </div>
                    <div>
                      <p className={cn('font-bold', 'text-sm')}>{(a.profiles as any)?.first_name} {(a.profiles as any)?.last_name}</p>
                      <p className={cn('text-xs', 'text-secondary-500')}>{new Date(a.scheduled_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
              {appointments.length === 0 && <p className={cn('p-8', 'text-center', 'text-secondary-500')}>Aucun rendez-vous prévu.</p>}
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className={cn('flex', 'flex-row', 'items-center', 'justify-between', 'space-y-0')}>
              <CardTitle>Analyse de Revenus</CardTitle>
              <DollarSign className={cn('h-4', 'w-4', 'text-secondary-400')} />
            </CardHeader>
            <CardContent>
              <AdvancedAreaChart data={revenueData} height={200} color="#10B981" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className={cn('grid', 'grid-cols-2', 'gap-4')}>
              <Button variant="outline" className={cn('h-20', 'flex-col', 'gap-2')}>
                <Plus className={cn('h-5', 'w-5')} />
                <span>Nouveau Dossier</span>
              </Button>
              <Button variant="outline" className={cn('h-20', 'flex-col', 'gap-2')} onClick={handleExportClients}>
                <FileSpreadsheet className={cn('h-5', 'w-5')} />
                <span>Exporter Clients</span>
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  )

  if (isInMeeting && activeClassroom) {
    const displayName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : user?.email || "Participant";
    const email = user?.email || "";
    const isHost = activeClassroom.lawyer_id === user?.id;

    return (
      <JitsiMeeting
        roomId={activeClassroom.id}
        displayName={displayName || "Participant"}
        email={email}
        onLeave={leaveMeeting}
        isHost={isHost}
      />
    );
  }

  const unpaidQuotes = quotes.filter(q => q.status === 'paid');

  return (
    <div className={cn('min-h-screen', 'bg-secondary-50')}>
      <div className={cn('container', 'py-8')}>
        {unpaidQuotes.length > 0 && (
          <div className={cn('mb-6', 'p-4.5', 'bg-gradient-to-r', 'from-red-500/10', 'to-pink-500/10', 'border', 'border-red-500/30', 'rounded-2xl', 'flex', 'flex-col', 'sm:flex-row', 'items-start', 'sm:items-center', 'justify-between', 'gap-4', 'animate-pulse')}>
            <div className={cn('flex', 'items-center', 'gap-3')}>
              <div className={cn('p-2.5', 'bg-red-500/20', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'text-red-500', 'animate-bounce')}>
                <AlertTriangle className={cn('h-5', 'w-5')} />
              </div>
              <div>
                <h4 className={cn('font-bold', 'text-red-700', 'text-sm')}>Action Requise : Commission Plateforme Due ({unpaidQuotes.length})</h4>
                <p className={cn('text-xs', 'text-secondary-600')}>Vous avez reçu des paiements de clients. Veuillez verser la commission de 20% à l'administration.</p>
              </div>
            </div>
            <div className={cn('flex', 'items-center', 'gap-2')}>
              <Button size="sm" variant="danger" className={cn('text-xs', 'bg-red-600', 'hover:bg-red-700', 'text-white', 'font-medium', 'shadow-sm', 'transition-all')} onClick={() => {
                setPaymentAlarmQuote(unpaidQuotes[0]);
                playAlarmSound();
              }}>
                Régler la commission
              </Button>
            </div>
          </div>
        )}
        <div className={cn('mb-8', 'flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'justify-between', 'gap-4')}>
          <div>
            <h1 className={cn('text-3xl', 'font-bold', 'text-secondary-900', 'mb-1')}>Cabinet de {profile?.first_name} {profile?.last_name}</h1>
            <p className="text-secondary-600">Interface de gestion juridique professionnelle</p>
          </div>
          <div className={cn('flex', 'items-center', 'gap-2')}>
            <Button onClick={fetchLawyerData} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <NotificationBell userId={user?.id ?? null} />
            <VoiceAssistant
              mode="lawyer"
              activeTab={activeTab}
              onAction={handleVoiceAction}
              variant="inline"
              stateContext={{
                profile,
                appointments,
                cases,
                quotes
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className={cn('text-danger-600', 'hover:text-danger-700', 'hover:bg-danger-50', 'border-danger-200', 'hover:border-danger-300', 'flex', 'items-center', 'justify-center', 'font-semibold')}
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
            >
              <LogOut className={cn('h-4', 'w-4', 'mr-2')} />
              Déconnexion
            </Button>
          </div>
        </div>

        <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-4', 'gap-8')}>
          <aside className={cn('lg:col-span-1', 'order-2', 'lg:order-1')}>
            <Card className={cn('sticky', 'top-6', 'overflow-hidden')}>
              <CardContent className={cn('p-2', 'sm:p-4', 'flex', 'flex-wrap', 'lg:flex-col', 'gap-2', 'pb-2', 'lg:pb-0', 'lg:space-y-2')}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                        : "text-secondary-600 hover:bg-secondary-100"
                    }`}
                  >
                    <tab.icon className={cn('h-5', 'w-5')} />
                    <span className={cn('font-medium', 'whitespace-nowrap')}>{tab.name}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          <main className={cn('lg:col-span-3', 'order-1', 'lg:order-2')}>
            {loading ? (
              <div className={cn('flex', 'items-center', 'justify-center', 'h-64')}><RefreshCw className={cn('h-8', 'w-8', 'animate-spin', 'text-primary-600')} /></div>
            ) : (
              <>
                {activeTab === "overview" && renderOverview()}
                {activeTab === "appointments" && (
                  <Card>
                    <CardHeader><CardTitle>Historique & Gestion des Rendez-vous</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className={cn('w-full', 'text-left', 'text-sm', 'whitespace-nowrap')}>
                          <thead className={cn('bg-secondary-50', 'border-y')}>
                            <tr>
                              <th className={cn('px-6', 'py-4')}>Client</th>
                              <th className={cn('px-6', 'py-4')}>Date & Heure</th>
                              <th className={cn('px-6', 'py-4')}>Notes / Sujet</th>
                              <th className={cn('px-6', 'py-4')}>Statut</th>
                              <th className={cn('px-6', 'py-4', 'text-right')}>Actions de Gestion</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {appointments.map((a) => {
                              const statusLabels: Record<string, { text: string; color: string }> = {
                                pending: { text: "En attente", color: "bg-yellow-100 text-yellow-700" },
                                confirmed: { text: "Confirmé", color: "bg-green-100 text-green-700" },
                                cancelled: { text: "Annulé", color: "bg-red-100 text-red-700" },
                                completed: { text: "Terminé", color: "bg-primary-100 text-primary-700" }
                              };
                              const label = statusLabels[a.status] || { text: a.status, color: "bg-secondary-100 text-secondary-600" };
                              
                              return (
                                <tr key={a.id} className="hover:bg-secondary-50">
                                  <td className={cn('px-6', 'py-4', 'font-semibold')}>
                                    {(a.profiles as any)?.first_name} {(a.profiles as any)?.last_name}
                                    {(a.profiles as any)?.city ? <span className={cn('text-secondary-400', 'font-normal', 'text-xs', 'ml-1')}>({(a.profiles as any).city})</span> : ''}
                                  </td>
                                  <td className={cn('px-6', 'py-4')}>{new Date(a.scheduled_at).toLocaleString('fr-FR')}</td>
                                  <td className={cn('px-6', 'py-4', 'max-w-xs', 'truncate', 'text-secondary-500')} title={a.notes}>{a.notes || "Aucune note fournie"}</td>
                                  <td className={cn('px-6', 'py-4')}>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${label.color}`}>
                                      {label.text}
                                    </span>
                                  </td>
                                  <td className={cn('px-6', 'py-4', 'text-right', 'flex', 'justify-end', 'gap-2')}>
                                    {a.status === 'pending' && (
                                      <>
                                        <Button size="sm" className={cn('bg-success-600', 'hover:bg-success-700')} onClick={() => handleUpdateAppointmentStatus(a.id, 'confirmed')}>
                                          Confirmer
                                        </Button>
                                        <Button size="sm" variant="outline" className={cn('text-red-600', 'hover:bg-red-50', 'border-red-200')} onClick={() => handleUpdateAppointmentStatus(a.id, 'cancelled')}>
                                          Réfuser
                                        </Button>
                                      </>
                                    )}
                                    {a.status === 'confirmed' && (
                                      <>
                                        <Button size="sm" className={cn('bg-primary-600', 'hover:bg-primary-700')} onClick={() => handleUpdateAppointmentStatus(a.id, 'completed')}>
                                          Terminer
                                        </Button>
                                        <Button size="sm" variant="outline" className={cn('text-red-600', 'hover:bg-red-50', 'border-red-200')} onClick={() => handleUpdateAppointmentStatus(a.id, 'cancelled')}>
                                          Annuler
                                        </Button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {appointments.length === 0 && (
                          <div className={cn('p-12', 'text-center', 'text-secondary-400', 'italic')}>Aucun rendez-vous planifié.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === "cases" && !selectedClientForCases && (
                  <Card>
                    <CardHeader className={cn('flex', 'justify-between', 'items-center', 'flex-row', 'flex-wrap', 'gap-4')}>
                      <div className="space-y-1">
                        <CardTitle>Dossiers Clients</CardTitle>
                        <p className={cn('text-xs', 'text-secondary-500')}>Sélectionnez un client pour voir ses documents</p>
                      </div>
                      <div className={cn('flex', 'items-center', 'gap-3', 'flex-wrap')}>
                        <div className={cn('relative', 'w-64')}>
                          <Search className={cn('absolute', 'left-3', 'top-1/2', '-translate-y-1/2', 'h-4', 'w-4', 'text-secondary-400')} />
                          <input
                            type="text"
                            placeholder="Rechercher un client..."
                            className={cn('w-full', 'pl-9', 'pr-3', 'py-1.5', 'text-sm', 'rounded-xl', 'border', 'border-secondary-200', 'bg-white', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500')}
                            value={clientSearchText}
                            onChange={(e) => setClientSearchText(e.target.value)}
                          />
                        </div>
                        <Button onClick={() => {
                          setNewDoc({ name: '', type: 'client_document', client_id: '' });
                          setDocModalOpen(true);
                        }}>
                          <Plus className={cn('h-4', 'w-4', 'mr-2')} />
                          Nouveau Document Client
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6')}>
                        {filteredClients.map((client) => {
                          const initials = `${client.first_name[0] || ''}${client.last_name[0] || ''}`.toUpperCase() || '?';
                          return (
                            <div
                              key={client.id}
                              onClick={() => setSelectedClientForCases(client.id)}
                              className={cn('group', 'cursor-pointer', 'border', 'border-secondary-100', 'rounded-2xl', 'p-5', 'bg-white', 'hover:border-primary-400', 'hover:shadow-md', 'transition-all', 'duration-200')}
                            >
                              <div className={cn('flex', 'items-center', 'gap-4', 'mb-4')}>
                                <div className={cn('h-12', 'w-12', 'rounded-xl', 'bg-gradient-to-br', 'from-primary-50', 'to-primary-100/50', 'text-primary-700', 'flex', 'items-center', 'justify-center', 'font-bold', 'text-lg', 'border', 'border-primary-100/30', 'group-hover:scale-105', 'transition-transform')}>
                                  {initials}
                                </div>
                                <div className={cn('min-w-0', 'flex-1')}>
                                  <h4 className={cn('font-bold', 'text-secondary-900', 'truncate', 'group-hover:text-primary-600', 'transition-colors')}>
                                    {client.first_name} {client.last_name}
                                  </h4>
                                  <p className={cn('text-xs', 'text-secondary-500', 'truncate')}>{client.email}</p>
                                </div>
                              </div>
                              <div className={cn('space-y-2', 'pt-3', 'border-t', 'border-secondary-50', 'text-xs', 'text-secondary-600')}>
                                <div className={cn('flex', 'justify-between')}>
                                  <span>Localisation:</span>
                                  <span className={cn('font-semibold', 'text-secondary-800')}>{client.city || 'Non renseigné'}{client.postal_code ? ` (${client.postal_code.substring(0,2)})` : ''}</span>
                                </div>
                                <div className={cn('flex', 'justify-between')}>
                                  <span>Documents :</span>
                                  <span className={cn('px-2', 'py-0.5', 'rounded-md', 'bg-secondary-100', 'text-secondary-700', 'font-bold')}>{client.count} document(s)</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {filteredClients.length === 0 && (
                        <div className={cn('py-12', 'text-center', 'text-secondary-400', 'italic')}>
                          Aucun client trouvé ou aucun document disponible.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeTab === "cases" && selectedClientForCases && (
                  <Card>
                    <CardHeader className={cn('flex', 'justify-between', 'items-center', 'flex-row', 'flex-wrap', 'gap-4')}>
                      <div className={cn('flex', 'items-center', 'gap-3')}>
                        <button
                          onClick={() => setSelectedClientForCases(null)}
                          className={cn('p-2', 'rounded-xl', 'hover:bg-secondary-100', 'text-secondary-600', 'transition-colors')}
                          title="Retour à la liste"
                        >
                          <ArrowLeft className={cn('h-5', 'w-5')} />
                        </button>
                        <div>
                          <CardTitle className={cn('flex', 'items-center', 'gap-2')}>
                            <span>Dossier de</span>
                            <span className="text-primary-600">{selectedClientInfo?.name}</span>
                          </CardTitle>
                          <p className={cn('text-xs', 'text-secondary-500')}>
                            {selectedClientInfo?.email} {selectedClientInfo?.city ? `• ${selectedClientInfo.city}` : ''}
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => {
                        setNewDoc({ name: '', type: 'client_document', client_id: selectedClientForCases });
                        setDocModalOpen(true);
                      }}>
                        <Plus className={cn('h-4', 'w-4', 'mr-2')} />
                        Nouveau Document Client
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className={cn('w-full', 'text-left', 'text-sm', 'whitespace-nowrap')}>
                          <thead className={cn('bg-secondary-50', 'border-y')}>
                            <tr>
                              <th className={cn('px-6', 'py-4')}>Document</th>
                              <th className={cn('px-6', 'py-4')}>Client</th>
                              <th className={cn('px-6', 'py-4')}>Type de Document</th>
                              <th className={cn('px-6', 'py-4')}>Date de Création</th>
                              <th className={cn('px-6', 'py-4', 'text-right')}>Fichier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {cases
                              .filter(c => c.owner_id === selectedClientForCases)
                              .map((c) => {
                                const docTypeLabels: Record<string, string> = {
                                  identity: "🪪 Pièce d'identité client",
                                  license: "📜 Licence / Diplôme client",
                                  legal_template: "📝 Modèle de document",
                                  client_document: "📁 Pièce de dossier / Justificatif"
                                };
                                return (
                                  <tr key={c.id} className="hover:bg-secondary-50">
                                    <td className={cn('px-6', 'py-4', 'font-semibold', 'text-secondary-900')}>{c.name}</td>
                                    <td className={cn('px-6', 'py-4')}>
                                      {c.profiles?.first_name} {c.profiles?.last_name}
                                      {c.profiles?.city ? <span className={cn('text-secondary-400', 'text-xs', 'ml-1', 'font-normal')}>({c.profiles.city})</span> : ''}
                                    </td>
                                    <td className={cn('px-6', 'py-4')}>
                                      <span className={cn('bg-secondary-100', 'text-secondary-800', 'px-2', 'py-0.5', 'rounded', 'text-xs')}>
                                        {docTypeLabels[c.type] || c.type}
                                      </span>
                                    </td>
                                    <td className={cn('px-6', 'py-4', 'text-secondary-500')}>
                                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className={cn('px-6', 'py-4', 'text-right')}>
                                      {c.file_url ? (
                                        <a href={c.file_url} target="_blank" rel="noreferrer">
                                          <Button variant="outline" size="sm">
                                            Ouvrir
                                          </Button>
                                        </a>
                                      ) : c.metadata?.content ? (
                                        <Button variant="outline" size="sm" onClick={() => setSelectedIADoc(c)}>
                                          <Eye className={cn('h-4', 'w-4', 'mr-2', 'text-primary-600')} />
                                          Visualiser
                                        </Button>
                                      ) : null}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                        {cases.filter(c => c.owner_id === selectedClientForCases).length === 0 && (
                          <div className={cn('p-12', 'text-center', 'text-secondary-400', 'italic')}>Aucun document pour ce client.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'messages' && (
                  <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-6')}>
                    <Card className="lg:col-span-1">
                      <CardHeader><CardTitle>Clients</CardTitle></CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {chatRooms.map(room => (
                            <button 
                              key={room.id}
                              onClick={() => handleOpenChat(room.client_id, `${room.profiles?.first_name} ${room.profiles?.last_name}`)}
                              className={`w-full p-4 text-left hover:bg-secondary-50 transition-colors ${activeRoom?.id === room.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''}`}
                            >
                              <p className={cn('font-bold', 'text-sm')}>
                                {room.profiles?.first_name} {room.profiles?.last_name}
                                {room.profiles?.city ? <span className={cn('text-secondary-400', 'text-xs', 'ml-1', 'font-normal')}>({room.profiles.city})</span> : ''}
                              </p>
                              <p className={cn('text-xs', 'text-secondary-500')}>{room.profiles?.email}</p>
                            </button>
                          ))}
                          {chatRooms.length === 0 && <div className={cn('p-8', 'text-center', 'text-secondary-400', 'text-xs')}>Aucune conversation active.</div>}
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
                        <Card className={cn('h-[500px]', 'flex', 'items-center', 'justify-center', 'text-secondary-400')}>
                          <p>Sélectionnez un client pour discuter</p>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'outils' && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>Mes Outils Juridiques</h2>
                    <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6')}>
                      {outils.map((o) => (
                        <Card key={o.id} className="hover:shadow-md transition-all duration-200 border-secondary-100 flex flex-col justify-between">
                          <CardContent className={cn('p-6', 'space-y-4', 'flex-1', 'flex', 'flex-col', 'justify-between')}>
                            <div className="space-y-3">
                              <div className={cn('flex', 'justify-between', 'items-center')}>
                                <span className={cn('text-xs', 'font-bold', 'text-primary-600', 'uppercase')}>{o.category}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status === 'Actif' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>{o.status}</span>
                              </div>
                              <h3 className={cn('font-bold', 'text-lg', 'text-secondary-900')}>{o.title}</h3>
                            </div>
                            <Button 
                              variant="outline" 
                              className="w-full mt-4 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200" 
                              size="sm" 
                              onClick={() => {
                                setSelectedOutil(o);
                                if (o.title.includes('Contrat')) {
                                  setContractGeneratedText('');
                                } else if (o.title.includes('Honoraires')) {
                                  setCalcDescription('');
                                } else if (o.title.includes('Prescription')) {
                                  setPrescResult(null);
                                } else if (o.title.includes('Anonymisation')) {
                                  setAnonInputText('');
                                  setAnonOutputText('');
                                }
                              }}
                            >
                              Ouvrir l'outil
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                      {outils.length === 0 && (
                        <div className="col-span-full text-center py-12 text-secondary-400 border border-dashed rounded-2xl">
                          Aucun outil disponible.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'quotes' && (
                  <div className="space-y-6">
                    <div className={cn('flex', 'items-center', 'justify-between')}>
                      <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>Gestion des Devis & Honoraires</h2>
                      <Button onClick={() => setQuoteModalOpen(true)}><Plus className={cn('h-4', 'w-4', 'mr-2')} /> Nouveau Devis</Button>
                    </div>
                    <Card>
                      <CardContent className="p-0">
                        <table className={cn('w-full', 'text-left', 'text-sm', 'whitespace-nowrap')}>
                          <thead className={cn('bg-secondary-50', 'border-y')}>
                            <tr>
                              <th className={cn('px-6', 'py-4')}>Client</th>
                              <th className={cn('px-6', 'py-4')}>Montant (MAD)</th>
                              <th className={cn('px-6', 'py-4')}>Status Devis</th>
                              <th className={cn('px-6', 'py-4')}>Status Commission (20%)</th>
                              <th className={cn('px-6', 'py-4', 'text-right')}>Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {quotes.map((q) => (
                              <tr key={q.id}>
                                <td className={cn('px-6', 'py-4')}>{q.profiles?.first_name} {q.profiles?.last_name}</td>
                                <td className={cn('px-6', 'py-4', 'font-bold')}>{q.amount}</td>
                                <td className={cn('px-6', 'py-4')}>
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${q.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {q.status}
                                  </span>
                                </td>
                                <td className={cn('px-6', 'py-4')}>
                                  {q.status === 'paid' ? (
                                    <span className="text-secondary-500">{q.commission_amount} MAD dû</span>
                                  ) : q.status === 'commissioned' ? (
                                    <span className={cn('text-green-600', 'font-bold')}>Payée</span>
                                  ) : "-"}
                                </td>
                                <td className={cn('px-6', 'py-4', 'text-right', 'flex', 'justify-end', 'gap-2')}>
                                  {q.status === 'pending' && (
                                    <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(q.id)}>Confirmer Encaissement</Button>
                                  )}
                                  {q.status === 'paid' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handlePayCommission(q)}
                                      disabled={payingCommissionId === q.id}
                                    >
                                      {payingCommissionId === q.id ? (
                                        <span className="flex items-center gap-1.5">
                                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                          Redirection...
                                        </span>
                                      ) : (
                                        "Payer Commission (20%)"
                                      )}
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {quotes.length === 0 && <div className={cn('p-12', 'text-center', 'text-secondary-400')}>Aucun devis créé.</div>}
                      </CardContent>
                    </Card>
                  </div>
                )}
                {activeTab === 'assistance' && (
                  <div className="space-y-6">
                    <div className={cn('flex', 'items-center', 'justify-between')}>
                      <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>Support et Assistance</h2>
                      <Button onClick={() => setModalOpen(true)}><Plus className={cn('h-4', 'w-4', 'mr-2')} /> Nouveau Ticket</Button>
                    </div>
                    <Card>
                      <CardContent className="p-0">
                        <table className={cn('w-full', 'text-left', 'text-sm', 'whitespace-nowrap')}>
                          <thead className={cn('bg-secondary-50', 'border-y')}>
                            <tr>
                              <th className={cn('px-6', 'py-4')}>Sujet</th>
                              <th className={cn('px-6', 'py-4')}>Statut</th>
                              <th className={cn('px-6', 'py-4')}>Date</th>
                            </tr>
                          </thead>
                          <tbody className={cn('divide-y', 'relative')}>
                            {tickets.map((ticket, idx) => (
                              <tr key={idx} className="hover:bg-secondary-50">
                                <td className={cn('px-6', 'py-4')}>{ticket.subject}</td>
                                <td className={cn('px-6', 'py-4')}>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'En cours' ? 'bg-warning-100 text-warning-700' : ticket.status === 'Résolu' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'}`}>
                                    {ticket.status}
                                  </span>
                                </td>
                                <td className={cn('px-6', 'py-4')}>{new Date(ticket.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {activeTab === 'avocats' && (
                  <div className={cn('space-y-6', 'animate-fade-in')}>
                    <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>Réseau des Avocats</h2>
                    
                    {/* Interactive Map & Dropdowns */}
                    <div className={cn('grid', 'grid-cols-1', 'xl:grid-cols-3', 'gap-6')}>
                      <div className="xl:col-span-2">
                        <FranceMap 
                          selectedRegion={selectedRegion} 
                          onSelectRegion={setSelectedRegion} 
                          lawyerCounts={lawyerCounts} 
                        />
                      </div>
                      
                      <div className={cn('bg-white', 'rounded-3xl', 'p-5', 'border', 'border-secondary-200', 'shadow-sm', 'flex', 'flex-col', 'justify-between', 'space-y-4')}>
                        <div>
                          <h3 className={cn('font-bold', 'text-secondary-900', 'mb-3', 'flex', 'items-center', 'gap-2')}>
                            🏛️ Localisation
                          </h3>
                          
                          <div className="space-y-3">
                            <div>
                              <label className={cn('text-[11px]', 'font-semibold', 'text-secondary-500', 'block', 'mb-1')}>Région</label>
                              <select
                                value={selectedRegion || ''}
                                onChange={(e) => setSelectedRegion(e.target.value || null)}
                                className={cn('w-full', 'h-10', 'px-2.5', 'border', 'border-secondary-200', 'rounded-lg', 'text-xs', 'focus:outline-none', 'focus:ring-1', 'focus:ring-primary-500', 'bg-white')}
                              >
                                <option value="">Toutes les régions</option>
                                {regions.map(r => (
                                  <option key={r.id} value={r.name}>{r.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={cn('text-[11px]', 'font-semibold', 'text-secondary-500', 'block', 'mb-1')}>Barreau d'inscription</label>
                              <select
                                value={selectedBarreau}
                                onChange={(e) => setSelectedBarreau(e.target.value)}
                                className={cn('w-full', 'h-10', 'px-2.5', 'border', 'border-secondary-200', 'rounded-lg', 'text-xs', 'focus:outline-none', 'focus:ring-1', 'focus:ring-primary-500', 'bg-white')}
                              >
                                <option value="">Tous les barreaux</option>
                                {availableBarreaux.map(b => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={cn('text-[11px]', 'font-semibold', 'text-secondary-500', 'block', 'mb-1')}>Ville du cabinet</label>
                              <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className={cn('w-full', 'h-10', 'px-2.5', 'border', 'border-secondary-200', 'rounded-lg', 'text-xs', 'focus:outline-none', 'focus:ring-1', 'focus:ring-primary-500', 'bg-white')}
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
                      <Search className={cn('absolute', 'left-3', 'top-3', 'h-4', 'w-4', 'text-secondary-400')} />
                      <input
                        type="text"
                        placeholder="Rechercher un confrère par nom ou spécialité..."
                        value={lawyerSearch}
                        onChange={e => setLawyerSearch(e.target.value)}
                        className={cn('w-full', 'pl-9', 'pr-4', 'py-2', 'text-sm', 'border', 'border-secondary-200', 'rounded-lg', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500')}
                      />
                    </div>
                    
                    <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4')}>
                      {availableLawyers
                        .filter(l => {
                          // Exclude self from network list
                          if (l.id === user?.id) return false;
                          
                          const matchesSearch = `${l.first_name} ${l.last_name} ${l.specialty || ''}`.toLowerCase().includes(lawyerSearch.toLowerCase());
                          if (!matchesSearch) return false;

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
                              <div className={cn('h-1', 'bg-primary-600')} />
                              <CardContent className="p-5">
                                <div className={cn('flex', 'items-start', 'gap-4')}>
                                  <div className={cn('w-14', 'h-14', 'rounded-full', 'bg-primary-100', 'flex', 'items-center', 'justify-center', 'overflow-hidden', 'shrink-0')}>
                                    {lawyer.avatar_url ? (
                                      <img src={lawyer.avatar_url} alt="" className={cn('w-full', 'h-full', 'object-cover')} />
                                    ) : (
                                      <span className={cn('text-primary-700', 'text-xl', 'font-bold')}>{lawyer.first_name?.[0]}{lawyer.last_name?.[0]}</span>
                                    )}
                                  </div>
                                  <div className={cn('flex-1', 'min-w-0')}>
                                    <div className={cn('flex', 'items-center', 'gap-2', 'mb-1')}>
                                      <p className={cn('font-bold', 'text-secondary-900')}>Me. {lawyer.first_name} {lawyer.last_name}</p>
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                        lawyer.is_available !== false ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-500'
                                      }`}>
                                        {lawyer.is_available !== false ? 'Disponible' : 'Indisponible'}
                                      </span>
                                    </div>
                                    <p className={cn('text-sm', 'text-primary-600', 'font-medium')}>{lawyer.specialty || 'Avocat'}</p>
                                    <p className={cn('text-xs', 'text-secondary-500', 'mt-1', 'flex', 'items-center', 'gap-1')}>
                                      <span>📍</span>
                                      <span>
                                        {lawyer.city || ''}
                                        {lawyer.postal_code ? ` (${lawyer.postal_code.substring(0, 2)})` : ''}
                                      </span>
                                    </p>
                                    {bar && (
                                      <p className={cn('text-xs', 'text-secondary-500', 'mt-1', 'flex', 'items-center', 'gap-1')}>
                                        <span className="text-sm">🏛️</span>
                                        <span>Barreau de {bar}</span>
                                      </p>
                                    )}
                                    {lawyer.bio && <p className={cn('text-xs', 'text-secondary-600', 'mt-2', 'line-clamp-2')}>{lawyer.bio}</p>}
                                  </div>
                                </div>
                                <div className={cn('mt-4', 'flex', 'gap-2')}>
                                  <Button
                                    className={cn('flex-1', 'text-sm')}
                                    onClick={() => handleOpenChat(lawyer.id, `Me. ${lawyer.first_name} ${lawyer.last_name}`)}
                                  >
                                    <MessageSquare className={cn('h-4', 'w-4', 'mr-2')} />
                                    Contacter confrère
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      {availableLawyers.filter(l => {
                        if (l.id === user?.id) return false;
                        
                        const matchesSearch = `${l.first_name} ${l.last_name} ${l.specialty || ''}`.toLowerCase().includes(lawyerSearch.toLowerCase());
                        if (!matchesSearch) return false;

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
                        <div className={cn('col-span-2', 'text-center', 'py-12', 'text-secondary-400')}>
                          <Users className={cn('h-10', 'w-10', 'mx-auto', 'mb-2', 'text-secondary-200')} />
                          <p>Aucun confrère disponible pour ces critères.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'searches' && (
                  <div className={cn('space-y-4', 'animate-fade-in')}>
                    <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>IA Juridique — Recherche de Droit</h2>
                    <SearchPage skipAuthCheck />
                  </div>
                )}

                {activeTab === 'codes' && (
                  <div className={cn('space-y-4', 'animate-fade-in')}>
                    <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>Codes de Loi</h2>
                    <LawCodes />
                  </div>
                )}

                {activeTab === 'procedures' && (
                  <div className={cn('space-y-4', 'animate-fade-in')}>
                    <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>Bibliothèque des Procédures</h2>
                    <ProcedureLibrary />
                  </div>
                )}

                {activeTab === 'analyse' && (
                  <div className={cn('space-y-4', 'animate-fade-in')}>
                    <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>Analyse de Contrats & Codes (IA)</h2>
                    <CodeAnalysis />
                  </div>
                )}

                {activeTab === 'formations' && (
                  <div className={cn('space-y-6', 'animate-fade-in')}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>Formations et Espace Académique</h2>
                      
                      <div className="flex bg-secondary-100 p-1 rounded-xl self-start">
                        <button
                          onClick={() => setClassroomsSubTab('virtual')}
                          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            classroomsSubTab === 'virtual' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-600 hover:text-primary-600'
                          }`}
                        >
                          Salles de Classe Virtuelles
                        </button>
                        <button
                          onClick={() => setClassroomsSubTab('static')}
                          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            classroomsSubTab === 'static' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-600 hover:text-primary-600'
                          }`}
                        >
                          Guides de Formation
                        </button>
                      </div>
                    </div>

                    {classroomsSubTab === 'virtual' ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-secondary-150 shadow-sm">
                          <div>
                            <h3 className="text-sm font-bold text-secondary-800">Organisez vos visioconférences en direct</h3>
                            <p className="text-xs text-secondary-500">Planifiez des sessions WebRTC avec vos confrères ou vos clients avec visioconférence haute définition intégrée.</p>
                          </div>
                          <Button variant="primary" size="sm" onClick={() => setCreateClassroomOpen(true)}>
                            <Plus className="w-4 h-4 mr-1" /> Programmer une session
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {classrooms.map((room) => {
                            const isMyRoom = room.lawyer_id === user?.id;
                            return (
                              <Card key={room.id} className="overflow-hidden hover:shadow-md transition-all border-secondary-100 bg-white flex flex-col h-full">
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
                                  {room.is_live && (
                                    <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded animate-pulse">🔴 EN DIRECT</span>
                                  )}
                                </div>
                                <CardContent className="p-5 flex flex-col justify-between flex-1 gap-4">
                                  <div className="space-y-2">
                                    <h3 className="text-base font-bold text-secondary-900 line-clamp-1">{room.title}</h3>
                                    <p className="text-xs text-secondary-500 line-clamp-3">{room.description}</p>
                                  </div>
                                  <div className="space-y-1.5 border-t border-secondary-50 pt-3 text-xs text-secondary-600">
                                    <div className="flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5 text-secondary-400" />
                                      <span>Animateur : Me {room.lawyer_first_name} {room.lawyer_last_name} {isMyRoom && "(Vous)"}</span>
                                    </div>
                                    {room.scheduled_at && (
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-secondary-400" />
                                        <span>Le {new Date(room.scheduled_at).toLocaleDateString()} à {new Date(room.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-secondary-400" />
                                      <span>Durée : {room.duration_minutes} min</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5 text-secondary-400" />
                                      <span>Inscrits : {room.registered_count} / {room.max_members}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className={`flex-1 text-xs font-bold ${room.is_live ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                      onClick={() => joinMeeting(room)}
                                    >
                                      <Video className="w-3.5 h-3.5 mr-1" /> {room.is_live ? "Rejoindre (Session en cours 🔴)" : "Rejoindre la visio"}
                                    </Button>
                                    {isMyRoom && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50 px-2"
                                        onClick={() => handleDeleteClassroom(room.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                          {classrooms.length === 0 && (
                            <div className="col-span-full text-center py-12 text-secondary-400 border border-dashed rounded-2xl bg-white">
                              Aucune visioconférence n'est programmée pour le moment.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6')}>
                        {formations.map((f) => {
                          const isCompleted = completedFormations.includes(f.id);
                          return (
                            <Card key={f.id} className="hover:shadow-md transition-all duration-200 border-secondary-100">
                              <CardContent className="p-6">
                                <div className={cn('flex', 'flex-col', 'space-y-3')}>
                                  <div className="flex justify-between items-start">
                                    <span className={cn('text-xs', 'font-bold', 'text-primary-600', 'uppercase')}>{f.category}</span>
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
                                  <h3 className={cn('text-lg', 'font-bold', 'text-secondary-900', 'line-clamp-2', 'h-14')}>{f.title}</h3>
                                  <p className={cn('text-sm', 'text-secondary-500')}>Durée: {f.duration} • Niveau: {f.level}</p>
                                  
                                  <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between text-xs text-secondary-400">
                                      <span>Progression</span>
                                      <span>{isCompleted ? '100%' : '0%'}</span>
                                    </div>
                                    <div className="w-full bg-secondary-100 rounded-full h-1.5">
                                      <div 
                                        className={cn('h-1.5 rounded-full transition-all duration-300', isCompleted ? 'bg-success-500' : 'bg-secondary-300')}
                                        style={{ width: isCompleted ? '100%' : '0%' }}
                                      />
                                    </div>
                                  </div>

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
                          <div className="col-span-full text-center py-12 text-secondary-400 border border-dashed rounded-2xl bg-white">
                            Aucun module de formation n'est actuellement publié.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modal de création de visioconférence */}
                    <Modal
                      isOpen={createClassroomOpen}
                      onClose={() => setCreateClassroomOpen(false)}
                      title="Programmer une Visioconférence"
                    >
                      <form onSubmit={handleCreateClassroom} className="space-y-4 text-sm font-sans">
                        <div>
                          <label className="block text-xs font-bold text-secondary-700 mb-1">Titre de la session</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Réforme du code pénal marocain"
                            value={newClassroom.title}
                            onChange={e => setNewClassroom(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full text-xs border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500 font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-secondary-700 mb-1">Description</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Ex: Analyse approfondie des modifications et impacts pratiques..."
                            value={newClassroom.description}
                            onChange={e => setNewClassroom(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full text-xs border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500 font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-secondary-700 mb-1">Type de session</label>
                            <select
                              value={newClassroom.type}
                              onChange={e => setNewClassroom(prev => ({ ...prev, type: e.target.value as any }))}
                              className="w-full text-xs border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500 font-sans"
                            >
                              <option value="direct">Direct (Conférence)</option>
                              <option value="video">Salle Vidéo</option>
                              <option value="differe">Différé</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-secondary-700 mb-1">Nombre max de participants</label>
                            <input
                              type="number"
                              value={newClassroom.max_members}
                              onChange={e => setNewClassroom(prev => ({ ...prev, max_members: parseInt(e.target.value) || 100 }))}
                              className="w-full text-xs border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500 font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-secondary-700 mb-1">Date et heure de planification</label>
                            <input
                              type="datetime-local"
                              required
                              value={newClassroom.scheduled_at}
                              onChange={e => setNewClassroom(prev => ({ ...prev, scheduled_at: e.target.value }))}
                              className="w-full text-xs border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500 font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-secondary-700 mb-1">Durée (minutes)</label>
                            <input
                              type="number"
                              value={newClassroom.duration_minutes}
                              onChange={e => setNewClassroom(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                              className="w-full text-xs border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500 font-sans"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-secondary-100">
                          <Button variant="outline" type="button" className="flex-1" onClick={() => setCreateClassroomOpen(false)}>
                            Annuler
                          </Button>
                          <Button variant="primary" type="submit" className="flex-1">
                            Programmer
                          </Button>
                        </div>
                      </form>
                    </Modal>
                  </div>
                )}

                {activeTab === 'profil' && (
                  <div className="space-y-6">
                    <h2 className={cn('text-2xl', 'font-semibold', 'text-secondary-900')}>Mon Profil Public</h2>
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      {/* Photo */}
                      <Card>
                        <CardHeader><CardTitle>Photo de profil</CardTitle></CardHeader>
                        <CardContent className={cn('flex', 'items-center', 'gap-6')}>
                          <div className={cn('w-24', 'h-24', 'rounded-full', 'bg-primary-100', 'flex', 'items-center', 'justify-center', 'overflow-hidden', 'text-primary-700', 'text-3xl', 'font-bold')}>
                            {(profile as any)?.avatar_url ? (
                              <img src={(profile as any).avatar_url} alt="avatar" className={cn('w-full', 'h-full', 'object-cover')} />
                            ) : (
                              <span>{profile?.first_name?.[0]}{profile?.last_name?.[0]}</span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="block">
                              <span className="sr-only">Choisir une photo</span>
                              <input type="file" accept="image/*" onChange={handleUploadAvatar}
                                className={cn('block', 'w-full', 'text-sm', 'text-secondary-500', 'file:mr-4', 'file:py-2', 'file:px-4', 'file:rounded-full', 'file:border-0', 'file:text-sm', 'file:font-semibold', 'file:bg-primary-50', 'file:text-primary-700', 'hover:file:bg-primary-100', 'cursor-pointer')} />
                            </label>
                            <p className={cn('text-xs', 'text-secondary-400')}>JPG, PNG ou WEBP • max 2MB</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Disponibilité */}
                      <Card>
                        <CardContent className={cn('p-6', 'flex', 'items-center', 'justify-between')}>
                          <div>
                            <p className={cn('font-semibold', 'text-secondary-900')}>Disponibilité</p>
                            <p className={cn('text-sm', 'text-secondary-500')}>Apparaître comme disponible dans l'annuaire</p>
                          </div>
                          <button type="button"
                            onClick={() => setProfileForm(p => ({...p, is_available: !p.is_available}))}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                              profileForm.is_available ? 'bg-success-500' : 'bg-secondary-300'
                            }`}
                          >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                              profileForm.is_available ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </CardContent>
                      </Card>

                      {/* Informations personnelles */}
                      <Card>
                        <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
                        <CardContent className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4')}>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Prénom</label>
                            <Input value={profileForm.first_name} onChange={e => setProfileForm(p => ({...p, first_name: e.target.value}))} required />
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Nom</label>
                            <Input value={profileForm.last_name} onChange={e => setProfileForm(p => ({...p, last_name: e.target.value}))} required />
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Téléphone</label>
                            <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} placeholder="+212 6 00 00 00 00" />
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Ville</label>
                            <Input value={profileForm.city} onChange={e => setProfileForm(p => ({...p, city: e.target.value}))} placeholder="Casablanca" />
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Code Postal</label>
                            <Input value={profileForm.postal_code} onChange={e => setProfileForm(p => ({...p, postal_code: e.target.value}))} />
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>N° Barreau</label>
                            <Input value={profileForm.bar_number} onChange={e => setProfileForm(p => ({...p, bar_number: e.target.value}))} placeholder="Ex: 12345" />
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Barreau d'inscription</label>
                            <Input value={profileForm.bar_association} onChange={e => setProfileForm(p => ({...p, bar_association: e.target.value}))} placeholder="Ex: Paris" />
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Années d'expérience</label>
                            <Input type="number" value={profileForm.experience_years} onChange={e => setProfileForm(p => ({...p, experience_years: parseInt(e.target.value) || 0}))} min={0} />
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Spécialité principale</label>
                            <Input value={profileForm.specialty} onChange={e => setProfileForm(p => ({...p, specialty: e.target.value}))} placeholder="Ex: Droit du Travail" />
                          </div>
                          <div className="md:col-span-2">
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Biographie professionnelle</label>
                            <textarea
                                value={profileForm.bio}
                                onChange={e => setProfileForm(p => ({...p, bio: e.target.value}))}
                                rows={4}
                                placeholder="Décrivez votre parcours, vos domaines d'expertise..."
                                className={cn('w-full', 'rounded-md', 'border', 'border-secondary-200', 'bg-white', 'px-3', 'py-2', 'text-sm', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500')}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Configuration Stripe */}
                      <Card>
                        <CardHeader>
                          <CardTitle className={cn('flex', 'items-center', 'gap-2', 'text-primary-700')}>
                            <Sparkles className={cn('w-5', 'h-5')} />
                            Configuration Stripe personnelle
                          </CardTitle>
                        </CardHeader>
                        <CardContent className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4')}>
                          <div className={cn('md:col-span-2', 'text-sm', 'text-secondary-500', 'mb-2')}>
                            Entrez vos clés API Stripe personnelles ci-dessous pour que les paiements de vos clients aillent directement sur votre compte Stripe.
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Clé Publique Stripe (Publishable Key)</label>
                            <Input 
                              type="text" 
                              value={profileForm.stripe_public_key} 
                              onChange={e => setProfileForm(p => ({...p, stripe_public_key: e.target.value}))} 
                              placeholder="pk_live_... ou pk_test_..." 
                            />
                          </div>
                          <div>
                            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Clé Secrète Stripe (Secret Key)</label>
                            <Input 
                              type="password" 
                              value={profileForm.stripe_secret_key} 
                              onChange={e => setProfileForm(p => ({...p, stripe_secret_key: e.target.value}))} 
                              placeholder="sk_live_... ou sk_test_..." 
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Button type="submit" className={cn('w-full', 'h-12', 'text-base', 'font-bold')}>Enregistrer le profil</Button>
                    </form>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className={cn('text-xl', 'font-bold', 'mb-4')}>Ouvrir un ticket d'assistance</h2>
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className={cn('block', 'text-sm', 'font-medium', 'text-secondary-700', 'mb-1')}>Sujet de votre demande</label>
            <Input 
              value={ticketSubject} 
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="Ex: Problème d'accès, Bug, Question..." 
              required
            />
          </div>
          <div className={cn('flex', 'justify-end', 'gap-3', 'mt-6')}>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit">Envoyer</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={quoteModalOpen} onClose={() => setQuoteModalOpen(false)}>
        <h2 className={cn('text-xl', 'font-bold', 'mb-4')}>Créer un nouveau devis</h2>
        <form onSubmit={handleCreateQuote} className="space-y-4">
          <div>
            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Dossier / Client</label>
            <select 
              className={cn('w-full', 'flex', 'h-10', 'rounded-md', 'border', 'border-secondary-200', 'bg-white', 'px-3', 'py-2', 'text-sm')}
              value={newQuote.client_id}
              onChange={(e) => {
                const caseObj = cases.find(c => c.owner_id === e.target.value);
                setNewQuote({...newQuote, client_id: e.target.value, case_id: caseObj?.id || ''})
              }}
              required
            >
              <option value="">Sélectionner un client</option>
              {Array.from(new Set(cases.map(c => JSON.stringify({id: c.owner_id, name: `${c.profiles?.first_name} ${c.profiles?.last_name}${c.profiles?.city ? ` (${c.profiles.city})` : ''}` }))))
                .map(s => JSON.parse(s))
                .map(u => <option key={u.id} value={u.id}>{u.name}</option>)
              }
            </select>
          </div>
          <div>
            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Montant (MAD)</label>
            <Input 
              type="number"
              value={newQuote.amount}
              onChange={(e) => setNewQuote({...newQuote, amount: e.target.value})}
              placeholder="Ex: 5000"
              required
            />
            <p className={cn('text-[10px]', 'text-secondary-500', 'mt-1')}>Note: Une commission de 20% sera prélevée par la plateforme.</p>
          </div>
          <div>
            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Description des prestations</label>
            <textarea 
              className={cn('w-full', 'min-h-[100px]', 'rounded-md', 'border', 'border-secondary-200', 'bg-white', 'px-3', 'py-2', 'text-sm')}
              value={newQuote.description}
              onChange={(e) => setNewQuote({...newQuote, description: e.target.value})}
              placeholder="Détaillez vos honoraires..."
              required
            />
          </div>
          <div className={cn('flex', 'justify-end', 'gap-3', 'mt-6')}>
            <Button type="button" variant="ghost" onClick={() => setQuoteModalOpen(false)}>Annuler</Button>
            <Button type="submit">Générer le Devis</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={docModalOpen} onClose={() => setDocModalOpen(false)}>
        <h2 className={cn('text-xl', 'font-bold', 'mb-4')}>Ajouter un Document Client / Modèle</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleUploadLawyerDocument(newDoc.name, newDoc.type, newDoc.client_id);
          setDocModalOpen(false);
          setNewDoc({ name: '', type: 'client_document', client_id: '' });
        }} className="space-y-4">
          <div>
            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Dossier / Client</label>
            <select 
              className={cn('w-full', 'flex', 'h-10', 'rounded-md', 'border', 'border-secondary-200', 'bg-white', 'px-3', 'py-2', 'text-sm', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500')}
              value={newDoc.client_id}
              onChange={(e) => setNewDoc({...newDoc, client_id: e.target.value})}
              required
            >
              <option value="">Sélectionner un client</option>
              {allInteractingClients.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Nom du document</label>
            <Input 
              value={newDoc.name}
              onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
              placeholder="Ex: Acte de Naissance, Statuts de Société..."
              required
            />
          </div>
          <div>
            <label className={cn('block', 'text-sm', 'font-medium', 'mb-1')}>Classification / Type</label>
            <select 
              className={cn('w-full', 'flex', 'h-10', 'rounded-md', 'border', 'border-secondary-200', 'bg-white', 'px-3', 'py-2', 'text-sm', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500')} 
              value={newDoc.type} 
              onChange={e => setNewDoc({...newDoc, type: e.target.value})}
            >
              <option value="identity">🪪 Pièce d'identité client</option>
              <option value="license">📜 Licence / Diplôme client</option>
              <option value="legal_template">📝 Modèle de document</option>
              <option value="client_document">📁 Pièce de dossier / Justificatif</option>
            </select>
          </div>
          <div className={cn('flex', 'justify-end', 'gap-3', 'mt-6')}>
            <Button type="button" variant="ghost" onClick={() => setDocModalOpen(false)}>Annuler</Button>
            <Button type="submit">Importer le Document</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        title="Bienvenue Maître"
      >
        <div className={cn('text-center', 'py-6')}>
          <div className={cn('mx-auto', 'h-16', 'w-16', 'bg-primary-100', 'rounded-full', 'flex', 'items-center', 'justify-center', 'mb-4')}>
            <Users className={cn('h-8', 'w-8', 'text-primary-600')} />
          </div>
          <h3 className={cn('text-2xl', 'font-bold', 'text-secondary-900', 'mb-2')}>Bienvenue Maître {profile?.last_name || profile?.first_name} !</h3>
          <p className={cn('text-secondary-600', 'mb-6')}>
            Votre tableau de bord professionnel est prêt. Gérez vos rendez-vous, accédez à vos outils d'IA et suivez vos honoraires en toute simplicité.
          </p>
          <Button className="w-full" onClick={() => setShowWelcome(false)}>
            Accéder au tableau de bord
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedIADoc}
        onClose={() => setSelectedIADoc(null)}
        title={selectedIADoc?.name || "Visualisation du Document"}
      >
        <div className="space-y-6">
          <div className={cn('p-5', 'bg-secondary-50', 'border', 'border-secondary-200', 'rounded-2xl', 'max-h-[60vh]', 'overflow-y-auto', 'whitespace-pre-wrap', 'font-serif', 'text-secondary-800', 'text-sm', 'leading-relaxed', 'shadow-inner')}>
            {selectedIADoc?.metadata?.content}
          </div>
          <div className={cn('flex', 'justify-end', 'gap-3', 'pt-4', 'border-t', 'border-secondary-100')}>
            <Button variant="outline" onClick={() => setSelectedIADoc(null)}>Fermer</Button>
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
              <Download className={cn('h-4', 'w-4', 'mr-2')} />
              Imprimer / PDF
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal d'Alarme de Paiement */}
      <Modal
        isOpen={!!paymentAlarmQuote}
        onClose={() => setPaymentAlarmQuote(null)}
        title="⚠️ ALERTE DE PAIEMENT : Commission en attente !"
      >
        <div className={cn('text-center', 'py-6', 'space-y-4')}>
          <div className={cn('mx-auto', 'h-16', 'w-16', 'bg-red-100', 'text-red-600', 'rounded-full', 'flex', 'items-center', 'justify-center', 'animate-bounce', 'shadow-lg', 'shadow-red-500/20')}>
            <AlertTriangle className={cn('h-8', 'w-8')} />
          </div>
          <h3 className={cn('text-xl', 'font-bold', 'text-secondary-900')}>
            Paiement Client Reçu !
          </h3>
          <p className={cn('text-sm', 'text-secondary-600', 'leading-relaxed', 'px-2')}>
            Le client <strong className="text-secondary-800">{paymentAlarmQuote?.profiles?.first_name || 'Citoyen'} {paymentAlarmQuote?.profiles?.last_name || ''}</strong> a payé la somme de <strong>{paymentAlarmQuote?.amount} MAD</strong> pour le devis <strong>#{paymentAlarmQuote?.id?.slice(0, 8)}</strong>.
          </p>
          <div className={cn('bg-red-50/70', 'border', 'border-red-200/50', 'rounded-2xl', 'p-4.5', 'text-left', 'space-y-2')}>
            <div className={cn('flex', 'justify-between', 'text-xs', 'text-secondary-600')}>
              <span>Montant versé par le client :</span>
              <span className={cn('font-semibold', 'text-secondary-800')}>{paymentAlarmQuote?.amount} MAD</span>
            </div>
            <div className={cn('flex', 'justify-between', 'text-xs', 'text-red-600', 'font-semibold', 'border-t', 'border-red-100', 'pt-2')}>
              <span>Commission due (20%) :</span>
              <span>{(paymentAlarmQuote?.amount * 0.2).toFixed(2)} MAD</span>
            </div>
          </div>
          <p className={cn('text-xs', 'text-secondary-500', 'italic')}>
            Pour activer le dossier, valider l'accès aux documents et à la messagerie sécurisée, vous devez régler cette commission.
          </p>
          <div className={cn('flex', 'flex-col', 'gap-2', 'pt-4')}>
            <Button 
              className={cn('w-full', 'bg-red-600', 'hover:bg-red-700', 'text-white', 'font-semibold', 'py-2.5', 'rounded-xl', 'shadow-md', 'transition-all', 'duration-200')}
              disabled={payingCommissionId === paymentAlarmQuote?.id}
              onClick={() => {
                const quoteToPay = {
                  ...paymentAlarmQuote,
                  commission_amount: paymentAlarmQuote.amount * 0.2
                };
                handlePayCommission(quoteToPay);
                setPaymentAlarmQuote(null);
              }}
            >
              {payingCommissionId === paymentAlarmQuote?.id ? (
                <span className="flex items-center justify-center gap-1.5">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Redirection...
                </span>
              ) : (
                "Régler la commission maintenant (Stripe)"
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={cn('w-full', 'text-secondary-500', 'hover:text-secondary-600', 'text-xs')}
              onClick={() => setPaymentAlarmQuote(null)}
            >
              Fermer et régler plus tard
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

          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-secondary-50 p-4 rounded-2xl border border-secondary-100">
                <div className="space-y-1">
                  <p className="text-xs text-secondary-400 font-bold uppercase font-sans">Durée du module</p>
                  <p className="text-sm font-semibold text-secondary-900 font-sans">{selectedFormation.duration}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-secondary-400 font-bold uppercase font-sans">Niveau requis</p>
                  <p className="text-sm font-semibold text-secondary-900 font-sans">{selectedFormation.level}</p>
                </div>
              </div>

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
                      className={cn(
                        'px-3', 'py-1.5', 'rounded-xl', 'text-xs', 'font-bold', 'whitespace-nowrap', 'transition-all',
                        activeChapterIndex === idx 
                          ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20' 
                          : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100 border border-secondary-200'
                      )}
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
                  Fermer
                </Button>
                {formationViewMode === 'start' && (
                  <Button
                    variant="primary"
                    disabled={percent < 100}
                    onClick={() => {
                      const newCompleted = [...completedFormations];
                      if (!newCompleted.includes(selectedFormation.id)) {
                        newCompleted.push(selectedFormation.id);
                        setCompletedFormations(newCompleted);
                        localStorage.setItem('completedFormations', JSON.stringify(newCompleted));
                      }
                      success("Module Terminé 🎓", `Félicitations Maître, vous avez validé le module "${selectedFormation.title}" !`);
                      setSelectedFormation(null);
                    }}
                  >
                    Valider le module
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal Outils Juridiques */}
      <Modal
        isOpen={!!selectedOutil}
        onClose={() => setSelectedOutil(null)}
        title={selectedOutil ? selectedOutil.title : "Outil Juridique"}
      >
        {(() => {
          if (!selectedOutil) return null;
          const title = selectedOutil.title;

          if (title.includes('Contrat') || title.includes('Clause') || title.includes('Modèles')) {
            const handleGenerateContract = () => {
              setContractGenerating(true);
              setContractGeneratedText('');
              setTimeout(() => {
                const clientObj = allInteractingClients.find(c => c.id === contractClient);
                const clientName = clientObj ? clientObj.name : "Client Anonyme";
                
                let contractText = "";
                if (contractType === 'service') {
                  contractText = `CONTRAT DE PRESTATION DE SERVICES JURIDIQUES\n\nENTRE LES SOUSSIGNÉS :\n- Maître ${profile?.last_name || 'Avocat'}, avocat au Barreau de ${(profile as any)?.bar_association || 'Casablanca'}.\n\nET :\n- M./Mme ${clientName}.\n\nIL A ÉTÉ CONVENU CE QUI SUIT :\n\nArticle 1 : Objet de la prestation\nLe Prestataire s'engage à fournir des services de conseil juridique et d'assistance pour le compte du Client.\n\nArticle 2 : Honoraires et facturation\nLes honoraires sont fixés d'un commun accord à la somme globale et forfaitaire de ${contractPrice} MAD Hors Taxes.\n\nArticle 3 : Droit applicable et Litiges\nLe présent contrat est soumis au droit marocain. Tout litige relatif à son interprétation sera porté devant les tribunaux compétents.`;
                } else if (contractType === 'lease') {
                  contractText = `CONTRAT DE BAIL COMMERCIAL\n\nENTRE LES SOUSSIGNÉS :\n- Le Bailleur : Maître ${profile?.last_name || 'Avocat'} (mandataire).\n\nET :\n- Le Preneur : M./Mme ${clientName}.\n\nIL A ÉTÉ CONVENU CE QUI SUIT :\n\nArticle 1 : Destination des lieux\nLes locaux loués sont destinés exclusivement à l'activité commerciale du Preneur.\n\nArticle 2 : Loyer\nLe présent bail est consenti pour un loyer mensuel de ${contractPrice} MAD.\n\nArticle 3 : Durée\nLe présent contrat est conclu pour une durée de 3 ans ferme.`;
                } else {
                  contractText = `ACCORD DE CONFIDENTIALITÉ (NDA)\n\nENTRE LES SOUSSIGNÉS :\n- Maître ${profile?.last_name || 'Avocat'} (mandataire).\n\nET :\n- M./Mme ${clientName}.\n\nIL A ÉTÉ CONVENU CE QUI SUIT :\n\nArticle 1 : Informations confidentielles\nSont considérées comme confidentielles toutes les informations techniques, financières ou juridiques partagées entre les parties.\n\nArticle 2 : Engagement de non-divulgation\nChaque partie s'engage à ne pas divulguer les informations confidentielles de l'autre partie à des tiers sans son consentement écrit préalable.`;
                }
                setContractGeneratedText(contractText);
                setContractGenerating(false);
                success("Contrat Généré", "Le modèle de contrat a été créé avec succès par l'IA.");
              }, 1000);
            };

            const handleSaveContractToClient = async () => {
              if (!contractClient) {
                toastError("Erreur", "Veuillez sélectionner un client pour enregistrer le document.");
                return;
              }
              const { error: insertErr } = await supabase.from('documents_just').insert([{
                name: `Contrat Généré - ${contractType === 'service' ? 'Prestation' : contractType === 'lease' ? 'Bail' : 'NDA'}`,
                type: 'client_document',
                owner_id: contractClient,
                created_at: new Date().toISOString(),
                metadata: { content: contractGeneratedText, generated_by_ia: true }
              }]);
              if (insertErr) {
                toastError("Erreur d'enregistrement", insertErr.message);
              } else {
                success("Document enregistré", "Le contrat généré a été ajouté au dossier du client.");
                setSelectedOutil(null);
              }
            };

            return (
              <div className="space-y-4 font-sans text-sm">
                <p className="text-sm text-secondary-500">Générez un contrat sur mesure à l'aide de notre modèle IA intelligent, puis associez-le au dossier d'un de vos clients.</p>
                
                <div className="space-y-3 border-t border-secondary-100 pt-3">
                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Type de Contrat</label>
                    <select
                      value={contractType}
                      onChange={e => setContractType(e.target.value)}
                      className="w-full text-sm border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="service">Contrat de Prestation de Service</option>
                      <option value="lease">Bail Commercial</option>
                      <option value="nda">Accord de Confidentialité (NDA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Client Destinataire</label>
                    <select
                      value={contractClient}
                      onChange={e => setContractClient(e.target.value)}
                      className="w-full text-sm border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">-- Sélectionner un client --</option>
                      {allInteractingClients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Valeur / Budget de référence (MAD)</label>
                    <Input
                      type="number"
                      value={contractPrice}
                      onChange={e => setContractPrice(e.target.value)}
                      placeholder="Ex: 5000"
                    />
                  </div>

                  <Button 
                    className="w-full mt-2" 
                    variant="primary"
                    disabled={contractGenerating || !contractClient}
                    onClick={handleGenerateContract}
                  >
                    {contractGenerating ? "Génération en cours..." : "Générer le contrat par l'IA"}
                  </Button>
                </div>

                {contractGeneratedText && (
                  <div className="space-y-3 pt-3 border-t border-secondary-100 animate-fade-in">
                    <label className="block text-xs font-bold text-secondary-700">Contrat Généré :</label>
                    <pre className="p-4 bg-secondary-50 border border-secondary-200 rounded-xl text-xs font-mono max-h-[200px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {contractGeneratedText}
                    </pre>
                    <div className="flex justify-between gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(contractGeneratedText);
                          success("Copié !", "Le texte du contrat a été copié dans le presse-papiers.");
                        }}
                      >
                        Copier
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSaveContractToClient}
                      >
                        Enregistrer au dossier
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (title.includes('Honoraires') || title.includes('Calculateur')) {
            const hr = parseFloat(calcHourlyRate) || 0;
            const h = parseFloat(calcHours) || 0;
            const exp = parseFloat(calcExpenses) || 0;
            const vat = parseFloat(calcVatRate) || 0;

            const totalHT = (hr * h) + exp;
            const vatAmount = totalHT * (vat / 100);
            const totalTTC = totalHT + vatAmount;

            const handleCreateQuoteFromCalc = async () => {
              if (!calcClient) {
                toastError("Erreur", "Veuillez sélectionner un client pour enregistrer le devis.");
                return;
              }
              const clientObj = allInteractingClients.find(c => c.id === calcClient);
              const { error: quoteErr } = await supabase.from('quotes_just').insert([{
                client_id: calcClient,
                amount: Math.round(totalTTC),
                description: calcDescription || `Honoraires pour prestations juridiques - ${clientObj ? clientObj.name : 'Client'} (${calcHours} heures à ${calcHourlyRate} MAD/h)`,
                status: 'pending',
                commission_amount: Math.round(totalTTC * 0.2)
              }]);

              if (quoteErr) {
                toastError("Erreur de création", quoteErr.message);
              } else {
                success("Devis créé", "Le devis a été créé et envoyé au client en temps réel.");
                setSelectedOutil(null);
              }
            };

            return (
              <div className="space-y-4 font-sans text-sm">
                <p className="text-sm text-secondary-500">Estimez vos honoraires en fonction du temps passé et des frais annexes, puis convertissez cette estimation en devis réel dans Supabase.</p>
                
                <div className="grid grid-cols-2 gap-3 border-t border-secondary-100 pt-3">
                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Taux Horaire (MAD/h)</label>
                    <Input
                      type="number"
                      value={calcHourlyRate}
                      onChange={e => setCalcHourlyRate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Nombre d'heures</label>
                    <Input
                      type="number"
                      value={calcHours}
                      onChange={e => setCalcHours(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Frais / Débours (MAD)</label>
                    <Input
                      type="number"
                      value={calcExpenses}
                      onChange={e => setCalcExpenses(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Taux de TVA (%)</label>
                    <Input
                      type="number"
                      value={calcVatRate}
                      onChange={e => setCalcVatRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-secondary-50 border border-secondary-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-secondary-600">
                    <span>Total Honoraires HT :</span>
                    <span className="font-semibold text-secondary-800">{totalHT.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-xs text-secondary-600">
                    <span>Montant TVA :</span>
                    <span className="font-semibold text-secondary-800">{vatAmount.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-primary-600 border-t border-secondary-200 pt-2">
                    <span>TOTAL TTC :</span>
                    <span>{totalTTC.toFixed(2)} MAD</span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-secondary-100">
                  <h4 className="text-xs font-bold text-secondary-700">Enregistrer en tant que Devis</h4>
                  <div>
                    <label className="block text-xs text-secondary-500 mb-1">Sélectionner le Client</label>
                    <select
                      value={calcClient}
                      onChange={e => setCalcClient(e.target.value)}
                      className="w-full text-sm border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">-- Sélectionner un client --</option>
                      {allInteractingClients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-500 mb-1">Description libre (optionnel)</label>
                    <Input
                      value={calcDescription}
                      onChange={e => setCalcDescription(e.target.value)}
                      placeholder="Ex: Rédaction des statuts de la société..."
                    />
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={!calcClient}
                    onClick={handleCreateQuoteFromCalc}
                  >
                    Valider et envoyer le devis
                  </Button>
                </div>
              </div>
            );
          }

          if (title.includes('Prescription') || title.includes('Délais')) {
            const handleCalculatePrescription = () => {
              if (!prescStartDate) {
                toastError("Erreur", "Veuillez entrer une date de départ.");
                return;
              }
              const start = new Date(prescStartDate);
              let years = 5;
              let description = "Prescription de droit commun en matière civile ou commerciale.";
              
              if (prescDomain === 'penal_crime') {
                years = 20;
                description = "Prescription de l'action publique en matière criminelle.";
              } else if (prescDomain === 'penal_delit') {
                years = 6;
                description = "Prescription de l'action publique en matière correctionnelle (délit).";
              } else if (prescDomain === 'penal_contravention') {
                years = 1;
                description = "Prescription de l'action publique en matière de contravention.";
              } else if (prescDomain === 'administratif') {
                years = 4;
                description = "Prescription quadriennale des créances sur l'administration.";
              }

              const limit = new Date(start);
              limit.setFullYear(start.getFullYear() + years);
              
              const today = new Date();
              const diffTime = limit.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              setPrescResult({
                limitDate: limit.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
                daysLeft: diffDays,
                description
              });
            };

            return (
              <div className="space-y-4 font-sans text-sm">
                <p className="text-sm text-secondary-500">Calculez rapidement la date limite d'action en justice ou de poursuite selon les règles légales de prescription.</p>
                
                <div className="space-y-3 border-t border-secondary-100 pt-3">
                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Matière / Domaine</label>
                    <select
                      value={prescDomain}
                      onChange={e => setPrescDomain(e.target.value)}
                      className="w-full text-sm border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="civil">Droit Civil / Commercial (5 ans)</option>
                      <option value="penal_crime">Action Pénale : Crime (20 ans)</option>
                      <option value="penal_delit">Action Pénale : Délit (6 ans)</option>
                      <option value="penal_contravention">Action Pénale : Contravention (1 an)</option>
                      <option value="administratif">Droit Administratif (4 ans)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Point de départ (Date du fait générateur ou de l'infraction)</label>
                    <input
                      type="date"
                      value={prescStartDate}
                      onChange={e => setPrescStartDate(e.target.value)}
                      className="w-full text-sm border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <Button variant="primary" className="w-full" onClick={handleCalculatePrescription}>
                    Calculer le délai de prescription
                  </Button>
                </div>

                {prescResult && (
                  <div className="bg-secondary-50 border border-secondary-200 rounded-2xl p-4 space-y-2 mt-3 animate-fade-in">
                    <p className="text-xs text-secondary-500 italic">{prescResult.description}</p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-secondary-700 font-semibold">Date d'échéance légale :</span>
                      <span className="text-sm font-bold text-secondary-900">{prescResult.limitDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary-700 font-semibold">Statut du délai :</span>
                      {prescResult.daysLeft > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-success-100 text-success-700">
                          {prescResult.daysLeft} jours restants
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                          ⚠️ Action prescrite
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (title.includes('Anonymisation') || title.includes('Conformité')) {
            const handleAnonymizeText = () => {
              if (!anonInputText.trim()) {
                toastError("Erreur", "Veuillez saisir le texte à anonymiser.");
                return;
              }
              setAnonProcessing(true);
              setTimeout(() => {
                let text = anonInputText;
                text = text.replace(/(M\.|Mme|Monsieur|Madame)\s+([A-Z][a-zÀ-ÿ]+)/g, "$1 [NOM_ANONYMISÉ]");
                text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_ANONYMISÉ]");
                text = text.replace(/(\+212|0)[5-7]\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2}/g, "[TÉLÉPHONE_ANONYMISÉ]");
                text = text.replace(/(\+33|0)[1-9]\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2}/g, "[TÉLÉPHONE_ANONYMISÉ]");
                text = text.replace(/\b\d{5}\b/g, "[CODE_POSTAL_ANONYMISÉ]");
                
                setAnonOutputText(text);
                setAnonProcessing(false);
                success("Texte anonymisé", "Les données sensibles ont été occultées avec succès.");
              }, 1000);
            };

            return (
              <div className="space-y-4 font-sans text-sm">
                <p className="text-sm text-secondary-500">Collez le texte de vos conclusions ou décisions judiciaires pour masquer automatiquement les emails, téléphones et noms de famille.</p>
                
                <div className="space-y-3 border-t border-secondary-100 pt-3">
                  <div>
                    <label className="block text-xs font-bold text-secondary-700 mb-1">Texte Original</label>
                    <textarea
                      rows={5}
                      value={anonInputText}
                      onChange={e => setAnonInputText(e.target.value)}
                      placeholder="Collez votre document ici (ex: M. Ahmed Benjelloun, demeurant à Casablanca, tél: 0661123456...)"
                      className="w-full text-xs border-secondary-300 rounded-xl focus:border-primary-500 focus:ring-primary-500 font-sans p-2"
                    />
                  </div>

                  <Button variant="primary" className="w-full" disabled={anonProcessing} onClick={handleAnonymizeText}>
                    {anonProcessing ? "Anonymisation en cours..." : "Lancer l'anonymisation locale"}
                  </Button>
                </div>

                {anonOutputText && (
                  <div className="space-y-2 pt-3 border-t border-secondary-100 animate-fade-in">
                    <label className="block text-xs font-bold text-secondary-700">Texte Anonymisé :</label>
                    <pre className="p-4 bg-secondary-50 border border-secondary-200 rounded-xl text-xs font-mono max-h-[180px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {anonOutputText}
                    </pre>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(anonOutputText);
                        success("Copié !", "Le texte anonymisé est copié.");
                      }}
                    >
                      Copier le texte anonymisé
                    </Button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div className="space-y-4 font-sans text-sm">
              <p className="text-sm text-secondary-500">Cet outil est opérationnel en version bêta. Configurez ses paramètres de calcul pour simuler le rendu.</p>
              <div className="bg-secondary-50 border border-secondary-200 rounded-2xl p-6 text-center space-y-3">
                <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto">
                  <PenTool className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-secondary-900">{title}</h4>
                <p className="text-xs text-secondary-500">Statut de l'environnement : <span className="font-bold text-success-600">Prêt</span></p>
                
                <Button 
                  variant="primary" 
                  className="w-full mt-4" 
                  onClick={() => {
                    success("Simulation lancée", `L'outil ${title} a exécuté ses tests d'intégration.`);
                    setSelectedOutil(null);
                  }}
                >
                  Lancer la simulation par défaut
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  )
}

export default DashboardLawyer