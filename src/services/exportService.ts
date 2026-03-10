import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Candidat } from '@/types';

/**
 * Service d'export des résultats vers Excel
 */
export class ExportService {
  
  /**
   * Exporte les candidats validés vers un fichier Excel
   */
  static exporterVersExcel(candidats: Candidat[], nomFichier: string = 'resultats-irts-parcoursup.xlsx') {
    // Filtrer uniquement les candidats validés
    const candidatsValides = candidats.filter(c => c.statut === 'valide');
    
    // Préparer les données
    const donnees = candidatsValides.map(candidat => ({
      'N° dossier': candidat.numeroDossier,
      'Nom': candidat.nom,
      'Prénom': candidat.prenom,
      'Série bac': candidat.serieBac,
      'Établissement': candidat.etablissementOrigine,
      'Moyenne générale': candidat.moyenneGenerale?.toFixed(2) || 'N/A',
      'Moyennes détaillées': this.formaterMoyennesDetaillees(candidat),
      'Évolution': this.formaterEvolution(candidat.evolutionNotes),
      'Synthèse': candidat.syntheseAppreciations,
      'Alertes': candidat.alertes.join(' | ') || 'Aucune',
      'Éléments valorisants': candidat.elementsValorisants.join(' | ') || 'Aucun',
      'Cotation IA': candidat.cotationIAProposee?.toFixed(1) || 'N/A',
      'Cotation finale': candidat.cotationFinale?.toFixed(1) || 'N/A',
      'Commentaire': candidat.commentaireEvaluateur || '',
      'Validé par': candidat.validateurNom || 'Non validé',
      'Date validation': candidat.dateValidation || '',
    }));

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(donnees);

    // Ajuster les largeurs des colonnes
    const largeursColonnes = [
      { wch: 12 }, // N° dossier
      { wch: 15 }, // Nom
      { wch: 15 }, // Prénom
      { wch: 15 }, // Série bac
      { wch: 25 }, // Établissement
      { wch: 12 }, // Moyenne générale
      { wch: 20 }, // Moyennes détaillées
      { wch: 12 }, // Évolution
      { wch: 40 }, // Synthèse
      { wch: 30 }, // Alertes
      { wch: 30 }, // Éléments valorisants
      { wch: 10 }, // Cotation IA
      { wch: 12 }, // Cotation finale
      { wch: 30 }, // Commentaire
      { wch: 20 }, // Validé par
      { wch: 15 }, // Date validation
    ];

    ws['!cols'] = largeursColonnes;

    // Ajouter le worksheet au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Résultats IRTS');

    // Ajouter une feuille de résumé
    const resumeData = this.genererResume(candidats);
    const wsResume = XLSX.utils.json_to_sheet(resumeData);
    wsResume['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');

    // Générer le fichier et télécharger
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, nomFichier);
  }

  private static formaterMoyennesDetaillees(candidat: Candidat): string {
    const moyennes = [];
    
    if (candidat.moyenneFrancais) moyennes.push(`Français: ${candidat.moyenneFrancais.toFixed(1)}`);
    if (candidat.moyenneHistoireGeo) moyennes.push(`Histoire-Géo: ${candidat.moyenneHistoireGeo.toFixed(1)}`);
    if (candidat.moyennePhilosophie) moyennes.push(`Philosophie: ${candidat.moyennePhilosophie.toFixed(1)}`);
    if (candidat.moyenneMaths) moyennes.push(`Maths: ${candidat.moyenneMaths.toFixed(1)}`);
    
    return moyennes.join(' | ');
  }

  private static formaterEvolution(evolution: string): string {
    const labels: Record<string, string> = {
      progression: 'Progression ↑',
      stable: 'Stable →',
      regression: 'Régression ↓',
    };
    return labels[evolution] || 'Non déterminée';
  }

  private static genererResume(candidats: Candidat[]): any[] {
    const total = candidats.length;
    const valides = candidats.filter(c => c.statut === 'valide').length;
    const enRelecture = candidats.filter(c => c.statut === 'en_relecture').length;
    const analyses = candidats.filter(c => c.statut === 'analyse').length;
    
    const moyenneCotationIA = candidats
      .filter(c => c.cotationIAProposee)
      .reduce((sum, c) => sum + (c.cotationIAProposee || 0), 0) / candidats.length;

    const moyenneCotationFinale = candidats
      .filter(c => c.cotationFinale)
      .reduce((sum, c) => sum + (c.cotationFinale || 0), 0) / valides;

    return [
      { 'Statistique': 'Total candidats', 'Valeur': total },
      { 'Statistique': 'Candidats validés', 'Valeur': `${valides} (${Math.round((valides/total)*100)}%)` },
      { 'Statistique': 'En relecture', 'Valeur': enRelecture },
      { 'Statistique': 'En attente d\'analyse', 'Valeur': analyses },
      { 'Statistique': 'Moyenne cotation IA', 'Valeur': moyenneCotationIA.toFixed(1) },
      { 'Statistique': 'Moyenne cotation finale', 'Valeur': valides > 0 ? moyenneCotationFinale.toFixed(1) : 'N/A' },
      { 'Statistique': 'Date d\'export', 'Valeur': new Date().toLocaleDateString('fr-FR') },
    ];
  }

  /**
   * Exporte un candidat individuel vers PDF (fonctionnalité future)
   */
  static exporterCandidatPDF(candidat: Candidat) {
    // Implémentation future avec jsPDF ou similar
    console.log('Export PDF non implémenté pour', candidat.nom);
  }
}