import { callOpenAIFast } from "../../../ai/openai-client";
import type { ParsedFilters } from "./types";
import { createEmptyFilters } from "./constants";
import { getExtractionPrompt } from "./prompts";

export async function extractFilters(query: string): Promise<{ filters: ParsedFilters; confidence: number; explanation: string }> {
  try {
    const response = await callOpenAIFast([{ role: 'system', content: getExtractionPrompt() }, { role: 'user', content: query }], { responseFormat: { type: 'json_object' }, maxTokens: 800 });
    const parsed = JSON.parse(response);
    const filters = createEmptyFilters();
    if (parsed.filters) {
      if (Array.isArray(parsed.filters.jobTitles)) filters.jobTitles = parsed.filters.jobTitles;
      if (Array.isArray(parsed.filters.locations)) filters.locations = parsed.filters.locations;
      if (Array.isArray(parsed.filters.industries)) filters.industries = parsed.filters.industries;
      if (Array.isArray(parsed.filters.companySizes)) filters.companySizes = parsed.filters.companySizes;
      if (Array.isArray(parsed.filters.companies)) filters.companies = parsed.filters.companies;
      if (Array.isArray(parsed.filters.seniorities)) filters.seniorities = parsed.filters.seniorities;
      if (Array.isArray(parsed.filters.technologies)) filters.technologies = parsed.filters.technologies;
      if (Array.isArray(parsed.filters.keywords)) filters.keywords = parsed.filters.keywords;
      if (Array.isArray(parsed.filters.revenueRanges)) filters.revenueRanges = parsed.filters.revenueRanges;
      if (Array.isArray(parsed.filters.intentTopics)) filters.intentTopics = parsed.filters.intentTopics;
    }
    return { filters, confidence: parsed.confidence || 0.5, explanation: parsed.explanation || '' };
  } catch (error) { console.error('[QueryParser] Extraction error:', error); return { filters: createEmptyFilters(), confidence: 0.3, explanation: 'Failed to extract filters' }; }
}
