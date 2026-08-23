import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, BookOpen, Newspaper, Sparkles, ChevronLeft, ChevronRight, Plus, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';

export interface PlanningEvent {
  id: string;
  title: string;
  description: string;
  category: 'formation' | 'actualite' | 'programme';
  recurrence: 'annual' | 'monthly' | 'weekly' | 'one_time';
  event_date: string; // YYYY-MM-DD
  event_time?: string; // HH:MM
  duration_minutes?: number;
  lawyer_id?: string;
  lawyer_first_name?: string;
  lawyer_last_name?: string;
  video_url?: string;
  meeting_link?: string;
  is_active?: boolean;
  registered_count?: number;
  created_at?: string;
}

interface AnnualPlanningProps {
  mode?: 'public' | 'citizen' | 'lawyer' | 'admin';
  onEventClick?: (event: PlanningEvent) => void;
  onAddEventClick?: () => void;
}

export const AnnualPlanning: React.FC<AnnualPlanningProps> = ({
  mode = 'public',
  onEventClick,
  onAddEventClick
}) => {
  const { user: _user } = useAuth();
  const { t } = useTranslation();
  const [viewType, setViewType] = useState<'year' | 'month' | 'week'>('month');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'formation' | 'actualite' | 'programme'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sample data fallback if table is empty
  const defaultEvents: PlanningEvent[] = [
    {
      id: 'plan-1',
      title: 'Masterclass : Réforme du Droit des Contrats et des Obligations',
      description: 'Analyse jurisprudentielle approfondie et mise en pratique des nouvelles clauses contractuelles.',
      category: 'formation',
      recurrence: 'monthly',
      event_date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-15`,
      event_time: '14:00',
      duration_minutes: 120,
      lawyer_first_name: 'Jean',
      lawyer_last_name: 'Dupont',
      is_active: true,
      registered_count: 42
    },
    {
      id: 'plan-2',
      title: 'Conférence Annuelle : Protection des Données et RGPD 2026',
      description: 'Présentation officielle du bilan annuel des contrôles CNIL et des nouvelles directives européennes.',
      category: 'programme',
      recurrence: 'annual',
      event_date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-22`,
      event_time: '10:00',
      duration_minutes: 180,
      lawyer_first_name: 'Claire',
      lawyer_last_name: 'Martin',
      is_active: true,
      registered_count: 85
    },
    {
      id: 'plan-3',
      title: 'Décision de la Cour de Cassation sur le Licenciement Économique',
      description: 'Revue de presse et décryptage des récents arrêts de la chambre sociale.',
      category: 'actualite',
      recurrence: 'weekly',
      event_date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-08`,
      event_time: '17:30',
      duration_minutes: 60,
      lawyer_first_name: 'Marc',
      lawyer_last_name: 'Alvarez',
      is_active: true,
      registered_count: 31
    }
  ];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Query planning_events_just
      const { data: planData } = await supabase
        .from('planning_events_just')
        .select('*')
        .order('event_date', { ascending: true });

      // 2. Query classrooms_just to merge live visios into planning
      const { data: classroomData } = await supabase
        .from('classrooms_just')
        .select('*')
        .order('created_at', { ascending: false });

      const mergedEvents: PlanningEvent[] = [];

      if (planData && planData.length > 0) {
        planData.forEach(p => {
          mergedEvents.push({
            id: p.id,
            title: p.title,
            description: p.description || '',
            category: p.category || 'formation',
            recurrence: p.recurrence || 'annual',
            event_date: p.event_date || new Date().toISOString().split('T')[0],
            event_time: p.event_time || '10:00',
            duration_minutes: p.duration_minutes || 60,
            lawyer_id: p.lawyer_id,
            video_url: p.video_url,
            meeting_link: p.meeting_link,
            is_active: p.is_active !== false,
            created_at: p.created_at
          });
        });
      }

      if (classroomData && classroomData.length > 0) {
        classroomData.forEach(c => {
          mergedEvents.push({
            id: `class-${c.id}`,
            title: c.title,
            description: c.description || '',
            category: 'formation',
            recurrence: 'monthly',
            event_date: c.date || (c.scheduled_at ? c.scheduled_at.split('T')[0] : new Date().toISOString().split('T')[0]),
            event_time: c.time || (c.scheduled_at ? c.scheduled_at.split('T')[1]?.slice(0, 5) : '10:00'),
            duration_minutes: c.duration_minutes || 60,
            lawyer_id: c.lawyer_id,
            lawyer_first_name: c.lawyer_first_name,
            lawyer_last_name: c.lawyer_last_name,
            video_url: c.video_url,
            meeting_link: c.meeting_link,
            is_active: c.is_active !== false,
            registered_count: c.registered_count || 0
          });
        });
      }

      if (mergedEvents.length > 0) {
        setEvents(mergedEvents);
      } else {
        setEvents(defaultEvents);
      }
    } catch (e) {
      console.error("Error fetching planning events:", e);
      setEvents(defaultEvents);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchEvents();

    const ch1 = supabase
      .channel('planning-events-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planning_events_just' }, fetchEvents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classrooms_just' }, fetchEvents)
      .subscribe();

    return () => { supabase.removeChannel(ch1); };
  }, [fetchEvents]);

  const monthsList = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const filteredEvents = events.filter(e => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    
    if (viewType === 'month') {
      try {
        const [y, m] = e.event_date.split('-');
        return Number(y) === selectedYear && Number(m) === (selectedMonth + 1);
      } catch {
        return true;
      }
    } else if (viewType === 'year') {
      try {
        const [y] = e.event_date.split('-');
        return Number(y) === selectedYear;
      } catch {
        return true;
      }
    }
    return true;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'formation':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><BookOpen className="w-3 h-3" /> Formation</span>;
      case 'actualite':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><Newspaper className="w-3 h-3" /> Actualité</span>;
      case 'programme':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3" /> Programme</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">Événement</span>;
    }
  };

  const getRecurrenceLabel = (rec: string) => {
    switch (rec) {
      case 'annual': return '📅 Annuel';
      case 'monthly': return '🗓️ Mensuel';
      case 'weekly': return '⚡ Hebdomadaire';
      default: return '📍 Ponctuel';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 mb-2">
              <Calendar className="w-3.5 h-3.5" /> {t('planning.badge', 'Agenda Officiel France Justice')}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {t('planning.title', 'Planning Annuel & Calendrier des Formations')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('planning.subtitle', 'Consultez le calendrier prévisionnel des masterclasses, actualités juridiques et programmes académiques dispensés par nos avocats partenaires.')}
            </p>
          </div>

          {(mode === 'lawyer' || mode === 'admin') && onAddEventClick && (
            <Button variant="primary" size="sm" onClick={onAddEventClick} className="whitespace-nowrap font-bold shadow-md">
              <Plus className="w-4 h-4 mr-1.5" /> Programmer un événement
            </Button>
          )}
        </div>

        {/* View Switcher & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setViewType('month')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewType === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              🗓️ Vue Mensuelle
            </button>
            <button
              onClick={() => setViewType('year')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewType === 'year' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📅 Vue Annuelle ({selectedYear})
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewType === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📋 Liste Agenda
            </button>
          </div>

          {/* Month Navigator */}
          {viewType === 'month' && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
              <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-extrabold text-slate-800 min-w-[120px] text-center">
                {monthsList[selectedMonth]} {selectedYear}
              </span>
              <button onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${categoryFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setCategoryFilter('formation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${categoryFilter === 'formation' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >
              🎓 Formations
            </button>
            <button
              onClick={() => setCategoryFilter('actualite')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${categoryFilter === 'actualite' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >
              📰 Actualités
            </button>
            <button
              onClick={() => setCategoryFilter('programme')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${categoryFilter === 'programme' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >
              📜 Programmes
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Events */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-500" />
          <p className="text-xs font-semibold">Chargement du planning annuel en temps réel...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Aucun événement dans le planning</h3>
          <p className="text-xs text-slate-400 mt-1">Aucune formation ou actualité n'est programmée pour la période sélectionnée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const evtDate = new Date(evt.event_date);
            const formattedDate = isNaN(evtDate.getTime()) 
              ? evt.event_date 
              : evtDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

            const isSuspended = evt.is_active === false;

            return (
              <Card key={evt.id} className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-100 bg-white flex flex-col justify-between group ${isSuspended ? 'opacity-60' : ''}`}>
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    {getCategoryBadge(evt.category)}
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                      {getRecurrenceLabel(evt.recurrence)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-3 space-y-2 border border-slate-100 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="capitalize">{formattedDate}</span>
                    </div>
                    {evt.event_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{evt.event_time} ({evt.duration_minutes || 60} min)</span>
                      </div>
                    )}
                    {(evt.lawyer_first_name || evt.lawyer_last_name) && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Me {evt.lawyer_first_name} {evt.lawyer_last_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 text-xs font-bold shadow-sm"
                      onClick={() => onEventClick ? onEventClick(evt) : window.location.href = '/classrooms'}
                      disabled={isSuspended}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      {isSuspended ? 'Suspendu' : 'Détails & Programme'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
