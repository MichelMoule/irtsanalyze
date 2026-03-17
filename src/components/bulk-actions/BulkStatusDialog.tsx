import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, X, Check } from 'lucide-react';
import { Candidat } from '@/types';

interface BulkStatusDialogProps {
  isOpen: boolean;
  candidats: Candidat[];
  onConfirm: (newStatus: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const STATUTS = [
  { value: 'importe',       label: 'Importé',          dot: 'bg-slate-400',   classes: 'hover:bg-slate-50 border-slate-200' },
  { value: 'en_analyse_ia', label: 'En analyse IA',    dot: 'bg-blue-500',    classes: 'hover:bg-blue-50 border-blue-200' },
  { value: 'analyse',       label: 'Analysé',          dot: 'bg-violet-500',  classes: 'hover:bg-violet-50 border-violet-200' },
  { value: 'en_relecture',  label: 'En relecture',     dot: 'bg-amber-500',   classes: 'hover:bg-amber-50 border-amber-200' },
  { value: 'valide',        label: 'Validé',           dot: 'bg-emerald-500', classes: 'hover:bg-emerald-50 border-emerald-200' },
  { value: 'rejete',        label: 'Rejeté',           dot: 'bg-red-500',     classes: 'hover:bg-red-50 border-red-200' },
  { value: 'liste_attente', label: 'Liste d\'attente', dot: 'bg-orange-500',  classes: 'hover:bg-orange-50 border-orange-200' },
];

export function BulkStatusDialog({
  isOpen,
  candidats,
  onConfirm,
  onCancel,
  isLoading = false,
}: BulkStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedStatus) onConfirm(selectedStatus);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-white border border-gray-200 rounded-lg max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-flat-fg">Changer le statut</h3>
              <p className="text-xs text-flat-text-tertiary mt-0.5">
                {candidats.length} candidat{candidats.length > 1 ? 's' : ''} concerne{candidats.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-flat-text-tertiary hover:text-flat-fg transition-colors disabled:opacity-40"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status options */}
        <div className="p-5">
          <p className="text-xs font-semibold text-flat-text-tertiary uppercase tracking-widest mb-3">
            Nouveau statut
          </p>
          <div className="space-y-1.5">
            {STATUTS.map((statut) => {
              const isSelected = selectedStatus === statut.value;
              return (
                <button
                  key={statut.value}
                  type="button"
                  onClick={() => setSelectedStatus(statut.value)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-100
                    ${isSelected
                      ? 'border-primary-400 bg-primary-50 '
                      : `border-gray-200 ${statut.classes}`
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statut.dot}`} />
                    <span className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-flat-fg'}`}>
                      {statut.label}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 bg-gray-100 border-t border-gray-200 rounded-b-2xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !selectedStatus}
            className="btn btn-primary disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Application...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Appliquer
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
