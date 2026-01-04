// Extraction Quality Validator - Post-extraction validation
// Checks for generic phrases, action verbs, client-focus

import type { ExtractedCompanyData } from './types';

export interface ValidationResult {
    isValid: boolean;
    score: number;  // 0-100
    issues: ValidationIssue[];
    suggestions: string[];
    needsReview: boolean;  // Flag for human review
}

export interface ValidationIssue {
    field: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    evidence?: string;
}

// Generic corporate phrases that indicate low-quality extraction
const GENERIC_PHRASES = [
    'committed to',
    'dedicated to',
    'passionate about',
    'focused on excellence',
    'culture of',
    'believe in',
    'strive for',
    'pride ourselves',
    'core values',
    'our mission is',
    'we value',
    'integrity and',
    'excellence in everything',
    'customer-centric',
    'world-class',
    'industry-leading',
    'best-in-class',
    'cutting-edge',
    'innovative solutions',
    'leveraging synergies',
    'holistic approach',
    'seamless integration',
    'end-to-end',
    'turnkey solutions',
];

// Employee/internal-focused phrases (wrong focus for client-facing value)
const EMPLOYEE_FOCUSED_PHRASES = [
    'employee safety',
    'workplace safety',
    'job site safety',
    'team members',
    'our employees',
    'staff well-being',
    'work environment',
    'professional development',
    'career growth',
    'inclusive workplace',
    'diversity and inclusion',
    'employee engagement',
    'our team',
];

// Action verbs that indicate specific business activity
const ACTION_VERBS = [
    'build', 'builds', 'building',
    'create', 'creates', 'creating',
    'develop', 'develops', 'developing',
    'manufacture', 'manufactures', 'manufacturing',
    'provide', 'provides', 'providing',
    'deliver', 'delivers', 'delivering',
    'design', 'designs', 'designing',
    'install', 'installs', 'installing',
    'construct', 'constructs', 'constructing',
    'produce', 'produces', 'producing',
    'offer', 'offers', 'offering',
    'sell', 'sells', 'selling',
    'supply', 'supplies', 'supplying',
    'specialize', 'specializes', 'specializing',
];

// Specific nouns that indicate concrete offerings
const CONCRETE_NOUNS = [
    'software', 'platform', 'application', 'app',
    'building', 'facility', 'project', 'structure',
    'product', 'service', 'solution', 'system',
    'equipment', 'machinery', 'tool', 'device',
    'consulting', 'advisory', 'strategy', 'planning',
    'installation', 'maintenance', 'repair', 'support',
];

/**
 * Validate extracted company data for quality
 */
export function validateExtraction(data: ExtractedCompanyData): ValidationResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;  // Start at 100, deduct for issues

    // 1. Validate businessDescription
    if (data.businessDescription) {
        const descLower = data.businessDescription.toLowerCase();

        // Check for generic phrases
        const genericFound = GENERIC_PHRASES.filter(phrase => descLower.includes(phrase));
        if (genericFound.length > 0) {
            score -= genericFound.length * 10;
            issues.push({
                field: 'businessDescription',
                severity: 'error',
                message: `Contains generic corporate phrases: "${genericFound.join('", "')}"`,
                evidence: genericFound.join(', '),
            });
            suggestions.push('businessDescription should describe what they BUILD/SELL, not corporate values');
        }

        // Check for action verbs
        const hasActionVerb = ACTION_VERBS.some(verb => descLower.includes(verb));
        if (!hasActionVerb) {
            score -= 20;
            issues.push({
                field: 'businessDescription',
                severity: 'warning',
                message: 'Missing action verbs (build, create, provide, etc.) - may not describe what they DO',
            });
            suggestions.push('Add action verbs describing what the company builds, creates, or provides');
        }

        // Check for concrete nouns
        const hasConcreteNoun = CONCRETE_NOUNS.some(noun => descLower.includes(noun));
        if (!hasConcreteNoun) {
            score -= 10;
            issues.push({
                field: 'businessDescription',
                severity: 'info',
                message: 'Missing specific nouns (product, service, building, etc.)',
            });
        }

        // Check length
        if (data.businessDescription.length < 30) {
            score -= 15;
            issues.push({
                field: 'businessDescription',
                severity: 'warning',
                message: 'Description is too short - may be incomplete',
            });
        }
    } else {
        score -= 30;
        issues.push({
            field: 'businessDescription',
            severity: 'error',
            message: 'Missing businessDescription - critical field',
        });
    }

    // 2. Validate problemSolved / value proposition
    if (data.problemSolved) {
        const problemLower = data.problemSolved.toLowerCase();

        // Check for employee-focused content (wrong focus)
        const employeeFound = EMPLOYEE_FOCUSED_PHRASES.filter(phrase => problemLower.includes(phrase));
        if (employeeFound.length > 0) {
            score -= employeeFound.length * 15;
            issues.push({
                field: 'problemSolved',
                severity: 'error',
                message: `Employee/internal-focused, not client-facing: "${employeeFound.join('", "')}"`,
                evidence: employeeFound.join(', '),
            });
            suggestions.push('problemSolved should describe CLIENT problems, not employee welfare');
        }

        // Check for generic phrases
        const genericFound = GENERIC_PHRASES.filter(phrase => problemLower.includes(phrase));
        if (genericFound.length > 0) {
            score -= genericFound.length * 8;
            issues.push({
                field: 'problemSolved',
                severity: 'warning',
                message: `Contains generic phrases: "${genericFound.join('", "')}"`,
            });
        }
    }

    // 3. Validate ICP fields
    if (!data.idealCustomerDescription && !data.targetIndustries?.length && !data.targetJobTitles?.length) {
        score -= 20;
        issues.push({
            field: 'ICP',
            severity: 'warning',
            message: 'No ICP (target customer) information extracted',
        });
        suggestions.push('Look for "Who we serve", customer logos, testimonials for ICP data');
    }

    // 4. Check overall data completeness
    const criticalFields = ['companyName', 'industry', 'businessDescription', 'primaryOffering'];
    const missingCritical = criticalFields.filter(field => !data[field as keyof ExtractedCompanyData]);
    if (missingCritical.length > 0) {
        score -= missingCritical.length * 10;
        issues.push({
            field: 'completeness',
            severity: 'warning',
            message: `Missing critical fields: ${missingCritical.join(', ')}`,
        });
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine if human review is needed
    const needsReview = score < 50 || issues.some(i => i.severity === 'error');

    return {
        isValid: score >= 60,
        score,
        issues,
        suggestions,
        needsReview,
    };
}

/**
 * Check if a specific field value is valid
 */
export function isFieldValid(field: string, value: string | undefined): boolean {
    if (!value) return false;

    const valueLower = value.toLowerCase();

    // Check for generic phrases
    const hasGeneric = GENERIC_PHRASES.some(phrase => valueLower.includes(phrase));
    if (hasGeneric) return false;

    // For value prop fields, check for employee focus
    if (field === 'problemSolved' || field === 'uniqueDifferentiator') {
        const hasEmployeeFocus = EMPLOYEE_FOCUSED_PHRASES.some(phrase => valueLower.includes(phrase));
        if (hasEmployeeFocus) return false;
    }

    return true;
}

/**
 * Calculate quality score for extracted data
 */
export function calculateQualityScore(data: ExtractedCompanyData): number {
    const validation = validateExtraction(data);
    return validation.score;
}

/**
 * Get human-readable quality assessment
 */
export function getQualityAssessment(score: number): string {
    if (score >= 80) return 'Excellent - High quality extraction';
    if (score >= 60) return 'Good - Usable with minor issues';
    if (score >= 40) return 'Fair - May need manual review';
    if (score >= 20) return 'Poor - Significant issues detected';
    return 'Very Poor - Likely contains generic/irrelevant content';
}
