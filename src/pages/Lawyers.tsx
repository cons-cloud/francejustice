import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Phone, Mail, MapPin, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { FranceMap, regions } from '../components/features/FranceMap';
import { useTranslation } from '../i18n';

interface LawyerProfile {
  id: string;
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
  
  // Geographical Filters State
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBarreau, setSelectedBarreau] = useState<string>('');
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  useEffect(() => {
    fetchLawyers(0, true);
    
    const lawyersSub = supabase
      .channel('public-lawyers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lawyers_just' }, () => {
        fetchLawyers(0, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles_just' }, () => {
        fetchLawyers(0, true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(lawyersSub);
    };
  }, []);

  const fetchLawyers = async (pageNumber: number, reset: boolean = false) => {
    setLoading(true);
    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('profiles_just')
      .select('*, lawyers:lawyers_just(bar_association)')
      .eq('role', 'lawyer')
      .eq('is_verified', true)
      .range(from, to);
    
    if (!error && data) {
      if (reset) {
        setLawyers(data);
      } else {
        setLawyers(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
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
    return Array.from(
      new Set(
        lawyers
          .map(l => {
            const bar = Array.isArray(l.lawyers) 
              ? l.lawyers[0]?.bar_association 
              : l.lawyers?.bar_association;
            return bar?.trim();
          })
          .filter(Boolean)
      )
    ).sort() as string[];
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

  // Filter lawyers by search text and dropdown selections
  const filteredLawyers = lawyers.filter(l => {
    const matchesSearch = `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());
    
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

    return true;
  });

  return (
    <div className="min-h-screen bg-secondary-50 pb-20">
      <div className="bg-primary-900 text-white py-20 mb-12">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('lawyers.hero_title', 'Trouvez un Avocat de Confiance')}</h1>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto mb-10">
            {t('lawyers.hero_subtitle', 'Notre annuaire regroupe uniquement des professionnels du droit français rigoureusement vérifiés par notre équipe.')}
          </p>
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 h-6 w-6 text-secondary-400" />
            <Input 
              className="pl-12 h-14 text-lg text-secondary-900 shadow-xl"
              placeholder={t('lawyers.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container">
        {/* Map & Filters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <FranceMap 
              selectedRegion={selectedRegion} 
              onSelectRegion={setSelectedRegion} 
              lawyerCounts={lawyerCounts} 
            />
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-secondary-200 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                🏛️ {t('lawyers.location_filters', 'Filtres de Localisation')}
              </h3>
              
              <div className="space-y-4">
                {/* Region Select */}
                <div>
                  <label className="text-xs font-semibold text-secondary-500 block mb-1">{t('lawyers.region', 'Région')}</label>
                  <select
                    value={selectedRegion || ''}
                    onChange={(e) => setSelectedRegion(e.target.value || null)}
                    className="w-full h-11 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                  >
                    <option value="">{t('lawyers.all_regions', 'Toutes les régions')}</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Barreau Select */}
                <div>
                  <label className="text-xs font-semibold text-secondary-500 block mb-1">{t('lawyers.bar_association', "Barreau d'inscription")}</label>
                  <select
                    value={selectedBarreau}
                    onChange={(e) => setSelectedBarreau(e.target.value)}
                    className="w-full h-11 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                  >
                    <option value="">{t('lawyers.all_barreaux', 'Tous les barreaux')}</option>
                    {barreaux.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Ville Select */}
                <div>
                  <label className="text-xs font-semibold text-secondary-500 block mb-1">{t('lawyers.city', 'Ville du cabinet')}</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-11 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                  >
                    <option value="">{t('lawyers.all_cities', 'Toutes les villes')}</option>
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {(selectedRegion || selectedBarreau || selectedCity) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRegion(null);
                  setSelectedBarreau('');
                  setSelectedCity('');
                }}
                className="w-full"
              >
                {t('lawyers.reset_filters', 'Réinitialiser les filtres')}
              </Button>
            )}
          </div>
        </div>

        {loading && lawyers.length === 0 ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-secondary-600 font-medium">{t('common.loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLawyers.map((lawyer) => {
              const bar = Array.isArray(lawyer.lawyers) 
                ? lawyer.lawyers[0]?.bar_association 
                : lawyer.lawyers?.bar_association;

              return (
                <Card key={lawyer.id} hover className="border-none shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                  <div className="h-4 bg-primary-600"></div>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold text-2xl uppercase overflow-hidden">
                        {lawyer.avatar_url ? (
                          <img src={lawyer.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{lawyer.first_name?.[0]}{lawyer.last_name?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                          Me. {lawyer.first_name} {lawyer.last_name}
                          <CheckCircle className="h-5 w-5 text-success-500" />
                        </h3>
                        <p className="text-primary-600 font-semibold">{lawyer.specialty || t('lawyers.default_title', 'Avocat au barreau')}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${
                          lawyer.is_available !== false ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-500'
                        }`}>
                          {lawyer.is_available !== false ? t('lawyers.available', 'Disponible') : t('lawyers.unavailable', 'Indisponible')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-secondary-600 gap-3">
                        <MapPin className="h-5 w-5 text-secondary-400" />
                        <span>
                          {lawyer.city || 'France'}
                          {lawyer.postal_code ? ` (${lawyer.postal_code.substring(0, 2)})` : ''}
                        </span>
                      </div>
                      
                      {bar && (
                        <div className="flex items-center text-secondary-600 gap-3">
                          <span className="text-secondary-400">🏛️</span>
                          <span>{t('lawyers.barreau_of', 'Barreau de')} {bar}</span>
                        </div>
                      )}

                      <div className="flex items-center text-secondary-600 gap-3">
                        <Mail className="h-5 w-5 text-secondary-400" />
                        <span>{lawyer.email}</span>
                      </div>
                    </div>

                    <p className="text-secondary-600 line-clamp-3 mb-8 min-h-18">
                      {lawyer.bio || t('lawyers.default_bio', "Professionnel dévoué au service du droit, spécialisé dans l'assistance et le conseil juridique pour les particuliers et les entreprises.")}
                    </p>

                    <div className="flex gap-2">
                      <Button className="flex-1 font-bold" onClick={() => navigate(`/dashboard/user?bookLawyerId=${lawyer.id}`)}>{t('lawyers.book_appointment', 'Prendre RDV')}</Button>
                      <Button variant="outline" className="px-4">
                        <Phone className="h-5 w-5" />
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
                  className="px-10 h-14 font-bold border-2"
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : null}
                  {t('lawyers.load_more', "Charger plus d'avocats")}
                </Button>
              </div>
            )}
            
            {filteredLawyers.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-secondary-200">
                <Users className="h-16 w-16 text-secondary-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-secondary-900">{t('lawyers.no_results')}</h3>
                <p className="text-secondary-600">{t('lawyers.no_results_hint', 'Essayez de modifier vos critères de recherche.')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="container mt-20">
        <div className="bg-primary-50 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-primary-100">
          <div>
            <h2 className="text-3xl font-bold text-primary-900 mb-4">{t('lawyers.cta_title', 'Vous êtes avocat ?')}</h2>
            <p className="text-lg text-primary-700">{t('lawyers.cta_subtitle', 'Rejoignez Law Just pour augmenter votre visibilité et gérer vos dossiers en ligne.')}</p>
          </div>
          <Button size="lg" className="px-10 h-16 text-xl shadow-lg shadow-primary-500/20" onClick={() => navigate('/register/lawyer')}>
            {t('lawyers.cta_btn', "S'inscrire comme Avocat")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LawyersPage;
