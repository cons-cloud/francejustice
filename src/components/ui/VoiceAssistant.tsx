import React, { useState, useEffect, useRef } from 'react';
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
  Download
} from 'lucide-react';
import { chatWithAI } from '../../lib/gemini';
import { Button } from './Button';

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

  // Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      setRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'fr-FR';

      rec.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
        setTranscript('Écoute en cours...');
        playChime(440, 'sine', 0.08); // Friendly "start" chime
      };

      rec.onerror = (e: any) => {
        console.error('Speech Recognition Error:', e);
        setIsListening(false);
        if (e.error === 'no-speech') {
          setErrorMsg("Aucune parole n'a été détectée.");
        } else if (e.error === 'not-allowed') {
          setErrorMsg("Permission d'accès au micro refusée.");
        } else {
          setErrorMsg("Erreur lors de l'écoute.");
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
  }, [mode, activeTab, stateContext]);

  // Handle auto-scroll in responses
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response, transcript, errorMsg]);

  // Synthesis voices setup
  const getFrenchVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    // Prefer Google French, Apple Thomas/Aurelie, or any fr-FR/fr voice
    return voices.find(v => v.lang.startsWith('fr-FR') && v.name.includes('Google')) ||
           voices.find(v => v.lang.startsWith('fr-FR')) ||
           voices.find(v => v.lang.startsWith('fr')) ||
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
    let cleanSpeechText = text
      .replace(/```[^`]*```/g, '') // Remove JSON/code action blocks
      .replace(/[*#`_\-]/g, '') // Remove markdown formatting
      .replace(/\[\d+\]/g, '') // Remove references
      .trim();

    if (!cleanSpeechText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'fr-FR';
    const frVoice = getFrenchVoice();
    if (frVoice) {
      utterance.voice = frVoice;
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

ATTENTION: Puisque votre réponse sera énoncée oralement par synthèse vocale, gardez le texte général court, fluide et clair. Évitez les formules de code complexes en dehors du bloc \`\`\`action.

L'utilisateur vous dit (commande vocale ou écrite) : "${commandText}"
`;

    try {
      const chatHistory = [...history];
      const aiResponseResult = await chatWithAI(promptContext, chatHistory, true);
      
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
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-gradient-to-b from-[#0f172a] to-[#080d16] border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            
            {/* Header */}
            <div className="px-6 py-4.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-tr from-primary-600 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Sparkles className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-1.5">
                    IA Vocale Law Just
                    <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 bg-accent-500/20 text-accent-400 rounded-full border border-accent-500/20 animate-pulse">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-secondary-300">
                    Accès direct aux législations FR et UE par Gemini
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    isMuted 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-white/5 text-secondary-300 hover:bg-white/10'
                  }`}
                  title={isMuted ? "Activer le son" : "Désactiver le son"}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsOpen(false);
                    playChime(392, 'sine', 0.08);
                  }}
                  className="p-2 bg-white/5 text-secondary-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Conversation Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin"
            >
              {/* Informative Welcome */}
              {history.length === 0 && !transcript && (
                <div className="bg-[#1a2236] border border-secondary-700/50 rounded-2xl p-5 space-y-4">
                  <p className="text-white/90 text-sm leading-relaxed">
                    Bonjour ! Je suis votre assistant juridique vocal. J'ai accès à l'ensemble de votre tableau de bord, ainsi qu'aux dernières bases juridiques françaises et européennes via Google Search.
                  </p>
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-secondary-300 uppercase tracking-wider">
                      Exemples d'instructions :
                    </p>
                    <ul className="text-xs text-white/80 space-y-2">
                      <li className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleVoiceCommand("Affiche mes rendez-vous")}>
                        <ArrowRight className="h-3 w-3 text-accent-400" />
                        <span className="text-white/80">"Va sur l'onglet rendez-vous"</span>
                      </li>
                      <li className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleVoiceCommand("Qu'est ce que l'article 1240 du Code Civil ?")}>
                        <ArrowRight className="h-3 w-3 text-accent-400" />
                        <span className="text-white/80">"Qu'est ce que l'article 1240 du Code Civil ?"</span>
                      </li>
                      <li className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleVoiceCommand("Explique-moi le RGPD européen en matière de données")}>
                        <ArrowRight className="h-3 w-3 text-accent-400" />
                        <span className="text-white/80">"Quelles sont les obligations du RGPD européen ?"</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Transcript bubble (User input) */}
              {transcript && (
                <div className="flex items-start justify-end gap-3 animate-fade-in">
                  <div className="bg-gradient-to-tr from-primary-700 to-primary-800 border border-primary-600/30 rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] text-white text-sm shadow-md">
                    <p className="font-semibold text-[10px] text-blue-200 uppercase tracking-wider mb-1">Vous</p>
                    <p className="leading-relaxed text-white">{transcript}</p>
                  </div>
                </div>
              )}

              {/* Response bubble (AI Reply) */}
              {response && (
                <div className="flex items-start gap-3 animate-fade-in">
                  <div className="bg-[#1a2236] border border-secondary-700/40 rounded-2xl rounded-tl-none p-5 max-w-[90%] text-white text-sm shadow-md space-y-3">
                    <p className="font-bold text-[10px] text-accent-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Assistant Juridique Law Just
                    </p>
                    
                    <p className="leading-relaxed whitespace-pre-line text-white/95">{response}</p>

                    {/* Extracted references/sources badge display */}
                    {sources.length > 0 && (
                      <div className="pt-3.5 border-t border-white/10 flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-semibold text-secondary-300 uppercase flex items-center gap-1 mr-1">
                          <BookOpen className="h-3 w-3" /> Sources détectées :
                        </span>
                        {sources.map((src, i) => (
                          <span 
                            key={i}
                            className="text-[10px] bg-secondary-700 text-white border border-secondary-600 px-2 py-0.5 rounded-full font-medium"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Real-time Google Search sources & articles display */}
                    {webSources && webSources.length > 0 && (
                      <div className="pt-3.5 border-t border-white/10 space-y-2.5">
                        <span className="text-[10px] font-bold text-accent-400 uppercase flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-accent-400 animate-pulse" /> Articles & Sources Web (Google Search) :
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {webSources.slice(0, 4).map((source: any, i: number) => (
                            <a 
                              key={i}
                              href={source.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-3 bg-[#1e293b] hover:bg-[#263348] border border-secondary-600/40 rounded-xl p-2.5 transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <div className="bg-secondary-700 border border-secondary-600 p-1.5 rounded-lg group-hover:border-accent-500/30 transition-colors">
                                  <BookOpen className="h-3.5 w-3.5 text-secondary-300 group-hover:text-accent-400" />
                                </div>
                                <span className="text-xs text-white font-medium line-clamp-1 group-hover:text-accent-200 transition-colors">
                                  {source.title || "Article Juridique"}
                                </span>
                              </div>
                              <span className="text-[10px] text-accent-400 font-medium group-hover:underline flex items-center gap-0.5 whitespace-nowrap shrink-0">
                                Lire <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic PDF generation card widget */}
                    {generatedDoc && (
                      <div className="mt-4 bg-gradient-to-br from-[#4a1254]/50 to-[#0f1d3a]/60 border border-accent-500/30 rounded-xl p-4.5 space-y-3 shadow-lg backdrop-blur-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="bg-accent-500/10 p-2.5 rounded-lg border border-accent-500/20">
                              <FileText className="h-5.5 w-5.5 text-accent-400" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-[10px] font-bold text-accent-400 uppercase tracking-wide">Document PDF Prêt</h4>
                              <p className="text-xs text-white font-medium line-clamp-1">{generatedDoc.title}</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" /> Enregistré
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => downloadDocAsPDF(generatedDoc)}
                            className="flex-1 bg-accent-600 hover:bg-accent-500 active:bg-accent-700 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Télécharger PDF
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPreviewDoc(generatedDoc)}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
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
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-200 text-xs">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-400 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">Une erreur est survenue</p>
                    <p>{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Processing/Listening States */}
              {isListening && (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="flex gap-1.5 items-center justify-center h-8">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <div
                        key={bar}
                        className="w-1 bg-accent-500 rounded-full animate-wave"
                        style={{
                          animationDelay: `${bar * 0.15}s`,
                          height: '24px'
                        }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-xs text-accent-400 animate-pulse font-medium">
                    Parlez maintenant, je vous écoute...
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-3 py-2 text-secondary-400 text-xs font-medium">
                  <Loader2 className="h-4.5 w-4.5 text-accent-500 animate-spin" />
                  <span>Recherche législative et analyse en cours...</span>
                </div>
              )}

              {isSpeaking && (
                <div className="flex items-center gap-3 py-2 text-accent-400 text-xs font-medium">
                  <Activity className="h-4.5 w-4.5 text-accent-400 animate-pulse" />
                  <span>Narration de la réponse juridique en cours...</span>
                  <button 
                    onClick={stopSpeaking}
                    className="ml-auto text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-secondary-300 hover:text-white cursor-pointer"
                  >
                    Arrêter la lecture
                  </button>
                </div>
              )}
            </div>

            {/* Input Controls Bar */}
            <div className="p-4 bg-[#0a0e17] border-t border-secondary-800 space-y-3">
              
              {/* Speech recognition triggers & information */}
              <div className="flex items-center justify-center gap-4">
                {recognitionSupported ? (
                  <button
                    onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                    disabled={isProcessing}
                    className={`p-5 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all duration-300 scale-100 hover:scale-105 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/20'
                        : 'bg-gradient-to-tr from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white shadow-accent-500/10'
                    }`}
                    title={isListening ? "Arrêter l'écoute" : "Démarrer l'écoute vocale"}
                  >
                    {isListening ? <MicOff className="h-6.5 w-6.5" /> : <Mic className="h-6.5 w-6.5" />}
                  </button>
                ) : (
                  <p className="text-xs text-red-400 text-center font-medium bg-red-500/10 border border-red-500/20 px-3.5 py-2 rounded-xl">
                    La reconnaissance vocale n'est pas supportée sur ce navigateur. Vous pouvez utiliser le clavier ci-dessous.
                  </p>
                )}
              </div>

              {/* Manual Keyboard input fallback (always elegant, fits any device/a11y) */}
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="manualCommand"
                    placeholder="Écrivez ou posez votre question juridique ici..."
                    disabled={isProcessing}
                    className="w-full bg-[#1b253b] border-2 border-[#334155] text-white placeholder-secondary-400 text-sm rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all disabled:opacity-50 font-medium"
                  />
                  <span className="absolute right-3.5 top-4 text-secondary-400 text-xs font-semibold flex items-center gap-1">
                    <CornerDownLeft className="h-3.5 w-3.5" />
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-accent-600 hover:bg-accent-500 active:bg-accent-700 text-white border-2 border-accent-500/40 px-6 py-3.5 rounded-xl cursor-pointer text-sm font-bold shadow-lg shadow-accent-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                >
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating preview modal for AI-generated document */}
      {previewDoc && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
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
        </div>
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
