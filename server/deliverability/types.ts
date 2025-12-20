/**
 * Deliverability Type Definitions
 */

export interface SpamCheckResult {
  score: number; // 0-100, lower is better (0 = perfect, 100 = definitely spam)
  risk: 'low' | 'medium' | 'high' | 'critical';
  issues: SpamIssue[];
  recommendations: string[];
}

export interface SpamIssue {
  category: 'keywords' | 'links' | 'formatting' | 'structure' | 'sender';
  severity: 'low' | 'medium' | 'high';
  message: string;
  points: number;
}
