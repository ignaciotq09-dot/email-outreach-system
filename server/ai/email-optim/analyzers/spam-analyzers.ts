// Spam and Security Analysis Functions
// Extracted from analyzers.ts

import { SpamAnalysis, ComplianceResult } from "./types";

// SPAM DETECTION (function 2)
export function detectSpamTriggers(content: string): SpamAnalysis {
    const triggers: string[] = [];
    let score = 0;

    const spamWords = [
        'free', 'urgent', 'act now', 'limited time', 'click here', 'buy now',
        'order now', 'prize', 'winner', 'congratulations', 'cash', 'bonus',
        'earn money', 'extra income', 'guarantee', 'no cost', 'no fees',
        'risk free', 'satisfaction guaranteed', 'as seen on', 'call now',
        'don\'t delete', 'don\'t hesitate', 'for instant access', 'get it now',
        'get paid', 'get started now', 'great offer', 'increase sales',
        'incredible deal', 'limited offer', 'make money', 'million dollars',
        'money back', 'once in lifetime', 'one time', 'opportunity',
        'order today', 'please read', 'special promotion', 'this isn\'t spam',
        'urgent response', 'what are you waiting', 'while supplies last',
        'you have been selected', 'act immediately', 'apply now', 'become a member',
        'cards accepted', 'claim your', 'double your income', 'financial freedom'
    ];

    const lowerContent = content.toLowerCase();

    spamWords.forEach(word => {
        if (lowerContent.includes(word)) { triggers.push(word); score += 5; }
    });

    const uppercaseCount = (content.match(/[A-Z]/g) || []).length;
    const letterCount = (content.match(/[A-Za-z]/g) || []).length;
    if (letterCount > 0 && uppercaseCount / letterCount > 0.3) { triggers.push('Excessive capitalization'); score += 15; }
    if (/!{3,}/.test(content) || /\?{3,}/.test(content)) { triggers.push('Excessive punctuation (!!!, ???)'); score += 10; }
    if ((content.match(/\$/g) || []).length >= 3) { triggers.push('Multiple dollar signs'); score += 8; }

    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 50) severity = 'critical'; else if (score >= 30) severity = 'high'; else if (score >= 15) severity = 'medium'; else severity = 'low';

    return { score: Math.min(100, score), triggers, severity };
}

// SUSPICIOUS CONTENT DETECTION (function 3)
export function detectSuspiciousContent(content: string): { isPhishing: boolean; isProfane: boolean; issues: string[] } {
    const issues: string[] = [];
    let isPhishing = false;
    let isProfane = false;

    const phishingPatterns = [/verify.*account/i, /confirm.*password/i, /update.*payment/i, /suspended.*account/i, /unusual.*activity/i, /click.*immediately/i, /secure.*account/i, /verify.*identity/i, /update.*billing/i, /expire.*\d+.*hour/i];
    phishingPatterns.forEach(pattern => { if (pattern.test(content)) { isPhishing = true; issues.push('Potential phishing pattern detected'); } });

    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex) || [];
    urls.forEach(url => {
        if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) { issues.push('Suspicious URL: IP address'); isPhishing = true; }
        if (/bit\.ly|tinyurl|goo\.gl/i.test(url)) { issues.push('Shortened URL detected'); }
    });

    const profanityWords = ['damn', 'hell', 'crap', 'suck'];
    const lowerContent = content.toLowerCase();
    profanityWords.forEach(word => { if (lowerContent.includes(word)) { isProfane = true; issues.push('Potentially inappropriate language'); } });

    return { isPhishing, isProfane, issues };
}

// COMPLIANCE DETECTION (function 4)
export function detectComplianceIssues(subject: string, body: string): ComplianceResult {
    const issues: Array<{ type: string; description: string; severity: string }> = [];

    const hasUnsubscribe = /unsubscribe|opt-out|opt out/i.test(body);
    if (!hasUnsubscribe) issues.push({ type: 'CAN-SPAM', description: 'Missing unsubscribe/opt-out option', severity: 'high' });

    const hasAddress = /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd)/i.test(body);
    if (!hasAddress) issues.push({ type: 'CAN-SPAM', description: 'Missing physical mailing address', severity: 'medium' });

    if (subject.toLowerCase().includes('re:') && !body.toLowerCase().includes('reply')) {
        issues.push({ type: 'Misleading', description: 'Subject contains "Re:" but not a reply', severity: 'medium' });
    }

    return { isCompliant: issues.length === 0, issues };
}

// LINK ANALYSIS (function 8)
export function analyzeLinks(content: string): { count: number; urls: string[]; suspicious: string[] } {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex) || [];
    const suspicious: string[] = [];

    urls.forEach(url => {
        if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) suspicious.push(url);
        if (/bit\.ly|tinyurl|goo\.gl|t\.co/i.test(url)) suspicious.push(url);
    });

    return { count: urls.length, urls, suspicious };
}
