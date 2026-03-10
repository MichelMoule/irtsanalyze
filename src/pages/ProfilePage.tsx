import { useState, useEffect } from 'react';
import { User, Mail, Building2, Shield, Camera, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

export function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        role: user.role || '',
      });
    }
  }, [user]);

  const handleSave = () => {
    // TODO: Save to API
    setIsEditing(false);
  };

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
        title="Mon Profil"
        subtitle="Gerez vos informations personnelles"
        actions={
          !isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)} icon={<X className="w-4 h-4" />}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} icon={<Save className="w-4 h-4" />}>
                Enregistrer
              </Button>
            </div>
          )
        }
      />

      <div className="px-8 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-shine-border rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <button
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Changer la photo"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
              <Button variant="secondary" size="sm" icon={<Camera className="w-3.5 h-3.5" />}>
                Changer la photo
              </Button>
            </div>

            {/* Form */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-shine-text-secondary mb-1.5">
                    <User className="w-3.5 h-3.5 inline mr-1.5" />
                    Prenom
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <p className="text-sm font-medium text-shine-text-primary">{user?.prenom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-shine-text-secondary mb-1.5">
                    <User className="w-3.5 h-3.5 inline mr-1.5" />
                    Nom
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <p className="text-sm font-medium text-shine-text-primary">{user?.nom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-shine-text-secondary mb-1.5">
                    <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <p className="text-sm font-medium text-shine-text-primary">{user?.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-shine-text-secondary mb-1.5">
                    <Shield className="w-3.5 h-3.5 inline mr-1.5" />
                    Role
                  </label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600 capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organisation */}
        <div className="bg-white border border-shine-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-shine-text-primary mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary-500" />
            Organisation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-shine-text-secondary mb-1">
                Etablissement
              </label>
              <p className="text-sm font-medium text-shine-text-primary">IRTS - Institut Regional du Travail Social</p>
            </div>
            <div>
              <label className="block text-sm text-shine-text-secondary mb-1">
                Departement
              </label>
              <p className="text-sm font-medium text-shine-text-primary">Admissions</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-shine-border rounded-xl p-5">
            <div className="text-2xl font-bold text-primary-500 mb-1">127</div>
            <p className="text-sm text-shine-text-secondary">Dossiers traites</p>
          </div>
          <div className="bg-white border border-shine-border rounded-xl p-5">
            <div className="text-2xl font-bold text-primary-500 mb-1">45</div>
            <p className="text-sm text-shine-text-secondary">Cette semaine</p>
          </div>
          <div className="bg-white border border-shine-border rounded-xl p-5">
            <div className="text-2xl font-bold text-emerald-500 mb-1">98%</div>
            <p className="text-sm text-shine-text-secondary">Taux de validation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
