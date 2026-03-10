import { useState } from 'react';
import { Calendar, Plus, Edit2, Archive, Users } from 'lucide-react';
import { useCampagnes } from '@/hooks/useCampagnes';
import { CampaignModal, type CampaignFormData } from '@/components/campaigns/CampaignModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import type { Campagne } from '@/types';

export function CampagnesPage() {
  const { campagnes, loading, createCampagne, updateCampagne, refresh } = useCampagnes();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampagne, setEditingCampagne] = useState<Campagne | null>(null);

  const getStatutColor = (statut: string) => {
    const colors = {
      preparation: 'bg-slate-100 text-slate-600',
      en_cours: 'bg-emerald-50 text-emerald-600',
      cloturee: 'bg-amber-50 text-amber-600',
      archivee: 'bg-slate-100 text-slate-400',
    };
    return colors[statut as keyof typeof colors] || colors.preparation;
  };

  const getStatutLabel = (statut: string) => {
    const labels = {
      preparation: 'Preparation',
      en_cours: 'En cours',
      cloturee: 'Cloturee',
      archivee: 'Archivee',
    };
    return labels[statut as keyof typeof labels] || statut;
  };

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
    <div className="min-h-screen">
      <PageHeader
        title="Campagnes"
        subtitle="Creez et gerez les campagnes d'admission"
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

      <div className="px-8 py-6">
        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-sm text-shine-text-secondary">
              Chargement des campagnes...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && campagnes.length === 0 && (
          <div className="bg-white border border-shine-border rounded-xl p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-shine-text-tertiary" />
            </div>
            <h3 className="text-base font-semibold text-shine-text-primary mb-1">
              Aucune campagne
            </h3>
            <p className="text-sm text-shine-text-secondary mb-6">
              Creez votre premiere campagne pour commencer
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

        {/* Campagnes Grid */}
        {!loading && campagnes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campagnes.map((campagne) => (
              <div
                key={campagne.id}
                className="bg-white border border-shine-border rounded-xl p-6 hover:shadow-card transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-shine-text-primary mb-0.5 truncate">
                      {campagne.nom || campagne.libelle}
                    </h3>
                    {campagne.annee && (
                      <p className="text-sm text-shine-text-secondary">
                        Annee {campagne.annee}
                      </p>
                    )}
                  </div>
                  <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(campagne.statut)}`}>
                    {getStatutLabel(campagne.statut)}
                  </span>
                </div>

                {/* Description */}
                {campagne.description && (
                  <p className="text-sm text-shine-text-secondary mb-4 line-clamp-2">
                    {campagne.description}
                  </p>
                )}

                {/* Dates */}
                <div className="space-y-1.5 mb-4">
                  {campagne.dateDebut && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      <span className="text-shine-text-secondary">
                        Debut: {new Date(campagne.dateDebut).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {campagne.dateFin && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      <span className="text-shine-text-secondary">
                        Fin: {new Date(campagne.dateFin).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 text-sm mb-4 p-2.5 bg-shine-bg rounded-lg">
                  <Users className="w-4 h-4 text-primary-500" />
                  <span className="font-medium text-shine-text-primary">
                    0 candidats
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-shine-border">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Edit2 className="w-3.5 h-3.5" />}
                    className="flex-1"
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
            ))}
          </div>
        )}
      </div>

      {/* Modal de creation */}
      <CampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCampagne}
      />

      {/* Modal d'edition */}
      <CampaignModal
        isOpen={!!editingCampagne}
        onClose={() => setEditingCampagne(null)}
        onSubmit={handleEditCampagne}
        campaign={editingCampagne}
      />
    </div>
  );
}
