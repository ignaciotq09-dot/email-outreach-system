/**
 * AI Email Personalization Schema - Relations, Schemas & Constants
 * Relations, insert/update schemas, types, and constants
 */

import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";
import {
    userEmailPersonalization,
    userVoiceSamples,
    userEmailPersonas,
    emailEditHistory,
    personalizationAnalytics
} from "./email-personalization-tables";

// =============================================================================
// RELATIONS
// =============================================================================

export const userEmailPersonalizationRelations = relations(userEmailPersonalization, ({ one, many }) => ({
    user: one(users, {
        fields: [userEmailPersonalization.userId],
        references: [users.id],
    }),
}));

export const userVoiceSamplesRelations = relations(userVoiceSamples, ({ one }) => ({
    user: one(users, {
        fields: [userVoiceSamples.userId],
        references: [users.id],
    }),
}));

export const userEmailPersonasRelations = relations(userEmailPersonas, ({ one, many }) => ({
    user: one(users, {
        fields: [userEmailPersonas.userId],
        references: [users.id],
    }),
    editHistory: many(emailEditHistory),
}));

export const emailEditHistoryRelations = relations(emailEditHistory, ({ one }) => ({
    user: one(users, {
        fields: [emailEditHistory.userId],
        references: [users.id],
    }),
    persona: one(userEmailPersonas, {
        fields: [emailEditHistory.personaId],
        references: [userEmailPersonas.id],
    }),
}));

export const personalizationAnalyticsRelations = relations(personalizationAnalytics, ({ one }) => ({
    user: one(users, {
        fields: [personalizationAnalytics.userId],
        references: [users.id],
    }),
}));

// =============================================================================
// INSERT SCHEMAS
// =============================================================================

export const insertUserEmailPersonalizationSchema = createInsertSchema(userEmailPersonalization).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const insertUserVoiceSampleSchema = createInsertSchema(userVoiceSamples).omit({
    id: true,
    createdAt: true,
});

export const insertUserEmailPersonaSchema = createInsertSchema(userEmailPersonas).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    timesUsed: true,
    lastUsedAt: true,
});

export const insertEmailEditHistorySchema = createInsertSchema(emailEditHistory).omit({
    id: true,
    createdAt: true,
    wasAnalyzed: true,
    analyzedAt: true,
});

export const insertPersonalizationAnalyticsSchema = createInsertSchema(personalizationAnalytics).omit({
    id: true,
    createdAt: true,
});

// =============================================================================
// UPDATE SCHEMAS
// =============================================================================

export const updateUserEmailPersonalizationSchema = insertUserEmailPersonalizationSchema.partial().omit({
    userId: true,
});

export const updateUserEmailPersonaSchema = insertUserEmailPersonaSchema.partial().omit({
    userId: true,
});

// =============================================================================
// TYPES
// =============================================================================

export type InsertUserEmailPersonalization = z.infer<typeof insertUserEmailPersonalizationSchema>;
export type InsertUserVoiceSample = z.infer<typeof insertUserVoiceSampleSchema>;
export type InsertUserEmailPersona = z.infer<typeof insertUserEmailPersonaSchema>;
export type InsertEmailEditHistory = z.infer<typeof insertEmailEditHistorySchema>;
export type InsertPersonalizationAnalytics = z.infer<typeof insertPersonalizationAnalyticsSchema>;

export type UpdateUserEmailPersonalization = z.infer<typeof updateUserEmailPersonalizationSchema>;
export type UpdateUserEmailPersona = z.infer<typeof updateUserEmailPersonaSchema>;

export type UserEmailPersonalization = typeof userEmailPersonalization.$inferSelect;
export type UserVoiceSample = typeof userVoiceSamples.$inferSelect;
export type UserEmailPersona = typeof userEmailPersonas.$inferSelect;
export type EmailEditHistory = typeof emailEditHistory.$inferSelect;
export type PersonalizationAnalytics = typeof personalizationAnalytics.$inferSelect;

// =============================================================================
// TONE PROFILE CONSTANTS
// =============================================================================

export const TONE_LABELS = {
    formality: {
        1: "Very Casual", 2: "Casual", 3: "Relaxed", 4: "Slightly Casual", 5: "Balanced",
        6: "Slightly Formal", 7: "Professional", 8: "Formal", 9: "Very Formal", 10: "Corporate/Official",
    },
    warmth: {
        1: "Very Direct", 2: "Direct", 3: "Straightforward", 4: "Slightly Cool", 5: "Balanced",
        6: "Friendly", 7: "Warm", 8: "Very Warm", 9: "Enthusiastic", 10: "Effusive",
    },
    directness: {
        1: "Very Subtle", 2: "Subtle", 3: "Indirect", 4: "Slightly Indirect", 5: "Balanced",
        6: "Clear", 7: "Direct", 8: "Very Direct", 9: "Blunt", 10: "Extremely Blunt",
    },
    humor: {
        1: "No Humor", 2: "Minimal", 3: "Occasional", 4: "Light", 5: "Balanced",
        6: "Playful", 7: "Witty", 8: "Very Witty", 9: "Humorous", 10: "Very Playful",
    },
    urgency: {
        1: "No Rush", 2: "Relaxed", 3: "Low Urgency", 4: "Mild", 5: "Balanced",
        6: "Moderate", 7: "Important", 8: "Urgent", 9: "Very Urgent", 10: "Critical",
    },
} as const;

export const DEFAULT_PERSONAS = [
    {
        name: "Cold Outreach",
        description: "First contact with someone who doesn't know you",
        icon: "snowflake",
        color: "blue",
        instructions: "Be concise and value-focused. Establish credibility quickly. Focus on their potential pain points.",
    },
    {
        name: "Warm Introduction",
        description: "When you have a mutual connection or prior context",
        icon: "handshake",
        color: "green",
        instructions: "Reference the connection. Be warmer and more personal. Less formal than cold outreach.",
    },
    {
        name: "Follow-up",
        description: "Following up on a previous email or conversation",
        icon: "reply",
        color: "orange",
        instructions: "Keep it short. Reference the previous interaction. Provide additional value or a gentle nudge.",
    },
    {
        name: "Partnership",
        description: "Proposing a business partnership or collaboration",
        icon: "users",
        color: "purple",
        instructions: "Focus on mutual benefits. Be professional but enthusiastic. Highlight synergies.",
    },
] as const;
