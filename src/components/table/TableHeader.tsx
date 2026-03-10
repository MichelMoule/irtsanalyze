import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Candidat } from '@/types';

export type SortColumn = keyof Candidat | null;
export type SortDirection = 'asc' | 'desc';

interface TableHeaderProps {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: keyof Candidat) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
}

interface ColumnConfig {
  key: keyof Candidat | 'select' | 'actions';
  label: string;
  width: string;
  sortable: boolean;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'select', label: '', width: 'w-12', sortable: false },
  { key: 'nom', label: 'Nom complet', width: 'w-48', sortable: true },
  { key: 'numeroDossier', label: 'N° Dossier', width: 'w-28', sortable: true },
  { key: 'serieBac', label: 'Bac / Diplôme', width: 'w-28', sortable: true },
  { key: 'statutDemande', label: 'Statut', width: 'w-20', sortable: true },
  { key: 'procedureAdmission', label: 'Procédure', width: 'w-28', sortable: true },
  { key: 'moyenneGenerale', label: 'Moy. Gén.', width: 'w-20', sortable: true },
  { key: 'noteParcoursScolaire', label: 'Parcours /3', width: 'w-24', sortable: true },
  { key: 'noteExperiences', label: 'Expér. /3', width: 'w-24', sortable: true },
  { key: 'noteMotivation', label: 'Motiv. /2', width: 'w-24', sortable: true },
  { key: 'cotationIAProposee', label: 'Total IA /8', width: 'w-24', sortable: true },
  { key: 'alertes', label: 'Alertes', width: 'w-20', sortable: false },
  { key: 'statut', label: 'État', width: 'w-28', sortable: true },
  { key: 'actions', label: 'Actions', width: 'w-24', sortable: false },
];

export function TableHeader({
  sortColumn,
  sortDirection,
  onSort,
  selectedCount,
  totalCount,
  onSelectAll,
}: TableHeaderProps) {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const SortIcon = ({ column }: { column: keyof Candidat }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-shine-text-tertiary" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-primary-500" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary-500" />
    );
  };

  return (
    <div className="sticky top-0 z-20 bg-shine-bg border-b border-shine-border">
      <div className="flex items-center h-11 px-6 text-xs font-medium text-shine-text-tertiary uppercase tracking-wider">
        {COLUMNS.map((column) => {
          if (column.key === 'select') {
            return (
              <div key={column.key} className={`${column.width} flex items-center justify-center`}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-shine-border text-primary-500 focus:ring-1 focus:ring-primary-500/30 cursor-pointer"
                  aria-label="Sélectionner tous les candidats"
                />
              </div>
            );
          }

          if (!column.sortable) {
            return (
              <div key={column.key} className={`${column.width} flex items-center px-2`}>
                {column.label}
              </div>
            );
          }

          return (
            <button
              key={column.key}
              type="button"
              onClick={() => onSort(column.key as keyof Candidat)}
              className={`${column.width} flex items-center gap-1 px-2 hover:text-shine-text-primary transition-colors`}
              aria-label={`Trier par ${column.label}`}
            >
              <span className="truncate">{column.label}</span>
              <SortIcon column={column.key as keyof Candidat} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { COLUMNS };
