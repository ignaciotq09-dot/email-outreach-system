/**
 * AI Email Personalization Schema
 * Comprehensive database tables for user-specific email generation personalization
 * 
 * This schema supports:
 * - Personal AI instructions that guide email generation
 * - Voice samples for AI to learn user's writing style
 * - Tone profile sliders (formality, warmth, directness)
 * - Multiple personas for different outreach contexts
 * - Edit history tracking for passive AI learning
 * - Avoid/prefer word constraints
 */

import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index, unique, real } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
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
  // This is a simple text field where users can paste 1-2 sample emails
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
  toneFormality: integer("tone_formality").default(5), // 1=very casual, 10=very formal
  toneWarmth: integer("tone_warmth").default(5), // 1=very direct/cold, 10=very warm/friendly
  toneDirectness: integer("tone_directness").default(5), // 1=indirect/subtle, 10=very direct/explicit
  toneHumor: integer("tone_humor").default(3), // 1=no humor, 10=playful/witty
  toneUrgency: integer("tone_urgency").default(3), // 1=relaxed, 10=urgent call-to-action
  
  // Variant diversity - how different should generated email variants be
  variantDiversity: integer("variant_diversity").default(5), // 1=similar/polished, 10=dramatically different
  
  // Greeting preferences
  preferredGreetings: text("preferred_greetings").array().default([]), // e.g., ["Hi", "Hey", "Hello"]
  avoidGreetings: text("avoid_greetings").array().default([]), // e.g., ["Dear", "To Whom It May Concern"]
  
  // Closing preferences  
  preferredClosings: text("preferred_closings").array().default([]), // e.g., ["Best", "Cheers", "Thanks"]
  avoidClosings: text("avoid_closings").array().default([]), // e.g., ["Sincerely", "Regards"]
  
  // Structure preferences
  preferBulletPoints: boolean("prefer_bullet_points").default(false),
  preferNumberedLists: boolean("prefer_numbered_lists").default(false),
  preferQuestions: boolean("prefer_questions").default(true), // End with a question?
  preferSingleCTA: boolean("prefer_single_cta").default(true), // One clear call-to-action
  
  // AI-extracted patterns from voice samples (computed)
  extractedPatterns: jsonb("extracted_patterns").$type<{
    averageSentenceLength: number;
    commonPhrases: string[];
    greetingStyle: string;
    closingStyle: string;
    punctuationStyle: string; // e.g., "uses exclamation marks", "minimal punctuation"
    formalityScore: number; // AI-detected, 1-10
    warmthScore: number; // AI-detected, 1-10
    keyCharacteristics: string[]; // e.g., ["uses contractions", "asks questions", "short paragraphs"]
  }>(),
  
  // AI-learned patterns from edit history (computed)
  learnedEdits: jsonb("learned_edits").$type<{
    commonRemovals: string[]; // Words/phrases user often removes
    commonAdditions: string[]; // Words/phrases user often adds
    lengthPreference: "shorter" | "longer" | "same";
    formalityAdjustment: number; // -5 to +5 (user tends to make more/less formal)
    totalEditsAnalyzed: number;
    lastAnalyzedAt: string;
  }>(),
  
  // Master toggle
  isEnabled: boolean("is_enabled").default(true),
  
  // Which base style to use as default when no persona is selected
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
// Store examples of emails the user has written for AI to learn from
// =============================================================================

export const userVoiceSamples = pgTable("user_voice_samples", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // The sample email text
  sampleText: text("sample_text").notNull(),
  
  // Optional context about this sample
  context: varchar("context", { length: 100 }), // e.g., "cold outreach", "follow-up", "intro"
  
  // AI-extracted characteristics from this specific sample
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
    formalityScore: number; // 1-10
    warmthScore: number; // 1-10
    notablePatterns: string[];
  }>(),
  
  // Is this sample active (used for personalization)?
  isActive: boolean("is_active").default(true),
  
  // Order for display
  displayOrder: integer("display_order").default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("user_voice_samples_user_id_idx").on(table.userId),
  isActiveIdx: index("user_voice_samples_active_idx").on(table.isActive),
}));

// =============================================================================
// USER EMAIL PERSONAS
// Different personalization profiles for different contexts
// =============================================================================

export const userEmailPersonas = pgTable("user_email_personas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Persona name (e.g., "Cold Outreach", "Follow-up", "Partnership", "Warm Intro")
  name: varchar("name", { length: 100 }).notNull(),
  
  // Description of when to use this persona
  description: text("description"),
  
  // Persona-specific AI instructions (layered on top of main personalization)
  instructions: text("instructions"),
  
  // Persona-specific tone overrides (null means use main personalization)
  toneFormality: integer("tone_formality"), // 1-10 or null
  toneWarmth: integer("tone_warmth"), // 1-10 or null
  toneDirectness: integer("tone_directness"), // 1-10 or null
  toneHumor: integer("tone_humor"), // 1-10 or null
  toneUrgency: integer("tone_urgency"), // 1-10 or null
  
  // Persona-specific length preferences (null means use main personalization)
  maxEmailLength: integer("max_email_length"),
  minEmailLength: integer("min_email_length"),
  
  // Which base style to use with this persona
  baseStyle: varchar("base_style", { length: 50 }), // null means use user's default
  
  // Icon/color for UI
  icon: varchar("icon", { length: 50 }).default("mail"),
  color: varchar("color", { length: 20 }).default("blue"),
  
  // Is this the default persona?
  isDefault: boolean("is_default").default(false),
  
  // Is this persona active?
  isActive: boolean("is_active").default(true),
  
  // Usage statistics
  timesUsed: integer("times_used").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  // Order for display
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
// Track when users modify AI-generated emails to learn from their preferences
// =============================================================================

export const emailEditHistory = pgTable("email_edit_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // The original AI-generated text
  originalText: text("original_text").notNull(),
  
  // The user's edited version
  editedText: text("edited_text").notNull(),
  
  // Which persona was used (if any)
  personaId: integer("persona_id").references(() => userEmailPersonas.id, { onDelete: 'set null' }),
  
  // Which base style was used
  baseStyle: varchar("base_style", { length: 50 }),
  
  // Edit metrics (computed on save)
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
    editMagnitude: number; // 0-1, how much was changed
  }>(),
  
  // Was this edit analyzed for learning?
  wasAnalyzed: boolean("was_analyzed").default(false),
  analyzedAt: timestamp("analyzed_at"),
  
  // Context
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
// Track how personalization affects email performance
// =============================================================================

export const personalizationAnalytics = pgTable("personalization_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Time period for this analytics record
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull().$type<"daily" | "weekly" | "monthly">(),
  
  // Emails sent with personalization enabled
  emailsWithPersonalization: integer("emails_with_personalization").default(0),
  
  // Emails sent without personalization
  emailsWithoutPersonalization: integer("emails_without_personalization").default(0),
  
  // Performance comparison
  personalizedOpenRate: real("personalized_open_rate"),
  nonPersonalizedOpenRate: real("non_personalized_open_rate"),
  personalizedReplyRate: real("personalized_reply_rate"),
  nonPersonalizedReplyRate: real("non_personalized_reply_rate"),
  
  // Per-persona performance
  personaPerformance: jsonb("persona_performance").$type<Array<{
    personaId: number;
    personaName: string;
    emailsSent: number;
    opens: number;
    replies: number;
    openRate: number;
    replyRate: number;
  }>>().default([]),
  
  // Tone settings that performed best
  bestPerformingTone: jsonb("best_performing_tone").$type<{
    formality: number;
    warmth: number;
    directness: number;
    replyRate: number;
  }>(),
  
  // Insights generated
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
// UPDATE SCHEMAS (for PATCH operations)
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
    1: "Very Casual",
    2: "Casual",
    3: "Relaxed",
    4: "Slightly Casual",
    5: "Balanced",
    6: "Slightly Formal",
    7: "Professional",
    8: "Formal",
    9: "Very Formal",
    10: "Corporate/Official",
  },
  warmth: {
    1: "Very Direct",
    2: "Direct",
    3: "Straightforward",
    4: "Slightly Cool",
    5: "Balanced",
    6: "Friendly",
    7: "Warm",
    8: "Very Warm",
    9: "Enthusiastic",
    10: "Effusive",
  },
  directness: {
    1: "Very Subtle",
    2: "Subtle",
    3: "Indirect",
    4: "Slightly Indirect",
    5: "Balanced",
    6: "Clear",
    7: "Direct",
    8: "Very Direct",
    9: "Blunt",
    10: "Extremely Blunt",
  },
  humor: {
    1: "No Humor",
    2: "Minimal",
    3: "Occasional",
    4: "Light",
    5: "Balanced",
    6: "Playful",
    7: "Witty",
    8: "Very Witty",
    9: "Humorous",
    10: "Very Playful",
  },
  urgency: {
    1: "No Rush",
    2: "Relaxed",
    3: "Low Urgency",
    4: "Mild",
    5: "Balanced",
    6: "Moderate",
    7: "Important",
    8: "Urgent",
    9: "Very Urgent",
    10: "Critical",
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
