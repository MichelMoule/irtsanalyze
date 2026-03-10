import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '@/store/appStore';
import {
  ArrowLeft,
  User,
  Award,
  CheckCircle,
  Edit3,
  Save,
  X,
  Printer,
  Calendar,
  TrendingUp,
  Heart,
  MapPin,
  School,
} from 'lucide-react';
import { InfoPersonnelles } from '@/components/candidat/InfoPersonnelles';
import { Scolarite } from '@/components/candidat/Scolarite';
import { ActivitesInterets } from '@/components/candidat/ActivitesInterets';
import { AnalyseIADetail } from '@/components/candidat/AnalyseIADetail';
import { OralAdmissionForm } from '@/components/candidat/OralAdmissionForm';

export function CandidatDetailComplet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidats, updateCandidat, showNotification } = useAppStore();

  const [candidat, setCandidat] = useState<any>(null);
  const [cotationFinale, setCotationFinale] = useState<number>(0);
  const [commentaire, setCommentaire] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scolarite' | 'activites' | 'analyse' | 'oral' | 'notes'>('overview');

  useEffect(() => {
    if (id) {
      const foundCandidat = candidats.find(c => c.id === id);
      if (foundCandidat) {
        setCandidat(foundCandidat);
        setCotationFinale(foundCandidat.cotationFinale || foundCandidat.cotationIAProposee);
        setCommentaire(foundCandidat.commentaireEvaluateur || '');
      }
    }
  }, [id, candidats]);

  if (!candidat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-base font-semibold text-shine-text-primary mb-3">
            Candidat non trouve
          </h2>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary px-4 py-2 text-sm"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleEnregistrer = () => {
    updateCandidat(candidat.id, {
      cotationFinale,
      commentaireEvaluateur: commentaire,
      statut: 'en_relecture'
    });
    showNotification('Modifications enregistrees', 'success');
    setIsEditing(false);
  };

  const handleValider = async () => {
    setIsValidating(true);
    try {
      const validateur = { id: 'user-001', nom: 'Martin Dupont' };
      updateCandidat(candidat.id, {
        cotationFinale,
        commentaireEvaluateur: commentaire,
        statut: 'valide',
        validateurId: validateur.id,
        validateurNom: validateur.nom,
        dateValidation: new Date().toISOString()
      });

      const candidatsNonValides = candidats.filter(c => c.statut !== 'valide' && c.id !== candidat.id);
      if (candidatsNonValides.length === 0) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#4C35E0', '#E67E22', '#D4E157'] });
        showNotification('Tous les candidats ont ete valides !', 'success');
      } else {
        showNotification('Candidat valide avec succes', 'success');
      }
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch {
      showNotification('Erreur lors de la validation', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAnnuler = () => {
    setCotationFinale(candidat.cotationFinale || candidat.cotationIAProposee);
    setCommentaire(candidat.commentaireEvaluateur || '');
    setIsEditing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 6) return 'text-emerald-600 bg-emerald-50';
    if (score >= 4) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatutBadge = (statut: string) => {
    const colors: Record<string, string> = {
      importe: 'bg-slate-100 text-slate-600',
      en_analyse_ia: 'bg-blue-50 text-blue-600',
      analyse: 'bg-purple-50 text-purple-600',
      en_relecture: 'bg-amber-50 text-amber-600',
      valide: 'bg-emerald-50 text-emerald-600',
    };
    return colors[statut] || 'bg-slate-100 text-slate-600';
  };

  const donneesParcoursup = candidat.donneesParcoursup || {};

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-shine-border px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-shine-text-secondary hover:text-shine-text-primary transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            <div>
              <h1 className="text-lg font-semibold text-shine-text-primary">
                {candidat.nom} {candidat.prenom}
              </h1>
              <p className="text-xs text-shine-text-secondary">
                Dossier n{candidat.numeroDossier} &bull; {candidat.serieBac}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutBadge(candidat.statut)}`}>
              {candidat.statut.replace('_', ' ')}
            </span>

            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary px-3 py-1.5 text-sm flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-shine-border px-8">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: User },
            { id: 'scolarite', label: 'Parcours scolaire', icon: School },
            { id: 'activites', label: 'Activités', icon: Heart },
            { id: 'analyse', label: 'Analyse IA', icon: Award },
            { id: 'oral', label: 'Oral d\'admission', icon: User },
            { id: 'notes', label: 'Validation', icon: Edit3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-shine-text-secondary hover:text-shine-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Hero card */}
              <div className="bg-primary-50 rounded-xl border border-primary-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-shine-text-primary mb-1">
                      {candidat.prenom} {candidat.nom}
                    </h2>
                    <p className="text-sm text-shine-text-secondary mb-4">
                      Candidat au Diplome d'Etat d'Assistant de Service Social
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 text-sm text-shine-text-secondary">
                        <School className="w-3.5 h-3.5 text-primary-500" />
                        {candidat.serieBac}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-shine-text-secondary">
                        <MapPin className="w-3.5 h-3.5 text-primary-500" />
                        {candidat.etablissementOrigine}
                      </div>
                      {donneesParcoursup.DonneesCandidats?.DateNaissance && (
                        <div className="flex items-center gap-1.5 text-sm text-shine-text-secondary">
                          <Calendar className="w-3.5 h-3.5 text-primary-500" />
                          {calculerAge(donneesParcoursup.DonneesCandidats.DateNaissance)} ans
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center ml-6">
                    <div className={`text-3xl font-bold rounded-xl px-4 py-2 ${getScoreColor(candidat.cotationIAProposee)}`}>
                      {candidat.cotationIAProposee.toFixed(1)}
                    </div>
                    <p className="text-xs text-shine-text-secondary mt-1">Score IA</p>
                  </div>
                </div>
              </div>

              <InfoPersonnelles candidat={candidat} />

              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-xl border border-shine-border p-5">
                  <h3 className="text-sm font-semibold text-shine-text-primary mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary-500" />
                    Analyse IA
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-shine-text-secondary">Score:</span>
                      <span className="font-semibold">{candidat.cotationIAProposee.toFixed(1)}/8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-shine-text-secondary">Statut:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatutBadge(candidat.statut)}`}>
                        {candidat.statut}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-shine-border p-5">
                  <h3 className="text-sm font-semibold text-shine-text-primary mb-3 flex items-center gap-2">
                    <School className="w-4 h-4 text-primary-500" />
                    Scolarite
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-shine-text-secondary">Serie:</span>
                      <span className="font-medium">{candidat.serieBac}</span>
                    </div>
                    {candidat.moyenneGenerale && (
                      <div className="flex justify-between">
                        <span className="text-shine-text-secondary">Moyenne:</span>
                        <span className="font-medium">{candidat.moyenneGenerale.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-shine-border p-5">
                  <h3 className="text-sm font-semibold text-shine-text-primary mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-500" />
                    Validation
                  </h3>
                  <div className="space-y-2 text-sm">
                    {candidat.cotationFinale ? (
                      <div className="flex justify-between">
                        <span className="text-shine-text-secondary">Note finale:</span>
                        <span className="font-semibold text-amber-500">{candidat.cotationFinale.toFixed(1)}/8</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-shine-text-secondary">A valider</span>
                        <span className="text-shine-text-tertiary">-</span>
                      </div>
                    )}
                    {candidat.dateValidation && (
                      <div className="flex justify-between">
                        <span className="text-shine-text-secondary">Le:</span>
                        <span className="font-medium">{new Date(candidat.dateValidation).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scolarite' && <Scolarite candidat={candidat} />}

          {activeTab === 'activites' && <ActivitesInterets candidat={candidat} />}

          {activeTab === 'analyse' && (
            <div className="bg-white rounded-xl border border-shine-border p-6">
              <AnalyseIADetail candidat={candidat} />
            </div>
          )}

          {activeTab === 'oral' && (
            <div className="bg-white rounded-xl border border-shine-border p-6">
              {candidat.procedureAdmission === 'admis_de_droit' ? (
                <div className="text-center py-8 text-shine-text-tertiary">
                  <p className="text-sm">Candidat admis de droit (CA) — pas d'oral requis.</p>
                </div>
              ) : (
                <OralAdmissionForm
                  candidatId={candidat.id}
                  existingOral={candidat.oralAdmission}
                  onSaved={(oral) => {
                    updateCandidat(candidat.id, { oralAdmission: oral });
                    showNotification('Notes d\'oral enregistrées', 'success');
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-white rounded-xl border border-shine-border p-6">
              <h3 className="text-sm font-semibold text-shine-text-primary mb-5 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary-500" />
                Evaluation finale
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-shine-text-primary mb-2">
                      Cotation finale (0-8)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="0.5"
                      value={cotationFinale}
                      onChange={(e) => setCotationFinale(parseFloat(e.target.value))}
                      disabled={!isEditing && candidat.statut === 'valide'}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      title="Cotation finale"
                    />
                    <div className="flex justify-between text-xs text-shine-text-secondary mt-1">
                      <span>0</span>
                      <span className="font-medium text-primary-500">{cotationFinale.toFixed(1)}</span>
                      <span>8</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-shine-text-primary mb-2">
                      Commentaire evaluateur
                    </label>
                    <textarea
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      disabled={!isEditing && candidat.statut === 'valide'}
                      className="input min-h-[120px] resize-none"
                      placeholder="Vos observations sur ce candidat..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-shine-bg rounded-lg p-4">
                    <h4 className="text-sm font-medium text-shine-text-primary mb-2">Historique</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-shine-text-secondary">Importe le:</span>
                        <span>{new Date(candidat.dateImport).toLocaleDateString()}</span>
                      </div>
                      {candidat.dateValidation && (
                        <div className="flex justify-between">
                          <span className="text-shine-text-secondary">Valide le:</span>
                          <span>{new Date(candidat.dateValidation).toLocaleDateString()}</span>
                        </div>
                      )}
                      {candidat.validePar && (
                        <div className="flex justify-between">
                          <span className="text-shine-text-secondary">Par:</span>
                          <span>{candidat.validePar}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-shine-text-primary mb-2">Recommandation IA</h4>
                    <p className="text-sm text-shine-text-primary mb-1">
                      Score IA: <span className="font-semibold">{candidat.cotationIAProposee.toFixed(1)}/8</span>
                    </p>
                    <p className="text-xs text-shine-text-secondary">
                      Cette recommandation est basee sur l'analyse automatique du dossier.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-shine-border">
                <div className="flex items-center gap-3">
                  {candidat.statut !== 'valide' && (
                    <>
                      {!isEditing ? (
                        <button type="button" onClick={() => setIsEditing(true)} className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2">
                          <Edit3 className="w-4 h-4" />
                          Modifier
                        </button>
                      ) : (
                        <>
                          <button type="button" onClick={handleEnregistrer} className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Enregistrer
                          </button>
                          <button type="button" onClick={handleAnnuler} className="btn btn-secondary px-4 py-2 text-sm flex items-center gap-2">
                            <X className="w-4 h-4" />
                            Annuler
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {candidat.statut !== 'valide' && (
                    <button
                      type="button"
                      onClick={handleValider}
                      disabled={isValidating}
                      className="btn bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {isValidating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Validation...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Valider le dossier
                        </>
                      )}
                    </button>
                  )}

                  {candidat.statut === 'valide' && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Dossier valide</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
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
