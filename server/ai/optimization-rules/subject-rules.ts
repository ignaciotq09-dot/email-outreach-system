// Subject Line Optimization Rules
export interface SubjectLineRule {
  pattern: string;
  boost: string;
  example?: string;
  category: 'curiosity' | 'pattern_interrupt' | 'social_proof' | 'specific_value' | 'question' | 'emotional';
}

export const SUBJECT_LINE_RULES = {
  optimal: {
    length: { min: 30, max: 50, ideal: 44 },
    wordCount: { min: 6, max: 10 },
    mobileChars: 30, // Critical for mobile visibility
    desktopChars: 60
  },

  powerPatterns: {
    curiosityGap: [
      { pattern: 'The one thing {company} is missing', boost: '+35%', category: 'curiosity' },
      { pattern: 'Quick question about {specific_project}', boost: '+44%', category: 'curiosity' },
      { pattern: '{Competitor} does this differently', boost: '+28%', category: 'curiosity' },
      { pattern: "I noticed something about {company}", boost: '+47%', category: 'curiosity' },
      { pattern: 'Not what I expected from {company}', boost: '+31%', category: 'curiosity' }
    ] as SubjectLineRule[],
    
    patternInterrupt: [
      { pattern: 'Not a sales email', boost: '+52%', category: 'pattern_interrupt' },
      { pattern: 'Permission to be blunt?', boost: '+38%', category: 'pattern_interrupt' },
      { pattern: 'Canceling our meeting (unless...)', boost: '+41%', category: 'pattern_interrupt' },
      { pattern: "Breaking my rules for {company}", boost: '+33%', category: 'pattern_interrupt' },
      { pattern: 'Wrong person? (looking for {title})', boost: '+43%', category: 'pattern_interrupt' }
    ] as SubjectLineRule[],
    
    socialProof: [
      { pattern: 'How {competitor} increased {metric} by {percentage}%', boost: '+67%', category: 'social_proof' },
      { pattern: '{Number} companies in {industry} are using this', boost: '+45%', category: 'social_proof' },
      { pattern: '{Mutual_connection} suggested I reach out', boost: '+45%', category: 'social_proof' },
      { pattern: '{Industry_leader} case study for {company}', boost: '+38%', category: 'social_proof' },
      { pattern: 'What {competitor} knows that you don\'t', boost: '+55%', category: 'social_proof' }
    ] as SubjectLineRule[],
    
    ultraSpecific: [
      { pattern: '{Number}-minute {action} to {benefit}', boost: '+41%', category: 'specific_value' },
      { pattern: 'Cut your {metric} by {percentage}% ({time} investment)', boost: '+49%', category: 'specific_value' },
      { pattern: '{Company} + {specific_benefit} in {timeframe}', boost: '+36%', category: 'specific_value' },
      { pattern: '3 ways {company} can {achieve_goal}', boost: '+57%', category: 'specific_value' },
      { pattern: '{Dollar_amount} hidden in your {process}', boost: '+62%', category: 'specific_value' }
    ] as SubjectLineRule[],
    
    questions: [
      { pattern: 'Still interested in {topic}?', boost: '+44%', category: 'question' },
      { pattern: 'Is {problem} still a priority?', boost: '+39%', category: 'question' },
      { pattern: 'Worth a {time}-minute chat?', boost: '+37%', category: 'question' },
      { pattern: 'Ready to {achieve_goal}?', boost: '+33%', category: 'question' },
      { pattern: 'Can I help with {challenge}?', boost: '+35%', category: 'question' }
    ] as SubjectLineRule[]
  },

  emotionalTriggers: {
    fear: {
      words: ['missing', 'behind', 'losing', 'risk', 'mistake', 'threat', 'vulnerable'],
      boost: '+22%',
      effectiveness: 'High for security/compliance industries'
    },
    excitement: {
      words: ['breakthrough', 'finally', 'discovered', 'exciting', 'incredible'],
      boost: '+18%',
      effectiveness: 'Best for innovation-focused companies'
    },
    urgency: {
      words: ['limited', 'expiring', 'deadline', 'ending', 'last chance', 'today only'],
      boost: '+22%',
      effectiveness: 'Use sparingly to avoid spam filters'
    },
    exclusivity: {
      words: ['exclusive', 'selected', 'invited', 'VIP', 'private', 'insider'],
      boost: '+14%',
      effectiveness: 'Effective for C-suite and decision makers'
    },
    curiosity: {
      words: ['secret', 'revealed', 'truth', 'hidden', 'surprising', 'unexpected'],
      boost: '+31%',
      effectiveness: 'Universal appeal across industries'
    }
  },

  formatting: {
    allLowercase: { 
      boost: '+32%', 
      example: 'quick question about your process',
      note: 'Feels more personal and less marketing-like'
    },
    withNumbers: { 
      boost: '+57%', 
      example: '3 ways to improve conversion',
      note: 'Specific numbers outperform generic terms'
    },
    withBrackets: { 
      boost: '+28%', 
      example: '[Company] <> [YourCompany]',
      note: 'Creates visual pattern interrupt'
    },
    withQuestion: { 
      boost: '+44%', 
      example: 'Still interested?',
      note: 'Creates open mental loop'
    },
    replyFormat: {
      boost: '+52%',
      example: 'Re: Our conversation',
      note: 'Use ethically - only if there was prior contact'
    },
    withEmoji: {
      boost: 'Mixed (-5% to +56%)',
      example: '🎯 Quick win for {company}',
      note: 'Test with audience - varies greatly by industry'
    }
  },

  avoidWords: [
    'newsletter', // -18.7% open rate
    'free', // Spam trigger
    'guarantee', // Overpromise
    'amazing', // Generic superlative
    'revolutionary', // Overused
    'opportunity', // Salesy
    'deal', // Too transactional
    'offer', // Spam trigger
    'click here', // Outdated CTA
    'act now', // Aggressive
    'buy', // Too direct for cold outreach
    'discount', // Value-reducing
    'price', // Premature for cold email
  ],

  dynamicElements: {
    dayReference: {
      pattern: '{Day} follow-up: {topic}',
      boost: '+15%',
      example: 'Tuesday follow-up: automation discussion'
    },
    timeReference: {
      pattern: '{Morning/Afternoon} thoughts on {topic}',
      boost: '+12%',
      example: 'Morning thoughts on your expansion'
    },
    weatherReference: {
      pattern: 'Hope the {weather} in {city} isn\'t affecting {topic}',
      boost: '+8%',
      example: 'Hope the snow in Boston isn\'t affecting deliveries'
    },
    eventReference: {
      pattern: 'Before {event}: {value_prop}',
      boost: '+25%',
      example: 'Before AWS re:Invent: cloud cost optimization'
    },
    seasonalReference: {
      pattern: '{Season} planning for {goal}',
      boost: '+18%',
      example: 'Q4 planning for sales acceleration'
    }
  },

  intentOptimized: {
    coldOutreach: [
      'Quick question about {company}',
      'Noticed {specific_observation}',
      '{Mutual_connection} suggested we connect'
    ],
    followUp: [
      'Following up: {previous_topic}',
      'Re: {original_subject}',
      'Did you see my note about {topic}?'
    ],
    breakup: [
      'Should I close your file?',
      'Last attempt - {company} automation',
      'Moving on from {company}?'
    ],
    valueDelivery: [
      '{Company} case study inside',
      'Resource for {challenge} (as discussed)',
      'Free {tool} for {company} team'
    ],
    meetingRequest: [
      '15 minutes tomorrow?',
      'Coffee chat about {topic}?',
      'Quick call - {specific_value}?'
    ]
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
    strengths.push('Optimal length for visibility');
  } else if (subject.length > 50) {
    improvements.push(`Shorten to 44 chars (currently ${subject.length})`);
    score -= 10;
  } else {
    improvements.push(`Too short - aim for 30-50 chars (currently ${subject.length})`);
    score -= 5;
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
    score += 10;
    strengths.push('Question format (+44% open rate)');
  }

  // Check case
  if (subject === subject.toLowerCase()) {
    score += 8;
    strengths.push('All lowercase (+32% open rate)');
  }

  // Check for avoid words
  SUBJECT_LINE_RULES.avoidWords.forEach(word => {
    if (subject.toLowerCase().includes(word)) {
      score -= 10;
      improvements.push(`Remove '${word}' (spam trigger)`);
    }
  });

  // Check for personalization placeholders
  if (subject.includes('{') || subject.includes('[')) {
    score += 12;
    strengths.push('Includes personalization');
  } else {
    improvements.push('Add personalization tokens for +26% open rate');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    improvements,
    strengths
  };
}