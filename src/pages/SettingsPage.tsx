import { useState, useEffect } from 'react';
import { Bell, Lock, Globe, ChevronRight, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ id, checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 pr-4">
        <label htmlFor={id} className="text-sm font-medium text-flat-fg cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-flat-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          title={label}
        />
        <div className="w-9 h-5 bg-slate-200 rounded-full peer
                        peer-checked:bg-primary-500
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                        after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                        peer-checked:after:translate-x-4
                        transition-colors duration-200" />
      </label>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    nouveauCandidat: true,
    validationRequise: true,
  });
  const [langue, setLangue] = useState('fr');
  const [timezone, setTimezone] = useState('Europe/Paris');

  // Load settings from Supabase user_metadata on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const meta = session?.user?.user_metadata;
      if (meta?.settings) {
        const s = meta.settings;
        if (s.notifications) setNotifications(prev => ({ ...prev, ...s.notifications }));
        if (s.langue) setLangue(s.langue);
        if (s.timezone) setTimezone(s.timezone);
      }
    });
  }, []);

  // Auto-clear success
  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          settings: {
            notifications,
            langue,
            timezone,
          },
        },
      });
      if (error) throw error;
      setSaved(true);
    } catch (err) {
      console.error('Erreur sauvegarde parametres:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Parametres"
        subtitle="Configurez votre experience IRTS"
        actions={
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sauvegarde
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </div>
        }
      />

      <div className="flex-1 px-6 lg:px-8 py-6 space-y-5 max-w-2xl">

        {/* Notifications */}
        <section className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-primary-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Notifications</h2>
          </div>
          <div className="px-5 divide-y divide-gray-100">
            <Toggle
              id="notif-email"
              checked={notifications.email}
              onChange={(v) => setNotifications({ ...notifications, email: v })}
              label="Notifications par email"
              description="Recevoir un recapitulatif par email"
            />
            <Toggle
              id="notif-push"
              checked={notifications.push}
              onChange={(v) => setNotifications({ ...notifications, push: v })}
              label="Notifications navigateur"
              description="Alertes dans le navigateur (push)"
            />
            <Toggle
              id="notif-nouveau"
              checked={notifications.nouveauCandidat}
              onChange={(v) => setNotifications({ ...notifications, nouveauCandidat: v })}
              label="Nouveau candidat"
              description="Alerte lors de l'import d'un nouveau dossier"
            />
            <Toggle
              id="notif-validation"
              checked={notifications.validationRequise}
              onChange={(v) => setNotifications({ ...notifications, validationRequise: v })}
              label="Validation requise"
              description="Alerte quand un dossier est pret a etre valide"
            />
          </div>
        </section>

        {/* Security */}
        <section className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Securite</h2>
          </div>
          <div className="px-5 divide-y divide-gray-100">
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Authentification</p>
                <p className="text-xs text-slate-400 mt-0.5">Connecte via Supabase Auth (email / mot de passe)</p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Actif
              </span>
            </div>
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Mot de passe</p>
                <p className="text-xs text-slate-400 mt-0.5">Modifiable depuis la page Profil</p>
              </div>
              <button
                type="button"
                onClick={() => window.location.href = '/profile'}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 transition-colors"
              >
                Modifier
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Language & region */}
        <section className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Langue et region</h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-langue" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Langue
              </label>
              <select
                id="settings-langue"
                value={langue}
                onChange={(e) => setLangue(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#314ace] focus:ring-1 focus:ring-[#314ace]/20 transition-colors"
                title="Langue d'interface"
              >
                <option value="fr">Francais</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label htmlFor="settings-timezone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Fuseau horaire
              </label>
              <select
                id="settings-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#314ace] focus:ring-1 focus:ring-[#314ace]/20 transition-colors"
                title="Fuseau horaire"
              >
                <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
