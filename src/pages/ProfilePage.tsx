import { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Building2,
  Shield,
  Save,
  X,
  Edit3,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

export function ProfilePage() {
  const { user, updateProfile, updatePassword, uploadAvatar, error, clearError } = useAuth();

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    departement: '',
    role: '',
  });

  // Avatar
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        departement: user.departement || 'Admissions',
        role: user.role || 'evaluateur',
      });
    }
  }, [user]);

  // Auto-clear success
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  const handleSave = async () => {
    setIsSaving(true);
    clearError();
    try {
      await updateProfile({
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        departement: formData.departement,
      });
      setIsEditing(false);
      setSuccessMessage('Profil mis a jour avec succes');
    } catch {
      // error handled by context
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    clearError();
    if (user) {
      setFormData({
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        departement: user.departement || 'Admissions',
        role: user.role || 'evaluateur',
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setPasswordError('Veuillez selectionner une image (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPasswordError('L\'image ne doit pas depasser 5 Mo');
      return;
    }

    setIsUploadingAvatar(true);
    clearError();
    try {
      await uploadAvatar(file);
      setSuccessMessage('Photo de profil mise a jour');
    } catch {
      // error handled by context
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(newPassword);
      setShowPasswordSection(false);
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Mot de passe modifie avec succes');
    } catch {
      setPasswordError('Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase();

  const inputClasses = 'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#314ace] focus:ring-1 focus:ring-[#314ace]/20 transition-colors placeholder:text-slate-400';
  const labelClasses = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Mon Profil"
        subtitle="Gerez vos informations personnelles et votre securite"
        actions={
          !isEditing ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditing(true)}
            >
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<X className="w-3.5 h-3.5" />}
                onClick={handleCancel}
              >
                Annuler
              </Button>
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
          )
        }
      />

      <div className="flex-1 px-6 lg:px-8 py-6 space-y-5 max-w-3xl">

        {/* Success / Error feedback */}
        {successMessage && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        )}

        {/* ═══ Profile Card ═══ */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-[#314ace] to-[#5b6fd6] relative" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-12 mb-5 flex items-end justify-between">
              <div className="relative group">
                <div className="w-24 h-24 rounded-xl border-4 border-white overflow-hidden bg-[#314ace] flex items-center justify-center shadow-lg">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.prenom} ${user.nom}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-3xl font-bold">{initials}</span>
                  )}
                </div>
                {/* Upload overlay */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 rounded-xl bg-black/0 hover:bg-black/40 flex items-center justify-center transition-colors cursor-pointer group border-4 border-transparent"
                  title="Changer la photo"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  title="Choisir une photo de profil"
                  aria-label="Choisir une photo de profil"
                />
              </div>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#314ace]/10 text-[#314ace] capitalize">
                <Shield className="w-3 h-3 mr-1.5" />
                {user.role || 'Evaluateur'}
              </span>
            </div>

            {/* Name display (non-edit mode) */}
            {!isEditing && (
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-800">{user.prenom} {user.nom}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
              </div>
            )}

            {/* Editable fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="profile-prenom" className={labelClasses}>
                  <UserIcon className="w-3 h-3 inline mr-1" />
                  Prenom
                </label>
                {isEditing ? (
                  <input
                    id="profile-prenom"
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder="Prenom"
                    className={inputClasses}
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{user.prenom}</p>
                )}
              </div>

              <div>
                <label htmlFor="profile-nom" className={labelClasses}>
                  <UserIcon className="w-3 h-3 inline mr-1" />
                  Nom
                </label>
                {isEditing ? (
                  <input
                    id="profile-nom"
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Nom de famille"
                    className={inputClasses}
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{user.nom}</p>
                )}
              </div>

              <div>
                <label htmlFor="profile-email" className={labelClasses}>
                  <Mail className="w-3 h-3 inline mr-1" />
                  Adresse email
                </label>
                <p className="text-sm font-semibold text-slate-800">{user.email}</p>
                {isEditing && (
                  <p className="text-[10px] text-slate-400 mt-1">L'email ne peut pas etre modifie ici</p>
                )}
              </div>

              <div>
                <label htmlFor="profile-telephone" className={labelClasses}>
                  <Phone className="w-3 h-3 inline mr-1" />
                  Telephone
                </label>
                {isEditing ? (
                  <input
                    id="profile-telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className={inputClasses}
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{user.telephone || 'Non renseigne'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Organisation ═══ */}
        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#314ace]/10 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-[#314ace]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Organisation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClasses}>Etablissement</label>
              <p className="text-sm font-medium text-slate-800">IRTS Parmentier</p>
              <p className="text-xs text-slate-400 mt-0.5">Institut Regional du Travail Social</p>
            </div>
            <div>
              <label htmlFor="profile-departement" className={labelClasses}>Departement / Service</label>
              {isEditing ? (
                <select
                  id="profile-departement"
                  value={formData.departement}
                  onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                  className={inputClasses}
                >
                  <option value="Admissions">Admissions</option>
                  <option value="Direction">Direction</option>
                  <option value="Pedagogie">Pedagogie</option>
                  <option value="Administration">Administration</option>
                  <option value="Recherche">Recherche</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-800">{user.departement || 'Admissions'}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Role</label>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#314ace]/10 text-[#314ace] capitalize">
                {user.role || 'Evaluateur'}
              </span>
              {isEditing && (
                <p className="text-[10px] text-slate-400 mt-1">Le role est gere par l'administrateur</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Identifiant</label>
              <p className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1.5 rounded">{user.id.slice(0, 16)}...</p>
            </div>
          </div>
        </div>

        {/* ═══ Securite — Changement de mot de passe ═══ */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Securite</h3>
            </div>
            {!showPasswordSection && (
              <button
                type="button"
                onClick={() => { setShowPasswordSection(true); setPasswordError(null); }}
                className="text-xs font-semibold text-[#314ace] hover:text-[#2a3fb8] transition-colors"
              >
                Changer le mot de passe
              </button>
            )}
          </div>

          {!showPasswordSection ? (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Mot de passe</p>
                  <p className="text-xs text-slate-400 mt-0.5">Derniere modification inconnue</p>
                </div>
                <span className="text-sm text-slate-400">************</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Authentification</p>
                  <p className="text-xs text-slate-400 mt-0.5">Connecte via Supabase Auth (email/mot de passe)</p>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Actif
                </span>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              {passwordError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-600">{passwordError}</p>
                </div>
              )}

              <div>
                <label htmlFor="new-password" className={labelClasses}>Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caracteres"
                    className={inputClasses + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength indicator */}
                {newPassword.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4].map(i => {
                      const strength = newPassword.length >= 12 ? 4 : newPassword.length >= 8 ? 3 : newPassword.length >= 6 ? 2 : 1;
                      const colors = ['bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
                      return (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength - 1] : 'bg-slate-200'}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className={labelClasses}>Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le mot de passe"
                    className={inputClasses + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-[10px] text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
                {confirmPassword.length > 0 && newPassword === confirmPassword && (
                  <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Mots de passe identiques
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="px-4 py-2 text-sm font-bold text-white bg-[#314ace] hover:bg-[#2a3fb8] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Modifier le mot de passe
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Account info ═══ */}
        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Acces et permissions</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">Niveau d'acces</p>
                <p className="text-xs text-slate-400 mt-0.5">Permissions associees a votre role</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#314ace]/10 text-[#314ace] capitalize">
                {user.role || 'Evaluateur'}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-slate-400">
                {user.role === 'administrateur'
                  ? 'Acces complet : gestion des utilisateurs, import/export, validation, configuration'
                  : user.role === 'lecteur'
                    ? 'Acces en lecture seule : consultation des dossiers et statistiques'
                    : 'Acces evaluateur : consultation, analyse, brouillons, validation des dossiers candidats'
                }
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
