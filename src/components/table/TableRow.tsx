import { Candidat } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { Tooltip } from '@/components/shared/Tooltip';
import { Eye, CheckCircle, AlertTriangle } from 'lucide-react';

interface TableRowProps {
  candidat: Candidat;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  index: number;
}

export function TableRow({ candidat, isSelected, onSelect, onClick }: TableRowProps) {
  const getNoteColor = (note?: number | null) => {
    if (note === undefined || note === null) return 'text-shine-text-tertiary';
    if (note >= 14) return 'text-emerald-600 font-semibold';
    if (note >= 10) return 'text-amber-600 font-medium';
    return 'text-red-600 font-semibold';
  };

  const formatNote = (note?: number | null) => {
    if (note === undefined || note === null) return null;
    return note % 1 === 0 ? note.toString() : note.toFixed(1);
  };

  /** Color for sub-notes (/3 or /2) */
  const getSubNoteColor = (note: number | undefined, max: number) => {
    if (note === undefined || note === null) return 'text-shine-text-tertiary';
    const ratio = note / max;
    if (ratio >= 0.75) return 'text-emerald-600 font-semibold';
    if (ratio >= 0.5) return 'text-amber-600 font-medium';
    if (ratio > 0) return 'text-red-500 font-medium';
    return 'text-slate-400';
  };

  const getProcedureLabel = (proc?: string) => {
    if (!proc) return null;
    if (proc === 'admis_de_droit') return { label: 'Admis de droit', color: 'bg-emerald-100 text-emerald-700' };
    if (proc === 'etude_dossier_oral') return { label: 'Dossier + Oral', color: 'bg-blue-100 text-blue-700' };
    if (proc === 'les_deux') return { label: 'Droit + Dossier', color: 'bg-purple-100 text-purple-700' };
    return null;
  };

  const procedure = getProcedureLabel(candidat.procedureAdmission);

  return (
    <div
      className={`
        flex items-center min-h-[56px] py-2 px-6 border-b border-shine-border-light
        transition-colors duration-100
        hover:bg-shine-hover-bg cursor-pointer
        ${isSelected ? 'bg-primary-50' : ''}
      `}
    >
      {/* Checkbox */}
      <div
        className="w-12 flex items-center justify-center flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="w-4 h-4 rounded border-shine-border text-primary-500 focus:ring-1 focus:ring-primary-500/30 cursor-pointer pointer-events-none"
          aria-label={`Sélectionner ${candidat.prenom} ${candidat.nom}`}
        />
      </div>

      {/* Name */}
      <div className="w-48 flex items-center gap-2.5 px-2 flex-shrink-0" onClick={onClick}>
        <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-white">
            {candidat.prenom?.[0]}{candidat.nom?.[0]}
          </span>
        </div>
        <span className="text-sm font-medium text-shine-text-primary truncate">
          {candidat.prenom} {candidat.nom}
        </span>
      </div>

      {/* N Dossier */}
      <div className="w-28 px-2 flex-shrink-0" onClick={onClick}>
        <span className="text-xs text-shine-text-secondary font-mono">
          {candidat.numeroDossier}
        </span>
      </div>

      {/* Bac / Diplôme */}
      <div className="w-28 px-2 flex-shrink-0" onClick={onClick}>
        <span className="text-[11px] font-medium px-1.5 py-0.5 bg-slate-100 text-shine-text-secondary rounded-full truncate block text-center">
          {candidat.serieBac}
        </span>
      </div>

      {/* Statut demandé (FI/CA) */}
      <div className="w-20 px-2 flex-shrink-0 text-center" onClick={onClick}>
        {candidat.statutDemande ? (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            candidat.statutDemande === 'CA' ? 'bg-amber-100 text-amber-700' :
            candidat.statutDemande === 'FI' ? 'bg-blue-100 text-blue-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {candidat.statutDemande}
          </span>
        ) : (
          <span className="text-xs text-shine-text-tertiary">—</span>
        )}
      </div>

      {/* Procédure d'admission */}
      <div className="w-28 px-2 flex-shrink-0" onClick={onClick}>
        {procedure ? (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full block text-center ${procedure.color}`}>
            {procedure.label}
          </span>
        ) : (
          <span className="text-xs text-shine-text-tertiary text-center block">—</span>
        )}
      </div>

      {/* Moyenne Générale */}
      <div className="w-20 px-2 flex-shrink-0 text-center" onClick={onClick}>
        {formatNote(candidat.moyenneGenerale) ? (
          <span className={`text-sm font-bold ${getNoteColor(candidat.moyenneGenerale)}`}>
            {formatNote(candidat.moyenneGenerale)}
          </span>
        ) : (
          <span className="text-xs text-shine-text-tertiary">—</span>
        )}
      </div>

      {/* Note Parcours Scolaire /3 */}
      <div className="w-24 px-2 flex-shrink-0 text-center" onClick={onClick}>
        {candidat.noteParcoursScolaire !== undefined && candidat.noteParcoursScolaire !== null ? (
          <Tooltip content={candidat.commentaireParcoursScolaire || 'Aucun commentaire'}>
            <span className={`text-sm ${getSubNoteColor(candidat.noteParcoursScolaire, 3)}`}>
              {candidat.noteParcoursScolaire}/3
            </span>
          </Tooltip>
        ) : (
          <span className="text-xs text-shine-text-tertiary">—</span>
        )}
      </div>

      {/* Note Expériences /3 */}
      <div className="w-24 px-2 flex-shrink-0 text-center" onClick={onClick}>
        {candidat.noteExperiences !== undefined && candidat.noteExperiences !== null ? (
          <Tooltip content={candidat.commentaireExperiences || 'Aucun commentaire'}>
            <span className={`text-sm ${getSubNoteColor(candidat.noteExperiences, 3)}`}>
              {candidat.noteExperiences}/3
            </span>
          </Tooltip>
        ) : (
          <span className="text-xs text-shine-text-tertiary">—</span>
        )}
      </div>

      {/* Note Motivation /2 */}
      <div className="w-24 px-2 flex-shrink-0 text-center" onClick={onClick}>
        {candidat.noteMotivation !== undefined && candidat.noteMotivation !== null ? (
          <Tooltip content={candidat.commentaireMotivation || 'Aucun commentaire'}>
            <span className={`text-sm ${getSubNoteColor(candidat.noteMotivation, 2)}`}>
              {candidat.noteMotivation}/2
            </span>
          </Tooltip>
        ) : (
          <span className="text-xs text-shine-text-tertiary">—</span>
        )}
      </div>

      {/* Cotation IA Total /8 */}
      <div className="w-24 px-2 flex items-center flex-shrink-0" onClick={onClick}>
        {candidat.cotationIAProposee !== undefined && candidat.cotationIAProposee > 0 ? (
          <ScoreBadge score={candidat.cotationIAProposee} maxScore={8} />
        ) : (
          <span className="text-xs text-shine-text-tertiary">—</span>
        )}
      </div>

      {/* Alertes */}
      <div className="w-20 px-2 flex-shrink-0" onClick={onClick}>
        {candidat.alertes && candidat.alertes.length > 0 ? (
          <Tooltip
            content={
              <div className="space-y-1">
                {candidat.alertes.slice(0, 3).map((alerte, idx) => (
                  <div key={idx} className="text-xs">{alerte}</div>
                ))}
                {candidat.alertes.length > 3 && (
                  <div className="text-xs text-slate-400">
                    +{candidat.alertes.length - 3} autre(s)
                  </div>
                )}
              </div>
            }
          >
            <div className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{candidat.alertes.length}</span>
            </div>
          </Tooltip>
        ) : (
          <span className="text-xs text-shine-text-tertiary">&mdash;</span>
        )}
      </div>

      {/* Statut */}
      <div className="w-28 px-2 flex-shrink-0" onClick={onClick}>
        <Badge status={candidat.statut} />
      </div>

      {/* Actions */}
      <div className="w-24 px-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClick}
            className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500 transition-colors"
            aria-label="Voir les détails"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>

          {candidat.statut === 'analyse' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors"
              aria-label="Validation rapide"
              title="Validation rapide"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
