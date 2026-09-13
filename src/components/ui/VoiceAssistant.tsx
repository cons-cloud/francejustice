import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  CornerDownLeft, 
  Activity, 
  Loader2,
  AlertTriangle,
  FileText,
  Check,
  Eye,
  Download,
  Paperclip,
  Trash2,
  Send
} from 'lucide-react';
import { chatWithAI } from '../../lib/gemini';
import { Button } from './Button';
import { useTranslation } from '../../i18n';
import { parseMultipleFiles } from '../../lib/documentParser';

// Web Speech APIs wrappers
const SpeechRecognition = typeof window !== 'undefined' 
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) 
  : null;

interface VoiceAssistantProps {
  mode: 'citizen' | 'lawyer';
  activeTab: string;
  onAction: (action: { type: string; payload: any }) => void;
  stateContext?: any;
  variant?: 'fixed' | 'inline';
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  mode,
  activeTab,
  onAction,
  stateContext = {},
  variant = 'fixed'
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [history, setHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<{ title: string; content: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; content: string } | null>(null);
  const [webSources, setWebSources] = useState<any[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string; type: string }[]>([]);

  const recognitionRef = useRef<any>(null);
  const speechUttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceFileInputRef = useRef<HTMLInputElement | null>(null);

  const extractTextFromPDFBuffer = (buffer: ArrayBuffer): string => {
    try {
      const bytes = new Uint8Array(buffer);
      let raw = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        raw += String.fromCharCode.apply(null, Array.from(chunk));
      }

      const extractedBlocks: string[] = [];

      // 1. Extract literal text strings in PDF stream blocks (parenthesized strings)
      const matches = raw.match(/\(([^()]{2,})\)/g);
      if (matches && matches.length > 0) {
        const extracted = matches
          .map(m => m.slice(1, -1))
          .filter(str => /[a-zA-Zàáâäæçèéêëîïôœùûüÿ0-9]/i.test(str) && !/^\/[A-Z]/i.test(str))
          .join(' ')
          .replace(/\s+/g, ' ');
        if (extracted.trim().length > 20) {
          extractedBlocks.push(extracted);
        }
      }

      // 2. Extract hex-encoded text strings <48656c6c6f>
      const hexMatches = raw.match(/<([0-9A-Fa-f]{4,})>/g);
      if (hexMatches && hexMatches.length > 0) {
        try {
          const hexDecoded = hexMatches
            .map(h => {
              const hex = h.slice(1, -1);
              let str = '';
              for (let i = 0; i < hex.length; i += 2) {
                const code = parseInt(hex.substr(i, 2), 16);
                if (code >= 32 && code <= 255) str += String.fromCharCode(code);
              }
              return str;
            })
            .filter(s => /[a-zA-Zàáâäæçèéêëîïôœùûüÿ0-9]{2,}/i.test(s))
            .join(' ');
          if (hexDecoded.trim().length > 20) {
            extractedBlocks.push(hexDecoded);
          }
        } catch (e) {}
      }

      // 3. Fallback extraction: extract French words, numbers, and legal clauses
      const words = raw.match(/[A-Za-zÀ-ÿ0-9,.'’\-–—:;!?]{2,}/g);
      if (words && words.length > 0) {
        const pdfKeywords = new Set(['obj', 'endobj', 'stream', 'endstream', 'Catalog', 'Pages', 'Page', 'MediaBox', 'Resources', 'Font', 'Type', 'Subtype', 'BaseFont', 'Length', 'Filter', 'FlateDecode', 'ProcSet']);
        const cleanWords = words.filter(w => !pdfKeywords.has(w) && !w.startsWith('/'));
        const wordText = cleanWords.join(' ').replace(/\s+/g, ' ');
        if (wordText.trim().length > 20) {
          extractedBlocks.push(wordText);
        }
      }

      if (extractedBlocks.length > 0) {
        return extractedBlocks.join('\n\n');
      }
    } catch (err) {
      console.warn("Erreur d'extraction du PDF:", err);
    }
    return "Document PDF importé avec succès. Contenu prêt pour l'analyse et la traitement juridique.";
  };

  const extractTextFromBinaryDocument = (buffer: ArrayBuffer, fileName: string): string => {
    try {
      const bytes = new Uint8Array(buffer);
      const ext = fileName.toLowerCase().split('.').pop() || '';
      
      // UTF-8 decode
      let raw = '';
      try {
        const decoder = new TextDecoder('utf-8');
        raw = decoder.decode(bytes);
      } catch (e) {
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          raw += String.fromCharCode.apply(null, Array.from(chunk));
        }
      }

      // 1. Word .docx XML tag extraction <w:t>text</w:t>
      if (ext === 'docx' || ext === 'doc' || raw.includes('<w:t')) {
        const wordMatches = raw.match(/<w:t[^>]*>(.*?)<\/w:t>/gi);
        if (wordMatches && wordMatches.length > 0) {
          const text = wordMatches
            .map(m => m.replace(/<[^>]+>/g, '').trim())
            .filter(t => t.length > 0 && !t.startsWith('PK') && !t.includes('schemas.openxml'))
            .join(' ')
            .replace(/\s+/g, ' ');
          if (text.trim().length > 10) return text;
        }
      }

      // 2. Excel .xlsx XML cell extraction <t>text</t> or <v>value</v>
      if (ext === 'xlsx' || ext === 'xls' || raw.includes('sheet') || raw.includes('<worksheet')) {
        const excelMatches = raw.match(/<(?:t|v)[^>]*>(.*?)<\/(?:t|v)>/gi);
        if (excelMatches && excelMatches.length > 0) {
          const text = excelMatches
            .map(m => m.replace(/<[^>]+>/g, '').trim())
            .filter(t => t.length > 0 && !t.startsWith('PK'))
            .join(' | ')
            .replace(/\s+/g, ' ');
          if (text.trim().length > 10) return text;
        }
      }

      // 3. Clean string extraction: strip ZIP structural headers and XML noise
      const cleanRaw = raw.replace(/<[^>]+>/g, ' ')
                          .replace(/(?:word\/|rels\/|theme\/|docProps\/|xl\/|worksheets\/|\[Content_Types\]\.xml)[^\s]*/gi, ' ')
                          .replace(/PK[\s\S]{1,50}?document\.xml/gi, ' ');

      const words = cleanRaw.match(/[A-Za-zÀ-ÿ0-9,.'’\-–—:;!?]{2,}/g);
      if (words && words.length > 0) {
        const junk = new Set([
          'xml', 'xmlns', 'rel', 'rels', 'schemas', 'openxmlformats', 'wordprocessingml',
          'spreadsheetml', 'ContentType', 'Override', 'PartName', 'word', 'docProps', 'theme',
          'settings', 'fontTable', 'webSettings', 'PK', 'xmlRels', 'app', 'core'
        ]);
        const clean = words.filter(w => !junk.has(w) && !w.startsWith('http') && w.length < 40);
        if (clean.length > 10) {
          return clean.join(' ').replace(/\s+/g, ' ');
        }
      }
    } catch (e) {
      console.warn("Erreur extraction binaire:", e);
    }
    return `Fichier "${fileName}" chargé avec succès. Contenu prêt pour l'analyse juridique.`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const parsed = await parseMultipleFiles(files);
      setAttachedFiles((prev) => [
        ...prev,
        ...parsed.map(p => ({
          name: p.name,
          content: p.content,
          type: p.type
        }))
      ]);
    } catch (err) {
      console.warn("Erreur parsing fichiers audio/doc:", err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const downloadDocAsPDF = (doc: { title: string; content: string }) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${doc.title}</title>
            <style>
              body { font-family: Georgia, serif; padding: 40px; color: #1f2937; line-height: 1.6; }
              h1 { font-family: sans-serif; text-align: center; margin-bottom: 30px; }
              pre { white-space: pre-wrap; font-family: Georgia, serif; font-size: 14px; }
            </style>
          </head>
          <body>
            <h1>${doc.title}</h1>
            <pre>${doc.content}</pre>
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
  };



  const mapLangToSpeech = (lang: string): string => {
    switch (lang) {
      case 'ar': return 'ar-MA';
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      case 'ru': return 'ru-RU';
      case 'tr': return 'tr-TR';
      case 'ku': return 'ku-TR';
      case 'fr':
      default:
        return 'fr-FR';
    }
  };

  useEffect(() => {
    if (SpeechRecognition) {
      setRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = mapLangToSpeech(i18n.language);

      rec.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
      };

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
           handleVoiceCommand(transcript);
        }
      };

      recognitionRef.current = rec;
    }
  }, [i18n.language]);

  // Handle auto-scroll in responses
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response, transcript, errorMsg]);

  // Synthesis voices setup
  const getVoiceForLang = (lang: string): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const targetLang = mapLangToSpeech(lang);
    const prefix = targetLang.split('-')[0];
    return voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase() && v.name.includes('Google')) ||
           voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
           voices.find(v => v.lang.toLowerCase().startsWith(prefix.toLowerCase())) ||
           null;
  };

  const playChime = (freq: number, type: OscillatorType, duration: number) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Web Audio API not allowed or supported', e);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakText = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    stopSpeaking();

    let cleanSpeechText = text
      .replace(/```[^`]*```/g, '')
      .replace(/[*#`_~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\[\d+\]/g, '')
      .replace(/[👉💬📄💡⚖️✅⚠️1️⃣2️⃣3️⃣4️⃣5️⃣]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeechText) return;

    // For fluid, human-like voice interaction, synthesize key findings dynamically and invite discussion
    if (cleanSpeechText.length > 450) {
      const sentences = cleanSpeechText.split('. ');
      let vocalSummary = '';
      for (const s of sentences) {
        if ((vocalSummary + s).length < 350) {
          vocalSummary += (vocalSummary ? '. ' : '') + s;
        } else {
          break;
        }
      }
      cleanSpeechText = (vocalSummary || cleanSpeechText.slice(0, 350)) + ". J'ai affiché l'analyse complète, les articles de loi et la démarche sur votre écran. Souhaitez-vous que nous approfondissions un point particulier ?";
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = mapLangToSpeech(i18n.language);
    const activeVoice = getVoiceForLang(i18n.language);
    if (activeVoice) {
      utterance.voice = activeVoice;
    }
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechUttRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const interpretLocalCommand = (rawText: string): boolean => {
    const clean = rawText.toLowerCase().trim();

    // NEVER switch tabs if files are attached or if the user asks for analysis/processing
    if (attachedFiles.length > 0) return false;

    const hasExplicitNavVerb = /^(\bva\b|\bouvre\b|\baffiche\b|\bmontre\b|\bbascule\b|\bnavigue\b|\baller\b|\baller sur\b|\baller à\b|\baccède\b|\baccéder\b)/.test(clean);
    if (!hasExplicitNavVerb) return false;
    
    if (mode === 'citizen') {
      const citizenTabs: Record<string, string[]> = {
        overview: ['accueil', 'tableau', 'dashboard', 'vue d\'ensemble'],
        appointments: ['rendez-vous', 'rdv', 'planning', 'calendrier', 'réserver', 'agenda', 'consultation'],
        documents: ['document', 'justificatif', 'pièce', 'télécharger', 'fichier', 'pdf', 'coffre-fort'],
        avocats: ['annuaire', 'avocat', 'rechercher', 'trouver', 'spécialiste'],
        generator: ['générateur', 'rédiger', 'créer un document', 'générer', 'contrat', 'mise en demeure'],
        profile: ['profil', 'mon compte', 'informations', 'paramètres', 'adresse'],
        quotes: ['devis', 'facture', 'paiement', 'tarif'],
        chat: ['discussion', 'messagerie', 'chat', 'avocat discussion'],
        searches: ['ia juridique', 'recherche juridique', 'intelligence artificielle', 'poser une question'],
        codes: ['code de loi', 'lois', 'article', 'légifrance', 'code civil'],
        procedures: ['procédure', 'étapes', 'démarches', 'formalités'],
        analyse: ['analyse', 'analyser un document'],
        formations: ['formation', 'cours', 'apprendre']
      };

      for (const [tab, keywords] of Object.entries(citizenTabs)) {
        if (keywords.some(kw => clean.includes(kw))) {
          onAction({ type: 'SWITCH_TAB', payload: { tab } });
          return true;
        }
      }
    } else {
      const lawyerTabs: Record<string, string[]> = {
        overview: ['accueil', 'tableau', 'dashboard', 'principale', 'vue d\'ensemble', 'statistiques'],
        appointments: ['rendez-vous', 'rdv', 'agenda', 'calendrier', 'planning', 'consultation'],
        cases: ['dossier', 'client', 'affaire', 'dossier client', 'documents clients'],
        quotes: ['devis', 'facture', 'billing', 'compta', 'tarif', 'paiement', 'argent'],
        outils: ['outil', 'tech', 'ressource', 'calcul', 'simulateur', 'contrat'],
        assistance: ['support', 'assistance', 'ticket', 'aide', 'support technique'],
        profil: ['profil', 'compte', 'biographie', 'specialité', 'bio'],
        messages: ['discussion', 'messagerie', 'chat', 'messages ia'],
        searches: ['ia juridique', 'recherche juridique'],
        avocats: ['réseau', 'confrère', 'avocats'],
        codes: ['code de loi', 'lois', 'article', 'code civil'],
        procedures: ['procédure', 'étapes', 'démarches'],
        analyse: ['analyse', 'analyser un document'],
        formations: ['formation', 'cours', 'apprendre']
      };

      for (const [tab, keywords] of Object.entries(lawyerTabs)) {
        if (keywords.some(kw => clean.includes(kw))) {
          onAction({ type: 'SWITCH_TAB', payload: { tab } });
          return true;
        }
      }
    }
    return false;
  };

  const handleVoiceCommand = async (commandText: string) => {
    if (!commandText || commandText.trim() === 'Écoute en cours...') return;
    
    stopSpeaking();
    setIsProcessing(true);
    setResponse('Analyse et traitement juridique du dossier en cours...');
    setSources([]);
    setGeneratedDoc(null);

    playChime(600, 'sine', 0.12);

    const handledLocally = interpretLocalCommand(commandText);

    const availableTabs = mode === 'citizen' 
      ? ['overview', 'appointments', 'generator', 'documents', 'quotes', 'chat', 'searches', 'codes', 'procedures', 'analyse', 'formations', 'avocats', 'profile']
      : ['overview', 'appointments', 'cases', 'quotes', 'messages', 'searches', 'avocats', 'codes', 'procedures', 'analyse', 'formations', 'outils', 'assistance', 'profil'];

    const promptContext = `
Vous êtes l'assistant IA juridique expert de France Justice.
Vous traitez et analysez TOUTES les demandes de l'utilisateur DIRECTEMENT au sein de cette interface d'assistant IA.

${attachedFiles.length > 0 ? `
=== DOSSIERS ET PIÈCES JOINTES SOUMIS PAR L'UTILISATEUR (${attachedFiles.length} FICHIER(S)) ===
${attachedFiles.map((f, idx) => `--- Nom de la pièce [${idx + 1}]: ${f.name} ---\n${f.content}`).join('\n\n')}

EXIGENCE STRICTE DE TRAITEMENT DU DOSSIER :
Vous DEVEZ analyser minutieusement les pièces jointes ci-dessus.
L'utilisateur vous demande l'instruction suivante : "${commandText}".
Vous DEVEZ exécuter L'INTÉGRALITÉ du traitement demandé directement dans votre réponse (analyse, révision, réponse aux clauses, rédaction de document, calculs, etc.). Ne redirigez pas l'utilisateur vers un autre onglet.
Si une création ou modification de document est demandée, renvoyez l'action CREATE_DOCUMENT avec le texte complet du document.
` : ''}

Si l'utilisateur demande explicitement de basculer vers un autre onglet du dashboard, ou de générer un document PDF, renvoyez un bloc action à la toute fin :
\`\`\`action
{
  "type": "SWITCH_TAB" | "SEARCH_LAWYER" | "PREFILL_APPOINTMENT" | "CREATE_DOCUMENT",
  "payload": { ... }
}
\`\`\`

S'il s'agit d'une création de document :
\`\`\`action
{
  "type": "CREATE_DOCUMENT",
  "payload": { 
    "title": "Titre du document rédigé",
    "content": "Texte formel et complet rédigé avec rigueur..."
  }
}
\`\`\`

INSTRUCTION DE L'UTILISATEUR : "${commandText}"
`;

    try {
      const chatHistory = [...history];
      const aiResponseResult = await chatWithAI(promptContext, chatHistory, true, i18n.language);
      
      const aiResponse = typeof aiResponseResult === 'string' ? aiResponseResult : aiResponseResult.text;
      const extractedWebSources = typeof aiResponseResult === 'string' ? [] : (aiResponseResult.sources_web || []);
      setWebSources(extractedWebSources);

      // Parse AI Action block if returned
      let cleanTextResponse = aiResponse;
      const actionMatch = aiResponse.match(/```action([\s\S]*?)```/);
      
      if (actionMatch) {
        try {
          let actionJson: Record<string, any> | null = null;
          const jsonRaw = actionMatch[1].trim();
          try {
            actionJson = JSON.parse(jsonRaw);
          } catch (e) {
            try {
              // Fallback to JS object evaluation to support date concatenations or trailing commas
              const parseFn = new Function(`return (${jsonRaw});`);
              actionJson = parseFn();
            } catch {
              throw e; // Throw the original JSON parse error if fallback also fails
            }
          }

          // Execute action callback (only switch tab if explicitly requested and no files attached)
          if (actionJson && actionJson.type) {
            if (actionJson.type !== 'SWITCH_TAB' || (attachedFiles.length === 0 && /^(va|ouvre|navigue|bascule)/i.test(commandText))) {
              onAction(actionJson);
            }
            if (actionJson.type === 'CREATE_DOCUMENT') {
              setGeneratedDoc({
                title: actionJson.payload.title || 'Document Juridique',
                content: actionJson.payload.content || ''
              });
            }
          }
          // Remove action block from screen & voice synthesis narration
          cleanTextResponse = aiResponse.replace(/```action([\s\S]*?)```/, '').trim();
        } catch (err) {
          console.error('Failed to parse voice action block:', err);
        }
      }

      // If local command handled the tab switch, make sure we emphasize it
      if (handledLocally && !cleanTextResponse.includes('onglet')) {
        cleanTextResponse = "Très bien, j'ai basculé sur l'onglet demandé. " + cleanTextResponse;
      }

      // Extract legal sources from response to show them cleanly in the glassmorphism window
      const extractedSources: string[] = [];
      const codeRegex = /(Article\s+\d+[\s\w-]*du\s+(Code\s+Civil|Code\s+Pénal|Code\s+du\s+Travail|Code\s+de\s+Commerce)|Directive\s+\d+\/\d+\/UE|Règlement\s+\(UE\)\s+n°\s+\d+\/\d+)/gi;
      let match;
      while ((match = codeRegex.exec(cleanTextResponse)) !== null) {
        if (!extractedSources.includes(match[0])) {
          extractedSources.push(match[0]);
        }
      }

      setResponse(cleanTextResponse);
      setSources(extractedSources);
      
      setHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: promptContext }] },
        { role: 'model', parts: [{ text: aiResponse }] }
      ]);

      // Speak response aloud
      speakText(cleanTextResponse);
      playChime(880, 'sine', 0.15); // "success" double-tone
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Impossible de joindre le serveur juridique.');
      setResponse("Désolé, j'ai rencontré un problème pour analyser votre requête juridique.");
      playChime(220, 'sawtooth', 0.2); // "error" warning tone
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isProcessing) {
      stopSpeaking();

      // Prime the speech synthesis engine for async playback
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          const silentUtterance = new SpeechSynthesisUtterance('');
          silentUtterance.volume = 0;
          window.speechSynthesis.speak(silentUtterance);
        } catch (e) {
          console.warn('Failed to prime speech synthesis:', e);
        }
      }

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const inputEl = form.elements.namedItem('manualCommand') as HTMLInputElement;

    const val = inputEl ? inputEl.value.trim() : '';

    if (val || attachedFiles.length > 0) {
      const commandToExecute = val || "Analysez et traitez l'ensemble des dossiers et pièces jointes fournis ci-dessus.";

      // Prime the speech synthesis engine for async playback
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          const silentUtterance = new SpeechSynthesisUtterance('');
          silentUtterance.volume = 0;
          window.speechSynthesis.speak(silentUtterance);
        } catch (e) {
          console.warn('Failed to prime speech synthesis:', e);
        }
      }

      setTranscript(commandToExecute);
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      handleVoiceCommand(commandToExecute);
      if (inputEl) inputEl.value = '';
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  return (
    <>
      {/* Premium Trigger Button */}
      {variant === 'fixed' ? (
        <button
          onClick={() => {
            setIsOpen(true);
            playChime(523.25, 'sine', 0.1);
          }}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-tr from-primary-900 via-primary-750 to-accent-600 hover:from-primary-800 hover:to-accent-500 text-white rounded-full p-4.5 shadow-2xl shadow-primary-900/30 flex items-center justify-center cursor-pointer border border-white/10 group transition-all duration-300 hover:scale-107 focus:outline-none"
          title="Ouvrir l'assistant juridique vocal"
        >
          <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
          <Mic className="h-6.5 w-6.5 group-hover:rotate-6 transition-transform duration-300" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2.5 whitespace-nowrap text-sm font-semibold transition-all duration-300">
            IA Vocale
          </span>
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(true);
            playChime(523.25, 'sine', 0.1);
          }}
          className="bg-gradient-to-r from-[#1e3a8a] to-[#701a75] hover:from-[#152e72] hover:to-[#5e1263] text-white border border-white/20 flex items-center justify-center font-semibold gap-2 transition-all duration-200 shadow-md cursor-pointer"
          title="Ouvrir l'assistant juridique vocal"
        >
          <Mic className="h-4 w-4 text-white animate-pulse shrink-0" />
          <span className="font-bold">IA Vocale</span>
        </Button>
      )}

      {/* Voice Assistant Glassmorphism Panel */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-[92vh] sm:h-[86vh] max-h-[96vh] sm:max-h-[88vh] bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl shadow-cyan-950/10 overflow-hidden flex flex-col animate-slide-up">
            
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-cyan-600 to-teal-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
                  <Sparkles className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                    <span>IA Vocale Law Just</span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-200 font-bold shrink-0">
                      En Direct
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                    Assistant Juridique &amp; Recherche Légifrance / UE par Gemini
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={toggleMute}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isMuted 
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                  title={isMuted ? "Activer le son" : "Désactiver le son"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4 sm:h-4.5 sm:w-4.5" /> : <Volume2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />}
                </button>
                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsOpen(false);
                    playChime(392, 'sine', 0.08);
                  }}
                  className="p-2 sm:p-2.5 bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all duration-200 cursor-pointer"
                  title="Fermer"
                >
                  <X className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </button>
              </div>
            </div>

            {/* Conversation Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 scrollbar-thin bg-slate-50/70"
            >
              {/* Informative Welcome */}
              {history.length === 0 && !transcript && (
                <div className="bg-white border border-cyan-200 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-sm text-slate-800">
                  <p className="text-slate-800 text-sm sm:text-base md:text-lg leading-relaxed font-semibold">
                    Bonjour ! Je suis votre Assistant Juridique Vocal France Justice. J'analyse vos pièces jointes, réponds à vos questions juridiques et exécute vos instructions en direct.
                  </p>
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[11px] sm:text-xs font-black text-cyan-700 uppercase tracking-wider">
                      Exemples d'instructions à dicter ou écrire :
                    </p>
                    <ul className="text-xs sm:text-sm md:text-base text-slate-700 space-y-2">
                      <li className="flex items-center gap-2.5 sm:gap-3 bg-slate-50 hover:bg-cyan-50/60 p-2.5 sm:p-3 rounded-xl border border-slate-200 cursor-pointer transition-colors shadow-xs" onClick={() => handleVoiceCommand("Affiche mes rendez-vous")}>
                        <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-cyan-600 shrink-0 font-bold" />
                        <span className="text-slate-800 font-semibold">"Affiche mes rendez-vous de la semaine"</span>
                      </li>
                      <li className="flex items-center gap-2.5 sm:gap-3 bg-slate-50 hover:bg-cyan-50/60 p-2.5 sm:p-3 rounded-xl border border-slate-200 cursor-pointer transition-colors shadow-xs" onClick={() => handleVoiceCommand("Qu'est ce que l'article 1240 du Code Civil ?")}>
                        <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-cyan-600 shrink-0 font-bold" />
                        <span className="text-slate-800 font-semibold">"Qu'est-ce que l'article 1240 du Code Civil ?"</span>
                      </li>
                      <li className="flex items-center gap-2.5 sm:gap-3 bg-slate-50 hover:bg-cyan-50/60 p-2.5 sm:p-3 rounded-xl border border-slate-200 cursor-pointer transition-colors shadow-xs" onClick={() => handleVoiceCommand("Explique-moi le RGPD européen en matière de données")}>
                        <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-cyan-600 shrink-0 font-bold" />
                        <span className="text-slate-800 font-semibold">"Quelles sont les obligations du RGPD européen ?"</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Transcript bubble (User input) */}
              {transcript && (
                <div className="flex items-start justify-end gap-2 sm:gap-3 animate-fade-in">
                  <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl rounded-tr-none px-4 sm:px-5 py-3 sm:py-4 max-w-[90%] sm:max-w-[85%] text-white text-xs sm:text-base md:text-lg shadow-sm">
                    <p className="font-extrabold text-[10px] sm:text-xs text-cyan-100 uppercase tracking-wider mb-1">Vous</p>
                    <p className="leading-relaxed text-white font-semibold">{transcript}</p>
                  </div>
                </div>
              )}

              {/* Response bubble (AI Reply) */}
              {response && (
                <div className="flex items-start gap-2 sm:gap-3 animate-fade-in">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 sm:p-6 max-w-[96%] sm:max-w-[92%] text-slate-800 text-xs sm:text-base md:text-lg shadow-sm space-y-3 sm:space-y-4">
                    <p className="font-black text-[11px] sm:text-xs md:text-sm text-cyan-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-cyan-600 animate-pulse shrink-0" />
                      Assistant Juridique Law Just
                    </p>
                    
                    <p className="leading-relaxed whitespace-pre-line text-slate-800 font-medium font-sans text-xs sm:text-base md:text-lg">{response}</p>

                    {/* Extracted references/sources badge display */}
                    {sources.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 sm:gap-2 items-center">
                        <span className="text-[11px] sm:text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5 mr-1">
                          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600" /> Textes détectés :
                        </span>
                        {sources.map((src, i) => (
                          <span 
                            key={i}
                            className="text-[10px] sm:text-xs bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 sm:py-1 rounded-full font-bold shadow-xs"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Real-time Google Search sources & articles display */}
                    {webSources && webSources.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-[11px] sm:text-xs font-black text-cyan-700 uppercase flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600 animate-pulse" /> Articles &amp; Jurisprudences (Google Search) :
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {webSources.slice(0, 4).map((source: any, i: number) => (
                            <a 
                              key={i}
                              href={source.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-2.5 bg-slate-50 hover:bg-cyan-50/60 border border-slate-200 hover:border-cyan-400 rounded-xl p-2.5 sm:p-3 transition-all group cursor-pointer shadow-xs text-slate-800"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="bg-cyan-100 text-cyan-700 border border-cyan-200 p-1.5 sm:p-2 rounded-lg group-hover:border-cyan-400 transition-colors shrink-0">
                                  <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600" />
                                </div>
                                <span className="text-xs sm:text-sm text-slate-800 font-bold line-clamp-1 group-hover:text-cyan-800 transition-colors">
                                  {source.title || "Source Juridique Officielle"}
                                </span>
                              </div>
                              <span className="text-[11px] sm:text-xs text-cyan-700 font-extrabold group-hover:underline flex items-center gap-0.5 whitespace-nowrap shrink-0">
                                Lire <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5" />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic PDF generation card widget */}
                    {generatedDoc && (
                      <div className="mt-3 sm:mt-4 bg-slate-50 border border-cyan-200 rounded-2xl p-3.5 sm:p-4.5 space-y-3 shadow-sm text-slate-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="bg-cyan-100 text-cyan-700 p-2.5 rounded-xl border border-cyan-200 shrink-0">
                              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-700" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="text-[10px] sm:text-xs font-black text-cyan-700 uppercase tracking-wide">Document PDF Prêt</h4>
                              <p className="text-xs sm:text-base text-slate-900 font-black line-clamp-1">{generatedDoc.title}</p>
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                            <Check className="h-3 w-3 text-emerald-600" /> Enregistré
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => downloadDocAsPDF(generatedDoc)}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm font-extrabold py-2 sm:py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Télécharger PDF
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPreviewDoc(generatedDoc)}
                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-bold py-2 sm:py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Aperçu
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error messages if any */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 sm:p-4 flex gap-2.5 sm:gap-3 text-red-800 text-xs sm:text-sm shadow-xs">
                  <AlertTriangle className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-red-600 shrink-0" />
                  <div className="space-y-1 min-w-0">
                    <p className="font-extrabold text-red-900">Une remarque est survenue</p>
                    <p className="font-semibold text-red-700">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Processing/Listening States */}
              {isListening && (
                <div className="flex flex-col items-center justify-center py-5 sm:py-6 gap-2.5 sm:gap-3 bg-cyan-50/80 rounded-2xl border border-cyan-200 shadow-sm text-cyan-900">
                  <div className="flex gap-1.5 items-center justify-center h-7 sm:h-8">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <div
                        key={bar}
                        className="w-1 sm:w-1.5 bg-cyan-600 rounded-full animate-wave"
                        style={{
                          animationDelay: `${bar * 0.15}s`,
                          height: '24px'
                        }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-xs sm:text-base text-cyan-800 animate-pulse font-bold">
                    Écoute en cours... Dites votre question juridique.
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3.5 px-3.5 sm:px-4 bg-white rounded-xl border border-slate-200 text-cyan-700 text-xs sm:text-sm font-bold shadow-xs">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 animate-spin shrink-0" />
                  <span>Recherche juridique et analyse en cours...</span>
                </div>
              )}

              {isSpeaking && (
                <div className="flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 px-3.5 sm:px-4 bg-white rounded-xl border border-cyan-200 text-cyan-700 text-xs sm:text-sm font-bold shadow-xs">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 animate-pulse shrink-0" />
                  <span className="truncate">Narration vocale...</span>
                  <button 
                    onClick={stopSpeaking}
                    className="ml-auto text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 cursor-pointer font-bold shrink-0"
                  >
                    Arrêter
                  </button>
                </div>
              )}
            </div>

            {/* Input Controls Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-100 space-y-2.5 sm:space-y-3 shrink-0">
              
              {/* Attachment Chip List - Compact Icon Only */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pb-1 border-b border-slate-100 max-h-16 overflow-y-auto">
                  <div className="flex items-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 shadow-xs" title={`${attachedFiles.length} fichier(s) joint(s)`}>
                    <Paperclip className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                    <span>{attachedFiles.length}</span>
                  </div>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg shadow-xs max-w-[140px] sm:max-w-[180px]">
                      <FileText className="h-3 w-3 text-cyan-600 shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachedFile(idx)}
                        className="text-slate-400 hover:text-red-500 transition-colors ml-0.5 p-0.5 shrink-0"
                        title="Supprimer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Speech recognition triggers & information */}
              <div className="flex items-center justify-center gap-3">
                {recognitionSupported ? (
                  <button
                    onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                    disabled={isProcessing}
                    className={`p-3.5 sm:p-4.5 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all duration-300 scale-100 hover:scale-105 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/30 border-2 border-white'
                        : 'bg-gradient-to-tr from-cyan-600 via-cyan-500 to-teal-500 text-white shadow-cyan-500/20 border-none font-bold'
                    }`}
                    title={isListening ? "Arrêter l'écoute" : "Démarrer l'écoute vocale"}
                  >
                    {isListening ? <MicOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Mic className="h-5 w-5 sm:h-6 sm:w-6" />}
                  </button>
                ) : (
                  <p className="text-[11px] sm:text-xs text-red-600 text-center font-semibold bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                    La reconnaissance vocale n'est pas supportée sur ce navigateur. Utilisez le clavier ci-dessous.
                  </p>
                )}
              </div>

              {/* Manual Keyboard input & Paperclip Attachment button */}
              <form onSubmit={handleManualSubmit} className="flex gap-1.5 sm:gap-2 items-center">
                <button 
                  type="button"
                  onClick={() => voiceFileInputRef.current?.click()}
                  className="p-2 sm:p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 shadow-xs"
                  title="Joindre un document ou dossier"
                >
                  <Paperclip className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  <input
                    ref={voiceFileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.json,.csv,.odt,.ods,.rtf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    className="hidden"
                  />
                </button>

                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    name="manualCommand"
                    placeholder={attachedFiles.length > 0 ? `Posez votre question sur les ${attachedFiles.length} document(s)...` : "Posez votre question juridique ici..."}
                    disabled={isProcessing}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-3 pr-7 py-2 sm:py-2.5 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50 font-medium"
                  />
                  <span className="absolute right-2 top-2.5 sm:top-3 text-slate-400 text-xs font-semibold flex items-center">
                    <CornerDownLeft className="h-3.5 w-3.5" />
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl cursor-pointer text-xs sm:text-sm font-black shadow-md shadow-cyan-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-1 sm:gap-1.5 shrink-0"
                >
                  <span>Envoyer</span>
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating preview modal for AI-generated document */}
      {previewDoc && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 flex flex-col max-h-[85vh] shadow-2xl shadow-cyan-900/10 animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-600" />
                {previewDoc.title}
              </h3>
              <button 
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-serif text-slate-800 text-sm leading-relaxed p-5 bg-slate-50 border border-slate-200 rounded-2xl scrollbar-thin">
              {previewDoc.content}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button 
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-4 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                Fermer
              </button>
              <button 
                type="button"
                onClick={() => {
                  downloadDocAsPDF(previewDoc);
                  setPreviewDoc(null);
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Imprimer / PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Styled Custom Waveform Animation CSS in style tag */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};
