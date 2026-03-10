import { School, GraduationCap, BookOpen, Calculator, TrendingUp } from 'lucide-react';

interface ScolariteProps {
  candidat: any;
}

export function Scolarite({ candidat }: ScolariteProps) {
  const donneesParcoursup = candidat.donneesParcoursup || {};
  const scolarite = donneesParcoursup.Scolarite || [];
  const baccalaureat = donneesParcoursup.Baccalaureat || {};

  const scolariteTriee = [...scolarite].sort((a: any, b: any) => (a.AnneeScolaireCode || 0) - (b.AnneeScolaireCode || 0));

  return (
    <div className="bg-white rounded-xl border border-shine-border p-6">
      <h3 className="text-sm font-semibold text-shine-text-primary mb-4 flex items-center gap-2">
        <School className="w-4 h-4 text-primary-500" />
        Parcours Scolaire
      </h3>

      {/* Baccalaureat */}
      {baccalaureat.TypeDiplomeLibelle && (
        <div className="mb-6 p-4 bg-shine-bg rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-shine-text-primary">Baccalaureat</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-shine-text-secondary">Type</label>
              <p className="text-sm text-shine-text-primary">{baccalaureat.TypeDiplomeLibelle}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-shine-text-secondary">Serie</label>
              <p className="text-sm text-shine-text-primary">{baccalaureat.SerieDiplomeLibelle || 'Non renseignee'}</p>
            </div>
            {baccalaureat.MentionObtenueLibelle && (
              <div>
                <label className="text-xs font-medium text-shine-text-secondary">Mention</label>
                <p className="text-sm text-shine-text-primary font-medium">{baccalaureat.MentionObtenueLibelle}</p>
              </div>
            )}
            {baccalaureat.DateObtentionMois && (
              <div>
                <label className="text-xs font-medium text-shine-text-secondary">Date d'obtention</label>
                <p className="text-sm text-shine-text-primary">
                  {baccalaureat.DateObtentionMois}/{baccalaureat.DateObtentionAnnee}
                </p>
              </div>
            )}
            {baccalaureat.AcademieBacLibelle && (
              <div>
                <label className="text-xs font-medium text-shine-text-secondary">Academie</label>
                <p className="text-sm text-shine-text-primary">{baccalaureat.AcademieBacLibelle}</p>
              </div>
            )}
          </div>

          {baccalaureat.NotesBaccalaureat && baccalaureat.NotesBaccalaureat.length > 0 && (
            <div className="mt-4">
              <h5 className="text-xs font-medium text-shine-text-primary mb-2">Notes du baccalaureat</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {baccalaureat.NotesBaccalaureat.map((note: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded-lg border border-shine-border">
                    <span className="text-xs text-shine-text-secondary">{note.EpreuveLibelle}</span>
                    <span className="text-sm font-medium text-shine-text-primary">
                      {note.NoteEpreuve || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historique scolaire */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-shine-text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Historique scolaire
        </h4>

        {scolariteTriee.length === 0 ? (
          <p className="text-sm text-shine-text-secondary">Aucune donnee scolaire disponible</p>
        ) : (
          <div className="space-y-3">
            {scolariteTriee.map((annee: any, index: number) => (
              <div key={index} className="border-l-2 border-primary-500 pl-4 py-2">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="text-sm font-medium text-shine-text-primary">
                    {annee.AnneeScolaireLibelle}
                  </h5>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    annee.ScolarisationLibelle?.includes('scolarise')
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {annee.ScolarisationLibelle || 'Non renseigne'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-shine-text-secondary">Niveau</label>
                    <p className="text-sm text-shine-text-primary">{annee.NiveauEtudeLibelle || 'Non renseigne'}</p>
                  </div>

                  <div>
                    <label className="text-xs text-shine-text-secondary">Type de formation</label>
                    <p className="text-sm text-shine-text-primary">{annee.TypeFormationLibelle || 'Non renseigne'}</p>
                  </div>

                  <div>
                    <label className="text-xs text-shine-text-secondary">Serie/classe</label>
                    <p className="text-sm text-shine-text-primary">{annee.SeriedeclasseLibelle || annee.ClassecandidatLibelle || 'Non renseigne'}</p>
                  </div>

                  {annee.NomEtablissementOrigine && (
                    <div className="lg:col-span-3">
                      <label className="text-xs text-shine-text-secondary">Etablissement</label>
                      <p className="text-sm text-shine-text-primary">{annee.NomEtablissementOrigine}</p>
                      {annee.CommuneEtablissementOrigineLibelle && (
                        <p className="text-xs text-shine-text-secondary">
                          {annee.CommuneEtablissementOrigineLibelle} ({annee.DepartementEtablissementOrigineLibelle})
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {annee.NotationScolariteLibelle && annee.NotationScolariteLibelle !== 'Non renseigne' && (
                  <div className="mt-2">
                    <label className="text-xs text-shine-text-secondary">Notation</label>
                    <p className="text-sm text-shine-text-primary">{annee.NotationScolariteLibelle}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moyennes */}
      {(candidat.moyenneGenerale || candidat.moyenneFrancais || candidat.moyennePhilosophie) && (
        <div className="mt-6 p-4 bg-shine-bg rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-shine-text-primary">Moyennes</h4>
            <TrendingUp className="w-3.5 h-3.5 text-shine-text-secondary" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {candidat.moyenneGenerale && (
              <div className="text-center">
                <div className="text-xl font-bold text-primary-500">{candidat.moyenneGenerale.toFixed(2)}</div>
                <div className="text-xs text-shine-text-secondary">Generale</div>
              </div>
            )}
            {candidat.moyenneFrancais && (
              <div className="text-center">
                <div className="text-xl font-bold text-primary-500">{candidat.moyenneFrancais.toFixed(2)}</div>
                <div className="text-xs text-shine-text-secondary">Francais</div>
              </div>
            )}
            {candidat.moyennePhilosophie && (
              <div className="text-center">
                <div className="text-xl font-bold text-primary-500">{candidat.moyennePhilosophie.toFixed(2)}</div>
                <div className="text-xs text-shine-text-secondary">Philosophie</div>
              </div>
            )}
            {candidat.moyenneHistoireGeo && (
              <div className="text-center">
                <div className="text-xl font-bold text-primary-500">{candidat.moyenneHistoireGeo.toFixed(2)}</div>
                <div className="text-xs text-shine-text-secondary">Histoire-Geo</div>
              </div>
            )}
            {candidat.moyenneMaths && (
              <div className="text-center">
                <div className="text-xl font-bold text-primary-500">{candidat.moyenneMaths.toFixed(2)}</div>
                <div className="text-xs text-shine-text-secondary">Maths</div>
              </div>
            )}
          </div>

          {candidat.evolutionNotes && (
            <div className="mt-3 text-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                candidat.evolutionNotes === 'progression' ? 'bg-emerald-50 text-emerald-600' :
                candidat.evolutionNotes === 'regression' ? 'bg-red-50 text-red-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                Evolution: {candidat.evolutionNotes}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
