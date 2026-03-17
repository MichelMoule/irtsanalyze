import { create } from 'zustand';
import { Candidat, Filtres, BrouillonEvaluation, EvaluateurAssigne, EntreeJournal } from '@/types';
import { DataLoaderService } from '@/services/dataLoaderService';
import { api } from '@/services/api';

interface AppState {
  // Candidats
  candidats: Candidat[];
  candidatSelectionne: Candidat | null;

  // Sélection multiple
  selectedCandidatIds: string[];

  // Filtres
  filtres: Filtres;

  // UI
  isLoading: boolean;
  notification: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;

  // Actions
  setCandidats: (candidats: Candidat[]) => void;
  updateCandidat: (id: string, updates: Partial<Candidat>) => void;
  selectCandidat: (candidat: Candidat | null) => void;
  setFiltres: (filtres: Partial<Filtres>) => void;
  setLoading: (loading: boolean) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  clearNotification: () => void;
  // Nouvelles actions pour la BD
  loadCandidats: () => Promise<void>;
  refreshCandidats: () => Promise<void>;
  // Sélection multiple
  toggleSelectCandidat: (id: string) => void;
  toggleSelectAll: (filteredIds: string[]) => void;
  clearSelection: () => void;
  // Brouillon & journal
  saveBrouillon: (candidatId: string, brouillon: BrouillonEvaluation) => void;
  ajouterEntreeJournal: (candidatId: string, entree: Omit<EntreeJournal, 'id' | 'date'>) => void;
  assignerEvaluateur: (candidatId: string, evaluateur: EvaluateurAssigne) => void;
  retirerEvaluateur: (candidatId: string, evaluateurId: string) => void;
  marquerConsultation: (candidatId: string, evaluateurId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // État initial
  candidats: [],
  candidatSelectionne: null,
  selectedCandidatIds: [],
  filtres: {
    recherche: '',
    statuts: [],
    alertesUniquement: false,
  },
  isLoading: false,
  notification: null,

  // Actions
  setCandidats: (candidats) => set({ candidats }),
  
  updateCandidat: (id, updates) => {
    const { candidats } = get();
    const updatedCandidats = candidats.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    set({ candidats: updatedCandidats });
  },
  
  selectCandidat: (candidat) => set({ candidatSelectionne: candidat }),
  
  setFiltres: (newFiltres) => {
    const { filtres } = get();
    set({ filtres: { ...filtres, ...newFiltres } });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  showNotification: (message, type) => {
    set({ notification: { message, type } });
    // Auto-clear après 3 secondes
    setTimeout(() => get().clearNotification(), 3000);
  },
  
  clearNotification: () => set({ notification: null }),
  
  // Actions BD
  loadCandidats: async () => {
    set({ isLoading: true });
    try {
      const candidats = await DataLoaderService.chargerCandidats();
      set({ candidats, isLoading: false });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des candidats:', error);
      set({ isLoading: false });
    }
  },
  
  refreshCandidats: async () => {
    await get().loadCandidats();
  },

  // Sélection multiple
  toggleSelectCandidat: (id) => {
    const { selectedCandidatIds } = get();
    if (selectedCandidatIds.includes(id)) {
      set({ selectedCandidatIds: selectedCandidatIds.filter(cid => cid !== id) });
    } else {
      set({ selectedCandidatIds: [...selectedCandidatIds, id] });
    }
  },

  toggleSelectAll: (filteredIds) => {
    const { selectedCandidatIds } = get();
    // Si tous les candidats filtrés sont déjà sélectionnés, on désélectionne tout
    const allSelected = filteredIds.every(id => selectedCandidatIds.includes(id));

    if (allSelected) {
      // Désélectionner tous les candidats filtrés
      set({ selectedCandidatIds: selectedCandidatIds.filter(id => !filteredIds.includes(id)) });
    } else {
      // Sélectionner tous les candidats filtrés (en gardant les autres sélections)
      const newSelection = new Set([...selectedCandidatIds, ...filteredIds]);
      set({ selectedCandidatIds: Array.from(newSelection) });
    }
  },

  clearSelection: () => set({ selectedCandidatIds: [] }),

  // Brouillon
  saveBrouillon: (candidatId, brouillon) => {
    const { candidats } = get();
    const details = `Parcours: ${brouillon.noteParcoursScolaire ?? '-'}/3, Expériences: ${brouillon.noteExperiences ?? '-'}/3, Motivation: ${brouillon.noteMotivation ?? '-'}/2 = ${brouillon.cotation}/8${brouillon.commentaire ? `\nCommentaire: ${brouillon.commentaire}` : ''}`;
    const entree: EntreeJournal = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      date: new Date().toISOString(),
      type: 'brouillon',
      auteurId: brouillon.auteurId,
      auteurNom: brouillon.auteurNom,
      auteurAvatar: brouillon.auteurAvatar,
      description: `a sauvegardé un brouillon (cotation ${brouillon.cotation}/8)`,
      details,
    };
    const updatedCandidats = candidats.map(c => {
      if (c.id !== candidatId) return c;
      return {
        ...c,
        brouillon,
        journalActivite: [entree, ...(c.journalActivite || [])],
      };
    });
    set({ candidats: updatedCandidats });

    // Persist to API (fire-and-forget)
    api.saveBrouillon(candidatId, brouillon).catch(err =>
      console.error('❌ Erreur sauvegarde brouillon API:', err)
    );
  },

  // Journal
  ajouterEntreeJournal: (candidatId, entree) => {
    const { candidats } = get();
    const full: EntreeJournal = {
      ...entree,
      id: crypto.randomUUID?.() || Date.now().toString(),
      date: new Date().toISOString(),
    };
    const updatedCandidats = candidats.map(c =>
      c.id === candidatId
        ? { ...c, journalActivite: [full, ...(c.journalActivite || [])] }
        : c
    );
    set({ candidats: updatedCandidats });

    // Persist to API
    api.addJournalEntry(candidatId, {
      type: entree.type,
      auteurId: entree.auteurId,
      auteurNom: entree.auteurNom,
      description: entree.description,
      details: entree.details,
    }).catch(err => console.error('❌ Erreur ajout journal API:', err));
  },

  // Assignation évaluateurs
  assignerEvaluateur: (candidatId, evaluateur) => {
    const { candidats } = get();
    const updatedCandidats = candidats.map(c => {
      if (c.id !== candidatId) return c;
      const existing = c.evaluateursAssignes || [];
      if (existing.some(e => e.id === evaluateur.id)) return c;
      const entree: EntreeJournal = {
        id: crypto.randomUUID?.() || Date.now().toString(),
        date: new Date().toISOString(),
        type: 'assignation',
        auteurId: evaluateur.id,
        auteurNom: `${evaluateur.prenom} ${evaluateur.nom}`,
        auteurAvatar: evaluateur.avatar,
        description: `a été assigné comme ${evaluateur.role}`,
      };
      return {
        ...c,
        evaluateursAssignes: [...existing, evaluateur],
        journalActivite: [entree, ...(c.journalActivite || [])],
      };
    });
    set({ candidats: updatedCandidats });

    // Persist to API
    api.assignerEvaluateur(candidatId, {
      evaluateurId: evaluateur.id,
      nom: evaluateur.nom,
      prenom: evaluateur.prenom,
      role: evaluateur.role,
    }).catch(err => console.error('❌ Erreur assignation API:', err));
  },

  retirerEvaluateur: (candidatId, evaluateurId) => {
    const { candidats } = get();
    const updatedCandidats = candidats.map(c => {
      if (c.id !== candidatId) return c;
      const retrait = (c.evaluateursAssignes || []).find(e => e.id === evaluateurId);
      const entree: EntreeJournal = {
        id: crypto.randomUUID?.() || Date.now().toString(),
        date: new Date().toISOString(),
        type: 'assignation',
        auteurId: 'system',
        auteurNom: 'Système',
        description: `${retrait ? `${retrait.prenom} ${retrait.nom}` : 'Évaluateur'} a été retiré du dossier`,
      };
      return {
        ...c,
        evaluateursAssignes: (c.evaluateursAssignes || []).filter(e => e.id !== evaluateurId),
        journalActivite: [entree, ...(c.journalActivite || [])],
      };
    });
    set({ candidats: updatedCandidats });

    // Persist to API
    api.retirerEvaluateur(candidatId, evaluateurId).catch(err =>
      console.error('❌ Erreur retrait évaluateur API:', err)
    );
  },

  marquerConsultation: (candidatId, evaluateurId) => {
    const { candidats } = get();
    const updatedCandidats = candidats.map(c => {
      if (c.id !== candidatId) return c;
      const updatedEvals = (c.evaluateursAssignes || []).map(e =>
        e.id === evaluateurId ? { ...e, aConsulte: true, dateConsultation: new Date().toISOString() } : e
      );
      return { ...c, evaluateursAssignes: updatedEvals };
    });
    set({ candidats: updatedCandidats });

    // Persist to API
    api.marquerConsultation(candidatId, evaluateurId).catch(err =>
      console.error('❌ Erreur consultation API:', err)
    );
  },
}));

// Sélecteurs utiles
export const useCandidats = () => useAppStore(state => state.candidats);
export const useCandidatSelectionne = () => useAppStore(state => state.candidatSelectionne);
export const useSelectedCandidatIds = () => useAppStore(state => state.selectedCandidatIds);
export const useFiltres = () => useAppStore(state => state.filtres);
export const useIsLoading = () => useAppStore(state => state.isLoading);
export const useNotification = () => useAppStore(state => state.notification);

// Sélecteurs filtrés
export const useCandidatsFiltres = () => {
  const candidats = useCandidats();
  const filtres = useFiltres();
  
  return candidats.filter(candidat => {
    // Filtre recherche
    if (filtres.recherche) {
      const r = filtres.recherche.toLowerCase();
      const match = candidat.nom.toLowerCase().includes(r)
        || candidat.prenom.toLowerCase().includes(r)
        || candidat.numeroDossier.includes(filtres.recherche)
        || (candidat.email || '').toLowerCase().includes(r)
        || (candidat.etablissementOrigine || '').toLowerCase().includes(r);
      if (!match) return false;
    }

    // Filtre statuts
    if (filtres.statuts.length > 0) {
      if (!filtres.statuts.includes(candidat.statut)) return false;
    }

    // Filtre alertes uniquement
    if (filtres.alertesUniquement && (!candidat.alertes || candidat.alertes.length === 0)) return false;

    // Filtre campagne
    if (filtres.campagneId && (candidat as any).campagneId !== filtres.campagneId) return false;

    // Filtre filière
    if (filtres.filiere && candidat.filiereDemandee !== filtres.filiere) return false;

    // Filtre série bac
    if (filtres.serieBac && candidat.serieBac !== filtres.serieBac) return false;

    // Filtre score IA
    const score = candidat.cotationIAProposee ?? 0;
    if (filtres.scoreMin != null && score < filtres.scoreMin) return false;
    if (filtres.scoreMax != null && score > filtres.scoreMax) return false;

    return true;
  });
};

// Statistiques
export const useStatistiques = () => {
  const candidats = useCandidats();

  return {
    total: candidats.length,
    importe: candidats.filter(c => c.statut === 'importe').length,
    enAnalyse: candidats.filter(c => c.statut === 'en_analyse_ia').length,
    analyse: candidats.filter(c => c.statut === 'analyse').length,
    enRelecture: candidats.filter(c => c.statut === 'en_relecture').length,
    valide: candidats.filter(c => c.statut === 'valide').length,
    rejete: candidats.filter(c => c.statut === 'rejete').length,
    listeAttente: candidats.filter(c => c.statut === 'liste_attente').length,
    erreur: candidats.filter(c => c.statut === 'erreur').length,
  };
};

// Candidats sélectionnés (objets complets)
export const useSelectedCandidats = () => {
  const candidats = useCandidats();
  const selectedIds = useSelectedCandidatIds();

  return candidats.filter(c => selectedIds.includes(c.id));
};