export const HIGH_CONVERTING_WORD_RULES = {
  powerWords: {
    highImpact: ['you', 'free', 'because', 'instantly', 'new', 'proven', 'easy', 'secret', 'discover', 'imagine', 'exclusive', 'limited', 'results', 'guaranteed', 'success'],
    decisiveLanguage: ['definitely', 'certainly', 'absolutely', 'proven', 'confirmed', 'established'],
    actionWords: ['discover', 'unlock', 'achieve', 'transform', 'accelerate', 'boost', 'master', 'dominate'],
    riskReversal: ['no obligation', 'try it free', 'money-back', 'cancel anytime', 'risk-free trial', 'no commitment'],
    curiosityTriggers: ['secret', 'revealed', 'hidden', 'little-known', 'insider', 'breakthrough', 'surprising']
  },
  
  pronounRatios: {
    youToI: { ratio: '4:1', impact: '+28% engagement', explanation: 'Use "you/your" 4x more than "I/we/our"' },
    weUsage: { context: 'Solution discussion', impact: 'Creates partnership feeling', example: 'We can work together on...' },
    iUsage: { context: 'Personal commitment statements only', caution: 'Minimize in sales context' }
  },
  
  numberPsychology: {
    oddNumbers: { impact: '+20% memorability', example: '23% improvement (not 20%)', reason: 'Odd numbers feel more researched and credible' },
    specificNumbers: { impact: '+37% credibility', example: '47 clients (not "about 50")', reason: 'Specific = measured = trustworthy' },
    roundNumbers: { usage: 'Only for easy-to-process estimates', example: 'About 1,000 users' },
    noFabrication: 'NEVER make up numbers - only use if user provides real data'
  },
  
  wordsToAvoid: {
    spamTriggers: ['FREE', 'GUARANTEED', 'risk-free', 'URGENT', '$$$', 'act now', 'limited time', 'click here', 'ALL CAPS', 'excessive !!!'],
    corporateJargon: ['synergy', 'leverage', 'utilize', 'facilitate', 'endeavor', 'pursuant to', 'optimize', 'streamline', 'scalable', 'actionable', 'paradigm', 'ecosystem'],
    weakOpeners: ['I hope this finds you well', 'My name is', 'I wanted to reach out', 'Just checking in', 'I\'d love to connect', 'Hope all is well', 'Trust this email finds you'],
    hedgingLanguage: ['I was wondering if maybe', 'I think perhaps', 'Just wanted to', 'Would you possibly be interested', 'Sorry to bother you'],
    genericPhrases: ['touching base', 'circle back', 'take offline', 'low-hanging fruit', 'move the needle', 'deep dive', 'bandwidth']
  },
  
  wordsToUse: {
    simpleAlternatives: {
      'utilize': 'use',
      'facilitate': 'help',
      'endeavor': 'try',
      'pursuant to': 'about',
      'leverage': 'use',
      'optimize': 'improve',
      'synergy': 'work together',
      'streamline': 'simplify',
      'actionable': 'practical',
      'bandwidth': 'time'
    },
    naturalOpeners: ['Saw your...', 'Congrats on...', 'Your work on...', 'Quick thought about...', 'Most [role]s I talk to...', 'Curious about...'],
    softClosers: ['Worth a quick chat?', 'Open to connecting?', 'Thoughts?', 'Make sense to talk?', 'Worth exploring?']
  },
  
  channelSpecificWords: {
    email: {
      subjectLine: {
        use: ['Quick', 'Idea', 'Thought', 'Question', recipient_name, company_name],
        avoid: ['Introduction', 'Following up', 'Checking in', 'Hello', 'Hi there'],
        maxWords: 7,
        optimalLength: '36-50 characters'
      },
      body: {
        openingWords: ['Noticed', 'Saw', 'Congrats', 'Your', 'Quick'],
        closingPhrases: ['Worth a chat?', 'Thoughts?', 'Make sense?', 'Open to connecting?']
      }
    },
    sms: {
      hookWords: ['Quick', 'Hey', 'Thought', 'FYI', recipient_name],
      avoidWords: ['Dear', 'Regarding', 'Pursuant', 'Hereby'],
      urgencyWords: ['Today', 'Now', 'Quick', 'Before Friday'],
      charLimit: 160
    },
    linkedin: {
      connectionNote: {
        use: ['Noticed', 'Impressed by', 'Saw your', 'Your work on'],
        avoid: ['I\'d love to connect', 'Let\'s connect', 'Add me', 'Networking'],
        charLimit: 300
      },
      dm: {
        use: ['Curious about', 'Quick question', 'Thought you might', 'Noticed'],
        avoid: ['Sales pitch language', 'Long intros', 'Immediate asks'],
        charLimit: 400
      }
    }
  }
};

function recipient_name(): string { return '{FirstName}'; }
function company_name(): string { return '{Company}'; }

export const PROMPT_WORD_RULES = `
=== HIGH-CONVERTING WORD CHOICE (Research-Backed) ===

PRONOUN RATIO (Critical for engagement):
• Use "you/your" 4x more than "I/we/our" (+28% engagement)
• "We" for solution discussion (creates partnership)
• Minimize "I" except for personal commitments

POWER WORDS TO USE:
• Decisive: definitely, certainly, proven, confirmed
• Action: discover, unlock, achieve, transform
• Curiosity: secret, revealed, hidden, surprising

WORDS TO AVOID:
• Corporate jargon: synergy, leverage, utilize, facilitate, endeavor
• Spam triggers: FREE, GUARANTEED, URGENT, $$$, act now
• Weak openers: "I hope this finds you well", "My name is", "Just checking in"
• Hedging: "I was wondering if maybe", "would you possibly"

SIMPLE ALTERNATIVES:
• utilize → use
• facilitate → help  
• endeavor → try
• leverage → use
• optimize → improve

NUMBER PSYCHOLOGY:
• Odd numbers: +20% more memorable (23% not 20%)
• Specific numbers: +37% more credible (47 not "about 50")
• NEVER fabricate numbers - only use if real data provided

NATURAL OPENERS (Lead with THEM):
✅ "Saw your..." / "Congrats on..." / "Your work on..." / "Quick thought..."
❌ "I hope this finds you well" / "My name is..." / "I wanted to reach out"
`;
