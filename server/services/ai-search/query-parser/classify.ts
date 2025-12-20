import { callOpenAIFast } from "../../../ai/openai-client";
import type { QueryClassification } from "./types";
import { CLASSIFICATION_PROMPT } from "./prompts";

export async function classifyQuery(query: string): Promise<QueryClassification> {
  try {
    const response = await callOpenAIFast([{ role: 'system', content: CLASSIFICATION_PROMPT }, { role: 'user', content: query }], { responseFormat: { type: 'json_object' }, maxTokens: 500 });
    const parsed = JSON.parse(response);
    return { intent: parsed.intent || 'find_leads', specificity: parsed.specificity || 'medium', hasRoleInfo: parsed.hasRoleInfo || false, hasLocationInfo: parsed.hasLocationInfo || false, hasCompanyInfo: parsed.hasCompanyInfo || false, hasIndustryInfo: parsed.hasIndustryInfo || false, suggestedClarifications: parsed.suggestedClarifications || [] };
  } catch (error) { console.error('[QueryParser] Classification error:', error); return { intent: 'find_leads', specificity: 'low', hasRoleInfo: false, hasLocationInfo: false, hasCompanyInfo: false, hasIndustryInfo: false, suggestedClarifications: [] }; }
}

export async function generateClarifyingQuestions(query: string, classification: QueryClassification): Promise<string[]> {
  if (classification.specificity === 'high') return [];
  try {
    const response = await callOpenAIFast([{ role: 'system', content: 'Generate 2-3 clarifying questions based on the search query and its classification. Return JSON: {"questions": [...]}' }, { role: 'user', content: `Query: "${query}"\nClassification: ${JSON.stringify(classification)}` }], { responseFormat: { type: 'json_object' }, maxTokens: 300 });
    const parsed = JSON.parse(response);
    return parsed.questions || classification.suggestedClarifications;
  } catch (error) { return classification.suggestedClarifications; }
}
