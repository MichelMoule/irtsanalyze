import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Interface pour les informations utilisateur
 */
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role?: string;
  avatar?: string;
}

/**
 * Interface du contexte d'authentification
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider d'authentification
 *
 * Gère l'état d'authentification de l'utilisateur via Microsoft Azure AD.
 * En mode développement, permet une authentification mock.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà connecté au montage
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Vérifie l'état d'authentification actuel
   */
  const checkAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Remplacer par MSAL quand Azure AD sera configuré
      const mockUser = localStorage.getItem('irts-mock-user');
      if (mockUser) {
        setUser(JSON.parse(mockUser));
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'authentification:', err);
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Connecte l'utilisateur via Microsoft Azure AD
   */
  const login = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Remplacer par MSAL quand Azure AD sera configuré
      const mockUser: User = {
        id: '1',
        email: 'evaluateur@irts.fr',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'evaluateur',
      };
      setUser(mockUser);
      localStorage.setItem('irts-mock-user', JSON.stringify(mockUser));
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError('Échec de la connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Déconnecte l'utilisateur
   */
  const logout = () => {
    setUser(null);
    setError(null);

    // TODO: Remplacer par MSAL quand Azure AD sera configuré
    localStorage.removeItem('irts-mock-user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook pour accéder au contexte d'authentification
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
