// Content Analysis Functions (Readability, Tone, CTA, Intent)
// Extracted from analyzers.ts

import { EmailIntent, ReadabilityAnalysis, ToneAnalysis, CTAAnalysis, IntentResult, EmailContext } from "../types";

// ENHANCED INTENT DETECTION (function 5)
export function enhancedIntentDetection(content: string): IntentResult {
    const lowerContent = content.toLowerCase();
    const intentScores: { [key in EmailIntent]?: number } = {};

    const patterns = {
        [EmailIntent.FOLLOW_UP]: ['following up', 'follow up', 'checking in', 'circle back', 'touching base', 'any update'],
        [EmailIntent.MEETING_REQUEST]: ['meeting', 'call', 'chat', 'discuss', 'schedule', 'available', 'calendar', 'zoom', 'coffee'],
        [EmailIntent.WARM_INTRODUCTION]: ['mutual', 'introduced', 'referred', 'mentioned you', 'recommended', 'suggested I reach'],
        [EmailIntent.RE_ENGAGEMENT]: ['been a while', 'long time', 'reconnect', 'catch up', 'haven\'t heard', 'miss'],
        [EmailIntent.BREAKUP]: ['last email', 'final', 'closing', 'moving on', 'last attempt', 'break up'],
        [EmailIntent.VALUE_DELIVERY]: ['resource', 'guide', 'case study', 'whitepaper', 'ebook', 'report', 'research'],
        [EmailIntent.REFERRAL_REQUEST]: ['referral', 'refer', 'know anyone', 'introduce me', 'connection'],
        [EmailIntent.TESTIMONIAL_ASK]: ['testimonial', 'review', 'feedback', 'experience', 'thoughts on'],
        [EmailIntent.THANK_YOU]: ['thank you', 'thanks', 'appreciate', 'grateful', 'gratitude'],
        [EmailIntent.APOLOGY]: ['sorry', 'apologize', 'apologies', 'regret', 'mistake'],
        [EmailIntent.ANNOUNCEMENT]: ['announce', 'excited to share', 'launching', 'released', 'new feature'],
        [EmailIntent.SURVEY_REQUEST]: ['survey', 'questionnaire', 'poll', 'feedback form', 'quick questions'],
        [EmailIntent.COLD_OUTREACH]: ['noticed', 'saw that', 'came across', 'quick question', 'reaching out']
    };

    Object.entries(patterns).forEach(([intent, keywords]) => {
        let score = 0;
        keywords.forEach(keyword => { if (lowerContent.includes(keyword)) score += 10; });
        if (score > 0) intentScores[intent as EmailIntent] = score;
    });

    let primary = EmailIntent.COLD_OUTREACH;
    let maxScore = 0;
    Object.entries(intentScores).forEach(([intent, score]) => { if (score > maxScore) { maxScore = score; primary = intent as EmailIntent; } });

    const secondary: EmailIntent[] = [];
    Object.entries(intentScores).forEach(([intent, score]) => { if (intent !== primary && score >= maxScore * 0.2) secondary.push(intent as EmailIntent); });

    return { primary, secondary, confidence: Math.min(100, maxScore * 2) };
}

// TONE ANALYSIS (function 9)
export function analyzeTone(content: string): ToneAnalysis {
    const lowerContent = content.toLowerCase();

    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'excited', 'happy', 'love', 'thank', 'appreciate'];
    const negativeWords = ['bad', 'terrible', 'awful', 'disappointing', 'frustrated', 'angry', 'hate', 'sorry', 'apologize'];
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

    let sentiment: 'positive' | 'neutral' | 'negative';
    if (positiveCount > negativeCount) sentiment = 'positive'; else if (negativeCount > positiveCount) sentiment = 'negative'; else sentiment = 'neutral';

    const casualWords = ['hey', 'yeah', 'cool', 'awesome', 'gonna', 'wanna', 'kinda'];
    const formalWords = ['regarding', 'furthermore', 'therefore', 'sincerely', 'respectfully', 'accordingly'];
    const casualCount = casualWords.filter(word => lowerContent.includes(word)).length;
    const formalCount = formalWords.filter(word => lowerContent.includes(word)).length;

    let formality: 'casual' | 'neutral' | 'formal';
    if (formalCount > casualCount) formality = 'formal'; else if (casualCount > formalCount) formality = 'casual'; else formality = 'neutral';

    const urgencyWords = ['urgent', 'asap', 'immediately', 'deadline', 'expires', 'limited time', 'now', 'today'];
    const urgencyCount = urgencyWords.filter(word => lowerContent.includes(word)).length;
    let urgency: 'low' | 'medium' | 'high' = urgencyCount >= 3 ? 'high' : urgencyCount >= 1 ? 'medium' : 'low';

    return { sentiment, formality, urgency, confidence: Math.min(100, (positiveCount + negativeCount + casualCount + formalCount + urgencyCount) * 10) };
}

// READABILITY ANALYSIS (function 10)
export function analyzeReadability(content: string): ReadabilityAnalysis {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentenceCount = sentences.length || 1;
    const wordCount = words.length;
    const avgWordsPerSentence = wordCount / sentenceCount;

    function countSyllables(word: string): number { word = word.toLowerCase(); if (word.length <= 3) return 1; const vowels = word.match(/[aeiouy]{1,2}/g); return vowels ? vowels.length : 1; }
    const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
    const avgSyllablesPerWord = totalSyllables / (wordCount || 1);
    const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    let assessment: string;
    if (score >= 80) assessment = 'Very easy to read'; else if (score >= 60) assessment = 'Easy to read'; else if (score >= 40) assessment = 'Moderate difficulty'; else if (score >= 20) assessment = 'Difficult to read'; else assessment = 'Very difficult to read';

    return { gradeLevel: Math.max(0, gradeLevel), avgWordsPerSentence, avgSyllablesPerWord, score: Math.max(0, Math.min(100, score)), assessment };
}

// CTA ANALYSIS (function 11)
export function analyzeCTA(content: string): CTAAnalysis {
    const lowerContent = content.toLowerCase();
    const questionCount = (content.match(/\?/g) || []).length;

    const weakCTAs = ['would you', 'could you', 'maybe', 'perhaps', 'if you want'];
    const moderateCTAs = ['can you', 'let me know', 'are you interested', 'worth a chat'];
    const strongCTAs = ['schedule', 'book', 'register', 'download', 'click here', 'call now', 'reply with'];

    const weakCount = weakCTAs.filter(cta => lowerContent.includes(cta)).length;
    const moderateCount = moderateCTAs.filter(cta => lowerContent.includes(cta)).length;
    const strongCount = strongCTAs.filter(cta => lowerContent.includes(cta)).length;

    let ctaStrength: 'weak' | 'moderate' | 'strong' = strongCount > 0 ? 'strong' : moderateCount > 0 ? 'moderate' : 'weak';
    const ctaCount = questionCount + weakCount + moderateCount + strongCount;
    const hasCTA = ctaCount > 0;
    const ctaClarity = hasCTA ? Math.min(100, ctaCount * 20 + (strongCount * 20)) : 0;

    return { hasCTA, ctaCount, ctaStrength, ctaClarity };
}

// EMAIL CONTEXT DETECTION (function 13)
export function detectEmailContext(content: string): EmailContext {
    const lowerContent = content.toLowerCase();
    const replyPatterns = [/^on .* wrote:/im, /^>+/m, /^from:.*\nsent:/im, /in reply to/i];
    const isReply = replyPatterns.some(pattern => pattern.test(content));

    const forwardPatterns = [/^-+\s*forwarded message\s*-+/im, /^fwd:/im, /^begin forwarded message/im];
    const isForward = forwardPatterns.some(pattern => pattern.test(content));

    const hasQuotedText = /^>+/m.test(content);
    let sequencePosition = 1;
    if (lowerContent.includes('following up')) sequencePosition = 2;
    if (lowerContent.includes('second follow-up') || lowerContent.includes('third email')) sequencePosition = 3;
    if (lowerContent.includes('last email') || lowerContent.includes('final')) sequencePosition = 4;

    return { isReply, isForward, sequencePosition, hasQuotedText };
}
