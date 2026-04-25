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
  LogOut
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import Modal from "../components/ui/Modal"
import { Input } from "../components/ui/Input"

const DashboardLawyer: React.FC = () => {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [appointments, setAppointments] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [outils, setOutils] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [ticketSubject, setTicketSubject] = useState('')

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
        
      return () => {
        supabase.removeChannel(apptSub)
        supabase.removeChannel(casesSub)
        supabase.removeChannel(techSub)
      }
    }
  }, [user])

  const fetchLawyerData = async () => {
    setLoading(true)
    await Promise.all([fetchAppointments(), fetchCases()])
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
      .select('*, profiles:owner_id(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setCases(data)
  }

  const tabs = [
    { id: "overview", name: "Vue d'ensemble", icon: BarChart3 },
    { id: "appointments", name: "Rendez-vous", icon: Calendar },
    { id: "cases", name: "Dossiers", icon: FileText },
    { id: "messages", name: "Messages IA", icon: MessageSquare },
    { id: "outils", name: "Outils Avocats", icon: PenTool },
    { id: "assistance", name: "Assistance", icon: HelpCircle }
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
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Plus className="h-5 w-5" />
              <span>Nouveau Dossier</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => window.location.href='/assistant'}>
              <MessageSquare className="h-5 w-5" />
              <span>Assistance IA</span>
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
              <CardContent className="p-2 sm:p-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0 lg:space-y-2">
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Conversations IA Assistant</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y relative">
                        {[
                          { query: "Jurisprudence licenciement abusif 2025", date: "2026-04-24", results: 12 },
                          { query: "Modèle de contrat prestation de services B2B", date: "2026-04-22", results: 1 }
                        ].map((msg, i) => (
                           <div key={i} className="p-4 flex items-center justify-between hover:bg-secondary-50">
                             <div className="flex items-center gap-3">
                               <MessageSquare className="h-5 w-5 text-accent-600" />
                               <div>
                                 <p className="font-bold">{msg.query}</p>
                                 <p className="text-xs text-secondary-500">{msg.date} • {msg.results} documents générés</p>
                               </div>
                             </div>
                             <Button size="sm" variant="ghost">Ouvrir</Button>
                           </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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
                            <Button variant="outline" className="w-full" size="sm" onClick={() => window.alert(`Ouverture de l'outil ID: ${o.id}`)}>Ouvrir l'outil</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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
    </div>
  )
}

export default DashboardLawyer