import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Award,
  Mic2,
  GraduationCap,
  Briefcase,
  FileEdit,
  ExternalLink,
  Clock,
  AlertTriangle,
  Users,
  MapPin,
  Mail,
  Phone,
  Globe,
  BookOpen,
  Star,
  MessageSquare,
  HelpCircle,
  Monitor,
  Save,
  UserPlus,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { ExportService } from '@/services/exportService';
import { STATUT_LABELS, STATUT_COLORS, WORKFLOW_STEPS, canValidate, canReject, canRelecture, type StatutCandidat } from '@/lib/workflow';
import { AnalyseIADetail } from '@/components/candidat/AnalyseIADetail';
import { OralAdmissionForm } from '@/components/candidat/OralAdmissionForm';
import { Badge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { DataLoaderService } from '@/services/dataLoaderService';
import type { EvaluateurAssigne } from '@/types';

const TABS = [
  { id: 'dossier', label: 'Dossier Academique', icon: FileText },
  { id: 'analyse', label: 'Analyse IA Expert', icon: Award },
  { id: 'oral', label: 'Evaluation Orale', icon: Mic2 },
];

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

function formatAdresse(dc: any): string {
  const parts = [];
  if (dc.CoordonneesLignedadresseUn) parts.push(dc.CoordonneesLignedadresseUn);
  if (dc.CoordonneesLignedadresseDeux) parts.push(dc.CoordonneesLignedadresseDeux);
  if (dc.CoordonneesLignedadresseTrois) parts.push(dc.CoordonneesLignedadresseTrois);
  const ville = `${dc.CoordonneesCodepostal || ''} ${dc.CoordonneesLibellecommune || ''}`.trim();
  if (ville) parts.push(ville);
  return parts.join(', ') || 'Non renseignee';
}

// Fiche Avenir rating to visual
function AvisLevel({ code, label }: { code?: number; label?: string }) {
  if (!label || label === 'Non renseigné') return <span className="text-xs text-slate-400">N/R</span>;
  const colors: Record<number, string> = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-amber-100 text-amber-700',
    3: 'bg-emerald-100 text-emerald-700',
    4: 'bg-emerald-200 text-emerald-800',
  };
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${colors[code || 0] || 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  );
}

export function CandidatDetailComplet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidats, setCandidats, updateCandidat, showNotification, saveBrouillon, ajouterEntreeJournal, assignerEvaluateur, retirerEvaluateur, marquerConsultation } = useAppStore();
  const { user } = useAuth();

  const [candidat, setCandidat] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dossier');
  const [cotationFinale, setCotationFinale] = useState<number>(0);
  const [noteScolaire, setNoteScolaire] = useState<number>(0);
  const [noteExperiences, setNoteExperiences] = useState<number>(0);
  const [noteMotivation, setNoteMotivation] = useState<number>(0);
  const [notesEvaluateur, setNotesEvaluateur] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [hasDraftChanges, setHasDraftChanges] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectMotif, setRejectMotif] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [journalExpanded, setJournalExpanded] = useState<boolean>(false);
  const [assignSelectedMember, setAssignSelectedMember] = useState<string>(user?.id || '');
  const [assignSelectedRole, setAssignSelectedRole] = useState<'referent' | 'co-evaluateur' | 'observateur'>('co-evaluateur');

  // Track changes for draft indicator
  const markChanged = () => setHasDraftChanges(true);

  // If store is empty on mount (direct URL / page refresh), load all candidates
  useEffect(() => {
    if (candidats.length === 0 && id) {
      DataLoaderService.chargerCandidats()
        .then(loaded => {
          if (loaded.length > 0) setCandidats(loaded);
          else setLoadError('Aucun candidat trouvé');
        })
        .catch(() => setLoadError('Erreur de chargement'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize form values ONLY when navigating to a new candidat (id change)
  // Also triggers when candidats go from empty→loaded after fetch above
  useEffect(() => {
    if (!id || candidats.length === 0) return;
    const found = candidats.find(c => c.id === id);
    if (!found) return;
    setCandidat(found);

    // Load from draft if exists, otherwise from final/IA
    const draft = found.brouillon;
    if (draft) {
      setCotationFinale(draft.cotation);
      setNoteScolaire(draft.noteParcoursScolaire ?? found.noteParcoursScolaire ?? 0);
      setNoteExperiences(draft.noteExperiences ?? found.noteExperiences ?? 0);
      setNoteMotivation(draft.noteMotivation ?? found.noteMotivation ?? 0);
      setNotesEvaluateur(draft.commentaire);
    } else {
      setCotationFinale(found.cotationFinale || found.cotationIAProposee || 0);
      setNoteScolaire(found.noteParcoursScolaire || 0);
      setNoteExperiences(found.noteExperiences || 0);
      setNoteMotivation(found.noteMotivation || 0);
      setNotesEvaluateur(found.commentaireEvaluateur || '');
    }
    setHasDraftChanges(false);

    // Mark consultation for current user
    if (user && found.evaluateursAssignes?.some((e: EvaluateurAssigne) => e.id === user.id && !e.aConsulte)) {
      marquerConsultation(found.id, user.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, candidats.length]);

  // Keep candidat object in sync with store for display (journal, evaluateurs, statut)
  // but do NOT reset form values
  useEffect(() => {
    if (!id) return;
    const found = candidats.find(c => c.id === id);
    if (found) setCandidat(found);
  }, [id, candidats]);

  if (!candidat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {loadError ? (
            <>
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 mb-1">{loadError}</p>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm text-[#314ace] hover:underline"
              >
                Retour au dashboard
              </button>
            </>
          ) : (
            <>
              <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-flat-text-secondary">Chargement du dossier...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const isValide = candidat.statut === 'valide';
  const isRejete = candidat.statut === 'rejete';
  const isListeAttente = candidat.statut === 'liste_attente';
  const isTerminal = isValide || isRejete;

  const currentUserName = user ? `${user.prenom} ${user.nom}` : 'Evaluateur';
  const currentUserId = user?.id || 'anonymous';
  const currentUserAvatar = user?.avatar || undefined;

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      saveBrouillon(candidat.id, {
        cotation: cotationFinale,
        noteParcoursScolaire: noteScolaire,
        noteExperiences: noteExperiences,
        noteMotivation: noteMotivation,
        commentaire: notesEvaluateur,
        dateSauvegarde: new Date().toISOString(),
        auteurId: currentUserId,
        auteurNom: currentUserName,
        auteurAvatar: currentUserAvatar,
      });
      setHasDraftChanges(false);
      showNotification('Brouillon sauvegarde', 'success');
    } catch {
      showNotification('Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleValidation = async () => {
    setIsValidating(true);
    try {
      // Persist to API
      await api.validateCandidat(candidat.id, {
        cotationFinale,
        commentaireEvaluateur: notesEvaluateur,
        validateurNom: currentUserName,
        auteurId: currentUserId,
      });
      // Update local store
      updateCandidat(candidat.id, {
        cotationFinale,
        noteParcoursScolaire: noteScolaire,
        noteExperiences: noteExperiences,
        noteMotivation: noteMotivation,
        commentaireEvaluateur: notesEvaluateur,
        statut: 'valide',
        validateurId: currentUserId,
        validateurNom: currentUserName,
        dateValidation: new Date().toISOString(),
        brouillon: undefined,
      });
      ajouterEntreeJournal(candidat.id, {
        type: 'validation',
        auteurId: currentUserId,
        auteurNom: currentUserName,
        auteurAvatar: currentUserAvatar,
        description: `a validé le dossier (cotation ${cotationFinale}/8)`,
        details: `Parcours: ${noteScolaire ?? '-'}/3, Expériences: ${noteExperiences ?? '-'}/3, Motivation: ${noteMotivation ?? '-'}/2 = ${cotationFinale}/8${notesEvaluateur ? `\nCommentaire: ${notesEvaluateur}` : ''}`,
      });
      showNotification('Dossier validé avec succès', 'success');
      setTimeout(() => navigate('/dashboard'), 1400);
    } catch (err: any) {
      showNotification(err.message || 'Erreur lors de la validation', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleReject = async (motif: string) => {
    setIsValidating(true);
    try {
      await api.rejectCandidat(candidat.id, {
        motif,
        auteurNom: currentUserName,
        auteurId: currentUserId,
      });
      updateCandidat(candidat.id, {
        statut: 'rejete',
        commentaireEvaluateur: motif,
      });
      ajouterEntreeJournal(candidat.id, {
        type: 'rejet',
        auteurId: currentUserId,
        auteurNom: currentUserName,
        auteurAvatar: currentUserAvatar,
        description: `a rejeté le dossier${motif ? ` : ${motif}` : ''}`,
        details: motif,
      });
      showNotification('Dossier rejeté', 'success');
      setShowRejectModal(false);
    } catch (err: any) {
      showNotification(err.message || 'Erreur lors du rejet', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleListeAttente = async () => {
    setIsValidating(true);
    try {
      await api.updateCandidat(candidat.id, {
        statut: 'liste_attente',
        auteurNom: currentUserName,
        auteurId: currentUserId,
      });
      updateCandidat(candidat.id, { statut: 'liste_attente' });
      ajouterEntreeJournal(candidat.id, {
        type: 'liste_attente',
        auteurId: currentUserId,
        auteurNom: currentUserName,
        auteurAvatar: currentUserAvatar,
        description: 'a placé le dossier en liste d\'attente',
      });
      showNotification('Dossier en liste d\'attente', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Erreur', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleMettreEnRelecture = async () => {
    setIsValidating(true);
    try {
      await api.mettreEnRelecture(candidat.id, {
        auteurNom: currentUserName,
        auteurId: currentUserId,
      });
      updateCandidat(candidat.id, {
        statut: 'en_relecture',
        relecteurId: currentUserId,
        relecteurNom: currentUserName,
        dateRelecture: new Date().toISOString(),
      });
      ajouterEntreeJournal(candidat.id, {
        type: 'consultation',
        auteurId: currentUserId,
        auteurNom: currentUserName,
        auteurAvatar: currentUserAvatar,
        description: 'a pris le dossier en relecture',
      });
      showNotification('Dossier en relecture', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Erreur', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  // Equipe d'évaluateurs disponibles (dont Paula en dur)
  const EQUIPE_EVALUATEURS = [
    ...(user ? [{ id: user.id, prenom: user.prenom, nom: user.nom, avatar: user.avatar }] : []),
    { id: 'eval-paula', prenom: 'Paula', nom: 'Music', avatar: undefined as string | undefined },
    { id: 'eval-jean', prenom: 'Jean', nom: 'Dupont', avatar: undefined as string | undefined },
    { id: 'eval-marie', prenom: 'Marie', nom: 'Lefebvre', avatar: undefined as string | undefined },
  ].filter((v, i, a) => a.findIndex(e => e.id === v.id) === i); // dedup

  const handleAssignEvaluateur = () => {
    const member = EQUIPE_EVALUATEURS.find(e => e.id === assignSelectedMember);
    if (!member) return;
    const alreadyAssigned = (candidat.evaluateursAssignes || []).some((e: EvaluateurAssigne) => e.id === member.id);
    if (alreadyAssigned) {
      showNotification(`${member.prenom} ${member.nom} est deja assigne`, 'info');
      setShowAssignModal(false);
      return;
    }
    const isSelf = user && member.id === user.id;
    assignerEvaluateur(candidat.id, {
      id: member.id,
      nom: member.nom,
      prenom: member.prenom,
      avatar: member.avatar,
      role: assignSelectedRole,
      dateAssignation: new Date().toISOString(),
      aConsulte: isSelf ? true : false,
      dateConsultation: isSelf ? new Date().toISOString() : undefined,
      aEvalue: false,
    });
    setShowAssignModal(false);
    showNotification(`${member.prenom} ${member.nom} assigne comme ${assignSelectedRole}`, 'success');
  };

  const dp = candidat.donneesParcoursup || {};
  const dc = dp.DonneesCandidats || {};
  const bac = dp.Baccalaureat || {};
  const ficheAvenir = dp.FicheAvenir || {};
  const criteresSociaux = dp.CriteresSociaux || {};
  const activites = dp.ActivitesCentresInteret || {};
  const scolarite = dp.Scolarite || [];
  const certifPix = dp.CertificationPix || {};
  const pixDomaines = dp.ResultatsPixParDomainesCompetences || [];
  const donneesVoeux = dp.DonneesVoeux || {};
  const questionsReponses = dp.QuestionsReponses || [];
  const notesBac = dp.NotesBaccalaureat || [];
  const hasAlertes = candidat.alertes && candidat.alertes.length > 0;
  const age = candidat.dateNaissance ? calculerAge(candidat.dateNaissance) : null;

  const scolariteTriee = [...scolarite].sort((a: any, b: any) => (a.AnneeScolaireCode || 0) - (b.AnneeScolaireCode || 0));

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Candidate Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              title="Retour au tableau de bord"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                <span className="text-lg font-bold text-slate-500">
                  {candidat.prenom?.[0]}{candidat.nom?.[0]}
                </span>
              </div>
              {isValide && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {candidat.prenom} {candidat.nom}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 flex-wrap">
                <span className="font-mono text-xs">{candidat.numeroDossier}</span>
                {age && (
                  <>
                    <span className="text-slate-300">&bull;</span>
                    <span>{age} ans</span>
                  </>
                )}
                <span className="text-slate-300">&bull;</span>
                <Badge status={candidat.statut} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {TABS.map(({ id: tabId, label }) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    activeTab === tabId
                      ? 'bg-white text-[#314ace] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => ExportService.exporterCandidatPDF(candidat)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Exporter en PDF"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Workflow Progress Bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-3">
        <div className="flex items-center gap-1">
          {WORKFLOW_STEPS.map((step, i) => {
            const currentIdx = WORKFLOW_STEPS.indexOf(candidat.statut as StatutCandidat);
            const stepIdx = i;
            const isCurrent = candidat.statut === step;
            const isPast = currentIdx >= 0 && stepIdx < currentIdx;
            const isSpecial = candidat.statut === 'rejete' || candidat.statut === 'liste_attente';
            const colors = STATUT_COLORS[step];

            return (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  isCurrent && !isSpecial
                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ${colors.border.replace('border', 'ring')}`
                    : isPast && !isSpecial
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-gray-50 text-slate-400'
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                    isCurrent && !isSpecial ? `${colors.dot} text-white` : isPast && !isSpecial ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-slate-400'
                  }`}>
                    {isPast && !isSpecial ? '✓' : i + 1}
                  </span>
                  {STATUT_LABELS[step]}
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${isPast && !isSpecial ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        {/* Special status indicator (rejete / liste_attente) */}
        {(isRejete || isListeAttente) && (
          <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
            isRejete ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isRejete ? 'bg-red-500' : 'bg-orange-500'}`} />
            {STATUT_LABELS[candidat.statut as StatutCandidat]}
            {candidat.commentaireEvaluateur && <span className="text-xs font-normal ml-2">— {candidat.commentaireEvaluateur}</span>}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Main content */}
        <div className="flex-1 min-w-0 px-5 lg:px-6 py-5 overflow-y-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >

            {/* ══════════════════════════════════
                DOSSIER TAB
            ══════════════════════════════════ */}
            {activeTab === 'dossier' && (
              <div className="space-y-6">

                {/* ── 1. Informations Personnelles ── */}
                <Section icon={<Users className="w-4 h-4 text-[#314ace]" />} title="Informations Personnelles" color="bg-[#314ace]/10">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <InfoField label="Nom complet" value={`${dc.Civilite || ''} ${candidat.prenom} ${candidat.nom}`.trim()} />
                    <InfoField label="Date de naissance" value={candidat.dateNaissance || dc.DateNaissance} icon={<Clock className="w-3 h-3" />} />
                    <InfoField label="INE" value={dc.INECandidat} mono />
                    <InfoField label="Nationalite" value={dc.TypeNationalite === 'FR' ? 'Francaise' : dc.TypeNationalite} />
                    <InfoField label="Email" value={candidat.email || dc.CoordonneesAdressemail} icon={<Mail className="w-3 h-3" />} />
                    <InfoField label="Telephone" value={dc.CoordonneesTelephonemobile || dc.CoordonneesTelephonefixe || candidat.telephone} icon={<Phone className="w-3 h-3" />} />
                    <InfoField label="Adresse" value={formatAdresse(dc)} icon={<MapPin className="w-3 h-3" />} span2 />
                    <InfoField label="Profil" value={dc.ProfilCandidatLibelle} />
                    <InfoField label="Statut boursier" value={criteresSociaux.CandidatboursierLibelle} />
                    {dc.SportifOuArtisteLibelle && dc.SportifOuArtisteLibelle !== 'Ni sportif, ni artiste' && (
                      <InfoField label="Sport/Art" value={dc.SportifOuArtisteLibelle} />
                    )}
                  </div>
                </Section>

                {/* ── 2. Formation demandee & Candidature ── */}
                <Section icon={<FileText className="w-4 h-4 text-violet-500" />} title="Candidature" color="bg-violet-50">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <InfoField label="Formation demandee" value={donneesVoeux.FormationVoeuxLibelle} span2 />
                    <InfoField label="Date de candidature" value={donneesVoeux.DateCandidature} />
                    <InfoField label="Confirmation" value={donneesVoeux.CandidatureConfirmeeLibelle} />
                    <InfoField label="Etat du dossier" value={donneesVoeux.ClassementOuEtatDossierInscriptionLibelle} />
                    <InfoField label="Internat" value={donneesVoeux.DemandeInternatLibelle} />
                    <InfoField label="Amenagement handicap" value={donneesVoeux.AmenagementHandicapLibelle} />
                    {candidat.filiereDemandee && <InfoField label="Filiere" value={candidat.filiereDemandee} />}
                    {candidat.statutDemande && <InfoField label="Statut demande" value={candidat.statutDemande} />}
                    {candidat.procedureAdmission && <InfoField label="Procedure admission" value={candidat.procedureAdmission?.replace(/_/g, ' ')} />}
                  </div>
                </Section>

                {/* ── 3. Parcours Scolaire ── */}
                <Section icon={<GraduationCap className="w-4 h-4 text-[#314ace]" />} title="Parcours Scolaire & Baccalaureat" color="bg-[#314ace]/10">

                  {/* Bac summary */}
                  <div className="bg-[#e6ff82]/20 rounded-xl border border-[#e6ff82]/30 p-5 mb-5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type de diplome</p>
                        <p className="text-sm font-semibold text-slate-800">{bac.TypeDiplomeLibelle || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Serie / Specialite</p>
                        <p className="text-sm font-semibold text-slate-800">{bac.SerieDiplomeLibelle || '—'}</p>
                        {bac.SpecialiteLibelle && (
                          <p className="text-xs text-slate-500 mt-0.5">{bac.SpecialiteLibelle}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academie</p>
                        <p className="text-sm font-semibold text-slate-800">{bac.AcademieBacLibelle || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mention</p>
                        {bac.MentionObtenueLibelle ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                            {bac.MentionObtenueLibelle}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">En cours</span>
                        )}
                      </div>
                      {bac.LangueVivanteABaccalaureatLibelle && (
                        <InfoField label="LVA" value={bac.LangueVivanteABaccalaureatLibelle} />
                      )}
                      {bac.LangueVivanteBBaccalaureatLibelle && (
                        <InfoField label="LVB" value={bac.LangueVivanteBBaccalaureatLibelle} />
                      )}
                    </div>
                  </div>

                  {/* Notes du Baccalaureat */}
                  {notesBac.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Notes du Baccalaureat
                      </h3>

                      {/* Moyenne generale highlight */}
                      {(() => {
                        const moyenneNote = notesBac.find((n: any) => n.EpreuveLibelle === 'Moyenne générale' || n.EpreuveLibelle === 'Moyenne Générale');
                        if (!moyenneNote) return null;
                        const val = parseFloat((moyenneNote.NoteEpreuve || '0').replace(',', '.'));
                        const pct = (val / 20) * 100;
                        const r = 40;
                        const stroke = 6;
                        const circumference = 2 * Math.PI * r;
                        const offset = circumference - (pct / 100) * circumference;
                        const color = val >= 14 ? '#22c55e' : val >= 10 ? '#f59e0b' : '#ef4444';
                        return (
                          <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl border border-gray-100 p-5 mb-4 flex items-center gap-6">
                            <div className="flex-shrink-0">
                              <svg width="100" height="100" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
                                <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={stroke}
                                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                                  transform="rotate(-90 50 50)" className="transition-all duration-700" />
                                <text x="50" y="46" textAnchor="middle" className="fill-slate-800 text-lg font-extrabold" style={{ fontSize: '20px', fontWeight: 800 }}>
                                  {moyenneNote.NoteEpreuve}
                                </text>
                                <text x="50" y="62" textAnchor="middle" className="fill-slate-400" style={{ fontSize: '10px' }}>/20</text>
                              </svg>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-slate-800">Moyenne Generale</p>
                              <p className="text-sm text-slate-500 mt-0.5">
                                {val >= 16 ? 'Mention Tres Bien' : val >= 14 ? 'Mention Bien' : val >= 12 ? 'Mention Assez Bien' : val >= 10 ? 'Admis' : 'En dessous de la moyenne'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-xs font-semibold" style={{ color }}>
                                  {val >= 14 ? 'Excellent' : val >= 10 ? 'Satisfaisant' : 'Insuffisant'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Detail des epreuves */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {notesBac.filter((n: any) => n.EpreuveLibelle !== 'Moyenne générale' && n.EpreuveLibelle !== 'Moyenne Générale').map((note: any, i: number) => {
                          const noteVal = note.NoteEpreuve ? parseFloat(note.NoteEpreuve.replace(',', '.')) : null;
                          const pct = noteVal != null ? (noteVal / 20) * 100 : 0;
                          const color = noteVal != null && noteVal >= 14 ? 'emerald' : noteVal != null && noteVal >= 10 ? 'amber' : 'red';
                          const bgColors: Record<string, string> = { emerald: 'bg-emerald-50 border-emerald-100', amber: 'bg-amber-50 border-amber-100', red: 'bg-red-50 border-red-100' };
                          const textColors: Record<string, string> = { emerald: 'text-emerald-700', amber: 'text-amber-700', red: 'text-red-700' };
                          const barColors: Record<string, string> = { emerald: 'bg-emerald-400', amber: 'bg-amber-400', red: 'bg-red-400' };
                          return (
                            <div key={i} className={`rounded-xl border p-4 ${bgColors[color]}`}>
                              <div className="flex items-start justify-between mb-3">
                                <p className="text-sm font-semibold text-slate-700 leading-tight pr-2">{note.EpreuveLibelle}</p>
                                <span className={`text-lg font-extrabold tabular-nums ${textColors[color]} flex-shrink-0`}>
                                  {note.NoteEpreuve || 'N/A'}
                                </span>
                              </div>
                              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColors[color]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                              </div>
                              <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] text-slate-400">0</span>
                                <span className="text-[10px] text-slate-400">/20</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Parcours scolaire timeline */}
                  {scolariteTriee.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Historique scolaire
                      </h3>
                      <div className="space-y-3">
                        {scolariteTriee.map((annee: any, index: number) => (
                          <div key={index} className="bg-white rounded-xl border border-gray-100 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white bg-[#314ace] px-2 py-0.5 rounded">{annee.AnneeScolaireLibelle}</span>
                                <span className="text-sm font-semibold text-slate-800">{annee.NiveauEtudeLibelle}</span>
                                <span className="text-xs text-slate-400">{annee.SeriedeclasseLibelle || annee.ClassecandidatLibelle}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                annee.ScolarisationLibelle?.includes('scolarise') || annee.ScolarisationLibelle?.includes('scolarisé')
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {annee.ScolarisationLibelle || ''}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                              <div>
                                <span className="text-slate-400">Formation</span>
                                <p className="text-slate-700 font-medium">{annee.TypeFormationLibelle}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Type</span>
                                <p className="text-slate-700 font-medium">{annee.TypeClasseLibelle}</p>
                              </div>
                              {annee.NomEtablissementOrigine && (
                                <div className="lg:col-span-2">
                                  <span className="text-slate-400">Etablissement</span>
                                  <p className="text-slate-700 font-medium">{annee.NomEtablissementOrigine}</p>
                                  {annee.CommuneEtablissementOrigineLibelle && (
                                    <p className="text-slate-400">{annee.CommuneEtablissementOrigineLibelle} ({annee.DepartementEtablissementOrigineLibelle})</p>
                                  )}
                                </div>
                              )}
                              {annee.LangueVivanteAScolariteLibelle && (
                                <div>
                                  <span className="text-slate-400">Langues</span>
                                  <p className="text-slate-700 font-medium">
                                    {annee.LangueVivanteAScolariteLibelle}
                                    {annee.LangueVivanteBScolariteLibelle && ` / ${annee.LangueVivanteBScolariteLibelle}`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Moyennes calculees */}
                  {(candidat.moyenneGenerale || candidat.moyenneFrancais || candidat.moyenneMaths) && (
                    <div className="mt-5 bg-white rounded-xl border border-gray-100 p-5">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Moyennes extraites</h3>
                      <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
                        {candidat.moyenneGenerale != null && (
                          <MoyenneCard label="Generale" value={candidat.moyenneGenerale} primary />
                        )}
                        {candidat.moyenneFrancais != null && (
                          <MoyenneCard label="Francais" value={candidat.moyenneFrancais} />
                        )}
                        {candidat.moyennePhilosophie != null && (
                          <MoyenneCard label="Philosophie" value={candidat.moyennePhilosophie} />
                        )}
                        {candidat.moyenneHistoireGeo != null && (
                          <MoyenneCard label="Histoire-Geo" value={candidat.moyenneHistoireGeo} />
                        )}
                        {candidat.moyenneMaths != null && (
                          <MoyenneCard label="Maths" value={candidat.moyenneMaths} />
                        )}
                      </div>
                    </div>
                  )}
                </Section>

                {/* ── 4. Fiche Avenir ── */}
                {Object.keys(ficheAvenir).length > 0 && (
                  <Section icon={<Star className="w-4 h-4 text-amber-500" />} title="Fiche Avenir" color="bg-amber-50">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <AvisCard label="Methode de travail" code={ficheAvenir.AvisMethodeTravailCode} libelle={ficheAvenir.AvisMethodeTravailLibelle} />
                      <AvisCard label="Autonomie" code={ficheAvenir.AvisAutonomieEleveCode} libelle={ficheAvenir.AvisAutonomieEleveLibelle} />
                      <AvisCard label="Capacite a s'investir" code={ficheAvenir.AvisCapaciteInvestirCode} libelle={ficheAvenir.AvisCapaciteInvestirLibelle} />
                      <AvisCard label="Engagement citoyen" code={ficheAvenir.AvisEngagementCitoyenCode} libelle={ficheAvenir.AvisEngagementCitoyenLibelle} />
                    </div>

                    {ficheAvenir.NiveauClasseLibelle && (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-medium text-slate-500">Niveau de la classe :</span>
                        <span className="text-xs font-bold text-slate-700">{ficheAvenir.NiveauClasseLibelle}</span>
                      </div>
                    )}

                    {ficheAvenir.AvisCELibelle && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-600">Avis du Conseil de classe :</span>
                          <AvisLevel code={ficheAvenir.AvisCECode} label={ficheAvenir.AvisCELibelle} />
                        </div>
                        {ficheAvenir.AvisCEAppreciations && (
                          <p className="text-sm text-slate-700 leading-relaxed italic">
                            &laquo; {ficheAvenir.AvisCEAppreciations} &raquo;
                          </p>
                        )}
                      </div>
                    )}

                    {ficheAvenir.AutresElementsAppreciation && (
                      <div className="mt-3 bg-slate-50 rounded-lg p-4">
                        <span className="text-xs font-bold text-slate-600 block mb-1">Autres elements :</span>
                        <p className="text-sm text-slate-700 leading-relaxed italic">
                          &laquo; {ficheAvenir.AutresElementsAppreciation} &raquo;
                        </p>
                      </div>
                    )}
                  </Section>
                )}

                {/* ── 5. Experiences et Engagements ── */}
                <Section icon={<Briefcase className="w-4 h-4 text-amber-500" />} title="Experiences et Engagements" color="bg-amber-50">
                  {Object.keys(activites).length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {activites.ExperienceEncadrement && (
                        <ExperienceCard icon={<Users className="w-4 h-4 text-blue-500" />} title="Experiences d'encadrement" content={activites.ExperienceEncadrement} />
                      )}
                      {activites.EngagementsCitoyen && (
                        <ExperienceCard icon={<Globe className="w-4 h-4 text-emerald-500" />} title="Engagements citoyens" content={activites.EngagementsCitoyen} />
                      )}
                      {activites.ExperiencesProfessionnelles && (
                        <ExperienceCard icon={<Briefcase className="w-4 h-4 text-violet-500" />} title="Experiences professionnelles" content={activites.ExperiencesProfessionnelles} full />
                      )}
                      {activites.PratiquesSportivesCulturelles && (
                        <ExperienceCard icon={<Star className="w-4 h-4 text-amber-500" />} title="Pratiques sportives & culturelles" content={activites.PratiquesSportivesCulturelles} />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-400">Aucune activite ou experience renseignee</p>
                    </div>
                  )}
                </Section>

                {/* ── 6. Certification Pix ── */}
                {certifPix.PixStatutLibelle && (
                  <Section icon={<Monitor className="w-4 h-4 text-cyan-500" />} title="Certification Pix" color="bg-cyan-50">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-4">
                      <InfoField label="Statut" value={certifPix.PixStatutLibelle} />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Score global</p>
                        <span className="text-2xl font-extrabold text-slate-800 tabular-nums">{certifPix.PixScoreGlobal}</span>
                      </div>
                      <InfoField label="Niveau" value={certifPix.PixNiveauGlobal} />
                      <InfoField label="Date certification" value={certifPix.PixDateCertification} />
                    </div>

                    {pixDomaines.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Competences par domaine</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                          {pixDomaines.map((px: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                              <span className="text-xs text-slate-600 truncate pr-2">{px.PixCompetenceLibelle}</span>
                              <span className="text-xs font-bold text-slate-800 flex-shrink-0">Niv. {px.PixNiveau}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Section>
                )}

                {/* ── 7. Projet de Formation Motive ── */}
                <Section icon={<FileEdit className="w-4 h-4 text-violet-500" />} title="Projet de Formation Motive" color="bg-violet-50">
                  <div className="bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Lettre de Motivation</p>
                          <p className="text-xs text-slate-400">Document authentifie</p>
                        </div>
                      </div>
                      <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-[#314ace] hover:text-[#2a3fb8] transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Original PDF
                      </button>
                    </div>
                    <div className="px-5 py-5">
                      {donneesVoeux.LettreDeMotivation ? (
                        <div
                          className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: donneesVoeux.LettreDeMotivation
                              .replace(/<br \/>/g, '\n')
                              .replace(/<br\/>/g, '\n')
                              .replace(/<br>/g, '\n')
                          }}
                        />
                      ) : (
                        <p className="text-sm text-slate-400 italic">Aucune lettre de motivation disponible</p>
                      )}
                    </div>
                  </div>
                </Section>

                {/* ── 8. Questions / Reponses ── */}
                {questionsReponses.length > 0 && (
                  <Section icon={<HelpCircle className="w-4 h-4 text-indigo-500" />} title="Questions complementaires" color="bg-indigo-50">
                    <div className="space-y-2">
                      {questionsReponses.map((qr: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
                          <span className="text-sm text-slate-700">{qr.QuestionLibelle}</span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            qr.ReponseLibelle === 'OUI' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {qr.ReponseLibelle}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── 9. Elements IA extraits ── */}
                {(candidat.elementsValorisants?.length > 0 || candidat.syntheseAppreciations) && (
                  <Section icon={<MessageSquare className="w-4 h-4 text-emerald-500" />} title="Synthese & Elements cles" color="bg-emerald-50">
                    {candidat.syntheseAppreciations && (
                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-slate-700 leading-relaxed">{candidat.syntheseAppreciations}</p>
                      </div>
                    )}
                    {candidat.elementsValorisants?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {candidat.elementsValorisants.map((el: string, i: number) => (
                          <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">{el}</span>
                        ))}
                      </div>
                    )}
                  </Section>
                )}
              </div>
            )}

            {/* ══ ANALYSE IA TAB ══ */}
            {activeTab === 'analyse' && (
              <AnalyseIADetail candidat={candidat} />
            )}

            {/* ══ ORAL TAB ══ */}
            {activeTab === 'oral' && (
              <div className="max-w-4xl">
                {candidat.procedureAdmission === 'admis_de_droit' ? (
                  <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-flat-fg mb-1">Admis de droit (CA)</p>
                    <p className="text-xs text-flat-text-secondary">Pas d'oral requis.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <OralAdmissionForm
                      candidatId={candidat.id}
                      existingOral={candidat.oralAdmission}
                      onSaved={(oral) => {
                        updateCandidat(candidat.id, { oralAdmission: oral });
                        showNotification('Notes d\'oral enregistrees', 'success');
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto hidden lg:block">
          <div className="p-4 space-y-5">

            {/* ═══ Validation Pedagogique ═══ */}
            {activeTab === 'analyse' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-base font-bold text-[#314ace]">Evaluation</h3>
                    {hasDraftChanges && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modifications non sauvees</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                    Ajustez les notes par critere. Sauvegardez en brouillon a tout moment, puis validez definitivement quand vous etes pret.
                  </p>

                  {/* Per-criteria notes */}
                  <div className="space-y-3 mb-4">
                    <CriterionSlider
                      label="Parcours scolaire"
                      value={noteScolaire}
                      max={3}
                      step={0.5}
                      iaValue={candidat.noteParcoursScolaire}
                      disabled={isTerminal}
                      onChange={(v) => { setNoteScolaire(v); markChanged(); }}
                    />
                    <CriterionSlider
                      label="Experiences"
                      value={noteExperiences}
                      max={3}
                      step={0.5}
                      iaValue={candidat.noteExperiences}
                      disabled={isTerminal}
                      onChange={(v) => { setNoteExperiences(v); markChanged(); }}
                    />
                    <CriterionSlider
                      label="Motivation"
                      value={noteMotivation}
                      max={2}
                      step={0.5}
                      iaValue={candidat.noteMotivation}
                      disabled={isTerminal}
                      onChange={(v) => { setNoteMotivation(v); markChanged(); }}
                    />
                  </div>

                  {/* Cotation finale (auto-calculated or manual) */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cotation Finale</span>
                      <span className="text-xl font-black tabular-nums text-slate-800">
                        {cotationFinale}/8
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="8" step="0.5"
                      value={cotationFinale}
                      onChange={(e) => { setCotationFinale(parseFloat(e.target.value)); markChanged(); }}
                      disabled={isTerminal}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#314ace] disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Cotation finale"
                    />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">0</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">4</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">8</span>
                    </div>
                    {/* Auto-sum button */}
                    <button
                      type="button"
                      onClick={() => { setCotationFinale(noteScolaire + noteExperiences + noteMotivation); markChanged(); }}
                      disabled={isTerminal}
                      className="w-full mt-2 text-[10px] font-medium text-[#314ace] hover:underline disabled:opacity-40"
                    >
                      Recalculer depuis les sous-notes ({(noteScolaire + noteExperiences + noteMotivation).toFixed(1)}/8)
                    </button>
                  </div>

                  {/* Notes evaluateur */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Notes de l'evaluateur</label>
                    <textarea
                      value={notesEvaluateur}
                      onChange={(e) => { setNotesEvaluateur(e.target.value); markChanged(); }}
                      disabled={isTerminal}
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none min-h-[80px] focus:outline-none focus:border-[#314ace] focus:ring-1 focus:ring-[#314ace]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors placeholder:text-slate-400"
                      placeholder="Observations, points a verifier a l'oral..."
                    />
                  </div>

                  {/* Action buttons — workflow-aware */}
                  <div className="space-y-2">
                    {/* Save draft — only if not in terminal state */}
                    {!isTerminal && (
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSavingDraft}
                        className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                          hasDraftChanges
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-2 border-amber-500'
                            : 'border-2 border-[#314ace]/30 text-[#314ace] hover:bg-[#314ace]/5'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        {isSavingDraft ? 'Sauvegarde...' : hasDraftChanges ? 'Sauvegarder les modifications' : 'Sauvegarder en brouillon'}
                      </button>
                    )}

                    {/* Draft info */}
                    {candidat.brouillon && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Brouillon en cours</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <UserAvatar
                            src={candidat.brouillon.auteurAvatar || (user && candidat.brouillon.auteurId === user.id ? user.avatar : undefined)}
                            prenom={candidat.brouillon.auteurNom?.split(' ')[0]}
                            nom={candidat.brouillon.auteurNom?.split(' ').slice(1).join(' ')}
                            size="xs"
                            bgColor="bg-amber-500"
                            className="text-white"
                          />
                          <p className="text-[10px] text-amber-700">
                            {candidat.brouillon.auteurNom}, le {new Date(candidat.brouillon.dateSauvegarde).toLocaleDateString('fr-FR')} a {new Date(candidat.brouillon.dateSauvegarde).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="h-px bg-gray-100 my-1" />

                    {/* Statut actuel */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${STATUT_COLORS[candidat.statut as StatutCandidat]?.bg || 'bg-gray-100'} ${STATUT_COLORS[candidat.statut as StatutCandidat]?.text || 'text-slate-600'}`}>
                      <span className={`w-2 h-2 rounded-full ${STATUT_COLORS[candidat.statut as StatutCandidat]?.dot || 'bg-gray-400'}`} />
                      Statut : {STATUT_LABELS[candidat.statut as StatutCandidat] || candidat.statut}
                    </div>

                    {/* Passer en relecture — depuis "analyse" */}
                    {canRelecture(candidat) && !isValide && (
                      <button
                        type="button"
                        onClick={handleMettreEnRelecture}
                        disabled={isValidating}
                        className="w-full py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 text-sm font-bold hover:bg-amber-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Prendre en relecture
                      </button>
                    )}

                    {/* Validate — from analyse, en_relecture, liste_attente */}
                    {canValidate(candidat) && (
                      <button
                        type="button"
                        onClick={handleValidation}
                        disabled={isValidating}
                        className="w-full py-3 rounded-xl bg-[#314ace] hover:bg-[#2a3fb8] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Validation Definitive
                      </button>
                    )}

                    {/* Reject / Liste attente — from en_relecture, liste_attente */}
                    {(canReject(candidat) || isListeAttente) && (
                      <div className="grid grid-cols-2 gap-2">
                        {canReject(candidat) && (
                          <button
                            type="button"
                            onClick={() => { setRejectMotif(''); setShowRejectModal(true); }}
                            disabled={isValidating}
                            className="py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            Rejeter
                          </button>
                        )}
                        {!isListeAttente && candidat.statut === 'en_relecture' && (
                          <button
                            type="button"
                            onClick={handleListeAttente}
                            disabled={isValidating}
                            className="py-2.5 rounded-xl border-2 border-orange-200 text-orange-600 text-xs font-bold hover:bg-orange-50 transition-colors disabled:opacity-50"
                          >
                            Liste d'attente
                          </button>
                        )}
                      </div>
                    )}

                    {/* Re-open validated/rejected dossier */}
                    {(isValide || isRejete) && (
                      <button
                        type="button"
                        onClick={handleMettreEnRelecture}
                        disabled={isValidating}
                        className="w-full py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        Re-ouvrir le dossier
                      </button>
                    )}

                    {/* Terminal status display */}
                    {isValide && (
                      <div className="flex items-center justify-center gap-2 py-3 text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-bold">Dossier valide</span>
                      </div>
                    )}
                    {isRejete && (
                      <div className="flex items-center justify-center gap-2 py-3 text-red-600 bg-red-50 rounded-xl border border-red-200">
                        <X className="w-4 h-4" />
                        <span className="text-sm font-bold">Dossier rejete</span>
                      </div>
                    )}
                  </div>

                  {/* Last validation / rejection info */}
                  {candidat.dateValidation && (
                    <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isRejete ? 'Dernier rejet' : 'Derniere validation'}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Par {candidat.validateurNom || 'Evaluateur'}, le {new Date(candidat.dateValidation).toLocaleDateString('fr-FR')} a {new Date(candidat.dateValidation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100" />
              </>
            )}

            {/* ═══ Equipe d'evaluation ═══ */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Equipe d'Evaluation</h3>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(!showAssignModal)}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#314ace] hover:underline"
                >
                  <UserPlus className="w-3 h-3" />
                  Assigner
                </button>
              </div>

              {/* Assignment modal */}
              {showAssignModal && (
                <div className="bg-[#314ace]/5 border border-[#314ace]/20 rounded-xl p-3 mb-3 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Membre</p>
                    <select
                      value={assignSelectedMember}
                      onChange={(e) => setAssignSelectedMember(e.target.value)}
                      title="Selectionner un membre de l'equipe"
                      className="w-full px-2.5 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#314ace]"
                    >
                      {EQUIPE_EVALUATEURS.map(m => (
                        <option key={m.id} value={m.id}>{m.prenom} {m.nom}{user && m.id === user.id ? ' (moi)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Role</p>
                    <div className="flex gap-1.5">
                      {([['referent', 'Referent', 'text-amber-600 border-amber-300 bg-amber-50'], ['co-evaluateur', 'Co-eval.', 'text-blue-600 border-blue-300 bg-blue-50'], ['observateur', 'Observ.', 'text-slate-600 border-slate-300 bg-slate-50']] as const).map(([role, label, cls]) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setAssignSelectedRole(role)}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${assignSelectedRole === role ? cls : 'text-slate-400 border-gray-200 bg-white hover:bg-gray-50'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAssignEvaluateur}
                    className="w-full py-2 rounded-lg bg-[#314ace] text-white text-xs font-bold hover:bg-[#2a3fb8] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3 h-3" />
                    Assigner
                  </button>
                </div>
              )}

              {/* Evaluators list */}
              <div className="space-y-2">
                {(candidat.evaluateursAssignes || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-3">Aucun evaluateur assigne</p>
                ) : (
                  (candidat.evaluateursAssignes || []).map((ev: EvaluateurAssigne) => (
                    <div key={ev.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          src={ev.avatar || (user && ev.id === user.id ? user.avatar : undefined)}
                          prenom={ev.prenom}
                          nom={ev.nom}
                          size="sm"
                          bgColor={ev.role === 'referent' ? 'bg-amber-500' : ev.role === 'co-evaluateur' ? 'bg-blue-500' : 'bg-slate-400'}
                          className="text-white"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-700 leading-none">{ev.prenom} {ev.nom}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                              ev.role === 'referent' ? 'text-amber-600' : ev.role === 'co-evaluateur' ? 'text-blue-600' : 'text-slate-500'
                            }`}>
                              {ev.role === 'referent' ? 'Referent' : ev.role === 'co-evaluateur' ? 'Co-eval.' : 'Observ.'}
                            </span>
                            {ev.aConsulte && (
                              <span className="flex items-center gap-0.5 text-[9px] text-emerald-600">
                                <Eye className="w-2.5 h-2.5" /> Consulte
                              </span>
                            )}
                            {ev.aEvalue && (
                              <span className="flex items-center gap-0.5 text-[9px] text-[#314ace]">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Evalue
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => retirerEvaluateur(candidat.id, ev.id)}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Retirer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* ═══ Journal d'activite ═══ */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Journal d'Activite
                </h3>
                <button
                  type="button"
                  onClick={() => setJournalExpanded(!journalExpanded)}
                  className="text-[11px] font-medium text-[#314ace] hover:underline flex items-center gap-0.5"
                >
                  {journalExpanded ? <><ChevronUp className="w-3 h-3" /> Reduire</> : <><ChevronDown className="w-3 h-3" /> Tout voir</>}
                </button>
              </div>
              <div className="space-y-3">
                {(() => {
                  // Build combined journal: stored entries + legacy entries
                  const journal: { date: string; user: string; avatar?: string; auteurId?: string; action: string; type: string; details?: string }[] = [];

                  // Add stored journal entries
                  (candidat.journalActivite || []).forEach((e: { date: string; auteurId?: string; auteurNom: string; auteurAvatar?: string; description: string; type: string; details?: string }) => {
                    journal.push({ date: e.date, user: e.auteurNom, avatar: e.auteurAvatar, auteurId: e.auteurId, action: e.description, type: e.type, details: e.details });
                  });

                  // Add legacy entries if no journal yet
                  if (journal.length === 0) {
                    if (candidat.dateImport || candidat.statut !== 'importe') {
                      journal.push({ date: candidat.dateImport || new Date().toISOString(), user: 'Systeme', action: 'Dossier importe dans la plateforme', type: 'import' });
                    }
                    if (candidat.cotationIAProposee > 0) {
                      journal.push({ date: candidat.dateImport || new Date().toISOString(), user: 'Systeme IA', action: `a genere l'analyse predictive (${candidat.cotationIAProposee}/8)`, type: 'analyse_ia' });
                    }
                    if (candidat.dateRelecture) {
                      journal.push({ date: candidat.dateRelecture, user: candidat.relecteurNom || 'Relecteur', action: 'a consulte le dossier', type: 'consultation' });
                    }
                    if (candidat.dateValidation) {
                      journal.push({ date: candidat.dateValidation, user: candidat.validateurNom || 'Validateur', action: 'a valide le dossier', type: 'validation' });
                    }
                  }

                  // Sort newest first
                  journal.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  const displayed = journalExpanded ? journal : journal.slice(0, 5);

                  if (journal.length === 0) {
                    return <p className="text-xs text-slate-400 italic text-center py-3">Aucune activite enregistree</p>;
                  }

                  return displayed.map((entry, i) => (
                    <JournalEntry key={i} entry={entry} currentUser={user} />
                  ));
                })()}
              </div>
              {!journalExpanded && (candidat.journalActivite || []).length > 5 && (
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  +{(candidat.journalActivite || []).length - 5} entree(s) masquee(s)
                </p>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            {/* ═══ Alertes ═══ */}
            {hasAlertes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-amber-800">Attention necessaire</h3>
                </div>
                <ul className="space-y-1">
                  {candidat.alertes.map((a: string, i: number) => (
                    <li key={i} className="text-xs text-amber-700 leading-relaxed">{a}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Rejection Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Rejeter le dossier</h3>
            <p className="text-sm text-slate-500 mb-4">
              {candidat.prenom} {candidat.nom} — {candidat.numeroDossier}
            </p>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Motif du rejet
            </label>
            <textarea
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none min-h-[100px] focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-colors placeholder:text-slate-400"
              placeholder="Indiquez la raison du rejet..."
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectMotif)}
                disabled={isValidating}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {isValidating ? 'Rejet en cours...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════
   Sub-components
════════════════════════════════════ */

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>{icon}</div>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">{children}</div>
    </section>
  );
}

function InfoField({ label, value, icon, mono, span2 }: { label: string; value?: string; icon?: React.ReactNode; mono?: boolean; span2?: boolean }) {
  return (
    <div className={span2 ? 'lg:col-span-2' : ''}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-slate-700 flex items-center gap-1 ${mono ? 'font-mono text-xs' : ''}`}>
        {icon}{value || 'Non renseigne'}
      </p>
    </div>
  );
}

function MoyenneCard({ label, value, primary }: { label: string; value: number; primary?: boolean }) {
  const pct = (value / 20) * 100;
  const color = value >= 14 ? 'emerald' : value >= 10 ? 'amber' : 'red';
  const ringColors: Record<string, string> = { emerald: '#22c55e', amber: '#f59e0b', red: '#ef4444' };
  const r = 24;
  const stroke = 4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-xl p-3 ${primary ? 'bg-[#314ace]/5 border border-[#314ace]/15' : 'bg-slate-50 border border-gray-100'}`}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle cx="30" cy="30" r={r} fill="none" stroke={primary ? '#314ace' : ringColors[color]} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 30 30)" className="transition-all duration-700" />
        <text x="30" y="33" textAnchor="middle" className="fill-slate-800 font-extrabold" style={{ fontSize: '13px', fontWeight: 800 }}>
          {value.toFixed(1)}
        </text>
      </svg>
      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
}

function AvisCard({ label, code, libelle }: { label: string; code?: number; libelle?: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <AvisLevel code={code} label={libelle} />
    </div>
  );
}

function ExperienceCard({ icon, title, content, full }: { icon: React.ReactNode; title: string; content: string; full?: boolean }) {
  return (
    <div className={`bg-slate-50 rounded-xl p-4 ${full ? 'lg:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function CriterionSlider({ label, value, max, step, iaValue, disabled, onChange }: {
  label: string; value: number; max: number; step: number; iaValue?: number; disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          {iaValue !== undefined && iaValue !== value && (
            <span className="text-[9px] text-slate-400" title="Proposition IA">IA: {iaValue}/{max}</span>
          )}
          <span className="text-sm font-black tabular-nums text-slate-800">{value}/{max}</span>
        </div>
      </div>
      <input
        type="range" min="0" max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        title={`${label} : ${value}/${max}`}
        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#314ace] disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function JournalEntry({ entry, currentUser }: {
  entry: { date: string; user: string; avatar?: string; auteurId?: string; action: string; type: string; details?: string };
  currentUser?: { id: string; avatar?: string } | null;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const typeColors: Record<string, string> = {
    import: 'bg-slate-500',
    analyse_ia: 'bg-violet-500',
    consultation: 'bg-blue-400',
    brouillon: 'bg-amber-500',
    note_modifiee: 'bg-orange-500',
    commentaire: 'bg-sky-500',
    assignation: 'bg-indigo-500',
    validation: 'bg-emerald-500',
    rejet: 'bg-red-500',
    liste_attente: 'bg-amber-600',
    oral: 'bg-pink-500',
  };
  const color = typeColors[entry.type] || 'bg-slate-400';
  const d = new Date(entry.date);
  const timeStr = `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

  // Resolve avatar: stored in entry, or fallback to current user if same person
  const avatarSrc = entry.avatar || (currentUser && entry.auteurId === currentUser.id ? currentUser.avatar : undefined);
  const parts = entry.user.split(' ');

  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col items-center flex-shrink-0">
        <UserAvatar
          src={avatarSrc}
          prenom={parts[0]}
          nom={parts.slice(1).join(' ')}
          size="xs"
          bgColor={color}
          className="text-white"
        />
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>
      <div className="min-w-0 pb-3">
        <p className="text-[11px] text-slate-700 leading-snug">
          <span className="font-semibold">{entry.user}</span>{' '}{entry.action}
        </p>
        {entry.details && (
          <div className="mt-0.5">
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
            >
              {detailsOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              {detailsOpen ? 'Masquer' : 'Voir le détail'}
            </button>
            {detailsOpen && (
              <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-600 whitespace-pre-wrap">
                {entry.details}
              </div>
            )}
          </div>
        )}
        <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
          <Clock className="w-2.5 h-2.5" />{timeStr}
        </p>
      </div>
    </div>
  );
}
