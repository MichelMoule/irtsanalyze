import { Search, X } from 'lucide-react';
import { useAppStore, useStatistiques } from '@/store/appStore';

export function FilterBar() {
  const { filtres, setFiltres } = useAppStore();
  const stats = useStatistiques();

  const handleRechercheChange = (value: string) => {
    setFiltres({ recherche: value });
  };

  const handleStatutSelect = (statut: string | null) => {
    if (statut === null) {
      setFiltres({ statuts: [] });
    } else {
      setFiltres({ statuts: [statut] });
    }
  };

  const activeStatut = filtres.statuts.length === 1 ? filtres.statuts[0] : null;
  const isAllActive = filtres.statuts.length === 0;

  const TABS = [
    { value: null, label: 'Tous', count: stats.total },
    { value: 'importe', label: 'Importes', count: stats.importe },
    { value: 'en_analyse_ia', label: 'En analyse', count: stats.enAnalyse },
    { value: 'analyse', label: 'Analyses', count: stats.analyse },
    { value: 'en_relecture', label: 'En relecture', count: stats.enRelecture },
    { value: 'valide', label: 'Valides', count: stats.valide },
  ];

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shine-text-tertiary" />
        <input
          type="text"
          value={filtres.recherche}
          onChange={(e) => handleRechercheChange(e.target.value)}
          placeholder="Rechercher par nom, prenom ou numero de dossier..."
          className="input pl-10"
        />
        {filtres.recherche && (
          <button
            onClick={() => handleRechercheChange('')}
            title="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-shine-text-tertiary hover:text-shine-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {TABS.map((tab) => {
          const isActive = tab.value === null ? isAllActive : activeStatut === tab.value;
          return (
            <button
              key={tab.value ?? 'all'}
              onClick={() => handleStatutSelect(tab.value)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150
                ${isActive
                  ? 'bg-primary-500 text-white'
                  : 'bg-shine-hover-bg text-shine-text-secondary hover:text-shine-text-primary'
                }
              `}
            >
              {tab.label}
              <span className={`ml-1.5 ${isActive ? 'text-white/70' : 'text-shine-text-tertiary'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
