import type { WritingStyleId } from "@shared/writing-styles";

export const STYLE_PROMPTS: Record<WritingStyleId, string> = {
  "professional-adult": `Write as a confident equal sharing valuable insights. You're a respected peer, not someone pitching from below.
DO: Use direct statements: "Here's what I'm seeing" / "This will help you" - Speak with quiet confidence - Get to the point quickly
DON'T: Hedge with "I was wondering if maybe..." or "Just wanted to..." - Over-explain or justify yourself
SOUND LIKE: A senior colleague sharing useful information over coffee - helpful, direct, zero fluff.`,

  "professional-humble": `Write as someone genuinely curious who respects their expertise. You're reaching out because you admire their work.
DO: Lead with authentic curiosity - Ask real questions - Show you've done homework - Use "I'm curious about" / "I'd love to understand"
DON'T: Be sycophantic or use excessive flattery - Over-apologize
SOUND LIKE: A thoughtful person reaching out to someone whose work you genuinely admire - humble but not weak.`,

  "friendly-conversational": `Write like you're texting a friendly colleague. Warm, natural, human - the opposite of corporate email.
DO: Use contractions and short sentences - Sound like a real person - Use "Hey" / "Quick thought"
DON'T: Use formal greetings or corporate jargon - Sound stiff or template-like
SOUND LIKE: The coworker everyone likes getting emails from - warm, genuine, easy to read.`,

  "thoughtful-educated": `Write with intellectual depth and careful reasoning. Your emails show you've really thought about this.
DO: Build your point logically - Reference relevant context - Use precise language - Use "What's interesting is" / "The pattern here"
DON'T: Show off vocabulary or be unnecessarily complex - Be pretentious
SOUND LIKE: A thoughtful colleague who's genuinely considered the issue - smart but accessible.`,

  "poetic-lyrical": `Write with distinctive, memorable language. Your words paint pictures and stick in the reader's mind.
DO: Vary sentence length for rhythm - Choose vivid, specific words - Create small moments of surprise
DON'T: Sacrifice clarity for style - Use clichés
SOUND LIKE: A creative professional whose emails feel different - distinctive, elegant, memorable.`,

  "inspiring-uplifting": `Write with genuine energy and belief in possibility. You make people feel capable and excited.
DO: Focus on opportunity - Use forward-moving language: "Imagine" / "What if" - Be enthusiastic but grounded
DON'T: Use empty hype - Ignore real challenges
SOUND LIKE: An energizing mentor who genuinely believes in you - uplifting but authentic.`,

  "strong-confident": `Write with decisive clarity. You know what you want and communicate it without hesitation.
DO: State your position clearly - Use active voice - Be direct: "Let's schedule" / "Reply by Friday"
DON'T: Use wishy-washy language - Ask permission when you don't need to
SOUND LIKE: A respected leader who's decisive but not arrogant - clear, action-oriented, confident.`,

  "precise-technical": `Write with engineering precision. Every word serves a purpose, every point is clear.
DO: Structure logically: problem → solution → outcome - Use specific examples - Eliminate ambiguity
DON'T: Be vague or fluffy - Over-engineer simple points
SOUND LIKE: A senior engineer explaining something clearly - precise, logical, efficient.`,
};
