import { useState, useMemo } from 'react';
import { Candidat } from '@/types';
import { TableHeader, SortColumn, SortDirection, ROW_GRID_CLASS } from './TableHeader';
import { TableRow } from './TableRow';
import { Users, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  candidats: Candidat[];
  selectedIds: string[];
  onSelectCandidat: (id: string) => void;
  onSelectAll: () => void;
  onCandidatClick: (candidat: Candidat) => void;
  isLoading?: boolean;
  totalLabel?: string;
}

const PAGE_SIZE = 10;

function SkeletonRow() {
  return (
    <div className={`${ROW_GRID_CLASS} min-h-[64px] py-2.5 px-5 border-b border-gray-100 animate-pulse`}>
      <div className="flex justify-center"><div className="w-4 h-4 bg-gray-100 rounded" /></div>
      <div className="flex items-center gap-3 px-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full" />
        <div><div className="h-4 bg-gray-100 rounded w-28 mb-1" /><div className="h-3 bg-gray-100 rounded w-20" /></div>
      </div>
      <div className="px-3"><div className="h-5 bg-gray-100 rounded w-16" /></div>
      <div className="px-3"><div className="h-6 bg-gray-100 rounded-full w-20" /></div>
      <div className="px-3"><div className="h-4 bg-gray-100 rounded w-24" /></div>
      <div className="flex justify-center"><div className="w-5 h-5 bg-gray-100 rounded" /></div>
    </div>
  );
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
  const [currentPage, setCurrentPage] = useState(1);

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

  // Pagination
  const totalCount = sortedCandidats.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCandidats = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return sortedCandidats.slice(start, start + PAGE_SIZE);
  }, [sortedCandidats, safeCurrentPage]);

  // Reset page on filter change
  useMemo(() => {
    setCurrentPage(1);
  }, [candidats.length]);

  const emptyHeader = (
    <TableHeader
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={handleSort}
      selectedCount={0}
      totalCount={0}
      onSelectAll={() => { }}
    />
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden w-full">
        {emptyHeader}
        {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (sortedCandidats.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {emptyHeader}
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Aucun candidat trouve
          </h3>
          <p className="text-xs text-slate-400 text-center max-w-xs">
            Modifiez vos filtres ou importez un fichier JSON Parcoursup pour commencer
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Upload className="w-3.5 h-3.5" />
            <span>Utilisez Import dans la barre de navigation</span>
          </div>
        </div>
      </div>
    );
  }

  const startItem = (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, totalCount);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      for (let i = Math.max(2, safeCurrentPage - 1); i <= Math.min(totalPages - 1, safeCurrentPage + 1); i++) {
        pages.push(i);
      }
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden w-full">
      <TableHeader
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        selectedCount={selectedIds.length}
        totalCount={totalCount}
        onSelectAll={onSelectAll}
      />

      <div>
        {paginatedCandidats.map((candidat, index) => (
          <TableRow
            key={candidat.id}
            candidat={candidat}
            isSelected={selectedIds.includes(candidat.id)}
            onSelect={() => onSelectCandidat(candidat.id)}
            onClick={() => onCandidatClick(candidat)}
            index={(safeCurrentPage - 1) * PAGE_SIZE + index}
          />
        ))}
      </div>

      {/* Pagination footer */}
      <div className="border-t border-gray-100 px-5 py-3 flex flex-col items-center gap-2">
        <span className="text-xs text-slate-400 tabular-nums">
          Affichage {startItem}-{endItem} sur {totalCount.toLocaleString('fr-FR')} candidats
        </span>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-500 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Precedent"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {getPageNumbers().map((page, i) =>
            page === '...' ? (
              <span key={`dots-${i}`} className="px-1.5 text-xs text-slate-400">...</span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`min-w-[32px] h-8 text-xs font-semibold rounded-md transition-colors
                  ${safeCurrentPage === page
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-600 hover:bg-gray-100'
                  }`}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-500 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Suivant"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
