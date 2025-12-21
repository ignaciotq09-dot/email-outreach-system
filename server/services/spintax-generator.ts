// Re-export from modular structure for backward compatibility
export type { SpintaxVariation, GenerateVariationsOptions, GenerateUniqueVariationOptions } from "./spintax/index";
export { generateEmailVariations, generateUniqueVariationForContact, recordVariationUsage, getVariationStats, generateBatchVariations, updateVariationOutcome } from "./spintax/index";
// Alias for backward compatibility
export { generateUniqueVariationForContact as getUniqueVariationForContact } from "./spintax/index";
