import type { Contact } from "@shared/schema";

export interface SmsPersonalizationOptions {
  baseMessage: string;
  contact: Contact;
  senderName?: string;
  writingStyle?: string;
}

export interface SmsVariant {
  id: string;
  hookType: 'curiosity' | 'question' | 'direct' | 'social-proof';
  message: string;
  charCount: number;
  hookPreview: string;
}

export interface SmsPersonalizationResult {
  recommended: SmsVariant;
  variants: SmsVariant[];
  timing: TimingRecommendation;
  contactWarmth: 'cold' | 'warm' | 'hot';
}

export interface TimingRecommendation {
  optimalWindow: string;
  timezone: string | null;
  localTime: string | null;
  reason: string;
}

export interface TriggerContext {
  hasTrigger: boolean;
  triggerText: string;
  industry: string;
}

export interface VariantGenerationOptions {
  baseMessage: string;
  contact: Contact;
  firstName: string;
  senderName?: string;
  writingStyle?: string;
  styleInstruction: string;
  readableStyleName: string;
  hookType: 'curiosity' | 'question' | 'direct' | 'social-proof';
  triggerContext: TriggerContext;
  warmth: 'cold' | 'warm' | 'hot';
  variantIndex: number;
}
