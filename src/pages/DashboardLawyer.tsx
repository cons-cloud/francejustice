import React, { useState, useEffect } from "react"
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
  AlertTriangle
} from "lucide-react"

import { AdvancedAreaChart } from "../components/features/StatsCharts"
import { exportToCSV } from "../lib/exportUtils"
import { Chat } from "../components/features/Chat"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { useToast } from "../hooks/useToast"
import Modal from "../components/ui/Modal"
import { Input } from "../components/ui/Input"
import { VoiceAssistant } from "../components/ui/VoiceAssistant"

const DashboardLawyer: React.FC = () => {
  const { user, profile } = useAuth()
  const { success, error: toastError } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [showWelcome, setShowWelcome] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [outils, setOutils] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [chatRooms, setChatRooms] = useState<any[]>([])
  const [activeRoom, setActiveRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [ticketSubject, setTicketSubject] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [newQuote, setNewQuote] = useState({ client_id: '', amount: '', description: '', case_id: '' })
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [newDoc, setNewDoc] = useState({ name: '', type: 'client_document', client_id: '' })
  const [selectedIADoc, setSelectedIADoc] = useState<any>(null)
  const [paymentAlarmQuote, setPaymentAlarmQuote] = useState<any | null>(null)
  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', phone: '', city: '', postal_code: '',
    bio: '', specialty: '', bar_number: '', experience_years: 0, is_available: true,
    stripe_public_key: '', stripe_secret_key: ''
  })

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
            metadata: { 
              content: action.payload.content, 
              source: 'IA Vocale',
              type: 'ai_generated',
              created_at: new Date().toISOString()
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
        is_available: (profile as any).is_available ?? true
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
        
      return () => {
        supabase.removeChannel(apptSub)
        supabase.removeChannel(casesSub)
        supabase.removeChannel(techSub)
        supabase.removeChannel(quotesSub)
      }
    }
  }, [user])

  // Real-time payment verification redirect handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const quoteId = params.get('quote_id')
    
    if (payment === 'success' && quoteId) {
      const markQuoteAsPaid = async () => {
        const { error } = await supabase
          .from('quotes_just')
          .update({ status: 'commissioned' })
          .eq('id', quoteId)
        
        if (!error) {
          success('Commission réglée 🎉', 'Le paiement de votre commission a été validé avec succès en temps réel.')
          fetchQuotes()
        }
        window.history.replaceState({}, document.title, window.location.pathname)
      }
      markQuoteAsPaid()
    } else if (payment === 'cancel') {
      toastError('Paiement annulé', 'Le paiement de la commission a été annulé.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [user])

  const fetchFullProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles_just')
      .select('stripe_public_key, stripe_secret_key, phone, city, postal_code, bio, specialty, bar_number, experience_years, is_available, first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()

    if (data) {
      setProfileForm({
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
        stripe_secret_key: data.stripe_secret_key || ''
      })
    }
  }

  const fetchLawyerData = async () => {
    setLoading(true)
    await Promise.all([fetchAppointments(), fetchCases(), fetchQuotes(), fetchChatRooms(), fetchFullProfile()])
    fetchOutils()
    fetchTickets()
    setLoading(false)
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

  const fetchAppointments = async () => {
    if (!user) return
    const { data } = await supabase
      .from('appointments_just')
      .select('*, profiles:client_id(first_name, last_name, email)')
      .eq('lawyer_id', user.id)
      .order('scheduled_at', { ascending: true })
    if (data) setAppointments(data)
  }

  const fetchCases = async () => {
    if (!user) return
    const { data } = await supabase
      .from('documents_just')
      .select('*, profiles:owner_id(first_name, last_name, email)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setCases(data)
  }

  const handleExportClients = () => {
    const clients = Array.from(new Set(cases.map(c => JSON.stringify({ 
      id: c.owner_id, 
      name: `${c.profiles?.first_name} ${c.profiles?.last_name}`,
      email: c.profiles?.email
    })))).map(s => JSON.parse(s));
    exportToCSV(clients, `clients_lawyer_${new Date().toISOString().split('T')[0]}`);
  };

  const revenueData = [
    { name: 'Lun', value: 1200 },
    { name: 'Mar', value: 1900 },
    { name: 'Mer', value: 1500 },
    { name: 'Jeu', value: 2100 },
    { name: 'Ven', value: 2500 },
    { name: 'Sam', value: 1800 },
    { name: 'Dim', value: 1100 },
  ];

  const fetchQuotes = async () => {
    if (!user) return
    const { data } = await supabase
      .from('quotes_just')
      .select('*, profiles:client_id(first_name, last_name, email)')
      .eq('lawyer_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setQuotes(data)
  }

  const fetchChatRooms = async () => {
    if (!user) return
    const { data } = await supabase
      .from('chat_rooms_just')
      .select('*, profiles:client_id(first_name, last_name, email)')
      .eq('lawyer_id', user.id)
    if (data) setChatRooms(data)
  }

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
    try {
      const response = await fetch('/api/payments/create-checkout-session/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: quote.id,
          type: 'commission_payment',
          amount: Math.round(quote.commission_amount * 100) // conversion en centimes
        })
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
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
        metadata: { source: 'Avocat', uploaded_by: user.id, uploaded_at: new Date().toISOString() }
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
    if (!error) success('Profil mis à jour', 'Vos informations et clés Stripe ont été enregistrées.')
  }

  const tabs = [
    { id: "overview", name: "Vue d'ensemble", icon: BarChart3 },
    { id: "appointments", name: "Rendez-vous", icon: Calendar },
    { id: "cases", name: "Dossiers", icon: FileText },
    { id: "quotes", name: "Gestion Devis", icon: Receipt },
    { id: "messages", name: "Messages IA", icon: MessageSquare },
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, idx) => {
          const Icon = s.icon
          return (
            <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-secondary-900">{s.value}</p>
                </div>
                <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Prochains Rendez-vous</span>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('appointments')}>Voir tout</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {appointments.slice(0, 3).map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-secondary-100 rounded-full flex items-center justify-center font-bold">
                      {(a.profiles as any)?.first_name?.[0]}{(a.profiles as any)?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{(a.profiles as any)?.first_name} {(a.profiles as any)?.last_name}</p>
                      <p className="text-xs text-secondary-500">{new Date(a.scheduled_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
              {appointments.length === 0 && <p className="p-8 text-center text-secondary-500">Aucun rendez-vous prévu.</p>}
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Analyse de Revenus</CardTitle>
              <DollarSign className="h-4 w-4 text-secondary-400" />
            </CardHeader>
            <CardContent>
              <AdvancedAreaChart data={revenueData} height={200} color="#10B981" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Plus className="h-5 w-5" />
                <span>Nouveau Dossier</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleExportClients}>
                <FileSpreadsheet className="h-5 w-5" />
                <span>Exporter Clients</span>
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  )

  const unpaidQuotes = quotes.filter(q => q.status === 'paid');

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container py-8">
        {unpaidQuotes.length > 0 && (
          <div className="mb-6 p-4.5 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500 animate-bounce">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-red-700 text-sm">Action Requise : Commission Plateforme Due ({unpaidQuotes.length})</h4>
                <p className="text-xs text-secondary-600">Vous avez reçu des paiements de clients. Veuillez verser la commission de 20% à l'administration.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="danger" className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all" onClick={() => {
                setPaymentAlarmQuote(unpaidQuotes[0]);
                playAlarmSound();
              }}>
                Régler la commission
              </Button>
            </div>
          </div>
        )}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-1">Cabinet de {profile?.first_name} {profile?.last_name}</h1>
            <p className="text-secondary-600">Interface de gestion juridique professionnelle</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchLawyerData} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
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
              className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 border-danger-200 hover:border-danger-300 flex items-center justify-center font-semibold"
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
              <CardContent className="p-2 sm:p-4 flex flex-wrap lg:flex-col gap-2 pb-2 lg:pb-0 lg:space-y-2">
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
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium whitespace-nowrap">{tab.name}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3 order-1 lg:order-2">
            {loading ? (
              <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-primary-600" /></div>
            ) : (
              <>
                {activeTab === "overview" && renderOverview()}
                {activeTab === "appointments" && (
                  <Card>
                    <CardHeader><CardTitle>Historique & Gestion des Rendez-vous</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-secondary-50 border-y">
                            <tr>
                              <th className="px-6 py-4">Client</th>
                              <th className="px-6 py-4">Date & Heure</th>
                              <th className="px-6 py-4">Notes / Sujet</th>
                              <th className="px-6 py-4">Statut</th>
                              <th className="px-6 py-4 text-right">Actions de Gestion</th>
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
                                  <td className="px-6 py-4 font-semibold">{(a.profiles as any)?.first_name} {(a.profiles as any)?.last_name}</td>
                                  <td className="px-6 py-4">{new Date(a.scheduled_at).toLocaleString('fr-FR')}</td>
                                  <td className="px-6 py-4 max-w-xs truncate text-secondary-500" title={a.notes}>{a.notes || "Aucune note fournie"}</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${label.color}`}>
                                      {label.text}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    {a.status === 'pending' && (
                                      <>
                                        <Button size="sm" className="bg-success-600 hover:bg-success-700" onClick={() => handleUpdateAppointmentStatus(a.id, 'confirmed')}>
                                          Confirmer
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleUpdateAppointmentStatus(a.id, 'cancelled')}>
                                          Réfuser
                                        </Button>
                                      </>
                                    )}
                                    {a.status === 'confirmed' && (
                                      <>
                                        <Button size="sm" className="bg-primary-600 hover:bg-primary-700" onClick={() => handleUpdateAppointmentStatus(a.id, 'completed')}>
                                          Terminer
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleUpdateAppointmentStatus(a.id, 'cancelled')}>
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
                          <div className="p-12 text-center text-secondary-400 italic">Aucun rendez-vous planifié.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {activeTab === "cases" && (
                  <Card>
                    <CardHeader className="flex justify-between items-center flex-row flex-wrap gap-4">
                      <div>
                        <CardTitle>Dossiers & Documents Clients</CardTitle>
                      </div>
                      <Button onClick={() => setDocModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau Document Client
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-secondary-50 border-y">
                            <tr>
                              <th className="px-6 py-4">Document</th>
                              <th className="px-6 py-4">Client</th>
                              <th className="px-6 py-4">Type de Document</th>
                              <th className="px-6 py-4">Date de Création</th>
                              <th className="px-6 py-4 text-right">Fichier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {cases.map((c) => {
                              const docTypeLabels: Record<string, string> = {
                                identity: "🪪 Pièce d'identité client",
                                license: "📜 Licence / Diplôme client",
                                legal_template: "📝 Modèle de document",
                                client_document: "📁 Pièce de dossier / Justificatif"
                              };
                              return (
                                <tr key={c.id} className="hover:bg-secondary-50">
                                  <td className="px-6 py-4 font-semibold text-secondary-900">{c.name}</td>
                                  <td className="px-6 py-4">
                                    {c.profiles?.first_name} {c.profiles?.last_name}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="bg-secondary-100 text-secondary-800 px-2 py-0.5 rounded text-xs">
                                      {docTypeLabels[c.type] || c.type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-secondary-500">
                                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {c.file_url ? (
                                      <a href={c.file_url} target="_blank" rel="noreferrer">
                                        <Button variant="outline" size="sm">
                                          Ouvrir
                                        </Button>
                                      </a>
                                    ) : c.metadata?.content ? (
                                      <Button variant="outline" size="sm" onClick={() => setSelectedIADoc(c)}>
                                        <Eye className="h-4 w-4 mr-2 text-primary-600" />
                                        Visualiser
                                      </Button>
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {cases.length === 0 && <div className="p-12 text-center text-secondary-400 italic">Aucun dossier disponible.</div>}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'messages' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                              <p className="font-bold text-sm">{room.profiles?.first_name} {room.profiles?.last_name}</p>
                              <p className="text-xs text-secondary-500">{room.profiles?.email}</p>
                            </button>
                          ))}
                          {chatRooms.length === 0 && <div className="p-8 text-center text-secondary-400 text-xs">Aucune conversation active.</div>}
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
                          <p>Sélectionnez un client pour discuter</p>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'outils' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-secondary-900">Mes Outils Juridiques</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {outils.map((o) => (
                        <Card key={o.id}>
                          <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between">
                              <span className="text-xs font-bold text-primary-600 uppercase">{o.category}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${o.status === 'Actif' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>{o.status}</span>
                            </div>
                            <h3 className="font-bold text-lg">{o.title}</h3>
                            <Button variant="outline" className="w-full" size="sm" onClick={() => success("Outil Ouvert", `L'outil ${o.title} a été ouvert.`)}>Ouvrir l'outil</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'quotes' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold text-secondary-900">Gestion des Devis & Honoraires</h2>
                      <Button onClick={() => setQuoteModalOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nouveau Devis</Button>
                    </div>
                    <Card>
                      <CardContent className="p-0">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-secondary-50 border-y">
                            <tr>
                              <th className="px-6 py-4">Client</th>
                              <th className="px-6 py-4">Montant (MAD)</th>
                              <th className="px-6 py-4">Status Devis</th>
                              <th className="px-6 py-4">Status Commission (20%)</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {quotes.map((q) => (
                              <tr key={q.id}>
                                <td className="px-6 py-4">{q.profiles?.first_name} {q.profiles?.last_name}</td>
                                <td className="px-6 py-4 font-bold">{q.amount}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${q.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {q.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {q.status === 'paid' ? (
                                    <span className="text-secondary-500">{q.commission_amount} MAD dû</span>
                                  ) : q.status === 'commissioned' ? (
                                    <span className="text-green-600 font-bold">Payée</span>
                                  ) : "-"}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                  {q.status === 'pending' && (
                                    <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(q.id)}>Confirmer Encaissement</Button>
                                  )}
                                  {q.status === 'paid' && (
                                    <Button size="sm" onClick={() => handlePayCommission(q)}>Payer Commission (20%)</Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {quotes.length === 0 && <div className="p-12 text-center text-secondary-400">Aucun devis créé.</div>}
                      </CardContent>
                    </Card>
                  </div>
                )}
                {activeTab === 'assistance' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold text-secondary-900">Support et Assistance</h2>
                      <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nouveau Ticket</Button>
                    </div>
                    <Card>
                      <CardContent className="p-0">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-secondary-50 border-y">
                            <tr>
                              <th className="px-6 py-4">Sujet</th>
                              <th className="px-6 py-4">Statut</th>
                              <th className="px-6 py-4">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y relative">
                            {tickets.map((ticket, idx) => (
                              <tr key={idx} className="hover:bg-secondary-50">
                                <td className="px-6 py-4">{ticket.subject}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'En cours' ? 'bg-warning-100 text-warning-700' : ticket.status === 'Résolu' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'}`}>
                                    {ticket.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">{new Date(ticket.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'profil' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-secondary-900">Mon Profil Public</h2>
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      {/* Photo */}
                      <Card>
                        <CardHeader><CardTitle>Photo de profil</CardTitle></CardHeader>
                        <CardContent className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden text-primary-700 text-3xl font-bold">
                            {(profile as any)?.avatar_url ? (
                              <img src={(profile as any).avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{profile?.first_name?.[0]}{profile?.last_name?.[0]}</span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="block">
                              <span className="sr-only">Choisir une photo</span>
                              <input type="file" accept="image/*" onChange={handleUploadAvatar}
                                className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                            </label>
                            <p className="text-xs text-secondary-400">JPG, PNG ou WEBP • max 2MB</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Disponibilité */}
                      <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-secondary-900">Disponibilité</p>
                            <p className="text-sm text-secondary-500">Apparaître comme disponible dans l'annuaire</p>
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
                          <div>
                            <label className="block text-sm font-medium mb-1">N° Barreau</label>
                            <Input value={profileForm.bar_number} onChange={e => setProfileForm(p => ({...p, bar_number: e.target.value}))} placeholder="Ex: 12345" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Années d'expérience</label>
                            <Input type="number" value={profileForm.experience_years} onChange={e => setProfileForm(p => ({...p, experience_years: parseInt(e.target.value) || 0}))} min={0} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Spécialité principale</label>
                            <Input value={profileForm.specialty} onChange={e => setProfileForm(p => ({...p, specialty: e.target.value}))} placeholder="Ex: Droit du Travail" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Biographie professionnelle</label>
                            <textarea
                                value={profileForm.bio}
                                onChange={e => setProfileForm(p => ({...p, bio: e.target.value}))}
                                rows={4}
                                placeholder="Décrivez votre parcours, vos domaines d'expertise..."
                                className="w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Configuration Stripe */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-primary-700">
                            <Sparkles className="w-5 h-5" />
                            Configuration Stripe personnelle
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 text-sm text-secondary-500 mb-2">
                            Entrez vos clés API Stripe personnelles ci-dessous pour que les paiements de vos clients aillent directement sur votre compte Stripe.
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Clé Publique Stripe (Publishable Key)</label>
                            <Input 
                              type="text" 
                              value={profileForm.stripe_public_key} 
                              onChange={e => setProfileForm(p => ({...p, stripe_public_key: e.target.value}))} 
                              placeholder="pk_live_... ou pk_test_..." 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Clé Secrète Stripe (Secret Key)</label>
                            <Input 
                              type="password" 
                              value={profileForm.stripe_secret_key} 
                              onChange={e => setProfileForm(p => ({...p, stripe_secret_key: e.target.value}))} 
                              placeholder="sk_live_... ou sk_test_..." 
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Button type="submit" className="w-full h-12 text-base font-bold">Enregistrer le profil</Button>
                    </form>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Ouvrir un ticket d'assistance</h2>
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Sujet de votre demande</label>
            <Input 
              value={ticketSubject} 
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="Ex: Problème d'accès, Bug, Question..." 
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit">Envoyer</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={quoteModalOpen} onClose={() => setQuoteModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Créer un nouveau devis</h2>
        <form onSubmit={handleCreateQuote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Dossier / Client</label>
            <select 
              className="w-full flex h-10 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm"
              value={newQuote.client_id}
              onChange={(e) => {
                const caseObj = cases.find(c => c.owner_id === e.target.value);
                setNewQuote({...newQuote, client_id: e.target.value, case_id: caseObj?.id || ''})
              }}
              required
            >
              <option value="">Sélectionner un client</option>
              {Array.from(new Set(cases.map(c => JSON.stringify({id: c.owner_id, name: `${c.profiles?.first_name} ${c.profiles?.last_name}` }))))
                .map(s => JSON.parse(s))
                .map(u => <option key={u.id} value={u.id}>{u.name}</option>)
              }
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Montant (MAD)</label>
            <Input 
              type="number"
              value={newQuote.amount}
              onChange={(e) => setNewQuote({...newQuote, amount: e.target.value})}
              placeholder="Ex: 5000"
              required
            />
            <p className="text-[10px] text-secondary-500 mt-1">Note: Une commission de 20% sera prélevée par la plateforme.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description des prestations</label>
            <textarea 
              className="w-full min-h-[100px] rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm"
              value={newQuote.description}
              onChange={(e) => setNewQuote({...newQuote, description: e.target.value})}
              placeholder="Détaillez vos honoraires..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setQuoteModalOpen(false)}>Annuler</Button>
            <Button type="submit">Générer le Devis</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={docModalOpen} onClose={() => setDocModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Ajouter un Document Client / Modèle</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleUploadLawyerDocument(newDoc.name, newDoc.type, newDoc.client_id);
          setDocModalOpen(false);
          setNewDoc({ name: '', type: 'client_document', client_id: '' });
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Dossier / Client</label>
            <select 
              className="w-full flex h-10 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={newDoc.client_id}
              onChange={(e) => setNewDoc({...newDoc, client_id: e.target.value})}
              required
            >
              <option value="">Sélectionner un client</option>
              {Array.from(new Set(cases.map(c => JSON.stringify({id: c.owner_id, name: `${c.profiles?.first_name} ${c.profiles?.last_name}` }))))
                .map(s => JSON.parse(s))
                .map(u => <option key={u.id} value={u.id}>{u.name}</option>)
              }
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom du document</label>
            <Input 
              value={newDoc.name}
              onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
              placeholder="Ex: Acte de Naissance, Statuts de Société..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Classification / Type</label>
            <select 
              className="w-full flex h-10 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
              value={newDoc.type} 
              onChange={e => setNewDoc({...newDoc, type: e.target.value})}
            >
              <option value="identity">🪪 Pièce d'identité client</option>
              <option value="license">📜 Licence / Diplôme client</option>
              <option value="legal_template">📝 Modèle de document</option>
              <option value="client_document">📁 Pièce de dossier / Justificatif</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
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
        <div className="text-center py-6">
          <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-2">Bienvenue Maître {profile?.last_name || profile?.first_name} !</h3>
          <p className="text-secondary-600 mb-6">
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
          <div className="p-5 bg-secondary-50 border border-secondary-200 rounded-2xl max-h-[60vh] overflow-y-auto whitespace-pre-wrap font-serif text-secondary-800 text-sm leading-relaxed shadow-inner">
            {selectedIADoc?.metadata?.content}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
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
              <Download className="h-4 w-4 mr-2" />
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
        <div className="text-center py-6 space-y-4">
          <div className="mx-auto h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-red-500/20">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-secondary-900">
            Paiement Client Reçu !
          </h3>
          <p className="text-sm text-secondary-600 leading-relaxed px-2">
            Le client <strong className="text-secondary-800">{paymentAlarmQuote?.profiles?.first_name || 'Citoyen'} {paymentAlarmQuote?.profiles?.last_name || ''}</strong> a payé la somme de <strong>{paymentAlarmQuote?.amount} MAD</strong> pour le devis <strong>#{paymentAlarmQuote?.id?.slice(0, 8)}</strong>.
          </p>
          <div className="bg-red-50/70 border border-red-200/50 rounded-2xl p-4.5 text-left space-y-2">
            <div className="flex justify-between text-xs text-secondary-600">
              <span>Montant versé par le client :</span>
              <span className="font-semibold text-secondary-800">{paymentAlarmQuote?.amount} MAD</span>
            </div>
            <div className="flex justify-between text-xs text-red-600 font-semibold border-t border-red-100 pt-2">
              <span>Commission due (20%) :</span>
              <span>{(paymentAlarmQuote?.amount * 0.2).toFixed(2)} MAD</span>
            </div>
          </div>
          <p className="text-xs text-secondary-500 italic">
            Pour activer le dossier, valider l'accès aux documents et à la messagerie sécurisée, vous devez régler cette commission.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all duration-200 animate-pulse"
              onClick={() => {
                const quoteToPay = {
                  ...paymentAlarmQuote,
                  commission_amount: paymentAlarmQuote.amount * 0.2
                };
                handlePayCommission(quoteToPay);
                setPaymentAlarmQuote(null);
              }}
            >
              Régler la commission maintenant (Stripe)
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-secondary-500 hover:text-secondary-600 text-xs"
              onClick={() => setPaymentAlarmQuote(null)}
            >
              Fermer et régler plus tard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DashboardLawyer