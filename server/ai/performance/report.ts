import type { EmailVariant } from '../openai-client';
import type { PerformanceMetrics } from './types';

export function generatePerformanceReport(variant: EmailVariant, score: number, predictions: PerformanceMetrics, improvements: string[]): string {
  return `📊 EMAIL PERFORMANCE ANALYSIS\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nOverall Score: ${score}/100 ${getScoreEmoji(score)}\n\n📈 PREDICTED METRICS:\n• Open Rate: ${predictions.openRate}%\n• Response Rate: ${predictions.responseRate}%\n• Conversion Rate: ${predictions.conversionRate}%\n• Confidence: ${predictions.confidence}%\n\n💡 TOP IMPROVEMENTS:\n${improvements.slice(0, 3).map((imp, i) => `${i + 1}. ${imp}`).join('\n')}\n\n🎯 SCORE BREAKDOWN:\n${getScoreBreakdownVisual(score)}\n\n📝 RECOMMENDATIONS:\n${getRecommendations(score, predictions)}`;
}

function getScoreEmoji(score: number): string { if (score >= 80) return '🟢 Excellent'; if (score >= 60) return '🟡 Good'; if (score >= 40) return '🟠 Fair'; return '🔴 Needs Work'; }
function getScoreBreakdownVisual(score: number): string { const filled = Math.round(score / 10); const empty = 10 - filled; return '█'.repeat(filled) + '░'.repeat(empty) + ` ${score}%`; }
function getRecommendations(score: number, predictions: PerformanceMetrics): string { const recommendations: string[] = []; if (predictions.openRate < 25) recommendations.push('• Improve subject line with numbers or questions'); if (predictions.responseRate < 8) recommendations.push('• Add more personalization and social proof'); if (score < 60) recommendations.push('• Shorten email to 75-100 words for optimal response'); return recommendations.join('\n') || '• Email is well-optimized!'; }
