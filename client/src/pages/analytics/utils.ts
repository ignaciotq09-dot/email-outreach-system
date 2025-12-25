export function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

export function getHeatmapColor(rate: number, hasEnoughData: boolean, metricType: 'open' | 'reply'): string {
  if (!hasEnoughData) return 'bg-muted/30';

  if (metricType === 'open') {
    if (rate >= 60) return 'bg-green-600';
    if (rate >= 45) return 'bg-green-500';
    if (rate >= 30) return 'bg-green-400';
    if (rate >= 20) return 'bg-green-300';
    if (rate >= 10) return 'bg-green-200';
    if (rate > 0) return 'bg-green-100';
    return 'bg-muted/50';
  } else {
    if (rate >= 20) return 'bg-purple-600';
    if (rate >= 15) return 'bg-purple-500';
    if (rate >= 10) return 'bg-purple-400';
    if (rate >= 7) return 'bg-purple-300';
    if (rate >= 4) return 'bg-purple-200';
    if (rate > 0) return 'bg-purple-100';
    return 'bg-muted/50';
  }
}

export function getSmsHeatmapColor(rate: number, hasEnoughData: boolean): string {
  if (!hasEnoughData) return 'bg-muted/30';

  if (rate >= 98) return 'bg-blue-600';
  if (rate >= 95) return 'bg-blue-500';
  if (rate >= 90) return 'bg-blue-400';
  if (rate >= 85) return 'bg-blue-300';
  if (rate >= 80) return 'bg-blue-200';
  if (rate > 0) return 'bg-blue-100';
  return 'bg-muted/50';
}

export function formatDelta(delta: number, suffix: string = '%'): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}${suffix}`;
}
