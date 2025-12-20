export interface PerformanceMetrics { openRate: number; responseRate: number; conversionRate: number; confidence: number; }
export const SCORING_WEIGHTS = { subject: 0.30, body: 0.25, personalization: 0.25, timing: 0.10, psychology: 0.10 };
