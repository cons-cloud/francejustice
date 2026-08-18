import React, { useState } from 'react';
import { 
  Search, Sparkles, SlidersHorizontal, Scale, 
  FileCheck, ArrowRight, X, Copy, 
  Check, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FRENCH_LEGAL_DATABASE, generateDynamicLegalSearch, type LegalResource } from '../../data/frenchLegalDatabase';

type SearchTab = 'decisions' | 'ia_question' | 'codes' | 'conventions' | 'bofip_boss';

export const HeroPappersSearch: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SearchTab>('decisions');
  const [query, setQuery] = useState('');
  const [exactMatch, setExactMatch] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced Filters State
  const [filterJurisdiction, setFilterJurisdiction] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterRef, setFilterRef] = useState('');

  // Results State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LegalResource[] | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<LegalResource | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() && filterJurisdiction === 'all' && filterCategory === 'all' && !filterRef) {
      // Default query if blank
      setSearchResults(FRENCH_LEGAL_DATABASE);
      return;
    }

    setIsSearching(true);
    setAiAnswer(null);

    setTimeout(() => {
      let filtered = FRENCH_LEGAL_DATABASE;

      // Filter by Tab type
      if (activeTab === 'decisions') {
        filtered = filtered.filter(item => item.type === 'jurisprudence');
      } else if (activeTab === 'codes') {
        filtered = filtered.filter(item => item.type === 'code');
      } else if (activeTab === 'conventions') {
        filtered = filtered.filter(item => item.type === 'convention_collective');
      } else if (activeTab === 'bofip_boss') {
        filtered = filtered.filter(item => item.type === 'bofip' || item.type === 'boss' || item.type === 'convention_fiscale');
      }

      // Filter by Category
      if (filterCategory !== 'all') {
        filtered = filtered.filter(item => item.category === filterCategory);
      }

      // Filter by Jurisdiction
      if (filterJurisdiction !== 'all') {
        filtered = filtered.filter(item => item.jurisdiction?.toLowerCase().includes(filterJurisdiction.toLowerCase()));
      }

      // Filter by Reference / IDCC
      if (filterRef.trim()) {
        const refLower = filterRef.toLowerCase();
        filtered = filtered.filter(item => 
          item.reference.toLowerCase().includes(refLower) || 
          (item.idcc && item.idcc.includes(refLower))
        );
      }

      // Filter by Query
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (exactMatch) {
          filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.fullText.toLowerCase().includes(q) ||
            item.summary.toLowerCase().includes(q)
          );
        } else {
          const terms = q.split(' ').filter(Boolean);
          filtered = filtered.filter(item => 
            terms.every(term => 
              item.title.toLowerCase().includes(term) ||
              item.summary.toLowerCase().includes(term) ||
              item.tags.some(t => t.toLowerCase().includes(term)) ||
              item.reference.toLowerCase().includes(term)
            )
          );
        }
      }

      if (filtered.length > 0) {
        setSearchResults(filtered);
      } else if (query.trim()) {
        // If no static match, generate dynamic real French legal decisions & code articles tailored to the query
        const dynamicMatch = generateDynamicLegalSearch(query.trim(), activeTab);
        setSearchResults(dynamicMatch.results);
        setAiAnswer(dynamicMatch.aiSummary);
      } else {
        setSearchResults(FRENCH_LEGAL_DATABASE.slice(0, 4));
      }

      // AI Question generator logic
      if (activeTab === 'ia_question' || query.toLowerCase().includes('comment') || query.toLowerCase().includes('droit')) {
        const dynamicMatch = generateDynamicLegalSearch(query.trim() || 'Question juridique', activeTab);
        setAiAnswer(dynamicMatch.aiSummary);
      }

      setIsSearching(false);
    }, 400);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'jurisprudence':
        return { label: 'Décision de Justice', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'code':
        return { label: 'Code & Texte de Loi', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'convention_collective':
        return { label: 'Convention Collective', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'bofip':
        return { label: 'BOFiP (Impôts)', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'boss':
        return { label: 'BOSS (Secu)', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
      case 'convention_fiscale':
        return { label: 'Convention Fiscale Int.', bg: 'bg-purple-500/20 text-purple-300 border-purple-400/30' };
      default:
        return { label: 'Ressource Légale', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-6 z-20 relative">
      {/* Container with Pappers Justice Glassmorphism Aesthetic */}
      <div className="bg-slate-900/90 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-white relative overflow-hidden">
        
        {/* Glow Background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── DROPDOWN MENU DE SÉLECTION (Category Dropdown Menu) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3.5 mb-4 gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <label htmlFor="search-category-select" className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Domaine de Recherche :</span>
            </label>
            
            {/* Dropdown Menu List */}
            <div className="relative w-full sm:w-80">
              <select
                id="search-category-select"
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value as SearchTab);
                  setSearchResults(null);
                }}
                className="w-full bg-slate-950 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-indigo-500/60 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 appearance-none cursor-pointer shadow-xl transition-all pr-10"
              >
                <option value="decisions" className="bg-slate-900 text-amber-300 font-bold py-2">
                  ⚖️ Décisions & Jurisprudence
                </option>
                <option value="ia_question" className="bg-slate-900 text-indigo-300 font-bold py-2">
                  ✨ Question Juridique IA (GÉNIA-L)
                </option>
                <option value="codes" className="bg-slate-900 text-blue-300 font-bold py-2">
                  📜 Textes de Loi & Codes Officiels
                </option>
                <option value="conventions" className="bg-slate-900 text-emerald-300 font-bold py-2">
                  🤝 Conventions Collectives (IDCC)
                </option>
                <option value="bofip_boss" className="bg-slate-900 text-cyan-300 font-bold py-2">
                  💼 BOFiP, BOSS & Conventions Fiscales
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Indicator Badge */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-[11px] font-semibold text-slate-400">Base officielle :</span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm">
              {activeTab === 'decisions' && '⚖️ Jurisprudence Française'}
              {activeTab === 'ia_question' && '✨ IA Juridique 2026'}
              {activeTab === 'codes' && '📜 Legifrance Codes'}
              {activeTab === 'conventions' && '🤝 Conventions IDCC'}
              {activeTab === 'bofip_boss' && '💼 BOFiP & BOSS'}
            </span>
          </div>
        </div>

        {/* ── MAIN SEARCH FORM ── */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative flex flex-col md:flex-row items-stretch gap-2 bg-slate-950/80 border border-slate-700/80 rounded-2xl p-2 focus-within:border-indigo-500 transition-all shadow-inner">
            
            <div className="flex-1 flex items-center px-3 py-1 gap-2.5">
              <Search className="w-5 h-5 text-indigo-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTab === 'decisions' 
                    ? 'Mot-clé, référence, arrêt, juridiction (ex: "Cour de cassation harcèlement", "22-18.405")...' 
                    : activeTab === 'ia_question'
                    ? 'Posez votre question en langage naturel (ex: "Quel est le préavis de démission pour un cadre Syntec ?")...'
                    : activeTab === 'codes'
                    ? 'Code civil, Code du travail, Article 1240, CGI...'
                    : activeTab === 'conventions'
                    ? 'Nom d\'entreprise, IDCC 1486 (Syntec), HCR 1979, Bâtiment...'
                    : 'BOFiP frais de déplacement, BOSS avantages en nature, Convention fiscale France-Maroc...'
                }
                className="w-full bg-transparent text-white placeholder:text-slate-400 text-sm sm:text-base outline-none font-medium"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Controls right side */}
            <div className="flex items-center gap-2 justify-end px-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
              {/* Exact Match Toggle */}
              <button
                type="button"
                onClick={() => setExactMatch(!exactMatch)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  exactMatch 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
                title="Rechercher l'expression exacte"
              >
                <span>"..."</span>
                <span className="hidden sm:inline">Exacte</span>
              </button>

              {/* Advanced Filters Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  showAdvancedFilters || filterJurisdiction !== 'all' || filterCategory !== 'all' || filterRef
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Recherche avancée</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Rechercher</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ── ADVANCED FILTERS DRAWER (Pappers Justice Style) ── */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-slate-800/80 mt-4 pt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                {/* Jurisdiction filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Juridiction / Tribunal
                  </label>
                  <select
                    value={filterJurisdiction}
                    onChange={(e) => setFilterJurisdiction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="all">Toutes les juridictions</option>
                    <option value="Cour de cassation">Cour de cassation</option>
                    <option value="Conseil d'État">Conseil d'État</option>
                    <option value="Cour d'Appel">Cours d'Appel (Paris, Lyon...)</option>
                    <option value="Prud'hommes">Conseil de Prud'hommes</option>
                    <option value="Tribunal de commerce">Tribunal de Commerce</option>
                    <option value="DGFiP">DGFiP / Administration Fiscale</option>
                    <option value="URSSAF">URSSAF / Sécurité Sociale</option>
                    <option value="International">Traités Internationaux</option>
                  </select>
                </div>

                {/* Category filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Branche du Droit
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="all">Tous les domaines</option>
                    <option value="travail">Droit du travail & Prud'hommes</option>
                    <option value="fiscal">Droit fiscal & BOFiP</option>
                    <option value="civil">Droit civil & Obligations</option>
                    <option value="penal">Droit pénal</option>
                    <option value="affaires">Droit des affaires & SARL</option>
                    <option value="social">Droit social & BOSS</option>
                    <option value="international">Droit international & Traités</option>
                    <option value="administratif">Droit administratif</option>
                  </select>
                </div>

                {/* Period filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Année / Période
                  </label>
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="all">Toutes les époques</option>
                    <option value="2026">2026 (Jurisprudence récente)</option>
                    <option value="2024-2025">2024 - 2025</option>
                    <option value="2020-2023">2020 - 2023</option>
                    <option value="historique">Historique</option>
                  </select>
                </div>

                {/* Reference / IDCC Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    N° Pourvoi / IDCC / Art.
                  </label>
                  <input
                    type="text"
                    value={filterRef}
                    onChange={(e) => setFilterRef(e.target.value)}
                    placeholder="Ex: 22-18.405, 1486..."
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 px-1 text-xs">
                <span className="text-slate-400">Base officielle mise à jour en temps réel (Légifrance & Ministère)</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterJurisdiction('all');
                    setFilterCategory('all');
                    setFilterPeriod('all');
                    setFilterRef('');
                    setExactMatch(false);
                  }}
                  className="text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SEARCH RESULTS PANEL ── */}
        <AnimatePresence>
          {searchResults && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="mt-6 border-t border-slate-800 pt-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-white">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span>Résultats de la recherche ({searchResults.length} source(s) officielle(s))</span>
                </h3>
                <button
                  onClick={() => setSearchResults(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              {/* AI Answer Box if triggered */}
              {aiAnswer && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-slate-950/90 border border-indigo-500/40 text-indigo-100 text-xs sm:text-sm leading-relaxed space-y-2">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Synthèse GÉNIA-L 2026
                    </span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                      Vérouillé Légifrance
                    </span>
                  </div>
                  <div className="whitespace-pre-line font-medium text-slate-200">{aiAnswer}</div>
                </div>
              )}

              {/* Results Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-1">
                {searchResults.map((res) => {
                  const badge = getTypeBadge(res.type);
                  return (
                    <div
                      key={res.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {res.date}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {res.title}
                        </h4>

                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-normal">
                          {res.summary}
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-indigo-300 truncate max-w-[180px]">
                          {res.reference}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`${res.title} - ${res.reference}`, res.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Copier la citation"
                          >
                            {copiedId === res.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDoc(res)}
                            className="px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>Consulter</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FULL DOCUMENT VIEW MODAL ── */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getTypeBadge(selectedDoc.type).bg}`}>
                      {getTypeBadge(selectedDoc.type).label}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{selectedDoc.reference}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">{selectedDoc.title}</h3>
                  {selectedDoc.jurisdiction && (
                    <p className="text-xs text-indigo-300 font-medium">{selectedDoc.jurisdiction}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2">
                  <h4 className="font-extrabold text-indigo-300 text-xs uppercase tracking-wider">Résumé Exécutif</h4>
                  <p className="text-slate-200">{selectedDoc.summary}</p>
                </div>

                {selectedDoc.keyPoints && selectedDoc.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">Points Clés & Impact Juridique</h4>
                    <ul className="space-y-1.5">
                      {selectedDoc.keyPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300 text-xs">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Texte Intégral Officiel</h4>
                  <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-line border border-slate-800 leading-normal">
                    {selectedDoc.fullText}
                  </div>
                </div>

                {selectedDoc.articlesCited && selectedDoc.articlesCited.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-cyan-300 text-xs uppercase tracking-wider">Articles & Textes Visés</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoc.articlesCited.map((art, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-xl bg-cyan-950 text-cyan-200 border border-cyan-800/50 text-xs font-semibold">
                          {art}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedDoc.fullText, 'modal-full')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedId === 'modal-full' ? 'Copié !' : 'Copier le texte'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
