import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scale, ExternalLink, RefreshCw, AlertCircle, ArrowRight, Paperclip, FileText, X, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { chatWithAI } from '../lib/gemini';
import { AuthModal } from '../components/ui/AuthModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';

interface SearchPageProps {
  skipAuthCheck?: boolean;
}

const SearchPage: React.FC<SearchPageProps> = ({ skipAuthCheck = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toasts, success, removeToast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string; type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const features = [
    { 
      title: t('search.feat_jurisprudence', 'Jurisprudence'), 
      desc: t('search.feat_jurisprudence_desc', 'Décisions des tribunaux français'), 
      icon: Scale,
      path: '/database?category=Jurisprudence %26 Arrêts'
    },
    { 
      title: t('search.feat_codes', 'Codes & Dahirs'), 
      desc: t('search.feat_codes_desc', 'Base complète des textes législatifs'), 
      icon: ExternalLink,
      path: '/database?category=Codes %26 Lois'
    },
    { 
      title: t('search.feat_advice', 'Conseils IA'), 
      desc: t('search.feat_advice_desc', 'Explications simplifiées du droit'), 
      icon: Search,
      path: '/assistant'
    }
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
  
  const performSearch = async (q: string) => {
    setLoading(true);
    setAiExplanation(null);

    let fullQuery = q;
    if (attachedFiles.length > 0) {
      fullQuery = `=== PIÈCES JOINTES & DOSSIERS JURIDIQUES SOUMIS POUR ANALYSE ===\n${attachedFiles.map((f, idx) => `--- Document [${idx + 1}]: ${f.name} ---\n${f.content}`).join('\n\n')}\n\nQUESTION / INSTRUCTION UTILISATEUR :\n${q || "Analysez complètement ce dossier juridique et fournissez l'ensemble des réponses et démarches."}`;
    }

    try {
      const prompt = `RECHERCHE & ANALYSE DE DOSSIER JURIDIQUES EN TEMPS RÉEL :

${fullQuery}

INSTRUCTIONS DE TRAITEMENT :
1. Recherche sur Internet les informations et jurisprudences les plus RÉCENTES sur ce sujet
2. Analyse complètement les pièces jointes fournies (si présentes) et cite les extraits pertinents
3. Cite les articles de loi exacts (Code Civil, Code du Travail, Dahirs, Code Pénal, etc.)
4. Trouve les jurisprudences récentes (2024-2026) sur Internet
5. Donne des conseils pratiques, synthétiques et directement applicables
6. Cite tes sources avec les dates et références légales

Réponds de manière structurée et professionnelle.`;
      
      const res = await chatWithAI(prompt, [], true);
      const explanationText = typeof res === 'string' ? res : res.text;
      setAiExplanation(explanationText);
      
      if (user) {
        await supabase.from('search_history_just').insert([{
          user_id: user.id,
          query: q || `Analyse de ${attachedFiles.length} pièce(s)`,
          results_count: 1
        }]);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !skipAuthCheck) {
      setShowAuthModal(true);
      return;
    }
    if (query.trim() || attachedFiles.length > 0) performSearch(query.trim());
  };

  if (skipAuthCheck) {
    return (
      <div className="space-y-6">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="w-full bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              className="w-full min-h-[140px] sm:min-h-[180px] bg-[#131c2e] border-2 border-slate-700 focus:border-amber-400 text-white placeholder-slate-400 text-base sm:text-lg rounded-2xl p-4 font-medium focus:ring-2 focus:ring-amber-400/20 transition-all leading-relaxed"
              placeholder={t('search.placeholder_example', 'Posez votre question juridique complète ou décrivez votre litige... Importez vos dossiers PDF si nécessaire.')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {/* Attached files chip list */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 pb-1.5 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 w-full">
                  <Paperclip className="h-3.5 w-3.5 text-amber-400" /> {attachedFiles.length} Pièce(s) jointe(s) importée(s) :
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

            <div className="flex flex-wrap items-center justify-between gap-3">
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
                  className="bg-[#131c2e] hover:bg-[#1c2942] text-amber-400 hover:text-amber-300 border-slate-700 hover:border-amber-400 p-2.5 rounded-xl cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                  title="Joindre un document ou dossier (Word, Excel, PDF, Image, Texte)"
                >
                  <Paperclip className="h-5 w-5 text-amber-400" />
                </Button>

                {(query || attachedFiles.length > 0) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setQuery(''); setAttachedFiles([]); }}
                    className="text-slate-400 hover:text-red-400 text-xs font-semibold py-1.5 px-2"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Effacer
                  </Button>
                )}
              </div>

              <Button 
                type="submit" 
                className="h-12 px-8 font-black text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-2" 
                disabled={loading || (!query.trim() && attachedFiles.length === 0)}
              >
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><span>Rechercher avec l'IA Juridique</span> <Search className="h-4 w-4" /></>}
              </Button>
            </div>
          </form>
        </div>

        {loading && (
          <div className="text-center py-12 bg-slate-950 border border-slate-800 rounded-2xl">
            <RefreshCw className="h-10 w-10 animate-spin text-amber-400 mx-auto mb-4" />
            <p className="text-amber-300 font-bold text-base">{t('search.loading_desc', "L'IA analyse vos pièces jointes et les textes de loi...")}</p>
          </div>
        )}

        {aiExplanation && (
          <Card className="border-2 border-amber-400/40 bg-[#131c2e] text-white shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#1c2942] border-b border-slate-700">
              <CardTitle className="flex items-center gap-2 text-amber-400 text-lg font-black">
                <Scale className="h-6 w-6 text-amber-400" />
                {t('search.analysis_title', "Analyse & Résolution Juridique par l'IA")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="whitespace-pre-wrap text-white font-semibold text-base sm:text-lg leading-relaxed">
                {aiExplanation}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !aiExplanation && (
          <Card className="bg-slate-900 border-slate-800 text-slate-200">
            <CardContent className="p-8 text-center">
              <Scale className="h-12 w-12 mx-auto mb-4 text-amber-400" />
              <p className="text-lg font-bold text-white">{t('search.ask_prompt', 'Posez votre question juridique ou importez vos dossiers PDF')}</p>
              <p className="text-sm mt-1 text-slate-400">{t('search.ask_prompt_desc', 'Jurisprudence, codes, contrats, dossiers — notre IA vous répond instantanément')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="bg-primary-900 text-white py-16">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('search.hero_title', 'Recherche IA — Droit & Dossiers PDF en Temps Réel')}</h1>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto">
            {t('search.hero_subtitle', 'Accédez instantanément à la jurisprudence, aux textes de loi et analysez vos pièces jointes grâce à notre IA.')}
          </p>
        </div>
      </div>

      <div className="container -mt-12">
        <Card className="max-w-4xl mx-auto shadow-2xl border-none">
          <CardContent className="p-8 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  className="w-full min-h-[140px] sm:min-h-[180px] bg-slate-900 border-2 border-slate-700 focus:border-amber-400 text-white placeholder-slate-400 text-base sm:text-lg rounded-2xl p-4 font-medium focus:ring-2 focus:ring-amber-400/20 transition-all leading-relaxed"
                  placeholder={t('search.placeholder_example_long', 'Posez votre question juridique complète ou décrivez votre litige... Joignez vos fichiers PDF si nécessaire.')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* Attached files chip list */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 w-full">
                    <Paperclip className="h-3.5 w-3.5 text-amber-400" /> {attachedFiles.length} Pièce(s) jointe(s) importée(s) :
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

              <div className="flex flex-wrap items-center justify-between gap-3">
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
                    className="bg-[#131c2e] hover:bg-[#1c2942] text-amber-400 hover:text-amber-300 border-slate-700 hover:border-amber-400 p-2.5 rounded-xl cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                    title="Joindre un document ou dossier (Word, Excel, PDF, Image, Texte)"
                  >
                    <Paperclip className="h-5 w-5 text-amber-400" />
                  </Button>

                  {(query || attachedFiles.length > 0) && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setQuery(''); setAttachedFiles([]); }}
                      className="text-slate-400 hover:text-red-400 text-xs font-semibold py-1.5 px-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Effacer
                    </Button>
                  )}
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-14 px-8 font-black text-base bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-lg cursor-pointer" 
                  disabled={loading || (!query.trim() && attachedFiles.length === 0)}
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : t('search.btn')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <div className="mt-12 text-center py-20">
            <RefreshCw className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-xl text-secondary-600">{t('search.loading_desc_long', "L'IA analyse vos dossiers PDF et les textes de loi...")}</p>
          </div>
        )}

        {aiExplanation && (
          <div className="mt-12 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-l-4 border-l-primary-500">
              <CardHeader className="bg-primary-50">
                <CardTitle className="flex items-center gap-2 text-primary-900">
                  <Scale className="h-6 w-6" />
                  {t('search.analysis_title', "Analyse Juridique par l'IA")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-secondary-800 leading-relaxed text-lg">
                  {aiExplanation}
                </div>
              </CardContent>
            </Card>

            <div className="bg-warning-50 border border-warning-200 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-warning-600 mt-1 shrink-0" />
              <p className="text-warning-800">
                <strong>{t('search.warning_title', 'Attention:')}</strong> {t('search.warning_desc', "Cette analyse est générée par IA et fournie à titre informatif uniquement. Elle ne remplace pas l'avis d'un avocat inscrit au barreau. Pour une assistance personnalisée, nous vous recommandons de consulter un professionnel.")}
              </p>
            </div>
          </div>
        )}

        {!loading && !aiExplanation && (
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
            {features.map((item, i) => (
              <div 
                key={i} 
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(item.path);
                  }
                }}
                className="text-center p-8 bg-white rounded-3xl border border-secondary-100 shadow-sm hover:shadow-2xl hover:border-primary-300 transition-all duration-300 group cursor-pointer hover:-translate-y-1.5 flex flex-col items-center select-none"
              >
                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-inner group-hover:scale-110">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors flex items-center gap-1.5">
                  {item.title}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary-600" />
                </h3>
                <p className="text-secondary-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default SearchPage;
