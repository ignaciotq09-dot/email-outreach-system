// Re-export from modular structure for backward compatibility
export { analyzeVoiceSample, aggregatePatterns, buildPersonalizationPrompt, analyzeEditPatterns } from "./voice-analyzer/index";
export type { VoiceCharacteristics, ExtractedPatterns } from "./voice-analyzer/index";
// Alias for backward compatibility
export { aggregatePatterns as aggregateVoicePatterns } from "./voice-analyzer/index";
