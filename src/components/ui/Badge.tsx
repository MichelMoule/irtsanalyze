import React from 'react';

type CandidatStatut = 'importe' | 'en_analyse_ia' | 'analyse' | 'en_relecture' | 'valide' | 'erreur';

interface BadgeProps {
  status: CandidatStatut;
  className?: string;
}

const statusConfig: Record<CandidatStatut, { label: string; bg: string; text: string }> = {
  importe: { label: 'Importe', bg: 'bg-slate-100', text: 'text-slate-600' },
  en_analyse_ia: { label: 'En analyse', bg: 'bg-blue-50', text: 'text-blue-600' },
  analyse: { label: 'Analyse', bg: 'bg-purple-50', text: 'text-purple-600' },
  en_relecture: { label: 'En relecture', bg: 'bg-amber-50', text: 'text-amber-600' },
  valide: { label: 'Valide', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  erreur: { label: 'Erreur', bg: 'bg-red-50', text: 'text-red-600' },
};

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      {config.label}
    </span>
  );
};
