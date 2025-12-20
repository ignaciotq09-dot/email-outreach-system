// Re-export from modular structure for backward compatibility
export type { PreferenceWeight, IcpProfile, LeadAttributes, IcpScoreResult } from "./batch-scorer/index";
export { fetchIcpProfile, scoreLeadSync, scoreBatch, generateSuggestionsFromProfile } from "./batch-scorer/index";
