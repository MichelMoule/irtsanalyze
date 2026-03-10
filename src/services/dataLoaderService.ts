import { api } from './api';
import { mockCandidats } from '@/data/mockData';
import { Candidat } from '@/types';

/**
 * Service de chargement des données depuis l'API (avec fallback sur données mockées)
 */
export class DataLoaderService {

  /**
   * Charge tous les candidats depuis l'API (ou données mockées en fallback)
   */
  static async chargerCandidats(): Promise<Candidat[]> {
    try {
      console.log('📊 Chargement des candidats depuis l\'API...');
      const candidats = await api.getCandidats();
      console.log(`✅ ${candidats.length} candidats chargés depuis l'API`);
      return candidats;
    } catch (error) {
      console.warn('⚠️ API non disponible, utilisation des données mockées', error);
      console.log(`✅ ${mockCandidats.length} candidats chargés depuis les données mockées`);
      return mockCandidats;
    }
  }

  /**
   * Charge un candidat spécifique par son ID
   */
  static async chargerCandidat(id: string): Promise<Candidat | null> {
    try {
      console.log(`📋 Chargement du candidat ${id} depuis l\'API...`);
      const candidat = await api.getCandidat(id);
      if (candidat) {
        console.log(`✅ Candidat ${candidat.nom} ${candidat.prenom} chargé`);
      } else {
        console.log(`❌ Candidat ${id} non trouvé`);
      }
      return candidat;
    } catch (error) {
      console.warn(`⚠️ API non disponible, recherche dans les données mockées`);
      const candidat = mockCandidats.find(c => c.id === id) || null;
      if (candidat) {
        console.log(`✅ Candidat ${candidat.nom} ${candidat.prenom} chargé depuis les données mockées`);
      }
      return candidat;
    }
  }

  /**
   * Vérifie si des données sont disponibles (API ou mockées)
   */
  static async hasData(): Promise<boolean> {
    try {
      const candidats = await api.getCandidats();
      return candidats.length > 0;
    } catch (error) {
      console.warn('⚠️ API non disponible, utilisation des données mockées');
      return mockCandidats.length > 0;
    }
  }
}