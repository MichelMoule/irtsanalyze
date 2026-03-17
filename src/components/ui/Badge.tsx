import React from 'react';

type CandidatStatut = 'importe' | 'en_analyse_ia' | 'analyse' | 'en_relecture' | 'valide' | 'rejete' | 'liste_attente' | 'erreur';

interface BadgeProps {
  status: CandidatStatut;
  className?: string;
}

const statusConfig: Record<CandidatStatut, { label: string; bg: string; text: string; dot: string }> = {
  importe: {
    label: 'Importe',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-500',
  },
  en_analyse_ia: {
    label: 'En analyse',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  analyse: {
    label: 'Analyse',
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    dot: 'bg-violet-500',
  },
  en_relecture: {
    label: 'En relecture',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  valide: {
    label: 'Valide',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  rejete: {
    label: 'Rejete',
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  liste_attente: {
    label: 'Liste d\'attente',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  erreur: {
    label: 'Erreur',
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] ?? statusConfig['importe'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
};
