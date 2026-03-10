import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-shine-border rounded-xl shadow-dropdown max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-shine-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-shine-text-primary">
                Validation en masse
              </h3>
              <p className="text-sm text-shine-text-secondary">
                {candidats.length} candidat{candidats.length > 1 ? 's' : ''} a valider
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

        {hasAlertes && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Attention</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Certains candidats selectionnes ont des alertes. Verifiez leurs dossiers avant validation.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-medium text-shine-text-secondary mb-3">
            Candidats a valider :
          </h4>
          <div className="space-y-2">
            {candidats.map((candidat) => (
              <div
                key={candidat.id}
                className="flex items-center justify-between p-3 bg-shine-bg rounded-lg border border-shine-border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {candidat.prenom[0]}{candidat.nom[0]}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-shine-text-primary truncate">
                      {candidat.prenom} {candidat.nom}
                    </span>
                    <span className="text-xs text-shine-text-secondary font-mono">
                      {candidat.numeroDossier}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {candidat.alertes.length > 0 && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">
                        {candidat.alertes.length}
                      </span>
                    </div>
                  )}
                  {candidat.cotationIAProposee !== undefined && (
                    <div className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-semibold">
                      {candidat.cotationIAProposee}/8
                    </div>
                  )}
                </div>
              </div>
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
            onClick={onConfirm}
            disabled={isLoading}
            className="btn bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmer la validation
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
