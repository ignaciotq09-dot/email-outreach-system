import type { EmailVariant } from '../openai-client';
import type { OptimizationContext } from "./types";
import { getContextualRules } from '../rules/industry-rules';

export function applyContextualRules(variant: EmailVariant, context: OptimizationContext): { variant: EmailVariant; appliedRules: string[] } {
  const appliedRules: string[] = []; const contextRules = getContextualRules(context.industry, context.companySize, context.seniorityLevel, context.geography);
  if (contextRules.industry) appliedRules.push(`Industry: ${context.industry}`);
  if (contextRules.seniority) { appliedRules.push(`Seniority: ${context.seniorityLevel}`); const maxWords = contextRules.seniority.wordCount?.max; if (maxWords && variant.body.split(' ').length > maxWords) { const words = variant.body.split(' '); variant.body = words.slice(0, maxWords).join(' ') + '...'; } }
  if (contextRules.companySize) appliedRules.push(`Company Size: ${context.companySize}`);
  if (contextRules.cultural) appliedRules.push(`Cultural: ${context.geography}`);
  return { variant, appliedRules };
}
