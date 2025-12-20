/**
 * AI-Powered Contact Search Schema
 * Comprehensive database tables for intelligent lead discovery
 * 
 * This schema supports:
 * - Conversational AI search with session tracking
 * - ICP (Ideal Customer Profile) learning from engagement
 * - Semantic similarity search with embeddings
 * - User feedback loops for continuous improvement
 * - Smart suggestions based on success patterns
 */

import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index, real, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";
import { contacts } from "./contacts-schema";
import { sentEmails } from "./emails-schema";

// =============================================================================
// LEAD SEARCH SESSIONS
// Track conversational AI search sessions with refinement history
// =============================================================================

export const leadSearchSessions = pgTable("lead_search_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Original user query (natural language)
  originalQuery: text("original_query").notNull(),

  // AI-parsed structured filters
  parsedFilters: jsonb("parsed_filters").$type<{
    jobTitles: string[];
    locations: string[];
    industries: string[];
    companySizes: string[];
    seniorities: string[];
    technologies: string[];
    keywords: string[];
    revenueRanges: string[];
    intentTopics: string[];
  }>().notNull(),

  // AI confidence score (0-1)
  parseConfidence: real("parse_confidence").default(1.0),

  // AI explanation of how it interpreted the query
  parseExplanation: text("parse_explanation"),

  // Refinement history for undo/redo
  refinementHistory: jsonb("refinement_history").$type<Array<{
    command: string;
    appliedAt: string;
    filtersBefore: Record<string, any>;
    filtersAfter: Record<string, any>;
  }>>().default([]),

  // Current refinement step (for undo)
  currentRefinementStep: integer("current_refinement_step").default(0),

  // Search results metadata
  resultsCount: integer("results_count").default(0),
  searchDurationMs: integer("search_duration_ms"),

  // Was this search successful (leads imported, emails sent)?
  wasSuccessful: boolean("was_successful").default(false),
  successScore: real("success_score").default(0), // 0-1 based on engagement

  // Session status
  status: varchar("status", { length: 20 }).default("active").$type<
    "active" | "completed" | "abandoned"
  >(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userIdIdx: index("lead_search_sessions_user_id_idx").on(table.userId),
  statusIdx: index("lead_search_sessions_status_idx").on(table.status),
  createdAtIdx: index("lead_search_sessions_created_at_idx").on(table.createdAt),
  successfulIdx: index("lead_search_sessions_successful_idx").on(table.wasSuccessful),
}));

// =============================================================================
// LEAD FEEDBACK EVENTS
// Track user actions on leads for ICP learning
// =============================================================================

export const leadFeedbackEvents = pgTable("lead_feedback_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // The search session this feedback came from
  searchSessionId: integer("search_session_id").references(() => leadSearchSessions.id),

  // The lead/contact this feedback is about
  contactId: integer("contact_id").references(() => contacts.id),
  apolloLeadId: varchar("apollo_lead_id", { length: 100 }),

  // Feedback type and value
  feedbackType: varchar("feedback_type", { length: 30 }).notNull().$type<
    "thumbs_up" | "thumbs_down" | "imported" | "emailed" | "opened" | "replied" | "converted" | "unsubscribed"
  >(),

  // Weighted score for ICP learning
  // thumbs_up: 0.3, imported: 0.5, emailed: 0.6, opened: 0.8, replied: 1.0, converted: 1.5
  // thumbs_down: -0.5, unsubscribed: -1.0
  weightedScore: real("weighted_score").notNull(),

  // Lead attributes at time of feedback (for learning)
  leadAttributes: jsonb("lead_attributes").$type<{
    title: string | null;
    seniority: string | null;
    industry: string | null;
    companySize: string | null;
    location: string | null;
    technologies: string[] | null;
    revenue: string | null;
  }>(),

  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("lead_feedback_events_user_id_idx").on(table.userId),
  searchSessionIdIdx: index("lead_feedback_events_session_idx").on(table.searchSessionId),
  contactIdIdx: index("lead_feedback_events_contact_idx").on(table.contactId),
  feedbackTypeIdx: index("lead_feedback_events_type_idx").on(table.feedbackType),
  createdAtIdx: index("lead_feedback_events_created_at_idx").on(table.createdAt),
}));

// =============================================================================
// TENANT ICP PROFILES
// Learned Ideal Customer Profile per user based on engagement patterns
// =============================================================================

export const tenantIcpProfiles = pgTable("tenant_icp_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),

  // Learned title preferences with weights
  titlePreferences: jsonb("title_preferences").$type<Array<{
    title: string;
    weight: number; // -1 to 1, positive = prefer, negative = avoid
    sampleSize: number;
    lastUpdated: string;
  }>>().default([]),

  // Learned industry preferences
  industryPreferences: jsonb("industry_preferences").$type<Array<{
    industry: string;
    weight: number;
    sampleSize: number;
    lastUpdated: string;
  }>>().default([]),

  // Learned company size preferences
  companySizePreferences: jsonb("company_size_preferences").$type<Array<{
    size: string;
    weight: number;
    sampleSize: number;
    lastUpdated: string;
  }>>().default([]),

  // Learned location preferences
  locationPreferences: jsonb("location_preferences").$type<Array<{
    location: string;
    weight: number;
    sampleSize: number;
    lastUpdated: string;
  }>>().default([]),

  // Learned seniority preferences
  seniorityPreferences: jsonb("seniority_preferences").$type<Array<{
    seniority: string;
    weight: number;
    sampleSize: number;
    lastUpdated: string;
  }>>().default([]),

  // Technology preferences (if available)
  technologyPreferences: jsonb("technology_preferences").$type<Array<{
    technology: string;
    weight: number;
    sampleSize: number;
    lastUpdated: string;
  }>>().default([]),

  // Overall ICP confidence (based on sample size)
  icpConfidence: real("icp_confidence").default(0), // 0-1

  // Total data points used to build ICP
  totalDataPoints: integer("total_data_points").default(0),

  // Best performing lead attributes (for "similar leads" feature)
  bestPerformingAttributes: jsonb("best_performing_attributes").$type<{
    topTitles: string[];
    topIndustries: string[];
    topCompanySizes: string[];
    topLocations: string[];
    averageReplyRate: number;
  }>(),

  // Model version for backward compatibility
  modelVersion: integer("model_version").default(1),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastRecalculatedAt: timestamp("last_recalculated_at"),
}, (table) => ({
  userIdIdx: index("tenant_icp_profiles_user_id_idx").on(table.userId),
}));

// =============================================================================
// SEARCH PATTERNS
// Track successful search patterns for smart suggestions
// =============================================================================

export const searchPatterns = pgTable("search_patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Pattern identifier (hash of filter combination)
  patternHash: varchar("pattern_hash", { length: 64 }).notNull(),

  // The filter combination
  filters: jsonb("filters").$type<{
    jobTitles: string[];
    locations: string[];
    industries: string[];
    companySizes: string[];
    seniorities: string[];
    technologies: string[];
  }>().notNull(),

  // Human-readable description
  description: text("description"),

  // Success metrics
  timesUsed: integer("times_used").default(1),
  leadsImported: integer("leads_imported").default(0),
  emailsSent: integer("emails_sent").default(0),
  repliesReceived: integer("replies_received").default(0),

  // Calculated success rate (replies / emails)
  successRate: real("success_rate").default(0),

  // Is this a "saved search" (user explicitly saved it)?
  isSaved: boolean("is_saved").default(false),
  savedName: varchar("saved_name", { length: 100 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => ({
  userIdIdx: index("search_patterns_user_id_idx").on(table.userId),
  patternHashIdx: index("search_patterns_hash_idx").on(table.patternHash),
  successRateIdx: index("search_patterns_success_rate_idx").on(table.successRate),
  isSavedIdx: index("search_patterns_is_saved_idx").on(table.isSaved),
  userPatternUnique: unique("search_patterns_user_pattern_unique").on(table.userId, table.patternHash),
}));

// =============================================================================
// CONTACT EMBEDDINGS
// Store vector embeddings for semantic similarity search
// =============================================================================

export const contactEmbeddings = pgTable("contact_embeddings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  apolloLeadId: varchar("apollo_lead_id", { length: 100 }),

  // Text that was embedded
  embeddingSource: text("embedding_source").notNull(),

  // The embedding vector (stored as JSONB array, for pgvector we'd use vector type)
  // Using 1536 dimensions for OpenAI text-embedding-3-large
  embedding: jsonb("embedding").$type<number[]>().notNull(),

  // Model info
  embeddingModel: varchar("embedding_model", { length: 50 }).default("text-embedding-3-large"),
  embeddingDimensions: integer("embedding_dimensions").default(1536),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("contact_embeddings_user_id_idx").on(table.userId),
  contactIdIdx: index("contact_embeddings_contact_id_idx").on(table.contactId),
  apolloLeadIdIdx: index("contact_embeddings_apollo_lead_id_idx").on(table.apolloLeadId),
}));

// =============================================================================
// AI SEARCH SUGGESTIONS
// Pre-computed suggestions for users based on ICP and patterns
// =============================================================================

export const aiSearchSuggestions = pgTable("ai_search_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Suggestion type
  suggestionType: varchar("suggestion_type", { length: 30 }).notNull().$type<
    "icp_based" | "pattern_based" | "trending" | "similar_to_success"
  >(),

  // The suggested search
  suggestedFilters: jsonb("suggested_filters").$type<{
    jobTitles: string[];
    locations: string[];
    industries: string[];
    companySizes: string[];
  }>().notNull(),

  // Human-readable suggestion text
  suggestionText: text("suggestion_text").notNull(),

  // Why this was suggested
  reasoning: text("reasoning"),

  // Predicted success score (0-1)
  predictedScore: real("predicted_score").default(0.5),

  // Was this suggestion used?
  wasUsed: boolean("was_used").default(false),
  wasSuccessful: boolean("was_successful"),

  // Expiry (suggestions refresh periodically)
  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("ai_search_suggestions_user_id_idx").on(table.userId),
  suggestionTypeIdx: index("ai_search_suggestions_type_idx").on(table.suggestionType),
  expiresAtIdx: index("ai_search_suggestions_expires_at_idx").on(table.expiresAt),
}));

// =============================================================================
// RELATIONS
// =============================================================================

export const leadSearchSessionsRelations = relations(leadSearchSessions, ({ many }) => ({
  feedbackEvents: many(leadFeedbackEvents),
}));

export const leadFeedbackEventsRelations = relations(leadFeedbackEvents, ({ one }) => ({
  searchSession: one(leadSearchSessions, {
    fields: [leadFeedbackEvents.searchSessionId],
    references: [leadSearchSessions.id],
  }),
  contact: one(contacts, {
    fields: [leadFeedbackEvents.contactId],
    references: [contacts.id],
  }),
}));

export const contactEmbeddingsRelations = relations(contactEmbeddings, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactEmbeddings.contactId],
    references: [contacts.id],
  }),
}));

// =============================================================================
// INSERT SCHEMAS
// =============================================================================

export const insertLeadSearchSessionSchema = createInsertSchema(leadSearchSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadFeedbackEventSchema = createInsertSchema(leadFeedbackEvents).omit({
  id: true,
  createdAt: true,
});

export const insertTenantIcpProfileSchema = createInsertSchema(tenantIcpProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSearchPatternSchema = createInsertSchema(searchPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactEmbeddingSchema = createInsertSchema(contactEmbeddings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiSearchSuggestionSchema = createInsertSchema(aiSearchSuggestions).omit({
  id: true,
  createdAt: true,
});

// =============================================================================
// TYPES
// =============================================================================

export type InsertLeadSearchSession = z.infer<typeof insertLeadSearchSessionSchema>;
export type InsertLeadFeedbackEvent = z.infer<typeof insertLeadFeedbackEventSchema>;
export type InsertTenantIcpProfile = z.infer<typeof insertTenantIcpProfileSchema>;
export type InsertSearchPattern = z.infer<typeof insertSearchPatternSchema>;
export type InsertContactEmbedding = z.infer<typeof insertContactEmbeddingSchema>;
export type InsertAiSearchSuggestion = z.infer<typeof insertAiSearchSuggestionSchema>;

export type LeadSearchSession = typeof leadSearchSessions.$inferSelect;
export type LeadFeedbackEvent = typeof leadFeedbackEvents.$inferSelect;
export type TenantIcpProfile = typeof tenantIcpProfiles.$inferSelect;
export type SearchPattern = typeof searchPatterns.$inferSelect;
export type ContactEmbedding = typeof contactEmbeddings.$inferSelect;
export type AiSearchSuggestion = typeof aiSearchSuggestions.$inferSelect;

// =============================================================================
// FEEDBACK WEIGHT CONSTANTS
// Used for ICP learning calculations
// =============================================================================

export const FEEDBACK_WEIGHTS: Record<string, number> = {
  thumbs_up: 0.3,
  thumbs_down: -0.5,
  imported: 0.5,
  emailed: 0.6,
  opened: 0.8,
  replied: 1.0,
  converted: 1.5,
  unsubscribed: -1.0,
};

// =============================================================================
// AI SEARCH SHARED TYPES
// Used by both frontend and backend for type-safe search guidance
// =============================================================================

/** Types of missing information that could improve a search */
export type MissingSignal = 'job_title' | 'location' | 'company' | 'industry' | 'seniority';

/** Categories of search specificity for adaptive handling */
export type SearchCategory =
  | 'complete'      // 2+ meaningful filters, very specific
  | 'job_only'      // Only job titles specified
  | 'location_only' // Only location specified  
  | 'industry_only' // Only industry specified
  | 'company_only'  // Only company specified
  | 'vague';        // No clear filters extracted

/** Basic filter interface for UI state management */
export interface ActiveFilters {
  jobTitles: string[];
  locations: string[];
  industries: string[];
  companySizes: string[];
  companies: string[];
  emailStatuses?: ("verified" | "unverified")[];
}

/** Extended parsed filters with additional search criteria */
export interface ParsedFilters extends ActiveFilters {
  seniorities: string[];
  technologies: string[];
  keywords: string[];
  revenueRanges: string[];
  intentTopics: string[];
}

/** Guidance tip for improving search quality */
export interface GuidanceTip {
  type: 'add_filter' | 'refine' | 'info';
  message: string;
  suggestedFilter?: {
    field: MissingSignal;
    examples: string[];
  };
}

/** Suggested filter addition from ICP or search history */
export interface SuggestedAddition {
  field: MissingSignal;
  values: string[];
  source: 'icp' | 'history';
  label: string;
}

/** Adaptive guidance for search optimization */
export interface AdaptiveGuidance {
  searchCategory: SearchCategory;
  specificityScore: number;
  tips: GuidanceTip[];
  suggestedAdditions: SuggestedAddition[];
  hasRecommendations: boolean;
}
