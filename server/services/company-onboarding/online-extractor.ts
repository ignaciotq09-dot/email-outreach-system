// AI-powered extraction from website and Instagram
// Optimized with parallel fetching, tiered AI, and fallback sources

import OpenAI from 'openai';
import type { OnlinePresenceInput, ExtractionResult, ExtractedCompanyData, ExtractionGap } from './types';

// Strategic paths to fetch for maximum info
const STRATEGIC_PATHS = [
    '',                // Homepage
    '/about',          // About page
    '/about-us',       // About variant
    '/services',       // Services
    '/what-we-do',     // Services variant
    '/products',       // Products
    '/contact',        // Contact
    '/our-story',      // Story
];

// Critical fields that must be found
const CRITICAL_FIELDS = [
    'companyName', 'businessDescription', 'productsServices', 'industry'
];

function getOpenAI(): OpenAI {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please set AI_INTEGRATIONS_OPENAI_API_KEY.');
    }
    return new OpenAI({ apiKey });
}

// STRICT extraction prompt - anti-hallucination focused
const COMPREHENSIVE_EXTRACTION_PROMPT = `You are extracting business information from a website. Your job is to find ONLY what is explicitly written.

ABSOLUTE RULES - VIOLATION IS FAILURE:
1. Extract ONLY what is EXPLICITLY written on the page - never use your general knowledge
2. If you cannot find a field, set it to null - NEVER guess or make something up
3. For every value you extract, you must be able to point to the exact text on the page
4. Your training knowledge is IRRELEVANT - only the website content matters
5. A null/missing value is CORRECT. A fabricated value is WRONG.

CONFIDENCE SCORING (be strict):
- 90-100: Exact text match, explicitly stated on the page
- 70-89: Clearly implied with strong context from the page
- 50-69: Weakly inferred - ONLY if you can cite supporting text
- Below 50: DO NOT include - return null instead

Extract these fields (return null if not found):

=== COMPANY IDENTITY ===
- companyName: Official company name (usually in logo, header, or footer)
- industry: Their primary industry (use THEIR words, not yours)
- businessDescription: What they do (use their exact wording)
- employeeCount: Team size if mentioned
- headquarters: Location if mentioned

=== PRODUCTS & SERVICES ===
- primaryOffering: Main product/service they sell
- productsServices: Array of ALL specific products/services listed
- pricingModel: How they charge (if stated)
- typicalDealSize: Contract value (if mentioned)

=== TARGET CUSTOMERS (ICP) - CRITICAL ===
Look for "Who we serve", customer logos, case studies, testimonials.
- idealCustomerDescription: Their explicit description of ideal customer
- targetIndustries: Industries they explicitly mention serving
- targetCompanySizes: Company sizes they target (startup, SMB, enterprise, etc.)
- targetJobTitles: Job titles mentioned in testimonials or "who it's for" sections
- targetGeographies: Regions/countries they serve
- notableClients: Company names from customer logos or case studies

=== VALUE PROPOSITION ===
- problemSolved: The problem they claim to solve (use their words)
- uniqueDifferentiator: What they say makes them different (ONLY if explicitly stated)
- keyBenefits: Benefits they list
- typicalResults: Specific results/stats they claim (with numbers)

=== BRAND VOICE ===
- brandPersonality: Traits evident from their writing style
- formalityLevel: Very formal, Professional, Friendly, or Casual

Return JSON structure:
{
  "data": {
    "companyName": "Acme Corp",
    "industry": "Construction",
    "uniqueDifferentiator": null,  // NOT FOUND - don't invent!
    ...
  },
  "confidence": {
    "companyName": 98,
    "industry": 85,
    ...
  }
}

REMEMBER: null values are CORRECT when information is not on the page.
NEVER use phrases like "based on my knowledge" or "typically" - only use the page content.`;

// ICP-focused extraction prompt for second pass
const ICP_EXTRACTION_PROMPT = `You are extracting TARGET CUSTOMER (ICP) information from a website.

Look for these specific ICP signals on the page:
1. "Who we serve" / "Our customers" / "Built for" sections
2. Customer logos - extract the company NAMES you can identify
3. Case studies - note the INDUSTRY and COMPANY SIZE of featured customers
4. Testimonials - extract the JOB TITLES of people quoted
5. Pricing tiers - descriptions often reveal target customer ("Best for teams of 50+")
6. Industry-specific language or terminology

STRICT RULES:
- ONLY extract what is explicitly stated on the page
- For customer logos, only list companies whose names you can clearly read
- If you cannot find ICP information, return null - do NOT guess

Extract:
- targetIndustries: Array of industries explicitly mentioned as served
- targetCompanySizes: Array of company sizes (startup, SMB, mid-market, enterprise)
- targetJobTitles: Job titles from testimonials or "who it's for" text
- notableClients: Company names from logos or case studies (only names you can read)
- idealCustomerDescription: Their explicit ICP statement if they have one
- buyingTriggers: Events that trigger purchase (if mentioned)

Return JSON:
{
  "data": {
    "targetIndustries": ["Healthcare", "Finance"],
    "targetJobTitles": ["CTO", "VP Engineering"],
    "notableClients": "Acme Corp, Beta Inc",
    ...
  },
  "confidence": {
    "targetIndustries": 90,
    "targetJobTitles": 75,
    ...
  }
}

If a field is not found, return null for that field. Do NOT invent customer information.`;

// Critical fields that trigger gap questions if missing
const CRITICAL_ICP_FIELDS: (keyof ExtractedCompanyData)[] = [
    'idealCustomerDescription', 'targetIndustries', 'targetJobTitles',
    'targetCompanySizes', 'problemSolved', 'uniqueDifferentiator'
];

export async function extractFromOnlinePresence(
    input: OnlinePresenceInput
): Promise<ExtractionResult> {
    console.log('[Extraction] Starting optimized extraction for:', input.websiteUrl);
    const startTime = Date.now();
    const gaps: ExtractionGap[] = [];

    try {
        // Step 1: Parallel multi-page fetching
        console.log('[Extraction] Step 1: Parallel page fetching...');
        const websiteContent = await fetchMultiplePages(input.websiteUrl);

        if (!websiteContent || websiteContent.length < 100) {
            return {
                success: false,
                data: {},
                confidence: {} as any,
                gaps: [],
                sources: {},
                error: 'Could not retrieve any content from website',
            };
        }

        // Step 2: Deep AI extraction (comprehensive analysis with GPT-4o)
        console.log('[Extraction] Step 2: Deep AI analysis with GPT-4o...');
        const extractionResult = await deepAIExtraction(websiteContent);

        // Step 3: ICP-focused extraction pass
        console.log('[Extraction] Step 3: ICP-focused extraction...');
        const icpResult = await icpExtraction(websiteContent);

        // Merge ICP data into main extraction (ICP pass takes priority for ICP fields)
        const mergedData = { ...extractionResult.data };
        const mergedConfidence = { ...extractionResult.confidence };

        for (const [key, value] of Object.entries(icpResult.data)) {
            if (value !== null && value !== undefined) {
                (mergedData as any)[key] = value;
                (mergedConfidence as any)[key] = (icpResult.confidence as any)[key] || 70;
            }
        }

        // Step 4: Optional Apollo enrichment for missing company data
        console.log('[Extraction] Step 4: Checking for enrichment needs...');
        const enrichedData = await enrichWithApollo(mergedData, input.websiteUrl);

        // Step 5: Identify gaps - fields we couldn't find (NO FABRICATION!)
        console.log('[Extraction] Step 5: Identifying extraction gaps...');
        for (const field of CRITICAL_ICP_FIELDS) {
            const value = (enrichedData as any)[field];
            const confidence = (mergedConfidence as any)[field] || 0;

            const isEmpty = value === null || value === undefined || value === '' ||
                (Array.isArray(value) && value.length === 0);

            if (isEmpty || confidence < 50) {
                gaps.push({
                    field,
                    reason: isEmpty ? 'not_found' : 'low_confidence',
                    searchedPages: STRATEGIC_PATHS.map(p => `${input.websiteUrl}${p}`),
                });
            }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[Extraction] Complete in ${elapsed}ms. Fields found: ${Object.keys(enrichedData).length}, Gaps: ${gaps.length}`);

        return {
            success: true,
            data: enrichedData,
            confidence: mergedConfidence,
            gaps, // Return gaps so they can be used for follow-up questions
            sources: {
                website: {
                    url: input.websiteUrl,
                    pagesAnalyzed: STRATEGIC_PATHS.slice(0, 5),
                },
            },
        };
    } catch (error) {
        console.error('[Extraction] Error:', error);
        return {
            success: false,
            data: {},
            confidence: {} as any,
            gaps: [],
            sources: {},
            error: error instanceof Error ? error.message : 'Unknown extraction error',
        };
    }
}

// Parallel fetch multiple pages with timeout
async function fetchMultiplePages(url: string): Promise<string> {
    const baseUrl = normalizeUrl(url);
    console.log('[Extraction] Fetching pages from:', baseUrl);

    const fetchWithTimeout = async (fullUrl: string, timeout: number): Promise<string | null> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const res = await fetch(fullUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                },
                redirect: 'follow',
            });
            clearTimeout(timeoutId);

            if (!res.ok) return null;
            const html = await res.text();
            return extractTextFromHtml(html);
        } catch {
            clearTimeout(timeoutId);
            return null;
        }
    };

    // Fetch all pages in parallel with 3s timeout each
    const results = await Promise.allSettled(
        STRATEGIC_PATHS.map(path =>
            fetchWithTimeout(`${baseUrl}${path}`, 3000)
        )
    );

    // Combine successful results
    const pages = results
        .filter((r): r is PromiseFulfilledResult<string | null> =>
            r.status === 'fulfilled' && r.value !== null && r.value.length > 50
        )
        .map(r => r.value as string);

    console.log(`[Extraction] Successfully fetched ${pages.length} pages`);

    // Combine all pages, limit total content
    const combined = pages.join('\n\n--- NEW PAGE ---\n\n');
    return combined.slice(0, 25000); // Limit for AI processing
}

// Deep AI extraction: Comprehensive analysis with GPT-4o for maximum information
async function deepAIExtraction(content: string): Promise<{ data: ExtractedCompanyData; confidence: Record<string, number> }> {
    const openai = getOpenAI();
    const startTime = Date.now();

    console.log('[Extraction] Deep analysis: Sending content to GPT-4o...');
    console.log('[Extraction] Content length:', content.length, 'characters');

    const result = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: COMPREHENSIVE_EXTRACTION_PROMPT },
            { role: 'user', content: `Analyze this website content and extract ALL available business information:\n\n${content}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4000, // Allow comprehensive response
    });

    console.log(`[Extraction] Deep analysis complete in ${Date.now() - startTime}ms`);

    const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
    const data = parsed.data || {};
    const confidence = parsed.confidence || {};

    console.log('[Extraction] Fields extracted:', Object.keys(data).length);
    console.log('[Extraction] Fields:', Object.keys(data).join(', '));

    return { data, confidence };
}

// ICP-focused extraction: Second pass specifically for target customer information
async function icpExtraction(content: string): Promise<{ data: Partial<ExtractedCompanyData>; confidence: Record<string, number> }> {
    const openai = getOpenAI();
    const startTime = Date.now();

    console.log('[Extraction] ICP extraction: Analyzing for target customer info...');

    try {
        const result = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: ICP_EXTRACTION_PROMPT },
                { role: 'user', content: `Extract ICP/target customer information from this website content:\n\n${content}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2, // Lower temperature for more precise extraction
            max_tokens: 2000,
        });

        console.log(`[Extraction] ICP extraction complete in ${Date.now() - startTime}ms`);

        const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
        const data = parsed.data || {};
        const confidence = parsed.confidence || {};

        console.log('[Extraction] ICP fields extracted:', Object.keys(data).filter(k => data[k] !== null).join(', '));

        return { data, confidence };
    } catch (error) {
        console.error('[Extraction] ICP extraction failed:', error);
        return { data: {}, confidence: {} };
    }
}

// Apollo enrichment for company data
async function enrichWithApollo(data: ExtractedCompanyData, websiteUrl: string): Promise<ExtractedCompanyData> {
    const needsEnrichment = !data.employeeCount || !data.industry;

    if (!needsEnrichment) {
        console.log('[Extraction] Apollo enrichment not needed');
        return data;
    }

    const domain = extractDomain(websiteUrl);
    console.log('[Extraction] Apollo enrichment for domain:', domain);

    try {
        // Dynamic import to avoid circular dependencies
        const { enrichCompany } = await import('../deep-dive/company-enrichment');
        const result = await enrichCompany({ email: `info@${domain}` } as any);

        if (result.found && result.data) {
            console.log('[Extraction] Apollo enrichment successful');
            return {
                ...data,
                employeeCount: data.employeeCount || result.data.size,  // Apollo returns 'size'
                industry: data.industry || result.data.industry,
                businessDescription: data.businessDescription || result.data.description,
            };
        }
    } catch (e) {
        console.warn('[Extraction] Apollo enrichment failed:', e);
    }

    return data;
}

// NOTE: searchForCompanyInsights was REMOVED - it was fabricating content
// If we can't find info on the website, we track it as a gap for user input

// Helper: Normalize URL
function normalizeUrl(url: string): string {
    let normalized = url.startsWith('http') ? url : `https://${url}`;
    // Remove trailing slash
    return normalized.replace(/\/$/, '');
}

// Helper: Extract domain from URL
function extractDomain(url: string): string {
    try {
        const normalized = url.startsWith('http') ? url : `https://${url}`;
        return new URL(normalized).hostname.replace('www.', '');
    } catch {
        return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
}

// Helper: Extract text from HTML
function extractTextFromHtml(html: string): string {
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

// Helper to validate URL format
export function isValidUrl(url: string): boolean {
    try {
        const normalized = url.startsWith('http') ? url : `https://${url}`;
        new URL(normalized);
        return true;
    } catch {
        return false;
    }
}

// Helper to validate Instagram handle
export function isValidInstagramHandle(handle: string): boolean {
    const cleanHandle = handle.replace('@', '').trim();
    return /^[a-zA-Z0-9._]{1,30}$/.test(cleanHandle);
}
