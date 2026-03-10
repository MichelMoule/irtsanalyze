import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Candidat } from '@/types';
import { api } from '@/services/api';

interface UseCandidatsOptions {
  autoFetch?: boolean;
  campagneId?: string;
}

interface UseCandidatsResult {
  candidats: Candidat[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  filterByStatut: (statut: string) => Candidat[];
  filterBySearch: (query: string) => Candidat[];
  stats: {
    total: number;
    byStatut: Record<string, number>;
  };
}

/**
 * Hook personnalisé optimisé pour gérer les candidats
 *
 * @param options - Options de configuration
 * @returns Données et méthodes pour gérer les candidats
 *
 * @example
 * ```tsx
 * const { candidats, loading, filterByStatut } = useCandidats({ autoFetch: true });
 * const analysedCandidats = filterByStatut('analyse');
 * ```
 */
export function useCandidats(options: UseCandidatsOptions = {}): UseCandidatsResult {
  const { autoFetch = true, campagneId } = options;

  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mémoïsation du calcul des statistiques
  const stats = useMemo(() => {
    const byStatut: Record<string, number> = {};

    candidats.forEach((candidat) => {
      const statut = candidat.statut;
      byStatut[statut] = (byStatut[statut] || 0) + 1;
    });

    return {
      total: candidats.length,
      byStatut,
    };
  }, [candidats]);

  // Fonction de rafraîchissement mémoïsée
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getCandidats();

      // Filtrer par campagne si spécifié (campagneId filtering not yet supported in data model)
      const filtered = data;

      setCandidats(filtered);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch candidats');
      setError(error);
      console.error('Error fetching candidats:', error);
    } finally {
      setLoading(false);
    }
  }, [campagneId]);

  // Fonction de filtrage par statut mémoïsée
  const filterByStatut = useCallback((statut: string) => {
    return candidats.filter((c) => c.statut === statut);
  }, [candidats]);

  // Fonction de recherche mémoïsée
  const filterBySearch = useCallback((query: string) => {
    if (!query.trim()) return candidats;

    const lowerQuery = query.toLowerCase();
    return candidats.filter((c) => {
      return (
        c.nom.toLowerCase().includes(lowerQuery) ||
        c.prenom.toLowerCase().includes(lowerQuery) ||
        c.numeroDossier.toLowerCase().includes(lowerQuery) ||
        c.etablissementOrigine?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [candidats]);

  // Chargement automatique
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  return {
    candidats,
    loading,
    error,
    refresh,
    filterByStatut,
    filterBySearch,
    stats,
  };
}
