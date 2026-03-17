import { useState, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore, useCandidats } from '@/store/appStore';

const STATUS_OPTIONS = [
  { value: '',              label: 'Tous les statuts' },
  { value: 'importe',       label: 'Importes' },
  { value: 'en_analyse_ia', label: 'En analyse' },
  { value: 'analyse',       label: 'Analyses' },
  { value: 'en_relecture',  label: 'En relecture' },
  { value: 'valide',        label: 'Valides' },
  { value: 'rejete',        label: 'Rejetes' },
  { value: 'liste_attente', label: 'Liste d\'attente' },
];

const FILIERE_OPTIONS = [
  { value: '', label: 'Toutes les filieres' },
  { value: 'ES', label: 'ES — Educateur Specialise' },
  { value: 'EJE', label: 'EJE — Educateur Jeunes Enfants' },
  { value: 'ASS', label: 'ASS — Assistant Service Social' },
];

export function FilterBar() {
  const { filtres, setFiltres } = useAppStore();
  const allCandidats = useCandidats();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Dynamic série bac options from actual data
  const seriesBac = useMemo(() => {
    const set = new Set<string>();
    allCandidats.forEach(c => { if (c.serieBac) set.add(c.serieBac); });
    return Array.from(set).sort();
  }, [allCandidats]);

  const activeFiltersCount = [
    filtres.statuts.length > 0,
    !!filtres.filiere,
    !!filtres.serieBac,
    filtres.scoreMin != null,
    filtres.scoreMax != null,
    filtres.alertesUniquement,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFiltres({
      recherche: '',
      statuts: [],
      alertesUniquement: false,
      filiere: undefined,
      serieBac: undefined,
      scoreMin: undefined,
      scoreMax: undefined,
      campagneId: undefined,
    });
    setShowAdvanced(false);
  };

  const selectClasses = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#314ace] focus:ring-1 focus:ring-[#314ace]/20 transition-colors';
  const labelClasses = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filtres.recherche}
            onChange={(e) => setFiltres({ recherche: e.target.value })}
            placeholder="Nom, prenom, INE, etablissement..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#314ace] focus:ring-1 focus:ring-[#314ace]/20 transition-colors"
          />
        </div>

        {/* Status quick filter */}
        <div className="relative">
          <select
            title="Filtrer par statut"
            value={filtres.statuts.length === 1 ? filtres.statuts[0] : ''}
            onChange={(e) => setFiltres({ statuts: e.target.value ? [e.target.value] : [] })}
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-lg appearance-none pr-8 cursor-pointer focus:outline-none focus:border-[#314ace] transition-colors"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            showAdvanced || activeFiltersCount > 0
              ? 'bg-[#314ace] text-white border-[#314ace]'
              : 'text-slate-600 bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="w-4.5 h-4.5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center ml-0.5">
              {activeFiltersCount}
            </span>
          )}
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Clear all */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            Effacer tout
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Filière */}
          <div>
            <label className={labelClasses}>Filiere</label>
            <select
              title="Filtrer par filiere"
              value={filtres.filiere || ''}
              onChange={(e) => setFiltres({ filiere: e.target.value || undefined })}
              className={selectClasses}
            >
              {FILIERE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Série bac */}
          <div>
            <label className={labelClasses}>Serie bac</label>
            <select
              title="Filtrer par serie bac"
              value={filtres.serieBac || ''}
              onChange={(e) => setFiltres({ serieBac: e.target.value || undefined })}
              className={selectClasses}
            >
              <option value="">Toutes les series</option>
              {seriesBac.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Score IA min */}
          <div>
            <label className={labelClasses}>Score IA min</label>
            <input
              type="number"
              min="0"
              max="8"
              step="0.5"
              value={filtres.scoreMin ?? ''}
              onChange={(e) => setFiltres({ scoreMin: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
              className={selectClasses}
            />
          </div>

          {/* Score IA max */}
          <div>
            <label className={labelClasses}>Score IA max</label>
            <input
              type="number"
              min="0"
              max="8"
              step="0.5"
              value={filtres.scoreMax ?? ''}
              onChange={(e) => setFiltres({ scoreMax: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="8"
              className={selectClasses}
            />
          </div>

          {/* Alertes only */}
          <div className="col-span-2 md:col-span-4 flex items-center gap-3 pt-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filtres.alertesUniquement}
                onChange={(e) => setFiltres({ alertesUniquement: e.target.checked })}
                className="sr-only peer"
                title="Alertes uniquement"
              />
              <div className="w-8 h-[18px] bg-slate-200 rounded-full peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-3.5 transition-colors" />
            </label>
            <span className="text-sm text-slate-600">Afficher uniquement les dossiers avec alertes</span>
          </div>
        </div>
      )}
    </div>
  );
}
