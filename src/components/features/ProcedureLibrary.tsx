import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BookOpen, Search, Clock, ChevronRight,
  CheckCircle2, AlertCircle, Info, Scale, Home, Briefcase, FileText, Shield, Users, RefreshCw
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface ProcedureStep {
  step: number;
  title: string;
  description: string;
  duration?: string;
  tips?: string;
  warning?: string;
}

interface Procedure {
  id: string;
  title: string;
  category: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  totalDuration: string;
  description: string;
  steps: ProcedureStep[];
}

interface ProcedureRow {
  id: string;
  proc_id: string;
  title: string;
  category: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  total_duration: string;
  description: string;
  steps: unknown;
}

const CATEGORIES = [
  { id: 'all', name: 'Toutes', icon: BookOpen },
  { id: 'civil', name: 'Civil', icon: Scale },
  { id: 'penal', name: 'Pénal', icon: Shield },
  { id: 'famille', name: 'Famille', icon: Home },
  { id: 'travail', name: 'Travail', icon: Briefcase },
  { id: 'administratif', name: 'Administratif', icon: FileText },
  { id: 'societe', name: 'Sociétés', icon: Users },
];

const difficultyConfig: Record<string, { color: string; bg: string }> = {
  'Facile': { color: 'text-green-700', bg: 'bg-green-100' },
  'Moyen': { color: 'text-amber-700', bg: 'bg-amber-100' },
  'Difficile': { color: 'text-red-700', bg: 'bg-red-100' },
};

export const ProcedureLibrary: React.FC = () => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const fetchProcedures = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('procedures_just')
      .select('*')
      .order('title');

    if (error) {
      console.error('Procedures fetch error:', error);
    } else if (data) {
      const mapped: Procedure[] = (data as ProcedureRow[]).map(row => ({
        id: row.proc_id,
        title: row.title,
        category: row.category,
        difficulty: row.difficulty,
        totalDuration: row.total_duration,
        description: row.description,
        steps: Array.isArray(row.steps) ? (row.steps as ProcedureStep[]) : [],
      }));
      setProcedures(mapped);
      setLastSync(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  useEffect(() => {
    const channel = supabase
      .channel('procedures_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'procedures_just' },
        () => { fetchProcedures(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProcedures]);

  const filtered = useMemo(() => {
    return procedures.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [procedures, selectedCategory, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-secondary-500 text-sm">Chargement des procédures depuis Supabase...</p>
      </div>
    );
  }

  if (procedures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center border-2 border-dashed border-secondary-200 rounded-2xl">
        <BookOpen className="h-12 w-12 text-secondary-300" />
        <div>
          <p className="font-bold text-secondary-700">Aucune procédure dans la base de données</p>
          <p className="text-sm text-secondary-500 mt-1">
            Exécutez le script SQL <code className="bg-secondary-100 px-1 rounded">backend/supabase_dynamic_tables.sql</code> dans votre Supabase SQL Editor pour initialiser les données.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProcedures}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  if (selectedProcedure) {
    const diff = difficultyConfig[selectedProcedure.difficulty];
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedProcedure(null)}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-800 font-semibold text-sm transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Retour à la bibliothèque
        </button>

        {/* Procedure header */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 text-white rounded-3xl p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${diff.bg} ${diff.color}`}>
              {selectedProcedure.difficulty}
            </span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {selectedProcedure.totalDuration}
            </span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
              {selectedProcedure.steps.length} étapes
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-3">{selectedProcedure.title}</h2>
          <p className="text-primary-200 text-sm leading-relaxed">{selectedProcedure.description}</p>
        </div>

        {/* Timeline steps */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-primary-200 hidden sm:block" />
          
          <div className="space-y-4">
            {selectedProcedure.steps.map((step) => (
              <div key={step.step} className="relative flex gap-4 sm:gap-6">
                {/* Step circle */}
                <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md z-10">
                  {step.step}
                </div>
                
                {/* Content */}
                <Card className="flex-1 border border-secondary-200 shadow-sm hover:shadow-md transition-shadow mb-0">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-secondary-900">{step.title}</h3>
                      {step.duration && (
                        <span className="text-xs bg-secondary-100 text-secondary-600 px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {step.duration}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-secondary-700 leading-relaxed mb-3">{step.description}</p>
                    {step.tips && (
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mt-3">
                        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">{step.tips}</p>
                      </div>
                    )}
                    {step.warning && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">{step.warning}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
            {/* End */}
            <div className="relative flex gap-4 sm:gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md z-10">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex-1 flex items-center">
                <p className="text-green-700 font-bold text-sm">Procédure terminée !</p>
              </div>
            </div>
          </div>
        </div>
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
            Bibliothèque des Procédures Juridiques
          </h2>
          <p className="text-sm text-secondary-500 mt-1">
            Chronologies étape par étape pour toutes les grandes procédures du droit français.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary-400">
            Sync: {lastSync.toLocaleTimeString('fr-FR')}
          </span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Temps réel actif" />
          <Button variant="outline" size="sm" onClick={fetchProcedures}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-secondary-400" />
        <Input
          className="pl-10"
          placeholder="Rechercher une procédure..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                isActive
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                  : 'bg-white text-secondary-600 border-secondary-200 hover:border-primary-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Procedure cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-secondary-200">
          <Search className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
          <p className="font-bold text-secondary-700">Aucune procédure trouvée</p>
          <p className="text-sm text-secondary-500">Modifiez votre recherche ou la catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(proc => {
            const diff = difficultyConfig[proc.difficulty];
            const catInfo = CATEGORIES.find(c => c.id === proc.category);
            return (
              <Card
                key={proc.id}
                className="cursor-pointer hover:shadow-lg transition-all border border-secondary-200 group"
                onClick={() => setSelectedProcedure(proc)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${diff.bg} ${diff.color}`}>
                        {proc.difficulty}
                      </span>
                      {catInfo && catInfo.id !== 'all' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-secondary-100 text-secondary-600">
                          {catInfo.name}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-secondary-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                  <h3 className="font-bold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors">{proc.title}</h3>
                  <p className="text-xs text-secondary-600 mb-4 line-clamp-2">{proc.description}</p>
                  <div className="flex items-center justify-between text-xs text-secondary-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {proc.totalDuration}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary-500" />
                      {proc.steps.length} étapes
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProcedureLibrary;
