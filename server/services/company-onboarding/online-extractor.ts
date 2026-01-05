// PRODUCTION-QUALITY AI-powered extraction from website
// Full quality stack: Enhanced Fetching -> HTML parsing -> Extraction -> Validation -> Self-Review -> Fallback

import OpenAI from 'openai';
import type { OnlinePresenceInput, ExtractionResult, ExtractedCompanyData, ExtractionGap } from './types';
import { validateExtraction, calculateQualityScore, getQualityAssessment } from './extraction-validator';
import { validateExtractionEnhanced, calculateICPScore, getEnhancedAssessment } from './enhanced-validator';
import { selfReviewExtraction, applyImprovements } from './self-review';
import { fetchEnhancedWebContent, structuredDataToFields, extractJobTitlesFromTestimonials } from './enhanced-fetcher';

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

// QUALITY-FOCUSED EXTRACTION PROMPT - Universal for All Industries
const COMPREHENSIVE_EXTRACTION_PROMPT = `You are extracting ACTIONABLE company information for B2B sales outreach.

🎯 CORE PRINCIPLE: Extract what the company DOES/BUILDS/SELLS, not internal programs or corporate values.

=== CONTENT SOURCE PRIORITY ===
The website has different sections with different value:

🔴 HIGH-VALUE SECTIONS (Extract from these FIRST):
- Homepage hero section (first thing visitors see)
- "What We Do" / "Services" / "Solutions" pages
- "Products" page
- "Portfolio" / "Projects" page
- Main value proposition statements

🟡 MEDIUM-VALUE SECTIONS (Use for context):
- "About Us" page (first paragraphs only)
- "Industries" / "Who We Serve" pages
- Case studies / testimonials

🔴 LOW-VALUE SECTIONS (Usually NOT core business):
- Safety programs / compliance sections
- Company culture / values pages
- Careers / recruiting sections
- Team bios / leadership pages
- News / blog / press releases

⚠️ CRITICAL EXTRACTION RULES ⚠️

For businessDescription:
❌ DO NOT extract from: safety programs, culture statements, values, mission statements
✅ MUST describe: What they BUILD / CREATE / SELL / DELIVER to clients
✅ MUST include: Specific nouns (products, services, project types, solutions)
✅ MUST use: Action verbs (build, create, provide, manufacture, develop, design)

WRONG Examples (Generic Corporate Speak):
❌ "We are committed to excellence and innovation"
❌ "Focused on creating a culture of safety and integrity"
❌ "Passionate about delivering value to stakeholders"
❌ "Dedicated to our employees and communities"

RIGHT Examples (Specific Business Descriptions):
✅ "Full-service general contractor building commercial offices, healthcare facilities, and high-rise residential projects"
✅ "Cloud-based HR software platform for mid-market companies with 50-500 employees"
✅ "Industrial automation equipment manufacturer specializing in robotic assembly systems"
✅ "Management consulting firm providing strategy and operations consulting to Fortune 500 companies"

For problemSolved / valueProp:
❌ DO NOT focus on: Employee safety, workplace culture, internal processes
✅ MUST focus on: CLIENT PROBLEMS and CLIENT BENEFITS
✅ MUST describe: What customers GET from working with this company

WRONG Examples (Internal/Employee-Focused):
❌ "Protecting the wellbeing of our employees and subcontractors"
❌ "Creating a safe and inclusive workplace"
❌ "Supporting our team's professional development"

RIGHT Examples (Client-Facing Value):
✅ "Delivering construction projects on-time and on-budget with minimal client disruption"
✅ "Reducing HR admin time by 10 hours per week through automated onboarding"
✅ "Increasing manufacturing output by 30% with custom automation solutions"

=== EXTRACTION GUIDELINES ===

🔴 TIER 1: CRITICAL (12 fields)

1. COMPANY IDENTITY (4 fields)
   - companyName: Official name from logo/header
   - industry: Primary industry (use THEIR terminology)
   - businessDescription: 1-2 sentences describing what they DO/BUILD/SELL
     * MUST include action verbs
     * MUST include specific offerings
     * MUST NOT be culture/values statement
   - employeeCount: Team size if mentioned

2. PRODUCTS & SERVICES (3 fields)
   - primaryOffering: Main thing they sell/do
   - productsServices: Array of specific offerings
   - pricingModel: How they charge (subscription, project-based, per-unit, etc.)

3. TARGET CUSTOMERS - ICP ⭐ (5 fields)
   Look for: "Who we serve", customer logos, case studies, testimonials, pricing tier descriptions
   
   - idealCustomerDescription: Their explicit ICP statement
   - targetJobTitles: Job titles from testimonials/quotes
   - targetCompanySizes: [Startups, Small Business, Mid-Market, Enterprise]
   - targetIndustries: Industries they serve
   - notableClients: Company names from logos/case studies

🟡 TIER 2: HIGH VALUE (12 fields)

4. PRICING (3 fields)
   - typicalDealSize: Price range if mentioned
   - productTiers: Names of plans/tiers
   - typicalResults: ONLY if specific numbers/stats shown

5. VALUE PROPOSITION (4 fields)
   - problemSolved: What CLIENT PROBLEM they address
   - uniqueDifferentiator: What makes them different (only if explicitly stated)
   - keyBenefits: Top 3-5 CLIENT BENEFITS they claim
   - proofPoints: Metrics, awards, certifications

6. SALES CONTEXT (3 fields)
   - salesCycleLength: Purchase timeline if mentioned
   - targetGeographies: Regions/countries served
   - buyingTriggers: Events triggering purchase (rarely stated)

7. BRAND VOICE (2 fields)
   - brandPersonality: Up to 3 traits (Professional, Friendly, Expert, Bold, etc.)
   - formalityLevel: Very Formal | Professional | Friendly | Casual

🟢 TIER 3: NICE TO HAVE (8 fields)

8. SOCIAL PROOF (2 fields)
   - customerCount: Total customers if mentioned
   - caseStudies: Titles of case studies

9. PRODUCT DETAILS (3 fields)
   - keyFeatures: Top 5 features
   - useCases: Specific use cases
   - headquarters: Company location

10. COMPETITIVE (3 fields)
    - directCompetitors: Competitors mentioned
    - awards: Industry awards
    - certifications: Compliance certifications

=== QUALITY SELF-CHECK ===

Before finalizing, ask yourself:

1. businessDescription:
   ✓ Does it describe what they BUILD/CREATE/SELL?
   ✓ Would I know their offering after reading this?
   ✓ Does it have ACTION VERBS and SPECIFIC NOUNS?
   ✗ Is it just corporate values or culture statements?

2. problemSolved:
   ✓ Does it describe a CLIENT PROBLEM?
   ✓ Is it something prospects would care about?
   ✗ Is it about employee safety or internal culture?

3. Overall:
   ✓ Is this information useful for sales outreach?
   ✓ Could I customize an email based on this data?

If you answered NO to any check, RE-READ the website and extract better information.

Return JSON:
{
  "data": {
    "companyName": "...",
    "industry": "...",
    "businessDescription": "...",
    ...
  },
  "confidence": {
    "companyName": 95,
    "businessDescription": 85,
    ...
  },
  "citations": {
    "businessDescription": "From homepage hero: '...'",
    ...
  }
}

REMEMBER: Prioritize hero/services sections. Avoid extracting from culture/safety/values pages for core business info.`;

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
        const apolloResult = await enrichWithApollo(finalData, input.websiteUrl, finalConfidence as Record<string, number>);
        const enrichedData = apolloResult.data;
        // Merge Apollo confidence scores
        for (const [key, value] of Object.entries(apolloResult.confidence)) {
            if (value && value > ((finalConfidence as any)[key] || 0)) {
                (finalConfidence as any)[key] = value;
            }
        }

        // Step 7: QUALITY VALIDATION - Check for generic phrases, action verbs, etc.
        console.log('[Extraction] Step 7: Validating extraction quality...');
        let validation = validateExtraction(enrichedData);
        console.log(`[Extraction] Quality Score: ${validation.score}/100 - ${getQualityAssessment(validation.score)}`);

        if (validation.issues.length > 0) {
            console.log('[Extraction] Quality issues detected:');
            validation.issues.forEach(issue => {
                console.log(`  - [${issue.severity.toUpperCase()}] ${issue.field}: ${issue.message}`);
            });
        }

        // Step 8: AI SELF-REVIEW - If quality is low, have AI improve its extraction
        let reviewedData = enrichedData;
        let selfReviewPerformed = false;

        if (validation.score < 70 && validation.issues.length > 0) {
            console.log('[Extraction] Step 8: Triggering AI self-review to improve quality...');
            try {
                const reviewResult = await selfReviewExtraction(enrichedData, websiteContent, validation);

                if (reviewResult.fieldsImproved.length > 0) {
                    reviewedData = applyImprovements(enrichedData, reviewResult.improved);
                    selfReviewPerformed = true;
                    console.log(`[Extraction] Self-review improved ${reviewResult.fieldsImproved.length} fields:`);
                    reviewResult.fieldsImproved.forEach(field => console.log(`  - ${field}`));
                    console.log(`[Extraction] Quality improved: ${reviewResult.originalScore} -> ${reviewResult.newScore}`);

                    // Re-validate after improvements
                    validation = validateExtraction(reviewedData);
                }
            } catch (error) {
                console.error('[Extraction] Self-review failed:', error);
                // Continue with original data
            }
        } else {
            console.log('[Extraction] Step 8: Quality is good - skipping self-review');
        }

        // Step 9: FALLBACK FLAG - Flag for human review if still problematic
        const needsHumanReview = validation.needsReview || validation.score < 50;
        if (needsHumanReview) {
            console.log('[Extraction] ⚠️  FLAGGED FOR HUMAN REVIEW - Quality still below threshold');
            console.log(`[Extraction] Suggestions: ${validation.suggestions.join('; ')}`);
        }

        // Step 10: Identify gaps - fields we couldn't find
        console.log('[Extraction] Step 10: Identifying extraction gaps...');
        for (const field of CRITICAL_ICP_FIELDS) {
            const value = (reviewedData as any)[field];
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
        console.log(`[Extraction] ✅ PRODUCTION EXTRACTION COMPLETE in ${elapsed}ms`);
        console.log(`[Extraction] - Fields found: ${Object.keys(reviewedData).filter(k => (reviewedData as any)[k]).length}/32`);
        console.log(`[Extraction] - Quality Score: ${validation.score}/100`);
        console.log(`[Extraction] - Self-Review: ${selfReviewPerformed ? 'Performed' : 'Not needed'}`);
        console.log(`[Extraction] - Human Review: ${needsHumanReview ? 'NEEDED' : 'Not needed'}`);
        console.log(`[Extraction] - Gaps: ${gaps.length}`);

        return {
            success: true,
            data: reviewedData,
            confidence: finalConfidence as Record<keyof ExtractedCompanyData, number>,
            gaps,
            sources: {
                website: {
                    url: input.websiteUrl,
                    pagesAnalyzed: STRATEGIC_PATHS.slice(0, 5),
                },
            },
            // Add quality metadata
            qualityScore: validation.score,
            needsReview: needsHumanReview,
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
// Apollo enrichment for company data - returns data AND confidence updates
async function enrichWithApollo(
    data: ExtractedCompanyData,
    websiteUrl: string,
    existingConfidence: Record<string, number>
): Promise<{ data: ExtractedCompanyData; confidence: Record<string, number> }> {
    const needsEnrichment = !data.employeeCount || !data.industry;
    const confidence = { ...existingConfidence };

    if (!needsEnrichment) {
        console.log('[Extraction] Apollo enrichment not needed');
        return { data, confidence };
    }

    const domain = extractDomain(websiteUrl);
    console.log('[Extraction] Apollo enrichment for domain:', domain);

    try {
        // Dynamic import to avoid circular dependencies
        const { enrichCompany } = await import('../deep-dive/company-enrichment');
        const result = await enrichCompany({ email: `info@${domain}` } as any);

        if (result.found && result.data) {
            console.log('[Extraction] Apollo enrichment successful');
            const enrichedData = {
                ...data,
                employeeCount: data.employeeCount || result.data.size,
                industry: data.industry || result.data.industry,
                businessDescription: data.businessDescription || result.data.description,
            };

            // SET CONFIDENCE FOR ENRICHED FIELDS (Apollo data is typically high quality)
            if (!data.employeeCount && result.data.size) {
                confidence['employeeCount'] = 85;
                console.log('[Extraction] Set employeeCount confidence to 85 (Apollo)');
            }
            if (!data.industry && result.data.industry) {
                confidence['industry'] = 85;
                console.log('[Extraction] Set industry confidence to 85 (Apollo)');
            }
            if (!data.businessDescription && result.data.description) {
                confidence['businessDescription'] = 75;
                console.log('[Extraction] Set businessDescription confidence to 75 (Apollo)');
            }

            return { data: enrichedData, confidence };
        }
    } catch (e) {
        console.warn('[Extraction] Apollo enrichment failed:', e);
    }

    return { data, confidence };
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
