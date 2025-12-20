/**
 * Content Validator
 * Detects if AI has fabricated content not present in the original email
 */

export interface ValidationResult {
    isValid: boolean;
    warnings: string[];
    rejectedReason?: string;
}

/**
 * Extract key entities from text (names, companies, numbers, etc.)
 */
function extractEntities(text: string): Set<string> {
    const entities = new Set<string>();
    const lowerText = text.toLowerCase();

    // Extract capitalized words (potential names/companies)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    capitalizedWords.forEach(w => entities.add(w.toLowerCase()));

    // Extract numbers and percentages
    const numbers = text.match(/\d+%?|\$[\d,]+/g) || [];
    numbers.forEach(n => entities.add(n));

    // Extract quoted phrases
    const quotes = text.match(/"[^"]+"/g) || [];
    quotes.forEach(q => entities.add(q.toLowerCase()));

    return entities;
}

/**
 * Extract key topics/themes from text
 */
function extractTopics(text: string): Set<string> {
    const topics = new Set<string>();
    const lowerText = text.toLowerCase();

    // Common business topics
    const topicPatterns = [
        /\b(meeting|call|chat|sync|catch up)\b/gi,
        /\b(project|strategy|plan|proposal)\b/gi,
        /\b(product|service|solution|platform)\b/gi,
        /\b(sales|revenue|growth|roi)\b/gi,
        /\b(team|company|organization)\b/gi,
        /\b(time|schedule|calendar|availability)\b/gi,
    ];

    topicPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(m => topics.add(m.toLowerCase()));
    });

    return topics;
}

/**
 * Validate that a suggestion doesn't introduce new content
 */
export function validateSuggestion(
    original: string,
    suggestion: string,
    fullOriginalEmail: string
): ValidationResult {
    const warnings: string[] = [];

    // Get entities from original email (full context)
    const originalEntities = extractEntities(fullOriginalEmail);
    const suggestionEntities = extractEntities(suggestion);

    // Check for new entities not in original
    const newEntities: string[] = [];
    suggestionEntities.forEach(entity => {
        // Skip common words and short entities
        if (entity.length < 3 || isCommonWord(entity)) return;

        // Check if this entity exists in the original
        if (!originalEntities.has(entity) && !fullOriginalEmail.toLowerCase().includes(entity)) {
            newEntities.push(entity);
        }
    });

    // Reject if significant new entities found
    if (newEntities.length > 0) {
        // Filter out generic improvements like "quick" or "interested"
        const significantNewEntities = newEntities.filter(e => !isGenericImprovement(e));

        if (significantNewEntities.length > 0) {
            return {
                isValid: false,
                warnings: [`New content detected: ${significantNewEntities.join(', ')}`],
                rejectedReason: `Suggestion introduces content not in original: ${significantNewEntities.join(', ')}`,
            };
        }
    }

    // Check length explosion (suggestion shouldn't be much longer than original)
    const lengthRatio = suggestion.length / Math.max(original.length, 1);
    if (lengthRatio > 3) {
        warnings.push('Suggestion is significantly longer than original - may contain added content');
    }

    // Check for specific fabrication patterns
    const fabricationPatterns = [
        /I (noticed|saw|heard|read) (that |about )?your/i,
        /impressive (how|that|work)/i,
        /I recently (came across|discovered|found)/i,
        /I've been (following|watching|tracking)/i,
        /congratulations on/i,
        /I heard about your/i,
    ];

    for (const pattern of fabricationPatterns) {
        if (pattern.test(suggestion) && !pattern.test(fullOriginalEmail)) {
            return {
                isValid: false,
                warnings: [],
                rejectedReason: 'Suggestion adds personalization claims not in original email',
            };
        }
    }

    return {
        isValid: true,
        warnings,
    };
}

/**
 * Check if word is a common English word
 */
function isCommonWord(word: string): boolean {
    const commonWords = new Set([
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
        'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
        'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
        'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
        'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
        'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
        'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
        'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
        'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
        'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
        'any', 'these', 'give', 'day', 'most', 'us', 'hi', 'hello', 'hey',
        'thanks', 'thank', 'best', 'regards', 'sincerely', 'cheers',
    ]);
    return commonWords.has(word.toLowerCase());
}

/**
 * Check if word is a generic improvement (allowed additions)
 */
function isGenericImprovement(word: string): boolean {
    const genericImprovements = new Set([
        'quick', 'brief', 'short', 'interested', 'available', 'free',
        'thoughts', 'sense', 'worth', 'open', 'wondering', 'curious',
        'hope', 'let', 'know', 'soon', 'tomorrow', 'today', 'week',
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
        'morning', 'afternoon', 'evening', 'pm', 'am', 'minutes',
    ]);
    return genericImprovements.has(word.toLowerCase());
}

/**
 * Validate the overall email optimization result
 */
export function validateOptimizationResult(
    originalSubject: string,
    originalBody: string,
    optimizedSubject: string,
    optimizedBody: string
): ValidationResult {
    const fullOriginal = `${originalSubject} ${originalBody}`;
    const warnings: string[] = [];

    // Validate subject
    const subjectValidation = validateSuggestion(originalSubject, optimizedSubject, fullOriginal);
    if (!subjectValidation.isValid) {
        warnings.push(`Subject: ${subjectValidation.rejectedReason}`);
    }

    // Validate body
    const bodyValidation = validateSuggestion(originalBody, optimizedBody, fullOriginal);
    if (!bodyValidation.isValid) {
        warnings.push(`Body: ${bodyValidation.rejectedReason}`);
    }

    // Aggregate warnings
    warnings.push(...subjectValidation.warnings);
    warnings.push(...bodyValidation.warnings);

    return {
        isValid: subjectValidation.isValid && bodyValidation.isValid,
        warnings,
        rejectedReason: !subjectValidation.isValid ? subjectValidation.rejectedReason :
            !bodyValidation.isValid ? bodyValidation.rejectedReason : undefined,
    };
}
