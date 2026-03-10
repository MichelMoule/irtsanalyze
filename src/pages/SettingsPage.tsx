import { useState } from 'react';
import { Bell, Lock, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

export function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    nouveauCandidat: true,
    validationRequise: true,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-shine-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Parametres"
        subtitle="Personnalisez votre experience IRTS"
        actions={
          <Button>
            Enregistrer
          </Button>
        }
      />

      <div className="px-8 py-6 space-y-6">
        {/* Notifications */}
        <div className="bg-white border border-shine-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-shine-text-primary mb-5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-500" />
            Notifications
          </h2>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-shine-text-primary">Notifications par email</p>
                <p className="text-xs text-shine-text-secondary mt-0.5">Recevoir des notifications par email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                  className="sr-only peer"
                  title="Notifications par email"
                />
                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="border-t border-shine-border"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-shine-text-primary">Nouveau candidat</p>
                <p className="text-xs text-shine-text-secondary mt-0.5">Alerte lors d'un nouveau dossier</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.nouveauCandidat}
                  onChange={(e) => setNotifications({ ...notifications, nouveauCandidat: e.target.checked })}
                  className="sr-only peer"
                  title="Nouveau candidat"
                />
                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-shine-text-primary">Validation requise</p>
                <p className="text-xs text-shine-text-secondary mt-0.5">Alerte quand une validation est necessaire</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.validationRequise}
                  onChange={(e) => setNotifications({ ...notifications, validationRequise: e.target.checked })}
                  className="sr-only peer"
                  title="Validation requise"
                />
                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-shine-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-shine-text-primary mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary-500" />
            Securite
          </h2>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-shine-text-primary mb-1">Authentification</p>
              <p className="text-xs text-shine-text-secondary mb-3">
                Connecte via Microsoft Azure AD
              </p>
              <Button variant="secondary" size="sm">
                Gerer la connexion
              </Button>
            </div>

            <div className="border-t border-shine-border"></div>

            <div>
              <p className="text-sm font-medium text-shine-text-primary mb-1">Sessions actives</p>
              <p className="text-xs text-shine-text-secondary mb-3">
                Gerez vos sessions actives sur differents appareils
              </p>
              <Button variant="secondary" size="sm">
                Voir les sessions
              </Button>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white border border-shine-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-shine-text-primary mb-5 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary-500" />
            Langue et region
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-shine-text-secondary mb-1.5">
                Langue
              </label>
              <select className="input" title="Langue">
                <option value="fr">Francais</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-shine-text-secondary mb-1.5">
                Fuseau horaire
              </label>
              <select className="input" title="Fuseau horaire">
                <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
