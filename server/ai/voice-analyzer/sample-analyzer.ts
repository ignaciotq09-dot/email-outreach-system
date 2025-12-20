import { callOpenAIWithTimeout } from "../openai-client";
import type { VoiceCharacteristics } from "./types";

export async function analyzeVoiceSample(sampleText: string): Promise<VoiceCharacteristics> {
  const sentences = sampleText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = sampleText.split(/\s+/).filter(w => w.length > 0);
  const questionCount = (sampleText.match(/\?/g) || []).length;
  const greetingPatterns = [/^(hi|hey|hello|dear|good morning|good afternoon|good evening|greetings)/i, /^(hope this|i hope|hope you)/i];
  let greetingUsed: string | null = null; for (const pattern of greetingPatterns) { const match = sampleText.match(pattern); if (match) { greetingUsed = match[0]; break; } }
  const closingPatterns = [/(best|regards|cheers|thanks|sincerely|best regards|warm regards|kind regards|talk soon|take care)[\s,!.]*$/i];
  let closingUsed: string | null = null; for (const pattern of closingPatterns) { const match = sampleText.match(pattern); if (match) { closingUsed = match[0].trim(); break; } }
  const prompt = `Analyze this email sample and extract writing style characteristics.\n\nEMAIL SAMPLE:\n"""\n${sampleText}\n"""\n\nAnalyze and respond with JSON:\n{\n  "formalityScore": <1-10, where 1=very casual, 10=very formal>,\n  "warmthScore": <1-10, where 1=cold/direct, 10=very warm/friendly>,\n  "notablePatterns": [<list of 3-5 notable writing patterns>]\n}`;
  try { const response = await callOpenAIWithTimeout([{ role: "system", content: "You are an expert writing style analyst. Analyze email samples to identify patterns and characteristics." }, { role: "user", content: prompt }], { responseFormat: { type: "json_object" }, maxTokens: 500 }); const aiAnalysis = JSON.parse(response); return { wordCount: words.length, sentenceCount: sentences.length, averageSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0, hasGreeting: greetingUsed !== null, greetingUsed, hasClosing: closingUsed !== null, closingUsed, hasQuestion: questionCount > 0, questionCount, formalityScore: Math.max(1, Math.min(10, aiAnalysis.formalityScore || 5)), warmthScore: Math.max(1, Math.min(10, aiAnalysis.warmthScore || 5)), notablePatterns: aiAnalysis.notablePatterns || [] }; } catch (error) { console.error("[VoiceAnalyzer] Error analyzing sample:", error); return { wordCount: words.length, sentenceCount: sentences.length, averageSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0, hasGreeting: greetingUsed !== null, greetingUsed, hasClosing: closingUsed !== null, closingUsed, hasQuestion: questionCount > 0, questionCount, formalityScore: 5, warmthScore: 5, notablePatterns: [] }; }
}
