import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scale, ExternalLink, RefreshCw, AlertCircle, ArrowRight, Paperclip, FileText, X, Trash2, Sparkles, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { chatWithAI, type LegalAISource, type LegalAutomation } from '../lib/gemini';
import { AuthModal } from '../components/ui/AuthModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
import { parseMultipleFiles } from '../lib/documentParser';

interface SearchPageProps {
  skipAuthCheck?: boolean;
}

const LegalAIResultsView: React.FC<{
  explanation: string;
  sources: LegalAISource[];
  suggestions: string[];
  automations: LegalAutomation[];
  loading: boolean;
  onTriggerAction: (prompt: string) => void;
  t: (key: string, fallback: string) => string;
}> = ({ explanation, sources, suggestions, automations, loading, onTriggerAction, t }) => {
  return (
    <div className="space-y-6">
      <Card className="border border-cyan-200 bg-white text-slate-900 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardHeader className="bg-cyan-50/80 border-b border-cyan-100 py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-cyan-950 text-lg sm:text-xl font-black">
            <Scale className="h-6 w-6 text-cyan-600 shrink-0" />
            {t('search.analysis_title', "Analyse & Résolution Juridique par l'IA")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Main Legal Diagnostic & Analysis */}
          <div className="whitespace-pre-wrap text-slate-800 font-normal text-base sm:text-lg leading-relaxed">
            {explanation}
          </div>

          {/* Actionable Automations Widget */}
          {automations && automations.length > 0 && (
            <div className="pt-5 border-t border-slate-200 space-y-3">
              <span className="text-xs sm:text-sm font-black text-cyan-950 uppercase flex items-center gap-2 tracking-wide">
                <Sparkles className="h-4 w-4 text-cyan-600 animate-pulse shrink-0" />
                Automatisations &amp; Actions Recommandées :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {automations.map((auto, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onTriggerAction(auto.actionPrompt)}
                    disabled={loading}
                    className="text-left bg-gradient-to-br from-cyan-50/90 to-white hover:from-cyan-100 hover:to-cyan-50 border border-cyan-200 hover:border-cyan-400 p-3.5 rounded-2xl transition-all shadow-xs cursor-pointer group flex flex-col justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs sm:text-sm font-black text-cyan-950 group-hover:text-cyan-800 transition-colors block">
                        {auto.label}
                      </span>
                      <p className="text-xs text-slate-600 leading-snug line-clamp-2 mt-1">
                        {auto.description}
                      </p>
                    </div>
                    <span className="text-xs font-black text-cyan-700 flex items-center gap-1 group-hover:underline pt-1">
                      ⚡ Déclencher en 1 clic <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Suggestions Chips */}
          {suggestions && suggestions.length > 0 && (
            <div className="pt-5 border-t border-slate-200 space-y-2.5">
              <span className="text-xs sm:text-sm font-black text-slate-800 uppercase flex items-center gap-2 tracking-wide">
                <ChevronRight className="h-4 w-4 text-cyan-600 shrink-0" />
                Suggestions de Poursuite Personnalisées :
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onTriggerAction(sug)}
                    disabled={loading}
                    className="text-xs sm:text-sm bg-slate-100 hover:bg-cyan-50 text-slate-800 hover:text-cyan-900 border border-slate-200 hover:border-cyan-300 py-1.5 px-3.5 rounded-full font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 text-left"
                  >
                    <span>{sug}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Official State Sites & External Professional Portals */}
          {sources && sources.length > 0 && (
            <div className="pt-5 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyan-600 shrink-0" />
                  Portails &amp; Sites Officiels Recommandés :
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {sources.length} sources vérifiées
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {sources.map((source, i) => {
                  const isOfficial = source.category === 'officiel' || source.category === 'juridiction';
                  return (
                    <a 
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 hover:bg-cyan-50/70 border border-slate-200 hover:border-cyan-300 rounded-2xl p-3.5 transition-all group cursor-pointer shadow-2xs text-slate-900"
                    >
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${isOfficial ? 'bg-emerald-100 border border-emerald-200 text-emerald-800' : 'bg-cyan-100 border border-cyan-200 text-cyan-800'}`}>
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className={`text-2xs font-black px-2 py-0.5 rounded-full border ${isOfficial ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200'}`}>
                              {source.badge || (isOfficial ? "🏛️ Site Officiel de l'État" : "🌐 Portail Métier")}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-900 font-bold line-clamp-1 group-hover:text-cyan-800 transition-colors">
                              {source.title || "Portail Juridique Officiel"}
                            </span>
                          </div>
                          {source.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {source.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-cyan-700 font-black group-hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 self-end sm:self-center">
                        Accéder au site officiel <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-amber-900 text-xs sm:text-sm leading-relaxed">
          <strong>{t('search.warning_title', 'Attention:')}</strong> {t('search.warning_desc', "Cette analyse est générée par IA et fournie à titre informatif uniquement. Elle ne remplace pas l'avis d'un avocat inscrit au barreau. Pour une assistance personnalisée, nous vous recommandons de consulter un professionnel.")}
        </p>
      </div>
    </div>
  );
};

const SearchPage: React.FC<SearchPageProps> = ({ skipAuthCheck = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toasts, success, removeToast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<LegalAISource[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiAutomations, setAiAutomations] = useState<LegalAutomation[]>([]);
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
      title: t('search.feat_codes', 'Codes & Lois'), 
      desc: t('search.feat_codes_desc', 'Base complète des textes législatifs'), 
      icon: ExternalLink,
      path: '/database?category=Codes %26 Lois'
    },
    { 
      title: t('search.feat_advice', 'Conseils IA'), 
      desc: t('search.feat_advice_desc', 'Explications simplifiées du droit'), 
      icon: Search,
      path: '/genia-l'
    }
  ];

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
      success(t('common.success', 'Succès'), `${parsed.length} document(s) importé(s) pour la recherche.`);
    } catch (err) {
      console.warn("Erreur lecture fichiers search:", err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  
  const performSearch = async (q: string) => {
    setLoading(true);
    setAiExplanation(null);
    setAiSources([]);
    setAiSuggestions([]);
    setAiAutomations([]);

    let fullQuery = q;
    if (attachedFiles.length > 0) {
      fullQuery = `=== PIÈCES JOINTES & DOSSIERS JURIDIQUES SOUMIS POUR ANALYSE ===\n${attachedFiles.map((f, idx) => `--- Document [${idx + 1}]: ${f.name} ---\n${f.content}`).join('\n\n')}\n\nQUESTION / INSTRUCTION UTILISATEUR :\n${q || "Analysez complètement ce dossier juridique et fournissez l'ensemble des réponses et démarches."}`;
    }

    try {
      const prompt = `RECHERCHE & ANALYSE DE DOSSIER JURIDIQUES EN TEMPS RÉEL :

${fullQuery}

INSTRUCTIONS DE TRAITEMENT :
1. Analyse personnalisée et approfondie sans réponse générique ni passe-partout.
2. Identifie précisément les parties, les dates clés, les montants en euros (€), la juridiction compétente.
3. Analyse complète des pièces jointes (si présentes) avec citation textuelle et qualification juridique des faits.
4. Indique clairement les points forts, les risques majeurs et la faisabilité procédurale.
5. Cite les articles de loi exacts (Code Civil, Code du Travail, Code Pénal, etc.) et jurisprudences récentes.
6. Donne des initiatives concrètes immédiates (actions sous 24h-48h, mise en demeure avec pénalités, saisine).
7. Propose les portails et démarches officielles de l'État (service-public.fr, legifrance.gouv.fr, etc.).

Réponds de manière structurée, personnalisée et directement opérationnelle.`;
      
      const res = await chatWithAI(prompt, [], true);
      const explanationText = typeof res === 'string' ? res : res.text;
      const webSources: LegalAISource[] = typeof res === 'string' ? [] : (res.sources_web || []);
      const suggestions: string[] = typeof res === 'string' ? [] : (res.suggestions || []);
      const automations: LegalAutomation[] = typeof res === 'string' ? [] : (res.automations || []);

      setAiExplanation(explanationText);
      setAiSources(webSources);
      setAiSuggestions(suggestions);
      setAiAutomations(automations);
      
      if (user) {
        await supabase.from('search_history_just').insert([{
          user_id: user.id,
          query: q || `Analyse de ${attachedFiles.length} pièce(s)`,
          results_count: 1
        }]);
      }
    } catch (e: unknown) {
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

  const handleClear = () => {
    setQuery('');
    setAttachedFiles([]);
    setAiExplanation(null);
    setAiSources([]);
    setAiSuggestions([]);
    setAiAutomations([]);
  };

  if (skipAuthCheck) {
    return (
      <div className="space-y-6">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              className="w-full min-h-[140px] sm:min-h-[180px] bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 text-slate-900 placeholder-slate-400 text-base sm:text-lg rounded-2xl p-4 font-medium focus:ring-2 focus:ring-cyan-500/20 transition-all leading-relaxed"
              placeholder={t('search.placeholder_example', 'Posez votre question juridique complète ou décrivez votre litige... Importez vos dossiers PDF si nécessaire.')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {/* Attached files chip list */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 pb-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider flex items-center gap-1 w-full">
                  <Paperclip className="h-3.5 w-3.5 text-cyan-600" /> {attachedFiles.length} Pièce(s) jointe(s) importée(s) :
                </span>
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs px-2.5 py-1 rounded-xl shadow-xs">
                    <FileText className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                    <span className="line-clamp-1 max-w-[150px] font-semibold">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachedFile(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors ml-1 p-0.5"
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
                  className="bg-slate-50 hover:bg-slate-100 text-cyan-700 hover:text-cyan-800 border-slate-200 hover:border-cyan-400 p-2.5 rounded-xl cursor-pointer shadow-xs flex items-center justify-center shrink-0"
                  title="Joindre un document ou dossier (Word, Excel, PDF, Image, Texte)"
                >
                  <Paperclip className="h-5 w-5 text-cyan-600" />
                </Button>

                {(query || attachedFiles.length > 0) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClear}
                    className="text-slate-400 hover:text-rose-600 text-xs font-semibold py-1.5 px-2"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Effacer
                  </Button>
                )}
              </div>

              <Button 
                type="submit" 
                className="h-12 px-8 font-black text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md shadow-cyan-600/20 cursor-pointer flex items-center gap-2 transition-colors" 
                disabled={loading || (!query.trim() && attachedFiles.length === 0)}
              >
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><span>Rechercher avec l'IA Juridique</span> <Search className="h-4 w-4" /></>}
              </Button>
            </div>
          </form>
        </div>

        {loading && (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <RefreshCw className="h-10 w-10 animate-spin text-cyan-600 mx-auto mb-4" />
            <p className="text-cyan-800 font-bold text-base">{t('search.loading_desc', "L'IA analyse vos pièces jointes et les textes de loi...")}</p>
          </div>
        )}

        {aiExplanation && (
          <LegalAIResultsView
            explanation={aiExplanation}
            sources={aiSources}
            suggestions={aiSuggestions}
            automations={aiAutomations}
            loading={loading}
            onTriggerAction={(prompt: string) => performSearch(prompt)}
            t={t}
          />
        )}

        {!loading && !aiExplanation && (
          <Card className="bg-white border-slate-200 text-slate-700 shadow-xs">
            <CardContent className="p-8 text-center">
              <Scale className="h-12 w-12 mx-auto mb-4 text-cyan-600" />
              <p className="text-lg font-bold text-slate-900">{t('search.ask_prompt', 'Posez votre question juridique ou importez vos dossiers PDF')}</p>
              <p className="text-sm mt-1 text-slate-500">{t('search.ask_prompt_desc', 'Jurisprudence, codes, contrats, dossiers — notre IA vous répond instantanément')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Light Hero Header */}
      <div className="bg-gradient-to-b from-cyan-50/80 via-white to-slate-50 text-slate-900 pt-16 pb-20 border-b border-slate-200/80">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100/70 text-cyan-800 font-bold text-xs tracking-wide uppercase mb-4 border border-cyan-200">
            <Scale className="h-3.5 w-3.5 text-cyan-600" /> Moteur IA Juridique France
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-slate-900">
            {t('search.hero_title', 'Recherche IA — Droit & Dossiers PDF en Temps Réel')}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('search.hero_subtitle', 'Accédez instantanément à la jurisprudence, aux textes de loi et analysez vos pièces jointes grâce à notre IA.')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        <Card className="max-w-4xl mx-auto shadow-xl border border-slate-200 bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  className="w-full min-h-[140px] sm:min-h-[180px] bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 text-slate-900 placeholder-slate-400 text-base sm:text-lg rounded-2xl p-4 font-medium focus:ring-2 focus:ring-cyan-500/20 transition-all leading-relaxed"
                  placeholder={t('search.placeholder_example_long', 'Posez votre question juridique complète ou décrivez votre litige... Joignez vos fichiers PDF si nécessaire.')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* Attached files chip list */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider flex items-center gap-1 w-full">
                    <Paperclip className="h-3.5 w-3.5 text-cyan-600" /> {attachedFiles.length} Pièce(s) jointe(s) importée(s) :
                  </span>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs px-2.5 py-1 rounded-xl shadow-xs">
                      <FileText className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                      <span className="line-clamp-1 max-w-[150px] font-semibold">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachedFile(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors ml-1 p-0.5"
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
                    className="bg-slate-50 hover:bg-slate-100 text-cyan-700 hover:text-cyan-800 border-slate-200 hover:border-cyan-400 p-2.5 rounded-xl cursor-pointer shadow-xs flex items-center justify-center shrink-0"
                    title="Joindre un document ou dossier (Word, Excel, PDF, Image, Texte)"
                  >
                    <Paperclip className="h-5 w-5 text-cyan-600" />
                  </Button>

                  {(query || attachedFiles.length > 0) && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClear}
                      className="text-slate-400 hover:text-rose-600 text-xs font-semibold py-1.5 px-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Effacer
                    </Button>
                  )}
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-14 px-8 font-black text-base bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md shadow-cyan-600/20 cursor-pointer transition-colors" 
                  disabled={loading || (!query.trim() && attachedFiles.length === 0)}
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : t('search.btn', 'Lancer la recherche juridique')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <div className="mt-12 text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-4xl mx-auto">
            <RefreshCw className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
            <p className="text-xl font-bold text-slate-800">{t('search.loading_desc_long', "L'IA analyse vos dossiers PDF et les textes de loi...")}</p>
          </div>
        )}

        {aiExplanation && (
          <div className="mt-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <LegalAIResultsView
              explanation={aiExplanation}
              sources={aiSources}
              suggestions={aiSuggestions}
              automations={aiAutomations}
              loading={loading}
              onTriggerAction={(prompt: string) => performSearch(prompt)}
              t={t}
            />
          </div>
        )}

        {!loading && !aiExplanation && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pb-20 max-w-5xl mx-auto">
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
                className="text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-cyan-400 transition-all duration-300 group cursor-pointer hover:-translate-y-1.5 flex flex-col items-center select-none"
              >
                <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300 shadow-inner group-hover:scale-110">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-cyan-700 transition-colors flex items-center gap-1.5">
                  {item.title}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-cyan-600" />
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
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

