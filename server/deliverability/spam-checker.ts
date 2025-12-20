/**
 * Email Spam Score Checker
 * Main orchestrator for spam content analysis
 */

import type { SpamCheckResult, SpamIssue } from './types';
import {
  checkSpamKeywords,
  checkCapsUsage,
  checkLinkRatio,
  checkUrlShorteners,
  checkSubjectLine,
  checkPunctuation,
  checkEmailStructure,
  checkHtmlQuality,
  countLinks
} from './spam-analyzers';

/**
 * Check email content for spam indicators
 */
export function checkSpamScore(params: {
  subject: string;
  body: string;
  hasAttachments?: boolean;
  linkCount?: number;
}): SpamCheckResult {
  const { subject, body, hasAttachments = false, linkCount } = params;
  
  let score = 0;
  const issues: SpamIssue[] = [];
  const recommendations: string[] = [];
  
  const combinedText = `${subject} ${body}`.toLowerCase();
  const wordCount = body.trim().split(/\s+/).length;
  
  // 1. Check for spam keywords
  const keywordIssues = checkSpamKeywords(combinedText, subject.toLowerCase());
  issues.push(...keywordIssues);
  score += keywordIssues.reduce((sum, issue) => sum + issue.points, 0);
  
  // 2. Check CAPS usage
  const capsIssue = checkCapsUsage(subject, body);
  if (capsIssue) {
    issues.push(capsIssue);
    score += capsIssue.points;
  }
  
  // 3. Check link ratio
  const detectedLinkCount = linkCount ?? countLinks(body);
  const linkIssue = checkLinkRatio(detectedLinkCount, wordCount, body);
  if (linkIssue) {
    issues.push(linkIssue);
    score += linkIssue.points;
  }
  
  // 4. Check for URL shorteners
  const shortenerIssue = checkUrlShorteners(body);
  if (shortenerIssue) {
    issues.push(shortenerIssue);
    score += shortenerIssue.points;
  }
  
  // 5. Check subject line
  const subjectIssues = checkSubjectLine(subject);
  issues.push(...subjectIssues);
  score += subjectIssues.reduce((sum, issue) => sum + issue.points, 0);
  
  // 6. Check for excessive punctuation
  const punctuationIssue = checkPunctuation(combinedText);
  if (punctuationIssue) {
    issues.push(punctuationIssue);
    score += punctuationIssue.points;
  }
  
  // 7. Check email structure
  const structureIssue = checkEmailStructure(body, wordCount);
  if (structureIssue) {
    issues.push(structureIssue);
    score += structureIssue.points;
  }
  
  // 8. Check for HTML issues (basic)
  const htmlIssues = checkHtmlQuality(body);
  issues.push(...htmlIssues);
  score += htmlIssues.reduce((sum, issue) => sum + issue.points, 0);
  
  // Generate recommendations
  if (score > 0) {
    recommendations.push(...generateRecommendations(issues));
  }
  
  // Determine risk level
  const risk = getRiskLevel(score);
  
  return {
    score: Math.min(100, score),
    risk,
    issues,
    recommendations
  };
}

function generateRecommendations(issues: SpamIssue[]): string[] {
  const recommendations: string[] = [];
  const categories = new Set(issues.map(i => i.category));
  
  if (categories.has('keywords')) {
    recommendations.push('Remove marketing/sales language. Use natural, conversational tone');
  }
  
  if (categories.has('links')) {
    recommendations.push('Reduce number of links. Include only 1-2 essential URLs');
  }
  
  if (categories.has('formatting')) {
    recommendations.push('Use normal capitalization and minimal punctuation');
  }
  
  if (categories.has('structure')) {
    recommendations.push('Ensure email has clear subject and appropriate length');
  }
  
  return recommendations;
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score === 0) return 'low';
  if (score <= 20) return 'medium';
  if (score <= 40) return 'high';
  return 'critical';
}
