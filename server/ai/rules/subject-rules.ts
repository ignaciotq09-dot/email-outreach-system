// Subject line optimization rules based on research data
export interface SubjectLineRule {
  pattern: string;
  boost: string;
  example: string;
  category: string;
}

export const SUBJECT_LINE_RULES = {
  optimal: {
    length: { min: 30, max: 50, ideal: 44 },
    wordCount: { min: 6, max: 10 },
    mobileChars: 30, // Critical first 30 chars for mobile
    desktopChars: 60
  },

  // Proven patterns with statistical performance
  powerPatterns: {
    curiosityGap: [
      { pattern: 'The one thing {company} is missing', boost: '+47%', category: 'curiosity' },
      { pattern: 'Quick question about {specific_project}', boost: '+44%', category: 'curiosity' },
      { pattern: '{Competitor} does this differently', boost: '+38%', category: 'curiosity' },
      { pattern: 'Noticed something about {company}', boost: '+41%', category: 'curiosity' }
    ],
    patternInterrupt: [
      { pattern: 'Not a sales email', boost: '+31%', category: 'interrupt' },
      { pattern: 'Permission to be blunt?', boost: '+28%', category: 'interrupt' },
      { pattern: 'Canceling our meeting (unless...)', boost: '+35%', category: 'interrupt' },
      { pattern: 'Wrong person?', boost: '+43%', category: 'interrupt' }
    ],
    socialProof: [
      { pattern: 'How {competitor} increased {metric} by {%}', boost: '+67%', category: 'proof' },
      { pattern: '{Number} companies in {industry} are using this', boost: '+45%', category: 'proof' },
      { pattern: '{Mutual_connection} suggested I reach out', boost: '+45%', category: 'proof' },
      { pattern: 'Working with {similar_company}', boost: '+38%', category: 'proof' }
    ],
    ultraSpecific: [
      { pattern: '{Number}-minute {action} to {benefit}', boost: '+52%', category: 'specific' },
      { pattern: 'Cut your {metric} by {%} ({time} investment)', boost: '+48%', category: 'specific' },
      { pattern: '{Company} + {benefit} in {timeframe}', boost: '+41%', category: 'specific' }
    ],
    questions: [
      { pattern: 'Still interested in {topic}?', boost: '+44%', category: 'question' },
      { pattern: 'Is {problem} still a priority?', boost: '+42%', category: 'question' },
      { pattern: 'Worth a {time}-minute chat?', boost: '+38%', category: 'question' },
      { pattern: 'Can I ask you something?', boost: '+31%', category: 'question' }
    ],
    urgency: [
      { pattern: 'Limited time: {offer}', boost: '+22%', category: 'urgency' },
      { pattern: 'Expires {day}', boost: '+22%', category: 'urgency' },
      { pattern: 'Last chance for {benefit}', boost: '+18%', category: 'urgency' }
    ]
  },

  // Emotional trigger words with impact metrics
  emotionalTriggers: {
    fear: {
      words: ['missing', 'behind', 'losing', 'risk', 'mistake', 'problem'],
      boost: '+22%',
      usage: 'Use sparingly - max 1 per subject'
    },
    excitement: {
      words: ['breakthrough', 'finally', 'discovered', 'exciting', 'amazing'],
      boost: '+18%',
      usage: 'Better for warm leads'
    },
    exclusivity: {
      words: ['exclusive', 'selected', 'invited', 'private', 'insider'],
      boost: '+14%',
      usage: 'Effective for high-value offers'
    },
    achievement: {
      words: ['achieve', 'success', 'win', 'growth', 'results'],
      boost: '+16%',
      usage: 'Appeals to ambitious recipients'
    }
  },

  // Formatting tactics with measured impact
  formatting: {
    allLowercase: { 
      boost: '+32%', 
      example: 'quick question about your sales process',
      note: 'Appears more personal/less automated'
    },
    withNumbers: { 
      boost: '+57%', 
      example: '3 ways to reduce churn by 40%',
      note: 'Specific numbers outperform vague claims'
    },
    withBrackets: { 
      boost: '+28%', 
      example: '[Company] <> [YourCompany]',
      note: 'Creates visual distinction'
    },
    withQuestion: { 
      boost: '+44%', 
      example: 'Still interested?',
      note: 'Creates open loop in mind'
    },
    withColon: {
      boost: '+21%',
      example: 'Update: Your proposal',
      note: 'Suggests important information follows'
    },
    replyFormat: {
      boost: '+52%',
      example: 'Re: Our conversation',
      note: 'USE ETHICALLY - only if actual previous contact'
    }
  },

  // Words that damage open rates
  avoidWords: {
    spam: ['free', 'guarantee', 'click here', 'buy now', 'limited time', 'act now'],
    corporate: ['newsletter', 'announcement', 'update', 'reminder'],
    weak: ['hope', 'just', 'maybe', 'sorry', 'actually'],
    overused: ['revolutionary', 'game-changing', 'innovative', 'disruptive']
  },

  // Dynamic personalization elements
  dynamicElements: {
    temporal: [
      '{Day} follow-up',
      '{Morning/Afternoon} {FirstName}',
      'Before your {day} ends'
    ],
    contextual: [
      'Re: {recent_post/article}',
      'About {company_news}',
      'Following {event/conference}'
    ],
    behavioral: [
      'Saw you checked our {page}',
      'Since you downloaded {resource}',
      'You visited {number} times'
    ]
  },

  // Length optimization by intent
  lengthByIntent: {
    coldOutreach: { ideal: 44, max: 50 },
    followUp: { ideal: 35, max: 45 },
    breakup: { ideal: 25, max: 35 },
    valueDelivery: { ideal: 40, max: 50 },
    meetingRequest: { ideal: 30, max: 40 }
  },

  // A/B testing variables
  testingVariables: {
    format: ['lowercase', 'titleCase', 'withNumber', 'withQuestion'],
    emotion: ['curiosity', 'urgency', 'social_proof', 'specific_value'],
    length: ['ultra_short_20', 'short_35', 'optimal_44', 'long_60'],
    personalization: ['name_only', 'company_only', 'both', 'behavioral']
  }
};

// Subject line scoring function
export function scoreSubjectLine(subject: string): {
  score: number;
  improvements: string[];
  strengths: string[];
} {
  let score = 50; // Base score
  const improvements: string[] = [];
  const strengths: string[] = [];

  // Length check
  if (subject.length >= 30 && subject.length <= 50) {
    score += 15;
    strengths.push('Optimal length for open rates');
  } else if (subject.length > 70) {
    score -= 10;
    improvements.push(`Reduce to 44 chars (currently ${subject.length})`);
  }

  // Check for numbers
  if (/\d/.test(subject)) {
    score += 10;
    strengths.push('Contains numbers (+57% open rate)');
  } else {
    improvements.push('Add specific numbers for +57% open rate');
  }

  // Check for questions
  if (subject.includes('?')) {
    score += 8;
    strengths.push('Question format (+44% open rate)');
  }

  // Check for lowercase
  if (subject === subject.toLowerCase()) {
    score += 5;
    strengths.push('All lowercase (+32% open rate)');
  }

  // Check for spam triggers
  const spamWords = SUBJECT_LINE_RULES.avoidWords.spam;
  const foundSpam = spamWords.filter(word => 
    subject.toLowerCase().includes(word)
  );
  if (foundSpam.length > 0) {
    score -= 15;
    improvements.push(`Remove spam triggers: ${foundSpam.join(', ')}`);
  }

  // Check for weak words
  const weakWords = SUBJECT_LINE_RULES.avoidWords.weak;
  const foundWeak = weakWords.filter(word => 
    subject.toLowerCase().includes(word)
  );
  if (foundWeak.length > 0) {
    score -= 5;
    improvements.push(`Remove weak words: ${foundWeak.join(', ')}`);
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    improvements,
    strengths
  };
}