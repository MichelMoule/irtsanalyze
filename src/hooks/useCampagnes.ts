import { useState, useEffect, useCallback } from 'react';
import type { Campagne } from '@/types';
import { api } from '@/services/api';

interface UseCampagnesResult {
  campagnes: Campagne[];
  currentCampagne: Campagne | null;
  loading: boolean;
  error: Error | null;
  setCurrentCampagne: (campagne: Campagne | null) => void;
  refresh: () => Promise<void>;
  createCampagne: (data: Partial<Campagne>) => Promise<Campagne>;
  updateCampagne: (id: string, data: Partial<Campagne>) => Promise<Campagne>;
}

/**
 * Hook personnalisé pour gérer les campagnes
 *
 * Gère le chargement, la sélection et les opérations CRUD sur les campagnes.
 * La campagne courante est persistée dans localStorage.
 *
 * @example
 * ```tsx
 * const { campagnes, currentCampagne, setCurrentCampagne } = useCampagnes();
 * ```
 */
export function useCampagnes(): UseCampagnesResult {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [currentCampagne, setCurrentCampagneState] = useState<Campagne | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Charger les campagnes
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getCampagnes();
      setCampagnes(data);

      // Si pas de campagne courante, sélectionner la première "en_cours"
      if (!currentCampagne && data.length > 0) {
        const activeCampagne = data.find((c) => c.statut === 'en_cours') || data[0];
        setCurrentCampagneState(activeCampagne);
        localStorage.setItem('irts-current-campagne', activeCampagne.id);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch campagnes');
      setError(error);
      console.error('Error fetching campagnes:', error);
    } finally {
      setLoading(false);
    }
  }, [currentCampagne]);

  // Définir la campagne courante
  const setCurrentCampagne = useCallback((campagne: Campagne | null) => {
    setCurrentCampagneState(campagne);
    if (campagne) {
      localStorage.setItem('irts-current-campagne', campagne.id);
    } else {
      localStorage.removeItem('irts-current-campagne');
    }
  }, []);

  // Créer une campagne
  const createCampagne = useCallback(async (data: Partial<Campagne>) => {
    try {
      const newCampagne = await api.createCampagne({
        annee: data.annee || new Date().getFullYear(),
        libelle: data.libelle || data.nom || `Campagne ${new Date().getFullYear()}`,
        description: data.description,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
      });

      setCampagnes((prev) => [...prev, newCampagne]);
      return newCampagne;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create campagne');
      setError(error);
      throw error;
    }
  }, []);

  // Mettre à jour une campagne
  const updateCampagne = useCallback(async (id: string, data: Partial<Campagne>) => {
    try {
      const updatedCampagne = await api.updateCampagne(id, data);

      setCampagnes((prev) =>
        prev.map((c) => (c.id === id ? updatedCampagne : c))
      );

      // Si c'est la campagne courante, la mettre à jour
      if (currentCampagne?.id === id) {
        setCurrentCampagneState(updatedCampagne);
      }

      return updatedCampagne;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update campagne');
      setError(error);
      throw error;
    }
  }, [currentCampagne]);

  // Charger au montage et restaurer la campagne depuis localStorage
  useEffect(() => {
    const loadCampagnes = async () => {
      await refresh();

      // Restaurer la campagne depuis localStorage
      const savedCampagneId = localStorage.getItem('irts-current-campagne');
      if (savedCampagneId) {
        const campagne = campagnes.find((c) => c.id === savedCampagneId);
        if (campagne) {
          setCurrentCampagneState(campagne);
        }
      }
    };

    loadCampagnes();
  }, []);

  return {
    campagnes,
    currentCampagne,
    loading,
    error,
    setCurrentCampagne,
    refresh,
    createCampagne,
    updateCampagne,
  };
}
