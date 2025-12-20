import { INDUSTRIES } from "./industries";
import { COMPANY_SIZE } from "./company-size";
import { SENIORITY_LEVELS } from "./seniority";
import { CULTURAL } from "./cultural";
export { IndustryRule, SeniorityRule } from "./types";

export const INDUSTRY_OPTIMIZATION_RULES = { industries: INDUSTRIES, companySize: COMPANY_SIZE, seniorityLevels: SENIORITY_LEVELS, cultural: CULTURAL };

export function getContextualRules(industry?: string, companySize?: string, seniorityLevel?: string, geography?: string) {
  const rules: any = {}; if (industry && INDUSTRIES[industry as keyof typeof INDUSTRIES]) rules.industry = INDUSTRIES[industry as keyof typeof INDUSTRIES]; if (companySize && COMPANY_SIZE[companySize as keyof typeof COMPANY_SIZE]) rules.companySize = COMPANY_SIZE[companySize as keyof typeof COMPANY_SIZE]; if (seniorityLevel && SENIORITY_LEVELS[seniorityLevel as keyof typeof SENIORITY_LEVELS]) rules.seniority = SENIORITY_LEVELS[seniorityLevel as keyof typeof SENIORITY_LEVELS]; if (geography && CULTURAL[geography as keyof typeof CULTURAL]) rules.cultural = CULTURAL[geography as keyof typeof CULTURAL]; return rules;
}
