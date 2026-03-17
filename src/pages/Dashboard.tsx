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
import { BulkValidateDialog } from '@/components/bulk-actions/BulkValidateDialog';
import { BulkStatusDialog } from '@/components/bulk-actions/BulkStatusDialog';
import { Candidat } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileJson,
  X,
  Trash2,
  AlertTriangle,
  CloudUpload,
  Download,
} from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  } = useAppStore();

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
      const candidatsCharges = await DataLoaderService.chargerCandidats();
      setCandidats(candidatsCharges);
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
      console.error('Export error:', error);
      showNotification("Erreur lors de l'export", 'error');
    }
  };

  const processImportFile = async (file: File) => {
    try {
      setLoading(true);
      const text = await file.text();

      let jsonData;
      try {
        jsonData = JSON.parse(text);
        debugStructureJSON(jsonData);
      } catch {
        showNotification("Le fichier n'est pas un JSON valide", 'error');
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

      const notifType = result.imported === 0 && result.skipped > 0
        ? 'info'
        : result.errors > 0 ? 'error' : 'success';
      showNotification(result.message || `${result.imported} candidat(s) importe(s)`, notifType);
    } catch (error) {
      console.error('Erreur import:', error);
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      showNotification(`Erreur lors de l'import: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImportFile(file);
    event.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.json')) {
      await processImportFile(file);
    } else {
      showNotification('Seuls les fichiers .json sont acceptes', 'error');
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const result = await api.deleteAllCandidats();
      setCandidats([]);
      clearSelection();
      setShowDeleteDialog(false);
      showNotification(result.message || 'Tous les candidats ont ete supprimes', 'success');
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression. Verifiez que le serveur est accessible.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkLoading(true);
    try {
      const count = selectedIds.length;
      const result = await api.deleteCandidats(selectedIds);
      const candidatsCharges = await DataLoaderService.chargerCandidats();
      setCandidats(candidatsCharges);
      clearSelection();
      showNotification(result.message || `${count} candidat(s) supprime(s)`, 'success');
    } catch {
      showNotification('Erreur lors de la suppression. Verifiez que le serveur est accessible.', 'error');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleCandidatClick = (candidat: Candidat) => navigate(`/candidat/${candidat.id}`);
  const handleSelectAll = () => toggleSelectAll(candidats.map(c => c.id));
  const selectedCandidats = candidats.filter(c => selectedIds.includes(c.id));

  const auteurNom = user ? `${user.prenom} ${user.nom}` : 'Évaluateur';
  const auteurId = user?.id || 'anonymous';

  const handleBulkValidate = async () => {
    setIsBulkLoading(true);
    try {
      const result = await api.bulkChangeStatus({
        ids: selectedIds,
        nouveauStatut: 'valide',
        auteurNom,
        auteurId,
      });
      // Refresh from server for consistency
      const candidatsCharges = await DataLoaderService.chargerCandidats();
      setCandidats(candidatsCharges);
      showNotification(result.message || `${result.updated} candidat(s) validé(s)`, 'success');
      if (result.skipped > 0) {
        showNotification(`${result.skipped} candidat(s) ignoré(s) (transition invalide)`, 'info');
      }
      setShowValidateDialog(false);
      clearSelection();
    } catch (err: any) {
      showNotification(err.message || 'Erreur lors de la validation en masse', 'error');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    setIsBulkLoading(true);
    try {
      const result = await api.bulkChangeStatus({
        ids: selectedIds,
        nouveauStatut: newStatus,
        auteurNom,
        auteurId,
      });
      // Refresh from server
      const candidatsCharges = await DataLoaderService.chargerCandidats();
      setCandidats(candidatsCharges);
      showNotification(result.message || `Statut changé pour ${result.updated} candidat(s)`, 'success');
      if (result.skipped > 0) {
        showNotification(`${result.skipped} ignoré(s) : transition invalide`, 'info');
      }
      setShowStatusDialog(false);
      clearSelection();
    } catch (err: any) {
      showNotification(err.message || 'Erreur lors du changement de statut', 'error');
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
    } catch {
      showNotification("Erreur lors de l'export", 'error');
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <Notification />

      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-6 lg:px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Tableau de Bord</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Vue d'ensemble de la Campagne 2024 &gt; Educateur Specialise
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {stats.total > 0 && (
            <button
              type="button"
              onClick={exporterResultats}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          )}
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <StatsCompact />
      </div>

      {/* ── Filter bar ── */}
      <div className="px-6 lg:px-8 pb-4">
        <FilterBar />
      </div>

      {/* ── Candidate table ── */}
      <div className="flex-1 px-6 lg:px-8 pb-6">
        <DataTable
          candidats={candidats}
          selectedIds={selectedIds}
          onSelectCandidat={toggleSelectCandidat}
          onSelectAll={handleSelectAll}
          onCandidatClick={handleCandidatClick}
          isLoading={isLoading}
        />
      </div>

      {/* ── Import dialog ── */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Importer des candidats</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Fichier JSON Parcoursup</p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportDialog(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-all
                  ${isDragging
                    ? 'border-primary-500 bg-blue-50'
                    : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                  }
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className={`w-14 h-14 rounded-lg mx-auto mb-3 flex items-center justify-center transition-colors ${isDragging ? 'bg-primary-100' : 'bg-gray-100'}`}>
                  <CloudUpload className={`w-6 h-6 transition-colors ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1">
                  Glissez-deposez votre fichier ici
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Format attendu : JSON Parcoursup
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-slate-400 font-medium">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
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
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg cursor-pointer transition-colors"
              >
                <FileJson className="w-4 h-4" />
                Selectionner un fichier JSON
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full animate-scale-in">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 leading-tight tracking-tight">
                    Supprimer tous les candidats
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Action irreversible</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Vous etes sur le point de supprimer{' '}
                <span className="font-bold text-slate-800">{stats.total} candidat{stats.total > 1 ? 's' : ''}</span>.
                Vous pourrez les reimporter ensuite depuis un fichier JSON.
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Supprimer tout
                    </>
                  )}
                </button>
              </div>
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
        onDelete={handleBulkDelete}
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
