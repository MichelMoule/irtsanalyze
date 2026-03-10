import { User, Calendar, Mail, Phone, MapPin } from 'lucide-react';

interface InfoPersonnellesProps {
  candidat: any;
}

export function InfoPersonnelles({ candidat }: InfoPersonnellesProps) {
  const donneesParcoursup = candidat.donneesParcoursup || {};
  const donneesCandidat = donneesParcoursup.DonneesCandidats || {};

  return (
    <div className="bg-white rounded-xl border border-shine-border p-6">
      <h3 className="text-sm font-semibold text-shine-text-primary mb-4 flex items-center gap-2">
        <User className="w-4 h-4 text-primary-500" />
        Informations Personnelles
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-shine-text-secondary">Numero de dossier</label>
          <p className="text-sm text-shine-text-primary font-mono">{candidat.numeroDossier}</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-shine-text-secondary">Nom complet</label>
          <p className="text-sm text-shine-text-primary font-semibold">
            {candidat.nom} {candidat.prenom}
          </p>
          {donneesCandidat.PrenomDeuxCandidat && (
            <p className="text-xs text-shine-text-secondary">
              {donneesCandidat.PrenomDeuxCandidat} {donneesCandidat.PrenomTroisCandidat}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-shine-text-secondary">Date de naissance</label>
          <p className="text-sm text-shine-text-primary flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {candidat.dateNaissance || 'Non renseignee'}
          </p>
          {candidat.dateNaissance && (
            <p className="text-xs text-shine-text-secondary">
              Age: {calculerAge(candidat.dateNaissance)} ans
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-shine-text-secondary">Email</label>
          <p className="text-sm text-shine-text-primary flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            {candidat.email || 'Non renseigne'}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-shine-text-secondary">Telephone</label>
          <p className="text-sm text-shine-text-primary flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            {candidat.telephone || 'Non renseigne'}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-shine-text-secondary">Adresse</label>
          <p className="text-sm text-shine-text-primary flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {formatAdresse(donneesCandidat)}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-shine-text-secondary">Civilite</label>
          <p className="text-sm text-shine-text-primary">{donneesCandidat.Civilite || 'Non renseignee'}</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-shine-text-secondary">Nationalite</label>
          <p className="text-sm text-shine-text-primary">{donneesCandidat.TypeNationalite || 'Non renseignee'}</p>
        </div>

        {donneesCandidat.INECandidat && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-shine-text-secondary">INE</label>
            <p className="text-sm text-shine-text-primary font-mono text-xs">{donneesCandidat.INECandidat}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function calculerAge(dateNaissance: string): number {
  const today = new Date();
  const birthDate = new Date(dateNaissance.split('/').reverse().join('-'));
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatAdresse(donneesCandidat: any): string {
  const adresse = [];
  if (donneesCandidat.CoordonneesLignedadresseUn) adresse.push(donneesCandidat.CoordonneesLignedadresseUn);
  if (donneesCandidat.CoordonneesLignedadresseDeux) adresse.push(donneesCandidat.CoordonneesLignedadresseDeux);
  if (donneesCandidat.CoordonneesLignedadresseTrois) adresse.push(donneesCandidat.CoordonneesLignedadresseTrois);

  const ville = `${donneesCandidat.CoordonneesCodepostal || ''} ${donneesCandidat.CoordonneesLibellecommune || ''}`.trim();
  if (ville) adresse.push(ville);

  if (donneesCandidat.CoordonneesLibellepays) adresse.push(donneesCandidat.CoordonneesLibellepays);

  return adresse.join(', ') || 'Non renseignee';
}
