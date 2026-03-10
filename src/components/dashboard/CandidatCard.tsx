import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Candidat } from '@/types';

interface CandidatCardProps {
  candidat: Candidat;
  onClick: () => void;
}

export const CandidatCard: React.FC<CandidatCardProps> = ({ candidat, onClick }) => {
  const getStatusBorderColor = () => {
    const colors = {
      importe: 'border-l-status-imported',
      en_analyse_ia: 'border-l-status-analyzing',
      analyse: 'border-l-status-analyzed',
      en_relecture: 'border-l-status-reviewing',
      valide: 'border-l-status-validated',
      erreur: 'border-l-status-error',
    };
    return colors[candidat.statut];
  };

  const getEvolutionIcon = () => {
    switch (candidat.evolutionNotes) {
      case 'progression':
        return <TrendingUp className="w-4 h-4 text-status-validated" />;
      case 'regression':
        return <TrendingDown className="w-4 h-4 text-status-error" />;
      default:
        return <Minus className="w-4 h-4 text-text-secondary" />;
    }
  };

  const hasAlerts = candidat.alertes.length > 0;

  return (
    <Card
      hover
      onClick={onClick}
      className={`border-l-4 ${getStatusBorderColor()} relative stagger-item`}
    >
      {/* Alert Badge */}
      {hasAlerts && (
        <div className="absolute top-4 right-4">
          <div className="bg-alert-red text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Alerte
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {candidat.prenom} {candidat.nom}
        </h3>
        <Badge status={candidat.statut} />
      </div>

      {/* Body */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-primary">
            {candidat.moyenneGenerale?.toFixed(1) ?? '-'}
          </span>
          <div className="flex items-center gap-1">
            {getEvolutionIcon()}
            <span className="text-xs text-text-secondary capitalize">
              {candidat.evolutionNotes === 'progression' && 'En progression'}
              {candidat.evolutionNotes === 'stable' && 'Stable'}
              {candidat.evolutionNotes === 'regression' && 'En régression'}
            </span>
          </div>
        </div>

        <div className="text-sm text-text-secondary">
          <p>{candidat.serieBac}</p>
          <p className="truncate">{candidat.etablissementOrigine}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="text-sm">
          <span className="text-text-secondary">Cotation IA: </span>
          <span className="font-semibold text-primary">
            {candidat.cotationIAProposee}/8
          </span>
        </div>
        {candidat.cotationFinale !== undefined && (
          <div className="text-sm">
            <span className="text-text-secondary">Note finale: </span>
            <span className="font-semibold text-status-validated">
              {candidat.cotationFinale}/8
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
