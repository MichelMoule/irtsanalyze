import { Candidat } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { MoreHorizontal, AlertTriangle } from 'lucide-react';
import { ROW_GRID_CLASS } from './TableHeader';

interface TableRowProps {
  candidat: Candidat;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  index: number;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  const r = 18;
  const stroke = 3.5;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  // Color by percentage
  let ringColor = '#ef4444'; // red
  if (pct >= 70) ringColor = '#22c55e'; // green
  else if (pct >= 40) ringColor = '#f59e0b'; // amber/orange

  const displayScore = score % 1 === 0 ? String(score) : score.toFixed(1);

  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
        {/* Background ring */}
        <circle cx="20" cy="20" r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        {/* Progress ring */}
        <circle
          cx="20" cy="20" r={r} fill="none"
          stroke={ringColor} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 20 20)"
        />
        {/* Score text inside */}
        <text x="20" y="20" textAnchor="middle" dominantBaseline="central"
          className="text-[11px] font-extrabold" fill="#1e293b"
        >
          {displayScore}
        </text>
      </svg>
      <span className="text-xs text-slate-400 font-medium leading-tight">Score<br/>IA</span>
    </div>
  );
}

export function TableRow({ candidat, isSelected, onSelect, onClick, index }: TableRowProps) {
  const initials = `${candidat.prenom?.[0] ?? ''}${candidat.nom?.[0] ?? ''}`.toUpperCase();
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const hasAlertes = candidat.alertes && candidat.alertes.length > 0;

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const lastDate = candidat.dateValidation || candidat.dateRelecture;

  return (
    <div
      className={`
        ${ROW_GRID_CLASS} min-h-[64px] py-2.5 px-5 border-b border-gray-100
        transition-colors cursor-pointer group
        ${isSelected ? 'bg-primary-50/50' : 'hover:bg-gray-50'}
      `}
    >
      {/* Checkbox */}
      <div
        className="flex items-center justify-center"
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => { }}
          className={`w-4 h-4 rounded border-gray-300 cursor-pointer pointer-events-none ${
            isSelected ? 'text-primary-500' : ''
          }`}
          aria-label={`Selectionner ${candidat.prenom} ${candidat.nom}`}
        />
      </div>

      {/* Candidat: avatar + name + INE */}
      <div className="flex items-center gap-3 px-3" onClick={onClick}>
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold text-white`}>
            {initials}
          </div>
          {/* Alert indicator on avatar */}
          {hasAlertes && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
              <AlertTriangle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">
            {candidat.prenom} {candidat.nom}
          </p>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            {candidat.numeroDossier}
          </p>
        </div>
      </div>

      {/* Evaluation IA: ring chart + score */}
      <div className="flex items-center gap-2.5 px-3" onClick={onClick}>
        {candidat.cotationIAProposee != null && candidat.cotationIAProposee > 0 ? (
          <ScoreRing score={candidat.cotationIAProposee} max={8} />
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </div>

      {/* Statut Dossier */}
      <div className="px-3" onClick={onClick}>
        <Badge status={candidat.statut} />
      </div>

      {/* Derniere action */}
      <div className="px-3" onClick={onClick}>
        <span className="text-sm text-slate-500">
          {formatDate(lastDate)}
        </span>
      </div>

      {/* Actions */}
      <div
        className="flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClick}
          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
