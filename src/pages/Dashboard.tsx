import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAppStore,
  useCandidatsFiltres,
  useStatistiques,
  useIsLoading,
  useSelectedCandidatIds,
} from '@/store/appStore';
import { ExportService } from '@/services/exportService';
import { api } from '@/services/api';
import { debugStructureJSON } from '@/utils/debugJSON';
import { DataLoaderService } from '@/services/dataLoaderService';
import { DataTable } from '@/components/table/DataTable';
import { StatsCompact } from '@/components/dashboard/StatsCompact';
import { FilterBar } from '@/components/filters/FilterBar';
import { Notification } from '@/components/Notification';
import { BulkActionBar } from '@/components/bulk-actions/BulkActionBar';
import { CampaignSelector } from '@/components/campaigns/CampaignSelector';
import { BulkValidateDialog } from '@/components/bulk-actions/BulkValidateDialog';
import { BulkStatusDialog } from '@/components/bulk-actions/BulkStatusDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Candidat } from '@/types';
import {
  Upload,
  FileJson,
  X
} from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const candidats = useCandidatsFiltres();
  const stats = useStatistiques();
  const isLoading = useIsLoading();
  const selectedIds = useSelectedCandidatIds();
  const {
    setCandidats,
    setLoading,
    showNotification,
    toggleSelectCandidat,
    toggleSelectAll,
    clearSelection,
    updateCandidat,
  } = useAppStore();

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [, setSelectedCampaignId] = useState<string | undefined>();

  // Listen for sidebar import/export events
  useEffect(() => {
    const handleOpenImport = () => setShowImportDialog(true);
    const handleOpenExport = () => exporterResultats();
    window.addEventListener('irts:open-import', handleOpenImport);
    window.addEventListener('irts:open-export', handleOpenExport);
    return () => {
      window.removeEventListener('irts:open-import', handleOpenImport);
      window.removeEventListener('irts:open-export', handleOpenExport);
    };
  }, [candidats]);

  useEffect(() => {
    chargerDonneesInitiales();
  }, []);

  const chargerDonneesInitiales = async () => {
    try {
      setLoading(true);
      const hasData = await DataLoaderService.hasData();
      if (hasData) {
        const candidatsCharges = await DataLoaderService.chargerCandidats();
        setCandidats(candidatsCharges);
      } else {
        const candidatsCharges = await DataLoaderService.chargerCandidats();
        setCandidats(candidatsCharges);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      showNotification('Erreur lors du chargement des donnees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exporterResultats = () => {
    try {
      ExportService.exporterVersExcel(candidats, `resultats-irts-${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('Export Excel genere', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showNotification('Erreur lors de l\'export', 'error');
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();

      let jsonData;
      try {
        jsonData = JSON.parse(text);
        debugStructureJSON(jsonData);
      } catch {
        showNotification('Le fichier n\'est pas un JSON valide', 'error');
        return;
      }

      let candidatsData: any[] = [];

      if (jsonData.exportDeDonnees?.exportCandidats?.[0]?.candidats) {
        candidatsData = jsonData.exportDeDonnees.exportCandidats[0].candidats;
      } else if (Array.isArray(jsonData)) {
        candidatsData = jsonData;
      } else if (jsonData.candidats) {
        candidatsData = jsonData.candidats;
      } else if (jsonData.Candidats) {
        candidatsData = jsonData.Candidats;
      } else if (jsonData.candidates) {
        candidatsData = jsonData.candidates;
      } else {
        for (const key in jsonData) {
          if (Array.isArray(jsonData[key])) {
            candidatsData = jsonData[key];
            break;
          }
        }
      }

      if (candidatsData.length === 0) {
        throw new Error('Format de donnees invalide - candidats non trouves');
      }

      const result = await api.importCandidats(candidatsData);
      const candidatsCharges = await DataLoaderService.chargerCandidats();
      setCandidats(candidatsCharges);

      setShowImportDialog(false);

      // Notification adaptée : nouveaux, doublons ignorés, erreurs
      const notifType = result.imported === 0 && result.skipped > 0
        ? 'info'
        : result.errors > 0 ? 'error' : 'success';
      showNotification(result.message || `${result.imported} candidat(s) importe(s)`, notifType);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      showNotification(`Erreur lors de l'import du fichier: ${msg}`, 'error');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleCandidatClick = (candidat: Candidat) => {
    navigate(`/candidat/${candidat.id}`);
  };

  const handleSelectAll = () => {
    const filteredIds = candidats.map(c => c.id);
    toggleSelectAll(filteredIds);
  };

  const selectedCandidats = candidats.filter(c => selectedIds.includes(c.id));

  const handleBulkValidate = async () => {
    setIsBulkLoading(true);
    try {
      for (const candidat of selectedCandidats) {
        updateCandidat(candidat.id, {
          statut: 'valide',
          cotationFinale: candidat.cotationIAProposee,
          dateValidation: new Date().toISOString(),
        });
      }
      showNotification(`${selectedCandidats.length} candidat(s) valide(s) avec succes`, 'success');
      setShowValidateDialog(false);
      clearSelection();
    } catch (error) {
      showNotification('Erreur lors de la validation en masse', 'error');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    setIsBulkLoading(true);
    try {
      for (const candidat of selectedCandidats) {
        updateCandidat(candidat.id, { statut: newStatus as Candidat['statut'] });
      }
      showNotification(`Statut change pour ${selectedCandidats.length} candidat(s)`, 'success');
      setShowStatusDialog(false);
      clearSelection();
    } catch (error) {
      showNotification('Erreur lors du changement de statut', 'error');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkExport = () => {
    try {
      ExportService.exporterVersExcel(
        selectedCandidats,
        `selection-${selectedCandidats.length}-candidats-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      showNotification(`${selectedCandidats.length} candidat(s) exporte(s)`, 'success');
      clearSelection();
    } catch (error) {
      showNotification('Erreur lors de l\'export', 'error');
    }
  };

  return (
    <div>
      <Notification />

      {/* Page header */}
      <PageHeader
        title="Candidatures"
        subtitle={`${stats.total} candidatures`}
        actions={
          <CampaignSelector
            onCampaignChange={(campagne) => setSelectedCampaignId(campagne?.id)}
          />
        }
      />

      {/* Stats bar */}
      <div className="px-8 py-4 border-b border-shine-border bg-white">
        <StatsCompact />
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* Filters */}
        <div className="mb-6">
          <FilterBar />
        </div>

        {/* Data table */}
        <DataTable
          candidats={candidats}
          selectedIds={selectedIds}
          onSelectCandidat={toggleSelectCandidat}
          onSelectAll={handleSelectAll}
          onCandidatClick={handleCandidatClick}
          isLoading={isLoading}
        />
      </div>

      {/* Import dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-shine-border p-6 max-w-md w-full mx-4 shadow-dropdown">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-shine-text-primary">
                Importer des candidats
              </h3>
              <button
                onClick={() => setShowImportDialog(false)}
                title="Fermer"
                className="text-shine-text-secondary hover:text-shine-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-shine-border rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                <Upload className="w-10 h-10 text-shine-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-shine-text-primary mb-1 font-medium">
                  Glissez-deposez votre fichier JSON ici
                </p>
                <p className="text-xs text-shine-text-tertiary">
                  Format attendu : fichier JSON Parcoursup
                </p>
              </div>

              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="file-input"
              />

              <label
                htmlFor="file-input"
                className="btn btn-primary cursor-pointer text-center w-full py-3"
              >
                <FileJson className="w-4 h-4" />
                Selectionner un fichier JSON
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Bulk actions */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        selectedCandidats={selectedCandidats}
        onValidate={() => setShowValidateDialog(true)}
        onChangeStatus={() => setShowStatusDialog(true)}
        onExport={handleBulkExport}
        onClear={clearSelection}
      />

      <BulkValidateDialog
        isOpen={showValidateDialog}
        candidats={selectedCandidats}
        onConfirm={handleBulkValidate}
        onCancel={() => setShowValidateDialog(false)}
        isLoading={isBulkLoading}
      />

      <BulkStatusDialog
        isOpen={showStatusDialog}
        candidats={selectedCandidats}
        onConfirm={handleBulkStatusChange}
        onCancel={() => setShowStatusDialog(false)}
        isLoading={isBulkLoading}
      />
    </div>
  );
}
