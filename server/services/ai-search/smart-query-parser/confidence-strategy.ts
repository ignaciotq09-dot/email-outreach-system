/**
 * Confidence-Based Search Strategy
 * Adjusts search behavior based on AI parse confidence to reduce bad searches
 * and improve user experience
 */

import type { ParseConfidence, SmartParsedFilters } from './types';

export interface ConfidenceStrategy {
    shouldAutoExecute: boolean;
    shouldShowAlternatives: boolean;
    suggestionCount: number;
    maxResults: number;
    userMessage?: string;
}

/**
 * Determines optimal search strategy based on AI confidence level
 * 
 * @param confidence - Confidence scores from AI query parsing
 * @param filters - Parsed filter values
 * @returns Strategy object with execution guidance
 */
export function determineSearchStrategy(
    confidence: ParseConfidence,
    filters: SmartParsedFilters
): ConfidenceStrategy {
    const score = confidence.overall;

    // High Confidence (0.8+): Execute immediately, user knows what they want
    if (score >= 0.8) {
        return {
            shouldAutoExecute: true,
            shouldShowAlternatives: false,
            suggestionCount: 1,
            maxResults: 100,
        };
    }

    // Medium Confidence (0.5-0.8): Show filters, ask for quick confirmation
    if (score >= 0.5) {
        return {
            shouldAutoExecute: false,
            shouldShowAlternatives: true,
            suggestionCount: 2,
            maxResults: 50,
            userMessage: `I interpreted your search as: ${formatFilters(filters)}. Is this correct?`,
        };
    }

    // Low Confidence (<0.5): Present multiple interpretations, let user choose
    return {
        shouldAutoExecute: false,
        shouldShowAlternatives: true,
        suggestionCount: 3,
        maxResults: 25,
        userMessage: 'I\'m not quite sure what you\'re looking for. Here are a few interpretations:',
    };
}

/**
 * Formats filters into human-readable string for display
 */
function formatFilters(filters: SmartParsedFilters): string {
    const parts: string[] = [];

    if (filters.jobTitles.length > 0) {
        parts.push(`Titles: ${filters.jobTitles.slice(0, 3).join(', ')}`);
    }
    if (filters.locations.length > 0) {
        parts.push(`Locations: ${filters.locations.slice(0, 2).join(', ')}`);
    }
    if (filters.industries.length > 0) {
        parts.push(`Industries: ${filters.industries.slice(0, 2).join(', ')}`);
    }
    if (filters.companySizes.length > 0) {
        parts.push(`Company Size: ${filters.companySizes.join(', ')}`);
    }

    return parts.join(' | ') || 'No specific filters';
}

/**
 * Adjusts result count based on confidence to avoid wasting API quota
 * Lower confidence = fetch fewer results in case the parse was wrong
 * 
 * @param confidence - Overall confidence score (0-1)
 * @param baseCount - Requested result count
 * @returns Adjusted result count
 */
export function adjustResultCountByConfidence(
    confidence: number,
    baseCount: number
): number {
    // Very low confidence: limit to 25 results
    if (confidence < 0.5) return Math.min(baseCount, 25);

    // Medium confidence: limit to 50 results
    if (confidence < 0.7) return Math.min(baseCount, 50);

    // High confidence: use full requested count
    return baseCount;
}

/**
 * Estimates result count category before executing search
 * Used to make smarter fallback decisions and optimize pagination
 */
export function estimateResultCount(filters: SmartParsedFilters): 'zero' | 'low' | 'medium' | 'high' {
    let filterCount = 0;
    let restrictiveness = 0;

    // Count active filters and calculate restrictiveness score
    if (filters.jobTitles?.length > 0) {
        filterCount++;
        // Many specific titles = more restrictive
        restrictiveness += filters.jobTitles.length > 5 ? 2 : 1;
    }

    if (filters.locations?.length > 0) {
        filterCount++;
        // Single specific location = very restrictive
        restrictiveness += filters.locations.length === 1 ? 2 : 1;
    }

    if (filters.industries?.length > 0) {
        filterCount++;
        // Single industry = more restrictive
        restrictiveness += filters.industries.length === 1 ? 2 : 1;
    }

    if (filters.companySizes?.length > 0) {
        filterCount++;
        restrictiveness += 1;
    }

    if (filters.companies?.length > 0) {
        filterCount++;
        // Company filter is VERY restrictive
        restrictiveness += 3;
    }

    if (filters.seniorities?.length > 0) {
        filterCount++;
        // Single seniority level = more restrictive
        restrictiveness += filters.seniorities.length === 1 ? 2 : 1;
    }

    // Advanced filters add restrictiveness
    if (filters.emailStatuses?.length === 1) {
        restrictiveness += 1;
    }

    if (filters.previousCompanies?.length > 0) {
        restrictiveness += 2;
    }

    if (filters.schools?.length > 0) {
        restrictiveness += 2;
    }

    // Estimation logic based on restrictiveness score
    if (filterCount === 0) return 'high'; // No filters = many results

    if (restrictiveness >= 8) return 'zero'; // Too specific, likely 0 results
    if (restrictiveness >= 6) return 'low'; // Very specific, <50 results
    if (restrictiveness >= 4) return 'medium'; // Moderately specific, 50-200 results

    return 'high'; // Broad search, 200+ results
}
