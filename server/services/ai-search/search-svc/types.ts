import type { ParsedFilters, AdaptiveGuidance, GuidanceTip, SuggestedAddition } from "@shared/schema";
import type { EnhancedApolloLead } from "../enhanced-apollo";

export type { AdaptiveGuidance, GuidanceTip, SuggestedAddition };

export interface ScoredLead extends EnhancedApolloLead {
  icpScore: number;
  matchReasons: string[];
  unmatchReasons: string[];
  overallScore: number;
}

export interface AISearchResult {
  sessionId: number;
  query: string;
  parsedFilters: ParsedFilters;
  explanation: string;
  confidence: number;
  needsClarification: boolean;
  clarifyingQuestions: string[];
  leads: ScoredLead[];
  pagination: { page: number; perPage: number; totalPages: number; totalResults: number };
  suggestions: Array<{ text: string; filters: Partial<ParsedFilters>; reasoning: string }>;
  searchMetadata: { durationMs: number; filtersApplied: number; icpScoringEnabled: boolean; cached?: boolean };
  adaptiveGuidance?: AdaptiveGuidance;
}

export interface RefinementResult {
  sessionId: number;
  originalFilters: ParsedFilters;
  refinedFilters: ParsedFilters;
  explanation: string;
  canUndo: boolean;
  leads: ScoredLead[];
  pagination: { page: number; perPage: number; totalPages: number; totalResults: number };
}
