export interface Candidat {
  id: string;
  numeroDossier: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  serieBac: string;
  etablissementOrigine: string;
  email?: string;
  telephone?: string;

  // Données scolaires
  moyenneGenerale?: number;
  moyenneFrancais?: number;
  moyenneHistoireGeo?: number;
  moyennePhilosophie?: number;
  moyenneMaths?: number;
  evolutionNotes: 'progression' | 'stable' | 'regression';

  // Informations admission (Procédure V2)
  filiereDemandee?: 'ES' | 'EJE' | 'ASS';
  statutDemande?: 'FI' | 'CA' | 'FI+CA';
  procedureAdmission?: 'admis_de_droit' | 'etude_dossier_oral' | 'les_deux';
  bacObtenu?: 'oui' | 'non' | 'en_cours';
  typeBac?: string;
  anneeBac?: string;
  rqthMdph?: 'oui' | 'non' | 'en_cours';

  // Analyse IA (legacy)
  syntheseAppreciations: string;
  motsClesPositifs: string[];
  motsClesNegatifs: string[];
  alertes: string[];
  elementsValorisants: string[];

  // Cotation
  cotationIAProposee: number;
  cotationFinale?: number;

  // Sous-notes IA (Procédure V2 - 3 critères)
  noteParcoursScolaire?: number;       // /3
  commentaireParcoursScolaire?: string;
  noteExperiences?: number;            // /3
  commentaireExperiences?: string;
  noteMotivation?: number;             // /2
  commentaireMotivation?: string;

  // Oral d'admission
  oralAdmission?: OralAdmission;

  // Workflow
  statut: 'importe' | 'en_analyse_ia' | 'analyse' | 'en_relecture' | 'valide' | 'erreur';

  // Traçabilité
  relecteurId?: string;
  relecteurNom?: string;
  dateRelecture?: string;
  validateurId?: string;
  validateurNom?: string;
  dateValidation?: string;
  commentaireEvaluateur?: string;

  // Données brutes Parcoursup
  donneesParcoursup?: any;
}

// Résultat d'évaluation d'un critère IA
export interface EvaluationCritere {
  note: number;
  commentaire: string;
}

// Résultat complet de l'analyse IA (Procédure V2)
export interface ResultatAnalyseIA {
  parcoursScolaire: EvaluationCritere;   // /3
  experiences: EvaluationCritere;         // /3
  motivation: EvaluationCritere;          // /2
  noteTotal: number;                      // /8
  justificationGlobale: string;
  alertes: string[];
  elementsValorisants: string[];
}

// Oral d'admission (jury de 2 personnes, candidats FI)
export interface OralAdmission {
  id?: string;
  candidatId: string;
  noteParticipationCollectif?: number;    // /3
  noteExpressionEmotions?: number;        // /3
  noteAnalyseTS?: number;                 // /3
  notePresentationIndividuelle?: number;  // /3
  noteTotal?: number;                     // /12
  jury1Nom?: string;
  jury2Nom?: string;
  commentaires?: string;
  pointsVigilance?: string;
  dateOral?: string;
}

export type StatutStats = {
  importe: number;
  en_analyse_ia: number;
  analyse: number;
  en_relecture: number;
  valide: number;
  [key: string]: number;
};

export interface Campagne {
  id: string;
  nom: string;
  libelle?: string;
  annee?: number;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  dateCreation: string;
  statut: 'en_cours' | 'terminee' | 'archivee';
  nombreCandidats: number;
  statistiques: {
    importe: number;
    enAnalyse: number;
    analyse: number;
    enRelecture: number;
    valide: number;
    erreur: number;
  };
}

export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  avatar?: string;
  role: 'admin' | 'evaluateur';
}

export interface Filtres {
  recherche: string;
  statuts: string[];
  alertesUniquement: boolean;
}

export interface ConfigurationAnalyse {
  seuilMoyenne: number;
  motsClesPositifs: string[];
  motsClesNegatifs: string[];
  elementsValorisants: string[];
  ponderations: {
    academique: number;
    motivation: number;
    experience: number;
    qualites: number;
  };
}
