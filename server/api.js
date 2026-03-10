import express from 'express';
import cors from 'cors';
import { DatabaseService } from '../src/services/databaseService.js';
import { DataLoaderService } from '../src/services/dataLoaderService.js';
import { ImportService } from '../src/services/importService.js';
import { ExportService } from '../src/services/exportService.js';
import { AnalyseurCandidatService } from '../src/services/analyseurCandidat.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes API

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Récupérer tous les candidats
app.get('/api/candidats', async (req, res) => {
  try {
    const candidats = await DataLoaderService.chargerCandidats();
    res.json(candidats);
  } catch (error) {
    console.error('❌ Erreur API /candidats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des candidats' });
  }
});

// Récupérer un candidat spécifique
app.get('/api/candidats/:id', async (req, res) => {
  try {
    const candidat = await DataLoaderService.chargerCandidat(req.params.id);
    if (!candidat) {
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }
    res.json(candidat);
  } catch (error) {
    console.error(`❌ Erreur API /candidats/${req.params.id}:`, error);
    res.status(500).json({ error: 'Erreur lors de la récupération du candidat' });
  }
});

// Importer des candidats
app.post('/api/import', async (req, res) => {
  try {
    const { data } = req.body;
    console.log('📥 Import API - Taille des données:', JSON.stringify(data).length, 'caractères');
    
    const candidats = await ImportService.importerDonneesParcoursup(data);
    
    console.log(`✅ Import API terminé - ${candidats.length} candidats importés`);
    res.json({ 
      success: true, 
      count: candidats.length,
      candidats: candidats 
    });
    
  } catch (error) {
    console.error('❌ Erreur API /import:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Erreur lors de l\'import' 
    });
  }
});

// Valider un candidat
app.post('/api/candidats/:id/valider', async (req, res) => {
  try {
    const { statut, cotationFinale, commentaire, validateurId, validateurNom } = req.body;
    
    await DatabaseService.sauvegarderValidation(req.params.id, {
      statut,
      cotationFinale,
      commentaire,
      validateurId,
      validateurNom
    });
    
    res.json({ success: true, message: 'Validation enregistrée' });
  } catch (error) {
    console.error(`❌ Erreur API /candidats/${req.params.id}/valider:`, error);
    res.status(500).json({ error: 'Erreur lors de la validation' });
  }
});

// Réanalyser un candidat
app.post('/api/candidats/:id/reanalyser', async (req, res) => {
  try {
    const candidat = await DataLoaderService.chargerCandidat(req.params.id);
    if (!candidat) {
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }
    
    // Réanalyser avec l'IA
    const nouvelleAnalyse = AnalyseurCandidatService.analyserCandidat(candidat);
    
    // Sauvegarder la nouvelle analyse
    await DatabaseService.sauvegarderAnalyseIA(req.params.id, nouvelleAnalyse);
    
    // Récupérer le candidat mis à jour
    const candidatMisAJour = await DataLoaderService.chargerCandidat(req.params.id);
    
    res.json({ 
      success: true, 
      candidat: candidatMisAJour,
      analyse: nouvelleAnalyse 
    });
  } catch (error) {
    console.error(`❌ Erreur API /candidats/${req.params.id}/reanalyser:`, error);
    res.status(500).json({ error: 'Erreur lors de la réanalyse' });
  }
});

// Export Excel
app.post('/api/export', async (req, res) => {
  try {
    const candidats = await DataLoaderService.chargerCandidats();
    const { filename = `resultats-irts-${new Date().toISOString().split('T')[0]}.xlsx` } = req.body;
    
    const buffer = ExportService.genererExcelBuffer(candidats);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Erreur API /export:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur API IRTS démarré sur le port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;