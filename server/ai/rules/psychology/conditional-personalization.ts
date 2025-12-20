export interface AvailablePersonalizationData {
  name?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  painPoint?: string;
  triggerEvent?: string;
  mutualConnection?: string;
  recentNews?: string;
  companySize?: string;
  notes?: string;
}

export interface PersonalizationTier {
  tier: 1 | 2 | 3 | 4;
  name: 'Minimal' | 'Basic' | 'Strong' | 'Hyper';
  framework: 'aida' | 'pas' | 'bab';
  availableElements: string[];
  expectedResponseRate: { min: number; max: number };
}

export function detectPersonalizationTier(data: AvailablePersonalizationData): PersonalizationTier {
  const availableElements: string[] = [];
  
  if (data.name) availableElements.push('name');
  if (data.company) availableElements.push('company');
  if (data.jobTitle) availableElements.push('jobTitle');
  if (data.industry) availableElements.push('industry');
  if (data.painPoint) availableElements.push('painPoint');
  if (data.triggerEvent) availableElements.push('triggerEvent');
  if (data.mutualConnection) availableElements.push('mutualConnection');
  if (data.recentNews) availableElements.push('recentNews');
  if (data.notes) availableElements.push('notes');

  const hasTriggerOrMutual = data.triggerEvent || data.mutualConnection || data.recentNews;
  const hasPainPoint = data.painPoint;
  const hasCompanyContext = data.company && (data.jobTitle || data.industry);
  
  if (hasTriggerOrMutual && hasPainPoint) {
    return { tier: 4, name: 'Hyper', framework: 'bab', availableElements, expectedResponseRate: { min: 18, max: 25 } };
  } else if (hasPainPoint) {
    return { tier: 3, name: 'Strong', framework: 'pas', availableElements, expectedResponseRate: { min: 12, max: 18 } };
  } else if (hasCompanyContext) {
    return { tier: 2, name: 'Basic', framework: 'aida', availableElements, expectedResponseRate: { min: 8, max: 12 } };
  } else {
    return { tier: 1, name: 'Minimal', framework: 'aida', availableElements, expectedResponseRate: { min: 5, max: 8 } };
  }
}

export function buildConditionalPersonalizationPrompt(data: AvailablePersonalizationData, channel: 'email' | 'sms' | 'linkedin'): string {
  const tier = detectPersonalizationTier(data);
  const sections: string[] = [];

  sections.push(`=== PERSONALIZATION TIER: ${tier.name.toUpperCase()} (Tier ${tier.tier}) ===`);
  sections.push(`Framework: ${tier.framework.toUpperCase()}`);
  sections.push(`Expected Response Rate: ${tier.expectedResponseRate.min}-${tier.expectedResponseRate.max}%\n`);

  sections.push('=== AVAILABLE DATA (ONLY USE THESE - NEVER INVENT) ===');
  if (data.name) sections.push(`✓ Name: ${data.name}`);
  if (data.company) sections.push(`✓ Company: ${data.company}`);
  if (data.jobTitle) sections.push(`✓ Job Title: ${data.jobTitle}`);
  if (data.industry) sections.push(`✓ Industry: ${data.industry}`);
  if (data.painPoint) sections.push(`✓ Pain Point: ${data.painPoint}`);
  if (data.triggerEvent) sections.push(`✓ Trigger Event: ${data.triggerEvent}`);
  if (data.mutualConnection) sections.push(`✓ Mutual Connection: ${data.mutualConnection}`);
  if (data.recentNews) sections.push(`✓ Recent News: ${data.recentNews}`);
  if (data.companySize) sections.push(`✓ Company Size: ${data.companySize}`);
  if (data.notes) sections.push(`✓ Additional Notes: ${data.notes}`);

  sections.push('\n=== PERSONALIZATION RULES ===');
  sections.push('✓ ONLY reference information listed above');
  sections.push('✓ If data is missing, use generic but effective patterns');
  sections.push('✗ NEVER fabricate: company news, mutual connections, specific metrics, dates/times not provided');
  sections.push('✗ NEVER assume: recent achievements, industry challenges not mentioned, competitor info');

  if (tier.tier === 1) {
    sections.push('\n=== TIER 1 STRATEGY (Name Only) ===');
    sections.push('• Use name in greeting');
    sections.push('• Focus on universal industry challenges');
    sections.push('• Lead with curiosity or question hook');
    sections.push('• Rely on value proposition strength, not personalization');
  } else if (tier.tier === 2) {
    sections.push('\n=== TIER 2 STRATEGY (Name + Company/Role) ===');
    sections.push('• Personalize greeting with name');
    sections.push('• Reference company/role naturally (1-2 times)');
    sections.push('• Tailor language to their industry/seniority');
    sections.push('• Use role-appropriate challenges');
  } else if (tier.tier === 3) {
    sections.push('\n=== TIER 3 STRATEGY (Pain Point Known) ===');
    sections.push('• Lead with their specific pain point');
    sections.push('• Use PAS framework: Problem → Agitate → Solution');
    sections.push('• Quantify the cost of the problem if data available');
    sections.push('• Position solution as direct answer to their challenge');
  } else {
    sections.push('\n=== TIER 4 STRATEGY (Full Context) ===');
    sections.push('• Reference trigger event or mutual connection in opening');
    sections.push('• Use BAB framework: Before → After → Bridge');
    sections.push('• Weave multiple personalization points naturally');
    sections.push('• Create highly specific, contextual message');
  }

  const channelRules = getChannelSpecificRules(channel);
  sections.push(`\n=== ${channel.toUpperCase()} CHANNEL RULES ===`);
  sections.push(channelRules);

  return sections.join('\n');
}

function getChannelSpecificRules(channel: 'email' | 'sms' | 'linkedin'): string {
  switch (channel) {
    case 'email':
      return `• Length: 50-125 words optimal
• Subject line: 4-7 words, max 50 characters
• Opening: Lead with THEM, not yourself
• Structure: 2-4 short paragraphs (2-3 sentences each)
• CTA: Single, clear ask
• Avoid: "I hope this finds you well", starting with "I"`;
    case 'sms':
      return `• Length: Under 160 characters (ideally <100)
• Structure: Hook in first 5 words → Value → CTA
• No emojis (drops limit to 70 chars)
• End with question mark
• Link at END only
• Must feel personal, not automated`;
    case 'linkedin':
      return `• Connection request: Consider blank (55-68% acceptance)
• Note: Only add if genuine context exists (<300 chars)
• DM: Under 400 chars, value-first, no pitch in first message
• Warm up: Engage with their content before connecting
• Avoid: Generic "I'd love to connect" notes`;
  }
}

export const NO_FABRICATION_RULES = `
🚫 ABSOLUTE PROHIBITIONS - NEVER DO THESE:

1. NEVER invent company news or achievements
   ❌ "Congrats on your recent Series B" (unless user said this)
   ❌ "I saw your company just launched X" (unless user said this)

2. NEVER fabricate mutual connections
   ❌ "John Smith recommended I reach out" (unless user said this)
   ❌ "We have 5 mutual connections" (unless user said this)

3. NEVER make up specific metrics or dates
   ❌ "30% improvement in Q3" (unless user provided this)
   ❌ "Available Tuesday at 2pm" (unless user said this)
   ✓ "next week" is fine if user said "next week"

4. NEVER assume competitor information
   ❌ "I know you're evaluating [competitor]" (unless user said this)

5. NEVER invent job responsibilities
   ❌ "Managing a team of 50" (unless user provided this)

✅ INSTEAD: Use generic but effective patterns when data is missing
✅ INSTEAD: Focus on value proposition strength
✅ INSTEAD: Ask questions rather than assume facts
`;

export const GENERIC_EFFECTIVE_PATTERNS = {
  withoutPainPoint: ['Most professionals in your role face challenges with...', 'Quick question: Are you currently focused on...?', 'Is [common industry challenge] something on your radar?'],
  withoutCompanyNews: ['I\'ve been following developments in [industry]...', 'Given the trends in [sector]...', 'With everything happening in [market]...'],
  withoutMutualConnection: ['I came across your profile and...', 'Your work caught my attention...', 'I noticed your background in...'],
  withoutSpecificMetrics: ['significant improvement', 'measurable results', 'real impact', 'tangible outcomes'],
  withoutTiming: ['when it makes sense', 'at your convenience', 'when you have a moment', 'this week if you\'re open']
};
