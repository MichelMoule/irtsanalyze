import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Candidat } from '@/types';

interface BulkValidateDialogProps {
  isOpen: boolean;
  candidats: Candidat[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BulkValidateDialog({
  isOpen,
  candidats,
  onConfirm,
  onCancel,
  isLoading = false,
}: BulkValidateDialogProps) {
  if (!isOpen) return null;

  const hasAlertes = candidats.some((c) => c.alertes.length > 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-white border border-gray-200 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-flat-fg">Validation en masse</h3>
              <p className="text-xs text-flat-text-tertiary mt-0.5">
                {candidats.length} candidat{candidats.length > 1 ? 's' : ''} a valider
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

        {/* Warning */}
        {hasAlertes && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex-shrink-0">
            <div className="flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Attention</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Certains candidats selectionnes ont des alertes. Verifiez leurs dossiers avant validation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Candidat list */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-flat-text-tertiary uppercase tracking-widest mb-3">
            Candidats concernes
          </p>
          <div className="space-y-1.5">
            {candidats.map((candidat) => (
              <div
                key={candidat.id}
                className="flex items-center justify-between px-3.5 py-2.5 bg-gray-100 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {candidat.prenom[0]}{candidat.nom[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-flat-fg truncate">
                      {candidat.prenom} {candidat.nom}
                    </p>
                    <p className="text-xs text-flat-text-tertiary font-mono">{candidat.numeroDossier}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {candidat.alertes.length > 0 && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-xs font-bold">{candidat.alertes.length}</span>
                    </div>
                  )}
                  {candidat.cotationIAProposee !== undefined && (
                    <span className="text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
                      {candidat.cotationIAProposee}/8
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-gray-100 border-t border-gray-200 flex-shrink-0">
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
            onClick={onConfirm}
            disabled={isLoading}
            className="btn bg-emerald-500 hover:bg-emerald-600 text-white  disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmer la validation
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
