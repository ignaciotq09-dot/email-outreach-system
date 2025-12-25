// Subject Line Optimizer Analysis Functions

import type { LengthAnalysis, HookTypeAnalysis, EmotionalTriggerAnalysis, SpamRiskAnalysis, MobilePreviewAnalysis, PersonalizationAnalysis, SubjectLineOptimization, SubjectImprovement, SuggestedSubject } from "./types";
import { HOOK_PATTERNS, EMOTIONAL_TRIGGERS, SPAM_TRIGGERS, ALL_CAPS_PATTERN, EXCESSIVE_PUNCT_PATTERN } from "./patterns";

export function analyzeSubjectLength(subject: string): LengthAnalysis {
    const charCount = subject.length, wordCount = subject.split(/\s+/).length;
    let status: LengthAnalysis['status'] = 'optimal';
    if (charCount < 20) status = 'too_short'; else if (charCount <= 35) status = 'mobile_optimal'; else if (charCount <= 60) status = 'optimal'; else status = 'too_long';
    return { charCount, wordCount, status, mobileVisible: Math.min(charCount, 35), desktopVisible: Math.min(charCount, 70) };
}

export function analyzeHookType(subject: string): HookTypeAnalysis {
    const detected: string[] = [], recommendations: string[] = [];
    let effective = false;
    for (const [key, { patterns, name, boost }] of Object.entries(HOOK_PATTERNS)) {
        for (const pattern of patterns) { if (pattern.test(subject)) { detected.push(`${name} (${boost})`); effective = true; break; } }
    }
    if (detected.length === 0) { recommendations.push('Add a hook: question, number, or curiosity gap'); recommendations.push('Questions increase open rates by 44%'); }
    if (subject === subject.toLowerCase()) { detected.push('All lowercase (+32%)'); effective = true; }
    return { detected, effective, recommendations };
}

export function analyzeEmotionalTriggers(subject: string): EmotionalTriggerAnalysis {
    const lowerSubject = subject.toLowerCase();
    const triggers: Array<{ type: string; word: string; boost: string }> = [];
    let score = 50;
    for (const [emotionType, { words, boost }] of Object.entries(EMOTIONAL_TRIGGERS)) {
        for (const word of words) { if (lowerSubject.includes(word)) { triggers.push({ type: emotionType, word, boost }); score += 15; break; } }
    }
    return { triggers, score: Math.min(100, score) };
}

export function analyzeSpamRisk(subject: string): SpamRiskAnalysis {
    const lowerSubject = subject.toLowerCase();
    const triggers: string[] = [], recommendations: string[] = [];
    let score = 0;
    for (const { word, risk, alternative } of SPAM_TRIGGERS) {
        if (lowerSubject.includes(word)) { score += risk === 'high' ? 20 : 10; triggers.push(word); recommendations.push(`Replace "${word}" with "${alternative}"`); }
    }
    if (ALL_CAPS_PATTERN.test(subject)) { score += 25; triggers.push('ALL CAPS words'); recommendations.push('Avoid all-caps words - they trigger spam filters'); }
    if (EXCESSIVE_PUNCT_PATTERN.test(subject)) { score += 20; triggers.push('Excessive punctuation'); recommendations.push('Use single punctuation marks only'); }
    if (subject.includes('$') || /\$\d+/.test(subject)) { score += 15; triggers.push('Dollar amounts'); recommendations.push('Avoid mentioning specific dollar amounts in subject lines'); }
    return { score: Math.min(100, score), triggers, recommendations };
}

export function analyzeMobilePreview(subject: string): MobilePreviewAnalysis {
    const previewText = subject.substring(0, 35);
    const recommendations: string[] = [];
    const isComplete = subject.length <= 35 || subject.substring(0, 35).includes(' ');
    if (subject.length > 35) { recommendations.push(`Only "${previewText}..." visible on mobile`); recommendations.push('Put key message in first 35 characters'); }
    const firstWord = subject.split(' ')[0]?.toLowerCase() || '';
    if (['the', 'a', 'an', 'our', 'your', 'i'].includes(firstWord)) recommendations.push('Lead with a strong word, not articles or pronouns');
    return { previewText: previewText + (subject.length > 35 ? '...' : ''), isComplete, recommendations };
}

export function analyzeSubjectPersonalization(subject: string): PersonalizationAnalysis {
    const hasTokens = /\{[^}]+\}|\[[^\]]+\]/.test(subject);
    const hasName = /\{(first_?name|name)\}|\[(first_?name|name)\]/i.test(subject);
    const hasCompany = /\{company\}|\[company\]/i.test(subject);
    let score = 40; if (hasTokens) score += 20; if (hasName) score += 20; if (hasCompany) score += 20;
    return { hasTokens, hasName, hasCompany, score: Math.min(100, score) };
}

export function generateSubjectImprovements(analysis: SubjectLineOptimization['analysis']): SubjectImprovement[] {
    const improvements: SubjectImprovement[] = [];
    if (analysis.length.status === 'too_long') improvements.push({ issue: `Subject line too long (${analysis.length.charCount} chars)`, suggestion: 'Shorten to under 50 characters for better open rates', impact: '+21% open rate for shorter subjects', priority: 'high' });
    else if (analysis.length.status === 'too_short') improvements.push({ issue: `Subject line too short (${analysis.length.charCount} chars)`, suggestion: 'Add more context or intrigue (aim for 30-50 chars)', impact: 'Short subjects lack context and intrigue', priority: 'medium' });
    if (!analysis.hookType.effective) improvements.push({ issue: 'No effective hook detected', suggestion: 'Add a question, number, or curiosity gap to grab attention', impact: 'Hooks increase open rates by 20-44%', priority: 'critical' });
    if (analysis.spamRisk.score > 30) improvements.push({ issue: `High spam risk (${analysis.spamRisk.triggers.join(', ')})`, suggestion: analysis.spamRisk.recommendations[0] || 'Remove spam trigger words', impact: 'Reduces deliverability and trust', priority: 'critical' });
    for (const rec of analysis.mobilePreview.recommendations) improvements.push({ issue: 'Mobile preview optimization needed', suggestion: rec, impact: '60% of emails opened on mobile', priority: 'medium' });
    if (analysis.personalization.score < 60) improvements.push({ issue: 'Missing personalization', suggestion: 'Add {name} or {company} tokens to subject line', impact: '+26% higher open rates with personalization', priority: 'high' });
    return improvements.sort((a, b) => ({ critical: 0, high: 1, medium: 2, low: 3 })[a.priority] - ({ critical: 0, high: 1, medium: 2, low: 3 })[b.priority]);
}

export function generateSubjectSuggestions(originalSubject: string): SuggestedSubject[] {
    const suggestions: SuggestedSubject[] = [];
    const baseSubject = originalSubject.replace(/[?!.]$/, '').trim();
    suggestions.push({ text: baseSubject + '?', hookType: 'Question', predictedBoost: '+44%' });
    suggestions.push({ text: originalSubject.toLowerCase(), hookType: 'All lowercase', predictedBoost: '+32%' });
    if (!/\d/.test(originalSubject)) suggestions.push({ text: `3 ways to ${baseSubject.toLowerCase()}`, hookType: 'List format', predictedBoost: '+45%' });
    suggestions.push({ text: `Quick question about ${baseSubject.toLowerCase()}`, hookType: 'Pattern interrupt', predictedBoost: '+35%' });
    return suggestions;
}
