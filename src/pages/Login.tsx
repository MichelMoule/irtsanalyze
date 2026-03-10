import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-primary-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-surface rounded-lg shadow-2xl p-8 md:p-12 max-w-md w-full"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="bg-primary p-4 rounded-2xl mb-4"
          >
            <GraduationCap className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">IRTS</h1>
          <p className="text-text-secondary text-center">Espace Admissions</p>
        </div>

        {/* Description */}
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Bienvenue
          </h2>
          <p className="text-text-secondary text-sm">
            Connectez-vous avec votre compte Microsoft pour accéder à la plateforme d'analyse des candidatures Parcoursup
          </p>
        </div>

        {/* Login Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onLogin}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="currentColor">
              <rect x="1" y="1" width="9" height="9" fill="currentColor" />
              <rect x="1" y="11" width="9" height="9" fill="currentColor" />
              <rect x="11" y="1" width="9" height="9" fill="currentColor" />
              <rect x="11" y="11" width="9" height="9" fill="currentColor" />
            </svg>
          }
        >
          Se connecter avec Microsoft
        </Button>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-secondary">
            Accès réservé au personnel autorisé de l'IRTS
          </p>
        </div>
      </motion.div>
    </div>
  );
};
