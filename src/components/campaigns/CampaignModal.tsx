import { useState } from 'react';
import { X, Calendar, FileText, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import type { Campagne } from '@/types';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CampaignFormData) => Promise<void>;
  campaign?: Campagne | null;
}

export interface CampaignFormData {
  nom: string;
  annee: number;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
}

export function CampaignModal({ isOpen, onClose, onSubmit, campaign }: CampaignModalProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    nom: campaign?.nom || '',
    annee: campaign?.annee || new Date().getFullYear(),
    description: campaign?.description || '',
    dateDebut: campaign?.dateDebut ? new Date(campaign.dateDebut).toISOString().split('T')[0] : '',
    dateFin: campaign?.dateFin ? new Date(campaign.dateFin).toISOString().split('T')[0] : '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CampaignFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg bg-white rounded-lg border border-gray-200 max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-base font-semibold text-flat-fg">
              {campaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4 text-flat-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-flat-fg mb-1.5">
                <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                Nom de la campagne *
              </label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Parcoursup 2025"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-flat-fg mb-1.5">
                <Hash className="w-3.5 h-3.5 inline mr-1.5" />
                Annee *
              </label>
              <input
                type="number"
                required
                min="2020"
                max="2030"
                value={formData.annee}
                onChange={(e) => handleChange('annee', parseInt(e.target.value))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-flat-fg mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Description de la campagne..."
                className="input resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-flat-fg mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
                  Date de debut
                </label>
                <input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => handleChange('dateDebut', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-flat-fg mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => handleChange('dateFin', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="flex-1"
              >
                {campaign ? 'Enregistrer' : 'Creer'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
