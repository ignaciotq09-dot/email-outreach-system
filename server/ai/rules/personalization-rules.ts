// Re-export from modular structure for backward compatibility
export { PERSONALIZATION_RULES, calculatePersonalizationScore } from "./personalization/index";
export interface PersonalizationSignal { type: string; pattern: string; impact: string; dataSource?: string; }
