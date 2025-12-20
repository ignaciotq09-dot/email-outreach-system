export const OPTIMIZATION_RULES = {
  subjectLine: {
    optimal: { length: { min: 30, max: 50, ideal: 44 }, wordCount: { min: 6, max: 10 }, characterCounts: { mobile: 30, desktop: 60 } },
    powerPatterns: {
      curiosityGap: ['The one thing {company} is missing', 'Quick question about {specific_project}', '{Competitor} does this differently'],
      patternInterrupt: ['Not a sales email', 'Permission to be blunt?', 'Canceling our meeting (unless...)'],
      socialProof: ['How {competitor} increased {metric} by {percentage}', '{Number} companies in {industry} are using this', '{Mutual_connection} suggested I reach out'],
      ultraSpecific: ['{Number}-minute {action} to {benefit}', 'Cut your {metric} by {percentage} ({time} investment)', '{Company} + {specific_benefit} in {timeframe}'],
      questions: ['Still interested in {topic}?', 'Is {problem} still a priority?', 'Worth a {time}-minute chat?']
    },
    emotionalTriggers: { fear: { words: ['missing', 'behind', 'losing', 'risk'], boost: '+22%' }, excitement: { words: ['breakthrough', 'finally', 'discovered'], boost: '+18%' }, urgency: { words: ['limited', 'expiring', 'deadline'], boost: '+22%' }, exclusivity: { words: ['exclusive', 'selected', 'invited'], boost: '+14%' } },
    avoidWords: ['newsletter', 'free', 'guarantee', 'amazing', 'revolutionary'],
    formatting: { allLowercase: { boost: '+32%', example: 'quick question' }, withNumbers: { boost: '+57%', example: '3 ways to...' }, withBrackets: { boost: '+28%', example: '[Company] <> [YourCompany]' }, withQuestion: { boost: '+44%', example: 'Still interested?' } }
  },
  emailBody: {
    structure: { optimal: { wordCount: { min: 50, max: 125, ideal: 75 }, sentenceCount: { min: 6, max: 8, peak: 7 }, paragraphs: { max: 3, ideal: 2 }, readingGrade: { min: 8, max: 10 } }, openingLines: { effective: ["I'll be brief", "I noticed {specific_observation}", "Quick question", "Not sure if you're the right person"], ineffective: ["I hope this finds you well", "I wanted to reach out", "I know you're busy"] } },
    psychology: { reciprocity: { patterns: ['I created a {custom_analysis} for {company}', 'Here\'s a free {resource} for teams like yours', 'I found {number} quick wins for your {area}'], boost: '+85%' }, socialProof: { placement: 'third_paragraph', types: { similar_company: { boost: '+45%', pattern: 'Companies like {company}...' }, exact_competitor: { boost: '+67%', pattern: '{Competitor} uses this to...' }, industry_leader: { boost: '+38%', pattern: '{Fortune500} achieved...' }, peer_level: { boost: '+52%', pattern: 'Other {title}s have...' } } }, scarcity: { patterns: ['Only {number} spots', 'Offer expires {date}', 'Limited to {criteria}'], effectiveness: '2.3x gain framing' } },
    sentenceVariety: { short: '40%', medium: '40%', long: '20%', activeVoice: '80%', powerWords: ['because', 'imagine', 'proven', 'exclusive', 'transform'] }
  },
  timing: { weekday: { best: [2, 3], good: [4], acceptable: [1, 5], avoid: [0, 6] }, hour: { best: [10, 14], good: [9, 11, 15], acceptable: [8, 13, 16], avoid: [12, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7] } }
};
