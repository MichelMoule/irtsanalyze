import { useState } from 'react';
import { Calendar, ChevronDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampagnes } from '@/hooks/useCampagnes';
import { CampaignModal, type CampaignFormData } from './CampaignModal';
import type { Campagne } from '@/types';

interface CampaignSelectorProps {
  onCampaignChange?: (campagne: Campagne | null) => void;
}

export function CampaignSelector({ onCampaignChange }: CampaignSelectorProps) {
  const { campagnes, currentCampagne, setCurrentCampagne, loading, createCampagne, refresh } = useCampagnes();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSelectCampagne = (campagne: Campagne) => {
    setCurrentCampagne(campagne);
    onCampaignChange?.(campagne);
    setIsOpen(false);
  };

  const handleCreateCampagne = async (data: CampaignFormData) => {
    const newCampagne = await createCampagne({
      ...data,
      libelle: data.nom,
      dateDebut: data.dateDebut || undefined,
      dateFin: data.dateFin || undefined,
    });

    setCurrentCampagne(newCampagne);
    onCampaignChange?.(newCampagne);
    await refresh();
  };

  const getStatutBadge = (statut: string) => {
    const config = {
      preparation: { label: 'Preparation', color: 'bg-slate-100 text-slate-600' },
      en_cours: { label: 'En cours', color: 'bg-emerald-50 text-emerald-600' },
      cloturee: { label: 'Cloturee', color: 'bg-amber-50 text-amber-600' },
      archivee: { label: 'Archivee', color: 'bg-slate-100 text-slate-400' },
    }[statut] || { label: statut, color: 'bg-slate-100 text-slate-600' };

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
        <Calendar className="w-4 h-4 text-flat-text-tertiary" />
        <span className="text-sm text-flat-text-secondary">Chargement...</span>
      </div>
    );
  }

  if (campagnes.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
        <Calendar className="w-4 h-4 text-flat-text-tertiary" />
        <span className="text-sm text-flat-text-secondary">Aucune campagne</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors min-w-[280px]"
      >
        <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-flat-fg">
              {currentCampagne?.nom || currentCampagne?.libelle || 'Selectionner une campagne'}
            </span>
            {currentCampagne && getStatutBadge(currentCampagne.statut)}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-flat-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg z-50 overflow-hidden"
            >
              <div className="max-h-96 overflow-y-auto">
                {campagnes.map((campagne) => (
                  <button
                    key={campagne.id}
                    onClick={() => handleSelectCampagne(campagne)}
                    className={`
                      w-full px-4 py-3 text-left
                      hover:bg-gray-100 transition-colors
                      border-b border-gray-200 last:border-b-0
                      ${currentCampagne?.id === campagne.id ? 'bg-primary-50' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-flat-fg">
                        {campagne.nom || campagne.libelle}
                      </span>
                      {getStatutBadge(campagne.statut)}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full px-4 py-3 text-left bg-gray-100 hover:bg-gray-100 transition-colors border-t border-gray-200 flex items-center gap-2 text-primary-500 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Creer une nouvelle campagne
              </button>
            </motion.div>

            <CampaignModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreateCampagne}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
