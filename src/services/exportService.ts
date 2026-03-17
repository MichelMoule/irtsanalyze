import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Candidat } from '@/types';

/**
 * Service d'export des résultats vers Excel — export complet multi-onglets
 */
export class ExportService {

  /**
   * Export complet de TOUS les candidats (pas seulement validés)
   */
  static exporterVersExcel(candidats: Candidat[], nomFichier: string = 'resultats-irts-parcoursup.xlsx') {
    const wb = XLSX.utils.book_new();

    // ── Onglet 1 : Vue globale (tous les candidats) ──
    this.ajouterOngletGlobal(wb, candidats);

    // ── Onglet 2 : Détail scolaire ──
    this.ajouterOngletScolaire(wb, candidats);

    // ── Onglet 3 : Analyse IA détaillée ──
    this.ajouterOngletAnalyseIA(wb, candidats);

    // ── Onglet 4 : Évaluations & brouillons ──
    this.ajouterOngletEvaluations(wb, candidats);

    // ── Onglet 5 : Suivi workflow ──
    this.ajouterOngletWorkflow(wb, candidats);

    // ── Onglet 6 : Statistiques ──
    this.ajouterOngletStatistiques(wb, candidats);

    // Générer le fichier
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, nomFichier);
  }

  // ═════════════════════════════════════════════
  //  Onglet 1 — VUE GLOBALE
  // ═════════════════════════════════════════════
  private static ajouterOngletGlobal(wb: XLSX.WorkBook, candidats: Candidat[]) {
    const donnees = candidats.map(c => ({
      'N° Dossier': c.numeroDossier,
      'Nom': c.nom,
      'Prénom': c.prenom,
      'Date naissance': c.dateNaissance || '',
      'Email': c.email || '',
      'Téléphone': c.telephone || '',
      'Série Bac': c.serieBac,
      'Type Bac': c.typeBac || '',
      'Année Bac': c.anneeBac || '',
      'Bac obtenu': this.formatOuiNon(c.bacObtenu),
      'Établissement': c.etablissementOrigine,
      'Filière demandée': c.filiereDemandee || '',
      'Statut demande': c.statutDemande || '',
      'Procédure admission': this.formatProcedure(c.procedureAdmission),
      'RQTH/MDPH': this.formatOuiNon(c.rqthMdph),
      'Statut dossier': this.formatStatut(c.statut),
      'Moyenne générale': this.num(c.moyenneGenerale),
      'Cotation IA': this.num(c.cotationIAProposee),
      'Cotation finale': this.num(c.cotationFinale),
      'Note Parcours /3': this.num(c.noteParcoursScolaire),
      'Note Expériences /3': this.num(c.noteExperiences),
      'Note Motivation /2': this.num(c.noteMotivation),
      'Alertes': (c.alertes || []).join(' | ') || '',
      'Éléments valorisants': (c.elementsValorisants || []).join(' | ') || '',
    }));

    const ws = XLSX.utils.json_to_sheet(donnees);
    ws['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 10 },
      { wch: 10 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 35 }, { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Vue Globale');
  }

  // ═════════════════════════════════════════════
  //  Onglet 2 — DÉTAIL SCOLAIRE
  // ═════════════════════════════════════════════
  private static ajouterOngletScolaire(wb: XLSX.WorkBook, candidats: Candidat[]) {
    const donnees = candidats.map(c => {
      const dp = c.donneesParcoursup || {};
      const ficheAvenir = dp.FicheAvenir || {};


      return {
        'N° Dossier': c.numeroDossier,
        'Nom Prénom': `${c.nom} ${c.prenom}`,
        'Série Bac': c.serieBac,
        'Spécialités': this.extractSpecialites(dp),
        'Moyenne générale': this.num(c.moyenneGenerale),
        'Français': this.num(c.moyenneFrancais),
        'Histoire-Géo': this.num(c.moyenneHistoireGeo),
        'Philosophie': this.num(c.moyennePhilosophie),
        'Maths': this.num(c.moyenneMaths),
        'Évolution': this.formaterEvolution(c.evolutionNotes),
        'Rang dans classe': this.extractRang(dp),
        'Effectif classe': this.extractEffectif(dp),
        'Avis proviseur': ficheAvenir.AvisProviseur || ficheAvenir.AvisChefEtablissement || '',
        'Avis PE méthode travail': ficheAvenir.AvisMethodeTravail || '',
        'Avis PE autonomie': ficheAvenir.AvisAutonomie || '',
        'Avis PE esprit initiative': ficheAvenir.AvisEspritInitiative || '',
        'Avis PE capacité à réussir': ficheAvenir.AvisCapaciteReussir || '',
        'Synthèse appréciations': c.syntheseAppreciations || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(donnees);
    ws['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 30 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
      { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Détail Scolaire');
  }

  // ═════════════════════════════════════════════
  //  Onglet 3 — ANALYSE IA
  // ═════════════════════════════════════════════
  private static ajouterOngletAnalyseIA(wb: XLSX.WorkBook, candidats: Candidat[]) {
    const donnees = candidats.map(c => ({
      'N° Dossier': c.numeroDossier,
      'Nom Prénom': `${c.nom} ${c.prenom}`,
      'Cotation IA globale /8': this.num(c.cotationIAProposee),
      'Note Parcours scolaire /3': this.num(c.noteParcoursScolaire),
      'Commentaire Parcours': c.commentaireParcoursScolaire || '',
      'Note Expériences /3': this.num(c.noteExperiences),
      'Commentaire Expériences': c.commentaireExperiences || '',
      'Note Motivation /2': this.num(c.noteMotivation),
      'Commentaire Motivation': c.commentaireMotivation || '',
      'Mots-clés positifs': (c.motsClesPositifs || []).join(', '),
      'Mots-clés négatifs': (c.motsClesNegatifs || []).join(', '),
      'Alertes': (c.alertes || []).join(' | '),
      'Éléments valorisants': (c.elementsValorisants || []).join(' | '),
      'Synthèse IA': c.syntheseAppreciations || '',
    }));

    const ws = XLSX.utils.json_to_sheet(donnees);
    ws['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 40 },
      { wch: 14 }, { wch: 40 }, { wch: 14 }, { wch: 40 },
      { wch: 30 }, { wch: 30 }, { wch: 35 }, { wch: 35 }, { wch: 50 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Analyse IA');
  }

  // ═════════════════════════════════════════════
  //  Onglet 4 — ÉVALUATIONS & BROUILLONS
  // ═════════════════════════════════════════════
  private static ajouterOngletEvaluations(wb: XLSX.WorkBook, candidats: Candidat[]) {
    const donnees = candidats.map(c => {
      const b = c.brouillon;
      const evals = (c.evaluateursAssignes || []);
      return {
        'N° Dossier': c.numeroDossier,
        'Nom Prénom': `${c.nom} ${c.prenom}`,
        'Statut dossier': this.formatStatut(c.statut),
        // Cotations finales
        'Cotation finale /8': this.num(c.cotationFinale),
        'Commentaire évaluateur': c.commentaireEvaluateur || '',
        'Validé par': c.validateurNom || '',
        'Date validation': c.dateValidation ? new Date(c.dateValidation).toLocaleDateString('fr-FR') : '',
        // Brouillon en cours
        'Brouillon - Cotation /8': b ? this.num(b.cotation) : '',
        'Brouillon - Parcours /3': b ? this.num(b.noteParcoursScolaire) : '',
        'Brouillon - Expériences /3': b ? this.num(b.noteExperiences) : '',
        'Brouillon - Motivation /2': b ? this.num(b.noteMotivation) : '',
        'Brouillon - Commentaire': b?.commentaire || '',
        'Brouillon - Auteur': b?.auteurNom || '',
        'Brouillon - Date': b?.dateSauvegarde ? new Date(b.dateSauvegarde).toLocaleDateString('fr-FR') : '',
        // Évaluateurs assignés
        'Évaluateurs assignés': evals.map(e => `${e.prenom} ${e.nom} (${e.role})`).join(', ') || '',
        'Nb évaluateurs': evals.length || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(donnees);
    ws['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 35 },
      { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
      { wch: 14 }, { wch: 35 }, { wch: 18 }, { wch: 14 }, { wch: 35 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Évaluations');
  }

  // ═════════════════════════════════════════════
  //  Onglet 5 — SUIVI WORKFLOW
  // ═════════════════════════════════════════════
  private static ajouterOngletWorkflow(wb: XLSX.WorkBook, candidats: Candidat[]) {
    // Flatten : une ligne par entrée de journal
    const lignes: any[] = [];
    for (const c of candidats) {
      const journal = c.journalActivite || [];
      if (journal.length === 0) {
        lignes.push({
          'N° Dossier': c.numeroDossier,
          'Nom Prénom': `${c.nom} ${c.prenom}`,
          'Statut actuel': this.formatStatut(c.statut),
          'Date': '',
          'Type action': '',
          'Auteur': '',
          'Description': '',
          'Détails': '',
        });
      } else {
        for (const j of journal) {
          lignes.push({
            'N° Dossier': c.numeroDossier,
            'Nom Prénom': `${c.nom} ${c.prenom}`,
            'Statut actuel': this.formatStatut(c.statut),
            'Date': j.date ? new Date(j.date).toLocaleDateString('fr-FR') + ' ' + new Date(j.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
            'Type action': this.formatTypeJournal(j.type),
            'Auteur': j.auteurNom || '',
            'Description': j.description || '',
            'Détails': j.details || '',
          });
        }
      }
    }

    const ws = XLSX.utils.json_to_sheet(lignes);
    ws['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 18 },
      { wch: 16 }, { wch: 18 }, { wch: 40 }, { wch: 50 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Journal Activité');
  }

  // ═════════════════════════════════════════════
  //  Onglet 6 — STATISTIQUES
  // ═════════════════════════════════════════════
  private static ajouterOngletStatistiques(wb: XLSX.WorkBook, candidats: Candidat[]) {
    const total = candidats.length;
    if (total === 0) return;

    const parStatut = (s: string) => candidats.filter(c => c.statut === s).length;
    const valides = parStatut('valide');
    const enRelecture = parStatut('en_relecture');
    const analyses = parStatut('analyse');
    const importes = parStatut('importe');
    const enAnalyseIA = parStatut('en_analyse_ia');
    const erreurs = parStatut('erreur');

    const avecCotationIA = candidats.filter(c => c.cotationIAProposee != null && c.cotationIAProposee > 0);
    const avecCotationFinale = candidats.filter(c => c.cotationFinale != null && c.cotationFinale > 0);
    const avecBrouillon = candidats.filter(c => c.brouillon != null);

    const moyIA = avecCotationIA.length > 0
      ? avecCotationIA.reduce((s, c) => s + (c.cotationIAProposee || 0), 0) / avecCotationIA.length
      : 0;
    const moyFinale = avecCotationFinale.length > 0
      ? avecCotationFinale.reduce((s, c) => s + (c.cotationFinale || 0), 0) / avecCotationFinale.length
      : 0;
    const moyGenerale = candidats.filter(c => c.moyenneGenerale).length > 0
      ? candidats.filter(c => c.moyenneGenerale).reduce((s, c) => s + (c.moyenneGenerale || 0), 0) / candidats.filter(c => c.moyenneGenerale).length
      : 0;

    // Par filière
    const filieres = ['ES', 'EJE', 'ASS'];
    const parFiliere = filieres.map(f => ({
      filiere: f,
      count: candidats.filter(c => c.filiereDemandee === f).length,
    }));

    // Par série bac
    const series = [...new Set(candidats.map(c => c.serieBac).filter(Boolean))];
    const parSerie = series.map(s => ({
      serie: s,
      count: candidats.filter(c => c.serieBac === s).length,
    }));

    const stats: any[] = [
      { 'Indicateur': '═══ EFFECTIFS ═══', 'Valeur': '' },
      { 'Indicateur': 'Total candidats', 'Valeur': total },
      { 'Indicateur': 'Importés', 'Valeur': importes },
      { 'Indicateur': 'En analyse IA', 'Valeur': enAnalyseIA },
      { 'Indicateur': 'Analysés', 'Valeur': analyses },
      { 'Indicateur': 'En relecture', 'Valeur': enRelecture },
      { 'Indicateur': 'Validés', 'Valeur': `${valides} (${total > 0 ? Math.round((valides / total) * 100) : 0}%)` },
      { 'Indicateur': 'Erreurs', 'Valeur': erreurs },
      { 'Indicateur': 'Avec brouillon en cours', 'Valeur': avecBrouillon.length },
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': '═══ MOYENNES ═══', 'Valeur': '' },
      { 'Indicateur': 'Moyenne générale scolaire', 'Valeur': moyGenerale > 0 ? moyGenerale.toFixed(2) : 'N/A' },
      { 'Indicateur': 'Moyenne cotation IA /8', 'Valeur': moyIA > 0 ? moyIA.toFixed(2) : 'N/A' },
      { 'Indicateur': 'Moyenne cotation finale /8', 'Valeur': moyFinale > 0 ? moyFinale.toFixed(2) : 'N/A' },
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': '═══ PAR FILIÈRE ═══', 'Valeur': '' },
      ...parFiliere.map(f => ({ 'Indicateur': `Filière ${f.filiere}`, 'Valeur': f.count })),
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': '═══ PAR SÉRIE BAC ═══', 'Valeur': '' },
      ...parSerie.map(s => ({ 'Indicateur': `Série ${s.serie}`, 'Valeur': s.count })),
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': '═══ EXPORT ═══', 'Valeur': '' },
      { 'Indicateur': 'Date d\'export', 'Valeur': new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR') },
      { 'Indicateur': 'Généré par', 'Valeur': 'IRTS Parcoursup Analyzer' },
    ];

    const ws = XLSX.utils.json_to_sheet(stats);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Statistiques');
  }

  // ═════════════════════════════════════════════
  //  HELPERS
  // ═════════════════════════════════════════════
  private static num(v: number | undefined | null): string | number {
    return v != null ? Math.round(v * 100) / 100 : '';
  }

  private static formatStatut(statut: string): string {
    const labels: Record<string, string> = {
      importe: 'Importé',
      en_analyse_ia: 'En analyse IA',
      analyse: 'Analysé',
      en_relecture: 'En relecture',
      valide: 'Validé',
      erreur: 'Erreur',
    };
    return labels[statut] || statut;
  }

  private static formatOuiNon(val?: string): string {
    if (!val) return '';
    const labels: Record<string, string> = { oui: 'Oui', non: 'Non', en_cours: 'En cours' };
    return labels[val] || val;
  }

  private static formatProcedure(val?: string): string {
    if (!val) return '';
    const labels: Record<string, string> = {
      admis_de_droit: 'Admis de droit',
      etude_dossier_oral: 'Étude dossier + oral',
      les_deux: 'Les deux',
    };
    return labels[val] || val;
  }

  private static formaterEvolution(evolution: string): string {
    const labels: Record<string, string> = {
      progression: 'Progression',
      stable: 'Stable',
      regression: 'Régression',
    };
    return labels[evolution] || '';
  }

  private static formatTypeJournal(type: string): string {
    const labels: Record<string, string> = {
      import: 'Import',
      analyse_ia: 'Analyse IA',
      consultation: 'Consultation',
      brouillon: 'Brouillon sauvegardé',
      note_modifiee: 'Note modifiée',
      commentaire: 'Commentaire',
      assignation: 'Assignation',
      validation: 'Validation',
      rejet: 'Rejet',
      liste_attente: 'Liste d\'attente',
      oral: 'Oral',
    };
    return labels[type] || type;
  }

  private static extractSpecialites(dp: any): string {
    try {
      const spe = dp.Specialites || dp.BacSpecialites || dp.DonneesComplementaires?.Specialites;
      if (Array.isArray(spe)) return spe.join(', ');
      if (typeof spe === 'string') return spe;
    } catch { /* */ }
    return '';
  }

  private static extractRang(dp: any): string {
    try {
      const b = dp.BulletinsScolaires || dp.Bulletins || {};
      return b.Rang || b.RangClasse || '';
    } catch { /* */ }
    return '';
  }

  private static extractEffectif(dp: any): string {
    try {
      const b = dp.BulletinsScolaires || dp.Bulletins || {};
      return b.EffectifClasse || b.Effectif || '';
    } catch { /* */ }
    return '';
  }

  /**
   * Exporte la fiche complète d'un candidat en PDF
   */
  static exporterCandidatPDF(candidat: Candidat) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    const primary = [49, 74, 206] as const; // #314ace
    const gray = [100, 116, 139] as const;

    // ── Helper: add section title ──
    const sectionTitle = (title: string) => {
      if (y > 260) { doc.addPage(); y = 15; }
      y += 4;
      doc.setFillColor(...primary);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(title, margin + 3, y + 5);
      y += 12;
      doc.setTextColor(0, 0, 0);
    };

    // ── Helper: add key-value row ──
    const addRow = (label: string, value: string | number | undefined | null, unit?: string) => {
      if (y > 275) { doc.addPage(); y = 15; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const val = value != null ? `${value}${unit || ''}` : '—';
      doc.text(val, margin + 55, y);
      y += 5.5;
    };

    // ── Header ──
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('IRTS — Fiche Candidat', margin, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${candidat.prenom} ${candidat.nom} — Dossier ${candidat.numeroDossier}`, margin, 20);
    doc.setFontSize(8);
    doc.text(`Generee le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin - 40, 20);
    y = 35;

    // ── Informations personnelles ──
    sectionTitle('Informations personnelles');
    addRow('Nom', candidat.nom);
    addRow('Prenom', candidat.prenom);
    addRow('Date de naissance', candidat.dateNaissance);
    addRow('Email', candidat.email);
    addRow('Telephone', candidat.telephone);
    addRow('N° dossier', candidat.numeroDossier);
    addRow('Etablissement', candidat.etablissementOrigine);

    // ── Formation demandée ──
    sectionTitle('Formation demandee');
    const filiereLabels: Record<string, string> = {
      ES: 'Educateur Specialise',
      EJE: 'Educateur Jeunes Enfants',
      ASS: 'Assistant Service Social',
    };
    addRow('Filiere', candidat.filiereDemandee ? `${candidat.filiereDemandee} — ${filiereLabels[candidat.filiereDemandee] || ''}` : undefined);
    addRow('Statut demande', candidat.statutDemande);
    addRow('Procedure', candidat.procedureAdmission?.replace(/_/g, ' '));
    addRow('Bac obtenu', candidat.bacObtenu);
    addRow('Type bac / Serie', `${candidat.typeBac || ''} ${candidat.serieBac || ''}`.trim() || undefined);
    addRow('Annee bac', candidat.anneeBac);
    addRow('RQTH / MDPH', candidat.rqthMdph);

    // ── Scolarité ──
    sectionTitle('Parcours scolaire');
    addRow('Moyenne generale', candidat.moyenneGenerale, '/20');
    addRow('Francais', candidat.moyenneFrancais, '/20');
    addRow('Histoire-Geo', candidat.moyenneHistoireGeo, '/20');
    addRow('Philosophie', candidat.moyennePhilosophie, '/20');
    addRow('Mathematiques', candidat.moyenneMaths, '/20');
    addRow('Evolution notes', candidat.evolutionNotes);

    // ── Analyse IA ──
    sectionTitle('Analyse IA');
    addRow('Cotation IA', candidat.cotationIAProposee, '/8');
    addRow('Cotation finale', candidat.cotationFinale, '/8');
    addRow('Parcours scolaire', candidat.noteParcoursScolaire, '/3');
    if (candidat.commentaireParcoursScolaire) {
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      const lines = doc.splitTextToSize(candidat.commentaireParcoursScolaire, pageWidth - margin * 2 - 10);
      doc.text(lines, margin + 5, y);
      y += lines.length * 4 + 2;
    }
    addRow('Experiences', candidat.noteExperiences, '/3');
    if (candidat.commentaireExperiences) {
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      const lines = doc.splitTextToSize(candidat.commentaireExperiences, pageWidth - margin * 2 - 10);
      doc.text(lines, margin + 5, y);
      y += lines.length * 4 + 2;
    }
    addRow('Motivation', candidat.noteMotivation, '/2');
    if (candidat.commentaireMotivation) {
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      const lines = doc.splitTextToSize(candidat.commentaireMotivation, pageWidth - margin * 2 - 10);
      doc.text(lines, margin + 5, y);
      y += lines.length * 4 + 2;
    }

    // Synthèse
    if (candidat.syntheseAppreciations) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('Synthese :', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      const synthLines = doc.splitTextToSize(candidat.syntheseAppreciations, pageWidth - margin * 2);
      if (y + synthLines.length * 4 > 275) { doc.addPage(); y = 15; }
      doc.text(synthLines, margin, y);
      y += synthLines.length * 4 + 3;
    }

    // Alertes
    if (candidat.alertes?.length) {
      if (y > 260) { doc.addPage(); y = 15; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(220, 38, 38);
      doc.text('Alertes :', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      candidat.alertes.forEach(a => {
        if (y > 275) { doc.addPage(); y = 15; }
        doc.text(`• ${a}`, margin + 3, y);
        y += 4.5;
      });
      y += 2;
    }

    // Éléments valorisants
    if (candidat.elementsValorisants?.length) {
      if (y > 260) { doc.addPage(); y = 15; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(22, 163, 74);
      doc.text('Elements valorisants :', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      candidat.elementsValorisants.forEach(e => {
        if (y > 275) { doc.addPage(); y = 15; }
        doc.text(`• ${e}`, margin + 3, y);
        y += 4.5;
      });
      y += 2;
    }

    // ── Oral d'admission ──
    if (candidat.oralAdmission) {
      sectionTitle("Oral d'admission");
      const o = candidat.oralAdmission;
      addRow('Participation collectif', o.noteParticipationCollectif, '/3');
      addRow('Expression emotions', o.noteExpressionEmotions, '/3');
      addRow('Analyse travail social', o.noteAnalyseTS, '/3');
      addRow('Presentation individuelle', o.notePresentationIndividuelle, '/3');
      addRow('Note totale oral', o.noteTotal, '/12');
      addRow('Jury 1', o.jury1Nom);
      addRow('Jury 2', o.jury2Nom);
      addRow('Date oral', o.dateOral);
      if (o.commentaires) {
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        const lines = doc.splitTextToSize(o.commentaires, pageWidth - margin * 2 - 10);
        if (y + lines.length * 4 > 275) { doc.addPage(); y = 15; }
        doc.text(lines, margin + 5, y);
        y += lines.length * 4 + 2;
      }
      if (o.pointsVigilance) {
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Points de vigilance :', margin, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(o.pointsVigilance, pageWidth - margin * 2 - 10);
        doc.text(lines, margin + 5, y);
        y += lines.length * 4 + 2;
      }
    }

    // ── Brouillon évaluateur ──
    if (candidat.brouillon) {
      sectionTitle('Brouillon evaluateur');
      const b = candidat.brouillon;
      addRow('Auteur', b.auteurNom);
      addRow('Cotation brouillon', b.cotation, '/8');
      addRow('Parcours scolaire', b.noteParcoursScolaire, '/3');
      addRow('Experiences', b.noteExperiences, '/3');
      addRow('Motivation', b.noteMotivation, '/2');
      addRow('Date sauvegarde', new Date(b.dateSauvegarde).toLocaleDateString('fr-FR'));
      if (b.commentaire) {
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        const lines = doc.splitTextToSize(b.commentaire, pageWidth - margin * 2 - 10);
        if (y + lines.length * 4 > 275) { doc.addPage(); y = 15; }
        doc.text(lines, margin + 5, y);
        y += lines.length * 4 + 2;
      }
    }

    // ── Workflow ──
    sectionTitle('Statut et workflow');
    const statutLabels: Record<string, string> = {
      importe: 'Importe', en_analyse_ia: 'En analyse IA', analyse: 'Analyse',
      en_relecture: 'En relecture', valide: 'Valide', erreur: 'Erreur',
    };
    addRow('Statut actuel', statutLabels[candidat.statut] || candidat.statut);
    addRow('Relecteur', candidat.relecteurNom);
    addRow('Date relecture', candidat.dateRelecture ? new Date(candidat.dateRelecture).toLocaleDateString('fr-FR') : undefined);
    addRow('Validateur', candidat.validateurNom);
    addRow('Date validation', candidat.dateValidation ? new Date(candidat.dateValidation).toLocaleDateString('fr-FR') : undefined);
    if (candidat.commentaireEvaluateur) {
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      const lines = doc.splitTextToSize(candidat.commentaireEvaluateur, pageWidth - margin * 2 - 10);
      if (y + lines.length * 4 > 275) { doc.addPage(); y = 15; }
      doc.text(lines, margin + 5, y);
      y += lines.length * 4 + 2;
    }

    // ── Journal d'activité ──
    if (candidat.journalActivite?.length) {
      sectionTitle("Journal d'activite");
      const tableData = candidat.journalActivite.map(e => [
        new Date(e.date).toLocaleDateString('fr-FR'),
        e.type,
        e.auteurNom,
        e.description,
      ]);
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Date', 'Type', 'Auteur', 'Description']],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [...primary], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });
    }

    // ── Footer on each page ──
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `IRTS Parcoursup — ${candidat.prenom} ${candidat.nom} — Page ${i}/${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      );
    }

    // Save
    const filename = `fiche-candidat-${candidat.nom}-${candidat.prenom}.pdf`.replace(/\s+/g, '-').toLowerCase();
    doc.save(filename);
  }
}
