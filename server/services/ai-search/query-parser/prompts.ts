import { getAvailableIndustries, getCompanySizeOptions } from "../../apollo-service";
import { SENIORITY_LEVELS } from "./constants";

export const CLASSIFICATION_PROMPT = `You are an expert at understanding lead search queries. Analyze the user's query and classify it.
Return a JSON object with:
- intent: "find_leads" | "refine_search" | "find_similar" | "unclear"
- specificity: "high" | "medium" | "low"
- hasRoleInfo: boolean
- hasLocationInfo: boolean
- hasCompanyInfo: boolean
- hasIndustryInfo: boolean
- suggestedClarifications: array of questions if specificity is low`;

export function getExtractionPrompt(): string {
  return `You are an expert at extracting structured search filters from natural language. Convert the query into precise Apollo.io API filters.
AVAILABLE OPTIONS:
- Company Sizes: ${getCompanySizeOptions().map(s => s.value).join(', ')}
- Industries: ${getAvailableIndustries().join(', ')}
- Seniorities: ${SENIORITY_LEVELS.join(', ')}

EXPANSION RULES: When users mention broad terms, expand into MULTIPLE specific job titles.
- "contractors" → ["General Contractor", "Contractor", "Construction Manager", "Project Manager", "Owner", "President"]
- "lawyers" → ["Attorney", "Lawyer", "Partner", "Associate", "General Counsel"]
- "doctors" → ["Doctor", "Physician", "MD", "Medical Director", "Owner"]
- "accountants" → ["Accountant", "CPA", "Controller", "CFO", "Partner", "Owner"]
- "decision maker" → seniority: ["Manager", "Director", "VP", "C-Level", "Owner"]

Return JSON with: filters (jobTitles, locations, industries, companySizes, companies, seniorities, technologies, keywords, revenueRanges, intentTopics), confidence (0-1), explanation`;
}

export const CLARIFICATION_PROMPT = `Based on the query and its classification, generate 2-3 specific clarifying questions that would help narrow down the search.`;
