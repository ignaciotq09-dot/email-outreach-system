import { callOpenAIWithTimeout } from '../openai-client';
import type { OptimizationResult, RecipientData } from "./types";
import { detectEmailIntent, analyzeSubjectLine, analyzeEmailBody, calculatePersonalizationScore } from "./analyzers";
import { calculateOptimalSendTime, calculateOpenRatePrediction, calculateResponseRatePrediction, calculateConversionRatePrediction } from "./predictions";
import { generateImprovementSuggestions, generateBasicImprovements } from "./suggestions";

export async function analyzeAndOptimizeEmail(subject: string, emailContent: string, recipientData?: RecipientData): Promise<OptimizationResult> {
  const scores = { subjectScore: analyzeSubjectLine(subject), bodyScore: analyzeEmailBody(emailContent), personalizationScore: calculatePersonalizationScore(emailContent, recipientData), timingScore: 70 };
  const intent = detectEmailIntent(emailContent);
  const systemPrompt = `You are an elite email optimization expert. Analyze this ${intent} email and provide specific, actionable improvements.`;
  const userPrompt = `Subject: ${subject}\n\nBody:\n${emailContent}\n\nProvide:\n1. Optimized subject line\n2. Optimized body\n3. List of key optimizations made\n4. Predicted open/response rates`;
  try {
    const response = await callOpenAIWithTimeout([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], 'gpt-4o-mini', 30000);
    let optimizationResult: any = { optimizedSubject: subject, optimizedBody: emailContent, keyOptimizations: [], predictedMetrics: {} };
    try {
      const content = response?.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) { optimizationResult = { ...optimizationResult, ...JSON.parse(jsonMatch[0]) }; }
    } catch {}
    const finalScore = Math.round((scores.subjectScore * 0.3) + (scores.bodyScore * 0.3) + (scores.personalizationScore * 0.25) + (scores.timingScore * 0.15));
    const sendingRec = calculateOptimalSendTime(recipientData?.timezone);
    return { score: finalScore, optimizedSubject: optimizationResult.optimizedSubject, optimizedBody: optimizationResult.optimizedBody, improvements: generateImprovementSuggestions(subject, emailContent, optimizationResult.keyOptimizations), predictions: { openRate: optimizationResult.predictedMetrics?.openRate || calculateOpenRatePrediction(scores), responseRate: optimizationResult.predictedMetrics?.responseRate || calculateResponseRatePrediction(scores), conversionRate: calculateConversionRatePrediction(scores, recipientData) }, sendingRecommendation: sendingRec };
  } catch (error) {
    console.error('Email optimization error:', error);
    return { score: Math.round((scores.subjectScore + scores.bodyScore) / 2), optimizedSubject: subject, optimizedBody: emailContent, improvements: generateBasicImprovements(subject, emailContent), predictions: { openRate: '20-25%', responseRate: '5-8%', conversionRate: '1-2%' }, sendingRecommendation: { bestDay: 'Tuesday', bestTime: '10:00 AM', reason: 'Statistical best performance' } };
  }
}
