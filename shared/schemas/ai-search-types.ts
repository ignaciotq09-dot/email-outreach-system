/**
 * AI-Powered Contact Search Schema - Types, Relations & Schemas
 * Relations, insert schemas, types, and constants for AI search
 */

import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import {
    leadSearchSessions,
    leadFeedbackEvents,
    tenantIcpProfiles,
    searchPatterns,
    contactEmbeddings,
    aiSearchSuggestions,
} from "./ai-search-tables";

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

export const insertLeadSearchSessionSchema = createInsertSchema(leadSearchSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadFeedbackEventSchema = createInsertSchema(leadFeedbackEvents).omit({ id: true, createdAt: true });
export const insertTenantIcpProfileSchema = createInsertSchema(tenantIcpProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSearchPatternSchema = createInsertSchema(searchPatterns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactEmbeddingSchema = createInsertSchema(contactEmbeddings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiSearchSuggestionSchema = createInsertSchema(aiSearchSuggestions).omit({ id: true, createdAt: true });

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
// =============================================================================

export const FEEDBACK_WEIGHTS: Record<string, number> = {
    thumbs_up: 0.3, thumbs_down: -0.5, imported: 0.5, emailed: 0.6,
    opened: 0.8, replied: 1.0, converted: 1.5, unsubscribed: -1.0,
};

// =============================================================================
// AI SEARCH SHARED TYPES
// =============================================================================

export type MissingSignal = 'job_title' | 'location' | 'company' | 'industry' | 'seniority';

export type SearchCategory = 'complete' | 'job_only' | 'location_only' | 'industry_only' | 'company_only' | 'vague';

export interface ActiveFilters {
    jobTitles: string[];
    locations: string[];
    industries: string[];
    companySizes: string[];
    companies: string[];
    emailStatuses?: ("verified" | "unverified")[];
}

export interface ParsedFilters extends ActiveFilters {
    seniorities: string[];
    technologies: string[];
    keywords: string[];
    revenueRanges: string[];
    intentTopics: string[];
}

export interface GuidanceTip {
    type: 'add_filter' | 'refine' | 'info';
    message: string;
    suggestedFilter?: { field: MissingSignal; examples: string[]; };
}

export interface SuggestedAddition {
    field: MissingSignal;
    values: string[];
    source: 'icp' | 'history';
    label: string;
}

export interface AdaptiveGuidance {
    searchCategory: SearchCategory;
    specificityScore: number;
    tips: GuidanceTip[];
    suggestedAdditions: SuggestedAddition[];
    hasRecommendations: boolean;
}
