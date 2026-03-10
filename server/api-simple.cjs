const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3003;

// Ensure DATABASE_URL has pgbouncer params when using Supabase connection pooler (port 6543)
function getDatabaseUrl() {
  let url = process.env.DATABASE_URL;
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.port === '6543') {
      if (!parsed.searchParams.has('pgbouncer')) {
        parsed.searchParams.set('pgbouncer', 'true');
      }
      if (!parsed.searchParams.has('connection_limit')) {
        parsed.searchParams.set('connection_limit', '1');
      }
      url = parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

let prisma = new PrismaClient({
  datasources: {
    db: { url: getDatabaseUrl() },
  },
  log: ['error', 'warn'],
});

// Keep Supabase connection alive with reconnect on failure
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.warn('⚠️ DB keepalive failed, attempting reconnect...', err.message);
    try {
      await prisma.$disconnect();
    } catch {}
    prisma = new PrismaClient({
      datasources: {
        db: { url: getDatabaseUrl() },
      },
      log: ['error', 'warn'],
    });
    try {
      await prisma.$connect();
      console.log('✅ DB reconnected successfully');
    } catch (reconnectErr) {
      console.error('❌ DB reconnect failed:', reconnectErr.message);
    }
  }
}, 60_000);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== CAMPAGNES ====================

// Récupérer toutes les campagnes
app.get('/api/campagnes', async (req, res) => {
  try {
    const campagnes = await prisma.campagne.findMany({
      include: {
        _count: {
          select: { candidats: true }
        }
      },
      orderBy: { annee: 'desc' }
    });
    res.json(campagnes);
  } catch (error) {
    console.error('❌ Erreur API /campagnes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des campagnes' });
  }
});

// Créer une nouvelle campagne
app.post('/api/campagnes', async (req, res) => {
  try {
    const { annee, libelle, description, dateDebut, dateFin } = req.body;

    const campagne = await prisma.campagne.create({
      data: {
        annee: parseInt(annee),
        libelle,
        description,
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        statut: 'preparation'
      }
    });

    res.json(campagne);
  } catch (error) {
    console.error('❌ Erreur API POST /campagnes:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la campagne' });
  }
});

// Mettre à jour une campagne
app.put('/api/campagnes/:id', async (req, res) => {
  try {
    const { libelle, description, statut, dateDebut, dateFin } = req.body;

    const campagne = await prisma.campagne.update({
      where: { id: req.params.id },
      data: {
        libelle,
        description,
        statut,
        dateDebut: dateDebut ? new Date(dateDebut) : undefined,
        dateFin: dateFin ? new Date(dateFin) : undefined
      }
    });

    res.json(campagne);
  } catch (error) {
    console.error('❌ Erreur API PUT /campagnes:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la campagne' });
  }
});

// ==================== CANDIDATS ====================

// Récupérer tous les candidats (avec filtre optionnel par campagne)
app.get('/api/candidats', async (req, res) => {
  try {
    const { campagneId } = req.query;

    const where = campagneId ? { campagneId } : {};

    const candidats = await prisma.candidat.findMany({
      where,
      include: {
        analyses: {
          orderBy: { dateAnalyse: 'desc' },
          take: 1
        },
        validations: {
          orderBy: { dateValidation: 'desc' },
          take: 1
        },
        campagne: true,
        oralAdmission: true
      },
      orderBy: { dateImport: 'desc' }
    });
    
    // Mapper vers le format attendu
    const candidatsFormates = candidats.map(c => formatCandidat(c));

    res.json(candidatsFormates);
  } catch (error) {
    console.error('❌ Erreur API /candidats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des candidats' });
  }
});

// Récupérer un candidat spécifique
app.get('/api/candidats/:id', async (req, res) => {
  try {
    const candidat = await prisma.candidat.findUnique({
      where: { id: req.params.id },
      include: {
        analyses: {
          orderBy: { dateAnalyse: 'desc' }
        },
        validations: {
          orderBy: { dateValidation: 'desc' }
        },
        oralAdmission: true
      }
    });

    if (!candidat) {
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }

    res.json(formatCandidat(candidat));
  } catch (error) {
    console.error(`❌ Erreur API /candidats/${req.params.id}:`, error);
    res.status(500).json({ error: 'Erreur lors de la récupération du candidat' });
  }
});

// Endpoint d'import de données Parcoursup
app.post('/api/import', async (req, res) => {
  try {
    const { candidatsData, campagneId } = req.body;

    if (!candidatsData || !Array.isArray(candidatsData)) {
      return res.status(400).json({ error: 'Format invalide: candidatsData doit être un tableau' });
    }

    // Trouver ou créer la campagne active
    let campagne;
    if (campagneId) {
      campagne = await prisma.campagne.findUnique({ where: { id: campagneId } });
    } else {
      // Chercher la campagne en cours
      campagne = await prisma.campagne.findFirst({
        where: { statut: 'en_cours' },
        orderBy: { annee: 'desc' }
      });
    }

    if (!campagne) {
      return res.status(400).json({ error: 'Aucune campagne active trouvée. Veuillez créer ou sélectionner une campagne.' });
    }

    // Extraire tous les numéros de dossier du fichier importé
    const numerosImportes = candidatsData.map((c, i) => {
      const d = c.DonneesCandidats || {};
      return String(d.NumeroDossierCandidat || `tmp-${Date.now()}-${i}`);
    });

    // Vérifier lesquels existent déjà en base
    const existants = await prisma.candidat.findMany({
      where: { numeroDossier: { in: numerosImportes } },
      select: { numeroDossier: true }
    });
    const numerosExistants = new Set(existants.map(e => e.numeroDossier));

    // Filtrer : ne garder que les nouveaux
    const nouveaux = [];
    const doublons = [];
    for (let i = 0; i < candidatsData.length; i++) {
      const numero = numerosImportes[i];
      if (numerosExistants.has(numero)) {
        doublons.push(numero);
      } else {
        nouveaux.push(candidatsData[i]);
      }
    }

    // Si tout est déjà importé, retourner directement
    if (nouveaux.length === 0) {
      console.log(`ℹ️ Aucun nouveau candidat — ${doublons.length} déjà en base`);
      return res.json({
        success: true,
        imported: 0,
        skipped: doublons.length,
        errors: 0,
        total: candidatsData.length,
        message: `Aucun nouveau candidat à importer. Les ${doublons.length} candidats du fichier sont déjà en base.`
      });
    }

    console.log(`📥 Import: ${nouveaux.length} nouveaux, ${doublons.length} déjà existants (ignorés)`);

    const candidatsImportes = [];
    let erreurs = 0;

    for (let index = 0; index < nouveaux.length; index++) {
      const candidatBrut = nouveaux[index];

      try {
        // Extraire les données
        const donneesCandidat = candidatBrut.DonneesCandidats || {};
        const scolarite = candidatBrut.Scolarite || [];
        const baccalaureat = candidatBrut.Baccalaureat || {};
        const notesBac = candidatBrut.NotesBaccalaureat || [];

        // Calcul des moyennes depuis NotesBaccalaureat (clé séparée dans Parcoursup)
        const moyennes = calculerMoyennesBac(notesBac);
        const etablissement = getEtablissementOrigine(scolarite);
        const evolution = analyserEvolution(scolarite);

        // Créer le candidat
        const candidat = await prisma.candidat.create({
          data: {
            numeroDossier: String(donneesCandidat.NumeroDossierCandidat || Date.now()),
            nom: donneesCandidat.NomCandidat || 'Nom inconnu',
            prenom: donneesCandidat.PrenomCandidat || 'Prénom inconnu',
            dateNaissance: donneesCandidat.DateNaissance || '',
            email: donneesCandidat.CoordonneesAdressemail || '',
            telephone: donneesCandidat.CoordonneesTelephonemobile || '',
            serieBac: baccalaureat.SerieDiplomeLibelle || 'Inconnue',
            etablissementOrigine: etablissement,
            moyenneGenerale: moyennes.generale,
            moyenneFrancais: moyennes.francais,
            moyenneHistoireGeo: moyennes.histoireGeo,
            moyennePhilosophie: moyennes.philosophie,
            moyenneMaths: moyennes.maths,
            evolutionNotes: evolution,
            donneesParcoursup: JSON.stringify(candidatBrut),
            campagneId: campagne.id,
            statut: 'importe'
          }
        });

        // Déterminer le statut FI/CA et la procédure d'admission
        const donneesVoeux = candidatBrut.DonneesVoeux || {};
        const statutDemande = detecterStatutDemande(donneesVoeux, donneesCandidat);
        const procedureAdmission = determinerProcedureAdmission(statutDemande);
        const filiereDemandee = detecterFiliere(donneesVoeux, donneesCandidat);

        // Mettre à jour les infos d'admission sur le candidat
        await prisma.candidat.update({
          where: { id: candidat.id },
          data: {
            filiereDemandee: filiereDemandee || null,
            statutDemande: statutDemande || null,
            procedureAdmission: procedureAdmission || null,
            bacObtenu: baccalaureat.BaccalaureatObtenu === 'Oui' ? 'oui' : (baccalaureat.AnneeObtention ? 'oui' : 'en_cours'),
            typeBac: baccalaureat.SerieDiplomeLibelle || null,
            anneeBac: String(baccalaureat.AnneeObtention || ''),
            rqthMdph: donneesCandidat.RQTH === 'Oui' ? 'oui' : 'non',
          }
        });

        // Analyse IA V2 (3 critères)
        const analyse = analyserCandidatV2(candidat, candidatBrut);

        // Sauvegarder l'analyse V2 avec sous-notes
        await prisma.analyseIA.create({
          data: {
            candidatId: candidat.id,
            syntheseAppreciations: analyse.justificationGlobale,
            motsClesPositifs: JSON.stringify([]),
            motsClesNegatifs: JSON.stringify([]),
            alertes: JSON.stringify(analyse.alertes),
            elementsValorisants: JSON.stringify(analyse.elementsValorisants),
            cotationIAProposee: analyse.noteTotal,
            justificationIA: analyse.justificationGlobale,
            noteParcoursScolaire: analyse.parcoursScolaire.note,
            commentaireParcoursScolaire: analyse.parcoursScolaire.commentaire,
            noteExperiences: analyse.experiences.note,
            commentaireExperiences: analyse.experiences.commentaire,
            noteMotivation: analyse.motivation.note,
            commentaireMotivation: analyse.motivation.commentaire,
            versionModele: 'v2.0'
          }
        });

        // Dénormaliser les sous-notes sur le candidat
        await prisma.candidat.update({
          where: { id: candidat.id },
          data: {
            statut: 'analyse',
            cotationIAProposee: analyse.noteTotal,
            syntheseAppreciations: analyse.justificationGlobale,
            alertes: JSON.stringify(analyse.alertes),
            elementsValorisants: JSON.stringify(analyse.elementsValorisants),
            noteParcoursScolaire: analyse.parcoursScolaire.note,
            commentaireParcoursScolaire: analyse.parcoursScolaire.commentaire,
            noteExperiences: analyse.experiences.note,
            commentaireExperiences: analyse.experiences.commentaire,
            noteMotivation: analyse.motivation.note,
            commentaireMotivation: analyse.motivation.commentaire,
          }
        });

        candidatsImportes.push(candidat);

      } catch (error) {
        console.error(`❌ Erreur candidat ${index + 1}:`, error.message);
        erreurs++;
      }
    }

    console.log(`✅ Import terminé: ${candidatsImportes.length} nouveaux, ${doublons.length} ignorés, ${erreurs} erreurs`);

    res.json({
      success: true,
      imported: candidatsImportes.length,
      skipped: doublons.length,
      errors: erreurs,
      total: candidatsData.length,
      message: doublons.length > 0
        ? `${candidatsImportes.length} nouveau(x) candidat(s) importé(s). ${doublons.length} déjà existant(s) ignoré(s).`
        : `${candidatsImportes.length} candidat(s) importé(s) avec succès.`
    });

  } catch (error) {
    console.error('❌ Erreur API /import:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
});

// ==================== COMMENTAIRES ====================

// Récupérer les commentaires d'un candidat
app.get('/api/candidats/:candidatId/commentaires', async (req, res) => {
  try {
    const commentaires = await prisma.commentaire.findMany({
      where: { candidatId: req.params.candidatId },
      orderBy: { dateCreation: 'desc' }
    });
    res.json(commentaires);
  } catch (error) {
    console.error('❌ Erreur API GET /commentaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commentaires' });
  }
});

// Ajouter un commentaire
app.post('/api/candidats/:candidatId/commentaires', async (req, res) => {
  try {
    const { contenu, type, auteurNom } = req.body;

    const commentaire = await prisma.commentaire.create({
      data: {
        candidatId: req.params.candidatId,
        contenu,
        type: type || 'general',
        auteurNom: auteurNom || 'Utilisateur'
      }
    });

    res.json(commentaire);
  } catch (error) {
    console.error('❌ Erreur API POST /commentaires:', error);
    res.status(500).json({ error: 'Erreur lors de la création du commentaire' });
  }
});

// Modifier un commentaire
app.put('/api/commentaires/:id', async (req, res) => {
  try {
    const { contenu } = req.body;

    const commentaire = await prisma.commentaire.update({
      where: { id: req.params.id },
      data: {
        contenu,
        estModifie: true
      }
    });

    res.json(commentaire);
  } catch (error) {
    console.error('❌ Erreur API PUT /commentaires:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du commentaire' });
  }
});

// Supprimer un commentaire
app.delete('/api/commentaires/:id', async (req, res) => {
  try {
    await prisma.commentaire.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur API DELETE /commentaires:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du commentaire' });
  }
});

// ==================== HISTORIQUE STATUTS ====================

// Récupérer l'historique des statuts d'un candidat
app.get('/api/candidats/:candidatId/historique', async (req, res) => {
  try {
    const historique = await prisma.historiqueStatut.findMany({
      where: { candidatId: req.params.candidatId },
      orderBy: { dateChangement: 'desc' }
    });
    res.json(historique);
  } catch (error) {
    console.error('❌ Erreur API GET /historique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

// Créer une entrée d'historique (appelé automatiquement lors du changement de statut)
app.post('/api/candidats/:candidatId/historique', async (req, res) => {
  try {
    const { ancienStatut, nouveauStatut, motif, auteurNom } = req.body;

    const historique = await prisma.historiqueStatut.create({
      data: {
        candidatId: req.params.candidatId,
        ancienStatut,
        nouveauStatut,
        motif,
        auteurNom: auteurNom || 'Système'
      }
    });

    res.json(historique);
  } catch (error) {
    console.error('❌ Erreur API POST /historique:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'historique' });
  }
});

// ==================== ORAL D'ADMISSION ====================

// Récupérer les notes d'oral d'un candidat
app.get('/api/candidats/:candidatId/oral', async (req, res) => {
  try {
    const oral = await prisma.oralAdmission.findUnique({
      where: { candidatId: req.params.candidatId }
    });

    if (!oral) {
      return res.json(null);
    }

    res.json({
      id: oral.id,
      candidatId: oral.candidatId,
      noteParticipationCollectif: oral.noteParticipationCollectif,
      noteExpressionEmotions: oral.noteExpressionEmotions,
      noteAnalyseTS: oral.noteAnalyseTS,
      notePresentationIndividuelle: oral.notePresentationIndividuelle,
      noteTotal: oral.noteTotal,
      jury1Nom: oral.jury1Nom,
      jury2Nom: oral.jury2Nom,
      commentaires: oral.commentaires,
      pointsVigilance: oral.pointsVigilance,
      dateOral: oral.dateOral,
    });
  } catch (error) {
    console.error('❌ Erreur API GET /oral:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notes d\'oral' });
  }
});

// Sauvegarder / mettre à jour les notes d'oral d'un candidat
app.post('/api/candidats/:candidatId/oral', async (req, res) => {
  try {
    const { candidatId } = req.params;
    const {
      noteParticipationCollectif,
      noteExpressionEmotions,
      noteAnalyseTS,
      notePresentationIndividuelle,
      jury1Nom,
      jury2Nom,
      commentaires,
      pointsVigilance,
      dateOral,
    } = req.body;

    const noteTotal = (noteParticipationCollectif || 0) +
      (noteExpressionEmotions || 0) +
      (noteAnalyseTS || 0) +
      (notePresentationIndividuelle || 0);

    const oral = await prisma.oralAdmission.upsert({
      where: { candidatId },
      create: {
        candidatId,
        noteParticipationCollectif,
        noteExpressionEmotions,
        noteAnalyseTS,
        notePresentationIndividuelle,
        noteTotal,
        jury1Nom,
        jury2Nom,
        commentaires,
        pointsVigilance,
        dateOral: dateOral ? new Date(dateOral) : new Date(),
      },
      update: {
        noteParticipationCollectif,
        noteExpressionEmotions,
        noteAnalyseTS,
        notePresentationIndividuelle,
        noteTotal,
        jury1Nom,
        jury2Nom,
        commentaires,
        pointsVigilance,
        dateOral: dateOral ? new Date(dateOral) : new Date(),
      },
    });

    res.json({
      id: oral.id,
      candidatId: oral.candidatId,
      noteParticipationCollectif: oral.noteParticipationCollectif,
      noteExpressionEmotions: oral.noteExpressionEmotions,
      noteAnalyseTS: oral.noteAnalyseTS,
      notePresentationIndividuelle: oral.notePresentationIndividuelle,
      noteTotal: oral.noteTotal,
      jury1Nom: oral.jury1Nom,
      jury2Nom: oral.jury2Nom,
      commentaires: oral.commentaires,
      pointsVigilance: oral.pointsVigilance,
      dateOral: oral.dateOral,
    });
  } catch (error) {
    console.error('❌ Erreur API POST /oral:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde des notes d\'oral' });
  }
});

// ==================== FORMAT CANDIDAT HELPER ====================

function formatCandidat(c) {
  const analyse = c.analyses?.[0];
  const validation = c.validations?.[0];
  const oral = c.oralAdmission;

  return {
    id: c.id,
    numeroDossier: c.numeroDossier,
    nom: c.nom,
    prenom: c.prenom,
    dateNaissance: c.dateNaissance,
    serieBac: c.serieBac,
    etablissementOrigine: c.etablissementOrigine,
    email: c.email,
    telephone: c.telephone,
    moyenneGenerale: c.moyenneGenerale,
    moyenneFrancais: c.moyenneFrancais,
    moyenneHistoireGeo: c.moyenneHistoireGeo,
    moyennePhilosophie: c.moyennePhilosophie,
    moyenneMaths: c.moyenneMaths,
    evolutionNotes: c.evolutionNotes,

    // Infos admission (Procédure V2)
    filiereDemandee: c.filiereDemandee || undefined,
    statutDemande: c.statutDemande || undefined,
    procedureAdmission: c.procedureAdmission || undefined,
    bacObtenu: c.bacObtenu || undefined,
    typeBac: c.typeBac || undefined,
    anneeBac: c.anneeBac || undefined,
    rqthMdph: c.rqthMdph || undefined,

    // Analyse IA
    syntheseAppreciations: c.syntheseAppreciations || analyse?.syntheseAppreciations || '',
    motsClesPositifs: analyse ? safeParseJSON(analyse.motsClesPositifs, []) : [],
    motsClesNegatifs: analyse ? safeParseJSON(analyse.motsClesNegatifs, []) : [],
    alertes: safeParseJSON(c.alertes, []) || (analyse ? safeParseJSON(analyse.alertes, []) : []),
    elementsValorisants: safeParseJSON(c.elementsValorisants, []) || (analyse ? safeParseJSON(analyse.elementsValorisants, []) : []),
    cotationIAProposee: c.cotationIAProposee || analyse?.cotationIAProposee || 0,

    // Sous-notes IA (Procédure V2)
    noteParcoursScolaire: c.noteParcoursScolaire ?? analyse?.noteParcoursScolaire ?? undefined,
    commentaireParcoursScolaire: c.commentaireParcoursScolaire ?? analyse?.commentaireParcoursScolaire ?? undefined,
    noteExperiences: c.noteExperiences ?? analyse?.noteExperiences ?? undefined,
    commentaireExperiences: c.commentaireExperiences ?? analyse?.commentaireExperiences ?? undefined,
    noteMotivation: c.noteMotivation ?? analyse?.noteMotivation ?? undefined,
    commentaireMotivation: c.commentaireMotivation ?? analyse?.commentaireMotivation ?? undefined,

    // Oral d'admission
    oralAdmission: oral ? {
      id: oral.id,
      candidatId: oral.candidatId,
      noteParticipationCollectif: oral.noteParticipationCollectif,
      noteExpressionEmotions: oral.noteExpressionEmotions,
      noteAnalyseTS: oral.noteAnalyseTS,
      notePresentationIndividuelle: oral.notePresentationIndividuelle,
      noteTotal: oral.noteTotal,
      jury1Nom: oral.jury1Nom,
      jury2Nom: oral.jury2Nom,
      commentaires: oral.commentaires,
      pointsVigilance: oral.pointsVigilance,
      dateOral: oral.dateOral,
    } : undefined,

    // Validation
    cotationFinale: validation?.cotationFinale || undefined,
    commentaireEvaluateur: validation?.commentaire || '',
    validateurNom: validation?.validateurNom || '',
    dateValidation: validation?.dateValidation || undefined,

    statut: c.statut,
    campagneId: c.campagneId,
    campagneLibelle: c.campagne?.libelle,
    donneesParcoursup: c.donneesParcoursup ? JSON.parse(c.donneesParcoursup) : {}
  };
}

function safeParseJSON(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

// ==================== ANALYSE IA V2 (Procédure Admission V2) ====================

function detecterStatutDemande(donneesVoeux, donneesCandidat) {
  const statut = donneesVoeux.StatutDemande || donneesCandidat.StatutDemande || donneesVoeux.TypeCandidat || '';
  const s = statut.toUpperCase().trim();
  if (s.includes('CA') && s.includes('FI')) return 'FI+CA';
  if (s === 'CA' || s.includes('CONTRAT') || s.includes('APPRENTI')) return 'CA';
  return 'FI';
}

function determinerProcedureAdmission(statutDemande) {
  const s = (statutDemande || '').toUpperCase().trim();
  if (s === 'CA') return 'admis_de_droit';
  if (s === 'FI') return 'etude_dossier_oral';
  return 'les_deux';
}

function detecterFiliere(donneesVoeux, donneesCandidat) {
  const texte = ((donneesVoeux.VoeuLibelle || '') + ' ' + (donneesVoeux.FormationLibelle || '') + ' ' + (donneesCandidat.FormationDemandee || '')).toLowerCase();
  if (texte.includes('éducateur spécialisé') || texte.includes(' es')) return 'ES';
  if (texte.includes('jeunes enfants') || texte.includes('eje')) return 'EJE';
  if (texte.includes('assistant social') || texte.includes(' ass')) return 'ASS';
  return '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYSE V2 — Profile Matching (conformité stricte Procédure V2)
// ═══════════════════════════════════════════════════════════════════════════════

function stripHtml(html) {
  return (html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

function parserNote(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const str = String(val).replace(',', '.').trim();
  const matchFraction = str.match(/^(\d+[.,]?\d*)\s*\/\s*\d+$/);
  if (matchFraction) { const p = parseFloat(matchFraction[1]); return isNaN(p) ? null : p; }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed;
}

function trouverNote(notes, keywords) {
  const found = notes.find(n => keywords.some(k => n.matiere.toLowerCase().includes(k)));
  return found ? found.note : null;
}

function extraireDonneesCompletesCJS(candidat, candidatBrut) {
  const dp = candidatBrut || {};
  const bac = dp.Baccalaureat || {};
  const notesBacRaw = dp.NotesBaccalaureat || dp.NotesBac || {};
  const scolariteArr = dp.Scolarite || [];
  const activites = dp.ActivitesCentresInteret || {};
  const donneesVoeux = dp.DonneesVoeux || {};
  const bulletins = dp.BulletinsScolaires || dp.Bulletins || [];

  // BAC
  const serieBac = bac.SerieDiplomeLibelle || bac.SerieLibelle || candidat.serieBac || '';
  const sLower = serieBac.toLowerCase();
  const typeBac = sLower.includes('général') || sLower === 's' || sLower === 'es' || sLower === 'l' ? 'général'
    : sLower.includes('techno') || sLower.includes('st2s') || sLower.includes('stmg') || sLower.includes('sti') || sLower.includes('stl') ? 'technologique'
    : sLower.includes('pro') ? 'professionnel'
    : sLower.length > 0 && sLower !== 'inconnue' ? sLower : 'non renseigné';
  const bacObtenuRaw = bac.BacStatut || bac.BaccalaureatObtenu || '';
  const bacObtenu = bacObtenuRaw === 'obtenu' || bacObtenuRaw === 'Oui' ? true : bacObtenuRaw === 'non' || bacObtenuRaw === 'Non' ? false : null;
  const enCours = bacObtenu === null || bacObtenuRaw === 'en_cours' || bacObtenuRaw === '';
  const specialitesRaw = bac.Specialites || bac.SpecialiteLibelle || '';
  const specialites = typeof specialitesRaw === 'string' ? specialitesRaw.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : Array.isArray(specialitesRaw) ? specialitesRaw : [];

  // NOTES BAC
  const toutesNotes = [];
  const notesObj = notesBacRaw.Notes || notesBacRaw;
  if (Array.isArray(notesObj)) {
    notesObj.forEach(n => {
      const matiere = n.Matiere || n.LibelleMatiere || n.Nom || '';
      const noteVal = parserNote(n.Note || n.NoteEpreuve || n.Valeur);
      if (matiere && noteVal !== null) toutesNotes.push({ matiere, note: noteVal });
    });
  } else if (typeof notesObj === 'object' && notesObj !== null) {
    Object.entries(notesObj).forEach(([key, val]) => {
      if (key === 'Notes' || key === 'MoyenneGenerale') return;
      const noteVal = parserNote(val);
      if (noteVal !== null) toutesNotes.push({ matiere: key, note: noteVal });
    });
  }

  const francais = trouverNote(toutesNotes, ['français', 'francais', 'lettres', 'eaf']) ?? candidat.moyenneFrancais ?? null;
  const philosophie = trouverNote(toutesNotes, ['philosophie', 'philo']) ?? candidat.moyennePhilosophie ?? null;
  const histoireGeo = trouverNote(toutesNotes, ['histoire', 'géographie', 'geographie', 'hist']) ?? candidat.moyenneHistoireGeo ?? null;
  const ses = trouverNote(toutesNotes, ['ses', 'sciences économiques', 'sciences sociales']) ?? null;
  const langues = trouverNote(toutesNotes, ['anglais', 'espagnol', 'allemand', 'langue', 'lv1', 'lv2']) ?? null;
  const moyenneGenerale = parserNote(notesBacRaw.MoyenneGenerale) ?? candidat.moyenneGenerale ?? (toutesNotes.length >= 3 ? Math.round(toutesNotes.reduce((s, n) => s + n.note, 0) / toutesNotes.length * 10) / 10 : null);

  const st2sNotes = [];
  const st2sKw = ['st2s', 'biologie', 'physiopathologie', 'sanitaire', 'social', 'médico', 'services', 'accompagnement'];
  toutesNotes.forEach(n => { if (st2sKw.some(k => n.matiere.toLowerCase().includes(k))) st2sNotes.push(n); });

  // SCOLARITÉ
  const scolariteTexte = JSON.stringify(scolariteArr).toLowerCase();
  const aRedouble = scolariteTexte.includes('redouble') || scolariteTexte.includes('répétition');
  const aRupture = scolariteTexte.includes('rupture') || scolariteTexte.includes('interruption');
  const etudeSup = scolariteArr.find(s => s.NiveauEtudeCode && parseInt(s.NiveauEtudeCode) > 4);
  const aEtudesSup = !!etudeSup;
  const detailSup = etudeSup ? (etudeSup.FormationLibelle || 'formation post-bac') : null;

  // APPRÉCIATIONS
  let texteAppreciations = '';
  bulletins.forEach(b => {
    if (b.AppreciationGenerale) texteAppreciations += ' ' + b.AppreciationGenerale;
    if (b.Appreciations) b.Appreciations.forEach(a => { if (a.Texte) texteAppreciations += ' ' + a.Texte; });
  });
  scolariteArr.forEach(s => { if (s.AppreciationProviseur) texteAppreciations += ' ' + s.AppreciationProviseur; });
  const ficheAvenir = dp.FicheAvenir || dp.AppreciationsEnseignantsFicheAvenir || {};
  if (ficheAvenir.Appreciation) texteAppreciations += ' ' + ficheAvenir.Appreciation;
  if (ficheAvenir.AppreciationConseil) texteAppreciations += ' ' + ficheAvenir.AppreciationConseil;

  // ACTIVITÉS
  const experiencesPro = activites.ExperiencesProfessionnelles || '';
  const engagementsCitoyen = activites.EngagementsCitoyen || '';
  const encadrement = activites.ExperienceEncadrement || '';
  const sportCulture = activites.PratiquesSportivesCulturelles || '';
  const texteComplet = [experiencesPro, engagementsCitoyen, encadrement, sportCulture].join(' ');

  // MOTIVATION
  const lettreRaw = donneesVoeux.LettreDeMotivation || donneesVoeux.ProjetFormation || '';
  const lettre = stripHtml(lettreRaw);

  // FORMATION
  const filiereRaw = (donneesVoeux.FormationLibelle || candidat.filiereDemandee || '').toUpperCase();
  let filiere = '';
  if (filiereRaw.includes('ES') || filiereRaw.includes('ÉDUC') || filiereRaw.includes('EDUC')) filiere = 'ES';
  else if (filiereRaw.includes('EJE') || filiereRaw.includes('JEUNES ENFANTS')) filiere = 'EJE';
  else if (filiereRaw.includes('ASS') || filiereRaw.includes('ASSISTANT')) filiere = 'ASS';

  // Déterminer coloration
  const tout = (serieBac + ' ' + specialites.join(' ')).toLowerCase();
  const coloration = tout.includes('st2s') || tout.includes('sanitaire') || tout.includes('social') || tout.includes('sms') ? 'sociale/sanitaire'
    : tout.includes('médico') ? 'médico-sociale'
    : tout.includes('littéraire') || tout.includes('humanité') || tout.includes('lettres') ? 'littéraire'
    : tout.includes('ses') || tout.includes('sciences économiques') || tout.includes('sciences sociales') ? 'sciences humaines et sociales'
    : tout.includes('scientifique') || tout.includes('mathématique') ? 'scientifique' : 'autre';

  return {
    bac: { obtenu: bacObtenu, enCours, type: typeBac, serie: serieBac, specialites, anneeObtention: bac.AnneeObtention || null },
    notesBac: { francais, philosophie, histoireGeo, ses, st2s: st2sNotes, langues, moyenneGenerale, toutesNotes },
    scolarite: { aRedouble, aRupture, aEtudesSup, detailSup },
    activites: { experiencesPro, engagementsCitoyen, encadrement, sportCulture, texteComplet },
    motivation: { lettre, longueur: lettre.length },
    formation: { filiere },
    appreciations: { texte: texteAppreciations.trim(), disponible: texteAppreciations.trim().length > 10 },
    coloration,
    evolution: candidat.evolutionNotes || 'stable',
  };
}

function minerIndicateurTexte(texte, motsClesPositifs, motsClesNegatifs) {
  const positifsFound = motsClesPositifs.filter(k => texte.includes(k));
  const negatifsFound = motsClesNegatifs.filter(k => texte.includes(k));
  if (negatifsFound.length > 0 && negatifsFound.length >= positifsFound.length) return { signal: 'negatif', detail: negatifsFound.slice(0, 2).join(', ') };
  if (positifsFound.length > 0) return { signal: 'positif', detail: positifsFound.slice(0, 2).join(', ') };
  return { signal: 'absent', detail: '' };
}

function evaluerParcoursScolaireV2(candidat, dp) {
  const d = extraireDonneesCompletesCJS(candidat, dp);
  const moy = d.notesBac.moyenneGenerale;
  const appLC = d.appreciations.texte.toLowerCase();
  const lettreLC = d.motivation.lettre.toLowerCase();
  const texteMine = appLC + ' ' + lettreLC + ' ' + d.activites.texteComplet.toLowerCase();

  // Vérifier évaluabilité
  const aDesNotes = moy !== null;
  const aUnBac = d.bac.serie !== '' && d.bac.serie !== 'Inconnue';
  if (!aDesNotes && !aUnBac) {
    return { note: 0, commentaire: "Éléments scolaires non renseignés ou insuffisants dans le dossier Parcoursup (notes/bulletins/appréciations/parcours). L'item est inévaluable en l'état." };
  }

  // Appréciations signal
  const assiduite = minerIndicateurTexte(texteMine, ['assidu', 'ponctuel', 'présent', 'régulier'], ['absent', 'retard', 'absentéisme']);
  const serieux = minerIndicateurTexte(texteMine, ['sérieux', 'sérieuse', 'impliqué', 'impliquée', 'autonome', 'volontaire'], ['manque de travail', 'passif', 'insuffisant']);
  const participation = minerIndicateurTexte(texteMine, ['participation', 'participe', 'écoute', 'respect'], ['bavardage', 'perturbateur']);
  let appSignal = 0;
  if (assiduite.signal === 'positif') appSignal++;
  if (assiduite.signal === 'negatif') appSignal -= 2;
  if (serieux.signal === 'positif') appSignal++;
  if (serieux.signal === 'negatif') appSignal -= 2;
  if (participation.signal === 'positif') appSignal++;
  if (participation.signal === 'negatif') appSignal--;

  // Points forts/faibles
  const notes = d.notesBac.toutesNotes;
  const moyNotes = notes.length > 0 ? notes.reduce((s, n) => s + n.note, 0) / notes.length : 0;
  const pointsForts = notes.filter(n => n.note >= moyNotes + 2).map(n => `${n.matiere} (${n.note}/20)`);
  const pointsFaibles = notes.filter(n => n.note <= moyNotes - 2).map(n => `${n.matiere} (${n.note}/20)`);

  // Points forts TS
  const matieresTS = [d.notesBac.francais, d.notesBac.philosophie, d.notesBac.histoireGeo, d.notesBac.ses].filter(n => n !== null);
  const st2sMax = d.notesBac.st2s.length > 0 ? Math.max(...d.notesBac.st2s.map(n => n.note)) : null;
  if (st2sMax !== null) matieresTS.push(st2sMax);
  const hasMatieresTSFortes = matieresTS.filter(n => n >= 13).length >= 2;

  const evolution = d.evolution;

  // ── Profile Matching vers paliers ──
  let palier;
  if (moy === null) {
    palier = d.scolarite.aEtudesSup && appSignal >= 0 ? 1.5 : appSignal > 0 ? 1 : 0.5;
  } else if (moy >= 14 && hasMatieresTSFortes && (evolution === 'progression' || evolution === 'stable') && appSignal >= 0) {
    palier = 3;
  } else if ((moy >= 13 && pointsForts.length >= 1 && (evolution === 'progression' || evolution === 'stable')) || (moy >= 15 && evolution !== 'regression')) {
    palier = 2.5;
  } else if ((moy >= 11 && pointsForts.length >= 1 && appSignal >= 0) || (moy >= 12 && evolution !== 'regression' && appSignal >= 0)) {
    palier = 2;
  } else if (moy >= 10 && (pointsForts.length === 0 || (notes.length >= 3))) {
    palier = 1.5;
  } else if (moy >= 9) {
    palier = 1;
  } else {
    palier = 0.5;
  }

  // Construire description bac
  const bacParts = [];
  if (d.bac.enCours && d.bac.obtenu !== true) bacParts.push('(en cours)');
  if (d.bac.type !== 'non renseigné') bacParts.push(`Bac ${d.bac.type}`);
  else bacParts.push('type de bac non renseigné');
  if (d.bac.serie && d.bac.serie !== 'Inconnue' && d.bac.serie.toLowerCase() !== d.bac.type) bacParts.push(d.bac.serie);
  if (d.bac.specialites.length > 0) bacParts.push(`(${d.bac.specialites.join(', ')})`);
  const bacDesc = bacParts.join(' ');

  // Formater points forts
  const matieresClefs = [['français', d.notesBac.francais], ['philosophie', d.notesBac.philosophie],
    ['histoire-géo', d.notesBac.histoireGeo], ['SES', d.notesBac.ses], ['langues', d.notesBac.langues]];
  const pfStr = matieresClefs.filter(([, n]) => n !== null && n >= 12).map(([l, n]) => `${l} (${n}/20)`).join(', ');
  const fragilites = matieresClefs.filter(([, n]) => n !== null && n < 10).map(([l, n]) => `${l} (${n}/20)`).join(', ');
  const dynamique = evolution === 'progression' ? 'en amélioration' : evolution === 'regression' ? 'en baisse' : 'stable';
  const appDetail = [assiduite.signal !== 'absent' ? 'assiduité' : '', serieux.signal !== 'absent' ? 'sérieux' : '', participation.signal !== 'absent' ? 'participation' : ''].filter(Boolean).join('/');

  // Générer commentaire selon palier
  let commentaire;
  switch (palier) {
    case 3:
      commentaire = `Parcours : ${bacDesc}. Résultats très solides, notamment en ${pfStr || 'matières pertinentes (notes non détaillées)'}${moy ? ` (moyenne ${moy}/20)` : ''}, avec ${dynamique === 'en baisse' ? 'régularité' : dynamique}. Appréciations ${appDetail ? `très positives sur ${appDetail}` : 'très positives (ou non renseignées dans le dossier)'}. Compétences académiques transférables au travail social : très favorables.`;
      break;
    case 2.5:
      commentaire = `Parcours ${bacDesc}. Résultats bons à très bons${pfStr ? `, points forts en ${pfStr}` : ''}${moy ? ` (moyenne ${moy}/20)` : ''}, dynamique ${dynamique}. Appréciations ${appSignal >= 0 ? 'positives' : 'non renseignées dans le dossier'}. Compétences académiques : très favorables.`;
      break;
    case 2:
      commentaire = `Parcours ${bacDesc}. Niveau global satisfaisant${pfStr ? `, points forts en ${pfStr}` : ''}${moy ? ` (moyenne ${moy}/20)` : ''}. ${fragilites ? `Fragilités en ${fragilites} mais ` : ''}Dynamique ${dynamique}. Appréciations ${appSignal >= 0 ? (appSignal > 0 ? 'positives' : 'neutres') : 'non renseignées dans le dossier'}. Compétences académiques : favorables.`;
      break;
    case 1.5:
      commentaire = `Parcours ${bacDesc}. Résultats moyens/contrastés${moy ? ` (moyenne ${moy}/20)` : ''} ; pas de point fort clairement établi dans les matières clés disponibles. Appréciations ${appSignal >= 0 ? (appSignal > 0 ? 'neutres' : 'partagées') : 'non renseignées dans le dossier'} sur la régularité. Compétences académiques : mitigées, à consolider.`;
      break;
    case 1:
      commentaire = `Parcours ${bacDesc}. Résultats fragiles${fragilites ? `, notamment sur ${fragilites}` : ''}${moy ? ` (moyenne ${moy}/20)` : ''}, avec ${dynamique === 'en amélioration' ? 'une dynamique en amélioration cependant' : dynamique === 'en baisse' ? 'irrégularité/baisse' : 'peu de dynamique'}. Appréciations ${appSignal < 0 ? `signalant ${appDetail || 'manque de régularité/assiduité/méthode'}` : 'non renseignées dans le dossier'}. Compétences académiques : insuffisamment stabilisées.`;
      break;
    case 0.5:
      commentaire = `Résultats très fragiles et/ou très instables${moy ? ` (moyenne ${moy}/20)` : ''}, difficultés importantes sur les fondamentaux. Peu d'éléments rassurants sur la méthode ou la régularité. Compétences académiques : très fragiles en l'état.`;
      break;
    default:
      commentaire = "Éléments scolaires non renseignés ou insuffisants dans le dossier Parcoursup (notes/bulletins/appréciations/parcours). L'item est inévaluable en l'état.";
  }

  return { note: palier, commentaire };
}

function evaluerExperiencesV2(candidat, dp) {
  const d = typeof dp === 'object' && dp !== null ? extraireDonneesCompletesCJS(candidat, dp) : extraireDonneesCompletesCJS(candidat, {});
  const texte = (d.activites.texteComplet + ' ' + d.motivation.lettre).toLowerCase();

  if (texte.trim().length < 20) {
    return { note: 0, commentaire: "Aucun élément exploitable dans le dossier Parcoursup concernant les expériences/engagements (CV/lettre non renseignés sur ce volet). Item inévaluable en l'état." };
  }

  // Évaluer les 13 indicateurs
  const engKeywords = ['association', 'délégué', 'déléguée', 'collectif', 'conseil', 'comité', 'représentant', 'élu', 'citoyen'];
  const engFound = engKeywords.some(k => texte.includes(k));
  const engRegulier = engFound && (texte.includes('régulier') || texte.includes('depuis') || /\d+\s*(ans?|année)/.test(texte));
  const benevFound = ['bénévolat', 'bénévole', 'volontaire'].some(k => texte.includes(k));
  const benevRegulier = benevFound && (texte.includes('régulier') || texte.includes('chaque') || /\d+\s*(ans?|mois)/.test(texte));
  const scFound = texte.includes('service civique');
  const bafaFound = texte.includes('bafa');
  const animationFound = texte.includes('animateur') || texte.includes('animatrice') || texte.includes('animation');
  const bafaExperience = texte.includes('centre') || texte.includes('colo') || texte.includes('périscolaire');
  const emploiKw = ['emploi', 'job', 'stage', 'alternance', 'intérim', 'salarié', 'salariée', 'contrat', 'cdd', 'cdi'];
  const emploiFound = emploiKw.some(k => texte.includes(k));
  const contactPublicKw = ['accueil', 'accompagnement', 'soin', 'aide', 'éducation', 'médiation', 'vente', 'service', 'animation'];
  const contactPublic = emploiFound && contactPublicKw.some(k => texte.includes(k));
  const tsKw = ['travail social', 'éducateur', 'éducatrice', 'assistant social', 'assistante sociale', 'eje',
    'protection de l\'enfance', 'handicap', 'insertion', 'précarité', 'vulnérab', 'inclusion',
    'foyer', 'mecs', 'chrs', 'ehpad', 'ime', 'itep', 'esat', 'ase'];
  const tsFound = tsKw.some(k => texte.includes(k));
  const compKw = { 'écoute': 'écoute', 'communication': 'communication', 'empathie': 'empathie',
    'équipe': "travail d'équipe", 'discrétion': 'discrétion', 'adaptation': 'adaptation',
    'organisation': 'organisation', 'autonomie': 'autonomie', 'patience': 'patience', 'rigueur': 'rigueur' };
  const competences = [];
  for (const [kw, label] of Object.entries(compKw)) { if (texte.includes(kw)) competences.push(label); }
  const reculKw = ['j\'ai appris', 'cela m\'a', 'cette expérience', 'j\'ai compris', 'j\'ai réalisé', 'm\'a permis', 'j\'ai découvert'];
  const hasRecul = reculKw.some(k => texte.includes(k));
  const dureeMatch = texte.match(/(\d+)\s*(ans?|année|mois)/g);
  const engagementsLongs = (dureeMatch && dureeMatch.length >= 2) || texte.includes('depuis plusieurs');
  const hasMissions = texte.includes('mission') || texte.includes('tâche') || texte.includes('rôle');
  const hasDates = /\d{4}/.test(texte) || /\d+\s*(ans?|mois)/.test(texte);
  const hasPublic = texte.includes('public') || texte.includes('enfant') || texte.includes('personne');
  const precisionVal = [hasMissions, hasDates, hasPublic].filter(Boolean).length;

  const nbTypesEngagement = [engFound, benevFound, scFound, bafaFound || animationFound, emploiFound].filter(Boolean).length;
  const engDurable = engFound && engRegulier;
  const nbCompetences = competences.length;

  // Profile matching
  let palier;
  if ((engDurable || scFound || engagementsLongs) && tsFound && nbCompetences >= 3 && hasRecul) {
    palier = 3;
  } else if ((engDurable || scFound || engagementsLongs) && (tsFound || nbCompetences >= 3) && hasRecul) {
    palier = 2.5;
  } else if (nbTypesEngagement >= 3 && nbCompetences >= 2 && precisionVal >= 2) {
    palier = 2.5;
  } else if (nbTypesEngagement >= 2 && (nbCompetences >= 2 || bafaFound)) {
    palier = 2;
  } else if ((emploiFound && contactPublic) && nbCompetences >= 2) {
    palier = 2;
  } else if (bafaFound && engFound) {
    palier = 2;
  } else if (nbTypesEngagement >= 1 && (precisionVal <= 1 || nbCompetences <= 1)) {
    palier = 1.5;
  } else if (nbTypesEngagement >= 1 || d.activites.texteComplet.length > 50) {
    palier = 1;
  } else if (d.activites.texteComplet.length > 20 || d.motivation.lettre.length > 50) {
    palier = 0.5;
  } else {
    palier = 0;
  }

  // Construire type engagement
  const types = [];
  if (scFound) types.push('service civique');
  if (engFound) types.push('engagement associatif');
  if (benevFound) types.push('bénévolat');
  if (bafaFound || animationFound) types.push('BAFA/animation');
  if (emploiFound) types.push(contactPublic ? 'emploi au contact du public' : 'emploi');
  const typeEngagement = types.join(', ');

  // Missions
  const missionKw = ['accompagnement', 'animation', 'accueil', 'soutien', 'aide', 'encadrement', 'médiation'];
  const missions = missionKw.filter(k => texte.includes(k)).slice(0, 3);
  const missionsStr = missions.length > 0 ? missions.join(', ') : 'missions non détaillées';

  // Public TS
  const publics = [];
  if (texte.includes('enfant') || texte.includes('protection de l\'enfance')) publics.push('enfants');
  if (texte.includes('handicap') || texte.includes('ime')) publics.push('handicap');
  if (texte.includes('insertion') || texte.includes('précarité')) publics.push('insertion/précarité');
  if (texte.includes('personnes âgées') || texte.includes('ehpad')) publics.push('personnes âgées');
  const publicTS = publics.length > 0 ? publics.join(', ') : 'publics vulnérables';
  const compStr = competences.length > 0 ? competences.slice(0, 4).join(', ') : '';

  // Générer commentaire
  let commentaire;
  switch (palier) {
    case 3:
      commentaire = `Parcours marqué par ${typeEngagement || 'un engagement significatif'}${engagementsLongs ? ' sur une durée notable' : ''} avec rôle ${texte.includes('responsab') || texte.includes('encadre') ? 'incluant des responsabilités' : 'actif'}${tsFound ? ` auprès de ${publicTS}` : ''}. Compétences transférables identifiées : ${compStr || 'écoute, animation, équipe'}. Mise en mots des apprentissages ${hasRecul ? 'oui' : 'partiellement'}. Expériences : très favorables.`;
      break;
    case 2.5:
      commentaire = `Expérience ${typeEngagement || 'significative'} régulière / sur une durée significative, missions ${missionsStr} et contact public ${tsFound ? 'oui' : 'indirect'}. Compétences transférables bien identifiées${compStr ? ` (${compStr})` : ''}. Apprentissage formulé${hasRecul ? '' : ' partiellement'}. Potentiel : très favorable.`;
      break;
    case 2:
      commentaire = `Expériences ${typeEngagement || 'identifiées'} avec contact public ${contactPublic || tsFound ? 'oui' : 'non précisé'} et missions ${missionsStr}. Implication ${engagementsLongs ? 'régulière' : 'ponctuelle'} mais cohérente avec le projet. Compétences transférables : ${compStr || 'partiellement identifiées'}. Potentiel : favorable.`;
      break;
    case 1.5:
      commentaire = `Quelques éléments d'expériences (ex : ${typeEngagement || 'activité mentionnée'}), mais description limitée (missions/durée/public peu précisés). Compétences transférables ${nbCompetences > 0 ? 'identifiables partiellement' : 'partiellement identifiables'}. Parcours de vie : mitigé sur cet item.`;
      break;
    case 1:
      commentaire = `Expériences/engagements peu étayés dans le dossier (missions/durée/public non précisés) et compétences transférables peu identifiables. Item : faible en l'état.`;
      break;
    case 0.5:
      commentaire = `Très peu d'éléments exploitables sur les expériences/engagements (mentions trop vagues/ponctuelles). Compétences transférables non identifiables en l'état.`;
      break;
    default:
      commentaire = "Aucun élément exploitable dans le dossier Parcoursup concernant les expériences/engagements (CV/lettre non renseignés sur ce volet). Item inévaluable en l'état.";
  }

  return { note: palier, commentaire };
}

function evaluerMotivationV2(candidat, dp) {
  const d = typeof dp === 'object' && dp !== null ? extraireDonneesCompletesCJS(candidat, dp) : extraireDonneesCompletesCJS(candidat, {});
  const lettreLC = d.motivation.lettre.toLowerCase();
  const filiere = d.formation.filiere || candidat.filiereDemandee || '';

  if (d.motivation.longueur < 30) {
    return { note: 0, commentaire: "Lettre/projet de formation motivé non renseigné ou inexploitable dans le dossier Parcoursup. Item inévaluable en l'état." };
  }

  // Évaluer les 13 indicateurs
  const metiersES = ['éducateur spécialisé', 'éducatrice spécialisée', 'éducateur'];
  const metiersEJE = ['éducateur de jeunes enfants', 'éducatrice de jeunes enfants', 'eje', 'petite enfance'];
  const metiersASS = ['assistant social', 'assistante sociale', 'assistant de service social'];
  const metiersTS = [...metiersES, ...metiersEJE, ...metiersASS, 'travailleur social', 'travailleuse sociale'];
  const metierMentioned = metiersTS.find(m => lettreLC.includes(m));
  const secteursTS = ['protection de l\'enfance', 'handicap', 'insertion', 'précarité', 'santé mentale',
    'addiction', 'personnes âgées', 'exclusion', 'migrants', 'justice', 'prévention', 'médico-social'];
  const secteurMentioned = secteursTS.find(s => lettreLC.includes(s));

  const projetClair = !!metierMentioned && !!secteurMentioned;
  const projetPartiel = !!metierMentioned || !!secteurMentioned || lettreLC.includes('social') || lettreLC.includes('formation');

  // Cohérence filière
  const filiereUp = filiere.toUpperCase();
  let coherenceFiliere = false;
  let confusions = false;
  if (filiereUp === 'ES' && metiersES.some(m => lettreLC.includes(m))) coherenceFiliere = true;
  else if (filiereUp === 'EJE' && metiersEJE.some(m => lettreLC.includes(m))) coherenceFiliere = true;
  else if (filiereUp === 'ASS' && metiersASS.some(m => lettreLC.includes(m))) coherenceFiliere = true;
  else if (lettreLC.includes('social') || lettreLC.includes('accompagn')) coherenceFiliere = true;
  if (filiereUp === 'ES' && metiersEJE.some(m => lettreLC.includes(m)) && !metiersES.some(m => lettreLC.includes(m))) confusions = true;
  if (filiereUp === 'EJE' && metiersES.some(m => lettreLC.includes(m)) && !metiersEJE.some(m => lettreLC.includes(m))) confusions = true;

  // Appuis expériences
  const appuisKw = ['stage', 'lors de', 'pendant', 'j\'ai eu l\'occasion', 'expérience', 'bénévolat', 'travaillé', 'rencontré', 'observé', 'j\'ai pu'];
  const appuisCount = appuisKw.filter(k => lettreLC.includes(k)).length;
  const estEtaye = appuisCount >= 2;

  // Compréhension exigences
  const exigencesKw = ['accompagnement', 'travail d\'équipe', 'écrits', 'éthique', 'secret professionnel',
    'non-jugement', 'déontologie', 'cadre', 'limites', 'distance', 'posture'];
  const exigencesCount = exigencesKw.filter(k => lettreLC.includes(k)).length;
  const bonneComprehension = exigencesCount >= 3;
  const comprehensionPartielle = exigencesCount >= 1;

  // Personnalisation
  const phrasesGeneriques = ['j\'aime aider les autres', 'depuis toujours', 'c\'est ma vocation', 'je souhaite aider les personnes', 'j\'ai toujours voulu'];
  const estGenerique = phrasesGeneriques.filter(p => lettreLC.includes(p)).length >= 2;
  const hasExemples = lettreLC.includes('par exemple') || lettreLC.includes('notamment') || lettreLC.includes('j\'ai') || lettreLC.includes('lors de') || /\d{4}/.test(lettreLC);
  const estPersonnalise = hasExemples && !estGenerique;

  // Qualité expression
  const phrases = d.motivation.lettre.split(/[.!?]+/).filter(p => p.trim().length > 10);
  const aConnecteurs = ['cependant', 'en effet', 'de plus', 'par ailleurs', 'ainsi', 'c\'est pourquoi'].some(c => lettreLC.includes(c));
  const bonneQualite = phrases.length >= 3 && aConnecteurs;

  // Réflexivité
  const analyseKw = ['j\'ai compris', 'j\'ai réalisé', 'prise de conscience', 'j\'ai appris', 'questionné', 'réfléchi', 'remise en question'];
  const reflexivite = analyseKw.filter(k => lettreLC.includes(k)).length >= 2;

  // Sauveur
  const sauveurKw = ['je veux sauver', 'sauver les gens', 'aider les autres depuis toujours', 'c\'est ma vocation', 'ma mission de vie'];
  const postureRealisteKw = ['limites', 'cadre', 'distance professionnelle', 'non-jugement', 'posture', 'secret professionnel'];
  const sauveur = sauveurKw.some(k => lettreLC.includes(k)) && !postureRealisteKw.some(k => lettreLC.includes(k));

  // Profile matching
  let palier;
  if (projetClair && estEtaye && bonneComprehension && estPersonnalise && (bonneQualite || reflexivite)) {
    palier = 2;
  } else if ((projetClair || projetPartiel) && (estEtaye || comprehensionPartielle) && !estGenerique) {
    palier = 1.5;
  } else if (projetPartiel || d.motivation.longueur > 200) {
    palier = 1;
  } else if (confusions || (sauveur && !estEtaye) || (!projetClair && !projetPartiel && d.motivation.longueur > 50)) {
    palier = 0.5;
  } else {
    palier = 0;
  }

  // Extraire détails pour template
  const secteur = secteurMentioned || '';
  const exigencesDetail = exigencesKw.filter(k => lettreLC.includes(k)).slice(0, 3).join('/');
  const exempleAppui = lettreLC.includes('stage') ? 'un stage' : lettreLC.includes('bénévolat') ? 'du bénévolat'
    : lettreLC.includes('service civique') ? 'un service civique' : lettreLC.includes('emploi') ? 'une expérience professionnelle' : '';
  const raisonPrincipale = lettreLC.includes('reconversion') ? 'liées à une reconversion'
    : lettreLC.includes('expérience') ? 'liées à des expériences concrètes' : '';

  // Générer commentaire
  let commentaire;
  switch (palier) {
    case 2:
      commentaire = `Projet clairement orienté vers ${filiere || 'le travail social'}${secteur ? ` avec cible ${secteur}` : ''}. Motivation étayée par ${exempleAppui || 'expériences/observations'} et compréhension des exigences (ex : ${exigencesDetail || "travail d'équipe/écrits/posture"}). Argumentation structurée et personnalisée. Motivation : très favorable.`;
      break;
    case 1.5:
      commentaire = `Projet cohérent avec ${filiere || 'la filière demandée'}, motivations ${raisonPrincipale || 'exprimées'} appuyées par ${exempleAppui || 'un exemple'}. Quelques éléments restent généraux (secteur/public). Compréhension des exigences présente mais à approfondir. Motivation : favorable.`;
      break;
    case 1:
      commentaire = `Motivation exprimée mais projet peu précisé (missions/secteur/public). Argumentation principalement déclarative, peu d'éléments concrets. Compréhension des exigences partielle. Motivation : mitigée sur cet item.`;
      break;
    case 0.5:
      commentaire = `Projet peu cohérent avec ${filiere || 'la filière demandée'} et/ou confusions importantes. Motivation peu étayée, manque d'éléments concrets et de recul. Motivation : faible en l'état.`;
      break;
    default:
      commentaire = "Lettre/projet de formation motivé non renseigné ou inexploitable dans le dossier Parcoursup. Item inévaluable en l'état.";
  }

  return { note: palier, commentaire };
}

function analyserCandidatV2(candidat, candidatBrut) {
  const dp = candidatBrut;

  // ── Critère 1 : Parcours scolaire /3 ──
  const parcours = evaluerParcoursScolaireV2(candidat, dp);

  // ── Critère 2 : Expériences /3 ──
  const experiences = evaluerExperiencesV2(candidat, dp);

  // ── Critère 3 : Motivation /2 ──
  const motivation = evaluerMotivationV2(candidat, dp);

  const noteTotal = arrondirPalier(parcours.note + experiences.note + motivation.note, 8);

  // Données extraites pour alertes
  const d = extraireDonneesCompletesCJS(candidat, dp);

  // Alertes
  const alertes = [];
  if (noteTotal <= 3) alertes.push('Score IA faible — profil nécessite évaluation approfondie');
  if (parcours.note <= 1) alertes.push('Parcours scolaire fragile ou peu documenté');
  if (experiences.note <= 1) alertes.push('Expériences peu étayées dans le dossier');
  if (motivation.note <= 0.5) alertes.push('Motivation et projet professionnel insuffisamment documentés');
  if (d.notesBac.moyenneGenerale !== null && d.notesBac.moyenneGenerale < 10) alertes.push('Moyenne générale faible');
  if (d.scolarite.aRupture) alertes.push('Rupture de parcours identifiée');

  // Éléments valorisants
  const elementsValorisants = [];
  if (parcours.note >= 2.5) elementsValorisants.push('Excellence académique');
  if (experiences.note >= 2.5) elementsValorisants.push('Expériences très riches et pertinentes pour le TS');
  if (motivation.note >= 1.5) elementsValorisants.push('Projet professionnel solide et cohérent');
  if (parcours.note >= 2 && experiences.note >= 2 && motivation.note >= 1.5) elementsValorisants.push('Profil équilibré sur les 3 critères');
  if (d.scolarite.aEtudesSup) elementsValorisants.push('Parcours post-bac identifié');

  const justificationGlobale = [
    `Parcours scolaire (${parcours.note}/3) : ${parcours.commentaire}`,
    `Expériences (${experiences.note}/3) : ${experiences.commentaire}`,
    `Motivation (${motivation.note}/2) : ${motivation.commentaire}`,
    '',
    `Total : ${noteTotal}/8 — ${noteTotal >= 6.5 ? 'Profil très favorable pour la formation en travail social.' : noteTotal >= 5 ? 'Profil favorable avec un bon potentiel pour la formation.' : noteTotal >= 3.5 ? "Profil mitigé nécessitant une attention particulière lors de l'oral." : "Profil nécessitant une évaluation approfondie lors de l'oral."}`
  ].join('\n');

  return {
    parcoursScolaire: parcours,
    experiences,
    motivation,
    noteTotal,
    justificationGlobale,
    alertes,
    elementsValorisants,
  };
}

function arrondirPalier(score, max) {
  const clamped = Math.max(0, Math.min(max, score));
  return Math.round(clamped * 2) / 2;
}

// Fonctions helper (conservées)
function calculerMoyennesBac(notesBac) {
  // notesBac = tableau [{EpreuveCode, EpreuveLibelle, NoteEpreuve: "12,0"}, ...]
  // NoteEpreuve est une string avec virgule française, ou absente
  if (!Array.isArray(notesBac) || notesBac.length === 0) {
    return { generale: null, francais: null, histoireGeo: null, philosophie: null, maths: null };
  }

  const parseNote = (str) => {
    if (!str) return null;
    const n = parseFloat(String(str).replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  // Extraire les notes par matière (chercher par mots-clés dans EpreuveLibelle)
  const trouverNote = (motsCles) => {
    const match = notesBac.find(n =>
      n.NoteEpreuve && motsCles.some(mc => (n.EpreuveLibelle || '').toLowerCase().includes(mc.toLowerCase()))
    );
    return match ? parseNote(match.NoteEpreuve) : null;
  };

  // Français : prendre la meilleure note entre écrit et oral
  const francaisEcrit = trouverNote(['Français écrit']);
  const francaisOral = trouverNote(['Français oral']);
  const francais = (francaisEcrit !== null && francaisOral !== null)
    ? Math.round(((francaisEcrit + francaisOral) / 2) * 10) / 10
    : francaisEcrit || francaisOral;

  const histoireGeo = trouverNote(['Histoire', 'Géographie']);
  const philosophie = trouverNote(['Philosophie']);
  const maths = trouverNote(['Mathématiques', 'mathématiques']);

  // Calculer la moyenne générale à partir de toutes les notes disponibles
  const toutesLesNotes = notesBac
    .map(n => parseNote(n.NoteEpreuve))
    .filter(n => n !== null);

  const generale = toutesLesNotes.length > 0
    ? Math.round((toutesLesNotes.reduce((s, n) => s + n, 0) / toutesLesNotes.length) * 10) / 10
    : null;

  return { generale, francais, histoireGeo, philosophie, maths };
}

function getEtablissementOrigine(scolarite) {
  if (!scolarite || scolarite.length === 0) return 'Non renseigné';
  return scolarite[0].NomEtablissementOrigine || 'Non renseigné';
}

function analyserEvolution(scolarite) {
  if (!scolarite || scolarite.length < 2) return 'stable';
  return 'stable'; // Simplifié
}

function analyserCandidatSimple(candidat, notesBac) {
  const moyenne = candidat.moyenneGenerale || 0;

  // Cotation basique
  let cotation = 0;
  if (moyenne >= 14) cotation = 7;
  else if (moyenne >= 12) cotation = 6;
  else if (moyenne >= 10) cotation = 5;
  else cotation = 4;

  // Synthèse
  let synthese = `Candidat avec une moyenne générale de ${moyenne.toFixed(1)}/20. `;

  if (moyenne >= 12) {
    synthese += 'Résultats scolaires satisfaisants. ';
  } else {
    synthese += 'Résultats moyens. ';
  }

  // Mots-clés
  const positifs = [];
  const negatifs = [];
  const alertes = [];
  const valorisants = [];

  if (moyenne >= 14) positifs.push('excellent niveau');
  else if (moyenne >= 12) positifs.push('bon niveau');
  else if (moyenne < 10) {
    negatifs.push('niveau faible');
    alertes.push('Moyenne générale inférieure à 10/20');
  }

  return {
    synthese,
    positifs,
    negatifs,
    alertes,
    valorisants,
    cotation,
    justification: `Cotation basée sur la moyenne générale de ${moyenne.toFixed(1)}/20`
  };
}

// ── Servir le frontend en production ──
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback SPA : toute route non-API renvoie index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur API IRTS démarré sur le port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend servi depuis: ${distPath}`);
});