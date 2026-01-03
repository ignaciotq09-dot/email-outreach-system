// AI-powered extraction from website and Instagram
// Optimized with parallel fetching, tiered AI, and fallback sources

import OpenAI from 'openai';
import type { OnlinePresenceInput, ExtractionResult, ExtractedCompanyData } from './types';

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

// COMPREHENSIVE extraction prompt - get maximum information in one pass
// Covers ALL Rule Book categories for complete company knowledge
const COMPREHENSIVE_EXTRACTION_PROMPT = `You are an expert business analyst preparing to represent this company as a salesperson.
Extract ONLY information that is EXPLICITLY stated on the website. NEVER invent or guess.

Extract these EXACT fields (use these exact field names as JSON keys):

=== 1. COMPANY IDENTITY ===
- companyName: Official company name
- foundedYear: Year established (if mentioned)
- headquarters: Main location
- employeeCount: Team size (can be range like "50-100")
- companyStage: Startup, Growth, Established, or Enterprise
- industry: Primary sector (be SPECIFIC)
- subIndustry: Specific niche

=== 2. PRODUCT CATALOG ===
- primaryOffering: Main product/service
- productCatalog: Array of EVERY specific product/variant found on the site
- keyFeatures: Main capabilities per product
- useCases: Common applications
- integrations: What it connects with

=== 3. PRICING ===
- pricingModel: How they charge (SaaS, per-seat, project-based, etc.)
- pricePerProduct: Price for each specific product (if visible)
- productTiers: Tier levels (Basic, Pro, Enterprise) with prices
- typicalDealSize: Average contract value (if mentioned)
- billingOptions: Monthly/Annual options
- trialOptions: Free trial details
- discountPolicy: When discounts apply (if mentioned)

=== 4. TARGET CUSTOMERS ===
- idealCustomerDescription: Detailed ICP narrative
- targetCompanySizes: Company size fit (startup, SMB, mid-market, enterprise)
- targetIndustries: Best-fit industries
- targetJobTitles: Decision makers they target
- targetGeographies: Regions served
- secondaryTargets: Alternative customer segments that also work
- buyingTriggers: Events that spark purchase

=== 5. VALUE PROPOSITION ===
- problemSolved: Core pain point they address
- uniqueDifferentiator: What makes them different (be specific)
- keyBenefits: Top outcomes for customers
- proofPoints: Stats, ROI with numbers (if mentioned)
- guarantees: Promises they make (if any)

=== 6. SOCIAL PROOF ===
- notableClients: Recognizable customer names
- customerCount: Total customer base (if mentioned)
- caseStudies: Success story summaries
- testimonialThemes: What customers say
- awards: Industry recognition
- certifications: Relevant certs (SOC2, ISO, etc.)

=== 7. COMPETITIVE LANDSCAPE ===
- directCompetitors: Main alternatives mentioned
- competitorWeaknesses: Where competitors fall short (if stated)
- ourAdvantages: Why they're better vs alternatives
- replacementNarrative: What solutions customers typically switch FROM (if mentioned)

=== 8. SALES PROCESS ===
- salesCycleLength: Typical time to close (if mentioned)
- typicalBuyingProcess: How customers buy
- decisionMakers: Who signs off
- implementationTimeline: Time to go live
- onboardingProcess: How they get started
- supportChannels: How customers get help

=== 9. BRAND VOICE ===
- brandPersonality: Traits (Professional, Bold, Innovative, etc.)
- formalityLevel: Very formal, Professional, Friendly, or Casual

CRITICAL EXTRACTION RULES - NEVER INVENT INFORMATION:
1. ONLY extract information that is EXPLICITLY stated on the website
2. If you cannot find information for a field, OMIT IT ENTIRELY - do not guess or infer
3. NEVER fabricate, invent, or assume information that isn't clearly present
4. Be SPECIFIC - use exact words/phrases from the website
5. For arrays, only include items actually found (don't pad with guesses)
6. Confidence score should be 0-30 if you're inferring, 70-100 only if explicitly stated
7. When in doubt, LEAVE IT OUT - missing data is better than wrong data
8. Use direct quotes where possible for brand voice fields

Return a FLAT JSON structure:
{
  "data": {
    "companyName": "...",
    "businessType": "...",
    "productCatalog": ["specific product 1", "specific product 2"],
    ...only fields you found on the website...
  },
  "confidence": {
    "companyName": 95,
    "businessType": 80,
    ...0-100 score based on how explicitly the info was stated...
  }
}

DO NOT nest fields inside category objects. Use EXACT field names as top-level keys.
NEVER INVENT OR GUESS. Only return what you can prove from the website content.`;

export async function extractFromOnlinePresence(
    input: OnlinePresenceInput
): Promise<ExtractionResult> {
    console.log('[Extraction] Starting optimized extraction for:', input.websiteUrl);
    const startTime = Date.now();

    try {
        // Step 1: Parallel multi-page fetching
        console.log('[Extraction] Step 1: Parallel page fetching...');
        const websiteContent = await fetchMultiplePages(input.websiteUrl);

        if (!websiteContent || websiteContent.length < 100) {
            return {
                success: false,
                data: {},
                confidence: {} as any,
                sources: {},
                error: 'Could not retrieve any content from website',
            };
        }

        // Step 2: Deep AI extraction (comprehensive analysis with GPT-4o)
        console.log('[Extraction] Step 2: Deep AI analysis with GPT-4o...');
        const extractionResult = await deepAIExtraction(websiteContent);

        // Step 3: Optional Apollo enrichment for missing company data
        console.log('[Extraction] Step 3: Checking for enrichment needs...');
        const enrichedData = await enrichWithApollo(extractionResult.data, input.websiteUrl);

        // Step 4: Web search for value proposition if missing
        if (!enrichedData.uniqueDifferentiator && enrichedData.companyName) {
            console.log('[Extraction] Step 4: Web search for insights...');
            const webInsights = await searchForCompanyInsights(
                enrichedData.companyName as string,
                extractDomain(input.websiteUrl)
            );
            if (webInsights.differentiators) {
                enrichedData.uniqueDifferentiator = webInsights.differentiators;
            }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[Extraction] Complete in ${elapsed}ms. Fields found: ${Object.keys(enrichedData).length}`);

        return {
            success: true,
            data: enrichedData,
            confidence: extractionResult.confidence,
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

// Web search for company insights
async function searchForCompanyInsights(
    companyName: string,
    domain: string
): Promise<{ news?: string; differentiators?: string }> {
    console.log('[Extraction] Web search for:', companyName);

    try {
        const openai = getOpenAI();
        const result = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Based on your knowledge, provide brief insights about this company. What makes them unique? Any notable achievements?'
                },
                {
                    role: 'user',
                    content: `Company: ${companyName}\nWebsite: ${domain}\n\nReturn JSON: { "differentiators": "what makes them unique", "news": "any notable news" }`
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.5,
        });

        return JSON.parse(result.choices[0]?.message?.content || '{}');
    } catch {
        return {};
    }
}

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
