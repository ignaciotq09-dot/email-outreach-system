/**
 * AI-Powered Contact Search Schema
 * Re-export file for backward compatibility
 */

// Re-export tables
export {
  leadSearchSessions,
  leadFeedbackEvents,
  tenantIcpProfiles,
  searchPatterns,
  contactEmbeddings,
  aiSearchSuggestions,
} from "./ai-search-tables";

// Re-export relations, schemas, types, and constants
export {
  // Relations
  leadSearchSessionsRelations,
  leadFeedbackEventsRelations,
  contactEmbeddingsRelations,
  // Insert schemas
  insertLeadSearchSessionSchema,
  insertLeadFeedbackEventSchema,
  insertTenantIcpProfileSchema,
  insertSearchPatternSchema,
  insertContactEmbeddingSchema,
  insertAiSearchSuggestionSchema,
  // Types
  type InsertLeadSearchSession,
  type InsertLeadFeedbackEvent,
  type InsertTenantIcpProfile,
  type InsertSearchPattern,
  type InsertContactEmbedding,
  type InsertAiSearchSuggestion,
  type LeadSearchSession,
  type LeadFeedbackEvent,
  type TenantIcpProfile,
  type SearchPattern,
  type ContactEmbedding,
  type AiSearchSuggestion,
  // Constants
  FEEDBACK_WEIGHTS,
  // Shared types
  type MissingSignal,
  type SearchCategory,
  type ActiveFilters,
  type ParsedFilters,
  type GuidanceTip,
  type SuggestedAddition,
  type AdaptiveGuidance,
} from "./ai-search-types";
