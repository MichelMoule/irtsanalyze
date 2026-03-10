import { useState, useMemo } from 'react';
import { Candidat } from '@/types';
import { TableHeader, SortColumn, SortDirection } from './TableHeader';
import { TableRow } from './TableRow';
import { Users } from 'lucide-react';

interface DataTableProps {
  candidats: Candidat[];
  selectedIds: string[];
  onSelectCandidat: (id: string) => void;
  onSelectAll: () => void;
  onCandidatClick: (candidat: Candidat) => void;
  isLoading?: boolean;
}

export function DataTable({
  candidats,
  selectedIds,
  onSelectCandidat,
  onSelectAll,
  onCandidatClick,
  isLoading = false,
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: keyof Candidat) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedCandidats = useMemo(() => {
    if (!sortColumn) return candidats;

    return [...candidats].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'fr', { sensitivity: 'base' });
      } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
        comparison = aValue.length - bValue.length;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [candidats, sortColumn, sortDirection]);

  if (isLoading) {
    return (
      <div className="bg-white border border-shine-border rounded-xl overflow-hidden">
        <TableHeader
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectedCount={0}
          totalCount={0}
          onSelectAll={() => {}}
        />
        <div className="divide-y divide-shine-border-light">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="flex items-center h-14 px-6 animate-pulse">
              <div className="w-12 flex items-center justify-center"><div className="w-4 h-4 bg-slate-100 rounded" /></div>
              <div className="w-48 px-2 flex items-center gap-2.5"><div className="w-7 h-7 bg-slate-100 rounded-full" /><div className="h-4 bg-slate-100 rounded w-24" /></div>
              <div className="w-28 px-2"><div className="h-4 bg-slate-100 rounded w-16" /></div>
              <div className="w-28 px-2"><div className="h-5 bg-slate-100 rounded-full w-14" /></div>
              <div className="w-20 px-2"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></div>
              <div className="w-20 px-2"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></div>
              <div className="w-20 px-2"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></div>
              <div className="w-20 px-2"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></div>
              <div className="w-20 px-2"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></div>
              <div className="w-48 px-2"><div className="h-4 bg-slate-100 rounded w-full" /></div>
              <div className="w-24 px-2"><div className="h-5 bg-slate-100 rounded-full w-14" /></div>
              <div className="w-20 px-2"><div className="h-4 bg-slate-100 rounded w-8" /></div>
              <div className="w-28 px-2"><div className="h-5 bg-slate-100 rounded-full w-16" /></div>
              <div className="w-24 px-2"><div className="h-7 bg-slate-100 rounded w-14" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortedCandidats.length === 0) {
    return (
      <div className="bg-white border border-shine-border rounded-xl overflow-hidden">
        <TableHeader
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectedCount={0}
          totalCount={0}
          onSelectAll={() => {}}
        />
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-shine-text-tertiary" />
          </div>
          <h3 className="text-base font-semibold text-shine-text-primary mb-1">
            Aucun candidat trouve
          </h3>
          <p className="text-sm text-shine-text-secondary text-center">
            Essayez de modifier vos filtres de recherche ou d'importer des candidats
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-shine-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          <TableHeader
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            selectedCount={selectedIds.length}
            totalCount={sortedCandidats.length}
            onSelectAll={onSelectAll}
          />

          <div className="max-h-[calc(100vh-340px)] overflow-y-auto">
            {sortedCandidats.map((candidat, index) => (
              <TableRow
                key={candidat.id}
                candidat={candidat}
                isSelected={selectedIds.includes(candidat.id)}
                onSelect={() => onSelectCandidat(candidat.id)}
                onClick={() => onCandidatClick(candidat)}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-shine-border px-6 py-3 bg-shine-bg">
        <div className="flex items-center justify-between text-sm text-shine-text-secondary">
          <span>
            {sortedCandidats.length} candidat{sortedCandidats.length > 1 ? 's' : ''}
          </span>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="font-medium text-primary-500">
                {selectedIds.length} selectionne{selectedIds.length > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAll();
                }}
                className="text-xs font-medium text-shine-text-secondary hover:text-primary-500 underline transition-colors"
              >
                Tout deselectionner
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
