// Re-export from modular structure for backward compatibility
export type { PreferenceWeight, IcpProfile, LeadAttributes, IcpScoreResult } from "./batch-scorer/index";
export { fetchIcpProfile, scoreLeadSync, scoreBatch, generateSuggestionsFromProfile } from "./batch-scorer/index";
// Alias for backward compatibility
export { scoreBatch as scoreLeadsBatch } from "./batch-scorer/index";
