import { db } from "../../db";
import { eq, and, sql, lte, isNull, or } from "drizzle-orm";
import {
  campaigns,
  campaignContacts,
  sentEmails,
  contacts,
  followUpSequences,
  sequenceSteps,
  followUps,
  followUpJobs,
} from "@shared/schema";
import { getDueJobs, getRetryableJobs, getQueueStats, createJob } from "./job-queue";
import { processJob } from "./processor";
import { runHourlyReconciliation, runNightlyReconciliation } from "./reconciliation";
import type { JobQueueStats, ReconciliationResult } from "./types";

class FollowUpEngine {
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private reconciliationInterval: NodeJS.Timeout | null = null;
  private nightlyReconciliationTimeout: NodeJS.Timeout | null = null;
  
  private readonly PROCESSING_INTERVAL_MS = 30000;
  private readonly RECONCILIATION_INTERVAL_MS = 60 * 60 * 1000;
  private readonly MAX_CONCURRENT_JOBS = 5;
  private activeJobs = 0;
  
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[FollowUpEngine] Already running');
      return;
    }
    
    console.log('[FollowUpEngine] Starting bulletproof follow-up automation...');
    this.isRunning = true;
    
    await this.syncPendingSequences();
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.PROCESSING_INTERVAL_MS);
    
    this.reconciliationInterval = setInterval(() => {
      runHourlyReconciliation().catch(error => {
        console.error('[FollowUpEngine] Hourly reconciliation error:', error);
      });
    }, this.RECONCILIATION_INTERVAL_MS);
    
    this.scheduleNightlyReconciliation();
    
    this.processQueue();
    
    console.log('[FollowUpEngine] Started successfully');
  }
  
  async stop(): Promise<void> {
    console.log('[FollowUpEngine] Stopping...');
    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    if (this.reconciliationInterval) {
      clearInterval(this.reconciliationInterval);
      this.reconciliationInterval = null;
    }
    
    if (this.nightlyReconciliationTimeout) {
      clearTimeout(this.nightlyReconciliationTimeout);
      this.nightlyReconciliationTimeout = null;
    }
    
    while (this.activeJobs > 0) {
      console.log(`[FollowUpEngine] Waiting for ${this.activeJobs} active jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('[FollowUpEngine] Stopped');
  }
  
  private async processQueue(): Promise<void> {
    if (!this.isRunning) return;
    
    try {
      const availableSlots = this.MAX_CONCURRENT_JOBS - this.activeJobs;
      if (availableSlots <= 0) {
        return;
      }
      
      const dueJobs = await getDueJobs(availableSlots);
      const retryableJobs = await getRetryableJobs(Math.max(0, availableSlots - dueJobs.length));
      
      const allJobs = [...dueJobs, ...retryableJobs];
      
      if (allJobs.length === 0) {
        return;
      }
      
      console.log(`[FollowUpEngine] Processing ${allJobs.length} jobs (${dueJobs.length} due, ${retryableJobs.length} retries)`);
      
      const promises = allJobs.map(async (job) => {
        this.activeJobs++;
        try {
          const result = await processJob(job);
          if (!result.success) {
            console.warn(`[FollowUpEngine] Job ${job.id} failed: ${result.error}`);
          }
        } finally {
          this.activeJobs--;
        }
      });
      
      await Promise.allSettled(promises);
      
    } catch (error) {
      console.error('[FollowUpEngine] Queue processing error:', error);
    }
  }
  
  private async syncPendingSequences(): Promise<void> {
    console.log('[FollowUpEngine] Syncing pending sequences to job queue...');
    
    try {
      const activeCampaigns = await db
        .select({
          campaign: campaigns,
          campaignContact: campaignContacts,
          contact: contacts,
          sentEmail: sentEmails,
        })
        .from(campaigns)
        .innerJoin(campaignContacts, eq(campaignContacts.campaignId, campaigns.id))
        .innerJoin(contacts, eq(campaignContacts.contactId, contacts.id))
        .innerJoin(sentEmails, eq(campaignContacts.sentEmailId, sentEmails.id))
        .where(
          and(
            eq(campaigns.status, 'sent'),
            sql`${campaigns.followUpSequenceId} IS NOT NULL`,
            eq(sentEmails.replyReceived, false)
          )
        )
        .limit(500);
      
      let jobsCreated = 0;
      
      for (const row of activeCampaigns) {
        if (!row.campaign.followUpSequenceId) continue;
        
        const sequence = await db.query.followUpSequences.findFirst({
          where: eq(followUpSequences.id, row.campaign.followUpSequenceId),
          with: { sequenceSteps: true },
        });
        
        if (!sequence || !sequence.active) continue;
        
        const existingFollowUps = await db.query.followUps.findMany({
          where: eq(followUps.originalEmailId, row.sentEmail.id),
        });
        
        const currentStep = existingFollowUps.length;
        const nextStep = sequence.sequenceSteps.find(
          (s: any) => s.stepNumber === currentStep + 1
        );
        
        if (!nextStep) continue;
        
        const referenceDate = existingFollowUps.length > 0
          ? new Date(existingFollowUps.sort((a, b) => 
              new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime()
            )[0].sentAt!)
          : new Date(row.sentEmail.sentAt!);
        
        const scheduledFor = new Date(
          referenceDate.getTime() + nextStep.delayDays * 24 * 60 * 60 * 1000
        );
        
        const existingJob = await db
          .select()
          .from(followUpJobs)
          .where(
            and(
              eq(followUpJobs.originalEmailId, row.sentEmail.id),
              eq(followUpJobs.stepNumber, nextStep.stepNumber),
              or(
                eq(followUpJobs.status, 'pending'),
                eq(followUpJobs.status, 'queued'),
                eq(followUpJobs.status, 'sending'),
                eq(followUpJobs.status, 'sent')
              )
            )
          )
          .limit(1);
        
        if (existingJob.length > 0) continue;
        
        await createJob({
          campaignId: row.campaign.id,
          contactId: row.contact.id,
          originalEmailId: row.sentEmail.id,
          sequenceId: sequence.id,
          stepId: nextStep.id,
          stepNumber: nextStep.stepNumber,
          scheduledFor,
          subject: nextStep.subject || undefined,
          body: nextStep.body,
          metadata: {
            userId: row.campaign.userId,
            variantName: nextStep.variantName,
            source: 'sync',
          },
        });
        
        jobsCreated++;
      }
      
      if (jobsCreated > 0) {
        console.log(`[FollowUpEngine] Synced ${jobsCreated} pending follow-up jobs`);
      }
      
    } catch (error) {
      console.error('[FollowUpEngine] Sync error:', error);
    }
  }
  
  private scheduleNightlyReconciliation(): void {
    const now = new Date();
    const night = new Date(now);
    night.setHours(3, 0, 0, 0);
    
    if (night <= now) {
      night.setDate(night.getDate() + 1);
    }
    
    const msUntilNight = night.getTime() - now.getTime();
    
    console.log(`[FollowUpEngine] Nightly reconciliation scheduled for ${night.toISOString()}`);
    
    this.nightlyReconciliationTimeout = setTimeout(() => {
      runNightlyReconciliation().catch(error => {
        console.error('[FollowUpEngine] Nightly reconciliation error:', error);
      });
      
      this.scheduleNightlyReconciliation();
    }, msUntilNight);
  }
  
  async getStats(): Promise<JobQueueStats> {
    return getQueueStats();
  }
  
  async forceProcessNow(): Promise<void> {
    console.log('[FollowUpEngine] Forcing immediate queue processing');
    await this.processQueue();
  }
  
  async forceReconciliationNow(): Promise<ReconciliationResult> {
    console.log('[FollowUpEngine] Forcing immediate reconciliation');
    return runHourlyReconciliation();
  }
  
  isActive(): boolean {
    return this.isRunning;
  }
  
  getActiveJobCount(): number {
    return this.activeJobs;
  }
}

export const followUpEngine = new FollowUpEngine();
