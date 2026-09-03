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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              content: result.length > 15000 ? result.substring(0, 15000) + "\n...[Contenu du document tronqué pour l'IA]" : result,
              type: file.type || 'application/octet-stream'
            }
          ]);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = '';
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

  const recognitionRef = useRef<any>(null);
  const speechUttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      setRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = mapLangToSpeech(i18n.language);

      rec.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
        setTranscript(t('voice.listening', 'Écoute en cours...'));
        playChime(440, 'sine', 0.08); // Friendly "start" chime
      };

      rec.onerror = (e: any) => {
        console.error('Speech Recognition Error:', e);
        setIsListening(false);
        if (e.error === 'no-speech') {
          setErrorMsg(t('voice.no_speech', "Aucune parole n'a été détectée."));
        } else if (e.error === 'not-allowed') {
          setErrorMsg(t('voice.not_allowed', "Permission d'accès au micro refusée."));
        } else {
          setErrorMsg(t('voice.error', "Erreur lors de l'écoute."));
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        handleVoiceCommand(resultText);
      };

      recognitionRef.current = rec;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeTab, stateContext, i18n.language, t]);

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

  // Synthesize beautiful Web Audio API sound effects for activation chimes
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

    // Strip HTML and special markdown format for speech narration
    const cleanSpeechText = text
      .replace(/```[^`]*```/g, '') // Remove JSON/code action blocks
      .replace(/[*#`_-]/g, '') // Remove markdown formatting
      .replace(/\[\d+\]/g, '') // Remove references
      .trim();

    if (!cleanSpeechText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = mapLangToSpeech(i18n.language);
    const activeVoice = getVoiceForLang(i18n.language);
    if (activeVoice) {
      utterance.voice = activeVoice;
    }
    utterance.rate = 1.05; // Slightly faster to be responsive
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    speechUttRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Local rule-based command interpreter for rapid zero-latency reactions
  const interpretLocalCommand = (text: string): boolean => {
    const clean = text.toLowerCase().trim();

    // CRITICAL: If the user is asking an informational/legal question, let Gemini handle it
    // Only intercept clear navigation commands like "va dans", "ouvre", "montre", "affiche"
    const hasNavigationVerb = /(\bva\b|\bouvre\b|\baffiche\b|\bmontre\b|\bbascule\b|\bnavigue\b|\baller\b|\baller sur\b|\baller à\b|\baccède\b|\baccéder\b|\bmontre-moi l'onglet|\bnavigue vers|\bva sur|\bva à|\bouvre l'onglet|\baffiche l'onglet)/.test(clean);
    const isInformationalQuery = /(\bdonne|\bexpliq|\bqu'est|\bquelles?\b|\bcomment\b|\bpourquoi\b|\bc'est quoi|\bdéfini|\bdis-moi|\bparle|\binforme|\bdétaille|\bdécris|\brésume|\banalyse|\brecherche|\btrouves?-moi|\bjurisprudence|\barrêt|\bdécision|\bdroit\b|\beuropé|\bcour de justice|\bcjue|\bcedh|\bconventions?\b|\btraité|\bdirective|\brègle|\bqu'est-ce|\bdonnes?-moi|\bcite|\bquels? sont|\bquelle est)/.test(clean);

    // If it's clearly a question/research request (not just a navigation command), skip local routing
    if (isInformationalQuery && !hasNavigationVerb) {
      return false;
    }
    
    if (mode === 'citizen') {
      const citizenTabs: Record<string, string[]> = {
        overview: ['accueil', 'tableau', 'dashboard', 'principale', 'vue d\'ensemble'],
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
    setResponse('Analyse et recherche juridique en cours...');
    setSources([]);
    setGeneratedDoc(null); // Reset generated document on new command

    playChime(600, 'sine', 0.12); // "processing" chime

    // Instant local routing if matched
    const handledLocally = interpretLocalCommand(commandText);

    // Build advanced contextual prompts for Gemini to enable dynamic reads, writes, and modifications
    const availableTabs = mode === 'citizen' 
      ? ['overview', 'appointments', 'generator', 'documents', 'quotes', 'chat', 'searches', 'codes', 'procedures', 'analyse', 'formations', 'avocats', 'profile']
      : ['overview', 'appointments', 'cases', 'quotes', 'messages', 'searches', 'avocats', 'codes', 'procedures', 'analyse', 'formations', 'outils', 'assistance', 'profil'];

    const promptContext = `
Vous êtes l'assistant vocal ultra-intelligent et réactif de Law Just, la plateforme juridique française de pointe.
Vous avez un accès de lecture et modification total aux fonctionnalités du tableau de bord.
Le mode actuel du dashboard est: "${mode === 'citizen' ? 'Citoyen' : 'Avocat'}".
L'onglet actuellement actif sur l'écran de l'utilisateur est: "${activeTab}".
Les onglets disponibles pour ce mode sont: ${JSON.stringify(availableTabs)}.

Si l'utilisateur vous demande d'effectuer une action (ex: changer d'onglet, réserver un rdv, chercher un avocat, modifier des infos, rédiger un document/contrat/lettre/plainte/PDF), vous DEVEZ ajouter à la toute fin de votre réponse textuelle un bloc JSON d'action délimité de cette manière exacte (c'est indispensable pour modifier dynamiquement l'interface):
\`\`\`action
{
  "type": "SWITCH_TAB" | "SEARCH_LAWYER" | "PREFILL_APPOINTMENT" | "CREATE_DOCUMENT",
  "payload": { ... }
}
\`\`\`
Par exemple, s'il dit "Va dans mes documents", retournez :
\`\`\`action
{
  "type": "SWITCH_TAB",
  "payload": { "tab": "documents" }
}
\`\`\`

S'il dit "Rédige une plainte pour nuisance sonore" ou tout autre document juridique ou PDF à créer, rédigez le document entier de façon très rigoureuse et professionnelle, puis retournez :
\`\`\`action
{
  "type": "CREATE_DOCUMENT",
  "payload": { 
    "title": "Mise en demeure pour nuisances sonores",
    "content": "Contenu complet et formel rédigé avec rigueur..."
  }
}
\`\`\`

Contexte utilisateur et système en cours :
- Infos profil: ${JSON.stringify(stateContext?.profile || {})}
${mode === 'citizen' ? `
- Liste d'avocats disponibles: ${JSON.stringify((stateContext?.availableLawyers || []).map((l: any) => ({ id: l.id, name: `${l.first_name} ${l.last_name}`, specialty: l.specialty })))}
- Nombre de documents dans le coffre-fort: ${stateContext?.documents?.length || 0}
` : `
- Nombre de dossiers clients / documents gérés: ${stateContext?.cases?.length || 0}
- Nombre de devis émis: ${stateContext?.quotes?.length || 0}
`}
- Nombre de rendez-vous enregistrés: ${stateContext?.appointments?.length || 0}

Recherche en temps réel : Vous disposez d'un accès complet à Internet pour toutes les informations juridiques françaises (Code Civil, Code Pénal, droit du travail...) et européennes (Directives, Règlements, CJUE).
Répondez de manière structurée et professionnelle. Citez les lois applicables (par exemple: "Article 1240 du Code Civil") et donnez les sources ou liens vers Légifrance/Europa si nécessaire.

${attachedFiles.length > 0 ? `
=== PIÈCES JOINTES & DOSSIERS JURIDIQUES SOUMIS PAR L'UTILISATEUR ===
${attachedFiles.map((f, idx) => `--- Pièce [${idx + 1}]: ${f.name} ---\n${f.content}`).join('\n\n')}
` : ''}

ATTENTION: Puisque votre réponse sera énoncée oralement par synthèse vocale, gardez le texte général court, fluide et clair. Évitez les formules de code complexes en dehors du bloc \`\`\`action.

L'utilisateur vous dit (commande vocale ou écrite) : "${commandText}"
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
          let actionJson: any = null;
          const jsonRaw = actionMatch[1].trim();
          try {
            actionJson = JSON.parse(jsonRaw);
          } catch (e) {
            try {
              // Fallback to JS object evaluation to support date concatenations or trailing commas
              const parseFn = new Function(`return (${jsonRaw});`);
              actionJson = parseFn();
            } catch (e2) {
              throw e; // Throw the original JSON parse error if fallback also fails
            }
          }

          // Execute dynamic UI action callback
          if (actionJson && actionJson.type) {
            onAction(actionJson);
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
      
      // Update history in Gemini standard structure
      setHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: commandText }] },
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

  const toggleMute = () => {
    if (!isMuted) {
      stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputEl = e.currentTarget.elements.namedItem('manualCommand') as HTMLInputElement;
    if (inputEl && inputEl.value.trim()) {
      const val = inputEl.value;

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

      setTranscript(val);
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      handleVoiceCommand(val);
      inputEl.value = '';
    }
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-lg animate-fade-in">
          <div className="w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-indigo-500/30 rounded-3xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[88vh] animate-slide-up">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/30">
                  <Sparkles className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg tracking-tight flex items-center gap-2">
                    IA Vocale Law Just
                    <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-bold animate-pulse">
                      En Direct
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Assistant Juridique & Recherche Légifrance / UE par Gemini
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isMuted 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' 
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                  }`}
                  title={isMuted ? "Activer le son" : "Désactiver le son"}
                >
                  {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
                </button>
                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsOpen(false);
                    playChime(392, 'sine', 0.08);
                  }}
                  className="p-2.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 rounded-xl transition-all duration-200 cursor-pointer"
                  title="Fermer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Conversation Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin bg-slate-900/60"
            >
              {/* Informative Welcome */}
              {history.length === 0 && !transcript && (
                <div className="bg-slate-800/90 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-lg">
                  <p className="text-white text-sm sm:text-base leading-relaxed font-normal">
                    Bonjour ! Je suis votre Assistant Juridique Vocal. J'analyse vos pièces jointes, réponds à vos questions juridiques et exécute vos instructions en direct.
                  </p>
                  <div className="space-y-2.5 pt-1 border-t border-slate-700/60">
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Exemples d'instructions à dicter ou écrire :
                    </p>
                    <ul className="text-xs sm:text-sm text-slate-200 space-y-2">
                      <li className="flex items-center gap-2.5 bg-indigo-950/60 hover:bg-indigo-900/80 p-2.5 rounded-xl border border-indigo-500/30 cursor-pointer transition-colors shadow-sm" onClick={() => handleVoiceCommand("Affiche mes rendez-vous")}>
                        <ArrowRight className="h-4 w-4 text-purple-400 shrink-0" />
                        <span className="text-white font-medium">"Affiche mes rendez-vous de la semaine"</span>
                      </li>
                      <li className="flex items-center gap-2.5 bg-indigo-950/60 hover:bg-indigo-900/80 p-2.5 rounded-xl border border-indigo-500/30 cursor-pointer transition-colors shadow-sm" onClick={() => handleVoiceCommand("Qu'est ce que l'article 1240 du Code Civil ?")}>
                        <ArrowRight className="h-4 w-4 text-purple-400 shrink-0" />
                        <span className="text-white font-medium">"Qu'est-ce que l'article 1240 du Code Civil ?"</span>
                      </li>
                      <li className="flex items-center gap-2.5 bg-indigo-950/60 hover:bg-indigo-900/80 p-2.5 rounded-xl border border-indigo-500/30 cursor-pointer transition-colors shadow-sm" onClick={() => handleVoiceCommand("Explique-moi le RGPD européen en matière de données")}>
                        <ArrowRight className="h-4 w-4 text-purple-400 shrink-0" />
                        <span className="text-white font-medium">"Quelles sont les obligations du RGPD européen ?"</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Transcript bubble (User input) */}
              {transcript && (
                <div className="flex items-start justify-end gap-3 animate-fade-in">
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 border border-indigo-400/30 rounded-2xl rounded-tr-none px-4 py-3.5 max-w-[88%] text-white text-sm sm:text-base shadow-md">
                    <p className="font-bold text-[11px] text-indigo-200 uppercase tracking-wider mb-1">Vous</p>
                    <p className="leading-relaxed text-white font-medium">{transcript}</p>
                  </div>
                </div>
              )}

              {/* Response bubble (AI Reply) */}
              {response && (
                <div className="flex items-start gap-3 animate-fade-in">
                  <div className="bg-slate-800/95 border border-slate-700/80 rounded-2xl rounded-tl-none p-5 max-w-[92%] text-white text-sm sm:text-base shadow-xl space-y-3.5">
                    <p className="font-extrabold text-xs text-purple-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                      <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                      Assistant Juridique Law Just
                    </p>
                    
                    <p className="leading-relaxed whitespace-pre-line text-slate-100 font-sans">{response}</p>

                    {/* Extracted references/sources badge display */}
                    {sources.length > 0 && (
                      <div className="pt-3 border-t border-slate-700/60 flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1 mr-1">
                          <BookOpen className="h-3.5 w-3.5 text-purple-400" /> Textes détectés :
                        </span>
                        {sources.map((src, i) => (
                          <span 
                            key={i}
                            className="text-xs bg-indigo-950 text-indigo-200 border border-indigo-500/40 px-2.5 py-1 rounded-full font-semibold shadow-sm"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Real-time Google Search sources & articles display */}
                    {webSources && webSources.length > 0 && (
                      <div className="pt-3.5 border-t border-slate-700/60 space-y-2.5">
                        <span className="text-xs font-bold text-purple-300 uppercase flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" /> Articles & Jurisprudences (Google Search) :
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {webSources.slice(0, 4).map((source: any, i: number) => (
                            <a 
                              key={i}
                              href={source.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-3 bg-slate-900 hover:bg-slate-950 border border-slate-700 hover:border-purple-400 rounded-xl p-3 transition-all group cursor-pointer shadow-sm"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="bg-purple-950 border border-purple-500/40 p-2 rounded-lg group-hover:border-purple-400 transition-colors">
                                  <BookOpen className="h-4 w-4 text-purple-300" />
                                </div>
                                <span className="text-xs sm:text-sm text-white font-semibold line-clamp-1 group-hover:text-purple-200 transition-colors">
                                  {source.title || "Source Juridique Officielle"}
                                </span>
                              </div>
                              <span className="text-xs text-purple-300 font-bold group-hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                Lire <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic PDF generation card widget */}
                    {generatedDoc && (
                      <div className="mt-4 bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950 border border-purple-400/40 rounded-2xl p-4.5 space-y-3.5 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-500/20 p-3 rounded-xl border border-purple-400/30">
                              <FileText className="h-6 w-6 text-purple-300" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wide">Document PDF Prêt</h4>
                              <p className="text-sm text-white font-bold line-clamp-1">{generatedDoc.title}</p>
                            </div>
                          </div>
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                            <Check className="h-3 w-3" /> Enregistré
                          </span>
                        </div>
                        
                        <div className="flex gap-2.5">
                          <button 
                            type="button"
                            onClick={() => downloadDocAsPDF(generatedDoc)}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger PDF
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPreviewDoc(generatedDoc)}
                            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs sm:text-sm font-semibold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
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
                <div className="bg-red-950/80 border border-red-500/40 rounded-2xl p-4 flex gap-3 text-red-200 text-xs sm:text-sm shadow-md">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">Une remarque est survenue</p>
                    <p>{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Processing/Listening States */}
              {isListening && (
                <div className="flex flex-col items-center justify-center py-6 gap-3 bg-slate-950/60 rounded-2xl border border-indigo-500/20">
                  <div className="flex gap-1.5 items-center justify-center h-8">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <div
                        key={bar}
                        className="w-1.5 bg-purple-400 rounded-full animate-wave"
                        style={{
                          animationDelay: `${bar * 0.15}s`,
                          height: '28px'
                        }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-sm text-purple-300 animate-pulse font-bold">
                    Écoute en cours... Dites votre question juridique.
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-3 py-3 px-4 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold">
                  <Loader2 className="h-4.5 w-4.5 text-purple-400 animate-spin" />
                  <span>Recherche juridique et analyse en cours...</span>
                </div>
              )}

              {isSpeaking && (
                <div className="flex items-center gap-3 py-3 px-4 bg-indigo-950/80 rounded-xl border border-indigo-500/30 text-purple-300 text-xs sm:text-sm font-semibold">
                  <Activity className="h-4.5 w-4.5 text-purple-400 animate-pulse" />
                  <span>Narration vocale de la réponse...</span>
                  <button 
                    onClick={stopSpeaking}
                    className="ml-auto text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-200 hover:text-white cursor-pointer font-bold"
                  >
                    Arrêter
                  </button>
                </div>
              )}
            </div>

            {/* Input Controls Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              
              {/* Attachment Chip List */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1 w-full">
                    <Paperclip className="h-3.5 w-3.5 text-purple-400" /> {attachedFiles.length} Document(s) / Pièce(s) chargée(s) :
                  </span>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-indigo-950 border border-indigo-400/40 text-white text-xs px-3 py-1.5 rounded-xl shadow-sm">
                      <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                      <span className="line-clamp-1 max-w-[170px] font-semibold">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachedFile(idx)}
                        className="text-slate-400 hover:text-red-400 transition-colors ml-1 p-0.5"
                        title="Supprimer la pièce jointe"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Speech recognition triggers & information */}
              <div className="flex items-center justify-center gap-4">
                {recognitionSupported ? (
                  <button
                    onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                    disabled={isProcessing}
                    className={`p-4 sm:p-5 rounded-full shadow-xl flex items-center justify-center cursor-pointer transition-all duration-300 scale-100 hover:scale-105 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/30 border-2 border-white'
                        : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-indigo-500/30 border border-white/20'
                    }`}
                    title={isListening ? "Arrêter l'écoute" : "Démarrer l'écoute vocale"}
                  >
                    {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                ) : (
                  <p className="text-xs text-red-300 text-center font-semibold bg-red-950/60 border border-red-500/30 px-3.5 py-2 rounded-xl">
                    La reconnaissance vocale n'est pas supportée sur ce navigateur. Utilisez le clavier ci-dessous.
                  </p>
                )}
              </div>

              {/* Manual Keyboard input & Paperclip Attachment button */}
              <form onSubmit={handleManualSubmit} className="flex gap-2 items-center">
                <label 
                  className="p-2.5 sm:p-3 bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-purple-200 border border-slate-700 hover:border-purple-400/50 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 shadow-sm"
                  title="Ajouter des pièces jointes / dossiers juridiques (PDF, TXT, images)"
                >
                  <Paperclip className="h-5 w-5" />
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="relative flex-1">
                  <input
                    type="text"
                    name="manualCommand"
                    placeholder={attachedFiles.length > 0 ? `Posez votre question sur les ${attachedFiles.length} document(s)...` : "Posez votre question juridique ici..."}
                    disabled={isProcessing}
                    className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2.5 sm:py-3 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all disabled:opacity-50 font-medium"
                  />
                  <span className="absolute right-2.5 top-3 sm:top-3.5 text-slate-400 text-xs font-semibold flex items-center gap-1">
                    <CornerDownLeft className="h-3.5 w-3.5" />
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 text-white border border-purple-400/40 px-4 py-2.5 sm:py-3 rounded-xl cursor-pointer text-xs sm:text-sm font-bold shadow-md shadow-indigo-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <span>Envoyer</span>
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating preview modal for AI-generated document */}
      {previewDoc && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-secondary-700/50 rounded-2xl max-w-2xl w-full p-6 flex flex-col max-h-[85vh] shadow-2xl animate-slide-up backdrop-blur-lg">
            <div className="flex items-center justify-between pb-4 border-b border-secondary-700/50 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-400" />
                {previewDoc.title}
              </h3>
              <button 
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-secondary-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-serif text-white text-sm leading-relaxed p-5 bg-[#1a2236] border border-secondary-700/40 rounded-xl scrollbar-thin">
              {previewDoc.content}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <button 
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors border border-white/5 cursor-pointer"
              >
                Fermer
              </button>
              <button 
                type="button"
                onClick={() => {
                  downloadDocAsPDF(previewDoc);
                  setPreviewDoc(null);
                }}
                className="bg-accent-600 hover:bg-accent-500 text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
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
