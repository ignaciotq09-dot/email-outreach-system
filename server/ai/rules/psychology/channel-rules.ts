export const CHANNEL_PSYCHOLOGY_RULES = {
  email: {
    optimalLength: { min: 50, max: 125, unit: 'words' },
    subjectLine: { maxChars: 50, optimalWords: 4, maxWords: 7, formulas: ['curiosity_gap', 'question', 'number', 'personalized', 'pattern_interrupt'] },
    openingLine: { forbidden: ['I hope this finds you well', 'My name is', 'I wanted to reach out', 'I\'d love to connect', 'Dear Sir/Madam'], recommended: ['Saw your...', 'Congrats on...', 'Your work on...', 'Quick question about...', 'Most {role}s I talk to...'] },
    structure: { paragraphMaxSentences: 3, totalParagraphs: { min: 2, max: 4 }, singleCTAOnly: true },
    timing: { bestDays: ['tuesday', 'thursday'], bestHours: { morning: [10, 11], afternoon: [13, 14] }, avoidDays: ['monday', 'friday'] },
    followUpSequence: { optimalTouches: { min: 4, max: 6 }, spacing: [{ touch: 1, daysAfter: 0 }, { touch: 2, daysAfter: 3 }, { touch: 3, daysAfter: 7 }, { touch: 4, daysAfter: 11 }, { touch: 5, daysAfter: 16 }, { touch: 6, daysAfter: 23 }] },
    benchmarks: { averageOpenRate: 27.7, goodOpenRate: 36, excellentOpenRate: 45, averageResponseRate: 5.1, goodResponseRate: 10, excellentResponseRate: 15 }
  },
  sms: {
    optimalLength: { singleSegment: 160, optimalTarget: 100, withEmoji: 70, multiSegmentCost: 'doubles per segment' },
    structure: { leadWithValue: 'First 5-10 words must convey value', singleCTA: true, linkPlacement: 'end', optOutRequired: true },
    timing: { b2bBestHours: { morning: [9, 10, 11, 12] }, b2cBestHours: { evening: [17, 18, 19, 20, 21] }, responseWindow: '15 minutes for max conversions' },
    psychologyTriggers: { fomo: ['Ends tonight', 'Only X left', 'Last chance'], exclusivity: ['VIP access', 'Members only', 'Exclusive'], urgency: ['Today only', 'Expires in X hours'] },
    forbidden: { coldText: 'Never cold-text without prior contact', frequency: 'Max 1-2 per week', emojiOveruse: 'Drops limit to 70 chars' },
    benchmarks: { openRate: 98, averageConversionRate: 25, responseTimeMinutes: 15 }
  },
  linkedin: {
    connectionRequest: { blankAcceptanceRate: { min: 55, max: 68 }, noteAcceptanceRate: { min: 28, max: 45 }, recommendation: 'Blank requests outperform notes for cold outreach', noteMaxChars: 300 },
    directMessage: { maxChars: 400, optimalChars: 200, structure: 'Value-first, no pitch in first message' },
    timing: { bestDays: ['tuesday', 'wednesday', 'thursday'], bestHours: { preMeeting: [8, 9, 10], endOfDay: [16, 17, 18] } },
    warmUp: { beforeConnect: ['Comment on their posts', 'React to their content', 'View their profile'], impact: 'Significantly increases acceptance' },
    forbidden: { salesPitchFirstMessage: true, genericNotes: true, longNotes: true },
    benchmarks: { blankRequestAcceptance: 60, warmRequestAcceptance: 70, dmReplyRate: 25 }
  }
};

export const FRAMEWORK_SELECTION_RULES = {
  aida: { name: 'AIDA (Attention-Interest-Desire-Action)', useWhen: ['Generic cold outreach', 'Minimal personalization data', 'Structured pitches', 'Multiple value points'], dataRequired: ['name'], structure: { attention: 'Hook with question/stat', interest: 'Common industry pain', desire: 'Outcome/benefit', action: 'Simple CTA' } },
  pas: { name: 'PAS (Problem-Agitate-Solution)', useWhen: ['Known pain point', 'Follow-ups where urgency matters', 'Clear challenge identified'], dataRequired: ['name', 'painPoint'], structure: { problem: 'Their specific challenge', agitate: 'What it costs them', solution: 'How you help' } },
  bab: { name: 'BAB (Before-After-Bridge)', useWhen: ['Transformation story needed', 'Vision/efficiency pitches', 'Full context available'], dataRequired: ['name', 'company', 'situation'], structure: { before: 'Their current struggle', after: 'Desired state', bridge: 'Your solution connects them' } }
};

export const DATA_TIER_RULES = {
  tier1: { name: 'Minimal', dataAvailable: ['name'], expectedResponseRate: { min: 5, max: 8 }, recommendedFramework: 'aida', personalizationLevel: 'Name greeting only' },
  tier2: { name: 'Basic', dataAvailable: ['name', 'company', 'jobTitle'], expectedResponseRate: { min: 8, max: 12 }, recommendedFramework: 'aida', personalizationLevel: 'Role-aware messaging' },
  tier3: { name: 'Strong', dataAvailable: ['name', 'company', 'jobTitle', 'painPoint'], expectedResponseRate: { min: 12, max: 18 }, recommendedFramework: 'pas', personalizationLevel: 'Pain-focused messaging' },
  tier4: { name: 'Hyper', dataAvailable: ['name', 'company', 'jobTitle', 'painPoint', 'triggerEvent', 'mutualConnection'], expectedResponseRate: { min: 18, max: 25 }, recommendedFramework: 'bab', personalizationLevel: 'Full contextual personalization' }
};
