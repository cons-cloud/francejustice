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
        return { label: '🏢 Pappers Entreprise (RCS & RNE)', bg: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'jurisprudence':
        return { label: 'Décision de Justice', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'code':
        return { label: 'Code & Texte de Loi', bg: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'convention_collective':
        return { label: 'Convention Collective', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'bofip':
        return { label: 'BOFiP (Impôts)', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'boss':
        return { label: 'BOSS (Secu)', bg: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'convention_fiscale':
        return { label: 'Convention Fiscale Int.', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      default:
        return { label: 'Ressource Légale', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
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
      {/* Container with Pappers Justice Aesthetic (Pure Light Mode) */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-[0_15px_40px_rgba(6,182,212,0.08)] text-slate-900 relative overflow-hidden">
        
        {/* Glow Background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />

        {/* ── DROPDOWN MENU DE SÉLECTION (Category Dropdown Menu) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3.5 mb-4 gap-3 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <label htmlFor="search-category-select" className="text-xs sm:text-sm font-extrabold text-cyan-800 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-600" />
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
                className="w-full bg-slate-50 text-slate-900 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-cyan-500/40 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 appearance-none cursor-pointer shadow-sm transition-all pr-10"
              >
                <option value="pappers_entreprises" className="bg-white text-slate-900 font-bold py-2">
                  {t('search.opt_pappers', '🏢 Justice & Droit des Entreprises, Salariés & Sociétés (Pappers RNE)')}
                </option>
                <option value="decisions" className="bg-white text-slate-900 font-bold py-2">
                  {t('search.opt_decisions', '⚖️ Décisions & Jurisprudence')}
                </option>
                <option value="ia_question" className="bg-white text-slate-900 font-bold py-2">
                  {t('search.opt_ia', '✨ Question Juridique IA (GÉNIA-L)')}
                </option>
                <option value="codes" className="bg-white text-slate-900 font-bold py-2">
                  {t('search.opt_codes', '📜 Textes de Loi & Codes Officiels')}
                </option>
                <option value="conventions" className="bg-white text-slate-900 font-bold py-2">
                  {t('search.opt_conventions', '🤝 Conventions Collectives (IDCC)')}
                </option>
                <option value="bofip_boss" className="bg-white text-slate-900 font-bold py-2">
                  {t('search.opt_bofip', '💼 BOFiP, BOSS & Conventions Fiscales')}
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-cyan-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Indicator Badge */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-[11px] font-semibold text-slate-500">{t('search.official_base', 'Base officielle :')}</span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600"></span>
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
          <div className="flex flex-wrap items-center gap-2 mb-3 px-1 relative z-10">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-cyan-600" /> {t('search.popular_companies', 'Sociétés populaires :')}
            </span>
            {quickPappersPresets.map((p) => (
              <button
                key={p.query}
                type="button"
                onClick={() => {
                  setQuery(p.query);
                  handleSearch(undefined, p.query);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-700 hover:text-cyan-800 text-xs font-semibold transition-all cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* ── MAIN SEARCH FORM ── */}
        <form onSubmit={(e) => handleSearch(e)} className="space-y-3 relative z-10">
          <div className="relative flex flex-col md:flex-row items-stretch gap-2 bg-slate-50/80 border border-slate-200/90 rounded-2xl p-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all shadow-inner">
            
            <div className="flex-1 flex items-center px-3 py-1 gap-2.5">
              <Search className="w-5 h-5 text-cyan-600 shrink-0" />
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
                className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm sm:text-base outline-none font-medium"
              />
              {query && (
                <button 
                  type="button" 
                  onClick={() => {
                    setQuery('');
                    if (activeTab === 'pappers_entreprises') handleSearch(undefined, '');
                  }} 
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Controls right side */}
            <div className="flex items-center gap-2 justify-end px-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
              {/* Exact Match Toggle */}
              <button
                type="button"
                onClick={() => setExactMatch(!exactMatch)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  exactMatch 
                    ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' 
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-300' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
                <span>{t('search.advanced_btn', 'Recherche avancée')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
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
              className="overflow-hidden border-t border-slate-200/80 mt-4 pt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* Jurisdiction filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Juridiction / Greffe RCS
                  </label>
                  <select
                    value={filterJurisdiction}
                    onChange={(e) => setFilterJurisdiction(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Forme Juridique / Secteur
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Année Immatriculation
                  </label>
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    N° SIREN / SIRET / NAF
                  </label>
                  <input
                    type="text"
                    value={filterRef}
                    onChange={(e) => setFilterRef(e.target.value)}
                    placeholder="Ex: 808741870, 70.10Z..."
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 px-1 text-xs">
                <span className="text-slate-500">Base officielle synchronisée en temps réel avec Pappers.fr & le Registre National des Entreprises (RNE)</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterJurisdiction('all');
                    setFilterCategory('all');
                    setFilterPeriod('all');
                    setFilterRef('');
                    setExactMatch(false);
                  }}
                  className="text-cyan-700 hover:underline font-semibold cursor-pointer"
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
              className="mt-6 border-t border-slate-200 pt-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-slate-900">
                  <FileCheck className="w-5 h-5 text-cyan-600" />
                  <span>
                    {activeTab === 'pappers_entreprises' 
                      ? `Fiches Pappers Entreprises (${searchResults.length} résultat(s) certifié(s))` 
                      : `Résultats de la recherche (${searchResults.length} source(s) officielle(s))`}
                  </span>
                </h3>
                <button
                  onClick={() => setSearchResults(null)}
                  className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              {/* AI Answer / Pappers Sync Banner */}
              {aiAnswer && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50 via-teal-50/70 to-sky-50 border border-cyan-200 text-slate-800 text-xs sm:text-sm leading-relaxed space-y-2 shadow-sm">
                  <div className="flex items-center justify-between border-b border-cyan-200/80 pb-2">
                    <span className="font-extrabold text-cyan-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-600" /> Sync Pappers Entreprises (Temps Réel)
                    </span>
                    <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-300 font-bold">
                      Base RNE / SIRENE
                    </span>
                  </div>
                  <div className="whitespace-pre-line font-medium text-slate-700">{aiAnswer}</div>
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
                      className={`p-4 rounded-2xl bg-white border transition-all flex flex-col justify-between space-y-3 group ${
                        isPappers 
                          ? 'border-cyan-200 hover:border-cyan-500 shadow-sm hover:shadow-md hover:shadow-cyan-500/10' 
                          : 'border-slate-200 hover:border-cyan-500 hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {res.date}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-cyan-700 transition-colors flex items-center gap-2">
                          {isPappers && <Building2 className="w-4 h-4 text-cyan-600 shrink-0" />}
                          <span className="line-clamp-2">{res.title}</span>
                        </h4>

                        {/* Extra Pappers enterprise details grid */}
                        {isPappers && details && (
                          <div className="grid grid-cols-2 gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                            <div>
                              <span className="text-slate-500">Forme : </span>
                              <span className="text-cyan-900 font-semibold">{details.formeJuridique}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Capital : </span>
                              <span className="text-amber-800 font-semibold">{details.capital || 'Variable'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-500">Siège : </span>
                              <span className="text-slate-800 font-medium">{details.adresse}</span>
                            </div>
                            {details.dirigeants && details.dirigeants[0] && (
                              <div className="col-span-2">
                                <span className="text-slate-500">Dirigeant : </span>
                                <span className="text-cyan-800 font-semibold">{details.dirigeants[0].nom} ({details.dirigeants[0].qualite})</span>
                              </div>
                            )}
                          </div>
                        )}

                        {!isPappers && (
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-normal">
                            {res.summary}
                          </p>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-cyan-700 truncate max-w-[180px]">
                          {res.reference}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(details?.siren || res.reference, res.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Copier le SIREN / la référence"
                          >
                            {copiedId === res.id ? <Check className="w-3.5 h-3.5 text-cyan-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDoc(res)}
                            className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getTypeBadge(selectedDoc.type).bg}`}>
                      {getTypeBadge(selectedDoc.type).label}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{selectedDoc.reference}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                    {selectedDoc.type === 'pappers_entreprise' && <Building2 className="w-6 h-6 text-cyan-600" />}
                    <span>{selectedDoc.title}</span>
                  </h3>
                  {selectedDoc.jurisdiction && (
                    <p className="text-xs text-cyan-700 font-medium">{selectedDoc.jurisdiction}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
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
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Forme Juridique</span>
                        <p className="text-xs font-bold text-cyan-900">{selectedDoc.pappersDetails.formeJuridique}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Capital Social</span>
                        <p className="text-xs font-bold text-amber-800">{selectedDoc.pappersDetails.capital || 'Non communiqué'}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Code NAF / APE</span>
                        <p className="text-xs font-bold text-cyan-900">{selectedDoc.pappersDetails.codeNaf} - {selectedDoc.pappersDetails.libelleNaf}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Statut RNE</span>
                        <p className="text-xs font-bold text-teal-700">{selectedDoc.pappersDetails.statut}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Chiffre d'Affaires</span>
                        <p className="text-xs font-bold text-cyan-700">{selectedDoc.pappersDetails.chiffreAffaires}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Effectifs Salariés</span>
                        <p className="text-xs font-bold text-indigo-700">{selectedDoc.pappersDetails.effectifs}</p>
                      </div>
                    </div>

                    {/* Siège social Address */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <h4 className="font-extrabold text-cyan-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-600" /> Siège Social & Immatriculation
                      </h4>
                      <p className="text-xs text-slate-800 font-semibold">{selectedDoc.pappersDetails.adresse}</p>
                      <p className="text-xs text-slate-500">{selectedDoc.pappersDetails.rcs}</p>
                    </div>

                    {/* Dirigeants List */}
                    {selectedDoc.pappersDetails.dirigeants && selectedDoc.pappersDetails.dirigeants.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-600" /> Dirigeants & Mandataires Sociaux
                        </h4>
                        <div className="space-y-1.5">
                          {selectedDoc.pappersDetails.dirigeants.map((d, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white border border-slate-200">
                              <span className="font-bold text-slate-900">{d.nom}</span>
                              <span className="text-cyan-800 font-semibold bg-cyan-50 px-2.5 py-0.5 rounded-md border border-cyan-200">
                                {d.qualite}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Complete Document text */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Synthèse Officielle Registre Pappers</h4>
                      <div className="p-4 rounded-2xl bg-slate-50 font-mono text-xs text-slate-700 whitespace-pre-line border border-slate-200 leading-normal">
                        {selectedDoc.fullText}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-2">
                      <h4 className="font-extrabold text-cyan-900 text-xs uppercase tracking-wider">Résumé Exécutif</h4>
                      <p className="text-slate-800">{selectedDoc.summary}</p>
                    </div>

                    {selectedDoc.keyPoints && selectedDoc.keyPoints.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Points Clés & Impact Juridique</h4>
                        <ul className="space-y-1.5">
                          {selectedDoc.keyPoints.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-700 text-xs">
                              <span className="text-cyan-600 font-bold">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Texte Intégral Officiel</h4>
                      <div className="p-4 rounded-2xl bg-slate-50 font-mono text-xs text-slate-700 whitespace-pre-line border border-slate-200 leading-normal">
                        {selectedDoc.fullText}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedDoc.pappersDetails?.siren || selectedDoc.fullText, 'modal-full')}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedId === 'modal-full' ? 'Copié !' : selectedDoc.pappersDetails ? 'Copier le SIREN' : 'Copier le texte'}</span>
                  </button>

                  {selectedDoc.pappersDetails?.pappersUrl && (
                    <a
                      href={selectedDoc.pappersDetails.pappersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Consulter sur Pappers.fr</span>
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer shadow-sm"
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
