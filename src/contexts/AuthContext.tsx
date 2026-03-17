import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, AuthError } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role?: string;
  avatar?: string;
  telephone?: string;
  departement?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nom: string, prenom: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { nom?: string; prenom?: string; avatar_url?: string; telephone?: string; departement?: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function mapSupabaseError(error: AuthError): string {
  const msg = error.message?.toLowerCase() || '';
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials'))
    return 'Email ou mot de passe incorrect.';
  if (msg.includes('email not confirmed'))
    return 'Veuillez confirmer votre email avant de vous connecter.';
  if (msg.includes('user already registered') || msg.includes('already been registered'))
    return 'Un compte existe déjà avec cet email.';
  if (msg.includes('password') && msg.includes('short'))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Trop de tentatives. Veuillez patienter quelques minutes.';
  return error.message || 'Une erreur est survenue.';
}

function extractUserFromSession(session: Session | null): User | null {
  if (!session?.user) return null;
  const u = session.user;
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    email: u.email || '',
    nom: meta.nom || meta.last_name || '',
    prenom: meta.prenom || meta.first_name || '',
    role: meta.role || 'evaluateur',
    avatar: meta.avatar_url || undefined,
    telephone: meta.telephone || undefined,
    departement: meta.departement || undefined,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync Supabase user to Prisma Utilisateur table (fire-and-forget)
  const syncUserToDb = useCallback(async (u: User, accessToken: string) => {
    try {
      const API_URL = import.meta.env.DEV ? 'http://localhost:3003/api' : '/api';
      await fetch(`${API_URL}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: u.id,
          email: u.email,
          nom: u.nom,
          prenom: u.prenom,
          role: u.role,
        }),
      });
    } catch {
      // Non-blocking — don't disrupt auth flow
    }
  }, []);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      const u = extractUserFromSession(s);
      setUser(u);
      if (u && s) syncUserToDb(u, s.access_token);
      setIsLoading(false);
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      const u = extractUserFromSession(s);
      setUser(u);
      if (u && s) syncUserToDb(u, s.access_token);
    });

    return () => subscription.unsubscribe();
  }, [syncUserToDb]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!email || !password) {
        throw new Error('Veuillez remplir tous les champs.');
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const msg = mapSupabaseError(authError);
        setError(msg);
        throw new Error(msg);
      }
    } catch (err: any) {
      if (!error) setError(err.message || 'Échec de la connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, nom: string, prenom: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!email || !password || !nom || !prenom) {
        throw new Error('Veuillez remplir tous les champs.');
      }
      if (password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
      }

      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom,
            prenom,
            role: 'evaluateur',
          },
        },
      });

      if (authError) {
        const msg = mapSupabaseError(authError);
        setError(msg);
        throw new Error(msg);
      }
    } catch (err: any) {
      if (!error) setError(err.message || 'Échec de l\'inscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!email) {
        throw new Error('Veuillez saisir votre adresse email.');
      }

      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (authError) {
        const msg = mapSupabaseError(authError);
        setError(msg);
        throw new Error(msg);
      }
    } catch (err: any) {
      if (!error) setError(err.message || 'Erreur');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { nom?: string; prenom?: string; avatar_url?: string; telephone?: string; departement?: string }) => {
    setError(null);
    const { error: authError } = await supabase.auth.updateUser({
      data,
    });
    if (authError) {
      const msg = mapSupabaseError(authError);
      setError(msg);
      throw new Error(msg);
    }
    // Also sync to Prisma DB
    if (session) {
      const updated = extractUserFromSession(session);
      if (updated) {
        // Merge new data into the user immediately (before onAuthStateChange fires)
        const merged = { ...updated, ...data, avatar: data.avatar_url || updated.avatar };
        setUser(merged);
        syncUserToDb(merged, session.access_token);
      }
    }
  };

  const updatePassword = async (newPassword: string) => {
    setError(null);
    if (newPassword.length < 6) {
      const msg = 'Le mot de passe doit contenir au moins 6 caractères.';
      setError(msg);
      throw new Error(msg);
    }
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (authError) {
      const msg = mapSupabaseError(authError);
      setError(msg);
      throw new Error(msg);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    setError(null);
    if (!session?.user) throw new Error('Non authentifié');

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${session.user.id}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      const msg = `Erreur upload: ${uploadError.message}`;
      setError(msg);
      throw new Error(msg);
    }

    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = data.publicUrl;

    // Update user metadata with new avatar URL
    await updateProfile({ avatar_url: avatarUrl });

    return avatarUrl;
  };

  const logout = async () => {
    setError(null);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    resetPassword,
    updateProfile,
    updatePassword,
    uploadAvatar,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
