import React from 'react';
import { motion } from 'framer-motion';
import type { StatutStats } from '@/types';

interface ProgressBarProps {
  stats: StatutStats;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ stats, total }) => {
  const segments = [
    { key: 'importe', label: 'Importé', icon: '📥', color: 'bg-status-imported', count: stats.importe },
    { key: 'en_analyse_ia', label: 'En analyse IA', icon: '🤖', color: 'bg-status-analyzing', count: stats.en_analyse_ia },
    { key: 'analyse', label: 'Analysé', icon: '🟣', color: 'bg-status-analyzed', count: stats.analyse },
    { key: 'en_relecture', label: 'En relecture', icon: '👁️', color: 'bg-status-reviewing', count: stats.en_relecture },
    { key: 'valide', label: 'Validé', icon: '✅', color: 'bg-status-validated', count: stats.valide },
  ];

  return (
    <div className="bg-surface rounded-md shadow-card p-6 mb-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">Progression de la campagne</h2>

      {/* Progress Bar */}
      <div className="h-4 bg-border rounded-full overflow-hidden flex mb-4">
        {segments.map((segment) => {
          const percentage = total > 0 ? (segment.count / total) * 100 : 0;
          return percentage > 0 ? (
            <motion.div
              key={segment.key}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`${segment.color} relative group`}
              title={`${segment.label}: ${segment.count}`}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {segment.label}: {segment.count}
              </div>
            </motion.div>
          ) : null;
        })}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-6">
        {segments.map((segment) => (
          <motion.div
            key={segment.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <span className="text-2xl">{segment.icon}</span>
            <div>
              <p className="text-2xl font-bold text-text-primary">{segment.count}</p>
              <p className="text-xs text-text-secondary">{segment.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
