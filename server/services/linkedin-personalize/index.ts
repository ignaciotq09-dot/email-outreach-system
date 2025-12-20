import OpenAI from "openai";
import type { Contact } from "@shared/schema";

const openai = new OpenAI();

export interface LinkedInPersonalizationOptions {
  baseMessage: string;
  contact: Contact;
  messageType: 'connection_request' | 'direct_message' | 'follow_up';
  senderName?: string;
  writingStyle?: string;
}

export interface LinkedInMessageResult {
  message: string;
  charCount: number;
  isBlankRecommended: boolean;
  reason?: string;
}

export async function personalizeLinkedInMessage(options: LinkedInPersonalizationOptions): Promise<LinkedInMessageResult> {
  const { baseMessage, contact, messageType, senderName, writingStyle } = options;
  const firstName = contact.name.split(' ')[0];
  
  if (messageType === 'connection_request') {
    const hasRealContext = hasGenuinePersonalizationContext(contact);
    if (!hasRealContext) {
      return { message: '', charCount: 0, isBlankRecommended: true, reason: 'Blank requests have 55-68% acceptance vs 28-45% with generic notes. Send blank for higher acceptance.' };
    }
  }
  
  const maxChars = messageType === 'connection_request' ? 300 : 400;
  const systemPrompt = buildLinkedInSystemPrompt(messageType, writingStyle);
  const userPrompt = buildLinkedInUserPrompt(baseMessage, contact, firstName, messageType, maxChars);
  
  try {
    const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.7, max_tokens: 300 });
    let message = response.choices[0]?.message?.content?.trim() || baseMessage;
    if (message.length > maxChars) { message = message.substring(0, maxChars - 3) + '...'; }
    return { message, charCount: message.length, isBlankRecommended: false };
  } catch (error) {
    console.error('[LinkedInPersonalize] Error:', error);
    return { message: baseMessage.substring(0, maxChars), charCount: Math.min(baseMessage.length, maxChars), isBlankRecommended: false };
  }
}

function hasGenuinePersonalizationContext(contact: Contact): boolean {
  if (contact.notes && contact.notes.length > 20) return true;
  if (contact.industry && contact.position) return true;
  return false;
}

function buildLinkedInSystemPrompt(messageType: string, writingStyle?: string): string {
  const styleGuide = getLinkedInStyleGuide(writingStyle);
  return `You are an elite LinkedIn copywriter trained in sales psychology.

## MESSAGE TYPE: ${messageType.toUpperCase().replace('_', ' ')}
${messageType === 'connection_request' ? 'GOAL: Get them to accept the connection. Short, value-focused, no pitch.' : 'GOAL: Start a conversation. Value-first approach, end with soft question.'}

## WRITING STYLE
${styleGuide}

## 🚫 ABSOLUTE NO-FABRICATION RULES:
1. NEVER invent company news, achievements, or funding announcements
2. NEVER fabricate mutual connections or referrals
3. NEVER make up specific metrics, percentages, or results
4. NEVER assume competitor info or job details not provided
5. If data is missing, use generic but professional patterns

## LINKEDIN PSYCHOLOGY (Research-Backed):
- Blank connection requests: 55-68% acceptance rate
- Generic notes ("I'd love to connect"): 28-45% acceptance rate
- Personalized with real context: 45-60% acceptance rate
- DM length under 400 chars performs best
- Value-first, no pitch in first message
- End with question to encourage response

## HARD RULES:
${messageType === 'connection_request' ? '- Under 300 characters\n- No sales pitch\n- Focus on genuine reason for connecting' : '- Under 400 characters\n- Lead with value, not ask\n- End with soft question'}
- Sound human, not automated
- NO emojis unless matches their style

Return ONLY the message text.`;
}

function buildLinkedInUserPrompt(baseMessage: string, contact: Contact, firstName: string, messageType: string, maxChars: number): string {
  const companyInfo = contact.company ? `- Company: ${contact.company}` : '- Company: Not provided (do NOT make one up)';
  const roleInfo = contact.position ? `- Role: ${contact.position}` : '- Role: Not provided';
  const industryInfo = contact.industry ? `- Industry: ${contact.industry}` : '- Industry: Not specified';
  const notesInfo = contact.notes ? `- Notes (use ONLY if relevant): ${contact.notes}` : '- No additional notes provided';
  
  return `Create a ${messageType.replace('_', ' ')} for ${contact.name}:

CORE MESSAGE TO ADAPT:
${baseMessage}

AVAILABLE DATA (ONLY USE THESE - NEVER FABRICATE):
- First Name: ${firstName}
${companyInfo}
${roleInfo}
${industryInfo}
${notesInfo}

CONSTRAINTS:
- Maximum ${maxChars} characters
- ${messageType === 'connection_request' ? 'No pitch, just genuine reason to connect' : 'Value-first, end with soft question'}
- If company/role is missing, use generic professional language

CRITICAL: Do NOT invent details. If context is limited, keep it simple and authentic.`;
}

function getLinkedInStyleGuide(writingStyle?: string): string {
  const guides: Record<string, string> = {
    'professional-adult': 'Confident peer-to-peer tone. Direct and respectful.',
    'professional-humble': 'Curious and respectful. Show genuine interest in their work.',
    'friendly-conversational': 'Warm and approachable. Like a friendly colleague.',
    'thoughtful-educated': 'Thoughtful and specific. Reference relevant context.',
    'strong-confident': 'Bold and direct. Clear about intent.',
    'precise-technical': 'Specific and clear. Focus on relevant details.'
  };
  return guides[writingStyle || 'professional-adult'] || guides['professional-adult'];
}

export async function generateLinkedInVariants(baseMessage: string, contact: Contact, messageType: 'connection_request' | 'direct_message'): Promise<LinkedInMessageResult[]> {
  const variants: LinkedInMessageResult[] = [];
  const styles = ['professional-adult', 'friendly-conversational', 'thoughtful-educated'];
  
  for (const style of styles) {
    try {
      const result = await personalizeLinkedInMessage({ baseMessage, contact, messageType, writingStyle: style });
      variants.push(result);
    } catch (error) {
      console.error(`[LinkedInPersonalize] Error generating ${style} variant:`, error);
    }
  }
  
  return variants;
}
