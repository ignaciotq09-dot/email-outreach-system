// Re-export from modular structure for backward compatibility
import { PSYCHOLOGY_OPTIMIZATION_RULES } from './psychology/constants';
import { PSYCHOLOGY_TRIGGERS } from './psychology/triggers';
export type { PsychologyRule } from './psychology/constants';
export const PSYCHOLOGY_OPTIMIZATION_RULES_MERGED = { ...PSYCHOLOGY_OPTIMIZATION_RULES, ...PSYCHOLOGY_TRIGGERS };
export { PSYCHOLOGY_OPTIMIZATION_RULES };
