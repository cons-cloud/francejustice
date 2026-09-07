import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Phone, Mail, MapPin, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { FranceMap, regions } from '../components/features/FranceMap';
import { useTranslation } from '../i18n';
import { COURS_D_APPEL_LIST, getCourDAppelForCity } from '../lib/jurisdictions';
import { getUnifiedLawyersList } from '../lib/avocatsDataGouvSync';

interface LawyerProfile {
  id: string;
  role?: string;
  first_name: string;
  last_name: string;
  email?: string;
  specialties?: string[];
  specialty?: string;
  bio?: string;
  city?: string;
  postal_code?: string;
  office_phone?: string;
  avatar_url?: string;
  is_available?: boolean;
  university?: string;
  lawyers?: {
    bar_association?: string;
  } | {
    bar_association?: string;
  }[];
}

const LawyersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'lawyer' | 'professor' | 'doctorate'>('all');
  
  // Geographical Filters State
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBarreau, setSelectedBarreau] = useState<string>('');
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchLawyers(0);
    
    const lawyersSub = supabase
      .channel('public-lawyers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lawyers_just' }, () => {
        fetchLawyers(0);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles_just' }, () => {
        fetchLawyers(0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lawyersSub);
    };
  }, []);

  const fetchLawyers = async (_pageNumber?: number) => {
    setLoading(true);
    const unified = await getUnifiedLawyersList();
    setLawyers(unified as any);
    setHasMore(false);
    setLoading(false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLawyers(nextPage);
  };

  // Helper to resolve region from postal code
  const getRegionFromPostalCode = (postalCode?: string) => {
    if (!postalCode) return null;
    const dept = postalCode.trim().substring(0, 2);
    const region = regions.find(r => r.departments.includes(dept));
    return region ? region.name : null;
  };

  // Get unique lists for filter select options
  const cities = useMemo(() => {
    return Array.from(new Set(lawyers.map(l => l.city).filter(Boolean).map(c => c!.trim()))).sort() as string[];
  }, [lawyers]);

  const barreaux = useMemo(() => {
    const existing = lawyers
      .map(l => {
        const bar = Array.isArray(l.lawyers) 
          ? l.lawyers[0]?.bar_association 
          : l.lawyers?.bar_association;
        return bar?.trim();
      })
      .filter(Boolean) as string[];
    const caNames = COURS_D_APPEL_LIST.map(ca => ca.name);
    return Array.from(new Set([...existing, ...caNames])).sort();
  }, [lawyers]);

  // Lawyer counts by region for the map representation
  const lawyerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    regions.forEach(r => {
      counts[r.name] = 0;
    });
    
    lawyers.forEach(l => {
      const regionName = getRegionFromPostalCode(l.postal_code);
      if (regionName) {
        counts[regionName] = (counts[regionName] || 0) + 1;
      }
    });
    return counts;
  }, [lawyers]);

  const [selectedCourDAppel, setSelectedCourDAppel] = useState<string>('');

  // Filter lawyers by search text and dropdown selections
  const filteredLawyers = lawyers.filter(l => {
    if (roleFilter !== 'all' && l.role !== roleFilter) return false;

    const matchesSearch = `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.specialty || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.university || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedRegion) {
      const lawyerRegion = getRegionFromPostalCode(l.postal_code);
      if (lawyerRegion !== selectedRegion) return false;
    }

    if (selectedCity && l.city !== selectedCity) return false;

    if (selectedBarreau) {
      const bar = Array.isArray(l.lawyers) 
        ? l.lawyers[0]?.bar_association 
        : l.lawyers?.bar_association;
      if (bar !== selectedBarreau) return false;
    }

    if (selectedCourDAppel) {
      const ca = getCourDAppelForCity(l.city, l.postal_code);
      if (ca.name !== selectedCourDAppel) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="bg-gradient-to-b from-cyan-50/80 via-white to-slate-50 text-slate-900 py-16 mb-12 border-b border-slate-200/80">
        <div className="container mx-auto px-4 text-center flex flex-col items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 font-bold text-xs tracking-wide uppercase mb-4 border border-cyan-200">
            <Users className="h-3.5 w-3.5 text-cyan-600" /> Annuaire Officiel & Vérifié
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 text-slate-900 text-center tracking-tight">{t('lawyers.hero_title', 'Trouvez un Avocat de Confiance')}</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 text-center leading-relaxed">
            {t('lawyers.hero_subtitle', 'Notre annuaire regroupe uniquement des professionnels du droit français rigoureusement vérifiés par notre équipe.')}
          </p>
          
          <div className="max-w-2xl w-full mx-auto relative mb-6">
            <Search className="absolute left-4 top-4 h-6 w-6 text-slate-400" />
            <Input 
              className="pl-12 h-14 text-base sm:text-lg bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-xs rounded-2xl"
              placeholder={t('lawyers.search_placeholder', 'Rechercher par nom, université, barreau ou spécialité...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                roleFilter === 'all' 
                  ? 'bg-cyan-600 text-white shadow-xs font-bold border border-cyan-600' 
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('lawyers.filter_all_members', 'Tous les Intervenants')} ({lawyers.length})
            </button>
            <button
              onClick={() => setRoleFilter('lawyer')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                roleFilter === 'lawyer' 
                  ? 'bg-cyan-700 text-white shadow-xs' 
                  : 'bg-white text-cyan-800 hover:bg-cyan-50 border border-slate-200'
              }`}
            >
              ⚖️ {t('home.tab_lawyer', 'Espace Avocat')} ({lawyers.filter(l => l.role === 'lawyer').length})
            </button>
            <button
              onClick={() => setRoleFilter('professor')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                roleFilter === 'professor' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              👨‍🏫 {t('home.tab_prof', 'Professeurs de Droit')} ({lawyers.filter(l => l.role === 'professor').length})
            </button>
            <button
              onClick={() => setRoleFilter('doctorate')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                roleFilter === 'doctorate' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'bg-white text-teal-800 hover:bg-teal-50 border border-slate-200'
              }`}
            >
              🔬 {t('home.tab_doc', 'Doctorants & Chercheurs')} ({lawyers.filter(l => l.role === 'doctorate').length})
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Map & Filters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <FranceMap 
              selectedRegion={selectedRegion} 
              onSelectRegion={setSelectedRegion} 
              lawyerCounts={lawyerCounts} 
            />
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl flex flex-col justify-between space-y-4 text-slate-900">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                🏛️ {t('lawyers.location_filters', 'Filtres de Localisation')}
              </h3>
              
              <div className="space-y-4">
                {/* Region Select */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">{t('lawyers.region', 'Région')}</label>
                  <select
                    value={selectedRegion || ''}
                    onChange={(e) => setSelectedRegion(e.target.value || null)}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50 text-slate-900 shadow-2xs"
                  >
                    <option value="">{t('lawyers.all_regions', 'Toutes les régions')}</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Barreau Select */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">{t('lawyers.bar_association', "Barreau d'inscription")}</label>
                  <select
                    value={selectedBarreau}
                    onChange={(e) => setSelectedBarreau(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50 text-slate-900 shadow-2xs"
                  >
                    <option value="">{t('lawyers.all_barreaux', 'Tous les barreaux')}</option>
                    {barreaux.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Ville Select */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">{t('lawyers.city', 'Ville du cabinet')}</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50 text-slate-900 shadow-2xs"
                  >
                    <option value="">{t('lawyers.all_cities', 'Toutes les villes')}</option>
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Cour d'Appel Select */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">{t('lawyers.cour_appel', "Cour d'Appel de la ville")}</label>
                  <select
                    value={selectedCourDAppel}
                    onChange={(e) => setSelectedCourDAppel(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50 text-slate-900 shadow-2xs"
                  >
                    <option value="">{t('lawyers.all_cours_appel', "Toutes les Cours d'Appel (36)")}</option>
                    {COURS_D_APPEL_LIST.filter(c => c.type !== 'CSM').map(ca => (
                      <option key={ca.id} value={ca.name}>{ca.name} ({ca.ville})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {(selectedRegion || selectedBarreau || selectedCity || selectedCourDAppel) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRegion(null);
                  setSelectedBarreau('');
                  setSelectedCity('');
                  setSelectedCourDAppel('');
                }}
                className="w-full border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl font-bold"
              >
                {t('lawyers.reset_filters', 'Réinitialiser les filtres')}
              </Button>
            )}
          </div>
        </div>

        {loading && lawyers.length === 0 ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-slate-500 font-medium">{t('common.loading', 'Chargement...')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLawyers.map((lawyer) => {
              const bar = Array.isArray(lawyer.lawyers) 
                ? lawyer.lawyers[0]?.bar_association 
                : lawyer.lawyers?.bar_association;

              return (
                <Card key={lawyer.id} hover className="bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-cyan-300 transition-all overflow-hidden group rounded-3xl">
                  <div className={`h-1.5 ${
                    lawyer.role === 'professor' ? 'bg-amber-500' :
                    lawyer.role === 'doctorate' ? 'bg-teal-500' : 'bg-cyan-600'
                  }`}></div>
                  <CardContent className="p-7">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-cyan-50 text-cyan-700 rounded-full flex items-center justify-center font-bold text-2xl uppercase overflow-hidden ring-2 ring-cyan-100 shrink-0">
                        {lawyer.avatar_url ? (
                          <img src={lawyer.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{lawyer.first_name?.[0]}{lawyer.last_name?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          {lawyer.role === 'professor' ? `Prof. ${lawyer.first_name} ${lawyer.last_name}` :
                           lawyer.role === 'doctorate' ? `Dr. ${lawyer.first_name} ${lawyer.last_name}` :
                           `Me. ${lawyer.first_name} ${lawyer.last_name}`}
                          <CheckCircle className="h-5 w-5 text-teal-600" />
                        </h3>
                        <p className="text-cyan-700 font-semibold text-xs">
                          {lawyer.specialty || (
                            lawyer.role === 'professor' ? 'Professeur de Droit & Formateur' :
                            lawyer.role === 'doctorate' ? 'Doctorant / Chercheur en Droit' :
                            'Avocat au barreau'
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black ${
                            lawyer.role === 'professor' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            lawyer.role === 'doctorate' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                            'bg-cyan-50 text-cyan-800 border border-cyan-200'
                          }`}>
                            {lawyer.role === 'professor' ? 'Professeur' :
                             lawyer.role === 'doctorate' ? 'Doctorant' : 'Avocat'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold inline-block ${
                            lawyer.is_available !== false ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {lawyer.is_available !== false ? t('lawyers.available', 'Disponible') : t('lawyers.unavailable', 'Indisponible')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-slate-600 gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-cyan-600 shrink-0" />
                        <span>
                          {lawyer.city || 'France'}
                          {lawyer.postal_code ? ` (${lawyer.postal_code.substring(0, 2)})` : ''}
                        </span>
                      </div>
                      
                      {lawyer.university && (
                        <div className="flex items-center text-slate-600 gap-3 text-xs font-medium">
                          <span className="text-cyan-600">🎓</span>
                          <span>{lawyer.university}</span>
                        </div>
                      )}

                      {bar && (
                        <div className="flex items-center text-slate-600 gap-3 text-xs">
                          <span className="text-cyan-600">🏛️</span>
                          <span>{t('lawyers.barreau_of', 'Barreau de')} {bar}</span>
                        </div>
                      )}

                      <div className="flex items-center text-cyan-700 gap-3 text-xs font-semibold">
                        <span className="text-cyan-600">⚖️</span>
                        <span>{getCourDAppelForCity(lawyer.city, lawyer.postal_code).name}</span>
                      </div>

                      {lawyer.email && (
                        <div className="flex items-center text-slate-600 gap-3 text-xs">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate">{lawyer.email}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-600 text-sm font-normal line-clamp-3 mb-6 min-h-12 leading-relaxed">
                      {lawyer.bio || t('lawyers.default_bio', "Professionnel dévoué au service du droit, spécialisé dans l'assistance et le conseil juridique pour les particuliers et les entreprises.")}
                    </p>

                    <div className="flex gap-2">
                      <Button className="flex-1 font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-xs" onClick={() => navigate(`/dashboard/user?bookLawyerId=${lawyer.id}`)}>{t('lawyers.book_appointment', 'Prendre RDV')}</Button>
                      <Button variant="outline" className="px-4 border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl">
                        <Phone className="h-4 w-4 text-cyan-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {hasMore && (
              <div className="col-span-full text-center mt-12">
                <Button 
                  onClick={handleLoadMore} 
                  variant="outline" 
                  size="lg" 
                  className="px-10 h-14 font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-2xl shadow-xs"
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : null}
                  {t('lawyers.load_more', "Charger plus d'avocats")}
                </Button>
              </div>
            )}
            
            {filteredLawyers.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-900 shadow-sm">
                <Users className="h-16 w-16 text-cyan-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900">{t('lawyers.no_results', 'Aucun avocat trouvé')}</h3>
                <p className="text-slate-500 text-sm mt-1">{t('lawyers.no_results_hint', 'Essayez de modifier vos critères de recherche.')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 mt-16">
        <div className="bg-gradient-to-r from-cyan-600 via-cyan-700 to-teal-700 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-white shadow-xl">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">{t('lawyers.cta_title', 'Vous êtes avocat ?')}</h2>
            <p className="text-base text-cyan-50">{t('lawyers.cta_subtitle', 'Rejoignez Law Just pour augmenter votre visibilité et gérer vos dossiers en ligne.')}</p>
          </div>
          <Button size="lg" className="px-8 h-14 text-base shadow-lg bg-white text-cyan-900 hover:bg-cyan-50 font-black rounded-xl shrink-0" onClick={() => navigate('/register/lawyer')}>
            {t('lawyers.cta_btn', "S'inscrire comme Avocat")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LawyersPage;
