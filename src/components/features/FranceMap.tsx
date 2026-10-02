import React, { useState, useMemo } from 'react';
import { MapPin, Building2, Search, Globe, X, Shield, Sparkles, Award } from 'lucide-react';
import { CourtsAnnuaireModal } from './CourtsAnnuaireModal';
import { ALL_BARREAUX_FRANCE, type BarreauData } from '../../data/allBarreauxFrance';
import { matchBarreau } from '../../lib/avocatsDataGouvSync';
import carteGif from '../../assets/images/carte.gif';

export type { BarreauData };
export const barreauxList: BarreauData[] = ALL_BARREAUX_FRANCE;

export interface FranceMapProps {
  onSelectRegion?: (regionName: string | null) => void;
  selectedRegion?: string | null;
  onSelectBarreau?: (barreauName: string | null) => void;
  selectedBarreau?: string | null;
  lawyerCounts?: Record<string, number>;
}

export interface RegionData {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
  departments: string[];
  isOverseas?: boolean;
}

// 18 French Regions (13 Metropolitan + 5 DROM + 2 COM)
export const regions: RegionData[] = [
  { id: 'HDF', name: 'Hauts-de-France', labelX: 52, labelY: 12, departments: ['59', '62', '02', '60', '80'] },
  { id: 'NOR', name: 'Normandie', labelX: 34, labelY: 20, departments: ['14', '27', '50', '76', '61'] },
  { id: 'IDF', name: 'Île-de-France', labelX: 50, labelY: 28, departments: ['75', '77', '78', '91', '92', '93', '94', '95'] },
  { id: 'GES', name: 'Grand Est', labelX: 72, labelY: 24, departments: ['67', '68', '08', '10', '51', '52', '54', '55', '57', '88'] },
  { id: 'BRE', name: 'Bretagne', labelX: 14, labelY: 30, departments: ['22', '29', '35', '56'] },
  { id: 'PDL', name: 'Pays de la Loire', labelX: 28, labelY: 38, departments: ['44', '49', '53', '72', '85'] },
  { id: 'CVL', name: 'Centre-Val de Loire', labelX: 42, labelY: 40, departments: ['18', '28', '36', '37', '41', '45'] },
  { id: 'BFC', name: 'Bourgogne-Franche-Comté', labelX: 65, labelY: 42, departments: ['21', '25', '39', '58', '70', '71', '89', '90'] },
  { id: 'ARA', name: 'Auvergne-Rhône-Alpes', labelX: 64, labelY: 62, departments: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'] },
  { id: 'NAQ', name: 'Nouvelle-Aquitaine', labelX: 30, labelY: 64, departments: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'] },
  { id: 'OCC', name: 'Occitanie', labelX: 44, labelY: 82, departments: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'] },
  { id: 'PAC', name: "Provence-Alpes-Côte d'Azur", labelX: 74, labelY: 78, departments: ['04', '05', '06', '13', '83', '84'] },
  { id: 'COR', name: 'Corse', labelX: 92, labelY: 85, departments: ['2A', '2B'] },
  // Outre-Mer (DROM-COM)
  { id: 'GLP', name: 'Guadeloupe', labelX: 0, labelY: 0, departments: ['971'], isOverseas: true },
  { id: 'MTQ', name: 'Martinique', labelX: 0, labelY: 0, departments: ['972'], isOverseas: true },
  { id: 'GUY', name: 'Guyane', labelX: 0, labelY: 0, departments: ['973'], isOverseas: true },
  { id: 'REU', name: 'La Réunion', labelX: 0, labelY: 0, departments: ['974'], isOverseas: true },
  { id: 'MAY', name: 'Mayotte', labelX: 0, labelY: 0, departments: ['976'], isOverseas: true },
  { id: 'NCL', name: 'Nouvelle-Calédonie', labelX: 0, labelY: 0, departments: ['988'], isOverseas: true },
  { id: 'PYF', name: 'Polynésie Française', labelX: 0, labelY: 0, departments: ['987'], isOverseas: true },
];

export const FranceMap: React.FC<FranceMapProps> = ({
  onSelectRegion,
  selectedRegion = null,
  onSelectBarreau,
  selectedBarreau = null,
  lawyerCounts = {}
}) => {
  const [viewMode, setViewMode] = useState<'regions' | 'barreaux'>('barreaux');
  const [hoveredItem, setHoveredItem] = useState<{ type: 'region' | 'barreau'; name: string; extra?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [annuaireOpen, setAnnuaireOpen] = useState(false);
  const [modalSearchFilter, setModalSearchFilter] = useState('');

  // Real official census counts for all 164 barreaux
  const defaultLawyerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_BARREAUX_FRANCE.forEach(b => {
      counts[b.name] = b.count;
      counts[b.shortName] = b.count;
      counts[b.rawNom] = b.count;
      counts[b.region] = (counts[b.region] || 0) + b.count;
    });
    return counts;
  }, []);

  const activeLawyerCounts = useMemo(() => {
    const merged = { ...defaultLawyerCounts };
    if (lawyerCounts && Object.keys(lawyerCounts).length > 0) {
      Object.entries(lawyerCounts).forEach(([k, v]) => {
        if (v > 0) merged[k] = v;
      });
    }
    return merged;
  }, [lawyerCounts, defaultLawyerCounts]);

  const handleRegionClick = (regionName: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedRegion === regionName) {
      if (onSelectRegion) onSelectRegion(null);
    } else {
      if (onSelectRegion) onSelectRegion(regionName);
    }
  };

  const handleBarreauClick = (barreau: BarreauData, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isAlreadySelected = selectedBarreau && (
      selectedBarreau === barreau.name ||
      selectedBarreau === barreau.shortName ||
      selectedBarreau === barreau.rawNom ||
      matchBarreau(selectedBarreau, barreau.name)
    );

    if (isAlreadySelected) {
      if (onSelectBarreau) onSelectBarreau(null);
    } else {
      if (onSelectBarreau) onSelectBarreau(barreau.name);
      if (onSelectRegion && barreau.region) onSelectRegion(barreau.region);
    }
  };

  // Filtered barreaux for right list and search
  const filteredBarreaux = useMemo(() => {
    let list = ALL_BARREAUX_FRANCE;
    if (selectedRegion) {
      list = list.filter(b => b.region === selectedRegion);
    }
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase().trim();
    return list.filter(
      b => b.name.toLowerCase().includes(query) ||
           b.shortName.toLowerCase().includes(query) ||
           b.region.toLowerCase().includes(query) ||
           b.courDAppel.toLowerCase().includes(query)
    );
  }, [searchQuery, selectedRegion]);

  // Barreaux displayed as pins on the map
  const visibleMapPins = useMemo(() => {
    const nonOverseas = ALL_BARREAUX_FRANCE.filter(b => !b.isOverseas);
    if (selectedRegion) {
      return nonOverseas.filter(b => b.region === selectedRegion);
    }
    // Default view: prominent barreaux (all large + key regional prefectures)
    return nonOverseas.filter(b => b.count >= 200 || ['PARIS', 'LYON', 'MARSEILLE', 'BORDEAUX', 'TOULOUSE', 'LILLE', 'NANTES', 'STRASBOURG', 'RENNES', 'MONTPELLIER', 'NICE', 'ROUEN', 'DIJON', 'GRENOBLE', 'ORLEANS', 'POITIERS', 'CAEN', 'AMIENS', 'REIMS', 'METZ', 'BESANCON', 'LIMOGES', 'AJACCIO', 'BASTIA'].includes(b.rawNom));
  }, [selectedRegion]);

  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return regions;
    const query = searchQuery.toLowerCase().trim();
    return regions.filter(r => r.name.toLowerCase().includes(query));
  }, [searchQuery]);

  const overseasBarreaux = useMemo(() => ALL_BARREAUX_FRANCE.filter(b => b.isOverseas), []);

  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6 border border-slate-200 shadow-xl relative flex flex-col gap-6 overflow-hidden">
      {/* Background subtle accents */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-cyan-100/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 rounded-full bg-teal-100/30 blur-3xl pointer-events-none" />

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 z-10 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Globe className="h-6 w-6 text-cyan-600 animate-pulse" />
            Carte Officielle de France (L'Hexagone & Outre-Mer)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Carte géographique réelle et réseau national des 36 Barreaux & Cours d'Appel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setModalSearchFilter('');
              setAnnuaireOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-all shadow-2xs"
          >
            <Award className="h-3.5 w-3.5 text-amber-600" />
            36 Premiers Présidents
          </button>

          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('barreaux')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'barreaux'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Barreaux
            </button>
            <button
              onClick={() => setViewMode('regions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'regions'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Régions
            </button>
          </div>
        </div>
      </div>

      {/* Search & Active Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 z-10">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un Barreau ou une Cour d'Appel (ex: Paris, Lyon, Guadeloupe)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(selectedRegion || selectedBarreau) && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSelectRegion) onSelectRegion(null);
                if (onSelectBarreau) onSelectBarreau(null);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser ({selectedBarreau || selectedRegion})
            </button>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10">
        
        {/* Authentic Image Map of France Container */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-200 relative min-h-[460px] overflow-hidden">
          
          {/* Tooltip Overlay */}
          {hoveredItem && (
            <div className="absolute top-4 left-4 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-200 text-xs shadow-xl animate-fade-in pointer-events-none">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-cyan-600" />
                <span>{hoveredItem.name}</span>
              </div>
              {hoveredItem.extra && <div className="text-[10px] text-slate-500 mt-0.5">{hoveredItem.extra}</div>}
              <div className="text-[11px] text-cyan-700 font-bold mt-1">
                👥 Avocats : {activeLawyerCounts[hoveredItem.name] || activeLawyerCounts[hoveredItem.name.replace('Barreau de ', '')] || 5}
              </div>
            </div>
          )}

          {/* Authentic Map Image & Interactive Overlays */}
          <div className="relative w-full max-w-[500px] aspect-[4/3] flex items-center justify-center">
            {/* Real Map Image from assets */}
            <img
              src={carteGif}
              alt="Carte Officielle de France"
              className="w-full h-full object-contain rounded-xl filter drop-shadow-md brightness-105 contrast-105"
            />

            {/* Region Interactive Badges Overlay (when viewMode === 'regions') */}
            {viewMode === 'regions' && regions.filter(r => !r.isOverseas).map((region) => {
              const isSelected = selectedRegion === region.name;
              const isHovered = hoveredItem?.type === 'region' && hoveredItem?.name === region.name;

              return (
                <button
                  key={region.id}
                  onClick={(e) => handleRegionClick(region.name, e)}
                  onMouseEnter={() => setHoveredItem({ type: 'region', name: region.name, extra: `Région (${region.departments.length} dépts)` })}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{ left: `${region.labelX}%`, top: `${region.labelY}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-black transition-all z-20 shadow-md border ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-700 scale-110 ring-2 ring-cyan-400'
                      : isHovered
                      ? 'bg-cyan-500 text-white border-cyan-300 scale-105'
                      : 'bg-white/95 text-slate-800 border-slate-300 hover:bg-cyan-600 hover:text-white'
                  }`}
                >
                  <span className="font-extrabold">{region.name}</span>
                </button>
              );
            })}

            {/* Barreaux Pinpoints & Labels (when viewMode === 'barreaux') */}
            {viewMode === 'barreaux' && visibleMapPins.map((barreau) => {
              const isSelected = selectedBarreau && (
                selectedBarreau === barreau.name ||
                selectedBarreau === barreau.shortName ||
                selectedBarreau === barreau.rawNom ||
                matchBarreau(selectedBarreau, barreau.name)
              );
              const isHovered = hoveredItem?.type === 'barreau' && hoveredItem?.name === barreau.name;
              const count = activeLawyerCounts[barreau.name] || activeLawyerCounts[barreau.shortName] || barreau.count;

              return (
                <button
                  key={barreau.id}
                  onClick={(e) => handleBarreauClick(barreau, e)}
                  onMouseEnter={() => setHoveredItem({ type: 'barreau', name: barreau.name, extra: `${barreau.courDAppel} • ${barreau.region}` })}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{ left: `${barreau.cx}%`, top: `${barreau.cy}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform duration-200 flex flex-col items-center gap-0.5 ${
                    isSelected ? 'scale-125 z-30' : isHovered ? 'scale-110 z-30' : 'hover:scale-110'
                  }`}
                >
                  <span className="relative flex items-center justify-center">
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md ${
                        isSelected ? 'bg-amber-500 ring-2 ring-amber-300' : count > 0 ? 'bg-teal-500' : 'bg-cyan-500'
                      }`}
                    />
                    {isSelected && (
                      <span className="absolute w-6 h-6 rounded-full border-2 border-amber-500 animate-ping opacity-75" />
                    )}
                  </span>

                  {/* Text Badge under the pinpoint dot */}
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold whitespace-nowrap border shadow-sm transition-all ${
                    isSelected
                      ? 'bg-cyan-700 text-white border-cyan-800 font-black'
                      : isHovered
                      ? 'bg-cyan-600 text-white border-cyan-700'
                      : 'bg-white/95 text-slate-800 border-slate-300'
                  }`}>
                    {barreau.shortName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map Subtitle Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-[10px] text-slate-600 z-10 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block shadow-xs" />
              <span>Avocats Inscrits</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block shadow-xs" />
              <span>Barreau Actif</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs" />
              <span>Sélectionné</span>
            </span>
          </div>
        </div>

        {/* Right Sidebar: Barreaux & Regions Directory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-cyan-600" />
              <span>
                {viewMode === 'barreaux' ? `Barreaux (${filteredBarreaux.length})` : `Régions (${filteredRegions.length})`}
              </span>
            </h4>
            {(searchQuery || selectedRegion) && (
              <span className="text-[10px] text-cyan-700 font-semibold">
                {selectedRegion ? `Région : ${selectedRegion}` : 'Filtre actif'}
              </span>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {viewMode === 'barreaux' ? (
              filteredBarreaux.map((barreau) => {
                const count = activeLawyerCounts[barreau.name] || activeLawyerCounts[barreau.shortName] || barreau.count;
                const isSelected = selectedBarreau && (
                  selectedBarreau === barreau.name ||
                  selectedBarreau === barreau.shortName ||
                  selectedBarreau === barreau.rawNom ||
                  matchBarreau(selectedBarreau, barreau.name)
                );

                return (
                  <button
                    key={barreau.id}
                    onClick={(e) => handleBarreauClick(barreau, e)}
                    onMouseEnter={() => setHoveredItem({ type: 'barreau', name: barreau.name, extra: barreau.courDAppel })}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-cyan-50 hover:text-cyan-900 hover:border-cyan-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0 text-cyan-600" />
                        <span className="truncate">{barreau.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{barreau.courDAppel}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 font-extrabold ${
                      isSelected ? 'bg-white text-cyan-900' : count > 0 ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count} {count > 1 ? 'avocats' : 'avocat'}
                    </span>
                  </button>
                );
              })
            ) : (
              filteredRegions.map((region) => {
                const count = activeLawyerCounts[region.name] || 15;
                const isSelected = selectedRegion === region.name;

                return (
                  <button
                    key={region.id}
                    onClick={(e) => handleRegionClick(region.name, e)}
                    onMouseEnter={() => setHoveredItem({ type: 'region', name: region.name })}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-cyan-50 hover:text-cyan-900 hover:border-cyan-300'
                    }`}
                  >
                    <span className="truncate font-bold">{region.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 font-extrabold ${
                      isSelected ? 'bg-white text-cyan-900' : count > 0 ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count} {count > 1 ? 'avocats' : 'avocat'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Outre-Mer Panel (DROM-COM: Guadeloupe, Martinique, Guyane, La Réunion, Mayotte, etc.) */}
      <div className="z-10 border-t border-slate-200 pt-4 mt-2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-extrabold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
            Outre-Mer (DROM-COM & Territoires)
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            7 Barreaux Régionaux
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {overseasBarreaux.map((barreau) => {
            const count = activeLawyerCounts[barreau.name] || activeLawyerCounts[barreau.shortName] || barreau.count;
            const isSelected = (selectedBarreau && (
              selectedBarreau === barreau.name ||
              selectedBarreau === barreau.shortName ||
              selectedBarreau === barreau.rawNom ||
              matchBarreau(selectedBarreau, barreau.name)
            )) || selectedRegion === barreau.region;

            return (
              <button
                key={barreau.id}
                onClick={(e) => handleBarreauClick(barreau, e)}
                className={`p-2 rounded-xl text-center text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-md scale-105'
                    : 'bg-slate-50 hover:bg-cyan-50 text-slate-700 border-slate-200 hover:border-cyan-300'
                }`}
              >
                <span className="text-[11px] truncate w-full font-extrabold">{barreau.shortName}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-cyan-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count} avocats
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <CourtsAnnuaireModal
        isOpen={annuaireOpen}
        onClose={() => setAnnuaireOpen(false)}
        initialSearch={modalSearchFilter}
      />

    </div>
  );
};
