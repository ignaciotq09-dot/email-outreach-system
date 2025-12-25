/**
 * AI Email Personalization Schema - Tables
 * Database table definitions for user-specific email generation personalization
 */

import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index, unique, real } from "drizzle-orm/pg-core";
import { users } from "./users-schema";

// =============================================================================
// USER EMAIL PERSONALIZATION
// Core personalization settings that apply to all email generation
// =============================================================================

export const userEmailPersonalization = pgTable("user_email_personalization", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),

    // Core AI instructions (freeform text guiding the AI)
    personalInstructions: text("personal_instructions"),

    // Optional: Example emails the user has written (for AI to learn their voice)
    favoriteEmailSamples: text("favorite_email_samples"),

    // User's preferred signature block
    signatureBlock: text("signature_block"),

    // Words to never use in emails
    avoidWords: text("avoid_words").array().default([]),

    // Words the user prefers/likes to use
    preferredWords: text("preferred_words").array().default([]),

    // Maximum preferred email length (in words)
    maxEmailLength: integer("max_email_length").default(150),

    // Minimum preferred email length (in words)
    minEmailLength: integer("min_email_length").default(50),

    // Tone profile - each value is 1-10
    toneFormality: integer("tone_formality").default(5),
    toneWarmth: integer("tone_warmth").default(5),
    toneDirectness: integer("tone_directness").default(5),
    toneHumor: integer("tone_humor").default(3),
    toneUrgency: integer("tone_urgency").default(3),

    // Variant diversity
    variantDiversity: integer("variant_diversity").default(5),

    // Greeting preferences
    preferredGreetings: text("preferred_greetings").array().default([]),
    avoidGreetings: text("avoid_greetings").array().default([]),

    // Closing preferences  
    preferredClosings: text("preferred_closings").array().default([]),
    avoidClosings: text("avoid_closings").array().default([]),

    // Structure preferences
    preferBulletPoints: boolean("prefer_bullet_points").default(false),
    preferNumberedLists: boolean("prefer_numbered_lists").default(false),
    preferQuestions: boolean("prefer_questions").default(true),
    preferSingleCTA: boolean("prefer_single_cta").default(true),

    // AI-extracted patterns from voice samples (computed)
    extractedPatterns: jsonb("extracted_patterns").$type<{
        averageSentenceLength: number;
        commonPhrases: string[];
        greetingStyle: string;
        closingStyle: string;
        punctuationStyle: string;
        formalityScore: number;
        warmthScore: number;
        keyCharacteristics: string[];
    }>(),

    // AI-learned patterns from edit history (computed)
    learnedEdits: jsonb("learned_edits").$type<{
        commonRemovals: string[];
        commonAdditions: string[];
        lengthPreference: "shorter" | "longer" | "same";
        formalityAdjustment: number;
        totalEditsAnalyzed: number;
        lastAnalyzedAt: string;
    }>(),

    // Master toggle
    isEnabled: boolean("is_enabled").default(true),

    // Which base style to use as default
    defaultBaseStyle: varchar("default_base_style", { length: 50 }).default("balanced"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index("user_email_personalization_user_id_idx").on(table.userId),
    isEnabledIdx: index("user_email_personalization_enabled_idx").on(table.isEnabled),
}));

// =============================================================================
// USER VOICE SAMPLES
// =============================================================================

export const userVoiceSamples = pgTable("user_voice_samples", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    sampleText: text("sample_text").notNull(),
    context: varchar("context", { length: 100 }),
    extractedCharacteristics: jsonb("extracted_characteristics").$type<{
        wordCount: number;
        sentenceCount: number;
        averageSentenceLength: number;
        hasGreeting: boolean;
        greetingUsed: string | null;
        hasClosing: boolean;
        closingUsed: string | null;
        hasQuestion: boolean;
        questionCount: number;
        formalityScore: number;
        warmthScore: number;
        notablePatterns: string[];
    }>(),
    isActive: boolean("is_active").default(true),
    displayOrder: integer("display_order").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index("user_voice_samples_user_id_idx").on(table.userId),
    isActiveIdx: index("user_voice_samples_active_idx").on(table.isActive),
}));

// =============================================================================
// USER EMAIL PERSONAS
// =============================================================================

export const userEmailPersonas = pgTable("user_email_personas", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    instructions: text("instructions"),
    toneFormality: integer("tone_formality"),
    toneWarmth: integer("tone_warmth"),
    toneDirectness: integer("tone_directness"),
    toneHumor: integer("tone_humor"),
    toneUrgency: integer("tone_urgency"),
    maxEmailLength: integer("max_email_length"),
    minEmailLength: integer("min_email_length"),
    baseStyle: varchar("base_style", { length: 50 }),
    icon: varchar("icon", { length: 50 }).default("mail"),
    color: varchar("color", { length: 20 }).default("blue"),
    isDefault: boolean("is_default").default(false),
    isActive: boolean("is_active").default(true),
    timesUsed: integer("times_used").default(0),
    lastUsedAt: timestamp("last_used_at"),
    displayOrder: integer("display_order").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index("user_email_personas_user_id_idx").on(table.userId),
    isDefaultIdx: index("user_email_personas_default_idx").on(table.isDefault),
    isActiveIdx: index("user_email_personas_active_idx").on(table.isActive),
    userNameUnique: unique("user_email_personas_user_name_unique").on(table.userId, table.name),
}));

// =============================================================================
// EMAIL EDIT HISTORY
// =============================================================================

export const emailEditHistory = pgTable("email_edit_history", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    originalText: text("original_text").notNull(),
    editedText: text("edited_text").notNull(),
    personaId: integer("persona_id").references(() => userEmailPersonas.id, { onDelete: 'set null' }),
    baseStyle: varchar("base_style", { length: 50 }),
    editMetrics: jsonb("edit_metrics").$type<{
        originalWordCount: number;
        editedWordCount: number;
        wordCountChange: number;
        wordsAdded: string[];
        wordsRemoved: string[];
        phrasesAdded: string[];
        phrasesRemoved: string[];
        greetingChanged: boolean;
        closingChanged: boolean;
        structureChanged: boolean;
        editMagnitude: number;
    }>(),
    wasAnalyzed: boolean("was_analyzed").default(false),
    analyzedAt: timestamp("analyzed_at"),
    campaignId: integer("campaign_id"),
    contactId: integer("contact_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index("email_edit_history_user_id_idx").on(table.userId),
    wasAnalyzedIdx: index("email_edit_history_analyzed_idx").on(table.wasAnalyzed),
    createdAtIdx: index("email_edit_history_created_at_idx").on(table.createdAt),
    personaIdIdx: index("email_edit_history_persona_id_idx").on(table.personaId),
}));

// =============================================================================
// PERSONALIZATION ANALYTICS
// =============================================================================

export const personalizationAnalytics = pgTable("personalization_analytics", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    periodType: varchar("period_type", { length: 20 }).notNull().$type<"daily" | "weekly" | "monthly">(),
    emailsWithPersonalization: integer("emails_with_personalization").default(0),
    emailsWithoutPersonalization: integer("emails_without_personalization").default(0),
    personalizedOpenRate: real("personalized_open_rate"),
    nonPersonalizedOpenRate: real("non_personalized_open_rate"),
    personalizedReplyRate: real("personalized_reply_rate"),
    nonPersonalizedReplyRate: real("non_personalized_reply_rate"),
    personaPerformance: jsonb("persona_performance").$type<Array<{
        personaId: number;
        personaName: string;
        emailsSent: number;
        opens: number;
        replies: number;
        openRate: number;
        replyRate: number;
    }>>().default([]),
    bestPerformingTone: jsonb("best_performing_tone").$type<{
        formality: number;
        warmth: number;
        directness: number;
        replyRate: number;
    }>(),
    insights: jsonb("insights").$type<Array<{
        type: "positive" | "negative" | "suggestion";
        message: string;
        metric: string;
        value: number;
    }>>().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index("personalization_analytics_user_id_idx").on(table.userId),
    periodStartIdx: index("personalization_analytics_period_start_idx").on(table.periodStart),
    periodTypeIdx: index("personalization_analytics_period_type_idx").on(table.periodType),
    userPeriodUnique: unique("personalization_analytics_user_period_unique").on(
        table.userId, table.periodStart, table.periodType
    ),
}));
