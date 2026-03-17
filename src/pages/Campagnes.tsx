import { useState } from 'react';
import { Calendar, Plus, Edit2, Archive, Users, Clock, CheckCircle2, Layers } from 'lucide-react';
import { useCampagnes } from '@/hooks/useCampagnes';
import { CampaignModal, type CampaignFormData } from '@/components/campaigns/CampaignModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import type { Campagne } from '@/types';

const STATUT_CONFIG: Record<string, { label: string; dot: string; classes: string; icon: React.ElementType }> = {
  preparation: { label: 'Preparation',  dot: 'bg-slate-400',    classes: 'bg-slate-50 text-slate-600 border-slate-200',    icon: Clock },
  en_cours:    { label: 'En cours',     dot: 'bg-emerald-500',  classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cloturee:    { label: 'Cloturee',     dot: 'bg-amber-500',    classes: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Archive },
  archivee:    { label: 'Archivee',     dot: 'bg-slate-300',    classes: 'bg-slate-50 text-slate-400 border-slate-200',    icon: Archive },
};

export function CampagnesPage() {
  const { campagnes, loading, createCampagne, updateCampagne, refresh } = useCampagnes();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampagne, setEditingCampagne] = useState<Campagne | null>(null);

  const handleArchiveCampagne = async (campagne: Campagne) => {
    if (confirm(`Etes-vous sur de vouloir archiver la campagne "${campagne.nom}" ?`)) {
      try {
        await updateCampagne(campagne.id, { statut: 'archivee' });
        await refresh();
      } catch {
        alert('Erreur lors de l\'archivage de la campagne');
      }
    }
  };

  const handleCreateCampagne = async (data: CampaignFormData) => {
    await createCampagne({
      ...data,
      libelle: data.nom,
      dateDebut: data.dateDebut || undefined,
      dateFin: data.dateFin || undefined,
    });
    await refresh();
  };

  const handleEditCampagne = async (data: CampaignFormData) => {
    if (!editingCampagne) return;
    await updateCampagne(editingCampagne.id, {
      ...data,
      libelle: data.nom,
      dateDebut: data.dateDebut || undefined,
      dateFin: data.dateFin || undefined,
    });
    await refresh();
    setEditingCampagne(null);
  };

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Campagnes"
        subtitle="Gerez les campagnes d'admission"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Nouvelle campagne
          </Button>
        }
      />

      <div className="flex-1 px-6 lg:px-8 py-6">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-flat-text-secondary">Chargement des campagnes...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && campagnes.length === 0 && (
          <div className="bg-white bg-gray-50 rounded-lg p-16 text-center">
            <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7 text-flat-text-tertiary" />
            </div>
            <h3 className="text-base font-bold text-flat-fg mb-1">Aucune campagne</h3>
            <p className="text-sm text-flat-text-secondary mb-6 max-w-xs mx-auto">
              Creez votre premiere campagne pour organiser les admissions
            </p>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Creer une campagne
            </Button>
          </div>
        )}

        {/* Grid */}
        {!loading && campagnes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campagnes.map((campagne) => {
              const statutConf = STATUT_CONFIG[campagne.statut] ?? STATUT_CONFIG.preparation;
              return (
                <div
                  key={campagne.id}
                  className="bg-white bg-gray-50 rounded-lg p-5 hover:scale-[1.02] transition-all duration-200 flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4.5 h-4.5 text-primary-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-flat-fg truncate leading-tight">
                          {campagne.nom || campagne.libelle}
                        </h3>
                        {campagne.annee && (
                          <p className="text-xs text-flat-text-tertiary mt-0.5">
                            Annee {campagne.annee}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`ml-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border flex-shrink-0 ${statutConf.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statutConf.dot}`} />
                      {statutConf.label}
                    </span>
                  </div>

                  {/* Description */}
                  {campagne.description && (
                    <p className="text-xs text-flat-text-secondary mb-3 line-clamp-2 leading-relaxed">
                      {campagne.description}
                    </p>
                  )}

                  {/* Dates */}
                  <div className="space-y-1.5 mb-4 flex-1">
                    {campagne.dateDebut && (
                      <div className="flex items-center gap-2 text-xs text-flat-text-secondary">
                        <Calendar className="w-3.5 h-3.5 text-flat-text-tertiary flex-shrink-0" />
                        <span>Debut :</span>
                        <span className="font-medium text-flat-fg">
                          {new Date(campagne.dateDebut).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {campagne.dateFin && (
                      <div className="flex items-center gap-2 text-xs text-flat-text-secondary">
                        <Clock className="w-3.5 h-3.5 text-flat-text-tertiary flex-shrink-0" />
                        <span>Fin :</span>
                        <span className="font-medium text-flat-fg">
                          {new Date(campagne.dateFin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Candidats count */}
                  <div className="flex items-center gap-2 text-xs text-flat-text-secondary px-3 py-2 bg-gray-100 rounded-lg mb-4">
                    <Users className="w-3.5 h-3.5 text-primary-400" />
                    <span className="font-semibold text-flat-fg">0</span>
                    <span>candidat(s)</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                      className="flex-1 justify-center"
                      onClick={() => setEditingCampagne(campagne)}
                    >
                      Modifier
                    </Button>
                    {campagne.statut !== 'archivee' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Archive className="w-3.5 h-3.5" />}
                        onClick={() => handleArchiveCampagne(campagne)}
                      >
                        Archiver
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCampagne}
      />
      <CampaignModal
        isOpen={!!editingCampagne}
        onClose={() => setEditingCampagne(null)}
        onSubmit={handleEditCampagne}
        campaign={editingCampagne}
      />
    </div>
  );
}
