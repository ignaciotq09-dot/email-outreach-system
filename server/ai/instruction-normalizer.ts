/**
 * Instruction Normalizer
 * 
 * A lightweight LLM preprocessing step that parses messy user instructions
 * into structured, prioritized rule objects. This ensures consistent
 * interpretation regardless of how the user writes their preferences.
 * 
 * USAGE:
 * This normalizer is OPTIONAL. The main buildStyleSeasoning function in 
 * tone-translator.ts already handles messy instructions with detailed prompt
 * guidance. Use this normalizer when you need:
 * 1. More deterministic interpretation
 * 2. Logging/debugging of how instructions were parsed
 * 3. Caching of parsed instructions per user
 * 
 * To integrate:
 * 1. Call normalizeInstructions(rawInstructions) before email generation
 * 2. Pass result to buildStyleSeasoningWithNormalized() in tone-translator.ts
 * 3. If normalization fails, it gracefully falls back to raw instruction handling
 */

import OpenAI from "openai";

// Lazy initialization to avoid loading errors when OPENAI_API_KEY isn't set yet
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI();
  }
  return openai;
}

export interface NormalizedInstruction {
  prohibitions: string[];       // "Don't/never/avoid" rules - highest priority
  mustDos: string[];            // "Always/must/keep" rules - second priority  
  preferences: string[];        // "Try to/more/less" - guidance
  ambiguities: string[];        // Unclear items that need defaults
  conflicts: ConflictReport[];  // Detected contradictions
  overallTone: string;          // Interpreted overall style intent
}

export interface ConflictReport {
  instruction1: string;
  instruction2: string;
  resolution: string;
  reasoning: string;
}

const NORMALIZER_PROMPT = `You are an instruction parser for an email writing AI. Your job is to take messy, informal user instructions and convert them into a structured format.

CRITICAL: Be generous in interpretation. Users write casually - your job is to understand their INTENT, not criticize their grammar.

For example:
- "dont be salesy but also make it good" → Prohibition: "no aggressive sales language"; Preference: "high quality, compelling"
- "kinda casual but still professional you know" → Overall tone: "conversational professional"
- "short and sweet but include everything important" → Must-do: "be concise"; Preference: "cover key points"

Return JSON with these fields:
{
  "prohibitions": ["things they explicitly DON'T want - scan for: don't, never, avoid, no, not, without"],
  "mustDos": ["things they explicitly MUST have - scan for: always, must, keep, make sure, need"],
  "preferences": ["softer guidance - scan for: try to, more, less, kinda, sorta, prefer"],
  "ambiguities": ["anything truly unclear that you couldn't interpret - be conservative, most things ARE interpretable"],
  "conflicts": [
    {
      "instruction1": "first conflicting instruction",
      "instruction2": "second conflicting instruction", 
      "resolution": "how to resolve (usually: blend both qualities)",
      "reasoning": "why this resolution makes sense"
    }
  ],
  "overallTone": "one sentence describing the interpreted overall style/vibe"
}

IMPORTANT:
- "professional but casual" is NOT a conflict - it means "competent but conversational"
- "formal but warm" is NOT a conflict - it means "polished with genuine connection"  
- Only flag TRUE conflicts where instructions genuinely cannot coexist
- When in doubt, blend qualities rather than flagging as conflict
- Empty arrays are fine if nothing applies`;

/**
 * Normalize user instructions into structured format
 * Returns null if instructions are empty/null
 */
export async function normalizeInstructions(
  rawInstructions: string | null | undefined
): Promise<NormalizedInstruction | null> {
  // Handle empty input
  if (!rawInstructions || rawInstructions.trim().length === 0) {
    return null;
  }

  const trimmed = rawInstructions.trim();
  
  // For very short instructions, skip the API call and do simple parsing
  if (trimmed.length < 20) {
    return quickParse(trimmed);
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini", // Fast and cheap for preprocessing
      messages: [
        { role: "system", content: NORMALIZER_PROMPT },
        { role: "user", content: trimmed }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Low temperature for consistent parsing
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("Instruction normalizer returned empty response, using fallback");
      return quickParse(trimmed);
    }

    const parsed = JSON.parse(content) as NormalizedInstruction;
    
    // Ensure all fields exist
    return {
      prohibitions: parsed.prohibitions || [],
      mustDos: parsed.mustDos || [],
      preferences: parsed.preferences || [],
      ambiguities: parsed.ambiguities || [],
      conflicts: parsed.conflicts || [],
      overallTone: parsed.overallTone || "natural and human"
    };
  } catch (error) {
    console.error("Instruction normalizer failed:", error);
    // Fallback to simple parsing
    return quickParse(trimmed);
  }
}

/**
 * Quick keyword-based parsing for short instructions or fallback
 */
function quickParse(instructions: string): NormalizedInstruction {
  const lower = instructions.toLowerCase();
  
  const prohibitions: string[] = [];
  const mustDos: string[] = [];
  const preferences: string[] = [];
  
  // Simple keyword detection
  if (lower.includes("don't") || lower.includes("dont") || lower.includes("no ") || lower.includes("never") || lower.includes("avoid")) {
    // Extract what comes after prohibition keywords
    const prohibitionMatches = instructions.match(/(?:don'?t|no|never|avoid)\s+(?:be\s+)?(\w+(?:\s+\w+)?)/gi);
    if (prohibitionMatches) {
      prohibitions.push(...prohibitionMatches.map(m => m.replace(/^(don'?t|no|never|avoid)\s+(?:be\s+)?/i, 'no ').trim()));
    }
  }
  
  if (lower.includes("always") || lower.includes("must") || lower.includes("keep") || lower.includes("make sure")) {
    mustDos.push("follow explicit requirements");
  }
  
  if (lower.includes("casual") || lower.includes("friendly") || lower.includes("warm")) {
    preferences.push("conversational tone");
  }
  
  if (lower.includes("professional") || lower.includes("formal")) {
    preferences.push("professional register");
  }
  
  if (lower.includes("short") || lower.includes("brief") || lower.includes("concise")) {
    preferences.push("keep it brief");
  }

  return {
    prohibitions,
    mustDos,
    preferences,
    ambiguities: [],
    conflicts: [],
    overallTone: inferTone(lower)
  };
}

/**
 * Infer overall tone from keywords
 */
function inferTone(lower: string): string {
  if (lower.includes("casual") && lower.includes("professional")) {
    return "conversational professional";
  }
  if (lower.includes("formal") && lower.includes("warm")) {
    return "warmly professional";
  }
  if (lower.includes("casual") || lower.includes("friendly")) {
    return "friendly and relaxed";
  }
  if (lower.includes("formal") || lower.includes("professional")) {
    return "polished and professional";
  }
  if (lower.includes("direct") || lower.includes("brief")) {
    return "efficient and to-the-point";
  }
  return "natural and human";
}

/**
 * Format normalized instructions for inclusion in prompt
 */
export function formatNormalizedInstructions(normalized: NormalizedInstruction): string {
  const sections: string[] = [];
  
  sections.push(`INTERPRETED OVERALL STYLE: ${normalized.overallTone}`);
  
  if (normalized.prohibitions.length > 0) {
    sections.push(`HARD RULES (never violate):\n${normalized.prohibitions.map(p => `• ${p}`).join('\n')}`);
  }
  
  if (normalized.mustDos.length > 0) {
    sections.push(`MUST-DOS:\n${normalized.mustDos.map(m => `• ${m}`).join('\n')}`);
  }
  
  if (normalized.preferences.length > 0) {
    sections.push(`PREFERENCES:\n${normalized.preferences.map(p => `• ${p}`).join('\n')}`);
  }
  
  if (normalized.conflicts.length > 0) {
    const conflictText = normalized.conflicts.map(c => 
      `"${c.instruction1}" vs "${c.instruction2}" → RESOLUTION: ${c.resolution}`
    ).join('\n');
    sections.push(`RESOLVED CONFLICTS:\n${conflictText}`);
  }
  
  if (normalized.ambiguities.length > 0) {
    sections.push(`NOTE - Unclear items (using sensible defaults):\n${normalized.ambiguities.map(a => `• ${a}`).join('\n')}`);
  }
  
  return sections.join('\n\n');
}
