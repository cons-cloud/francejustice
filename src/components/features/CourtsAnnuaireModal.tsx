import React, { useState, useMemo, useEffect } from 'react';
import { Building2, UserCheck, Mail, Phone, MapPin, Search, X, Award, Briefcase, GraduationCap } from 'lucide-react';
import { COURS_D_APPEL_LIST } from '../../lib/jurisdictions';
import { ANNUAIRE_AVOCATS_FRANCE_DATA } from '../../data/annuaireAvocatsFrance';
import { useTranslation } from '../../i18n';

interface CourtsAnnuaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearch?: string;
}

export const CourtsAnnuaireModal: React.FC<CourtsAnnuaireModalProps> = ({ isOpen, onClose, initialSearch = '' }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState(initialSearch);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const filteredCourts = useMemo(() => {
    return COURS_D_APPEL_LIST.filter(court => {
      if (court.type === 'CSM') return false; // filter out CSM to keep exactly 36 Cours d'Appel
      if (selectedRegion !== 'all' && court.region !== selectedRegion) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        court.name.toLowerCase().includes(q) ||
        court.premierPresident.toLowerCase().includes(q) ||
        court.procureurGeneral.toLowerCase().includes(q) ||
        court.ville.toLowerCase().includes(q) ||
        court.region.toLowerCase().includes(q)
      );
    });
  }, [search, selectedRegion]);

  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(COURS_D_APPEL_LIST.filter(c => c.type !== 'CSM').map(c => c.region))).sort();
  }, []);

  // Map court city to lawyers from official dataset
  const lawyersByCourt = useMemo(() => {
    const map: Record<string, typeof ANNUAIRE_AVOCATS_FRANCE_DATA> = {};
    ANNUAIRE_AVOCATS_FRANCE_DATA.forEach(av => {
      const barreau = av.NomBarreau || 'Paris';
      if (!map[barreau]) map[barreau] = [];
      map[barreau].push(av);
    });
    return map;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                Haute Magistrature & Avocats de France
              </span>
              <span className="bg-cyan-50 text-cyan-800 text-xs font-bold px-3 py-1 rounded-full border border-cyan-200">
                36 Cours d'Appel & Barreaux Synchronisés
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
              <Building2 className="h-6 w-6 text-cyan-600" />
              Annuaire des 36 Premiers Présidents & Avocats du Barreau
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('database.search_courts', "Rechercher par nom de Premier Président, Cour d'Appel, Barreau ou Ville...")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-xs"
          >
            <option value="all">Toutes les régions ({COURS_D_APPEL_LIST.filter(c => c.type !== 'CSM').length})</option>
            {uniqueRegions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Grid List of 36 Cours d'Appel & Associated Lawyers */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 scrollbar-thin bg-slate-50/40">
          {filteredCourts.map((court, idx) => {
            const barKey = court.ville || court.name.replace("Cour d'Appel de ", "");
            const lawyersList = lawyersByCourt[barKey] || lawyersByCourt[court.ville] || lawyersByCourt['Paris'] || [];

            return (
              <div
                key={court.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-cyan-400 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200">
                        N° {idx + 1} • Dept {court.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors mt-1">
                        {court.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {court.region}
                    </span>
                  </div>

                  {/* Premier Président Box */}
                  <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-3 my-2.5 space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-cyan-600" />
                      Premier Président de la Cour d'Appel
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {court.premierPresident}
                    </div>
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-cyan-200/60">
                      <span className="text-slate-500 font-semibold">Procureur Général :</span> {court.procureurGeneral}
                    </div>
                  </div>

                  {/* Registered Lawyers List Preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-2.5 space-y-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-cyan-600" />
                        Avocats inscrits au Barreau
                      </span>
                      <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-full font-bold">
                        {lawyersList.length} avocats
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 text-xs">
                      {lawyersList.map((av, avIdx) => (
                        <div key={avIdx} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                          <div>
                            <div className="font-bold text-slate-900">
                              Me {av.avPrenom} {av.avNom}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {av.spLibelle1 || 'Droit général'} • {av.cbVille}
                            </div>
                          </div>
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {av.phone || 'Contact direct'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location & Details */}
                  <div className="space-y-1 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                      <span className="truncate">{court.adresse || court.ville}</span>
                    </div>
                    {court.telephone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{court.telephone}</span>
                      </div>
                    )}
                    {court.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{court.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>
            Affichage de <strong className="text-slate-900">{filteredCourts.length}</strong> sur <strong className="text-slate-900">36 Cours d'Appel & Barreaux</strong> de France
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-600/20"
          >
            Fermer l'Annuaire
          </button>
        </div>

      </div>
    </div>
  );
};
