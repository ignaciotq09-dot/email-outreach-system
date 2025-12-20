import { EmailIntent, ValidationResult, SpamAnalysis, ReadabilityAnalysis, ToneAnalysis, StructureAnalysis, CTAAnalysis, IntentResult, ComplianceResult, EmailContext, ComprehensiveAnalysis } from "./types";

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

export function calculatePersonalizationScore(content: string, recipientData?: any): number {
  let score = 40;
  if (!recipientData) return score;
  if (recipientData.company && content.includes(recipientData.company)) score += 20;
  if (recipientData.industry) score += 10;
  if (recipientData.previousEngagement) score += 15;
  if (content.includes('noticed') || content.includes('saw')) score += 15;
  return Math.min(100, Math.max(0, score));
}

// ===== NEW COMPREHENSIVE ANALYZER FUNCTIONS =====

// 1. INPUT VALIDATION & SANITIZATION
export function sanitizeEmailInput(content: string | null | undefined): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Handle null/undefined
  if (content === null || content === undefined) {
    return {
      isValid: false,
      sanitizedContent: '',
      warnings: [],
      errors: ['Content is null or undefined']
    };
  }

  // Handle empty strings
  if (content.trim() === '') {
    return {
      isValid: false,
      sanitizedContent: '',
      warnings: [],
      errors: ['Content is empty']
    };
  }

  let sanitized = content;

  // Check length (cap at 50,000 characters)
  const MAX_LENGTH = 50000;
  if (sanitized.length > MAX_LENGTH) {
    warnings.push(`Content exceeds ${MAX_LENGTH} characters, truncated from ${sanitized.length}`);
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Normalize whitespace (preserve single newlines, collapse multiple)
  const originalLength = sanitized.length;
  sanitized = sanitized.replace(/[ \t]+/g, ' ');  // Collapse spaces/tabs
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');  // Max 2 consecutive newlines

  if (sanitized.length < originalLength * 0.5) {
    warnings.push('Excessive whitespace removed');
  }

  // Strip dangerous patterns (script tags, etc.)
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi  // onclick, onerror, etc.
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(sanitized)) {
      warnings.push('Potentially dangerous content removed');
      sanitized = sanitized.replace(pattern, '');
    }
  });

  return {
    isValid: errors.length === 0,
    sanitizedContent: sanitized.trim(),
    warnings,
    errors
  };
}

// 2. SPAM DETECTION
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

  // Check for spam words
  spamWords.forEach(word => {
    if (lowerContent.includes(word)) {
      triggers.push(word);
      score += 5;
    }
  });

  // Check for excessive caps (>30% uppercase)
  const uppercaseCount = (content.match(/[A-Z]/g) || []).length;
  const letterCount = (content.match(/[A-Za-z]/g) || []).length;
  if (letterCount > 0 && uppercaseCount / letterCount > 0.3) {
    triggers.push('Excessive capitalization');
    score += 15;
  }

  // Check for excessive punctuation
  if (/!{3,}/.test(content) || /\?{3,}/.test(content)) {
    triggers.push('Excessive punctuation (!!!, ???)');
    score += 10;
  }

  // Check for multiple dollar signs
  if ((content.match(/\$/g) || []).length >= 3) {
    triggers.push('Multiple dollar signs');
    score += 8;
  }

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical';
  if (score >= 50) severity = 'critical';
  else if (score >= 30) severity = 'high';
  else if (score >= 15) severity = 'medium';
  else severity = 'low';

  return {
    score: Math.min(100, score),
    triggers,
    severity
  };
}

// 3. SUSPICIOUS CONTENT DETECTION
export function detectSuspiciousContent(content: string): { isPhishing: boolean; isProfane: boolean; issues: string[] } {
  const issues: string[] = [];
  let isPhishing = false;
  let isProfane = false;

  const phishingPatterns = [
    /verify.*account/i,
    /confirm.*password/i,
    /update.*payment/i,
    /suspended.*account/i,
    /unusual.*activity/i,
    /click.*immediately/i,
    /secure.*account/i,
    /verify.*identity/i,
    /update.*billing/i,
    /expire.*\d+.*hour/i
  ];

  phishingPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      isPhishing = true;
      issues.push('Potential phishing pattern detected');
    }
  });

  // Check for suspicious URLs (IP addresses, bit.ly, etc.)
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlRegex) || [];
  urls.forEach(url => {
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
      issues.push('Suspicious URL: IP address');
      isPhishing = true;
    }
    if (/bit\.ly|tinyurl|goo\.gl/i.test(url)) {
      issues.push('Shortened URL detected');
    }
  });

  // Basic profanity detection
  const profanityWords = ['damn', 'hell', 'crap', 'suck']; // Basic list for demonstration
  const lowerContent = content.toLowerCase();
  profanityWords.forEach(word => {
    if (lowerContent.includes(word)) {
      isProfane = true;
      issues.push('Potentially inappropriate language');
    }
  });

  return { isPhishing, isProfane, issues };
}

// 4. COMPLIANCE DETECTION
export function detectComplianceIssues(subject: string, body: string): ComplianceResult {
  const issues: Array<{ type: string; description: string; severity: string }> = [];

  // CAN-SPAM: Check for unsubscribe
  const hasUnsubscribe = /unsubscribe|opt-out|opt out/i.test(body);
  if (!hasUnsubscribe) {
    issues.push({
      type: 'CAN-SPAM',
      description: 'Missing unsubscribe/opt-out option',
      severity: 'high'
    });
  }

  // Check for physical address
  const hasAddress = /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd)/i.test(body);
  if (!hasAddress) {
    issues.push({
      type: 'CAN-SPAM',
      description: 'Missing physical mailing address',
      severity: 'medium'
    });
  }

  // Check for misleading subject
  if (subject.toLowerCase().includes('re:') && !body.toLowerCase().includes('reply')) {
    issues.push({
      type: 'Misleading',
      description: 'Subject contains "Re:" but not a reply',
      severity: 'medium'
    });
  }

  return {
    isCompliant: issues.length === 0,
    issues
  };
}

// 5. ENHANCED INTENT DETECTION
export function enhancedIntentDetection(content: string): IntentResult {
  const lowerContent = content.toLowerCase();
  const intentScores: { [key in EmailIntent]?: number } = {};

  // Scoring patterns for each intent
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

  // Score each intent
  Object.entries(patterns).forEach(([intent, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        score += 10;
      }
    });
    if (score > 0) {
      intentScores[intent as EmailIntent] = score;
    }
  });

  // Get primary intent (highest score)
  let primary = EmailIntent.COLD_OUTREACH;
  let maxScore = 0;
  Object.entries(intentScores).forEach(([intent, score]) => {
    if (score > maxScore) {
      maxScore = score;
      primary = intent as EmailIntent;
    }
  });

  // Get secondary intents (scores > 20% of max)
  const secondary: EmailIntent[] = [];
  Object.entries(intentScores).forEach(([intent, score]) => {
    if (intent !== primary && score >= maxScore * 0.2) {
      secondary.push(intent as EmailIntent);
    }
  });

  // Calculate confidence (0-100)
  const confidence = Math.min(100, maxScore * 2);

  return { primary, secondary, confidence };
}

// 6. GREETING ANALYSIS
export function analyzeGreeting(content: string): { hasGreeting: boolean; type: string; text: string } {
  const lines = content.split('\n');
  const firstLine = lines[0]?.trim().toLowerCase() || '';
  const firstTwoLines = lines.slice(0, 2).join(' ').toLowerCase();

  const professionalGreetings = ['dear', 'hello', 'good morning', 'good afternoon', 'greetings'];
  const casualGreetings = ['hi', 'hey', 'yo', 'sup', 'hiya'];

  let hasGreeting = false;
  let type = 'none';
  let text = '';

  professionalGreetings.forEach(greeting => {
    if (firstTwoLines.includes(greeting)) {
      hasGreeting = true;
      type = 'professional';
      text = lines[0] || '';
    }
  });

  casualGreetings.forEach(greeting => {
    if (firstLine.startsWith(greeting)) {
      hasGreeting = true;
      type = 'casual';
      text = lines[0] || '';
    }
  });

  return { hasGreeting, type, text };
}

// 7. SIGNATURE ANALYSIS
export function analyzeSignature(content: string): { hasSignature: boolean; hasContactInfo: boolean; elements: string[] } {
  const lines = content.split('\n');
  const lastFiveLines = lines.slice(-5).join('\n').toLowerCase();

  const elements: string[] = [];
  let hasContactInfo = false;

  // Check for common signature patterns
  const signaturePatterns = [
    /best regards/i,
    /sincerely/i,
    /thanks/i,
    /cheers/i,
    /warm regards/i,
    /kind regards/i
  ];

  const hasSignature = signaturePatterns.some(pattern => pattern.test(lastFiveLines));

  // Check for contact info
  if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(lastFiveLines)) {
    elements.push('phone');
    hasContactInfo = true;
  }

  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(lastFiveLines)) {
    elements.push('email');
    hasContactInfo = true;
  }

  if (/https?:\/\//.test(lastFiveLines)) {
    elements.push('website');
    hasContactInfo = true;
  }

  if (/linkedin|twitter|facebook/i.test(lastFiveLines)) {
    elements.push('social');
    hasContactInfo = true;
  }

  return { hasSignature, hasContactInfo, elements };
}

// 8. LINK ANALYSIS
export function analyzeLinks(content: string): { count: number; urls: string[]; suspicious: string[] } {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlRegex) || [];
  const suspicious: string[] = [];

  urls.forEach(url => {
    // Check for IP addresses
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
      suspicious.push(url);
    }
    // Check for URL shorteners
    if (/bit\.ly|tinyurl|goo\.gl|t\.co/i.test(url)) {
      suspicious.push(url);
    }
  });

  return {
    count: urls.length,
    urls,
    suspicious
  };
}

// 9. TONE ANALYSIS
export function analyzeTone(content: string): ToneAnalysis {
  const lowerContent = content.toLowerCase();

  // Sentiment analysis
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'excited', 'happy', 'love', 'thank', 'appreciate'];
  const negativeWords = ['bad', 'terrible', 'awful', 'disappointing', 'frustrated', 'angry', 'hate', 'sorry', 'apologize'];

  const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

  let sentiment: 'positive' | 'neutral' | 'negative';
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';
  else sentiment = 'neutral';

  // Formality analysis
  const casualWords = ['hey', 'yeah', 'cool', 'awesome', 'gonna', 'wanna', 'kinda'];
  const formalWords = ['regarding', 'furthermore', 'therefore', 'sincerely', 'respectfully', 'accordingly'];

  const casualCount = casualWords.filter(word => lowerContent.includes(word)).length;
  const formalCount = formalWords.filter(word => lowerContent.includes(word)).length;

  let formality: 'casual' | 'neutral' | 'formal';
  if (formalCount > casualCount) formality = 'formal';
  else if (casualCount > formalCount) formality = 'casual';
  else formality = 'neutral';

  // Urgency analysis
  const urgencyWords = ['urgent', 'asap', 'immediately', 'deadline', 'expires', 'limited time', 'now', 'today'];
  const urgencyCount = urgencyWords.filter(word => lowerContent.includes(word)).length;

  let urgency: 'low' | 'medium' | 'high';
  if (urgencyCount >= 3) urgency = 'high';
  else if (urgencyCount >= 1) urgency = 'medium';
  else urgency = 'low';

  const confidence = Math.min(100, (positiveCount + negativeCount + casualCount + formalCount + urgencyCount) * 10);

  return { sentiment, formality, urgency, confidence };
}

// 10. READABILITY ANALYSIS
export function analyzeReadability(content: string): ReadabilityAnalysis {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);

  const sentenceCount = sentences.length || 1;
  const wordCount = words.length;
  const avgWordsPerSentence = wordCount / sentenceCount;

  // Simple syllable counter (rough approximation)
  function countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    const vowels = word.match(/[aeiouy]{1,2}/g);
    return vowels ? vowels.length : 1;
  }

  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const avgSyllablesPerWord = totalSyllables / (wordCount || 1);

  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  // Readability score (0-100, higher = easier)
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  let assessment: string;
  if (score >= 80) assessment = 'Very easy to read';
  else if (score >= 60) assessment = 'Easy to read';
  else if (score >= 40) assessment = 'Moderate difficulty';
  else if (score >= 20) assessment = 'Difficult to read';
  else assessment = 'Very difficult to read';

  return {
    gradeLevel: Math.max(0, gradeLevel),
    avgWordsPerSentence,
    avgSyllablesPerWord,
    score: Math.max(0, Math.min(100, score)),
    assessment
  };
}

// 11. CTA ANALYSIS
export function analyzeCTA(content: string): CTAAnalysis {
  const lowerContent = content.toLowerCase();

  // Check for questions (basic CTA)
  const questionCount = (content.match(/\?/g) || []).length;

  // Check for action verbs
  const weakCTAs = ['would you', 'could you', 'maybe', 'perhaps', 'if you want'];
  const moderateCTAs = ['can you', 'let me know', 'are you interested', 'worth a chat'];
  const strongCTAs = ['schedule', 'book', 'register', 'download', 'click here', 'call now', 'reply with'];

  const weakCount = weakCTAs.filter(cta => lowerContent.includes(cta)).length;
  const moderateCount = moderateCTAs.filter(cta => lowerContent.includes(cta)).length;
  const strongCount = strongCTAs.filter(cta => lowerContent.includes(cta)).length;

  let ctaStrength: 'weak' | 'moderate' | 'strong';
  if (strongCount > 0) ctaStrength = 'strong';
  else if (moderateCount > 0) ctaStrength = 'moderate';
  else ctaStrength = 'weak';

  const ctaCount = questionCount + weakCount + moderateCount + strongCount;
  const hasCTA = ctaCount > 0;

  // Clarity score (0-100)
  const ctaClarity = hasCTA ? Math.min(100, ctaCount * 20 + (strongCount * 20)) : 0;

  return { hasCTA, ctaCount, ctaStrength, ctaClarity };
}

// 12. SUBJECT LINE DEEP ANALYSIS
export function analyzeSubjectLineDeep(subject: string): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 50;

  // ALLCAPS detection
  if (subject === subject.toUpperCase() && subject.length > 3) {
    issues.push('Subject is ALL CAPS');
    suggestions.push('Use normal capitalization');
    score -= 20;
  }

  // Clickbait detection
  const clickbaitWords = ['you won\'t believe', 'shocking', 'amazing', 'secret', 'one weird trick'];
  clickbaitWords.forEach(word => {
    if (subject.toLowerCase().includes(word)) {
      issues.push('Clickbait language detected');
      suggestions.push('Use straightforward, honest language');
      score -= 15;
    }
  });

  // Excessive punctuation
  if (/!{2,}/.test(subject) || /\?{2,}/.test(subject)) {
    issues.push('Excessive punctuation');
    suggestions.push('Use single punctuation marks');
    score -= 10;
  }

  // Emoji detection (simplified check)
  const hasEmoji = /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(subject) ||
    subject.split('').some(char => char.charCodeAt(0) > 127 && char.charCodeAt(0) < 55296);
  if (hasEmoji) {
    issues.push('Contains emoji (may not display on all devices)');
  }

  // Length check
  if (subject.length > 60) {
    issues.push('Subject too long (may get truncated on mobile)');
    suggestions.push('Keep subject under 60 characters');
    score -= 10;
  } else if (subject.length < 20) {
    issues.push('Subject too short (may lack context)');
    suggestions.push('Add more context to subject');
    score -= 5;
  } else {
    score += 15;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions
  };
}

// 13. EMAIL CONTEXT DETECTION
export function detectEmailContext(content: string): EmailContext {
  const lowerContent = content.toLowerCase();

  // Reply detection
  const replyPatterns = [
    /^on .* wrote:/im,
    /^>+/m,
    /^from:.*\nsent:/im,
    /in reply to/i
  ];
  const isReply = replyPatterns.some(pattern => pattern.test(content));

  // Forward detection
  const forwardPatterns = [
    /^-+\s*forwarded message\s*-+/im,
    /^fwd:/im,
    /^begin forwarded message/im
  ];
  const isForward = forwardPatterns.some(pattern => pattern.test(content));

  // Quoted text detection
  const hasQuotedText = /^>+/m.test(content);

  // Sequence position
  let sequencePosition = 1;
  if (lowerContent.includes('following up')) sequencePosition = 2;
  if (lowerContent.includes('second follow-up') || lowerContent.includes('third email')) sequencePosition = 3;
  if (lowerContent.includes('last email') || lowerContent.includes('final')) sequencePosition = 4;

  return { isReply, isForward, sequencePosition, hasQuotedText };
}

// 14. TEMPLATE DETECTION
export function detectTemplateUsage(content: string): { isTemplate: boolean; unmergedTokens: string[]; confidence: number } {
  const unmergedTokens: string[] = [];

  // Find unmerged tokens
  const tokenPatterns = [
    /\{\{[^}]+\}\}/g,  // {{variable}}
    /\{[A-Z_]+\}/g,    // {FIRST_NAME}
    /\[[A-Z_\s]+\]/g,  // [COMPANY NAME]
    /%[A-Z_]+%/g       // %VARIABLE%
  ];

  tokenPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    unmergedTokens.push(...matches);
  });

  // Generic phrases that indicate templates
  const genericPhrases = [
    'dear sir/madam',
    'to whom it may concern',
    'valued customer',
    'this is a mass email'
  ];

  const hasGenericPhrases = genericPhrases.some(phrase =>
    content.toLowerCase().includes(phrase)
  );

  const isTemplate = unmergedTokens.length > 0 || hasGenericPhrases;
  const confidence = Math.min(100, (unmergedTokens.length * 30) + (hasGenericPhrases ? 40 : 0));

  return { isTemplate, unmergedTokens, confidence };
}

// 15. LANGUAGE DETECTION
export function detectLanguage(content: string): { primary: string; isEnglish: boolean; confidence: number } {
  const lowerContent = content.toLowerCase();

  // Common words in various languages
  const languagePatterns = {
    english: ['the', 'and', 'you', 'that', 'this', 'have', 'with', 'for'],
    spanish: ['el', 'la', 'de', 'que', 'y', 'es', 'en', 'los', 'por'],
    french: ['le', 'de', 'et', 'la', 'les', 'des', 'un', 'pour', 'dans'],
    german: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit'],
    portuguese: ['o', 'de', 'e', 'a', 'que', 'do', 'da', 'em', 'para']
  };

  const scores: { [key: string]: number } = {};

  Object.entries(languagePatterns).forEach(([lang, words]) => {
    scores[lang] = words.filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerContent);
    }).length;
  });

  // Find language with highest score
  let primary = 'english';
  let maxScore = scores.english || 0;

  Object.entries(scores).forEach(([lang, score]) => {
    if (score > maxScore) {
      maxScore = score;
      primary = lang;
    }
  });

  const isEnglish = primary === 'english';
  const confidence = Math.min(100, maxScore * 10);

  return { primary, isEnglish, confidence };
}

// MASTER COMPREHENSIVE ANALYSIS FUNCTION
export function performComprehensiveAnalysis(subject: string, body: string): ComprehensiveAnalysis {
  // Validate and sanitize inputs
  const subjectValidation = sanitizeEmailInput(subject);
  const bodyValidation = sanitizeEmailInput(body);

  if (!subjectValidation.isValid || !bodyValidation.isValid) {
    // Return minimal analysis if validation fails
    return {
      validation: bodyValidation.isValid ? subjectValidation : bodyValidation,
      spam: { score: 0, triggers: [], severity: 'low' },
      readability: { gradeLevel: 0, avgWordsPerSentence: 0, avgSyllablesPerWord: 0, score: 0, assessment: 'N/A' },
      tone: { sentiment: 'neutral', formality: 'neutral', urgency: 'low', confidence: 0 },
      structure: { hasGreeting: false, greetingType: 'none', hasSignature: false, paragraphCount: 0, linkCount: 0, suspiciousLinks: [] },
      cta: { hasCTA: false, ctaCount: 0, ctaStrength: 'weak', ctaClarity: 0 },
      intent: { primary: EmailIntent.COLD_OUTREACH, secondary: [], confidence: 0 },
      compliance: { isCompliant: false, issues: [] },
      context: { isReply: false, isForward: false, sequencePosition: 1, hasQuotedText: false },
      overallScore: 0
    };
  }

  const sanitizedSubject = subjectValidation.sanitizedContent;
  const sanitizedBody = bodyValidation.sanitizedContent;

  // Run all analyses
  const spam = detectSpamTriggers(sanitizedSubject + ' ' + sanitizedBody);
  const readability = analyzeReadability(sanitizedBody);
  const tone = analyzeTone(sanitizedBody);

  const greeting = analyzeGreeting(sanitizedBody);
  const signature = analyzeSignature(sanitizedBody);
  const links = analyzeLinks(sanitizedBody);

  const structure: StructureAnalysis = {
    hasGreeting: greeting.hasGreeting,
    greetingType: greeting.type as 'professional' | 'casual' | 'none',
    hasSignature: signature.hasSignature,
    paragraphCount: sanitizedBody.split('\n\n').length,
    linkCount: links.count,
    suspiciousLinks: links.suspicious
  };

  const cta = analyzeCTA(sanitizedBody);
  const intent = enhancedIntentDetection(sanitizedBody);
  const compliance = detectComplianceIssues(sanitizedSubject, sanitizedBody);
  const context = detectEmailContext(sanitizedBody);

  // Calculate overall score (0-100)
  let overallScore = 50;

  // Positive factors
  if (spam.score < 15) overallScore += 15;
  if (readability.score >= 60) overallScore += 10;
  if (tone.sentiment === 'positive') overallScore += 5;
  if (structure.hasGreeting) overallScore += 5;
  if (structure.hasSignature) overallScore += 5;
  if (cta.hasCTA && cta.ctaStrength !== 'weak') overallScore += 10;
  if (intent.confidence >= 50) overallScore += 5;
  if (compliance.isCompliant) overallScore += 10;

  // Negative factors
  if (spam.score >= 30) overallScore -= 20;
  if (structure.suspiciousLinks.length > 0) overallScore -= 15;
  if (readability.score < 40) overallScore -= 10;
  if (!cta.hasCTA) overallScore -= 5;

  overallScore = Math.max(0, Math.min(100, overallScore));

  return {
    validation: bodyValidation,
    spam,
    readability,
    tone,
    structure,
    cta,
    intent,
    compliance,
    context,
    overallScore
  };
}

