import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  FileText, 
  Scale, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Users, 
  Check, 
  PanelLeftClose, 
  PanelLeft, 
  Plus, 
  Paperclip, 
  Send, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FolderOpen, 
  X, 
  Settings, 
  Cpu, 
  Wrench, 
  Layers, 
  Search, 
  Building, 
  FileCheck, 
  PenTool, 
  BookmarkCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import CleanLegalText from '../ui/CleanLegalText';
import { parseMultipleFiles } from '../../lib/documentParser';

// Agent Subsystem Imports
import type { 
  AgentThread, 
  AgentMessage, 
  AgentRun, 
  AgentRunStep, 
  ToolCall, 
  UserApiKeys 
} from '../../lib/agent/types';
import { AVAILABLE_MODELS, AGENT_PERSONAS } from '../../lib/agent/config';
import { AGENT_TOOL_DEFINITIONS } from '../../lib/agent/tools';
import { executeAgentRun } from '../../lib/agent/engine';
import { 
  loadAllThreads, 
  saveAllThreads, 
  getActiveThreadId, 
  setActiveThreadId, 
  createNewThread, 
  updateThreadInStorage, 
  deleteThreadFromStorage, 
  getStoredApiKeys, 
  saveStoredApiKeys,
  syncThreadToSupabase,
  fetchThreadsFromSupabase
} from '../../lib/agent/threadManager';
import { supabase } from '../../lib/supabase';
import { AgentSettingsModal } from './AgentSettingsModal';
import { ElectronicSignatureModal } from './ElectronicSignatureModal';
import { uploadMultipleCaseDocuments } from '../../lib/storageUtils';
import { notifyAnalysisReady } from '../../lib/emailService';

const SpeechRecognition = typeof window !== 'undefined' 
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) 
  : null;

interface LegalAIDiagnosticProps {
  roleMode?: 'citizen' | 'lawyer' | 'academic';
}

// Kept for backward compatibility
export type ThreadMessage = AgentMessage;

export const LegalAIDiagnostic: React.FC<LegalAIDiagnosticProps> = ({ roleMode = 'citizen' }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  // 1. Threads & Active Session State
  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [activeThread, setActiveThread] = useState<AgentThread | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');

  // 2. Active Model & Persona State
  const [selectedModelId, setSelectedModelId] = useState<string>(AVAILABLE_MODELS[0].id);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    roleMode === 'lawyer' ? 'generalist-lawyer' : 'generalist-lawyer'
  );
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  // 3. API Keys & Settings Modal State
  const [apiKeys, setApiKeys] = useState<UserApiKeys>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 4. Input & Attachments State
  const [userInput, setUserInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // 5. Agent Run Lifecycle State
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunStatus, setCurrentRunStatus] = useState<string | null>(null);
  const [currentRunSteps, setCurrentRunSteps] = useState<AgentRunStep[]>([]);
  const [expandedTraceMsgId, setExpandedTraceMsgId] = useState<string | null>(null);

  // 6. Voice AI States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // 7. Electronic Signature State
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureTargetContent, setSignatureTargetContent] = useState('');
  const [signatureTargetTitle, setSignatureTargetTitle] = useState('');

  // Load Initial Threads and API Keys from Storage & Supabase
  useEffect(() => {
    const loadedKeys = getStoredApiKeys();
    setApiKeys(loadedKeys);

    let loadedThreads = loadAllThreads();
    if (loadedThreads.length === 0) {
      const initialThread = createNewThread(selectedModelId, selectedPersonaId, user?.id);
      loadedThreads = [initialThread];
    }
    setThreads(loadedThreads);

    const activeId = getActiveThreadId();
    const current = loadedThreads.find(t => t.id === activeId) || loadedThreads[0];
    setActiveThread(current);
    if (current) {
      setSelectedModelId(current.modelId || AVAILABLE_MODELS[0].id);
      setSelectedPersonaId(current.personaId || AGENT_PERSONAS[0].id);
    }

    // Cloud Sync: Fetch threads from Supabase when user is authenticated
    if (user?.id) {
      fetchThreadsFromSupabase(user.id).then(cloudThreads => {
        if (cloudThreads && cloudThreads.length > 0) {
          setThreads(prev => {
            const map = new Map<string, AgentThread>();
            // Local threads first
            prev.forEach(t => map.set(t.id, t));
            // Merge with cloud threads
            cloudThreads.forEach(ct => {
              const existing = map.get(ct.id);
              if (!existing || new Date(ct.updatedAt) > new Date(existing.updatedAt)) {
                map.set(ct.id, ct);
              }
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            saveAllThreads(merged);
            return merged;
          });
        }
      });
    }
  }, [user]);

  // Real-time synchronization across devices (Mobile <-> Desktop) via Supabase
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`legal_diagnostics_sync_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'legal_diagnostics_just',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new;
            if (!row) return;

            setThreads(prev => {
              const exists = prev.some(t => t.id === row.id);
              if (exists) {
                return prev.map(t => {
                  if (t.id === row.id && row.full_analysis?.messages) {
                    return {
                      ...t,
                      title: row.case_title || t.title,
                      updatedAt: row.updated_at,
                      messages: row.full_analysis.messages
                    };
                  }
                  return t;
                });
              } else {
                const newT: AgentThread = {
                  id: row.id,
                  title: row.case_title || 'Analyse Juridique',
                  userId: row.user_id,
                  modelId: row.full_analysis?.model_id || 'france-justice-auto',
                  personaId: row.full_analysis?.persona_id || 'generalist-lawyer',
                  createdAt: row.created_at,
                  updatedAt: row.updated_at,
                  messages: row.full_analysis?.messages || [],
                  uploadedFiles: row.uploaded_files || []
                };
                return [newT, ...prev];
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Sync active thread changes to storage & Supabase
  const handleUpdateActiveThread = (updated: AgentThread) => {
    setActiveThread(updated);
    updateThreadInStorage(updated);
    setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (user?.id) {
      syncThreadToSupabase(updated, user.id);
    }
  };

  // Switch Thread
  const switchThread = (threadId: string) => {
    const target = threads.find(t => t.id === threadId);
    if (target) {
      setActiveThread(target);
      setActiveThreadId(target.id);
      setSelectedModelId(target.modelId || AVAILABLE_MODELS[0].id);
      setSelectedPersonaId(target.personaId || AGENT_PERSONAS[0].id);
      setFiles([]);
      setExtractedText('');
      setUserInput('');
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  // Start New Thread
  const handleNewThread = () => {
    const newThread = createNewThread(selectedModelId, selectedPersonaId, user?.id);
    setThreads(prev => [newThread, ...prev]);
    setActiveThread(newThread);
    setUserInput('');
    setFiles([]);
    setExtractedText('');
    success("Nouvelle session de conversation initialisée.");
  };

  // Delete Thread
  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteThreadFromStorage(threadId);
    const updated = threads.filter(t => t.id !== threadId);
    setThreads(updated);
    if (activeThread?.id === threadId) {
      if (updated.length > 0) {
        switchThread(updated[0].id);
      } else {
        const fresh = createNewThread(selectedModelId, selectedPersonaId, user?.id);
        setThreads([fresh]);
        setActiveThread(fresh);
      }
    }
    success("Conversation supprimée.");
  };

  // File Upload & Text Extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);

      try {
        const parsed = await parseMultipleFiles(selectedFiles);
        let combined = '';
        parsed.forEach(doc => {
          combined += `\n--- PIÈCE : ${doc.name} ---\n${doc.content.substring(0, 12000)}`;
        });
        setExtractedText(prev => prev + combined);
        success(`${selectedFiles.length} document(s) importé(s) dans le contexte de l'Agent.`);

        // Permanent cloud upload to Supabase Storage bucket 'case-documents'
        uploadMultipleCaseDocuments(selectedFiles, user?.id || 'anonymous', activeThread?.id).catch(err => {
          console.warn("Storage upload notice:", err);
        });
      } catch (err) {
        console.warn("Erreur extraction fichiers:", err);
      } finally {
        if (e.target) e.target.value = '';
      }
    }
  };

  // Voice Input (Speech Recognition)
  const toggleListening = () => {
    if (!SpeechRecognition) {
      toastError("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'fr-FR';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setUserInput(prev => `${prev} ${text}`);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
      success("Écoute vocale active. Exposez votre problème juridique...");
    } catch (_e) {
      setIsListening(false);
    }
  };

  // Voice Read-Aloud
  const toggleSpeaking = (textToRead: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const clean = textToRead.replace(/[#*`_]/g, '').trim();
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = 'fr-FR';
    utt.rate = 1.0;

    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utt);
    synthRef.current = utt;
    setIsSpeaking(true);
  };

  // RUN AGENT EXECUTION (THE CORE AGENTIC LOOP)
  const handleRunAgent = async (promptOverride?: string) => {
    const promptToSend = (promptOverride || userInput).trim();
    if (!promptToSend && files.length === 0 && !extractedText.trim()) {
      toastError("Veuillez saisir votre demande ou joindre au moins un document.");
      return;
    }

    if (!activeThread) return;

    const fileNames = files.map(f => f.name);
    const updatedFiles = Array.from(new Set([...activeThread.uploadedFiles, ...fileNames]));

    // Construct User Message
    const userMessage: AgentMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: promptToSend || (fileNames.length > 0 ? `Veuillez analyser les documents juridiques ci-joints (${fileNames.join(', ')}).` : 'Exécuter l\'analyse.'),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      files: fileNames.length > 0 ? fileNames : undefined
    };

    // Auto Title Generation for the thread if still default
    let threadTitle = activeThread.title;
    if (threadTitle === 'Nouvelle Analyse Juridique' || !threadTitle) {
      threadTitle = promptToSend.slice(0, 42) + (promptToSend.length > 42 ? '...' : '');
    }

    const updatedMessages = [...activeThread.messages, userMessage];
    const interimThread: AgentThread = {
      ...activeThread,
      title: threadTitle,
      messages: updatedMessages,
      uploadedFiles: updatedFiles,
      modelId: selectedModelId,
      personaId: selectedPersonaId
    };

    handleUpdateActiveThread(interimThread);
    setUserInput('');
    setFiles([]);
    setIsRunning(true);
    setCurrentRunSteps([]);
    setCurrentRunStatus("Initialisation du Run de l'Agent...");

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      const { assistantMessage, run } = await executeAgentRun({
        threadId: activeThread.id,
        userPrompt: userMessage.content,
        historyMessages: updatedMessages,
        modelId: selectedModelId,
        personaId: selectedPersonaId,
        attachedFileNames: updatedFiles,
        extractedText,
        userApiKeys: apiKeys,
        onStepUpdate: (step) => {
          setCurrentRunSteps(prev => [...prev, step]);
          setCurrentRunStatus(step.label);
        }
      });

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalThread: AgentThread = {
        ...interimThread,
        messages: finalMessages,
        lastRunStatus: run.status
      };

      handleUpdateActiveThread(finalThread);

      // Send transactional notification email if user email is present
      if (user?.email) {
        notifyAnalysisReady(user.email, interimThread.title, assistantMessage.content).catch(() => {});
      }

      // Auto expand the trace of the newly generated message
      setExpandedTraceMsgId(assistantMessage.id);

    } catch (err: any) {
      console.error("Agent Run Error:", err);
      toastError("Une erreur est survenue lors de l'exécution de l'Agent IA.");
    } finally {
      setIsRunning(false);
      setCurrentRunStatus(null);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  };

  // Export generated legal act / text as Word document (.doc)
  const downloadAsWordDoc = (content: string, title?: string) => {
    const clean = content.replace(/^#{1,6}\s*/gm, '').trim();
    const docTitle = title || 'Document_Juridique_FranceJustice';
    const blob = new Blob([
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docTitle}</title></head><body style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; padding: 25px;">
      <div style="border-bottom: 2px solid #0891b2; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="color: #0891b2; margin: 0; text-transform: uppercase;">FRANCE JUSTICE • ACTE &amp; DOCUMENT OFFICIEL</h2>
        <p style="font-size: 9pt; color: #64748b; margin-top: 4px;">Généré par l'Agent IA Juridique Autonome • Date : ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      <div style="white-space: pre-wrap; font-family: 'Times New Roman', Times, serif; font-size: 12pt;">${clean}</div>
      </body></html>`
    ], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success("Document Word (.doc) prêt à être édité et signé !");
  };

  // PDF Export
  const downloadThreadPDF = (thread: AgentThread) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toastError("Impossible d'ouvrir la fenêtre d'impression.");
      return;
    }

    const currentModel = AVAILABLE_MODELS.find(m => m.id === thread.modelId) || AVAILABLE_MODELS[0];
    const currentPersona = AGENT_PERSONAS.find(p => p.id === thread.personaId) || AGENT_PERSONAS[0];

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <title>Dossier d'Audit Juridique IA - ${thread.title}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.5; font-size: 10pt; margin: 0; padding: 0; }
            .header { border-bottom: 2px solid #0891b2; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .brand { font-size: 16pt; font-weight: 800; color: #0891b2; text-transform: uppercase; }
            .meta { font-size: 8pt; color: #64748b; text-align: right; }
            .title-box { background: #f0fdfa; border-left: 4px solid #0891b2; padding: 12px 16px; margin-bottom: 20px; border-radius: 6px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 8pt; font-weight: bold; background: #e0f2fe; color: #0369a1; margin-right: 6px; }
            .msg { margin-bottom: 20px; padding: 12px; border-radius: 8px; page-break-inside: avoid; }
            .msg-user { background: #f8fafc; border-left: 3px solid #64748b; }
            .msg-assistant { background: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #0891b2; }
            .msg-role { font-size: 8.5pt; font-weight: bold; text-transform: uppercase; color: #0891b2; margin-bottom: 6px; }
            .tools-box { background: #ecfeff; border: 1px dashed #06b6d4; padding: 8px 12px; border-radius: 6px; font-size: 8pt; margin-bottom: 10px; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 7.5pt; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">France Justice • Agent IA Juridique</div>
              <div style="font-size: 8.5pt; color: #475569;">Audit d'Élite &amp; Traçabilité Contradictoire</div>
            </div>
            <div class="meta">
              Date : ${new Date().toLocaleDateString('fr-FR')}<br>
              Modèle : ${currentModel.name}<br>
              Persona : ${currentPersona.name}
            </div>
          </div>

          <div class="title-box">
            <h2 style="margin: 0 0 6px 0; font-size: 13pt;">${thread.title}</h2>
            <div>
              <span class="badge">Session #${thread.id.slice(-6)}</span>
              <span class="badge">${thread.messages.length} échange(s)</span>
              ${thread.uploadedFiles.length > 0 ? `<span class="badge">${thread.uploadedFiles.length} document(s)</span>` : ''}
            </div>
          </div>

          ${thread.messages.map(m => `
            <div class="msg ${m.role === 'user' ? 'msg-user' : 'msg-assistant'}">
              <div class="msg-role">${m.role === 'user' ? 'Demandeur / Utilisateur' : `Agent IA France Justice (${currentPersona.name})`} • ${m.timestamp}</div>
              ${m.toolCalls && m.toolCalls.length > 0 ? `
                <div class="tools-box">
                  <strong>Outils exécutés pendant le Run :</strong>
                  ${m.toolCalls.map(tc => `<span>• ${tc.toolName} (${tc.durationMs}ms)</span>`).join(' ')}
                </div>
              ` : ''}
              <div style="white-space: pre-wrap; font-size: 9.5pt;">${m.content}</div>
            </div>
          `).join('')}

          <div class="footer">
            Conforme aux règles de déontologie juridique et au règlement européen sur l'Intelligence Artificielle (EU AI Act). Document certifié probant.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  const activeModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const activePersonaObj = AGENT_PERSONAS.find(p => p.id === selectedPersonaId) || AGENT_PERSONAS[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl h-[calc(100dvh-5rem)] min-h-[580px] flex flex-col relative text-slate-900">
      
      {/* 1. TOP APPLICATION BAR (AGENT CONTROLS & MODEL SELECTOR) */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
        
        {/* Left Side: Sidebar Toggle & Model / Persona Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={sidebarOpen ? "Masquer le panneau des threads" : "Afficher l'historique des threads"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>

          {/* Model Selector Dropdown Button (Pillar 1) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setModelDropdownOpen(!modelDropdownOpen);
                setPersonaDropdownOpen(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-600" />
              <span className="truncate max-w-[130px] sm:max-w-none">{activeModelObj.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-fade-in space-y-1">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Modèle LLM (Le Cerveau)</span>
                  <span className="text-cyan-600 cursor-pointer" onClick={() => { setIsSettingsOpen(true); setModelDropdownOpen(false); }}>Clés API</span>
                </div>
                {AVAILABLE_MODELS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedModelId(m.id);
                      if (activeThread) {
                        handleUpdateActiveThread({ ...activeThread, modelId: m.id });
                      }
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs flex flex-col gap-0.5 transition-all cursor-pointer ${
                      selectedModelId === m.id ? 'bg-cyan-50 border border-cyan-300 text-cyan-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{m.name}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{m.contextWindow}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{m.badge}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Persona / Role Selector Dropdown (Pillar 3) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPersonaDropdownOpen(!personaDropdownOpen);
                setModelDropdownOpen(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-cyan-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-700" />
              <span className="truncate max-w-[130px] sm:max-w-none">{activePersonaObj.name}</span>
              <ChevronDown className="w-3 h-3 text-cyan-500" />
            </button>

            {personaDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-fade-in space-y-1">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Instructions &amp; Rôle (System Prompt)
                </div>
                {AGENT_PERSONAS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPersonaId(p.id);
                      if (activeThread) {
                        handleUpdateActiveThread({ ...activeThread, personaId: p.id });
                      }
                      setPersonaDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex flex-col gap-1 transition-all cursor-pointer ${
                      selectedPersonaId === p.id ? 'bg-cyan-50 border border-cyan-300 text-cyan-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-extrabold text-slate-900">{p.name}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{p.shortDesc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tools Badge, Settings & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Tools Count Badge (Pillar 4) */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
            title="Consulter les outils de l'Agent IA"
          >
            <Wrench className="w-3 h-3 text-cyan-600" />
            <span>{AGENT_TOOL_DEFINITIONS.length} outils actifs</span>
          </button>

          {/* Architecture & Settings Modal Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Architecture de l'Agent & Clés API"
            aria-label="Architecture et Clés API"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Export PDF Button */}
          {activeThread && activeThread.messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadThreadPDF(activeThread)}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
              title="Exporter l'analyse complète au format Tribunal"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-cyan-600" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
          )}

          {/* New Thread Button (Pillar 2) */}
          <Button
            size="sm"
            onClick={handleNewThread}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nouveau Thread</span>
          </Button>
        </div>
      </div>

      {/* 2. MAIN CONTAINER (SIDEBAR FOR THREADS + CONVERSATION CANVAS) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Backdrop for Sidebar Drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* 2.A CHATGPT-STYLE SIDEBAR (THREAD SESSIONS & HISTORY - PILLAR 2) */}
        {sidebarOpen && (
          <aside className="absolute md:relative inset-y-0 left-0 w-72 sm:w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 z-40 shadow-2xl md:shadow-none transition-all overflow-hidden">
            <div className="p-3 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Button
                  onClick={handleNewThread}
                  className="flex-1 justify-start rounded-xl py-2.5 bg-white border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 text-slate-800 text-xs font-extrabold shadow-2xs gap-2"
                >
                  <Plus className="w-4 h-4 text-cyan-600" />
                  <span>Nouveau Fil</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer"
                  title="Fermer le menu"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* History Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={threadSearch}
                  onChange={e => setThreadSearch(e.target.value)}
                  placeholder="Rechercher une analyse..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Saved Threads List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2 flex items-center justify-between">
                  <span>Sessions Actives &amp; Mémoire</span>
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">
                    {threads.length}
                  </span>
                </div>

                {threads.length === 0 ? (
                  <div className="text-center py-6 px-2 text-xs text-slate-400">
                    Aucune session enregistrée.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {threads
                      .filter(t => !threadSearch || t.title.toLowerCase().includes(threadSearch.toLowerCase()))
                      .map((t) => {
                        const isActive = activeThread?.id === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => switchThread(t.id)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs group flex items-center justify-between gap-2 ${
                              isActive 
                                ? 'bg-cyan-50 border-cyan-400 ring-1 ring-cyan-400/50' 
                                : 'bg-white hover:bg-slate-100 border-slate-200/80 hover:border-cyan-300'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs text-slate-800 truncate group-hover:text-cyan-900">
                                {t.title || 'Dossier Juridique'}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                                <span className="font-semibold text-cyan-800">
                                  {t.messages.length} message{t.messages.length > 1 ? 's' : ''}
                                </span>
                                <span>{new Date(t.updatedAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteThread(t.id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 opacity-60 group-hover:opacity-100 cursor-pointer"
                              title="Supprimer ce fil"
                              aria-label="Supprimer ce fil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-slate-200 bg-white/80 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Agent IA France Justice</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Temps Réel
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Mémoire persistante • EU AI Act Compliant</p>
            </div>
          </aside>
        )}

        {/* 2.B CHATGPT CENTRAL CONVERSATION CANVAS */}
        <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden relative">
          
          {/* Scrollable Conversation Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin">
            <div className="max-w-4xl mx-auto w-full space-y-6">

              {/* WELCOME SCREEN (WHEN THREAD HAS NO MESSAGES) */}
              {(!activeThread || activeThread.messages.length === 0) && !isRunning && (
                <div className="py-8 text-center space-y-6 animate-fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-600/20">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <div className="space-y-2 max-w-xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Bonjour. Que souhaitez-vous analyser aujourd'hui ?
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      L'Agent IA autonome de France Justice analyse vos documents, calcule vos indemnités (€), vérifie les textes de lois applicables et vous guide pas à pas.
                    </p>
                  </div>



                  {/* Suggested Persona Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left pt-2">
                    {activePersonaObj.suggestedPrompts.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleRunAgent(tmpl.prompt)}
                        className="p-4 rounded-2xl bg-white hover:bg-cyan-50/40 border border-slate-200 hover:border-cyan-400 transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 group-hover:bg-cyan-100 transition-colors">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black text-slate-900 group-hover:text-cyan-900 transition-colors">
                            {tmpl.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {tmpl.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MESSAGES THREAD (MULTI-TURN CHATGPT STYLE) */}
              {activeThread && activeThread.messages.map((msg, idx) => (
                msg.role === 'user' ? (
                  // User Message
                  <div key={msg.id || idx} className="flex items-start gap-3 ml-auto max-w-[88%] animate-fade-in">
                    <div className="bg-linear-to-r from-slate-900 to-cyan-950 text-white p-4 sm:p-5 rounded-3xl shadow-md space-y-2.5 w-full border border-slate-700/50">
                      <div className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <span>Vous</span>
                        <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">{msg.timestamp}</span>
                      </div>

                      {msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.files.map((fname, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs font-bold shadow-2xs">
                              <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> {fname}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap text-white/95">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Assistant Message
                  <div key={msg.id || idx} className="flex items-start gap-3 mr-auto w-full animate-fade-in">
                    <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>

                    <div className="flex-1 min-w-0 bg-white border-2 border-cyan-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                      
                      {/* Assistant Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">Agent IA France Justice</span>
                          <span className="text-[10px] bg-cyan-50 text-cyan-800 px-2.5 py-0.5 rounded-full font-bold border border-cyan-200">
                            {activePersonaObj.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              setCopiedMsgId(msg.id);
                              setTimeout(() => setCopiedMsgId(null), 2000);
                              success("Réponse copiée dans le presse-papier.");
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                            title="Copier la réponse"
                          >
                            {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <BookmarkCheck className="w-3.5 h-3.5 mr-1" />}
                            <span className="hidden sm:inline">{copiedMsgId === msg.id ? 'Copié !' : 'Copier'}</span>
                          </Button>

                          {/* Formal Act & Report actions — Download on substantive content, Sign only on actual drafted acts */}
                          {(() => {
                            const isSignableAct = msg.content && /MISE EN DEMEURE|CONVENTION|PROJET D['’]ACCORD|CONTRAT DE|LETTRE DE MISE EN DEMEURE VALANT SOMMATION|ACTE SOUS SIGNATURE PRIVÉE/i.test(msg.content);
                            const canDownloadDoc = msg.content && msg.content.length > 250 && (
                              isSignableAct ||
                              /RAPPORT D['’]ANALYSE|AUDIT DU DOSSIER|GUIDE DE SAISINE/i.test(msg.content)
                            );
                            if (!canDownloadDoc && !isSignableAct) return null;
                            return (
                              <>
                                {canDownloadDoc && (
                                  <Button
                                    onClick={() => downloadAsWordDoc(msg.content, activeThread?.title)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                                    title="Télécharger l'acte ou le rapport au format Word (.doc)"
                                  >
                                    <Download className="w-3.5 h-3.5 mr-1 text-cyan-600" />
                                    <span className="hidden sm:inline">Télécharger (.doc)</span>
                                  </Button>
                                )}

                                {isSignableAct && (
                                  <Button
                                    onClick={() => {
                                      setSignatureTargetTitle(activeThread?.title || "Acte Juridique Officiel");
                                      setSignatureTargetContent(msg.content);
                                      setSignatureModalOpen(true);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-cyan-800 hover:text-cyan-900 bg-cyan-50/70 hover:bg-cyan-100 rounded-xl text-xs font-bold cursor-pointer"
                                    title="Signer cet acte juridiquement avec certificat eIDAS"
                                  >
                                    <PenTool className="w-3.5 h-3.5 mr-1 text-cyan-700" />
                                    <span className="hidden sm:inline">Signer l'Acte</span>
                                  </Button>
                                )}
                              </>
                            );
                          })()}

                          <Button
                            onClick={() => toggleSpeaking(msg.content)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                            title="Écouter la réponse vocalement"
                          >
                            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-600 mr-1" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-600 mr-1" />}
                            <span className="hidden sm:inline">{isSpeaking ? 'Arrêter' : 'Écouter'}</span>
                          </Button>
                        </div>
                      </div>

                      {/* TOOL TRACE — Claude/ChatGPT style: minimal inline disclosure */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mb-2">
                          <button
                            type="button"
                            onClick={() => setExpandedTraceMsgId(expandedTraceMsgId === msg.id ? null : msg.id)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer group"
                          >
                            <Zap className="w-3 h-3 text-cyan-500 group-hover:text-cyan-600 transition-colors" />
                            <span className="italic">
                              {expandedTraceMsgId === msg.id ? 'Masquer' : `Analysé avec ${msg.toolCalls.length} outil${msg.toolCalls.length > 1 ? 's' : ''}`}
                            </span>
                            {expandedTraceMsgId === msg.id
                              ? <ChevronUp className="w-3 h-3" />
                              : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {expandedTraceMsgId === msg.id && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {msg.toolCalls.map((tc, tcIdx) => (
                                <span
                                  key={tc.id || tcIdx}
                                  title={tc.output?.explanation || tc.toolName}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono text-slate-500 border border-slate-200"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                  {tc.toolName}
                                  <span className="text-slate-400 ml-0.5">{tc.durationMs}ms</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Direct Legal Response */}
                      <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                        <CleanLegalText content={msg.content} />
                      </div>

                      {/* Quick Automations (Actions rapides) */}
                      {msg.automations && msg.automations.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
                            Actions recommandées par l'Agent :
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.automations.map((auto, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => handleRunAgent(auto.actionPrompt)}
                                className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white py-1.5 px-3.5 rounded-full font-bold transition-all cursor-pointer shadow-sm hover:shadow-md text-left flex items-center gap-1.5"
                              >
                                <span>{auto.label}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions Chips */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="pt-1 space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Poursuivre l'instruction :
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleRunAgent(sug)}
                                className="text-xs bg-slate-50 hover:bg-cyan-50 text-slate-700 hover:text-cyan-900 border border-slate-200 hover:border-cyan-300 py-1 px-3 rounded-full font-medium transition-all cursor-pointer text-left"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )
              ))}

              {/* LIVE THINKING STATE (DURING AGENT RUN) */}
              {isRunning && (
                <div className="flex items-start gap-3 mr-auto w-full animate-pulse">
                  <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-white border-2 border-cyan-200 rounded-3xl p-5 shadow-sm space-y-3 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {currentRunStatus || "L'Agent IA analyse votre demande..."}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                    </div>

                    {currentRunSteps.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-600 font-mono">
                        {currentRunSteps.slice(-3).map((st, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-cyan-600 font-bold">✓</span>
                            <span>{st.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          </div>

          {/* 2.C FLOATING COMPOSER DOCK (CHATGPT / CLAUDE STYLE) */}
          <div className="p-4 bg-gradient-to-t from-white via-white/95 to-transparent border-t border-slate-100 shrink-0">
            <div className="max-w-4xl mx-auto w-full">
              
              {/* Floating Dock Box */}
              <div className="bg-white border-2 border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 rounded-3xl shadow-lg p-3 transition-all flex flex-col gap-2">
                
                {/* Uploaded Files Chips (Inside the input card) */}
                {files.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 px-1">
                    {files.map((file, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-xs font-bold text-cyan-900 shadow-2xs">
                        <FileText className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="ml-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Main User Textarea */}
                <textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleRunAgent();
                    }
                  }}
                  placeholder={`Posez votre question à ${activePersonaObj.name} ou exposez les faits (Shift+Entrée pour saut de ligne)...`}
                  rows={2}
                  className="w-full bg-transparent border-none resize-none focus:outline-hidden text-base sm:text-sm text-slate-900 placeholder-slate-400 px-1 py-1 scrollbar-none"
                />

                {/* Bottom Action Toolbar inside the Input Zone */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                  {/* Left: The Document Import Paperclip inside the input zone */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept=".pdf,.txt,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.json,.csv,.odt,.ods,.rtf"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      className="hidden opacity-0 pointer-events-none absolute -z-50 w-0 h-0 overflow-hidden"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-slate-600 hover:text-cyan-800 bg-slate-100 hover:bg-cyan-50 border border-slate-200/80 hover:border-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="Joindre des documents (PDF, contrats, baux)"
                      aria-label="Joindre des documents"
                    >
                      <Paperclip className="w-4 h-4 text-cyan-600" />
                      <span className="hidden sm:inline">Joindre un document</span>
                    </button>
                  </div>

                  {/* Right: Mic & Send Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-2 rounded-2xl transition-all cursor-pointer shrink-0 ${
                        isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:text-cyan-700 hover:bg-slate-100'
                      }`}
                      title={isListening ? 'Arrêter la dictée vocale' : 'Dictée Vocale'}
                    >
                      {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunAgent()}
                      disabled={isRunning || (!userInput.trim() && files.length === 0)}
                      className="w-9 h-9 rounded-full bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                      title="Lancer le Run de l'Agent IA"
                    >
                      {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 translate-x-px -translate-y-px" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-center pt-2 text-[11px] text-slate-500">
                Agent IA France Justice • Modèle : {activeModelObj.name} • Droit français &amp; européen • Conformité EU AI Act.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. SETTINGS & ARCHITECTURE MODAL */}
      <AgentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKeys={apiKeys}
        onSaveApiKeys={(newKeys) => {
          setApiKeys(newKeys);
          saveStoredApiKeys(newKeys);
        }}
      />

      {/* 4. ELECTRONIC SIGNATURE MODAL */}
      <ElectronicSignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        documentTitle={signatureTargetTitle}
        documentContent={signatureTargetContent}
      />
    </div>
  );
};

export default LegalAIDiagnostic;
