import type { EmailVariant } from '../openai-client';

export enum EmailIntent { COLD_OUTREACH = 'cold_outreach', WARM_INTRODUCTION = 'warm_introduction', FOLLOW_UP = 'follow_up', NURTURE = 'nurture', RE_ENGAGEMENT = 're_engagement', MEETING_REQUEST = 'meeting_request', VALUE_DELIVERY = 'value_delivery', BREAKUP = 'breakup' }

export interface OptimizationContext { intent?: EmailIntent; industry?: string; companySize?: string; seniorityLevel?: string; geography?: string; previousEngagement?: boolean; personalizationSignals?: string[]; abTestVariant?: string; }

export interface OptimizationResult { optimizedVariant: EmailVariant; score: number; improvements: string[]; predictions: { openRate: string; responseRate: string; conversionRate: string }; appliedRules: string[]; abTestMetadata?: { variant: string; testId: string }; }
