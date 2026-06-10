import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BookOpen, Search, ChevronDown, ChevronRight, Scale, Shield, Home, Briefcase, FileText, RefreshCw } from 'lucide-react';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LawArticle {
  id: string;
  number: string;
  title: string;
  content: string;
  tags?: string[];
}

interface LawChapter {
  id: string;
  title: string;
  articles: LawArticle[];
}

interface LawCode {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  chapters: LawChapter[];
}

// ─── Icon map (stored as text in DB, resolved here) ──────────────────────────

const CODE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  penal: Shield,
  civil: Scale,
  famille: Home,
  administratif: FileText,
  commerce: Briefcase,
};

// ─── Fallback static codes (shown while loading) ─────────────────────────────

const FALLBACK_CODES: Omit<LawCode, 'chapters'>[] = [
  { id: 'penal', name: 'Code Pénal', shortName: 'CP', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: Shield, description: 'Infractions, délits, crimes et leurs sanctions' },
  { id: 'civil', name: 'Code Civil', shortName: 'CC', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: Scale, description: 'Relations entre personnes privées, contrats, propriété' },
  { id: 'famille', name: 'Droit de la Famille', shortName: 'Fam.', color: 'text-pink-700', bgColor: 'bg-pink-50 border-pink-200', icon: Home, description: 'Mariage, divorce, filiation, succession, autorité parentale' },
  { id: 'administratif', name: 'Droit Administratif', shortName: 'DA', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: FileText, description: 'Relations entre l\'administration et les administrés' },
  { id: 'commerce', name: 'Droit Commercial', shortName: 'Com.', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: Briefcase, description: 'Sociétés, commerçants, fonds de commerce, procédures collectives' },
];

// ─── Raw DB row type ──────────────────────────────────────────────────────────

interface LawCodeRow {
  id: string;
  code_id: string;
  code_name: string;
  short_name: string;
  color: string;
  bg_color: string;
  description: string;
  chapter_id: string;
  chapter_title: string;
  article_number: string;
  article_title: string;
  article_content: string;
  tags: string[];
}

// ─── Transform raw rows → grouped LawCode[] ──────────────────────────────────

function buildLawCodes(rows: LawCodeRow[]): LawCode[] {
  const codeMap = new Map<string, LawCode>();

  for (const row of rows) {
    if (!codeMap.has(row.code_id)) {
      const fallback = FALLBACK_CODES.find(f => f.id === row.code_id);
      codeMap.set(row.code_id, {
        id: row.code_id,
        name: row.code_name,
        shortName: row.short_name,
        color: row.color,
        bgColor: row.bg_color,
        icon: CODE_ICON_MAP[row.code_id] || FileText,
        description: row.description || fallback?.description || '',
        chapters: [],
      });
    }

    const code = codeMap.get(row.code_id)!;
    let chapter = code.chapters.find(c => c.id === row.chapter_id);
    if (!chapter) {
      chapter = { id: row.chapter_id, title: row.chapter_title, articles: [] };
      code.chapters.push(chapter);
    }

    chapter.articles.push({
      id: row.id,
      number: row.article_number,
      title: row.article_title,
      content: row.article_content,
      tags: row.tags || [],
    });
  }

  // Order codes consistently
  const order = ['penal', 'civil', 'famille', 'administratif', 'commerce'];
  const result: LawCode[] = [];
  for (const id of order) {
    if (codeMap.has(id)) result.push(codeMap.get(id)!);
  }
  // Add any extra codes not in the order array
  for (const [id, code] of codeMap) {
    if (!order.includes(id)) result.push(code);
  }

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LawCodes: React.FC = () => {
  const [lawCodes, setLawCodes] = useState<LawCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string>('penal');
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // ── Fetch from Supabase ──
  const fetchLawCodes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('law_codes_just')
      .select('*')
      .order('code_id')
      .order('chapter_id')
      .order('article_number');

    if (error) {
      console.error('LawCodes fetch error:', error);
      // Keep any existing data
    } else if (data && data.length > 0) {
      setLawCodes(buildLawCodes(data as LawCodeRow[]));
      setLastSync(new Date());
    }
    setLoading(false);
  }, []);

  // ── Initial load ──
  useEffect(() => {
    fetchLawCodes();
  }, [fetchLawCodes]);

  // ── Realtime subscription ──
  useEffect(() => {
    const channel = supabase
      .channel('law_codes_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'law_codes_just' },
        () => { fetchLawCodes(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLawCodes]);

  // ── Derived state ──
  const currentCode = lawCodes.find(c => c.id === selectedCode) || null;

  const filteredChapters = useMemo(() => {
    if (!currentCode) return [];
    if (!searchTerm.trim()) return currentCode.chapters;
    const q = searchTerm.toLowerCase();
    return currentCode.chapters.map(ch => ({
      ...ch,
      articles: ch.articles.filter(a =>
        a.number.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q))
      )
    })).filter(ch => ch.articles.length > 0);
  }, [searchTerm, currentCode]);

  const toggleChapter = (id: string) => {
    setOpenChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const expandAll = () => {
    if (currentCode) setOpenChapters(new Set(currentCode.chapters.map(c => c.id)));
  };
  const collapseAll = () => setOpenChapters(new Set());

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-secondary-500 text-sm">Chargement des codes de loi depuis Supabase...</p>
      </div>
    );
  }

  // ── Empty state (table not seeded yet) ──
  if (lawCodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center border-2 border-dashed border-secondary-200 rounded-2xl">
        <BookOpen className="h-12 w-12 text-secondary-300" />
        <div>
          <p className="font-bold text-secondary-700">Aucun code de loi dans la base de données</p>
          <p className="text-sm text-secondary-500 mt-1">
            Exécutez le script SQL <code className="bg-secondary-100 px-1 rounded">backend/supabase_dynamic_tables.sql</code> dans votre Supabase SQL Editor pour initialiser les données.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLawCodes}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary-600" />
            Bibliothèque des Codes de Loi
          </h2>
          <p className="text-sm text-secondary-500 mt-1">
            Consultez les articles des principaux codes de droit — données synchronisées en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary-400">
            Sync: {lastSync.toLocaleTimeString('fr-FR')}
          </span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Temps réel actif" />
          <Button variant="outline" size="sm" onClick={fetchLawCodes}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Code tabs */}
      <div className="flex flex-wrap gap-2">
        {lawCodes.map(code => {
          const Icon = code.icon;
          const isActive = selectedCode === code.id;
          return (
            <button
              key={code.id}
              onClick={() => { setSelectedCode(code.id); setSearchTerm(''); setOpenChapters(new Set()); setExpandedArticle(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                isActive
                  ? `${code.bgColor} ${code.color} border-current shadow-md`
                  : 'bg-white text-secondary-600 border-secondary-200 hover:border-secondary-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{code.name}</span>
              <span className="sm:hidden">{code.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Search & controls */}
      {currentCode && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
              <Input
                className="pl-10"
                placeholder={`Rechercher dans le ${currentCode.name}...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>Tout ouvrir</Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>Tout fermer</Button>
            </div>
          </div>

          {/* Code description */}
          <div className={`rounded-2xl border-2 p-4 flex items-center gap-4 ${currentCode.bgColor}`}>
            {React.createElement(currentCode.icon, { className: `h-8 w-8 ${currentCode.color} flex-shrink-0` })}
            <div>
              <h3 className={`text-lg font-bold ${currentCode.color}`}>{currentCode.name}</h3>
              <p className="text-sm text-secondary-600">{currentCode.description}</p>
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-3">
            {filteredChapters.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-secondary-200">
                <Search className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
                <p className="font-bold text-secondary-700">Aucun article trouvé</p>
                <p className="text-sm text-secondary-500">Modifiez votre terme de recherche.</p>
              </div>
            )}
            {filteredChapters.map(chapter => {
              const isOpen = openChapters.has(chapter.id) || !!searchTerm;
              return (
                <Card key={chapter.id} className="overflow-hidden border border-secondary-200 shadow-sm">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary-50 transition-colors"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <span className="font-bold text-secondary-900">{chapter.title}</span>
                    <div className="flex items-center gap-2 text-secondary-500 text-xs flex-shrink-0 ml-2">
                      <span className="bg-secondary-100 px-2 py-0.5 rounded-full">{chapter.articles.length} articles</span>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-secondary-100 divide-y divide-secondary-50">
                      {chapter.articles.map(article => {
                        const isExpanded = expandedArticle === article.id;
                        return (
                          <div key={article.id} className="hover:bg-secondary-50/50 transition-colors">
                            <button
                              className="w-full flex items-start justify-between p-4 text-left gap-3"
                              onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className={`flex-shrink-0 font-mono text-xs px-2 py-1 rounded-lg font-bold ${currentCode.bgColor} ${currentCode.color}`}>
                                  {article.number}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-secondary-900 text-sm">{article.title}</p>
                                  {!isExpanded && (
                                    <p className="text-xs text-secondary-500 mt-0.5 line-clamp-1">{article.content}</p>
                                  )}
                                </div>
                              </div>
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-secondary-400 flex-shrink-0 mt-0.5" /> : <ChevronRight className="h-4 w-4 text-secondary-400 flex-shrink-0 mt-0.5" />}
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 pl-14">
                                <div className={`rounded-xl p-4 border ${currentCode.bgColor} text-sm text-secondary-800 leading-relaxed`}>
                                  {article.content}
                                </div>
                                {article.tags && article.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3">
                                    {article.tags.map(tag => (
                                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded-full font-medium">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LawCodes;
