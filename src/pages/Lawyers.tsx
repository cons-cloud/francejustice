import React, { useEffect, useState } from 'react';
import { Users, Search, Phone, Mail, MapPin, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

interface LawyerProfile {
  id: string;
  specialties?: string[];
  specialty?: string; // fallback
  bio?: string;
  city?: string;
  office_phone?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    city?: string;
  };
}

const LawyersPage: React.FC = () => {
  const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    fetchLawyers(0, true);
    
    const lawyersSub = supabase
      .channel('public-lawyers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lawyers' }, () => {
        fetchLawyers(0, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
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
      .from('lawyers')
      .select('*, profiles!inner(*)')
      .eq('is_available', true)
      .eq('profiles.role', 'lawyer')
      .eq('profiles.is_verified', true)
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

  const filteredLawyers = lawyers.filter(l => 
    `${l.profiles?.first_name} ${l.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.specialties?.join(', ') || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-secondary-50 pb-20">
      <div className="bg-primary-900 text-white py-20 mb-12">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Trouvez un Avocat de Confiance</h1>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto mb-10">
            Notre annuaire regroupe uniquement des professionnels du droit français rigoureusement vérifiés par notre équipe.
          </p>
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 h-6 w-6 text-secondary-400" />
            <Input 
              className="pl-12 h-14 text-lg text-secondary-900 shadow-xl"
              placeholder="Rechercher par nom ou spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-secondary-600 font-medium">Chargement des profils...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLawyers.map((lawyer) => (
              <Card key={lawyer.id} hover className="border-none shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                <div className="h-4 bg-primary-600"></div>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold text-2xl uppercase">
                      {lawyer.profiles?.first_name?.[0]}{lawyer.profiles?.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                        Me. {lawyer.profiles?.first_name} {lawyer.profiles?.last_name}
                        <CheckCircle className="h-5 w-5 text-success-500" />
                      </h3>
                      <p className="text-primary-600 font-semibold">{lawyer.specialties?.[0] || 'Avocat au barreau'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center text-secondary-600 gap-3">
                      <MapPin className="h-5 w-5 text-secondary-400" />
                      <span>{lawyer.city || lawyer.profiles?.city || 'Paris, France'}</span>
                    </div>
                    <div className="flex items-center text-secondary-600 gap-3">
                      <Mail className="h-5 w-5 text-secondary-400" />
                      <span>{lawyer.profiles?.email}</span>
                    </div>
                  </div>

                  <p className="text-secondary-600 line-clamp-3 mb-8 min-h-[4.5rem]">
                    {lawyer.bio || "Professionnel dévoué au service du droit français, spécialisé dans l'assistance et le conseil juridique pour les particuliers et les entreprises."}
                  </p>

                  <div className="flex gap-2">
                    <Button className="flex-1 font-bold">Prendre RDV</Button>
                    <Button variant="outline" className="px-4">
                      <Phone className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
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
                  Charger plus d'avocats
                </Button>
              </div>
            )}
            
            {filteredLawyers.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-secondary-200">
                <Users className="h-16 w-16 text-secondary-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-secondary-900">Aucun avocat trouvé</h3>
                <p className="text-secondary-600">Essayez de modifier vos critères de recherche.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="container mt-20">
        <div className="bg-primary-50 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-primary-100">
          <div>
            <h2 className="text-3xl font-bold text-primary-900 mb-4">Vous êtes avocat ?</h2>
            <p className="text-lg text-primary-700">Rejoignez Law Just pour augmenter votre visibilité et gérer vos dossiers en ligne.</p>
          </div>
          <Button size="lg" className="px-10 h-16 text-xl shadow-lg shadow-primary-500/20">
            S'inscrire comme Avocat
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LawyersPage;


