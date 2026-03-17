/**
 * Workflow de validation des candidats IRTS
 *
 * Flux principal :
 *   importe → en_analyse_ia → analyse → en_relecture → valide
 *                                                     → rejete
 *                                                     → liste_attente
 */

export type StatutCandidat = 'importe' | 'en_analyse_ia' | 'analyse' | 'en_relecture' | 'valide' | 'rejete' | 'liste_attente' | 'erreur';

/** Transitions valides : statut actuel → statuts possibles */
export const TRANSITIONS_VALIDES: Record<StatutCandidat, StatutCandidat[]> = {
  importe:       ['en_analyse_ia', 'erreur'],
  en_analyse_ia: ['analyse', 'erreur'],
  analyse:       ['en_relecture', 'valide', 'erreur'],
  en_relecture:  ['valide', 'rejete', 'liste_attente', 'analyse', 'erreur'],
  valide:        ['en_relecture'],
  rejete:        ['en_relecture', 'analyse'],
  liste_attente: ['en_relecture', 'valide', 'rejete'],
  erreur:        ['importe', 'analyse'],
};

export function isTransitionValide(ancien: StatutCandidat, nouveau: StatutCandidat): boolean {
  return TRANSITIONS_VALIDES[ancien]?.includes(nouveau) ?? false;
}

/** Labels lisibles */
export const STATUT_LABELS: Record<StatutCandidat, string> = {
  importe: 'Importé',
  en_analyse_ia: 'En analyse IA',
  analyse: 'Analysé',
  en_relecture: 'En relecture',
  valide: 'Validé',
  rejete: 'Rejeté',
  liste_attente: 'Liste d\'attente',
  erreur: 'Erreur',
};

/** Couleurs par statut (Tailwind classes) */
export const STATUT_COLORS: Record<StatutCandidat, { bg: string; text: string; border: string; dot: string }> = {
  importe:       { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200',   dot: 'bg-slate-500' },
  en_analyse_ia: { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  analyse:       { bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500' },
  en_relecture:  { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  valide:        { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  rejete:        { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
  liste_attente: { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500' },
  erreur:        { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
};

/** Ordre du workflow pour la progress bar */
export const WORKFLOW_STEPS: StatutCandidat[] = ['importe', 'en_analyse_ia', 'analyse', 'en_relecture', 'valide'];

/** Vérifie si un candidat peut être validé (a des notes) */
export function canValidate(candidat: { cotationIAProposee?: number; statut: string }): boolean {
  const validFrom: StatutCandidat[] = ['analyse', 'en_relecture', 'liste_attente'];
  return validFrom.includes(candidat.statut as StatutCandidat) && (candidat.cotationIAProposee ?? 0) > 0;
}

/** Vérifie si un candidat peut être rejeté */
export function canReject(candidat: { statut: string }): boolean {
  return ['en_relecture', 'liste_attente'].includes(candidat.statut);
}

/** Vérifie si un candidat peut passer en relecture */
export function canRelecture(candidat: { statut: string }): boolean {
  return ['analyse', 'valide', 'rejete', 'liste_attente'].includes(candidat.statut);
}
