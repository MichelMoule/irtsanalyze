import type { Candidat, Campagne, OralAdmission, StatutStats, BrouillonEvaluation, EvaluateurAssigne, EntreeJournal } from '@/types';
import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.DEV ? 'http://localhost:3003/api' : '/api';

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  // Add Content-Type for JSON if body is a string (not FormData)
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  return fetch(url, { ...options, headers });
}

export const api = {
  // Health check
  async healthCheck() {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },

  // Campagnes
  async getCampagnes(): Promise<Campagne[]> {
    const response = await authFetch(`${API_URL}/campagnes`);
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
    const response = await authFetch(`${API_URL}/campagnes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create campagne');
    return response.json();
  },

  async updateCampagne(id: string, data: any): Promise<Campagne> {
    const response = await authFetch(`${API_URL}/campagnes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update campagne');
    return response.json();
  },

  // Import
  async importFile(file: File): Promise<{ success: boolean; campagneId: string; count: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await authFetch(`${API_URL}/import`, {
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
    const response = await authFetch(`${API_URL}/import`, {
      method: 'POST',
      body: JSON.stringify({ candidatsData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import candidats');
    }

    return response.json();
  },

  async getImportProgress(campagneId: string): Promise<{ total: number; analyzed: number; percentage: number }> {
    const response = await authFetch(`${API_URL}/import/progress/${campagneId}`);
    if (!response.ok) throw new Error('Failed to get progress');
    return response.json();
  },

  // Candidats
  async getCandidats(): Promise<Candidat[]> {
    const response = await authFetch(`${API_URL}/candidats`);
    if (!response.ok) throw new Error('Failed to fetch candidats');
    return response.json();
  },

  async getCandidat(id: string): Promise<Candidat> {
    const response = await authFetch(`${API_URL}/candidats/${id}`);
    if (!response.ok) throw new Error('Failed to fetch candidat');
    return response.json();
  },

  async updateCandidat(
    id: string,
    data: {
      statut?: string;
      cotationFinale?: number;
      commentaireEvaluateur?: string;
      motif?: string;
      auteurNom?: string;
      auteurId?: string;
    }
  ): Promise<Candidat> {
    const response = await authFetch(`${API_URL}/candidats/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update candidat');
    }
    return response.json();
  },

  async deleteAllCandidats(): Promise<{ success: boolean; deleted: number; message: string }> {
    const response = await authFetch(`${API_URL}/candidats`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete candidats');
    return response.json();
  },

  async deleteCandidats(ids: string[]): Promise<{ success: boolean; deleted: number; message: string }> {
    const response = await authFetch(`${API_URL}/candidats/delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to delete candidats');
    return response.json();
  },

  async validateCandidat(
    id: string,
    data: {
      cotationFinale: number;
      commentaireEvaluateur?: string;
      validateurNom: string;
      auteurId?: string;
    }
  ): Promise<Candidat> {
    const response = await authFetch(`${API_URL}/candidats/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to validate candidat');
    }
    return response.json();
  },

  async rejectCandidat(
    id: string,
    data: {
      motif?: string;
      auteurNom: string;
      auteurId?: string;
    }
  ): Promise<Candidat> {
    const response = await authFetch(`${API_URL}/candidats/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reject candidat');
    }
    return response.json();
  },

  async mettreEnRelecture(
    id: string,
    data: {
      auteurNom: string;
      auteurId?: string;
    }
  ): Promise<Candidat> {
    const response = await authFetch(`${API_URL}/candidats/${id}/relecture`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to pass en relecture');
    }
    return response.json();
  },

  async bulkChangeStatus(data: {
    ids: string[];
    nouveauStatut: string;
    motif?: string;
    auteurNom: string;
    auteurId?: string;
  }): Promise<{ success: boolean; updated: number; skipped: number; errors: any[]; message: string }> {
    const response = await authFetch(`${API_URL}/candidats/bulk-status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to bulk change status');
    }
    return response.json();
  },

  async getTransitions(id: string): Promise<{ statut: string; transitionsPossibles: string[] }> {
    const response = await authFetch(`${API_URL}/candidats/${id}/transitions`);
    if (!response.ok) throw new Error('Failed to fetch transitions');
    return response.json();
  },

  // Stats
  async getStats(): Promise<StatutStats> {
    const response = await authFetch(`${API_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // Commentaires
  async getCommentaires(candidatId: string): Promise<any[]> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/commentaires`);
    if (!response.ok) throw new Error('Failed to fetch commentaires');
    return response.json();
  },

  async addCommentaire(candidatId: string, data: {
    contenu: string;
    type?: string;
    auteurNom?: string;
  }): Promise<any> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/commentaires`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add commentaire');
    return response.json();
  },

  async updateCommentaire(commentaireId: string, contenu: string): Promise<any> {
    const response = await authFetch(`${API_URL}/commentaires/${commentaireId}`, {
      method: 'PUT',
      body: JSON.stringify({ contenu }),
    });
    if (!response.ok) throw new Error('Failed to update commentaire');
    return response.json();
  },

  async deleteCommentaire(commentaireId: string): Promise<void> {
    const response = await authFetch(`${API_URL}/commentaires/${commentaireId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete commentaire');
  },

  // Oral d'admission
  async getOralAdmission(candidatId: string): Promise<OralAdmission | null> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/oral`);
    if (!response.ok) throw new Error('Failed to fetch oral admission');
    return response.json();
  },

  async saveOralAdmission(candidatId: string, data: Omit<OralAdmission, 'id' | 'candidatId'>): Promise<OralAdmission> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/oral`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to save oral admission');
    return response.json();
  },

  // Historique des statuts
  async getHistoriqueStatuts(candidatId: string): Promise<any[]> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/historique`);
    if (!response.ok) throw new Error('Failed to fetch historique');
    return response.json();
  },

  async addHistoriqueStatut(candidatId: string, data: {
    ancienStatut?: string;
    nouveauStatut: string;
    motif?: string;
    auteurNom?: string;
  }): Promise<any> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/historique`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add historique');
    return response.json();
  },

  // Brouillon d'évaluation
  async saveBrouillon(candidatId: string, data: {
    cotation: number;
    noteParcoursScolaire?: number;
    noteExperiences?: number;
    noteMotivation?: number;
    commentaire: string;
    auteurId: string;
    auteurNom: string;
  }): Promise<BrouillonEvaluation> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/brouillon`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to save brouillon');
    return response.json();
  },

  async deleteBrouillon(candidatId: string): Promise<void> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/brouillon`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete brouillon');
  },

  // Évaluateurs assignés
  async assignerEvaluateur(candidatId: string, data: {
    evaluateurId: string;
    nom: string;
    prenom: string;
    role: string;
  }): Promise<EvaluateurAssigne> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/evaluateurs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to assign evaluateur');
    return response.json();
  },

  async retirerEvaluateur(candidatId: string, evaluateurId: string): Promise<void> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/evaluateurs/${evaluateurId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove evaluateur');
  },

  async marquerConsultation(candidatId: string, evaluateurId: string): Promise<void> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/evaluateurs/${evaluateurId}/consultation`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to mark consultation');
  },

  // Journal d'activité
  async getJournal(candidatId: string): Promise<EntreeJournal[]> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/journal`);
    if (!response.ok) throw new Error('Failed to fetch journal');
    return response.json();
  },

  async addJournalEntry(candidatId: string, data: {
    type: string;
    auteurId: string;
    auteurNom: string;
    description: string;
    details?: string;
  }): Promise<EntreeJournal> {
    const response = await authFetch(`${API_URL}/candidats/${candidatId}/journal`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add journal entry');
    return response.json();
  },
};
