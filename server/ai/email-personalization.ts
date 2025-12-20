import type { EmailPreferences } from "@shared/schema";
import { callOpenAIFast, callOpenAIWithTimeout, type EmailVariant, type PersonalizeEmailParams } from "./openai-client";

// Personalize a selected variant for a specific contact
export async function personalizeVariantForContact(
  variant: EmailVariant,
  contactName: string,
  contactCompany: string | null,
  contactPronoun: string,
  contactNotes?: string,
  preferences?: EmailPreferences | null
): Promise<{ subject: string; body: string }> {
  const senderName = preferences?.senderName || 'Ignacio Torres';
  const senderPhone = preferences?.senderPhone || '786-572-4981';

  const companyInfo = contactCompany
    ? `- Company: ${contactCompany}`
    : '- Company: Not provided';

  const companyInstructions = contactCompany
    ? `2. **MANDATORY**: Reference ${contactCompany} at least once in the email body. You can use either:
   - The company name directly: "${contactCompany}"
   - The phrase "your company" or "your team at ${contactCompany}"
   - Example: "Given your work at ${contactCompany}..." or "I noticed your company's approach to..."`
    : `2. Keep the personalization natural - no company information available for this contact`;

  const companyRequirement = contactCompany
    ? `- ${contactCompany} MUST appear in the email at least once - this is not optional.`
    : `- No company information is available, so focus on personalizing with the name only.`;

  const prompt = `You are personalizing a pre-written email template. DO NOT REWRITE IT.

Template:
Subject: ${variant.subject}
Body: ${variant.body}

Recipient:
- Name: ${contactName}
${companyInfo}
- Title: ${contactPronoun} (Mr./Ms./Mx./Dr.)
${contactNotes ? `- Notes: ${contactNotes}` : ''}

Sender (add at end):
- ${senderName}
- ${senderPhone}

🚨 CRITICAL RULES - FOLLOW EXACTLY:
1. **USE THE EXACT TEMPLATE TEXT** - Do NOT rewrite or rephrase the email body
2. **ONLY make these specific changes:**
   a) Add "${contactPronoun} ${contactName}," at the very beginning
   ${contactCompany ? `b) INSERT "${contactCompany}" naturally into the email body at least once. Options:
      - If the template has phrases like "your company" or "your team", add "at ${contactCompany}" after them
      - If the template mentions "your work", you can add "at ${contactCompany}" after it
      - If none of the above, add a brief natural reference like "at ${contactCompany}" after mentioning their role/work
      - Example: "your work" → "your work at ${contactCompany}"
      - Example: "your team" → "your team at ${contactCompany}"` : 'b) Keep all text exactly as written'}
   c) Add signature block at the end: "${senderName}\n${senderPhone}"
3. **DO NOT:**
   - Add new sentences or information beyond inserting the company name
   - Rephrase or "improve" the existing text
   - Add details from notes unless explicitly mentioned in template
   - Change the tone, style, or wording
   - FABRICATE company news, achievements, or trigger events not in the template
   - INVENT mutual connections or referrals
   - MAKE UP specific metrics, dates, or times not in the original
4. **The subject line** can stay the same or be lightly personalized (add their name if relevant)

Example:
Template: "I enjoyed our chat about marketing. Want to meet Tuesday?"
Output: "${contactPronoun} ${contactName}, I enjoyed our chat about marketing. Want to meet Tuesday?\n\n${senderName}\n${senderPhone}"

Format response as JSON:
{
  "subject": "subject line (same or lightly personalized)",
  "body": "EXACT template text with name prefix and signature at end"
}`;

  try {
    console.log('[personalizeVariantForContact] Personalizing for:', contactName);
    console.log('[personalizeVariantForContact] Input variant body preview:', variant.body.substring(0, 150));
    const startTime = Date.now();

    // Use fast model for ~4x speed improvement (gpt-4o-mini)
    const content = await callOpenAIFast(
      [
        {
          role: "system",
          content: "You are an expert at personalizing professional emails for specific recipients while maintaining the core message."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        responseFormat: { type: "json_object" },
        maxTokens: 2048, // Reduced from 8192 - emails are short
      }
    );
    console.log(`[personalizeVariantForContact] Fast model completed in ${Date.now() - startTime}ms`);

    const result = JSON.parse(content);
    console.log('[personalizeVariantForContact] AI response body preview:', result.body.substring(0, 150));
    console.log('[personalizeVariantForContact] AI response body end:', result.body.substring(result.body.length - 150));

    // Ensure signature block is always appended (don't rely solely on AI)
    // Professional email signature format with proper spacing
    const signatureBlock = `\n\nBest regards,\n\n${senderName}\n${senderPhone}`;

    // Check if signature is already present (to avoid duplication)
    // Look for "best regards" OR both name+phone to catch partial signatures
    const bodyLower = result.body.toLowerCase();
    const hasClosing = bodyLower.includes('best regards') ||
      bodyLower.includes('regards,') ||
      bodyLower.includes('sincerely');

    // For phone detection, strip ALL non-digits from both the phone number AND the body
    const phoneDigitsOnly = senderPhone.replace(/[^0-9]/g, '');
    const bodyDigitsOnly = bodyLower.replace(/[^0-9]/g, '');
    const hasNameAndPhone = bodyLower.includes(senderName.toLowerCase()) &&
      bodyDigitsOnly.includes(phoneDigitsOnly);

    console.log('[personalizeVariantForContact] Signature detection - hasClosing:', hasClosing, 'hasNameAndPhone:', hasNameAndPhone);

    // Only append signature if there's no closing at all, or if closing exists but no name+phone
    let finalBody = result.body;
    if (!hasClosing && !hasNameAndPhone) {
      // No signature at all - add full signature
      console.log('[personalizeVariantForContact] Adding full signature (no closing found)');
      finalBody = result.body + signatureBlock;
    } else if (hasClosing && !hasNameAndPhone) {
      // Has closing but missing name/phone - add just name and phone
      console.log('[personalizeVariantForContact] Adding name+phone only (closing exists)');
      finalBody = result.body + `\n\n${senderName}\n${senderPhone}`;
    } else {
      console.log('[personalizeVariantForContact] Signature complete - not adding anything');
    }

    console.log('[personalizeVariantForContact] Final body end:', finalBody.substring(finalBody.length - 150));

    // Verify company was included (for debugging) - only if company is provided
    if (contactCompany) {
      const companyLower = contactCompany.toLowerCase();
      const hasCompany = finalBody.toLowerCase().includes(companyLower) ||
        finalBody.toLowerCase().includes('your company');

      if (!hasCompany) {
        console.warn(`[personalizeVariantForContact] WARNING: Company "${contactCompany}" not found in personalized email for ${contactName}`);
        console.warn('[personalizeVariantForContact] Email body:', finalBody.substring(0, 200));
      } else {
        console.log(`[personalizeVariantForContact] ✓ Successfully personalized for ${contactName} with company ${contactCompany}`);
      }
    } else {
      console.log(`[personalizeVariantForContact] ✓ Successfully personalized for ${contactName} (no company info)`);
    }

    return {
      subject: result.subject,
      body: finalBody,
    };
  } catch (error: any) {
    console.error('[personalizeVariantForContact] Error:', error.message);
    throw new Error(`Failed to personalize email: ${error.message}`);
  }
}

// Keep old function for backward compatibility during transition
export async function personalizeEmail({
  baseMessage,
  writingStyle,
  contactName,
  contactCompany,
  contactNotes,
}: PersonalizeEmailParams) {
  const styleDescription = writingStyle === 'professional-adult'
    ? 'Write confidently, directly, assuming expertise. Be professional and assertive.'
    : 'Write as someone learning, asking questions, showing curiosity. Be professional but humble and open.';

  const prompt = `You are writing an email from me. Here is my base message:
"${baseMessage}"

Writing Style: ${writingStyle}
${styleDescription}

Recipient Information:
- Name: ${contactName}
- Company: ${contactCompany}
${contactNotes ? `- Notes: ${contactNotes}` : ''}

🚨 CRITICAL RULES - FOLLOW EXACTLY:
1. **ADDRESS THE RECIPIENT DIRECTLY**: Write TO ${contactName} using "you/your". NEVER write about them in third person.
   - ✅ CORRECT: "I noticed your work at ${contactCompany}..." or "Your team's approach to..."
   - ❌ WRONG: "I noticed their work..." or "His company specializes in..."
2. **FOLLOW MY INSTRUCTIONS EXACTLY**: The base message above is what I want to say. DO NOT add content I didn't mention.
3. **DO NOT GO ROGUE**: Stay faithful to my intent. Don't add random topics, pitches, or offers I didn't ask for.
4. **USE SIMPLE, NATURAL LANGUAGE**: 
   - Write like a real person, not a corporate robot
   - Use everyday words - avoid complicated vocabulary, jargon, or overly formal phrases
   - Keep it conversational and human-sounding
   - ❌ WRONG: "leverage synergies", "facilitate", "utilize", "endeavor", "pursuant to"
   - ✅ CORRECT: "work together", "help", "use", "try", "about"
5. **NEVER FABRICATE DETAILS**:
   - Do NOT invent company news, funding announcements, or achievements I didn't mention
   - Do NOT make up mutual connections or referrals
   - Do NOT assume specific metrics, dates, or times I didn't provide
   - If notes don't mention specific details, use general but effective patterns instead

Generate a personalized email that:
1. Addresses them by first name using "you"
2. **MANDATORY**: References ${contactCompany} at least once in the first 2 sentences. Use either:
   - The company name directly: "${contactCompany}"
   - The phrase "your company" or "your team at ${contactCompany}"
   - Example: "Given your work at ${contactCompany}..." or "I noticed your company's role in..."
3. Incorporates any relevant information from the notes
4. Keeps the core message but adapts tone and details
5. Adds a relevant subject line
6. Ends with appropriate call-to-action

CRITICAL: ${contactCompany} MUST appear in the email - this is not optional.

Format response as JSON:
{
  "subject": "subject line here",
  "body": "email body here"
}`;

  try {
    console.log('[personalizeEmail] Personalizing for:', contactName);
    const startTime = Date.now();

    // Use fast model for ~4x speed improvement (gpt-4o-mini)
    const content = await callOpenAIFast(
      [
        {
          role: "system",
          content: "You are an expert email writer who creates personalized, professional emails."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        responseFormat: { type: "json_object" },
        maxTokens: 2048, // Reduced from 8192 - emails are short
      }
    );
    console.log(`[personalizeEmail] Fast model completed in ${Date.now() - startTime}ms`);

    const result = JSON.parse(content);
    console.log('[personalizeEmail] Successfully personalized for', contactName);
    return {
      subject: result.subject,
      body: result.body,
    };
  } catch (error: any) {
    console.error('[personalizeEmail] Error:', error.message);
    throw new Error(`Failed to personalize email: ${error.message}`);
  }
}
