import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { analyzeCandidat, parseParcoursupJSON } from './services/analyzer.js';

const app = express();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get or create default campagne
app.get('/api/campagne', async (req, res) => {
  try {
    let campagne = await prisma.campagne.findFirst({
      where: { statut: 'en_cours' },
      orderBy: { dateCreation: 'desc' },
    });

    if (!campagne) {
      campagne = await prisma.campagne.create({
        data: {
          nom: 'Parcoursup 2025',
          statut: 'en_cours',
        },
      });
    }

    res.json(campagne);
  } catch (error) {
    console.error('Error fetching campagne:', error);
    res.status(500).json({ error: 'Failed to fetch campagne' });
  }
});

// Import candidats from JSON
app.post('/api/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const jsonData = JSON.parse(fileContent);

    // Get or create campagne
    let campagne = await prisma.campagne.findFirst({
      where: { statut: 'en_cours' },
    });

    if (!campagne) {
      campagne = await prisma.campagne.create({
        data: {
          nom: 'Parcoursup 2025',
          statut: 'en_cours',
        },
      });
    }

    // Parse JSON and extract candidats
    const candidatsData = parseParcoursupJSON(jsonData);

    res.json({
      success: true,
      campagneId: campagne.id,
      count: candidatsData.length,
      message: 'Import started',
    });

    // Process candidats asynchronously
    processImport(campagne.id, candidatsData);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import file' });
  }
});

// Background processing function
async function processImport(campagneId: string, candidatsData: any[]) {
  let processed = 0;
  let errors = 0;

  for (const data of candidatsData) {
    try {
      // Check if candidat already exists
      const existing = await prisma.candidat.findUnique({
        where: { numeroDossier: data.numeroDossier },
      });

      if (existing) {
        console.log(`Candidat ${data.numeroDossier} already exists, skipping`);
        continue;
      }

      // Update status to analyzing
      const candidat = await prisma.candidat.create({
        data: {
          campagneId,
          numeroDossier: data.numeroDossier,
          nom: data.nom,
          prenom: data.prenom,
          dateNaissance: data.dateNaissance,
          serieBac: data.serieBac,
          etablissementOrigine: data.etablissement,
          moyenneGenerale: data.moyenneGenerale,
          moyenneFrancais: data.moyenneFrancais,
          moyenneHistoireGeo: data.moyenneHistoireGeo,
          moyennePhilosophie: data.moyennePhilosophie,
          moyenneMaths: data.moyenneMaths,
          evolutionNotes: data.evolution || 'stable',
          syntheseAppreciations: '',
          motsClesPositifs: '[]',
          motsClesNegatifs: '[]',
          alertes: '[]',
          elementsValorisants: '[]',
          cotationIAProposee: 0,
          statut: 'en_analyse_ia',
        },
      });

      // Analyze candidat
      const analysis = await analyzeCandidat(data);

      // Update with analysis
      await prisma.candidat.update({
        where: { id: candidat.id },
        data: {
          syntheseAppreciations: analysis.synthese,
          motsClesPositifs: JSON.stringify(analysis.motsClesPositifs),
          motsClesNegatifs: JSON.stringify(analysis.motsClesNegatifs),
          alertes: JSON.stringify(analysis.alertes),
          elementsValorisants: JSON.stringify(analysis.elementsValorisants),
          cotationIAProposee: analysis.cotation,
          statut: 'analyse',
        },
      });

      processed++;
    } catch (error) {
      console.error('Error processing candidat:', error);
      errors++;
    }
  }

  console.log(`Import complete: ${processed} processed, ${errors} errors`);
}

// Get import progress
app.get('/api/import/progress/:campagneId', async (req, res) => {
  try {
    const { campagneId } = req.params;

    const stats = await prisma.candidat.groupBy({
      by: ['statut'],
      where: { campagneId },
      _count: true,
    });

    const total = await prisma.candidat.count({
      where: { campagneId },
    });

    const analyzed = stats
      .filter((s) => s.statut === 'analyse' || s.statut === 'valide')
      .reduce((sum, s) => sum + s._count, 0);

    res.json({
      total,
      analyzed,
      percentage: total > 0 ? Math.round((analyzed / total) * 100) : 0,
    });
  } catch (error) {
    console.error('Progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Get all candidats
app.get('/api/candidats', async (req, res) => {
  try {
    const campagne = await prisma.campagne.findFirst({
      where: { statut: 'en_cours' },
    });

    if (!campagne) {
      return res.json([]);
    }

    const candidats = await prisma.candidat.findMany({
      where: { campagneId: campagne.id },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON strings back to arrays
    const formatted = candidats.map((c) => ({
      ...c,
      motsClesPositifs: JSON.parse(c.motsClesPositifs),
      motsClesNegatifs: JSON.parse(c.motsClesNegatifs),
      alertes: JSON.parse(c.alertes),
      elementsValorisants: JSON.parse(c.elementsValorisants),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching candidats:', error);
    res.status(500).json({ error: 'Failed to fetch candidats' });
  }
});

// Get candidat by ID
app.get('/api/candidats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const candidat = await prisma.candidat.findUnique({
      where: { id },
    });

    if (!candidat) {
      return res.status(404).json({ error: 'Candidat not found' });
    }

    const formatted = {
      ...candidat,
      motsClesPositifs: JSON.parse(candidat.motsClesPositifs),
      motsClesNegatifs: JSON.parse(candidat.motsClesNegatifs),
      alertes: JSON.parse(candidat.alertes),
      elementsValorisants: JSON.parse(candidat.elementsValorisants),
    };

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching candidat:', error);
    res.status(500).json({ error: 'Failed to fetch candidat' });
  }
});

// Update candidat
app.patch('/api/candidats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cotationFinale, commentaireEvaluateur } = req.body;

    const candidat = await prisma.candidat.update({
      where: { id },
      data: {
        cotationFinale,
        commentaireEvaluateur,
        updatedAt: new Date(),
      },
    });

    const formatted = {
      ...candidat,
      motsClesPositifs: JSON.parse(candidat.motsClesPositifs),
      motsClesNegatifs: JSON.parse(candidat.motsClesNegatifs),
      alertes: JSON.parse(candidat.alertes),
      elementsValorisants: JSON.parse(candidat.elementsValorisants),
    };

    res.json(formatted);
  } catch (error) {
    console.error('Error updating candidat:', error);
    res.status(500).json({ error: 'Failed to update candidat' });
  }
});

// Validate candidat
app.post('/api/candidats/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const { cotationFinale, commentaireEvaluateur, validateurNom } = req.body;

    const candidat = await prisma.candidat.update({
      where: { id },
      data: {
        cotationFinale,
        commentaireEvaluateur,
        statut: 'valide',
        validateurNom,
        dateValidation: new Date(),
        updatedAt: new Date(),
      },
    });

    const formatted = {
      ...candidat,
      motsClesPositifs: JSON.parse(candidat.motsClesPositifs),
      motsClesNegatifs: JSON.parse(candidat.motsClesNegatifs),
      alertes: JSON.parse(candidat.alertes),
      elementsValorisants: JSON.parse(candidat.elementsValorisants),
    };

    res.json(formatted);
  } catch (error) {
    console.error('Error validating candidat:', error);
    res.status(500).json({ error: 'Failed to validate candidat' });
  }
});

// Delete all candidats (keeps campagnes)
app.delete('/api/candidats', async (req, res) => {
  try {
    const count = await prisma.candidat.count();
    await prisma.candidat.deleteMany();
    res.json({ success: true, deleted: count, message: `${count} candidat(s) supprimé(s)` });
  } catch (error) {
    console.error('Error deleting candidats:', error);
    res.status(500).json({ error: 'Failed to delete candidats' });
  }
});

// Delete specific candidats by IDs
app.post('/api/candidats/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }
    const result = await prisma.candidat.deleteMany({
      where: { id: { in: ids } },
    });
    res.json({ success: true, deleted: result.count, message: `${result.count} candidat(s) supprimé(s)` });
  } catch (error) {
    console.error('Error deleting candidats:', error);
    res.status(500).json({ error: 'Failed to delete candidats' });
  }
});

// Reset database (development only)
app.delete('/api/reset', async (req, res) => {
  try {
    await prisma.candidat.deleteMany();
    await prisma.campagne.deleteMany();
    res.json({ success: true, message: 'Database reset successfully' });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const campagne = await prisma.campagne.findFirst({
      where: { statut: 'en_cours' },
    });

    if (!campagne) {
      return res.json({
        importe: 0,
        en_analyse_ia: 0,
        analyse: 0,
        en_relecture: 0,
        valide: 0,
        erreur: 0,
      });
    }

    const stats = await prisma.candidat.groupBy({
      by: ['statut'],
      where: { campagneId: campagne.id },
      _count: true,
    });

    const result: any = {
      importe: 0,
      en_analyse_ia: 0,
      analyse: 0,
      en_relecture: 0,
      valide: 0,
      erreur: 0,
    };

    stats.forEach((s) => {
      result[s.statut] = s._count;
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
