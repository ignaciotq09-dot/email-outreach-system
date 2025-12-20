import type { EmailVariant } from '../openai-client';
import type { EmailIntent } from '../optimization-orchestrator';
import { calculateEmailScore, calculateTimingScore, calculatePsychologyScore } from './scoring';
import { predictPerformance } from './predictions';
import { generatePerformanceReport } from './report';
export * from './types';

export class EmailPerformancePredictor {
  public calculateEmailScore = calculateEmailScore; public predictPerformance = predictPerformance; public generatePerformanceReport = generatePerformanceReport;
  private calculateTimingScore = calculateTimingScore; private calculatePsychologyScore = calculatePsychologyScore;
}

export const performancePredictor = new EmailPerformancePredictor();
