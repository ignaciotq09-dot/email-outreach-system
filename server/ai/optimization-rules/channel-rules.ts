/**
 * Channel Optimization Rules - Research-Backed Dynamic Constraints
 * 
 * These rules determine optimal message length and structure based on:
 * - Channel (SMS, Email, LinkedIn)
 * - Context (sales, reminder, follow-up)
 * - Recipient seniority
 * - Available personalization data
 */

// ============================================================
// SMS OPTIMIZATION RULES
// ============================================================

export interface SmsOptimizationContext {
    messageType: 'cold_outreach' | 'follow_up' | 'appointment_reminder' | 'confirmation' | 'promotional';
    hasRecipientName: boolean;
    hasCompanyName: boolean;
    hasSpecificDetails: boolean;  // e.g., specific dates, times, offers
    inputLength: number;          // Original message length
    urgency: 'low' | 'medium' | 'high';
}

export interface SmsLengthRules {
    targetChars: number;
    maxChars: number;
    warningThreshold: number;
    multiSegmentAllowed: boolean;
    rationale: string;
}

/**
 * Get optimal SMS length based on context
 * Research: Under 100 chars = 2-5x higher response rate
 */
export function getSmsLengthRules(context: SmsOptimizationContext): SmsLengthRules {
    const { messageType, hasSpecificDetails, urgency } = context;

    // Cold outreach: SHORTEST possible
    if (messageType === 'cold_outreach') {
        return {
            targetChars: 70,        // Ultra-short for cold
            maxChars: 100,          // Hard limit for 2-5x response boost
            warningThreshold: 90,
            multiSegmentAllowed: false,
            rationale: 'Cold outreach SMS with <100 chars has 2-5x higher response rate',
        };
    }

    // Appointment reminders: Need more info but still concise
    if (messageType === 'appointment_reminder') {
        return {
            targetChars: 120,       // Room for date/time/location
            maxChars: 160,          // Single segment
            warningThreshold: 140,
            multiSegmentAllowed: false,
            rationale: 'Reminders need date/time but must fit single segment',
        };
    }

    // Confirmations: Keep tight
    if (messageType === 'confirmation') {
        return {
            targetChars: 80,
            maxChars: 120,
            warningThreshold: 100,
            multiSegmentAllowed: false,
            rationale: 'Confirmations should be instant-readable',
        };
    }

    // Follow-ups: Slightly more room if context exists
    if (messageType === 'follow_up') {
        if (hasSpecificDetails) {
            return {
                targetChars: 90,
                maxChars: 130,
                warningThreshold: 110,
                multiSegmentAllowed: false,
                rationale: 'Follow-up with context can be slightly longer',
            };
        }
        return {
            targetChars: 60,
            maxChars: 90,
            warningThreshold: 80,
            multiSegmentAllowed: false,
            rationale: 'Generic follow-ups should be ultra-short',
        };
    }

    // Promotional: More room but still prefer single segment
    if (urgency === 'high') {
        return {
            targetChars: 100,
            maxChars: 140,
            warningThreshold: 120,
            multiSegmentAllowed: false,
            rationale: 'Urgent promotions need impact in single segment',
        };
    }

    // Default
    return {
        targetChars: 80,
        maxChars: 120,
        warningThreshold: 100,
        multiSegmentAllowed: false,
        rationale: 'Default: optimize for high response rate',
    };
}

// Hook zone rules (notification preview)
export const SMS_HOOK_RULES = {
    hookZoneChars: 40,          // First 40 chars visible in notification
    mustIncludeInHook: ['name', 'value'],  // What to front-load
    hookPatterns: {
        question: /\?$/,           // Questions end with ?
        curiosity: /^(Quick|Noticed|Thought|Saw)\s/i,
        urgency: /^(Before|Last|Only|Today)\s/i,
        name: /^[A-Z][a-z]+,/,     // Starts with name
    },
    hookScoring: {
        startsWithName: 20,
        hasQuestion: 15,
        hasCuriosityWord: 15,
        hasUrgency: 10,
        under40chars: 10,
    },
};

// ============================================================
// EMAIL OPTIMIZATION RULES
// ============================================================

export interface EmailOptimizationContext {
    emailType: 'cold_outreach' | 'follow_up' | 'meeting_request' | 'proposal' | 'newsletter';
    recipientSeniority: 'entry' | 'mid' | 'senior' | 'executive' | 'c_suite';
    industry?: string;
    hasRichPersonalization: boolean;  // Trigger events, mutual connections, etc.
    inputWordCount: number;
}

export interface EmailLengthRules {
    targetWords: number;
    maxWords: number;
    optimalSentences: number;
    subjectMaxChars: number;
    rationale: string;
}

/**
 * Get optimal email length based on context
 * Research: 50-75 words = 65% more responses than 125-150 words
 * BUT: With rich personalization, up to 150 words can work
 */
export function getEmailLengthRules(context: EmailOptimizationContext): EmailLengthRules {
    const { emailType, recipientSeniority, hasRichPersonalization, inputWordCount } = context;

    // C-Suite: Ultra-short, no fluff
    if (recipientSeniority === 'c_suite') {
        return {
            targetWords: 50,
            maxWords: 75,
            optimalSentences: 3,
            subjectMaxChars: 40,
            rationale: 'C-suite executives prefer <75 words. Every word must earn its place.',
        };
    }

    // Senior/Executive: Short but can include key context
    if (recipientSeniority === 'senior' || recipientSeniority === 'executive') {
        return {
            targetWords: 60,
            maxWords: 100,
            optimalSentences: 4,
            subjectMaxChars: 45,
            rationale: 'Senior recipients value brevity but appreciate relevant context.',
        };
    }

    // Cold outreach: Always short
    if (emailType === 'cold_outreach') {
        if (hasRichPersonalization) {
            // More personalization data = can use more words effectively
            return {
                targetWords: 80,
                maxWords: 125,
                optimalSentences: 5,
                subjectMaxChars: 50,
                rationale: 'Rich personalization justifies slightly longer email for relevance.',
            };
        }
        return {
            targetWords: 50,
            maxWords: 75,
            optimalSentences: 3,
            subjectMaxChars: 45,
            rationale: 'Generic cold emails must be ultra-short to avoid spam perception.',
        };
    }

    // Follow-up: Even shorter than initial
    if (emailType === 'follow_up') {
        return {
            targetWords: 40,
            maxWords: 60,
            optimalSentences: 2,
            subjectMaxChars: 50,
            rationale: 'Follow-ups should be quick bumps, not repetitions.',
        };
    }

    // Meeting request: Needs logistics
    if (emailType === 'meeting_request') {
        return {
            targetWords: 60,
            maxWords: 100,
            optimalSentences: 4,
            subjectMaxChars: 45,
            rationale: 'Meeting requests need value prop + proposed times.',
        };
    }

    // Proposals: Can be longer if warranted by input
    if (emailType === 'proposal') {
        // Scale with input length
        const scaledTarget = Math.min(150, Math.max(80, inputWordCount * 0.8));
        return {
            targetWords: Math.round(scaledTarget),
            maxWords: 200,
            optimalSentences: 6,
            subjectMaxChars: 55,
            rationale: 'Proposals can be detailed if the input warrants it.',
        };
    }

    // Default: Mid-level recipient
    return {
        targetWords: 75,
        maxWords: 125,
        optimalSentences: 5,
        subjectMaxChars: 50,
        rationale: 'Default optimization for mid-level professionals.',
    };
}

// Subject line rules
export const EMAIL_SUBJECT_RULES = {
    optimal: { minChars: 20, maxChars: 50, optimalWords: 4 },
    formulas: {
        curiosityGap: 'Hint at value without revealing everything',
        question: 'Engage by asking something relevant',
        number: 'Specific numbers build credibility (e.g., "3 ways...")',
        personalized: 'Include name or company when relevant',
        patternInterrupt: 'Unexpected phrasing grabs attention',
    },
    forbidden: [
        'Re:',           // Fake reply threads
        '[External]',    // Already added by email client
        'Quick question',// Overused, spam trigger
        'FREE',          // Spam trigger
        '!!!',           // Spam trigger
    ],
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Detect personalization richness from available data
 */
export function detectPersonalizationRichness(data: {
    hasName: boolean;
    hasCompany: boolean;
    hasTriggerEvent: boolean;
    hasMutualConnection: boolean;
    hasRecentActivity: boolean;
    hasPainPoint: boolean;
}): 'minimal' | 'basic' | 'strong' | 'hyper' {
    const score =
        (data.hasName ? 1 : 0) +
        (data.hasCompany ? 1 : 0) +
        (data.hasTriggerEvent ? 2 : 0) +
        (data.hasMutualConnection ? 2 : 0) +
        (data.hasRecentActivity ? 1.5 : 0) +
        (data.hasPainPoint ? 1.5 : 0);

    if (score >= 6) return 'hyper';
    if (score >= 3.5) return 'strong';
    if (score >= 1.5) return 'basic';
    return 'minimal';
}

/**
 * Calculate optimal output length based on input
 * More input data = more room to work with (but still constrained)
 */
export function calculateDynamicLimit(
    inputLength: number,
    baseLimit: number,
    maxLimit: number,
    scaleFactor: number = 0.3
): number {
    // Scale output with input, but cap at maxLimit
    const dynamicLimit = baseLimit + (inputLength * scaleFactor);
    return Math.min(maxLimit, Math.round(dynamicLimit));
}

/**
 * Detect seniority from job title
 */
export function detectSeniorityFromTitle(title: string): EmailOptimizationContext['recipientSeniority'] {
    const titleLower = title.toLowerCase();

    if (/\b(ceo|cfo|cto|coo|cmo|cio|president|founder|owner|partner)\b/.test(titleLower)) {
        return 'c_suite';
    }
    if (/\b(vp|vice president|svp|evp|chief|director)\b/.test(titleLower)) {
        return 'executive';
    }
    if (/\b(senior|sr\.|lead|principal|head of|manager)\b/.test(titleLower)) {
        return 'senior';
    }
    if (/\b(associate|coordinator|specialist|analyst)\b/.test(titleLower)) {
        return 'mid';
    }
    if (/\b(junior|jr\.|intern|assistant|entry)\b/.test(titleLower)) {
        return 'entry';
    }

    return 'mid';  // Default to mid-level
}

// ============================================================
// EXPORTS
// ============================================================

export const CHANNEL_RULES = {
    sms: {
        getLengthRules: getSmsLengthRules,
        hookRules: SMS_HOOK_RULES,
    },
    email: {
        getLengthRules: getEmailLengthRules,
        subjectRules: EMAIL_SUBJECT_RULES,
    },
};
