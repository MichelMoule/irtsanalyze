interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md';
}

export function ScoreBadge({ score, maxScore = 8, size = 'sm' }: ScoreBadgeProps) {
  const percentage = (score / maxScore) * 100;

  const getColorClass = () => {
    if (percentage >= 75) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (percentage >= 50) return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-red-50 text-red-600 border-red-200';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1
        font-semibold rounded-full border
        ${getColorClass()}
        ${sizeClasses[size]}
      `}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score.toFixed(1)}/{maxScore}
    </span>
  );
}
