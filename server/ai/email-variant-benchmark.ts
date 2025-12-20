import type { EmailPreferences } from "@shared/schema";
import type { WritingStyleId } from "@shared/writing-styles";
import { generateEmailVariantsOptimized, getCacheStats, clearVariantCache } from "./email-variants-optimized";
import { generateEmailVariants } from "./email-variants";

interface BenchmarkResult {
  testCase: string;
  originalTime: number;
  optimizedTime: number;
  cachedTime: number | null;
  speedup: number;
  cacheSpeedup: number | null;
  originalVariants: number;
  optimizedVariants: number;
  qualityComparison: {
    subjectLengthDiff: number;
    bodyLengthDiff: number;
    structureMatch: boolean;
  };
}

interface ModelComparisonResult {
  testCase: string;
  gpt4oTime: number;
  gpt4oMiniTime: number;
  speedDifference: number;
  gpt4oVariants: any[];
  gpt4oMiniVariants: any[];
  qualityAssessment: {
    lengthDifference: number;
    structureMatch: boolean;
    recommendations: string[];
  };
}

const TEST_MESSAGES = [
  {
    name: "Simple meeting request",
    message: "Let's meet next week to discuss partnership opportunities",
    style: "professional-adult" as WritingStyleId,
  },
  {
    name: "Complex product pitch",
    message: "I noticed your company recently expanded into the European market. Our logistics platform has helped 50+ companies reduce shipping costs by 30% when entering new markets. Would love to share how we could help streamline your distribution strategy.",
    style: "professional-adult" as WritingStyleId,
  },
  {
    name: "Short networking request",
    message: "Loved your talk at the conference",
    style: "friendly-conversational" as WritingStyleId,
  },
  {
    name: "Detailed service introduction",
    message: "We help SaaS companies like yours increase demo bookings by 40% using AI-powered outreach. Our clients include TechCorp, StartupXYZ, and DataFlow. Each saw results within 30 days of starting with us. I'd love to show you our approach and see if it could work for you.",
    style: "strong-confident" as WritingStyleId,
  },
];

export async function runBenchmark(): Promise<BenchmarkResult[]> {
  console.log('[Benchmark] Starting email variant generation benchmark...\n');
  
  clearVariantCache();
  const results: BenchmarkResult[] = [];

  for (const testCase of TEST_MESSAGES) {
    console.log(`[Benchmark] Testing: ${testCase.name}`);
    
    const originalStart = Date.now();
    const originalVariants = await generateEmailVariants(testCase.message, null, testCase.style);
    const originalTime = Date.now() - originalStart;
    
    clearVariantCache();
    
    const optimizedStart = Date.now();
    const optimizedVariants = await generateEmailVariantsOptimized(testCase.message, null, testCase.style, {
      useCache: true,
      useFastModel: true,
    });
    const optimizedTime = Date.now() - optimizedStart;
    
    const cachedStart = Date.now();
    const cachedVariants = await generateEmailVariantsOptimized(testCase.message, null, testCase.style, {
      useCache: true,
      useFastModel: true,
    });
    const cachedTime = Date.now() - cachedStart;

    const avgOriginalSubject = originalVariants.reduce((sum, v) => sum + v.subject.length, 0) / originalVariants.length;
    const avgOptimizedSubject = optimizedVariants.reduce((sum, v) => sum + v.subject.length, 0) / optimizedVariants.length;
    
    const avgOriginalBody = originalVariants.reduce((sum, v) => sum + v.body.length, 0) / originalVariants.length;
    const avgOptimizedBody = optimizedVariants.reduce((sum, v) => sum + v.body.length, 0) / optimizedVariants.length;

    const originalApproaches = originalVariants.map(v => v.approach).sort();
    const optimizedApproaches = optimizedVariants.map(v => v.approach).sort();
    const structureMatch = 
      originalApproaches.length === optimizedApproaches.length &&
      originalApproaches.every((a, i) => a === optimizedApproaches[i]);

    const result: BenchmarkResult = {
      testCase: testCase.name,
      originalTime,
      optimizedTime,
      cachedTime,
      speedup: parseFloat((originalTime / optimizedTime).toFixed(2)),
      cacheSpeedup: parseFloat((optimizedTime / cachedTime).toFixed(2)),
      originalVariants: originalVariants.length,
      optimizedVariants: optimizedVariants.length,
      qualityComparison: {
        subjectLengthDiff: parseFloat(((avgOptimizedSubject - avgOriginalSubject) / avgOriginalSubject * 100).toFixed(1)),
        bodyLengthDiff: parseFloat(((avgOptimizedBody - avgOriginalBody) / avgOriginalBody * 100).toFixed(1)),
        structureMatch,
      },
    };

    results.push(result);
    
    console.log(`  Original: ${originalTime}ms, Optimized: ${optimizedTime}ms (${result.speedup}x faster)`);
    console.log(`  Cached: ${cachedTime}ms (${result.cacheSpeedup}x faster than optimized)`);
    console.log(`  Quality: Subject ${result.qualityComparison.subjectLengthDiff}%, Body ${result.qualityComparison.bodyLengthDiff}%, Structure match: ${structureMatch}\n`);
  }

  console.log('[Benchmark] Complete!\n');
  console.log('=== SUMMARY ===');
  const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
  const avgCacheSpeedup = results.reduce((sum, r) => sum + (r.cacheSpeedup || 0), 0) / results.length;
  console.log(`Average speedup: ${avgSpeedup.toFixed(2)}x`);
  console.log(`Average cache speedup: ${avgCacheSpeedup.toFixed(2)}x`);
  console.log(`Cache stats:`, getCacheStats());

  return results;
}

export async function compareModels(message: string, style: WritingStyleId = 'professional-adult'): Promise<ModelComparisonResult> {
  console.log('[ModelCompare] Comparing gpt-4o vs gpt-4o-mini...\n');
  
  clearVariantCache();

  const gpt4oStart = Date.now();
  const gpt4oVariants = await generateEmailVariantsOptimized(message, null, style, {
    useCache: false,
    useFastModel: false,
  });
  const gpt4oTime = Date.now() - gpt4oStart;

  const gpt4oMiniStart = Date.now();
  const gpt4oMiniVariants = await generateEmailVariantsOptimized(message, null, style, {
    useCache: false,
    useFastModel: true,
  });
  const gpt4oMiniTime = Date.now() - gpt4oMiniStart;

  const avgGpt4oBody = gpt4oVariants.reduce((sum, v) => sum + v.body.length, 0) / gpt4oVariants.length;
  const avgMiniBody = gpt4oMiniVariants.reduce((sum, v) => sum + v.body.length, 0) / gpt4oMiniVariants.length;
  
  const gpt4oApproaches = gpt4oVariants.map(v => v.approach).sort();
  const miniApproaches = gpt4oMiniVariants.map(v => v.approach).sort();
  const structureMatch = 
    gpt4oApproaches.length === miniApproaches.length &&
    gpt4oApproaches.every((a, i) => a === miniApproaches[i]);

  const recommendations: string[] = [];
  const lengthDiff = ((avgMiniBody - avgGpt4oBody) / avgGpt4oBody * 100);
  
  if (Math.abs(lengthDiff) < 15 && structureMatch) {
    recommendations.push("gpt-4o-mini produces comparable quality at much faster speed - RECOMMENDED for production");
  } else if (Math.abs(lengthDiff) < 30) {
    recommendations.push("gpt-4o-mini produces slightly different results - acceptable for most use cases");
  } else {
    recommendations.push("Significant quality difference detected - consider using gpt-4o for critical emails");
  }

  if (gpt4oTime / gpt4oMiniTime > 2) {
    recommendations.push(`gpt-4o-mini is ${(gpt4oTime / gpt4oMiniTime).toFixed(1)}x faster - significant latency improvement`);
  }

  const result: ModelComparisonResult = {
    testCase: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
    gpt4oTime,
    gpt4oMiniTime,
    speedDifference: parseFloat((gpt4oTime / gpt4oMiniTime).toFixed(2)),
    gpt4oVariants,
    gpt4oMiniVariants,
    qualityAssessment: {
      lengthDifference: parseFloat(lengthDiff.toFixed(1)),
      structureMatch,
      recommendations,
    },
  };

  console.log('=== MODEL COMPARISON RESULTS ===');
  console.log(`gpt-4o: ${gpt4oTime}ms`);
  console.log(`gpt-4o-mini: ${gpt4oMiniTime}ms`);
  console.log(`Speed difference: ${result.speedDifference}x faster with mini`);
  console.log(`Body length difference: ${result.qualityAssessment.lengthDifference}%`);
  console.log(`Structure match: ${structureMatch}`);
  console.log(`Recommendations:`, recommendations);
  
  console.log('\n=== GPT-4O VARIANTS ===');
  gpt4oVariants.forEach((v, i) => {
    console.log(`\n--- Variant ${i + 1}: ${v.approach} ---`);
    console.log(`Subject: ${v.subject}`);
    console.log(`Body: ${v.body}`);
  });
  
  console.log('\n=== GPT-4O-MINI VARIANTS ===');
  gpt4oMiniVariants.forEach((v, i) => {
    console.log(`\n--- Variant ${i + 1}: ${v.approach} ---`);
    console.log(`Subject: ${v.subject}`);
    console.log(`Body: ${v.body}`);
  });

  return result;
}
