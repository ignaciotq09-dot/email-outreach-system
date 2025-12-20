import type { EmailVariant } from '../openai-client';
import { callOpenAIWithTimeout } from '../openai-client';
import type { OptimizationContext } from "./types";
import { detectIntent } from "./intent-detector";
import { PSYCHOLOGY_OPTIMIZATION_RULES } from '../rules/psychology-rules';

export async function applyPsychologyOptimization(variant: EmailVariant, context: OptimizationContext): Promise<EmailVariant> {
  const intent = context.intent || detectIntent(variant.body);
  let psychologyPrompt = `Apply these psychology optimizations to the email:\n\n`;
  const reciprocity = PSYCHOLOGY_OPTIMIZATION_RULES.techniques.reciprocity; const scarcity = PSYCHOLOGY_OPTIMIZATION_RULES.techniques.scarcity; const authority = PSYCHOLOGY_OPTIMIZATION_RULES.techniques.authority;
  if (intent === 'cold_outreach' || intent === 'value_delivery') { psychologyPrompt += `- ${reciprocity.trigger}: ${reciprocity.implementation}\n`; }
  if (intent === 'follow_up' || intent === 'breakup') { psychologyPrompt += `- ${scarcity.trigger}: ${scarcity.implementation}\n`; }
  if (intent === 'meeting_request') { psychologyPrompt += `- ${authority.trigger}: ${authority.implementation}\n`; }
  try { const response = await callOpenAIWithTimeout([ { role: 'system', content: 'You are an email optimization expert. Return the optimized email as JSON with "subject" and "body" fields.' }, { role: 'user', content: `${psychologyPrompt}\n\nOriginal email:\nSubject: ${variant.subject}\n\nBody: ${variant.body}\n\nReturn optimized email as JSON.` } ], 'gpt-4o-mini', 10000, 0.7); if (response) { try { const jsonMatch = response.match(/\{[\s\S]*\}/); if (jsonMatch) { const optimized = JSON.parse(jsonMatch[0]); return { ...variant, subject: optimized.subject || variant.subject, body: optimized.body || variant.body }; } } catch { return variant; } } return variant; } catch { return variant; }
}
