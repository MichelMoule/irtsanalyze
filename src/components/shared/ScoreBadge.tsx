interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, maxScore = 8, size = 'sm' }: ScoreBadgeProps) {
  const percentage = (score / maxScore) * 100;

  const getColorClass = () => {
    if (percentage >= 75) return 'bg-emerald-100 text-emerald-700';
    if (percentage >= 50) return 'bg-amber-100 text-amber-700';
    if (percentage > 0) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-500';
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-bold rounded-md
        ${getColorClass()}
        ${sizeClasses[size]}
      `}
    >
      {score.toFixed(1)}<span className="font-medium opacity-60">/{maxScore}</span>
    </span>
  );
}
