import { db } from "../../../db";
import { sentEmails, contacts } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { ReplyDetectionJob } from "@shared/schema";
import type { JobProcessingResult, DetectionProvider } from "../types";
import { performHealthCheck } from "../health-checker";
import { markJobExecuting } from "../job-queue";
import { detectReplyWithAllLayers } from "../../reply-detection";
import { handleHealthCheckFail } from "./health-check-fail";
import { saveReplyToDatabase, updateLastCheckOnly } from "./save-reply";
import { buildVerification, logQuorumFailureAnomaly, logLayerDisagreementAnomaly, finalizeJob } from "./verify-and-log";
import { handleDetectionError } from "./error-handler";

export async function processDetectionJob(job: ReplyDetectionJob): Promise<JobProcessingResult> {
  const startTime = Date.now(); console.log(`[ReplyDetectionProcessor] Processing job ${job.id} for sent_email ${job.sentEmailId}`); await markJobExecuting(job);
  const provider = job.provider as DetectionProvider; const healthCheck = await performHealthCheck(job.userId, provider); if (!healthCheck.healthy) return await handleHealthCheckFail(job, healthCheck, startTime);
  try { const [contactRow] = await db.select().from(contacts).where(eq(contacts.id, job.contactId)).limit(1); const [sentEmail] = await db.select().from(sentEmails).where(eq(sentEmails.id, job.sentEmailId)).limit(1); if (!contactRow || !sentEmail) throw new Error("Contact or sent email not found");
  const detectionResult = await detectReplyWithAllLayers({ userId: job.userId, provider, sentEmailId: job.sentEmailId, contactId: job.contactId, contactEmail: contactRow.email, contactName: contactRow.name || undefined, companyName: contactRow.company || undefined, subject: sentEmail.subject || undefined, sentAt: sentEmail.sentAt || new Date(), gmailThreadId: sentEmail.gmailThreadId || undefined, gmailMessageId: sentEmail.gmailMessageId || undefined });
  const layerResults = detectionResult.layerResults; const quorumResult = detectionResult.quorumResult; const replyFound = quorumResult.found; let replyMessageId: string | undefined; let dbWriteConfirmed = false;
  if (replyFound && detectionResult.bestReply) { const reply = detectionResult.bestReply; const confidenceScore = detectionResult.confidenceScore || 0; replyMessageId = reply.gmailMessageId; const { dbWriteConfirmed: confirmed } = await saveReplyToDatabase(job, reply, confidenceScore); dbWriteConfirmed = confirmed; } else { dbWriteConfirmed = await updateLastCheckOnly(job.sentEmailId); }
  const verification = buildVerification(quorumResult, dbWriteConfirmed, layerResults.length); if (!verification.quorumSatisfied) await logQuorumFailureAnomaly(job, quorumResult, layerResults); await logLayerDisagreementAnomaly(job, quorumResult);
  const result: JobProcessingResult = { success: verification.passed, replyFound, healthCheck, layerResults, quorumResult, verification, durationMs: Date.now() - startTime }; await finalizeJob(job, result, healthCheck, layerResults, replyFound, replyMessageId); return result;
  } catch (error: any) { return await handleDetectionError(job, healthCheck, error, startTime); }
}
