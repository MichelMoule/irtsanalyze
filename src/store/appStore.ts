import { create } from 'zustand';
import { Candidat, Filtres } from '@/types';
import { DataLoaderService } from '@/services/dataLoaderService';

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
      const rechercheLower = filtres.recherche.toLowerCase();
      const matchNom = candidat.nom.toLowerCase().includes(rechercheLower);
      const matchPrenom = candidat.prenom.toLowerCase().includes(rechercheLower);
      const matchNumero = candidat.numeroDossier.includes(filtres.recherche);
      
      if (!matchNom && !matchPrenom && !matchNumero) return false;
    }
    
    // Filtre statuts
    if (filtres.statuts.length > 0) {
      if (!filtres.statuts.includes(candidat.statut)) return false;
    }
    
    // Filtre alertes uniquement
    if (filtres.alertesUniquement && (!candidat.alertes || candidat.alertes.length === 0)) return false;
    
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
    erreur: candidats.filter(c => c.statut === 'erreur').length,
  };
};

// Candidats sélectionnés (objets complets)
export const useSelectedCandidats = () => {
  const candidats = useCandidats();
  const selectedIds = useSelectedCandidatIds();

  return candidats.filter(c => selectedIds.includes(c.id));
};