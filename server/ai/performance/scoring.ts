import type { EmailVariant } from '../openai-client';
import { EmailIntent } from '../optimization-orchestrator';
import { scoreSubjectLine } from '../rules/subject-rules';
import { scoreEmailBody } from '../rules/body-rules';
import { calculatePersonalizationScore } from '../rules/personalization-rules';
import { SCORING_WEIGHTS } from './types';

export function calculateEmailScore(variant: EmailVariant, context: { intent?: EmailIntent; industry?: string; personalizationSignals?: string[]; sendTime?: Date; psychologyTechniques?: string[] } = {}): { totalScore: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {}; breakdown.subject = scoreSubjectLine(variant.subject).score; breakdown.body = scoreEmailBody(variant.body).score; breakdown.personalization = calculatePersonalizationScore(variant.body, context.personalizationSignals || []); breakdown.timing = calculateTimingScore(context.sendTime); breakdown.psychology = calculatePsychologyScore(variant.body, context.psychologyTechniques || []);
  const totalScore = Math.round(breakdown.subject * SCORING_WEIGHTS.subject + breakdown.body * SCORING_WEIGHTS.body + breakdown.personalization * SCORING_WEIGHTS.personalization + breakdown.timing * SCORING_WEIGHTS.timing + breakdown.psychology * SCORING_WEIGHTS.psychology);
  return { totalScore, breakdown };
}

export function calculateTimingScore(sendTime?: Date): number {
  if (!sendTime) return 60; const hour = sendTime.getHours(); const day = sendTime.getDay(); let score = 50;
  if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) score += 30; else if (hour >= 7 && hour <= 17) score += 15;
  if (day >= 1 && day <= 4) score += 15; else if (day === 5) score += 5;
  return Math.min(100, score);
}

export function calculatePsychologyScore(body: string, techniques: string[]): number {
  let score = 50; if (body.includes('free') || body.includes('created for you') || body.includes('sharing')) { score += 15; techniques.push('reciprocity'); } if (body.includes('companies') || body.includes('clients') || body.includes('%')) { score += 15; techniques.push('social_proof'); } if (body.includes('limited') || body.includes('expires') || body.includes('last')) { score += 10; techniques.push('scarcity'); } if (body.includes('research') || body.includes('study') || body.includes('expert')) { score += 10; techniques.push('authority'); } return Math.min(100, score);
}
