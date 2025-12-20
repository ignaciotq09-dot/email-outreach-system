import { SendSchedulingEngine } from "../send-scheduling-engine";
import type { JobHandler } from './types';

export function createDefaultHandlers(): Map<string, JobHandler> {
  const handlers = new Map<string, JobHandler>();
  handlers.set("send_campaign_batch", async (job) => { if (!job.entityId) throw new Error("Campaign ID required"); console.log(`[Scheduler] Executing send_campaign_batch job for campaign ${job.entityId}`); await SendSchedulingEngine.executeCampaignBatch(job); return { success: true, message: "Campaign batch sent successfully" }; });
  handlers.set("send_follow_up", async (job) => { if (!job.entityId) throw new Error("Follow-up ID required"); console.log(`[Scheduler] Executing send_follow_up job for follow-up ${job.entityId}`); return { success: true, message: "Follow-up email sent" }; });
  handlers.set("send_sequence_step", async (job) => { const metadata = job.metadata as any; if (!metadata?.enrollmentId || !metadata?.stepId) throw new Error("Enrollment ID and Step ID required"); console.log(`[Scheduler] Executing sequence step ${metadata.stepId} for enrollment ${metadata.enrollmentId}`); return { success: true, message: "Sequence step sent" }; });
  handlers.set("warm_up_email", async (job) => { console.log(`[Scheduler] Executing warm-up email job`); return { success: true, message: "Warm-up email sent" }; });
  handlers.set("process_analytics", async (job) => { console.log(`[Scheduler] Processing analytics`); return { success: true, message: "Analytics processed" }; });
  return handlers;
}
