import type { QualityScore } from "./types";

const SPAM_WORDS = ['free', 'guaranteed', 'risk-free', 'no obligation', 'act now', 'limited time', 'urgent', 'exclusive deal', 'best price', 'click here', 'buy now', 'order now', 'special promotion', 'amazing deal', 'incredible offer', 'once in a lifetime', 'synergy', 'synergies', 'circle back', 'touch base', 'reach out', 'ping', 'leverage', 'paradigm', 'disrupt', 'revolutionize'];
const WEAK_OPENERS = ['i hope this finds you well', 'i hope this email finds you', 'my name is', 'i wanted to introduce', 'i am writing to', 'i just wanted to', 'i was wondering if', 'i thought i would reach out'];

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;
  const vowels = 'aeiouy';
  let count = 0, prevVowel = false;
  for (const char of word) { const isVowel = vowels.includes(char); if (isVowel && !prevVowel) count++; prevVowel = isVowel; }
  if (word.endsWith('e')) count--;
  return Math.max(1, count);
}

export function calculateQualityScore(subject: string, body: string): QualityScore {
  const text = body.toLowerCase();
  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = body.split(/\s+/);
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  const avgSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0) / Math.max(words.length, 1);
  const readability = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllables)));
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(sentenceLengths.length, 1);
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / Math.max(sentenceLengths.length, 1);
  const sentenceVariety = Math.min(10, Math.sqrt(variance) * 2);
  const youCount = (text.match(/\byou\b|\byour\b|\byou're\b|\byours\b/g) || []).length;
  const iCount = (text.match(/\bi\b|\bmy\b|\bwe\b|\bour\b|\bi'm\b|\bwe're\b/g) || []).length;
  const youFocusRatio = iCount === 0 ? 10 : Math.min(10, (youCount / iCount) * 5);
  let spamHits = 0;
  for (const word of SPAM_WORDS) if (text.includes(word)) spamHits++;
  spamHits += (body.match(/\b[A-Z]{3,}\b/g) || []).length + (body.match(/!{2,}|\?{2,}/g) || []).length;
  const spamScore = Math.max(0, 10 - spamHits * 2);
  const firstSentence = sentences[0]?.toLowerCase() || '';
  let hookStrength = 5;
  if (firstSentence.includes('your ') || firstSentence.includes('you ')) hookStrength += 2;
  if (firstSentence.includes('saw ') || firstSentence.includes('noticed ') || firstSentence.includes('congrats')) hookStrength += 2;
  for (const weak of WEAK_OPENERS) if (firstSentence.includes(weak)) { hookStrength -= 4; break; }
  hookStrength = Math.max(0, Math.min(10, hookStrength));
  const lastSentence = sentences[sentences.length - 1]?.toLowerCase() || '';
  let ctaClarity = 5;
  if (lastSentence.includes('?')) ctaClarity += 2;
  if (lastSentence.includes('when') || lastSentence.includes('would') || lastSentence.includes('could')) ctaClarity += 1;
  if (lastSentence.includes('let me know') || lastSentence.includes('thoughts')) ctaClarity += 1;
  if (lastSentence.includes('look forward') || lastSentence.includes('hope to hear')) ctaClarity -= 2;
  ctaClarity = Math.max(0, Math.min(10, ctaClarity));
  const overall = readability * 0.15 + sentenceVariety * 10 * 0.15 + youFocusRatio * 10 * 0.15 + spamScore * 10 * 0.20 + hookStrength * 10 * 0.20 + ctaClarity * 10 * 0.15;
  return { readability: Math.round(readability), sentenceVariety: Math.round(sentenceVariety * 10) / 10, youFocusRatio: Math.round(youFocusRatio * 10) / 10, spamScore: Math.round(spamScore * 10) / 10, hookStrength: Math.round(hookStrength * 10) / 10, ctaClarity: Math.round(ctaClarity * 10) / 10, overall: Math.round(overall) };
}
