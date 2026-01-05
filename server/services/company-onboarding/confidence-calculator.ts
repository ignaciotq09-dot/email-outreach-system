// Confidence Calculator
// Calculates tier-based confidence from collected evidence

import type { ExtractedCompanyData } from './types';
import type { FieldEvidence, ConfidenceTier, EvidenceCollection } from './evidence-collector';

// ============ FIELD IMPORTANCE ============

// Critical fields that should NEVER be guessed - ask question if uncertain
const CRITICAL_FIELDS: (keyof ExtractedCompanyData)[] = [
    'companyName',
    'businessDescription',
    'problemSolved',
    'targetJobTitles',
    'idealCustomerDescription',
];

// High-value fields - prefer to ask if low confidence
const HIGH_VALUE_FIELDS: (keyof ExtractedCompanyData)[] = [
    'industry',
    'productsServices',
    'typicalDealSize',
    'uniqueDifferentiator',
    'targetIndustries',
];

// Optional fields - can show as "needs review" even with low evidence
const OPTIONAL_FIELDS: (keyof ExtractedCompanyData)[] = [
    'awards',
    'certifications',
    'customerCount',
    'caseStudies',
    'headquarters',
];

// ============ ANTI-HALLUCINATION RULES ============

const VAGUE_PHRASES = [
    'typically',
    'often',
    'usually',
    'many',
    'various',
    'several',
    'some',
    'generally',
    'approximately',
    'around',
    'about',
    'numerous',
    'multiple',
    'a range of',
    'a variety of',
    'industry-leading',
    'world-class',
    'best-in-class',
    'cutting-edge',
    'innovative solutions',
    'state-of-the-art',
];

const MIN_DESCRIPTION_LENGTH = 20;

// ============ VALIDATION FUNCTIONS ============

/**
 * Check if a value contains vague/hallucinated phrases
 */
export function containsVaguePhrases(value: any): boolean {
    if (typeof value !== 'string') return false;
    const lowerValue = value.toLowerCase();
    return VAGUE_PHRASES.some(phrase => lowerValue.includes(phrase));
}

/**
 * Validate a field value meets minimum quality standards
 */
export function validateFieldValue(
    field: keyof ExtractedCompanyData,
    value: any
): { valid: boolean; reason?: string } {
    if (value === null || value === undefined) {
        return { valid: false, reason: 'No value provided' };
    }

    // String fields
    if (typeof value === 'string') {
        if (value.trim().length === 0) {
            return { valid: false, reason: 'Empty string' };
        }

        // Description fields need minimum length
        const descriptionFields = ['businessDescription', 'problemSolved', 'uniqueDifferentiator', 'idealCustomerDescription'];
        if (descriptionFields.includes(field) && value.length < MIN_DESCRIPTION_LENGTH) {
            return { valid: false, reason: `Too short (min ${MIN_DESCRIPTION_LENGTH} chars)` };
        }

        // Check for vague phrases in critical fields
        if (CRITICAL_FIELDS.includes(field) && containsVaguePhrases(value)) {
            return { valid: false, reason: 'Contains vague/generic phrases' };
        }
    }

    // Array fields need at least one item
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { valid: false, reason: 'Empty array' };
        }
        // Check for meaningful items (not just generic terms)
        const meaningfulItems = value.filter(item =>
            typeof item === 'string' && item.trim().length >= 3
        );
        if (meaningfulItems.length === 0) {
            return { valid: false, reason: 'No meaningful items in array' };
        }
    }

    return { valid: true };
}

// ============ TIER CALCULATION ============

/**
 * Calculate the confidence tier for a field with anti-hallucination checks
 */
export function calculateFieldTier(
    field: keyof ExtractedCompanyData,
    evidence: FieldEvidence
): ConfidenceTier {
    // First, validate the value
    const validation = validateFieldValue(field, evidence.value);
    if (!validation.valid) {
        return 'ask_question';
    }

    // Check for vague phrases (force ask_question for critical fields)
    if (CRITICAL_FIELDS.includes(field) && containsVaguePhrases(evidence.value)) {
        return 'ask_question';
    }

    // Use evidence tier as base
    let tier = evidence.tier;

    // Adjust based on field importance
    if (tier === 'needs_review' && CRITICAL_FIELDS.includes(field)) {
        // Critical fields with only "needs_review" should ask question
        // unless they have structured data backing
        const hasStrongEvidence = evidence.sources.some(
            s => s.type === 'structured_data' || s.type === 'external_api'
        );
        if (!hasStrongEvidence) {
            tier = 'ask_question';
        }
    }

    // Optional fields can stay as needs_review
    if (tier === 'ask_question' && OPTIONAL_FIELDS.includes(field)) {
        // Only if there's SOME evidence
        if (evidence.totalPoints >= 10) {
            tier = 'needs_review';
        }
    }

    return tier;
}

// ============ RESULTS CALCULATION ============

export interface ConfidenceResult {
    field: keyof ExtractedCompanyData;
    value: any;
    tier: ConfidenceTier;
    evidencePoints: number;
    evidenceSources: string[];
    validationIssue?: string;
}

export interface ConfidenceResults {
    verified: ConfidenceResult[];
    needsReview: ConfidenceResult[];
    askQuestion: ConfidenceResult[];
    // Summary stats
    totalFields: number;
    verifiedCount: number;
    needsReviewCount: number;
    askQuestionCount: number;
}

/**
 * Calculate confidence for all fields in an extraction
 */
export function calculateAllConfidence(
    evidenceCollection: EvidenceCollection,
    extractedData: ExtractedCompanyData
): ConfidenceResults {
    const results: ConfidenceResults = {
        verified: [],
        needsReview: [],
        askQuestion: [],
        totalFields: 0,
        verifiedCount: 0,
        needsReviewCount: 0,
        askQuestionCount: 0,
    };

    // Process each field with evidence
    for (const [field, evidence] of Object.entries(evidenceCollection.fields)) {
        const fieldKey = field as keyof ExtractedCompanyData;
        const tier = calculateFieldTier(fieldKey, evidence);

        const result: ConfidenceResult = {
            field: fieldKey,
            value: evidence.value,
            tier,
            evidencePoints: evidence.totalPoints,
            evidenceSources: evidence.sources.map(s => s.location),
        };

        // Check validation
        const validation = validateFieldValue(fieldKey, evidence.value);
        if (!validation.valid) {
            result.validationIssue = validation.reason;
        }

        // Categorize by tier
        switch (tier) {
            case 'verified':
                results.verified.push(result);
                results.verifiedCount++;
                break;
            case 'needs_review':
                results.needsReview.push(result);
                results.needsReviewCount++;
                break;
            case 'ask_question':
                results.askQuestion.push(result);
                results.askQuestionCount++;
                break;
        }

        results.totalFields++;
    }

    // Add missing critical fields to askQuestion
    for (const criticalField of CRITICAL_FIELDS) {
        if (!evidenceCollection.fields[criticalField]) {
            results.askQuestion.push({
                field: criticalField,
                value: null,
                tier: 'ask_question',
                evidencePoints: 0,
                evidenceSources: [],
                validationIssue: 'Field not found during extraction',
            });
            results.askQuestionCount++;
            results.totalFields++;
        }
    }

    return results;
}

/**
 * Convert confidence results to the legacy format (Record<field, number>)
 * for backward compatibility
 */
export function toLegacyConfidence(results: ConfidenceResults): Record<string, number> {
    const legacy: Record<string, number> = {};

    for (const r of results.verified) {
        legacy[r.field] = 90; // Verified = 90%
    }
    for (const r of results.needsReview) {
        legacy[r.field] = 70; // Needs review = 70%
    }
    for (const r of results.askQuestion) {
        legacy[r.field] = 0; // Ask question = 0%
    }

    return legacy;
}

/**
 * Get tier display info for frontend
 */
export function getTierDisplay(tier: ConfidenceTier): { label: string; color: string; icon: string } {
    switch (tier) {
        case 'verified':
            return { label: 'Verified', color: 'green', icon: '✓' };
        case 'needs_review':
            return { label: 'Needs Review', color: 'yellow', icon: '⚠' };
        case 'ask_question':
            return { label: 'Please Confirm', color: 'gray', icon: '?' };
    }
}

console.log('[ConfidenceCalculator] Module loaded');
