export enum EmailIntent {
  COLD_OUTREACH = 'cold_outreach',
  WARM_INTRODUCTION = 'warm_introduction',
  FOLLOW_UP = 'follow_up',
  NURTURE = 'nurture',
  RE_ENGAGEMENT = 're_engagement',
  MEETING_REQUEST = 'meeting_request',
  VALUE_DELIVERY = 'value_delivery',
  BREAKUP = 'breakup',
  REFERRAL_REQUEST = 'referral_request',
  TESTIMONIAL_ASK = 'testimonial_ask',
  THANK_YOU = 'thank_you',
  APOLOGY = 'apology',
  ANNOUNCEMENT = 'announcement',
  SURVEY_REQUEST = 'survey_request'
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedContent: string;
  warnings: string[];
  errors: string[];
}

export interface SpamAnalysis {
  score: number;
  triggers: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReadabilityAnalysis {
  gradeLevel: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  score: number;
  assessment: string;
}

export interface ToneAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  formality: 'casual' | 'neutral' | 'formal';
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface StructureAnalysis {
  hasGreeting: boolean;
  greetingType: 'professional' | 'casual' | 'none';
  hasSignature: boolean;
  paragraphCount: number;
  linkCount: number;
  suspiciousLinks: string[];
}

export interface CTAAnalysis {
  hasCTA: boolean;
  ctaCount: number;
  ctaStrength: 'weak' | 'moderate' | 'strong';
  ctaClarity: number;
}

export interface IntentResult {
  primary: EmailIntent;
  secondary: EmailIntent[];
  confidence: number;
}

export interface ComplianceResult {
  isCompliant: boolean;
  issues: Array<{ type: string; description: string; severity: string }>;
}

export interface EmailContext {
  isReply: boolean;
  isForward: boolean;
  sequencePosition: number;
  hasQuotedText: boolean;
}

export interface ComprehensiveAnalysis {
  validation: ValidationResult;
  spam: SpamAnalysis;
  readability: ReadabilityAnalysis;
  tone: ToneAnalysis;
  structure: StructureAnalysis;
  cta: CTAAnalysis;
  intent: IntentResult;
  compliance: ComplianceResult;
  context: EmailContext;
  overallScore: number;
}

export interface OptimizationResult {
  score: number;
  optimizedSubject: string;
  optimizedBody: string;
  improvements: Array<{ category: string; issue: string; suggestion: string; impact: string }>;
  predictions: { openRate: string; responseRate: string; conversionRate: string };
  sendingRecommendation: { bestDay: string; bestTime: string; reason: string };
}

export interface RecipientData {
  company?: string;
  industry?: string;
  previousEngagement?: boolean;
  timezone?: string;
  name?: string;
}

// New types for comprehensive email optimization

export type EmailType = 'sales' | 'general' | 'follow_up' | 'meeting_request';

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'needs_work' | 'poor';
  issues: string[];
}

export interface DetailedImprovement {
  id: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  suggestion: string;
  impact: string;
  example?: string;
  beforeAfter?: {
    before: string;
    after: string;
  };
}

export interface OptimizedEmail {
  subject: string;
  body: string;
  changes: string[];
}

export interface DetailedAnalysisResult {
  emailType: EmailType;
  overallScore: number;
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    subjectLine: CategoryScore;
    opening: CategoryScore;
    valueProposition: CategoryScore;
    structure: CategoryScore;
    callToAction: CategoryScore;
  };
  improvements: DetailedImprovement[];
  predictions: {
    openRate: string;
    responseRate: string;
    sentimentLikelihood: string;
  };
  tips: EmailWritingTip[];
  optimizedVersion?: OptimizedEmail;
}

export interface EmailWritingTip {
  title: string;
  description: string;
  category: 'subject' | 'opening' | 'body' | 'cta' | 'general';
  applicableToType: EmailType[];
}

