// Field-Specific Confidence Rules
// Each field has custom verification logic based on where/how data was found

import * as cheerio from 'cheerio';
import type { ExtractedCompanyData } from './types';

export type ConfidenceTier = 'verified' | 'needs_review';

export interface PerFieldConfidence {
    [field: string]: {
        score: number;  // 100 = verified, 50 = needs_review
        tier: ConfidenceTier;
        source: string;
        reason: string;
    };
}

// ============ STRUCTURED DATA EXTRACTION ============

interface StructuredData {
    companyName?: string;
    description?: string;
    industry?: string;
}

interface MetaTags {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogSiteName?: string;
}

function extractStructuredData(html: string): StructuredData {
    const $ = cheerio.load(html);
    const result: StructuredData = {};

    $('script[type="application/ld+json"]').each((_, element) => {
        try {
            const data = JSON.parse($(element).html() || '');
            const items = data['@graph'] || [data];

            for (const item of items) {
                if (['Organization', 'Corporation', 'LocalBusiness', 'WebSite'].includes(item['@type'])) {
                    result.companyName = result.companyName || item.name;
                    result.description = result.description || item.description;
                    result.industry = result.industry || item.industry;
                }
            }
        } catch (e) { /* ignore */ }
    });

    return result;
}

function extractMetaTags(html: string): MetaTags {
    const $ = cheerio.load(html);

    return {
        title: $('title').text().trim() || undefined,
        description: $('meta[name="description"]').attr('content')?.trim(),
        ogTitle: $('meta[property="og:title"]').attr('content')?.trim(),
        ogDescription: $('meta[property="og:description"]').attr('content')?.trim(),
        ogSiteName: $('meta[property="og:site_name"]').attr('content')?.trim(),
    };
}

// ============ FIELD-SPECIFIC VERIFICATION RULES ============

interface VerificationContext {
    html: string;
    htmlLower: string;
    structuredData: StructuredData;
    metaTags: MetaTags;
    apolloData?: any;
}

type FieldVerifier = (value: any, ctx: VerificationContext) => { verified: boolean; source: string; reason: string };

const FIELD_RULES: Record<string, FieldVerifier> = {

    // === TIER 1: CRITICAL ===

    companyName: (value, ctx) => {
        const valLower = String(value).toLowerCase().trim();

        // Schema.org Organization.name
        if (ctx.structuredData.companyName?.toLowerCase().includes(valLower)) {
            return { verified: true, source: 'Schema.org', reason: 'Found in structured data' };
        }
        // og:site_name exact match
        if (ctx.metaTags.ogSiteName?.toLowerCase() === valLower) {
            return { verified: true, source: 'og:site_name', reason: 'Exact match in meta' };
        }
        // Apollo confirms
        if (ctx.apolloData?.name?.toLowerCase().includes(valLower)) {
            return { verified: true, source: 'Apollo API', reason: 'Third-party confirmed' };
        }
        // In title tag
        if (ctx.metaTags.title?.toLowerCase().includes(valLower)) {
            return { verified: false, source: '<title>', reason: 'Found in title (may include tagline)' };
        }
        return { verified: false, source: 'AI inference', reason: 'No authoritative source' };
    },

    businessDescription: (value, ctx) => {
        const valStr = String(value);
        const valLower = valStr.toLowerCase();

        // Too short
        if (valStr.length < 50) {
            return { verified: false, source: 'AI inference', reason: 'Description too short (<50 chars)' };
        }
        // Contains vague corporate speak
        const vagueTerms = ['leading', 'innovative', 'world-class', 'committed to', 'passionate'];
        if (vagueTerms.some(term => valLower.includes(term))) {
            return { verified: false, source: 'AI inference', reason: 'Contains vague corporate language' };
        }
        // Schema.org description
        if (ctx.structuredData.description && ctx.structuredData.description.length > 50) {
            return { verified: true, source: 'Schema.org', reason: 'Found in structured data' };
        }
        // og:description
        if (ctx.metaTags.ogDescription && ctx.metaTags.ogDescription.length > 50) {
            return { verified: true, source: 'og:description', reason: 'Found in meta description' };
        }
        // Contains action verbs
        const actionVerbs = ['builds', 'creates', 'provides', 'develops', 'manufactures', 'delivers'];
        if (actionVerbs.some(verb => valLower.includes(verb))) {
            return { verified: true, source: 'Content analysis', reason: 'Contains action verbs' };
        }
        return { verified: false, source: 'AI inference', reason: 'AI summarized from content' };
    },

    industry: (value, ctx) => {
        const valLower = String(value).toLowerCase();

        // Apollo API
        if (ctx.apolloData?.industry || ctx.apolloData?.industries) {
            return { verified: true, source: 'Apollo API', reason: 'Third-party confirmed' };
        }
        // Schema.org industry
        if (ctx.structuredData.industry) {
            return { verified: true, source: 'Schema.org', reason: 'Found in structured data' };
        }
        // Explicit statement "We are a [X] company"
        const pattern = new RegExp(`(we are a|we're a)\\s+${valLower}`, 'i');
        if (pattern.test(ctx.html)) {
            return { verified: true, source: 'Explicit statement', reason: 'Found "We are a [X]" pattern' };
        }
        return { verified: false, source: 'AI inference', reason: 'Inferred from content' };
    },

    productsServices: (value, ctx) => {
        const items = Array.isArray(value) ? value : [value];

        // Check if found on /products or /services page
        const productPages = ['/products', '/services', '/solutions', '/offerings'];
        const hasProductPage = productPages.some(p => ctx.htmlLower.includes(p));

        // 3+ distinct items
        if (items.length >= 3 && hasProductPage) {
            return { verified: true, source: 'Products page', reason: '3+ items from dedicated page' };
        }
        // Check for vague items
        const vagueItems = ['solutions', 'consulting', 'services', 'support'];
        const allVague = items.every(i => vagueItems.includes(String(i).toLowerCase()));
        if (allVague) {
            return { verified: false, source: 'AI inference', reason: 'Only vague terms found' };
        }
        if (items.length >= 3) {
            return { verified: true, source: 'Content extraction', reason: '3+ specific items found' };
        }
        return { verified: false, source: 'AI inference', reason: 'Limited items found' };
    },

    // === TIER 2: ICP FIELDS ===

    targetJobTitles: (value, ctx) => {
        const items = Array.isArray(value) ? value : [value];
        const valStr = items.join(' ').toLowerCase();

        // Generic check
        const genericTitles = ['decision makers', 'executives', 'leaders', 'managers'];
        if (genericTitles.some(t => valStr.includes(t))) {
            return { verified: false, source: 'AI inference', reason: 'Generic titles only' };
        }
        // Check for testimonial/case study source
        if (ctx.htmlLower.includes('testimonial') || ctx.htmlLower.includes('case study')) {
            return { verified: true, source: 'Testimonials', reason: 'From customer quotes' };
        }
        // Check for "who we serve" section
        if (ctx.htmlLower.includes('who we serve') || ctx.htmlLower.includes('for teams')) {
            return { verified: true, source: 'Who we serve', reason: 'Explicit target audience' };
        }
        return { verified: false, source: 'AI inference', reason: 'Inferred from content' };
    },

    targetIndustries: (value, ctx) => {
        const items = Array.isArray(value) ? value : [value];

        // Check for explicit list
        if (ctx.htmlLower.includes('industries we serve') || ctx.htmlLower.includes('sectors')) {
            return { verified: true, source: 'Industries section', reason: 'Explicit list found' };
        }
        // Check for case studies
        if (ctx.htmlLower.includes('case study') || ctx.htmlLower.includes('case studies')) {
            return { verified: true, source: 'Case studies', reason: 'From client examples' };
        }
        if (items.length >= 2) {
            return { verified: false, source: 'AI inference', reason: 'Multiple industries detected' };
        }
        return { verified: false, source: 'AI inference', reason: 'Inferred from content' };
    },

    targetCompanySizes: (value, ctx) => {
        const valStr = String(value).toLowerCase();

        // Explicit size indicators
        const sizePatterns = ['teams of', 'employees', 'enterprise', 'smb', 'startup', 'mid-market'];
        if (sizePatterns.some(p => ctx.htmlLower.includes(p))) {
            return { verified: true, source: 'Size indicator', reason: 'Explicit size mentioned' };
        }
        // Pricing tier indicates size
        if (ctx.htmlLower.includes('pricing') && (valStr.includes('team') || valStr.includes('enterprise'))) {
            return { verified: true, source: 'Pricing tiers', reason: 'Tier names indicate size' };
        }
        return { verified: false, source: 'AI inference', reason: 'No size indicators found' };
    },

    idealCustomerDescription: (value, ctx) => {
        const valStr = String(value);

        // Too short or generic
        if (valStr.length < 30) {
            return { verified: false, source: 'AI inference', reason: 'Description too short' };
        }
        // Found in "who we serve"
        if (ctx.htmlLower.includes('who we serve') || ctx.htmlLower.includes('ideal for')) {
            return { verified: true, source: 'Who we serve', reason: 'Explicit ICP statement' };
        }
        return { verified: false, source: 'AI inference', reason: 'AI generated summary' };
    },

    // === TIER 3: VALUE PROPOSITION ===

    problemSolved: (value, ctx) => {
        const valLower = String(value).toLowerCase();

        // "We help you..." pattern
        if (ctx.htmlLower.includes('we help') || ctx.htmlLower.includes('we solve')) {
            return { verified: true, source: 'Help statement', reason: 'Found "We help..." pattern' };
        }
        // Internal problems (bad)
        const internalTerms = ['safety', 'culture', 'employee', 'workplace'];
        if (internalTerms.some(t => valLower.includes(t))) {
            return { verified: false, source: 'AI inference', reason: 'Internal issue, not client problem' };
        }
        return { verified: false, source: 'AI inference', reason: 'Inferred from features' };
    },

    uniqueDifferentiator: (value, ctx) => {
        const valLower = String(value).toLowerCase();

        // Generic claims (bad)
        const genericClaims = ['best', 'fastest', 'leading', '#1', 'top'];
        if (genericClaims.some(c => valLower.includes(c))) {
            return { verified: false, source: 'AI inference', reason: 'Generic claim only' };
        }
        // "Why choose us" section
        if (ctx.htmlLower.includes('why choose') || ctx.htmlLower.includes('unlike')) {
            return { verified: true, source: 'Why choose us', reason: 'Explicit differentiator section' };
        }
        return { verified: false, source: 'AI inference', reason: 'Inferred from content' };
    },

    typicalDealSize: (value, ctx) => {
        const valStr = String(value);

        // Has actual numbers
        if (/\$[\d,]+/.test(valStr)) {
            return { verified: true, source: 'Pricing page', reason: 'Explicit price found' };
        }
        // "Starting at" pattern
        if (ctx.htmlLower.includes('starting at') || ctx.htmlLower.includes('from $')) {
            return { verified: true, source: 'Pricing page', reason: 'Price range found' };
        }
        // "Contact for pricing" only
        if (ctx.htmlLower.includes('contact') && ctx.htmlLower.includes('pricing')) {
            return { verified: false, source: 'AI inference', reason: 'Contact for pricing only' };
        }
        return { verified: false, source: 'AI inference', reason: 'No pricing found' };
    },

    keyBenefits: (value, ctx) => {
        const items = Array.isArray(value) ? value : [value];

        // Vague benefits check
        const vagueBenefits = ['save time', 'save money', 'increase efficiency', 'improve'];
        const someVague = items.some(i => vagueBenefits.some(v => String(i).toLowerCase().includes(v)));

        if (items.length >= 3 && !someVague) {
            return { verified: true, source: 'Homepage', reason: '3+ specific benefits found' };
        }
        if (items.length >= 3) {
            return { verified: false, source: 'Content', reason: 'Benefits are vague' };
        }
        return { verified: false, source: 'AI inference', reason: 'Limited benefits found' };
    },

    // === TIER 4: BRAND ===

    brandPersonality: (value, ctx) => {
        return { verified: false, source: 'AI inference', reason: 'Inferred from writing style' };
    },

    formalityLevel: (value, ctx) => {
        return { verified: false, source: 'AI inference', reason: 'Estimated from content' };
    },
};

// Default rule for fields without specific rules
const defaultRule: FieldVerifier = (value, ctx) => {
    return { verified: false, source: 'AI inference', reason: 'No specific validation rule' };
};

// ============ MAIN FUNCTION ============

export function calculatePerFieldConfidence(
    extractedData: ExtractedCompanyData,
    html: string,
    apolloData?: any
): PerFieldConfidence {

    const structuredData = extractStructuredData(html);
    const metaTags = extractMetaTags(html);

    const ctx: VerificationContext = {
        html,
        htmlLower: html.toLowerCase(),
        structuredData,
        metaTags,
        apolloData,
    };

    const result: PerFieldConfidence = {};

    for (const [field, value] of Object.entries(extractedData)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;

        const verifier = FIELD_RULES[field] || defaultRule;
        const verification = verifier(value, ctx);

        result[field] = {
            score: verification.verified ? 100 : 50,
            tier: verification.verified ? 'verified' : 'needs_review',
            source: verification.source,
            reason: verification.reason,
        };
    }

    // Log summary
    const verified = Object.values(result).filter(r => r.tier === 'verified');
    const review = Object.values(result).filter(r => r.tier === 'needs_review');
    console.log(`[EvidenceCollector] Results: ${verified.length} verified, ${review.length} needs review`);

    // Log details
    for (const [field, data] of Object.entries(result)) {
        console.log(`  ${data.tier === 'verified' ? '✓' : '⚠'} ${field}: ${data.source} - ${data.reason}`);
    }

    return result;
}

export function toNumericConfidence(perField: PerFieldConfidence): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [field, data] of Object.entries(perField)) {
        result[field] = data.score;
    }
    return result;
}

// ============ CITATION VALIDATION ============
// Validates AI citations by checking if the quoted text exists in HTML
// If validated, upgrades field from needs_review to verified

export interface Citation {
    source: string;
    quote: string;
}

export function validateCitations(
    perFieldConfidence: PerFieldConfidence,
    citations: Record<string, Citation> | undefined,
    html: string
): PerFieldConfidence {
    if (!citations) {
        console.log('[CitationValidator] No citations provided, skipping validation');
        return perFieldConfidence;
    }

    const htmlLower = html.toLowerCase();
    const result = { ...perFieldConfidence };
    let validatedCount = 0;
    let invalidCount = 0;

    for (const [field, citation] of Object.entries(citations)) {
        if (!citation?.quote || typeof citation.quote !== 'string') continue;
        if (!result[field]) continue;

        const quoteLower = citation.quote.toLowerCase().trim();

        // Skip very short quotes (too easy to match accidentally)
        if (quoteLower.length < 30) continue;

        // Check if quote exists in HTML (fuzzy match - allow for whitespace differences)
        const normalizedQuote = quoteLower.replace(/\s+/g, ' ').slice(0, 100); // First 100 chars
        const normalizedHtml = htmlLower.replace(/\s+/g, ' ');

        if (normalizedHtml.includes(normalizedQuote)) {
            // Quote validated! Upgrade to verified if it was needs_review
            if (result[field].tier === 'needs_review') {
                result[field] = {
                    score: 100,
                    tier: 'verified',
                    source: citation.source || result[field].source,
                    reason: `Quote validated in HTML: "${citation.quote.slice(0, 50)}..."`
                };
                validatedCount++;
                console.log(`  ✓ ${field}: Citation validated - UPGRADED to verified`);
            }
        } else {
            // Quote NOT found - this might be hallucination
            if (result[field].tier === 'verified') {
                // Downgrade if it was marked verified but quote doesn't exist
                // Only downgrade if the original source was "AI inference" type
                if (result[field].source.includes('AI') || result[field].source.includes('inference')) {
                    result[field] = {
                        score: 50,
                        tier: 'needs_review',
                        source: result[field].source,
                        reason: `Citation quote not found in HTML`
                    };
                    invalidCount++;
                    console.log(`  ⚠ ${field}: Citation NOT validated - quote not found`);
                }
            }
        }
    }

    console.log(`[CitationValidator] Validated: ${validatedCount}, Invalid: ${invalidCount}`);
    return result;
}

console.log('[EvidenceCollector] Field-specific rules module loaded');

