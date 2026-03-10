import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, X } from 'lucide-react';
import { Candidat } from '@/types';

interface BulkStatusDialogProps {
  isOpen: boolean;
  candidats: Candidat[];
  onConfirm: (newStatus: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const STATUTS = [
  { value: 'importe', label: 'Importe', color: 'bg-slate-100 text-slate-600' },
  { value: 'en_analyse_ia', label: 'En analyse IA', color: 'bg-blue-50 text-blue-600' },
  { value: 'analyse', label: 'Analyse', color: 'bg-purple-50 text-purple-600' },
  { value: 'en_relecture', label: 'En relecture', color: 'bg-amber-50 text-amber-600' },
  { value: 'valide', label: 'Valide', color: 'bg-emerald-50 text-emerald-600' },
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
    if (selectedStatus) {
      onConfirm(selectedStatus);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-shine-border rounded-xl shadow-dropdown max-w-lg w-full"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-shine-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-shine-text-primary">
                Changer le statut
              </h3>
              <p className="text-sm text-shine-text-secondary">
                {candidats.length} candidat{candidats.length > 1 ? 's' : ''} selectionne{candidats.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 text-shine-text-tertiary hover:text-shine-text-primary hover:bg-shine-hover-bg rounded-lg transition-colors disabled:opacity-50"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-shine-text-primary mb-3">
            Nouveau statut :
          </label>
          <div className="space-y-2">
            {STATUTS.map((statut) => (
              <button
                key={statut.value}
                onClick={() => setSelectedStatus(statut.value)}
                className={`
                  w-full flex items-center justify-between p-3 rounded-lg border transition-colors
                  ${
                    selectedStatus === statut.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-shine-border hover:bg-shine-hover-bg'
                  }
                `}
              >
                <span className="text-sm font-medium text-shine-text-primary">
                  {statut.label}
                </span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statut.color}`}>
                  {statut.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-shine-bg border-t border-shine-border rounded-b-xl">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary px-4 py-2 text-sm disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedStatus}
            className="btn btn-primary px-5 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Changement en cours...
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                Confirmer
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
