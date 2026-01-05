// Enhanced Extraction Validator
// Full 32-field validation with scoring, industry awareness, and positive reinforcement
// Part of the extraction improvement initiative

import type { ExtractedCompanyData } from './types';

export interface EnhancedValidationResult {
    isValid: boolean;
    score: number;
    qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    issues: ValidationIssue[];
    positives: string[];
    suggestions: string[];
    fieldScores: Record<string, number>;
    completenessScore: number;
    icpScore: number;
    needsReview: boolean;
}

export interface ValidationIssue {
    field: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    evidence?: string;
    fixSuggestion?: string;
}

// Generic corporate phrases to reject
const GENERIC_PHRASES = [
    'committed to', 'dedicated to', 'passionate about',
    'focused on excellence', 'culture of', 'believe in',
    'strive for', 'pride ourselves', 'core values',
    'our mission is', 'we value', 'integrity and',
    'excellence in everything', 'world-class', 'industry-leading',
    'best-in-class', 'cutting-edge', 'innovative solutions',
    'leveraging synergies', 'holistic approach', 'seamless integration',
    'end-to-end', 'turnkey solutions', 'next-generation',
];

// Employee/internal phrases (wrong focus)
const EMPLOYEE_PHRASES = [
    'employee safety', 'workplace safety', 'job site safety',
    'team members', 'our employees', 'staff well-being',
    'work environment', 'professional development', 'career growth',
    'inclusive workplace', 'diversity and inclusion', 'employee engagement',
];

// Hallucination indicators
const HALLUCINATION_PHRASES = [
    'typically', 'likely', 'probably', 'generally',
    'in most cases', 'usually provides', 'often delivers',
    'may include', 'can help', 'potentially',
    'improve efficiency', 'save time', 'reduce costs',
];

// Good action verbs
const ACTION_VERBS = [
    'build', 'builds', 'building', 'create', 'creates', 'creating',
    'develop', 'develops', 'developing', 'manufacture', 'manufactures',
    'provide', 'provides', 'providing', 'deliver', 'delivers',
    'design', 'designs', 'designing', 'install', 'installs',
    'offer', 'offers', 'sell', 'sells', 'supply', 'supplies',
];

// Concrete nouns
const CONCRETE_NOUNS = [
    'software', 'platform', 'application', 'app', 'saas',
    'building', 'facility', 'project', 'structure', 'construction',
    'product', 'service', 'solution', 'system', 'tool',
    'equipment', 'machinery', 'device', 'hardware',
    'consulting', 'advisory', 'strategy', 'planning',
];

// ICP field weights for scoring
const ICP_FIELD_WEIGHTS = [
    { field: 'idealCustomerDescription', weight: 20 },
    { field: 'targetJobTitles', weight: 20 },
    { field: 'targetIndustries', weight: 15 },
    { field: 'targetCompanySizes', weight: 15 },
    { field: 'problemSolved', weight: 15 },
    { field: 'uniqueDifferentiator', weight: 10 },
    { field: 'typicalDealSize', weight: 5 },
];

/**
 * Calculate ICP-specific quality score
 */
export function calculateICPScore(data: ExtractedCompanyData): number {
    let score = 0;
    let maxScore = 0;

    for (const { field, weight } of ICP_FIELD_WEIGHTS) {
        maxScore += weight;
        const value = (data as any)[field];

        if (hasValue(value)) {
            let fieldScore = weight * 0.5;
            if (typeof value === 'string') {
                if (value.length >= 30) fieldScore = weight * 0.8;
                if (value.length >= 50) fieldScore = weight;
            } else if (Array.isArray(value)) {
                if (value.length >= 2) fieldScore = weight * 0.8;
                if (value.length >= 3) fieldScore = weight;
            }
            score += fieldScore;
        }
    }

    return Math.round((score / maxScore) * 100);
}

/**
 * Enhanced validation with all fields
 */
export function validateExtractionEnhanced(data: ExtractedCompanyData): EnhancedValidationResult {
    const issues: ValidationIssue[] = [];
    const positives: string[] = [];
    const suggestions: string[] = [];
    const fieldScores: Record<string, number> = {};
    let score = 50;

    // Check critical fields
    const criticalFields = ['companyName', 'businessDescription', 'industry', 'primaryOffering'];
    for (const field of criticalFields) {
        const value = (data as any)[field];
        if (!hasValue(value)) {
            issues.push({ field, severity: 'error', message: `Missing critical field: ${field}` });
            score -= 10;
        } else {
            fieldScores[field] = 10;
            score += 5;
        }
    }

    // Validate businessDescription deeply
    if (data.businessDescription) {
        const desc = data.businessDescription.toLowerCase();

        // Check for action verbs
        const hasActionVerb = ACTION_VERBS.some(v => desc.includes(v));
        if (hasActionVerb) {
            positives.push('businessDescription uses specific action verbs');
            score += 5;
        } else {
            issues.push({ field: 'businessDescription', severity: 'warning', message: 'Missing action verbs' });
            score -= 5;
        }

        // Check for generic phrases
        const genericFound = GENERIC_PHRASES.find(p => desc.includes(p));
        if (genericFound) {
            issues.push({ field: 'businessDescription', severity: 'warning', message: `Contains generic phrase: "${genericFound}"` });
            score -= 5;
        }

        // Check for employee focus
        const employeeFound = EMPLOYEE_PHRASES.find(p => desc.includes(p));
        if (employeeFound) {
            issues.push({ field: 'businessDescription', severity: 'error', message: 'Employee-focused, not client-facing' });
            score -= 10;
        }

        // Check for concrete nouns
        if (CONCRETE_NOUNS.some(n => desc.includes(n))) {
            positives.push('Describes specific products/services');
            score += 3;
        }
    }

    // Validate problemSolved
    if (data.problemSolved) {
        const prob = data.problemSolved.toLowerCase();
        if (EMPLOYEE_PHRASES.some(p => prob.includes(p))) {
            issues.push({ field: 'problemSolved', severity: 'error', message: 'Describes internal issues, not client problems' });
            score -= 10;
        }
        if (HALLUCINATION_PHRASES.some(p => prob.includes(p))) {
            issues.push({ field: 'problemSolved', severity: 'warning', message: 'May be hallucinated - too vague' });
            score -= 5;
        }
    }

    // Check ICP fields
    const icpScore = calculateICPScore(data);
    if (icpScore >= 80) {
        positives.push('Excellent ICP data');
        score += 10;
    } else if (icpScore >= 60) {
        positives.push('Good ICP coverage');
        score += 5;
    } else if (icpScore < 40) {
        issues.push({ field: 'ICP', severity: 'warning', message: `ICP score only ${icpScore}%` });
        suggestions.push('Find more ICP data from testimonials/case studies');
        score -= 5;
    }

    // Completeness check
    const allFields = Object.keys(data).filter(k => hasValue((data as any)[k]));
    const completenessScore = Math.round((allFields.length / 32) * 100);
    if (completenessScore >= 70) {
        positives.push(`Very complete profile (${completenessScore}%)`);
        score += 5;
    }

    // Clamp and grade
    score = Math.max(0, Math.min(100, Math.round(score)));
    const qualityGrade = getGrade(score);
    const needsReview = score < 50 || issues.some(i => i.severity === 'error');

    return {
        isValid: score >= 60,
        score,
        qualityGrade,
        issues,
        positives,
        suggestions,
        fieldScores,
        completenessScore,
        icpScore,
        needsReview,
    };
}

function hasValue(val: any): boolean {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

export function getEnhancedAssessment(result: EnhancedValidationResult): string {
    return `Grade: ${result.qualityGrade} (${result.score}/100) | ICP: ${result.icpScore}% | Completeness: ${result.completenessScore}%`;
}
