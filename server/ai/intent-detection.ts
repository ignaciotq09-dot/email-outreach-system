import { callOpenAIFast } from "./openai-client";

export interface IntentDetectionResult {
  intentType: 'booking' | 'interested' | 'question' | 'not_interested' | 'unsubscribe' | 'out_of_office' | 'other';
  confidence: number;
  shouldAutoReply: boolean;
  reasoning: string;
}

const BOOKING_INTENT_PHRASES = [
  "let's meet",
  "let's chat",
  "let's talk",
  "let's schedule",
  "let's set up",
  "i'm interested",
  "i am interested",
  "sounds good",
  "sounds great",
  "yes, let's",
  "book me",
  "schedule a call",
  "set up a meeting",
  "when are you free",
  "when can we meet",
  "i'd like to learn more",
  "i would like to learn more",
  "let's do it",
  "count me in",
  "sign me up",
  "i'm in",
  "absolutely",
  "definitely interested",
  "yes please",
  "sure, let's",
  "happy to chat",
  "would love to chat",
  "let's connect",
  "looking forward to connecting",
];

const NOT_INTERESTED_PHRASES = [
  "not interested",
  "no thanks",
  "no thank you",
  "please remove",
  "unsubscribe",
  "stop emailing",
  "don't contact",
  "not a good fit",
  "we're all set",
  "we are all set",
  "not looking",
  "already have",
  "not for us",
];

const QUESTION_INDICATORS = [
  "how does",
  "what is",
  "can you explain",
  "what's the price",
  "how much",
  "what are the",
  "tell me more about",
  "could you clarify",
  "what do you mean",
  "?",
];

export function quickIntentCheck(content: string): { isLikelyBooking: boolean; isLikelyNegative: boolean; hasQuestion: boolean } {
  const lowerContent = content.toLowerCase();
  
  const isLikelyBooking = BOOKING_INTENT_PHRASES.some(phrase => lowerContent.includes(phrase));
  const isLikelyNegative = NOT_INTERESTED_PHRASES.some(phrase => lowerContent.includes(phrase));
  const hasQuestion = QUESTION_INDICATORS.some(indicator => lowerContent.includes(indicator));
  
  return { isLikelyBooking, isLikelyNegative, hasQuestion };
}

export async function detectReplyIntent(replyContent: string): Promise<IntentDetectionResult> {
  const quickCheck = quickIntentCheck(replyContent);
  
  if (quickCheck.isLikelyNegative) {
    return {
      intentType: 'not_interested',
      confidence: 85,
      shouldAutoReply: false,
      reasoning: 'Contains negative intent phrases'
    };
  }
  
  if (quickCheck.isLikelyBooking && !quickCheck.hasQuestion) {
    const confidence = 92;
    return {
      intentType: 'booking',
      confidence,
      shouldAutoReply: confidence >= 90,
      reasoning: 'Clear positive booking intent detected'
    };
  }
  
  try {
    const systemPrompt = `You are an email intent classifier for a sales outreach system. Analyze the prospect's reply and determine their intent.

IMPORTANT: Only classify as "booking" if the prospect is CLEARLY saying YES to meeting. They must be explicitly agreeing to meet, talk, or schedule a call.

Output JSON with:
- intentType: one of "booking", "interested", "question", "not_interested", "unsubscribe", "out_of_office", "other"
- confidence: 0-100 (only 90+ means absolutely certain)
- shouldAutoReply: true ONLY if intentType is "booking" AND confidence >= 90
- reasoning: brief explanation

Examples of "booking" (should auto-reply):
- "Yes, let's chat!" → booking, 95, true
- "Sounds good, I'm free next week" → booking, 94, true
- "Let's meet! When works for you?" → booking, 93, true
- "I'd love to learn more, let's schedule a call" → booking, 92, true

Examples that are NOT "booking" (should NOT auto-reply):
- "Maybe, what's the pricing?" → question, 75, false
- "Interesting, tell me more" → interested, 70, false
- "Not interested" → not_interested, 90, false
- "I'm out of office" → out_of_office, 95, false`;

    const response = await callOpenAIFast([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyze this reply:\n\n"${replyContent}"` }
    ], { responseFormat: { type: "json_object" }, maxTokens: 200 });

    const parsed = JSON.parse(response);
    
    return {
      intentType: parsed.intentType || 'other',
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      shouldAutoReply: parsed.shouldAutoReply === true && parsed.confidence >= 90 && parsed.intentType === 'booking',
      reasoning: parsed.reasoning || 'AI analysis'
    };
  } catch (error) {
    console.error('[IntentDetection] Error analyzing intent:', error);
    
    if (quickCheck.isLikelyBooking) {
      return {
        intentType: 'interested',
        confidence: 70,
        shouldAutoReply: false,
        reasoning: 'AI error - defaulting to interested based on keywords'
      };
    }
    
    return {
      intentType: 'other',
      confidence: 50,
      shouldAutoReply: false,
      reasoning: 'Could not determine intent'
    };
  }
}

export function generateAutoReplyMessage(
  contactName: string,
  bookingLink: string,
  customMessage?: string
): string {
  const firstName = contactName?.split(' ')[0] || '';
  
  if (customMessage) {
    return customMessage
      .replace('{{name}}', firstName)
      .replace('{{booking_link}}', bookingLink)
      .replace('{{first_name}}', firstName);
  }
  
  return `${firstName ? `${firstName}, p` : 'P'}erfect! Let's find a time that works for you.

Here's my calendar - pick any slot that's convenient: ${bookingLink}

Looking forward to our conversation!`;
}
