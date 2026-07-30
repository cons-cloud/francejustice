import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Sparkles, Scale, Mic, MicOff, Volume2, VolumeX, 
  Copy, Check, Maximize2, Minimize2, ExternalLink, RefreshCw, User, ShieldCheck, 
  BookOpen, Video, FileText, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { smartGlobalLegalAssistantQuery } from '../../lib/gemini';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  lawyers?: any[];
  courses?: any[];
  news?: any[];
  reviews?: any[];
}

export const FloatingChatBot: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "👋 **Bonjour ! Je suis l'Assistant IA en direct de FranceJustice.**\n\nJe suis connecté en temps réel aux **Codes de lois officiels**, à la **Jurisprudence Légifrance**, à notre **Annuaire d'Avocats & Enseignants**, et à l'ensemble de la base de données juridiques.\n\n*Comment puis-je vous aider aujourd'hui ?*",
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Speech Recognition (Speech to text)
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Send query
  const handleSend = async (queryText?: string) => {
    const promptToSend = queryText || input;
    if (!promptToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await smartGlobalLegalAssistantQuery(promptToSend, profile?.role || 'public');
      
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date(),
        lawyers: response.lawyers,
        courses: response.courses,
        news: response.news,
        reviews: response.reviews
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: "⚠️ Une petite interruption est survenue. Veuillez poser à nouveau votre question ou parcourir nos rubriques directes.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Action Prompts
  const quickPrompts = [
    { label: "⚖️ Chercher un Avocat / Professeur", query: "Je cherche un avocat ou un professeur de droit spécialisé" },
    { label: "📄 Rédiger une plainte / un acte", query: "Comment générer un document juridique ou un contrat ?" },
    { label: "💼 Calcul de licenciement & Droit du travail", query: "Quels sont mes droits en cas de licenciement ou rupture de contrat ?" },
    { label: "🎓 Formations visio à venir", query: "Quelles sont les prochaines formations juridiques en visioconférence ?" },
    { label: "🔬 Revues scientifiques & Thèses", query: "Où trouver les revues scientifiques juridiques publiées ?" }
  ];

  return (
    <>
      {/* Floating Action Trigger Button (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="hidden md:flex items-center gap-2 bg-slate-900/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full border border-indigo-500/40 shadow-xl backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>IA Juridique Direct 24/7</span>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Assistant IA FranceJustice"
          className="relative group bg-gradient-to-r from-indigo-600 via-indigo-700 to-primary-700 text-white p-4 rounded-full shadow-2xl hover:shadow-indigo-500/50 flex items-center justify-center transition-all border border-indigo-400/40"
        >
          {/* Pulsating glow ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-40 group-hover:opacity-75 blur-md transition duration-300"></span>
          
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="h-7 w-7 text-white" />
            ) : (
              <div className="relative">
                <MessageSquare className="h-7 w-7 text-white" />
                <Sparkles className="h-4 w-4 text-amber-300 absolute -top-1.5 -right-1.5 animate-bounce" />
              </div>
            )}
          </div>
        </motion.button>
      </div>

      {/* Floating Chat Modal / Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`fixed z-50 transition-all ${
              isExpanded 
                ? 'inset-4 md:inset-10 rounded-3xl' 
                : 'bottom-24 right-4 md:right-6 w-[92vw] sm:w-[420px] md:w-[460px] h-[650px] max-h-[85vh] rounded-3xl'
            } bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden`}
          >
            {/* Header Bar */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl text-indigo-400">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      FranceJustice IA
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    </h3>
                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      100% Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Codes de lois, Légifrance & Annuaire connecté
                  </p>
                </div>
              </div>

              {/* Action Tools */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  title={isExpanded ? "Réduire la fenêtre" : "Agrandir la fenêtre"}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  title="Fermer le chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Suggestions Bar */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto flex gap-2 no-scrollbar">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp.query)}
                  disabled={loading}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-700/50 transition-all shadow-sm hover:scale-[1.02] flex items-center gap-1"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-primary-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-900 border border-slate-700/80 text-slate-100 rounded-tl-none shadow-lg'
                    }`}
                  >
                    {/* Header line for assistant */}
                    {m.sender === 'assistant' && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                          Source Officielle & IA Légifrance
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => speakText(m.text)}
                            className="hover:text-amber-400 transition-colors p-1"
                            title="Écouter la réponse vocale"
                          >
                            {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-amber-400" /> : <Volume2 className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(m.id, m.text)}
                            className="hover:text-emerald-400 transition-colors p-1"
                            title="Copier la réponse"
                          >
                            {copiedId === m.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Formatted Content */}
                    <div className="whitespace-pre-wrap font-sans text-slate-100">
                      {m.text}
                    </div>

                    {/* Related Lawyers Cards if fetched */}
                    {m.lawyers && m.lawyers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                        <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          <User className="h-3 w-3" /> Experts trouvés sur la plateforme :
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {m.lawyers.map((l: any) => (
                            <div 
                              key={l.id} 
                              onClick={() => { setIsOpen(false); navigate('/lawyers'); }}
                              className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between"
                            >
                              <div>
                                <span className="text-xs font-black text-white">{l.first_name} {l.last_name}</span>
                                <span className="text-[10px] text-indigo-400 block">{l.role === 'lawyer' ? 'Avocat' : l.role === 'professor' ? 'Professeur' : 'Doctorant'} — {l.city || 'France'}</span>
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Courses Cards if fetched */}
                    {m.courses && m.courses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                        <p className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                          <Video className="h-3 w-3" /> Formations & Visioconférences à venir :
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {m.courses.map((c: any) => (
                            <div 
                              key={c.id}
                              onClick={() => { setIsOpen(false); navigate('/classrooms'); }}
                              className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between"
                            >
                              <div>
                                <span className="text-xs font-bold text-white">{c.title}</span>
                                <span className="text-[10px] text-slate-400 block">{c.category} • {new Date(c.date).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-[10px] opacity-60 text-right">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 rounded-tl-none flex items-center gap-3 text-xs text-slate-300">
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>Analyse des codes de lois & interrogation de l'IA en direct...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title={isListening ? "Arrêter la dictée" : "Parler à l'assistant"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Posez votre question juridique (ex: licenciement, bail, plainte, droit civil)..."
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-500 hover:to-primary-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md flex items-center justify-center shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500 font-medium">
                <span>⚡ Recherche en direct & Textes Légifrance</span>
                <span>Presser ↵ pour envoyer</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatBot;
