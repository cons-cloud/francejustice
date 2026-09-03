import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
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
  Loader2 
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
import { AuthModal } from '../components/ui/AuthModal';
import { chatWithAI } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import { generatePDF } from '../lib/pdfUtils';

type ChatMessage = { 
  id: string; 
  role: 'user' | 'assistant' | 'system'; 
  content: string; 
  ts: number;
  sources_web?: any[];
  sources?: string[];
  generatedDoc?: { title: string; content: string } | null;
};

const AUTOSAVE_KEY = 'assistant_chat_draft_v2';

const AssistantPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toasts, success, error, removeToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string; type: string }[]>([]);
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
      t('assistant.suggest_work', 'Travail: harcèlement moral en entreprise'),
      t('assistant.suggest_family', 'Famille: demande de pension alimentaire'),
    ],
    [t]
  );

  // Guided steps
  const guideSteps = [
    t('assistant.guide_step1', 'Décrivez brièvement le litige (dates, parties, contexte).'),
    t('assistant.guide_step2', 'Précisez les faits essentiels et les preuves disponibles.'),
    t('assistant.guide_step3', 'Indiquez le préjudice et l’objectif recherché.'),
    t('assistant.guide_step4', 'Ajoutez toute contrainte de délai connue (prescription).'),
  ];

  // Binary PDF text parser in browser
  const extractTextFromPDFBuffer = (buffer: ArrayBuffer): string => {
    try {
      const bytes = new Uint8Array(buffer);
      let raw = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        raw += String.fromCharCode.apply(null, Array.from(chunk));
      }

      const matches = raw.match(/\(([^()]{2,})\)/g);
      if (matches && matches.length > 0) {
        const extracted = matches
          .map(m => m.slice(1, -1))
          .filter(str => /[a-zA-Zàáâäæçèéêëîïôœùûüÿ0-9]/i.test(str) && !/^\/[A-Z]/i.test(str))
          .join(' ')
          .replace(/\s+/g, ' ');
        if (extracted.trim().length > 20) {
          return extracted;
        }
      }

      const words = raw.match(/[A-Za-zÀ-ÿ0-9,.'’\-–—:;!?]{2,}/g);
      if (words && words.length > 0) {
        const pdfKeywords = new Set(['obj', 'endobj', 'stream', 'endstream', 'Catalog', 'Pages', 'Page', 'MediaBox', 'Resources', 'Font', 'Type', 'Subtype', 'BaseFont', 'Length', 'Filter', 'FlateDecode', 'ProcSet']);
        const cleanWords = words.filter(w => !pdfKeywords.has(w) && !w.startsWith('/'));
        return cleanWords.join(' ').replace(/\s+/g, ' ');
      }
    } catch (err) {
      console.warn("Erreur d'extraction du PDF:", err);
    }
    return "Document PDF importé avec succès. Prêt pour l'analyse juridique.";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        reader.onload = (event) => {
          const buffer = event.target?.result as ArrayBuffer;
          if (buffer) {
            const extractedText = extractTextFromPDFBuffer(buffer);
            setAttachedFiles((prev) => [
              ...prev,
              {
                name: file.name,
                content: extractedText.length > 25000 ? extractedText.substring(0, 25000) + "\n...[Document PDF tronqué]" : extractedText,
                type: 'application/pdf'
              }
            ]);
            success(t('common.success', 'Succès'), `Pièce PDF "${file.name}" importée et analysée.`);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            setAttachedFiles((prev) => [
              ...prev,
              {
                name: file.name,
                content: result.length > 25000 ? result.substring(0, 25000) + "\n...[Contenu du document tronqué]" : result,
                type: file.type || 'text/plain'
              }
            ]);
            success(t('common.success', 'Succès'), `Document "${file.name}" chargé.`);
          }
        };
        reader.readAsText(file);
      }
    });
    e.target.value = '';
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
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
    if (!promptText.trim() && attachedFiles.length === 0) return;

    setIsSending(true);
    let fullPrompt = promptText;

    if (attachedFiles.length > 0) {
      fullPrompt = `=== PIÈCES JOINTES & DOSSIERS JURIDIQUES SOUMIS POUR ANALYSE ===\n${attachedFiles.map((f, idx) => `--- Document [${idx + 1}]: ${f.name} ---\n${f.content}`).join('\n\n')}\n\nQUESTION / INSTRUCTION UTILISATEUR :\n${promptText || "Analysez complètement ce dossier et donnez-moi la marche à suivre."}`;
    }

    const newUserMsg = appendMessage('user', promptText || `[Analyse de ${attachedFiles.length} document(s)]`);
    const currentFiles = [...attachedFiles];
    setAttachedFiles([]);
    setInput('');

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const res = await chatWithAI(fullPrompt, history, true);
      const replyText = typeof res === 'string' ? res : res.text;
      const webSources = typeof res === 'string' ? [] : (res.sources_web || []);

      // Extract legal references
      const lawMatches = replyText.match(/Article\s+[A-Z0-9.\-]+(?:\s+du\s+Code\s+[a-zàáâäçèéêëîïôöùûü]+)?|Code\s+Civil|Code\s+du\s+Travail|Code\s+Pénal|Code\s+de\s+Commerce|Cour\s+de\s+Cassation|RGPD|CJUE|CEDH/gi) || [];
      const uniqueSources = Array.from(new Set(lawMatches)).slice(0, 6);

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
        } catch (e) {
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
        generatedDoc: generatedDocObj
      };

      const updatedMessages = [...messages, newUserMsg, assistantMsg];
      setMessages(updatedMessages);

      if (user) {
        await supabase
          .from('ai_conversations_just')
          .insert([
            {
              user_id: user.id,
              title: promptText.slice(0, 40) || t('assistant.new_chat', 'Nouvelle conversation'),
              messages: updatedMessages
            }
          ]);
      }
    } catch (e: any) {
      error(t('common.error'), e.message || t('assistant.failed', 'Le traitement a échoué.'));
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
          <Card className="border-2 border-indigo-200/60 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-5 border-b border-indigo-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                    <Sparkles className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                      IA Juridique & Recherche Légifrance / UE
                      <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/30 font-bold">
                        Direct
                      </span>
                    </CardTitle>
                    <p className="text-xs text-slate-300 font-medium">
                      Analyse textuelle approfondie, dossiers PDF & recherches de jurisprudences en temps réel
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={exportConversationPDF} className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 font-bold text-xs">
                  <Download className="h-4 w-4 mr-1.5" />
                  {t('assistant.export_pdf', 'Exporter PDF')}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5 bg-slate-950">
              
              {/* Conversation Display Area */}
              <div className={`${messages.length === 0 ? 'h-36 sm:h-44' : 'h-[50vh] sm:h-[55vh]'} overflow-y-auto space-y-5 p-4 bg-[#080c14] rounded-2xl border-2 border-slate-800 scrollbar-thin`}>
                {messages.length === 0 && (
                  <div className="bg-[#131c2e] border-2 border-amber-400/40 rounded-2xl p-5 space-y-3 text-white">
                    <p className="text-white text-base leading-relaxed font-semibold">
                      Bonjour ! Bienvenue sur le module de recherche et d'analyse de l'**IA Juridique**.
                    </p>
                    <p className="text-sm text-slate-300">
                      Vous pouvez rédiger une question détaillée, importer vos **dossiers PDF, contrats et jugements**, ou choisir un exemple dans la colonne de droite.
                    </p>
                  </div>
                )}

                {messages.map((m) => (
                  <div key={m.id} className="space-y-3">
                    <div className={`p-5 rounded-2xl border ${
                      m.role === 'user' 
                        ? 'bg-[#182033] border-slate-600 text-white ml-auto max-w-[90%]' 
                        : 'bg-[#131c2e] border-2 border-amber-400/40 text-white mr-auto max-w-[95%] shadow-xl space-y-3.5'
                    }`}>
                      <div className="flex items-center justify-between mb-1 border-b border-slate-700 pb-2">
                        <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          {m.role === 'user' ? (
                            'Vous'
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                              IA Juridique Expert
                            </>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyMessage(m)} className="text-slate-300 hover:text-white p-1 h-auto">
                          {copiedId === m.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="whitespace-pre-wrap leading-relaxed text-white font-semibold font-sans text-base sm:text-lg">
                        {m.content}
                      </div>

                      {/* Legal Sources badges */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="pt-3 border-t border-slate-700 flex flex-wrap gap-2 items-center">
                          <span className="text-xs font-extrabold text-amber-400 uppercase flex items-center gap-1.5 mr-1">
                            <BookOpen className="h-4 w-4 text-amber-400" /> Textes détectés :
                          </span>
                          {m.sources.map((src, i) => (
                            <span key={i} className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full font-black shadow-sm">
                              {src}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Real-time Google Search sources */}
                      {m.sources_web && m.sources_web.length > 0 && (
                        <div className="pt-3.5 border-t border-slate-700 space-y-2">
                          <span className="text-xs font-black text-amber-400 uppercase flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" /> Sources & Jurisprudences (Google Search) :
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {m.sources_web.slice(0, 4).map((source: any, i: number) => (
                              <a 
                                key={i}
                                href={source.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between gap-3 bg-[#1c2942] hover:bg-[#253658] border border-slate-700 hover:border-amber-400 rounded-xl p-3 transition-all group cursor-pointer shadow-sm text-white"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="bg-amber-400/10 border border-amber-400/30 p-2 rounded-lg group-hover:border-amber-400 transition-colors">
                                    <BookOpen className="h-4 w-4 text-amber-400" />
                                  </div>
                                  <span className="text-xs sm:text-sm text-white font-bold line-clamp-1 group-hover:text-amber-300 transition-colors">
                                    {source.title || "Source Juridique Officielle"}
                                  </span>
                                </div>
                                <span className="text-xs text-amber-400 font-extrabold group-hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                  Lire <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PDF Generated Document Widget */}
                      {m.generatedDoc && (
                        <div className="mt-4 bg-gradient-to-br from-[#1c2942] to-[#131c2e] border-2 border-amber-400/40 rounded-2xl p-4 space-y-3 shadow-lg text-white">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-amber-400/20 p-2.5 rounded-xl border border-amber-400/40">
                                <FileText className="h-6 w-6 text-amber-400" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide">Document PDF Prêt</h4>
                                <p className="text-sm text-white font-black line-clamp-1">{m.generatedDoc.title}</p>
                              </div>
                            </div>
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-black flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 text-emerald-400" /> Enregistré
                            </span>
                          </div>
                          <div className="flex gap-2.5">
                            <button 
                              type="button"
                              onClick={() => downloadDocAsPDF(m.generatedDoc!)}
                              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
                            >
                              <Download className="h-4 w-4" />
                              Télécharger PDF
                            </button>
                            <button 
                              type="button"
                              onClick={() => setPreviewDoc(m.generatedDoc!)}
                              className="bg-[#1c2942] hover:bg-[#253658] text-white border border-slate-700 text-xs font-bold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                  <div className="flex items-center gap-3 py-3.5 px-4 bg-[#131c2e] rounded-xl border border-slate-700 text-amber-300 text-sm font-bold shadow-md">
                    <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
                    <span>Recherche Légifrance et analyse approfondie du dossier...</span>
                  </div>
                )}
              </div>

              {/* Attachment Chip List */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 w-full">
                    <Paperclip className="h-3.5 w-3.5 text-amber-400" /> {attachedFiles.length} Document(s) PDF / Pièce(s) importée(s) :
                  </span>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-[#1c2942] border border-amber-400/40 text-white text-xs px-2.5 py-1 rounded-xl shadow-sm">
                      <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="line-clamp-1 max-w-[150px] font-semibold">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachedFile(idx)}
                        className="text-slate-400 hover:text-red-400 transition-colors ml-1 p-0.5"
                        title="Supprimer la pièce jointe"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ENLARGED FULL-WIDTH INPUT AREA & CONTROLS TOOLBAR */}
              <div className="space-y-3 pt-1">
                <div className="relative w-full">
                  <Textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder={attachedFiles.length > 0 ? `Analysez et traitez les ${attachedFiles.length} document(s) PDF joint(s)... Posez votre question ou vos instructions ici.` : "Écrivez votre question juridique détaillée, votre litige ou importez un dossier PDF..."} 
                    rows={8}
                    className="w-full min-h-[180px] sm:min-h-[220px] bg-[#131c2e] border-2 border-slate-700 focus:border-amber-400 text-white placeholder-slate-400 text-base sm:text-lg rounded-2xl p-4 font-medium focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner leading-relaxed resize-y"
                  />
                </div>

                {/* Control Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Input 
                      ref={fileInputRef} 
                      type="file" 
                      multiple 
                      accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.json,.csv" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="bg-[#131c2e] hover:bg-[#1c2942] text-amber-300 border-slate-700 hover:border-amber-400 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl cursor-pointer"
                    >
                      <Paperclip className="h-4 w-4 mr-2 text-amber-400" />
                      {t('assistant.attach', 'Joindre des fichiers / PDF')}
                    </Button>

                    {(input || attachedFiles.length > 0) && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setInput(''); setAttachedFiles([]); }}
                        className="text-slate-400 hover:text-red-400 text-xs font-semibold py-2 px-3"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Effacer
                      </Button>
                    )}
                  </div>

                  <Button 
                    type="button" 
                    onClick={() => executePrompt(input)} 
                    disabled={isSending || (!input.trim() && attachedFiles.length === 0)}
                    className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-300 px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-amber-900/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer ml-auto"
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
          <Card className="border-2 border-indigo-200/50 shadow-md">
            <CardHeader className="bg-slate-900 text-white rounded-t-xl p-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                {t('assistant.quick_suggestions', 'Suggestions rapides')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2.5">
              {suggestions.map((s, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setInput(prev => (prev ? prev + '\n' : '') + s)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 text-xs font-semibold p-3 text-left justify-start h-auto whitespace-normal leading-snug rounded-xl cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-amber-400 shrink-0" />
                  <span>{s}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200/50 shadow-md">
            <CardHeader className="bg-slate-900 text-white rounded-t-xl p-4 flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-white">{t('assistant.guided_mode', 'Mode guidé')}</CardTitle>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-amber-400">{guided ? t('common.yes') : t('common.no')}</label>
                <input type="checkbox" checked={guided} onChange={e => setGuided(e.target.checked)} className="h-4 w-4 accent-amber-500 cursor-pointer" />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {guided && guideSteps.map((st, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-800 font-medium">
                  <ChevronRight className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                  <span>{st}</span>
                </div>
              ))}
              {!guided && (
                <div className="text-xs text-secondary-600 font-medium">{t('assistant.guided_mode_desc', 'Activez le mode guidé pour vous assister étape par étape.')}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Preview Portal Modal */}
      {previewDoc && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white border-2 border-indigo-300 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" />
                {previewDoc.title}
              </h3>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-serif text-slate-900 text-sm whitespace-pre-wrap leading-relaxed">
              {previewDoc.content}
            </div>
            <div className="p-4 bg-slate-100 border-t flex justify-end gap-3">
              <Button onClick={() => downloadDocAsPDF(previewDoc)} className="bg-indigo-600 text-white font-bold">
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
