import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Edit3, Download, X } from 'lucide-react';
import { Candidat } from '@/types';

interface BulkActionBarProps {
  selectedCount: number;
  selectedCandidats: Candidat[];
  onValidate: () => void;
  onChangeStatus: () => void;
  onExport: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  selectedCandidats,
  onValidate,
  onChangeStatus,
  onExport,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const canValidate = selectedCandidats.every(
    (c) => c.statut === 'analyse' || c.statut === 'en_relecture'
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-white border border-shine-border rounded-xl shadow-dropdown px-6 py-3 flex items-center gap-5">
          {/* Compteur */}
          <div className="flex items-center gap-3 pr-5 border-r border-shine-border">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{selectedCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-shine-text-primary">
                {selectedCount} selectionne{selectedCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canValidate && (
              <button
                onClick={onValidate}
                className="btn btn-primary bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Valider
              </button>
            )}

            <button
              onClick={onChangeStatus}
              className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Statut
            </button>

            <button
              onClick={onExport}
              className="btn btn-secondary px-4 py-2 text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>

          <button
            onClick={onClear}
            className="ml-2 p-1.5 text-shine-text-tertiary hover:text-shine-text-primary hover:bg-shine-hover-bg rounded-lg transition-colors"
            aria-label="Annuler la selection"
            title="Annuler la selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
