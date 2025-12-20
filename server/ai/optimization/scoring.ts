import type { EmailVariant } from '../openai-client';
import type { OptimizationContext } from "./types";
import { scoreSubjectLine } from '../rules/subject-rules';
import { scoreEmailBody } from '../rules/body-rules';
import { calculatePersonalizationScore } from '../rules/personalization-rules';

export function calculateScore(variant: EmailVariant, context: OptimizationContext): number {
  const subjectScore = scoreSubjectLine(variant.subject).score; const bodyScore = scoreEmailBody(variant.body).score; const personalizationScore = calculatePersonalizationScore(variant.body, context.personalizationSignals || []);
  return Math.round((subjectScore * 0.3) + (bodyScore * 0.35) + (personalizationScore * 0.35));
}

export function generateImprovements(variant: EmailVariant, context: OptimizationContext): string[] {
  const improvements: string[] = []; const subjectAnalysis = scoreSubjectLine(variant.subject); improvements.push(...subjectAnalysis.improvements); const bodyAnalysis = scoreEmailBody(variant.body); improvements.push(...bodyAnalysis.improvements);
  if (!context.personalizationSignals || context.personalizationSignals.length < 2) improvements.push('Add more personalization signals (recent activity, company news)');
  return improvements;
}

export function predictPerformance(score: number, context: OptimizationContext): { openRate: string; responseRate: string; conversionRate: string } {
  let openRate = '20-25%', responseRate = '5-8%', conversionRate = '1-2%';
  if (score > 80) { openRate = '35-45%'; responseRate = '15-20%'; conversionRate = '3-5%'; } else if (score > 60) { openRate = '25-35%'; responseRate = '8-15%'; conversionRate = '2-3%'; }
  if (context.previousEngagement) openRate = openRate.replace(/\d+/g, (match) => String(parseInt(match) + 10));
  return { openRate, responseRate, conversionRate };
}
