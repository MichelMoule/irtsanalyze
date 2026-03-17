import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
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
  sortable: boolean;
  align?: 'left' | 'center' | 'right';
}

export const ROW_GRID_CLASS = "grid grid-cols-[40px_minmax(200px,2.5fr)_minmax(140px,1.2fr)_minmax(140px,1.2fr)_minmax(140px,1.2fr)_60px] w-full items-center";

export const COLUMNS: ColumnConfig[] = [
  { key: 'select', label: '', sortable: false },
  { key: 'nom', label: 'CANDIDAT', sortable: true, align: 'left' },
  { key: 'cotationIAProposee', label: 'EVALUATION IA', sortable: true, align: 'left' },
  { key: 'statut', label: 'STATUT DOSSIER', sortable: true, align: 'left' },
  { key: 'dateValidation', label: 'DERNIERE ACTION', sortable: true, align: 'left' },
  { key: 'actions', label: 'ACTIONS', sortable: false, align: 'center' },
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
      return <ChevronsUpDown className="w-3 h-3 text-slate-300 flex-shrink-0" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary-500 flex-shrink-0" />
      : <ChevronDown className="w-3 h-3 text-primary-500 flex-shrink-0" />;
  };

  return (
    <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
      <div className={`${ROW_GRID_CLASS} px-5 h-11`}>
        {COLUMNS.map((column) => {
          if (column.key === 'select') {
            return (
              <div key="select" className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-primary-500 cursor-pointer"
                  aria-label="Selectionner tous les candidats"
                />
              </div>
            );
          }

          if (column.key === 'actions') {
            return (
              <div key="actions" className="flex items-center justify-center px-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {column.label}
                </span>
              </div>
            );
          }

          if (!column.sortable) {
            return (
              <div key={column.key} className="flex items-center px-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {column.label}
                </span>
              </div>
            );
          }

          const isActive = sortColumn === column.key;

          return (
            <button
              key={column.key}
              type="button"
              onClick={() => onSort(column.key as keyof Candidat)}
              className={`flex items-center gap-1 px-3 text-[11px] font-bold uppercase tracking-wider transition-colors
                         ${isActive ? 'text-primary-500' : 'text-slate-400 hover:text-slate-600'}`}
              aria-label={`Trier par ${column.label}`}
            >
              <span>{column.label}</span>
              <SortIcon column={column.key as keyof Candidat} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
