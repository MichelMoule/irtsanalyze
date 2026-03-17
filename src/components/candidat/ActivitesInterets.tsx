import { Heart, Users, Trophy, Briefcase, Globe } from 'lucide-react';

interface ActivitesInteretsProps {
  candidat: any;
}

export function ActivitesInterets({ candidat }: ActivitesInteretsProps) {
  const donneesParcoursup = candidat.donneesParcoursup || {};
  const activites = donneesParcoursup.ActivitesCentresInteret || {};

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-flat-fg mb-4 flex items-center gap-2">
        <Heart className="w-4 h-4 text-primary-500" />
        Activites et Centres d'Interet
      </h3>

      {Object.keys(activites).length === 0 ? (
        <p className="text-sm text-flat-text-secondary">Aucune activite ou centre d'interet renseigne</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activites.ExperienceEncadrement && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-sm font-medium text-flat-fg">Experiences d'encadrement</h4>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-flat-fg whitespace-pre-wrap">{activites.ExperienceEncadrement}</p>
              </div>
            </div>
          )}

          {activites.EngagementsCitoyen && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-sm font-medium text-flat-fg">Engagements citoyens</h4>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-flat-fg whitespace-pre-wrap">{activites.EngagementsCitoyen}</p>
              </div>
            </div>
          )}

          {activites.ExperiencesProfessionnelles && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-sm font-medium text-flat-fg">Experiences professionnelles</h4>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-flat-fg whitespace-pre-wrap">{activites.ExperiencesProfessionnelles}</p>
              </div>
            </div>
          )}

          {activites.PratiquesSportivesCulturelles && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-sm font-medium text-flat-fg">Pratiques sportives et culturelles</h4>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-flat-fg whitespace-pre-wrap">{activites.PratiquesSportivesCulturelles}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lettre de motivation */}
      {donneesParcoursup.DonneesVoeux?.LettreDeMotivation && (
        <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-primary-500" />
            <h4 className="text-sm font-semibold text-flat-fg">Lettre de motivation</h4>
            <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">Importante</span>
          </div>
          <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto">
            <p
              className="text-sm text-flat-fg leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: donneesParcoursup.DonneesVoeux.LettreDeMotivation
                  .replace(/<br \/>/g, '\n')
                  .replace(/<br\/>/g, '\n')
                  .replace(/<br>/g, '\n')
              }}
            />
          </div>
        </div>
      )}

      {/* Questions-reponses */}
      {donneesParcoursup.QuestionsReponses && donneesParcoursup.QuestionsReponses.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-flat-fg mb-3">Questions et reponses</h4>
          <div className="space-y-3">
            {donneesParcoursup.QuestionsReponses.map((qr: any, index: number) => (
              <div key={index} className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold text-sm">Q:</span>
                  <p className="text-sm text-flat-fg font-medium">{qr.QuestionLibelle}</p>
                </div>
                <div className="flex items-start gap-3 mt-2">
                  <span className="text-amber-500 font-bold text-sm">R:</span>
                  <p className="text-sm text-flat-fg">{qr.ReponseLibelle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
