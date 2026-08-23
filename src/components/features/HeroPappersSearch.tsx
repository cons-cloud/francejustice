import React, { useState } from 'react';
import { 
  Search, Sparkles, SlidersHorizontal, Scale, 
  FileCheck, ArrowRight, X, Copy, 
  Check, ChevronDown, Building2, ExternalLink,
  MapPin, Users, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FRENCH_LEGAL_DATABASE, generateDynamicLegalSearch, type LegalResource } from '../../data/frenchLegalDatabase';
import { searchPappersEntreprises } from '../../lib/pappersApi';
import { useTranslation } from '../../i18n';

type SearchTab = 'decisions' | 'ia_question' | 'codes' | 'conventions' | 'bofip_boss' | 'pappers_entreprises';

export const HeroPappersSearch: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SearchTab>('pappers_entreprises');
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

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const searchQuery = customQuery !== undefined ? customQuery : query;

    // If query is blank and no filters are applied, clear results completely
    if (!searchQuery.trim() && filterJurisdiction === 'all' && filterCategory === 'all' && !filterRef.trim()) {
      setSearchResults(null);
      setAiAnswer(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setAiAnswer(null);

    // ── 1. PAPPERS ENTREPRISES REAL-TIME SEARCH ──
    if (activeTab === 'pappers_entreprises' || /^\d{9,14}$/.test(searchQuery.trim())) {
      try {
        const pappersResults = await searchPappersEntreprises(searchQuery);
        if (pappersResults.length > 0) {
          setSearchResults(pappersResults);
          setAiAnswer(
            `🏢 **Droit & Justice des Entreprises, Salariés & Dirigeants (Base Pappers RNE & SIRENE)** :\n` +
            `• **Cadre juridique & Droits des salariés** : Informations d'immatriculation, conventions collectives et droit du travail applicables.\n` +
            `• Synchronisation en temps réel avec le Registre National des Entreprises pour **${pappersResults.length} entreprise(s) certifiée(s)** pour "${searchQuery.trim()}".\n` +
            `• Retrouvez les numéros SIREN, SIRET, dirigeants sociaux, capital social et extraits Kbis.`
          );
        } else {
          setSearchResults(null);
          setAiAnswer(null);
        }
      } catch (err) {
        console.error('Erreur lors de la recherche Pappers Entreprises:', err);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    // ── 2. LEGAL DATABASE SEARCH ──
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
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
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
      } else if (searchQuery.trim()) {
        const dynamicMatch = generateDynamicLegalSearch(searchQuery.trim(), activeTab);
        setSearchResults(dynamicMatch.results);
        setAiAnswer(dynamicMatch.aiSummary);
      } else {
        setSearchResults(FRENCH_LEGAL_DATABASE.slice(0, 4));
      }

      // AI Question generator logic
      if (activeTab === 'ia_question' || searchQuery.toLowerCase().includes('comment') || searchQuery.toLowerCase().includes('droit')) {
        const dynamicMatch = generateDynamicLegalSearch(searchQuery.trim() || 'Question juridique', activeTab);
        setAiAnswer(dynamicMatch.aiSummary);
      }

      setIsSearching(false);
    }, 300);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'pappers_entreprise':
        return { label: '🏢 Pappers Entreprise (RCS & RNE)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
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

  const quickPappersPresets = [
    { label: 'TotalEnergies', query: 'TotalEnergies' },
    { label: 'LVMH', query: 'LVMH' },
    { label: 'Sanofi', query: 'Sanofi' },
    { label: 'BNP Paribas', query: 'BNP Paribas' },
    { label: 'Société Générale', query: 'Société Générale' },
    { label: 'France Justice', query: 'France Justice' }
  ];

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
              <span>{t('search.domain_label', 'Domaine de Recherche :')}</span>
            </label>
            
            {/* Dropdown Menu List */}
            <div className="relative w-full sm:w-80">
              <select
                id="search-category-select"
                value={activeTab}
                onChange={(e) => {
                  const newTab = e.target.value as SearchTab;
                  setActiveTab(newTab);
                  setSearchResults(null);
                }}
                className="w-full bg-slate-950 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-indigo-500/60 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 appearance-none cursor-pointer shadow-xl transition-all pr-10"
              >
                <option value="pappers_entreprises" className="bg-slate-900 text-emerald-300 font-bold py-2">
                  {t('search.opt_pappers', '🏢 Justice & Droit des Entreprises, Salariés & Sociétés (Pappers RNE)')}
                </option>
                <option value="decisions" className="bg-slate-900 text-amber-300 font-bold py-2">
                  {t('search.opt_decisions', '⚖️ Décisions & Jurisprudence')}
                </option>
                <option value="ia_question" className="bg-slate-900 text-indigo-300 font-bold py-2">
                  {t('search.opt_ia', '✨ Question Juridique IA (GÉNIA-L)')}
                </option>
                <option value="codes" className="bg-slate-900 text-blue-300 font-bold py-2">
                  {t('search.opt_codes', '📜 Textes de Loi & Codes Officiels')}
                </option>
                <option value="conventions" className="bg-slate-900 text-emerald-300 font-bold py-2">
                  {t('search.opt_conventions', '🤝 Conventions Collectives (IDCC)')}
                </option>
                <option value="bofip_boss" className="bg-slate-900 text-cyan-300 font-bold py-2">
                  {t('search.opt_bofip', '💼 BOFiP, BOSS & Conventions Fiscales')}
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Indicator Badge */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-[11px] font-semibold text-slate-400">{t('search.official_base', 'Base officielle :')}</span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {activeTab === 'pappers_entreprises' && t('search.base_pappers', '🏢 Justice & Droit des Entreprises (Pappers RNE Temps Réel)')}
              {activeTab === 'decisions' && t('search.base_decisions', '⚖️ Jurisprudence Française')}
              {activeTab === 'ia_question' && t('search.base_ia', '✨ IA Juridique 2026')}
              {activeTab === 'codes' && t('search.base_codes', '📜 Legifrance Codes')}
              {activeTab === 'conventions' && t('search.base_conventions', '🤝 Conventions IDCC')}
              {activeTab === 'bofip_boss' && t('search.base_bofip', '💼 BOFiP & BOSS')}
            </span>
          </div>
        </div>

        {/* ── QUICK PRESETS FOR PAPPERS ENTREPRISES ── */}
        {activeTab === 'pappers_entreprises' && (
          <div className="flex flex-wrap items-center gap-2 mb-3 px-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" /> {t('search.popular_companies', 'Sociétés populaires :')}
            </span>
            {quickPappersPresets.map((p) => (
              <button
                key={p.query}
                type="button"
                onClick={() => {
                  setQuery(p.query);
                  handleSearch(undefined, p.query);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* ── MAIN SEARCH FORM ── */}
        <form onSubmit={(e) => handleSearch(e)} className="space-y-3">
          <div className="relative flex flex-col md:flex-row items-stretch gap-2 bg-slate-950/80 border border-slate-700/80 rounded-2xl p-2 focus-within:border-indigo-500 transition-all shadow-inner">
            
            <div className="flex-1 flex items-center px-3 py-1 gap-2.5">
              <Search className="w-5 h-5 text-indigo-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  // Automatic debounced live search for Pappers if >= 3 chars
                  if (activeTab === 'pappers_entreprises' && val.trim().length >= 3) {
                    handleSearch(undefined, val);
                  }
                }}
                placeholder={
                  activeTab === 'pappers_entreprises'
                    ? t('search.ph_pappers', 'Rechercher une entreprise, droit des salariés & dirigeants, SIREN, SIRET, RCS (ex: TotalEnergies, 808741870)...')
                    : activeTab === 'decisions' 
                    ? t('search.ph_decisions', 'Mot-clé, référence, arrêt, juridiction (ex: "Cour de cassation harcèlement", "22-18.405")...') 
                    : activeTab === 'ia_question'
                    ? t('search.ph_ia', 'Posez votre question en langage naturel (ex: "Quel est le préavis de démission pour un cadre Syntec ?")...')
                    : activeTab === 'codes'
                    ? t('search.ph_codes', 'Code civil, Code du travail, Article 1240, CGI...')
                    : activeTab === 'conventions'
                    ? t('search.ph_conventions', 'Nom d\'entreprise, IDCC 1486 (Syntec), HCR 1979, Bâtiment...')
                    : t('search.ph_bofip', 'BOFiP frais de déplacement, BOSS avantages en nature, Convention fiscale France-Maroc...')
                }
                className="w-full bg-transparent text-white placeholder:text-slate-400 text-sm sm:text-base outline-none font-medium"
              />
              {query && (
                <button 
                  type="button" 
                  onClick={() => {
                    setQuery('');
                    if (activeTab === 'pappers_entreprises') handleSearch(undefined, '');
                  }} 
                  className="text-slate-400 hover:text-white"
                >
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
                title={t('search.exact_title', 'Rechercher l\'expression exacte')}
              >
                <span>"..."</span>
                <span className="hidden sm:inline">{t('search.exact', 'Exacte')}</span>
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
                <span>{t('search.advanced_btn', 'Recherche avancée')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{t('search.btn_submit', 'Rechercher')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ── ADVANCED FILTERS DRAWER ── */}
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
                    Juridiction / Greffe RCS
                  </label>
                  <select
                    value={filterJurisdiction}
                    onChange={(e) => setFilterJurisdiction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="all">Tous les greffes & juridictions</option>
                    <option value="Greffe Paris">Greffe du Tribunal de Commerce de Paris</option>
                    <option value="Greffe Nanterre">Greffe de Nanterre (Hauts-de-Seine)</option>
                    <option value="Cour de cassation">Cour de cassation</option>
                    <option value="Conseil d'État">Conseil d'État</option>
                    <option value="Cour d'Appel">Cours d'Appel</option>
                    <option value="Prud'hommes">Conseil de Prud'hommes</option>
                  </select>
                </div>

                {/* Category filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Forme Juridique / Secteur
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="all">Toutes les formes</option>
                    <option value="affaires">Sociétés commerciales (SAS, SA, SARL)</option>
                    <option value="travail">Droit du travail & Prud'hommes</option>
                    <option value="fiscal">Droit fiscal & BOFiP</option>
                    <option value="civil">Droit civil & Obligations</option>
                    <option value="social">Droit social & BOSS</option>
                  </select>
                </div>

                {/* Period filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Année Immatriculation
                  </label>
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="all">Toutes les années</option>
                    <option value="2026">2026 (Immatriculations récentes)</option>
                    <option value="2024-2025">2024 - 2025</option>
                    <option value="2020-2023">2020 - 2023</option>
                    <option value="historique">Sociétés Historiques</option>
                  </select>
                </div>

                {/* Reference / SIREN Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    N° SIREN / SIRET / NAF
                  </label>
                  <input
                    type="text"
                    value={filterRef}
                    onChange={(e) => setFilterRef(e.target.value)}
                    placeholder="Ex: 808741870, 70.10Z..."
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 px-1 text-xs">
                <span className="text-slate-400">Base officielle synchronisée en temps réel avec Pappers.fr & le Registre National des Entreprises (RNE)</span>
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
                  <span>
                    {activeTab === 'pappers_entreprises' 
                      ? `Fiches Pappers Entreprises (${searchResults.length} résultat(s) certifié(s))` 
                      : `Résultats de la recherche (${searchResults.length} source(s) officielle(s))`}
                  </span>
                </h3>
                <button
                  onClick={() => setSearchResults(null)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              {/* AI Answer / Pappers Sync Banner */}
              {aiAnswer && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950/70 to-indigo-950 border border-emerald-500/40 text-emerald-100 text-xs sm:text-sm leading-relaxed space-y-2 shadow-lg">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                    <span className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sync Pappers Entreprises (Temps Réel)
                    </span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold">
                      Base RNE / SIRENE
                    </span>
                  </div>
                  <div className="whitespace-pre-line font-medium text-slate-200">{aiAnswer}</div>
                </div>
              )}

              {/* Results Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                {searchResults.map((res) => {
                  const badge = getTypeBadge(res.type);
                  const isPappers = res.type === 'pappers_entreprise';
                  const details = res.pappersDetails;

                  return (
                    <div
                      key={res.id}
                      className={`p-4 rounded-2xl bg-slate-950/90 border transition-all flex flex-col justify-between space-y-3 group ${
                        isPappers 
                          ? 'border-emerald-500/40 hover:border-emerald-400 shadow-md shadow-emerald-950/30' 
                          : 'border-slate-800 hover:border-indigo-500/60'
                      }`}
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

                        <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                          {isPappers && <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          <span className="line-clamp-2">{res.title}</span>
                        </h4>

                        {/* Extra Pappers enterprise details grid */}
                        {isPappers && details && (
                          <div className="grid grid-cols-2 gap-1.5 p-2.5 rounded-xl bg-slate-900/90 border border-emerald-900/50 text-[11px]">
                            <div>
                              <span className="text-slate-400">Forme : </span>
                              <span className="text-emerald-300 font-semibold">{details.formeJuridique}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Capital : </span>
                              <span className="text-amber-300 font-semibold">{details.capital || 'Variable'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400">Siège : </span>
                              <span className="text-slate-200 font-medium">{details.adresse}</span>
                            </div>
                            {details.dirigeants && details.dirigeants[0] && (
                              <div className="col-span-2">
                                <span className="text-slate-400">Dirigeant : </span>
                                <span className="text-indigo-300 font-semibold">{details.dirigeants[0].nom} ({details.dirigeants[0].qualite})</span>
                              </div>
                            )}
                          </div>
                        )}

                        {!isPappers && (
                          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-normal">
                            {res.summary}
                          </p>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-emerald-300 truncate max-w-[180px]">
                          {res.reference}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(details?.siren || res.reference, res.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Copier le SIREN / la référence"
                          >
                            {copiedId === res.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDoc(res)}
                            className="px-3 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          >
                            <span>Fiche Pappers</span>
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

      {/* ── FULL DOCUMENT & PAPPERS ENTERPRISE VIEW MODAL ── */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/40 text-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/80">
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getTypeBadge(selectedDoc.type).bg}`}>
                      {getTypeBadge(selectedDoc.type).label}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{selectedDoc.reference}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    {selectedDoc.type === 'pappers_entreprise' && <Building2 className="w-6 h-6 text-emerald-400" />}
                    <span>{selectedDoc.title}</span>
                  </h3>
                  {selectedDoc.jurisdiction && (
                    <p className="text-xs text-emerald-300 font-medium">{selectedDoc.jurisdiction}</p>
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
                
                {/* ── PAPPERS DETAILED DOSSIER VIEW ── */}
                {selectedDoc.pappersDetails ? (
                  <div className="space-y-6">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Forme Juridique</span>
                        <p className="text-xs font-bold text-emerald-300">{selectedDoc.pappersDetails.formeJuridique}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Capital Social</span>
                        <p className="text-xs font-bold text-amber-300">{selectedDoc.pappersDetails.capital || 'Non communiqué'}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Code NAF / APE</span>
                        <p className="text-xs font-bold text-indigo-300">{selectedDoc.pappersDetails.codeNaf} - {selectedDoc.pappersDetails.libelleNaf}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Statut RNE</span>
                        <p className="text-xs font-bold text-emerald-400">{selectedDoc.pappersDetails.statut}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chiffre d'Affaires</span>
                        <p className="text-xs font-bold text-cyan-300">{selectedDoc.pappersDetails.chiffreAffaires}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Effectifs Salariés</span>
                        <p className="text-xs font-bold text-purple-300">{selectedDoc.pappersDetails.effectifs}</p>
                      </div>
                    </div>

                    {/* Siège social Address */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="font-extrabold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400" /> Siège Social & Immatriculation
                      </h4>
                      <p className="text-xs text-slate-200 font-semibold">{selectedDoc.pappersDetails.adresse}</p>
                      <p className="text-xs text-slate-400">{selectedDoc.pappersDetails.rcs}</p>
                    </div>

                    {/* Dirigeants List */}
                    {selectedDoc.pappersDetails.dirigeants && selectedDoc.pappersDetails.dirigeants.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <h4 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-400" /> Dirigeants & Mandataires Sociaux
                        </h4>
                        <div className="space-y-1.5">
                          {selectedDoc.pappersDetails.dirigeants.map((d, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900 border border-slate-800">
                              <span className="font-bold text-white">{d.nom}</span>
                              <span className="text-indigo-300 font-semibold bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-800/40">
                                {d.qualite}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Complete Document text */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Synthèse Officielle Registre Pappers</h4>
                      <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-line border border-slate-800 leading-normal">
                        {selectedDoc.fullText}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedDoc.pappersDetails?.siren || selectedDoc.fullText, 'modal-full')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedId === 'modal-full' ? 'Copié !' : selectedDoc.pappersDetails ? 'Copier le SIREN' : 'Copier le texte'}</span>
                  </button>

                  {selectedDoc.pappersDetails?.pappersUrl && (
                    <a
                      href={selectedDoc.pappersDetails.pappersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Consulter sur Pappers.fr</span>
                    </a>
                  )}
                </div>

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
