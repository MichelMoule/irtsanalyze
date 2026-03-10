import { useState, useMemo } from 'react';
import { Candidat } from '@/types';
import { AnalyseurCandidatService, Indicateur, AnalyseDetailleeResult } from '@/services/analyseurCandidat';
import {
  BookOpen, Briefcase, Heart, AlertTriangle, Star, FileText,
  ChevronDown, ChevronRight, Eye, Database, CheckCircle2, XCircle,
  HelpCircle, Info, BarChart3, Target, Shield,
} from 'lucide-react';

interface AnalyseIADetailProps {
  candidat: Candidat;
}

// ─── Palier Labels ────────────────────────────────────────────────────────

const PALIER_LABELS_3: Record<number, { label: string; color: string; desc: string }> = {
  3:   { label: 'Excellent',       color: 'bg-emerald-500', desc: 'Profil très solide, compétences académiques très favorables' },
  2.5: { label: 'Très solide',     color: 'bg-emerald-400', desc: 'Bons à très bons résultats, dynamique positive' },
  2:   { label: 'Solide',          color: 'bg-sky-500',     desc: 'Niveau satisfaisant avec points forts identifiés' },
  1.5: { label: 'Moyen',           color: 'bg-amber-500',   desc: 'Résultats contrastés, à consolider' },
  1:   { label: 'Fragile',         color: 'bg-orange-500',  desc: 'Résultats fragiles, insuffisamment stabilisés' },
  0.5: { label: 'Très fragile',    color: 'bg-red-500',     desc: 'Difficultés importantes sur les fondamentaux' },
  0:   { label: 'Inévaluable',     color: 'bg-slate-400',   desc: 'Données insuffisantes (score 0 ≠ mauvais)' },
};

const PALIER_LABELS_2: Record<number, { label: string; color: string; desc: string }> = {
  2:   { label: 'Très construit',  color: 'bg-emerald-500', desc: 'Projet clair, étayé, compréhension des exigences' },
  1.5: { label: 'Solide',          color: 'bg-sky-500',     desc: 'Projet cohérent avec quelques éléments généraux' },
  1:   { label: 'Présent mais flou', color: 'bg-amber-500', desc: 'Argumentation déclarative, peu d\'éléments concrets' },
  0.5: { label: 'Fragile',         color: 'bg-orange-500',  desc: 'Incohérences ou confusions importantes' },
  0:   { label: 'Inévaluable',     color: 'bg-slate-400',   desc: 'Lettre absente ou inexploitable' },
};

// ─── Sub-components ────────────────────────────────────────────────────────

function PalierBadge({ palier, max }: { palier: number; max: number }) {
  const labels = max === 2 ? PALIER_LABELS_2 : PALIER_LABELS_3;
  const info = labels[palier] || labels[0];
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${info.color}`} />
      <span className="text-sm font-semibold text-shine-text-primary">{palier}/{max}</span>
      <span className="text-xs text-shine-text-secondary">— {info.label}</span>
    </div>
  );
}

function PalierScale({ palier, max }: { palier: number; max: number }) {
  const labels = max === 2 ? PALIER_LABELS_2 : PALIER_LABELS_3;
  const steps = max === 2 ? [0, 0.5, 1, 1.5, 2] : [0, 0.5, 1, 1.5, 2, 2.5, 3];

  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map(step => {
        const info = labels[step] || labels[0];
        const isActive = step === palier;
        return (
          <div key={step} className="flex flex-col items-center flex-1" title={`${step}/${max} — ${info.label}: ${info.desc}`}>
            <div className={`h-2 w-full rounded-sm transition-all ${isActive ? info.color : step <= palier ? info.color + '/30' : 'bg-slate-100'}`} />
            <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold text-shine-text-primary' : 'text-shine-text-tertiary'}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function IndicateurRow({ indicateur }: { indicateur: Indicateur }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = indicateur.disponible
    ? indicateur.valeur === 'negatif' || indicateur.valeur === false || indicateur.valeur === 'sauveur'
      ? <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
    : <HelpCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />;

  const bgColor = indicateur.disponible
    ? indicateur.valeur === 'negatif' || indicateur.valeur === false || indicateur.valeur === 'sauveur'
      ? 'bg-red-50/50 border-red-100'
      : 'bg-emerald-50/30 border-emerald-100'
    : 'bg-slate-50/50 border-slate-100';

  // Human-readable ID
  const label = indicateur.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className={`border rounded-lg px-3 py-2 ${bgColor}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
      >
        {statusIcon}
        <span className="text-xs font-medium text-shine-text-primary flex-1">{label}</span>
        {indicateur.disponible ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-shine-text-secondary">
            {typeof indicateur.valeur === 'boolean'
              ? indicateur.valeur ? 'Oui' : 'Non'
              : typeof indicateur.valeur === 'number'
                ? indicateur.valeur
                : indicateur.valeur
                  ? String(indicateur.valeur).substring(0, 40) + (String(indicateur.valeur).length > 40 ? '...' : '')
                  : '—'}
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 italic">Non renseigné</span>
        )}
        {expanded
          ? <ChevronDown className="w-3 h-3 text-shine-text-tertiary flex-shrink-0" />
          : <ChevronRight className="w-3 h-3 text-shine-text-tertiary flex-shrink-0" />
        }
      </button>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-slate-200/60">
          <p className="text-xs text-shine-text-secondary leading-relaxed">{indicateur.interpretation}</p>
        </div>
      )}
    </div>
  );
}

function DonneesSourceSection({ titre, icon: Icon, children }: { titre: string; icon: React.ElementType; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <Database className="w-3.5 h-3.5 text-slate-400" />
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs font-semibold text-shine-text-primary flex-1">{titre}</span>
        <span className="text-[10px] text-slate-400 mr-1">Données sources</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      {open && <div className="p-3 space-y-1 text-xs bg-white">{children}</div>}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-shine-text-secondary">{label}</span>
      <span className={`font-medium ${value !== null && value !== undefined && value !== '' && value !== 'non renseigné' ? 'text-shine-text-primary' : 'text-slate-400 italic'}`}>
        {value !== null && value !== undefined && value !== '' ? String(value) : 'Non renseigné'}
      </span>
    </div>
  );
}

function CritereSection({
  icon: Icon,
  title,
  noteStored,
  palierCalculated,
  max,
  commentaire,
  indicateurs,
  color,
  bgColor,
  children,
}: {
  icon: React.ElementType;
  title: string;
  noteStored?: number;
  palierCalculated: number;
  max: number;
  commentaire?: string;
  indicateurs: Indicateur[];
  color: string;
  bgColor: string;
  children?: React.ReactNode;
}) {
  const [showIndicateurs, setShowIndicateurs] = useState(false);
  const disponibles = indicateurs.filter(i => i.disponible).length;
  const total = indicateurs.filter(i => i.id !== 'DONNEES_MANQUANTES' && i.id !== 'INFORMATIONS_MANQUANTES').length;

  return (
    <div className="border border-shine-border rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className={`px-4 py-3 ${bgColor} border-b border-shine-border`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-shine-text-primary">{title}</h4>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-shine-text-tertiary">{total} indicateurs</span>
                <span className="text-[10px] text-emerald-600">{disponibles} disponibles</span>
                <span className="text-[10px] text-slate-400">{total - disponibles} manquants</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${
              (noteStored ?? palierCalculated) / max >= 0.75 ? 'text-emerald-600'
                : (noteStored ?? palierCalculated) / max >= 0.5 ? 'text-amber-600'
                : (noteStored ?? palierCalculated) > 0 ? 'text-red-500' : 'text-slate-400'
            }`}>
              {noteStored ?? palierCalculated}/{max}
            </div>
          </div>
        </div>
      </div>

      {/* Palier scale */}
      <div className="px-4 py-3 border-b border-slate-100">
        <PalierBadge palier={noteStored ?? palierCalculated} max={max} />
        <PalierScale palier={noteStored ?? palierCalculated} max={max} />
      </div>

      {/* Commentary */}
      {commentaire && (
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Commentaire IA (template Procédure V2)</span>
              <p className="text-xs text-shine-text-secondary leading-relaxed mt-1">{commentaire}</p>
            </div>
          </div>
        </div>
      )}

      {/* Source data */}
      {children && (
        <div className="px-4 py-2 border-b border-slate-100">
          {children}
        </div>
      )}

      {/* Indicateurs toggle */}
      <div className="px-4 py-2">
        <button
          type="button"
          onClick={() => setShowIndicateurs(!showIndicateurs)}
          className="w-full flex items-center gap-2 py-1.5 text-left group"
        >
          <Eye className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-xs font-semibold text-primary-500 group-hover:underline">
            {showIndicateurs ? 'Masquer' : 'Voir'} les {total} indicateurs évalués
          </span>
          <span className="text-[10px] text-slate-400 flex-1 text-right">Transparence complète</span>
          {showIndicateurs
            ? <ChevronDown className="w-3.5 h-3.5 text-primary-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-primary-400" />
          }
        </button>

        {showIndicateurs && (
          <div className="space-y-1.5 pt-2 pb-1">
            {indicateurs.filter(i => i.id !== 'DONNEES_MANQUANTES' && i.id !== 'INFORMATIONS_MANQUANTES').map(ind => (
              <IndicateurRow key={ind.id} indicateur={ind} />
            ))}
            {/* Données manquantes summary */}
            {indicateurs.find(i => i.id === 'DONNEES_MANQUANTES' || i.id === 'INFORMATIONS_MANQUANTES') && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] text-amber-700">
                    {indicateurs.find(i => i.id === 'DONNEES_MANQUANTES' || i.id === 'INFORMATIONS_MANQUANTES')?.interpretation}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function AnalyseIADetail({ candidat }: AnalyseIADetailProps) {
  const hasAnalyse = candidat.noteParcoursScolaire !== undefined ||
    candidat.noteExperiences !== undefined ||
    candidat.noteMotivation !== undefined;

  // Re-compute indicators for transparent display
  const analyse = useMemo<AnalyseDetailleeResult | null>(() => {
    if (!candidat.donneesParcoursup) return null;
    return AnalyseurCandidatService.getAnalyseDetaillee(candidat);
  }, [candidat]);

  if (!hasAnalyse) {
    return (
      <div className="p-6 text-center text-shine-text-tertiary">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Aucune analyse IA disponible pour ce candidat.</p>
        {candidat.procedureAdmission === 'admis_de_droit' && (
          <p className="text-xs mt-1">Candidat admis de droit (CA) — pas d'analyse requise.</p>
        )}
      </div>
    );
  }

  const noteTotal = candidat.cotationIAProposee || 0;
  const d = analyse?.donnees;

  return (
    <div className="space-y-4">
      {/* Bandeau transparence */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Transparence :</span> Cette analyse est 100% déterministe et auditable.
          Chaque indicateur ci-dessous montre les données sources utilisées et l'interprétation qui en découle.
          Un score de 0 signifie "données insuffisantes", jamais "mauvais".
        </p>
      </div>

      {/* En-tête avec note totale */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-shine-border">
        <div>
          <h3 className="text-base font-semibold text-shine-text-primary">Analyse IA — Procédure Admission V2</h3>
          <p className="text-xs text-shine-text-tertiary mt-0.5">
            {candidat.statutDemande === 'FI' ? 'Formation Initiale' :
             candidat.statutDemande === 'CA' ? "Contrat d'Apprentissage" :
             candidat.statutDemande === 'FI+CA' ? 'FI + CA' : 'Statut inconnu'}
            {candidat.filiereDemandee && ` — ${candidat.filiereDemandee}`}
          </p>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-shine-text-tertiary">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              53 indicateurs évalués
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Profile Matching (pas d'accumulation de points)
            </span>
          </div>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-bold ${
            noteTotal >= 6 ? 'text-emerald-600' : noteTotal >= 4 ? 'text-amber-600' : noteTotal > 0 ? 'text-red-500' : 'text-slate-400'
          }`}>
            {noteTotal}
          </div>
          <div className="text-xs text-shine-text-tertiary font-medium">/8 points</div>
          <div className="text-[10px] text-shine-text-tertiary mt-0.5">
            {noteTotal >= 6.5 ? 'Très favorable' : noteTotal >= 5 ? 'Favorable' : noteTotal >= 3.5 ? 'Mitigé' : 'Évaluation approfondie'}
          </div>
        </div>
      </div>

      {/* Barres de synthèse rapide */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Parcours scolaire', note: candidat.noteParcoursScolaire ?? 0, max: 3, icon: BookOpen, color: 'text-blue-600' },
          { label: 'Expériences', note: candidat.noteExperiences ?? 0, max: 3, icon: Briefcase, color: 'text-purple-600' },
          { label: 'Motivation', note: candidat.noteMotivation ?? 0, max: 2, icon: Heart, color: 'text-rose-600' },
        ].map(c => {
          const ratio = c.note / c.max;
          return (
            <div key={c.label} className="bg-white border border-shine-border rounded-lg p-3 text-center">
              <c.icon className={`w-4 h-4 ${c.color} mx-auto mb-1`} />
              <div className={`text-lg font-bold ${
                ratio >= 0.75 ? 'text-emerald-600' : ratio >= 0.5 ? 'text-amber-600' : ratio > 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {c.note}/{c.max}
              </div>
              <div className="text-[10px] text-shine-text-tertiary">{c.label}</div>
              <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${
                  ratio >= 0.75 ? 'bg-emerald-500' : ratio >= 0.5 ? 'bg-amber-500' : ratio > 0 ? 'bg-red-400' : 'bg-slate-300'
                }`} style={{ width: `${ratio * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════ CRITÈRE 1 : PARCOURS SCOLAIRE ══════ */}
      <CritereSection
        icon={BookOpen}
        title="Critère 1 — Parcours scolaire / universitaire / notes BAC"
        noteStored={candidat.noteParcoursScolaire}
        palierCalculated={analyse?.palierScolaire ?? 0}
        max={3}
        commentaire={candidat.commentaireParcoursScolaire}
        indicateurs={analyse?.indicateursScolaires ?? []}
        color="bg-blue-100 text-blue-600"
        bgColor="bg-blue-50/50"
      >
        {d && (
          <DonneesSourceSection titre="Données scolaires extraites du dossier" icon={BookOpen}>
            <DataRow label="Type de bac" value={d.bac.type} />
            <DataRow label="Série" value={d.bac.serie || 'non renseigné'} />
            <DataRow label="Spécialités" value={d.bac.specialites.length > 0 ? d.bac.specialites.join(', ') : 'non renseigné'} />
            <DataRow label="Bac obtenu" value={d.bac.obtenu === true ? `Oui (${d.bac.anneeObtention || '?'})` : d.bac.enCours ? 'En cours (terminale)' : 'Non renseigné'} />
            <div className="border-t border-slate-100 my-1" />
            <DataRow label="Moyenne générale" value={d.notesBac.moyenneGenerale !== null ? `${d.notesBac.moyenneGenerale}/20` : null} />
            <DataRow label="Français" value={d.notesBac.francais !== null ? `${d.notesBac.francais}/20` : null} />
            <DataRow label="Philosophie" value={d.notesBac.philosophie !== null ? `${d.notesBac.philosophie}/20` : null} />
            <DataRow label="Histoire-Géo" value={d.notesBac.histoireGeo !== null ? `${d.notesBac.histoireGeo}/20` : null} />
            <DataRow label="SES" value={d.notesBac.ses !== null ? `${d.notesBac.ses}/20` : null} />
            <DataRow label="Langues" value={d.notesBac.langues !== null ? `${d.notesBac.langues}/20` : null} />
            {d.notesBac.st2s.length > 0 && d.notesBac.st2s.map((n, i) => (
              <DataRow key={i} label={n.matiere} value={`${n.note}/20`} />
            ))}
            <div className="border-t border-slate-100 my-1" />
            <DataRow label="Études supérieures" value={d.scolarite.aEtudesSup ? d.scolarite.detailSup : 'Non'} />
            <DataRow label="Redoublement" value={d.scolarite.aRedouble ? 'Oui (signalé factuellement)' : 'Non identifié'} />
            <DataRow label="Rupture parcours" value={d.scolarite.aRupture ? 'Oui (signalée factuellement)' : 'Non identifiée'} />
            <DataRow label="Appréciations" value={d.appreciations.disponible ? 'Disponibles' : 'Non renseignées dans le dossier'} />
            <DataRow label="Notes bac détaillées" value={d.notesBac.toutesNotes.length > 0 ? `${d.notesBac.toutesNotes.length} note(s)` : 'Aucune'} />
          </DonneesSourceSection>
        )}
      </CritereSection>

      {/* ══════ CRITÈRE 2 : EXPÉRIENCES ══════ */}
      <CritereSection
        icon={Briefcase}
        title="Critère 2 — Expériences personnelles et professionnelles"
        noteStored={candidat.noteExperiences}
        palierCalculated={analyse?.palierExperiences ?? 0}
        max={3}
        commentaire={candidat.commentaireExperiences}
        indicateurs={analyse?.indicateursExperiences ?? []}
        color="bg-purple-100 text-purple-600"
        bgColor="bg-purple-50/50"
      >
        {d && (
          <DonneesSourceSection titre="Données d'expériences extraites du dossier" icon={Briefcase}>
            <DataRow label="Expériences professionnelles" value={d.activites.experiencesPro.length > 0 ? d.activites.experiencesPro.substring(0, 150) + (d.activites.experiencesPro.length > 150 ? '...' : '') : null} />
            <DataRow label="Engagements citoyens" value={d.activites.engagementsCitoyen.length > 0 ? d.activites.engagementsCitoyen.substring(0, 150) + (d.activites.engagementsCitoyen.length > 150 ? '...' : '') : null} />
            <DataRow label="Expériences d'encadrement" value={d.activites.encadrement.length > 0 ? d.activites.encadrement.substring(0, 150) + (d.activites.encadrement.length > 150 ? '...' : '') : null} />
            <DataRow label="Sport / Culture" value={d.activites.sportCulture.length > 0 ? d.activites.sportCulture.substring(0, 150) + (d.activites.sportCulture.length > 150 ? '...' : '') : null} />
            <DataRow label="Volume texte total" value={`${d.activites.texteComplet.length} caractères`} />
          </DonneesSourceSection>
        )}
      </CritereSection>

      {/* ══════ CRITÈRE 3 : MOTIVATION ══════ */}
      <CritereSection
        icon={Heart}
        title="Critère 3 — Motivation et projet professionnel"
        noteStored={candidat.noteMotivation}
        palierCalculated={analyse?.palierMotivation ?? 0}
        max={2}
        commentaire={candidat.commentaireMotivation}
        indicateurs={analyse?.indicateursMotivation ?? []}
        color="bg-rose-100 text-rose-600"
        bgColor="bg-rose-50/50"
      >
        {d && (
          <DonneesSourceSection titre="Lettre de motivation (données sources)" icon={Heart}>
            <DataRow label="Longueur lettre" value={`${d.motivation.longueur} caractères`} />
            <DataRow label="Filière demandée" value={d.formation.filiere || 'Non identifiée'} />
            {d.motivation.lettre.length > 0 && (
              <div className="mt-2">
                <span className="text-shine-text-secondary text-[10px] font-semibold">Extrait :</span>
                <p className="text-[11px] text-shine-text-secondary mt-1 p-2 bg-slate-50 rounded border border-slate-100 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {d.motivation.lettre.substring(0, 800)}{d.motivation.lettre.length > 800 ? '...' : ''}
                </p>
              </div>
            )}
          </DonneesSourceSection>
        )}
      </CritereSection>

      {/* Alertes */}
      {candidat.alertes && candidat.alertes.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h4 className="text-sm font-semibold text-red-700">Alertes ({candidat.alertes.length})</h4>
          </div>
          <ul className="space-y-1">
            {candidat.alertes.map((alerte, idx) => (
              <li key={idx} className="text-xs text-red-600 flex items-start gap-1.5">
                <span className="mt-1 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                {alerte}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Éléments valorisants */}
      {candidat.elementsValorisants && candidat.elementsValorisants.length > 0 && (
        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-semibold text-emerald-700">Points forts ({candidat.elementsValorisants.length})</h4>
          </div>
          <ul className="space-y-1">
            {candidat.elementsValorisants.map((element, idx) => (
              <li key={idx} className="text-xs text-emerald-600 flex items-start gap-1.5">
                <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                {element}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Règles appliquées */}
      <div className="border border-slate-200 bg-slate-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-700">Règles inviolables appliquées (Procédure V2)</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {[
            'Score 0 = inévaluable (manque de données), jamais "mauvais"',
            'Ne jamais inventer d\'information manquante',
            'Ne pas pénaliser les terminales pour bac non obtenu',
            'Bac éloigné du social pas pénalisant si compétences transférables bonnes',
            'Ne pas surévaluer un bac social si notes/appréciations faibles',
            'Peu d\'expériences : ne pas pénaliser automatiquement',
            '"Beau discours" ≠ motivation réelle : appui sur éléments concrets',
            'Qualité de langue : critère de clarté, pas de discrimination sociale',
            'Reconversion/parcours atypique : valoriser cohérence et maturité',
            'Plus c\'est précis (missions, dates, publics) → plus c\'est valorisable',
          ].map((regle, idx) => (
            <div key={idx} className="flex items-start gap-1.5 py-0.5">
              <CheckCircle2 className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-[10px] text-slate-600">{regle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Oral d'admission */}
      {candidat.oralAdmission && candidat.oralAdmission.noteTotal !== undefined && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-indigo-700">Oral d'admission</h4>
            <span className="text-lg font-bold text-indigo-600">{candidat.oralAdmission.noteTotal}/12</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Collectif', note: candidat.oralAdmission.noteParticipationCollectif ?? 0 },
              { label: 'Expression', note: candidat.oralAdmission.noteExpressionEmotions ?? 0 },
              { label: 'Analyse TS', note: candidat.oralAdmission.noteAnalyseTS ?? 0 },
              { label: 'Présentation', note: candidat.oralAdmission.notePresentationIndividuelle ?? 0 },
            ].map(c => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-xs text-indigo-600 w-20 text-right">{c.label}</span>
                <div className="flex-1 h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(c.note / 3) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-indigo-600 w-8 text-right">{c.note}/3</span>
              </div>
            ))}
          </div>
          {candidat.oralAdmission.jury1Nom && (
            <div className="mt-3 text-xs text-indigo-600">
              Jury : {candidat.oralAdmission.jury1Nom}
              {candidat.oralAdmission.jury2Nom && `, ${candidat.oralAdmission.jury2Nom}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
