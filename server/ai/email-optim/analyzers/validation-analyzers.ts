// Input Validation and Structure Analysis Functions
// Extracted from analyzers.ts

import { ValidationResult, EmailIntent } from "../types";

// INPUT VALIDATION & SANITIZATION (function 1)
export function sanitizeEmailInput(content: string | null | undefined): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (content === null || content === undefined) return { isValid: false, sanitizedContent: '', warnings: [], errors: ['Content is null or undefined'] };
    if (content.trim() === '') return { isValid: false, sanitizedContent: '', warnings: [], errors: ['Content is empty'] };

    let sanitized = content;
    const MAX_LENGTH = 50000;
    if (sanitized.length > MAX_LENGTH) { warnings.push(`Content exceeds ${MAX_LENGTH} characters, truncated from ${sanitized.length}`); sanitized = sanitized.substring(0, MAX_LENGTH); }

    sanitized = sanitized.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    const originalLength = sanitized.length;
    sanitized = sanitized.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
    if (sanitized.length < originalLength * 0.5) warnings.push('Excessive whitespace removed');

    const dangerousPatterns = [/<script[^>]*>.*?<\/script>/gi, /<iframe[^>]*>.*?<\/iframe>/gi, /javascript:/gi, /on\w+\s*=/gi];
    dangerousPatterns.forEach(pattern => { if (pattern.test(sanitized)) { warnings.push('Potentially dangerous content removed'); sanitized = sanitized.replace(pattern, ''); } });

    return { isValid: errors.length === 0, sanitizedContent: sanitized.trim(), warnings, errors };
}

// BASIC INTENT DETECTION (original function at top)
export function detectEmailIntent(content: string): EmailIntent {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('follow') || lowerContent.includes('following up')) return EmailIntent.FOLLOW_UP;
    else if (lowerContent.includes('meeting') || lowerContent.includes('call') || lowerContent.includes('chat')) return EmailIntent.MEETING_REQUEST;
    else if (lowerContent.includes('mutual') || lowerContent.includes('introduced')) return EmailIntent.WARM_INTRODUCTION;
    else if (lowerContent.includes('been a while') || lowerContent.includes('reconnect')) return EmailIntent.RE_ENGAGEMENT;
    else if (lowerContent.includes('closing') || lowerContent.includes('last email')) return EmailIntent.BREAKUP;
    else if (lowerContent.includes('resource') || lowerContent.includes('guide') || lowerContent.includes('case study')) return EmailIntent.VALUE_DELIVERY;
    else return EmailIntent.COLD_OUTREACH;
}

// BASIC SUBJECT LINE ANALYSIS
export function analyzeSubjectLine(subject: string): number {
    let score = 50;
    if (subject.length >= 30 && subject.length <= 50) score += 15; else if (subject.length < 30) score += 5;
    if (/\d/.test(subject)) score += 10;
    if (subject.includes('?')) score += 10;
    if (subject === subject.toLowerCase()) score += 5;
    const avoidWords = ['free', 'guarantee', 'amazing', 'revolutionary'];
    if (avoidWords.some(word => subject.toLowerCase().includes(word))) score -= 15;
    if (subject.includes('{') || subject.includes('[')) score += 10;
    return Math.min(100, Math.max(0, score));
}

// BASIC BODY ANALYSIS
export function analyzeEmailBody(body: string): number {
    let score = 50;
    const wordCount = body.split(' ').length;
    const sentenceCount = body.split(/[.!?]+/).length - 1;
    if (wordCount >= 50 && wordCount <= 125) score += 20; else if (wordCount < 50) score += 5;
    if (sentenceCount >= 6 && sentenceCount <= 8) score += 15;
    const powerWords = ['because', 'imagine', 'proven', 'exclusive', 'transform'];
    powerWords.forEach(word => { if (body.toLowerCase().includes(word)) score += 3; });
    if (body.includes('%') || body.includes('companies') || body.includes('clients')) score += 10;
    const ctaPhrases = ['worth', 'interested', 'chat', 'discuss', 'explore'];
    if (ctaPhrases.some(phrase => body.toLowerCase().includes(phrase))) score += 10;
    return Math.min(100, Math.max(0, score));
}

// PERSONALIZATION SCORE
export function calculatePersonalizationScore(content: string, recipientData?: any): number {
    let score = 40;
    if (!recipientData) return score;
    if (recipientData.company && content.includes(recipientData.company)) score += 20;
    if (recipientData.industry) score += 10;
    if (recipientData.previousEngagement) score += 15;
    if (content.includes('noticed') || content.includes('saw')) score += 15;
    return Math.min(100, Math.max(0, score));
}

// GREETING ANALYSIS (function 6)
export function analyzeGreeting(content: string): { hasGreeting: boolean; type: string; text: string } {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim().toLowerCase() || '';
    const firstTwoLines = lines.slice(0, 2).join(' ').toLowerCase();

    const professionalGreetings = ['dear', 'hello', 'good morning', 'good afternoon', 'greetings'];
    const casualGreetings = ['hi', 'hey', 'yo', 'sup', 'hiya'];

    let hasGreeting = false, type = 'none', text = '';
    professionalGreetings.forEach(greeting => { if (firstTwoLines.includes(greeting)) { hasGreeting = true; type = 'professional'; text = lines[0] || ''; } });
    casualGreetings.forEach(greeting => { if (firstLine.startsWith(greeting)) { hasGreeting = true; type = 'casual'; text = lines[0] || ''; } });

    return { hasGreeting, type, text };
}

// SIGNATURE ANALYSIS (function 7)
export function analyzeSignature(content: string): { hasSignature: boolean; hasContactInfo: boolean; elements: string[] } {
    const lines = content.split('\n');
    const lastFiveLines = lines.slice(-5).join('\n').toLowerCase();
    const elements: string[] = [];
    let hasContactInfo = false;

    const signaturePatterns = [/best regards/i, /sincerely/i, /thanks/i, /cheers/i, /warm regards/i, /kind regards/i];
    const hasSignature = signaturePatterns.some(pattern => pattern.test(lastFiveLines));

    if (/\d{3}[-.\\s]?\d{3}[-.\\s]?\d{4}/.test(lastFiveLines)) { elements.push('phone'); hasContactInfo = true; }
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(lastFiveLines)) { elements.push('email'); hasContactInfo = true; }
    if (/https?:\/\//.test(lastFiveLines)) { elements.push('website'); hasContactInfo = true; }
    if (/linkedin|twitter|facebook/i.test(lastFiveLines)) { elements.push('social'); hasContactInfo = true; }

    return { hasSignature, hasContactInfo, elements };
}

// SUBJECT LINE DEEP ANALYSIS (function 12)
export function analyzeSubjectLineDeep(subject: string): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 50;

    if (subject === subject.toUpperCase() && subject.length > 3) { issues.push('Subject is ALL CAPS'); suggestions.push('Use normal capitalization'); score -= 20; }

    const clickbaitWords = ['you won\'t believe', 'shocking', 'amazing', 'secret', 'one weird trick'];
    clickbaitWords.forEach(word => { if (subject.toLowerCase().includes(word)) { issues.push('Clickbait language detected'); suggestions.push('Use straightforward, honest language'); score -= 15; } });

    if (/!{2,}/.test(subject) || /\?{2,}/.test(subject)) { issues.push('Excessive punctuation'); suggestions.push('Use single punctuation marks'); score -= 10; }

    const hasEmoji = /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(subject) || subject.split('').some(char => char.charCodeAt(0) > 127 && char.charCodeAt(0) < 55296);
    if (hasEmoji) issues.push('Contains emoji (may not display on all devices)');

    if (subject.length > 60) { issues.push('Subject too long (may get truncated on mobile)'); suggestions.push('Keep subject under 60 characters'); score -= 10; }
    else if (subject.length < 20) { issues.push('Subject too short (may lack context)'); suggestions.push('Add more context to subject'); score -= 5; }
    else score += 15;

    return { score: Math.max(0, Math.min(100, score)), issues, suggestions };
}

// TEMPLATE DETECTION (function 14)
export function detectTemplateUsage(content: string): { isTemplate: boolean; unmergedTokens: string[]; confidence: number } {
    const unmergedTokens: string[] = [];
    const tokenPatterns = [/\{\{[^}]+\}\}/g, /\{[A-Z_]+\}/g, /\[[A-Z_\s]+\]/g, /%[A-Z_]+%/g];
    tokenPatterns.forEach(pattern => { const matches = content.match(pattern) || []; unmergedTokens.push(...matches); });

    const genericPhrases = ['dear sir/madam', 'to whom it may concern', 'valued customer', 'this is a mass email'];
    const hasGenericPhrases = genericPhrases.some(phrase => content.toLowerCase().includes(phrase));

    const isTemplate = unmergedTokens.length > 0 || hasGenericPhrases;
    const confidence = Math.min(100, (unmergedTokens.length * 30) + (hasGenericPhrases ? 40 : 0));

    return { isTemplate, unmergedTokens, confidence };
}

// LANGUAGE DETECTION (function 15)
export function detectLanguage(content: string): { primary: string; isEnglish: boolean; confidence: number } {
    const lowerContent = content.toLowerCase();
    const languagePatterns = {
        english: ['the', 'and', 'you', 'that', 'this', 'have', 'with', 'for'],
        spanish: ['el', 'la', 'de', 'que', 'y', 'es', 'en', 'los', 'por'],
        french: ['le', 'de', 'et', 'la', 'les', 'des', 'un', 'pour', 'dans'],
        german: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit'],
        portuguese: ['o', 'de', 'e', 'a', 'que', 'do', 'da', 'em', 'para']
    };

    const scores: { [key: string]: number } = {};
    Object.entries(languagePatterns).forEach(([lang, words]) => { scores[lang] = words.filter(word => { const regex = new RegExp(`\\b${word}\\b`, 'i'); return regex.test(lowerContent); }).length; });

    let primary = 'english', maxScore = scores.english || 0;
    Object.entries(scores).forEach(([lang, score]) => { if (score > maxScore) { maxScore = score; primary = lang; } });

    return { primary, isEnglish: primary === 'english', confidence: Math.min(100, maxScore * 10) };
}
