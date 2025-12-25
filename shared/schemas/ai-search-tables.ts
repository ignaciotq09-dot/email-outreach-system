/**
 * AI-Powered Contact Search Schema - Tables
 * Database table definitions for intelligent lead discovery
 */

import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index, real, unique } from "drizzle-orm/pg-core";
import { contacts } from "./contacts-schema";

// =============================================================================
// LEAD SEARCH SESSIONS
// Track conversational AI search sessions with refinement history
// =============================================================================

export const leadSearchSessions = pgTable("lead_search_sessions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    originalQuery: text("original_query").notNull(),
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
    parseConfidence: real("parse_confidence").default(1.0),
    parseExplanation: text("parse_explanation"),
    refinementHistory: jsonb("refinement_history").$type<Array<{
        command: string;
        appliedAt: string;
        filtersBefore: Record<string, any>;
        filtersAfter: Record<string, any>;
    }>>().default([]),
    currentRefinementStep: integer("current_refinement_step").default(0),
    resultsCount: integer("results_count").default(0),
    searchDurationMs: integer("search_duration_ms"),
    wasSuccessful: boolean("was_successful").default(false),
    successScore: real("success_score").default(0),
    status: varchar("status", { length: 20 }).default("active").$type<"active" | "completed" | "abandoned">(),
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
// =============================================================================

export const leadFeedbackEvents = pgTable("lead_feedback_events", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    searchSessionId: integer("search_session_id").references(() => leadSearchSessions.id),
    contactId: integer("contact_id").references(() => contacts.id),
    apolloLeadId: varchar("apollo_lead_id", { length: 100 }),
    feedbackType: varchar("feedback_type", { length: 30 }).notNull().$type<
        "thumbs_up" | "thumbs_down" | "imported" | "emailed" | "opened" | "replied" | "converted" | "unsubscribed"
    >(),
    weightedScore: real("weighted_score").notNull(),
    leadAttributes: jsonb("lead_attributes").$type<{
        title: string | null;
        seniority: string | null;
        industry: string | null;
        companySize: string | null;
        location: string | null;
        technologies: string[] | null;
        revenue: string | null;
    }>(),
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
// =============================================================================

export const tenantIcpProfiles = pgTable("tenant_icp_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().unique(),
    titlePreferences: jsonb("title_preferences").$type<Array<{
        title: string; weight: number; sampleSize: number; lastUpdated: string;
    }>>().default([]),
    industryPreferences: jsonb("industry_preferences").$type<Array<{
        industry: string; weight: number; sampleSize: number; lastUpdated: string;
    }>>().default([]),
    companySizePreferences: jsonb("company_size_preferences").$type<Array<{
        size: string; weight: number; sampleSize: number; lastUpdated: string;
    }>>().default([]),
    locationPreferences: jsonb("location_preferences").$type<Array<{
        location: string; weight: number; sampleSize: number; lastUpdated: string;
    }>>().default([]),
    seniorityPreferences: jsonb("seniority_preferences").$type<Array<{
        seniority: string; weight: number; sampleSize: number; lastUpdated: string;
    }>>().default([]),
    technologyPreferences: jsonb("technology_preferences").$type<Array<{
        technology: string; weight: number; sampleSize: number; lastUpdated: string;
    }>>().default([]),
    icpConfidence: real("icp_confidence").default(0),
    totalDataPoints: integer("total_data_points").default(0),
    bestPerformingAttributes: jsonb("best_performing_attributes").$type<{
        topTitles: string[]; topIndustries: string[]; topCompanySizes: string[]; topLocations: string[]; averageReplyRate: number;
    }>(),
    modelVersion: integer("model_version").default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastRecalculatedAt: timestamp("last_recalculated_at"),
}, (table) => ({
    userIdIdx: index("tenant_icp_profiles_user_id_idx").on(table.userId),
}));

// =============================================================================
// SEARCH PATTERNS
// =============================================================================

export const searchPatterns = pgTable("search_patterns", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    patternHash: varchar("pattern_hash", { length: 64 }).notNull(),
    filters: jsonb("filters").$type<{
        jobTitles: string[]; locations: string[]; industries: string[]; companySizes: string[]; seniorities: string[]; technologies: string[];
    }>().notNull(),
    description: text("description"),
    timesUsed: integer("times_used").default(1),
    leadsImported: integer("leads_imported").default(0),
    emailsSent: integer("emails_sent").default(0),
    repliesReceived: integer("replies_received").default(0),
    successRate: real("success_rate").default(0),
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
// =============================================================================

export const contactEmbeddings = pgTable("contact_embeddings", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
    apolloLeadId: varchar("apollo_lead_id", { length: 100 }),
    embeddingSource: text("embedding_source").notNull(),
    embedding: jsonb("embedding").$type<number[]>().notNull(),
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
// =============================================================================

export const aiSearchSuggestions = pgTable("ai_search_suggestions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    suggestionType: varchar("suggestion_type", { length: 30 }).notNull().$type<
        "icp_based" | "pattern_based" | "trending" | "similar_to_success"
    >(),
    suggestedFilters: jsonb("suggested_filters").$type<{
        jobTitles: string[]; locations: string[]; industries: string[]; companySizes: string[];
    }>().notNull(),
    suggestionText: text("suggestion_text").notNull(),
    reasoning: text("reasoning"),
    predictedScore: real("predicted_score").default(0.5),
    wasUsed: boolean("was_used").default(false),
    wasSuccessful: boolean("was_successful"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index("ai_search_suggestions_user_id_idx").on(table.userId),
    suggestionTypeIdx: index("ai_search_suggestions_type_idx").on(table.suggestionType),
    expiresAtIdx: index("ai_search_suggestions_expires_at_idx").on(table.expiresAt),
}));
