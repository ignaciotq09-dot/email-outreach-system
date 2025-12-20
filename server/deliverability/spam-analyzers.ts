/**
 * Spam Content Analyzers
 * Individual analyzer functions for different spam indicators
 */

import { SPAM_KEYWORDS, SUSPICIOUS_DOMAINS } from './spam-keywords';
import type { SpamIssue } from './types';

export function checkSpamKeywords(text: string, subject: string): SpamIssue[] {
  const issues: SpamIssue[] = [];
  
  // Check high-severity keywords
  SPAM_KEYWORDS.high.forEach(keyword => {
    if (text.includes(keyword)) {
      issues.push({
        category: 'keywords',
        severity: 'high',
        message: `Contains high-risk spam phrase: "${keyword}"`,
        points: 15
      });
    }
  });
  
  // Check medium-severity keywords
  SPAM_KEYWORDS.medium.forEach(keyword => {
    if (text.includes(keyword)) {
      issues.push({
        category: 'keywords',
        severity: 'medium',
        message: `Contains moderate spam phrase: "${keyword}"`,
        points: 8
      });
    }
  });
  
  // Check low-severity keywords (only count if 2+ found)
  const lowKeywordsFound = SPAM_KEYWORDS.low.filter(kw => text.includes(kw));
  if (lowKeywordsFound.length >= 2) {
    issues.push({
      category: 'keywords',
      severity: 'low',
      message: `Contains multiple marketing phrases: ${lowKeywordsFound.slice(0, 3).join(', ')}`,
      points: 5
    });
  }
  
  return issues;
}

export function checkCapsUsage(subject: string, body: string): SpamIssue | null {
  const countCaps = (str: string) => (str.match(/[A-Z]/g) || []).length;
  const countLetters = (str: string) => (str.match(/[a-zA-Z]/g) || []).length;
  
  const subjectCapsRatio = countCaps(subject) / Math.max(countLetters(subject), 1);
  const bodyCapsRatio = countCaps(body) / Math.max(countLetters(body), 1);
  
  if (subjectCapsRatio > 0.5) {
    return {
      category: 'formatting',
      severity: 'high',
      message: 'Subject line has excessive capitalization',
      points: 20
    };
  }
  
  if (bodyCapsRatio > 0.3) {
    return {
      category: 'formatting',
      severity: 'medium',
      message: 'Email body has excessive capitalization',
      points: 12
    };
  }
  
  return null;
}

export function checkLinkRatio(linkCount: number, wordCount: number, body: string): SpamIssue | null {
  if (linkCount === 0) return null;
  
  const ratio = linkCount / Math.max(wordCount, 1);
  
  if (linkCount > 5) {
    return {
      category: 'links',
      severity: 'high',
      message: `Too many links (${linkCount}). Limit to 2-3 per email`,
      points: 15
    };
  }
  
  if (ratio > 0.1) {
    return {
      category: 'links',
      severity: 'medium',
      message: `High link-to-text ratio (${linkCount} links in ${wordCount} words)`,
      points: 10
    };
  }
  
  return null;
}

export function checkUrlShorteners(body: string): SpamIssue | null {
  const foundShorteners = SUSPICIOUS_DOMAINS.filter(domain => 
    body.toLowerCase().includes(domain)
  );
  
  if (foundShorteners.length > 0) {
    return {
      category: 'links',
      severity: 'high',
      message: `Contains URL shorteners (${foundShorteners.join(', ')}). Use full URLs instead`,
      points: 18
    };
  }
  
  return null;
}

export function checkSubjectLine(subject: string): SpamIssue[] {
  const issues: SpamIssue[] = [];
  
  if (subject.length === 0) {
    issues.push({
      category: 'structure',
      severity: 'high',
      message: 'Missing subject line',
      points: 25
    });
  } else if (subject.length > 60) {
    issues.push({
      category: 'structure',
      severity: 'low',
      message: 'Subject line is too long (keep under 60 characters)',
      points: 5
    });
  }
  
  // Check for excessive punctuation in subject
  const exclamationCount = (subject.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    issues.push({
      category: 'formatting',
      severity: 'medium',
      message: 'Subject has multiple exclamation marks',
      points: 10
    });
  }
  
  return issues;
}

export function checkPunctuation(text: string): SpamIssue | null {
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  
  if (exclamations > 3 || questions > 3) {
    return {
      category: 'formatting',
      severity: 'medium',
      message: 'Excessive punctuation (!!!, ???)',
      points: 8
    };
  }
  
  return null;
}

export function checkEmailStructure(body: string, wordCount: number): SpamIssue | null {
  if (wordCount < 10) {
    return {
      category: 'structure',
      severity: 'medium',
      message: 'Email is too short (appears low-effort)',
      points: 10
    };
  }
  
  if (wordCount > 500) {
    return {
      category: 'structure',
      severity: 'low',
      message: 'Email is very long (may overwhelm recipient)',
      points: 3
    };
  }
  
  return null;
}

export function checkHtmlQuality(body: string): SpamIssue[] {
  const issues: SpamIssue[] = [];
  
  // Check for unclosed tags (basic check)
  const openTags = (body.match(/<[^/][^>]*>/g) || []).length;
  const closeTags = (body.match(/<\/[^>]*>/g) || []).length;
  
  if (Math.abs(openTags - closeTags) > 2) {
    issues.push({
      category: 'formatting',
      severity: 'medium',
      message: 'HTML may have unclosed tags',
      points: 8
    });
  }
  
  return issues;
}

export function countLinks(text: string): number {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  return (text.match(urlPattern) || []).length;
}
