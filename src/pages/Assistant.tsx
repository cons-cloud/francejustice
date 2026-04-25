import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Paperclip, Send, FileText, Sparkles, Download, Copy, Check, ChevronRight } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
import { AuthModal } from '../components/ui/AuthModal';
import { chatWithAI } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type ChatMessage = { id: string; role: 'user' | 'assistant' | 'system'; content: string; ts: number };

const AUTOSAVE_KEY = 'assistant_chat_draft_v1';

const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { toasts, success, error, removeToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [upload, setUpload] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [guided, setGuided] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick suggestions (litiges types)
  const suggestions = useMemo(
    () => [
      'Litige commercial: impayé client B2B',
      'Consommation: défaut de conformité e-commerce',
      'Travail: harcèlement moral en entreprise',
      'Famille: demande de pension alimentaire',
    ],
    []
  );

  // Guided steps
  const guideSteps = [
    'Décrivez brièvement le litige (dates, parties, contexte).',
    'Précisez les faits essentiels et les preuves disponibles.',
    'Indiquez le préjudice et l’objectif recherché.',
    'Ajoutez toute contrainte de délai connue (prescription).',
  ];

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem(AUTOSAVE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch {}
    }
  }, []);

  // Autosave every 2 minutes
  useEffect(() => {
    const t = setInterval(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(messages));
    }, 120000);
    return () => clearInterval(t);
  }, [messages]);

  const appendMessage = (role: ChatMessage['role'], content: string) => {
    const msg: ChatMessage = { id: Math.random().toString(36).slice(2), role, content, ts: Date.now() };
    setMessages(prev => [...prev, msg]);
    return msg;
  };


  const onSend = async () => {
    if (!input.trim() && !upload) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsSending(true);
    const userMessage = input.trim();
    const u = upload;
    if (u) setUpload(null);

    const newUserMsg = appendMessage('user', userMessage || (u ? `[Fichier: ${u.name}]` : ''));
    setInput('');

    try {
      // Map history to Gemini format
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const reply = await chatWithAI(userMessage, history);
      appendMessage('assistant', reply);

      // Save to Supabase
      if (user) {
        const { error: saveError } = await supabase
          .from('ai_conversations')
          .insert([
            {
              user_id: user.id,
              title: messages[0]?.content.slice(0, 40) || 'Nouvelle conversation',
              messages: [...messages, newUserMsg, { role: 'assistant', content: reply, ts: Date.now() }]
            }
          ]);
        if (saveError) console.error('Erreur sauvegarde IA:', saveError);
      }
    } catch (e: any) {
      error('Erreur IA', e.message || 'Le traitement a échoué.');
    } finally {
      setIsSending(false);
    }
  };

  const onUploadClick = () => fileInputRef.current?.click();
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setUpload(f);
  };

  const copyMessage = async (m: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 1200);
      success('Copié', 'Le contenu a été copié.');
    } catch {
      error('Impossible de copier');
    }
  };

  const exportConversation = (format: 'txt' | 'json') => {
    const filename = `conversation_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.${format}`;
    const data = format === 'json' ? JSON.stringify(messages, null, 2) : messages.map(m => `[${m.role}] ${m.content}`).join('\n\n');
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container py-6 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2 xl:col-span-3">
          <Card>
            <CardHeader className="flex-col items-center gap-2">
              <CardTitle className="text-center">Assistant IA — Rédaction de plaintes</CardTitle>
              <div className="flex items-center gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => exportConversation('txt')}><Download className="h-4 w-4 mr-2" />Export TXT</Button>
                <Button variant="outline" size="sm" onClick={() => exportConversation('json')}>Export JSON</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`${messages.length === 0 ? 'h-24 lg:h-28 xl:h-32' : 'h-[45vh] lg:h-[50vh] xl:h-[55vh]'} overflow-y-auto space-y-3 px-2 pt-1 pb-0 bg-secondary-50 rounded`}>
                {messages.length === 0 && (
                  <div className="text-secondary-600 text-sm">Commencez par décrire le litige ou utilisez une suggestion à droite.</div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-primary-50' : 'bg-white border'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-secondary-500">{m.role === 'user' ? 'Vous' : m.role === 'assistant' ? 'Assistant' : 'Système'}</div>
                      <Button variant="ghost" size="sm" onClick={() => copyMessage(m)}>
                        {copiedId === m.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="whitespace-pre-wrap text-secondary-900">{m.content}</div>
                  </div>
                ))}
              </div>

              <div className="mt-1 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Décrivez votre cas..." rows={6} className="min-h-40 lg:min-h-48 w-full" />
                </div>
                <div className="flex flex-col gap-2 w-36">
                  <Input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={onFileSelected} className="hidden" />
                  <Button variant="outline" onClick={onUploadClick}><Paperclip className="h-4 w-4 mr-2" />Joindre</Button>
                  <Button onClick={onSend} disabled={isSending}><Send className="h-4 w-4 mr-2" />{isSending ? 'Envoi...' : 'Envoyer'}</Button>
                </div>
              </div>
              {upload && (
                <div className="mt-2 text-sm text-secondary-600 flex items-center"><FileText className="h-4 w-4 mr-2" />{upload.name}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <div className="lg:col-span-1 xl:col-span-2 space-y-6 lg:sticky lg:top-24 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Suggestions rapides</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => setInput(prev => (prev ? prev + '\n' : '') + s)}><Sparkles className="h-4 w-4 mr-1" />{s}</Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Mode guidé</CardTitle>
              <div className="flex items-center gap-2">
                <label className="text-sm text-secondary-600">{guided ? 'Activé' : 'Désactivé'}</label>
                <input type="checkbox" checked={guided} onChange={e => setGuided(e.target.checked)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {guided && guideSteps.map((st, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-primary-600 mt-0.5" />
                  <span>{st}</span>
                </div>
              ))}
              {!guided && (
                <div className="text-sm text-secondary-600">Activez le mode guidé pour vous assister étape par étape.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default AssistantPage;


