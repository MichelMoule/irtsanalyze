import { PrismaClient } from '@prisma/client';
import { Candidat, ResultatAnalyseIA, OralAdmission } from '@/types';

const prisma = new PrismaClient();

/**
 * Service de persistance des données avec Prisma
 * Adapté pour la Procédure Admission V2 (3 critères + oral)
 */
export class DatabaseService {

  /**
   * Sauvegarde un candidat et ses données Parcoursup
   * Inclut les informations d'admission (Procédure V2)
   */
  static async sauvegarderCandidat(
    candidatData: any,
    donneesParcoursup: any,
    infoAdmission?: {
      filiereDemandee: string;
      statutDemande: string;
      procedureAdmission: string;
      bacObtenu: string;
      typeBac: string;
      anneeBac: string;
      rqthMdph: string;
    }
  ): Promise<Candidat> {
    try {
      const donneesCandidat = candidatData.DonneesCandidats || {};
      const scolarite = candidatData.Scolarite || [];
      const baccalaureat = candidatData.Baccalaureat || {};

      const moyennes = this.calculerMoyennesBac(candidatData);
      const etablissementOrigine = this.getEtablissementOrigine(scolarite);

      const candidat = await prisma.candidat.create({
        data: {
          numeroDossier: donneesCandidat.NumeroDossierCandidat || `D${Date.now()}`,
          nom: donneesCandidat.NomCandidat || 'Nom inconnu',
          prenom: donneesCandidat.PrenomCandidat || 'Prénom inconnu',
          dateNaissance: donneesCandidat.DateNaissance || '',
          email: donneesCandidat.CoordonneesAdressemail || '',
          telephone: donneesCandidat.CoordonneesTelephonemobile || '',
          serieBac: baccalaureat.SerieDiplomeLibelle || 'Inconnue',
          mentionBac: baccalaureat.MentionObtenueLibelle || '',
          etablissementOrigine: etablissementOrigine,

          // Moyennes
          moyenneGenerale: moyennes.generale,
          moyenneFrancais: moyennes.francais,
          moyenneHistoireGeo: moyennes.histoireGeo,
          moyennePhilosophie: moyennes.philosophie,
          moyenneMaths: moyennes.maths,
          evolutionNotes: this.analyserEvolutionScolarite(scolarite),

          // Informations admission (Procédure V2)
          filiereDemandee: infoAdmission?.filiereDemandee || null,
          statutDemande: infoAdmission?.statutDemande || null,
          procedureAdmission: infoAdmission?.procedureAdmission || null,
          bacObtenu: infoAdmission?.bacObtenu || null,
          typeBac: infoAdmission?.typeBac || null,
          anneeBac: infoAdmission?.anneeBac || null,
          rqthMdph: infoAdmission?.rqthMdph || null,

          // Données brutes Parcoursup
          donneesParcoursup: JSON.stringify(donneesParcoursup),

          statut: 'importe',
        }
      });

      console.log(`✅ Candidat sauvegardé: ${candidat.nom} ${candidat.prenom} (${candidat.numeroDossier})`);
      return this.mapPrismaToCandidat(candidat);

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du candidat:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde l'analyse IA d'un candidat (Procédure V2 avec 3 sous-notes)
   */
  static async sauvegarderAnalyseIA(candidatId: string, analyse: ResultatAnalyseIA): Promise<void> {
    try {
      // Sauvegarder dans la table AnalyseIA
      await prisma.analyseIA.create({
        data: {
          candidatId: candidatId,
          syntheseAppreciations: analyse.justificationGlobale,
          motsClesPositifs: JSON.stringify([]),
          motsClesNegatifs: JSON.stringify([]),
          alertes: JSON.stringify(analyse.alertes || []),
          elementsValorisants: JSON.stringify(analyse.elementsValorisants || []),
          cotationIAProposee: analyse.noteTotal,
          justificationIA: analyse.justificationGlobale,

          // Sous-notes (Procédure V2)
          noteParcoursScolaire: analyse.parcoursScolaire.note,
          commentaireParcoursScolaire: analyse.parcoursScolaire.commentaire,
          noteExperiences: analyse.experiences.note,
          commentaireExperiences: analyse.experiences.commentaire,
          noteMotivation: analyse.motivation.note,
          commentaireMotivation: analyse.motivation.commentaire,

          versionModele: 'v2.0',
        }
      });

      // Dénormaliser les sous-notes sur le candidat pour accès rapide
      await prisma.candidat.update({
        where: { id: candidatId },
        data: {
          cotationIAProposee: analyse.noteTotal,
          syntheseAppreciations: analyse.justificationGlobale,
          alertes: JSON.stringify(analyse.alertes || []),
          elementsValorisants: JSON.stringify(analyse.elementsValorisants || []),
          noteParcoursScolaire: analyse.parcoursScolaire.note,
          commentaireParcoursScolaire: analyse.parcoursScolaire.commentaire,
          noteExperiences: analyse.experiences.note,
          commentaireExperiences: analyse.experiences.commentaire,
          noteMotivation: analyse.motivation.note,
          commentaireMotivation: analyse.motivation.commentaire,
          statut: 'analyse',
        }
      });

      console.log(`✅ Analyse IA V2 sauvegardée pour candidat ${candidatId} (${analyse.noteTotal}/8)`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'analyse IA:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les candidats avec leurs analyses et validations
   */
  static async getCandidats(): Promise<Candidat[]> {
    try {
      const candidats = await prisma.candidat.findMany({
        include: {
          analyses: {
            orderBy: { dateAnalyse: 'desc' },
            take: 1
          },
          validations: {
            orderBy: { dateValidation: 'desc' },
            take: 1
          },
          oralAdmission: true,
        },
        orderBy: { dateImport: 'desc' }
      });

      return candidats.map(c => this.mapPrismaToCandidat(c));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des candidats:', error);
      throw error;
    }
  }

  /**
   * Récupère un candidat par son ID
   */
  static async getCandidat(id: string): Promise<Candidat | null> {
    try {
      const candidat = await prisma.candidat.findUnique({
        where: { id },
        include: {
          analyses: {
            orderBy: { dateAnalyse: 'desc' }
          },
          validations: {
            orderBy: { dateValidation: 'desc' }
          },
          oralAdmission: true,
        }
      });

      return candidat ? this.mapPrismaToCandidat(candidat) : null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du candidat:', error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'un candidat
   */
  static async updateCandidatStatut(id: string, statut: string): Promise<void> {
    try {
      await prisma.candidat.update({
        where: { id },
        data: { statut }
      });
      console.log(`✅ Statut mis à jour pour candidat ${id}: ${statut}`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde une validation humaine
   */
  static async sauvegarderValidation(
    candidatId: string,
    validationData: {
      statut: string;
      cotationFinale?: number;
      commentaire?: string;
      validateurId?: string;
      validateurNom?: string;
    }
  ): Promise<void> {
    try {
      await prisma.validation.create({
        data: {
          candidatId: candidatId,
          statut: validationData.statut,
          cotationFinale: validationData.cotationFinale,
          commentaire: validationData.commentaire,
          validateurId: validationData.validateurId,
          validateurNom: validationData.validateurNom,
          dateValidation: new Date(),
        }
      });

      await this.updateCandidatStatut(candidatId, validationData.statut);
      console.log(`✅ Validation sauvegardée pour candidat ${candidatId}: ${validationData.statut}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la validation:', error);
      throw error;
    }
  }

  // ─── ORAL D'ADMISSION ──────────────────────────────────────

  /**
   * Sauvegarde ou met à jour les notes d'oral d'admission
   */
  static async sauvegarderOralAdmission(
    candidatId: string,
    oralData: Omit<OralAdmission, 'id' | 'candidatId'>
  ): Promise<OralAdmission> {
    try {
      const noteTotal = (oralData.noteParticipationCollectif || 0) +
        (oralData.noteExpressionEmotions || 0) +
        (oralData.noteAnalyseTS || 0) +
        (oralData.notePresentationIndividuelle || 0);

      const oral = await prisma.oralAdmission.upsert({
        where: { candidatId },
        create: {
          candidatId,
          noteParticipationCollectif: oralData.noteParticipationCollectif,
          noteExpressionEmotions: oralData.noteExpressionEmotions,
          noteAnalyseTS: oralData.noteAnalyseTS,
          notePresentationIndividuelle: oralData.notePresentationIndividuelle,
          noteTotal,
          jury1Nom: oralData.jury1Nom,
          jury2Nom: oralData.jury2Nom,
          commentaires: oralData.commentaires,
          pointsVigilance: oralData.pointsVigilance,
          dateOral: oralData.dateOral ? new Date(oralData.dateOral) : new Date(),
        },
        update: {
          noteParticipationCollectif: oralData.noteParticipationCollectif,
          noteExpressionEmotions: oralData.noteExpressionEmotions,
          noteAnalyseTS: oralData.noteAnalyseTS,
          notePresentationIndividuelle: oralData.notePresentationIndividuelle,
          noteTotal,
          jury1Nom: oralData.jury1Nom,
          jury2Nom: oralData.jury2Nom,
          commentaires: oralData.commentaires,
          pointsVigilance: oralData.pointsVigilance,
          dateOral: oralData.dateOral ? new Date(oralData.dateOral) : new Date(),
        },
      });

      console.log(`✅ Oral d'admission sauvegardé pour candidat ${candidatId} (${noteTotal}/12)`);

      return {
        id: oral.id,
        candidatId: oral.candidatId,
        noteParticipationCollectif: oral.noteParticipationCollectif ?? undefined,
        noteExpressionEmotions: oral.noteExpressionEmotions ?? undefined,
        noteAnalyseTS: oral.noteAnalyseTS ?? undefined,
        notePresentationIndividuelle: oral.notePresentationIndividuelle ?? undefined,
        noteTotal: oral.noteTotal ?? undefined,
        jury1Nom: oral.jury1Nom ?? undefined,
        jury2Nom: oral.jury2Nom ?? undefined,
        commentaires: oral.commentaires ?? undefined,
        pointsVigilance: oral.pointsVigilance ?? undefined,
        dateOral: oral.dateOral?.toISOString(),
      };
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'oral:', error);
      throw error;
    }
  }

  /**
   * Récupère les notes d'oral d'un candidat
   */
  static async getOralAdmission(candidatId: string): Promise<OralAdmission | null> {
    try {
      const oral = await prisma.oralAdmission.findUnique({
        where: { candidatId }
      });

      if (!oral) return null;

      return {
        id: oral.id,
        candidatId: oral.candidatId,
        noteParticipationCollectif: oral.noteParticipationCollectif ?? undefined,
        noteExpressionEmotions: oral.noteExpressionEmotions ?? undefined,
        noteAnalyseTS: oral.noteAnalyseTS ?? undefined,
        notePresentationIndividuelle: oral.notePresentationIndividuelle ?? undefined,
        noteTotal: oral.noteTotal ?? undefined,
        jury1Nom: oral.jury1Nom ?? undefined,
        jury2Nom: oral.jury2Nom ?? undefined,
        commentaires: oral.commentaires ?? undefined,
        pointsVigilance: oral.pointsVigilance ?? undefined,
        dateOral: oral.dateOral?.toISOString(),
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'oral:', error);
      throw error;
    }
  }

  // ─── MAPPING ───────────────────────────────────────────────

  /**
   * Mappe un candidat Prisma vers le type Candidat
   */
  private static mapPrismaToCandidat(prismaCandidat: any): Candidat {
    const derniereAnalyse = prismaCandidat.analyses?.[0];
    const derniereValidation = prismaCandidat.validations?.[0];
    const oral = prismaCandidat.oralAdmission;

    return {
      id: prismaCandidat.id,
      numeroDossier: prismaCandidat.numeroDossier,
      nom: prismaCandidat.nom,
      prenom: prismaCandidat.prenom,
      dateNaissance: prismaCandidat.dateNaissance || '',
      serieBac: prismaCandidat.serieBac || 'Inconnue',
      etablissementOrigine: prismaCandidat.etablissementOrigine || 'Non renseigné',
      email: prismaCandidat.email || '',
      telephone: prismaCandidat.telephone || '',

      // Données scolaires
      moyenneGenerale: prismaCandidat.moyenneGenerale,
      moyenneFrancais: prismaCandidat.moyenneFrancais,
      moyenneHistoireGeo: prismaCandidat.moyenneHistoireGeo,
      moyennePhilosophie: prismaCandidat.moyennePhilosophie,
      moyenneMaths: prismaCandidat.moyenneMaths,
      evolutionNotes: prismaCandidat.evolutionNotes || 'stable',

      // Informations admission (Procédure V2)
      filiereDemandee: prismaCandidat.filiereDemandee || undefined,
      statutDemande: prismaCandidat.statutDemande || undefined,
      procedureAdmission: prismaCandidat.procedureAdmission || undefined,
      bacObtenu: prismaCandidat.bacObtenu || undefined,
      typeBac: prismaCandidat.typeBac || undefined,
      anneeBac: prismaCandidat.anneeBac || undefined,
      rqthMdph: prismaCandidat.rqthMdph || undefined,

      // Données IA
      syntheseAppreciations: prismaCandidat.syntheseAppreciations || derniereAnalyse?.syntheseAppreciations || '',
      motsClesPositifs: derniereAnalyse ? JSON.parse(derniereAnalyse.motsClesPositifs || '[]') : [],
      motsClesNegatifs: derniereAnalyse ? JSON.parse(derniereAnalyse.motsClesNegatifs || '[]') : [],
      alertes: this.parseJSON(prismaCandidat.alertes) || (derniereAnalyse ? JSON.parse(derniereAnalyse.alertes || '[]') : []),
      elementsValorisants: this.parseJSON(prismaCandidat.elementsValorisants) || (derniereAnalyse ? JSON.parse(derniereAnalyse.elementsValorisants || '[]') : []),
      cotationIAProposee: prismaCandidat.cotationIAProposee || derniereAnalyse?.cotationIAProposee || 0,

      // Sous-notes IA (Procédure V2)
      noteParcoursScolaire: prismaCandidat.noteParcoursScolaire ?? derniereAnalyse?.noteParcoursScolaire ?? undefined,
      commentaireParcoursScolaire: prismaCandidat.commentaireParcoursScolaire ?? derniereAnalyse?.commentaireParcoursScolaire ?? undefined,
      noteExperiences: prismaCandidat.noteExperiences ?? derniereAnalyse?.noteExperiences ?? undefined,
      commentaireExperiences: prismaCandidat.commentaireExperiences ?? derniereAnalyse?.commentaireExperiences ?? undefined,
      noteMotivation: prismaCandidat.noteMotivation ?? derniereAnalyse?.noteMotivation ?? undefined,
      commentaireMotivation: prismaCandidat.commentaireMotivation ?? derniereAnalyse?.commentaireMotivation ?? undefined,

      // Oral d'admission
      oralAdmission: oral ? {
        id: oral.id,
        candidatId: oral.candidatId,
        noteParticipationCollectif: oral.noteParticipationCollectif ?? undefined,
        noteExpressionEmotions: oral.noteExpressionEmotions ?? undefined,
        noteAnalyseTS: oral.noteAnalyseTS ?? undefined,
        notePresentationIndividuelle: oral.notePresentationIndividuelle ?? undefined,
        noteTotal: oral.noteTotal ?? undefined,
        jury1Nom: oral.jury1Nom ?? undefined,
        jury2Nom: oral.jury2Nom ?? undefined,
        commentaires: oral.commentaires ?? undefined,
        pointsVigilance: oral.pointsVigilance ?? undefined,
        dateOral: oral.dateOral?.toISOString(),
      } : undefined,

      // Cotation finale
      cotationFinale: derniereValidation?.cotationFinale || undefined,
      commentaireEvaluateur: derniereValidation?.commentaire || '',
      validateurNom: derniereValidation?.validateurNom || '',
      dateValidation: derniereValidation?.dateValidation || undefined,

      // Workflow
      statut: prismaCandidat.statut,

      // Données brutes Parcoursup
      donneesParcoursup: prismaCandidat.donneesParcoursup ? JSON.parse(prismaCandidat.donneesParcoursup) : {},
    };
  }

  private static parseJSON(str: string | null | undefined): any[] | null {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  // ─── HELPERS ───────────────────────────────────────────────

  private static calculerMoyennesBac(candidatData: any): {
    generale: number | null;
    francais: number | null;
    histoireGeo: number | null;
    philosophie: number | null;
    maths: number | null;
  } {
    // Les NotesBaccalaureat sont au niveau racine du candidat, pas dans l'objet Baccalaureat
    const notes = candidatData.NotesBaccalaureat || [];

    if (notes.length === 0) {
      return { generale: null, francais: null, histoireGeo: null, philosophie: null, maths: null };
    }

    const extraireNote = (noteBrut: any): number | null => {
      if (!noteBrut?.NoteEpreuve) return null;
      const note = parseFloat(noteBrut.NoteEpreuve.replace(',', '.'));
      return isNaN(note) ? null : note;
    };

    const moyenneGenerale = notes.find((note: any) =>
      note.EpreuveLibelle === 'Moyenne générale' || note.EpreuveLibelle === 'Moyenne Générale'
    );
    const noteFrancais = notes.find((note: any) =>
      note.EpreuveLibelle?.toLowerCase().includes('fran')
    );
    const noteHistoireGeo = notes.find((note: any) =>
      note.EpreuveLibelle?.toLowerCase().includes('histoire') || note.EpreuveLibelle?.toLowerCase().includes('géo')
    );
    const notePhilosophie = notes.find((note: any) =>
      note.EpreuveLibelle?.toLowerCase().includes('philosophie')
    );
    const noteMaths = notes.find((note: any) =>
      note.EpreuveLibelle?.toLowerCase().includes('math')
    );

    // Si pas de moyenne générale explicite, calculer depuis les notes disponibles
    const notesAvecValeurs = notes
      .map((n: any) => extraireNote(n))
      .filter((n: number | null): n is number => n !== null);

    const moyenneCalculee = notesAvecValeurs.length >= 3
      ? Math.round(notesAvecValeurs.reduce((s: number, n: number) => s + n, 0) / notesAvecValeurs.length * 10) / 10
      : null;

    return {
      generale: extraireNote(moyenneGenerale) ?? moyenneCalculee,
      francais: extraireNote(noteFrancais),
      histoireGeo: extraireNote(noteHistoireGeo),
      philosophie: extraireNote(notePhilosophie),
      maths: extraireNote(noteMaths),
    };
  }

  private static getEtablissementOrigine(scolarite: any[]): string {
    if (!scolarite || scolarite.length === 0) return 'Non renseigné';
    const derniereAnnee = scolarite[0];
    return derniereAnnee.NomEtablissementOrigine || 'Non renseigné';
  }

  private static analyserEvolutionScolarite(scolarite: any[]): 'progression' | 'stable' | 'regression' {
    if (!scolarite || scolarite.length < 2) return 'stable';
    return 'stable';
  }
}
