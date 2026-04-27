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
  Receipt
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

const DashboardLawyer: React.FC = () => {
  const { user, profile } = useAuth()
  const { success } = useToast()
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [ticketSubject, setTicketSubject] = useState('')
  const [newQuote, setNewQuote] = useState({ client_id: '', amount: '', description: '', case_id: '' })
  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', phone: '', city: '', postal_code: '',
    bio: '', specialty: '', bar_number: '', experience_years: 0, is_available: true
  })

  useEffect(() => {
    if (profile && !sessionStorage.getItem('lawyer_welcome_shown')) {
      setShowWelcome(true)
      sessionStorage.setItem('lawyer_welcome_shown', 'true')
    }
    if (profile) {
      setProfileForm({
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
      })
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
          table: 'appointments', 
          filter: `lawyer_id=eq.${user.id}` 
        }, () => fetchAppointments())
        .subscribe()

      const casesSub = supabase
        .channel('lawyer-cases-updates')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'documents' 
        }, () => fetchCases())
        .subscribe()
      const techSub = supabase
        .channel('lawyer-tech-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'outils' }, () => fetchOutils())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_tickets', filter: `user_id=eq.${user.id}` }, () => fetchTickets())
        .subscribe()
        
      const quotesSub = supabase
        .channel(`lawyer-quotes-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes', filter: `lawyer_id=eq.${user.id}` }, () => fetchQuotes())
        .subscribe()
        
      return () => {
        supabase.removeChannel(apptSub)
        supabase.removeChannel(casesSub)
        supabase.removeChannel(techSub)
        supabase.removeChannel(quotesSub)
      }
    }
  }, [user])

  const fetchLawyerData = async () => {
    setLoading(true)
    await Promise.all([fetchAppointments(), fetchCases(), fetchQuotes(), fetchChatRooms()])
    fetchOutils()
    fetchTickets()
    setLoading(false)
  }

  const fetchOutils = async () => {
    const { data } = await supabase.from('outils').select('*').order('created_at', { ascending: false })
    if (data) setOutils(data)
  }

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase.from('assistance_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setTickets(data)
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketSubject) return;
    await supabase.from('assistance_tickets').insert([{ user_id: user.id, subject: ticketSubject, status: 'En attente' }]);
    setModalOpen(false);
    setTicketSubject('');
  }

  const fetchAppointments = async () => {
    if (!user) return
    const { data } = await supabase
      .from('appointments')
      .select('*, profiles(first_name, last_name, email)')
      .eq('lawyer_id', user.id)
      .order('scheduled_at', { ascending: true })
    if (data) setAppointments(data)
  }

  const fetchCases = async () => {
    if (!user) return
    const { data } = await supabase
      .from('documents')
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
      .from('quotes')
      .select('*, profiles:client_id(first_name, last_name, email)')
      .eq('lawyer_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setQuotes(data)
  }

  const fetchChatRooms = async () => {
    if (!user) return
    const { data } = await supabase
      .from('chat_rooms')
      .select('*, profiles:client_id(first_name, last_name, email)')
      .eq('lawyer_id', user.id)
    if (data) setChatRooms(data)
  }

  const handleOpenChat = async (clientId: string, clientName: string) => {
    // Check if room exists
    let room = chatRooms.find(r => r.client_id === clientId)
    
    if (!room) {
      const { data } = await supabase
        .from('chat_rooms')
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
    
    const { error } = await supabase.from('quotes').insert([{
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
      .from('quotes')
      .update({ status: 'paid' })
      .eq('id', quoteId);
    
    if (!error) {
      fetchQuotes();
    }
  }

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const filePath = `${user.id}/avatar.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id)
      success('Photo mise à jour', 'Votre photo de profil a été enregistrée.')
    } else {
      success('Info', 'Photo mise à jour localement (éventuellement bucket à créer dans Supabase).')
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
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
      updated_at: new Date().toISOString()
    }).eq('id', user.id)
    if (!error) success('Profil mis à jour', 'Vos informations ont été enregistrées.')
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

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-1">Cabinet de {profile?.first_name} {profile?.last_name}</h1>
            <p className="text-secondary-600">Interface de gestion juridique professionnelle</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchLawyerData} variant="ghost" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
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
                    <CardHeader><CardTitle>Historique des Rendez-vous</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-secondary-50 border-y">
                            <tr><th className="px-6 py-4">Client</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Statut</th></tr>
                          </thead>
                          <tbody className="divide-y">
                            {appointments.map((a) => (
                              <tr key={a.id} className="hover:bg-secondary-50">
                                <td className="px-6 py-4">{(a.profiles as any)?.first_name} {(a.profiles as any)?.last_name}</td>
                                <td className="px-6 py-4">{new Date(a.scheduled_at).toLocaleString()}</td>
                                <td className="px-6 py-4">{a.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {activeTab === "cases" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Dossiers & Documents Clients</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-secondary-50 border-y">
                            <tr>
                              <th className="px-6 py-4">Document</th>
                              <th className="px-6 py-4">Client</th>
                              <th className="px-6 py-4">Type</th>
                              <th className="px-6 py-4">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {cases.map((c) => (
                              <tr key={c.id} className="hover:bg-secondary-50">
                                <td className="px-6 py-4 font-medium">{c.name}</td>
                                <td className="px-6 py-4">
                                  {c.profiles?.first_name} {c.profiles?.last_name}
                                </td>
                                <td className="px-6 py-4">{c.type}</td>
                                <td className="px-6 py-4 text-secondary-500">
                                  {new Date(c.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
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
    </div>
  )
}

export default DashboardLawyer