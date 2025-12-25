// AI Parser Core Functions
import { callOpenAIFast } from "../../../../ai/openai-client";
import { getAvailableIndustries, getCompanySizeOptions } from "../../../apollo-service";
import type { SmartParsedFilters, ParseConfidence, AlternativeInterpretation } from "../types";
import { expandJobTitle, mapToApolloIndustries, expandSeniority, expandCompanySize } from "../synonyms";
import { normalizeLocation, getApolloLocationFormats } from "../location-normalizer";
import { EXTRACTION_PROMPT } from "../prompts";

interface AIParseResponse {
    filters: { jobTitles: string[]; locations: string[]; industries: string[]; companySizes: string[]; seniorities: string[]; keywords: string[]; technologies?: string[]; };
    confidence: number;
    needsDisambiguation: boolean;
    disambiguationReason: string | null;
    alternativeInterpretations: Array<{ description: string; filters: Partial<SmartParsedFilters>; confidence: number; }>;
    explanation: string;
}

function createEmptyFilters(): SmartParsedFilters {
    return { jobTitles: [], expandedJobTitles: [], locations: [], normalizedLocations: [], industries: [], companySizes: [], seniorities: [], keywords: [], companies: [], technologies: [] };
}

export async function parseQueryWithAI(query: string): Promise<{ filters: SmartParsedFilters; confidence: ParseConfidence; explanation: string; }> {
    const availableIndustries = getAvailableIndustries();
    const companySizeOptions = getCompanySizeOptions().map(s => s.value);
    const contextPrompt = `${EXTRACTION_PROMPT}\n\nAVAILABLE INDUSTRIES (use exact names):\n${availableIndustries.slice(0, 50).join(', ')}\n\nAVAILABLE COMPANY SIZES:\n${companySizeOptions.join(', ')}\n\nNow parse this query. Think step by step, then output JSON:`;
    try {
        const response = await callOpenAIFast([{ role: "system", content: contextPrompt }, { role: "user", content: query }], { responseFormat: { type: "json_object" }, maxTokens: 1500 });
        const parsed: AIParseResponse = JSON.parse(response);
        const filters = createEmptyFilters();
        if (parsed.filters.jobTitles?.length > 0) {
            filters.jobTitles = parsed.filters.jobTitles;
            const expanded = new Set<string>();
            for (const title of parsed.filters.jobTitles) { const expansions = expandJobTitle(title); expansions.forEach(e => expanded.add(e)); expanded.add(title); }
            filters.expandedJobTitles = [...expanded];
        }
        if (parsed.filters.locations?.length > 0) {
            for (const loc of parsed.filters.locations) { const normalized = normalizeLocation(loc); filters.normalizedLocations.push(normalized); const apolloFormats = getApolloLocationFormats(normalized); filters.locations.push(...apolloFormats); }
            filters.locations = [...new Set(filters.locations)];
        }
        if (parsed.filters.industries?.length > 0) {
            const validIndustries = new Set(availableIndustries.map(i => i.toLowerCase()));
            for (const ind of parsed.filters.industries) {
                const mapped = mapToApolloIndustries(ind);
                for (const m of mapped) { if (validIndustries.has(m.toLowerCase())) { const exactMatch = availableIndustries.find(i => i.toLowerCase() === m.toLowerCase()); if (exactMatch) filters.industries.push(exactMatch); } }
                if (validIndustries.has(ind.toLowerCase())) { const exactMatch = availableIndustries.find(i => i.toLowerCase() === ind.toLowerCase()); if (exactMatch && !filters.industries.includes(exactMatch)) filters.industries.push(exactMatch); }
            }
            filters.industries = [...new Set(filters.industries)];
        }
        if (parsed.filters.companySizes?.length > 0) {
            const validSizes = new Set(companySizeOptions);
            for (const size of parsed.filters.companySizes) { if (validSizes.has(size)) filters.companySizes.push(size); else { const expanded = expandCompanySize(size); for (const e of expanded) if (validSizes.has(e)) filters.companySizes.push(e); } }
            filters.companySizes = [...new Set(filters.companySizes)];
        }
        if (parsed.filters.seniorities?.length > 0) {
            const validSeniorities = new Set(['Entry', 'Junior', 'Senior', 'Manager', 'Director', 'VP', 'C-Level', 'Owner', 'Founder', 'Partner']);
            for (const sen of parsed.filters.seniorities) { if (validSeniorities.has(sen)) filters.seniorities.push(sen); else { const expanded = expandSeniority(sen); for (const e of expanded) if (validSeniorities.has(e)) filters.seniorities.push(e); } }
            filters.seniorities = [...new Set(filters.seniorities)];
        }
        if (parsed.filters.keywords?.length > 0) filters.keywords = parsed.filters.keywords;
        // P0: Handle technologies extraction
        if (parsed.filters.technologies && parsed.filters.technologies.length > 0) {
            filters.technologies = parsed.filters.technologies;
        }
        const confidence: ParseConfidence = { overall: parsed.confidence || 0.5, jobTitleConfidence: filters.jobTitles.length > 0 ? 0.8 : 0.3, locationConfidence: filters.locations.length > 0 ? 0.9 : 0.5, industryConfidence: filters.industries.length > 0 ? 0.85 : 0.5, disambiguationNeeded: parsed.needsDisambiguation || false, disambiguationReason: parsed.disambiguationReason || undefined, alternativeInterpretations: parsed.alternativeInterpretations as AlternativeInterpretation[] || [] };
        return { filters, confidence, explanation: parsed.explanation || '' };
    } catch (error) {
        console.error('[SmartQueryParser] AI parsing error:', error);
        const filters = createEmptyFilters(); filters.jobTitles = [query]; filters.expandedJobTitles = [query];
        return { filters, confidence: { overall: 0.3, jobTitleConfidence: 0.3, locationConfidence: 0, industryConfidence: 0, disambiguationNeeded: false }, explanation: 'Fallback: using query as job title' };
    }
}

export function detectAmbiguity(query: string): { isAmbiguous: boolean; reason?: string; alternatives?: string[] } {
    const lowerQuery = query.toLowerCase();
    if (/\bdeveloper(s)?\b/.test(lowerQuery) && !/software|web|real estate|property|land|mobile|app|frontend|backend|full.?stack/.test(lowerQuery)) return { isAmbiguous: true, reason: '"Developer" could mean software developer or real estate developer. Add context like "software" or "real estate".', alternatives: ['Software Developer', 'Real Estate Developer'] };
    if (/\bagent(s)?\b/.test(lowerQuery) && !/real estate|insurance|travel|fbi|secret|customer|support/.test(lowerQuery)) return { isAmbiguous: true, reason: '"Agent" could mean real estate agent, insurance agent, or other types. Please specify.', alternatives: ['Real Estate Agent', 'Insurance Agent', 'Travel Agent'] };
    if (/\bbroker(s)?\b/.test(lowerQuery) && !/real estate|mortgage|stock|insurance|business/.test(lowerQuery)) return { isAmbiguous: true, reason: '"Broker" could mean real estate broker, mortgage broker, or stock broker. Please specify.', alternatives: ['Real Estate Broker', 'Mortgage Broker', 'Stock Broker'] };
    if (/\bconsultant(s)?\b/.test(lowerQuery) && !/management|it|technology|marketing|hr|financial|strategy|sales/.test(lowerQuery)) return { isAmbiguous: true, reason: '"Consultant" is broad - what type? Management, IT, Marketing, Financial?', alternatives: ['Management Consultant', 'IT Consultant', 'Marketing Consultant', 'Financial Consultant'] };
    if (/\binvestor(s)?\b/.test(lowerQuery) && !/real estate|property|angel|venture|vc|private equity|tech|crypto/.test(lowerQuery)) return { isAmbiguous: true, reason: '"Investor" is broad - what type? Real Estate, Angel/VC, Private Equity?', alternatives: ['Real Estate Investor', 'Angel Investor', 'Venture Capitalist', 'Private Equity'] };
    if (/\bmanager(s)?\b/.test(lowerQuery) && !/sales|marketing|product|project|operations|hr|engineering|account|office|general/.test(lowerQuery)) return { isAmbiguous: true, reason: 'What type of manager? Sales, Marketing, Product, Engineering, Operations?', alternatives: ['Sales Manager', 'Marketing Manager', 'Product Manager', 'Engineering Manager'] };
    return { isAmbiguous: false };
}

export function classifyQueryIntent(query: string): 'person_search' | 'company_search' | 'role_search' | 'industry_search' {
    const lowerQuery = query.toLowerCase();
    if (/\b(at|from|who works? at|employees? of)\b/.test(lowerQuery)) return 'company_search';
    if (/\b(in the|industry|sector|field of)\b/.test(lowerQuery) && !/\bin\s+\w+,/.test(lowerQuery)) return 'industry_search';
    if (/\b(ceo|cto|cfo|cmo|vp|director|manager|engineer|developer|founder|owner|president|head of)\b/i.test(lowerQuery)) return 'role_search';
    return 'person_search';
}
