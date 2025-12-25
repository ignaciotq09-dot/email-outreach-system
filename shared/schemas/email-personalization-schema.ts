/**
 * AI Email Personalization Schema
 * Re-export file for backward compatibility
 */

// Re-export tables
export {
  userEmailPersonalization,
  userVoiceSamples,
  userEmailPersonas,
  emailEditHistory,
  personalizationAnalytics,
} from "./email-personalization-tables";

// Re-export relations, schemas, types, and constants
export {
  // Relations
  userEmailPersonalizationRelations,
  userVoiceSamplesRelations,
  userEmailPersonasRelations,
  emailEditHistoryRelations,
  personalizationAnalyticsRelations,
  // Insert schemas
  insertUserEmailPersonalizationSchema,
  insertUserVoiceSampleSchema,
  insertUserEmailPersonaSchema,
  insertEmailEditHistorySchema,
  insertPersonalizationAnalyticsSchema,
  // Update schemas
  updateUserEmailPersonalizationSchema,
  updateUserEmailPersonaSchema,
  // Types
  type InsertUserEmailPersonalization,
  type InsertUserVoiceSample,
  type InsertUserEmailPersona,
  type InsertEmailEditHistory,
  type InsertPersonalizationAnalytics,
  type UpdateUserEmailPersonalization,
  type UpdateUserEmailPersona,
  type UserEmailPersonalization,
  type UserVoiceSample,
  type UserEmailPersona,
  type EmailEditHistory,
  type PersonalizationAnalytics,
  // Constants
  TONE_LABELS,
  DEFAULT_PERSONAS,
} from "./email-personalization-relations";
