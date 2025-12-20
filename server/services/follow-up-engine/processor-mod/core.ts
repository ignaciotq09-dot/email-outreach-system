import { db } from "../../../db";
import { eq, sql } from "drizzle-orm";
import { followUps, sequenceSteps } from "@shared/schema";
import { storage } from "../../../storage";
import { personalizeVariantForContact } from "../../openai";
import { validateTokenBeforeSend } from "../health-checker";
import { verifySendComplete } from "../send-verifier";
import { updateJobStatus, incrementAttempt, scheduleRetry, cancelJob } from "../job-queue";
import type { FollowUpJobWithContext, ProcessingResult } from '../types';
import { createResult } from './helpers';
import { checkShouldStopSequence } from './stop-checker';
import { sendFollowUpEmail } from './sender';

export async function processJob(job: FollowUpJobWithContext): Promise<ProcessingResult> {
  const startTime = Date.now(); const jobId = job.id; console.log(`[FollowUpProcessor] Starting job ${jobId} for contact ${job.contact?.email}`);
  try {
    await updateJobStatus(jobId, 'sending', { startedAt: new Date() }); const userId = (job.metadata as any)?.userId; if (!userId) { const error = 'No userId in job metadata'; await scheduleRetry(jobId, job.attemptCount || 0, error); return createResult(jobId, 'failed', false, startTime, error); }
    const shouldStop = await checkShouldStopSequence(job); if (shouldStop.stop) { await cancelJob(jobId, shouldStop.reason); console.log(`[FollowUpProcessor] Job ${jobId} cancelled: ${shouldStop.reason}`); return createResult(jobId, 'cancelled', true, startTime); }
    const healthCheck = await validateTokenBeforeSend(userId); if (!healthCheck.valid) { const attemptCount = await incrementAttempt(jobId); if (healthCheck.shouldRetry) { await scheduleRetry(jobId, attemptCount, healthCheck.error || 'Health check failed'); return createResult(jobId, 'failed', false, startTime, healthCheck.error, { passed: false, providerHealthy: false, tokenValid: false, errorMessage: healthCheck.error }); } }
    await updateJobStatus(jobId, 'sending', { healthCheckPassed: 1 }); const user = await storage.getUserById(userId); if (!user) { await scheduleRetry(jobId, job.attemptCount || 0, 'User not found'); return createResult(jobId, 'failed', false, startTime, 'User not found'); }
    let personalizedSubject = job.personalizedSubject || job.subject; let personalizedBody = job.personalizedBody || job.body; if (!job.personalizedBody && job.body && job.contact) { try { const preferences = await storage.getEmailPreferences(userId); const personalized = await personalizeVariantForContact({ approach: 'Follow-up', subject: job.subject || job.originalEmail?.subject || 'Following up', body: job.body }, job.contact.name || 'there', job.contact.company, job.contact.pronoun || 'Mr./Ms.', undefined, preferences); personalizedSubject = personalized.subject; personalizedBody = personalized.body; await updateJobStatus(jobId, 'sending', { personalizedSubject, personalizedBody }); } catch (error: any) { console.warn(`[FollowUpProcessor] Personalization failed for job ${jobId}:`, error?.message); } }
    const sendResult = await sendFollowUpEmail(user, job, personalizedSubject || job.originalEmail?.subject || 'Following up', personalizedBody || job.body || ''); if (!sendResult.success) { const attemptCount = await incrementAttempt(jobId); if (sendResult.retryable !== false) await scheduleRetry(jobId, attemptCount, sendResult.errorMessage || 'Send failed'); else await updateJobStatus(jobId, 'failed', { lastError: sendResult.errorMessage, completedAt: new Date(), processingTimeMs: Date.now() - startTime }); return createResult(jobId, 'failed', false, startTime, sendResult.errorMessage); }
    await db.insert(followUps).values({ originalEmailId: job.originalEmailId, followUpBody: personalizedBody || job.body, gmailMessageId: sendResult.messageId || '' }); if (job.stepId) await db.update(sequenceSteps).set({ totalSent: sql`${sequenceSteps.totalSent} + 1` }).where(eq(sequenceSteps.id, job.stepId));
    let verified = false; if (sendResult.messageId) { try { const verificationResult = await verifySendComplete(userId, sendResult.messageId, sendResult.threadId); verified = verificationResult.verified; } catch (error) { console.warn(`[FollowUpProcessor] Verification failed for job ${jobId}:`, error); } }
    await updateJobStatus(jobId, 'completed', { gmailMessageId: sendResult.messageId, gmailThreadId: sendResult.threadId, sendVerified: verified ? 1 : 0, completedAt: new Date(), processingTimeMs: Date.now() - startTime }); console.log(`[FollowUpProcessor] Job ${jobId} completed successfully`); return createResult(jobId, 'sent', true, startTime);
  } catch (error: any) { console.error(`[FollowUpProcessor] Job ${jobId} failed:`, error?.message); const attemptCount = await incrementAttempt(jobId); await scheduleRetry(jobId, attemptCount, error?.message || 'Unknown error'); return createResult(jobId, 'failed', false, startTime, error?.message); }
}
