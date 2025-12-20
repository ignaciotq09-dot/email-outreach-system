import type { EmailVariant } from '../openai-client';
import type { OptimizationContext, OptimizationResult } from "./types";
import { detectIntent } from "./intent-detector";
import { applyContextualRules } from "./contextual-rules";
import { applyPsychologyOptimization } from "./psychology";
import { calculateScore, generateImprovements, predictPerformance } from "./scoring";

export class EmailOptimizationOrchestrator {
  private detectIntent = detectIntent; private applyContextualRules = applyContextualRules; private applyPsychologyOptimization = applyPsychologyOptimization; private calculateScore = calculateScore; private generateImprovements = generateImprovements; private predictPerformance = predictPerformance;
  public async optimizeEmailVariant(variant: EmailVariant, context: OptimizationContext = {}): Promise<OptimizationResult> {
    if (!context.intent) context.intent = this.detectIntent(variant.body); const { variant: contextOptimized, appliedRules } = this.applyContextualRules(variant, context); const psychologyOptimized = await this.applyPsychologyOptimization(contextOptimized, context); const score = this.calculateScore(psychologyOptimized, context); const improvements = this.generateImprovements(psychologyOptimized, context); const predictions = this.predictPerformance(score, context);
    return { optimizedVariant: psychologyOptimized, score, improvements, predictions, appliedRules, abTestMetadata: context.abTestVariant ? { variant: context.abTestVariant, testId: `test_${Date.now()}` } : undefined };
  }
  public async optimizeMultipleVariants(variants: EmailVariant[], context: OptimizationContext = {}): Promise<OptimizationResult[]> { const results = await Promise.all(variants.map(variant => this.optimizeEmailVariant(variant, context))); return results.sort((a, b) => b.score - a.score); }
  public async generateABTestVariants(baseVariant: EmailVariant, context: OptimizationContext, testDimension: 'subject' | 'psychology' | 'length' | 'cta'): Promise<OptimizationResult[]> { const variants: EmailVariant[] = [baseVariant]; switch (testDimension) { case 'subject': variants.push({ ...baseVariant, subject: baseVariant.subject.toLowerCase(), approach: 'Lowercase Subject' }); variants.push({ ...baseVariant, subject: baseVariant.subject + '?', approach: 'Question Subject' }); break; case 'psychology': variants.push({ ...baseVariant, body: `[Social Proof Version] ${baseVariant.body}`, approach: 'Social Proof' }); variants.push({ ...baseVariant, body: `[Scarcity Version] ${baseVariant.body}`, approach: 'Scarcity' }); break; case 'length': const words = baseVariant.body.split(' '); variants.push({ ...baseVariant, body: words.slice(0, 50).join(' '), approach: 'Ultra Concise' }); variants.push({ ...baseVariant, body: baseVariant.body + ' ' + words.slice(0, 25).join(' '), approach: 'Detailed' }); break; case 'cta': variants.push({ ...baseVariant, body: baseVariant.body.replace(/\?$/, '. Worth exploring?'), approach: 'Soft CTA' }); variants.push({ ...baseVariant, body: baseVariant.body.replace(/\?$/, '. 15 minutes Tuesday?'), approach: 'Direct CTA' }); break; } return await this.optimizeMultipleVariants(variants, context); }
}

export const emailOptimizationOrchestrator = new EmailOptimizationOrchestrator();
