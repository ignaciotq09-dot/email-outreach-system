export const FOLLOW_UP_STRATEGIES = {
  timing: { 
    sequence: [
      { day: 3, type: 'gentle_reminder', responseBoost: '+49%', cognitiveBias: 'zeigarnik' }, 
      { day: 7, type: 'add_value', responseBoost: '+25%', cognitiveBias: 'reciprocity' }, 
      { day: 11, type: 'social_proof', responseBoost: '+15%', cognitiveBias: 'socialProof' },
      { day: 16, type: 'different_angle', responseBoost: '+12%', cognitiveBias: 'lossAversion' }, 
      { day: 23, type: 'breakup', responseBoost: '+33%', cognitiveBias: 'scarcity' }
    ], 
    bestTime: { sameTimeAsOriginal: '+15% response', morningIfOriginalAfternoon: '+12% response', varyByTimezone: true },
    optimalHours: { morning: [10, 11], afternoon: [13, 14] },
    bestDays: ['tuesday', 'thursday']
  },
  contentProgression: {
    sequence1: { tone: 'friendly_reminder', structure: 'Reference original + Quick value + Soft CTA', patterns: ['Just wanted to make sure this didn\'t get buried', 'Quick follow-up on my previous note', 'Circling back on this'], psychology: 'Zeigarnik effect - unfinished business', noFabricationNote: 'Reference only the actual original message content' },
    sequence2: { tone: 'add_value', structure: 'New insight + Social proof + Different CTA', patterns: ['Thought you might find this relevant', 'Just helped a similar company with same issue', 'New development you should know about'], psychology: 'Reciprocity - give before asking', noFabricationNote: 'Only reference real case studies if user provided them' },
    sequence3: { tone: 'social_proof', structure: 'Others\' success + Relevance + Question', patterns: ['Other professionals in your role are seeing...', 'Companies in your space are focusing on...', 'Industry trend worth noting...'], psychology: 'Social proof - follow similar others', noFabricationNote: 'Use general industry patterns, not fabricated specific examples' },
    sequence4: { tone: 'different_angle', structure: 'Reframe + New perspective + Question', patterns: ['Maybe I misunderstood your priorities', 'Different thought on this', 'What if we approached it this way instead'], psychology: 'Loss aversion - what they might be missing', noFabricationNote: 'Frame as potential missed opportunity, not fabricated urgency' },
    breakup: { tone: 'final_professional', structure: 'Acknowledge no interest + Leave door open + Stop contact', patterns: ['Seems like this isn\'t a priority right now', 'I\'ll stop reaching out', 'Feel free to reconnect when timing is better'], psychology: 'Reverse psychology - taking away availability', noFabricationNote: 'Genuine breakup, no fake deadlines' }
  },
  subjectProgression: { sequence1: 'Re: {original_subject}', sequence2: 'Quick thought on {topic}', sequence3: 'Different angle on {topic}', sequence4: 'Last thought on this', breakup: 'Should I close your file?', variations: { questionBased: ['Still interested?', 'Wrong timing?', 'Not a fit?'], valueBased: ['New insight on {topic}', 'Quick win idea', 'Thought you\'d want to see this'], urgencyBased: ['Moving on', 'Last chance', 'Closing the loop'] } },
  personalizationEscalation: { 
    level1: { description: 'Basic - Name and company only', dataRequired: ['name'], useWhen: 'No additional context provided' }, 
    level2: { description: 'Role-aware - Add job title context', dataRequired: ['name', 'company', 'jobTitle'], useWhen: 'Have job title info' }, 
    level3: { description: 'Pain-focused - Reference specific challenge', dataRequired: ['name', 'company', 'painPoint'], useWhen: 'User mentioned specific pain point' }, 
    level4: { description: 'Trigger-based - Reference recent event', dataRequired: ['name', 'company', 'triggerEvent'], useWhen: 'User provided trigger event info' }, 
    level5: { description: 'Hyper-personal - Mutual connection or deep context', dataRequired: ['name', 'company', 'mutualConnection'], useWhen: 'User provided referral/connection info' }
  },
  noFabricationRules: {
    critical: 'NEVER fabricate personalization data in follow-ups',
    forbidden: ['Invented company news', 'Fake deadlines', 'Made-up metrics', 'Fabricated referrals', 'Assumed competitor info'],
    alternative: 'Use genuine patterns like "following up", "still thinking about this", "wanted to check in"'
  },
  multiChannelCoordination: { 
    emailFirst: 'Primary channel for initial outreach', 
    linkedInAfterNoResponse: 'After 2 emails with no response (Day 7)', 
    smsForWarmLeads: 'After engagement signal (open/click)', 
    optimalSequence: [
      { day: 1, channel: 'email', action: 'Initial outreach' },
      { day: 3, channel: 'email', action: 'Follow-up 1' },
      { day: 5, channel: 'linkedin', action: 'Connection request (blank)' },
      { day: 7, channel: 'email', action: 'Follow-up 2 (value-add)' },
      { day: 11, channel: 'linkedin', action: 'DM if connected' },
      { day: 16, channel: 'email', action: 'Follow-up 3 (different angle)' },
      { day: 23, channel: 'email', action: 'Breakup email' }
    ]
  }
};
