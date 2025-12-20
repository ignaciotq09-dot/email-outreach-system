import { db } from "../db";
import { optimizationRuns, abTests, abTestResults, sentEmails, campaigns, campaignContacts, type OptimizationRun, type InsertOptimizationRun, type AbTest, type InsertAbTest, type AbTestResult, type InsertAbTestResult, type SentEmailWithContact } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function logOptimizationRun(userId: number, optimization: InsertOptimizationRun): Promise<OptimizationRun> {
  const [run] = await db.insert(optimizationRuns).values(optimization).returning();
  return run;
}

export async function getOptimizationRunsByEmail(userId: number, emailId: number, getSentEmailByIdFn: (userId: number, id: number) => Promise<SentEmailWithContact | undefined>): Promise<OptimizationRun[]> {
  const email = await getSentEmailByIdFn(userId, emailId);
  if (!email) return [];
  return await db.select().from(optimizationRuns).where(eq(optimizationRuns.emailId, emailId)).orderBy(desc(optimizationRuns.createdAt));
}

export async function getOptimizationRunsByCampaign(userId: number, campaignId: number): Promise<OptimizationRun[]> {
  const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
  if (!campaign) return [];
  
  const results = await db.select({ optimizationRun: optimizationRuns }).from(optimizationRuns).innerJoin(sentEmails, eq(optimizationRuns.sentEmailId, sentEmails.id)).innerJoin(campaignContacts, eq(campaignContacts.sentEmailId, sentEmails.id)).where(eq(campaignContacts.campaignId, campaignId)).orderBy(desc(optimizationRuns.createdAt));
  return results.map(r => r.optimizationRun);
}

export async function getAverageOptimizationScore(userId: number): Promise<number> {
  const result = await db.select({ avgScore: sql<number>`AVG((${optimizationRuns.scores}->>'totalScore')::numeric)` }).from(optimizationRuns).innerJoin(sentEmails, eq(optimizationRuns.sentEmailId, sentEmails.id)).where(eq(sentEmails.userId, userId));
  return result[0]?.avgScore || 0;
}

export async function createABTest(userId: number, test: InsertAbTest): Promise<AbTest> {
  const [abTest] = await db.insert(abTests).values(test).returning();
  return abTest;
}

export async function logABTestResult(userId: number, result: InsertAbTestResult): Promise<AbTestResult> {
  const [testResult] = await db.insert(abTestResults).values(result).returning();
  return testResult;
}

export async function getABTest(userId: number, testId: number): Promise<AbTest | null> {
  const [test] = await db.select().from(abTests).where(eq(abTests.id, testId));
  if (!test) return null;
  
  if (test.campaignId) {
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, test.campaignId), eq(campaigns.userId, userId)));
    if (!campaign) return null;
  }
  return test;
}

export async function getABTestResults(userId: number, testId: number, getABTestFn: (userId: number, testId: number) => Promise<AbTest | null>): Promise<AbTestResult[]> {
  const test = await getABTestFn(userId, testId);
  if (!test) return [];
  return await db.select().from(abTestResults).where(eq(abTestResults.experimentId, test.experimentId)).orderBy(desc(abTestResults.createdAt));
}

export async function getActiveABTests(userId: number): Promise<AbTest[]> {
  const now = new Date();
  const results = await db.select({ test: abTests }).from(abTests).innerJoin(campaigns, eq(abTests.campaignId, campaigns.id)).where(and(eq(campaigns.userId, userId), sql`${abTests.status} = 'active' AND ${abTests.endDate} > ${now}`));
  return results.map(r => r.test);
}
