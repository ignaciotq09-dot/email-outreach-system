export const COGNITIVE_BIAS_MATRIX = {
  reciprocity: {
    principle: 'People feel obligated to return favors',
    impact: '+85% response rate',
    application: { email: { patterns: ['I created a custom {analysis} for {company}', 'Here\'s a free {resource} I thought you\'d find useful', 'I put together {deliverable} specifically for your situation'], requirement: 'Must offer genuine value before asking', placement: 'Opening paragraph' }, sms: { patterns: ['Free tip for you:', 'Quick insight:', 'Sharing this with you:'], requirement: 'Value must be immediately actionable', charLimit: 30 }, linkedin: { patterns: ['Wanted to share this resource...', 'Thought you might find this useful...'], requirement: 'Content must be genuinely helpful', timing: 'Before connection request' } }
  },
  socialProof: {
    principle: 'People follow actions of similar others',
    impact: '+70% close rate',
    levels: { similarCompany: { boost: '+45%', pattern: 'Companies like yours...' }, exactCompetitor: { boost: '+67%', pattern: '{Competitor} achieved...' }, industryLeader: { boost: '+38%', pattern: '{Fortune500} uses...' }, peerLevel: { boost: '+52%', pattern: 'Other {title}s have...' }, quantity: { boost: '+29%', pattern: '500+ companies' } },
    application: { email: { placement: 'Third paragraph for maximum impact', examples: ['We helped [similar company] achieve [result]', 'Other [role]s in [industry] are seeing...'] }, sms: { examples: ['500+ teams use this', 'Join [number] others'], charLimit: 25 }, linkedin: { examples: ['Mutual connections include...', 'Others in your network...'] } },
    conditionalUse: 'Only use when user provides actual case study data - never fabricate results'
  },
  lossAversion: {
    principle: 'Fear of loss is 2.3x stronger than desire for gain',
    impact: '2.3x more effective than positive framing',
    application: { email: { patterns: ['You\'re potentially missing {opportunity} without...', 'While competitors are gaining {metric}...', 'Every day without {solution} could mean...'], caution: 'Must be truthful - never fabricate consequences' }, sms: { patterns: ['Don\'t miss:', 'Ends tonight:', 'Last chance:'], charLimit: 20 }, linkedin: { patterns: ['Saw this opportunity slipping...', 'Before the window closes...'] } },
    ethicalGuideline: 'Only use loss framing when the loss is real and verifiable - never create false urgency'
  },
  authorityBias: {
    principle: 'People defer to experts and authority figures',
    impact: '+42% trust increase',
    application: { email: { patterns: ['Research from {source} shows...', 'Industry data indicates...', 'Studies confirm...'], placement: 'Early in email for credibility', requirement: 'Only cite real research - never fabricate studies' }, sms: { patterns: ['Data shows:', 'Proven by:', 'Research:'], charLimit: 15 }, linkedin: { patterns: ['Based on my experience with...', 'Having worked with {companies}...'] } },
    conditionalUse: 'Only reference authority when user provides credentials/sources'
  },
  curiosityGap: {
    principle: 'Create knowledge gap that demands closure',
    impact: '+47% open rate',
    application: { email: { patterns: ['I discovered something about {company}...', 'There\'s a pattern I noticed in {industry}...', 'One thing your top competitors know...'], placement: 'Subject line and opening' }, sms: { patterns: ['Quick question -', 'Noticed something:', 'You might not know:'], charLimit: 25 }, linkedin: { patterns: ['Something caught my attention about...', 'Curious about your approach to...'] } }
  },
  scarcity: {
    principle: 'Limited availability increases perceived value',
    impact: '+33% action rate',
    application: { email: { patterns: ['Only accepting {number} clients this quarter', 'Limited spots available for...', 'This offer expires...'], caution: 'Scarcity must be real - never fabricate limits' }, sms: { patterns: ['Only X left:', 'Ends in X hours:', 'Limited:'], charLimit: 20 }, linkedin: { patterns: ['Rarely reach out outside my network...', 'Only connecting with...'] } },
    ethicalGuideline: 'Only use scarcity when limits are genuine'
  },
  commitmentConsistency: {
    principle: 'People align actions with previous commitments',
    impact: '+43% response rate',
    application: { email: { patterns: ['Based on what you mentioned about {topic}...', 'You said {goal} was important...', 'Given your focus on {priority}...'], requirement: 'Requires prior interaction or public statement - never assume' }, sms: { patterns: ['Following up on:', 'As you mentioned:', 'About {topic}:'], charLimit: 25 }, linkedin: { patterns: ['Saw your post about...', 'Your comment on {topic}...'] } },
    conditionalUse: 'Only reference commitments user explicitly provides'
  }
};

export const WORD_PSYCHOLOGY = {
  powerWords: { high_impact: ['you', 'free', 'because', 'instantly', 'new', 'proven', 'easy', 'secret', 'discover', 'imagine'], ratios: { you_to_i: '4:1 (use "you" 4x more than "I")', we_usage: 'Creates partnership - use for solution discussion' } },
  numbersRules: { odd: { impact: '+20% memorability', example: '23% increase (not 20%)' }, specific: { impact: '+37% credibility', example: '47 clients (not 50)' }, round: { usage: 'Easy processing for estimates' } },
  wordsToAvoid: { spam_triggers: ['FREE', 'GUARANTEED', 'risk-free', 'URGENT', 'act now', 'limited time', 'click here'], corporate_jargon: ['synergy', 'leverage', 'utilize', 'facilitate', 'endeavor', 'pursuant to', 'optimize'], weak_openers: ['I hope this finds you well', 'My name is', 'I wanted to reach out', 'Just checking in'] },
  wordsToUse: { decisive: ['definitely', 'certainly', 'absolutely', 'proven'], action: ['discover', 'unlock', 'achieve', 'transform'], risk_reversal: ['no obligation', 'try it free', 'money-back', 'cancel anytime'] }
};

export const FOLLOW_UP_PSYCHOLOGY = {
  angleVariation: { touch1: { angle: 'Core value proposition', bias: 'curiosityGap' }, touch2: { angle: 'Different benefit/angle', bias: 'socialProof' }, touch3: { angle: 'Case study/proof', bias: 'authorityBias' }, touch4: { angle: 'New perspective/trigger', bias: 'lossAversion' }, touch5: { angle: 'Urgency/scarcity', bias: 'scarcity' }, touch6: { angle: 'Breakup/final chance', bias: 'commitmentConsistency' } },
  responseStatistics: { touch1: '2% response', touch2: '3% response', touch3: '5% response', touch4: '10% response', touch5_12: '80% of responses come from touch 5+' },
  timingPsychology: { shortGap: { days: 2, creates: 'Urgency' }, mediumGap: { days: 4, creates: 'Persistence without annoyance' }, longGap: { days: 7, creates: 'Thoughtfulness' } }
};
