import { Candidat } from '@/types';
import { DatabaseService } from './databaseService';
import { AnalyseurCandidatService } from './analyseurCandidat';

/**
 * Service d'import des données Parcoursup depuis JSON
 * Implémente la logique d'admission de la Procédure V2 :
 *   - CA uniquement → admis de droit
 *   - FI uniquement → étude du dossier et oral d'admission
 *   - FI+CA → les deux
 *   - Analyse IA uniquement pour les candidats FI
 */
export class ImportService {

  /**
   * Importe et transforme les données brutes Parcoursup en format Candidat
   * Avec sauvegarde en base de données
   */
  static async importerDonneesParcoursup(donneesBrutes: any): Promise<Candidat[]> {
    console.log('📁 ImportService: Début de l\'import avec persistance');
    console.log('📊 Structure des données reçues:', Object.keys(donneesBrutes));

    let candidatsData: any[] = [];

    // Détection de la structure spécifique IRTS Parcoursup
    if (donneesBrutes.exportDeDonnees?.exportCandidats?.[0]?.candidats) {
      console.log('✅ Format IRTS Parcoursup détecté: exportDeDonnees.exportCandidats[0].candidats');
      candidatsData = donneesBrutes.exportDeDonnees.exportCandidats[0].candidats;
    } else if (Array.isArray(donneesBrutes)) {
      console.log('✅ Format direct Array détecté');
      candidatsData = donneesBrutes;
    } else if (donneesBrutes.candidats) {
      console.log('✅ Format { candidats: [...] } détecté');
      candidatsData = donneesBrutes.candidats;
    } else if (donneesBrutes.Candidats) {
      console.log('✅ Format { Candidats: [...] } détecté');
      candidatsData = donneesBrutes.Candidats;
    } else if (donneesBrutes.candidates) {
      console.log('✅ Format { candidates: [...] } détecté');
      candidatsData = donneesBrutes.candidates;
    } else {
      console.log('❌ Format non reconnu - recherche dans toutes les propriétés');
      for (const key in donneesBrutes) {
        if (Array.isArray(donneesBrutes[key])) {
          console.log(`✅ Array trouvé dans la propriété '${key}'`);
          candidatsData = donneesBrutes[key];
          break;
        }
      }
    }

    if (candidatsData.length === 0) {
      throw new Error('Format de données invalide - candidats non trouvés');
    }

    console.log(`✅ ${candidatsData.length} candidats trouvés`);

    const candidatsImportes: Candidat[] = [];

    for (let index = 0; index < candidatsData.length; index++) {
      const candidatBrut = candidatsData[index];
      console.log(`🔄 Traitement candidat ${index + 1}/${candidatsData.length}`);

      try {
        // Extraire les informations d'admission (Procédure V2)
        const infoAdmission = this.extraireInfoAdmission(candidatBrut);

        // Sauvegarder le candidat en base avec les infos d'admission
        const candidat = await DatabaseService.sauvegarderCandidat(candidatBrut, candidatBrut, infoAdmission);

        // Déterminer si le candidat doit être analysé par l'IA
        const doitAnalyser = AnalyseurCandidatService.doitEtreAnalyse(infoAdmission.statutDemande);

        if (doitAnalyser) {
          // Analyse IA avec le nouveau barème (Procédure V2)
          const analyse = AnalyseurCandidatService.analyserCandidat(candidat);

          // Sauvegarder l'analyse IA avec les sous-notes
          await DatabaseService.sauvegarderAnalyseIA(candidat.id, analyse);

          // Créer la validation initiale
          await DatabaseService.sauvegarderValidation(candidat.id, {
            statut: 'en_analyse_ia',
          });

          // Mettre à jour le candidat avec les données d'analyse
          const candidatComplet: Candidat = {
            ...candidat,
            noteParcoursScolaire: analyse.parcoursScolaire.note,
            commentaireParcoursScolaire: analyse.parcoursScolaire.commentaire,
            noteExperiences: analyse.experiences.note,
            commentaireExperiences: analyse.experiences.commentaire,
            noteMotivation: analyse.motivation.note,
            commentaireMotivation: analyse.motivation.commentaire,
            cotationIAProposee: analyse.noteTotal,
            syntheseAppreciations: analyse.justificationGlobale,
            alertes: analyse.alertes,
            elementsValorisants: analyse.elementsValorisants,
          };

          candidatsImportes.push(candidatComplet);
        } else {
          // Candidat CA → admis de droit, pas d'analyse IA
          console.log(`  ✓ Candidat ${candidat.nom} ${candidat.prenom} : CA → admis de droit (pas d'analyse IA)`);

          await DatabaseService.updateCandidatStatut(candidat.id, 'valide');

          candidatsImportes.push({
            ...candidat,
            statut: 'valide',
          });
        }

      } catch (error) {
        console.error(`❌ Erreur lors du traitement du candidat ${index + 1}:`, error);
      }
    }

    console.log(`✅ Import terminé - ${candidatsImportes.length} candidats importés et sauvegardés`);
    return candidatsImportes;
  }

  /**
   * Extrait les informations d'admission de la Procédure V2 depuis les données brutes
   */
  private static extraireInfoAdmission(candidatBrut: any): {
    filiereDemandee: string;
    statutDemande: string;
    procedureAdmission: string;
    bacObtenu: string;
    typeBac: string;
    anneeBac: string;
    rqthMdph: string;
  } {
    const donneesCandidat = candidatBrut.DonneesCandidats || {};
    const bac = candidatBrut.Baccalaureat || {};
    const donneesVoeux = candidatBrut.DonneesVoeux || {};

    // Filière demandée (ES / EJE / ASS)
    const filiereDemandee = this.detecterFiliere(donneesVoeux, donneesCandidat);

    // Statut demandé (FI / CA / FI+CA)
    const statutDemande = this.detecterStatutDemande(donneesVoeux, donneesCandidat);

    // Procédure d'admission
    const procedureAdmission = AnalyseurCandidatService.determinerProcedureAdmission(statutDemande);

    // Bac obtenu
    const bacObtenu = this.detecterBacObtenu(bac);

    // Type de bac
    const typeBac = bac.SerieDiplomeLibelle || bac.TypeBac || '';

    // Année bac
    const anneeBac = bac.AnneeObtention || bac.AnneeBac || '';

    // RQTH/MDPH
    const rqthMdph = this.detecterRQTH(donneesCandidat);

    return {
      filiereDemandee,
      statutDemande,
      procedureAdmission,
      bacObtenu,
      typeBac,
      anneeBac,
      rqthMdph,
    };
  }

  private static detecterFiliere(donneesVoeux: any, donneesCandidat: any): string {
    const voeuLibelle = (donneesVoeux.VoeuLibelle || donneesVoeux.FormationLibelle || '').toLowerCase();
    const formation = (donneesCandidat.FormationDemandee || '').toLowerCase();
    const texte = voeuLibelle + ' ' + formation;

    if (texte.includes('éducateur spécialisé') || texte.includes('es ') || texte.includes(' es')) return 'ES';
    if (texte.includes('éducateur de jeunes enfants') || texte.includes('eje')) return 'EJE';
    if (texte.includes('assistant social') || texte.includes('assistante sociale') || texte.includes('ass ') || texte.includes(' ass')) return 'ASS';

    return '';
  }

  private static detecterStatutDemande(donneesVoeux: any, donneesCandidat: any): string {
    const statut = donneesVoeux.StatutDemande || donneesCandidat.StatutDemande || donneesVoeux.TypeCandidat || '';
    const statutUpper = statut.toUpperCase().trim();

    if (statutUpper.includes('CA') && statutUpper.includes('FI')) return 'FI+CA';
    if (statutUpper === 'CA' || statutUpper.includes('CONTRAT') || statutUpper.includes('APPRENTI')) return 'CA';
    if (statutUpper === 'FI' || statutUpper.includes('FORMATION INITIALE') || statutUpper.includes('INITIAL')) return 'FI';

    // Par défaut, FI (formation initiale) pour assurer l'analyse
    return 'FI';
  }

  private static detecterBacObtenu(bac: any): string {
    if (bac.BaccalaureatObtenu === 'Oui' || bac.BacStatut === 'obtenu' || bac.Obtenu === true) return 'oui';
    if (bac.BaccalaureatObtenu === 'Non' || bac.BacStatut === 'non_obtenu') return 'non';
    if (bac.BacStatut === 'en_cours' || bac.EnCours === true) return 'en_cours';
    // Si année bac existe et est passée → probablement obtenu
    if (bac.AnneeObtention) return 'oui';
    return 'en_cours';
  }

  private static detecterRQTH(donneesCandidat: any): string {
    const rqth = donneesCandidat.RQTH || donneesCandidat.SituationHandicap || '';
    const rqthLC = rqth.toString().toLowerCase();
    if (rqthLC === 'oui' || rqthLC === 'true') return 'oui';
    if (rqthLC === 'en cours' || rqthLC === 'en_cours') return 'en_cours';
    return 'non';
  }

}
