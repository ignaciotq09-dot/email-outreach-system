export interface PsychologyRule { technique: string; impact: string; implementation: string; example?: string; }

export const PSYCHOLOGY_OPTIMIZATION_RULES = {
  cognitiveBiases: { reciprocity: { principle: 'People feel obligated to return favors', impact: '+85% response rate', patterns: ['I created a custom {analysis} for {company}', 'Here\'s a free {tool} I built for teams like yours', 'I found {number} opportunities in your {area}', 'Sharing this {resource} that helped {similar_company}'], implementation: 'Give value before asking' }, socialProof: { principle: 'People follow the actions of similar others', impact: '+70% close rate', levels: { similar_company: { boost: '+45%', pattern: 'Companies like yours...' }, exact_competitor: { boost: '+67%', pattern: '{Competitor} achieved...' }, industry_leader: { boost: '+38%', pattern: '{Fortune500} uses...' }, peer_level: { boost: '+52%', pattern: 'Other {title}s have...' }, quantity: { boost: '+29%', pattern: '500+ companies' } }, placement: 'Third paragraph for maximum impact' }, lossAversion: { principle: 'Fear of loss is 2.3x stronger than desire for gain', impact: '2.3x more effective than positive framing', patterns: ['You\'re losing ${amount} per {timeframe} without this', 'Your competitors are gaining {metric} while you...', 'Every day without {solution} costs you {impact}', 'The {opportunity} window closes in {timeframe}'], caution: 'Use ethically - must be truthful' }, authorityBias: { principle: 'People defer to experts and authority figures', impact: '+42% trust increase', signals: ['Research from {university} shows...', 'Industry analysts predict...', '{Expert_name} recently said...', 'Studies indicate...'], placement: 'Early in email for credibility' }, commitmentConsistency: { principle: 'People align actions with previous commitments', impact: '+43% response rate', patterns: ['Based on what you said about {topic}...', 'You mentioned {goal} was important...', 'This aligns with your focus on {priority}...', 'Given your commitment to {value}...'], requirement: 'Requires previous interaction or public statement' }, likingBias: { principle: 'People say yes to those they like', impact: '+31% positive response', tactics: ['Find genuine commonality', 'Give sincere compliment on work', 'Show shared values/goals', 'Use similar communication style'] }, scarcity: { principle: 'Limited availability increases desire', impact: '+22% action rate', patterns: ['Only {number} spots available', 'Offer expires {date}', 'Limited to {criteria}', 'Next opening in {timeframe}'], authenticity: 'Must be genuine scarcity' }, unityPrinciple: { principle: 'Shared identity creates strong bonds', impact: '+35% engagement', patterns: ['As fellow {group_members}...', 'We {industry} professionals...', 'People like us who {shared_trait}...'] } },
  neuromarketingTactics: { processingFluency: { principle: 'Easier to process = more trustworthy', tactics: ['Simple words in novel combinations', 'Familiar metaphors for complex ideas', 'Rhythmic sentence structure', 'Alliteration in key phrases'], impact: '+24% comprehension and trust' }, cognitiveLoadManagement: { principle: 'Reduce mental effort required', structure: 'Simple → Complex → Simple', tactics: ['One idea per paragraph', 'Progressive disclosure of information', 'Clear visual hierarchy', 'Numbered lists for multiple points'], impact: '+31% message retention' }, primingEffects: { principle: 'Early exposure influences later decisions', tactics: ['Seed concept 2 emails before ask', 'Use outcome words early (success, growth)', 'Establish price anchors high', 'Prime for action with motion words'], timing: 'Most effective 24-72 hours before CTA' }, mirrorNeurons: { principle: 'Action language triggers mental simulation', patterns: ['Picture yourself...', 'Imagine opening...', 'See the results...', 'Feel the difference...'], impact: '+38% visualization-driven action' } },
  linguisticPatterns: { temporalFraming: { principle: 'Time language affects urgency perception', patterns: { immediacy: ['Right now', 'Today', 'This week'], futureOrientation: ['Next quarter', 'In 6 months', 'By year end'] }, usage: 'Match to decision timeline' }, pronounUsage: { you: { ratio: '4:1 vs I/we', impact: '+28% engagement' }, we: { usage: 'Creates partnership feeling', placement: 'Solution discussion' }, I: { usage: 'Personal commitment statements', caution: 'Minimize in sales context' } }, numberPsychology: { oddNumbers: { impact: '+20% memorability', example: '23% increase vs 20% increase' }, specificNumbers: { impact: '+37% credibility', example: '47 clients vs 50 clients' }, roundNumbers: { usage: 'Easy processing for estimates' } } },

  // TOP SALES TEAM BEST PRACTICES
  topSalesTeamTactics: {
    responseTimeOptimization: {
      principle: 'Speed to lead is critical for conversion',
      data: {
        within5Minutes: { conversionRate: '+400%', impact: '9x more likely to connect' },
        within1Hour: { conversionRate: '+60%', impact: 'Sweet spot for warm leads' },
        within24Hours: { conversionRate: '+20%', impact: 'Acceptable for cold outreach' },
        after48Hours: { conversionRate: '-75%', impact: 'Significantly reduced odds' }
      },
      implementation: 'Set up auto-responses for leads, prioritize by lead temperature',
      topPerformerHabit: 'Top 10% of salespeople respond within 10 minutes'
    },
    multiTouchStrategy: {
      principle: 'Average of 8 touches needed to get initial meeting',
      cadence: {
        day1: 'Email #1 - Value-focused introduction',
        day3: 'Email #2 - Case study or social proof',
        day7: 'Phone call - Reference previous emails',
        day10: 'Email #3 - Different angle/pain point',
        day14: 'LinkedIn connection + message',
        day21: 'Email #4 - Breakup email with scarcity',
        day28: 'Final touch - "Closing the loop"'
      },
      topPerformerInsight: 'Elite sellers use 6-8 touch sequences vs average 2-3',
      statistics: '+70% more meetings booked with systematic follow-up'
    },
    personalizationDepth: {
      principle: 'Deep personalization drives 6x higher response rates',
      levels: {
        basic: { elements: 'Name, company', responseRate: '+2%' },
        intermediate: { elements: 'Recent news, role, pain point', responseRate: '+15%' },
        advanced: { elements: 'Specific company metrics, personal interests, mutual connections', responseRate: '+600%' },
        expert: { elements: 'Custom video, tailored analysis, company-specific insights', responseRate: '+800%' }
      },
      topSalesTeamFocus: 'Spend 15-20 min researching before first email',
      researchSources: ['LinkedIn activity', 'Company news', 'Industry reports', 'Competitor analysis', 'Social media']
    },
    valuePropositionFramework: {
      principle: 'Lead with outcomes, not features',
      structure: {
        problem: 'Identify specific pain point (researched)',
        impact: 'Quantify the cost of inaction',
        solution: 'Position your offer as bridge',
        proof: 'Evidence from similar situations',
        cta: 'Low-friction next step'
      },
      topPerformerLanguage: {
        avoid: ['We offer', 'Our product', 'Features include', 'I wanted to reach out'],
        use: ['You\'re likely experiencing', 'Companies like yours save', 'Based on your goals', 'You mentioned']
      },
      impact: '+156% conversion rate when outcome-focused'
    },
    questionBasedSelling: {
      principle: 'Questions create engagement and control conversation',
      types: {
        diagnostic: { purpose: 'Uncover pain', example: 'How are you currently handling {process}?' },
        implication: { purpose: 'Amplify pain', example: 'What happens if this isn\'t resolved by {deadline}?' },
        needPayoff: { purpose: 'Build desire', example: 'How would it impact your team if you could {benefit}?' }
      },
      emailApplication: 'End 70% of emails with question to drive response',
      topPerformerStat: 'Ask 11-14 questions per discovery call vs average 6'
    }
  },

  // PROFESSIONAL EMAIL BEST PRACTICES
  professionalEmailOptimization: {
    subjectLineScience: {
      principle: 'Subject line determines 47% of open decisions',
      optimalLength: { characters: '30-50 chars', words: '4-7 words', impact: '+50% open rate' },
      highPerformingPatterns: {
        personalized: { format: '{Name}, quick question about {specific_topic}', openRate: '+26%' },
        curiosityGap: { format: 'You might be missing out on {benefit}', openRate: '+21%' },
        numberDriven: { format: '3 ways {company} can {achieve_goal}', openRate: '+18%' },
        questionBased: { format: 'Still struggling with {pain_point}?', openRate: '+23%' },
        urgency: { format: '{Timeframe} to {achieve_outcome}', openRate: '+15%' }
      },
      avoid: {
        allCaps: { impact: '-67% open rate', reason: 'Appears spammy' },
        excessivePunctuation: { example: 'Amazing opportunity!!!', impact: '-42% open rate' },
        genericPhrases: { examples: ['Touching base', 'Following up', 'Checking in'], impact: '-30% engagement' }
      },
      ABTestInsights: 'Personalized subjects beat generic by 202%'
    },
    emailStructureOptimization: {
      principle: 'Structure affects readability and response',
      optimalFormat: {
        greeting: { type: 'Personalized', example: 'Hi {FirstName}', avoid: 'Dear Sir/Madam' },
        opening: { length: '1 sentence', purpose: 'Establish relevance', example: 'Noticed your recent {achievement}' },
        value: { length: '2-3 sentences', purpose: 'Explain why they should care', tactic: 'Outcome-focused' },
        proof: { length: '1-2 sentences', purpose: 'Build credibility', format: 'Specific metric or case study' },
        cta: { length: '1 sentence', purpose: 'Low-friction ask', example: 'Are you open to a 15-min conversation?' },
        signature: { elements: ['Name', 'Title', 'Company', 'Phone', 'Calendar link'] }
      },
      lengthGuidelines: {
        ideal: { words: '50-125 words', readTime: '15-30 seconds', responseRate: '+53%' },
        acceptable: { words: '125-200 words', readTime: '30-45 seconds', responseRate: '+28%' },
        tooLong: { words: '200+ words', readTime: '45+ seconds', responseRate: '-37%' }
      },
      formatting: {
        paragraphs: { maxSentences: '2-3', spacing: 'Single line breaks between' },
        bullets: { usage: 'For 3+ items', impact: '+29% comprehension' },
        bold: { usage: 'Highlight 1-2 key phrases only', caution: 'Overuse reduces impact by 45%' },
        links: { maxCount: '1-2 max', placement: 'In CTA or signature', hyperlinkText: true }
      }
    },
    toneAndProfessionalism: {
      principle: 'Professional yet personable wins 78% more responses',
      guidelines: {
        formality: { level: 'Match prospect industry', corporate: 'More formal', startup: 'Conversational' },
        enthusiasm: { 'sweet spot': 'Confident and interested, not desperate', exclamation: 'Max 1 per email' },
        vocabulary: { readingLevel: '8th grade', avoid: 'Jargon unless industry-specific', use: 'Clear, concrete language' }
      },
      powerWords: {
        action: ['Achieve', 'Accelerate', 'Discover', 'Transform', 'Unlock'],
        emotion: ['Imagine', 'Confident', 'Excited', 'Proven', 'Guaranteed'],
        trust: ['Specifically', 'Research shows', 'Evidence', 'Track record', 'Results']
      },
      redFlags: {
        avoid: ['Just checking in', 'Any updates?', 'Bumping this up', 'Per my last email', 'Sorry to bother'],
        reason: 'Sound passive, apologetic, or aggressive',
        replacement: 'Be direct and value-focused'
      },
      topPerformerTone: 'Helpful consultant, not pushy vendor'
    },
    callToActionMastery: {
      principle: 'Specific, low-friction CTAs get 4x more responses',
      effectivePatterns: {
        timebound: { format: 'Do you have 15 minutes this week?', impact: '+44% booking rate' },
        binary: { format: 'Does Tuesday or Thursday work better?', impact: '+31% response rate' },
        permissionBased: { format: 'Would it make sense to explore this?', impact: '+27% positive replies' },
        calendlyDirect: { format: 'Grab time here: {link}', impact: '+89% meetings booked when interested' }
      },
      avoid: {
        vague: { example: 'Let me know your thoughts', impact: '-52% action taken' },
        demanding: { example: 'Call me at your earliest convenience', impact: '-38% response' },
        multiple: { issue: 'More than 1 CTA', impact: '-27% completion', reason: 'Decision paralysis' }
      },
      placement: 'CTA as final sentence, make unmissable'
    },
    timingAndFrequency: {
      principle: 'When you send matters as much as what you send',
      optimalTiming: {
        bestDays: { data: 'Tuesday-Thursday', impact: '+25% open rate vs Mon/Fri' },
        bestTimes: {
          early: { time: '6-7 AM', reason: 'Inbox priority, fresh mind', openRate: '+23%' },
          midMorning: { time: '10-11 AM', reason: 'Post-meeting check', openRate: '+18%' },
          lunchtime: { time: '12-1 PM', reason: 'Quick scan during break', openRate: '+15%' },
          endOfDay: { time: '4-5 PM', reason: 'Planning tomorrow', openRate: '+12%' }
        },
        avoid: { times: ['Before 6 AM', 'After 7 PM', 'Weekends'], impact: '-40% engagement', exception: 'Unless you know their schedule' }
      },
      followUpCadence: {
        firstFollowUp: { waitTime: '3-4 days', message: 'Reference original value' },
        secondFollowUp: { waitTime: '7 days', message: 'New angle or proof point' },
        thirdFollowUp: { waitTime: '14 days', message: 'Breakup email with scarcity' },
        persistence: 'Top performers send 5-6 follow-ups vs average 1-2'
      },
      frequencyLimits: {
        cold: { max: '1 email per week', risk: 'Perceived as spam if more' },
        warm: { max: '2-3 emails per week', context: 'Active conversation' },
        hot: { max: 'Daily if needed', context: 'Closing active deal' }
      }
    },
    mobileOptimization: {
      principle: '81% of emails opened on mobile first',
      requirements: {
        subjectLine: { maxChars: '30 chars', reason: 'Preview limit on mobile' },
        preheader: { length: '40-50 chars', purpose: 'Extend subject line hook', impact: '+27% opens' },
        formatting: {
          paragraphLength: { max: '2-3 lines', reason: 'Mobile screen readability' },
          singleColumn: { requirement: true, reason: 'No side-by-side on mobile' },
          fontSize: { min: '14px', reason: 'Avoid pinch-to-zoom' },
          ctaButton: { minSize: '44px', reason: 'Touch target size' }
        },
        testing: 'Always preview on mobile before sending'
      },
      topPerformerHabit: 'Write for mobile first, desktop second'
    }
  },

  // DATA-DRIVEN SALES INSIGHTS
  salesPerformanceData: {
    benchmarkMetrics: {
      coldEmail: {
        openRate: { average: '21-23%', topPerformers: '35-45%', elite: '50%+' },
        responseRate: { average: '8-10%', topPerformers: '15-25%', elite: '30%+' },
        meetingBookedRate: { average: '2-3%', topPerformers: '5-8%', elite: '10%+' }
      },
      warmEmail: {
        openRate: { average: '40-50%', topPerformers: '60-70%' },
        responseRate: { average: '20-30%', topPerformers: '40-50%' }
      }
    },
    conversionDrivers: {
      ranked: [
        { factor: 'Personalization depth', impact: '+600-800%', effort: 'High', ROI: 'Excellent' },
        { factor: 'Response speed', impact: '+400%', effort: 'Medium', ROI: 'Excellent' },
        { factor: 'Multi-touch cadence', impact: '+70%', effort: 'Medium', ROI: 'Very Good' },
        { factor: 'Subject line optimization', impact: '+50%', effort: 'Low', ROI: 'Excellent' },
        { factor: 'Social proof inclusion', impact: '+45%', effort: 'Low', ROI: 'Very Good' },
        { factor: 'Question-based close', impact: '+38%', effort: 'Low', ROI: 'Good' },
        { factor: 'Day/time optimization', impact: '+25%', effort: 'Low', ROI: 'Good' }
      ]
    },
    industrySpecificInsights: {
      B2BSaaS: { avgResponseRate: '11%', bestDay: 'Wednesday', bestTime: '10 AM', avgTouchesToClose: '7.4' },
      enterprise: { avgResponseRate: '6%', bestDay: 'Tuesday', bestTime: '6 AM', avgTouchesToClose: '11.2', keyTactic: 'Multi-threading' },
      SMB: { avgResponseRate: '18%', bestDay: 'Thursday', bestTime: '12 PM', avgTouchesToClose: '5.1', keyTactic: 'Speed and simplicity' }
    }
  }
};
