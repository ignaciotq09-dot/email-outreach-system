import { personalizationLevels } from "./levels";
import { digitalFootprintSignals } from "./digital-footprint";
import { technographicSignals } from "./technographic";
import { triggerEvents } from "./triggers";
import { industryHooks } from "./industry-hooks";
import { scoringRubric, mergePatterns, calculatePersonalizationScore } from "./scoring";

export const PERSONALIZATION_RULES = { personalizationLevels, digitalFootprintSignals, technographicSignals, triggerEvents, industryHooks, scoringRubric, mergePatterns };
export { calculatePersonalizationScore };
export type { PersonalizationSignal } from "../personalization-rules";
