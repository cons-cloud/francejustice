import React, { useState, useMemo } from 'react';
import { Building2, UserCheck, Mail, Phone, MapPin, Search, X, Award } from 'lucide-react';
import { COURS_D_APPEL_LIST } from '../../lib/jurisdictions';

interface CourtsAnnuaireModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CourtsAnnuaireModal: React.FC<CourtsAnnuaireModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-400" />
                Haute Magistrature de France
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30">
                36 Cours d&apos;Appel Synchronisées
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-2 flex items-center gap-2.5">
              <Building2 className="h-6 w-6 text-indigo-400" />
              Annuaire Officiel des 36 Premiers Présidents de la Cour d&apos;Appel
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de Premier Président, Cour d'Appel ou Ville..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Toutes les régions ({COURS_D_APPEL_LIST.filter(c => c.type !== 'CSM').length})</option>
            {uniqueRegions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Grid List of 36 Cours d'Appel */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 scrollbar-thin">
          {filteredCourts.map((court, idx) => (
            <div
              key={court.id}
              className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      N° {idx + 1} • Dept {court.code}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mt-1">
                      {court.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
                    {court.region}
                  </span>
                </div>

                {/* Premier Président Box */}
                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 my-2.5 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                    Premier Président de la Cour d'Appel
                  </div>
                  <div className="text-sm font-black text-white">
                    {court.premierPresident}
                  </div>
                  <div className="text-[11px] text-slate-300 pt-1 border-t border-indigo-500/10">
                    <span className="text-slate-400 font-semibold">Procureur Général :</span> {court.procureurGeneral}
                  </div>
                </div>

                {/* Location & Details */}
                <div className="space-y-1 text-xs text-slate-400 mt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{court.adresse || court.ville}</span>
                  </div>
                  {court.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{court.telephone}</span>
                    </div>
                  )}
                  {court.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{court.email}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Affichage de <strong className="text-white">{filteredCourts.length}</strong> sur <strong className="text-white">36 Cours d'Appel</strong> de France
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md"
          >
            Fermer l'Annuaire
          </button>
        </div>

      </div>
    </div>
  );
};
