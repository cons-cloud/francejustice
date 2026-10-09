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
  ArrowRight,
  Globe,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Pencil,
  Brain,
  LayoutTemplate,
  Square,
  UploadCloud,
  Share2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import CleanLegalText from '../ui/CleanLegalText';
import { parseMultipleFiles } from '../../lib/documentParser';
import { downloadWordDocument, downloadExcelSpreadsheet, downloadPowerPointPresentation } from '../../lib/universalFileGenerator';

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
  const [jurisdictionId, setJurisdictionId] = useState<string>(() => {
    try { return localStorage.getItem('francejustice_jurisdiction') || 'auto'; } catch { return 'auto'; }
  });
  const [jurisdictionDropdownOpen, setJurisdictionDropdownOpen] = useState(false);
  const JURISDICTIONS = [
    { id: 'auto', flag: '🌐', label: 'Détection auto' },
    { id: 'fr_eu', flag: '🇫🇷', label: 'France & UE' },
    { id: 'be', flag: '🇧🇪', label: 'Belgique' },
    { id: 'ch', flag: '🇨🇭', label: 'Suisse' },
    { id: 'lu', flag: '🇱🇺', label: 'Luxembourg' },
    { id: 'ma', flag: '🇲🇦', label: 'Maroc' },
    { id: 'dz', flag: '🇩🇿', label: 'Algérie' },
    { id: 'tn', flag: '🇹🇳', label: 'Tunisie' },
    { id: 'ohada', flag: '🌍', label: 'Afrique (OHADA)' },
    { id: 'us', flag: '🇺🇸', label: 'États-Unis' },
    { id: 'ca_qc', flag: '🇨🇦', label: 'Canada / Québec' },
  ];
  const activeJurisdiction = JURISDICTIONS.find(j => j.id === jurisdictionId) || JURISDICTIONS[0];

  // 3. API Keys & Settings Modal State
  const [apiKeys, setApiKeys] = useState<UserApiKeys>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 4. Input & Attachments State
  const [userInput, setUserInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractingProgress, setExtractingProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

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
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});

  // 8. Claude / ChatGPT / Gemini Parity States
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [expandedThinkingMsgId, setExpandedThinkingMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasDocument, setCanvasDocument] = useState<{ title: string; content: string } | null>(null);

  // Stop Generation Handler (Style ChatGPT / Claude / Gemini)
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamingContent && activeThread) {
      const partialMsg: AgentMessage = {
        id: `msg_${Date.now()}_assistant_stopped`,
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      const updatedThread: AgentThread = {
        ...activeThread,
        messages: [...activeThread.messages, partialMsg]
      };
      handleUpdateActiveThread(updatedThread);
    }
    setIsRunning(false);
    setStreamingContent(null);
    setCurrentRunStatus(null);
    success("Génération interrompue.");
  };

  // 1-Click Message PDF Exporter
  const downloadMessagePDF = (msg: AgentMessage, threadTitle?: string) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toastError("Impossible d'ouvrir la fenêtre d'impression.");
      return;
    }
    const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
    const currentPersona = AGENT_PERSONAS.find(p => p.id === selectedPersonaId) || AGENT_PERSONAS[0];

    const clean = msg.content
      .replace(/^#{1,6}\s*(.*)$/gm, '<h3 style="color:#0891b2; margin-top:16px; margin-bottom:8px; font-size:12pt;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<p style="margin-bottom:10px;"></p>')
      .replace(/\n/g, '<br/>');

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Consultation Juridique - France Justice</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6; font-size: 10.5pt; margin: 0; padding: 0; }
          .header { border-bottom: 2px solid #0891b2; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .brand { font-size: 16pt; font-weight: 800; color: #0891b2; text-transform: uppercase; }
          .meta { font-size: 8.5pt; color: #64748b; text-align: right; }
          .banner { background: #f0fdfa; border-left: 4px solid #0891b2; padding: 12px 16px; margin-bottom: 20px; border-radius: 6px; }
          .title { font-weight: bold; font-size: 11pt; color: #0f766e; }
          .content { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 8pt; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">France Justice • Consultation IA</div>
            <div style="font-size: 9pt; color: #475569;">Acte &amp; Analyse Juridique Personnalisée</div>
          </div>
          <div class="meta">
            Date : ${new Date().toLocaleDateString('fr-FR')} à ${msg.timestamp}<br>
            Modèle : ${currentModel.name}<br>
            Spécialité : ${currentPersona.name}
          </div>
        </div>
        <div class="banner">
          <div class="title">Dossier : ${threadTitle || 'Consultation Juridique'}</div>
          <div style="font-size: 8.5pt; color: #64748b; margin-top: 4px;">Document officiel délivré par l'Agent IA France Justice sous contrôle de conformité.</div>
        </div>
        <div class="content">
          ${clean}
        </div>
        <div class="footer">
          France Justice • Plateforme Juridique Intelligente &amp; Indépendante • Conformité RGPD &amp; EU AI Act
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  // Share Conversation Handler
  const handleShareConversation = () => {
    if (!activeThread || activeThread.messages.length === 0) {
      toastError("Aucune conversation à partager.");
      return;
    }
    const transcript = activeThread.messages.map(m => {
      const roleName = m.role === 'user' ? '👤 Vous' : '⚖️ Agent IA France Justice';
      return `### ${roleName} (${m.timestamp})\n\n${m.content}\n\n---`;
    }).join('\n\n');

    const shareContent = `# Dossier Juridique : ${activeThread.title}\n\n*Généré par France Justice le ${new Date().toLocaleDateString('fr-FR')}*\n\n${transcript}`;
    navigator.clipboard.writeText(shareContent);
    success("Compte-rendu complet du dossier copié dans le presse-papier !");
  };

  // Pro Keyboard Shortcuts (Cmd+K focus, Cmd+Shift+O new thread, Escape close canvas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        chatInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewThread();
      }
      if (e.key === 'Escape') {
        if (canvasOpen) setCanvasOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasOpen, activeThread]);

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackMap(prev => ({ ...prev, [msgId]: type }));
    success(type === 'up' ? "Merci pour votre appréciation !" : "Merci pour votre retour, l'IA continue d'apprendre.");
  };

  const handleSaveEditedMessage = (msgId: string) => {
    if (!activeThread || !editingContent.trim()) return;
    const msgIndex = activeThread.messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    const truncatedHistory = activeThread.messages.slice(0, msgIndex);
    const newPrompt = editingContent.trim();
    setEditingMsgId(null);
    setEditingContent('');
    handleRunAgent(newPrompt, truncatedHistory);
  };

  const handleRegenerate = (msgIndex: number) => {
    if (!activeThread || isRunning) return;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (activeThread.messages[i].role === 'user') {
        const historyBeforeUser = activeThread.messages.slice(0, i);
        handleRunAgent(activeThread.messages[i].content, historyBeforeUser);
        return;
      }
    }
  };

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
      setExtractedText(target.extractedText || '');
      setUserInput('');
      if (typeof window !== 'undefined' && window.innerWidth < 1280) {
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
  const processFiles = async (fileList: File[] | FileList) => {
    const selectedFiles = Array.from(fileList);
    if (selectedFiles.length === 0) return;
    setFiles(prev => [...prev, ...selectedFiles]);
    setIsExtracting(true);
    setExtractingProgress(`Lecture de ${selectedFiles.length} document(s)...`);

    try {
      const parsed = await parseMultipleFiles(selectedFiles);
      let combined = '';
      parsed.forEach(doc => {
        combined += `\n--- PIÈCE : ${doc.name} ---\n${doc.content}`;
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
      setIsExtracting(false);
      setExtractingProgress('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
      if (e.target) e.target.value = '';
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
  const handleRunAgent = async (promptOverride?: string, customHistory?: AgentMessage[]) => {
    if (isExtracting) {
      toastError("Veuillez patienter pendant l'extraction du document...");
      return;
    }

    const promptToSend = (promptOverride || userInput).trim();
    if (!promptToSend && files.length === 0 && !extractedText.trim() && !activeThread?.extractedText?.trim()) {
      toastError("Veuillez saisir votre demande ou joindre au moins un document.");
      return;
    }

    if (!activeThread) return;

    // ── SAFETY NET: If files are attached but extractedText is somehow empty, extract them synchronously now!
    let capturedExtractedText = extractedText || activeThread.extractedText || '';
    if (files.length > 0 && !capturedExtractedText.trim()) {
      setIsExtracting(true);
      setCurrentRunStatus("Lecture et extraction immédiate des pièces jointes...");
      try {
        const parsed = await parseMultipleFiles(files);
        let directText = '';
        parsed.forEach(doc => {
          directText += `\n--- PIÈCE : ${doc.name} ---\n${doc.content}`;
        });
        capturedExtractedText = directText;
        setExtractedText(directText);
      } catch (err) {
        console.warn("Direct parse error in handleRunAgent:", err);
      } finally {
        setIsExtracting(false);
      }
    }

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
      if (!threadTitle && fileNames.length > 0) {
        threadTitle = `Analyse : ${fileNames[0].slice(0, 35)}`;
      }
    }

    const baseHistory = customHistory !== undefined ? customHistory : activeThread.messages;
    const updatedMessages = [...baseHistory, userMessage];
    const interimThread: AgentThread = {
      ...activeThread,
      title: threadTitle,
      messages: updatedMessages,
      uploadedFiles: updatedFiles,
      extractedText: capturedExtractedText,
      modelId: selectedModelId,
      personaId: selectedPersonaId
    };

    handleUpdateActiveThread(interimThread);
    setUserInput('');
    setFiles([]);
    setIsRunning(true);
    setStreamingContent('');
    setCurrentRunSteps([]);
    setCurrentRunStatus("Initialisation de l'Agent IA...");

    const controller = new AbortController();
    abortControllerRef.current = controller;

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
        jurisdictionId,
        attachedFileNames: updatedFiles,
        // Use the pre-mutation snapshot — never the post-setState closure
        extractedText: capturedExtractedText,
        userApiKeys: apiKeys,
        signal: controller.signal,
        onStepUpdate: (step) => {
          setCurrentRunSteps(prev => [...prev, step]);
          setCurrentRunStatus(step.label);
        },
        onTokenStream: (_chunk, accumulated) => {
          setStreamingContent(accumulated);
        }
      });

      setStreamingContent(null);
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

      // Auto expand the trace of the newly generated message if tools were called
      if (assistantMessage.toolCalls && assistantMessage.toolCalls.length > 0) {
        setExpandedTraceMsgId(assistantMessage.id);
      }

    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message === 'Aborted') {
        // Interrupted cleanly by user
      } else {
        console.error("Agent Run Error:", err);
        setStreamingContent(null);
        toastError("Une erreur est survenue lors de l'exécution de l'Agent IA.");
      }
    } finally {
      abortControllerRef.current = null;
      setIsRunning(false);
      setStreamingContent(null);
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
    <div className={
      isFullscreen 
        ? "fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden w-screen h-screen select-text" 
        : "bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col relative text-slate-900 w-full h-[calc(100dvh-4.5rem)] sm:h-[calc(100dvh-2.5rem)] min-h-[720px] sm:min-h-[820px] max-h-[980px]"
    }>
      
      {/* 1. TOP APPLICATION BAR (AGENT CONTROLS & MODEL SELECTOR) */}
      <div className="bg-white border-b border-slate-200 px-2.5 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-30 min-h-[52px]">
        
        {/* Left Side: Sidebar Toggle & Model / Persona Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title={sidebarOpen ? "Masquer le panneau des threads" : "Afficher l'historique des threads"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4.5 sm:w-5 h-4.5 sm:h-5" /> : <PanelLeft className="w-4.5 sm:w-5 h-4.5 sm:h-5" />}
          </button>

          {/* Model Selector Dropdown Button (Pillar 1) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setModelDropdownOpen(!modelDropdownOpen);
                setPersonaDropdownOpen(false);
              }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span className="truncate max-w-[85px] sm:max-w-[160px] md:max-w-none">{activeModelObj.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute left-0 mt-2 w-[calc(100vw-2.5rem)] max-w-xs sm:w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-fade-in space-y-1">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Modèle IA</span>
                  <span className="text-emerald-600 font-bold text-[10px]">Connecté</span>
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
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-cyan-900 text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
              <span className="truncate max-w-[85px] sm:max-w-[160px] md:max-w-none">{activePersonaObj.name}</span>
              <ChevronDown className="w-3 h-3 text-cyan-500 shrink-0" />
            </button>

            {personaDropdownOpen && (
              <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-[calc(100vw-2.5rem)] max-w-xs sm:max-w-sm sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-fade-in space-y-1">
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

          {/* Sélecteur de juridiction / pays */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setJurisdictionDropdownOpen(!jurisdictionDropdownOpen);
                setPersonaDropdownOpen(false);
                setModelDropdownOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Choisir le droit applicable"
            >
              <span>{activeJurisdiction.flag}</span>
              <span className="hidden sm:inline">{activeJurisdiction.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
            {jurisdictionDropdownOpen && (
              <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 animate-fade-in">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">Droit applicable</div>
                {JURISDICTIONS.map(j => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      setJurisdictionId(j.id);
                      try { localStorage.setItem('francejustice_jurisdiction', j.id); } catch {}
                      setJurisdictionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors ${jurisdictionId === j.id ? 'bg-cyan-50 text-cyan-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    <span>{j.flag}</span>
                    <span>{j.label}</span>
                    {jurisdictionId === j.id && <Check className="w-3.5 h-3.5 ml-auto text-cyan-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {/* Note: Bouton paramètres et modal conservés dans le code mais masqués de l'interface conformément à la demande */}

          {/* Export PDF Button */}
          {activeThread && activeThread.messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadThreadPDF(activeThread)}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold p-1.5 sm:px-2.5 sm:py-1.5 h-auto"
              title="Exporter l'analyse complète au format Tribunal"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600 sm:mr-1" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
          )}

          {/* Share / Partager Conversation */}
          {activeThread && activeThread.messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareConversation}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold p-1.5 sm:px-2.5 sm:py-1.5 h-auto"
              title="Copier le compte-rendu complet du dossier"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-600 sm:mr-1" />
              <span className="hidden sm:inline">Partager</span>
            </Button>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isFullscreen ? "Réduire l'affichage (Écran standard)" : "Plein écran immersif (Maximiser)"}
            aria-label="Plein écran"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-600" /> : <Maximize2 className="w-4 h-4 text-slate-600" />}
          </button>

          {/* New Thread Button (Pillar 2) */}
          <Button
            size="sm"
            onClick={handleNewThread}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs p-1.5 sm:px-3 sm:py-1.5 h-auto gap-1"
            title="Nouveau fil de discussion"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nouveau Thread</span>
          </Button>
        </div>
      </div>

      {/* 2. MAIN CONTAINER (SIDEBAR FOR THREADS + CONVERSATION CANVAS) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile & Tablet Backdrop for Sidebar Drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 xl:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* 2.A CHATGPT-STYLE SIDEBAR (THREAD SESSIONS & HISTORY - PILLAR 2) */}
        {sidebarOpen && (
          <aside className="fixed xl:relative inset-y-0 left-0 w-72 sm:w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 z-50 xl:z-10 shadow-2xl xl:shadow-none transition-all overflow-hidden h-full">
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
                  className="xl:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer"
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
        <div 
          className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden relative"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
              await processFiles(e.dataTransfer.files);
            }
          }}
        >
          {/* Drag & Drop Visual Overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 z-50 bg-cyan-600/10 backdrop-blur-xs border-2 border-dashed border-cyan-500 rounded-3xl m-4 flex flex-col items-center justify-center pointer-events-none animate-fade-in text-cyan-900">
              <div className="p-4 rounded-full bg-white shadow-xl mb-3 animate-bounce">
                <UploadCloud className="w-10 h-10 text-cyan-600" />
              </div>
              <p className="text-base font-extrabold text-slate-900">Déposez vos documents, photos ou contrats ici</p>
              <p className="text-xs text-slate-600 mt-1 font-medium">PDF, Word, Excel, TXT ou Images • Traitement instantané par l'Agent IA</p>
            </div>
          )}
          
          {/* Scrollable Conversation Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin flex flex-col">
            <div className="max-w-4xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-between">

              {/* WELCOME SCREEN (WHEN THREAD HAS NO MESSAGES) */}
              {(!activeThread || activeThread.messages.length === 0) && !isRunning && (
                <div className="py-8 sm:py-16 text-center space-y-5 sm:space-y-7 animate-fade-in my-auto">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-linear-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-600/20">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 max-w-xl mx-auto px-2">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                      Bonjour. Que souhaitez-vous analyser aujourd'hui ?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      L'Agent IA autonome de France Justice analyse vos documents, calcule vos indemnités (€), vérifie les textes de lois applicables et vous guide pas à pas.
                    </p>
                  </div>

                  {/* Suggested Persona Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-w-2xl mx-auto text-left pt-1 sm:pt-2 px-1">
                    {activePersonaObj.suggestedPrompts.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleRunAgent(tmpl.prompt)}
                        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white hover:bg-cyan-50/40 border border-slate-200 hover:border-cyan-400 transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between gap-2 sm:gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 group-hover:bg-cyan-100 transition-colors shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-black text-slate-900 group-hover:text-cyan-900 transition-colors line-clamp-1">
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

              {/* MESSAGES THREAD (STYLE CONVERSATIONNEL CLAUDE / CHATGPT / GEMINI) */}
              {activeThread && activeThread.messages.map((msg, idx) => (
                msg.role === 'user' ? (
                  // Message Utilisateur — Bulle épurée et moderne avec édition (comme Claude / ChatGPT)
                  <div key={msg.id || idx} className="flex justify-end w-full animate-fade-in group/user">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 py-3.5 bg-slate-900 text-white shadow-sm space-y-2 relative">
                      {msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pb-0.5">
                          {msg.files.map((fname, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-medium">
                              <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> {fname}
                            </span>
                          ))}
                        </div>
                      )}

                      {editingMsgId === msg.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingMsgId(null)}
                              className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedMessage(msg.id)}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Enregistrer &amp; Relancer</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm sm:text-[15px] font-normal leading-relaxed whitespace-pre-wrap text-white/95 flex-1">
                            {msg.content}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMsgId(msg.id);
                              setEditingContent(msg.content);
                            }}
                            className="opacity-0 group-hover/user:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer shrink-0"
                            title="Modifier votre message (comme Claude / ChatGPT)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Message Assistant — Rendu conversationnel pur, fluide et élégant
                  <div key={msg.id || idx} className="flex items-start gap-3 sm:gap-4 w-full animate-fade-in group">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">France Justice</span>
                        {activePersonaObj && (
                          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                            • {activePersonaObj.name}
                          </span>
                        )}
                      </div>

                      {/* Mode Réflexion Dépliable (Thinking Process comme Claude 3.7 & OpenAI o1/o3) */}
                      {msg.thinking && (
                        <div className="mb-2">
                          <button
                            type="button"
                            onClick={() => setExpandedThinkingMsgId(expandedThinkingMsgId === msg.id ? null : msg.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
                            title="Consulter le raisonnement analytique de l'IA"
                          >
                            <Brain className="w-3 h-3 text-cyan-600" />
                            <span>
                              {msg.thinkingDurationMs 
                                ? `Pensée pendant ${(msg.thinkingDurationMs / 1000).toFixed(1)}s` 
                                : 'Raisonnement & Analyse'}
                            </span>
                            {expandedThinkingMsgId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {expandedThinkingMsgId === msg.id && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed animate-fade-in">
                              {msg.thinking}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Trace des outils — Minimaliste et discrète (style Claude / ChatGPT) */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mb-2">
                          <button
                            type="button"
                            onClick={() => setExpandedTraceMsgId(expandedTraceMsgId === msg.id ? null : msg.id)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer group/trace"
                          >
                            <Zap className="w-3 h-3 text-cyan-500 group-hover/trace:text-cyan-600 transition-colors" />
                            <span className="italic">
                              {expandedTraceMsgId === msg.id ? 'Masquer la recherche' : `Analysé avec ${msg.toolCalls.length} outil${msg.toolCalls.length > 1 ? 's' : ''}`}
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

                      {/* Réponse Juridique Fluide & Conversationnelle */}
                      <div className="text-sm sm:text-[15px] text-slate-800 leading-relaxed font-normal">
                        <CleanLegalText content={msg.content} />
                      </div>

                      {/* Sources & Références Officielles avec Liens Externes Cliquables (Style Claude / Gemini / Perplexity) */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 pb-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                            <Globe className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Sources &amp; Références officielles vérifiées ({msg.sources.length})</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {msg.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/src flex items-start gap-2.5 p-2.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-cyan-50/40 hover:border-cyan-400 transition-all shadow-2xs hover:shadow-xs"
                                title={`Consulter ${src.title} sur ${src.uri}`}
                              >
                                <div className="p-1.5 rounded-xl bg-slate-50 text-slate-500 group-hover/src:bg-cyan-100 group-hover/src:text-cyan-700 transition-colors shrink-0 mt-0.5">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900 group-hover/src:text-cyan-900 truncate">
                                      {src.title}
                                    </span>
                                    {src.badge && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                                        {src.badge}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-cyan-700 font-mono block mt-0.5 truncate">
                                    {src.uri.replace(/^https?:\/\//, '').split('/')[0]}
                                  </span>
                                  {src.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-snug">
                                      {src.description}
                                    </p>
                                  )}
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Évaluation indicative du dossier */}
                      {msg.prognosis && (
                        <div className="mt-2 p-3 rounded-2xl border border-slate-200 bg-white space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                              <Scale className="w-3.5 h-3.5 text-cyan-600" /> Évaluation indicative du dossier
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${msg.prognosis.score >= 80 ? 'bg-emerald-50 text-emerald-700' : msg.prognosis.score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                              {msg.prognosis.label}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${msg.prognosis.score >= 80 ? 'bg-emerald-500' : msg.prognosis.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${msg.prognosis.score}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                            <span className="text-slate-600">Risque : <strong className="text-slate-800">{msg.prognosis.riskLevel}</strong></span>
                            <span className="text-slate-600">Délais : <strong className={msg.prognosis.prescriptionStatus === 'urgent' ? 'text-red-600' : 'text-slate-800'}>{msg.prognosis.prescriptionStatus}</strong></span>
                            <span className="text-slate-600 sm:col-span-1">{msg.prognosis.strengthText}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug">
                            Estimation automatique indicative basée sur le type de litige — ne constitue pas une prédiction de décision de justice.
                          </p>
                        </div>
                      )}

                      {/* Frise chronologique de procédure */}
                      {msg.timelineRoadmap && msg.timelineRoadmap.length > 0 && (
                        <div className="mt-2 p-3 rounded-2xl border border-slate-200 bg-white space-y-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">Feuille de route procédurale</span>
                          <ol className="relative border-l-2 border-cyan-100 ml-2 space-y-3">
                            {msg.timelineRoadmap.map(step => (
                              <li key={step.stepNumber} className="ml-4 relative">
                                <span className="absolute -left-[25px] top-0.5 w-4 h-4 rounded-full bg-cyan-600 text-white text-[9px] font-bold flex items-center justify-center">{step.stepNumber}</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">{step.timeframe}</span>
                                  <span className="text-xs font-bold text-slate-900">{step.title}</span>
                                  {step.badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{step.badge}</span>}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.description}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Validation par un avocat */}
                      {msg.prognosis && (
                        <a
                          href="/lawyers"
                          className="mt-2 flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition-colors group"
                        >
                          <span className="flex items-center gap-2 text-xs font-bold">
                            <ShieldCheck className="w-4 h-4 text-cyan-300" />
                            Faire valider cette analyse par un avocat partenaire
                          </span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      )}

                      {/* Automatisations & Actions juridiques concrètes (comme ChatGPT Actions & Claude) */}
                      {msg.automations && msg.automations.length > 0 && (
                        <div className="pt-2.5 pb-1 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-cyan-950">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Actions juridiques concrètes recommandées :</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.automations.map((auto, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => handleRunAgent(auto.actionPrompt)}
                                disabled={isRunning}
                                className="text-left bg-gradient-to-br from-cyan-50/80 via-white to-teal-50/40 hover:from-cyan-100/90 hover:to-white border border-cyan-200/90 hover:border-cyan-400 p-2.5 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer group flex flex-col justify-between gap-1 disabled:opacity-50"
                              >
                                <div>
                                  <span className="text-xs font-bold text-cyan-950 group-hover:text-cyan-800 transition-colors block">
                                    {auto.label}
                                  </span>
                                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                                    {auto.description}
                                  </p>
                                </div>
                                <span className="text-[10px] font-bold text-cyan-700 flex items-center gap-1 group-hover:underline pt-1">
                                  ⚡ Déclencher l'action <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions de suite intelligentes & Questions suggérées (comme Claude, Gemini & ChatGPT) */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="pt-2.5 pb-1 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
                            <span>Suggestions de suite & questions recommandées :</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {msg.suggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleRunAgent(sug)}
                                disabled={isRunning}
                                className="text-xs text-left bg-slate-50 hover:bg-cyan-50 text-slate-800 hover:text-cyan-950 border border-slate-200 hover:border-cyan-400 py-1.5 px-3 rounded-full font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-2 group disabled:opacity-50"
                                title="Cliquer pour poser cette question à l'IA"
                              >
                                <span>{sug}</span>
                                <ArrowRight className="w-3 h-3 text-cyan-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Barre d'outils discrète en bas de message (style Claude / ChatGPT / Gemini) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/80 flex-wrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* Badge de durée de calcul / latence (comme Gemini & ChatGPT) */}
                          {msg.thinkingDurationMs && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-500 font-semibold mr-1"
                              title="Temps de réponse du modèle IA"
                            >
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>{(msg.thinkingDurationMs / 1000).toFixed(1)}s</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              setCopiedMsgId(msg.id);
                              setTimeout(() => setCopiedMsgId(null), 2000);
                              success("Réponse copiée dans le presse-papier.");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Copier la réponse"
                          >
                            {copiedMsgId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 text-xs font-bold">Copié</span>
                              </>
                            ) : (
                              <>
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                <span className="text-xs">Copier</span>
                              </>
                            )}
                          </button>

                          {/* Bouton Partager (style ChatGPT & Claude) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: activeThread?.title || "Consultation France Justice",
                                  text: msg.content.slice(0, 300) + '...',
                                  url: window.location.href
                                }).catch(() => {});
                              } else {
                                navigator.clipboard.writeText(`${activeThread?.title || "Consultation France Justice"}\n\n${msg.content}`);
                                success("Consultation copiée pour partage !");
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Partager cette réponse"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="text-xs">Partager</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleSpeaking(msg.content)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Écouter la réponse vocalement"
                          >
                            {isSpeaking ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-red-500 text-xs font-bold">Arrêter</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="text-xs">Écouter</span>
                              </>
                            )}
                          </button>

                          {/* Bouton Régénérer (Style ChatGPT / Claude) */}
                          <button
                            type="button"
                            onClick={() => handleRegenerate(idx)}
                            disabled={isRunning}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                            title="Régénérer cette réponse"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span className="text-xs">Régénérer</span>
                          </button>

                          {/* Boutons Feedback / Évaluation */}
                          <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                feedbackMap[msg.id] === 'up'
                                  ? 'text-cyan-700 bg-cyan-50'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Réponse utile"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                feedbackMap[msg.id] === 'down'
                                  ? 'text-red-700 bg-red-50'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Réponse à améliorer"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Actions d'export universel (Pack Office, Word, Excel, PowerPoint, Signature) */}
                        {(() => {
                          const hasTable = msg.content && /\|.+\|.+\|/.test(msg.content);
                          const hasSlides = msg.content && /#\s+.+\n[•\-*]/.test(msg.content);
                          const isSignableAct = msg.content && /MISE EN DEMEURE|CONVENTION|PROJET D['’]ACCORD|CONTRAT DE|LETTRE DE MISE EN DEMEURE VALANT SOMMATION|ACTE SOUS SIGNATURE PRIVÉE/i.test(msg.content);
                          const canDownloadWord = msg.content && msg.content.length > 80;

                          return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Export PDF direct du message */}
                              {canDownloadWord && (
                                <button
                                  type="button"
                                  onClick={() => downloadMessagePDF(msg, activeThread?.title)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-rose-200"
                                  title="Imprimer ou exporter cette consultation en PDF officiel"
                                >
                                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                                  <span>PDF</span>
                                </button>
                              )}

                              {/* Export Word (.doc) */}
                              {canDownloadWord && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadWordDocument(msg.content, activeThread?.title || "Document_FranceJustice");
                                    success("Document Word (.doc) téléchargé avec succès !");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-cyan-800 bg-slate-100 hover:bg-cyan-50 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-200"
                                  title="Télécharger la réponse en document Word (.doc)"
                                >
                                  <Download className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>Word (.doc)</span>
                                </button>
                              )}

                              {/* Export Excel (.csv) */}
                              {hasTable && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadExcelSpreadsheet(msg.content, activeThread?.title || "Tableau_Donnees");
                                    success("Tableau Excel (.csv) exporté avec succès !");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-emerald-200"
                                  title="Télécharger les données en fichier Excel (.csv)"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Excel (.csv)</span>
                                </button>
                              )}

                              {/* Export Diapositives PowerPoint (.html / slides) */}
                              {hasSlides && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadPowerPointPresentation(msg.content, activeThread?.title || "Presentation_FranceJustice");
                                    success("Présentation diapos exportée avec succès !");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-amber-200"
                                  title="Exporter en présentation de diapositives"
                                >
                                  <Download className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Diapos (PPT)</span>
                                </button>
                              )}

                              {/* Ouvrir dans Canvas / Artifacts (Style Claude Artifacts & ChatGPT Canvas) */}
                              {msg.content && msg.content.length > 180 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCanvasDocument({
                                      title: activeThread?.title || "Document & Analyse Officielle",
                                      content: msg.content
                                    });
                                    setCanvasOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-cyan-800 hover:text-cyan-900 bg-cyan-50/80 hover:bg-cyan-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-cyan-200"
                                  title="Ouvrir dans le panneau interactif Canvas pour éditer en direct"
                                >
                                  <LayoutTemplate className="w-3.5 h-3.5 text-cyan-700" />
                                  <span>Canvas</span>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )
              ))}

              {/* ÉTAT DE RÉFLEXION CONVERSATIONNEL ET STREAMING EN TEMPS RÉEL (STYLE CHATGPT / CLAUDE) */}
              {isRunning && (
                <div className="flex items-start gap-3 sm:gap-4 mr-auto w-full animate-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2 py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">France Justice</span>
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                      <span className="text-xs text-slate-400 font-medium">
                        {streamingContent ? "En train d'écrire..." : (currentRunStatus || "Réflexion en cours...")}
                      </span>
                    </div>

                    {/* Contenu streaming en direct mot par mot */}
                    {streamingContent ? (
                      <div className="text-sm sm:text-[15px] text-slate-800 leading-relaxed font-normal">
                        <CleanLegalText content={streamingContent} />
                        <span className="inline-block w-2 h-4 bg-cyan-600 ml-1 animate-pulse align-middle rounded-xs" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
                        <span>{currentRunStatus || "Analyse personnalisée en cours..."}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          </div>

          {/* 2.C FLOATING COMPOSER DOCK (CHATGPT / CLAUDE STYLE) */}
          <div className="px-2 sm:px-6 pt-2 pb-1 bg-gradient-to-t from-white via-white/95 to-transparent border-t border-slate-100 shrink-0 mt-auto sticky bottom-0 z-20">
            <div className="max-w-4xl mx-auto w-full">
              
              {/* Floating Dock Box */}
              <div className="bg-white border-2 border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 rounded-2xl sm:rounded-3xl shadow-md sm:shadow-lg p-2.5 sm:p-3 transition-all flex flex-col gap-1.5 sm:gap-2 mb-0.5">
                
                {/* Uploaded Files Chips (Inside the input card) */}
                {(files.length > 0 || isExtracting) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 px-0.5">
                    {files.map((file, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-[11px] sm:text-xs font-bold text-cyan-900 shadow-2xs">
                        <FileText className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span className="max-w-[120px] sm:max-w-[150px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFiles(prev => prev.filter((_, i) => i !== idx));
                            if (files.length <= 1) setExtractedText('');
                          }}
                          className="ml-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    {isExtracting && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] sm:text-xs font-bold text-amber-800 animate-pulse">
                        <RotateCw className="w-3 h-3 animate-spin text-amber-600" />
                        <span>{extractingProgress || "Extraction du texte en cours..."}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Main User Textarea */}
                <textarea
                  ref={chatInputRef}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleRunAgent();
                    }
                  }}
                  placeholder={`Posez votre question à ${activePersonaObj.name} ou exposez les faits...`}
                  rows={2}
                  className="w-full bg-transparent border-none resize-none focus:outline-hidden text-sm sm:text-sm text-slate-900 placeholder-slate-400 px-1 py-1 scrollbar-none min-h-[38px] sm:min-h-[44px]"
                />

                {/* Bottom Action Toolbar inside the Input Zone */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 gap-1">
                  {/* Left: The Document Import Paperclip inside the input zone */}
                  <div className="flex items-center gap-1.5 min-w-0">
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
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-slate-600 hover:text-cyan-800 bg-slate-100 hover:bg-cyan-50 border border-slate-200/80 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                      title="Joindre des documents (PDF, contrats, baux)"
                      aria-label="Joindre des documents"
                    >
                      <Paperclip className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-cyan-600" />
                      <span className="inline">Joindre</span>
                      <span className="hidden sm:inline">un document</span>
                    </button>
                  </div>

                  {/* Right: Mic & Send / Stop Buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all cursor-pointer shrink-0 ${
                        isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:text-cyan-700 hover:bg-slate-100'
                      }`}
                      title={isListening ? 'Arrêter la dictée vocale' : 'Dictée Vocale'}
                    >
                      {isListening ? <MicOff className="w-4 sm:w-4.5 h-4 sm:h-4.5" /> : <Mic className="w-4 sm:w-4.5 h-4 sm:h-4.5" />}
                    </button>

                    {isRunning ? (
                      <button
                        type="button"
                        onClick={handleStopGeneration}
                        className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer animate-pulse"
                        title="Arrêter la génération (Stop)"
                        aria-label="Arrêter la génération"
                      >
                        <Square className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRunAgent()}
                        disabled={(!userInput.trim() && files.length === 0 && !extractedText.trim()) || isExtracting}
                        className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                        title={isExtracting ? "Extraction du document en cours..." : "Lancer le Run de l'Agent IA"}
                        aria-label="Envoyer"
                      >
                        {isExtracting ? (
                          <RotateCw className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin text-white" />
                        ) : (
                          <Send className="w-3.5 sm:w-4 h-3.5 sm:h-4 translate-x-px -translate-y-px" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-center pt-0.5 pb-0 text-[10px] sm:text-[11px] text-slate-500 truncate sm:whitespace-normal px-1">
                Agent IA France Justice • Modèle : {activeModelObj.name} • Droit français, européen &amp; international • Conformité EU AI Act.
              </div>
            </div>
          </div>

        </div>

        {/* 2.C INTERACTIVE CANVAS / ARTIFACTS PANEL (STYLE CLAUDE ARTIFACTS & CHATGPT CANVAS) */}
        {canvasOpen && canvasDocument && (
          <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[500px] xl:relative xl:inset-auto xl:w-[45%] border-l border-slate-200 bg-white flex flex-col h-full shadow-2xl z-50 xl:z-20 animate-fade-in shrink-0">
            {/* Canvas Header */}
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-xl bg-cyan-100 text-cyan-800 shrink-0">
                  <LayoutTemplate className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {canvasDocument.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Canvas interactif • Studio d'édition en direct</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    downloadWordDocument(canvasDocument.content, canvasDocument.title);
                    success("Document Word (.doc) exporté depuis Canvas !");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Télécharger en Word (.doc)"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="hidden sm:inline">Word</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(canvasDocument.content);
                    success("Contenu copié dans le presse-papier !");
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors shadow-2xs"
                  title="Copier tout"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
                  title="Fermer le Canvas"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas Body: Live Editable Document Studio */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/30">
              <textarea
                value={canvasDocument.content}
                onChange={(e) => setCanvasDocument({ ...canvasDocument, content: e.target.value })}
                className="w-full h-full min-h-[400px] p-5 rounded-2xl border border-slate-200 bg-white font-serif text-sm leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none shadow-xs font-normal"
                placeholder="Éditez et personnalisez votre document ici..."
              />
            </div>

            {/* Canvas Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{canvasDocument.content.length} caractères</span>
              <span className="italic text-cyan-700 font-medium">Modifications synchronisées en direct</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. SETTINGS & ARCHITECTURE MODAL (Préservé dans le code, masqué de l'interface) */}
      {false && (
        <AgentSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKeys={apiKeys}
          onSaveApiKeys={(newKeys) => {
            setApiKeys(newKeys);
            saveStoredApiKeys(newKeys);
          }}
        />
      )}

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
