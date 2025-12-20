// Reference: blueprint:javascript_openai_ai_integrations
import OpenAI from "openai";
import type { WritingStyleId } from "@shared/writing-styles";

// Lazy-load OpenAI client - only initialize when actually used
let _openai: OpenAI | null = null;
export function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. AI features are disabled.');
    }
    _openai = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey,
      timeout: 60000,
    });
  }
  return _openai;
}
// Export for backward compatibility - will throw when accessed if no API key
export const openai = new Proxy({} as OpenAI, {
  get(_, prop) {
    return (getOpenAI() as any)[prop];
  }
});

// Fast model for quick generation tasks (emails, short content)
export const FAST_MODEL = "gpt-4o-mini";

// Models to try in order of preference for complex tasks
export const MODELS_TO_TRY = ["gpt-4o", "gpt-4-turbo", "gpt-4"];

// Fast API call using gpt-4o-mini - optimized for speed
export async function callOpenAIFast(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    responseFormat?: { type: "json_object" };
    maxTokens?: number;
  } = {}
): Promise<string> {
  const startTime = Date.now();

  try {
    console.log(`[OpenAI-Fast] Using ${FAST_MODEL}`);

    const completion = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages,
      response_format: options.responseFormat,
      max_completion_tokens: options.maxTokens || 1500,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log(`[OpenAI-Fast] Done in ${Date.now() - startTime}ms`);
    return content;
  } catch (error: any) {
    console.error(`[OpenAI-Fast] Error:`, error.message);
    // Fallback to standard method if fast model fails
    console.log(`[OpenAI-Fast] Falling back to standard models...`);
    return callOpenAIWithTimeout(messages, options);
  }
}

// Helper function to call OpenAI with timeout and model fallback
export async function callOpenAIWithTimeout(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    responseFormat?: { type: "json_object" };
    maxTokens?: number;
  } = {}
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  let lastError: Error | null = null;

  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`[OpenAI] Attempting with model: ${model}`);

      const completion = await openai.chat.completions.create(
        {
          model,
          messages,
          response_format: options.responseFormat,
          max_completion_tokens: options.maxTokens || 4096,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      console.log(`[OpenAI] Success with model ${model}, response length: ${content.length}`);
      return content;
    } catch (error: any) {
      console.error(`[OpenAI] Error with model ${model}:`, error.message);
      lastError = error;

      // If it's a timeout or abort error, don't try other models
      if (error.name === 'AbortError') {
        clearTimeout(timeoutId);
        throw new Error('OpenAI request timed out after 60 seconds');
      }

      // If it's a 404 (model not found), try next model
      if (error.status === 404) {
        console.log(`[OpenAI] Model ${model} not found, trying next...`);
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  clearTimeout(timeoutId);
  throw lastError || new Error('All OpenAI models failed');
}

// Fast API call with quality fallback - retries with full model if quality check fails
export async function callOpenAIFastWithFallback(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    responseFormat?: { type: "json_object" };
    maxTokens?: number;
  } = {},
  qualityCheck?: (result: string) => boolean
): Promise<string> {
  try {
    const result = await callOpenAIFast(messages, options);
    // If quality check provided and fails, retry with full model
    if (qualityCheck && !qualityCheck(result)) {
      console.log('[OpenAI] Fast result failed quality check, retrying with full model');
      return callOpenAIWithTimeout(messages, options);
    }
    return result;
  } catch (error) {
    console.log('[OpenAI] Fast call failed, falling back to full model');
    return callOpenAIWithTimeout(messages, options);
  }
}

// Type definitions
export interface EmailVariant {
  subject: string;
  body: string;
  approach: string; // Brief description of the approach taken
}

export interface PersonalizeEmailParams {
  baseMessage: string;
  writingStyle: WritingStyleId;
  contactName: string;
  contactCompany: string;
  contactNotes?: string;
}
