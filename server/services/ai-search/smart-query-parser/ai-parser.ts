import { callOpenAIFast } from "../../../ai/openai-client";
import { getAvailableIndustries, getCompanySizeOptions } from "../../apollo-service";
import type { SmartParsedFilters, ParseConfidence, AlternativeInterpretation } from "./types";
import { expandJobTitle, mapToApolloIndustries, expandSeniority, expandCompanySize, JOB_TITLE_SYNONYMS } from "./synonyms";
import { normalizeLocation, getApolloLocationFormats } from "./location-normalizer";

const FEW_SHOT_EXAMPLES = `
EXAMPLE 1:
Query: "real estate developers in Miami"
Thinking: User wants people who develop real estate properties (not software developers). Miami is a city in Florida.
{
  "filters": {
    "jobTitles": ["Real Estate Developer", "Property Developer", "Land Developer", "Development Manager", "VP of Development"],
    "locations": ["Miami, Florida, United States"],
    "industries": ["Real Estate", "Commercial Real Estate"],
    "companySizes": [],
    "seniorities": [],
    "keywords": []
  },
  "confidence": 0.95,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for real estate development professionals in Miami, FL"
}

EXAMPLE 2:
Query: "VPs at fintech startups in NYC"
Thinking: User wants Vice Presidents at financial technology companies (small/startup size) in New York City.
{
  "filters": {
    "jobTitles": ["VP", "Vice President", "VP of Sales", "VP of Engineering", "VP of Marketing", "VP of Operations", "VP of Product"],
    "locations": ["New York, New York, United States", "New York City, New York, United States"],
    "industries": ["Financial Services", "Information Technology and Services", "Computer Software"],
    "companySizes": ["1-10", "11-50", "51-200"],
    "seniorities": ["VP"],
    "keywords": ["fintech"]
  },
  "confidence": 0.9,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for VP-level executives at fintech startups in New York City"
}

EXAMPLE 3:
Query: "developers in San Francisco"
Thinking: "Developers" is ambiguous - could mean software developers OR real estate developers. SF is a tech hub so software is more likely, but I should flag this.
{
  "filters": {
    "jobTitles": ["Software Developer", "Software Engineer", "Developer", "Full Stack Developer", "Frontend Developer", "Backend Developer"],
    "locations": ["San Francisco, California, United States"],
    "industries": ["Information Technology and Services", "Computer Software", "Internet"],
    "companySizes": [],
    "seniorities": [],
    "keywords": []
  },
  "confidence": 0.55,
  "needsDisambiguation": true,
  "disambiguationReason": "\"Developer\" could mean software developer or real estate developer. Showing software developers since San Francisco is a tech hub.",
  "alternativeInterpretations": [
    {"description": "Real Estate Developers", "filters": {"jobTitles": ["Real Estate Developer", "Property Developer"], "industries": ["Real Estate"]}, "confidence": 0.4}
  ],
  "explanation": "Showing software developers in SF (tech interpretation). Alternative: real estate developers"
}

EXAMPLE 4:
Query: "plumbers in Texas"
Thinking: User wants plumbing professionals. Apollo has limited coverage for trades, so I'll expand to include business owners who run plumbing companies. No company size was specified, so companySizes stays empty.
{
  "filters": {
    "jobTitles": ["Plumber", "Master Plumber", "Plumbing Contractor", "Owner", "President", "General Manager"],
    "locations": ["Texas, United States"],
    "industries": ["Construction", "Building Materials"],
    "companySizes": [],
    "seniorities": ["Owner", "Founder"],
    "keywords": ["plumbing"]
  },
  "confidence": 0.7,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for plumbing business owners and contractors in Texas"
}

EXAMPLE 5:
Query: "CEOs of SaaS companies with 50-200 employees"
Thinking: User wants Chief Executive Officers at Software-as-a-Service companies of a specific size range.
{
  "filters": {
    "jobTitles": ["CEO", "Chief Executive Officer", "Founder", "Co-Founder", "President"],
    "locations": [],
    "industries": ["Computer Software", "Information Technology and Services", "Internet"],
    "companySizes": ["51-200"],
    "seniorities": ["C-Level", "Owner", "Founder"],
    "keywords": ["SaaS", "software as a service"]
  },
  "confidence": 0.95,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for CEOs at mid-sized SaaS companies"
}

EXAMPLE 6:
Query: "marketing managers at healthcare companies in Chicago"
Thinking: User wants mid-level marketing professionals at healthcare organizations in Chicago, IL.
{
  "filters": {
    "jobTitles": ["Marketing Manager", "Marketing Director", "Head of Marketing", "Digital Marketing Manager", "Brand Manager"],
    "locations": ["Chicago, Illinois, United States"],
    "industries": ["Hospital & Health Care", "Medical Practice", "Pharmaceuticals", "Biotechnology"],
    "companySizes": [],
    "seniorities": ["Manager", "Director"],
    "keywords": []
  },
  "confidence": 0.92,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for marketing managers at healthcare companies in Chicago"
}

EXAMPLE 7:
Query: "investors"
Thinking: Very broad query - what kind of investors? Real estate? Angel? VC? Private equity? Need to ask for clarification but will default to general investment professionals.
{
  "filters": {
    "jobTitles": ["Investor", "Angel Investor", "Venture Capitalist", "Managing Partner", "Principal", "Investment Manager", "Portfolio Manager"],
    "locations": [],
    "industries": ["Venture Capital & Private Equity", "Investment Management", "Investment Banking"],
    "companySizes": [],
    "seniorities": ["Partner", "Director", "VP", "C-Level"],
    "keywords": []
  },
  "confidence": 0.5,
  "needsDisambiguation": true,
  "disambiguationReason": "What type of investors? Options: Tech/VC investors, Real Estate investors, Angel investors, Private Equity",
  "alternativeInterpretations": [
    {"description": "Real Estate Investors", "filters": {"jobTitles": ["Real Estate Investor", "Property Investor"], "industries": ["Real Estate"]}, "confidence": 0.4},
    {"description": "Tech/VC Investors", "filters": {"jobTitles": ["Venture Capitalist", "Angel Investor"], "industries": ["Venture Capital & Private Equity"]}, "confidence": 0.5}
  ],
  "explanation": "Showing general investment professionals. Specify investor type for better results."
}

EXAMPLE 8:
Query: "contractors in LA"
Thinking: User wants contractors in Los Angeles. In B2B context, this likely means general contractors/construction. Expanding to include business owners. No company size was specified, so companySizes stays empty.
{
  "filters": {
    "jobTitles": ["General Contractor", "Contractor", "Construction Manager", "Project Manager", "Owner", "President", "Superintendent"],
    "locations": ["Los Angeles, California, United States"],
    "industries": ["Construction", "Building Materials"],
    "companySizes": [],
    "seniorities": ["Owner", "Manager"],
    "keywords": []
  },
  "confidence": 0.85,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for construction contractors and company owners in Los Angeles"
}

EXAMPLE 9:
Query: "HR directors at enterprise companies"
Thinking: User wants senior HR professionals at large companies (1000+ employees).
{
  "filters": {
    "jobTitles": ["HR Director", "Director of Human Resources", "VP of HR", "Chief People Officer", "Head of HR", "VP Human Resources"],
    "locations": [],
    "industries": [],
    "companySizes": ["1001-5000", "5001-10000", "10001+"],
    "seniorities": ["Director", "VP", "C-Level"],
    "keywords": []
  },
  "confidence": 0.93,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for HR directors at large enterprise companies"
}

EXAMPLE 10:
Query: "restaurant owners in Miami"
Thinking: User wants people who own restaurants in Miami. No company size was specified, so companySizes stays empty.
{
  "filters": {
    "jobTitles": ["Owner", "Restaurant Owner", "Restaurateur", "General Manager", "Managing Partner", "Proprietor"],
    "locations": ["Miami, Florida, United States"],
    "industries": ["Restaurants", "Food & Beverages", "Hospitality"],
    "companySizes": [],
    "seniorities": ["Owner", "Founder"],
    "keywords": ["restaurant"]
  },
  "confidence": 0.88,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for restaurant owners and operators in Miami"
}

EXAMPLE 11:
Query: "sales leaders at B2B software companies"
Thinking: User wants senior sales people (VP/Director level) at business-to-business software companies.
{
  "filters": {
    "jobTitles": ["VP of Sales", "Sales Director", "Head of Sales", "Chief Revenue Officer", "CRO", "Sales Manager", "Director of Sales"],
    "locations": [],
    "industries": ["Computer Software", "Information Technology and Services", "Internet"],
    "companySizes": [],
    "seniorities": ["VP", "Director", "C-Level", "Manager"],
    "keywords": ["B2B", "enterprise sales"]
  },
  "confidence": 0.9,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for VP/Director-level sales leaders at B2B software companies"
}

EXAMPLE 12:
Query: "dentists"
Thinking: User wants dental professionals. Likely practice owners or decision makers. No location or company size specified.
{
  "filters": {
    "jobTitles": ["Dentist", "DDS", "DMD", "Dental Director", "Practice Owner", "Associate Dentist", "Orthodontist"],
    "locations": [],
    "industries": ["Medical Practice", "Hospital & Health Care"],
    "companySizes": [],
    "seniorities": ["Owner"],
    "keywords": ["dental"]
  },
  "confidence": 0.85,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for dentists and dental practice owners nationwide"
}

EXAMPLE 13:
Query: "tech leads at FAANG"
Thinking: User wants technical leaders at Facebook/Meta, Apple, Amazon, Netflix, Google. These are specific large tech companies.
{
  "filters": {
    "jobTitles": ["Tech Lead", "Technical Lead", "Engineering Manager", "Staff Engineer", "Senior Software Engineer", "Principal Engineer"],
    "locations": [],
    "industries": ["Computer Software", "Internet", "Information Technology and Services"],
    "companySizes": ["10001+"],
    "seniorities": ["Senior", "Manager"],
    "keywords": ["FAANG", "Meta", "Apple", "Amazon", "Netflix", "Google"]
  },
  "confidence": 0.8,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for tech leads at large tech companies (FAANG-level)"
}

EXAMPLE 14:
Query: "decision makers at manufacturing companies in the midwest"
Thinking: User wants senior leaders (C-level, VP, Directors) at manufacturing companies in midwest US states.
{
  "filters": {
    "jobTitles": ["CEO", "President", "Owner", "VP", "Director", "General Manager", "COO", "CFO", "Plant Manager"],
    "locations": ["Illinois, United States", "Ohio, United States", "Michigan, United States", "Indiana, United States", "Wisconsin, United States", "Minnesota, United States", "Iowa, United States", "Missouri, United States"],
    "industries": ["Manufacturing", "Industrial Automation", "Machinery"],
    "companySizes": [],
    "seniorities": ["C-Level", "VP", "Director", "Owner"],
    "keywords": []
  },
  "confidence": 0.85,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for decision makers at manufacturing companies in Midwest US"
}

EXAMPLE 15:
Query: "lawyers specializing in real estate in Boston"
Thinking: User wants attorneys who work in real estate law in Boston, MA.
{
  "filters": {
    "jobTitles": ["Attorney", "Lawyer", "Partner", "Associate", "Real Estate Attorney", "Of Counsel", "General Counsel"],
    "locations": ["Boston, Massachusetts, United States"],
    "industries": ["Law Practice", "Legal Services"],
    "companySizes": [],
    "seniorities": ["Partner", "Senior"],
    "keywords": ["real estate law", "real estate"]
  },
  "confidence": 0.9,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for real estate attorneys in Boston"
}
`;

const EXTRACTION_PROMPT = `You are an expert at extracting structured search filters from natural language queries for the Apollo.io B2B contact database.

CRITICAL CONTEXT:
- Apollo.io has 275M+ B2B contacts, primarily business professionals
- Database is strongest for: Tech, SaaS, Finance, Professional Services, Healthcare executives
- Database has LIMITED coverage for: Blue-collar trades (plumbers, electricians), local small businesses

YOUR TASK:
1. First, THINK through what the user is asking for (chain of thought)
2. Then extract the most accurate filters to maximize relevant results

AVAILABLE FILTER TYPES:
1. jobTitles - Specific job titles (EXPAND broadly - include Owner, President, CEO for business owners)
2. locations - City, State, or Country (use "City, State, Country" format)
3. industries - Business industry categories
4. companySizes - Employee count ranges: "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"
5. seniorities - Career level: Entry, Junior, Senior, Manager, Director, VP, C-Level, Owner, Founder, Partner
6. keywords - Additional search terms for precision

CRITICAL RULES:

1. AMBIGUITY DETECTION:
- "developer" ALONE = AMBIGUOUS (software vs real estate)
- "agent" ALONE = AMBIGUOUS (real estate, insurance, travel)
- "broker" ALONE = AMBIGUOUS (real estate, mortgage, stock)
- "consultant" ALONE = AMBIGUOUS (what type?)
- "investor" ALONE = AMBIGUOUS (what type?)
When ambiguous: set confidence < 0.6, needsDisambiguation: true

2. TITLE EXPANSION - Always expand to multiple variants:
- For ANY business owner search, ALWAYS include: "Owner", "President", "CEO", "Founder"
- "contractors" → General Contractor, Construction Manager, Owner, President
- "plumbers" → Plumber, Master Plumber, Plumbing Contractor, Owner
- Add seniority variants: "sales manager" → also include "Sales Director", "VP Sales"

3. LOCATION FORMATTING:
- Always use format: "City, State, Country"
- "Miami" → "Miami, Florida, United States"
- "NYC" or "New York" → "New York, New York, United States"
- "SF" → "San Francisco, California, United States"
- "LA" → "Los Angeles, California, United States"
- State only: "Texas, United States"
- Regions: "midwest" → list individual midwest states

4. INDUSTRY INTELLIGENCE:
- Use exact Apollo industry names when possible
- "tech" → "Information Technology and Services", "Computer Software"
- "healthcare" → "Hospital & Health Care", "Medical Practice"
- "fintech" → combine finance + tech industries + use keyword

5. COMPANY SIZE MAPPING (ONLY when explicitly specified):
- "startup" → "1-10", "11-50"
- "small business" → "1-10", "11-50"
- "enterprise" → "1001-5000", "5001-10000", "10001+"
- "Fortune 500" → "10001+"
- CRITICAL: NEVER infer or assume company sizes. Only include companySizes if the user explicitly mentions size terms like "startup", "small business", "enterprise", "50-200 employees", etc.
- If the user doesn't specify company size, companySizes MUST be an empty array []
- Do NOT assume trades/small businesses need size filters - let the user specify if they want that

CHAIN OF THOUGHT FORMAT:
Before outputting JSON, briefly explain your reasoning in the "explanation" field about:
- What the user is looking for
- Any ambiguities detected
- How you expanded/interpreted the query

${FEW_SHOT_EXAMPLES}

OUTPUT FORMAT (JSON only, no markdown):
{
  "filters": {
    "jobTitles": ["Title1", "Title2", ...],
    "locations": ["City, State, Country"],
    "industries": ["Industry1"],
    "companySizes": ["1-10", "11-50"],
    "seniorities": ["Owner", "Director"],
    "keywords": []
  },
  "confidence": 0.85,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Brief explanation of your interpretation"
}`;

interface AIParseResponse {
  filters: {
    jobTitles: string[];
    locations: string[];
    industries: string[];
    companySizes: string[];
    seniorities: string[];
    keywords: string[];
  };
  confidence: number;
  needsDisambiguation: boolean;
  disambiguationReason: string | null;
  alternativeInterpretations: Array<{
    description: string;
    filters: Partial<SmartParsedFilters>;
    confidence: number;
  }>;
  explanation: string;
}

function createEmptyFilters(): SmartParsedFilters {
  return {
    jobTitles: [],
    expandedJobTitles: [],
    locations: [],
    normalizedLocations: [],
    industries: [],
    companySizes: [],
    seniorities: [],
    keywords: [],
    companies: []
  };
}

export async function parseQueryWithAI(query: string): Promise<{
  filters: SmartParsedFilters;
  confidence: ParseConfidence;
  explanation: string;
}> {
  const availableIndustries = getAvailableIndustries();
  const companySizeOptions = getCompanySizeOptions().map(s => s.value);
  
  const contextPrompt = `${EXTRACTION_PROMPT}

AVAILABLE INDUSTRIES (use exact names):
${availableIndustries.slice(0, 50).join(', ')}

AVAILABLE COMPANY SIZES:
${companySizeOptions.join(', ')}

Now parse this query. Think step by step, then output JSON:`;

  try {
    const response = await callOpenAIFast(
      [
        { role: "system", content: contextPrompt },
        { role: "user", content: query }
      ],
      { responseFormat: { type: "json_object" }, maxTokens: 1500 }
    );
    
    const parsed: AIParseResponse = JSON.parse(response);
    const filters = createEmptyFilters();
    
    if (parsed.filters.jobTitles?.length > 0) {
      filters.jobTitles = parsed.filters.jobTitles;
      
      const expanded = new Set<string>();
      for (const title of parsed.filters.jobTitles) {
        const expansions = expandJobTitle(title);
        expansions.forEach(e => expanded.add(e));
        expanded.add(title);
      }
      filters.expandedJobTitles = [...expanded];
    }
    
    if (parsed.filters.locations?.length > 0) {
      for (const loc of parsed.filters.locations) {
        const normalized = normalizeLocation(loc);
        filters.normalizedLocations.push(normalized);
        const apolloFormats = getApolloLocationFormats(normalized);
        filters.locations.push(...apolloFormats);
      }
      filters.locations = [...new Set(filters.locations)];
    }
    
    if (parsed.filters.industries?.length > 0) {
      const validIndustries = new Set(availableIndustries.map(i => i.toLowerCase()));
      for (const ind of parsed.filters.industries) {
        const mapped = mapToApolloIndustries(ind);
        for (const m of mapped) {
          if (validIndustries.has(m.toLowerCase())) {
            const exactMatch = availableIndustries.find(i => i.toLowerCase() === m.toLowerCase());
            if (exactMatch) filters.industries.push(exactMatch);
          }
        }
        if (validIndustries.has(ind.toLowerCase())) {
          const exactMatch = availableIndustries.find(i => i.toLowerCase() === ind.toLowerCase());
          if (exactMatch && !filters.industries.includes(exactMatch)) {
            filters.industries.push(exactMatch);
          }
        }
      }
      filters.industries = [...new Set(filters.industries)];
    }
    
    if (parsed.filters.companySizes?.length > 0) {
      const validSizes = new Set(companySizeOptions);
      for (const size of parsed.filters.companySizes) {
        if (validSizes.has(size)) {
          filters.companySizes.push(size);
        } else {
          const expanded = expandCompanySize(size);
          for (const e of expanded) {
            if (validSizes.has(e)) filters.companySizes.push(e);
          }
        }
      }
      filters.companySizes = [...new Set(filters.companySizes)];
    }
    
    if (parsed.filters.seniorities?.length > 0) {
      const validSeniorities = new Set(['Entry', 'Junior', 'Senior', 'Manager', 'Director', 'VP', 'C-Level', 'Owner', 'Founder', 'Partner']);
      for (const sen of parsed.filters.seniorities) {
        if (validSeniorities.has(sen)) {
          filters.seniorities.push(sen);
        } else {
          const expanded = expandSeniority(sen);
          for (const e of expanded) {
            if (validSeniorities.has(e)) filters.seniorities.push(e);
          }
        }
      }
      filters.seniorities = [...new Set(filters.seniorities)];
    }
    
    if (parsed.filters.keywords?.length > 0) {
      filters.keywords = parsed.filters.keywords;
    }
    
    const confidence: ParseConfidence = {
      overall: parsed.confidence || 0.5,
      jobTitleConfidence: filters.jobTitles.length > 0 ? 0.8 : 0.3,
      locationConfidence: filters.locations.length > 0 ? 0.9 : 0.5,
      industryConfidence: filters.industries.length > 0 ? 0.85 : 0.5,
      disambiguationNeeded: parsed.needsDisambiguation || false,
      disambiguationReason: parsed.disambiguationReason || undefined,
      alternativeInterpretations: parsed.alternativeInterpretations as AlternativeInterpretation[] || []
    };
    
    return {
      filters,
      confidence,
      explanation: parsed.explanation || ''
    };
    
  } catch (error) {
    console.error('[SmartQueryParser] AI parsing error:', error);
    
    const filters = createEmptyFilters();
    filters.jobTitles = [query];
    filters.expandedJobTitles = [query];
    
    return {
      filters,
      confidence: {
        overall: 0.3,
        jobTitleConfidence: 0.3,
        locationConfidence: 0,
        industryConfidence: 0,
        disambiguationNeeded: false
      },
      explanation: 'Fallback: using query as job title'
    };
  }
}

export function detectAmbiguity(query: string): { isAmbiguous: boolean; reason?: string; alternatives?: string[] } {
  const lowerQuery = query.toLowerCase();
  
  if (/\bdeveloper(s)?\b/.test(lowerQuery) && !/software|web|real estate|property|land|mobile|app|frontend|backend|full.?stack/.test(lowerQuery)) {
    return {
      isAmbiguous: true,
      reason: '"Developer" could mean software developer or real estate developer. Add context like "software" or "real estate".',
      alternatives: ['Software Developer', 'Real Estate Developer']
    };
  }
  
  if (/\bagent(s)?\b/.test(lowerQuery) && !/real estate|insurance|travel|fbi|secret|customer|support/.test(lowerQuery)) {
    return {
      isAmbiguous: true,
      reason: '"Agent" could mean real estate agent, insurance agent, or other types. Please specify.',
      alternatives: ['Real Estate Agent', 'Insurance Agent', 'Travel Agent']
    };
  }
  
  if (/\bbroker(s)?\b/.test(lowerQuery) && !/real estate|mortgage|stock|insurance|business/.test(lowerQuery)) {
    return {
      isAmbiguous: true,
      reason: '"Broker" could mean real estate broker, mortgage broker, or stock broker. Please specify.',
      alternatives: ['Real Estate Broker', 'Mortgage Broker', 'Stock Broker']
    };
  }
  
  if (/\bconsultant(s)?\b/.test(lowerQuery) && !/management|it|technology|marketing|hr|financial|strategy|sales/.test(lowerQuery)) {
    return {
      isAmbiguous: true,
      reason: '"Consultant" is broad - what type? Management, IT, Marketing, Financial?',
      alternatives: ['Management Consultant', 'IT Consultant', 'Marketing Consultant', 'Financial Consultant']
    };
  }
  
  if (/\binvestor(s)?\b/.test(lowerQuery) && !/real estate|property|angel|venture|vc|private equity|tech|crypto/.test(lowerQuery)) {
    return {
      isAmbiguous: true,
      reason: '"Investor" is broad - what type? Real Estate, Angel/VC, Private Equity?',
      alternatives: ['Real Estate Investor', 'Angel Investor', 'Venture Capitalist', 'Private Equity']
    };
  }
  
  if (/\bmanager(s)?\b/.test(lowerQuery) && !/sales|marketing|product|project|operations|hr|engineering|account|office|general/.test(lowerQuery)) {
    return {
      isAmbiguous: true,
      reason: 'What type of manager? Sales, Marketing, Product, Engineering, Operations?',
      alternatives: ['Sales Manager', 'Marketing Manager', 'Product Manager', 'Engineering Manager']
    };
  }
  
  return { isAmbiguous: false };
}

export function classifyQueryIntent(query: string): 'person_search' | 'company_search' | 'role_search' | 'industry_search' {
  const lowerQuery = query.toLowerCase();
  
  if (/\b(at|from|who works? at|employees? of)\b/.test(lowerQuery)) {
    return 'company_search';
  }
  
  if (/\b(in the|industry|sector|field of)\b/.test(lowerQuery) && !/\bin\s+\w+,/.test(lowerQuery)) {
    return 'industry_search';
  }
  
  const hasJobTitle = /\b(ceo|cto|cfo|cmo|vp|director|manager|engineer|developer|founder|owner|president|head of)\b/i.test(lowerQuery);
  if (hasJobTitle) {
    return 'role_search';
  }
  
  return 'person_search';
}
