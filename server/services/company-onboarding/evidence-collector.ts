// Evidence-based confidence scoring system
// Collects hard evidence for each extracted field to calculate reliable confidence scores

import * as cheerio from 'cheerio';
import type { ExtractedCompanyData } from './types';

// ============ TYPES ============

export type EvidenceType = 'structured_data' | 'exact_match' | 'semantic' | 'external_api' | 'multiple_sources';
export type ConfidenceTier = 'verified' | 'needs_review' | 'ask_question';

export interface EvidenceSource {
    type: EvidenceType;
    location: string;      // e.g., "homepage <title>", "schema.org Organization.name"
    rawText: string;       // Exact text found
    points: number;        // Confidence points for this source
}

export interface FieldEvidence {
    field: keyof ExtractedCompanyData;
    value: any;            // The extracted value
    sources: EvidenceSource[];
    totalPoints: number;
    tier: ConfidenceTier;
}

export interface EvidenceCollection {
    fields: Record<string, FieldEvidence>;
    structuredData: StructuredDataResult;
    metaTags: MetaTagsResult;
}

export interface StructuredDataResult {
    organization?: {
        name?: string;
        description?: string;
        industry?: string;
        url?: string;
        logo?: string;
        foundingDate?: string;
        numberOfEmployees?: string;
        address?: any;
    };
    product?: {
        name?: string;
        description?: string;
        offers?: any;
    };
    localBusiness?: any;
    website?: any;
    raw?: any[];
}

export interface MetaTagsResult {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogType?: string;
    ogSiteName?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    keywords?: string;
}

// ============ POINT VALUES ============

const EVIDENCE_POINTS = {
    STRUCTURED_DATA: 35,      // Schema.org JSON-LD
    EXACT_MATCH: 40,          // Found verbatim in HTML
    MULTIPLE_SOURCES: 15,     // Found on multiple pages
    SEMANTIC: 10,             // AI inferred from context
    EXTERNAL_API: 30,         // Apollo or other external source
} as const;

const TIER_THRESHOLDS = {
    VERIFIED: 75,
    NEEDS_REVIEW: 40,
} as const;

// ============ STRUCTURED DATA EXTRACTION ============

/**
 * Extracts structured data (Schema.org JSON-LD) from HTML
 */
export function extractStructuredData(html: string): StructuredDataResult {
    const $ = cheerio.load(html);
    const result: StructuredDataResult = { raw: [] };

    // Find all JSON-LD scripts
    $('script[type="application/ld+json"]').each((_, element) => {
        try {
            const jsonText = $(element).html();
            if (!jsonText) return;

            const data = JSON.parse(jsonText);
            result.raw!.push(data);

            // Handle @graph structure
            const items = data['@graph'] || [data];

            for (const item of items) {
                const type = item['@type'];

                if (type === 'Organization' || type === 'Corporation' || type === 'LocalBusiness') {
                    result.organization = {
                        name: item.name,
                        description: item.description,
                        industry: item.industry,
                        url: item.url,
                        logo: item.logo?.url || item.logo,
                        foundingDate: item.foundingDate,
                        numberOfEmployees: item.numberOfEmployees?.value,
                        address: item.address,
                    };
                    if (type === 'LocalBusiness') {
                        result.localBusiness = item;
                    }
                }

                if (type === 'Product' || type === 'Service') {
                    result.product = {
                        name: item.name,
                        description: item.description,
                        offers: item.offers,
                    };
                }

                if (type === 'WebSite') {
                    result.website = item;
                }
            }
        } catch (e) {
            // Invalid JSON, skip
        }
    });

    return result;
}

/**
 * Extracts meta tags (OG, Twitter, standard)
 */
export function extractMetaTags(html: string): MetaTagsResult {
    const $ = cheerio.load(html);

    return {
        title: $('title').text().trim() || undefined,
        description: $('meta[name="description"]').attr('content')?.trim() || undefined,
        ogTitle: $('meta[property="og:title"]').attr('content')?.trim() || undefined,
        ogDescription: $('meta[property="og:description"]').attr('content')?.trim() || undefined,
        ogType: $('meta[property="og:type"]').attr('content')?.trim() || undefined,
        ogSiteName: $('meta[property="og:site_name"]').attr('content')?.trim() || undefined,
        twitterTitle: $('meta[name="twitter:title"]').attr('content')?.trim() || undefined,
        twitterDescription: $('meta[name="twitter:description"]').attr('content')?.trim() || undefined,
        keywords: $('meta[name="keywords"]').attr('content')?.trim() || undefined,
    };
}

// ============ EVIDENCE COLLECTION ============

/**
 * Collects evidence for a specific field from the HTML and structured data
 */
export function collectFieldEvidence(
    field: keyof ExtractedCompanyData,
    value: any,
    html: string,
    structuredData: StructuredDataResult,
    metaTags: MetaTagsResult,
    apolloData?: any
): FieldEvidence {
    const sources: EvidenceSource[] = [];

    if (!value) {
        return {
            field,
            value: null,
            sources: [],
            totalPoints: 0,
            tier: 'ask_question',
        };
    }

    const valueStr = String(value).toLowerCase().trim();
    const htmlLower = html.toLowerCase();

    // Check structured data first (highest trust)
    const structuredEvidence = checkStructuredDataForField(field, value, structuredData);
    if (structuredEvidence) {
        sources.push(structuredEvidence);
    }

    // Check meta tags
    const metaEvidence = checkMetaTagsForField(field, value, metaTags);
    if (metaEvidence) {
        sources.push(metaEvidence);
    }

    // Check for exact text match in HTML
    if (valueStr.length >= 3 && htmlLower.includes(valueStr)) {
        sources.push({
            type: 'exact_match',
            location: 'HTML body',
            rawText: String(value).slice(0, 100),
            points: EVIDENCE_POINTS.EXACT_MATCH,
        });
    }

    // Check Apollo data
    if (apolloData) {
        const apolloEvidence = checkApolloForField(field, value, apolloData);
        if (apolloEvidence) {
            sources.push(apolloEvidence);
        }
    }

    // If no hard evidence found, mark as semantic (AI inference)
    if (sources.length === 0 && value) {
        sources.push({
            type: 'semantic',
            location: 'AI inference',
            rawText: String(value).slice(0, 100),
            points: EVIDENCE_POINTS.SEMANTIC,
        });
    }

    const totalPoints = sources.reduce((sum, s) => sum + s.points, 0);

    return {
        field,
        value,
        sources,
        totalPoints,
        tier: calculateTier(totalPoints, sources),
    };
}

/**
 * Check if structured data contains evidence for a field
 */
function checkStructuredDataForField(
    field: keyof ExtractedCompanyData,
    value: any,
    data: StructuredDataResult
): EvidenceSource | null {
    const org = data.organization;
    const valueStr = String(value).toLowerCase().trim();

    const fieldMappings: Record<string, { source: any; location: string }> = {
        companyName: { source: org?.name, location: 'Schema.org Organization.name' },
        businessDescription: { source: org?.description, location: 'Schema.org Organization.description' },
        industry: { source: org?.industry, location: 'Schema.org Organization.industry' },
        employeeCount: { source: org?.numberOfEmployees, location: 'Schema.org numberOfEmployees' },
    };

    const mapping = fieldMappings[field];
    if (mapping?.source) {
        const sourceStr = String(mapping.source).toLowerCase().trim();
        // Check if values are similar (allow for slight differences)
        if (sourceStr.includes(valueStr) || valueStr.includes(sourceStr)) {
            return {
                type: 'structured_data',
                location: mapping.location,
                rawText: String(mapping.source).slice(0, 100),
                points: EVIDENCE_POINTS.STRUCTURED_DATA,
            };
        }
    }

    return null;
}

/**
 * Check if meta tags contain evidence for a field
 */
function checkMetaTagsForField(
    field: keyof ExtractedCompanyData,
    value: any,
    meta: MetaTagsResult
): EvidenceSource | null {
    const valueStr = String(value).toLowerCase().trim();

    const fieldMappings: Record<string, { source?: string; location: string }[]> = {
        companyName: [
            { source: meta.title, location: '<title>' },
            { source: meta.ogTitle, location: 'og:title' },
            { source: meta.ogSiteName, location: 'og:site_name' },
        ],
        businessDescription: [
            { source: meta.description, location: '<meta description>' },
            { source: meta.ogDescription, location: 'og:description' },
        ],
    };

    const mappings = fieldMappings[field];
    if (mappings) {
        for (const mapping of mappings) {
            if (mapping.source) {
                const sourceStr = mapping.source.toLowerCase().trim();
                if (sourceStr.includes(valueStr) || valueStr.includes(sourceStr.slice(0, 50))) {
                    return {
                        type: 'exact_match',
                        location: mapping.location,
                        rawText: mapping.source.slice(0, 100),
                        points: EVIDENCE_POINTS.EXACT_MATCH,
                    };
                }
            }
        }
    }

    return null;
}

/**
 * Check if Apollo data confirms a field
 */
function checkApolloForField(
    field: keyof ExtractedCompanyData,
    value: any,
    apollo: any
): EvidenceSource | null {
    const fieldMappings: Record<string, string[]> = {
        companyName: ['name', 'organization_name'],
        industry: ['industry', 'industries'],
        employeeCount: ['employees', 'employee_count', 'estimated_num_employees'],
        headquarters: ['city', 'state', 'country'],
    };

    const keys = fieldMappings[field];
    if (!keys) return null;

    for (const key of keys) {
        if (apollo[key]) {
            return {
                type: 'external_api',
                location: `Apollo API: ${key}`,
                rawText: String(apollo[key]).slice(0, 100),
                points: EVIDENCE_POINTS.EXTERNAL_API,
            };
        }
    }

    return null;
}

/**
 * Calculate confidence tier from points and sources
 */
function calculateTier(totalPoints: number, sources: EvidenceSource[]): ConfidenceTier {
    // Auto-verify if we have structured data or external API
    const hasHighTrustSource = sources.some(
        s => s.type === 'structured_data' || s.type === 'external_api'
    );

    if (hasHighTrustSource || totalPoints >= TIER_THRESHOLDS.VERIFIED) {
        return 'verified';
    }

    if (totalPoints >= TIER_THRESHOLDS.NEEDS_REVIEW) {
        return 'needs_review';
    }

    return 'ask_question';
}

// ============ MAIN COLLECTION FUNCTION ============

/**
 * Collects evidence for all extracted fields
 */
export function collectAllEvidence(
    extractedData: ExtractedCompanyData,
    html: string,
    apolloData?: any
): EvidenceCollection {
    const structuredData = extractStructuredData(html);
    const metaTags = extractMetaTags(html);

    const fields: Record<string, FieldEvidence> = {};

    // Collect evidence for each field that has a value
    for (const [field, value] of Object.entries(extractedData)) {
        if (value !== undefined && value !== null) {
            fields[field] = collectFieldEvidence(
                field as keyof ExtractedCompanyData,
                value,
                html,
                structuredData,
                metaTags,
                apolloData
            );
        }
    }

    return {
        fields,
        structuredData,
        metaTags,
    };
}

/**
 * Gets all fields that should trigger questions (ask_question tier or missing critical fields)
 */
export function getFieldsNeedingQuestions(
    evidence: EvidenceCollection,
    criticalFields: (keyof ExtractedCompanyData)[]
): (keyof ExtractedCompanyData)[] {
    const needsQuestions: (keyof ExtractedCompanyData)[] = [];

    // Check for ask_question tier fields
    for (const [field, ev] of Object.entries(evidence.fields)) {
        if (ev.tier === 'ask_question') {
            needsQuestions.push(field as keyof ExtractedCompanyData);
        }
    }

    // Check for missing critical fields
    for (const field of criticalFields) {
        if (!evidence.fields[field]) {
            needsQuestions.push(field);
        }
    }

    return Array.from(new Set(needsQuestions)); // Deduplicate
}

console.log('[EvidenceCollector] Module loaded');
