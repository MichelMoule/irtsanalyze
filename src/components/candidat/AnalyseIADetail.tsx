import { useState, useMemo } from 'react';
import { Candidat } from '@/types';
import { AnalyseurCandidatService, Indicateur, AnalyseDetailleeResult } from '@/services/analyseurCandidat';
import {
  BookOpen, Briefcase, Heart, AlertTriangle, Star,
  ChevronDown, ChevronUp, CheckCircle2, XCircle,
  HelpCircle, Info, Shield, Zap, Eye,
  FileText, MessageSquare, Bot,
} from 'lucide-react';

interface AnalyseIADetailProps {
  candidat: Candidat;
}

/* ═══════════════════════════════════════════════════════════════════════
   SCORE RING — Grand cercle avec pourcentage
   ═══════════════════════════════════════════════════════════════════════ */

function ScoreRingLarge({ score, max }: { score: number; max: number }) {
  const ratio = max > 0 ? score / max : 0;
  const pct = Math.round(ratio * 100);
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - ratio * circumference;
  const color = ratio >= 0.75 ? '#10B981' : ratio >= 0.5 ? '#F59E0B' : ratio > 0 ? '#EF4444' : '#94A3B8';

  return (
    <div className="relative flex flex-col items-center">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#F1F5F9" strokeWidth="8" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 65 65)"
          className="transition-all duration-700 ease-out" />
        <text x="65" y="60" textAnchor="middle" className="fill-slate-800" style={{ fontSize: '36px', fontWeight: 900 }}>{pct}</text>
        <text x="65" y="78" textAnchor="middle" className="fill-slate-400" style={{ fontSize: '11px', fontWeight: 600 }}>SCORE IA</text>
      </svg>
      <span className="text-xs font-bold text-slate-600 tabular-nums mt-1">{score}/{max}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SUB-SCORE BAR — Barre de score par critère
   ═══════════════════════════════════════════════════════════════════════ */

function SubScoreBar({ label, note, max, color }: { label: string; note: number; max: number; color: string }) {
  const pct = max > 0 ? (note / max) * 100 : 0;
  const barColors: Record<string, string> = { blue: 'bg-[#314ace]', orange: 'bg-orange-500', green: 'bg-emerald-500' };
  const textColors: Record<string, string> = { blue: 'text-[#314ace]', orange: 'text-orange-600', green: 'text-emerald-600' };

  return (
    <div className="flex-1 min-w-[140px]">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1.5 mb-2 mt-1">
        <span className={`text-2xl font-black tabular-nums ${textColors[color]}`}>{note}</span>
        <span className="text-sm font-medium text-slate-400">/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColors[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INDICATOR LABELS & SOURCES
   ═══════════════════════════════════════════════════════════════════════ */

const INDICATOR_SOURCES: Record<string, string> = {
  BAC_OBTENU: 'Rubrique scolarite / bac',
  TYPE_BAC: 'Rubrique bac',
  SERIE_SPECIALITES: 'Rubrique bac / bulletins',
  COHERENCE_TS: 'Synthese (a partir du type)',
  FRANCAIS: 'Notes bac / bulletins',
  PHILOSOPHIE: 'Notes bac / bulletins',
  HISTOIRE_GEO: 'Notes bac / bulletins',
  SES: 'Notes / bulletins',
  LANGUES: 'Bulletins',
  MATIERES_SANITAIRE_SOCIALE: 'Bac techno/pro + bulletins',
  MOYENNE_GENERALE: 'Bulletins / releves',
  PROGRESSION: 'Bulletins (1ere/term, trimestres)',
  REGULARITE: 'Bulletins',
  ECARTS_MATIERES: 'Bulletins',
  REDOUBLEMENT: 'Parcours scolaire',
  RUPTURES: 'Parcours / dossier',
  ASSIDUITE: 'Appreciations / bulletins',
  SERIEUX: 'Appreciations',
  PARTICIPATION: 'Appreciations',
  QUALITE_REDACTIONNELLE: 'Appreciations (francais, philo, etc.)',
  COMPETENCES_ORALES: 'Appreciations / activites',
  TRAVAIL_GROUPE: 'Appreciations',
  ETUDES_SUP: 'Parcours post-bac',
  VALIDATION_SUP: 'Releves / parcours',
  APPRECIATIONS_SUP: 'Dossier / pieces',
  CONTRAINTES_DECLAREES: 'Rubriques dossier',
  DONNEES_MANQUANTES: 'Controle de completude',
  ENGAGEMENT_CITOYEN: 'Activites / engagements / CV / lettre',
  BENEVOLAT: 'Activites / engagements / CV / lettre',
  SERVICE_CIVIQUE: 'Parcours / experiences / CV',
  BAFA: 'Diplomes / CV / activites',
  EMPLOIS: 'Experiences / CV',
  LIEN_DIRECT_TS: 'CV / lettre / experiences',
  COMPETENCES_TRANSFERABLES: 'Lettre / experiences / appreciations',
  PRISE_RESPONSABILITE: 'Engagements / experiences',
  STABILITE_CONTINUITE: 'Chronologie CV',
  CAPACITE_ENSEIGNEMENTS: 'Lettre de motivation / projet',
  DIVERSITE_CONTEXTES: 'CV / activites',
  CONTRAINTES_VIE: 'Lettre / rubriques complementaires',
  PRECISION_INFORMATIONS: 'CV / lettre',
  CLARTE_PROJET: 'Lettre de motivation / projet',
  COHERENCE_FILIERE: 'Lettre + choix de formation',
  RAISONS_CHOIX: 'Lettre / reponses Parcoursup',
  APPUIS_EXPERIENCES: 'Lettre + CV',
  FAISABILITE: 'Lettre + parcours',
  REPRESENTATION_METIER: 'Lettre',
  MOTIVATION_INTRINSEQUE: 'Lettre',
  ANALYSE_PARCOURS: 'Lettre',
  PROJECTION_FORMATION: 'Lettre',
  PERSONNALISATION: 'Lettre',
  QUALITE_EXPRESSION: 'Lettre',
  RECONVERSION: 'Lettre + parcours',
  INFORMATIONS_MANQUANTES: 'Controle de completude',
};

const INDICATOR_LABELS: Record<string, string> = {
  BAC_OBTENU: 'Bac ou equivalent obtenu',
  TYPE_BAC: 'Type de bac (general / techno / pro)',
  SERIE_SPECIALITES: 'Serie / filiere / specialites',
  COHERENCE_TS: 'Coherence parcours ↔ travail social',
  FRANCAIS: 'Francais (expression / argumentation)',
  PHILOSOPHIE: 'Philosophie (reflexion / esprit critique)',
  HISTOIRE_GEO: 'Histoire-Geographie (culture G / contextes sociaux)',
  SES: 'SES / Sciences sociales',
  LANGUES: 'Langues (communication / ouverture)',
  MATIERES_SANITAIRE_SOCIALE: 'Enseignements sanitaire / sociale',
  MOYENNE_GENERALE: 'Moyenne generale / tendances',
  PROGRESSION: 'Progression dans le temps',
  REGULARITE: 'Regularite / stabilite des resultats',
  ECARTS_MATIERES: 'Ecarts entre matieres',
  REDOUBLEMENT: 'Redoublement / reorientation',
  RUPTURES: 'Ruptures / interruptions de parcours',
  ASSIDUITE: 'Assiduite (absences / retards)',
  SERIEUX: 'Serieux / implication / travail',
  PARTICIPATION: 'Participation / posture en classe',
  QUALITE_REDACTIONNELLE: 'Qualite redactionnelle',
  COMPETENCES_ORALES: 'Competences orales',
  TRAVAIL_GROUPE: 'Travail en groupe / cooperation',
  ETUDES_SUP: 'Existence d\'etudes superieures',
  VALIDATION_SUP: 'Validation / resultats dans le superieur',
  APPRECIATIONS_SUP: 'Appreciations / assiduite dans le superieur',
  CONTRAINTES_DECLAREES: 'Contraintes declarees impactant les resultats',
  ENGAGEMENT_CITOYEN: 'Engagement citoyen / associatif',
  BENEVOLAT: 'Benevolat (ponctuel vs regulier)',
  SERVICE_CIVIQUE: 'Service civique',
  BAFA: 'BAFA et experiences d\'animation',
  EMPLOIS: 'Emplois / jobs etudiants / stages',
  LIEN_DIRECT_TS: 'Experiences en lien direct avec le TS',
  COMPETENCES_TRANSFERABLES: 'Competences transferables utiles en TS',
  PRISE_RESPONSABILITE: 'Prise de responsabilites / autonomie',
  STABILITE_CONTINUITE: 'Stabilite / continuite / perseverance',
  CAPACITE_ENSEIGNEMENTS: 'Capacite a tirer des enseignements',
  DIVERSITE_CONTEXTES: 'Diversite des contextes',
  CONTRAINTES_VIE: 'Contraintes de vie (ne pas penaliser)',
  PRECISION_INFORMATIONS: 'Precision des informations fournies',
  CLARTE_PROJET: 'Clarte du projet (objectif / metier / champ)',
  COHERENCE_FILIERE: 'Coherence entre projet et filiere demandee',
  RAISONS_CHOIX: 'Raisons du choix (pourquoi cette formation ?)',
  APPUIS_EXPERIENCES: 'Appuis sur experiences (stages / benevolat / vecu)',
  FAISABILITE: 'Faisabilite du projet',
  REPRESENTATION_METIER: 'Representation du metier et des exigences',
  MOTIVATION_INTRINSEQUE: 'Motivation intrinseque et posture',
  ANALYSE_PARCOURS: 'Capacite a analyser son parcours',
  PROJECTION_FORMATION: 'Projection dans la formation',
  PERSONNALISATION: 'Personnalisation / authenticite',
  QUALITE_EXPRESSION: 'Qualite de l\'expression (clarte, structure)',
  RECONVERSION: 'Parcours atypique / reconversion',
};

/* ═══════════════════════════════════════════════════════════════════════
   INDICATOR STATUS HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

const negativeWhenTrue = ['REDOUBLEMENT', 'RUPTURES', 'POSTURE_SAUVEUR'];

function getIndicatorStatus(ind: Indicateur): 'positive' | 'negative' | 'missing' | 'neutral' {
  if (!ind.disponible) return 'missing';

  const isNeg = (
    ind.valeur === 'negatif' || ind.valeur === 'sauveur' || ind.valeur === 'flou' || ind.valeur === 'confus'
    || ind.valeur === 'générique' || ind.valeur === 'faible'
    || (negativeWhenTrue.includes(ind.id) && ind.valeur === true)
  );
  if (isNeg) return 'negative';

  const neutralValues = ['partiel', 'standard', 'correcte', 'ponctuel', 'déclaratif', 'neutre', 'indéterminé'];
  if (neutralValues.includes(ind.valeur as string)) return 'neutral';

  return 'positive';
}

function formatValue(ind: Indicateur): string {
  if (!ind.disponible) return 'Non disponible';
  if (typeof ind.valeur === 'boolean') return ind.valeur ? 'Oui' : 'Non';
  if (typeof ind.valeur === 'number') return String(ind.valeur);
  if (ind.valeur) {
    const s = String(ind.valeur);
    return s.length > 60 ? s.substring(0, 60) + '...' : s;
  }
  return '—';
}

/* ═══════════════════════════════════════════════════════════════════════
   INDICATOR TABLE — Tableau pour chaque critère
   ═══════════════════════════════════════════════════════════════════════ */

function IndicateurTable({ indicateurs }: { indicateurs: Indicateur[] }) {
  const realIndicateurs = indicateurs.filter(i => i.id !== 'DONNEES_MANQUANTES' && i.id !== 'INFORMATIONS_MANQUANTES');
  const metaIndicateur = indicateurs.find(i => i.id === 'DONNEES_MANQUANTES' || i.id === 'INFORMATIONS_MANQUANTES');

  const statusConfig = {
    positive: {
      bg: '',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      commentBg: 'bg-emerald-50/40',
    },
    negative: {
      bg: 'bg-amber-50/30',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      commentBg: 'bg-amber-50/40',
    },
    missing: {
      bg: 'bg-red-50/20',
      icon: <XCircle className="w-3.5 h-3.5 text-red-400" />,
      badge: 'bg-red-50 text-red-600 border-red-200',
      commentBg: 'bg-red-50/30',
    },
    neutral: {
      bg: '',
      icon: <Info className="w-3.5 h-3.5 text-slate-400" />,
      badge: 'bg-slate-50 text-slate-600 border-slate-200',
      commentBg: 'bg-slate-50/40',
    },
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-slate-50/80">
              <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-8"></th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Indicateur</th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[120px]">Source</th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[100px]">Valeur</th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> Commentaire IA</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {realIndicateurs.map((ind, idx) => {
              const status = getIndicatorStatus(ind);
              const cfg = statusConfig[status];
              const label = INDICATOR_LABELS[ind.id] || ind.id.replace(/_/g, ' ');
              const source = INDICATOR_SOURCES[ind.id] || '';

              return (
                <tr key={ind.id} className={`border-b border-gray-100 ${cfg.bg} ${idx % 2 === 0 ? '' : 'bg-gray-50/30'} hover:bg-blue-50/20 transition-colors`}>
                  <td className="px-3 py-2.5 text-center">{cfg.icon}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] text-slate-400">{source}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.badge}`}>
                      {formatValue(ind)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className={`rounded px-2.5 py-1.5 ${cfg.commentBg}`}>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{ind.commentaireIA || ind.interpretation}</p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {metaIndicateur && (metaIndicateur.valeur as number) > 0 && (
        <div className="mx-3 my-3 px-4 py-3 bg-amber-50 rounded-lg flex items-start gap-2 border border-amber-100">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-bold text-amber-800">{metaIndicateur.interpretation}</span>
            <p className="text-[10px] text-amber-600 mt-0.5">Si une info n'existe pas, l'IA l'indique et adapte sa justification. Score 0 = inevaluable, jamais "mauvais".</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CRITERION ACCORDION — Critère avec tableau d'indicateurs
   ═══════════════════════════════════════════════════════════════════════ */

function CriterionAccordion({
  icon: Icon, label, note, max, comment, indicateurs, color,
  sourceExtracts, palierDescription,
}: {
  icon: React.ElementType; label: string; note: number; max: number;
  comment?: string; indicateurs: Indicateur[]; color: string;
  sourceExtracts?: { text: string; source: string }[];
  palierDescription?: string;
}) {
  const [open, setOpen] = useState(false);
  const ratio = max > 0 ? note / max : 0;

  const scoreColor = ratio >= 0.75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : ratio >= 0.5 ? 'bg-amber-50 text-amber-700 border-amber-200'
    : ratio > 0 ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-slate-50 text-slate-500 border-slate-200';
  const scoreColorSolid = ratio >= 0.75 ? 'text-emerald-600' : ratio >= 0.5 ? 'text-amber-600' : ratio > 0 ? 'text-red-500' : 'text-slate-400';
  const iconColors: Record<string, string> = { blue: 'text-[#314ace]', purple: 'text-purple-500', rose: 'text-rose-500' };

  const realIndicateurs = indicateurs.filter(i => i.id !== 'DONNEES_MANQUANTES' && i.id !== 'INFORMATIONS_MANQUANTES');
  const disponibles = realIndicateurs.filter(i => i.disponible).length;
  const manquants = realIndicateurs.filter(i => !i.disponible).length;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all duration-200 ${open ? 'border-[#314ace]/30 ring-1 ring-[#314ace]/10' : 'border-gray-200 hover:border-gray-300'}`}>
      {/* Header */}
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center gap-3 transition-colors">
        <Icon className={`w-5 h-5 ${iconColors[color] || 'text-slate-500'} flex-shrink-0`} />
        <div className="flex-1 min-w-0 text-left">
          <span className="text-sm font-bold text-slate-800">{label}</span>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-emerald-600 font-semibold">{disponibles} disponibles</span>
            {manquants > 0 && <span className="text-[10px] text-red-500 font-bold">{manquants} manquant{manquants > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <span className={`text-sm font-extrabold tabular-nums px-3 py-1.5 rounded-full border ${scoreColor}`}>
          {note} / {max}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100">

          {/* ── JUSTIFICATION IA ── */}
          <div className="px-5 py-4 bg-[#314ace]/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#314ace]" />
              <h4 className="text-[11px] font-bold text-[#314ace] uppercase tracking-wider">Justification IA</h4>
            </div>

            {/* Palier */}
            <div className="bg-white rounded-lg border border-gray-100 p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Palier attribue</span>
                <span className={`text-lg font-black tabular-nums ${scoreColorSolid}`}>{note}/{max}</span>
              </div>
              {palierDescription && (
                <p className="text-xs text-slate-600 leading-relaxed">{palierDescription}</p>
              )}
            </div>

            {/* Commentaire template IA */}
            {comment ? (
              <div className="bg-white rounded-lg border border-[#314ace]/10 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#314ace]" />
                  <span className="text-[10px] font-bold text-[#314ace] uppercase tracking-wider">Commentaire genere par l'IA</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">"{comment}"</p>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-lg border border-amber-100 p-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-[11px] font-medium text-amber-700">Commentaire IA non genere — consultez le detail des indicateurs ci-dessous</span>
              </div>
            )}
          </div>

          {/* ── TABLEAU DES INDICATEURS ── */}
          <div className="pt-2 pb-4">
            <div className="px-5 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tableau des indicateurs ({realIndicateurs.length})
                </h4>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Positif</span>
                <span className="flex items-center gap-1"><Info className="w-3 h-3 text-slate-400" /> Neutre</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-400" /> Vigilance</span>
                <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> Manquant</span>
              </div>
            </div>
            <IndicateurTable indicateurs={indicateurs} />
          </div>

          {/* ── EXTRAITS DE PREUVE ── */}
          {sourceExtracts && sourceExtracts.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-500" />
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Extraits de preuve identifies</h4>
              </div>
              <div className="space-y-3">
                {sourceExtracts.map((extract, i) => (
                  <div key={i} className="bg-white rounded-lg px-4 py-3 border border-gray-100" style={{ borderLeft: '3px solid #314ace' }}>
                    <p className="text-sm text-slate-700 leading-relaxed italic">"{extract.text}"</p>
                    <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> — Source : {extract.source}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PALIER DESCRIPTIONS — Exactement conformes au document d'admission
   ═══════════════════════════════════════════════════════════════════════ */

function getPalierDescScolaire(note: number): string {
  if (note >= 3) return 'Excellent / tres favorable — Resultats tres bons ou excellents et/ou progression tres nette. Points forts marques dans matieres utiles au TS. Appreciations tres positives. Parcours coherent.';
  if (note >= 2.5) return 'Tres solide / favorable — Resultats bons a tres bons et/ou progression nette. Points forts identifies dans matieres pertinentes. Appreciations positives. Coherence globale du parcours.';
  if (note >= 2) return 'Solide / bon potentiel — Resultats globalement corrects a bons avec quelques fragilites. Au moins un point fort net. Appreciations plutot positives ou neutres.';
  if (note >= 1.5) return 'Moyen / mitige — Resultats moyens, irreguliers ou peu lisibles. Matieres pertinentes sans point fort net. Appreciations neutres ou partagees.';
  if (note >= 1) return 'Fragile / peu favorable a ce stade — Resultats faibles et/ou baisse marquee. Difficultes sur competences fondamentales utiles au TS. Appreciations negatives recurrentes.';
  if (note >= 0.5) return 'Tres fragile — Resultats tres faibles / tres instables, difficultes majeures et persistantes. Peu d\'indices de progression.';
  return 'Inevaluable — Absence quasi totale d\'informations scolaires exploitables. 0 = inevaluable, pas "mauvais".';
}

function getPalierDescExperiences(note: number): string {
  if (note >= 3) return 'Tres riche et tres pertinent — Engagement/experience majeur(e) et durable. Contact direct avec des publics vulnerables. Competences transferables fortes. Capacite de recul explicite.';
  if (note >= 2.5) return 'Tres pertinent / solide — Experience significative avec responsabilites ou missions claires. Lien direct ou indirect avec le TS. Recul present.';
  if (note >= 2) return 'Pertinent / bon potentiel — Experiences reelles, competences transferables identifiees. Engagement ponctuel mais coherent, ou BAFA + animation.';
  if (note >= 1.5) return 'Present mais limite — Peu d\'elements, experiences courtes ou peu decrites. Engagement faible ou difficile a qualifier.';
  if (note >= 1) return 'Faible a ce stade — Tres peu d\'experience, ou uniquement declarative. Peu de contact public, informations trop floues.';
  if (note >= 0.5) return 'Tres faible (mais evaluable) — Quasi absence d\'elements, mention tres vague ou ponctuelle.';
  return 'Inevaluable — Aucune information exploitable sur experiences/engagements. 0 = inevaluable, pas "absence d\'engagement".';
}

function getPalierDescMotivation(note: number): string {
  if (note >= 2) return 'Motivation et projet tres construits — Projet clair (metier/secteur/public) et coherent avec ES/EJE/ASS. Motivation etayee par experiences. Bonne comprehension des exigences. Discours personnalise et structure.';
  if (note >= 1.5) return 'Motivation solide mais partiellement developpee — Projet globalement coherent, certains elements generaux. Motivation sincere avec quelques appuis concrets. Comprehension des realites presente mais incomplete.';
  if (note >= 1) return 'Motivation presente mais floue — Projet peu precis (metier confus, secteur non identifie). Motivation surtout declarative sans preuves. Texte generique ou peu structure.';
  if (note >= 0.5) return 'Motivation fragile / incoherente — Projet incoherent avec la filiere demandee ou confusions majeures. Tres peu d\'arguments, absence d\'appuis concrets.';
  return 'Inevaluable — Lettre/projet non renseigne ou vide. 0 = inevaluable, pas "mauvaise motivation".';
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export function AnalyseIADetail({ candidat }: AnalyseIADetailProps) {
  const hasAnalyse = candidat.noteParcoursScolaire !== undefined ||
    candidat.noteExperiences !== undefined ||
    candidat.noteMotivation !== undefined;

  const analyse = useMemo<AnalyseDetailleeResult | null>(() => {
    if (!candidat.donneesParcoursup) return null;
    return AnalyseurCandidatService.getAnalyseDetaillee(candidat);
  }, [candidat]);

  if (!hasAnalyse) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Aucune analyse disponible</p>
        {candidat.procedureAdmission === 'admis_de_droit' && (
          <p className="text-xs mt-1">Candidat admis de droit — pas d'analyse requise.</p>
        )}
      </div>
    );
  }

  const noteTotal = candidat.cotationIAProposee || 0;
  const noteScolaire = candidat.noteParcoursScolaire ?? analyse?.palierScolaire ?? 0;
  const noteExperiences = candidat.noteExperiences ?? analyse?.palierExperiences ?? 0;
  const noteMotivation = candidat.noteMotivation ?? analyse?.palierMotivation ?? 0;
  const d = analyse?.donnees;

  // Build source extracts
  const motivationExtracts: { text: string; source: string }[] = [];
  if (d?.motivation.lettre && d.motivation.lettre.length > 30) {
    motivationExtracts.push({ text: d.motivation.lettre.substring(0, 300) + (d.motivation.lettre.length > 300 ? '...' : ''), source: 'Projet de formation motive' });
  }
  const experienceExtracts: { text: string; source: string }[] = [];
  if (d?.activites.experiencesPro && d.activites.experiencesPro.length > 20)
    experienceExtracts.push({ text: d.activites.experiencesPro.substring(0, 300) + (d.activites.experiencesPro.length > 300 ? '...' : ''), source: 'Experiences professionnelles' });
  if (d?.activites.engagementsCitoyen && d.activites.engagementsCitoyen.length > 20)
    experienceExtracts.push({ text: d.activites.engagementsCitoyen.substring(0, 300) + (d.activites.engagementsCitoyen.length > 300 ? '...' : ''), source: 'Engagements citoyens' });
  if (d?.activites.encadrement && d.activites.encadrement.length > 20)
    experienceExtracts.push({ text: d.activites.encadrement.substring(0, 300) + (d.activites.encadrement.length > 300 ? '...' : ''), source: 'Encadrement / Animation' });
  if (d?.activites.sportCulture && d.activites.sportCulture.length > 20)
    experienceExtracts.push({ text: d.activites.sportCulture.substring(0, 200) + (d.activites.sportCulture.length > 200 ? '...' : ''), source: 'Pratiques sportives / culturelles' });
  const scolaireExtracts: { text: string; source: string }[] = [];
  if (d?.appreciations.texte && d.appreciations.texte.length > 20)
    scolaireExtracts.push({ text: d.appreciations.texte.substring(0, 300) + (d.appreciations.texte.length > 300 ? '...' : ''), source: 'Appreciations / Fiche Avenir' });

  const verdictLabel = noteTotal >= 6.5 ? 'Tres favorable' : noteTotal >= 5 ? 'Favorable' : noteTotal >= 3.5 ? 'Mitige' : 'A approfondir';
  const verdictColor = noteTotal >= 6.5 ? 'bg-emerald-100 text-emerald-700' : noteTotal >= 5 ? 'bg-emerald-50 text-emerald-600' : noteTotal >= 3.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-600';

  return (
    <div className="space-y-6">

      {/* ═══ SCORE OVERVIEW ═══ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <ScoreRingLarge score={noteTotal} max={8} />
          <div className="flex-1 flex items-start gap-8 min-w-0">
            <SubScoreBar label="Parcours Scolaire" note={noteScolaire} max={3} color="blue" />
            <SubScoreBar label="Experiences" note={noteExperiences} max={3} color="orange" />
            <SubScoreBar label="Motivation" note={noteMotivation} max={2} color="green" />
          </div>
        </div>
      </div>

      {/* ═══ TABLEAU SYNTHESE (conformement au document) ═══ */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#314ace]" />
          <h3 className="text-sm font-bold text-slate-800">Tableau de synthese — Analyse IA</h3>
          <span className={`ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full ${verdictColor}`}>{verdictLabel}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critere</th>
              <th className="text-center px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20">Note</th>
              <th className="text-left px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commentaire IA</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Parcours scolaire / universitaire / notes du BAC', note: noteScolaire, max: 3, comment: candidat.commentaireParcoursScolaire, color: 'text-[#314ace]' },
              { label: 'Experiences personnelles et professionnelles / parcours de vie', note: noteExperiences, max: 3, comment: candidat.commentaireExperiences, color: 'text-orange-600' },
              { label: 'Motivation et projet professionnel', note: noteMotivation, max: 2, comment: candidat.commentaireMotivation, color: 'text-emerald-600' },
            ].map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-xs font-semibold text-slate-700 max-w-[200px]">{row.label}</td>
                <td className="text-center px-3 py-3">
                  <span className={`text-lg font-black tabular-nums ${row.color}`}>{row.note}</span>
                  <span className="text-xs text-slate-400 font-medium">/{row.max}</span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-600 leading-relaxed">
                  {row.comment || <span className="text-slate-400 italic">Non genere</span>}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td className="px-5 py-3 text-xs font-black text-slate-800 uppercase">Total</td>
              <td className="text-center px-3 py-3">
                <span className="text-xl font-black tabular-nums text-slate-800">{noteTotal}</span>
                <span className="text-xs text-slate-400 font-medium">/8</span>
              </td>
              <td className="px-5 py-3 text-xs text-slate-600 leading-relaxed">
                {(candidat as any).justificationGlobale
                  ? (candidat as any).justificationGlobale.split('\n').pop()
                  : <span className="text-slate-400 italic">Synthese non disponible</span>
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ POINTS FORTS / VIGILANCE ═══ */}
      {((candidat.alertes && candidat.alertes.length > 0) || (candidat.elementsValorisants && candidat.elementsValorisants.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidat.elementsValorisants && candidat.elementsValorisants.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-700 mb-1.5">Point fort majeur</h4>
                <ul className="space-y-1">
                  {candidat.elementsValorisants.map((el: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                      <Star className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />{el}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {candidat.alertes && candidat.alertes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-600 mb-1.5">Point de vigilance</h4>
                <ul className="space-y-1">
                  {candidat.alertes.map((a: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />{a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ DETAIL DES CRITERES ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-[#314ace]" />
          <h3 className="text-base font-bold text-slate-800">Detail des criteres d'evaluation</h3>
        </div>

        <div className="space-y-3">
          <CriterionAccordion
            icon={BookOpen} label="Parcours scolaire / universitaire / notes du BAC"
            note={noteScolaire} max={3}
            comment={candidat.commentaireParcoursScolaire}
            indicateurs={analyse?.indicateursScolaires ?? []}
            color="blue"
            sourceExtracts={scolaireExtracts}
            palierDescription={getPalierDescScolaire(noteScolaire)}
          />
          <CriterionAccordion
            icon={Briefcase} label="Experiences personnelles et professionnelles / parcours de vie"
            note={noteExperiences} max={3}
            comment={candidat.commentaireExperiences}
            indicateurs={analyse?.indicateursExperiences ?? []}
            color="purple"
            sourceExtracts={experienceExtracts}
            palierDescription={getPalierDescExperiences(noteExperiences)}
          />
          <CriterionAccordion
            icon={Heart} label="Motivation et projet professionnel"
            note={noteMotivation} max={2}
            comment={candidat.commentaireMotivation}
            indicateurs={analyse?.indicateursMotivation ?? []}
            color="rose"
            sourceExtracts={motivationExtracts}
            palierDescription={getPalierDescMotivation(noteMotivation)}
          />
        </div>
      </div>

      {/* ═══ ORAL ═══ */}
      {candidat.oralAdmission && candidat.oralAdmission.noteTotal !== undefined && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 bg-indigo-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-indigo-800">Oral d'admission</h4>
            </div>
            <span className="text-sm font-extrabold tabular-nums px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
              {candidat.oralAdmission.noteTotal} / 12
            </span>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Participation', note: candidat.oralAdmission.noteParticipationCollectif ?? 0 },
              { label: 'Expression', note: candidat.oralAdmission.noteExpressionEmotions ?? 0 },
              { label: 'Analyse TS', note: candidat.oralAdmission.noteAnalyseTS ?? 0 },
              { label: 'Presentation', note: candidat.oralAdmission.notePresentationIndividuelle ?? 0 },
            ].map(c => (
              <div key={c.label} className="text-center">
                <div className="text-lg font-extrabold text-indigo-600 tabular-nums">{c.note}<span className="text-xs text-indigo-400 ml-0.5">/3</span></div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">{c.label}</div>
                <div className="mt-2 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(c.note / 3) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ REGLES & PONDERATIONS ═══ */}
      <RulesSection />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   RULES SECTION — Ponderations globales
   ═══════════════════════════════════════════════════════════════════════ */

function RulesSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:bg-gray-50 transition-colors">
        <Shield className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Voir les ponderations globales de la campagne</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="border-t border-gray-100">
          {/* Score breakdown */}
          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
              <div className="text-center">
                <div className="text-xl font-black text-[#314ace] tabular-nums">/3</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Parcours scolaire</div>
                <div className="text-[9px] text-slate-400 mt-0.5">27 indicateurs</div>
              </div>
              <div className="text-center border-x border-gray-200">
                <div className="text-xl font-black text-orange-500 tabular-nums">/3</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Experiences</div>
                <div className="text-[9px] text-slate-400 mt-0.5">13 indicateurs</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-black text-emerald-500 tabular-nums">/2</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Motivation</div>
                <div className="text-[9px] text-slate-400 mt-0.5">13 indicateurs</div>
              </div>
            </div>

            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Regles inviolables de l'IA</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                'Score 0 = inevaluable (manque de donnees), jamais "mauvais"',
                'Ne jamais inventer d\'information manquante → "non renseigne dans le dossier"',
                'Ne pas penaliser les terminales pour bac non obtenu',
                'Bac eloigne du social : pas penalisant si competences transferables bonnes',
                'Ne pas surevaluer un bac social si notes/appreciations faibles',
                'Peu d\'experiences : ne pas penaliser automatiquement',
                '"Beau discours" ≠ motivation reelle — preuves requises',
                'Qualite de langue = critere de clarte, pas de discrimination sociale',
                'Reconversion / parcours atypique : valoriser coherence et maturite',
                'Precision (missions, dates, publics) = plus valorisable',
              ].map((regle, idx) => (
                <div key={idx} className="flex items-start gap-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-[10px] text-slate-500 leading-relaxed">{regle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
