// Central export file for all AI service modules

// Re-export from openai-client
export { openai, MODELS_TO_TRY, callOpenAIWithTimeout } from "./openai-client";
export type { EmailVariant, PersonalizeEmailParams } from "./openai-client";

// Re-export from email-variants (original)
export { generateEmailVariants, regenerateEmailVariants } from "./email-variants";

// Re-export from email-variants-optimized (faster with caching)
export {
  generateEmailVariantsOptimized,
  regenerateEmailVariantsOptimized,
  getCacheStats as getEmailVariantCacheStats,
  clearVariantCache
} from "./email-variants-optimized";

// Re-export from email-variants-ultimate (best quality with all optimizations)
export {
  generateEmailVariantsUltimate,
  regenerateEmailVariantsUltimate,
  calculateQualityScore,
  getCacheStats as getUltimateCacheStats,
  clearCache as clearUltimateCache
} from "./email-variants-ultimate";
export type { GenerationResult, QualityScore, SimplePersonalization } from "./email-variants-ultimate";

// Re-export from tone-translator (simplified personalization)
export { buildStyleSeasoning, translateToneToGuidance, hasActivePersonalization } from "./tone-translator";

// Re-export benchmark tools for testing
export { runBenchmark, compareModels } from "./email-variant-benchmark";

// Re-export from email-personalization
export { personalizeVariantForContact, personalizeEmail } from "./email-personalization";

// Re-export from bulk-import
export { parseBulkContacts } from "./bulk-import";
export type { ParsedContact } from "./bulk-import";

// Re-export from appointment-detection
export { detectAppointment } from "./appointment-detection";
export type { AppointmentDetection } from "./appointment-detection";

// Re-export optimization modules
export { emailOptimizationOrchestrator, EmailIntent } from "./optimization-orchestrator";
export type { OptimizationContext, OptimizationResult } from "./optimization-orchestrator";
export { performancePredictor } from "./performance-predictor";
export type { PerformanceMetrics } from "./performance-predictor";
export { optimizeFollowUp, calculateOptimalFollowUpTime, shouldSendFollowUp } from "./follow-up-optimizer";
export type { FollowUpConfig } from "./follow-up-optimizer";
