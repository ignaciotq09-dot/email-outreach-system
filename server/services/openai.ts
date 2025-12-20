// This file now re-exports from the modular AI service files in server/ai/
// All functionality has been split into specialized modules for better organization

export {
  openai,
  MODELS_TO_TRY,
  callOpenAIWithTimeout,
  generateEmailVariants,
  regenerateEmailVariants,
  generateEmailVariantsOptimized,
  regenerateEmailVariantsOptimized,
  getEmailVariantCacheStats,
  clearVariantCache,
  personalizeVariantForContact,
  personalizeEmail,
  parseBulkContacts,
  detectAppointment,
} from "../ai/index";

export type {
  EmailVariant,
  PersonalizeEmailParams,
  ParsedContact,
  AppointmentDetection,
} from "../ai/index";
