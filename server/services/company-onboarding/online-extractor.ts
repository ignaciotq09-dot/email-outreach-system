// HYBRID AI-powered extraction from website
// Option C: Single comprehensive extraction + conditional ICP gap-filling + brand summary

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

// HYBRID EXTRACTION PROMPT - 32 Essential Fields with ICP Priority
const COMPREHENSIVE_EXTRACTION_PROMPT = `You are extracting company information for B2B sales outreach. Focus on TARGET CUSTOMER (ICP) data above all else.

EXTRACTION PRIORITY:
🔴 TIER 1 (CRITICAL): Must extract if available
🟡 TIER 2 (HIGH VALUE): Important for personalization  
🟢 TIER 3 (NICE TO HAVE): Extract if easily found

=== 🔴 TIER 1: CRITICAL FIELDS (12 fields) ===

1. COMPANY IDENTITY (4 fields)
   - companyName: Official name (from logo, header, footer)
   - industry: Primary industry (use THEIR words, not generic labels)
   - businessDescription: What they do in 1-2 sentences (their exact wording)
   - employeeCount: Team size if mentioned (1-10, 11-50, 51-200, 201-500, 500+)

2. PRODUCTS & SERVICES (3 fields)
   - primaryOffering: Main product/service they sell
   - productsServices: Array of ALL specific offerings/tiers/packages
   - pricingModel: How they charge (subscription, per-seat, usage-based, project-based, etc.)

3. TARGET CUSTOMERS - ICP ⭐⭐⭐ THIS IS MOST IMPORTANT ⭐⭐⭐ (5 fields)
   LOOK FOR THESE ICP SIGNALS:
   a) Explicit statements: "Built for", "Who we serve", "Our ideal customer"
   b) Customer logos: Extract company NAMES you can read
   c) Case studies: Note industries and company sizes
   d) Testimonials: Extract job titles of quoted people
   e) Pricing tiers: "Best for teams of 50+", "Enterprise plan", etc.
   
   - idealCustomerDescription: Their explicit ICP statement (1-2 sentences)
   - targetJobTitles: Job titles from testimonials/quotes/case studies
   - targetCompanySizes: [Startups, Small Business (1-50), Mid-Market (51-500), Enterprise (500+)]
   - targetIndustries: Industries explicitly mentioned as served
   - notableClients: Company names from logos or case studies (only names you can read)

=== 🟡 TIER 2: HIGH VALUE (12 fields) ===

4. PRICING (3 fields)
   - typicalDealSize: Price range or tier (Under $500, $500-2K, $2K-10K, $10K+)
   - productTiers: Names of pricing tiers/plans
   - typicalResults: ONLY if specific numbers/stats shown (e.g., "Clients save average of $50K")

5. VALUE PROPOSITION (4 fields)
   - problemSolved: What pain/problem they address (use their words)
   - uniqueDifferentiator: What makes them different (ONLY if explicitly stated)
   - keyBenefits: Top 3-5 benefits they claim
   - proofPoints: Metrics, stats, awards, certifications mentioned

6. SALES CONTEXT (3 fields)
   - salesCycleLength: How long typical sale takes (if mentioned)
   - targetGeographies: Regions/countries they serve
   - buyingTriggers: Events that trigger purchase (ONLY if explicitly mentioned)

7. BRAND VOICE (2 fields)
   - brandPersonality: Up to 3 traits from: Professional, Friendly, Expert, Innovative, Bold, Warm, Practical, Premium
   - formalityLevel: Very Formal | Professional | Friendly | Casual

=== 🟢 TIER 3: NICE TO HAVE (8 fields) ===

8. SOCIAL PROOF (2 fields)
   - customerCount: Total customers/users if mentioned
   - caseStudies: Titles/names of case studies (not full content)

9. PRODUCT DETAILS (3 fields)
   - keyFeatures: Top 5 features/capabilities
   - useCases: Specific use cases described
   - headquarters: Company location

10. COMPETITIVE (3 fields)
    - directCompetitors: Competitors mentioned by name
    - awards: Industry awards won
    - certifications: Compliance/security certifications

=== EXTRACTION RULES ===
✅ Extract ONLY what is explicitly written
✅ Return null if field not found - DO NOT GUESS
✅ For ICP fields, provide citations (where you found it)
✅ Confidence scores: 90-100 = exact quote, 70-89 = clear statement, <70 = weak/should be null

Return JSON:
{
  "data": {
    "companyName": "Acme Corp",
    "industry": "B2B SaaS",
    "idealCustomerDescription": "Mid-market sales teams with 50-200 employees",
    "targetJobTitles": ["VP Sales", "Sales Director", "Head of Revenue"],
    ...
  },
  "confidence": {
    "companyName": 98,
    "idealCustomerDescription": 85,
    ...
  },
  "citations": {
    "idealCustomerDescription": "About page: 'Built for mid-market sales teams looking to scale outreach'",
    "targetJobTitles": "Testimonials section shows quotes from VP Sales at 3 companies",
    ...
  }
}

REMEMBER: ICP data (Tier 1 #3) is THE MOST IMPORTANT. Spend extra effort finding target customer information.`;

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
    console.log('[Extraction] Starting HYBRID extraction for:', input.websiteUrl);
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

        // Step 2: MAIN EXTRACTION - Comprehensive analysis (32 fields) with GPT-4o
        console.log('[Extraction] Step 2: HYBRID Main extraction (32 essential fields)...');
        const extractionResult = await deepAIExtraction(websiteContent);

        // Step 3: ICP QUALITY ASSESSMENT - Check if we got good ICP data
        console.log('[Extraction] Step 3: Assessing ICP quality...');
        const icpQuality = assessICPQuality(extractionResult.data, extractionResult.confidence);

        let finalData = extractionResult.data;
        let finalConfidence = extractionResult.confidence;

        // Step 4: CONDITIONAL ICP GAP-FILLING - Only if ICP quality is low
        if (icpQuality < 0.7) {
            console.log(`[Extraction] ICP quality low (${(icpQuality * 100).toFixed(0)}%), triggering gap-filling...`);
            const icpGapResult = await icpGapFillingExtraction(websiteContent, extractionResult.data);

            // Merge ICP gap-filling data (takes priority for ICP fields)
            finalData = mergeICPData(extractionResult.data, icpGapResult.data);

            // Merge confidence scores
            for (const [key, value] of Object.entries(icpGapResult.confidence)) {
                if (value && value > (finalConfidence[key] || 0)) {
                    (finalConfidence as any)[key] = value;
                }
            }
        } else {
            console.log(`[Extraction] ICP quality good (${(icpQuality * 100).toFixed(0)}%), skipping gap-filling`);
        }

        // Step 5: BRAND SUMMARY GENERATION
        console.log('[Extraction] Step 5: Generating brand summary...');
        const brandSummary = await generateBrandSummary(finalData);
        if (brandSummary) {
            finalData.brandSummary = brandSummary;
        }

        // Step 6: Optional Apollo enrichment for missing company metadata
        console.log('[Extraction] Step 6: Checking for Apollo enrichment needs...');
        const enrichedData = await enrichWithApollo(finalData, input.websiteUrl);

        // Step 7: Identify gaps - fields we couldn't find
        console.log('[Extraction] Step 7: Identifying extraction gaps...');
        for (const field of CRITICAL_ICP_FIELDS) {
            const value = (enrichedData as any)[field];
            const confidence = (finalConfidence as any)[field] || 0;

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
        console.log(`[Extraction] HYBRID COMPLETE in ${elapsed}ms`);
        console.log(`[Extraction] - Fields found: ${Object.keys(enrichedData).filter(k => (enrichedData as any)[k]).length}/32`);
        console.log(`[Extraction] - ICP Quality: ${(icpQuality * 100).toFixed(0)}%`);
        console.log(`[Extraction] - Brand Summary: ${brandSummary ? 'Generated' : 'Skipped'}`);
        console.log(`[Extraction] - Gaps: ${gaps.length}`);

        return {
            success: true,
            data: enrichedData,
            confidence: finalConfidence as Record<keyof ExtractedCompanyData, number>,
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
        temperature: 0.1,  // Lower = more deterministic, less creative/hallucination
        max_tokens: 4000, // Allow comprehensive response
    });

    console.log(`[Extraction] Deep analysis complete in ${Date.now() - startTime}ms`);

    const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
    const data = parsed.data || {};
    const confidence = parsed.confidence || {};
    const citations = parsed.citations || {};

    console.log('[Extraction] Fields extracted:', Object.keys(data).length);
    console.log('[Extraction] Fields:', Object.keys(data).join(', '));

    // ANTI-HALLUCINATION: Quick validation for high-risk fields
    const HIGH_RISK_FIELDS = [
        'uniqueDifferentiator', 'typicalResults', 'competitorWeaknesses',
        'ourAdvantages', 'buyingTriggers', 'guarantees', 'replacementNarrative'
    ];

    let rejectedCount = 0;
    for (const field of HIGH_RISK_FIELDS) {
        const fieldValue = (data as any)[field];
        const fieldConfidence = confidence[field] || 0;
        const fieldCitation = citations[field];

        // Reject if: no citation OR confidence too low OR value contains hallucination indicators
        if (fieldValue !== null && fieldValue !== undefined) {
            const shouldReject =
                !fieldCitation ||
                fieldCitation.length < 20 ||
                fieldConfidence < 70 ||
                (typeof fieldValue === 'string' && (
                    fieldValue.toLowerCase().includes('typically') ||
                    fieldValue.toLowerCase().includes('likely') ||
                    fieldValue.toLowerCase().includes('improve efficiency') ||
                    fieldValue.toLowerCase().includes('save time') ||
                    fieldValue.toLowerCase().includes('reduce costs')
                ));

            if (shouldReject) {
                console.warn(`[AntiHallucination] Rejecting "${field}": conf=${fieldConfidence}, citation=${!!fieldCitation}`);
                (data as any)[field] = null;
                confidence[field] = 0;
                rejectedCount++;
            }
        }
    }

    if (rejectedCount > 0) {
        console.log(`[AntiHallucination] Rejected ${rejectedCount} high-risk fields to prevent fabrication`);
    }

    return { data, confidence };
}

// ICP-focused extraction: Second pass specifically for target customer information
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

// ========== HYBRID EXTRACTION HELPERS ==========

/**
 * Assess ICP data quality to determine if conditional gap-filling is needed
 * Returns score 0-1, where 1 = all ICP fields well-populated
 */
function assessICPQuality(
    data: ExtractedCompanyData,
    confidence: Record<string, number>
): number {
    const ICP_CRITICAL_FIELDS = [
        'idealCustomerDescription',
        'targetJobTitles',
        'targetCompanySizes',
        'targetIndustries',
    ];

    let score = 0;
    const maxScore = ICP_CRITICAL_FIELDS.length;

    for (const field of ICP_CRITICAL_FIELDS) {
        const value = (data as any)[field];
        const conf = confidence[field] || 0;

        // Full point if value exists with good confidence
        if (value && conf >= 70) {
            score += 1;
        }
        // Half point if value exists but low confidence
        else if (value && conf >= 50) {
            score += 0.5;
        }
        // Zero points if missing or very low confidence
    }

    const qualityScore = score / maxScore;
    console.log(`[ICP Quality] Score: ${(qualityScore * 100).toFixed(0)}% (${score}/${maxScore} fields)`);

    return qualityScore;
}

/**
 * Conditional ICP gap-filling using GPT-4o-mini
 * Only called if main extraction missed ICP data
 */
async function icpGapFillingExtraction(
    content: string,
    existingData: ExtractedCompanyData
): Promise<{ data: Partial<ExtractedCompanyData>; confidence: Record<string, number> }> {
    const openai = getOpenAI();
    const startTime = Date.now();

    console.log('[ICP Gap-Filling] Triggering focused ICP extraction with GPT-4o-mini...');

    const ICP_GAP_FILLING_PROMPT = `You are extracting TARGET CUSTOMER (ICP) data that was missed in initial extraction.

CONTEXT: We already found:
${JSON.stringify({
        companyName: existingData.companyName,
        industry: existingData.industry,
        primaryOffering: existingData.primaryOffering,
    }, null, 2)}

Your ONLY job: Find ICP/target customer information.

LOOK FOR THESE SIGNALS (in order of reliability):
1. ⭐ EXPLICIT ICP STATEMENTS: "Built for", "Who we serve", "Ideal for"
2. ⭐ CUSTOMER LOGOS: Extract company names you can clearly read
3. ⭐ CASE STUDIES: Note industries and company sizes mentioned
4. ⭐ TESTIMONIALS: Job titles of quoted people
5. PRICING TIERS: "Best for teams of...", "Enterprise plan", etc.
6. USE CASES: What types of companies are described in examples

Extract ONLY these ICP fields:
- idealCustomerDescription: 1-2 sentence ICP summary
- targetJobTitles: Array of job titles
- targetCompanySizes: Array from [Startups, Small Business, Mid-Market, Enterprise]
- targetIndustries: Array of industries served
- notableClients: Company names from logos/studies

Return JSON with data and confidence for each field.`;

    try {
        const result = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Cheaper for targeted extraction
            messages: [
                { role: 'system', content: ICP_GAP_FILLING_PROMPT },
                { role: 'user', content: `Find ICP data:\n\n${content.slice(0, 15000)}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: 1000,
        });

        console.log(`[ICP Gap-Filling] Complete in ${Date.now() - startTime}ms`);

        const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
        const data = parsed.data || {};
        const confidence = parsed.confidence || {};

        console.log('[ICP Gap-Filling] Found fields:', Object.keys(data).filter(k => data[k]).join(', '));

        return { data, confidence };
    } catch (error) {
        console.error('[ICP Gap-Filling] Error:', error);
        return { data: {}, confidence: {} };
    }
}

/**
 * Generate brand summary from extracted data
 * Creates 2-3 sentence synthesized brand identity
 */
async function generateBrandSummary(
    data: ExtractedCompanyData
): Promise<string> {
    const openai = getOpenAI();

    // Skip if missing critical data
    if (!data.companyName || !data.primaryOffering) {
        console.log('[Brand Summary] Skipping - missing critical data');
        return '';
    }

    const prompt = `Write a concise 2-3 sentence brand summary for this company:

Company: ${data.companyName}
Industry: ${data.industry || 'Unknown'}
What they do: ${data.primaryOffering || data.businessDescription || 'Unknown'}
Target customers: ${data.idealCustomerDescription || 'Unknown'}
Differentiator: ${data.uniqueDifferentiator || 'Not specified'}
Brand personality: ${data.brandPersonality?.join(', ') || 'Professional'}
Formality: ${data.formalityLevel || 'Professional'}

Write in ${data.formalityLevel || 'professional'} tone.

Format:
"[Company] is a [industry] company [what they do]. [Who they serve and what makes them special]. [Additional context about brand/market position]."

Example:
"Acme SaaS is professional B2B platform helping mid-market sales teams automate cold outreach. Known for their data-driven approach and friendly customer service, they primarily serve tech companies with 50-500 employees. Their focus on personalization and deliverability sets them apart in the sales engagement space."

Be specific and concrete. Use information provided, not generic statements.`;

    try {
        const result = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Cheap for synthesis
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.4,
        });

        const summary = result.choices[0]?.message?.content?.trim() || '';
        console.log(`[Brand Summary] Generated (${summary.length} chars)`);

        return summary;
    } catch (error) {
        console.error('[Brand Summary] Error:', error);
        return '';
    }
}

/**
 * Merge ICP gap-filling data into main extraction results
 * Gap-filling data takes priority for ICP fields
 */
function mergeICPData(
    mainData: ExtractedCompanyData,
    icpData: Partial<ExtractedCompanyData>
): ExtractedCompanyData {
    const merged = { ...mainData };

    const ICP_FIELDS = [
        'idealCustomerDescription',
        'targetJobTitles',
        'targetCompanySizes',
        'targetIndustries',
        'notableClients',
    ];

    for (const field of ICP_FIELDS) {
        const icpValue = (icpData as any)[field];
        const mainValue = (mainData as any)[field];

        // ICP gap-filling takes priority if it found something and main didn't
        if (icpValue && !mainValue) {
            (merged as any)[field] = icpValue;
            console.log(`[Merge] ICP gap-filling provided: ${field}`);
        }
    }

    return merged;
}
