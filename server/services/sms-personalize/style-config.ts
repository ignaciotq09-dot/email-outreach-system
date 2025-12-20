export const OPENER_TEMPLATES = {
  curiosity: ["{firstName}, quick thought for you...", "{firstName} - noticed something interesting...", "Quick thought for you {firstName}...", "{firstName}, curious about something..."],
  question: ["{firstName}, quick question for you?", "{firstName} - how are you handling this?", "Curious {firstName} - what's your approach to this?", "{firstName}, 2 min question for you?"],
  direct: ["{firstName}, idea for you. Worth 5 mins?", "{firstName} - something that might help. Interested?", "Hey {firstName}, quick thought. Chat this week?", "{firstName}, got something for you. Free tomorrow?"],
  'social-proof': ["{firstName}, seeing others in your space benefit from this", "{firstName} - thought of you when I saw this working", "Worth exploring {firstName}?", "{firstName}, could work for you too"],
};

export const NO_FABRICATION_TEMPLATES = {
  withCompany: ["{firstName}, quick thought about {company}?", "{firstName} - idea for {company}. Worth exploring?"],
  withoutCompany: ["{firstName}, quick thought for you?", "{firstName} - have an idea. Worth a chat?"],
  withTrigger: ["{firstName}, saw {trigger} - got an idea for you"],
  withoutTrigger: ["{firstName}, something you might find useful..."]
};

export const SMS_PSYCHOLOGY_RULES = `
## SMS PSYCHOLOGY (Research-Backed):
- Under 100 chars = 2-5x higher response rate (AIM FOR THIS)
- Lead with VALUE in first 5-10 words
- End with question mark (proven higher engagement)
- Single CTA only
- NO emojis (drops char limit to 70)

## 🚫 NO-FABRICATION RULES:
- ONLY use data provided below - NEVER invent details
- Do NOT make up company news, achievements, or trigger events
- Do NOT fabricate mutual connections or referrals
- If company/trigger is missing, use generic patterns
`;


export function getStyleInstruction(writingStyle?: string): string {
  const styleMap: Record<string, string> = {
    'professional-adult': 'Tone: Confident peer-to-peer. No pleasantries, just value.',
    'professional-humble': 'Tone: Genuinely curious, not salesy. Ask questions.',
    'friendly-conversational': 'Tone: Like texting a work friend. Warm but purposeful.',
    'thoughtful-educated': 'Tone: Show you did your homework. Reference something specific.',
    'poetic-lyrical': 'Tone: Memorable and distinct. One vivid image.',
    'inspiring-uplifting': 'Tone: Energizing and possibility-focused.',
    'strong-confident': 'Tone: Bold and assertive. No hedging.',
    'precise-technical': 'Tone: Specific and quantified. Numbers and facts.',
  };
  return styleMap[writingStyle || 'friendly-conversational'] || styleMap['friendly-conversational'];
}

export function getReadableStyleName(writingStyle?: string): string {
  const nameMap: Record<string, string> = {
    'professional-adult': 'Professional & Confident',
    'professional-humble': 'Professional & Humble',
    'friendly-conversational': 'Friendly & Conversational',
    'thoughtful-educated': 'Thoughtful & Educated',
    'poetic-lyrical': 'Expressive & Memorable',
    'inspiring-uplifting': 'Inspiring & Uplifting',
    'strong-confident': 'Strong & Confident',
    'precise-technical': 'Precise & Technical',
  };
  return nameMap[writingStyle || 'friendly-conversational'] || 'Friendly & Conversational';
}

export function getHookInstructions(hookType: string, warmth: string): string {
  const warmthContext = warmth === 'hot' ? 'They know you - be direct.' : warmth === 'warm' ? "They've engaged before - remind them." : "They don't know you - create curiosity.";
  return `${warmthContext}\nYour hook must:\n1. Start with their FIRST NAME\n2. Create immediate intrigue in 7-10 words\n3. Make them NEED to read the rest`;
}

export function getHookTypeGuidance(hookType: string): string {
  const guidance: Record<string, string> = {
    'curiosity': `CREATE CURIOSITY: Hint at something interesting without revealing it all.`,
    'question': `ASK A QUESTION: Engage them by asking about their world.`,
    'direct': `BE DIRECT: Lead with clear value, no fluff.`,
    'social-proof': `USE SOCIAL PROOF: Reference others' success.`,
  };
  return guidance[hookType] || guidance['direct'];
}

export function getQuestionEndingInstruction(warmth: string): string {
  if (warmth === 'hot') return 'End with a direct question: "Quick call tomorrow?"';
  if (warmth === 'warm') return 'End with a soft question: "Worth a quick chat?"';
  return 'End with a low-commitment question: "Worth exploring?"';
}
