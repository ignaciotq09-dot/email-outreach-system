// Binary Per-Field Evidence Scoring
// Each field is individually scored: Verified if hard evidence, Needs Review if AI-inferred

import * as cheerio from 'cheerio';
import type { ExtractedCompanyData } from './types';

// ============ TYPES ============

export type ConfidenceTier = 'verified' | 'needs_review';

export interface FieldEvidence {
    field: keyof ExtractedCompanyData;
    value: any;
    tier: ConfidenceTier;
    source: string;  // Where we found it (for debugging/display)
}

export interface PerFieldConfidence {
    [field: string]: {
        score: number;  // 100 = verified, 50 = needs_review
        tier: ConfidenceTier;
        source: string;
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

    // Find Schema.org JSON-LD
    $('script[type="application/ld+json"]').each((_, element) => {
        try {
            const data = JSON.parse($(element).html() || '');
            const items = data['@graph'] || [data];

            for (const item of items) {
                if (['Organization', 'Corporation', 'LocalBusiness'].includes(item['@type'])) {
                    result.companyName = item.name;
                    result.description = item.description;
                    result.industry = item.industry;
                }
            }
        } catch (e) { /* ignore invalid JSON */ }
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

// ============ BINARY EVIDENCE CHECK ============

/**
 * Check if a value has hard evidence (not just AI inference)
 * Returns: { verified: boolean, source: string }
 */
function checkHardEvidence(
    field: keyof ExtractedCompanyData,
    value: any,
    html: string,
    structuredData: StructuredData,
    metaTags: MetaTags,
    apolloData?: any
): { verified: boolean; source: string } {

    if (!value) {
        return { verified: false, source: 'No value' };
    }

    const valueStr = String(value).toLowerCase().trim();
    const htmlLower = html.toLowerCase();

    // ===== CHECK 1: Schema.org Structured Data =====
    if (field === 'companyName' && structuredData.companyName) {
        const schemaName = structuredData.companyName.toLowerCase();
        if (schemaName.includes(valueStr) || valueStr.includes(schemaName)) {
            return { verified: true, source: 'Schema.org Organization.name' };
        }
    }
    if (field === 'businessDescription' && structuredData.description) {
        const schemaDesc = structuredData.description.toLowerCase();
        if (schemaDesc.includes(valueStr.slice(0, 50)) || valueStr.includes(schemaDesc.slice(0, 50))) {
            return { verified: true, source: 'Schema.org description' };
        }
    }
    if (field === 'industry' && structuredData.industry) {
        return { verified: true, source: 'Schema.org industry' };
    }

    // ===== CHECK 2: Meta Tags =====
    if (field === 'companyName') {
        if (metaTags.title && metaTags.title.toLowerCase().includes(valueStr)) {
            return { verified: true, source: '<title> tag' };
        }
        if (metaTags.ogTitle && metaTags.ogTitle.toLowerCase().includes(valueStr)) {
            return { verified: true, source: 'og:title' };
        }
        if (metaTags.ogSiteName && metaTags.ogSiteName.toLowerCase().includes(valueStr)) {
            return { verified: true, source: 'og:site_name' };
        }
    }
    if (field === 'businessDescription') {
        if (metaTags.description && metaTags.description.length > 20) {
            const metaDesc = metaTags.description.toLowerCase();
            if (metaDesc.includes(valueStr.slice(0, 30)) || valueStr.includes(metaDesc.slice(0, 30))) {
                return { verified: true, source: '<meta description>' };
            }
        }
        if (metaTags.ogDescription && metaTags.ogDescription.length > 20) {
            return { verified: true, source: 'og:description' };
        }
    }

    // ===== CHECK 3: Apollo API =====
    if (apolloData) {
        if (field === 'companyName' && apolloData.name) {
            return { verified: true, source: 'Apollo API' };
        }
        if (field === 'industry' && (apolloData.industry || apolloData.industries)) {
            return { verified: true, source: 'Apollo API' };
        }
        if (field === 'employeeCount' && apolloData.employees) {
            return { verified: true, source: 'Apollo API' };
        }
    }

    // ===== CHECK 4: Exact Text Match (for short values) =====
    // Only for short, specific fields where exact match is meaningful
    const exactMatchFields = ['companyName', 'industry', 'headquarters', 'employeeCount'];
    if (exactMatchFields.includes(field) && valueStr.length >= 3 && valueStr.length <= 50) {
        if (htmlLower.includes(valueStr)) {
            return { verified: true, source: 'Exact text match in HTML' };
        }
    }

    // ===== No hard evidence found =====
    return { verified: false, source: 'AI inference' };
}

// ============ MAIN FUNCTION ============

/**
 * Calculate per-field confidence for all extracted data
 * Each field gets its own score based on evidence
 */
export function calculatePerFieldConfidence(
    extractedData: ExtractedCompanyData,
    html: string,
    apolloData?: any
): PerFieldConfidence {

    const structuredData = extractStructuredData(html);
    const metaTags = extractMetaTags(html);

    const result: PerFieldConfidence = {};

    // Check each field individually
    for (const [field, value] of Object.entries(extractedData)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;

        const evidence = checkHardEvidence(
            field as keyof ExtractedCompanyData,
            value,
            html,
            structuredData,
            metaTags,
            apolloData
        );

        result[field] = {
            score: evidence.verified ? 100 : 50,
            tier: evidence.verified ? 'verified' : 'needs_review',
            source: evidence.source,
        };
    }

    // Log for debugging
    const verifiedCount = Object.values(result).filter(r => r.tier === 'verified').length;
    const reviewCount = Object.values(result).filter(r => r.tier === 'needs_review').length;
    console.log(`[EvidenceCollector] Per-field results: ${verifiedCount} verified, ${reviewCount} needs_review`);

    return result;
}

/**
 * Convert per-field confidence to legacy format (Record<string, number>)
 */
export function toNumericConfidence(perField: PerFieldConfidence): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [field, data] of Object.entries(perField)) {
        result[field] = data.score;
    }
    return result;
}

console.log('[EvidenceCollector] Binary per-field module loaded');
