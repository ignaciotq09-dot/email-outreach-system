/**
 * Comprehensive Email Analyzer
 * Combines all analyzers for full email optimization analysis
 */

import { analyzeSalesEmail, type SalesEmailAnalysis } from './sales-analyzer';
import { analyzeEmailBestPractices, type BestPracticesAnalysis } from './best-practices-analyzer';
import { optimizeSubjectLine, type SubjectLineOptimization } from './subject-line-optimizer';
import { analyzeEmailStructure, type EmailStructureAnalysis } from './structure-analyzer';
import type {
    EmailType,
    DetailedAnalysisResult,
    CategoryScore,
    DetailedImprovement,
    EmailWritingTip,
    RecipientData
} from './types';

export interface FullEmailAnalysis {
    salesAnalysis: SalesEmailAnalysis;
    bestPractices: BestPracticesAnalysis;
    subjectOptimization: SubjectLineOptimization;
    structureAnalysis: EmailStructureAnalysis;
}

// Email writing tips based on email type
const EMAIL_WRITING_TIPS: EmailWritingTip[] = [
    // Sales tips
    {
        title: 'The 44-Character Subject Line',
        description: 'Subject lines around 44 characters get the highest open rates. This is the sweet spot for mobile and desktop visibility.',
        category: 'subject',
        applicableToType: ['sales', 'general', 'follow_up', 'meeting_request'],
    },
    {
        title: 'Lead with Their Name',
        description: 'Emails that use the recipient\'s first name in the first sentence see 26% higher response rates.',
        category: 'opening',
        applicableToType: ['sales', 'follow_up', 'meeting_request'],
    },
    {
        title: 'The 75-Word Rule',
        description: 'Sales emails between 50-125 words get the best response rates. Aim for 75 words as your target.',
        category: 'body',
        applicableToType: ['sales', 'follow_up'],
    },
    {
        title: 'One Ask Per Email',
        description: 'Emails with a single clear call-to-action get 3x more responses than those with multiple asks.',
        category: 'cta',
        applicableToType: ['sales', 'general', 'follow_up', 'meeting_request'],
    },
    {
        title: 'The Question Close',
        description: 'Ending with a question increases reply rates by 44%. Make it easy to answer with a simple yes/no.',
        category: 'cta',
        applicableToType: ['sales', 'follow_up', 'meeting_request'],
    },
    {
        title: 'You vs. I Ratio',
        description: 'High-performing emails use "you" and "your" 2x more than "I" and "we". Focus on the recipient.',
        category: 'body',
        applicableToType: ['sales', 'general', 'follow_up', 'meeting_request'],
    },
    {
        title: 'Pattern Interrupt Opener',
        description: 'Avoid generic openers like "I hope this finds you well." Start with an observation, question, or compliment about them.',
        category: 'opening',
        applicableToType: ['sales', 'follow_up'],
    },
    {
        title: 'Social Proof Boost',
        description: 'Mentioning similar companies or specific metrics increases credibility and responses by 45%.',
        category: 'body',
        applicableToType: ['sales'],
    },
    {
        title: 'Lowercase Subject Lines',
        description: 'All-lowercase subject lines feel more personal and can increase open rates by up to 32%.',
        category: 'subject',
        applicableToType: ['sales', 'follow_up'],
    },
    {
        title: 'The 15-Minute Ask',
        description: 'Requesting "15 minutes" feels less daunting than "a call" and gets higher acceptance rates.',
        category: 'cta',
        applicableToType: ['sales', 'meeting_request'],
    },
];

/**
 * Determine email type based on content
 */
export function detectEmailType(subject: string, body: string): EmailType {
    const content = (subject + ' ' + body).toLowerCase();

    if (/follow.?up|following up|checking in|any update/i.test(content)) {
        return 'follow_up';
    }
    if (/meeting|call|chat|coffee|catch up|schedule|calendar/i.test(content)) {
        return 'meeting_request';
    }
    // Use sales analyzer to determine if it's a sales email
    const salesCheck = analyzeSalesEmail(subject, body);
    if (salesCheck.isSalesEmail && salesCheck.confidence > 50) {
        return 'sales';
    }
    return 'general';
}

/**
 * Convert score to letter grade
 */
function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

/**
 * Convert score to status
 */
function scoreToStatus(score: number): CategoryScore['status'] {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'needs_work';
    return 'poor';
}

/**
 * Build category scores from analysis results
 */
function buildCategoryScores(
    subjectOpt: SubjectLineOptimization,
    salesAnalysis: SalesEmailAnalysis,
    structureAnalysis: EmailStructureAnalysis,
    bestPractices: BestPracticesAnalysis
): DetailedAnalysisResult['breakdown'] {
    return {
        subjectLine: {
            name: 'Subject Line',
            score: subjectOpt.score,
            maxScore: 100,
            status: scoreToStatus(subjectOpt.score),
            issues: subjectOpt.improvements.map(i => i.issue),
        },
        opening: {
            name: 'Opening',
            score: salesAnalysis.scores.openingLine.score,
            maxScore: 100,
            status: scoreToStatus(salesAnalysis.scores.openingLine.score),
            issues: salesAnalysis.scores.openingLine.issue ? [salesAnalysis.scores.openingLine.issue] : [],
        },
        valueProposition: {
            name: 'Value Proposition',
            score: salesAnalysis.scores.valueProposition.score,
            maxScore: 100,
            status: scoreToStatus(salesAnalysis.scores.valueProposition.score),
            issues: !salesAnalysis.scores.valueProposition.benefitFocused
                ? ['Missing clear benefits for the recipient']
                : [],
        },
        structure: {
            name: 'Structure & Readability',
            score: Math.round((structureAnalysis.overallScore + bestPractices.readability.score) / 2),
            maxScore: 100,
            status: scoreToStatus((structureAnalysis.overallScore + bestPractices.readability.score) / 2),
            issues: [...bestPractices.readability.issues, ...bestPractices.structure.issues],
        },
        callToAction: {
            name: 'Call to Action',
            score: salesAnalysis.scores.callToAction.score,
            maxScore: 100,
            status: scoreToStatus(salesAnalysis.scores.callToAction.score),
            issues: !salesAnalysis.scores.callToAction.hasClearCTA
                ? ['Missing or unclear call-to-action']
                : !salesAnalysis.scores.callToAction.lowFriction
                    ? ['CTA could be lower friction']
                    : [],
        },
    };
}

/**
 * Combine all improvements from different analyzers
 */
function combineImprovements(
    salesImprovements: SalesEmailAnalysis['improvements'],
    bestPracticeImprovements: BestPracticesAnalysis['improvements'],
    subjectImprovements: SubjectLineOptimization['improvements'],
    structureImprovements: EmailStructureAnalysis['improvements']
): DetailedImprovement[] {
    const all: DetailedImprovement[] = [];
    let id = 0;

    // Add sales improvements
    for (const imp of salesImprovements) {
        all.push({
            id: `sales-${id++}`,
            category: imp.category,
            priority: imp.priority,
            issue: imp.issue,
            suggestion: imp.suggestion,
            impact: imp.impact,
            example: imp.example,
        });
    }

    // Add best practice improvements (avoid duplicates)
    for (const imp of bestPracticeImprovements) {
        const isDuplicate = all.some(a =>
            a.issue.toLowerCase().includes(imp.issue.toLowerCase().substring(0, 20))
        );
        if (!isDuplicate) {
            all.push({
                id: `bp-${id++}`,
                category: imp.category,
                priority: imp.priority,
                issue: imp.issue,
                suggestion: imp.suggestion,
                impact: imp.impact,
            });
        }
    }

    // Add subject improvements
    for (const imp of subjectImprovements) {
        all.push({
            id: `subj-${id++}`,
            category: 'subject',
            priority: imp.priority,
            issue: imp.issue,
            suggestion: imp.suggestion,
            impact: imp.impact,
        });
    }

    // Add structure improvements (dedupe)
    for (const imp of structureImprovements) {
        const isDuplicate = all.some(a =>
            a.issue.toLowerCase().includes(imp.issue.toLowerCase().substring(0, 20))
        );
        if (!isDuplicate) {
            all.push({
                id: `struct-${id++}`,
                category: imp.section,
                priority: imp.priority,
                issue: imp.issue,
                suggestion: imp.suggestion,
                impact: imp.impact,
                example: imp.example,
            });
        }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return all.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 10);
}

/**
 * Get relevant tips for email type
 */
function getRelevantTips(emailType: EmailType, breakdown: DetailedAnalysisResult['breakdown']): EmailWritingTip[] {
    const relevant = EMAIL_WRITING_TIPS.filter(tip => tip.applicableToType.includes(emailType));

    // Prioritize tips for weak areas
    const scoredTips = relevant.map(tip => {
        let relevanceScore = 1;
        if (tip.category === 'subject' && breakdown.subjectLine.status !== 'excellent') relevanceScore = 3;
        if (tip.category === 'opening' && breakdown.opening.status !== 'excellent') relevanceScore = 3;
        if (tip.category === 'body' && breakdown.valueProposition.status !== 'excellent') relevanceScore = 2;
        if (tip.category === 'cta' && breakdown.callToAction.status !== 'excellent') relevanceScore = 3;
        return { tip, relevanceScore };
    });

    return scoredTips
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5)
        .map(t => t.tip);
}

/**
 * Predict email performance
 */
function predictPerformance(overallScore: number): DetailedAnalysisResult['predictions'] {
    if (overallScore >= 80) {
        return {
            openRate: '35-45%',
            responseRate: '15-25%',
            sentimentLikelihood: 'Very likely positive reception',
        };
    }
    if (overallScore >= 60) {
        return {
            openRate: '25-35%',
            responseRate: '8-15%',
            sentimentLikelihood: 'Likely positive reception',
        };
    }
    if (overallScore >= 40) {
        return {
            openRate: '15-25%',
            responseRate: '3-8%',
            sentimentLikelihood: 'Neutral reception expected',
        };
    }
    return {
        openRate: '10-15%',
        responseRate: '1-3%',
        sentimentLikelihood: 'May need significant improvements',
    };
}

/**
 * Run full email analysis
 */
export function runFullAnalysis(subject: string, body: string, recipientData?: RecipientData): FullEmailAnalysis {
    const salesAnalysis = analyzeSalesEmail(subject, body, recipientData);
    const emailType = detectEmailType(subject, body);
    const bestPracticesType = emailType === 'meeting_request' ? 'general' : emailType;
    const bestPractices = analyzeEmailBestPractices(body, bestPracticesType);
    const subjectOptimization = optimizeSubjectLine(subject);
    const structureAnalysis = analyzeEmailStructure(body);

    return {
        salesAnalysis,
        bestPractices,
        subjectOptimization,
        structureAnalysis,
    };
}

/**
 * Main comprehensive analysis function
 */
export function analyzeEmailComprehensive(
    subject: string,
    body: string,
    recipientData?: RecipientData
): DetailedAnalysisResult {
    const emailType = detectEmailType(subject, body);
    const fullAnalysis = runFullAnalysis(subject, body, recipientData);

    // Build category scores
    const breakdown = buildCategoryScores(
        fullAnalysis.subjectOptimization,
        fullAnalysis.salesAnalysis,
        fullAnalysis.structureAnalysis,
        fullAnalysis.bestPractices
    );

    // Calculate overall score (weighted average of categories)
    const overallScore = Math.round(
        breakdown.subjectLine.score * 0.2 +
        breakdown.opening.score * 0.2 +
        breakdown.valueProposition.score * 0.2 +
        breakdown.structure.score * 0.15 +
        breakdown.callToAction.score * 0.25
    );

    // Combine all improvements
    const improvements = combineImprovements(
        fullAnalysis.salesAnalysis.improvements,
        fullAnalysis.bestPractices.improvements,
        fullAnalysis.subjectOptimization.improvements,
        fullAnalysis.structureAnalysis.improvements
    );

    // Get relevant tips
    const tips = getRelevantTips(emailType, breakdown);

    return {
        emailType,
        overallScore,
        letterGrade: scoreToGrade(overallScore),
        breakdown,
        improvements,
        predictions: predictPerformance(overallScore),
        tips,
    };
}

// Re-export all individual analyzers
export { analyzeSalesEmail } from './sales-analyzer';
export { analyzeEmailBestPractices } from './best-practices-analyzer';
export { optimizeSubjectLine } from './subject-line-optimizer';
export { analyzeEmailStructure } from './structure-analyzer';
