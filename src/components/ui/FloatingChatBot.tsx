import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Sparkles, Scale, Mic, MicOff, Volume2, VolumeX, 
  Copy, Check, Maximize2, Minimize2, ExternalLink, RefreshCw, User, ShieldCheck, 
  Video, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { smartGlobalLegalAssistantQuery } from '../../lib/gemini';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';

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
  const { user: _user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  
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
      text: t('chatbot.welcome', "👋 **Bonjour ! Je suis l'Assistant IA en direct de FranceJustice.**\n\nJe suis connecté en temps réel aux **Codes de lois officiels**, à la **Jurisprudence Légifrance**, à notre **Annuaire d'Avocats & Enseignants**, et à l'ensemble de la base de données juridiques.\n\n*Comment puis-je vous aider aujourd'hui ?*"),
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
    recognition.lang = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'ar' ? 'ar-SA' : 'fr-FR';
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
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_-]/g, ''));
    utterance.lang = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'ar' ? 'ar-SA' : 'fr-FR';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
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
      const response = await smartGlobalLegalAssistantQuery(promptToSend, (profile as any)?.role || 'public', i18n.language);
      
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
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Assistant IA FranceJustice"
          className="relative group bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white p-4 rounded-full shadow-xl shadow-cyan-600/30 flex items-center justify-center transition-all border border-cyan-400/40 cursor-pointer"
        >
          {/* Pulsating glow ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 opacity-40 group-hover:opacity-75 blur-md transition duration-300"></span>
          
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="h-7 w-7 text-white" />
            ) : (
              <div className="relative">
                <MessageSquare className="h-7 w-7 text-white" />
                <Sparkles className="h-4 w-4 text-amber-200 absolute -top-1.5 -right-1.5 animate-bounce" />
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
            } bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden`}
          >
            {/* Header Bar */}
            <div className="p-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-2xl text-white">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      FranceJustice IA
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    </h3>
                    <span className="text-[10px] font-black bg-white/25 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                      100% Live
                    </span>
                  </div>
                  <p className="text-[11px] text-cyan-100 font-medium">
                    Codes de lois, Légifrance & Annuaire connecté
                  </p>
                </div>
              </div>

              {/* Action Tools */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  title={isExpanded ? "Réduire la fenêtre" : "Agrandir la fenêtre"}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  title="Fermer le chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Suggestions Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto flex gap-2 no-scrollbar">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp.query)}
                  disabled={loading}
                  className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-cyan-50 text-cyan-800 border border-cyan-200 transition-all shadow-2xs hover:scale-[1.02] flex items-center gap-1 cursor-pointer"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-tr-none shadow-md'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {/* Header line for assistant */}
                    {m.sender === 'assistant' && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1.5 text-cyan-700 font-bold">
                          <ShieldCheck className="h-3.5 w-3.5 text-cyan-600" />
                          Source Officielle & IA Légifrance
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => speakText(m.text)}
                            className="hover:text-cyan-600 transition-colors p-1 cursor-pointer"
                            title="Écouter la réponse vocale"
                          >
                            {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-cyan-600" /> : <Volume2 className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(m.id, m.text)}
                            className="hover:text-cyan-600 transition-colors p-1 cursor-pointer"
                            title="Copier le texte"
                          >
                            {copiedId === m.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap font-sans">
                      {m.text}
                    </div>

                    {/* Rich Embedded Cards for Lawyers */}
                    {m.lawyers && m.lawyers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                        <p className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1">
                          <User className="h-3 w-3" /> Avocats & Enseignants recommandés :
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {m.lawyers.map((l: any) => (
                            <div key={l.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs">Me {l.first_name} {l.last_name}</h4>
                                <p className="text-[10px] text-cyan-700 font-semibold">{l.specialty || 'Droit Général'}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate('/lawyers');
                                }}
                                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                              >
                                Réserver
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-2 text-xs text-slate-600">
                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-600" />
                    <span className="font-semibold">Recherche en temps réel dans les codes de lois...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200">
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
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title={isListening ? "Arrêter la dictée" : "Parler à l'assistant"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Posez votre question juridique (ex: licenciement, bail, plainte, droit civil)..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
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
