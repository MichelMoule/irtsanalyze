import type { Candidat, Campagne, OralAdmission, StatutStats } from '@/types';

const API_URL = 'http://localhost:3003/api';

export const api = {
  // Health check
  async healthCheck() {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },

  // Campagnes
  async getCampagnes(): Promise<Campagne[]> {
    const response = await fetch(`${API_URL}/campagnes`);
    if (!response.ok) throw new Error('Failed to fetch campagnes');
    return response.json();
  },

  async createCampagne(data: {
    annee: number;
    libelle: string;
    description?: string;
    dateDebut?: string;
    dateFin?: string;
  }): Promise<Campagne> {
    const response = await fetch(`${API_URL}/campagnes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create campagne');
    return response.json();
  },

  async updateCampagne(id: string, data: any): Promise<Campagne> {
    const response = await fetch(`${API_URL}/campagnes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update campagne');
    return response.json();
  },

  // Import
  async importFile(file: File): Promise<{ success: boolean; campagneId: string; count: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import file');
    }

    return response.json();
  },

  async importCandidats(candidatsData: any[]): Promise<{ success: boolean; imported: number; skipped: number; errors: number; total: number; message: string }> {
    const response = await fetch(`${API_URL}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidatsData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import candidats');
    }

    return response.json();
  },

  async getImportProgress(campagneId: string): Promise<{ total: number; analyzed: number; percentage: number }> {
    const response = await fetch(`${API_URL}/import/progress/${campagneId}`);
    if (!response.ok) throw new Error('Failed to get progress');
    return response.json();
  },

  // Candidats
  async getCandidats(): Promise<Candidat[]> {
    const response = await fetch(`${API_URL}/candidats`);
    if (!response.ok) throw new Error('Failed to fetch candidats');
    return response.json();
  },

  async getCandidat(id: string): Promise<Candidat> {
    const response = await fetch(`${API_URL}/candidats/${id}`);
    if (!response.ok) throw new Error('Failed to fetch candidat');
    return response.json();
  },

  async updateCandidat(
    id: string,
    data: { cotationFinale?: number; commentaireEvaluateur?: string }
  ): Promise<Candidat> {
    const response = await fetch(`${API_URL}/candidats/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update candidat');
    return response.json();
  },

  async validateCandidat(
    id: string,
    data: {
      cotationFinale: number;
      commentaireEvaluateur: string;
      validateurNom: string;
    }
  ): Promise<Candidat> {
    const response = await fetch(`${API_URL}/candidats/${id}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to validate candidat');
    return response.json();
  },

  // Stats
  async getStats(): Promise<StatutStats> {
    const response = await fetch(`${API_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // Commentaires
  async getCommentaires(candidatId: string): Promise<any[]> {
    const response = await fetch(`${API_URL}/candidats/${candidatId}/commentaires`);
    if (!response.ok) throw new Error('Failed to fetch commentaires');
    return response.json();
  },

  async addCommentaire(candidatId: string, data: {
    contenu: string;
    type?: string;
    auteurNom?: string;
  }): Promise<any> {
    const response = await fetch(`${API_URL}/candidats/${candidatId}/commentaires`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add commentaire');
    return response.json();
  },

  async updateCommentaire(commentaireId: string, contenu: string): Promise<any> {
    const response = await fetch(`${API_URL}/commentaires/${commentaireId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu }),
    });
    if (!response.ok) throw new Error('Failed to update commentaire');
    return response.json();
  },

  async deleteCommentaire(commentaireId: string): Promise<void> {
    const response = await fetch(`${API_URL}/commentaires/${commentaireId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete commentaire');
  },

  // Oral d'admission
  async getOralAdmission(candidatId: string): Promise<OralAdmission | null> {
    const response = await fetch(`${API_URL}/candidats/${candidatId}/oral`);
    if (!response.ok) throw new Error('Failed to fetch oral admission');
    return response.json();
  },

  async saveOralAdmission(candidatId: string, data: Omit<OralAdmission, 'id' | 'candidatId'>): Promise<OralAdmission> {
    const response = await fetch(`${API_URL}/candidats/${candidatId}/oral`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to save oral admission');
    return response.json();
  },

  // Historique des statuts
  async getHistoriqueStatuts(candidatId: string): Promise<any[]> {
    const response = await fetch(`${API_URL}/candidats/${candidatId}/historique`);
    if (!response.ok) throw new Error('Failed to fetch historique');
    return response.json();
  },

  async addHistoriqueStatut(candidatId: string, data: {
    ancienStatut?: string;
    nouveauStatut: string;
    motif?: string;
    auteurNom?: string;
  }): Promise<any> {
    const response = await fetch(`${API_URL}/candidats/${candidatId}/historique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add historique');
    return response.json();
  },
};
