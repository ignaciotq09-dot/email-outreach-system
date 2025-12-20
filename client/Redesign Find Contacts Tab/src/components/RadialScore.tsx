interface RadialScoreProps {
  score: number;
  size?: number;
}

export function RadialScore({ score, size = 48 }: RadialScoreProps) {
  const getColor = (score: number) => {
    if (score >= 80) return { stroke: '#10b981', glow: '#10b981' }; // green
    if (score >= 60) return { stroke: '#3b82f6', glow: '#3b82f6' }; // blue
    if (score >= 40) return { stroke: '#f59e0b', glow: '#f59e0b' }; // orange
    return { stroke: '#6b7280', glow: '#6b7280' }; // gray
  };

  const color = getColor(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color.stroke}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 4px ${color.glow}40)`
          }}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
          {score}
        </span>
      </div>
    </div>
  );
}
