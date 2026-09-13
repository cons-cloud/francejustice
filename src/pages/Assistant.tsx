import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { 
  Paperclip, 
  Send, 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  ChevronRight, 
  X, 
  Eye, 
  BookOpen, 
  ArrowRight, 
  Trash2, 
  Loader2,
  FolderOpen,
  PlusCircle,
  FileCheck
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
import { AuthModal } from '../components/ui/AuthModal';
import { chatWithAI, type LegalAISource, type LegalAutomation } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import { generatePDF } from '../lib/pdfUtils';
import { 
  parseMultipleFiles, 
  formatDocumentsForPrompt, 
  type ParsedDocument 
} from '../lib/documentParser';

type ChatMessage = { 
  id: string; 
  role: 'user' | 'assistant' | 'system'; 
  content: string; 
  ts: number;
  sources_web?: LegalAISource[];
  sources?: string[];
  documents?: string[];
  generatedDoc?: { title: string; content: string } | null;
  suggestions?: string[];
  automations?: LegalAutomation[];
};

const AUTOSAVE_KEY = 'assistant_chat_draft_v2';

const AssistantPage: React.FC<{ embedded?: boolean }> = ({ embedded: _embedded = false }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toasts, success, error, removeToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [dossierFiles, setDossierFiles] = useState<ParsedDocument[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [guided, setGuided] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick suggestions (litiges types)
  const suggestions = useMemo(
    () => [
      t('assistant.suggest_comm', 'Litige commercial: impayé client B2B'),
      t('assistant.suggest_cons', 'Consommation: défaut de conformité e-commerce'),
      t('assistant.suggest_work', 'Travail: contestation rupture et barème prud\'homal'),
      t('assistant.suggest_family', 'Bail & Logement: retenue abusive du dépôt de garantie'),
    ],
    [t]
  );

  // Guided steps
  const guideSteps = [
    t('assistant.guide_step1', 'Importez vos documents ou décrivez les faits (dates, montants, parties).'),
    t('assistant.guide_step2', 'L\'IA analyse qui est contre qui, la chronologie et les forces du dossier.'),
    t('assistant.guide_step3', 'Évaluez ce qui est en votre faveur vs contre vous avec les textes de loi.'),
    t('assistant.guide_step4', 'Obtenez la procédure complète et générez la mise en demeure officielle.'),
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsParsingFiles(true);
    try {
      const parsed = await parseMultipleFiles(files);
      setDossierFiles((prev) => [...prev, ...parsed]);
      success(
        t('common.success', 'Succès'), 
        `${parsed.length} document(s) importé(s) : ${parsed.map(p => p.name).join(', ')}.`
      );
    } catch (err: any) {
      console.error("Erreur parsing multi-documents:", err);
      error(t('common.error', 'Erreur'), "Impossible de lire certains fichiers joints.");
    } finally {
      setIsParsingFiles(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeDossierFile = (id: string) => {
    setDossierFiles((prev) => prev.filter(f => f.id !== id));
  };

  const clearDossier = () => {
    setDossierFiles([]);
  };

  // Fetch conversations from Supabase and subscribe Realtime
  const fetchSupabaseConversations = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('ai_conversations_just')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && Array.isArray(data[0].messages)) {
        setMessages(data[0].messages);
      }
    } catch (e) {
      console.error("Erreur chargement Supabase conversations:", e);
    }
  };

  useEffect(() => {
    const draft = localStorage.getItem(AUTOSAVE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      } catch {}
    }

    if (user) {
      fetchSupabaseConversations();

      const aiSub = supabase
        .channel('ai-realtime-sub-ia-juridique')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_conversations_just', filter: `user_id=eq.${user.id}` }, () => {
          fetchSupabaseConversations();
        })
        .subscribe();

      const pendingPrompt = sessionStorage.getItem('pending_assistant_prompt');
      if (pendingPrompt) {
        sessionStorage.removeItem('pending_assistant_prompt');
        executePrompt(pendingPrompt);
      }

      return () => {
        supabase.removeChannel(aiSub);
      };
    }
  }, [user]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const appendMessage = (role: ChatMessage['role'], content: string, extra?: Partial<ChatMessage>) => {
    const msg: ChatMessage = { id: Math.random().toString(36).slice(2), role, content, ts: Date.now(), ...extra };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const executePrompt = async (promptText: string) => {
    if (!promptText.trim() && dossierFiles.length === 0) return;

    setIsSending(true);
    let fullPrompt = promptText;

    if (dossierFiles.length > 0) {
      const formattedDossier = formatDocumentsForPrompt(dossierFiles);
      fullPrompt = `${formattedDossier}\n\nQUESTION / INSTRUCTION UTILISATEUR SUR CE DOSSIER :\n${promptText || "Procédez à l'analyse complète et croisée de ce dossier : cartographie des parties (qui est contre qui), chronologie rigoureuse des faits (où et quand cela s'est produit), points en ma faveur vs risques contre moi, et procédure complète à suivre."}`;
    }

    const docNames = dossierFiles.map(d => d.name);
    const newUserMsg = appendMessage(
      'user', 
      promptText || `[Analyse approfondie de ${dossierFiles.length} document(s) du dossier : ${docNames.join(', ')}]`,
      { documents: docNames.length > 0 ? docNames : undefined }
    );
    setInput('');

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const res = await chatWithAI(fullPrompt, history, true);
      const replyText = typeof res === 'string' ? res : res.text;
      const webSources: LegalAISource[] = typeof res === 'string' ? [] : (res.sources_web || []);
      const suggestions: string[] = typeof res === 'string' ? [] : (res.suggestions || []);
      const automations: LegalAutomation[] = typeof res === 'string' ? [] : (res.automations || []);

      // Extract legal references
      const lawMatches = replyText.match(/Article\s+[A-Z0-9.-]+(?:\s+du\s+Code\s+[a-zàáâäçèéêëîïôöùûü]+)?|Code\s+Civil|Code\s+du\s+Travail|Code\s+Pénal|Code\s+de\s+Commerce|Cour\s+de\s+Cassation|RGPD|CJUE|CEDH/gi) || [];
      const uniqueSources: string[] = Array.from(new Set<string>(lawMatches)).slice(0, 6);

      // Parse AI Action block if returned
      let cleanTextResponse = replyText;
      let generatedDocObj: { title: string; content: string } | null = null;
      const actionMatch = replyText.match(/```action([\s\S]*?)```/);
      
      if (actionMatch) {
        try {
          const actionData = JSON.parse(actionMatch[1].trim());
          cleanTextResponse = replyText.replace(/```action[\s\S]*?```/, '').trim();
          
          if (actionData.type === 'CREATE_DOCUMENT' && actionData.payload) {
            generatedDocObj = {
              title: actionData.payload.title || 'Document Juridique Officiel',
              content: actionData.payload.content || cleanTextResponse
            };
          } else if (actionData.type === 'SWITCH_TAB' && actionData.payload?.tab) {
            const targetTab = actionData.payload.tab;
            setTimeout(() => {
              navigate(`/dashboard/user?tab=${targetTab}`);
            }, 1800);
          }
        } catch (e: unknown) {
          console.warn("Erreur parsing action JSON:", e);
        }
      }

      const assistantMsg: ChatMessage = { 
        id: Math.random().toString(36).slice(2), 
        role: 'assistant', 
        content: cleanTextResponse, 
        ts: Date.now(),
        sources_web: webSources,
        sources: uniqueSources,
        generatedDoc: generatedDocObj,
        suggestions,
        automations
      };

      const updatedMessages = [...messages, newUserMsg, assistantMsg];
      setMessages(updatedMessages);

      if (user) {
        await supabase.from('ai_conversations_just').insert([{
          user_id: user.id,
          prompt: fullPrompt,
          response: cleanTextResponse,
          sources: uniqueSources
        }]);
      }
    } catch (err: unknown) {
      console.error("Erreur IA Assistant:", err);
      appendMessage('assistant', "Une erreur est survenue lors de l'analyse. Nos serveurs juridiques sécurisés restent disponibles.");
    } finally {
      setIsSending(false);
    }
  };

  const copyMessage = async (m: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 1200);
      success(t('assistant.copied_title', 'Copié'), t('assistant.copied_desc', 'Le contenu a été copié.'));
    } catch {
      error(t('assistant.copy_failed', 'Impossible de copier'));
    }
  };

  const exportConversationPDF = () => {
    const fullText = messages
      .map(m => `[${m.role === 'user' ? 'UTILISATEUR' : 'ASSISTANT IA EXPERT'}]\n${m.content}`)
      .join('\n\n' + '='.repeat(40) + '\n\n');

    generatePDF(fullText, {
      title: 'Compte-Rendu de Consultation — IA Juridique',
      subtitle: 'France Justice — Analyse & Recherche Légifrance / UE',
      filename: `consultation_ia_juridique_${new Date().toISOString().slice(0,10)}`
    });
  };

  const downloadDocAsPDF = (doc: { title: string; content: string }) => {
    generatePDF(doc.content, {
      title: doc.title,
      filename: doc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')
    });
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container py-6 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* Main Legal AI Workspace */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <Card className="border-2 border-cyan-200/80 shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-5 border-b border-cyan-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur-xs rounded-2xl flex items-center justify-center shadow-md">
                    <Sparkles className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                      IA Juridique & Recherche Légifrance / UE
                      <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 bg-white/20 text-white rounded-full border border-white/30 font-bold">
                        Direct
                      </span>
                    </CardTitle>
                    <p className="text-xs text-cyan-50 font-medium">
                      Analyse textuelle approfondie, dossiers PDF & recherches de jurisprudences en temps réel
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={exportConversationPDF} className="bg-white/15 text-white border-white/30 hover:bg-white/25 font-bold text-xs">
                  <Download className="h-4 w-4 mr-1.5" />
                  {t('assistant.export_pdf', 'Exporter PDF')}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5 bg-white">
              
              {/* Conversation Display Area */}
              <div className={`${messages.length === 0 ? 'h-36 sm:h-44' : 'h-[50vh] sm:h-[55vh]'} overflow-y-auto space-y-5 p-4 bg-slate-50/80 rounded-2xl border border-slate-200 scrollbar-thin`}>
                {messages.length === 0 && (
                  <div className="bg-white border-2 border-cyan-200 rounded-2xl p-5 space-y-3 text-slate-900 shadow-sm">
                    <p className="text-slate-900 text-base leading-relaxed font-semibold">
                      Bonjour ! Bienvenue sur le module de recherche et d'analyse de l'**IA Juridique**.
                    </p>
                    <p className="text-sm text-slate-600">
                      Vous pouvez rédiger une question détaillée, importer vos **dossiers PDF, contrats et jugements**, ou choisir un exemple dans la colonne de droite.
                    </p>
                  </div>
                )}

                {messages.map((m) => (
                  <div key={m.id} className="space-y-3">
                    <div className={`p-5 rounded-2xl border ${
                      m.role === 'user' 
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-cyan-500 shadow-md ml-auto max-w-[90%]' 
                        : 'bg-white border-2 border-cyan-200/90 text-slate-900 mr-auto max-w-[95%] shadow-sm space-y-3.5'
                    }`}>
                      <div className={`flex items-center justify-between mb-1 border-b pb-2 ${m.role === 'user' ? 'border-cyan-400/50' : 'border-slate-200'}`}>
                        <div className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${m.role === 'user' ? 'text-cyan-100' : 'text-cyan-700'}`}>
                          {m.role === 'user' ? (
                            'Vous'
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 text-cyan-600 animate-pulse" />
                              IA Juridique Expert
                            </>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyMessage(m)} className={`p-1 h-auto ${m.role === 'user' ? 'text-white/80 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                          {copiedId === m.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Display attached dossier documents badges if present in this user message */}
                      {m.documents && m.documents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1 pb-2 border-b border-white/25 mb-2">
                          <span className="text-[11px] font-bold text-cyan-100 flex items-center gap-1 w-full uppercase tracking-wider">
                            <FolderOpen className="h-3.5 w-3.5 text-cyan-200" /> Dossier lié ({m.documents.length} pièce(s)) :
                          </span>
                          {m.documents.map((docName, idx) => (
                            <span key={idx} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium border border-white/20 shadow-2xs">
                              <FileText className="h-3 w-3 text-cyan-200 shrink-0" /> {docName}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={`whitespace-pre-wrap leading-relaxed font-medium font-sans text-base sm:text-lg ${m.role === 'user' ? 'text-white' : 'text-slate-900'}`}>
                        {m.content}
                      </div>

                      {/* Legal Sources badges */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2 items-center">
                          <span className="text-xs font-extrabold text-cyan-800 uppercase flex items-center gap-1.5 mr-1">
                            <BookOpen className="h-4 w-4 text-cyan-600" /> Textes détectés :
                          </span>
                          {m.sources.map((src, i) => (
                            <span key={i} className="text-xs bg-cyan-50 text-cyan-800 border border-cyan-300 px-3 py-1 rounded-full font-bold shadow-2xs">
                              {src}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Real-time Google Search sources */}
                      {/* Actionable Automations Widget */}
                      {m.automations && m.automations.length > 0 && (
                        <div className="pt-3.5 border-t border-slate-200 space-y-2">
                          <span className="text-xs font-black text-cyan-900 uppercase flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-cyan-600 animate-pulse" /> Automatisations & Actions Recommandées :
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {m.automations.map((auto: LegalAutomation, idx: number) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => executePrompt(auto.actionPrompt)}
                                disabled={isSending}
                                className="text-left bg-gradient-to-br from-cyan-50/90 to-white hover:from-cyan-100 hover:to-cyan-50 border border-cyan-200 hover:border-cyan-400 p-3 rounded-xl transition-all shadow-xs cursor-pointer group flex flex-col justify-between gap-1.5"
                              >
                                <div>
                                  <span className="text-xs font-black text-cyan-950 group-hover:text-cyan-800 transition-colors block">
                                    {auto.label}
                                  </span>
                                  <p className="text-2xs text-slate-600 leading-snug line-clamp-2 mt-0.5">
                                    {auto.description}
                                  </p>
                                </div>
                                <span className="text-2xs font-extrabold text-cyan-700 flex items-center gap-1 group-hover:underline pt-0.5">
                                  ⚡ Déclencher en 1 clic <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Suggestions Chips */}
                      {m.suggestions && m.suggestions.length > 0 && (
                        <div className="pt-3 border-t border-slate-200 space-y-2">
                          <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
                            <ChevronRight className="h-4 w-4 text-cyan-600" /> Suggestions de Poursuite :
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {m.suggestions.map((sug: string, idx: number) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => executePrompt(sug)}
                                disabled={isSending}
                                className="text-xs bg-slate-100 hover:bg-cyan-50 text-slate-800 hover:text-cyan-900 border border-slate-200 hover:border-cyan-300 py-1.5 px-3 rounded-full font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 text-left"
                              >
                                <span>{sug}</span>
                                <ArrowRight className="h-3 w-3 text-cyan-600 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Official State Sites & External Professional Portals */}
                      {m.sources_web && m.sources_web.length > 0 && (
                        <div className="pt-3.5 border-t border-slate-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4 text-cyan-600" /> Portails & Sites Officiels Recommandés :
                            </span>
                            <span className="text-2xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {m.sources_web.length} sources vérifiées
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {m.sources_web.map((source: LegalAISource, i: number) => {
                              const isOfficial = source.category === 'officiel' || source.category === 'juridiction';
                              return (
                                <a 
                                  key={i}
                                  href={source.uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 hover:bg-cyan-50/70 border border-slate-200 hover:border-cyan-300 rounded-xl p-3 transition-all group cursor-pointer shadow-2xs text-slate-900"
                                >
                                  <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                                    <div className={`p-2 rounded-lg shrink-0 ${isOfficial ? 'bg-emerald-100 border border-emerald-200 text-emerald-800' : 'bg-cyan-100 border border-cyan-200 text-cyan-800'}`}>
                                      <BookOpen className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                        <span className={`text-2xs font-black px-2 py-0.5 rounded-full border ${isOfficial ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200'}`}>
                                          {source.badge || (isOfficial ? "🏛️ Site Officiel de l'État" : "🌐 Portail Métier")}
                                        </span>
                                        <span className="text-xs sm:text-sm text-slate-900 font-bold line-clamp-1 group-hover:text-cyan-800 transition-colors">
                                          {source.title || "Portail Juridique Officiel"}
                                        </span>
                                      </div>
                                      {source.description && (
                                        <p className="text-2xs text-slate-500 line-clamp-2 leading-relaxed">
                                          {source.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs text-cyan-700 font-extrabold group-hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 self-end sm:self-center">
                                    Accéder au site <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* PDF Generated Document Widget */}
                      {m.generatedDoc && (
                        <div className="mt-4 bg-gradient-to-br from-cyan-50 to-teal-50/60 border-2 border-cyan-300 rounded-2xl p-4 space-y-3 shadow-md text-slate-900">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-cyan-100 p-2.5 rounded-xl border border-cyan-300">
                                <FileText className="h-6 w-6 text-cyan-700" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-cyan-800 uppercase tracking-wide">Document PDF Prêt</h4>
                                <p className="text-sm text-slate-900 font-black line-clamp-1">{m.generatedDoc.title}</p>
                              </div>
                            </div>
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded-full font-black flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 text-emerald-600" /> Enregistré
                            </span>
                          </div>
                          <div className="flex gap-2.5">
                            <button 
                              type="button"
                              onClick={() => downloadDocAsPDF(m.generatedDoc!)}
                              className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
                            >
                              <Download className="h-4 w-4" />
                              Télécharger PDF
                            </button>
                            <button 
                              type="button"
                              onClick={() => setPreviewDoc(m.generatedDoc!)}
                              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                              Aperçu
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-center gap-3 py-3.5 px-4 bg-cyan-50 rounded-xl border border-cyan-200 text-cyan-900 text-sm font-bold shadow-2xs">
                    <Loader2 className="h-5 w-5 text-cyan-600 animate-spin" />
                    <span>Analyse juridique approfondie du dossier (chronologie, parties, forces &amp; procédure)...</span>
                  </div>
                )}
              </div>

              {/* Parsing status loader */}
              {isParsingFiles && (
                <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  <span>Lecture et extraction du texte des pièces du dossier en cours...</span>
                </div>
              )}

              {/* ACTIVE DOSSIER PANEL */}
              {dossierFiles.length > 0 && (
                <div className="bg-cyan-50/90 border-2 border-cyan-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-cyan-600 text-white rounded-lg">
                        <FolderOpen className="h-4 w-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide">
                        Dossier Actif : {dossierFiles.length} document(s) sous analyse continue
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-cyan-700 hover:text-cyan-800 bg-white hover:bg-cyan-100 border border-cyan-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <PlusCircle className="h-3.5 w-3.5 text-cyan-600" />
                        <span>Ajouter d'autres pièces</span>
                      </button>
                      <button
                        type="button"
                        onClick={clearDossier}
                        className="text-xs font-bold text-slate-500 hover:text-red-600 px-2 py-1.5 cursor-pointer transition-colors"
                        title="Vider les pièces du dossier actif"
                      >
                        Vider
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                    {dossierFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 bg-white border border-cyan-300 text-slate-900 text-xs px-3 py-1.5 rounded-xl shadow-2xs">
                        <FileCheck className="h-4 w-4 text-cyan-600 shrink-0" />
                        <span className="font-bold line-clamp-1 max-w-[200px]">{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">({Math.round(file.size / 1024)} Ko)</span>
                        <button
                          type="button"
                          onClick={() => removeDossierFile(file.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors ml-1 p-0.5 cursor-pointer"
                          title="Retirer cette pièce du dossier"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ENLARGED FULL-WIDTH INPUT AREA & CONTROLS TOOLBAR */}
              <div className="space-y-3 pt-1">
                <div className="relative w-full">
                  <Textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder={
                      dossierFiles.length > 0 
                        ? `Dossier actif (${dossierFiles.length} pièces) : posez vos questions ou instructions (ex: Qui est contre qui ? Quels sont les risques contre moi ? Quelle est la procédure ? Rédige la mise en demeure...).` 
                        : "Écrivez votre question juridique détaillée, votre litige ou importez plusieurs dossiers/documents (PDF, Word, Factures, Baux)..."
                    } 
                    rows={8}
                    className="w-full min-h-[180px] sm:min-h-[220px] bg-white border-2 border-slate-300 focus:border-cyan-500 text-slate-900 placeholder-slate-400 text-base sm:text-lg rounded-2xl p-4 font-medium focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner leading-relaxed resize-y"
                  />
                </div>

                {/* Control Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      multiple 
                      accept=".pdf,.txt,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.json,.csv,.odt,.ods,.rtf" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="bg-white hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 border-slate-300 hover:border-cyan-400 p-3 rounded-xl cursor-pointer shadow-xs flex items-center justify-center shrink-0"
                      title="Joindre un ou plusieurs documents au dossier (PDF, Word, Excel, Image, Texte)"
                    >
                      <Paperclip className="h-5 w-5 text-cyan-600" />
                    </Button>

                    {(input || dossierFiles.length > 0) && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setInput(''); clearDossier(); }}
                        className="text-slate-500 hover:text-red-500 text-xs font-semibold py-2 px-3"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Effacer
                      </Button>
                    )}
                  </div>

                  <Button 
                    type="button" 
                    onClick={() => executePrompt(input)} 
                    disabled={isSending || isParsingFiles || (!input.trim() && dossierFiles.length === 0)}
                    className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white border border-cyan-400 px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-cyan-600/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer ml-auto"
                  >
                    <Send className="h-4.5 w-4.5" />
                    <span>{isSending ? t('assistant.sending', 'Analyse en cours...') : 'Envoyer l\'analyse juridique'}</span>
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right rail - Quick Suggestions & Guided Mode */}
        <div className="lg:col-span-1 xl:col-span-2 space-y-6 lg:sticky lg:top-24 self-start">
          <Card className="border-2 border-cyan-200/60 shadow-md bg-white">
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-t-xl p-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-200" />
                {t('assistant.quick_suggestions', 'Suggestions rapides')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2.5 bg-white">
              {suggestions.map((s, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setInput(prev => (prev ? prev + '\n' : '') + s)}
                  className="bg-white hover:bg-cyan-50 text-slate-800 hover:text-cyan-800 border-slate-200 hover:border-cyan-300 text-xs font-semibold p-3 text-left justify-start h-auto whitespace-normal leading-snug rounded-xl cursor-pointer shadow-2xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-cyan-600 shrink-0" />
                  <span>{s}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-2 border-cyan-200/60 shadow-md bg-white">
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-t-xl p-4 flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-white">{t('assistant.guided_mode', 'Mode guidé')}</CardTitle>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-cyan-100">{guided ? t('common.yes') : t('common.no')}</label>
                <input type="checkbox" checked={guided} onChange={e => setGuided(e.target.checked)} className="h-4 w-4 accent-cyan-600 cursor-pointer" />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 bg-white">
              {guided && guideSteps.map((st, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-800 font-medium">
                  <ChevronRight className="h-4 w-4 text-cyan-600 mt-0.5 shrink-0" />
                  <span>{st}</span>
                </div>
              ))}
              {!guided && (
                <div className="text-xs text-slate-500 font-medium">{t('assistant.guided_mode_desc', 'Activez le mode guidé pour vous assister étape par étape.')}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Preview Portal Modal */}
      {previewDoc && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-cyan-300 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
            <div className="p-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white flex items-center justify-between border-b border-cyan-500">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-white" />
                {previewDoc.title}
              </h3>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-serif text-slate-900 text-sm whitespace-pre-wrap leading-relaxed bg-white">
              {previewDoc.content}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <Button onClick={() => downloadDocAsPDF(previewDoc)} className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default AssistantPage;
