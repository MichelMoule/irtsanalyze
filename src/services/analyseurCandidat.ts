import { Candidat, ResultatAnalyseIA, EvaluationCritere } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════════
// Service d'analyse IA — Procédure Admission V2 (conformité stricte)
//
// Architecture : Profile Matching (pas accumulation de points)
//   1. Extraire TOUS les indicateurs → objet structuré
//   2. Pour chaque indicateur : { disponible, valeur, interprétation }
//   3. Déterminer le palier qui correspond le mieux au profil global
//   4. Générer le commentaire avec le template EXACT du document
//
// 3 critères :
//   1. Parcours scolaire / universitaire / notes BAC : /3 (27 indicateurs)
//   2. Expériences personnelles et professionnelles : /3 (13 indicateurs)
//   3. Motivation et projet professionnel : /2 (13 indicateurs)
//   Total : /8
//
// Règles inviolables :
//   - 0 = inévaluable (manque d'info), JAMAIS "mauvais"
//   - Ne jamais inventer d'info manquante → "non renseigné dans le dossier"
//   - Ne pas pénaliser les terminales pour bac non obtenu
//   - Ne pas survaloriser un bac "social" si notes/appréciations faibles
//   - Un bac éloigné du social n'est pas pénalisant si compétences transférables bonnes
//   - Peu d'expériences : ne pas pénaliser automatiquement
//   - "Beau discours" ≠ motivation réelle
//   - Qualité de langue : critère de clarté, pas de discrimination sociale
//   - Reconversion/parcours atypique : valoriser cohérence et maturité
//   - Plus c'est précis → plus c'est valorisable
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Types internes ────────────────────────────────────────────────────────

export interface DonneesExtraites {
  bac: {
    obtenu: boolean | null;
    enCours: boolean;
    type: string; // général / technologique / professionnel / non renseigné
    serie: string;
    serieLibelle: string;
    specialites: string[];
    anneeObtention: string | null;
  };
  notesBac: {
    francais: number | null;
    philosophie: number | null;
    histoireGeo: number | null;
    ses: number | null;
    st2s: { matiere: string; note: number }[];
    langues: number | null;
    moyenneGenerale: number | null;
    toutesNotes: { matiere: string; note: number }[];
  };
  scolarite: {
    aRedouble: boolean;
    aRupture: boolean;
    aEtudesSup: boolean;
    detailSup: string | null;
    niveauSup: string | null;
    validationSup: string | null;
  };
  activites: {
    experiencesPro: string;
    engagementsCitoyen: string;
    encadrement: string;
    sportCulture: string;
    texteComplet: string;
  };
  motivation: {
    lettre: string;
    longueur: number;
  };
  formation: {
    filiere: 'ES' | 'EJE' | 'ASS' | '';
    typeCandidat: string;
  };
  appreciations: {
    texte: string;
    disponible: boolean;
  };
}

export interface Indicateur {
  id: string;
  disponible: boolean;
  valeur: string | number | boolean | null;
  interpretation: string;
}

export interface AnalyseDetailleeResult {
  donnees: DonneesExtraites;
  indicateursScolaires: Indicateur[];
  indicateursExperiences: Indicateur[];
  indicateursMotivation: Indicateur[];
  palierScolaire: number;
  palierExperiences: number;
  palierMotivation: number;
}

// ─── POINT D'ENTRÉE ────────────────────────────────────────────────────────

export class AnalyseurCandidatService {

  static analyserCandidat(candidat: Candidat): ResultatAnalyseIA {
    const donnees = this.extraireDonneesCompletes(candidat);

    const parcoursScolaire = this.evaluerParcoursScolaire(candidat, donnees);
    const experiences = this.evaluerExperiences(donnees);
    const motivation = this.evaluerMotivation(candidat, donnees);

    const noteTotal = this.arrondirDemi(
      parcoursScolaire.note + experiences.note + motivation.note
    );

    const alertes = this.detecterAlertes(noteTotal, parcoursScolaire, experiences, motivation, donnees);
    const elementsValorisants = this.identifierElementsValorisants(parcoursScolaire, experiences, motivation, donnees);

    const justificationGlobale = this.genererJustificationGlobale(
      noteTotal, parcoursScolaire, experiences, motivation
    );

    return {
      parcoursScolaire,
      experiences,
      motivation,
      noteTotal,
      justificationGlobale,
      alertes,
      elementsValorisants,
    };
  }

  static determinerProcedureAdmission(statutDemande: string): 'admis_de_droit' | 'etude_dossier_oral' | 'les_deux' {
    const statut = statutDemande?.toUpperCase().trim();
    if (statut === 'CA') return 'admis_de_droit';
    if (statut === 'FI') return 'etude_dossier_oral';
    if (statut === 'FI+CA' || statut === 'CA+FI') return 'les_deux';
    return 'etude_dossier_oral';
  }

  static doitEtreAnalyse(statutDemande: string): boolean {
    const statut = statutDemande?.toUpperCase().trim();
    return statut === 'FI' || statut === 'FI+CA' || statut === 'CA+FI';
  }

  /**
   * Retourne l'analyse détaillée avec TOUS les indicateurs pour l'affichage transparent.
   * Recalcule les indicateurs à partir de donneesParcoursup.
   */
  static getAnalyseDetaillee(candidat: Candidat): AnalyseDetailleeResult | null {
    if (!candidat.donneesParcoursup) return null;
    const donnees = this.extraireDonneesCompletes(candidat);
    const indicateursScolaires = this.evaluerIndicateursScolaires(candidat, donnees);
    const indicateursExperiences = this.evaluerIndicateursExperiences(donnees);
    const indicateursMotivation = this.evaluerIndicateursMotivation(candidat, donnees);
    const palierScolaire = this.determinerPalierScolaire(indicateursScolaires, donnees);
    const palierExperiences = this.determinerPalierExperiences(indicateursExperiences, donnees);
    const palierMotivation = this.determinerPalierMotivation(indicateursMotivation, donnees);
    return {
      donnees,
      indicateursScolaires,
      indicateursExperiences,
      indicateursMotivation,
      palierScolaire,
      palierExperiences,
      palierMotivation,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : EXTRACTION DE DONNÉES
  // ═══════════════════════════════════════════════════════════════════════════

  private static extraireDonneesCompletes(candidat: Candidat): DonneesExtraites {
    const dp = candidat.donneesParcoursup || {};
    const bac = dp.Baccalaureat || {};
    const notesBacRaw = dp.NotesBaccalaureat || dp.NotesBac || {};
    const scolariteArr = dp.Scolarite || [];
    const activites = dp.ActivitesCentresInteret || {};
    const donneesVoeux = dp.DonneesVoeux || {};
    const bulletins = dp.BulletinsScolaires || dp.Bulletins || [];

    // ── BAC ──
    const serieBac = bac.SerieDiplomeLibelle || bac.SerieLibelle || candidat.serieBac || '';
    const typeBac = this.determinerTypeBac(serieBac);
    const bacObtenuRaw = bac.BacStatut || bac.BaccalaureatObtenu || '';
    const bacObtenu = bacObtenuRaw === 'obtenu' || bacObtenuRaw === 'Oui' ? true
      : bacObtenuRaw === 'non' || bacObtenuRaw === 'Non' ? false
      : null;
    const enCours = bacObtenu === null || bacObtenuRaw === 'en_cours' || bacObtenuRaw === '';
    const specialitesRaw = bac.Specialites || bac.SpecialiteLibelle || '';
    const specialites = typeof specialitesRaw === 'string'
      ? specialitesRaw.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(specialitesRaw) ? specialitesRaw : [];

    // ── NOTES BAC ──
    const toutesNotes: { matiere: string; note: number }[] = [];
    const notesObj = notesBacRaw.Notes || notesBacRaw;

    // Parser les notes depuis différents formats
    if (Array.isArray(notesObj)) {
      notesObj.forEach((n: any) => {
        const matiere = n.Matiere || n.LibelleMatiere || n.Nom || '';
        const noteVal = this.parserNote(n.Note || n.NoteEpreuve || n.Valeur);
        if (matiere && noteVal !== null) {
          toutesNotes.push({ matiere, note: noteVal });
        }
      });
    } else if (typeof notesObj === 'object' && notesObj !== null) {
      Object.entries(notesObj).forEach(([key, val]) => {
        if (key === 'Notes' || key === 'MoyenneGenerale') return;
        const noteVal = this.parserNote(val);
        if (noteVal !== null) {
          toutesNotes.push({ matiere: key, note: noteVal });
        }
      });
    }

    // Chercher les notes spécifiques
    const francais = this.trouverNote(toutesNotes, ['français', 'francais', 'lettres', 'eaf']) ?? candidat.moyenneFrancais ?? null;
    const philosophie = this.trouverNote(toutesNotes, ['philosophie', 'philo']) ?? candidat.moyennePhilosophie ?? null;
    const histoireGeo = this.trouverNote(toutesNotes, ['histoire', 'géographie', 'geographie', 'histoire-géo', 'hist']) ?? candidat.moyenneHistoireGeo ?? null;
    const ses = this.trouverNote(toutesNotes, ['ses', 'sciences économiques', 'sciences sociales']) ?? null;
    const langues = this.trouverNote(toutesNotes, ['anglais', 'espagnol', 'allemand', 'langue', 'lv1', 'lv2', 'lva', 'lvb']) ?? null;
    const moyenneGenerale = this.parserNote(notesBacRaw.MoyenneGenerale) ?? candidat.moyenneGenerale ?? (toutesNotes.length >= 3 ? Math.round(toutesNotes.reduce((s, n) => s + n.note, 0) / toutesNotes.length * 10) / 10 : null);

    // Notes ST2S / sanitaire et sociale
    const st2sNotes: { matiere: string; note: number }[] = [];
    const st2sKeywords = ['st2s', 'biologie', 'physiopathologie', 'sanitaire', 'social', 'médico', 'services', 'accompagnement'];
    toutesNotes.forEach(n => {
      if (st2sKeywords.some(k => n.matiere.toLowerCase().includes(k))) {
        st2sNotes.push(n);
      }
    });

    // ── SCOLARITÉ ──
    const scolariteTexte = JSON.stringify(scolariteArr).toLowerCase();
    const aRedouble = scolariteTexte.includes('redouble') || scolariteTexte.includes('répétition');
    const aRupture = scolariteTexte.includes('rupture') || scolariteTexte.includes('interruption') || scolariteTexte.includes('arrêt');
    const etudeSup = scolariteArr.find((s: any) =>
      s.NiveauEtudeCode && parseInt(s.NiveauEtudeCode) > 4
    );
    const aEtudesSup = !!etudeSup;
    const detailSup = etudeSup ? (etudeSup.FormationLibelle || etudeSup.Libelle || 'formation post-bac') : null;
    const niveauSup = etudeSup ? (etudeSup.NiveauEtudeLibelle || etudeSup.NiveauEtudeCode || null) : null;
    const validationSup = etudeSup ? (etudeSup.Validation || etudeSup.Resultat || null) : null;

    // ── APPRÉCIATIONS ──
    let texteAppreciations = '';
    bulletins.forEach((b: any) => {
      if (b.AppreciationGenerale) texteAppreciations += ' ' + b.AppreciationGenerale;
      if (b.Appreciations) {
        (b.Appreciations as any[]).forEach((a: any) => {
          if (a.Texte) texteAppreciations += ' ' + a.Texte;
        });
      }
    });
    scolariteArr.forEach((s: any) => {
      if (s.AppreciationProviseur) texteAppreciations += ' ' + s.AppreciationProviseur;
    });
    // Aussi FicheAvenir
    const ficheAvenir = dp.FicheAvenir || dp.AppreciationsEnseignantsFicheAvenir || {};
    if (ficheAvenir.Appreciation) texteAppreciations += ' ' + ficheAvenir.Appreciation;
    if (ficheAvenir.AppreciationConseil) texteAppreciations += ' ' + ficheAvenir.AppreciationConseil;

    // ── ACTIVITÉS ──
    const experiencesPro = activites.ExperiencesProfessionnelles || '';
    const engagementsCitoyen = activites.EngagementsCitoyen || '';
    const encadrement = activites.ExperienceEncadrement || '';
    const sportCulture = activites.PratiquesSportivesCulturelles || '';
    const texteCompletActivites = [experiencesPro, engagementsCitoyen, encadrement, sportCulture].join(' ');

    // ── MOTIVATION ──
    const lettreRaw = donneesVoeux.LettreDeMotivation || donneesVoeux.ProjetFormation || '';
    const lettre = this.stripHtml(lettreRaw);

    // ── FORMATION ──
    const filiereRaw = (donneesVoeux.FormationLibelle || candidat.filiereDemandee || '').toUpperCase();
    let filiere: 'ES' | 'EJE' | 'ASS' | '' = '';
    if (filiereRaw.includes('ES') || filiereRaw.includes('ÉDUC') || filiereRaw.includes('EDUC')) filiere = 'ES';
    else if (filiereRaw.includes('EJE') || filiereRaw.includes('JEUNES ENFANTS')) filiere = 'EJE';
    else if (filiereRaw.includes('ASS') || filiereRaw.includes('ASSISTANT')) filiere = 'ASS';
    const typeCandidat = (candidat.statutDemande || donneesVoeux.TypeCandidat || '').toUpperCase();

    return {
      bac: { obtenu: bacObtenu, enCours, type: typeBac, serie: serieBac, serieLibelle: bac.SerieLibelle || serieBac, specialites, anneeObtention: bac.AnneeObtention || bac.AnneeBac || null },
      notesBac: { francais, philosophie, histoireGeo, ses, st2s: st2sNotes, langues, moyenneGenerale, toutesNotes },
      scolarite: { aRedouble, aRupture, aEtudesSup, detailSup, niveauSup, validationSup },
      activites: { experiencesPro, engagementsCitoyen, encadrement, sportCulture, texteComplet: texteCompletActivites },
      motivation: { lettre, longueur: lettre.length },
      formation: { filiere, typeCandidat },
      appreciations: { texte: texteAppreciations.trim(), disponible: texteAppreciations.trim().length > 10 },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 : CRITÈRE 1 — PARCOURS SCOLAIRE /3 (27 indicateurs)
  // ═══════════════════════════════════════════════════════════════════════════

  private static evaluerParcoursScolaire(candidat: Candidat, d: DonneesExtraites): EvaluationCritere {
    const indicateurs = this.evaluerIndicateursScolaires(candidat, d);

    // Compter indicateurs exploitables
    const nbExploitables = indicateurs.filter(i => i.disponible).length;
    if (nbExploitables < 2) {
      return {
        note: 0,
        commentaire: "Éléments scolaires non renseignés ou insuffisants dans le dossier Parcoursup (notes/bulletins/appréciations/parcours). L'item est inévaluable en l'état.",
      };
    }

    // Profil matching
    const palier = this.determinerPalierScolaire(indicateurs, d);
    const commentaire = this.genererCommentaireScolaire(palier, d, indicateurs);

    return { note: palier, commentaire };
  }

  private static evaluerIndicateursScolaires(candidat: Candidat, d: DonneesExtraites): Indicateur[] {
    const indicateurs: Indicateur[] = [];
    const appLC = d.appreciations.texte.toLowerCase();
    const lettreLC = d.motivation.lettre.toLowerCase();
    const activitesLC = d.activites.texteComplet.toLowerCase();
    const texteMine = appLC + ' ' + lettreLC + ' ' + activitesLC; // Sources secondaires

    // 1. BAC_OBTENU
    indicateurs.push({
      id: 'BAC_OBTENU',
      disponible: d.bac.serie !== '' || d.bac.obtenu !== null,
      valeur: d.bac.obtenu === true ? 'obtenu' : d.bac.enCours ? 'en cours' : d.bac.obtenu === false ? 'non' : null,
      interpretation: d.bac.obtenu === true
        ? `Bac obtenu${d.bac.anneeObtention ? ` (${d.bac.anneeObtention})` : ''}`
        : d.bac.enCours ? 'En cours (terminale) — ne pas pénaliser'
        : d.bac.obtenu === false ? 'Bac non obtenu' : 'Non renseigné',
    });

    // 2. TYPE_BAC
    indicateurs.push({
      id: 'TYPE_BAC',
      disponible: d.bac.type !== 'non renseigné' && d.bac.type !== '',
      valeur: d.bac.type,
      interpretation: d.bac.type === 'général' ? 'Bac général : acquis en expression, analyse, argumentation'
        : d.bac.type === 'technologique' ? 'Bac technologique : compétences techniques, méthodologie appliquée'
        : d.bac.type === 'professionnel' ? 'Bac professionnel : compétences pratiques, expérience terrain'
        : 'Type de bac non renseigné',
    });

    // 3. SERIE_SPECIALITES
    const coloration = this.determinerColorationParcours(d.bac.serie, d.bac.specialites);
    indicateurs.push({
      id: 'SERIE_SPECIALITES',
      disponible: d.bac.serie !== '' && d.bac.serie !== 'Inconnue',
      valeur: d.bac.serie,
      interpretation: `${d.bac.serie}${d.bac.specialites.length > 0 ? ` (${d.bac.specialites.join(', ')})` : ''} — coloration ${coloration}`,
    });

    // 4. COHERENCE_TS
    const coherenceTS = this.evaluerCoherenceTS(d.bac.serie, d.bac.specialites, coloration);
    indicateurs.push({
      id: 'COHERENCE_TS',
      disponible: d.bac.serie !== '',
      valeur: coherenceTS,
      interpretation: coherenceTS === 'direct' ? 'Lien direct avec le travail social'
        : coherenceTS === 'neutre' ? 'Parcours neutre vis-à-vis du travail social (compétences transférables à évaluer)'
        : 'Parcours éloigné du champ social (sans disqualifier — compétences transférables à évaluer)',
    });

    // 5-10. NOTES PAR MATIÈRE
    const matieres: [string, string, number | null, string][] = [
      ['FRANCAIS', 'Français', d.notesBac.francais, "expression/argumentation, utile pour écrits/oral du travail social"],
      ['PHILOSOPHIE', 'Philosophie', d.notesBac.philosophie, "réflexion, esprit critique, structuration d'idées"],
      ['HISTOIRE_GEO', 'Histoire-Géographie', d.notesBac.histoireGeo, "culture générale, compréhension contextes sociaux"],
      ['SES', 'SES/Sciences sociales', d.notesBac.ses, "analyse des faits sociaux, raisonnement"],
      ['LANGUES', 'Langues', d.notesBac.langues, "communication, ouverture, compréhension"],
    ];
    for (const [id, label, note, desc] of matieres) {
      indicateurs.push({
        id,
        disponible: note !== null,
        valeur: note,
        interpretation: note !== null
          ? `${label} : ${note}/20 — ${note >= 14 ? 'très bon niveau' : note >= 12 ? 'bon niveau' : note >= 10 ? 'niveau correct' : 'niveau fragile'} (${desc})`
          : `${label} : non renseigné dans le dossier`,
      });
    }

    // 9. MATIERES_SANITAIRE_SOCIALE
    indicateurs.push({
      id: 'MATIERES_SANITAIRE_SOCIALE',
      disponible: d.notesBac.st2s.length > 0,
      valeur: d.notesBac.st2s.map(n => `${n.matiere}: ${n.note}/20`).join(', ') || null,
      interpretation: d.notesBac.st2s.length > 0
        ? `Matières sanitaire/sociale : ${d.notesBac.st2s.map(n => `${n.matiere} (${n.note}/20)`).join(', ')} — pertinence pour approche santé/social`
        : 'Aucune matière sanitaire/sociale identifiée (non applicable ou non renseigné)',
    });

    // 11. MOYENNE_GENERALE
    indicateurs.push({
      id: 'MOYENNE_GENERALE',
      disponible: d.notesBac.moyenneGenerale !== null,
      valeur: d.notesBac.moyenneGenerale,
      interpretation: d.notesBac.moyenneGenerale !== null
        ? `Moyenne générale : ${d.notesBac.moyenneGenerale}/20 — ${d.notesBac.moyenneGenerale >= 14 ? 'niveau très solide' : d.notesBac.moyenneGenerale >= 12 ? 'niveau satisfaisant' : d.notesBac.moyenneGenerale >= 10 ? 'niveau moyen' : 'niveau fragile'}`
        : 'Moyenne générale : non renseignée dans le dossier',
    });

    // 12. PROGRESSION
    const evolution = candidat.evolutionNotes || 'stable';
    indicateurs.push({
      id: 'PROGRESSION',
      disponible: true,
      valeur: evolution,
      interpretation: evolution === 'progression' ? 'Dynamique en amélioration — prise en compte positive'
        : evolution === 'regression' ? 'Dynamique en baisse — point de vigilance'
        : 'Dynamique stable',
    });

    // 13. REGULARITE
    const ecartType = this.calculerEcartType(d.notesBac.toutesNotes.map(n => n.note));
    indicateurs.push({
      id: 'REGULARITE',
      disponible: d.notesBac.toutesNotes.length >= 3,
      valeur: ecartType,
      interpretation: ecartType !== null
        ? ecartType <= 2 ? 'Résultats réguliers et stables'
          : ecartType <= 4 ? 'Résultats contrastés selon les matières'
          : 'Résultats très irréguliers'
        : 'Régularité non évaluable (données insuffisantes)',
    });

    // 14. ECARTS_MATIERES
    const { pointsForts, pointsFaibles } = this.identifierEcartsMatieres(d.notesBac.toutesNotes);
    indicateurs.push({
      id: 'ECARTS_MATIERES',
      disponible: d.notesBac.toutesNotes.length >= 2,
      valeur: `Forts: ${pointsForts.join(', ') || 'aucun'}; Faibles: ${pointsFaibles.join(', ') || 'aucun'}`,
      interpretation: pointsForts.length > 0
        ? `Points forts : ${pointsForts.join(', ')}${pointsFaibles.length > 0 ? `. Fragilités : ${pointsFaibles.join(', ')}` : ''}`
        : 'Pas d\'écart significatif identifié',
    });

    // 15. REDOUBLEMENT
    indicateurs.push({
      id: 'REDOUBLEMENT',
      disponible: true,
      valeur: d.scolarite.aRedouble,
      interpretation: d.scolarite.aRedouble
        ? 'Redoublement identifié — signalé factuellement, impact à évaluer (résilience/reprise) sans jugement'
        : 'Pas de redoublement identifié',
    });

    // 16. RUPTURES
    indicateurs.push({
      id: 'RUPTURES',
      disponible: true,
      valeur: d.scolarite.aRupture,
      interpretation: d.scolarite.aRupture
        ? 'Rupture/interruption de parcours identifiée — signalée factuellement'
        : 'Pas de rupture de parcours identifiée (ou non renseigné)',
    });

    // 17-22. Indicateurs minés depuis appréciations / lettre / activités
    // (souvent "non renseigné" dans les exports Parcoursup réels)

    // 17. ASSIDUITE
    const assiduite = this.minerIndicateurTexte(texteMine,
      ['assidu', 'ponctuel', 'présent', 'régulier'],
      ['absent', 'retard', 'absentéisme', 'manque d\'assiduité']);
    indicateurs.push({
      id: 'ASSIDUITE',
      disponible: d.appreciations.disponible || assiduite.signal !== 'absent',
      valeur: assiduite.signal,
      interpretation: assiduite.signal === 'positif' ? `Assiduité bonne (${assiduite.detail})`
        : assiduite.signal === 'negatif' ? `Assiduité à surveiller (${assiduite.detail})`
        : 'Assiduité : non renseignée dans le dossier',
    });

    // 18. SERIEUX
    const serieux = this.minerIndicateurTexte(texteMine,
      ['sérieux', 'sérieuse', 'impliqué', 'impliquée', 'travailleur', 'travailleuse', 'effort', 'autonome', 'volontaire', 'consciencieux'],
      ['manque de travail', 'passif', 'passive', 'insuffisant']);
    indicateurs.push({
      id: 'SERIEUX',
      disponible: d.appreciations.disponible || serieux.signal !== 'absent',
      valeur: serieux.signal,
      interpretation: serieux.signal === 'positif' ? `Sérieux/implication : ${serieux.detail}`
        : serieux.signal === 'negatif' ? `Manque de sérieux signalé : ${serieux.detail}`
        : 'Sérieux/implication : non renseigné dans le dossier',
    });

    // 19. PARTICIPATION
    const participation = this.minerIndicateurTexte(texteMine,
      ['participation', 'participe', 'écoute', 'respect', 'prise de parole', 'bonne attitude', 'dynamique'],
      ['bavardage', 'perturbateur', 'perturbatrice', 'dissipé']);
    indicateurs.push({
      id: 'PARTICIPATION',
      disponible: d.appreciations.disponible || participation.signal !== 'absent',
      valeur: participation.signal,
      interpretation: participation.signal === 'positif' ? `Participation positive (${participation.detail})`
        : participation.signal === 'negatif' ? `Participation à surveiller (${participation.detail})`
        : 'Participation/posture en classe : non renseigné dans le dossier',
    });

    // 20. QUALITE_REDACTIONNELLE (évaluée sur la lettre de motivation)
    const qualiteRedaction = d.motivation.longueur > 100
      ? this.evaluerQualiteRedactionnelle(d.motivation.lettre) : 'non évaluable';
    indicateurs.push({
      id: 'QUALITE_REDACTIONNELLE',
      disponible: d.motivation.longueur > 100,
      valeur: qualiteRedaction,
      interpretation: qualiteRedaction === 'bonne' ? 'Écriture claire, structurée et argumentée'
        : qualiteRedaction === 'correcte' ? 'Écriture correcte, structuration à renforcer'
        : qualiteRedaction === 'faible' ? 'Écriture peu structurée, difficultés rédactionnelles'
        : 'Qualité rédactionnelle non évaluable (lettre absente ou trop courte)',
    });

    // 21. COMPETENCES_ORALES
    const oral = this.minerIndicateurTexte(texteMine,
      ['oral', 'éloquence', 'communication', 'prise de parole', 'aisance'],
      []);
    indicateurs.push({
      id: 'COMPETENCES_ORALES',
      disponible: oral.signal !== 'absent',
      valeur: oral.signal !== 'absent',
      interpretation: oral.signal === 'positif' ? `Compétences orales mentionnées (${oral.detail})`
        : 'Compétences orales : non renseigné dans le dossier',
    });

    // 22. TRAVAIL_GROUPE
    const groupe = this.minerIndicateurTexte(texteMine,
      ['groupe', 'coopération', 'collaboration', 'collectif', 'entraide', 'solidarité', 'esprit d\'équipe'],
      []);
    indicateurs.push({
      id: 'TRAVAIL_GROUPE',
      disponible: groupe.signal !== 'absent',
      valeur: groupe.signal !== 'absent',
      interpretation: groupe.signal === 'positif' ? `Travail en groupe mentionné (${groupe.detail})`
        : 'Travail en groupe/coopération : non renseigné dans le dossier',
    });

    // 23. ETUDES_SUP
    indicateurs.push({
      id: 'ETUDES_SUP',
      disponible: d.scolarite.aEtudesSup,
      valeur: d.scolarite.detailSup,
      interpretation: d.scolarite.aEtudesSup
        ? `Études supérieures : ${d.scolarite.detailSup}${d.scolarite.niveauSup ? ` (${d.scolarite.niveauSup})` : ''}`
        : 'Pas d\'études supérieures identifiées',
    });

    // 24. VALIDATION_SUP
    indicateurs.push({
      id: 'VALIDATION_SUP',
      disponible: d.scolarite.validationSup !== null,
      valeur: d.scolarite.validationSup,
      interpretation: d.scolarite.validationSup
        ? `Validation dans le supérieur : ${d.scolarite.validationSup}`
        : d.scolarite.aEtudesSup ? 'Validation dans le supérieur : non renseigné dans le dossier' : 'Non applicable',
    });

    // 25. APPRECIATIONS_SUP
    indicateurs.push({
      id: 'APPRECIATIONS_SUP',
      disponible: false, // Presque jamais disponible dans les exports Parcoursup
      valeur: null,
      interpretation: d.scolarite.aEtudesSup
        ? 'Appréciations du supérieur : non renseigné dans le dossier'
        : 'Non applicable',
    });

    // 26. CONTRAINTES_DECLAREES
    const contraintes = this.detecterContraintes(d.motivation.lettre);
    indicateurs.push({
      id: 'CONTRAINTES_DECLAREES',
      disponible: contraintes !== null,
      valeur: contraintes,
      interpretation: contraintes
        ? `Contraintes déclarées par le candidat : ${contraintes}`
        : 'Aucune contrainte déclarée par le candidat',
    });

    // 27. DONNEES_MANQUANTES
    const manquantes = indicateurs.filter(i => !i.disponible).map(i => i.id);
    indicateurs.push({
      id: 'DONNEES_MANQUANTES',
      disponible: true,
      valeur: manquantes.length,
      interpretation: manquantes.length > 0
        ? `Données manquantes : ${manquantes.length} indicateur(s) — ${manquantes.slice(0, 5).join(', ')}${manquantes.length > 5 ? '...' : ''}`
        : 'Toutes les données sont disponibles',
    });

    return indicateurs;
  }

  private static determinerPalierScolaire(indicateurs: Indicateur[], d: DonneesExtraites): number {
    const get = (id: string) => indicateurs.find(i => i.id === id);
    const moy = d.notesBac.moyenneGenerale;
    const evolution = get('PROGRESSION')?.valeur as string;
    const regularite = get('REGULARITE')?.valeur as number | null;
    const { pointsForts, pointsFaibles } = this.identifierEcartsMatieres(d.notesBac.toutesNotes);
    const hasMatieresTSFortes = this.aPointFortsTS(d);
    const appreciationSignal = this.getAppreciationSignal(indicateurs);

    // Compter exploitables
    const nbExploitables = indicateurs.filter(i => i.disponible && i.id !== 'DONNEES_MANQUANTES').length;
    if (nbExploitables < 2) return 0;

    // Si aucune note disponible, base l'évaluation sur autres éléments
    if (moy === null) {
      // Évaluer sur les éléments qualitatifs disponibles
      if (d.scolarite.aEtudesSup && appreciationSignal >= 0) return 1.5;
      if (appreciationSignal > 0) return 1;
      return 0.5; // Peu d'éléments mais évaluable
    }

    // ── Palier 3 : Excellent ──
    if (moy >= 14 && hasMatieresTSFortes && (evolution === 'progression' || evolution === 'stable')
      && (appreciationSignal >= 0)) {
      // Vérifier qu'on ne survaloriserait pas un bac social avec des notes limites
      return 3;
    }

    // ── Palier 2.5 : Très solide ──
    if (moy >= 13 && pointsForts.length >= 1 && (evolution === 'progression' || evolution === 'stable')) {
      return 2.5;
    }
    // Cas alternatif : moyenne très haute même sans points forts détaillés
    if (moy >= 15 && evolution !== 'regression') {
      return 2.5;
    }

    // ── Palier 2 : Solide ──
    if (moy >= 11 && pointsForts.length >= 1 && appreciationSignal >= 0) {
      return 2;
    }
    // Cas alternatif : bonne moyenne sans points forts détaillés mais stable
    if (moy >= 12 && evolution !== 'regression' && appreciationSignal >= 0) {
      return 2;
    }

    // ── Palier 1.5 : Moyen ──
    if (moy >= 10 && moy < 13) {
      if (pointsForts.length === 0 || (regularite !== null && regularite > 3)) {
        return 1.5;
      }
    }
    // Cas contrasté : notes correctes mais irrégulières
    if (moy >= 10 && (regularite !== null && regularite > 4)) {
      return 1.5;
    }

    // ── Palier 1 : Fragile ──
    if (moy < 11 || evolution === 'regression' || appreciationSignal < 0) {
      if (moy >= 9 || pointsFaibles.length < 3) {
        return 1;
      }
    }

    // ── Palier 0.5 : Très fragile ──
    if (moy !== null && moy < 9) {
      return 0.5;
    }

    // Défaut basé sur la moyenne
    if (moy >= 12) return 2;
    if (moy >= 10) return 1.5;
    return 1;
  }

  private static genererCommentaireScolaire(palier: number, d: DonneesExtraites, indicateurs: Indicateur[]): string {
    const bacDesc = this.construireBacDescription(d);
    const pfStr = this.formaterPointsForts(d);
    const fragilites = this.formaterFragilites(d);
    const evolution = d.notesBac.toutesNotes.length > 0 ? (indicateurs.find(i => i.id === 'PROGRESSION')?.valeur as string) : 'stable';
    const dynamique = evolution === 'progression' ? 'en amélioration' : evolution === 'regression' ? 'en baisse' : 'stable';
    const appSignal = this.getAppreciationSignal(indicateurs);
    const appDetail = this.getAppreciationDetail(indicateurs);

    switch (palier) {
      case 3:
        return `Parcours : ${bacDesc}. Résultats très solides, notamment en ${pfStr || 'matières pertinentes (notes non détaillées)'}${d.notesBac.moyenneGenerale ? ` (moyenne ${d.notesBac.moyenneGenerale}/20)` : ''}, avec ${dynamique === 'en baisse' ? 'régularité' : dynamique}. Appréciations ${appDetail ? `très positives sur ${appDetail}` : 'très positives (ou non renseignées dans le dossier)'}. Compétences académiques transférables au travail social : très favorables.`;

      case 2.5:
        return `Parcours ${bacDesc}. Résultats bons à très bons${pfStr ? `, points forts en ${pfStr}` : ''}${d.notesBac.moyenneGenerale ? ` (moyenne ${d.notesBac.moyenneGenerale}/20)` : ''}, dynamique ${dynamique}. Appréciations ${appSignal >= 0 ? 'positives' : 'non renseignées dans le dossier'}. Compétences académiques : très favorables.`;

      case 2:
        return `Parcours ${bacDesc}. Niveau global satisfaisant${pfStr ? `, points forts en ${pfStr}` : ''}${d.notesBac.moyenneGenerale ? ` (moyenne ${d.notesBac.moyenneGenerale}/20)` : ''}. ${fragilites ? `Fragilités en ${fragilites} mais ` : ''}Dynamique ${dynamique}. Appréciations ${appSignal >= 0 ? (appSignal > 0 ? 'positives' : 'neutres') : 'non renseignées dans le dossier'}. Compétences académiques : favorables.`;

      case 1.5:
        return `Parcours ${bacDesc}. Résultats moyens/contrastés${d.notesBac.moyenneGenerale ? ` (moyenne ${d.notesBac.moyenneGenerale}/20)` : ''} ; pas de point fort clairement établi dans les matières clés disponibles. Appréciations ${appSignal >= 0 ? (appSignal > 0 ? 'neutres' : 'partagées') : 'non renseignées dans le dossier'} sur la régularité. Compétences académiques : mitigées, à consolider.`;

      case 1:
        return `Parcours ${bacDesc}. Résultats fragiles${fragilites ? `, notamment sur ${fragilites}` : ''}${d.notesBac.moyenneGenerale ? ` (moyenne ${d.notesBac.moyenneGenerale}/20)` : ''}, avec ${dynamique === 'en amélioration' ? 'une dynamique en amélioration cependant' : dynamique === 'en baisse' ? 'irrégularité/baisse' : 'peu de dynamique'}. Appréciations ${appSignal < 0 ? `signalant ${appDetail || 'manque de régularité/assiduité/méthode'}` : 'non renseignées dans le dossier'}. Compétences académiques : insuffisamment stabilisées.`;

      case 0.5:
        return `Résultats très fragiles et/ou très instables${d.notesBac.moyenneGenerale ? ` (moyenne ${d.notesBac.moyenneGenerale}/20)` : ''}, difficultés importantes sur les fondamentaux. Peu d'éléments rassurants sur la méthode ou la régularité. Compétences académiques : très fragiles en l'état.`;

      case 0:
      default:
        return "Éléments scolaires non renseignés ou insuffisants dans le dossier Parcoursup (notes/bulletins/appréciations/parcours). L'item est inévaluable en l'état.";
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 : CRITÈRE 2 — EXPÉRIENCES /3 (13 indicateurs)
  // ═══════════════════════════════════════════════════════════════════════════

  private static evaluerExperiences(d: DonneesExtraites): EvaluationCritere {
    const indicateurs = this.evaluerIndicateursExperiences(d);

    const nbExploitables = indicateurs.filter(i => i.disponible).length;
    if (nbExploitables === 0) {
      return {
        note: 0,
        commentaire: "Aucun élément exploitable dans le dossier Parcoursup concernant les expériences/engagements (CV/lettre non renseignés sur ce volet). Item inévaluable en l'état.",
      };
    }

    const palier = this.determinerPalierExperiences(indicateurs, d);
    const commentaire = this.genererCommentaireExperiences(palier, indicateurs, d);

    return { note: palier, commentaire };
  }

  private static evaluerIndicateursExperiences(d: DonneesExtraites): Indicateur[] {
    const indicateurs: Indicateur[] = [];
    const texte = (d.activites.texteComplet + ' ' + d.motivation.lettre).toLowerCase();
    const activitesLC = d.activites.texteComplet.toLowerCase();
    const lettreLC = d.motivation.lettre.toLowerCase();

    // 1. ENGAGEMENT_CITOYEN
    const engKeywords = ['association', 'délégué', 'déléguée', 'collectif', 'conseil', 'comité', 'représentant', 'élu', 'citoyen', 'civique', 'militant'];
    const engFound = engKeywords.some(k => texte.includes(k));
    const engRegulier = engFound && (texte.includes('régulier') || texte.includes('depuis') || /\d+\s*(ans?|année)/.test(texte) || texte.includes('chaque'));
    const engResponsabilite = texte.includes('responsab') || texte.includes('coordinat') || texte.includes('organis') || texte.includes('encadre') || texte.includes('président') || texte.includes('trésorier') || texte.includes('secrétaire');
    indicateurs.push({
      id: 'ENGAGEMENT_CITOYEN',
      disponible: engFound,
      valeur: engFound ? (engRegulier ? 'régulier' : 'ponctuel') + (engResponsabilite ? ' + responsabilités' : '') : null,
      interpretation: engFound
        ? `Engagement citoyen/associatif ${engRegulier ? 'régulier' : 'ponctuel'}${engResponsabilite ? ', avec prise de responsabilités' : ''}`
        : 'Pas d\'engagement citoyen/associatif identifié',
    });

    // 2. BENEVOLAT
    const benevKeywords = ['bénévolat', 'bénévole', 'volontaire'];
    const benevFound = benevKeywords.some(k => texte.includes(k));
    const benevRegulier = benevFound && (texte.includes('régulier') || texte.includes('chaque') || texte.includes('hebdomadaire') || texte.includes('mensuel') || /\d+\s*(ans?|mois)/.test(texte));
    indicateurs.push({
      id: 'BENEVOLAT',
      disponible: benevFound,
      valeur: benevFound ? (benevRegulier ? 'régulier' : 'ponctuel') : null,
      interpretation: benevFound
        ? `Bénévolat ${benevRegulier ? 'régulier (preuve de constance)' : 'ponctuel'}`
        : 'Pas de bénévolat identifié',
    });

    // 3. SERVICE_CIVIQUE
    const scFound = texte.includes('service civique');
    const scDetail = scFound ? this.extraireContexte(texte, 'service civique', 120) : '';
    indicateurs.push({
      id: 'SERVICE_CIVIQUE',
      disponible: scFound,
      valeur: scFound ? scDetail : null,
      interpretation: scFound
        ? `Service civique identifié : ${scDetail || 'détails non précisés'}`
        : 'Pas de service civique identifié',
    });

    // 4. BAFA
    const bafaFound = texte.includes('bafa');
    const animationFound = texte.includes('animateur') || texte.includes('animatrice') || texte.includes('animation');
    const bafaExperience = texte.includes('centre') || texte.includes('colo') || texte.includes('périscolaire') || texte.includes('camp');
    indicateurs.push({
      id: 'BAFA',
      disponible: bafaFound || animationFound,
      valeur: bafaFound ? 'identifié' : animationFound ? 'animation sans BAFA' : null,
      interpretation: bafaFound
        ? `BAFA identifié${bafaExperience ? ' + expérience réelle d\'animation' : ''}`
        : animationFound ? 'Expérience d\'animation (BAFA non mentionné)'
        : 'BAFA/animation : non mentionné',
    });

    // 5. EMPLOIS
    const emploiKeywords = ['emploi', 'job', 'stage', 'alternance', 'intérim', 'salarié', 'salariée', 'contrat', 'cdd', 'cdi', 'apprentissage'];
    const emploiFound = emploiKeywords.some(k => texte.includes(k));
    const contactPublicKeywords = ['accueil', 'accompagnement', 'soin', 'aide', 'éducation', 'médiation', 'vente', 'service', 'restauration', 'animation', 'caisse', 'relation client'];
    const contactPublic = emploiFound && contactPublicKeywords.some(k => texte.includes(k));
    indicateurs.push({
      id: 'EMPLOIS',
      disponible: emploiFound,
      valeur: emploiFound ? (contactPublic ? 'contact public' : 'autre') : null,
      interpretation: emploiFound
        ? `Expériences professionnelles identifiées${contactPublic ? ' au contact du public' : ''}`
        : 'Pas d\'emploi/stage identifié',
    });

    // 6. LIEN_DIRECT_TS
    const tsKeywords = ['travail social', 'éducateur', 'éducatrice', 'assistant social', 'assistante sociale',
      'eje', 'protection de l\'enfance', 'handicap', 'insertion', 'précarité', 'vulnérab', 'inclusion',
      'accompagnement social', 'foyer', 'mecs', 'chrs', 'ehpad', 'ime', 'itep', 'esat', 'ase',
      'personnes âgées', 'autisme', 'migrants', 'sans-abri', 'sdf', 'aide sociale'];
    const tsFound = tsKeywords.some(k => texte.includes(k));
    const tsDetail = tsFound ? this.identifierPublicTS(texte) : '';
    indicateurs.push({
      id: 'LIEN_DIRECT_TS',
      disponible: tsFound,
      valeur: tsFound ? tsDetail : null,
      interpretation: tsFound
        ? `Lien direct avec le travail social : ${tsDetail || 'exposition public vulnérable/accompagnement'}`
        : 'Pas de lien direct avec le travail social identifié',
    });

    // 7. COMPETENCES_TRANSFERABLES
    const compKeywords: Record<string, string> = {
      'écoute': 'écoute', 'communication': 'communication', 'empathie': 'empathie',
      'équipe': 'travail d\'équipe', 'conflit': 'gestion de conflit', 'discrétion': 'discrétion',
      'adaptation': 'adaptation', 'organisation': 'organisation', 'fiabilité': 'fiabilité',
      'autonomie': 'autonomie', 'patience': 'patience', 'rigueur': 'rigueur',
      'bienveillance': 'bienveillance', 'accompagnement': 'accompagnement',
      'médiation': 'médiation', 'animation': 'animation',
    };
    const competences: string[] = [];
    for (const [keyword, label] of Object.entries(compKeywords)) {
      if (texte.includes(keyword)) competences.push(label);
    }
    indicateurs.push({
      id: 'COMPETENCES_TRANSFERABLES',
      disponible: competences.length > 0,
      valeur: competences.join(', ') || null,
      interpretation: competences.length > 0
        ? `Compétences transférables identifiées : ${competences.slice(0, 5).join(', ')}`
        : 'Compétences transférables : non identifiées explicitement',
    });

    // 8. PRISE_RESPONSABILITE
    const respoKeywords = ['tutorat', 'tuteur', 'tutrice', 'encadrement', 'encadrer', 'gestion d\'équipe',
      'coordination', 'coordonner', 'planification', 'organiser', 'chef', 'responsable', 'directeur',
      'directrice', 'manager', 'superviseur'];
    const respoFound = respoKeywords.some(k => texte.includes(k));
    indicateurs.push({
      id: 'PRISE_RESPONSABILITE',
      disponible: respoFound,
      valeur: respoFound,
      interpretation: respoFound
        ? 'Prise de responsabilités identifiée (encadrement/coordination/gestion)'
        : 'Prise de responsabilités : non identifiée',
    });

    // 9. STABILITE_CONTINUITE
    const dureeMatch = texte.match(/(\d+)\s*(ans?|année|mois)/g);
    const mentionsDuree = dureeMatch ? dureeMatch.length : 0;
    const engagementsLongs = mentionsDuree >= 2 || texte.includes('depuis plusieurs') || texte.includes('longue durée');
    indicateurs.push({
      id: 'STABILITE_CONTINUITE',
      disponible: mentionsDuree > 0 || activitesLC.length > 50,
      valeur: engagementsLongs ? 'parcours construit' : mentionsDuree > 0 ? 'engagements ponctuels' : null,
      interpretation: engagementsLongs
        ? 'Engagements longs/répétés — parcours construit'
        : mentionsDuree > 0 ? 'Engagements identifiés mais durée limitée'
        : 'Stabilité/continuité : non évaluable',
    });

    // 10. CAPACITE_ENSEIGNEMENTS
    const reculKeywords = ['j\'ai appris', 'cela m\'a', 'cette expérience', 'j\'ai compris',
      'j\'ai réalisé', 'prise de recul', 'enseignement', 'm\'a permis', 'j\'ai découvert',
      'j\'ai pris conscience', 'cela m\'a appris', 'j\'en retire'];
    const capaciteRecul = reculKeywords.some(k => texte.includes(k));
    indicateurs.push({
      id: 'CAPACITE_ENSEIGNEMENTS',
      disponible: capaciteRecul,
      valeur: capaciteRecul,
      interpretation: capaciteRecul
        ? 'Mise en mots des apprentissages identifiée — capacité de recul'
        : 'Capacité à tirer des enseignements : non identifiée explicitement',
    });

    // 11. DIVERSITE_CONTEXTES
    const contextes: string[] = [];
    if (texte.includes('école') || texte.includes('scolaire') || texte.includes('périscolaire')) contextes.push('scolaire');
    if (texte.includes('médico') || texte.includes('sanitaire') || texte.includes('hôpital') || texte.includes('ehpad')) contextes.push('médico-social');
    if (texte.includes('sport') || texte.includes('culture') || texte.includes('théâtre') || texte.includes('musique')) contextes.push('sport/culture');
    if (texte.includes('humanitaire') || texte.includes('solidarité') || texte.includes('international')) contextes.push('humanitaire');
    if (texte.includes('social') || texte.includes('insertion') || texte.includes('protection')) contextes.push('social');
    if (texte.includes('animation') || texte.includes('centre de loisirs') || texte.includes('colo')) contextes.push('animation');
    indicateurs.push({
      id: 'DIVERSITE_CONTEXTES',
      disponible: contextes.length > 0,
      valeur: contextes.join(', ') || null,
      interpretation: contextes.length >= 3 ? `Grande diversité de contextes : ${contextes.join(', ')}`
        : contextes.length >= 1 ? `Contexte(s) : ${contextes.join(', ')}`
        : 'Diversité des contextes : non évaluable',
    });

    // 12. CONTRAINTES_VIE
    const contraintesKeywords = ['charge familiale', 'aidant', 'enfant', 'parent', 'contrainte',
      'handicap', 'maladie', 'travail alimentaire', 'obligation'];
    const contraintesVie = contraintesKeywords.some(k => lettreLC.includes(k));
    indicateurs.push({
      id: 'CONTRAINTES_VIE',
      disponible: contraintesVie,
      valeur: contraintesVie,
      interpretation: contraintesVie
        ? 'Contraintes de vie déclarées — ne pas pénaliser automatiquement'
        : 'Pas de contraintes de vie déclarées',
    });

    // 13. PRECISION_INFORMATIONS
    const hasMissions = texte.includes('mission') || texte.includes('tâche') || texte.includes('rôle');
    const hasDates = /\d{4}/.test(texte) || /\d+\s*(ans?|mois)/.test(texte);
    const hasPublic = texte.includes('public') || texte.includes('enfant') || texte.includes('personne') || texte.includes('jeune') || texte.includes('adulte');
    const precisionScore = [hasMissions, hasDates, hasPublic].filter(Boolean).length;
    indicateurs.push({
      id: 'PRECISION_INFORMATIONS',
      disponible: activitesLC.length > 20,
      valeur: precisionScore,
      interpretation: precisionScore >= 3 ? 'Informations précises (missions, durée, public) — très valorisable'
        : precisionScore >= 2 ? 'Informations partiellement précisées'
        : precisionScore >= 1 ? 'Informations peu précisées (missions/durée/public manquants)'
        : 'Informations trop vagues pour être pleinement valorisées',
    });

    return indicateurs;
  }

  private static determinerPalierExperiences(indicateurs: Indicateur[], d: DonneesExtraites): number {
    const get = (id: string) => indicateurs.find(i => i.id === id);

    const engagement = get('ENGAGEMENT_CITOYEN');
    const benevolat = get('BENEVOLAT');
    const serviceCivique = get('SERVICE_CIVIQUE');
    const bafa = get('BAFA');
    const emplois = get('EMPLOIS');
    const lienTS = get('LIEN_DIRECT_TS');
    const competences = get('COMPETENCES_TRANSFERABLES');
    const stabilite = get('STABILITE_CONTINUITE');
    const recul = get('CAPACITE_ENSEIGNEMENTS');
    const precision = get('PRECISION_INFORMATIONS');

    const nbCompetences = competences?.disponible ? (competences.valeur as string).split(', ').length : 0;
    const engDurable = engagement?.disponible && (engagement.valeur as string).includes('régulier');
    const scDispo = serviceCivique?.disponible;
    const tsContact = lienTS?.disponible;
    const hasRecul = recul?.disponible;
    const engagementsLongs = stabilite?.disponible && (stabilite.valeur as string).includes('construit');
    const precisionVal = (precision?.valeur as number) || 0;

    // Compter les types d'engagement
    const nbTypesEngagement = [engagement?.disponible, benevolat?.disponible, serviceCivique?.disponible,
      bafa?.disponible, emplois?.disponible].filter(Boolean).length;

    // ── Palier 3 : Très riche ──
    if ((engDurable || scDispo || engagementsLongs) && tsContact && nbCompetences >= 3 && hasRecul) {
      return 3;
    }

    // ── Palier 2.5 : Très pertinent ──
    if ((engDurable || scDispo || engagementsLongs) && (tsContact || nbCompetences >= 3) && hasRecul) {
      return 2.5;
    }
    if (nbTypesEngagement >= 3 && nbCompetences >= 2 && precisionVal >= 2) {
      return 2.5;
    }

    // ── Palier 2 : Pertinent ──
    if (nbTypesEngagement >= 2 && (nbCompetences >= 2 || bafa?.disponible)) {
      return 2;
    }
    if ((emplois?.disponible && (emplois.valeur === 'contact public')) && nbCompetences >= 2) {
      return 2;
    }
    if (bafa?.disponible && engagement?.disponible) {
      return 2;
    }

    // ── Palier 1.5 : Présent mais limité ──
    if (nbTypesEngagement >= 1 && precisionVal <= 1) {
      return 1.5;
    }
    if (nbTypesEngagement >= 1 && nbCompetences <= 1) {
      return 1.5;
    }

    // ── Palier 1 : Faible ──
    if (nbTypesEngagement >= 1 || d.activites.texteComplet.length > 50) {
      return 1;
    }

    // ── Palier 0.5 : Très faible ──
    if (d.activites.texteComplet.length > 20 || d.motivation.lettre.length > 50) {
      return 0.5;
    }

    return 0;
  }

  private static genererCommentaireExperiences(palier: number, indicateurs: Indicateur[], d: DonneesExtraites): string {
    const get = (id: string) => indicateurs.find(i => i.id === id);
    const engagement = get('ENGAGEMENT_CITOYEN');
    const lienTS = get('LIEN_DIRECT_TS');
    const competences = get('COMPETENCES_TRANSFERABLES');
    const recul = get('CAPACITE_ENSEIGNEMENTS');
    const stabilite = get('STABILITE_CONTINUITE');
    const emplois = get('EMPLOIS');
    const bafa = get('BAFA');
    const benevolat = get('BENEVOLAT');
    const serviceCivique = get('SERVICE_CIVIQUE');
    const responsabilite = get('PRISE_RESPONSABILITE');

    // Construire les fragments de description
    const typeEngagement = this.construireTypeEngagement(engagement, benevolat, serviceCivique, bafa, emplois);
    const compStr = competences?.disponible ? (competences.valeur as string) : '';
    const publicTS = lienTS?.disponible ? (lienTS.valeur as string) : '';

    switch (palier) {
      case 3:
        return `Parcours marqué par ${typeEngagement || 'un engagement significatif'}${stabilite?.disponible ? ` sur une durée notable` : ''} avec rôle ${responsabilite?.disponible ? 'incluant des responsabilités' : 'actif'}${publicTS ? ` auprès de ${publicTS}` : ''}. Compétences transférables identifiées : ${compStr || 'écoute, animation, équipe'}. Mise en mots des apprentissages ${recul?.disponible ? 'oui' : 'partiellement'}. Expériences : très favorables.`;

      case 2.5:
        return `Expérience ${typeEngagement || 'significative'} régulière / sur une durée significative, missions ${this.extraireExemplesMissions(d)} et contact public ${lienTS?.disponible ? 'oui' : publicTS ? 'oui' : 'indirect'}. Compétences transférables bien identifiées${compStr ? ` (${compStr})` : ''}. Apprentissage formulé${recul?.disponible ? '' : ' partiellement'}. Potentiel : très favorable.`;

      case 2:
        return `Expériences ${typeEngagement || 'identifiées'} avec contact public ${emplois?.valeur === 'contact public' || lienTS?.disponible ? 'oui' : 'non précisé'} et missions ${this.extraireExemplesMissions(d)}. Implication ${stabilite?.valeur === 'parcours construit' ? 'régulière' : 'ponctuelle'} mais cohérente avec le projet. Compétences transférables : ${compStr || 'partiellement identifiées'}. Potentiel : favorable.`;

      case 1.5:
        return `Quelques éléments d'expériences (ex : ${typeEngagement || 'activité mentionnée'}), mais description limitée (missions/durée/public peu précisés). Compétences transférables ${competences?.disponible ? 'identifiables partiellement' : 'partiellement identifiables'}. Parcours de vie : mitigé sur cet item.`;

      case 1:
        return `Expériences/engagements peu étayés dans le dossier (missions/durée/public non précisés) et compétences transférables peu identifiables. Item : faible en l'état.`;

      case 0.5:
        return `Très peu d'éléments exploitables sur les expériences/engagements (mentions trop vagues/ponctuelles). Compétences transférables non identifiables en l'état.`;

      case 0:
      default:
        return "Aucun élément exploitable dans le dossier Parcoursup concernant les expériences/engagements (CV/lettre non renseignés sur ce volet). Item inévaluable en l'état.";
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4 : CRITÈRE 3 — MOTIVATION /2 (13 indicateurs)
  // ═══════════════════════════════════════════════════════════════════════════

  private static evaluerMotivation(candidat: Candidat, d: DonneesExtraites): EvaluationCritere {
    const indicateurs = this.evaluerIndicateursMotivation(candidat, d);

    const nbExploitables = indicateurs.filter(i => i.disponible).length;
    if (nbExploitables === 0 || d.motivation.longueur < 30) {
      return {
        note: 0,
        commentaire: "Lettre/projet de formation motivé non renseigné ou inexploitable dans le dossier Parcoursup. Item inévaluable en l'état.",
      };
    }

    const palier = this.determinerPalierMotivation(indicateurs, d);
    const commentaire = this.genererCommentaireMotivation(palier, indicateurs, candidat, d);

    return { note: palier, commentaire };
  }

  private static evaluerIndicateursMotivation(candidat: Candidat, d: DonneesExtraites): Indicateur[] {
    const indicateurs: Indicateur[] = [];
    const lettreLC = d.motivation.lettre.toLowerCase();
    const filiere = d.formation.filiere || candidat.filiereDemandee || '';

    // 1. CLARTE_PROJET
    const metiersES = ['éducateur spécialisé', 'éducatrice spécialisée', 'éducateur'];
    const metiersEJE = ['éducateur de jeunes enfants', 'éducatrice de jeunes enfants', 'eje', 'petite enfance'];
    const metiersASS = ['assistant social', 'assistante sociale', 'assistant de service social'];
    const metiersTS = [...metiersES, ...metiersEJE, ...metiersASS, 'travailleur social', 'travailleuse sociale'];
    const metierMentioned = metiersTS.find(m => lettreLC.includes(m));

    const secteursTS = ['protection de l\'enfance', 'handicap', 'insertion', 'précarité', 'santé mentale',
      'addiction', 'personnes âgées', 'exclusion', 'migrants', 'justice', 'prévention', 'médico-social',
      'aide sociale', 'enfance', 'adolescence', 'accompagnement social'];
    const secteurMentioned = secteursTS.find(s => lettreLC.includes(s));

    const projetClair = !!metierMentioned && !!secteurMentioned;
    const projetPartiel = !!metierMentioned || !!secteurMentioned || lettreLC.includes('social') || lettreLC.includes('formation');
    indicateurs.push({
      id: 'CLARTE_PROJET',
      disponible: d.motivation.longueur > 30,
      valeur: projetClair ? 'clair' : projetPartiel ? 'partiel' : 'flou',
      interpretation: projetClair
        ? `Projet clair : métier ${metierMentioned}, secteur ${secteurMentioned}`
        : projetPartiel ? `Projet partiellement défini${metierMentioned ? ` (métier: ${metierMentioned})` : ''}${secteurMentioned ? ` (secteur: ${secteurMentioned})` : ''}`
        : 'Projet peu précisé (métier/secteur/public non identifiés)',
    });

    // 2. COHERENCE_FILIERE
    let coherenceFiliere = false;
    let confusions = '';
    const filiereUpper = filiere.toUpperCase();
    if (filiereUpper === 'ES' && metiersES.some(m => lettreLC.includes(m))) coherenceFiliere = true;
    else if (filiereUpper === 'EJE' && metiersEJE.some(m => lettreLC.includes(m))) coherenceFiliere = true;
    else if (filiereUpper === 'ASS' && metiersASS.some(m => lettreLC.includes(m))) coherenceFiliere = true;
    else if (lettreLC.includes('social') || lettreLC.includes('accompagn')) coherenceFiliere = true;
    // Détecter confusions
    if (filiereUpper === 'ES' && metiersEJE.some(m => lettreLC.includes(m)) && !metiersES.some(m => lettreLC.includes(m))) {
      confusions = 'Confusion possible ES/EJE';
    }
    if (filiereUpper === 'EJE' && metiersES.some(m => lettreLC.includes(m)) && !metiersEJE.some(m => lettreLC.includes(m))) {
      confusions = 'Confusion possible EJE/ES';
    }
    indicateurs.push({
      id: 'COHERENCE_FILIERE',
      disponible: filiere !== '',
      valeur: coherenceFiliere ? 'cohérent' : confusions ? 'confus' : 'indéterminé',
      interpretation: coherenceFiliere ? `Cohérence avec ${filiere}`
        : confusions ? confusions
        : 'Cohérence filière non vérifiable',
    });

    // 3. RAISONS_CHOIX
    const raisonsKeywords = ['envie', 'passionné', 'convaincu', 'décidé', 'choisi', 'motivé',
      'découvert', 'rencontré', 'lors de', 'suite à', 'après avoir', 'depuis'];
    const raisonsCount = raisonsKeywords.filter(k => lettreLC.includes(k)).length;
    indicateurs.push({
      id: 'RAISONS_CHOIX',
      disponible: raisonsCount > 0,
      valeur: raisonsCount,
      interpretation: raisonsCount >= 3 ? 'Raisons du choix clairement exprimées (déclencheurs, valeurs, expériences)'
        : raisonsCount >= 1 ? 'Quelques raisons évoquées'
        : 'Raisons du choix : non explicitées',
    });

    // 4. APPUIS_EXPERIENCES
    const appuisKeywords = ['stage', 'lors de', 'pendant', 'j\'ai eu l\'occasion', 'expérience',
      'bénévolat', 'travaillé', 'rencontré', 'observé', 'j\'ai pu', 'au cours de'];
    const appuisCount = appuisKeywords.filter(k => lettreLC.includes(k)).length;
    const appuisExperiences = appuisCount >= 2;
    indicateurs.push({
      id: 'APPUIS_EXPERIENCES',
      disponible: appuisCount > 0,
      valeur: appuisExperiences ? 'étayé' : 'déclaratif',
      interpretation: appuisExperiences
        ? 'Motivation étayée par des expériences concrètes'
        : 'Argumentation principalement déclarative, peu d\'appuis concrets',
    });

    // 5. FAISABILITE
    const faisabiliteKeywords = ['parcours', 'étape', 'année', 'formation', 'diplôme', 'projet', 'plan', 'objectif'];
    const faisabiliteCount = faisabiliteKeywords.filter(k => lettreLC.includes(k)).length;
    indicateurs.push({
      id: 'FAISABILITE',
      disponible: faisabiliteCount >= 2,
      valeur: faisabiliteCount >= 2,
      interpretation: faisabiliteCount >= 2 ? 'Projet paraît réaliste au regard du parcours'
        : 'Faisabilité du projet : peu d\'éléments pour évaluer',
    });

    // 6. REPRESENTATION_METIER
    const exigencesKeywords = ['accompagnement', 'travail d\'équipe', 'écrits', 'éthique', 'secret professionnel',
      'non-jugement', 'déontologie', 'cadre', 'limites', 'distance', 'posture', 'partenariat',
      'institution', 'pluridisciplinaire', 'projet personnalisé', 'bientraitance'];
    const exigencesCount = exigencesKeywords.filter(k => lettreLC.includes(k)).length;
    indicateurs.push({
      id: 'REPRESENTATION_METIER',
      disponible: exigencesCount > 0,
      valeur: exigencesCount,
      interpretation: exigencesCount >= 3 ? 'Bonne compréhension des exigences du métier (posture, travail d\'équipe, écrits, éthique)'
        : exigencesCount >= 1 ? 'Compréhension partielle des exigences du métier'
        : 'Représentation du métier : peu d\'éléments sur les exigences',
    });

    // 7. MOTIVATION_INTRINSEQUE (avec détection du "sauveur")
    const valeurKeywords = ['respect', 'non-jugement', 'écoute', 'engagement', 'recul', 'humble',
      'conscience', 'ouverture', 'dignité', 'empathie'];
    const sauveurKeywords = ['je veux sauver', 'sauver les gens', 'aider les autres depuis toujours',
      'c\'est ma vocation', 'ma mission de vie', 'je suis né pour', 'destiné à'];
    const postureRealisteKeywords = ['limites', 'cadre', 'distance professionnelle', 'non-jugement',
      'posture', 'secret professionnel', 'épuisement', 'supervision'];
    const sauveurDetecte = sauveurKeywords.some(k => lettreLC.includes(k));
    const postureRealiste = postureRealisteKeywords.some(k => lettreLC.includes(k));
    const valeursCount = valeurKeywords.filter(k => lettreLC.includes(k)).length;
    indicateurs.push({
      id: 'MOTIVATION_INTRINSEQUE',
      disponible: valeursCount > 0 || sauveurDetecte,
      valeur: sauveurDetecte && !postureRealiste ? 'sauveur' : valeursCount >= 2 ? 'solide' : valeursCount >= 1 ? 'présente' : 'faible',
      interpretation: sauveurDetecte && !postureRealiste
        ? 'Attention : posture "sauveur" détectée sans contrebalancement par une posture réaliste'
        : valeursCount >= 2 ? `Motivation intrinsèque solide (valeurs : ${valeurKeywords.filter(k => lettreLC.includes(k)).slice(0, 3).join(', ')})`
        : valeursCount >= 1 ? 'Motivation intrinsèque présente mais peu développée'
        : 'Motivation intrinsèque : peu d\'éléments',
    });

    // 8. ANALYSE_PARCOURS
    const analyseParcours = ['j\'ai compris', 'j\'ai réalisé', 'prise de conscience', 'j\'ai appris',
      'questionné', 'réfléchi', 'remise en question', 'chemin', 'parcours', 'développer', 'progresser'];
    const analyseCount = analyseParcours.filter(k => lettreLC.includes(k)).length;
    indicateurs.push({
      id: 'ANALYSE_PARCOURS',
      disponible: analyseCount > 0,
      valeur: analyseCount,
      interpretation: analyseCount >= 2 ? 'Capacité à analyser son parcours et ses choix — réflexivité visible'
        : analyseCount >= 1 ? 'Quelques éléments d\'analyse du parcours'
        : 'Analyse du parcours : peu de recul apparent',
    });

    // 9. PROJECTION_FORMATION
    const projectionKeywords = ['alternance', 'stage', 'mémoire', 'dossier', 'implication', 'organisation',
      'disponibilité', 'terrain', 'pratique', 'théorie', 'module', 'certification'];
    const projectionCount = projectionKeywords.filter(k => lettreLC.includes(k)).length;
    indicateurs.push({
      id: 'PROJECTION_FORMATION',
      disponible: projectionCount > 0,
      valeur: projectionCount,
      interpretation: projectionCount >= 2 ? 'Projection dans la formation visible (alternance, stages, organisation)'
        : projectionCount >= 1 ? 'Quelques éléments de projection dans la formation'
        : 'Projection dans la formation : non évoquée',
    });

    // 10. PERSONNALISATION
    const estGenerique = this.estTexteGenerique(lettreLC);
    const hasExemples = lettreLC.includes('par exemple') || lettreLC.includes('notamment') || lettreLC.includes('j\'ai')
      || lettreLC.includes('lors de') || /\d{4}/.test(lettreLC);
    indicateurs.push({
      id: 'PERSONNALISATION',
      disponible: d.motivation.longueur > 100,
      valeur: estGenerique ? 'générique' : hasExemples ? 'personnalisé' : 'standard',
      interpretation: estGenerique ? 'Texte générique, peu personnalisé'
        : hasExemples ? 'Argumentation personnalisée avec exemples concrets'
        : 'Texte standard sans élément distinctif marquant',
    });

    // 11. QUALITE_EXPRESSION
    const qualite = d.motivation.longueur > 100 ? this.evaluerQualiteRedactionnelle(d.motivation.lettre) : 'non évaluable';
    indicateurs.push({
      id: 'QUALITE_EXPRESSION',
      disponible: d.motivation.longueur > 100,
      valeur: qualite,
      interpretation: qualite === 'bonne' ? 'Expression claire et structurée — critère de clarté uniquement'
        : qualite === 'correcte' ? 'Expression correcte — structuration à renforcer'
        : qualite === 'faible' ? 'Expression peu structurée — observation pour la clarté, sans en faire un critère discriminant'
        : 'Qualité d\'expression non évaluable',
    });

    // 12. RECONVERSION
    const reconversionKeywords = ['reconversion', 'réorientation', 'changement', 'après avoir travaillé',
      'nouvelle voie', 'parcours atypique', 'reprise d\'études', 'reprendre', 'retour en formation'];
    const reconversion = reconversionKeywords.some(k => lettreLC.includes(k));
    indicateurs.push({
      id: 'RECONVERSION',
      disponible: reconversion,
      valeur: reconversion,
      interpretation: reconversion
        ? 'Parcours atypique/reconversion — valoriser cohérence et maturité si argumenté'
        : 'Pas de reconversion/parcours atypique identifié',
    });

    // 13. INFORMATIONS_MANQUANTES
    const nbManquants = indicateurs.filter(i => !i.disponible).length;
    indicateurs.push({
      id: 'INFORMATIONS_MANQUANTES',
      disponible: true,
      valeur: nbManquants,
      interpretation: d.motivation.longueur < 50 ? 'Lettre très courte ou absente — informations très insuffisantes'
        : nbManquants > 5 ? `Plusieurs indicateurs non évaluables (${nbManquants})`
        : 'Informations suffisantes pour évaluation',
    });

    return indicateurs;
  }

  private static determinerPalierMotivation(indicateurs: Indicateur[], d: DonneesExtraites): number {
    const get = (id: string) => indicateurs.find(i => i.id === id);

    const clarte = get('CLARTE_PROJET');
    const coherence = get('COHERENCE_FILIERE');
    const appuis = get('APPUIS_EXPERIENCES');
    const representation = get('REPRESENTATION_METIER');
    const personnalisation = get('PERSONNALISATION');
    const analyseParc = get('ANALYSE_PARCOURS');
    const qualiteExpr = get('QUALITE_EXPRESSION');
    const motivIntr = get('MOTIVATION_INTRINSEQUE');

    const projetClair = clarte?.valeur === 'clair';
    const projetPartiel = clarte?.valeur === 'partiel';
    const estEtaye = appuis?.valeur === 'étayé';
    const bonneComprehension = (representation?.valeur as number) >= 3;
    const comprehensionPartielle = (representation?.valeur as number) >= 1;
    const estPersonnalise = personnalisation?.valeur === 'personnalisé';
    const estGenerique = personnalisation?.valeur === 'générique';
    const bonneQualite = qualiteExpr?.valeur === 'bonne';
    const reflexivite = (analyseParc?.valeur as number) >= 2;
    const sauveur = motivIntr?.valeur === 'sauveur';
    const confusions = coherence?.valeur === 'confus';

    // ── Palier 2 : Très construit ──
    if (projetClair && estEtaye && bonneComprehension && estPersonnalise && (bonneQualite || reflexivite)) {
      return 2;
    }

    // ── Palier 1.5 : Solide mais partiel ──
    if ((projetClair || projetPartiel) && (estEtaye || comprehensionPartielle) && !estGenerique) {
      return 1.5;
    }
    if (projetPartiel && estEtaye && comprehensionPartielle) {
      return 1.5;
    }

    // ── Palier 1 : Présent mais flou ──
    if (projetPartiel || d.motivation.longueur > 200) {
      if (estGenerique || !estEtaye || sauveur) {
        return 1;
      }
      return 1;
    }

    // ── Palier 0.5 : Fragile ──
    if (confusions || (sauveur && !estEtaye) || (!projetClair && !projetPartiel && d.motivation.longueur > 50)) {
      return 0.5;
    }

    // ── Palier 0 : Inévaluable ──
    return 0;
  }

  private static genererCommentaireMotivation(palier: number, indicateurs: Indicateur[], candidat: Candidat, d: DonneesExtraites): string {
    const get = (id: string) => indicateurs.find(i => i.id === id);
    const filiere = d.formation.filiere || candidat.filiereDemandee || 'la filière demandée';
    const clarte = get('CLARTE_PROJET');

    // Extraire les détails pour remplir les templates
    const secteur = clarte?.interpretation.match(/secteur (.+?)(?:\)|$)/)?.[1] || '';
    const exigencesDetail = this.extraireExigencesDetail(d.motivation.lettre);
    const raisonPrincipale = this.extraireRaisonPrincipale(d.motivation.lettre);
    const exempleAppui = this.extraireExempleAppui(d.motivation.lettre);

    switch (palier) {
      case 2:
        return `Projet clairement orienté vers ${filiere}${secteur ? ` avec cible ${secteur}` : ''}. Motivation étayée par ${exempleAppui || 'expériences/observations'} et compréhension des exigences (ex : ${exigencesDetail || 'travail d\'équipe/écrits/posture'}). Argumentation structurée et personnalisée. Motivation : très favorable.`;

      case 1.5:
        return `Projet cohérent avec ${filiere}, motivations ${raisonPrincipale || 'exprimées'} appuyées par ${exempleAppui || 'un exemple'}. Quelques éléments restent généraux (secteur/public). Compréhension des exigences présente mais à approfondir. Motivation : favorable.`;

      case 1:
        return `Motivation exprimée mais projet peu précisé (missions/secteur/public). Argumentation principalement déclarative, peu d'éléments concrets. Compréhension des exigences partielle. Motivation : mitigée sur cet item.`;

      case 0.5:
        return `Projet peu cohérent avec ${filiere} et/ou confusions importantes. Motivation peu étayée, manque d'éléments concrets et de recul. Motivation : faible en l'état.`;

      case 0:
      default:
        return "Lettre/projet de formation motivé non renseigné ou inexploitable dans le dossier Parcoursup. Item inévaluable en l'état.";
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERTES & ÉLÉMENTS VALORISANTS
  // ═══════════════════════════════════════════════════════════════════════════

  private static detecterAlertes(
    noteTotal: number,
    parcours: EvaluationCritere,
    experiences: EvaluationCritere,
    motivation: EvaluationCritere,
    d: DonneesExtraites,
  ): string[] {
    const alertes: string[] = [];

    if (noteTotal <= 3) alertes.push('Score IA faible — profil nécessite évaluation approfondie');
    if (parcours.note <= 1) alertes.push('Parcours scolaire fragile ou peu documenté');
    if (experiences.note <= 1) alertes.push('Expériences peu étayées dans le dossier');
    if (motivation.note <= 0.5) alertes.push('Motivation et projet professionnel insuffisamment documentés');
    if (d.notesBac.moyenneGenerale !== null && d.notesBac.moyenneGenerale < 10) alertes.push('Moyenne générale faible');
    if (d.scolarite.aRupture) alertes.push('Rupture de parcours identifiée');

    return alertes;
  }

  private static identifierElementsValorisants(
    parcours: EvaluationCritere,
    experiences: EvaluationCritere,
    motivation: EvaluationCritere,
    d: DonneesExtraites,
  ): string[] {
    const elements: string[] = [];

    if (parcours.note >= 2.5) elements.push('Excellence académique');
    if (experiences.note >= 2.5) elements.push('Expériences très riches et pertinentes pour le TS');
    if (motivation.note >= 1.5) elements.push('Projet professionnel solide et cohérent');
    if (parcours.note >= 2 && experiences.note >= 2 && motivation.note >= 1.5) elements.push('Profil équilibré sur les 3 critères');
    if (d.scolarite.aEtudesSup) elements.push('Parcours post-bac identifié');

    return elements;
  }

  // ─── JUSTIFICATION GLOBALE ─────────────────────────────────────────────

  private static genererJustificationGlobale(
    noteTotal: number,
    parcours: EvaluationCritere,
    experiences: EvaluationCritere,
    motivation: EvaluationCritere,
  ): string {
    const parties = [
      `Parcours scolaire (${parcours.note}/3) : ${parcours.commentaire}`,
      `Expériences (${experiences.note}/3) : ${experiences.commentaire}`,
      `Motivation (${motivation.note}/2) : ${motivation.commentaire}`,
    ];

    let synthese: string;
    if (noteTotal >= 6.5) synthese = 'Profil très favorable pour la formation en travail social.';
    else if (noteTotal >= 5) synthese = 'Profil favorable avec un bon potentiel pour la formation.';
    else if (noteTotal >= 3.5) synthese = 'Profil mitigé nécessitant une attention particulière lors de l\'oral.';
    else synthese = 'Profil nécessitant une évaluation approfondie lors de l\'oral.';

    return `${parties.join('\n')}\n\nTotal : ${noteTotal}/8 — ${synthese}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ══════════════════════════════════════��════════════════════════════════════

  private static stripHtml(html: string): string {
    return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  }

  private static parserNote(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const str = String(val).replace(',', '.').trim();
    // Format "12/20" ou "12.5/20"
    const matchFraction = str.match(/^(\d+[.,]?\d*)\s*\/\s*\d+$/);
    if (matchFraction) {
      const parsed = parseFloat(matchFraction[1]);
      return isNaN(parsed) ? null : parsed;
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? null : parsed;
  }

  private static trouverNote(notes: { matiere: string; note: number }[], keywords: string[]): number | null {
    const found = notes.find(n =>
      keywords.some(k => n.matiere.toLowerCase().includes(k))
    );
    return found ? found.note : null;
  }

  private static determinerTypeBac(serie: string): string {
    const s = serie.toLowerCase();
    if (s.includes('général') || s === 's' || s === 'es' || s === 'l' || s.includes('s ') || s.includes('es ') || s.includes('l ')) return 'général';
    if (s.includes('techno') || s.includes('st2s') || s.includes('stmg') || s.includes('sti') || s.includes('std2a') || s.includes('stl') || s.includes('st2a')) return 'technologique';
    if (s.includes('pro') || s.includes('professionnel')) return 'professionnel';
    if (s.length > 0 && s !== 'inconnue') return s;
    return 'non renseigné';
  }

  private static determinerColorationParcours(serie: string, specialites: string[]): string {
    const sLower = serie.toLowerCase();
    const spLower = specialites.map(s => s.toLowerCase()).join(' ');
    const tout = sLower + ' ' + spLower;

    if (tout.includes('st2s') || tout.includes('sanitaire') || tout.includes('social') || tout.includes('sms') || tout.includes('services')) return 'sociale/sanitaire';
    if (tout.includes('médico') || tout.includes('accompagnement')) return 'médico-sociale';
    if (tout.includes('littéraire') || tout.includes('humanité') || tout.includes('lettres') || tout.includes('philosophie')) return 'littéraire';
    if (tout.includes('ses') || tout.includes('sciences économiques') || tout.includes('sciences sociales') || tout.includes('histoire')) return 'sciences humaines et sociales';
    if (tout.includes('scientifique') || tout.includes('mathématique') || tout.includes('svt') || tout.includes('physique')) return 'scientifique';
    return 'autre';
  }

  private static evaluerCoherenceTS(_serie: string, _specialites: string[], coloration: string): string {
    if (coloration === 'sociale/sanitaire' || coloration === 'médico-sociale') return 'direct';
    if (coloration === 'littéraire' || coloration === 'sciences humaines et sociales') return 'neutre';
    return 'éloigné';
  }

  private static calculerEcartType(notes: number[]): number | null {
    if (notes.length < 3) return null;
    const moy = notes.reduce((s, n) => s + n, 0) / notes.length;
    const variance = notes.reduce((s, n) => s + (n - moy) ** 2, 0) / notes.length;
    return Math.round(Math.sqrt(variance) * 10) / 10;
  }

  private static identifierEcartsMatieres(notes: { matiere: string; note: number }[]): { pointsForts: string[]; pointsFaibles: string[] } {
    if (notes.length < 2) return { pointsForts: [], pointsFaibles: [] };
    const moy = notes.reduce((s, n) => s + n.note, 0) / notes.length;
    const pointsForts = notes.filter(n => n.note >= moy + 2).map(n => `${n.matiere} (${n.note}/20)`);
    const pointsFaibles = notes.filter(n => n.note <= moy - 2).map(n => `${n.matiere} (${n.note}/20)`);
    return { pointsForts, pointsFaibles };
  }

  private static aPointFortsTS(d: DonneesExtraites): boolean {
    const matieresTS = [d.notesBac.francais, d.notesBac.philosophie, d.notesBac.histoireGeo, d.notesBac.ses];
    const st2sMax = d.notesBac.st2s.length > 0 ? Math.max(...d.notesBac.st2s.map(n => n.note)) : null;
    if (st2sMax !== null) matieresTS.push(st2sMax);
    return matieresTS.filter(n => n !== null && n >= 13).length >= 2;
  }

  private static getAppreciationSignal(indicateurs: Indicateur[]): number {
    const assiduite = indicateurs.find(i => i.id === 'ASSIDUITE');
    const serieux = indicateurs.find(i => i.id === 'SERIEUX');
    const participation = indicateurs.find(i => i.id === 'PARTICIPATION');

    let signal = 0;
    if (assiduite?.valeur === 'positif') signal++;
    if (assiduite?.valeur === 'negatif') signal -= 2;
    if (serieux?.valeur === 'positif') signal++;
    if (serieux?.valeur === 'negatif') signal -= 2;
    if (participation?.valeur === 'positif') signal++;
    if (participation?.valeur === 'negatif') signal--;

    return signal;
  }

  private static getAppreciationDetail(indicateurs: Indicateur[]): string {
    const details: string[] = [];
    const ids = ['ASSIDUITE', 'SERIEUX', 'PARTICIPATION'];
    for (const id of ids) {
      const ind = indicateurs.find(i => i.id === id);
      if (ind?.disponible && ind.valeur !== 'absent') {
        const label = id === 'ASSIDUITE' ? 'assiduité' : id === 'SERIEUX' ? 'sérieux' : 'participation';
        details.push(label);
      }
    }
    return details.join('/') || '';
  }

  private static minerIndicateurTexte(texte: string, motsClesPositifs: string[], motsClesNegatifs: string[]): { signal: 'positif' | 'negatif' | 'absent'; detail: string } {
    const positifsFound = motsClesPositifs.filter(k => texte.includes(k));
    const negatifsFound = motsClesNegatifs.filter(k => texte.includes(k));

    if (negatifsFound.length > 0 && negatifsFound.length >= positifsFound.length) {
      return { signal: 'negatif', detail: negatifsFound.slice(0, 2).join(', ') };
    }
    if (positifsFound.length > 0) {
      return { signal: 'positif', detail: positifsFound.slice(0, 2).join(', ') };
    }
    return { signal: 'absent', detail: '' };
  }

  private static evaluerQualiteRedactionnelle(texte: string): 'bonne' | 'correcte' | 'faible' | 'non évaluable' {
    if (texte.length < 100) return 'non évaluable';

    const phrases = texte.split(/[.!?]+/).filter(p => p.trim().length > 10);
    const aStructure = phrases.length >= 3;
    const longueurMoyenne = phrases.reduce((s, p) => s + p.length, 0) / Math.max(phrases.length, 1);
    const aConnecteurs = ['cependant', 'en effet', 'de plus', 'par ailleurs', 'ainsi', 'c\'est pourquoi',
      'en outre', 'toutefois', 'néanmoins', 'premièrement', 'enfin', 'donc'].some(c => texte.toLowerCase().includes(c));

    if (aStructure && aConnecteurs && longueurMoyenne > 30) return 'bonne';
    if (aStructure && longueurMoyenne > 20) return 'correcte';
    return 'faible';
  }

  private static estTexteGenerique(texte: string): boolean {
    const phrasesGeneriques = [
      'j\'aime aider les autres',
      'depuis toujours',
      'c\'est ma vocation',
      'je souhaite aider les personnes',
      'j\'ai toujours voulu',
      'je suis passionné par l\'humain',
      'aider mon prochain',
    ];
    const nbGeneriques = phrasesGeneriques.filter(p => texte.includes(p)).length;
    return nbGeneriques >= 2;
  }

  private static detecterContraintes(lettre: string): string | null {
    const lc = lettre.toLowerCase();
    const contraintes: string[] = [];
    if (lc.includes('handicap') || lc.includes('rqth') || lc.includes('mdph')) contraintes.push('situation de handicap');
    if (lc.includes('maladie') || lc.includes('santé')) contraintes.push('contraintes de santé');
    if (lc.includes('charge familiale') || lc.includes('parent') && lc.includes('seul')) contraintes.push('charges familiales');
    if (lc.includes('travail') && (lc.includes('obligation') || lc.includes('nécessité'))) contraintes.push('obligations professionnelles');
    return contraintes.length > 0 ? contraintes.join(', ') : null;
  }

  private static construireBacDescription(d: DonneesExtraites): string {
    const parts: string[] = [];
    if (d.bac.enCours && d.bac.obtenu !== true) parts.push('(en cours)');
    if (d.bac.type !== 'non renseigné') {
      parts.push(`Bac ${d.bac.type}`);
    } else {
      parts.push('type de bac non renseigné');
    }
    if (d.bac.serie && d.bac.serie !== 'Inconnue' && d.bac.serie.toLowerCase() !== d.bac.type) {
      parts.push(d.bac.serie);
    }
    if (d.bac.specialites.length > 0) {
      parts.push(`(${d.bac.specialites.join(', ')})`);
    }
    return parts.join(' ');
  }

  private static formaterPointsForts(d: DonneesExtraites): string {
    const pf: string[] = [];
    const matieresClefs: [string, number | null][] = [
      ['français', d.notesBac.francais],
      ['philosophie', d.notesBac.philosophie],
      ['histoire-géo', d.notesBac.histoireGeo],
      ['SES', d.notesBac.ses],
      ['langues', d.notesBac.langues],
    ];
    for (const [label, note] of matieresClefs) {
      if (note !== null && note >= 12) {
        pf.push(`${label} (${note}/20)`);
      }
    }
    if (d.notesBac.st2s.length > 0) {
      d.notesBac.st2s.forEach(n => {
        if (n.note >= 12) pf.push(`${n.matiere} (${n.note}/20)`);
      });
    }
    return pf.join(', ');
  }

  private static formaterFragilites(d: DonneesExtraites): string {
    const frag: string[] = [];
    const matieresClefs: [string, number | null][] = [
      ['français', d.notesBac.francais],
      ['philosophie', d.notesBac.philosophie],
      ['histoire-géo', d.notesBac.histoireGeo],
      ['SES', d.notesBac.ses],
    ];
    for (const [label, note] of matieresClefs) {
      if (note !== null && note < 10) {
        frag.push(`${label} (${note}/20)`);
      }
    }
    return frag.join(', ');
  }

  private static identifierPublicTS(texte: string): string {
    const publics: string[] = [];
    if (texte.includes('enfant') || texte.includes('protection de l\'enfance') || texte.includes('ase')) publics.push('enfants/protection de l\'enfance');
    if (texte.includes('handicap') || texte.includes('ime') || texte.includes('itep') || texte.includes('esat')) publics.push('handicap');
    if (texte.includes('insertion') || texte.includes('précarité') || texte.includes('sans-abri')) publics.push('insertion/précarité');
    if (texte.includes('personnes âgées') || texte.includes('ehpad')) publics.push('personnes âgées');
    if (texte.includes('santé mentale') || texte.includes('psychiatr')) publics.push('santé mentale');
    if (texte.includes('migrant') || texte.includes('réfugié')) publics.push('migrants/réfugiés');
    if (texte.includes('autisme') || texte.includes('autiste')) publics.push('autisme');
    return publics.join(', ') || 'publics vulnérables';
  }

  private static construireTypeEngagement(
    engagement: Indicateur | undefined,
    benevolat: Indicateur | undefined,
    serviceCivique: Indicateur | undefined,
    bafa: Indicateur | undefined,
    emplois: Indicateur | undefined,
  ): string {
    const types: string[] = [];
    if (serviceCivique?.disponible) types.push('service civique');
    if (engagement?.disponible) types.push('engagement associatif');
    if (benevolat?.disponible) types.push('bénévolat');
    if (bafa?.disponible) types.push('BAFA/animation');
    if (emplois?.disponible) types.push(emplois.valeur === 'contact public' ? 'emploi au contact du public' : 'emploi');
    return types.join(', ') || '';
  }

  private static extraireExemplesMissions(d: DonneesExtraites): string {
    const texte = d.activites.texteComplet.toLowerCase();
    const missions: string[] = [];
    const missionKeywords = ['accompagnement', 'animation', 'accueil', 'soutien', 'aide', 'encadrement',
      'médiation', 'écoute', 'organisation', 'coordination'];
    for (const k of missionKeywords) {
      if (texte.includes(k)) missions.push(k);
      if (missions.length >= 3) break;
    }
    return missions.length > 0 ? missions.join(', ') : 'missions non détaillées';
  }

  private static extraireExigencesDetail(lettre: string): string {
    const lc = lettre.toLowerCase();
    const exigences: string[] = [];
    if (lc.includes('travail d\'équipe') || lc.includes('équipe')) exigences.push('travail d\'équipe');
    if (lc.includes('écrits') || lc.includes('rédaction')) exigences.push('écrits');
    if (lc.includes('posture') || lc.includes('distance')) exigences.push('posture');
    if (lc.includes('éthique') || lc.includes('déontologie')) exigences.push('éthique');
    if (lc.includes('accompagnement')) exigences.push('accompagnement');
    if (lc.includes('non-jugement')) exigences.push('non-jugement');
    return exigences.slice(0, 3).join('/') || '';
  }

  private static extraireRaisonPrincipale(lettre: string): string {
    const lc = lettre.toLowerCase();
    if (lc.includes('reconversion')) return 'liées à une reconversion';
    if (lc.includes('expérience') || lc.includes('stage')) return 'liées à des expériences concrètes';
    if (lc.includes('rencontre') || lc.includes('observ')) return 'liées à des rencontres/observations';
    if (lc.includes('valeur') || lc.includes('conviction')) return 'liées à des valeurs personnelles';
    return '';
  }

  private static extraireExempleAppui(lettre: string): string {
    const lc = lettre.toLowerCase();
    if (lc.includes('stage')) return 'un stage';
    if (lc.includes('bénévolat') || lc.includes('bénévole')) return 'du bénévolat';
    if (lc.includes('service civique')) return 'un service civique';
    if (lc.includes('emploi') || lc.includes('travaillé')) return 'une expérience professionnelle';
    if (lc.includes('rencontré') || lc.includes('observé')) return 'des observations/rencontres';
    return '';
  }

  private static extraireContexte(texte: string, keyword: string, longueur: number): string {
    const idx = texte.indexOf(keyword);
    if (idx === -1) return '';
    const start = Math.max(0, idx);
    const end = Math.min(texte.length, idx + keyword.length + longueur);
    return texte.substring(start, end).trim();
  }

  private static arrondirDemi(val: number): number {
    return Math.round(val * 2) / 2;
  }
}
