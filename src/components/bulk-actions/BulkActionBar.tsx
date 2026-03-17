import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Download, Trash2, Award } from 'lucide-react';
import { Candidat } from '@/types';

interface BulkActionBarProps {
  selectedCount: number;
  selectedCandidats: Candidat[];
  onValidate: () => void;
  onChangeStatus: () => void;
  onExport: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  selectedCandidats,
  onValidate,
  onChangeStatus,
  onExport,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const canValidate = selectedCandidats.every(
    (c) => c.statut === 'analyse' || c.statut === 'en_relecture'
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-6 inset-x-0 mx-auto w-fit z-50"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 px-5 py-3.5 flex items-center gap-4">
          {/* Count + deselect */}
          <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-extrabold text-white leading-none">{selectedCount}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">
                Candidats selectionnes
              </p>
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
              >
                Deselectionner tout
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canValidate && (
              <button
                type="button"
                onClick={onValidate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
              >
                <Award className="w-4 h-4" />
                Validation Groupee
              </button>
            )}

            <button
              type="button"
              onClick={onChangeStatus}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-slate-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-violet-500" />
              Lancer Analyse IA
            </button>

            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-slate-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export Excel
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="p-2.5 rounded-lg bg-white border border-gray-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
              title="Supprimer la selection"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
