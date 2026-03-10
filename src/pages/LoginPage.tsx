import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export function LoginPage() {
  const { isAuthenticated, login, isLoading, error } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (err) {
      console.error('Erreur de connexion:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-shine-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl border border-shine-border shadow-card p-8">
          {/* Logo et Titre */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-5">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-shine-text-primary mb-1">
              IRTS
            </h1>
            <p className="text-sm text-shine-text-secondary">
              Espace Admissions Parcoursup
            </p>
          </div>

          {/* Description */}
          <div className="mb-6 p-3 bg-primary-50 rounded-lg border border-primary-100">
            <p className="text-sm text-shine-text-secondary text-center">
              Connectez-vous avec votre compte Microsoft pour acceder a l'application
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 text-center">
                {error}
              </p>
            </div>
          )}

          {/* Bouton de connexion */}
          <Button
            variant="primary"
            size="lg"
            icon={<LogIn className="w-5 h-5" />}
            onClick={handleLogin}
            loading={isLoggingIn || isLoading}
            disabled={isLoggingIn || isLoading}
            className="w-full"
          >
            {isLoggingIn || isLoading ? 'Connexion en cours...' : 'Se connecter avec Microsoft'}
          </Button>

          {/* Note en bas */}
          <div className="mt-6 pt-6 border-t border-shine-border">
            <p className="text-xs text-center text-shine-text-tertiary">
              Mode developpement : la connexion utilise un compte mock.
              <br />
              En production, l'authentification sera geree par Azure AD.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-shine-text-tertiary mt-6">
          &copy; {new Date().getFullYear()} IRTS - Tous droits reserves
        </p>
      </motion.div>
    </div>
  );
}
